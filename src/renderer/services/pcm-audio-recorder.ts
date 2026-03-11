/**
 * PcmAudioRecorder wraps an inline AudioWorklet to capture PCM16 audio at 24kHz.
 * The worklet is loaded from a Blob URL so packaged builds don't depend on file paths
 * inside app.asar.
 */

const PCM_WORKLET_CODE = `
class PcmWorkletProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = new Int16Array(2400);
    this.writeIndex = 0;
  }

  process(inputs) {
    const input = inputs[0]?.[0];
    if (!input) return true;

    for (let i = 0; i < input.length; i += 2) {
      const sample = Math.max(-1, Math.min(1, input[i]));
      this.buffer[this.writeIndex++] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;

      if (this.writeIndex >= 2400) {
        this.port.postMessage(this.buffer.buffer.slice(0));
        this.writeIndex = 0;
      }
    }

    return true;
  }
}

registerProcessor('pcm-worklet-processor', PcmWorkletProcessor);
`;

let workletBlobUrl: string | null = null;

function getWorkletBlobUrl(): string {
  if (!workletBlobUrl) {
    const blob = new Blob([PCM_WORKLET_CODE], { type: 'application/javascript' });
    workletBlobUrl = URL.createObjectURL(blob);
  }
  return workletBlobUrl;
}

export class PcmAudioRecorder {
  private audioContext: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private analyser: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private chunkCallback: ((pcm16: ArrayBuffer) => void) | null = null;
  private _isRecording = false;

  onChunk(cb: (pcm16: ArrayBuffer) => void): void {
    this.chunkCallback = cb;
  }

  clearChunkHandler(): void {
    this.chunkCallback = null;
  }

  async start(deviceId?: string): Promise<void> {
    this.releaseResources();

    const audioConstraints: Record<string, unknown> = {
      sampleRate: { ideal: 48000 },
      autoGainControl: true,
      noiseSuppression: false,
      echoCancellation: true,
      channelCount: 1,
      sampleSize: 16,
      latency: 0,
    };

    if (deviceId) {
      audioConstraints.deviceId = { exact: deviceId };
    }

    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: audioConstraints as MediaTrackConstraints,
    });

    const track = this.stream.getAudioTracks()[0];
    console.log(`[PcmRecorder] Active mic: "${track.label}"`);

    this.audioContext = new AudioContext({ sampleRate: 48000 });
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
    console.log(`[PcmRecorder] AudioContext state: ${this.audioContext.state}`);
    console.log(`[PcmRecorder] sampleRate=${this.audioContext.sampleRate}, stride=2`);

    this.sourceNode = this.audioContext.createMediaStreamSource(this.stream);

    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.value = 1.2;

    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;

    await this.audioContext.audioWorklet.addModule(getWorkletBlobUrl());

    this.workletNode = new AudioWorkletNode(this.audioContext, 'pcm-worklet-processor');
    this.workletNode.port.onmessage = (event: MessageEvent<ArrayBuffer>) => {
      this.chunkCallback?.(event.data);
    };

    this.sourceNode.connect(this.gainNode);
    this.gainNode.connect(this.analyser);
    this.gainNode.connect(this.workletNode);
    this.workletNode.connect(this.audioContext.destination);

    this._isRecording = true;
  }

  stop(): void {
    this._isRecording = false;
    this.releaseResources();
  }

  getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  getRmsLevel(): number {
    if (!this.analyser) return 0;
    const buf = new Uint8Array(this.analyser.fftSize);
    this.analyser.getByteTimeDomainData(buf);
    let sum = 0;
    for (let i = 0; i < buf.length; i++) {
      const v = (buf[i] - 128) / 128;
      sum += v * v;
    }
    return Math.sqrt(sum / buf.length);
  }

  isRecording(): boolean {
    return this._isRecording;
  }

  private releaseResources(): void {
    this.workletNode?.disconnect();
    this.workletNode = null;
    this.sourceNode?.disconnect();
    this.sourceNode = null;
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
    this.analyser = null;
    this.gainNode = null;
    this.audioContext?.close().catch((error) => {
      console.warn('[PcmRecorder] Failed to close AudioContext:', error);
    });
    this.audioContext = null;
  }
}
