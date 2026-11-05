import React, { useState, useEffect, useCallback } from 'react';
import { Memory } from '../types';
import {
  Calendar,
  MapPin,
  Heart,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Camera,
  ZoomIn,
  Sparkles,
} from 'lucide-react';
import { romanticAudio } from '../utils/audioSynth';

interface MemoryFlipCarouselProps {
  memories: Memory[];
  onSelectMemory: (memoryId: string) => void;
  onUploadPhoto: (e: React.ChangeEvent<HTMLInputElement>, memoryId: string) => void;
}

const CYCLE_DURATION_MS = 4600;
const FLIP_BACKFACE_AT_PERCENT = 48;

export const MemoryFlipCarousel: React.FC<MemoryFlipCarouselProps> = ({
  memories,
  onSelectMemory,
  onUploadPhoto,
}) => {
  const uploadedMemories = memories.filter((m) => Boolean(m.imageUrl));
  const [showUploadedOnly, setShowUploadedOnly] = useState<boolean>(true);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isCenterFlipped, setIsCenterFlipped] = useState<boolean>(false);
  const [isAutoRotateEnabled, setIsAutoRotateEnabled] = useState<boolean>(true);
  const [isUserInteracting, setIsUserInteracting] = useState<boolean>(false);
  const [cycleProgress, setCycleProgress] = useState<number>(0);

  // Active pool of memories for the 3D carousel
  const pool =
    showUploadedOnly && uploadedMemories.length > 0
      ? uploadedMemories
      : memories;

  const total = pool.length;
  const safeIndex = total > 0 ? ((activeIndex % total) + total) % total : 0;

  const isIdleRunning = isAutoRotateEnabled && !isUserInteracting && total > 0;

  const goToNext = useCallback(() => {
    if (total === 0) return;
    setIsCenterFlipped(false);
    setCycleProgress(0);
    setActiveIndex((prev) => (prev + 1) % total);
  }, [total]);

  const goToPrev = useCallback(() => {
    if (total === 0) return;
    setIsCenterFlipped(false);
    setCycleProgress(0);
    setActiveIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  // Automated Idle-Mode 3D Card-Flip & Carousel Rotation Loop
  useEffect(() => {
    if (!isIdleRunning) return;

    const tickMs = 50;
    const step = (tickMs / CYCLE_DURATION_MS) * 100;

    const timer = window.setInterval(() => {
      setCycleProgress((prev) => {
        const next = prev + step;
        if (next >= FLIP_BACKFACE_AT_PERCENT && next < 92) {
          setIsCenterFlipped(true);
        }
        if (next >= 100) {
          setIsCenterFlipped(false);
          setActiveIndex((idx) => (idx + 1) % Math.max(1, total));
          return 0;
        }
        return next;
      });
    }, tickMs);

    return () => window.clearInterval(timer);
  }, [isIdleRunning, total]);

  if (total === 0) return null;

  const prevIndex = (safeIndex - 1 + total) % total;
  const nextIndex = (safeIndex + 1) % total;

  const renderFallbackArt = (idx: number, title: string) => {
    const gradients = [
      'from-rose-100 to-amber-50',
      'from-stone-100 to-rose-100',
      'from-amber-100 to-stone-100',
      'from-rose-100 to-stone-200',
    ];
    const grad = gradients[idx % gradients.length];
    return (
      <div
        className={`w-full h-full bg-gradient-to-br ${grad} flex flex-col items-center justify-center p-5 text-center select-none relative overflow-hidden`}
      >
        <Heart className="w-7 h-7 text-rose-500 fill-rose-500/20 mb-2" />
        <span className="font-serif text-sm font-bold text-stone-800 line-clamp-2">
          {title}
        </span>
        <span className="text-[10px] text-stone-500 mt-1">
          Upload a photo to feature in 3D Carousel
        </span>
      </div>
    );
  };

  const activeMem = pool[safeIndex];
  const prevMem = pool[prevIndex];
  const nextMem = pool[nextIndex];

  return (
    <div
      onMouseEnter={() => setIsUserInteracting(true)}
      onMouseLeave={() => setIsUserInteracting(false)}
      className="mb-14 rounded-3xl border border-stone-200/90 bg-white/80 p-5 sm:p-8 shadow-sm paper-texture overflow-hidden"
    >
      {/* Top Carousel Header & Idle Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-stone-200/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-200 text-rose-700 flex items-center justify-center shrink-0 shadow-2xs">
            <RotateCw
              className={`w-4 h-4 ${isIdleRunning ? 'animate-spin' : ''}`}
              style={{ animationDuration: '8s' }}
            />
          </div>
          <div>
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-rose-800">
              <span>Automated 3D Card-Flip Carousel</span>
              <span aria-hidden="true">·</span>
              <span
                className={
                  isIdleRunning ? 'text-emerald-700' : 'text-amber-700'
                }
              >
                {isIdleRunning
                  ? 'Idle Mode Active (Auto-Flipping & Rotating)'
                  : 'Paused While Inspecting'}
              </span>
            </div>
            <h3 className="font-serif text-lg sm:text-xl font-bold text-stone-900 heading-3d">
              3D Rotating Scrapbook Showcase
            </h3>
          </div>
        </div>

        {/* Controls: Uploaded vs All Toggle + Auto-Rotate Toggle */}
        <div className="flex flex-wrap items-center gap-2.5">
          {uploadedMemories.length > 0 && (
            <div className="flex items-center bg-stone-200/70 p-1 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => {
                  romanticAudio.playSoftClick();
                  setShowUploadedOnly(true);
                  setActiveIndex(0);
                  setCycleProgress(0);
                }}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  showUploadedOnly
                    ? 'bg-white text-stone-900 shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Uploaded ({uploadedMemories.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  romanticAudio.playSoftClick();
                  setShowUploadedOnly(false);
                  setActiveIndex(0);
                  setCycleProgress(0);
                }}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  !showUploadedOnly
                    ? 'bg-white text-stone-900 shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                All ({memories.length})
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              romanticAudio.playSoftClick();
              setIsCenterFlipped((prev) => !prev);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 text-xs font-semibold transition-colors cursor-pointer tile-3d-extruded"
          >
            <RotateCw className="w-3.5 h-3.5 text-rose-600" />
            <span>{isCenterFlipped ? 'Flip to Photo' : 'Flip to Note'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              romanticAudio.playSoftClick();
              setIsAutoRotateEnabled((prev) => !prev);
            }}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              isAutoRotateEnabled
                ? 'bg-stone-900 text-white btn-3d-dark'
                : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
            }`}
          >
            {isAutoRotateEnabled ? (
              <>
                <Pause className="w-3.5 h-3.5 text-amber-300" />
                <span>Auto-Rotate On</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-emerald-700" />
                <span>Resume Idle Mode</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 3D Carousel Stage */}
      <div className="relative mt-6 min-h-[390px] sm:min-h-[410px] flex items-center justify-center perspective-1200 select-none">
        {/* Left Wing Card (Previous Memory in 3D Depth) */}
        {total > 1 && prevMem && (
          <div
            onClick={() => {
              romanticAudio.playSoftClick();
              goToPrev();
            }}
            style={{
              transform:
                'perspective(1200px) translateX(-62%) translateZ(-120px) rotateY(28deg) scale(0.84)',
            }}
            className="hidden md:flex absolute w-72 h-[350px] bg-white p-3.5 rounded-2xl border border-stone-200/90 shadow-lg flex-col justify-between opacity-65 hover:opacity-90 transition-all duration-500 cursor-pointer z-10"
          >
            <div className="aspect-4/3 w-full rounded-xl overflow-hidden bg-stone-100 border border-stone-200/60">
              {prevMem.imageUrl ? (
                <img
                  src={prevMem.imageUrl}
                  alt={prevMem.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                renderFallbackArt(prevIndex, prevMem.title)
              )}
            </div>
            <div>
              <div className="text-[11px] text-stone-400 truncate">
                {prevMem.date} · {prevMem.location}
              </div>
              <h4 className="font-serif text-sm font-bold text-stone-800 truncate mt-0.5">
                {prevMem.title}
              </h4>
            </div>
            <div className="text-[11px] font-medium text-rose-700">
              ← Previous Memory
            </div>
          </div>
        )}

        {/* Center Spotlight Card with Automated 3D 180° Card-Flip */}
        <div className="relative z-20 w-full max-w-sm sm:max-w-md h-[375px] perspective-1200">
          <div
            style={{
              transformStyle: 'preserve-3d',
              transform: isCenterFlipped
                ? 'perspective(1300px) rotateY(180deg) translateY(-4px)'
                : 'perspective(1300px) rotateY(0deg) translateY(0px)',
              transition: 'transform 0.78s cubic-bezier(0.22, 1, 0.36, 1)',
            }}
            className="relative w-full h-full"
          >
            {/* FRONT FACE: Polaroid Photo & Title */}
            <div
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
              }}
              className="absolute inset-0 bg-white p-4 sm:p-5 rounded-2xl border border-rose-200/90 shadow-2xl flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-16/10 w-full rounded-xl overflow-hidden bg-stone-100 border border-stone-200/70 mb-3.5">
                  {activeMem.imageUrl ? (
                    <img
                      src={activeMem.imageUrl}
                      alt={activeMem.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    renderFallbackArt(safeIndex, activeMem.title)
                  )}

                  <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-md bg-stone-900/75 text-white text-[10px] font-mono backdrop-blur-xs">
                    Slide {safeIndex + 1} / {total}
                  </div>

                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                    <label
                      title="Upload or change photo"
                      className="p-1.5 rounded-md bg-white/90 hover:bg-white text-stone-700 shadow-xs cursor-pointer transition-colors"
                    >
                      <Camera className="w-3.5 h-3.5 text-rose-600" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => onUploadPhoto(e, activeMem.id)}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        romanticAudio.playSoftClick();
                        onSelectMemory(activeMem.id);
                      }}
                      title="Open in Fullscreen Lightbox"
                      className="p-1.5 rounded-md bg-white/90 hover:bg-white text-stone-700 shadow-xs cursor-pointer transition-colors"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-stone-500 mb-1">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-rose-500" />
                    {activeMem.date}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1 truncate">
                    <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                    <span className="truncate">{activeMem.location}</span>
                  </span>
                </div>

                <h4 className="font-serif text-lg sm:text-xl font-bold text-stone-900 truncate">
                  {activeMem.title}
                </h4>

                <p className="mt-1 text-lg text-[#1e3a8a] font-anik-handwriting line-clamp-2 leading-snug">
                  {activeMem.caption}
                </p>
              </div>

              <div className="pt-2.5 border-t border-stone-100 flex items-center justify-between text-xs">
                <span className="font-semibold text-rose-700">
                  {activeMem.tag}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    romanticAudio.playSoftClick();
                    setIsCenterFlipped(true);
                  }}
                  className="inline-flex items-center gap-1 text-stone-600 hover:text-rose-800 font-medium cursor-pointer"
                >
                  <RotateCw className="w-3 h-3" />
                  <span>Auto-flips to handwritten note →</span>
                </button>
              </div>
            </div>

            {/* BACK FACE: Handwritten Scrapbook Story */}
            <div
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}
              className="absolute inset-0 bg-white p-5 sm:p-6 rounded-2xl border-2 border-rose-300/90 shadow-2xl paper-texture flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-stone-200/80">
                  <div>
                    <div className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-rose-800">
                      <Sparkles className="w-3 h-3 text-rose-600" />
                      <span>3D Flipped Polaroid Back · {activeMem.tag}</span>
                    </div>
                    <h4 className="font-serif text-lg font-bold text-stone-900 mt-0.5">
                      {activeMem.title}
                    </h4>
                  </div>

                  <div className="w-8 h-8 rounded-full bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                    <Heart className="w-3.5 h-3.5 fill-rose-600" />
                  </div>
                </div>

                <div className="mt-3 max-h-[205px] overflow-y-auto pr-1">
                  <p className="text-2xl text-[#1e3a8a] font-anik-handwriting leading-relaxed whitespace-pre-line">
                    {activeMem.caption}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-stone-200/80 flex items-center justify-between text-xs">
                <span className="font-serif italic text-rose-800">
                  — {activeMem.date} · {activeMem.location}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    romanticAudio.playSoftClick();
                    setIsCenterFlipped(false);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-stone-900 text-white font-semibold cursor-pointer"
                >
                  <RotateCw className="w-3 h-3" />
                  <span>Flip to Photo</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Wing Card (Next Memory in 3D Depth) */}
        {total > 1 && nextMem && (
          <div
            onClick={() => {
              romanticAudio.playSoftClick();
              goToNext();
            }}
            style={{
              transform:
                'perspective(1200px) translateX(62%) translateZ(-120px) rotateY(-28deg) scale(0.84)',
            }}
            className="hidden md:flex absolute w-72 h-[350px] bg-white p-3.5 rounded-2xl border border-stone-200/90 shadow-lg flex-col justify-between opacity-65 hover:opacity-90 transition-all duration-500 cursor-pointer z-10"
          >
            <div className="aspect-4/3 w-full rounded-xl overflow-hidden bg-stone-100 border border-stone-200/60">
              {nextMem.imageUrl ? (
                <img
                  src={nextMem.imageUrl}
                  alt={nextMem.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                renderFallbackArt(nextIndex, nextMem.title)
              )}
            </div>
            <div>
              <div className="text-[11px] text-stone-400 truncate">
                {nextMem.date} · {nextMem.location}
              </div>
              <h4 className="font-serif text-sm font-bold text-stone-800 truncate mt-0.5">
                {nextMem.title}
              </h4>
            </div>
            <div className="text-[11px] font-medium text-rose-700 text-right">
              Next Memory →
            </div>
          </div>
        )}

        {/* Left / Right Navigation Arrows */}
        {total > 1 && (
          <>
            <button
              type="button"
              onClick={() => {
                romanticAudio.playSoftClick();
                goToPrev();
              }}
              aria-label="Previous carousel memory"
              className="absolute left-1 sm:left-3 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-white/90 hover:bg-white text-stone-800 border border-stone-300 shadow-md cursor-pointer transition-transform hover:scale-105"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                romanticAudio.playSoftClick();
                goToNext();
              }}
              aria-label="Next carousel memory"
              className="absolute right-1 sm:right-3 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-white/90 hover:bg-white text-stone-800 border border-stone-300 shadow-md cursor-pointer transition-transform hover:scale-105"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Bottom Progress Bar & Dot Indicators */}
      <div className="mt-5 pt-4 border-t border-stone-200/70 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Cycle Progress Bar */}
        <div className="w-full sm:w-56 h-1.5 rounded-full bg-stone-200 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-rose-600 to-amber-500 transition-all duration-75"
            style={{ width: `${cycleProgress}%` }}
          />
        </div>

        {/* Memory Dots */}
        <div className="flex items-center gap-1.5 flex-wrap justify-center">
          {pool.map((mem, idx) => (
            <button
              key={mem.id}
              type="button"
              onClick={() => {
                romanticAudio.playSoftClick();
                setIsCenterFlipped(false);
                setCycleProgress(0);
                setActiveIndex(idx);
              }}
              aria-label={`Select carousel memory ${idx + 1}: ${mem.title}`}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                idx === safeIndex
                  ? 'w-6 bg-rose-700'
                  : 'w-2 bg-stone-300 hover:bg-stone-400'
              }`}
            />
          ))}
        </div>

        <div className="text-[11px] text-stone-500 font-sans">
          {isIdleRunning
            ? 'Flips card at 50% · Rotates to next memory at 100%'
            : 'Move cursor away to resume idle 3D rotation'}
        </div>
      </div>
    </div>
  );
};
