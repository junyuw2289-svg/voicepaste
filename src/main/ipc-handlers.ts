import { app, BrowserWindow, dialog, ipcMain, shell, systemPreferences } from 'electron';
import { IPC_CHANNELS } from '../shared/constants';
import { TranscriptionService } from './transcription-service';
import { RealtimeTranscriptionService } from './realtime-transcription-service';
import type { RealtimeDebugSnapshot } from './realtime-transcription-service';
import { TextInjector } from './text-injector';
import { getConfig, setConfig } from './config-store';
import { fetchRealtimeToken } from './openai-service';
import { resizeOverlay } from './overlay-window';
import type { AppStatus, CursorContext } from '../shared/types';
import { historyService, dictionaryService } from './service-ipc';
import { captureCursorContext } from './context-capture';
import type { RealtimeSessionManager } from './realtime-session-manager';
import { logDiagnostic, logMessage, type LoggerLevel } from './app-logger';

const START_FAILURE_HIDE_DELAY_MS = 2200;
const MICROPHONE_SETTINGS_URL = 'x-apple.systempreferences:com.apple.preference.security?Privacy_Microphone';

export class IPCHandler {
  private transcriptionService: TranscriptionService;
  private realtimeService: RealtimeTranscriptionService | null = null;
  private textInjector: TextInjector;
  private overlayWindow: BrowserWindow | null = null;
  private getMainWindow: (() => BrowserWindow | null) | null = null;
  private onStatusChange: ((status: string) => void) | null = null;
  private onRecordingEnded: (() => void) | null = null;
  private isStartingRealtime = false;
  private recordingStartedAt: number | null = null;
  private pendingContext: Promise<CursorContext | null> = Promise.resolve(null);
  private sessionManager: RealtimeSessionManager | null = null;

  constructor(
    transcriptionService: TranscriptionService,
    textInjector: TextInjector,
  ) {
    this.transcriptionService = transcriptionService;
    this.textInjector = textInjector;
  }

  setOverlayWindow(window: BrowserWindow): void {
    this.overlayWindow = window;
  }

  setGetMainWindow(getter: () => BrowserWindow | null): void {
    this.getMainWindow = getter;
  }

  setOnStatusChange(callback: (status: string) => void): void {
    this.onStatusChange = callback;
  }

  /** Called when audio data arrives, meaning recording has ended (user-initiated or auto-stopped) */
  setOnRecordingEnded(callback: () => void): void {
    this.onRecordingEnded = callback;
  }

  setSessionManager(manager: RealtimeSessionManager): void {
    this.sessionManager = manager;
  }

  markRecordingStarted(): void {
    this.recordingStartedAt = Date.now();
    this.pendingContext = captureCursorContext();
  }

  private sendStatus(status: AppStatus): void {
    this.overlayWindow?.webContents.send(IPC_CHANNELS.STATUS_UPDATE, status);
    this.onStatusChange?.(status);

    // Overlay interactivity for recording is managed in main.ts (shortcut callback).
    // Here we only need to disable interactivity when leaving recording state.
    if (this.overlayWindow && status !== 'recording') {
      this.overlayWindow.setIgnoreMouseEvents(true);
    }
  }

  private resetRecordingFlow(): void {
    this.recordingStartedAt = null;
    this.pendingContext = Promise.resolve(null);
    if (this.realtimeService) {
      this.realtimeService.disconnect();
      this.realtimeService = null;
    }
    this.sessionManager?.scheduleReWarm();
  }

  private async promptForMicrophoneAccess(): Promise<void> {
    const permissionTarget = app.isPackaged
      ? `${app.getName()}.app`
      : 'the current development app (Electron / Terminal / Cursor)';

    const { response } = await dialog.showMessageBox({
      type: 'warning',
      title: 'Microphone Permission Required',
      message: 'VoicePaste needs microphone access before it can record.',
      detail: `Enable microphone access for ${permissionTarget} in System Settings -> Privacy & Security -> Microphone. macOS requires reopening the app after this permission changes.`,
      buttons: ['Open System Settings', 'Later'],
      defaultId: 0,
      cancelId: 1,
      noLink: true,
    });

    if (response === 0) {
      shell.openExternal(MICROPHONE_SETTINGS_URL).catch((error) => {
        console.error('[IPC] Failed to open microphone settings:', error);
      });
    }
  }

  private async preflightRecordingStart(): Promise<{ success: boolean; error?: string }> {
    if (process.platform !== 'darwin') {
      return { success: true };
    }

    const status = systemPreferences.getMediaAccessStatus('microphone');
    console.log(`[IPC] Microphone access status: ${status}`);

    if (status === 'granted') {
      return { success: true };
    }

    if (status === 'not-determined') {
      const granted = await systemPreferences.askForMediaAccess('microphone');
      console.log(`[IPC] Microphone access request result: ${granted ? 'granted' : 'denied'}`);
      if (granted) {
        return { success: true };
      }
    }

    await this.promptForMicrophoneAccess();
    return {
      success: false,
      error: 'Microphone access is required. Enable it in System Settings and reopen VoicePaste.',
    };
  }

  private handleRecordingStartFailure(message: string): void {
    console.warn(`[IPC] Recording start failed: ${message}`);
    this.resetRecordingFlow();

    this.overlayWindow?.webContents.send(IPC_CHANNELS.TRANSCRIPTION_ERROR, message);
    this.sendStatus('error');

    setTimeout(() => {
      this.overlayWindow?.hide();
      this.sendStatus('idle');
    }, START_FAILURE_HIDE_DELAY_MS);
  }

  private mapRealtimeFailureToUserMessage(debug: RealtimeDebugSnapshot): string {
    const failure = debug.lastTranscriptionFailure || debug.lastServerError || '';
    const normalized = failure.toLowerCase();

    if (normalized.includes('insufficient_quota') || normalized.includes('exceeded your current quota')) {
      return 'OpenAI API quota exceeded. Add billing or credits to your OpenAI account, then try again.';
    }

    if (normalized.includes('invalid_api_key') || normalized.includes('incorrect api key')) {
      return 'OpenAI API key is invalid. Update it in Settings and try again.';
    }

    if (normalized.includes('rate_limit') || normalized.includes('too many requests')) {
      return 'OpenAI API rate limit reached. Wait a moment, then try again.';
    }

    if (normalized.includes('authentication') || normalized.includes('unauthorized') || normalized.includes('forbidden')) {
      return 'OpenAI rejected the transcription request. Check your API key and account permissions.';
    }

    if (failure) {
      return `Transcription failed: ${failure}`;
    }

    if (debug.speechStartedCount > 0) {
      return 'Speech was detected, but no transcript was returned. Please try again.';
    }

    if (debug.audioChunksSent > 0) {
      return 'Audio was recorded, but no transcript was returned. Please try again.';
    }

    return 'No speech detected.';
  }

  register(): void {
    // Remove any stale handlers first (prevents duplicates from Vite HMR rebuilds)
    ipcMain.removeAllListeners(IPC_CHANNELS.RECORDING_CANCELLED);
    ipcMain.removeAllListeners(IPC_CHANNELS.RECORDING_START_FAILED);
    ipcMain.removeAllListeners(IPC_CHANNELS.SETTINGS_SET);
    ipcMain.removeHandler(IPC_CHANNELS.RECORDING_PREFLIGHT);
    ipcMain.removeHandler(IPC_CHANNELS.SETTINGS_GET);

    // Handle cancel from renderer (X button clicked)
    ipcMain.on(IPC_CHANNELS.RECORDING_CANCELLED, () => {
      console.log('[IPC] Recording cancelled by user');
      this.resetRecordingFlow();
      this.sendStatus('idle');
      this.overlayWindow?.hide();
    });

    ipcMain.on(IPC_CHANNELS.RECORDING_START_FAILED, (_event, message: string) => {
      this.handleRecordingStartFailure(message || 'Recording failed to start');
    });

    ipcMain.handle(IPC_CHANNELS.RECORDING_PREFLIGHT, () => {
      return this.preflightRecordingStart();
    });

    // Handle settings
    ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, () => {
      return getConfig();
    });

    ipcMain.on(IPC_CHANNELS.SETTINGS_SET, (_event, settings) => {
      setConfig(settings);
      this.overlayWindow?.webContents.send(IPC_CHANNELS.SETTINGS_UPDATED, getConfig());
    });

    // --- Realtime streaming transcription ---

    ipcMain.removeHandler(IPC_CHANNELS.REALTIME_START);
    ipcMain.removeAllListeners(IPC_CHANNELS.REALTIME_AUDIO_CHUNK);
    ipcMain.removeAllListeners(IPC_CHANNELS.REALTIME_STOP);
    ipcMain.removeAllListeners(IPC_CHANNELS.REALTIME_RESIZE);

    // REALTIME_START: acquire session (warm or cold) -> wire up events -> ack renderer
    ipcMain.handle(IPC_CHANNELS.REALTIME_START, async () => {
      if (this.isStartingRealtime) {
        console.warn('[IPC] REALTIME_START already in progress — rejecting concurrent call');
        return { success: false, error: 'Already starting' };
      }
      this.isStartingRealtime = true;

      try {
        const t0 = Date.now();
        const dictionaryWords = dictionaryService.getAllWords();
        const config = getConfig();
        logDiagnostic('IPC', 'Realtime start requested', {
          language: config.language || '(default)',
          dictionarySize: dictionaryWords.length,
          enablePolish: config.enablePolish,
          hasApiKey: Boolean(config.openaiApiKey),
        });

        // Clean up any existing realtime connection
        this.realtimeService?.disconnect();

        // Acquire session via session manager (warm pool) or fall back to cold start
        let service: RealtimeTranscriptionService;
        if (this.sessionManager) {
          const result = await this.sessionManager.acquireSession();
          service = result.service;
        } else {
          // Fallback: no session manager (shouldn't happen, but safe)
          const config = getConfig();
          if (!config.openaiApiKey) {
            return { success: false, error: 'Please configure your OpenAI API key in Settings.' };
          }
          const tokenResult = await fetchRealtimeToken(
            config.openaiApiKey,
            config.language || undefined,
            dictionaryWords?.length ? dictionaryWords.join(', ') : undefined,
          );
          if (!tokenResult) {
            return { success: false, error: 'Failed to get session token' };
          }
          service = new RealtimeTranscriptionService();
          await service.connect(tokenResult.clientSecret);
        }

        this.realtimeService = service;

        // Wire up event listeners
        this.realtimeService.on('utterance', (text: string) => {
          if (dictionaryWords?.length && this.isDictionaryHallucination(text, dictionaryWords)) {
            console.warn(`[IPC] Filtered hallucinated utterance: "${text}"`);
            this.realtimeService?.popLastTranscript();
            return;
          }
          this.overlayWindow?.webContents.send(IPC_CHANNELS.REALTIME_UTTERANCE, text);
        });

        this.realtimeService.on('error', (msg: string) => {
          console.error('[IPC] Realtime error:', msg);
          this.overlayWindow?.webContents.send(IPC_CHANNELS.REALTIME_ERROR, msg);
          // Auto-recover: disconnect, reset state, return to idle
          this.realtimeService?.disconnect();
          this.realtimeService = null;
          this.sessionManager?.scheduleReWarm();
          this.sendStatus('error');
          setTimeout(() => {
            this.overlayWindow?.hide();
            this.sendStatus('idle');
          }, 2000);
        });

        console.log(`[IPC] Realtime session acquired (${Date.now() - t0}ms total)`);
        logDiagnostic('IPC', 'Realtime service ready', this.realtimeService.getDebugSnapshot());

        // Notify renderer that realtime is ready
        this.overlayWindow?.webContents.send(IPC_CHANNELS.REALTIME_STARTED);
        return { success: true };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to start realtime';
        console.error('[IPC] Realtime start error:', msg);
        if (msg.includes('Failed to get realtime token')) {
          return { success: false, error: 'Please configure your OpenAI API key in Settings.' };
        }
        return { success: false, error: msg };
      } finally {
        this.isStartingRealtime = false;
      }
    });

    // REALTIME_AUDIO_CHUNK: forward PCM16 to WebSocket
    ipcMain.on(IPC_CHANNELS.REALTIME_AUDIO_CHUNK, (_event, pcm16: ArrayBuffer) => {
      if (this.realtimeService?.isConnected) {
        this.realtimeService.sendAudioChunk(Buffer.from(pcm16));
      }
    });

    // REALTIME_STOP: flush -> concatenate -> polish -> inject -> history -> done
    ipcMain.on(IPC_CHANNELS.REALTIME_STOP, async () => {
      if (!this.realtimeService) {
        console.warn('[IPC] REALTIME_STOP but no active realtime service');
        this.handleRecordingStartFailure('Recording did not start correctly. Please try again.');
        return;
      }

      const stopInitiatedAt = Date.now();
      this.onRecordingEnded?.();
      this.sendStatus('transcribing');
      logDiagnostic('IPC', 'Realtime stop requested', this.realtimeService.getDebugSnapshot());

      try {
        // Wait for final transcript
        const rawText = await this.realtimeService.stop();
        const flushMs = Date.now() - stopInitiatedAt;
        const realtimeDebug = this.realtimeService.getDebugSnapshot();
        logDiagnostic('IPC', 'Realtime stop result', {
          ...realtimeDebug,
          flushMs,
          rawTextLength: rawText.trim().length,
          rawTextPreview: rawText.slice(0, 300),
        });
        this.realtimeService.disconnect();
        this.realtimeService = null;
        this.sessionManager?.scheduleReWarm();

        if (!rawText?.trim()) {
          const userMessage = this.mapRealtimeFailureToUserMessage(realtimeDebug);
          logDiagnostic('IPC', 'No speech detected diagnostics', realtimeDebug);
          this.overlayWindow?.webContents.send(IPC_CHANNELS.TRANSCRIPTION_ERROR, userMessage);
          this.sendStatus('error');
          setTimeout(() => {
            this.overlayWindow?.hide();
            this.sendStatus('idle');
          }, 2000);
          return;
        }

        const config = getConfig();
        const dictionaryWords = dictionaryService.getAllWords();
        const context = await this.pendingContext;

        // Dictionary hallucination check
        if (dictionaryWords?.length && this.isDictionaryHallucination(rawText, dictionaryWords)) {
          console.warn(`[IPC] Detected dictionary hallucination: "${rawText}"`);
          logDiagnostic('IPC', 'Dictionary hallucination diagnostics', {
            rawText,
            dictionarySize: dictionaryWords.length,
            realtimeDebug,
          });
          this.overlayWindow?.webContents.send(IPC_CHANNELS.TRANSCRIPTION_ERROR, 'No speech detected');
          this.sendStatus('error');
          setTimeout(() => {
            this.overlayWindow?.hide();
            this.sendStatus('idle');
          }, 2000);
          return;
        }

        // Polish the final text
        let finalText = rawText;
        let polishedText: string | null = null;
        let polishMs = 0;

        if (config.enablePolish && rawText.trim()) {
          try {
            console.log(`[IPC] Polish input: "${rawText}"`);
            const polishStart = Date.now();
            const result = await this.transcriptionService.polishOnly(rawText, context);
            polishMs = Date.now() - polishStart;
            polishedText = result.polishedText;
            finalText = polishedText ?? rawText;
            console.log(`[IPC] Polish output: "${finalText}"${polishedText ? '' : ' (fallback to raw)'}`);
          } catch (err) {
            console.error('[IPC] Polish failed, using raw text:', err);
          }
        }

        // Inject text + save to history
        const injectStart = Date.now();
        await this.textInjector.inject(finalText, context);
        const injectMs = Date.now() - injectStart;

        const durationSeconds = this.recordingStartedAt
          ? parseFloat(((stopInitiatedAt - this.recordingStartedAt) / 1000).toFixed(2))
          : null;
        this.recordingStartedAt = null;

        historyService.save({
          original_text: rawText,
          optimized_text: polishedText,
          app_context: context ? JSON.stringify(context) : null,
          duration_seconds: durationSeconds,
        }).then(() => {
          this.getMainWindow?.()?.webContents.send(IPC_CHANNELS.HISTORY_UPDATED);
        }).catch((err) => console.error('[History] Failed to save:', err));

        this.overlayWindow?.webContents.send(IPC_CHANNELS.TRANSCRIPTION_RESULT, finalText);
        this.sendStatus('done');
        console.log(`[realtime pipeline: ${Date.now() - stopInitiatedAt}ms | flush: ${flushMs}ms | polish: ${polishMs}ms | inject: ${injectMs}ms]`);

        setTimeout(() => {
          this.overlayWindow?.hide();
          this.sendStatus('idle');
        }, 1500);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Transcription failed';
        console.error('[IPC] Realtime stop error:', message);
        this.realtimeService?.disconnect();
        this.realtimeService = null;
        this.sessionManager?.scheduleReWarm();
        this.overlayWindow?.webContents.send(IPC_CHANNELS.TRANSCRIPTION_ERROR, message);
        this.sendStatus('error');

        setTimeout(() => {
          this.overlayWindow?.hide();
          this.sendStatus('idle');
        }, 3000);
      }
    });

    // Renderer diagnostic logging (forward to terminal)
    ipcMain.removeAllListeners(IPC_CHANNELS.RENDERER_LOG);
    ipcMain.on(
      IPC_CHANNELS.RENDERER_LOG,
      (_event, payload: { msg?: string; level?: LoggerLevel; source?: string } | string) => {
        const normalized = typeof payload === 'string'
          ? { msg: payload, level: 'log' as LoggerLevel, source: 'renderer' }
          : {
              msg: payload.msg ?? '',
              level: payload.level ?? 'log',
              source: payload.source ?? 'renderer',
            };

        logMessage(normalized.level, `renderer:${normalized.source}`, normalized.msg);
      },
    );

    // REALTIME_RESIZE: dynamically resize overlay window
    ipcMain.on(IPC_CHANNELS.REALTIME_RESIZE, (_event, width: number, height: number) => {
      if (this.overlayWindow) {
        resizeOverlay(this.overlayWindow, width, height);
      }
    });
  }

  /** Reuses dictionary hallucination detection from TranscriptionService */
  private isDictionaryHallucination(text: string, dictionaryWords: string[]): boolean {
    const normalize = (s: string) =>
      s.toLowerCase().replace(/[.,;!?，。；！？\s]+/g, ' ').trim();

    const normalized = normalize(text);
    if (!normalized) return false;

    const tokens = normalized.split(' ').filter(Boolean);
    const dictPhrases = dictionaryWords.map(normalize);

    let remaining = normalized;
    for (const phrase of dictPhrases) {
      remaining = remaining.split(phrase).join(' ');
    }
    remaining = remaining.replace(/\s+/g, ' ').trim();

    if (remaining.length === 0) return true;

    if (tokens.length <= 10) {
      const remainingTokens = remaining.split(' ').filter(Boolean);
      const dictTokenCount = tokens.length - remainingTokens.length;
      if (dictTokenCount / tokens.length >= 0.6) return true;
    }

    return false;
  }
}
