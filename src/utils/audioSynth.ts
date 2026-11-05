// Web Audio API procedural romantic music box and chimes
// Ensures 100% reliable romantic background music and sound effects without external broken MP3 links.

type PlaybackListener = (isPlaying: boolean) => void;

class RomanticAudioEngine {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private timer: number | null = null;
  private fadeStartTimer: number | null = null;
  private fadeEndTimer: number | null = null;
  private noteIndex = 0;
  private masterGain: GainNode | null = null;
  private listeners: Set<PlaybackListener> = new Set();

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

  public subscribe(listener: PlaybackListener): () => void {
    this.listeners.add(listener);
    listener(this.isPlaying);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.isPlaying));
  }

  private clearFadeTimers() {
    if (this.fadeStartTimer !== null) {
      window.clearTimeout(this.fadeStartTimer);
      this.fadeStartTimer = null;
    }
    if (this.fadeEndTimer !== null) {
      window.clearTimeout(this.fadeEndTimer);
      this.fadeEndTimer = null;
    }
  }

  private resetMasterVolume() {
    if (this.ctx && this.masterGain) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(0.25, now);
    }
  }

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

  // Manual toggle via the "Play Music Box / Pause Music Box" button
  public toggle(): boolean {
    this.clearFadeTimers();
    this.resetMasterVolume();
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
    this.resetMasterVolume();
    if (this.isPlaying) {
      this.notifyListeners();
      return;
    }
    this.isPlaying = true;
    this.noteIndex = 0;
    this.notifyListeners();

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
    this.clearFadeTimers();
    this.isPlaying = false;
    if (this.timer) {
      window.clearTimeout(this.timer);
      this.timer = null;
    }
    this.resetMasterVolume();
    this.notifyListeners();
  }

  /**
   * Automatically starts the music box when all birthday candles are blown out,
   * plays for `playDurationMs`, smoothly fades out over `fadeDurationMs`, and then stops
   * so the user can manually turn the music button on/off afterwards whenever she likes.
   */
  public playTemporaryWithFadeOut(
    playDurationMs: number = 9000,
    fadeDurationMs: number = 4000
  ) {
    this.initContext();
    this.clearFadeTimers();
    this.resetMasterVolume();

    if (!this.isPlaying) {
      this.start();
    } else {
      this.notifyListeners();
    }

    this.fadeStartTimer = window.setTimeout(() => {
      if (!this.isPlaying || !this.ctx || !this.masterGain) return;
      const now = this.ctx.currentTime;
      const fadeSeconds = fadeDurationMs / 1000;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value || 0.25, now);
      this.masterGain.gain.linearRampToValueAtTime(0.0001, now + fadeSeconds);

      this.fadeEndTimer = window.setTimeout(() => {
        this.stop();
      }, fadeDurationMs);
    }, playDurationMs);
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

  // Crisp, realistic balloon pop sound + celebratory sparkle chime
  public playBalloonPop() {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // 1. Acoustic white-noise pop transient
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.085);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1100, now);
    filter.Q.setValueAtTime(1.4, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.65, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noise.start(now);

    // 2. Membrane pitch-drop snap
    const snapOsc = this.ctx.createOscillator();
    const snapGain = this.ctx.createGain();
    snapOsc.type = 'triangle';
    snapOsc.frequency.setValueAtTime(340, now);
    snapOsc.frequency.exponentialRampToValueAtTime(55, now + 0.075);

    snapGain.gain.setValueAtTime(0.45, now);
    snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    snapOsc.connect(snapGain);
    snapGain.connect(this.masterGain);
    snapOsc.start(now);
    snapOsc.stop(now + 0.085);

    // 3. Tiny celebratory sparkle notes right after the pop
    [880, 1174.66, 1567.98].forEach((freq, idx) => {
      const delay = 0.04 + idx * 0.045;
      const osc = this.ctx!.createOscillator();
      const g = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + delay);
      g.gain.setValueAtTime(0.16, now + delay);
      g.gain.exponentialRampToValueAtTime(0.0008, now + delay + 0.24);
      osc.connect(g);
      g.connect(this.masterGain!);
      osc.start(now + delay);
      osc.stop(now + delay + 0.25);
    });
  }

  // Aerial firework shell burst: warm low-end boom + sparkling golden crackle
  public playFireworkBurst() {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // 1. Deep aerial boom envelope
    const boomOsc = this.ctx.createOscillator();
    const boomGain = this.ctx.createGain();
    boomOsc.type = 'sine';
    boomOsc.frequency.setValueAtTime(140, now);
    boomOsc.frequency.exponentialRampToValueAtTime(34, now + 0.36);

    boomGain.gain.setValueAtTime(0.42, now);
    boomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    boomOsc.connect(boomGain);
    boomGain.connect(this.masterGain);
    boomOsc.start(now);
    boomOsc.stop(now + 0.4);

    // 2. Shimmering crackle noise burst
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.42);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const env = Math.exp(-i / (bufferSize * 0.32));
      data[i] = (Math.random() * 2 - 1) * env;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(1850, now);
    bp.Q.setValueAtTime(1.1, now);

    const crackleGain = this.ctx.createGain();
    crackleGain.gain.setValueAtTime(0.32, now);
    crackleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

    noise.connect(bp);
    bp.connect(crackleGain);
    crackleGain.connect(this.masterGain);
    noise.start(now);

    // 3. High celestial star-chime overtones
    [1046.5, 1318.51, 1567.98].forEach((freq, idx) => {
      const delay = 0.05 + idx * 0.055;
      const osc = this.ctx!.createOscillator();
      const g = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + delay);
      g.gain.setValueAtTime(0.11, now + delay);
      g.gain.exponentialRampToValueAtTime(0.0005, now + delay + 0.35);
      osc.connect(g);
      g.connect(this.masterGain!);
      osc.start(now + delay);
      osc.stop(now + delay + 0.36);
    });
  }

  // Step 1 of Virtual Gift Unboxing: Silky satin ribbon untie swish + golden bell glissando
  public playRibbonUntie() {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // 1. Silky satin ribbon slide (filtered noise sweep)
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.26);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const env = Math.sin((i / bufferSize) * Math.PI);
      data[i] = (Math.random() * 2 - 1) * env;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(900, now);
    filter.frequency.exponentialRampToValueAtTime(2800, now + 0.24);
    filter.Q.setValueAtTime(1.8, now);

    const swishGain = this.ctx.createGain();
    swishGain.gain.setValueAtTime(0.28, now);
    swishGain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

    noise.connect(filter);
    filter.connect(swishGain);
    swishGain.connect(this.masterGain);
    noise.start(now);

    // 2. Delicate 3-note golden ribbon chime (G5 -> B5 -> D6)
    [783.99, 987.77, 1174.66].forEach((freq, idx) => {
      const delay = 0.04 + idx * 0.065;
      const osc = this.ctx!.createOscillator();
      const g = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + delay);
      g.gain.setValueAtTime(0, now + delay);
      g.gain.linearRampToValueAtTime(0.22, now + delay + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0008, now + delay + 0.45);
      osc.connect(g);
      g.connect(this.masterGain!);
      osc.start(now + delay);
      osc.stop(now + delay + 0.46);
    });
  }

  // Step 2 of Virtual Gift Unboxing: Velvet lid pop + wrapping rustle + magical treasure chest arpeggio
  public playGiftUnboxing() {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // 1. Warm velvet box lid pop (resonant low-mid thump + pitch rise)
    const popOsc = this.ctx.createOscillator();
    const popGain = this.ctx.createGain();
    popOsc.type = 'sine';
    popOsc.frequency.setValueAtTime(115, now);
    popOsc.frequency.exponentialRampToValueAtTime(290, now + 0.11);

    popGain.gain.setValueAtTime(0.48, now);
    popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    popOsc.connect(popGain);
    popGain.connect(this.masterGain);
    popOsc.start(now);
    popOsc.stop(now + 0.15);

    // 2. Crisp tissue/parchment paper unfold rustle
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.34);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const env = Math.exp(-i / (bufferSize * 0.35));
      output[i] = (Math.random() * 2 - 1) * env;
    }

    const rustle = this.ctx.createBufferSource();
    rustle.buffer = noiseBuffer;

    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.setValueAtTime(1600, now);

    const rustleGain = this.ctx.createGain();
    rustleGain.gain.setValueAtTime(0.3, now + 0.04);
    rustleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.34);

    rustle.connect(hp);
    hp.connect(rustleGain);
    rustleGain.connect(this.masterGain);
    rustle.start(now + 0.04);

    // 3. Magical unboxing harp & celesta fanfare (C5 -> E5 -> G5 -> B5 -> C6 -> E6 -> G6)
    const unboxingNotes = [
      523.25, // C5
      659.25, // E5
      783.99, // G5
      987.77, // B5
      1046.5, // C6
      1318.51, // E6
      1567.98, // G6
    ];

    unboxingNotes.forEach((freq, idx) => {
      const delay = 0.08 + idx * 0.075;
      const osc1 = this.ctx!.createOscillator();
      const osc2 = this.ctx!.createOscillator();
      const noteGain = this.ctx!.createGain();

      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(freq, now + delay);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 2, now + delay);

      noteGain.gain.setValueAtTime(0, now + delay);
      noteGain.gain.linearRampToValueAtTime(0.32, now + delay + 0.025);
      noteGain.gain.exponentialRampToValueAtTime(0.0006, now + delay + 1.45);

      osc1.connect(noteGain);
      osc2.connect(noteGain);
      noteGain.connect(this.masterGain!);

      osc1.start(now + delay);
      osc2.start(now + delay);
      osc1.stop(now + delay + 1.48);
      osc2.stop(now + delay + 1.48);
    });
  }
}

export const romanticAudio = new RomanticAudioEngine();



