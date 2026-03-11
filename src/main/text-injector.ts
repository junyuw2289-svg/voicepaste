import { spawn } from 'node:child_process';
import { clipboard, systemPreferences } from 'electron';
import type { CursorContext } from '../shared/types';

const MIN_INJECT_INTERVAL_MS = 500;
const DEDUP_WINDOW_MS = 5000;
const TARGET_APP_SETTLE_MS = 180;
const CLIPBOARD_RESTORE_DELAY_MS = 900;

export class TextInjector {
  private lastInjectTime = 0;
  private isInjecting = false;
  private lastInjectedText = '';
  private lastInjectedAt = 0;

  async preflightPastePermissions(): Promise<{ success: boolean; error?: string }> {
    if (process.platform !== 'darwin') {
      return { success: true };
    }

    if (!systemPreferences.isTrustedAccessibilityClient(false)) {
      return {
        success: false,
        error: 'Accessibility access is required for reliable paste and global key handling.',
      };
    }

    try {
      // Trigger the macOS Automation prompt early so first paste does not fail mid-flow.
      await this.runAppleScript('tell application "System Events" to get name of first process whose frontmost is true');
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Automation permission is required for auto-paste.';
      return {
        success: false,
        error: `Automation permission is required for auto-paste. ${message}`,
      };
    }
  }

  async inject(text: string, context: CursorContext | null = null): Promise<void> {
    const now = Date.now();

    // Guard 1: concurrent / rapid-fire
    if (this.isInjecting || now - this.lastInjectTime < MIN_INJECT_INTERVAL_MS) {
      console.log(`[TextInjector] Skipping — guard:interval (isInjecting=${this.isInjecting}, interval=${now - this.lastInjectTime}ms)`);
      return;
    }

    // Guard 2: same content within dedup window
    if (text === this.lastInjectedText && now - this.lastInjectedAt < DEDUP_WINDOW_MS) {
      console.log(`[TextInjector] Skipping — guard:dedup (same text ${now - this.lastInjectedAt}ms ago)`);
      return;
    }

    this.isInjecting = true;
    this.lastInjectTime = now;
    console.log(`[TextInjector] Injecting: "${text.slice(0, 40)}…" into ${context?.appName || 'unknown app'}`);

    // Save previous clipboard content to restore after paste
    const previousClipboard = clipboard.readText();

    clipboard.writeText(text);

    try {
      await this.simulatePaste(context);
      this.lastInjectedText = text;
      this.lastInjectedAt = Date.now();
      // Restore previous clipboard content after paste completes
      setTimeout(() => {
        clipboard.writeText(previousClipboard);
      }, CLIPBOARD_RESTORE_DELAY_MS);
    } catch (error) {
      console.error('[TextInjector] Paste failed:', error);
      console.warn('[TextInjector] Leaving transcription on clipboard so it can be pasted manually');
    } finally {
      this.isInjecting = false;
    }
  }

  private async simulatePaste(context: CursorContext | null): Promise<void> {
    if (process.platform !== 'darwin') {
      return;
    }

    if (!systemPreferences.isTrustedAccessibilityClient(false)) {
      throw new Error('Accessibility permission is required for auto-paste. The transcription was copied to your clipboard.');
    }

    await this.restoreTargetAppFocus(context);
    await new Promise((resolve) => setTimeout(resolve, 50));
    console.log('[TextInjector] Sending Cmd+V via AppleScript');
    await this.runAppleScript('tell application "System Events" to key code 9 using command down');
  }

  private async restoreTargetAppFocus(context: CursorContext | null): Promise<void> {
    const appName = context?.appName?.trim();

    if (!appName || appName === 'VoicePaste') {
      console.log(`[TextInjector] Skip app re-activation (target=${appName || 'unknown'})`);
      return;
    }

    const frontmostApp = await this.getFrontmostAppName();
    if (frontmostApp === appName) {
      console.log(`[TextInjector] Target app already frontmost: ${appName}`);
      return;
    }

    console.log(`[TextInjector] Re-activating target app: ${appName}`);
    await this.activateApp(appName);
    await new Promise((resolve) => setTimeout(resolve, TARGET_APP_SETTLE_MS));
  }

  private async getFrontmostAppName(): Promise<string | null> {
    return new Promise((resolve) => {
      let stdout = '';
      let stderr = '';

      const child = spawn('zsh', [
        '-lc',
        'asn=$(lsappinfo front | sed -E \'s/.*(ASN:0x[0-9a-f]+-0x[0-9a-f]+:).*/\\1/\'); lsappinfo info -only name -app "$asn" | sed -n \'s/.*"LSDisplayName"="\\(.*\\)".*/\\1/p\'',
      ]);

      child.stdout.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      child.on('error', () => resolve(null));
      child.on('close', (code) => {
        if (code !== 0) {
          if (stderr.trim()) {
            console.warn('[TextInjector] Failed to resolve frontmost app:', stderr.trim());
          }
          resolve(null);
          return;
        }

        const appName = stdout.trim();
        resolve(appName || null);
      });
    });
  }

  private activateApp(appName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      let stderr = '';
      const child = spawn('open', ['-a', appName]);

      child.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      child.on('error', reject);
      child.on('close', (code) => {
        if (code === 0) {
          resolve();
          return;
        }

        reject(new Error(stderr.trim() || `open -a exited with code ${code}`));
      });
    });
  }

  private runAppleScript(script: string): Promise<void> {
    return new Promise((resolve, reject) => {
      let stderr = '';
      const child = spawn('osascript', ['-e', script]);

      child.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      child.on('error', reject);
      child.on('close', (code) => {
        if (code === 0) {
          resolve();
          return;
        }

        reject(new Error(stderr.trim() || `osascript exited with code ${code}`));
      });
    });
  }
}
