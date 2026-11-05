import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Sparkles, X } from 'lucide-react';
import { romanticAudio } from '../utils/audioSynth';

export interface FireworksShowCanvasProps {
  sisterName?: string;
  triggerCount: number;
  onReturnHome?: () => void;
}

type ShellPattern = 'peony' | 'heart' | 'double-ring' | 'willow';

interface FireworkRocket {
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetY: number;
  color: string;
  pattern: ShellPattern;
  trail: Array<{ x: number; y: number }>;
}

interface FireworkSpark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  secondaryColor: string;
  alpha: number;
  decay: number;
  gravity: number;
  drag: number;
  size: number;
  strobe: boolean;
  trail: Array<{ x: number; y: number }>;
}

interface SkyFlash {
  x: number;
  y: number;
  radius: number;
  color: string;
  alpha: number;
}

const FIREWORK_PALETTES = [
  ['#FFD700', '#FDE047', '#FFFBEB'], // Sunrise Champagne Gold
  ['#F43F5E', '#FB7185', '#FFE4E6'], // Ruby & Blush Rose
  ['#A855F7', '#C084FC', '#F3E8FF'], // Celestial Violet
  ['#10B981', '#6EE7B7', '#ECFDF5'], // Emerald Starlight
  ['#F97316', '#FDBA74', '#FFF7ED'], // Sunset Coral Amber
  ['#38BDF8', '#BAE6FD', '#F0F9FF'], // Diamond Sky Blue
];

export function triggerGlobalFireworksShow() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('trigger-birthday-fireworks'));
  }
}

export const FireworksShowCanvas: React.FC<FireworksShowCanvasProps> = ({
  sisterName = 'Atrayee',
  triggerCount,
  onReturnHome,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [tapBurstCount, setTapBurstCount] = useState(0);
  const [showNonce, setShowNonce] = useState(0);

  const rocketsRef = useRef<FireworkRocket[]>([]);
  const sparksRef = useRef<FireworkSpark[]>([]);
  const flashesRef = useRef<SkyFlash[]>([]);

  const detonateAtPoint = useCallback(
    (x: number, y: number, forcedPattern?: ShellPattern, forcedColor?: string) => {
      romanticAudio.playFireworkBurst();

      const patterns: ShellPattern[] = ['peony', 'heart', 'double-ring', 'willow'];
      const pattern =
        forcedPattern || patterns[Math.floor(Math.random() * patterns.length)];
      const palette =
        (forcedColor && FIREWORK_PALETTES.find((p) => p[0] === forcedColor)) ||
        FIREWORK_PALETTES[Math.floor(Math.random() * FIREWORK_PALETTES.length)];

      flashesRef.current.push({
        x,
        y,
        radius: 230,
        color: palette[0],
        alpha: 0.48,
      });

      if (pattern === 'heart') {
        const count = 96;
        for (let i = 0; i < count; i++) {
          const t = (i / count) * Math.PI * 2;
          const hx = 16 * Math.pow(Math.sin(t), 3);
          const hy = -(
            13 * Math.cos(t) -
            5 * Math.cos(2 * t) -
            2 * Math.cos(3 * t) -
            Math.cos(4 * t)
          );
          const scale = 0.28 + Math.random() * 0.05;
          sparksRef.current.push({
            x,
            y,
            vx: hx * scale,
            vy: hy * scale,
            color: '#F43F5E',
            secondaryColor: '#FDE047',
            alpha: 1,
            decay: 0.011 + Math.random() * 0.006,
            gravity: 0.045,
            drag: 0.968,
            size: 2.7,
            strobe: i % 4 === 0,
            trail: [],
          });
        }
      } else if (pattern === 'double-ring') {
        const ringCount = 54;
        for (let ring = 1; ring <= 2; ring++) {
          const speed = ring === 1 ? 3.5 : 6.6;
          const col = ring === 1 ? '#FDE047' : palette[0];
          for (let i = 0; i < ringCount; i++) {
            const angle = (i / ringCount) * Math.PI * 2;
            sparksRef.current.push({
              x,
              y,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              color: col,
              secondaryColor: palette[2],
              alpha: 1,
              decay: 0.013 + Math.random() * 0.006,
              gravity: 0.055,
              drag: 0.965,
              size: 2.5,
              strobe: ring === 2 && i % 3 === 0,
              trail: [],
            });
          }
        }
      } else if (pattern === 'willow') {
        const count = 115;
        for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 1.4 + Math.random() * 6.8;
          sparksRef.current.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color: '#FBBF24',
            secondaryColor: '#FEF08A',
            alpha: 1,
            decay: 0.0085 + Math.random() * 0.005,
            gravity: 0.085,
            drag: 0.958,
            size: 2.3,
            strobe: true,
            trail: [],
          });
        }
      } else {
        const count = 110;
        for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 1.8 + Math.random() * 7.4;
          sparksRef.current.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color: palette[i % palette.length],
            secondaryColor: '#FFFFFF',
            alpha: 1,
            decay: 0.011 + Math.random() * 0.007,
            gravity: 0.06,
            drag: 0.964,
            size: 2.6 + Math.random() * 1.2,
            strobe: i % 5 === 0,
            trail: [],
          });
        }
      }
    },
    []
  );

  const launchRocketTo = useCallback((targetX?: number, targetY?: number) => {
    const w = window.innerWidth || 1200;
    const h = window.innerHeight || 800;
    const startX = w * 0.2 + Math.random() * (w * 0.6);
    const startY = h + 10;

    const destX =
      targetX !== undefined ? targetX : w * 0.15 + Math.random() * (w * 0.7);
    const destY =
      targetY !== undefined
        ? Math.max(h * 0.1, Math.min(h * 0.75, targetY))
        : h * 0.14 + Math.random() * (h * 0.38);

    const flightFrames = targetX !== undefined ? 20 : 34 + Math.random() * 12;
    const vx = (destX - startX) / flightFrames;
    const vy = (destY - startY) / flightFrames;

    const palette =
      FIREWORK_PALETTES[Math.floor(Math.random() * FIREWORK_PALETTES.length)];
    const patterns: ShellPattern[] = ['peony', 'heart', 'double-ring', 'willow'];
    const pattern = patterns[Math.floor(Math.random() * patterns.length)];

    rocketsRef.current.push({
      x: startX,
      y: startY,
      vx,
      vy,
      targetY: destY,
      color: palette[0],
      pattern,
      trail: [],
    });
  }, []);

  const startShow = useCallback(() => {
    setIsActive(true);
    setTapBurstCount(0);
    setShowNonce((n) => n + 1);
  }, []);

  const handleCloseToHome = () => {
    romanticAudio.playSoftClick();
    setIsActive(false);
    rocketsRef.current = [];
    sparksRef.current = [];
    flashesRef.current = [];
    if (onReturnHome) {
      onReturnHome();
    }
  };

  useEffect(() => {
    if (triggerCount > 0) {
      startShow();
    }
  }, [triggerCount, startShow]);

  useEffect(() => {
    const handleGlobalTrigger = () => {
      startShow();
    };
    window.addEventListener('trigger-birthday-fireworks', handleGlobalTrigger);
    return () => {
      window.removeEventListener(
        'trigger-birthday-fireworks',
        handleGlobalTrigger
      );
    };
  }, [startShow]);

  useEffect(() => {
    if (!isActive) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    updateSize();

    // Initial grand salvo + continuous ambient rockets while Celebrate sky is open
    const launchScheduleMs = [
      0, 220, 520, 950, 1300, 1750, 2150, 2600, 3100, 3550, 3950, 4400, 4850,
      5300,
    ];
    const timers: number[] = [];

    launchScheduleMs.forEach((delay) => {
      const tid = window.setTimeout(() => {
        launchRocketTo();
      }, delay);
      timers.push(tid);
    });

    // Keep launching ambient celebratory shells every 1.4s so the sky stays alive until closed
    const ambientInterval = window.setInterval(() => {
      launchRocketTo();
      if (Math.random() > 0.45) {
        launchRocketTo();
      }
    }, 1400);

    window.addEventListener('resize', updateSize);

    let rafId: number | null = null;

    const render = () => {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(8, 11, 26, 0.24)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.globalCompositeOperation = 'lighter';

      // 1. Render Sky Flashes
      for (let i = flashesRef.current.length - 1; i >= 0; i--) {
        const fl = flashesRef.current[i];
        fl.alpha -= 0.035;
        if (fl.alpha <= 0) {
          flashesRef.current.splice(i, 1);
          continue;
        }
        const grad = ctx.createRadialGradient(
          fl.x,
          fl.y,
          2,
          fl.x,
          fl.y,
          fl.radius
        );
        grad.addColorStop(0, fl.color);
        grad.addColorStop(1, 'transparent');
        ctx.save();
        ctx.globalAlpha = Math.max(0, fl.alpha);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(fl.x, fl.y, fl.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 2. Update & Draw Ascending Rockets
      for (let i = rocketsRef.current.length - 1; i >= 0; i--) {
        const r = rocketsRef.current[i];
        r.trail.push({ x: r.x, y: r.y });
        if (r.trail.length > 8) r.trail.shift();

        r.x += r.vx;
        r.y += r.vy;

        ctx.beginPath();
        for (let t = 0; t < r.trail.length; t++) {
          const pt = r.trail[t];
          if (t === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.lineTo(r.x, r.y);
        ctx.strokeStyle = r.color;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(r.x, r.y, 3.2, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();

        if (r.y <= r.targetY || r.vy >= 0) {
          detonateAtPoint(r.x, r.y, r.pattern, r.color);
          rocketsRef.current.splice(i, 1);
        }
      }

      // 3. Update & Draw Aerial Firework Sparks
      for (let i = sparksRef.current.length - 1; i >= 0; i--) {
        const s = sparksRef.current[i];
        s.trail.push({ x: s.x, y: s.y });
        if (s.trail.length > 5) s.trail.shift();

        s.vx *= s.drag;
        s.vy *= s.drag;
        s.vy += s.gravity;
        s.x += s.vx;
        s.y += s.vy;
        s.alpha -= s.decay;

        if (s.alpha <= 0) {
          sparksRef.current.splice(i, 1);
          continue;
        }

        const flicker =
          s.strobe && Math.random() > 0.65 ? 0.25 : Math.max(0, s.alpha);

        ctx.save();
        ctx.globalAlpha = flicker;

        if (s.trail.length > 1) {
          ctx.beginPath();
          ctx.moveTo(s.trail[0].x, s.trail[0].y);
          for (let t = 1; t < s.trail.length; t++) {
            ctx.lineTo(s.trail[t].x, s.trail[t].y);
          }
          ctx.lineTo(s.x, s.y);
          ctx.strokeStyle = s.color;
          ctx.lineWidth = s.size * 0.85;
          ctx.lineCap = 'round';
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = s.alpha > 0.65 ? s.secondaryColor : s.color;
        ctx.fill();
        ctx.restore();
      }

      rafId = window.requestAnimationFrame(render);
    };

    rafId = window.requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', updateSize);
      timers.forEach((tid) => window.clearTimeout(tid));
      window.clearInterval(ambientInterval);
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [isActive, showNonce, detonateAtPoint, launchRocketTo]);

  // Instant Sky Tap / Click handler: explodes immediately at cursor AND launches 2 companion rockets
  const handleSkyPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // 1. Instant firework detonation right where the user tapped
    detonateAtPoint(clickX, clickY);

    // 2. Companion rockets streaking toward the tapped sky area
    launchRocketTo(
      clickX + (Math.random() - 0.5) * 140,
      Math.max(90, clickY + (Math.random() - 0.5) * 80)
    );
    setTapBurstCount((c) => c + 1);
  };

  // Also allow clicking the "Tap Sky for More" pill button to trigger a 3-shell grand salvo
  const handleManualSalvoBurst = () => {
    const w = window.innerWidth || 1200;
    const h = window.innerHeight || 800;
    detonateAtPoint(w * (0.25 + Math.random() * 0.5), h * (0.2 + Math.random() * 0.35), 'heart');
    launchRocketTo(w * 0.3, h * 0.25);
    launchRocketTo(w * 0.7, h * 0.25);
    setTapBurstCount((c) => c + 3);
  };

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#080b1a]/85 backdrop-blur-xs">
      <canvas
        ref={canvasRef}
        onPointerDown={handleSkyPointerDown}
        title="Tap or click anywhere on the sky to launch fireworks!"
        className="w-full h-full cursor-crosshair touch-none"
      />

      {/* Top-Right Corner Cross (X) Button to Return to the Home Screen (with Pulse Animation) */}
      <button
        type="button"
        onClick={handleCloseToHome}
        aria-label="Close Celebrate Fireworks and Return to Home Screen"
        title="Return to Home Screen"
        className="fixed top-5 right-5 z-[60] group flex items-center gap-2 px-4 py-2.5 rounded-full bg-stone-950/90 hover:bg-rose-700 text-white border-2 border-amber-400/80 shadow-2xl transition-all duration-200 cursor-pointer"
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
        </span>
        <span className="text-xs font-semibold tracking-wide hidden sm:inline">
          Back to Home
        </span>
        <div className="w-7 h-7 rounded-full bg-white/15 group-hover:bg-white/25 flex items-center justify-center animate-pulse">
          <X className="w-4 h-4 text-white stroke-[2.5]" />
        </div>
      </button>

      {/* Top Center Interactive Banner — Clicking also launches a 3-shell salvo */}
      <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[55] flex items-center gap-3 px-5 py-2.5 rounded-full bg-stone-950/90 backdrop-blur-md border border-amber-400/60 shadow-2xl text-white max-w-[90vw]">
        <Sparkles className="w-4 h-4 text-amber-400 animate-spin shrink-0" />
        <button
          type="button"
          onClick={handleManualSalvoBurst}
          className="text-xs sm:text-sm font-serif font-bold tracking-wide truncate cursor-pointer hover:text-amber-300 transition-colors"
        >
          🎆 Happy Birthday Fireworks for {sisterName}! ·{' '}
          <span className="underline decoration-amber-400 underline-offset-4 animate-pulse text-amber-300">
            Tap Sky for More
          </span>
          {tapBurstCount > 0 ? ` (${tapBurstCount} Launched!)` : ''}
        </button>
      </div>
    </div>
  );
};
