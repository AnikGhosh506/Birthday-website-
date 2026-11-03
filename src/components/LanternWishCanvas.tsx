import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, Heart } from 'lucide-react';
import { romanticAudio } from '../utils/audioSynth';

interface Lantern {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  wishText: string;
  opacity: number;
  swayPhase: number;
}

interface Star {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  twinkleSpeed: number;
}

export const LanternWishCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [wishInput, setWishInput] = useState('');
  const [releasedWishes, setReleasedWishes] = useState<string[]>([
    'Endless laughter together',
    'A lifetime of cozy Sundays',
  ]);

  const lanternsRef = useRef<Lantern[]>([]);
  const starsRef = useRef<Star[]>([]);
  const animFrameIdRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    const resizeCanvas = () => {
      canvas.width = canvas.parentElement?.clientWidth || 800;
      canvas.height = 360;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize starry sky
    const starCount = 70;
    const stars: Star[] = [];
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.5 + 0.5,
        alpha: Math.random(),
        twinkleSpeed: 0.01 + Math.random() * 0.02,
      });
    }
    starsRef.current = stars;

    // Pre-populate 2 gentle lanterns drifting
    lanternsRef.current = [
      {
        id: 1,
        x: canvas.width * 0.3,
        y: canvas.height * 0.6,
        vx: 0.15,
        vy: -0.4,
        size: 26,
        wishText: 'Endless laughter together',
        opacity: 0.85,
        swayPhase: 0,
      },
      {
        id: 2,
        x: canvas.width * 0.7,
        y: canvas.height * 0.75,
        vx: -0.1,
        vy: -0.35,
        size: 24,
        wishText: 'A lifetime of cozy Sundays',
        opacity: 0.9,
        swayPhase: 2,
      },
    ];

    // Animation loop
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Deep Twilight Gradient Sky
      const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      skyGrad.addColorStop(0, '#0c1222');
      skyGrad.addColorStop(0.65, '#1e1b4b');
      skyGrad.addColorStop(1, '#2e1065');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw and twinkle stars
      starsRef.current.forEach((star) => {
        star.alpha += star.twinkleSpeed;
        const currentAlpha = Math.abs(Math.sin(star.alpha));
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha * 0.85})`;
        ctx.fill();
      });

      // Update & Draw Lanterns
      lanternsRef.current.forEach((l) => {
        l.swayPhase += 0.025;
        l.x += l.vx + Math.sin(l.swayPhase) * 0.3;
        l.y += l.vy;

        // If lantern floats off top, wrap around from bottom with new gentle pos
        if (l.y < -50) {
          l.y = canvas.height + 40;
          l.x = Math.random() * (canvas.width - 80) + 40;
        }

        // Draw Lantern Outer Warm Glow
        const glowRadius = l.size * 2.2;
        const glowGrad = ctx.createRadialGradient(
          l.x,
          l.y,
          l.size * 0.3,
          l.x,
          l.y,
          glowRadius
        );
        glowGrad.addColorStop(0, `rgba(251, 191, 36, ${l.opacity * 0.7})`);
        glowGrad.addColorStop(0.5, `rgba(245, 158, 11, ${l.opacity * 0.3})`);
        glowGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');

        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(l.x, l.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Draw Lantern Body (Paper Lantern Rounded Quad)
        const w = l.size;
        const h = l.size * 1.35;
        ctx.save();
        ctx.translate(l.x, l.y);

        // Body Gradient
        const bodyGrad = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
        bodyGrad.addColorStop(0, '#fef3c7');
        bodyGrad.addColorStop(0.5, '#f59e0b');
        bodyGrad.addColorStop(1, '#b45309');

        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.roundRect(-w / 2, -h / 2, w, h, 6);
        ctx.fill();

        // Lantern Inner Flame
        ctx.beginPath();
        ctx.ellipse(0, h * 0.2, w * 0.25, h * 0.2, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        // Draw wish text label above lantern
        if (l.wishText) {
          ctx.font = '10px "Plus Jakarta Sans", sans-serif';
          ctx.fillStyle = 'rgba(254, 243, 199, 0.85)';
          ctx.textAlign = 'center';
          ctx.fillText(l.wishText, 0, -h / 2 - 8);
        }

        ctx.restore();
      });

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, []);

  const handleReleaseWish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wishInput.trim()) return;

    const canvas = canvasRef.current;
    const width = canvas?.width || 600;
    const height = canvas?.height || 360;

    const newLantern: Lantern = {
      id: Date.now(),
      x: width * 0.5 + (Math.random() - 0.5) * 120,
      y: height - 20,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -0.55 - Math.random() * 0.2,
      size: 28,
      wishText: wishInput.trim(),
      opacity: 1,
      swayPhase: Math.random() * Math.PI,
    };

    lanternsRef.current.push(newLantern);
    setReleasedWishes((prev) => [wishInput.trim(), ...prev.slice(0, 5)]);
    setWishInput('');
    romanticAudio.playCelebrationChime();
  };

  return (
    <section className="py-20 border-b border-stone-200/80 bg-stone-900 text-white">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-rose-400 uppercase tracking-widest mb-2">
            <span>Chapter 07</span>
            <span aria-hidden="true">·</span>
            <span>Sky of Wishes</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-white">
            Release a Birthday Lantern
          </h2>
          <p className="mt-2 text-sm text-stone-300 font-sans">
            Type a quiet wish into your lantern and release it into the starry sky.
          </p>
        </div>

        {/* Interactive Sky Canvas */}
        <div className="relative rounded-2xl overflow-hidden border border-stone-800 shadow-2xl">
          <canvas
            ref={canvasRef}
            className="w-full h-[360px] block cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const clickY = e.clientY - rect.top;
              lanternsRef.current.push({
                id: Date.now(),
                x: clickX,
                y: clickY,
                vx: (Math.random() - 0.5) * 0.4,
                vy: -0.5,
                size: 24,
                wishText: '✨',
                opacity: 0.9,
                swayPhase: Math.random(),
              });
              romanticAudio.playSoftClick();
            }}
          />

          <div className="absolute top-3 right-4 text-[11px] text-stone-400 font-sans pointer-events-none">
            Tap anywhere to release starlight
          </div>

          {/* Form to release a personalized wish lantern */}
          <div className="absolute bottom-4 inset-x-4 max-w-lg mx-auto">
            <form
              onSubmit={handleReleaseWish}
              className="flex items-center gap-2 p-1.5 bg-stone-950/80 backdrop-blur-md rounded-xl border border-stone-700/80 shadow-lg"
            >
              <input
                type="text"
                value={wishInput}
                onChange={(e) => setWishInput(e.target.value)}
                placeholder="Write your secret birthday wish..."
                maxLength={60}
                className="flex-1 px-4 py-2 text-xs sm:text-sm bg-transparent text-white placeholder-stone-400 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!wishInput.trim()}
                className="px-4 py-2 text-xs font-medium text-stone-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <span>Release</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>

        {/* Recently released wishes list */}
        {releasedWishes.length > 0 && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs text-stone-400">
            <span className="text-amber-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Floating Wishes:
            </span>
            {releasedWishes.map((w, idx) => (
              <span
                key={idx}
                className="text-stone-300 italic flex items-center gap-1.5"
              >
                <span>"{w}"</span>
                {idx < releasedWishes.length - 1 && (
                  <span aria-hidden="true" className="text-stone-600">
                    ·
                  </span>
                )}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
