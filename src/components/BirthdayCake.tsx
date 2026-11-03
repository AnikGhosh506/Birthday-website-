import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, RotateCcw, Heart, Gift } from 'lucide-react';
import { romanticAudio } from '../utils/audioSynth';

interface BirthdayCakeProps {
  girlfriendName: string;
  nickname: string;
  secretWishMessage: string;
}

export const BirthdayCake: React.FC<BirthdayCakeProps> = ({
  girlfriendName,
  nickname,
  secretWishMessage,
}) => {
  // 5 interactive candles
  const [candles, setCandles] = useState<boolean[]>([true, true, true, true, true]);
  const [showWishModal, setShowWishModal] = useState(false);
  const [hasBlownAll, setHasBlownAll] = useState(false);

  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#e11d48', '#fb7185', '#f59e0b', '#fbbf24', '#ffffff'],
    });

    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#f43f5e', '#fda4af', '#fef08a'],
      });
    }, 200);

    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#fb7185', '#e11d48', '#fef08a'],
      });
    }, 400);
  };

  const handleBlowCandle = (index: number) => {
    if (!candles[index]) return;
    const next = [...candles];
    next[index] = false;
    setCandles(next);
    romanticAudio.playSoftClick();

    // Check if all are now blown out
    if (next.every((c) => !c)) {
      onAllBlown();
    }
  };

  const handleBlowAll = () => {
    setCandles([false, false, false, false, false]);
    onAllBlown();
  };

  const onAllBlown = () => {
    setHasBlownAll(true);
    romanticAudio.playCelebrationChime();
    triggerConfetti();
    setTimeout(() => {
      setShowWishModal(true);
    }, 600);
  };

  const handleRelight = () => {
    setCandles([true, true, true, true, true]);
    setHasBlownAll(false);
    romanticAudio.playSoftClick();
  };

  const remainingCandles = candles.filter(Boolean).length;

  return (
    <div className="relative flex flex-col items-center justify-center p-6 md:p-8 rounded-2xl bg-gradient-to-b from-stone-50 via-rose-50/40 to-stone-100/60 border border-stone-200/80 shadow-sm">
      {/* Status kicker */}
      <div className="text-xs uppercase tracking-widest text-stone-500 font-medium mb-3 flex items-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-rose-500" />
        <span>
          {remainingCandles > 0
            ? `${remainingCandles} Candle${remainingCandles > 1 ? 's' : ''} Still Glowing`
            : 'All Candles Blown Out!'}
        </span>
      </div>

      {/* Interactive Birthday Cake Illustration */}
      <div className="relative w-72 sm:w-84 h-72 flex flex-col items-center justify-end select-none">
        {/* Floating Hearts when completed */}
        {hasBlownAll && (
          <div className="absolute top-2 inset-x-0 flex justify-center gap-6 pointer-events-none animate-bounce">
            <Heart className="w-6 h-6 text-rose-500 fill-rose-500 opacity-90" />
            <Heart className="w-8 h-8 text-rose-600 fill-rose-600 opacity-95" />
            <Heart className="w-6 h-6 text-rose-500 fill-rose-500 opacity-90" />
          </div>
        )}

        {/* Candles Row */}
        <div className="flex justify-center items-end gap-5 mb-1 z-10">
          {candles.map((isLit, idx) => (
            <button
              key={idx}
              onClick={() => handleBlowCandle(idx)}
              aria-label={`Candle ${idx + 1}: ${isLit ? 'Lit, click to blow out' : 'Blown out'}`}
              className="group relative flex flex-col items-center focus:outline-none transition-transform hover:scale-110 active:scale-95"
            >
              {/* Flame or Smoke */}
              <div className="h-9 flex items-center justify-center">
                {isLit ? (
                  <div className="relative">
                    {/* Flame outer glow */}
                    <div className="absolute -inset-1 rounded-full bg-amber-400/40 blur-sm animate-pulse-soft" />
                    {/* Flame body */}
                    <div className="w-3.5 h-6 rounded-full bg-gradient-to-t from-orange-500 via-amber-400 to-yellow-100 animate-flame shadow-[0_0_12px_rgba(251,191,36,0.9)]" />
                    {/* Blue inner core */}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-2 bg-blue-400 rounded-full opacity-80" />
                  </div>
                ) : (
                  /* Soft smoke rising */
                  <div className="flex flex-col items-center opacity-60 transition-opacity">
                    <span className="w-1 h-3 bg-stone-400/50 rounded-full animate-pulse" />
                    <span className="w-0.5 h-1 bg-stone-600 rounded-full" />
                  </div>
                )}
              </div>

              {/* Wick */}
              <div className="w-0.5 h-2 bg-stone-800" />

              {/* Candle Body */}
              <div
                className={`w-3.5 h-10 rounded-t-sm shadow-sm transition-colors ${
                  idx % 2 === 0
                    ? 'bg-gradient-to-b from-rose-200 to-rose-300'
                    : 'bg-gradient-to-b from-amber-100 to-amber-200'
                }`}
              >
                {/* Candle spiral stripes */}
                <div className="w-full h-full opacity-30 bg-[repeating-linear-gradient(45deg,transparent,transparent_3px,rgba(255,255,255,0.8)_3px,rgba(255,255,255,0.8)_6px)]" />
              </div>
            </button>
          ))}
        </div>

        {/* Tier 1 (Top Tier) */}
        <div className="relative w-44 h-14 bg-gradient-to-b from-rose-100 via-rose-50 to-rose-200 rounded-t-xl border-t-2 border-x-2 border-rose-200 shadow-sm flex items-center justify-center">
          {/* Frosting drips */}
          <div className="absolute -bottom-1.5 inset-x-0 flex justify-around">
            <span className="w-3 h-3 bg-rose-200 rounded-full" />
            <span className="w-4 h-4 bg-rose-200 rounded-full" />
            <span className="w-3 h-3 bg-rose-200 rounded-full" />
            <span className="w-4 h-4 bg-rose-200 rounded-full" />
            <span className="w-3 h-3 bg-rose-200 rounded-full" />
          </div>
          {/* Decorative strawberries */}
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 shadow-sm" />
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 shadow-sm" />
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 shadow-sm" />
          </div>
        </div>

        {/* Tier 2 (Middle Tier) */}
        <div className="relative w-56 h-16 bg-gradient-to-b from-stone-50 via-rose-50 to-stone-100 border-t-2 border-x-2 border-rose-200/90 shadow-sm flex items-center justify-center">
          {/* Sugar pearls garland */}
          <div className="flex gap-2 opacity-75">
            {Array.from({ length: 7 }).map((_, i) => (
              <span key={i} className="w-1.5 h-1.5 rounded-full bg-amber-300" />
            ))}
          </div>
          {/* Piping swirl line */}
          <div className="absolute inset-x-2 bottom-2 h-0.5 border-b border-dashed border-rose-300" />
        </div>

        {/* Tier 3 (Base Tier) */}
        <div className="relative w-68 h-20 bg-gradient-to-b from-rose-100 via-rose-50 to-rose-200 rounded-b-md border-2 border-rose-200 shadow-md flex flex-col items-center justify-center overflow-hidden">
          {/* Name Plate */}
          <div className="px-4 py-1 rounded bg-white/80 border border-rose-200/80 shadow-xs">
            <span className="font-serif text-sm font-semibold tracking-wide text-rose-900">
              Happy Birthday, {girlfriendName || 'My Love'}
            </span>
          </div>
          <span className="text-[11px] font-script italic text-rose-700/80 mt-1">
            {nickname ? `Forever ${nickname}` : 'Forever & Always'}
          </span>
        </div>

        {/* Cake Stand / Porcelain Platter */}
        <div className="relative w-80 h-3 bg-stone-300 rounded-t-sm shadow-md" />
        <div className="w-72 h-3 bg-gradient-to-b from-stone-200 to-stone-400 rounded-b-lg shadow-lg" />
        <div className="w-24 h-4 bg-stone-300 shadow-inner" />
        <div className="w-40 h-2 bg-stone-400 rounded-full shadow-md" />
      </div>

      {/* Interactive Controls */}
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        {remainingCandles > 0 ? (
          <button
            onClick={handleBlowAll}
            className="px-5 py-2.5 text-sm font-medium text-white bg-rose-700 rounded-lg hover:bg-rose-800 transition-colors shadow-sm inline-flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Make a Wish & Blow All</span>
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowWishModal(true)}
              className="px-5 py-2.5 text-sm font-medium text-white bg-stone-900 rounded-lg hover:bg-stone-800 transition-colors shadow-sm inline-flex items-center gap-2 cursor-pointer"
            >
              <Gift className="w-4 h-4 text-rose-400" />
              <span>Read Your Birthday Wish</span>
            </button>
            <button
              onClick={handleRelight}
              className="px-3.5 py-2.5 text-sm font-medium text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
              title="Relight the candles"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Relight</span>
            </button>
          </div>
        )}
      </div>

      <p className="mt-3 text-xs text-stone-500 font-sans text-center">
        Tip: Tap individual candles to blow them out one by one
      </p>

      {/* Secret Wish Unlocked Modal */}
      {showWishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg p-6 sm:p-8 bg-stone-50 rounded-2xl border border-stone-200 shadow-2xl paper-texture">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                <Heart className="w-6 h-6 fill-rose-600" />
              </div>

              <span className="text-xs uppercase tracking-widest text-rose-800 font-semibold">
                Your Wish Has Been Released Into The Universe
              </span>

              <h3 className="mt-2 text-2xl font-serif font-bold text-stone-900">
                To My Dearest {girlfriendName}
              </h3>

              <div className="mt-4 p-5 bg-white/80 rounded-xl border border-stone-200/70 text-left">
                <p className="font-script text-lg text-stone-800 leading-relaxed italic">
                  "{secretWishMessage}"
                </p>
                <div className="mt-4 text-right">
                  <span className="text-xs font-serif font-medium text-stone-600">
                    With all my devotion, always.
                  </span>
                </div>
              </div>

              <div className="mt-6 flex justify-center gap-3">
                <button
                  onClick={() => setShowWishModal(false)}
                  className="px-6 py-2.5 text-sm font-medium text-white bg-stone-900 rounded-lg hover:bg-stone-800 transition-colors"
                >
                  Cherish This Moment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
