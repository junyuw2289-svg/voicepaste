import { EventEmitter } from 'events';
import WebSocket from 'ws';

type StopResolution =
  | 'waiting'
  | 'completed'
  | 'failed_event'
  | 'buffer_error'
  | 'timeout'
  | 'disconnect'
  | 'no_audio'
  | 'not_connected';

export interface RealtimeDebugSnapshot {
  isConnected: boolean;
  audioChunksSent: number;
  accumulatedTranscriptCount: number;
  accumulatedTextPreview: string;
  speechStartedCount: number;
  speechStoppedCount: number;
  transcriptCompletedCount: number;
  transcriptDeltaCount: number;
  lastTranscriptPreview: string | null;
  lastDeltaPreview: string | null;
  lastTranscriptionFailure: string | null;
  lastServerError: string | null;
  stopRequestedAt: number | null;
  stopResolvedAt: number | null;
  stopResolution: StopResolution | null;
  recentEvents: string[];
}

/**
 * WebSocket client for OpenAI Realtime Transcription API.
 *
 * Events emitted:
 * - 'utterance' (text: string) — completed transcript for one phrase
 * - 'speech_started'
 * - 'speech_stopped'
 * - 'error' (msg: string)
 */
export class RealtimeTranscriptionService extends EventEmitter {
  private ws: WebSocket | null = null;
  private accumulatedTranscripts: string[] = [];
  private pendingStop: (() => void) | null = null;
  private stopping = false;
  private audioChunksSent = 0;
  private rejectConnect: ((err: Error) => void) | null = null;
  private connectTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private speechStartedCount = 0;
  private speechStoppedCount = 0;
  private transcriptCompletedCount = 0;
  private transcriptDeltaCount = 0;
  private lastTranscriptPreview: string | null = null;
  private lastDeltaPreview: string | null = null;
  private lastTranscriptionFailure: string | null = null;
  private lastServerError: string | null = null;
  private stopRequestedAt: number | null = null;
  private stopResolvedAt: number | null = null;
  private stopResolution: StopResolution | null = null;
  private recentEvents: string[] = [];

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /** Remove all event listeners without closing the WebSocket (used by session manager warm pool) */
  removeWarmHandlers(): void {
    this.removeAllListeners();
  }

  getAccumulatedText(): string {
    return this.accumulatedTranscripts.join(' ');
  }

  getDebugSnapshot(): RealtimeDebugSnapshot {
    return {
      isConnected: this.isConnected,
      audioChunksSent: this.audioChunksSent,
      accumulatedTranscriptCount: this.accumulatedTranscripts.length,
      accumulatedTextPreview: this.getAccumulatedText().slice(0, 300),
      speechStartedCount: this.speechStartedCount,
      speechStoppedCount: this.speechStoppedCount,
      transcriptCompletedCount: this.transcriptCompletedCount,
      transcriptDeltaCount: this.transcriptDeltaCount,
      lastTranscriptPreview: this.lastTranscriptPreview,
      lastDeltaPreview: this.lastDeltaPreview,
      lastTranscriptionFailure: this.lastTranscriptionFailure,
      lastServerError: this.lastServerError,
      stopRequestedAt: this.stopRequestedAt,
      stopResolvedAt: this.stopResolvedAt,
      stopResolution: this.stopResolution,
      recentEvents: [...this.recentEvents],
    };
  }

  /** Remove the last accumulated transcript (used for filtering hallucinations) */
  popLastTranscript(): void {
    this.accumulatedTranscripts.pop();
  }

  /** Replace the last accumulated transcript after downstream filtering/correction. */
  replaceLastTranscript(text: string): void {
    if (this.accumulatedTranscripts.length === 0) {
      return;
    }

    this.accumulatedTranscripts[this.accumulatedTranscripts.length - 1] = text;
  }

  async connect(clientSecret: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.accumulatedTranscripts = [];
      this.audioChunksSent = 0;
      this.speechStartedCount = 0;
      this.speechStoppedCount = 0;
      this.transcriptCompletedCount = 0;
      this.transcriptDeltaCount = 0;
      this.lastTranscriptPreview = null;
      this.lastDeltaPreview = null;
      this.lastTranscriptionFailure = null;
      this.lastServerError = null;
      this.stopRequestedAt = null;
      this.stopResolvedAt = null;
      this.stopResolution = null;
      this.recentEvents = [];

      const url = 'wss://api.openai.com/v1/realtime?intent=transcription';
      console.log('[Realtime] Connecting to:', url);
      this.ws = new WebSocket(url, {
        headers: {
          'Authorization': `Bearer ${clientSecret}`,
          'OpenAI-Beta': 'realtime=v1',
        },
      });

      this.rejectConnect = reject;
      this.connectTimeoutId = setTimeout(() => {
        this.rejectConnect = null;
        this.connectTimeoutId = null;
        reject(new Error('WebSocket connection timeout'));
        this.disconnect();
      }, 10000);

      this.ws.on('open', () => {
        console.log('[Realtime] WebSocket connected, waiting for session.created event...');
      });

      this.ws.on('message', (data: WebSocket.Data) => {
        try {
          const event = JSON.parse(data.toString());
          this.handleServerEvent(event, resolve);
        } catch (err) {
          console.error('[Realtime] Failed to parse message:', err);
        }
      });

      this.ws.on('error', (err) => {
        console.error('[Realtime] WebSocket error:', err.message);
        if (this.connectTimeoutId) {
          clearTimeout(this.connectTimeoutId);
          this.connectTimeoutId = null;
        }
        this.rejectConnect = null;
        try {
          if (this.listenerCount('error') > 0) {
            this.emit('error', err.message);
          }
        } catch {
          console.error('[Realtime] Failed to emit error event (no listener)');
        }
        reject(err);
      });

      this.ws.on('close', (code, reason) => {
        console.log(`[Realtime] WebSocket closed: ${code} ${reason}`);
        this.ws = null;
      });
    });
  }

  private handleServerEvent(
    event: Record<string, unknown>,
    resolveConnect: () => void,
  ): void {
    const type = event.type as string;
    this.rememberEvent(type);

    // Log every event type for debugging
    console.log(`[Realtime] Event: ${type}`);

    switch (type) {
      // Handle both possible session created event names (beta vs GA API)
      case 'transcription_session.created':
      case 'session.created':
        console.log(`[Realtime] Session created (event=${type}), session:`, JSON.stringify(event.session ?? event).substring(0, 300));
        if (this.connectTimeoutId) {
          clearTimeout(this.connectTimeoutId);
          this.connectTimeoutId = null;
        }
        this.rejectConnect = null;
        resolveConnect();
        break;

      case 'transcription_session.updated':
      case 'session.updated':
        console.log(`[Realtime] Session updated (event=${type})`);
        break;

      case 'input_audio_buffer.speech_started':
        console.log('[Realtime] Speech started (VAD)');
        this.speechStartedCount++;
        this.emit('speech_started');
        break;

      case 'input_audio_buffer.speech_stopped':
        console.log('[Realtime] Speech stopped (VAD)');
        this.speechStoppedCount++;
        this.emit('speech_stopped');
        break;

      case 'conversation.item.input_audio_transcription.completed': {
        const text = (event.transcript as string)?.trim();
        this.transcriptCompletedCount++;
        this.lastTranscriptPreview = text ? text.slice(0, 200) : null;
        console.log(`[Realtime] Transcript completed: "${text ?? '(empty)'}"`);
        if (text) {
          this.accumulatedTranscripts.push(text);
          this.emit('utterance', text);
        }
        // If we're stopping and waiting for the final transcript, resolve now
        if (this.stopping && this.pendingStop) {
          this.markStopResolved('completed');
          console.log('[Realtime] Final transcript received during stop, resolving');
          this.pendingStop();
          this.pendingStop = null;
        }
        break;
      }

      case 'conversation.item.input_audio_transcription.delta': {
        const delta = (event.delta as string) ?? '';
        this.transcriptDeltaCount++;
        this.lastDeltaPreview = delta ? delta.slice(0, 200) : null;
        console.log(`[Realtime] Transcript delta: "${delta}"`);
        break;
      }

      case 'conversation.item.input_audio_transcription.failed': {
        const errorMsg = (event.error as Record<string, unknown>)?.message as string || 'Transcription failed';
        this.lastTranscriptionFailure = errorMsg;
        console.error(`[Realtime] Transcription failed:`, errorMsg, JSON.stringify(event.error));
        if (this.stopping && this.pendingStop) {
          this.markStopResolved('failed_event');
          this.pendingStop();
          this.pendingStop = null;
        }
        // Don't emit error for individual failures — the session continues
        break;
      }

      case 'input_audio_buffer.committed':
        console.log('[Realtime] Audio buffer committed');
        break;

      case 'input_audio_buffer.cleared':
        console.log('[Realtime] Audio buffer cleared');
        break;

      case 'error': {
        const errorMsg = (event.error as Record<string, unknown>)?.message as string || 'Unknown error';
        this.lastServerError = errorMsg;
        console.error(`[Realtime] Server error:`, errorMsg, JSON.stringify(event.error));
        // Buffer-related errors (e.g. "buffer too small") are non-fatal — resolve pending stop
        if (errorMsg.toLowerCase().includes('buffer')) {
          this.markStopResolved('buffer_error');
          console.log('[Realtime] Buffer error during stop, resolving gracefully');
          if (this.pendingStop) {
            this.pendingStop();
            this.pendingStop = null;
          }
        } else if (this.listenerCount('error') > 0) {
          try {
            this.emit('error', errorMsg);
          } catch {
            console.error('[Realtime] Failed to emit server error (no listener)');
          }
        } else {
          console.error('[Realtime] Unhandled server error (no listener):', errorMsg);
        }
        break;
      }

      default:
        console.log(`[Realtime] Unhandled event: ${type}`, JSON.stringify(event).substring(0, 200));
        break;
    }
  }

  private rememberEvent(type: string): void {
    this.recentEvents.push(type);
    if (this.recentEvents.length > 25) {
      this.recentEvents.splice(0, this.recentEvents.length - 25);
    }
  }

  private markStopResolved(reason: StopResolution): void {
    this.stopResolution = reason;
    this.stopResolvedAt = Date.now();
  }

  sendAudioChunk(pcm16: Buffer): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const base64 = pcm16.toString('base64');
    this.ws.send(JSON.stringify({
      type: 'input_audio_buffer.append',
      audio: base64,
    }));
    this.audioChunksSent++;
    // Log periodically to avoid spam
    if (this.audioChunksSent % 50 === 1) {
      console.log(`[Realtime] Audio chunks sent: ${this.audioChunksSent} (latest: ${pcm16.length} bytes)`);
    }
  }

  /**
   * Commits remaining audio and waits for final transcription.
   * Returns all accumulated transcript text.
   */
  async stop(): Promise<string> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.markStopResolved('not_connected');
      return this.accumulatedTranscripts.join(' ');
    }

    // If no audio was sent, skip commit to avoid "buffer too small" error
    if (this.audioChunksSent === 0) {
      console.log('[Realtime] No audio chunks sent, skipping commit');
      this.markStopResolved('no_audio');
      this.stopping = false;
      return '';
    }

    this.stopping = true;
    this.stopRequestedAt = Date.now();
    this.stopResolvedAt = null;
    this.stopResolution = 'waiting';

    // Commit any remaining audio in the buffer
    this.ws.send(JSON.stringify({ type: 'input_audio_buffer.commit' }));
    console.log('[Realtime] Committed final audio buffer');

    // Wait for the final transcription to come through (resolved by handleServerEvent)
    await new Promise<void>((resolve) => {
      this.pendingStop = resolve;
      // Give it up to 3 seconds for the final transcript
      setTimeout(() => {
        if (this.pendingStop === resolve) {
          this.markStopResolved('timeout');
          console.log('[Realtime] Final transcript timeout, proceeding');
          this.pendingStop = null;
          resolve();
        }
      }, 3000);
    });

    this.stopping = false;
    const fullText = this.accumulatedTranscripts.join(' ');
    console.log(`[Realtime] Final accumulated text (${this.accumulatedTranscripts.length} segments): "${fullText}"`);
    return fullText;
  }

  disconnect(): void {
    console.log(`[Realtime] Disconnecting (chunks sent: ${this.audioChunksSent}, transcripts: ${this.accumulatedTranscripts.length})`);
    // Fast-fail any in-flight connect() promise
    if (this.connectTimeoutId) {
      clearTimeout(this.connectTimeoutId);
      this.connectTimeoutId = null;
    }
    if (this.rejectConnect) {
      this.rejectConnect(new Error('Disconnected'));
      this.rejectConnect = null;
    }
    if (this.pendingStop) {
      this.markStopResolved('disconnect');
      this.pendingStop();
      this.pendingStop = null;
    }
    if (this.ws) {
      console.log(`[Realtime] Terminating WebSocket (readyState=${this.ws.readyState})`);
      try {
        this.ws.removeAllListeners(); // Detach all WS handlers first to prevent async emitErrorAndClose
        this.ws.terminate();
      } catch {
        // Already closed
      }
      this.ws = null;
    }
    this.accumulatedTranscripts = [];
    this.audioChunksSent = 0;
    this.removeAllListeners();
  }
}
