import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  Play,
  Square,
  Mic,
  RotateCcw,
  Sparkles,
  Heart,
  Smile,
  Music,
  Radio,
} from 'lucide-react';
import { idbGet, idbSet } from '../utils/persistentStorage';

interface SiblingSoundboardProps {
  girlfriendName: string;
  boyfriendName: string;
}

interface SoundSnippetPad {
  id: string;
  speaker: 'Anik' | 'Didi' | 'Both';
  title: string;
  subtitle: string;
  transcript: string;
  badgeColor: string;
  accentHex: string;
  durationLabel: string;
}

const SOUNDBOARD_IDB_KEY = 'amore_sibling_soundboard_custom_v1';

const SNIPPET_PADS: SoundSnippetPad[] = [
  {
    id: 'anik-hbd',
    speaker: 'Anik',
    title: 'Anik: "Happy Birthday, Didi!"',
    subtitle: 'Affectionate birthday wish & celebratory melody',
    transcript: '"Happy Birthday, Didi! You are truly the best big sister in the world!"',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
    accentHex: '#d97706',
    durationLabel: '3.2s',
  },
  {
    id: 'didi-laugh',
    speaker: 'Didi',
    title: "Didi's Contagious Giggle",
    subtitle: 'Bright formant-synthesized laugh & sparkle',
    transcript: '"Hahaha! Stop it Anik, you always make me laugh!"',
    badgeColor: 'bg-rose-100 text-rose-900 border-rose-300',
    accentHex: '#e11d48',
    durationLabel: '2.6s',
  },
  {
    id: 'anik-laugh',
    speaker: 'Anik',
    title: "Anik's Inside-Joke Laugh",
    subtitle: 'Playful brotherly chuckle & warm rhythm',
    transcript: '"Haha! Remember our childhood secrets? Classic Didi!"',
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    accentHex: '#059669',
    durationLabel: '2.5s',
  },
  {
    id: 'didi-hbd-reply',
    speaker: 'Didi',
    title: 'Didi: "Best Birthday Ever, Bhai!"',
    subtitle: 'Sweet sisterly reply & warm chime',
    transcript: '"Aww thank you so much Bhai! This is the sweetest birthday surprise!"',
    badgeColor: 'bg-rose-100 text-rose-900 border-rose-300',
    accentHex: '#f43f5e',
    durationLabel: '3.0s',
  },
  {
    id: 'both-laugh-duet',
    speaker: 'Both',
    title: 'Didi & Anik Laughing Together',
    subtitle: 'Stereo sibling laugh burst & applause',
    transcript: '"Hahaha! Best sibling duo forever — happy birthday Atrayee!"',
    badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
    accentHex: '#9333ea',
    durationLabel: '3.4s',
  },
  {
    id: 'anik-queen-cheer',
    speaker: 'Anik',
    title: 'Anik: "Hip Hip Hooray for Didi!"',
    subtitle: 'Party horn fanfare & birthday cheer',
    transcript: '"Hip hip hooray! Happy Birthday to the queen of our family, Atrayee Didi!"',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
    accentHex: '#ea580c',
    durationLabel: '3.1s',
  },
];

export const SiblingSoundboard: React.FC<SiblingSoundboardProps> = ({
  girlfriendName,
  boyfriendName,
}) => {
  const [activePadId, setActivePadId] = useState<string | null>(null);
  const [recordingPadId, setRecordingPadId] = useState<string | null>(null);
  const [customAudioMap, setCustomAudioMap] = useState<Record<string, string>>({});
  const [statusNote, setStatusNote] = useState<string | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const activeStopTimerRef = useRef<number | null>(null);
  const activeSourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafVisualizerRef = useRef<number | null>(null);

  // Load any custom recorded voice snippets from IndexedDB
  useEffect(() => {
    let mounted = true;
    async function loadCustomClips() {
      const saved = await idbGet<Record<string, string>>(SOUNDBOARD_IDB_KEY);
      if (mounted && saved) {
        setCustomAudioMap(saved);
      }
    }
    void loadCustomClips();
    return () => {
      mounted = false;
    };
  }, []);

  const ensureWebAudio = () => {
    if (!audioCtxRef.current) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ctx = new AudioCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.78;
      analyser.connect(ctx.destination);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
    }
    if (audioCtxRef.current.state === 'suspended') {
      void audioCtxRef.current.resume();
    }
    return {
      ctx: audioCtxRef.current,
      analyser: analyserRef.current!,
    };
  };

  // Real-time 60fps Web Audio API Spectrum & Waveform Canvas Visualizer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const c = canvas.getContext('2d');
    if (!c) return;

    const renderVisualizer = () => {
      const width = canvas.width;
      const height = canvas.height;
      c.clearRect(0, 0, width, height);

      const analyser = analyserRef.current;
      if (analyser && activePadId) {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);

        const barCount = 36;
        const step = Math.floor(bufferLength / barCount);
        const barWidth = (width - (barCount - 1) * 4) / barCount;

        for (let i = 0; i < barCount; i++) {
          const val = dataArray[i * step] || 8;
          const normalized = Math.max(0.12, val / 255);
          const barHeight = normalized * (height - 10);
          const x = i * (barWidth + 4);
          const y = (height - barHeight) / 2;

          const grad = c.createLinearGradient(0, y, 0, y + barHeight);
          grad.addColorStop(0, '#f43f5e');
          grad.addColorStop(0.5, '#f59e0b');
          grad.addColorStop(1, '#ec4899');

          c.fillStyle = grad;
          c.beginPath();
          c.roundRect(x, y, barWidth, barHeight, 4);
          c.fill();
        }
      } else {
        // Idle gentle heartbeat wave
        const barCount = 36;
        const barWidth = (width - (barCount - 1) * 4) / barCount;
        const t = performance.now() * 0.003;
        for (let i = 0; i < barCount; i++) {
          const wave = 5 + Math.sin(t + i * 0.35) * 3.5;
          const x = i * (barWidth + 4);
          const y = (height - wave) / 2;
          c.fillStyle = 'rgba(214, 158, 92, 0.35)';
          c.beginPath();
          c.roundRect(x, y, barWidth, wave, 3);
          c.fill();
        }
      }

      rafVisualizerRef.current = window.requestAnimationFrame(renderVisualizer);
    };

    rafVisualizerRef.current = window.requestAnimationFrame(renderVisualizer);
    return () => {
      if (rafVisualizerRef.current !== null) {
        window.cancelAnimationFrame(rafVisualizerRef.current);
      }
    };
  }, [activePadId]);

  const stopCurrentPlayback = () => {
    if (activeStopTimerRef.current !== null) {
      window.clearTimeout(activeStopTimerRef.current);
      activeStopTimerRef.current = null;
    }
    if (activeSourceNodeRef.current) {
      try {
        activeSourceNodeRef.current.stop();
      } catch {}
      activeSourceNodeRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setActivePadId(null);
  };

  /**
   * Synthesizes a realistic vocal formant laugh burst using Web Audio API:
   * - Glottal sawtooth/triangle source with pitch contour
   * - 3 parallel vowel formant bandpass filters (F1, F2, F3 for "Ha-ha-ha!")
   * - Breathy aspiration pink-noise envelope
   */
  const playFormantLaughBurst = (
    ctx: AudioContext,
    dest: AudioNode,
    isFemale: boolean,
    startOffset: number = 0,
    pan: number = 0
  ) => {
    const now = ctx.currentTime + startOffset;
    const syllables = isFemale
      ? [
          { t: 0.0, dur: 0.17, pitch: 310 },
          { t: 0.21, dur: 0.16, pitch: 345 },
          { t: 0.41, dur: 0.16, pitch: 325 },
          { t: 0.61, dur: 0.18, pitch: 295 },
          { t: 0.84, dur: 0.16, pitch: 335 },
          { t: 1.05, dur: 0.24, pitch: 275 },
        ]
      : [
          { t: 0.0, dur: 0.19, pitch: 155 },
          { t: 0.24, dur: 0.18, pitch: 172 },
          { t: 0.47, dur: 0.18, pitch: 162 },
          { t: 0.7, dur: 0.2, pitch: 145 },
          { t: 0.95, dur: 0.26, pitch: 132 },
        ];

    const formants = isFemale
      ? [
          { freq: 820, q: 6.5, amp: 1.0 },
          { freq: 1480, q: 8.0, amp: 0.65 },
          { freq: 2750, q: 10.0, amp: 0.35 },
        ]
      : [
          { freq: 650, q: 6.0, amp: 1.0 },
          { freq: 1180, q: 7.5, amp: 0.6 },
          { freq: 2420, q: 9.5, amp: 0.3 },
        ];

    const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if (panner) {
      panner.pan.setValueAtTime(pan, now);
      panner.connect(dest);
    }
    const targetNode = panner || dest;

    syllables.forEach((syl) => {
      const start = now + syl.t;
      const end = start + syl.dur;

      // Glottal vocal cord source
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(syl.pitch * 1.12, start);
      osc.frequency.exponentialRampToValueAtTime(syl.pitch * 0.84, end);

      // Sub-harmonic warmth
      const subOsc = ctx.createOscillator();
      subOsc.type = 'triangle';
      subOsc.frequency.setValueAtTime(syl.pitch * 0.5, start);

      const sylEnv = ctx.createGain();
      sylEnv.gain.setValueAtTime(0.001, start);
      sylEnv.gain.linearRampToValueAtTime(0.32, start + 0.03);
      sylEnv.gain.exponentialRampToValueAtTime(0.001, end);

      formants.forEach((f) => {
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.setValueAtTime(f.freq, start);
        bp.Q.setValueAtTime(f.q, start);

        const fGain = ctx.createGain();
        fGain.gain.setValueAtTime(f.amp, start);

        osc.connect(bp);
        subOsc.connect(bp);
        bp.connect(fGain);
        fGain.connect(sylEnv);
      });

      // Joyful bell harmonic sparkle per laugh syllable
      const bell = ctx.createOscillator();
      const bellGain = ctx.createGain();
      bell.type = 'sine';
      bell.frequency.setValueAtTime(syl.pitch * 2.5, start);
      bellGain.gain.setValueAtTime(0.001, start);
      bellGain.gain.linearRampToValueAtTime(0.08, start + 0.02);
      bellGain.gain.exponentialRampToValueAtTime(0.0001, end + 0.08);
      bell.connect(bellGain);
      bellGain.connect(targetNode);

      sylEnv.connect(targetNode);

      osc.start(start);
      subOsc.start(start);
      bell.start(start);
      osc.stop(end + 0.02);
      subOsc.stop(end + 0.02);
      bell.stop(end + 0.1);
    });
  };

  /**
   * Plays the "Happy Birthday" melody or celebratory chords via Web Audio API
   */
  const playWebAudioMelody = (
    ctx: AudioContext,
    dest: AudioNode,
    notes: Array<{ freq: number; t: number; dur: number }>
  ) => {
    const now = ctx.currentTime;
    notes.forEach((n) => {
      const start = now + n.t;
      const osc = ctx.createOscillator();
      const overtone = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.freq, start);

      overtone.type = 'sine';
      overtone.frequency.setValueAtTime(n.freq * 2, start);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.24, start + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0008, start + n.dur);

      osc.connect(gain);
      overtone.connect(gain);
      gain.connect(dest);

      osc.start(start);
      overtone.start(start);
      osc.stop(start + n.dur + 0.02);
      overtone.stop(start + n.dur + 0.02);
    });
  };

  const speakAffectionatePhrase = (
    text: string,
    speaker: 'Anik' | 'Didi' | 'Both'
  ) => {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = speaker === 'Didi' ? 1.08 : 1.02;
      utter.pitch = speaker === 'Didi' ? 1.32 : speaker === 'Anik' ? 0.96 : 1.12;
      utter.volume = 0.95;
      window.speechSynthesis.speak(utter);
    } catch {}
  };

  const handlePlayPad = async (pad: SoundSnippetPad) => {
    if (activePadId === pad.id) {
      stopCurrentPlayback();
      return;
    }

    stopCurrentPlayback();
    const { ctx, analyser } = ensureWebAudio();
    setActivePadId(pad.id);

    // 1. If user recorded a custom real-voice clip for this pad, decode & play via Web Audio API
    const customDataUrl = customAudioMap[pad.id];
    if (customDataUrl) {
      try {
        const res = await fetch(customDataUrl);
        const arrayBuf = await res.arrayBuffer();
        const audioBuffer = await ctx.decodeAudioData(arrayBuf);
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(analyser);
        activeSourceNodeRef.current = source;
        source.onended = () => {
          setActivePadId((prev) => (prev === pad.id ? null : prev));
        };
        source.start(0);
        return;
      } catch (err) {
        console.warn('Fallback to synthesized Web Audio snippet', err);
      }
    }

    // 2. Built-in Web Audio API Synthesized + Voiced Snippet
    let durationMs = 3000;

    switch (pad.id) {
      case 'anik-hbd': {
        // Classic "Happy Birthday to You" melody in C/F major via Web Audio API
        playWebAudioMelody(ctx, analyser, [
          { freq: 261.63, t: 0.0, dur: 0.25 }, // C4 "Hap-"
          { freq: 261.63, t: 0.28, dur: 0.22 }, // C4 "-py"
          { freq: 293.66, t: 0.54, dur: 0.45 }, // D4 "Birth-"
          { freq: 261.63, t: 1.04, dur: 0.45 }, // C4 "-day"
          { freq: 349.23, t: 1.54, dur: 0.45 }, // F4 "Didi!"
          { freq: 329.63, t: 2.04, dur: 0.85 }, // E4
        ]);
        speakAffectionatePhrase(
          `Happy Birthday ${girlfriendName || 'Didi'}! You are the best big sister in the world!`,
          'Anik'
        );
        durationMs = 3200;
        break;
      }
      case 'didi-laugh': {
        playFormantLaughBurst(ctx, analyser, true, 0, 0);
        speakAffectionatePhrase(
          `Hahaha! Stop it ${boyfriendName || 'Anik'}, you always make me laugh!`,
          'Didi'
        );
        durationMs = 2600;
        break;
      }
      case 'anik-laugh': {
        playFormantLaughBurst(ctx, analyser, false, 0, 0);
        speakAffectionatePhrase(
          `Haha! Remember our childhood secrets? Classic Didi!`,
          'Anik'
        );
        durationMs = 2600;
        break;
      }
      case 'didi-hbd-reply': {
        playWebAudioMelody(ctx, analyser, [
          { freq: 523.25, t: 0.0, dur: 0.3 },
          { freq: 659.25, t: 0.28, dur: 0.3 },
          { freq: 783.99, t: 0.56, dur: 0.35 },
          { freq: 1046.5, t: 0.9, dur: 0.8 },
        ]);
        speakAffectionatePhrase(
          `Aww thank you so much Bhai! This is the sweetest birthday surprise!`,
          'Didi'
        );
        durationMs = 3000;
        break;
      }
      case 'both-laugh-duet': {
        playFormantLaughBurst(ctx, analyser, true, 0, -0.45);
        playFormantLaughBurst(ctx, analyser, false, 0.14, 0.45);
        playFormantLaughBurst(ctx, analyser, true, 1.35, -0.3);
        speakAffectionatePhrase(
          `Hahaha! Happy Birthday ${girlfriendName || 'Atrayee'}! Best sibling duo forever!`,
          'Both'
        );
        durationMs = 3400;
        break;
      }
      case 'anik-queen-cheer': {
        playWebAudioMelody(ctx, analyser, [
          { freq: 392.0, t: 0.0, dur: 0.22 },
          { freq: 523.25, t: 0.24, dur: 0.22 },
          { freq: 659.25, t: 0.48, dur: 0.28 },
          { freq: 783.99, t: 0.78, dur: 0.95 },
        ]);
        speakAffectionatePhrase(
          `Hip hip hooray! Happy Birthday to the queen of our family, ${girlfriendName || 'Atrayee'} Didi!`,
          'Anik'
        );
        durationMs = 3200;
        break;
      }
    }

    activeStopTimerRef.current = window.setTimeout(() => {
      setActivePadId((prev) => (prev === pad.id ? null : prev));
    }, durationMs);
  };

  // Optional 3.5-second real microphone snippet recorder per pad
  const handleToggleRecordPad = async (pad: SoundSnippetPad) => {
    if (recordingPadId === pad.id) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      setRecordingPadId(null);
      return;
    }

    stopCurrentPlayback();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = String(reader.result || '');
          if (base64Audio) {
            setCustomAudioMap((prev) => {
              const updated = { ...prev, [pad.id]: base64Audio };
              void idbSet(SOUNDBOARD_IDB_KEY, updated);
              return updated;
            });
            setStatusNote(
              `Saved custom voice recording for "${pad.title}"! Tap the pad to hear it through the Web Audio API visualizer.`
            );
          }
        };
        reader.readAsDataURL(blob);
        setRecordingPadId(null);
      };

      mediaRecorderRef.current = recorder;
      setRecordingPadId(pad.id);
      setStatusNote(`Recording "${pad.title}" (up to 4 seconds)... Speak or laugh now!`);
      recorder.start();

      window.setTimeout(() => {
        if (recorder.state === 'recording') {
          recorder.stop();
        }
      }, 4000);
    } catch {
      setStatusNote(
        'Microphone access was not granted — playing built-in Web Audio API synthesized sibling snippets!'
      );
      setRecordingPadId(null);
    }
  };

  const handleResetCustomPad = (padId: string) => {
    setCustomAudioMap((prev) => {
      const next = { ...prev };
      delete next[padId];
      void idbSet(SOUNDBOARD_IDB_KEY, next);
      return next;
    });
    setStatusNote('Restored original Web Audio API synthesized snippet.');
  };

  return (
    <section
      id="soundboard"
      className="py-20 border-b border-stone-200/80 bg-stone-50/70"
    >
      <div className="max-w-5xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-rose-800 uppercase tracking-widest mb-2">
            <span>Chapter 09</span>
            <span aria-hidden="true">·</span>
            <span>Web Audio API Sibling Soundboard</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-stone-900 heading-3d">
            Didi & {boyfriendName || 'Anik'}'s Laugh & Birthday Soundboard
          </h2>
          <p className="mt-3 text-sm sm:text-base text-stone-600 leading-relaxed">
            Tap any pad below to trigger affectionate audio snippets of{' '}
            <strong>{girlfriendName || 'Didi'}</strong> and{' '}
            <strong>{boyfriendName || 'Anik'}</strong> laughing or wishing{' '}
            <em>"Happy Birthday!"</em> — complete with a live Web Audio API
            frequency visualizer and custom voice recording.
          </p>
        </div>

        {/* Live Web Audio API Frequency Spectrum Visualizer Deck */}
        <div className="mb-8 p-5 sm:p-6 rounded-2xl bg-white border border-stone-200/90 shadow-sm paper-texture card-3d-tilt">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                  activePadId
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'bg-stone-900 text-amber-300'
                }`}
              >
                <Radio className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-serif font-bold text-stone-900">
                  {activePadId
                    ? `Now Playing: ${
                        SNIPPET_PADS.find((p) => p.id === activePadId)?.title ||
                        'Sibling Audio Snippet'
                      }`
                    : 'Web Audio API Harmonic & Formant Synthesizer Ready'}
                </h3>
                <p className="text-xs text-stone-500">
                  {activePadId
                    ? SNIPPET_PADS.find((p) => p.id === activePadId)?.transcript
                    : 'Select any pad below to hear Didi & Anik laugh or cheer'}
                </p>
              </div>
            </div>

            {activePadId && (
              <button
                type="button"
                onClick={stopCurrentPlayback}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-colors cursor-pointer"
              >
                <Square className="w-3 h-3 fill-white" />
                <span>Stop Audio</span>
              </button>
            )}
          </div>

          <div className="w-full h-16 rounded-xl bg-stone-950/95 border border-stone-800 px-4 py-2 flex items-center justify-center overflow-hidden">
            <canvas
              ref={canvasRef}
              width={680}
              height={48}
              className="w-full h-12"
            />
          </div>

          {statusNote && (
            <p className="mt-3 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
              {statusNote}
            </p>
          )}
        </div>

        {/* 6 Interactive 3D Soundboard Pads */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 perspective-1200">
          {SNIPPET_PADS.map((pad) => {
            const isPlaying = activePadId === pad.id;
            const isRecording = recordingPadId === pad.id;
            const hasCustomVoice = Boolean(customAudioMap[pad.id]);

            return (
              <div
                key={pad.id}
                className={`rounded-2xl bg-white border p-5 flex flex-col justify-between transition-all card-3d-tilt ${
                  isPlaying
                    ? 'border-rose-400 ring-2 ring-rose-300/60'
                    : 'border-stone-200/90'
                }`}
              >
                <div>
                  {/* Speaker Badge + Duration */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${pad.badgeColor}`}
                    >
                      {pad.speaker === 'Didi' ? (
                        <Heart className="w-3 h-3 fill-current" />
                      ) : pad.speaker === 'Anik' ? (
                        <Smile className="w-3 h-3" />
                      ) : (
                        <Sparkles className="w-3 h-3" />
                      )}
                      <span>
                        {pad.speaker === 'Didi'
                          ? girlfriendName || 'Didi'
                          : pad.speaker === 'Anik'
                          ? boyfriendName || 'Anik'
                          : 'Didi & Anik'}
                      </span>
                    </span>

                    <span className="text-[11px] font-mono text-stone-400">
                      {hasCustomVoice ? 'Custom Mic Clip' : pad.durationLabel}
                    </span>
                  </div>

                  {/* Pad Title & Subtitle */}
                  <h3 className="font-serif font-bold text-lg text-stone-900 leading-snug">
                    {pad.title}
                  </h3>
                  <p className="text-xs text-stone-500 mt-1">{pad.subtitle}</p>

                  {/* Quote preview */}
                  <p className="mt-3 p-2.5 rounded-xl bg-stone-50 border border-stone-200/70 text-xs italic text-stone-700 leading-relaxed">
                    {pad.transcript}
                  </p>
                </div>

                {/* Play & Optional Mic Record Controls */}
                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => void handlePlayPad(pad)}
                    className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isPlaying
                        ? 'bg-rose-600 text-white btn-3d-rose'
                        : 'bg-stone-900 text-white hover:bg-stone-800 btn-3d-dark'
                    }`}
                  >
                    {isPlaying ? (
                      <>
                        <Volume2 className="w-3.5 h-3.5 animate-bounce" />
                        <span>Playing...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Play Snippet</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleToggleRecordPad(pad)}
                    title="Record your own real voice or laugh for this pad (saved permanently)"
                    className={`p-2.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer tile-3d-extruded ${
                      isRecording
                        ? 'bg-red-600 text-white border-red-700 animate-pulse'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border-stone-300'
                    }`}
                  >
                    <Mic className="w-3.5 h-3.5" />
                  </button>

                  {hasCustomVoice && (
                    <button
                      type="button"
                      onClick={() => handleResetCustomPad(pad.id)}
                      title="Restore default Web Audio synthesized snippet"
                      className="p-2.5 rounded-xl bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-300 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
