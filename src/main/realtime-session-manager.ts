import { RealtimeTranscriptionService } from './realtime-transcription-service';
import { fetchRealtimeToken } from './openai-service';
import { getConfig } from './config-store';
import { dictionaryService } from './service-ipc';

interface CachedToken {
  clientSecret: string;
  expiresAt: number; // epoch ms
  fetchedAt: number; // epoch ms
  language: string;
  dictionaryHash: string;
}

type ManagerState = 'idle' | 'fetching' | 'connecting' | 'warm' | 'disabled';

const TOKEN_MAX_AGE_MS = 50_000; // discard if older than 50s (OpenAI default 60s TTL)
const TOKEN_MIN_REMAINING_MS = 15_000; // discard if < 15s remaining
const RE_WARM_DELAY_MS = 1_000;
const MAX_AUTO_REFRESHES = 1; // stop refreshing after this many unused refreshes

export class RealtimeSessionManager {
  private cachedToken: CachedToken | null = null;
  private warmService: RealtimeTranscriptionService | null = null;
  private state: ManagerState = 'idle';
  private fetchPromise: Promise<CachedToken | null> | null = null;
  private reWarmTimer: ReturnType<typeof setTimeout> | null = null;
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;
  private autoRefreshCount = 0;

  /**
   * Returns a connected RealtimeTranscriptionService.
   * - Warm: returns pre-connected service instantly
   * - Token cached: connects with cached token (~100-500ms)
   * - Cold: full fetch + connect (~300-1300ms)
   */
  async acquireSession(): Promise<{ service: RealtimeTranscriptionService; clientSecret: string }> {
    this.cancelReWarmTimer();
    this.cancelRefreshTimer();
    this.autoRefreshCount = 0;

    // Fast path: warm service ready
    if (this.warmService?.isConnected && this.cachedToken && !this.isConfigStale()) {
      console.log('[SessionMgr] Returning warm session (0ms)');
      const service = this.warmService;
      const clientSecret = this.cachedToken.clientSecret;
      service.removeWarmHandlers();
      this.warmService = null;
      this.state = 'idle';
      return { service, clientSecret };
    }

    // Discard stale warm service
    if (this.warmService) {
      this.warmService.disconnect();
      this.warmService = null;
    }

    // Medium path: cached token still valid
    if (this.cachedToken && this.isTokenValid() && !this.isConfigStale()) {
      console.log('[SessionMgr] Using cached token, connecting WS...');
      const t0 = Date.now();
      const service = new RealtimeTranscriptionService();
      await service.connect(this.cachedToken.clientSecret);
      console.log(`[SessionMgr] WS connected with cached token (${Date.now() - t0}ms)`);
      this.state = 'idle';
      return { service, clientSecret: this.cachedToken.clientSecret };
    }

    // Cold path: fetch token + connect
    console.log('[SessionMgr] Cold start: fetching token + connecting...');
    const t0 = Date.now();
    const token = await this.fetchToken();
    if (!token) {
      throw new Error('Failed to get realtime token');
    }
    const service = new RealtimeTranscriptionService();
    await service.connect(token.clientSecret);
    console.log(`[SessionMgr] Cold start complete (${Date.now() - t0}ms)`);
    this.state = 'idle';
    return { service, clientSecret: token.clientSecret };
  }

  /**
   * Pre-fetch token + pre-connect WebSocket in background.
   * Errors are silently swallowed — acquireSession() will fall back to on-demand.
   */
  async warmUp(): Promise<void> {
    if (this.state === 'disabled') return;
    if (this.state === 'fetching' || this.state === 'connecting' || this.state === 'warm') {
      console.log(`[SessionMgr] warmUp() skipped — already ${this.state}`);
      return;
    }

    // Skip warmup if no API key configured
    const config = getConfig();
    if (!config.openaiApiKey) {
      console.log('[SessionMgr] warmUp() skipped — no API key configured');
      return;
    }

    try {
      const token = await this.fetchToken();
      if (!token) return;
      if (this.state as ManagerState === 'disabled') return; // coolDown() called during fetch

      this.state = 'connecting';
      const t0 = Date.now();
      const service = new RealtimeTranscriptionService();

      // Attach warm-pool error/close handlers
      service.on('error', (msg: string) => {
        console.warn(`[SessionMgr] Warm WS error: ${msg}`);
        this.handleWarmDisconnect();
      });

      await service.connect(token.clientSecret);
      console.log(`[SessionMgr] WS pre-connected (${Date.now() - t0}ms)`);

      // Check if coolDown() was called while we were connecting
      if (this.state as ManagerState === 'disabled') {
        service.disconnect();
        return;
      }

      this.warmService = service;
      this.state = 'warm';

      // Schedule a token refresh before it expires, if we haven't exceeded max auto-refreshes
      this.scheduleTokenRefresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[SessionMgr] warmUp() failed (non-fatal): ${msg}`);
      this.state = 'idle';
    }
  }

  /** Triggers warmUp() after a short delay (called after each recording session ends) */
  scheduleReWarm(): void {
    if (this.state === 'disabled') return;
    this.cancelReWarmTimer();
    console.log('[SessionMgr] Re-warming after session end');
    this.reWarmTimer = setTimeout(() => {
      this.reWarmTimer = null;
      this.warmUp();
    }, RE_WARM_DELAY_MS);
  }

  /** Disconnect warm WS, clear cache and timers */
  coolDown(): void {
    console.log('[SessionMgr] Cooling down');
    this.state = 'disabled';
    this.cancelReWarmTimer();
    this.cancelRefreshTimer();
    this.cachedToken = null;
    this.fetchPromise = null;
    this.autoRefreshCount = 0;
    if (this.warmService) {
      this.warmService.disconnect();
      this.warmService = null;
    }
  }

  /** Cleanup on app exit */
  dispose(): void {
    this.coolDown();
    this.state = 'idle'; // allow re-init if needed
  }

  /** Re-enable after coolDown (e.g., when user switches back to realtime mode) */
  enable(): void {
    if (this.state === 'disabled') {
      this.state = 'idle';
    }
  }

  // --- Internal ---

  private async fetchToken(): Promise<CachedToken | null> {
    // Deduplicate concurrent fetches
    if (this.fetchPromise) {
      return this.fetchPromise;
    }

    this.state = 'fetching';
    this.fetchPromise = this._doFetchToken();

    try {
      return await this.fetchPromise;
    } finally {
      this.fetchPromise = null;
    }
  }

  private async _doFetchToken(): Promise<CachedToken | null> {
    const t0 = Date.now();
    const config = getConfig();
    const dictionaryWords = dictionaryService.getAllWords();

    if (!config.openaiApiKey) {
      console.error('[SessionMgr] No API key configured');
      this.state = 'idle';
      return null;
    }

    console.log(`[SessionMgr] Fetching token (language=${config.language || '(default)'})...`);

    const result = await fetchRealtimeToken(
      config.openaiApiKey,
      config.language || undefined,
      dictionaryWords,
    );

    if (!result) {
      console.error('[SessionMgr] Token fetch failed');
      this.state = 'idle';
      return null;
    }

    const token: CachedToken = {
      clientSecret: result.clientSecret,
      expiresAt: result.expiresAt ? new Date(result.expiresAt).getTime() : (Date.now() + 60_000),
      fetchedAt: Date.now(),
      language: config.language,
      dictionaryHash: this.computeDictionaryHash(),
    };

    this.cachedToken = token;
    console.log(`[SessionMgr] Token fetched in ${Date.now() - t0}ms`);
    return token;
  }

  private isTokenValid(): boolean {
    if (!this.cachedToken) return false;
    const now = Date.now();
    const age = now - this.cachedToken.fetchedAt;
    const remaining = this.cachedToken.expiresAt - now;
    return age < TOKEN_MAX_AGE_MS && remaining > TOKEN_MIN_REMAINING_MS;
  }

  private isConfigStale(): boolean {
    if (!this.cachedToken) return true;
    const config = getConfig();
    if (config.language !== this.cachedToken.language) return true;
    if (this.computeDictionaryHash() !== this.cachedToken.dictionaryHash) return true;
    return false;
  }

  private computeDictionaryHash(): string {
    const words = dictionaryService.getAllWords();
    return words?.length ? words.sort().join('|') : '';
  }

  private handleWarmDisconnect(): void {
    this.warmService = null;
    this.cachedToken = null;
    if (this.state === 'warm' || this.state === 'connecting') {
      console.log('[SessionMgr] Warm connection lost, re-warming...');
      this.state = 'idle';
      this.warmUp();
    }
  }

  private scheduleTokenRefresh(): void {
    if (this.autoRefreshCount >= MAX_AUTO_REFRESHES) {
      console.log('[SessionMgr] Max auto-refreshes reached, not scheduling another');
      return;
    }
    if (!this.cachedToken) return;

    const refreshIn = Math.max(0, this.cachedToken.expiresAt - Date.now() - TOKEN_MIN_REMAINING_MS);
    if (refreshIn <= 0) return;

    console.log(`[SessionMgr] Scheduling token refresh in ${Math.round(refreshIn / 1000)}s`);
    this.cancelRefreshTimer();
    this.refreshTimer = setTimeout(() => {
      this.refreshTimer = null;
      this.autoRefreshCount++;
      console.log(`[SessionMgr] Auto-refreshing token (refresh #${this.autoRefreshCount})`);
      // Disconnect warm service and re-warm with fresh token
      if (this.warmService) {
        this.warmService.disconnect();
        this.warmService = null;
      }
      this.cachedToken = null;
      this.state = 'idle';
      this.warmUp();
    }, refreshIn);
  }

  private cancelReWarmTimer(): void {
    if (this.reWarmTimer) {
      clearTimeout(this.reWarmTimer);
      this.reWarmTimer = null;
    }
  }

  private cancelRefreshTimer(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }
}
