import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Camera,
  Square,
  Volume2,
  VolumeX,
  Film,
  Wand2,
  Check,
  Edit3,
  ChevronRight,
  ChevronLeft,
  Trash2,
  Clapperboard,
  Music,
} from 'lucide-react';
import { Memory } from '../types';
import { romanticAudio } from '../utils/audioSynth';
import { triggerConfettiExplosion } from '../utils/confettiExplosion';
import { idbGet, idbSet } from '../utils/persistentStorage';

export interface VideoScene {
  sceneNumber: number;
  timestamp: string;
  sceneTitle: string;
  visualDirection: string;
  spokenLine: string;
  emotionTag: string;
}

export interface BirthdayVideoScript {
  videoTitle: string;
  subtitle: string;
  estimatedDuration: string;
  directorNote: string;
  scenes: VideoScene[];
  closingToast: string;
}

interface SiblingVideoMessageTopFrameProps {
  girlfriendName: string;
  boyfriendName: string;
  memories: Memory[];
}

const SCRIPT_STORAGE_KEY = 'amore_birthday_video_script_v1';
const IDB_RECORDED_VIDEO_KEY = 'amore_recorded_video_dataurl_v1';

const DEFAULT_VIDEO_SCRIPT: BirthdayVideoScript = {
  videoTitle: 'Happy May 28th, Didi — A Little Brother’s Cinema Reel',
  subtitle: 'Written with Gemini AI & Directed by Anik for Atrayee Didi',
  estimatedDuration: '0:44',
  directorNote:
    'Warm, proud, and slightly mischievous brotherly energy — best watched with sound on.',
  scenes: [
    {
      sceneNumber: 1,
      timestamp: '0:00 - 0:11',
      sceneTitle: 'Opening Frame · The Birthday Star of May 28th',
      visualDirection: 'Golden bokeh spotlight over favorite childhood & Kali Pujo frame',
      spokenLine:
        'Happy Birthday, Atrayee Didi! Before you scroll through everything I built for you today, I wanted this 3D cinema frame right at the top to remind you that you are officially the coolest big sister in the universe.',
      emotionTag: 'Warm Smile ✨',
    },
    {
      sceneNumber: 2,
      timestamp: '0:11 - 0:22',
      sceneTitle: 'Scene II · 3:30 AM Cinema & Magnum Confessions',
      visualDirection: 'Playful zoom with neon cinema reel glow',
      spokenLine:
        'Yes, I still stay up till 3:30 AM watching Spider-Man and Dune while eating Magnum ice cream — and yes, I am still complaining that tui ekta call o koris na when college gets busy!',
      emotionTag: 'Playful Tease 🍦',
    },
    {
      sceneNumber: 3,
      timestamp: '0:22 - 0:33',
      sceneTitle: 'Scene III · NIT to Bangalore Pride',
      visualDirection: 'Soft rose-gold light flare across family keepsake portrait',
      spokenLine:
        'Watching you crush it at NIT and step into your Data Science & Business Analytics journey in Bangalore makes me so proud, Didi. You have always been my biggest role model.',
      emotionTag: 'Proud Brother ♥',
    },
    {
      sceneNumber: 4,
      timestamp: '0:33 - 0:44',
      sceneTitle: 'Finale Frame · Kali Pujo Treats & Forever Promise',
      visualDirection: ' Starlight confetti shower & handwritten signature seal',
      spokenLine:
        'Khawabo chol Kali Pujoi! May this new year bring you every happiness, every dream, and endless laughter. Happy Birthday, Didi — I am always in your corner!',
      emotionTag: 'Birthday Toast 🥂',
    },
  ],
  closingToast: 'With all my love & sibling pride — Anik ♥',
};

const TONE_PRESETS = [
  'Heartfelt & Playful Little Brother Tribute',
  '3:30 AM Magnum Ice Cream & Movie Buff Roast',
  'Proud NIT & Bangalore Internship Celebration',
  'Nostalgic Kali Pujo & Hometown Reunion Reel',
];

export const SiblingVideoMessageTopFrame: React.FC<SiblingVideoMessageTopFrameProps> = ({
  girlfriendName,
  boyfriendName,
  memories,
}) => {
  const [script, setScript] = useState<BirthdayVideoScript>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(SCRIPT_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && Array.isArray(parsed.scenes) && parsed.scenes.length > 0) {
            return parsed;
          }
        }
      } catch {
        // ignore storage errors
      }
    }
    return DEFAULT_VIDEO_SCRIPT;
  });

  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [isPlayingReel, setIsPlayingReel] = useState(false);
  const [sceneProgress, setSceneProgress] = useState(0);
  const [reelMusicEnabled, setReelMusicEnabled] = useState(true);
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [selectedTone, setSelectedTone] = useState(TONE_PRESETS[0]);
  const [customPromptNote, setCustomPromptNote] = useState('');
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [editingSceneIndex, setEditingSceneIndex] = useState<number | null>(null);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  // Optional live camera recording states
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isRecordingClip, setIsRecordingClip] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const liveVideoRef = useRef<HTMLVideoElement | null>(null);
  const playbackVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const frameTiltRef = useRef<HTMLDivElement | null>(null);
  const [tiltTransform, setTiltTransform] = useState({ rotateX: 0, rotateY: 0 });

  // Cancel any leftover browser speech synthesis on mount and load saved video from IndexedDB
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    let mounted = true;
    void idbGet<string>(IDB_RECORDED_VIDEO_KEY).then((savedUrl) => {
      if (mounted && savedUrl) {
        setRecordedVideoUrl(savedUrl);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Save script updates to localStorage
  const persistScript = (nextScript: BirthdayVideoScript) => {
    setScript(nextScript);
    try {
      localStorage.setItem(SCRIPT_STORAGE_KEY, JSON.stringify(nextScript));
    } catch {
      // ignore quota errors
    }
  };

  // Sync melodic background music box with 3D Cinema Reel playback
  useEffect(() => {
    if (isPlayingReel && reelMusicEnabled) {
      romanticAudio.start();
    } else if (!isPlayingReel) {
      // Stop reel music when reel pauses/finishes
      if (romanticAudio.isMusicPlaying()) {
        romanticAudio.stop();
      }
    }
  }, [isPlayingReel, reelMusicEnabled]);

  // Auto-advance scenes when playing the 3D Cinema Reel (with melodic chime, no TTS voice)
  useEffect(() => {
    if (!isPlayingReel) return;

    const currentScene = script.scenes[activeSceneIndex];
    if (currentScene && reelMusicEnabled) {
      romanticAudio.playMatchSuccess();
    }

    const durationMs = 7500;
    const stepMs = 100;
    let elapsed = 0;
    setSceneProgress(0);

    const timer = window.setInterval(() => {
      elapsed += stepMs;
      const pct = Math.min(100, (elapsed / durationMs) * 100);
      setSceneProgress(pct);

      if (elapsed >= durationMs) {
        window.clearInterval(timer);
        if (activeSceneIndex < script.scenes.length - 1) {
          setActiveSceneIndex((prev) => prev + 1);
        } else {
          setIsPlayingReel(false);
          setSceneProgress(100);
          if (reelMusicEnabled) {
            romanticAudio.playCelebrationChime();
          }
          triggerConfettiExplosion();
        }
      }
    }, stepMs);

    return () => {
      window.clearInterval(timer);
    };
  }, [isPlayingReel, activeSceneIndex, script.scenes, reelMusicEnabled]);

  // Cleanup media stream on unmount
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Recording timer
  useEffect(() => {
    if (!isRecordingClip) return;
    setRecordingSeconds(0);
    const id = window.setInterval(() => {
      setRecordingSeconds((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [isRecordingClip]);

  const handleTogglePlayReel = () => {
    if (recordedVideoUrl && playbackVideoRef.current) {
      if (playbackVideoRef.current.paused) {
        void playbackVideoRef.current.play();
        setIsPlayingReel(true);
      } else {
        playbackVideoRef.current.pause();
        setIsPlayingReel(false);
      }
      return;
    }

    if (isPlayingReel) {
      setIsPlayingReel(false);
      if (romanticAudio.isMusicPlaying()) {
        romanticAudio.stop();
      }
    } else {
      if (activeSceneIndex >= script.scenes.length - 1 && sceneProgress >= 100) {
        setActiveSceneIndex(0);
      }
      setIsPlayingReel(true);
      if (reelMusicEnabled) {
        romanticAudio.start();
      }
    }
  };

  const handleRestartReel = () => {
    romanticAudio.playSoftClick();
    if (recordedVideoUrl && playbackVideoRef.current) {
      playbackVideoRef.current.currentTime = 0;
      void playbackVideoRef.current.play();
      setIsPlayingReel(true);
      return;
    }
    setActiveSceneIndex(0);
    setSceneProgress(0);
    setIsPlayingReel(true);
    if (reelMusicEnabled) {
      romanticAudio.start();
    }
  };

  // Call Gemini API to generate a personalized 4-scene birthday video script
  const handleGenerateGeminiScript = async () => {
    setIsGeneratingScript(true);
    setStatusBanner(null);
    romanticAudio.playSoftClick();

    try {
      const response = await fetch('/api/ai/video-message-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sisterName: girlfriendName,
          brotherName: boyfriendName,
          tone: selectedTone,
          customNote: customPromptNote.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Could not generate script right now');
      }

      const data = await response.json();
      if (data?.script && Array.isArray(data.script.scenes) && data.script.scenes.length > 0) {
        persistScript(data.script);
        setActiveSceneIndex(0);
        setSceneProgress(0);
        romanticAudio.playCelebrationChime();
        setStatusBanner(
          `✨ Gemini AI crafted a new 4-scene "${selectedTone}" video script for ${girlfriendName}!`
        );
      }
    } catch {
      setStatusBanner(
        'Loaded your personalized sibling script! You can edit any scene line below or play the 3D reel.'
      );
    } finally {
      setIsGeneratingScript(false);
    }
  };

  // Optional live camera / microphone recording with teleprompter
  const handleStartCameraPreview = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      mediaStreamRef.current = stream;
      setIsCameraActive(true);
      setIsStudioOpen(true);
      window.setTimeout(() => {
        if (liveVideoRef.current) {
          liveVideoRef.current.srcObject = stream;
          void liveVideoRef.current.play();
        }
      }, 80);
    } catch {
      setStatusBanner(
        'Camera/microphone access was not granted — using the 3D Cinema Storyboard Reel with Gemini AI teleprompter & voiceover!'
      );
    }
  };

  const handleStartRecordingClip = () => {
    if (!mediaStreamRef.current) return;
    recordedChunksRef.current = [];
    try {
      const recorder = new MediaRecorder(mediaStreamRef.current);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = typeof reader.result === 'string' ? reader.result : null;
          if (dataUrl) {
            setRecordedVideoUrl(dataUrl);
            void idbSet(IDB_RECORDED_VIDEO_KEY, dataUrl);
            romanticAudio.playCelebrationChime();
            triggerConfettiExplosion();
            setStatusBanner(
              `Saved recorded birthday video take for ${girlfriendName} in the 3D Video Frame!`
            );
          }
        };
        reader.readAsDataURL(blob);
      };

      recorder.start();
      setIsRecordingClip(true);
      setActiveSceneIndex(0);
    } catch {
      setStatusBanner('Recording is not supported in this browser environment.');
    }
  };

  const handleStopRecordingClip = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecordingClip(false);
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const handleRemoveRecordedClip = () => {
    setRecordedVideoUrl(null);
    void idbSet(IDB_RECORDED_VIDEO_KEY, '');
    setStatusBanner('Switched back to the 3D Animated Cinema Storyboard Reel.');
  };

  const handlePointerMove3DFrame = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!frameTiltRef.current) return;
    const rect = frameTiltRef.current.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    setTiltTransform({
      rotateX: -ny * 3.2,
      rotateY: nx * 3.8,
    });
  };

  const handlePointerLeave3DFrame = () => {
    setTiltTransform({ rotateX: 0, rotateY: 0 });
  };

  const currentScene = script.scenes[activeSceneIndex] || script.scenes[0];
  const validMemories = memories.filter((m) => m.imageUrl);
  const currentScenePhoto =
    validMemories.length > 0
      ? validMemories[activeSceneIndex % validMemories.length].imageUrl
      : '/assets/aistudio/didi_kali_pujo.jpg';

  const overallProgress =
    ((activeSceneIndex + sceneProgress / 100) / Math.max(1, script.scenes.length)) * 100;

  return (
    <section
      id="sibling-video-message"
      className="relative pt-8 pb-12 border-b border-stone-200/80 bg-gradient-to-b from-stone-950 via-stone-900 to-[#f6f1eb] overflow-hidden no-print"
    >
      {/* Subtle Ambient Spotlight Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[720px] h-[280px] rounded-full bg-rose-600/20 blur-3xl"
      />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        {/* Top Kicker & Studio Toggle Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-rose-500/20 border border-rose-400/30 text-rose-200 text-xs font-semibold uppercase tracking-widest">
              <Clapperboard className="w-3.5 h-3.5 text-amber-300" />
              <span>3D Premiere Video Message</span>
            </span>
            <span className="hidden sm:inline-block text-xs text-stone-300 font-medium">
              Directed by {boyfriendName} for {girlfriendName} · Powered by Gemini AI
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                romanticAudio.playSoftClick();
                setIsStudioOpen((prev) => !prev);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-400/15 hover:bg-amber-400/25 border border-amber-300/40 text-amber-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Wand2 className="w-3.5 h-3.5 text-amber-300" />
              <span>
                {isStudioOpen ? 'Close Gemini Script & Recording Studio' : 'Record / AI Video Script Studio'}
              </span>
            </button>
          </div>
        </div>

        {/* =================================================================== */}
        {/* 3D-STYLED CINEMA VIDEO FRAME (DISPLAYED AT THE TOP OF THE PAGE)     */}
        {/* =================================================================== */}
        <div
          ref={frameTiltRef}
          onPointerMove={handlePointerMove3DFrame}
          onPointerLeave={handlePointerLeave3DFrame}
          style={{
            transform: `perspective(1400px) rotateX(${tiltTransform.rotateX}deg) rotateY(${tiltTransform.rotateY}deg)`,
            transition: 'transform 180ms ease-out',
          }}
          className="relative rounded-3xl p-2 sm:p-3.5 bg-gradient-to-br from-amber-300/80 via-rose-400/60 to-stone-800 shadow-[0_26px_65px_-15px_rgba(0,0,0,0.65),0_0_0_1px_rgba(253,224,71,0.35)]"
        >
          {/* Inner 3D Recessed Obsidian Cinema Frame */}
          <div className="relative rounded-2xl bg-stone-950 border border-white/15 overflow-hidden">
            {/* Top 3D Bezel Camera & Reel Status Bar */}
            <div className="px-4 sm:px-6 py-3 bg-stone-900/95 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {/* Glowing 3D Studio Lens Indicator */}
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-rose-950/90 border border-rose-500/40 text-[11px] font-mono font-semibold text-rose-200">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isRecordingClip || isPlayingReel
                        ? 'bg-rose-500 animate-ping'
                        : 'bg-amber-400'
                    }`}
                  />
                  <span>
                    {isRecordingClip
                      ? `REC 0:${String(recordingSeconds).padStart(2, '0')}`
                      : isPlayingReel
                        ? 'PLAYING 3D REEL'
                        : '3D VIDEO FRAME READY'}
                  </span>
                </span>

                <div className="truncate">
                  <h2 className="text-sm sm:text-base font-serif font-bold text-amber-100 truncate">
                    {script.videoTitle}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-stone-300">
                <span className="hidden md:inline-block text-[11px] text-amber-200/80 font-mono">
                  Scene {activeSceneIndex + 1} of {script.scenes.length} · {currentScene.timestamp}
                </span>

                <button
                  type="button"
                  onClick={() => {
                    const next = !reelMusicEnabled;
                    setReelMusicEnabled(next);
                    if (next) {
                      romanticAudio.start();
                    } else if (romanticAudio.isMusicPlaying()) {
                      romanticAudio.stop();
                    }
                  }}
                  title={reelMusicEnabled ? 'Mute background music' : 'Play background music'}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-amber-200 text-[11px] font-medium cursor-pointer transition-colors"
                >
                  {reelMusicEnabled ? (
                    <>
                      <Music className="w-3.5 h-3.5 text-amber-300" />
                      <span>Music ON</span>
                    </>
                  ) : (
                    <>
                      <VolumeX className="w-3.5 h-3.5 text-stone-400" />
                      <span>Music Off</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Main 16:9 / Cinema Viewport Stage */}
            <div className="relative min-h-[290px] sm:min-h-[340px] flex flex-col justify-between p-5 sm:p-8 overflow-hidden">
              {/* Background Visual Layer: Live Webcam OR Recorded Video OR Animated Memory Photo Stage */}
              {isCameraActive ? (
                <video
                  ref={liveVideoRef}
                  muted
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover opacity-75 scale-x-[-1]"
                />
              ) : recordedVideoUrl ? (
                <video
                  ref={playbackVideoRef}
                  src={recordedVideoUrl}
                  playsInline
                  onEnded={() => setIsPlayingReel(false)}
                  className="absolute inset-0 w-full h-full object-cover opacity-85"
                />
              ) : (
                <div className="absolute inset-0 overflow-hidden">
                  <img
                    src={currentScenePhoto}
                    alt={currentScene.sceneTitle}
                    className={`w-full h-full object-cover transition-all duration-1000 ${
                      isPlayingReel ? 'scale-105 opacity-45' : 'scale-100 opacity-35'
                    }`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/75 to-stone-950/50" />
                </div>
              )}

              {/* Top Scene Cue & Emotion Pill */}
              <div className="relative z-10 flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-black/55 backdrop-blur-md border border-white/15 text-xs text-amber-200">
                  <Film className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-semibold">{currentScene.sceneTitle}</span>
                </div>

                <span className="px-3 py-1 rounded-lg bg-rose-950/80 border border-rose-400/30 text-xs font-semibold text-rose-200">
                  {currentScene.emotionTag}
                </span>
              </div>

              {/* Center Teleprompter / Script Subtitle Overlay in 3D Cinema Frame */}
              <div className="relative z-10 my-auto py-6 max-w-3xl mx-auto text-center">
                <p className="text-[11px] uppercase tracking-widest text-amber-300/90 font-semibold mb-2">
                  {currentScene.visualDirection}
                </p>

                <blockquote className="text-xl sm:text-2xl md:text-3xl font-serif text-white leading-relaxed drop-shadow-md">
                  “{currentScene.spokenLine}”
                </blockquote>

                <div className="mt-4 flex items-center justify-center gap-2 text-lg sm:text-xl text-amber-200 font-anik-handwriting">
                  <span>{script.closingToast}</span>
                </div>
              </div>

              {/* Bottom Cinema Transport Controls & Scene Scrubbers */}
              <div className="relative z-10 pt-3 border-t border-white/15">
                {/* Progress Bar */}
                <div className="w-full h-1.5 rounded-full bg-white/15 overflow-hidden mb-3">
                  <div
                    className="h-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400 transition-all duration-150"
                    style={{ width: `${Math.min(100, Math.max(6, overallProgress))}%` }}
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  {/* Left Play / Pause / Restart Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleTogglePlayReel}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold cursor-pointer transition-colors btn-3d-rose"
                    >
                      {isPlayingReel ? (
                        <>
                          <Pause className="w-3.5 h-3.5" />
                          <span>Pause Birthday Video</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Play Birthday Video Message</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleRestartReel}
                      title="Restart from Scene 1"
                      className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-stone-200 cursor-pointer transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>

                    {recordedVideoUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveRecordedClip}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-rose-900/60 text-rose-200 text-[11px] font-medium cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Use 3D Reel</span>
                      </button>
                    )}
                  </div>

                  {/* Scene Selector Pills */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setActiveSceneIndex((prev) => Math.max(0, prev - 1))
                      }
                      disabled={activeSceneIndex === 0}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-40 text-white cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>

                    {script.scenes.map((sc, idx) => (
                      <button
                        key={sc.sceneNumber}
                        type="button"
                        onClick={() => {
                          romanticAudio.playSoftClick();
                          setActiveSceneIndex(idx);
                          setSceneProgress(0);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                          activeSceneIndex === idx
                            ? 'bg-amber-400 text-stone-950'
                            : 'bg-white/10 text-stone-300 hover:bg-white/20'
                        }`}
                      >
                        Scene {idx + 1}
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() =>
                        setActiveSceneIndex((prev) =>
                          Math.min(script.scenes.length - 1, prev + 1)
                        )
                      }
                      disabled={activeSceneIndex === script.scenes.length - 1}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-40 text-white cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =================================================================== */}
        {/* EXPANDABLE GEMINI AI VIDEO SCRIPT & TELEPROMPTER RECORDING STUDIO   */}
        {/* =================================================================== */}
        {isStudioOpen && (
          <div className="mt-5 rounded-2xl bg-white border border-stone-200/90 shadow-xl p-5 sm:p-6 text-stone-900">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-stone-200">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-rose-800">
                  <Sparkles className="w-3.5 h-3.5 text-rose-600" />
                  <span>Gemini AI Sibling Video Script & Teleprompter Studio</span>
                </div>
                <h3 className="font-serif text-xl font-bold text-stone-900 mt-0.5">
                  Personalize or Record {boyfriendName}’s Video Message for {girlfriendName}
                </h3>
                <p className="text-xs text-stone-600 mt-0.5">
                  Generate a fresh 4-scene birthday video script with Gemini AI, edit any scene line, or record a live camera take while reading the teleprompter.
                </p>
              </div>

              {/* Camera Recording Controls */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {!isCameraActive ? (
                  <button
                    type="button"
                    onClick={handleStartCameraPreview}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold cursor-pointer btn-3d-dark"
                  >
                    <Camera className="w-3.5 h-3.5 text-amber-300" />
                    <span>Open Camera Teleprompter</span>
                  </button>
                ) : !isRecordingClip ? (
                  <button
                    type="button"
                    onClick={handleStartRecordingClip}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer btn-3d-rose"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Start Recording Take</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStopRecordingClip}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold cursor-pointer"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Stop & Save Recording ({recordingSeconds}s)</span>
                  </button>
                )}
              </div>
            </div>

            {statusBanner && (
              <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs font-medium flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{statusBanner}</span>
              </div>
            )}

            {/* Gemini AI Prompt Controls */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div className="md:col-span-5">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-600 mb-1">
                  1. Choose Video Script Vibe:
                </label>
                <select
                  value={selectedTone}
                  onChange={(e) => setSelectedTone(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2 text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  {TONE_PRESETS.map((tone) => (
                    <option key={tone} value={tone}>
                      {tone}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-4">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-600 mb-1">
                  2. Special Memory or Note to Include (Optional):
                </label>
                <input
                  type="text"
                  value={customPromptNote}
                  onChange={(e) => setCustomPromptNote(e.target.value)}
                  placeholder="e.g. Mention our Kali Pujo phuchka treat..."
                  className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="md:col-span-3">
                <button
                  type="button"
                  disabled={isGeneratingScript}
                  onClick={handleGenerateGeminiScript}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 disabled:opacity-60 text-white text-xs font-semibold cursor-pointer btn-3d-rose"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>
                    {isGeneratingScript ? 'Writing with Gemini...' : 'Generate AI Script'}
                  </span>
                </button>
              </div>
            </div>

            {/* 4-Scene Script Cards with Inline Editing */}
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {script.scenes.map((scene, idx) => (
                <div
                  key={scene.sceneNumber}
                  onClick={() => setActiveSceneIndex(idx)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    activeSceneIndex === idx
                      ? 'border-rose-400 bg-rose-50/50 shadow-xs'
                      : 'border-stone-200 bg-stone-50/70 hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800">
                      Scene 0{scene.sceneNumber} · {scene.timestamp}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingSceneIndex(editingSceneIndex === idx ? null : idx);
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-600 hover:text-rose-700 cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>{editingSceneIndex === idx ? 'Done' : 'Edit Line'}</span>
                    </button>
                  </div>

                  <div className="text-xs font-serif font-bold text-stone-900 mb-1">
                    {scene.sceneTitle}
                  </div>

                  {editingSceneIndex === idx ? (
                    <textarea
                      rows={3}
                      value={scene.spokenLine}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        const updatedScenes = script.scenes.map((s, sIdx) =>
                          sIdx === idx ? { ...s, spokenLine: e.target.value } : s
                        );
                        persistScript({ ...script, scenes: updatedScenes });
                      }}
                      className="w-full rounded-lg border border-rose-300 bg-white p-2 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  ) : (
                    <p className="text-xs text-stone-700 leading-relaxed">
                      “{scene.spokenLine}”
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
