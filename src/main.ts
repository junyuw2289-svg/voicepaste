import { app, BrowserWindow, globalShortcut, session, systemPreferences, dialog, shell } from 'electron';
import started from 'electron-squirrel-startup';
import { ShortcutManager } from './main/shortcut-manager';
import { TranscriptionService } from './main/transcription-service';
import { TextInjector } from './main/text-injector';
import { TrayManager } from './main/tray-manager';
import { IPCHandler } from './main/ipc-handlers';
import { createOverlayWindow, repositionOverlayTocursor } from './main/overlay-window';
import { toggleMainWindow, getMainWindow } from './main/main-window';
import { getConfig } from './main/config-store';
import { IPC_CHANNELS } from './shared/constants';
import { registerServiceIPC } from './main/service-ipc';
import { RealtimeSessionManager } from './main/realtime-session-manager';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

let overlayWindow: BrowserWindow | null = null;
let shortcutManager: ShortcutManager | null = null;
let trayManager: TrayManager | null = null;
const MICROPHONE_SETTINGS_URL = 'x-apple.systempreferences:com.apple.preference.security?Privacy_Microphone';

const transcriptionService = new TranscriptionService();
const textInjector = new TextInjector();
const ipcHandler = new IPCHandler(transcriptionService, textInjector);
const sessionManager = new RealtimeSessionManager();
ipcHandler.setSessionManager(sessionManager);

async function ensureInstalledFromApplications(): Promise<boolean> {
  if (process.platform !== 'darwin' || !app.isPackaged || app.isInApplicationsFolder()) {
    return true;
  }

  const { response } = await dialog.showMessageBox({
    type: 'question',
    title: 'Install VoicePaste',
    message: 'Move VoicePaste to Applications before using it.',
    detail: 'Running VoicePaste directly from the DMG can break microphone permissions and global shortcuts.',
    buttons: ['Move to Applications', 'Quit'],
    defaultId: 0,
    cancelId: 1,
    noLink: true,
  });

  if (response !== 0) {
    app.quit();
    return false;
  }

  try {
    const moved = app.moveToApplicationsFolder({
      conflictHandler: (conflictType) => {
        const replace = dialog.showMessageBoxSync({
          type: 'question',
          title: 'Replace Existing App',
          message: conflictType === 'existsAndRunning'
            ? 'VoicePaste is already running from Applications.'
            : 'VoicePaste is already installed in Applications.',
          detail: 'Replace the existing copy with this one?',
          buttons: ['Replace', 'Cancel'],
          defaultId: 0,
          cancelId: 1,
          noLink: true,
        });

        return replace === 0;
      },
    });

    if (moved) {
      return false;
    }
  } catch (error) {
    console.error('[Main] Failed to move app to Applications:', error);
  }

  await dialog.showMessageBox({
    type: 'error',
    title: 'Installation Required',
    message: 'VoicePaste needs to run from Applications.',
    detail: 'Install the app to /Applications and reopen it from there before recording.',
    buttons: ['OK'],
    noLink: true,
  });
  app.quit();
  return false;
}

function getAccessibilityPermissionTarget(): string {
  return app.isPackaged
    ? `${app.getName()}.app`
    : 'the current development host app (Electron / Terminal / Cursor)';
}

async function ensureMicrophonePermission(): Promise<boolean> {
  let microphoneStatus = systemPreferences.getMediaAccessStatus('microphone');
  console.log(`[Main] Startup microphone status: ${microphoneStatus}`);

  if (microphoneStatus === 'granted') {
    return true;
  }

  if (microphoneStatus === 'not-determined') {
    const granted = await systemPreferences.askForMediaAccess('microphone');
    microphoneStatus = granted ? 'granted' : systemPreferences.getMediaAccessStatus('microphone');
    console.log(`[Main] Startup microphone request result: ${microphoneStatus}`);
    if (granted) {
      return true;
    }
  }

  const response = await dialog.showMessageBox({
    type: 'warning',
    title: 'Microphone Permission Required',
    message: 'VoicePaste needs microphone access before recording can work.',
    detail: `Current microphone status: ${microphoneStatus}. Open System Settings -> Privacy & Security -> Microphone and enable ${app.getName()}.app. macOS may require reopening VoicePaste after this change.`,
    buttons: ['Open System Settings', 'Quit'],
    defaultId: 0,
    cancelId: 1,
    noLink: true,
  });

  if (response.response === 0) {
    shell.openExternal(MICROPHONE_SETTINGS_URL).catch((error) => {
      console.warn('[Main] Failed to open microphone settings:', error);
    });
  }

  return false;
}

async function ensureAccessibilityPermission(): Promise<boolean> {
  if (systemPreferences.isTrustedAccessibilityClient(false)) {
    console.log('[Main] Startup accessibility status: granted');
    return true;
  }

  console.log('[Main] Startup accessibility status: not granted');

  const openResult = await dialog.showMessageBox({
    type: 'warning',
    title: 'Accessibility Permission Required',
    message: 'VoicePaste needs Accessibility access for reliable paste and global key handling.',
    detail: `Go to System Settings -> Privacy & Security -> Accessibility, then add and enable ${getAccessibilityPermissionTarget()}.`,
    buttons: ['Open System Settings', 'Quit'],
    defaultId: 0,
    cancelId: 1,
    noLink: true,
  });

  if (openResult.response !== 0) {
    return false;
  }

  systemPreferences.isTrustedAccessibilityClient(true);

  while (!systemPreferences.isTrustedAccessibilityClient(false)) {
    const retryResult = await dialog.showMessageBox({
      type: 'warning',
      title: 'Enable Accessibility',
      message: 'Turn on VoicePaste in Accessibility, then return here.',
      detail: 'After enabling the toggle, click Continue to finish startup.',
      buttons: ['Continue', 'Quit'],
      defaultId: 0,
      cancelId: 1,
      noLink: true,
    });

    if (retryResult.response !== 0) {
      return false;
    }
  }

  console.log('[Main] Accessibility permission confirmed during startup');
  return true;
}

async function ensureAutomationPermission(): Promise<boolean> {
  const preflight = await textInjector.preflightPastePermissions();
  if (preflight.success) {
    console.log('[Main] Startup automation status: granted');
    return true;
  }

  console.log(`[Main] Startup automation status: ${preflight.error ?? 'not granted'}`);

  let granted = false;
  while (!granted) {
    const result = await dialog.showMessageBox({
      type: 'warning',
      title: 'Automation Permission Required',
      message: 'VoicePaste needs Automation access to control System Events for auto-paste.',
      detail: 'When macOS asks whether VoicePaste can control System Events, click Allow. If you previously denied it, open System Settings -> Privacy & Security -> Automation and enable VoicePaste -> System Events, then click Retry.',
      buttons: ['Retry', 'Quit'],
      defaultId: 0,
      cancelId: 1,
      noLink: true,
    });

    if (result.response !== 0) {
      return false;
    }

    const retry = await textInjector.preflightPastePermissions();
    if (retry.success) {
      console.log('[Main] Automation permission confirmed during startup');
      granted = true;
    }
  }

  return true;
}

async function ensureStartupPermissions(): Promise<boolean> {
  if (process.platform !== 'darwin') {
    return true;
  }

  if (!await ensureMicrophonePermission()) {
    return false;
  }

  if (!await ensureAccessibilityPermission()) {
    return false;
  }

  return ensureAutomationPermission();
}

function isTrustedMediaOrigin(origin: string): boolean {
  if (!origin) {
    return false;
  }

  if (origin.startsWith('file://')) {
    return true;
  }

  try {
    const url = new URL(origin);
    return url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

function configureSessionPermissions(): void {
  const defaultSession = session.defaultSession;

  defaultSession.setPermissionCheckHandler((webContents, permission, requestingOrigin) => {
    if (permission === 'media') {
      const origin = requestingOrigin || webContents?.getURL() || '';
      const allowed = isTrustedMediaOrigin(origin);
      console.log(`[Main] Media permission check (${origin || 'unknown origin'}): ${allowed ? 'allow' : 'deny'}`);
      return allowed;
    }

    return false;
  });

  defaultSession.setPermissionRequestHandler((webContents, permission, callback, details) => {
    if (permission === 'media') {
      const origin = details.requestingUrl || webContents.getURL() || '';
      const allowed = isTrustedMediaOrigin(origin);
      console.log(`[Main] Media permission request (${origin || 'unknown origin'}): ${allowed ? 'allow' : 'deny'}`);
      callback(allowed);
      return;
    }

    callback(false);
  });
}

function initApp(): void {
  const config = getConfig();

  console.log('=== VoicePaste Initializing ===');
  console.log('Hotkey:', config.hotkey);
  console.log('Language:', config.language);

  configureSessionPermissions();

  // Create overlay window
  overlayWindow = createOverlayWindow();
  ipcHandler.setOverlayWindow(overlayWindow);
  ipcHandler.setGetMainWindow(getMainWindow);
  ipcHandler.setOnStatusChange((status) => {
    trayManager?.updateMenu(status);
    if (status !== 'recording') {
      shortcutManager?.resetState();
      try { globalShortcut.unregister('Escape'); } catch { /* already unregistered */ }
      try { globalShortcut.unregister('Esc'); } catch { /* already unregistered */ }
    }
  });
  ipcHandler.setOnRecordingEnded(() => {
    shortcutManager?.resetState();
    trayManager?.updateMenu('transcribing');
  });
  ipcHandler.register();
  registerServiceIPC(getMainWindow);

  // Warm up realtime session unconditionally (will skip if no API key)
  sessionManager.warmUp();

  // Create shortcut manager
  shortcutManager = new ShortcutManager(config.hotkey, (recording) => {
    if (recording) {
      ipcHandler.markRecordingStarted();
      if (overlayWindow) {
        repositionOverlayTocursor(overlayWindow);
        overlayWindow.showInactive();
        overlayWindow.setIgnoreMouseEvents(false);
      }

      // Register a temporary global ESC shortcut to cancel recording
      // (global shortcut works even when overlay doesn't have focus)
      let escRegistered = false;
      try {
        escRegistered = globalShortcut.register('Escape', () => {
          console.log('[Main] ESC pressed — cancelling recording');
          overlayWindow?.webContents.send(IPC_CHANNELS.RECORDING_CANCEL);
          try { globalShortcut.unregister('Escape'); } catch { /* noop */ }
        });
      } catch (error) {
        console.warn('[Main] Failed to register ESC shortcut:', error);
      }
      if (!escRegistered) {
        try {
          escRegistered = globalShortcut.register('Esc', () => {
            console.log('[Main] ESC pressed — cancelling recording');
            overlayWindow?.webContents.send(IPC_CHANNELS.RECORDING_CANCEL);
            try { globalShortcut.unregister('Esc'); } catch { /* noop */ }
          });
        } catch (error) {
          console.warn('[Main] Failed to register ESC alias:', error);
        }
      }
      console.log(`[Main] ESC cancel shortcut ${escRegistered ? 'ready' : 'unavailable'}`);
      overlayWindow?.webContents.send(IPC_CHANNELS.RECORDING_CANCEL_AVAILABILITY, escRegistered);

      trayManager?.updateMenu('recording');
    } else {
      try { globalShortcut.unregister('Escape'); } catch { /* noop */ }
      try { globalShortcut.unregister('Esc'); } catch { /* noop */ }
      trayManager?.updateMenu('transcribing');
    }
  });
  shortcutManager.setOverlayWindow(overlayWindow);
  shortcutManager.register();

  // Create and show main window on startup
  toggleMainWindow();

  // Create tray
  trayManager = new TrayManager(
    () => app.quit(),
    () => toggleMainWindow(),
  );
  trayManager.create();

  console.log('VoicePaste initialized. Press ` to start/stop recording.');
}

// Suppress Electron's default crash dialog — errors are logged to console instead
dialog.showErrorBox = (title: string, content: string) => {
  console.error(`[Main] Suppressed error dialog — ${title}: ${content}`);
};

process.on('uncaughtException', (error) => {
  console.error('[Main] Uncaught exception:', error);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Main] Unhandled rejection:', reason);
});

app.on('ready', async () => {
  const ready = await ensureInstalledFromApplications();
  if (!ready) {
    return;
  }

  try {
    const permissionsReady = await ensureStartupPermissions();
    if (!permissionsReady) {
      app.quit();
      return;
    }
  } catch (error) {
    console.error('[Main] Failed to run startup permission checks:', error);
    app.quit();
    return;
  }

  initApp();
});

app.on('before-quit', () => {
  sessionManager.dispose();
  const mw = getMainWindow();
  if (mw) {
    (mw as any)._forceClose = true;
    mw.close();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  trayManager?.destroy();
});

// Keep app running when all windows are closed (it's a tray app)
app.on('window-all-closed', () => {
  // Don't quit - this is a tray app
});
