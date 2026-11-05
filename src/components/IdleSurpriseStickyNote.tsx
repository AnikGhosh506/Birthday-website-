import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, RefreshCw, GripHorizontal, Heart } from 'lucide-react';
import confetti from 'canvas-confetti';
import { romanticAudio } from '../utils/audioSynth';

interface IdleSurpriseStickyNoteProps {
  sisterName: string;
  senderName: string;
}

interface SurpriseNoteTheme {
  bg: string;
  border: string;
  tapeBg: string;
  pinColor: string;
  accentText: string;
}

const STICKY_THEMES: SurpriseNoteTheme[] = [
  {
    bg: 'linear-gradient(145deg, #fffbeb 0%, #fef3c7 58%, #fde68a 100%)',
    border: '#f59e0b',
    tapeBg: 'rgba(251, 191, 36, 0.38)',
    pinColor: '#e11d48',
    accentText: '#92400e',
  },
  {
    bg: 'linear-gradient(145deg, #fff1f2 0%, #ffe4e6 58%, #fecdd3 100%)',
    border: '#f43f5e',
    tapeBg: 'rgba(244, 63, 94, 0.28)',
    pinColor: '#d97706',
    accentText: '#9f1239',
  },
  {
    bg: 'linear-gradient(145deg, #ecfdf5 0%, #d1fae5 58%, #a7f3d0 100%)',
    border: '#10b981',
    tapeBg: 'rgba(16, 185, 129, 0.28)',
    pinColor: '#e11d48',
    accentText: '#065f46',
  },
  {
    bg: 'linear-gradient(145deg, #f5f3ff 0%, #ede9fe 58%, #ddd6fe 100%)',
    border: '#8b5cf6',
    tapeBg: 'rgba(139, 92, 246, 0.28)',
    pinColor: '#f59e0b',
    accentText: '#5b21b6',
  },
];

const IDLE_TIMEOUT_MS = 30000; // 30 seconds of idle time

export const IdleSurpriseStickyNote: React.FC<IdleSurpriseStickyNoteProps> = ({
  sisterName = 'Atrayee',
  senderName = 'Anik',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [noteIndex, setNoteIndex] = useState(0);
  const [themeIndex, setThemeIndex] = useState(0);
  const [tiltAngle, setTiltAngle] = useState(-3);
  const [position, setPosition] = useState<{ x: number; y: number }>({
    x: 80,
    y: 120,
  });
  const [hoverTilt, setHoverTilt] = useState<{ rx: number; ry: number }>({
    rx: 0,
    ry: 0,
  });

  const isVisibleRef = useRef(isVisible);
  isVisibleRef.current = isVisible;

  const idleTimerRef = useRef<number | null>(null);

  const surpriseMessages = [
    `Hey ${sisterName} Didi! Just a little surprise note while you're taking a breather — you are the best older sister in the universe! Happy Birthday! ❤️`,
    `Psst, ${sisterName}! No matter how busy NIT or Bangalore gets, remember your little bro is always cheering for you 24/7! ✨`,
    `Surprise 3D Note! Thank you for every piece of advice, every laugh, and for always having my back. Have the happiest 28th May ever! 🎂`,
    `Oii Didi! Don't forget you still owe me a grand Kali Puja & birthday treat! Wishing you endless success and happiness! 🌟`,
    `Little reminder for ${sisterName}: Your smile lights up our whole family. May all your biggest dreams come true this year! 💫`,
    `Caught you pausing! Here is a pocket-sized birthday hug from ${senderName}. Drag me anywhere on the screen as your lucky charm! 🍀`,
  ];

  const spawnRandomStickyNote = useCallback(() => {
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 768;

    const cardWidth = 280;
    const cardHeight = 250;

    const minX = 24;
    const maxX = Math.max(minX + 20, vw - cardWidth - 36);
    const minY = 88;
    const maxY = Math.max(minY + 20, vh - cardHeight - 80);

    const randomX = Math.floor(minX + Math.random() * (maxX - minX));
    const randomY = Math.floor(minY + Math.random() * (maxY - minY));
    const randomTilt = Number(((Math.random() - 0.5) * 8).toFixed(1));

    setPosition({ x: randomX, y: randomY });
    setTiltAngle(randomTilt);
    setNoteIndex((prev) => (prev + 1) % surpriseMessages.length);
    setThemeIndex((prev) => (prev + 1) % STICKY_THEMES.length);
    setIsVisible(true);

    romanticAudio.playCelebrationChime();
  }, [surpriseMessages.length]);

  // Reset the 30-second idle timer whenever user interacts (only while note is hidden)
  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current !== null) {
      window.clearTimeout(idleTimerRef.current);
    }
    if (isVisibleRef.current) {
      return;
    }
    idleTimerRef.current = window.setTimeout(() => {
      if (!isVisibleRef.current) {
        spawnRandomStickyNote();
      }
    }, IDLE_TIMEOUT_MS);
  }, [spawnRandomStickyNote]);

  useEffect(() => {
    resetIdleTimer();

    const activityEvents: Array<keyof WindowEventMap> = [
      'mousemove',
      'mousedown',
      'keydown',
      'touchstart',
      'scroll',
      'wheel',
      'pointerdown',
    ];

    const handleUserActivity = () => {
      if (!isVisibleRef.current) {
        resetIdleTimer();
      }
    };

    activityEvents.forEach((evt) => {
      window.addEventListener(evt, handleUserActivity, { passive: true });
    });

    return () => {
      if (idleTimerRef.current !== null) {
        window.clearTimeout(idleTimerRef.current);
      }
      activityEvents.forEach((evt) => {
        window.removeEventListener(evt, handleUserActivity);
      });
    };
  }, [resetIdleTimer]);

  const handleCloseNote = () => {
    romanticAudio.playSoftClick();
    setIsVisible(false);
    isVisibleRef.current = false;
    resetIdleTimer();
  };

  const handleShuffleMessage = (e: React.MouseEvent) => {
    e.stopPropagation();
    romanticAudio.playCelebrationChime();
    confetti({
      particleCount: 28,
      spread: 55,
      origin: {
        x: Math.min(0.9, Math.max(0.1, (position.x + 130) / (window.innerWidth || 1000))),
        y: Math.min(0.9, Math.max(0.1, (position.y + 110) / (window.innerHeight || 800))),
      },
    });
    setNoteIndex((prev) => (prev + 1) % surpriseMessages.length);
    setThemeIndex((prev) => (prev + 1) % STICKY_THEMES.length);
  };

  const handleMouseMove3D = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    setHoverTilt({
      rx: Number((-ny * 9).toFixed(2)),
      ry: Number((nx * 9).toFixed(2)),
    });
  };

  const handleMouseLeave3D = () => {
    setHoverTilt({ rx: 0, ry: 0 });
  };

  const currentTheme = STICKY_THEMES[themeIndex % STICKY_THEMES.length];
  const currentMessage = surpriseMessages[noteIndex % surpriseMessages.length];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="idle-surprise-sticky-note"
          drag
          dragMomentum={false}
          initial={{
            opacity: 0,
            scale: 0.5,
            x: position.x,
            y: position.y - 30,
            rotateZ: tiltAngle - 8,
          }}
          animate={{
            opacity: 1,
            scale: 1,
            x: position.x,
            y: position.y,
            rotateZ: tiltAngle,
          }}
          exit={{
            opacity: 0,
            scale: 0.6,
            transition: { duration: 0.22 },
          }}
          whileDrag={{
            scale: 1.06,
            rotateZ: 0,
            boxShadow: '0 28px 50px -12px rgba(28, 25, 23, 0.42)',
          }}
          transition={{
            type: 'spring',
            stiffness: 260,
            damping: 20,
          }}
          onMouseMove={handleMouseMove3D}
          onMouseLeave={handleMouseLeave3D}
          style={{
            perspective: 900,
            transformStyle: 'preserve-3d',
          }}
          className="fixed top-0 left-0 z-50 w-68 sm:w-72 cursor-grab active:cursor-grabbing select-none"
        >
          <div
            style={{
              background: currentTheme.bg,
              borderColor: currentTheme.border,
              transform: `rotateX(${hoverTilt.rx}deg) rotateY(${hoverTilt.ry}deg)`,
              boxShadow:
                '0 18px 34px -8px rgba(28, 25, 23, 0.28), 0 6px 0 0 rgba(180, 140, 80, 0.22), inset 0 1px 0 0 rgba(255,255,255,0.8)',
            }}
            className="relative rounded-2xl border-2 p-5 transition-transform duration-150"
          >
            {/* 3D Translucent Washi Tape & Metallic Pushpin at Top Center */}
            <div
              style={{
                backgroundColor: currentTheme.tapeBg,
                transform: 'translateX(-50%) rotate(-2deg) translateZ(14px)',
              }}
              className="absolute -top-3 left-1/2 w-24 h-6 rounded-sm backdrop-blur-xs border border-white/50 flex items-center justify-center shadow-xs pointer-events-none"
            >
              <div
                style={{ backgroundColor: currentTheme.pinColor }}
                className="w-4 h-4 rounded-full border-2 border-white shadow-md flex items-center justify-center"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-white/80" />
              </div>
            </div>

            {/* Top Header Row: Drag Handle + Idle Surprise Badge + Close Button */}
            <div className="flex items-center justify-between gap-2 mt-1 mb-2.5">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/80 border border-stone-300/70 text-[10px] font-bold uppercase tracking-wider text-stone-700 shadow-2xs">
                <GripHorizontal className="w-3 h-3 text-stone-400" />
                <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
                <span>Surprise Note</span>
              </div>

              <button
                type="button"
                onClick={handleCloseNote}
                onPointerDown={(e) => e.stopPropagation()}
                title="Dismiss Sticky Note"
                aria-label="Dismiss Sticky Note"
                className="w-6 h-6 rounded-full bg-white/80 hover:bg-rose-600 text-stone-600 hover:text-white border border-stone-300/80 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Sweet Surprise Birthday Message */}
            <div
              style={{ transform: 'translateZ(10px)' }}
              className="my-2 text-sm font-serif font-medium text-stone-900 leading-relaxed"
            >
              &ldquo;{currentMessage}&rdquo;
            </div>

            {/* Sender Signature & Interactive Footer Controls */}
            <div className="mt-3.5 pt-2.5 border-t border-stone-900/10 flex items-center justify-between gap-2">
              <div
                style={{ color: currentTheme.accentText }}
                className="text-xs font-serif font-bold italic flex items-center gap-1"
              >
                <Heart className="w-3 h-3 fill-rose-500 text-rose-500 animate-pulse" />
                <span>— {senderName}</span>
              </div>

              <button
                type="button"
                onClick={handleShuffleMessage}
                onPointerDown={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/90 hover:bg-white text-stone-800 border border-stone-300/80 text-[11px] font-semibold shadow-2xs transition-all cursor-pointer"
                title="Read another surprise birthday note"
              >
                <RefreshCw className="w-3 h-3 text-rose-600" />
                <span>Another Note</span>
              </button>
            </div>

            {/* Drag Hint Caption */}
            <div className="mt-2 text-[10px] text-stone-500/90 text-center font-sans">
              Drag me anywhere on the screen ✨
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
