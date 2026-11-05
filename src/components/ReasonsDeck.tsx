import React, { useState } from 'react';
import { AdoreReason } from '../types';
import { Heart, Shuffle, ArrowRight, ArrowLeft, PenTool } from 'lucide-react';
import { romanticAudio } from '../utils/audioSynth';

interface ReasonsDeckProps {
  reasons: AdoreReason[];
  girlfriendName: string;
}

export const ReasonsDeck: React.FC<ReasonsDeckProps> = ({
  reasons,
  girlfriendName,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [useAnikHandwriting, setUseAnikHandwriting] = useState(true);
  const [inkColor, setInkColor] = useState('#1e3a8a');

  const currentReason = reasons[currentIndex] || reasons[0];

  const handleNext = () => {
    romanticAudio.playSoftClick();
    setIsFlipping(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % reasons.length);
      setIsFlipping(false);
    }, 150);
  };

  const handlePrev = () => {
    romanticAudio.playSoftClick();
    setIsFlipping(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + reasons.length) % reasons.length);
      setIsFlipping(false);
    }, 150);
  };

  const handleShuffle = () => {
    romanticAudio.playSoftClick();
    setIsFlipping(true);
    setTimeout(() => {
      let rand = Math.floor(Math.random() * reasons.length);
      if (rand === currentIndex && reasons.length > 1) {
        rand = (rand + 1) % reasons.length;
      }
      setCurrentIndex(rand);
      setIsFlipping(false);
    }, 150);
  };

  return (
    <section id="reasons" className="py-20 border-b border-stone-200/80 bg-white">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-rose-800 uppercase tracking-widest mb-2">
            <span>Chapter 05</span>
            <span aria-hidden="true">·</span>
            <span>Inside Jokes & Big Sister Appreciation</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-stone-900 heading-3d">
            Why You're the Best Older Sister
          </h2>
          <p className="mt-2 text-sm sm:text-base text-stone-600 font-sans">
            Our favorite inside jokes, childhood memories, and reasons why I'm so lucky to have you as my big sis—written in Anik's personal handwriting.
          </p>

          {/* Handwriting Style Toggle & Ink Selector */}
          <div className="mt-5 inline-flex flex-wrap items-center justify-center gap-2.5 p-1.5 rounded-xl bg-stone-100 border border-stone-200/80">
            <button
              onClick={() => {
                romanticAudio.playSoftClick();
                setUseAnikHandwriting((prev) => !prev);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-all ${
                useAnikHandwriting
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-white text-stone-700 hover:bg-stone-50'
              }`}
            >
              <PenTool className="w-3.5 h-3.5 text-rose-300" />
              <span>
                {useAnikHandwriting
                  ? "★ Written in Anik's Handwriting"
                  : "Switch to Anik's Handwriting"}
              </span>
            </button>

            {useAnikHandwriting && (
              <div className="flex items-center gap-1.5 px-2">
                {[
                  { color: '#1e3a8a', label: 'Royal Blue Ink' },
                  { color: '#1c1917', label: 'Midnight Black Ink' },
                  { color: '#881337', label: 'Burgundy Rose Ink' },
                ].map((ink) => (
                  <button
                    key={ink.color}
                    onClick={() => {
                      romanticAudio.playSoftClick();
                      setInkColor(ink.color);
                    }}
                    title={ink.label}
                    className={`w-4 h-4 rounded-full border-2 cursor-pointer transition-transform ${
                      inkColor === ink.color ? 'scale-120 border-stone-900' : 'border-white'
                    }`}
                    style={{ backgroundColor: ink.color }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Interactive 3D Card Presentation */}
        <div className="relative mx-auto max-w-lg perspective-1200">
          {/* 3D Deck background stacked effect */}
          <div className="absolute inset-0 translate-y-4 scale-94 bg-stone-300/60 rounded-3xl -z-20 shadow-xs" />
          <div className="absolute inset-0 translate-y-2 scale-97 bg-stone-200/80 rounded-3xl -z-10 shadow-xs" />

          {/* Main 3D Card */}
          <div
            className={`bg-[#faf7f2] border border-stone-300 rounded-3xl p-8 sm:p-12 shadow-md transition-all duration-300 paper-texture card-3d-tilt ${
              isFlipping
                ? 'opacity-40 scale-95 rotate-y-180'
                : 'opacity-100 scale-100'
            }`}
          >
            {/* Top Card Bar */}
            <div className="flex items-center justify-between pb-5 border-b border-stone-200/70 mb-6">
              <span className="font-mono text-xs text-stone-500 font-medium">
                Note #{currentIndex + 1} of {reasons.length}
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-rose-800">
                {currentReason.category === 'funny'
                  ? 'Inside Joke · Funny'
                  : currentReason.category}
              </span>
            </div>

            {/* Quote / Joke Body */}
            <div
              className="min-h-[155px] flex items-center justify-center text-center py-4 px-2 rounded-xl"
              style={
                useAnikHandwriting
                  ? {
                      backgroundImage:
                        'repeating-linear-gradient(transparent, transparent 34px, rgba(180, 160, 140, 0.28) 34px, rgba(180, 160, 140, 0.28) 35.5px)',
                    }
                  : undefined
              }
            >
              <p
                style={
                  useAnikHandwriting
                    ? {
                        fontFamily: "'AnikHandwriting', 'Caveat', cursive",
                        color: inkColor,
                      }
                    : undefined
                }
                className={
                  useAnikHandwriting
                    ? 'font-anik-handwriting text-2xl sm:text-[28px] leading-[2.25rem]'
                    : 'font-serif text-2xl sm:text-3xl font-normal text-stone-900 leading-snug'
                }
              >
                "{currentReason.text}"
              </p>
            </div>

            {/* Bottom Card Footer with Anik's Real Handwritten Signature */}
            <div className="pt-5 border-t border-stone-200/70 flex items-center justify-between text-xs text-stone-500">
              <div className="flex items-center gap-3">
                <span
                  style={
                    useAnikHandwriting
                      ? {
                          fontFamily: "'AnikHandwriting', 'Caveat', cursive",
                          color: inkColor,
                        }
                      : undefined
                  }
                  className={
                    useAnikHandwriting
                      ? 'font-anik-handwriting text-xl'
                      : 'font-script text-base text-stone-700 italic'
                  }
                >
                  For {girlfriendName} —
                </span>
                <img
                  src="/assets/aistudio/anik_signature.png"
                  alt="Anik handwritten signature"
                  className="h-8 object-contain"
                />
              </div>
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500/20" />
            </div>
          </div>

          {/* Card Action Controls */}
          <div className="mt-8 flex items-center justify-center gap-4">
            <button
              onClick={handlePrev}
              aria-label="Previous card"
              className="p-3 rounded-full bg-white border border-stone-300 text-stone-700 hover:text-stone-950 hover:bg-stone-50 transition-colors shadow-xs cursor-pointer tile-3d-extruded"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <button
              onClick={handleShuffle}
              className="px-5 py-2.5 rounded-full bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium inline-flex items-center gap-2 shadow-xs transition-colors cursor-pointer btn-3d-dark"
            >
              <Shuffle className="w-3.5 h-3.5 text-rose-400" />
              <span>Shuffle Next</span>
            </button>

            <button
              onClick={handleNext}
              aria-label="Next card"
              className="p-3 rounded-full bg-white border border-stone-300 text-stone-700 hover:text-stone-950 hover:bg-stone-50 transition-colors shadow-xs cursor-pointer tile-3d-extruded"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
