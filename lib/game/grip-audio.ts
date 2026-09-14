// A dry palm-on-wood tap: a short filtered scuff over two damped wood resonances.
export class GripAudio {
  private context: AudioContext | null = null;
  private muted = false;
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
    if (this.muted || document.hidden) return;
    this.unlock();
    const ctx = this.context;
    if (!ctx || ctx.state !== 'running') return;
    const start = ctx.currentTime;
    const output = ctx.createGain();
    output.gain.setValueAtTime(0.0001, start);
    output.gain.exponentialRampToValueAtTime(0.23, start + 0.004);
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
  dispose() {
    if (this.context) void this.context.close().catch(() => {});
    this.context = null;
  }
}
