import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Gamepad2,
  Sparkles,
  Trophy,
  RotateCcw,
  Play,
  Pause,
  Heart,
  Star,
  HelpCircle,
  CheckCircle2,
  Gift,
  Layers,
  Type,
  Award,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { romanticAudio } from '../utils/audioSynth';

type GameMode = 'STARLIGHT_CATCHER' | 'MEMORY_MATCH' | 'WORD_CIPHER';
type GameState = 'TITLE_MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

interface BirthdayGameArcadeProps {
  girlfriendName: string;
  boyfriendName: string;
  onUnlockBonusCoupon?: () => void;
  bonusUnlocked?: boolean;
}

// ==========================================
// 1. STARLIGHT CATCHER TYPES & CONSTANTS
// ==========================================
interface FallingItem {
  id: number;
  x: number;
  y: number;
  speed: number;
  wobbleSpeed: number;
  wobbleOffset: number;
  type: 'LETTER' | 'CUPCAKE' | 'STAR' | 'ROSE_HEAL' | 'CLOUD_HAZARD';
  radius: number;
}

interface FloatingPopup {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
}

interface BurstParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  size: number;
}

// ==========================================
// 2. MEMORY MATCH CARD DATA
// ==========================================
interface MemoryCard {
  uid: string;
  pairId: string;
  title: string;
  symbol: string;
  subtitle: string;
  accentColor: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const MEMORY_PAIRS = [
  { pairId: 'letter', title: 'Love Letter', symbol: '💌', subtitle: 'Sealed in wax', accentColor: '#e11d48' },
  { pairId: 'cake', title: 'Birthday Cake', symbol: '🎂', subtitle: 'Make a wish', accentColor: '#d97706' },
  { pairId: 'stars', title: 'Stargazing', symbol: '✨', subtitle: 'Midnight sky', accentColor: '#4f46e5' },
  { pairId: 'coffee', title: 'Morning Cafe', symbol: '☕', subtitle: 'Two warm cups', accentColor: '#78350f' },
  { pairId: 'rose', title: 'Red Bouquet', symbol: '🌹', subtitle: 'Freshly bloomed', accentColor: '#be123c' },
  { pairId: 'camera', title: 'Polaroid Snap', symbol: '📸', subtitle: 'Captured moment', accentColor: '#0f766e' },
  { pairId: 'vinyl', title: 'Our Song', symbol: '🎶', subtitle: 'Slow dancing', accentColor: '#6d28d9' },
  { pairId: 'lantern', title: 'Sky Lantern', symbol: '🏮', subtitle: 'Floating wish', accentColor: '#ea580c' },
];

// ==========================================
// 3. WORD CIPHER PUZZLES
// ==========================================
interface WordPuzzle {
  word: string;
  category: string;
  clue: string;
  sweetNote: string;
}

const WORD_PUZZLES: WordPuzzle[] = [
  {
    word: 'SOULMATE',
    category: 'Destiny & Devotion',
    clue: 'The one person in the universe whose heart beats in rhythm with yours.',
    sweetNote: 'From our very first conversation, my soul recognized yours.',
  },
  {
    word: 'SERENADE',
    category: 'Romantic Melody',
    clue: 'A gentle song played under the stars just for someone adored.',
    sweetNote: 'Every laugh we share is my favorite song in the world.',
  },
  {
    word: 'CHERISH',
    category: 'Promise',
    clue: 'To hold someone dear and treasure every single moment together.',
    sweetNote: 'I promise to treasure your smile today, tomorrow, and always.',
  },
  {
    word: 'STARLIGHT',
    category: 'Night Sky',
    clue: 'The silver glow in the midnight sky that reminds me of your eyes.',
    sweetNote: 'Even the brightest constellation pales next to you.',
  },
  {
    word: 'FOREVER',
    category: 'Timeline',
    clue: 'How long I want to keep making birthday memories with you.',
    sweetNote: 'A hundred lifetimes with you still would not be enough.',
  },
  {
    word: 'TREASURE',
    category: 'Keepsake',
    clue: 'Something rare, priceless, and irreplaceable—just like you.',
    sweetNote: 'You are the greatest gift life has ever given me.',
  },
];

function scrambleWord(word: string): string[] {
  const arr = word.split('');
  for (let attempt = 0; attempt < 10; attempt++) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    if (arr.join('') !== word) break;
  }
  return arr;
}

export const BirthdayGameArcade: React.FC<BirthdayGameArcadeProps> = ({
  girlfriendName,
  boyfriendName,
  onUnlockBonusCoupon,
  bonusUnlocked = false,
}) => {
  const [activeMode, setActiveMode] = useState<GameMode>('STARLIGHT_CATCHER');
  const [totalArcadePoints, setTotalArcadePoints] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('amore_arcade_points') || '0');
    } catch {
      return 0;
    }
  });

  const addArcadePoints = useCallback((pts: number) => {
    setTotalArcadePoints((prev) => {
      const next = prev + pts;
      try {
        localStorage.setItem('amore_arcade_points', String(next));
      } catch {}
      return next;
    });
  }, []);

  // =========================================================
  // GAME 1: STARLIGHT CATCHER (HTML5 CANVAS 2D ACTION GAME)
  // =========================================================
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [catcherState, setCatcherState] = useState<GameState>('TITLE_MENU');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('amore_catcher_highscore') || '0');
    } catch {
      return 0;
    }
  });
  const [lives, setLives] = useState(3);
  const [combo, setCombo] = useState(1);
  const [wave, setWave] = useState(1);
  const [caughtCount, setCaughtCount] = useState(0);

  // Mutable game refs for smooth 60fps loop
  const gameRef = useRef<{
    playerX: number;
    targetX: number;
    keys: { left: boolean; right: boolean };
    items: FallingItem[];
    popups: FloatingPopup[];
    particles: BurstParticle[];
    score: number;
    lives: number;
    combo: number;
    wave: number;
    caughtCount: number;
    lastSpawnTime: number;
    nextItemId: number;
  }>({
    playerX: 360,
    targetX: 360,
    keys: { left: false, right: false },
    items: [],
    popups: [],
    particles: [],
    score: 0,
    lives: 3,
    combo: 1,
    wave: 1,
    caughtCount: 0,
    lastSpawnTime: 0,
    nextItemId: 1,
  });

  const startCatcherGame = () => {
    romanticAudio.playSoftClick();
    gameRef.current = {
      playerX: 360,
      targetX: 360,
      keys: { left: false, right: false },
      items: [],
      popups: [],
      particles: [],
      score: 0,
      lives: 3,
      combo: 1,
      wave: 1,
      caughtCount: 0,
      lastSpawnTime: performance.now(),
      nextItemId: 1,
    };
    setScore(0);
    setLives(3);
    setCombo(1);
    setWave(1);
    setCaughtCount(0);
    setCatcherState('PLAYING');
  };

  const togglePauseCatcher = () => {
    romanticAudio.playSoftClick();
    setCatcherState((prev) => (prev === 'PLAYING' ? 'PAUSED' : 'PLAYING'));
  };

  // Keyboard listener for Starlight Catcher
  useEffect(() => {
    if (activeMode !== 'STARLIGHT_CATCHER' || catcherState !== 'PLAYING') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        gameRef.current.keys.left = true;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        gameRef.current.keys.right = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        gameRef.current.keys.left = false;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        gameRef.current.keys.right = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [activeMode, catcherState]);

  // Main 60fps Canvas Loop for Starlight Catcher
  useEffect(() => {
    if (activeMode !== 'STARLIGHT_CATCHER' || catcherState !== 'PLAYING') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const width = canvas.width;
    const height = canvas.height;
    const basketWidth = 96;
    const basketHeight = 28;
    const basketY = height - 48;

    const spawnParticles = (x: number, y: number, color: string) => {
      for (let i = 0; i < 12; i++) {
        const angle = (Math.PI * 2 * i) / 12 + Math.random() * 0.3;
        const speed = 1.5 + Math.random() * 3.2;
        gameRef.current.particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color,
          alpha: 1,
          size: 3 + Math.random() * 3,
        });
      }
    };

    const renderLoop = (now: number) => {
      const state = gameRef.current;

      // 1. Update player position (keyboard or pointer interpolation)
      if (state.keys.left) {
        state.targetX = Math.max(basketWidth / 2 + 12, state.playerX - 9);
      }
      if (state.keys.right) {
        state.targetX = Math.min(width - basketWidth / 2 - 12, state.playerX + 9);
      }
      state.playerX += (state.targetX - state.playerX) * 0.25;
      state.playerX = Math.max(
        basketWidth / 2 + 8,
        Math.min(width - basketWidth / 2 - 8, state.playerX)
      );

      // 2. Spawn items based on wave speed
      const spawnInterval = Math.max(420, 1050 - (state.wave - 1) * 95);
      if (now - state.lastSpawnTime > spawnInterval) {
        state.lastSpawnTime = now;
        const roll = Math.random();
        let type: FallingItem['type'] = 'LETTER';
        if (roll < 0.18) {
          type = 'CLOUD_HAZARD';
        } else if (roll < 0.32) {
          type = 'STAR';
        } else if (roll < 0.56) {
          type = 'CUPCAKE';
        } else if (roll < 0.63 && state.lives < 3) {
          type = 'ROSE_HEAL';
        } else {
          type = 'LETTER';
        }

        const baseSpeed = 2.1 + state.wave * 0.35 + Math.random() * 1.2;
        state.items.push({
          id: state.nextItemId++,
          x: 40 + Math.random() * (width - 80),
          y: -25,
          speed: type === 'STAR' ? baseSpeed * 1.22 : baseSpeed,
          wobbleSpeed: 0.02 + Math.random() * 0.02,
          wobbleOffset: Math.random() * Math.PI * 2,
          type,
          radius: 20,
        });
      }

      // 3. Draw Night Sky Background
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, '#0f172a');
      skyGrad.addColorStop(0.6, '#1e1b4b');
      skyGrad.addColorStop(1, '#31102f');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Ambient twinkling stars
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      for (let i = 0; i < 28; i++) {
        const sx = ((i * 97) % (width - 20)) + 10;
        const sy = ((i * 53) % (height - 100)) + 15;
        const r = (i % 3) * 0.6 + 0.8;
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Subtle ground glow line
      ctx.strokeStyle = 'rgba(244, 114, 182, 0.25)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, height - 20);
      ctx.lineTo(width, height - 20);
      ctx.stroke();

      // 4. Update & Draw Falling Items
      const remainingItems: FallingItem[] = [];
      for (const item of state.items) {
        item.y += item.speed;
        const drawX = item.x + Math.sin(item.y * item.wobbleSpeed + item.wobbleOffset) * 12;

        // Check collision with player basket
        const hitX = Math.abs(drawX - state.playerX) < basketWidth / 2 + item.radius * 0.65;
        const hitY = Math.abs(item.y - basketY) < basketHeight / 2 + item.radius * 0.7;

        if (hitX && hitY) {
          if (item.type === 'CLOUD_HAZARD') {
            romanticAudio.playMissSound();
            state.lives -= 1;
            state.combo = 1;
            setLives(state.lives);
            setCombo(1);
            spawnParticles(drawX, item.y, '#94a3b8');
            state.popups.push({
              id: state.nextItemId++,
              x: drawX,
              y: item.y - 10,
              text: 'Storm Cloud! -1 ♥',
              color: '#fda4af',
              alpha: 1,
            });

            if (state.lives <= 0) {
              // Game over
              if (state.score > highScore) {
                setHighScore(state.score);
                try {
                  localStorage.setItem('amore_catcher_highscore', String(state.score));
                } catch {}
              }
              addArcadePoints(state.score);
              setCatcherState('GAME_OVER');
              return;
            }
          } else {
            // Positive catch!
            let basePts = 15;
            let label = 'Love Note';
            let pColor = '#f43f5e';

            if (item.type === 'CUPCAKE') {
              basePts = 25;
              label = 'Cupcake';
              pColor = '#f59e0b';
            } else if (item.type === 'STAR') {
              basePts = 50;
              label = 'Shooting Star';
              pColor = '#fde047';
            } else if (item.type === 'ROSE_HEAL') {
              basePts = 30;
              label = '+1 Heart';
              pColor = '#10b981';
              state.lives = Math.min(3, state.lives + 1);
              setLives(state.lives);
            }

            const earned = basePts * state.combo;
            state.score += earned;
            state.caughtCount += 1;

            if (state.caughtCount % 5 === 0) {
              state.combo = Math.min(5, state.combo + 1);
            }
            const nextWave = Math.floor(state.caughtCount / 10) + 1;
            if (nextWave > state.wave) {
              state.wave = nextWave;
              setWave(nextWave);
            }

            setScore(state.score);
            setCombo(state.combo);
            setCaughtCount(state.caughtCount);
            romanticAudio.playCatchChime(state.combo);
            spawnParticles(drawX, item.y, pColor);

            state.popups.push({
              id: state.nextItemId++,
              x: drawX,
              y: item.y - 12,
              text: `+${earned} ${state.combo > 1 ? `(${state.combo}x)` : label}`,
              color: '#fde047',
              alpha: 1,
            });
          }
          continue;
        }

        // Check if fell off bottom
        if (item.y > height + 25) {
          if (item.type !== 'CLOUD_HAZARD' && item.type !== 'ROSE_HEAL') {
            // Reset combo on missed wish
            if (state.combo > 1) {
              state.combo = 1;
              setCombo(1);
            }
          }
          continue;
        }

        // Draw item circular badge + emoji
        ctx.save();
        ctx.beginPath();
        ctx.arc(drawX, item.y, item.radius, 0, Math.PI * 2);
        if (item.type === 'CLOUD_HAZARD') {
          ctx.fillStyle = 'rgba(51, 65, 85, 0.85)';
          ctx.strokeStyle = '#94a3b8';
        } else if (item.type === 'STAR') {
          ctx.fillStyle = 'rgba(254, 240, 138, 0.22)';
          ctx.strokeStyle = '#fde047';
        } else {
          ctx.fillStyle = 'rgba(255, 241, 242, 0.18)';
          ctx.strokeStyle = 'rgba(251, 113, 133, 0.6)';
        }
        ctx.lineWidth = 1.5;
        ctx.fill();
        ctx.stroke();

        ctx.font = '20px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const emoji =
          item.type === 'LETTER'
            ? '💌'
            : item.type === 'CUPCAKE'
            ? '🧁'
            : item.type === 'STAR'
            ? '🌟'
            : item.type === 'ROSE_HEAL'
            ? '🌹'
            : '⛈️';
        ctx.fillText(emoji, drawX, item.y + 1);
        ctx.restore();

        remainingItems.push(item);
      }
      state.items = remainingItems;

      // 5. Draw Player Keepsake Basket
      ctx.save();
      const bx = state.playerX - basketWidth / 2;
      const by = basketY - basketHeight / 2;

      // Basket glow
      ctx.shadowColor = 'rgba(244, 63, 94, 0.5)';
      ctx.shadowBlur = 14;

      // Rounded basket body
      ctx.fillStyle = '#fff1f2';
      ctx.strokeStyle = '#fb7185';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(bx, by, basketWidth, basketHeight, 14);
      ctx.fill();
      ctx.stroke();

      // Label inside basket
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#9f1239';
      ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`♥ ${girlfriendName}'s Wishes ♥`, state.playerX, basketY + 1);
      ctx.restore();

      // 6. Update & Draw Particles
      const nextParticles: BurstParticle[] = [];
      for (const p of state.particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.032;
        if (p.alpha > 0) {
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          nextParticles.push(p);
        }
      }
      state.particles = nextParticles;

      // 7. Update & Draw Floating Popups
      const nextPopups: FloatingPopup[] = [];
      for (const pop of state.popups) {
        pop.y -= 1.1;
        pop.alpha -= 0.024;
        if (pop.alpha > 0) {
          ctx.save();
          ctx.globalAlpha = pop.alpha;
          ctx.fillStyle = pop.color;
          ctx.font = 'bold 13px "Plus Jakarta Sans", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(pop.text, pop.x, pop.y);
          ctx.restore();
          nextPopups.push(pop);
        }
      }
      state.popups = nextPopups;

      animationFrameId = requestAnimationFrame(renderLoop);
    };

    animationFrameId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [activeMode, catcherState, girlfriendName, highScore, addArcadePoints]);

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (catcherState !== 'PLAYING' || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const x = (e.clientX - rect.left) * scaleX;
    gameRef.current.targetX = x;
  };

  // =========================================================
  // GAME 2: KEEPSAKE MEMORY MATCH (CARD TABLE BOARD GAME)
  // =========================================================
  const [memoryCards, setMemoryCards] = useState<MemoryCard[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [memoryMoves, setMemoryMoves] = useState(0);
  const [matchedCount, setMatchedCount] = useState(0);
  const [memoryBestMoves, setMemoryBestMoves] = useState<number | null>(() => {
    try {
      const saved = localStorage.getItem('amore_memory_best');
      return saved ? Number(saved) : null;
    } catch {
      return null;
    }
  });
  const [isMemoryLocked, setIsMemoryLocked] = useState(false);

  const initMemoryGame = useCallback(() => {
    const deck: MemoryCard[] = [];
    MEMORY_PAIRS.forEach((pair) => {
      deck.push({ ...pair, uid: `${pair.pairId}-a`, isFlipped: false, isMatched: false });
      deck.push({ ...pair, uid: `${pair.pairId}-b`, isFlipped: false, isMatched: false });
    });
    // Shuffle
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    setMemoryCards(deck);
    setFlippedIndices([]);
    setMemoryMoves(0);
    setMatchedCount(0);
    setIsMemoryLocked(false);
  }, []);

  useEffect(() => {
    initMemoryGame();
  }, [initMemoryGame]);

  const handleCardClick = (index: number) => {
    if (isMemoryLocked) return;
    const card = memoryCards[index];
    if (!card || card.isFlipped || card.isMatched) return;

    romanticAudio.playSoftClick();
    const updated = memoryCards.map((c, i) => (i === index ? { ...c, isFlipped: true } : c));
    setMemoryCards(updated);

    const nextFlipped = [...flippedIndices, index];
    setFlippedIndices(nextFlipped);

    if (nextFlipped.length === 2) {
      const nextMoves = memoryMoves + 1;
      setMemoryMoves(nextMoves);
      setIsMemoryLocked(true);

      const [firstIdx, secondIdx] = nextFlipped;
      if (updated[firstIdx].pairId === updated[secondIdx].pairId) {
        // Match!
        setTimeout(() => {
          romanticAudio.playMatchSuccess();
          setMemoryCards((prev) =>
            prev.map((c, i) =>
              i === firstIdx || i === secondIdx ? { ...c, isMatched: true } : c
            )
          );
          setFlippedIndices([]);
          setIsMemoryLocked(false);
          const nextMatched = matchedCount + 1;
          setMatchedCount(nextMatched);
          addArcadePoints(40);

          if (nextMatched === MEMORY_PAIRS.length) {
            romanticAudio.playCelebrationChime();
            confetti({ particleCount: 65, spread: 70, origin: { y: 0.7 } });
            if (memoryBestMoves === null || nextMoves < memoryBestMoves) {
              setMemoryBestMoves(nextMoves);
              try {
                localStorage.setItem('amore_memory_best', String(nextMoves));
              } catch {}
            }
          }
        }, 280);
      } else {
        // No match
        setTimeout(() => {
          setMemoryCards((prev) =>
            prev.map((c, i) =>
              i === firstIdx || i === secondIdx ? { ...c, isFlipped: false } : c
            )
          );
          setFlippedIndices([]);
          setIsMemoryLocked(false);
        }, 700);
      }
    }
  };

  // =========================================================
  // GAME 3: LOVE NOTE WORD CIPHER (ROMANTIC WORD PUZZLE)
  // =========================================================
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const currentPuzzle = WORD_PUZZLES[puzzleIndex % WORD_PUZZLES.length];
  const [scrambledPool, setScrambledPool] = useState<{ char: string; used: boolean }[]>([]);
  const [guessedIndices, setGuessedIndices] = useState<number[]>([]);
  const [hintTier, setHintTier] = useState(0); // 0 = none, 1 = category/clue, 2 = first 2 letters, 3 = half word
  const [wordSolved, setWordSolved] = useState(false);
  const [solvedCount, setSolvedCount] = useState(0);

  const loadWordPuzzle = useCallback((idx: number) => {
    const target = WORD_PUZZLES[idx % WORD_PUZZLES.length].word;
    const chars = scrambleWord(target);
    setScrambledPool(chars.map((char) => ({ char, used: false })));
    setGuessedIndices([]);
    setHintTier(0);
    setWordSolved(false);
  }, []);

  useEffect(() => {
    loadWordPuzzle(puzzleIndex);
  }, [puzzleIndex, loadWordPuzzle]);

  const currentGuessString = guessedIndices.map((i) => scrambledPool[i]?.char || '').join('');

  const handleSelectTile = (poolIndex: number) => {
    if (wordSolved || scrambledPool[poolIndex]?.used) return;
    romanticAudio.playSoftClick();

    const nextPool = scrambledPool.map((item, idx) =>
      idx === poolIndex ? { ...item, used: true } : item
    );
    const nextGuessed = [...guessedIndices, poolIndex];
    setScrambledPool(nextPool);
    setGuessedIndices(nextGuessed);

    const candidate = nextGuessed.map((i) => nextPool[i].char).join('');
    if (candidate === currentPuzzle.word) {
      setWordSolved(true);
      setSolvedCount((c) => c + 1);
      addArcadePoints(75);
      romanticAudio.playMatchSuccess();
      confetti({ particleCount: 45, spread: 55, origin: { y: 0.75 } });
    } else if (candidate.length === currentPuzzle.word.length) {
      romanticAudio.playMissSound();
    }
  };

  const handleRemoveLastLetter = () => {
    if (wordSolved || guessedIndices.length === 0) return;
    romanticAudio.playSoftClick();
    const lastPoolIdx = guessedIndices[guessedIndices.length - 1];
    setScrambledPool((prev) =>
      prev.map((item, idx) => (idx === lastPoolIdx ? { ...item, used: false } : item))
    );
    setGuessedIndices((prev) => prev.slice(0, -1));
  };

  const handleClearGuess = () => {
    if (wordSolved) return;
    romanticAudio.playSoftClick();
    setScrambledPool((prev) => prev.map((item) => ({ ...item, used: false })));
    setGuessedIndices([]);
  };

  const handleUseHint = () => {
    if (wordSolved) return;
    romanticAudio.playSoftClick();
    const nextTier = Math.min(3, hintTier + 1);
    setHintTier(nextTier);

    // Automatically place the next correct letter into the guess slot
    const targetWord = currentPuzzle.word;
    let matchPrefixLen = 0;
    for (let i = 0; i < guessedIndices.length; i++) {
      if (scrambledPool[guessedIndices[i]]?.char === targetWord[i]) {
        matchPrefixLen++;
      } else {
        break;
      }
    }

    const revealLen = Math.min(targetWord.length - 1, matchPrefixLen + 1);
    const newPool = scrambledPool.map((item) => ({ ...item, used: false }));
    const newGuessed: number[] = [];

    for (let i = 0; i < revealLen; i++) {
      const neededChar = targetWord[i];
      const foundIdx = newPool.findIndex((item) => !item.used && item.char === neededChar);
      if (foundIdx !== -1) {
        newPool[foundIdx].used = true;
        newGuessed.push(foundIdx);
      }
    }

    setScrambledPool(newPool);
    setGuessedIndices(newGuessed);
  };

  const handleNextWord = () => {
    romanticAudio.playSoftClick();
    setPuzzleIndex((prev) => prev + 1);
  };

  // Lives status label for non-hue-only signaling
  const getLivesStatusText = () => {
    if (lives === 3) return '3/3 · FULL';
    if (lives === 2) return '2/3 · STEADY';
    if (lives === 1) return '1/3 · CRITICAL';
    return '0/3 · DEPLETED';
  };

  return (
    <section id="arcade" className="py-20 border-b border-stone-200/80 bg-[#f6f1eb]">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-800 uppercase tracking-widest mb-2">
              <span>Interactive Keepsake Arcade</span>
              <span aria-hidden="true">·</span>
              <span>3 Playable Mini-Games</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-stone-900 text-balance">
              The Birthday Game Lounge for {girlfriendName}
            </h2>
            <p className="mt-2 text-sm sm:text-base text-stone-600 max-w-2xl">
              Catch falling birthday wishes under the stars, match our favorite keepsake cards, or solve romantic word ciphers to unlock a secret golden birthday voucher.
            </p>
          </div>

          {/* Total Arcade Score & Bonus Unlock Progress */}
          <div className="bg-white border border-stone-200/90 rounded-xl p-4 flex items-center gap-4 shadow-xs shrink-0">
            <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-stone-500 font-medium">
                Total Arcade Score · <span className="font-mono tabular-nums font-semibold text-stone-900">{totalArcadePoints} pts</span>
              </div>
              {totalArcadePoints >= 300 ? (
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs font-semibold text-emerald-700">
                    ★ Golden Birthday Prize Ready!
                  </span>
                  {onUnlockBonusCoupon && !bonusUnlocked && (
                    <button
                      onClick={() => {
                        romanticAudio.playCelebrationChime();
                        confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 } });
                        onUnlockBonusCoupon();
                      }}
                      className="px-2.5 py-1 text-xs font-medium bg-rose-700 text-white rounded-md hover:bg-rose-800 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Claim Bonus Voucher
                    </button>
                  )}
                  {bonusUnlocked && (
                    <span className="text-xs text-stone-500">Added to Vouchers</span>
                  )}
                </div>
              ) : (
                <div className="text-xs text-stone-500 mt-0.5 tabular-nums">
                  Earn <span className="font-semibold text-rose-700">{Math.max(0, 300 - totalArcadePoints)} more pts</span> to unlock a Secret Golden Voucher
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Interactive Game Selector Tabs (Segmented Controls) */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="inline-flex items-center gap-1.5 p-1.5 bg-stone-200/80 rounded-xl">
            <button
              onClick={() => {
                romanticAudio.playSoftClick();
                setActiveMode('STARLIGHT_CATCHER');
              }}
              className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors inline-flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
                activeMode === 'STARLIGHT_CATCHER'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-700 hover:text-stone-950'
              }`}
            >
              <Gamepad2 className="w-4 h-4" />
              <span>01. Starlight Wish Catcher</span>
            </button>

            <button
              onClick={() => {
                romanticAudio.playSoftClick();
                setActiveMode('MEMORY_MATCH');
              }}
              className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors inline-flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
                activeMode === 'MEMORY_MATCH'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-700 hover:text-stone-950'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>02. Keepsake Memory Match</span>
            </button>

            <button
              onClick={() => {
                romanticAudio.playSoftClick();
                setActiveMode('WORD_CIPHER');
              }}
              className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors inline-flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
                activeMode === 'WORD_CIPHER'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-700 hover:text-stone-950'
              }`}
            >
              <Type className="w-4 h-4" />
              <span>03. Love Note Word Cipher</span>
            </button>
          </div>

          <div className="text-xs text-stone-500">
            <span>Controls: Mouse, Touch, or Keyboard</span>
            <span aria-hidden="true"> · </span>
            <span>Web Audio Synthesized FX</span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* MODE 1: STARLIGHT WISH CATCHER                            */}
        {/* ========================================================= */}
        {activeMode === 'STARLIGHT_CATCHER' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-md">
            {/* Unobtrusive Top HUD Header */}
            <div className="px-6 py-4 bg-slate-950/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 text-slate-200">
              <div className="flex flex-wrap items-center gap-6 text-xs sm:text-sm">
                <div>
                  <span className="text-slate-400">Score: </span>
                  <span className="font-mono font-bold text-white tabular-nums text-base">
                    {score}
                  </span>
                </div>
                <span className="text-slate-700" aria-hidden="true">·</span>
                <div>
                  <span className="text-slate-400">Combo: </span>
                  <span className="font-mono font-bold text-amber-400 tabular-nums">
                    {combo}x
                  </span>
                </div>
                <span className="text-slate-700" aria-hidden="true">·</span>
                <div>
                  <span className="text-slate-400">Wave: </span>
                  <span className="font-mono font-semibold text-rose-300 tabular-nums">
                    {wave}
                  </span>
                </div>
                <span className="text-slate-700" aria-hidden="true">·</span>
                <div className="flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                  <span className="font-mono text-xs font-semibold tabular-nums text-rose-200">
                    Hearts: {getLivesStatusText()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-xs text-slate-400 font-mono tabular-nums">
                  Best: <span className="text-amber-300 font-semibold">{Math.max(highScore, score)}</span>
                </div>
                {catcherState === 'PLAYING' || catcherState === 'PAUSED' ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={togglePauseCatcher}
                      className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      {catcherState === 'PAUSED' ? (
                        <>
                          <Play className="w-3.5 h-3.5" />
                          <span>Resume</span>
                        </>
                      ) : (
                        <>
                          <Pause className="w-3.5 h-3.5" />
                          <span>Pause</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={startCatcherGame}
                      className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restart</span>
                    </button>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Game Canvas Container */}
            <div className="relative w-full aspect-[16/9] max-h-[500px] bg-slate-950 flex items-center justify-center select-none">
              <canvas
                ref={canvasRef}
                width={760}
                height={420}
                onPointerMove={handleCanvasPointerMove}
                className="w-full h-full object-contain cursor-ew-resize touch-none"
              />

              {/* STATE: TITLE_MENU */}
              {catcherState === 'TITLE_MENU' && (
                <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center">
                  <div className="max-w-md">
                    <p className="text-xs font-semibold uppercase tracking-widest text-rose-400 mb-2">
                      Arcade Action Game · 60 FPS
                    </p>
                    <h3 className="text-2xl sm:text-3xl font-serif font-bold text-white mb-3">
                      Starlight Wish Catcher
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
                      Move your keepsake basket with your mouse, finger, or <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-200 font-mono text-xs">←</kbd> <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-200 font-mono text-xs">→</kbd> arrow keys. Catch falling Love Letters (💌), Birthday Cupcakes (🧁), and Shooting Stars (🌟) while dodging Storm Clouds (⛈️)!
                    </p>

                    <div className="grid grid-cols-3 gap-3 text-left bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl mb-6 text-xs">
                      <div>
                        <div className="font-semibold text-rose-300">💌 Love Note</div>
                        <div className="text-slate-400 tabular-nums">+15 pts · Combo</div>
                      </div>
                      <div>
                        <div className="font-semibold text-amber-300">🌟 Gold Star</div>
                        <div className="text-slate-400 tabular-nums">+50 pts · Boost</div>
                      </div>
                      <div>
                        <div className="font-semibold text-slate-300">⛈️ Storm Cloud</div>
                        <div className="text-slate-400 tabular-nums">-1 Heart Hazard</div>
                      </div>
                    </div>

                    <button
                      onClick={startCatcherGame}
                      className="px-6 py-3 text-sm font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-sm transition-colors inline-flex items-center gap-2 cursor-pointer whitespace-nowrap"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>Start Game</span>
                    </button>
                  </div>
                </div>
              )}

              {/* STATE: PAUSED */}
              {catcherState === 'PAUSED' && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center">
                  <h3 className="text-2xl font-serif font-bold text-white mb-2">
                    Game Paused
                  </h3>
                  <p className="text-sm text-slate-300 mb-6">
                    Current Score: <span className="font-mono font-bold text-amber-300">{score}</span> · Wave {wave}
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={togglePauseCatcher}
                      className="px-5 py-2.5 text-sm font-medium bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Resume Game
                    </button>
                    <button
                      onClick={startCatcherGame}
                      className="px-5 py-2.5 text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Restart
                    </button>
                  </div>
                </div>
              )}

              {/* STATE: GAME_OVER */}
              {catcherState === 'GAME_OVER' && (
                <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center">
                  <div className="max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
                    <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-3">
                      <Award className="w-6 h-6" />
                    </div>
                    <h3 className="text-2xl font-serif font-bold text-white mb-1">
                      Wonderful Catching, {girlfriendName}!
                    </h3>
                    <p className="text-xs text-slate-400 mb-5">
                      Every wish caught is another happy memory for your birthday year ahead.
                    </p>

                    <div className="grid grid-cols-3 gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 mb-6">
                      <div>
                        <div className="text-[11px] text-slate-400">Final Score</div>
                        <div className="text-lg font-mono font-bold text-white tabular-nums">{score}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-slate-400">Wishes Caught</div>
                        <div className="text-lg font-mono font-bold text-rose-400 tabular-nums">{caughtCount}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-slate-400">High Score</div>
                        <div className="text-lg font-mono font-bold text-amber-400 tabular-nums">
                          {Math.max(score, highScore)}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={startCatcherGame}
                      className="w-full py-3 px-5 text-sm font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition-colors inline-flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Play Again</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODE 2: KEEPSAKE MEMORY MATCH                             */}
        {/* ========================================================= */}
        {activeMode === 'MEMORY_MATCH' && (
          <div className="bg-[#1b3b2b] border border-[#12291e] rounded-2xl p-6 sm:p-8 shadow-md text-stone-100">
            {/* Top HUD Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 mb-6 border-b border-emerald-900/80">
              <div>
                <h3 className="text-xl sm:text-2xl font-serif font-bold text-white">
                  Keepsake Memory Match Table
                </h3>
                <p className="text-xs sm:text-sm text-emerald-200/80 mt-0.5">
                  Flip two cards at a time to pair all 8 romantic birthday keepsakes.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-5 text-xs sm:text-sm">
                <div>
                  <span className="text-emerald-200/70">Pairs Found: </span>
                  <span className="font-mono font-bold text-white tabular-nums">
                    {matchedCount} / {MEMORY_PAIRS.length}
                  </span>
                </div>
                <span className="text-emerald-800" aria-hidden="true">·</span>
                <div>
                  <span className="text-emerald-200/70">Moves: </span>
                  <span className="font-mono font-bold text-amber-300 tabular-nums">
                    {memoryMoves}
                  </span>
                </div>
                {memoryBestMoves !== null && (
                  <>
                    <span className="text-emerald-800" aria-hidden="true">·</span>
                    <div>
                      <span className="text-emerald-200/70">Best: </span>
                      <span className="font-mono font-semibold text-emerald-300 tabular-nums">
                        {memoryBestMoves} moves
                      </span>
                    </div>
                  </>
                )}

                <button
                  onClick={() => {
                    romanticAudio.playSoftClick();
                    initMemoryGame();
                  }}
                  className="px-3.5 py-2 text-xs font-medium bg-emerald-950/90 hover:bg-emerald-900 text-emerald-100 border border-emerald-700/60 rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Board</span>
                </button>
              </div>
            </div>

            {/* 4x4 Card Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4 max-w-3xl mx-auto">
              {memoryCards.map((card, idx) => {
                const revealed = card.isFlipped || card.isMatched;
                return (
                  <button
                    key={card.uid}
                    onClick={() => handleCardClick(idx)}
                    disabled={revealed}
                    aria-label={revealed ? card.title : `Hidden keepsake card ${idx + 1}`}
                    className={`h-28 sm:h-32 rounded-xl p-3 flex flex-col items-center justify-center text-center transition-all duration-150 cursor-pointer select-none border ${
                      revealed
                        ? card.isMatched
                          ? 'bg-amber-50 border-amber-300 text-stone-900 shadow-sm scale-[0.98]'
                          : 'bg-white border-stone-200 text-stone-900 shadow-md'
                        : 'bg-emerald-950/75 hover:bg-emerald-900/90 border-emerald-700/60 text-emerald-200 shadow-xs hover:-translate-y-0.5'
                    }`}
                  >
                    {revealed ? (
                      <>
                        <span className="text-2xl sm:text-3xl mb-1.5" role="img" aria-hidden="true">
                          {card.symbol}
                        </span>
                        <span className="font-serif font-bold text-xs sm:text-sm text-stone-900 leading-tight">
                          {card.title}
                        </span>
                        <span className="text-[11px] text-stone-500 mt-0.5">
                          {card.isMatched ? '✓ Matched' : card.subtitle}
                        </span>
                      </>
                    ) : (
                      <>
                        <div className="w-8 h-8 rounded-full border border-emerald-600/50 flex items-center justify-center text-rose-300 text-sm mb-1">
                          ♥
                        </div>
                        <span className="text-[11px] font-serif tracking-wider uppercase text-emerald-300/70">
                          Amore Deck
                        </span>
                      </>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Victory Banner when all 8 pairs matched */}
            {matchedCount === MEMORY_PAIRS.length && (
              <div className="mt-8 max-w-2xl mx-auto bg-white text-stone-900 rounded-xl p-5 border border-amber-300 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-rose-700">
                    All 8 Keepsake Pairs Matched!
                  </div>
                  <h4 className="text-lg font-serif font-bold text-stone-900 mt-0.5">
                    Completed in {memoryMoves} moves, {girlfriendName}!
                  </h4>
                  <p className="text-xs text-stone-600 mt-0.5">
                    “Every card on this table represents a memory I cannot wait to keep making with you.” — {boyfriendName}
                  </p>
                </div>
                <button
                  onClick={() => {
                    romanticAudio.playSoftClick();
                    initMemoryGame();
                  }}
                  className="px-4 py-2.5 text-xs font-semibold bg-stone-900 text-white hover:bg-stone-800 rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Play Again</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* MODE 3: LOVE NOTE WORD CIPHER                             */}
        {/* ========================================================= */}
        {activeMode === 'WORD_CIPHER' && (
          <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-xs">
            {/* Top Status Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 mb-6 border-b border-stone-200">
              <div>
                <div className="text-xs text-rose-800 font-semibold uppercase tracking-wider mb-1">
                  Puzzle {puzzleIndex + 1} of {WORD_PUZZLES.length} · {currentPuzzle.category}
                </div>
                <h3 className="text-xl sm:text-2xl font-serif font-bold text-stone-900">
                  Unscramble the Secret Keepsake Word
                </h3>
              </div>

              <div className="flex items-center gap-4 text-xs sm:text-sm">
                <div className="text-stone-600">
                  Words Solved: <span className="font-mono font-bold text-stone-900 tabular-nums">{solvedCount}</span>
                </div>
                <button
                  onClick={handleUseHint}
                  disabled={wordSolved}
                  className="px-3.5 py-2 text-xs font-medium bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 whitespace-nowrap"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-amber-700" />
                  <span>Reveal Letter Hint ({hintTier}/3)</span>
                </button>
              </div>
            </div>

            {/* Clue Card */}
            <div className="max-w-2xl mx-auto text-center mb-8">
              <p className="text-sm sm:text-base text-stone-700 font-serif italic bg-stone-50 border border-stone-200/80 rounded-xl p-4">
                “{currentPuzzle.clue}”
              </p>
            </div>

            {/* Target Answer Slots (Large >= 44px high-contrast tiles) */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 mb-8">
              {currentPuzzle.word.split('').map((targetChar, slotIdx) => {
                const chosenChar = currentGuessString[slotIdx] || '';
                const isFullAndWrong =
                  !wordSolved &&
                  currentGuessString.length === currentPuzzle.word.length &&
                  currentGuessString !== currentPuzzle.word;

                return (
                  <div
                    key={slotIdx}
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl border-2 flex items-center justify-center text-lg sm:text-xl font-mono font-bold transition-all ${
                      wordSolved
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
                        : isFullAndWrong
                        ? 'bg-rose-50 border-rose-400 text-rose-900'
                        : chosenChar
                        ? 'bg-stone-900 border-stone-900 text-white'
                        : 'bg-stone-50 border-stone-300 text-stone-400'
                    }`}
                  >
                    {chosenChar}
                  </div>
                );
              })}
            </div>

            {/* Scrambled Letter Pool Buttons (>= 44px touch targets) */}
            {!wordSolved ? (
              <div className="max-w-xl mx-auto">
                <div className="flex flex-wrap items-center justify-center gap-2.5 mb-6">
                  {scrambledPool.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectTile(idx)}
                      disabled={item.used}
                      className={`min-w-[48px] min-h-[48px] px-4 py-2.5 rounded-xl border font-mono text-lg font-bold transition-all cursor-pointer ${
                        item.used
                          ? 'bg-stone-100 border-stone-200 text-stone-300 opacity-40 cursor-not-allowed'
                          : 'bg-white hover:bg-rose-50 border-stone-300 hover:border-rose-300 text-stone-900 shadow-xs hover:-translate-y-0.5'
                      }`}
                    >
                      {item.char}
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={handleRemoveLastLetter}
                    disabled={guessedIndices.length === 0}
                    className="px-4 py-2 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors disabled:opacity-40 cursor-pointer whitespace-nowrap"
                  >
                    Backspace
                  </button>
                  <button
                    onClick={handleClearGuess}
                    disabled={guessedIndices.length === 0}
                    className="px-4 py-2 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors disabled:opacity-40 cursor-pointer whitespace-nowrap"
                  >
                    Clear Letters
                  </button>
                  <button
                    onClick={handleNextWord}
                    className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Skip Word →
                  </button>
                </div>
              </div>
            ) : (
              /* Solved Celebration Box */
              <div className="max-w-xl mx-auto bg-emerald-50/90 border border-emerald-300 rounded-xl p-5 text-center">
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Cipher Unlocked · +75 Arcade Points</span>
                </div>
                <p className="font-serif text-base sm:text-lg text-stone-900 italic mt-1 mb-4">
                  “{currentPuzzle.sweetNote}”
                </p>
                <button
                  onClick={handleNextWord}
                  className="px-5 py-2.5 text-xs sm:text-sm font-semibold bg-stone-900 hover:bg-stone-800 text-white rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                >
                  Next Love Cipher →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
