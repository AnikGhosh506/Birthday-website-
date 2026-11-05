import confetti from 'canvas-confetti';

const CELEBRATION_COLORS = [
  '#e11d48', // crimson rose
  '#fb7185', // soft rose
  '#f59e0b', // warm amber gold
  '#fde047', // bright starlight yellow
  '#10b981', // emerald
  '#ffffff', // pearl white
];

/**
 * Fires a rich, multi-stage particle confetti explosion across the viewport
 * (and optionally anchored at a clicked button's screen coordinates).
 */
export function triggerConfettiExplosion(originEvent?: {
  clientX: number;
  clientY: number;
}) {
  const originX =
    originEvent && typeof window !== 'undefined' && window.innerWidth > 0
      ? Math.min(0.9, Math.max(0.1, originEvent.clientX / window.innerWidth))
      : 0.5;
  const originY =
    originEvent && typeof window !== 'undefined' && window.innerHeight > 0
      ? Math.min(0.9, Math.max(0.15, originEvent.clientY / window.innerHeight))
      : 0.68;

  // Stage 1: High-energy radial center particle burst from the interaction point
  confetti({
    particleCount: 85,
    spread: 80,
    startVelocity: 42,
    gravity: 0.95,
    scalar: 1.05,
    ticks: 220,
    origin: { x: originX, y: originY },
    colors: CELEBRATION_COLORS,
  });

  // Stage 2: Golden star & circle shimmer ring
  setTimeout(() => {
    confetti({
      particleCount: 45,
      spread: 120,
      startVelocity: 28,
      decay: 0.92,
      scalar: 1.2,
      shapes: ['star', 'circle'],
      origin: { x: originX, y: Math.max(0.2, originY - 0.08) },
      colors: ['#f59e0b', '#fde047', '#fb7185', '#ffffff'],
    });
  }, 140);

  // Stage 3: Twin left & right celebration cannons
  setTimeout(() => {
    confetti({
      particleCount: 55,
      angle: 60,
      spread: 58,
      startVelocity: 48,
      origin: { x: 0.04, y: 0.75 },
      colors: CELEBRATION_COLORS,
    });
    confetti({
      particleCount: 55,
      angle: 120,
      spread: 58,
      startVelocity: 48,
      origin: { x: 0.96, y: 0.75 },
      colors: CELEBRATION_COLORS,
    });
  }, 280);
}
