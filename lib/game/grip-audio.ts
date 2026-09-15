// A dry palm-on-wood tap: a short filtered scuff over two damped wood resonances.
export class GripAudio {
  private context: AudioContext | null = null;
  private muted = false;
  private volume = 1;
  private samples: Partial<Record<'hand' | 'foot' | 'cough', AudioBuffer>> = {};
  private sampleLoads: Partial<
    Record<'hand' | 'foot' | 'cough', Promise<void>>
  > = {};
  constructor(basePath = '') {
    const prefix = basePath.replace(/\/$/, '');
    // Swap the supplied recordings so hand and foot contacts have the new feel.
    this.loadSample('hand', `${prefix}/audio/grab-foot.wav`);
    this.loadSample('foot', `${prefix}/audio/grab-hand.wav`);
    this.loadSample('cough', `${prefix}/audio/smoke-cough.wav`);
  }
  private async loadSample(kind: 'hand' | 'foot' | 'cough', url: string) {
    this.sampleLoads[kind] = fetch(url)
      .then((response) => response.arrayBuffer())
      .then((data) => {
        this.unlock();
        if (!this.context) return;
        return this.context.decodeAudioData(data).then((buffer) => {
          this.samples[kind] = buffer;
        });
      })
      .catch(() => undefined);
  }
  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
  }
  setMuted(muted: boolean) {
    this.muted = muted;
  }
  unlock() {
    if (this.muted) return;
    try {
      this.context ??= new AudioContext();
      if (this.context.state === 'suspended')
        void this.context.resume().catch(() => {});
    } catch {
      /* Sound is optional on devices without Web Audio. */
    }
  }
  play() {
    if (this.muted || this.volume === 0 || document.hidden) return;
    this.unlock();
    const ctx = this.context;
    if (!ctx || ctx.state !== 'running') return;
    const start = ctx.currentTime;
    const output = ctx.createGain();
    output.gain.setValueAtTime(0.0001, start);
    output.gain.exponentialRampToValueAtTime(0.23 * this.volume, start + 0.004);
    output.gain.exponentialRampToValueAtTime(0.0001, start + 0.115);
    output.connect(ctx.destination);
    const buffer = ctx.createBuffer(
      1,
      Math.ceil(ctx.sampleRate * 0.12),
      ctx.sampleRate,
    );
    const samples = buffer.getChannelData(0);
    for (let i = 0; i < samples.length; i++)
      samples[i] = (Math.random() * 2 - 1) * 0.6;
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1150;
    filter.Q.value = 0.7;
    noise.connect(filter);
    filter.connect(output);
    noise.start(start);
    noise.stop(start + 0.12);
    const variation = 0.94 + Math.random() * 0.12;
    for (const hz of [185, 410]) {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.frequency.setValueAtTime(hz * variation, start);
      oscillator.frequency.exponentialRampToValueAtTime(
        hz * variation * 0.78,
        start + 0.09,
      );
      gain.gain.setValueAtTime(0.4, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.085);
      oscillator.connect(gain);
      gain.connect(output);
      oscillator.start(start);
      oscillator.stop(start + 0.12);
      oscillator.onended = () => {
        oscillator.disconnect();
        gain.disconnect();
      };
    }
    noise.onended = () => {
      noise.disconnect();
      filter.disconnect();
      output.disconnect();
    };
  }
  playGrab(limb: 'leftHand' | 'rightHand' | 'leftFoot' | 'rightFoot') {
    if (this.muted || this.volume === 0 || document.hidden) return;
    this.unlock();
    const sample = this.samples[limb.endsWith('Hand') ? 'hand' : 'foot'];
    if (!sample) {
      this.play();
      return;
    }
    const ctx = this.context;
    if (!ctx || ctx.state !== 'running') return;
    const start = ctx.currentTime;
    const output = ctx.createGain();
    output.gain.setValueAtTime(0.0001, start);
    output.gain.exponentialRampToValueAtTime(0.72 * this.volume, start + 0.004);
    output.gain.exponentialRampToValueAtTime(0.0001, start + 0.34);
    output.connect(ctx.destination);
    const source = ctx.createBufferSource();
    source.buffer = sample;
    source.connect(output);
    source.start(start, 0, Math.min(sample.duration, 0.34));
    source.onended = () => {
      source.disconnect();
      output.disconnect();
    };
  }
  playCough() {
    if (this.muted || this.volume === 0 || document.hidden) return;
    this.unlock();
    const sample = this.samples.cough;
    const ctx = this.context;
    if (!sample || !ctx || ctx.state !== 'running') return;
    const start = ctx.currentTime;
    const output = ctx.createGain();
    output.gain.setValueAtTime(0.0001, start);
    output.gain.exponentialRampToValueAtTime(0.72 * this.volume, start + 0.012);
    output.gain.exponentialRampToValueAtTime(0.0001, start + 2.2);
    output.connect(ctx.destination);
    const source = ctx.createBufferSource();
    source.buffer = sample;
    source.connect(output);
    source.start(start, 0, Math.min(sample.duration, 2.2));
    source.onended = () => {
      source.disconnect();
      output.disconnect();
    };
  }
  warning() {
    if (this.muted || this.volume === 0 || document.hidden) return;
    this.unlock();
    const ctx = this.context;
    if (!ctx || ctx.state !== 'running') return;
    for (let i = 0; i < 2; i++) {
      const start = ctx.currentTime + i * 0.17;
      const tone = ctx.createOscillator(),
        gain = ctx.createGain();
      tone.type = 'triangle';
      tone.frequency.setValueAtTime(1500, start);
      tone.frequency.exponentialRampToValueAtTime(650, start + 0.1);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.1 * this.volume, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.13);
      tone.connect(gain);
      gain.connect(ctx.destination);
      tone.start(start);
      tone.stop(start + 0.14);
      tone.onended = () => {
        tone.disconnect();
        gain.disconnect();
      };
    }
  }
  dispose() {
    if (this.context) void this.context.close().catch(() => {});
    this.context = null;
  }
}
