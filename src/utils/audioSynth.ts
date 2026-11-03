// Web Audio API procedural romantic music box and chimes
// Ensures 100% reliable romantic background music and sound effects without external broken MP3 links.

class RomanticAudioEngine {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private timer: number | null = null;
  private noteIndex = 0;
  private masterGain: GainNode | null = null;

  // Gentle, nostalgic music box arpeggio melody in E Major (warm, dreamy, celebratory)
  // Notes in Hz: E4, G#4, B4, C#5, E5, F#5, G#5, B5
  private melodyNotes = [
    329.63, // E4
    493.88, // B4
    659.25, // E5
    415.30, // G#4
    554.37, // C#5
    659.25, // E5
    739.99, // F#5
    493.88, // B4
    415.30, // G#4
    329.63, // E4
    440.00, // A4
    554.37, // C#5
    659.25, // E5
    554.37, // C#5
    493.88, // B4
    329.63  // E4
  ];

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Play a single bell/music box bell note with soft harmonic overtones
  private playMusicBoxNote(freq: number, velocity: number = 0.5) {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // Fundamental oscillator (sine)
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, now);

    // Overtone oscillator for music-box chime sparkle (triangle 2x freq)
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2.01, now);

    // Soft envelope
    const duration = 1.4;
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(velocity * 0.45, now + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    gain2.gain.setValueAtTime(0, now);
    gain2.gain.linearRampToValueAtTime(velocity * 0.12, now + 0.015);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + duration * 0.6);

    osc1.connect(gain1);
    osc2.connect(gain2);
    gain1.connect(this.masterGain);
    gain2.connect(this.masterGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duration);
    osc2.stop(now + duration);
  }

  public toggle(): boolean {
    if (this.isPlaying) {
      this.stop();
      return false;
    } else {
      this.start();
      return true;
    }
  }

  public start() {
    this.initContext();
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.noteIndex = 0;

    const playNext = () => {
      if (!this.isPlaying) return;
      const freq = this.melodyNotes[this.noteIndex % this.melodyNotes.length];
      this.playMusicBoxNote(freq, 0.4);
      this.noteIndex++;

      // Subtle swing rhythm
      const interval = this.noteIndex % 2 === 0 ? 380 : 320;
      this.timer = window.setTimeout(playNext, interval);
    };

    playNext();
  }

  public stop() {
    this.isPlaying = false;
    if (this.timer) {
      window.clearTimeout(this.timer);
      this.timer = null;
    }
  }

  public isMusicPlaying(): boolean {
    return this.isPlaying;
  }

  // Celebratory Chime / Candle Blowout Fanfare
  public playCelebrationChime() {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const chord = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C Major arpeggio sweep
    chord.forEach((freq, idx) => {
      const delay = idx * 0.09;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + delay);

      gain.gain.setValueAtTime(0, now + delay);
      gain.gain.linearRampToValueAtTime(0.4, now + delay + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 1.8);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(now + delay);
      osc.stop(now + delay + 1.8);
    });
  }

  // Soft sparkle click sound for stamps & cards
  public playSoftClick() {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.08);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  // Arcade catch chime (scales pitch with combo)
  public playCatchChime(combo: number = 1) {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const baseFreq = 587.33 * Math.min(1 + (combo - 1) * 0.08, 1.8); // D5 upwards

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.25, now + 0.11);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.18);
  }

  // Arcade hazard / miss sound
  public playMissSound() {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(130, now + 0.22);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  // Two-note harmonic chime for matching pairs or solving words
  public playMatchSuccess() {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    [659.25, 880.0].forEach((freq, i) => {
      const delay = i * 0.08;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + delay);

      gain.gain.setValueAtTime(0, now + delay);
      gain.gain.linearRampToValueAtTime(0.3, now + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.35);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(now + delay);
      osc.stop(now + delay + 0.35);
    });
  }
}

export const romanticAudio = new RomanticAudioEngine();

