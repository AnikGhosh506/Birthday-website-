import React, { useEffect, useRef } from 'react';

interface PersistentConfettiRainCanvasProps {
  enabled: boolean;
}

interface ConfettiPiece {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  shimmerColor: string;
  shape: 'ribbon' | 'petal' | 'diamond' | 'heart';
  vy: number;
  vx: number;
  swayAmp: number;
  swaySpeed: number;
  swayPhase: number;
  tiltAngle: number;
  tiltSpeed: number;
  spinAngle: number;
  spinSpeed: number;
  opacity: number;
}

const CONFETTI_PALETTE: { main: string; shimmer: string }[] = [
  { main: '#e11d48', shimmer: '#fda4af' }, // Crimson Rose
  { main: '#f59e0b', shimmer: '#fef08a' }, // Metallic Gold
  { main: '#fb7185', shimmer: '#ffe4e6' }, // Blush Rose
  { main: '#fde047', shimmer: '#ffffff' }, // Starlight Yellow
  { main: '#d97706', shimmer: '#fde68a' }, // Warm Amber
  { main: '#10b981', shimmer: '#a7f3d0' }, // Emerald Spark
  { main: '#a855f7', shimmer: '#e9d5ff' }, // Royal Orchid
];

const SHAPES: ConfettiPiece['shape'][] = ['ribbon', 'petal', 'diamond', 'heart'];

export const PersistentConfettiRainCanvas: React.FC<PersistentConfettiRainCanvasProps> = ({
  enabled,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    const pieceCount = Math.min(75, Math.max(42, Math.floor(width / 24)));
    const pieces: ConfettiPiece[] = [];

    const createPiece = (spawnAtTop: boolean): ConfettiPiece => {
      const palette =
        CONFETTI_PALETTE[Math.floor(Math.random() * CONFETTI_PALETTE.length)];
      const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
      return {
        x: Math.random() * width,
        y: spawnAtTop ? -20 - Math.random() * 140 : Math.random() * height,
        width: shape === 'ribbon' ? 11 + Math.random() * 6 : 8 + Math.random() * 5,
        height: shape === 'ribbon' ? 5 + Math.random() * 3 : 8 + Math.random() * 5,
        color: palette.main,
        shimmerColor: palette.shimmer,
        shape,
        vy: 1.05 + Math.random() * 1.45,
        vx: (Math.random() - 0.5) * 0.45,
        swayAmp: 0.65 + Math.random() * 1.15,
        swaySpeed: 0.015 + Math.random() * 0.025,
        swayPhase: Math.random() * Math.PI * 2,
        tiltAngle: Math.random() * Math.PI * 2,
        tiltSpeed: 0.03 + Math.random() * 0.055,
        spinAngle: Math.random() * Math.PI * 2,
        spinSpeed: (Math.random() - 0.5) * 0.04,
        opacity: 0.68 + Math.random() * 0.28,
      };
    };

    for (let i = 0; i < pieceCount; i++) {
      pieces.push(createPiece(false));
    }

    let animId = 0;

    const drawHeart = (c: CanvasRenderingContext2D, size: number) => {
      const s = size * 0.55;
      c.beginPath();
      c.moveTo(0, s * 0.35);
      c.bezierCurveTo(0, 0, -s, 0, -s, s * 0.45);
      c.bezierCurveTo(-s, s * 0.9, 0, s * 1.2, 0, s * 1.45);
      c.bezierCurveTo(0, s * 1.2, s, s * 0.9, s, s * 0.45);
      c.bezierCurveTo(s, 0, 0, 0, 0, s * 0.35);
      c.closePath();
      c.fill();
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < pieces.length; i++) {
        const p = pieces[i];
        p.swayPhase += p.swaySpeed;
        p.tiltAngle += p.tiltSpeed;
        p.spinAngle += p.spinSpeed;

        p.x += p.vx + Math.sin(p.swayPhase) * p.swayAmp;
        p.y += p.vy;

        if (p.y > height + 28) {
          pieces[i] = createPiece(true);
          continue;
        }
        if (p.x < -30) p.x = width + 25;
        if (p.x > width + 30) p.x = -25;

        const scaleY = Math.cos(p.tiltAngle);
        const isGlinting = Math.abs(scaleY) < 0.28;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.spinAngle);
        ctx.scale(1, Math.max(0.16, Math.abs(scaleY)));
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = isGlinting ? p.shimmerColor : p.color;

        if (p.shape === 'ribbon') {
          ctx.beginPath();
          ctx.roundRect(-p.width / 2, -p.height / 2, p.width, p.height, 2);
          ctx.fill();
        } else if (p.shape === 'petal') {
          ctx.beginPath();
          ctx.ellipse(0, 0, p.width * 0.55, p.height * 0.38, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === 'diamond') {
          const hw = p.width * 0.55;
          const hh = p.height * 0.55;
          ctx.beginPath();
          ctx.moveTo(0, -hh);
          ctx.lineTo(hw, 0);
          ctx.lineTo(0, hh);
          ctx.lineTo(-hw, 0);
          ctx.closePath();
          ctx.fill();
        } else {
          drawHeart(ctx, p.width);
        }

        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 w-full h-full pointer-events-none z-40 no-print print:hidden"
    />
  );
};
