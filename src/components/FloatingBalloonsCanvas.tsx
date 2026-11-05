import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, Eye, EyeOff } from 'lucide-react';
import { romanticAudio } from '../utils/audioSynth';
import { triggerConfettiExplosion } from '../utils/confettiExplosion';

interface FloatingBalloonsCanvasProps {
  sisterName?: string;
}

interface BalloonColorScheme {
  light: string;
  mid: string;
  dark: string;
  rim: string;
}

interface FloatingBalloon {
  id: number;
  x: number;
  y: number;
  baseX: number;
  radiusX: number;
  radiusY: number;
  vy: number;
  swayAmp: number;
  swaySpeed: number;
  swayPhase: number;
  tiltAngle: number;
  color: BalloonColorScheme;
  label: string;
  isHovered: boolean;
  scale: number;
}

interface CanvasConfettiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  vRot: number;
  alpha: number;
  shape: 'rect' | 'circle' | 'star';
}

interface PopShockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
  popText: string;
  textOffsetY: number;
}

const BALLOON_PALETTES: BalloonColorScheme[] = [
  {
    // Ruby Rose
    light: '#fecdd3',
    mid: '#f43f5e',
    dark: '#9f1239',
    rim: '#fda4af',
  },
  {
    // Sunrise Gold
    light: '#fef08a',
    mid: '#f59e0b',
    dark: '#92400e',
    rim: '#fde68a',
  },
  {
    // Sunset Coral Peach
    light: '#fed7aa',
    mid: '#fb7185',
    dark: '#be123c',
    rim: '#fecdd3',
  },
  {
    // Royal Lavender Rose
    light: '#f5d0fe',
    mid: '#d946ef',
    dark: '#701a75',
    rim: '#f0abfc',
  },
  {
    // Champagne Amber
    light: '#fef3c7',
    mid: '#eab308',
    dark: '#713f12',
    rim: '#fde047',
  },
  {
    // Celestial Indigo-Violet
    light: '#e0e7ff',
    mid: '#818cf8',
    dark: '#312e81',
    rim: '#c7d2fe',
  },
];

const POP_CHEER_TEXTS = [
  'POP! 🎉 Happy Birthday Didi!',
  'POP! ✨ Best Big Sis!',
  'POP! 💖 28th May Queen!',
  'POP! 🌟 Shine On Atrayee!',
  'POP! 🎂 Make a Wish!',
];

export const FloatingBalloonsCanvas: React.FC<FloatingBalloonsCanvasProps> = ({
  sisterName = 'Atrayee',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [poppedCount, setPoppedCount] = useState(0);
  const [balloonsEnabled, setBalloonsEnabled] = useState(true);

  const balloonsRef = useRef<FloatingBalloon[]>([]);
  const particlesRef = useRef<CanvasConfettiParticle[]>([]);
  const shockwavesRef = useRef<PopShockwave[]>([]);
  const nextIdRef = useRef<number>(1);

  const createBalloon = (
    canvasWidth: number,
    canvasHeight: number,
    startOnScreen: boolean = false
  ): FloatingBalloon => {
    const labels = [
      'HBD Didi',
      sisterName.slice(0, 8),
      '28 May',
      'Best Sis',
      '★ Queen',
      '♥ Didi',
    ];
    const id = nextIdRef.current++;
    const radiusX = 25 + Math.random() * 9;
    const radiusY = radiusX * 1.22;

    // Keep balloons gently distributed across the left/right edges and screen width
    const margin = 55;
    const baseX =
      margin + Math.random() * Math.max(120, canvasWidth - margin * 2);
    const y = startOnScreen
      ? canvasHeight * 0.25 + Math.random() * (canvasHeight * 0.75)
      : canvasHeight + radiusY + 40 + Math.random() * 140;

    return {
      id,
      x: baseX,
      y,
      baseX,
      radiusX,
      radiusY,
      vy: 0.42 + Math.random() * 0.45, // slow, dreamy upward float
      swayAmp: 18 + Math.random() * 24,
      swaySpeed: 0.65 + Math.random() * 0.65,
      swayPhase: Math.random() * Math.PI * 2,
      tiltAngle: 0,
      color: BALLOON_PALETTES[id % BALLOON_PALETTES.length],
      label: labels[id % labels.length],
      isHovered: false,
      scale: 1,
    };
  };

  const spawnBurstParticles = (x: number, y: number, scheme: BalloonColorScheme) => {
    const colors = [
      scheme.light,
      scheme.mid,
      scheme.rim,
      '#FFD700',
      '#FF6B8B',
      '#FFFDF9',
      '#F59E0B',
    ];
    const shapes: Array<'rect' | 'circle' | 'star'> = ['rect', 'circle', 'star'];

    for (let i = 0; i < 42; i++) {
      const angle = (Math.PI * 2 * i) / 42 + (Math.random() - 0.5) * 0.3;
      const speed = 2.5 + Math.random() * 7.5;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.8,
        size: 4 + Math.random() * 5.5,
        color: colors[i % colors.length],
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.28,
        alpha: 1,
        shape: shapes[i % shapes.length],
      });
    }

    shockwavesRef.current.push({
      x,
      y,
      radius: 8,
      maxRadius: 72,
      alpha: 0.95,
      color: scheme.mid,
      popText: POP_CHEER_TEXTS[Math.floor(Math.random() * POP_CHEER_TEXTS.length)],
      textOffsetY: 0,
    });
  };

  useEffect(() => {
    if (!balloonsEnabled) {
      document.body.style.cursor = '';
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    updateSize();

    // Initialize 7 slow-floating birthday balloons across the viewport
    const INITIAL_BALLOON_COUNT = 7;
    balloonsRef.current = Array.from({ length: INITIAL_BALLOON_COUNT }, () =>
      createBalloon(canvas.width, canvas.height, true)
    );

    const hitTestBalloon = (
      clientX: number,
      clientY: number
    ): FloatingBalloon | null => {
      // Iterate from top-most drawn balloon (end of array) to first
      for (let i = balloonsRef.current.length - 1; i >= 0; i--) {
        const b = balloonsRef.current[i];
        const dx = (clientX - b.x) / (b.radiusX * 1.15);
        const dy = (clientY - b.y) / (b.radiusY * 1.15);
        if (dx * dx + dy * dy <= 1) {
          return b;
        }
      }
      return null;
    };

    const handleMouseMove = (e: MouseEvent) => {
      let anyHovered = false;
      const hit = hitTestBalloon(e.clientX, e.clientY);
      for (const b of balloonsRef.current) {
        if (hit && b.id === hit.id) {
          b.isHovered = true;
          anyHovered = true;
        } else {
          b.isHovered = false;
        }
      }

      // Only show pointer cursor if not hovering a native button/link
      const target = e.target as HTMLElement | null;
      const isInteractiveElement = Boolean(
        target?.closest('button, a, input, textarea, select, [role="button"]')
      );
      if (!isInteractiveElement) {
        document.body.style.cursor = anyHovered ? 'pointer' : '';
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      // Do not intercept clicks meant for buttons, links, inputs, or modals
      if (
        target?.closest(
          'button, a, input, textarea, select, label, [role="button"]'
        )
      ) {
        return;
      }

      const hit = hitTestBalloon(e.clientX, e.clientY);
      if (hit) {
        // Pop this balloon!
        romanticAudio.playBalloonPop();
        spawnBurstParticles(hit.x, hit.y, hit.color);
        triggerConfettiExplosion({ clientX: hit.x, clientY: hit.y });
        setPoppedCount((prev) => prev + 1);

        // Remove popped balloon & respawn a fresh one below the bottom of the screen
        balloonsRef.current = balloonsRef.current.filter((b) => b.id !== hit.id);
        document.body.style.cursor = '';

        window.setTimeout(() => {
          if (canvasRef.current) {
            balloonsRef.current.push(
              createBalloon(
                canvasRef.current.width,
                canvasRef.current.height,
                false
              )
            );
          }
        }, 1600);
      }
    };

    window.addEventListener('resize', updateSize);
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown);

    let rafId: number | null = null;
    const startTime = performance.now();

    const renderFrame = (now: number) => {
      const elapsed = (now - startTime) * 0.001;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Update & Draw Slow-Floating Balloons
      for (let i = 0; i < balloonsRef.current.length; i++) {
        const b = balloonsRef.current[i];
        b.y -= b.vy;
        const swayOffset =
          Math.sin(elapsed * b.swaySpeed + b.swayPhase) * b.swayAmp;
        b.x = b.baseX + swayOffset;
        b.tiltAngle =
          Math.cos(elapsed * b.swaySpeed + b.swayPhase) * 0.09;

        const targetScale = b.isHovered ? 1.12 : 1.0;
        b.scale += (targetScale - b.scale) * 0.18;

        // If balloon floats above top of viewport, recycle it smoothly below the bottom
        if (b.y < -b.radiusY - 90) {
          balloonsRef.current[i] = createBalloon(
            canvas.width,
            canvas.height,
            false
          );
          continue;
        }

        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.tiltAngle);
        ctx.scale(b.scale, b.scale);
        ctx.globalAlpha = b.isHovered ? 0.96 : 0.84;

        // Draw swaying silk balloon string below the knot
        ctx.beginPath();
        ctx.moveTo(0, b.radiusY + 4);
        const stringWave = Math.sin(elapsed * 2.2 + b.swayPhase) * 8;
        ctx.bezierCurveTo(
          stringWave,
          b.radiusY + 24,
          -stringWave,
          b.radiusY + 46,
          stringWave * 0.5,
          b.radiusY + 66
        );
        ctx.strokeStyle = 'rgba(120, 113, 108, 0.55)';
        ctx.lineWidth = 1.35;
        ctx.stroke();

        // Draw balloon tie knot triangle at bottom of oval
        ctx.beginPath();
        ctx.moveTo(-4.5, b.radiusY + 4);
        ctx.lineTo(4.5, b.radiusY + 4);
        ctx.lineTo(0, b.radiusY - 2);
        ctx.closePath();
        ctx.fillStyle = b.color.dark;
        ctx.fill();

        // Draw 3D shaded elliptical balloon body
        ctx.beginPath();
        ctx.ellipse(0, 0, b.radiusX, b.radiusY, 0, 0, Math.PI * 2);

        const grad = ctx.createRadialGradient(
          -b.radiusX * 0.32,
          -b.radiusY * 0.32,
          b.radiusX * 0.1,
          0,
          0,
          b.radiusY * 1.05
        );
        grad.addColorStop(0, b.color.light);
        grad.addColorStop(0.45, b.color.mid);
        grad.addColorStop(1, b.color.dark);

        ctx.fillStyle = grad;
        ctx.fill();

        ctx.lineWidth = b.isHovered ? 2 : 1;
        ctx.strokeStyle = b.isHovered ? '#ffffff' : b.color.rim;
        ctx.stroke();

        // Glossy 3D specular highlight oval
        ctx.beginPath();
        ctx.ellipse(
          -b.radiusX * 0.36,
          -b.radiusY * 0.34,
          b.radiusX * 0.18,
          b.radiusY * 0.28,
          -0.42,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = 'rgba(255, 255, 255, 0.48)';
        ctx.fill();

        // Subtle birthday inscription on the balloon
        ctx.font = 'bold 10px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(b.label, 0, 3);

        if (b.isHovered) {
          ctx.font = 'bold 9px "Plus Jakarta Sans", sans-serif';
          ctx.fillStyle = '#fffbeb';
          ctx.fillText('POP ME! 🎉', 0, -b.radiusY - 10);
        }

        ctx.restore();
      }

      // 2. Update & Draw In-Canvas Pop Confetti Particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.vx *= 0.97;
        p.vy += 0.18; // gravity
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.vRot;
        p.alpha -= 0.018;

        if (p.alpha <= 0) {
          particlesRef.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;

        if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 0.55, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === 'star') {
          ctx.beginPath();
          for (let s = 0; s < 5; s++) {
            const a = (s * 4 * Math.PI) / 5 - Math.PI / 2;
            const r = p.size * 0.75;
            if (s === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
            else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
          }
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.fillRect(-p.size * 0.5, -p.size * 0.35, p.size, p.size * 0.7);
        }
        ctx.restore();
      }

      // 3. Update & Draw Pop Shockwaves & Floating Cheer Labels
      for (let i = shockwavesRef.current.length - 1; i >= 0; i--) {
        const sw = shockwavesRef.current[i];
        sw.radius += (sw.maxRadius - sw.radius) * 0.16;
        sw.textOffsetY -= 1.1;
        sw.alpha -= 0.022;

        if (sw.alpha <= 0) {
          shockwavesRef.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, sw.alpha);
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.strokeStyle = sw.color;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.font = 'bold 13px "Playfair Display", Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#be123c';
        ctx.shadowColor = 'rgba(255, 255, 255, 0.95)';
        ctx.shadowBlur = 6;
        ctx.fillText(sw.popText, sw.x, sw.y - 16 + sw.textOffsetY);
        ctx.restore();
      }

      rafId = window.requestAnimationFrame(renderFrame);
    };

    rafId = window.requestAnimationFrame(renderFrame);

    return () => {
      window.removeEventListener('resize', updateSize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      document.body.style.cursor = '';
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [balloonsEnabled, sisterName]);

  const handleReleaseExtraBalloons = () => {
    romanticAudio.playCelebrationChime();
    if (!balloonsEnabled) {
      setBalloonsEnabled(true);
      return;
    }
    const w = window.innerWidth;
    const h = window.innerHeight;
    for (let i = 0; i < 4; i++) {
      balloonsRef.current.push(createBalloon(w, h, false));
    }
  };

  return (
    <>
      {/* Full-Viewport Non-Blocking Interactive Balloon Canvas */}
      {balloonsEnabled && (
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="fixed inset-0 z-30 pointer-events-none"
        />
      )}

      {/* Subtle Bottom-Left Balloon Control & Pop Counter Pill */}
      <div className="no-print-control fixed bottom-5 left-5 z-40 flex items-center gap-1.5 p-1.5 rounded-full bg-white/90 backdrop-blur-md border border-stone-200/90 shadow-lg text-xs text-stone-800">
        <button
          type="button"
          onClick={handleReleaseExtraBalloons}
          title="Release more floating birthday balloons (Click any floating balloon to pop it!)"
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-semibold bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200/80 transition-colors cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-rose-600" />
          <span>🎈 Popped: {poppedCount}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            romanticAudio.playSoftClick();
            setBalloonsEnabled((prev) => !prev);
          }}
          title={
            balloonsEnabled
              ? 'Hide floating birthday balloons'
              : 'Show floating birthday balloons'
          }
          className="p-1.5 rounded-full text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
        >
          {balloonsEnabled ? (
            <EyeOff className="w-3.5 h-3.5" />
          ) : (
            <Eye className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </>
  );
};
