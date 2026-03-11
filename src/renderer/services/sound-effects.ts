type OscillatorType = 'sine' | 'square' | 'sawtooth' | 'triangle';

interface ToneOptions {
  frequency: number;
  duration: number;
  type?: OscillatorType;
  gain?: number;
  decay?: number;
}

class SoundEffects {
  private audioContext: AudioContext | null = null;

  private getContext(): AudioContext {
    if (!this.audioContext || this.audioContext.state === 'closed') {
      this.audioContext = new AudioContext();
    }
    return this.audioContext;
  }

  private playTone(options: ToneOptions): void {
    const ctx = this.getContext();
    const { frequency, duration, type = 'sine', gain = 0.15, decay = 0.15 } = options;
    const safeDuration = Math.max(duration, 0.05);
    const fadeInDuration = Math.min(0.02, safeDuration / 2);
    const safeDecay = Math.min(decay, Math.max(safeDuration - fadeInDuration, 0.01));
    const now = ctx.currentTime;
    const fadeInEnd = now + fadeInDuration;
    const fadeOutStart = Math.max(fadeInEnd, now + safeDuration - safeDecay);

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, now);

    // Soft fade-in to avoid click, then gentle fade-out
    gainNode.gain.setValueAtTime(0.001, now);
    gainNode.gain.exponentialRampToValueAtTime(gain, fadeInEnd);
    gainNode.gain.setValueAtTime(gain, fadeOutStart);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + safeDuration);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + safeDuration);
  }

  /** Warm knock/bell sound when recording starts */
  recordingStart(): void {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(480, now);
    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.exponentialRampToValueAtTime(0.15, now + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.3);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(720, now);
    gain2.gain.setValueAtTime(0.001, now);
    gain2.gain.exponentialRampToValueAtTime(0.06, now + 0.02);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now);
    osc2.stop(now + 0.22);
  }

  /** Gentle ascending two-tone when recording stops */
  recordingStop(): void {
    this.playTone({ frequency: 620, duration: 0.14, gain: 0.1 });
    setTimeout(() => {
      this.playTone({ frequency: 830, duration: 0.16, gain: 0.1 });
    }, 120);
  }

  /** Error sound (disabled — too startling) */
  error(): void {
    // no-op
  }
}

export const soundEffects = new SoundEffects();
