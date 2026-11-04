import React, { useState } from 'react';
import { AdoreReason } from '../types';
import { Heart, Shuffle, ArrowRight, ArrowLeft } from 'lucide-react';
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
        <div className="text-center max-w-xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-rose-800 uppercase tracking-widest mb-2">
            <span>Chapter 05</span>
            <span aria-hidden="true">·</span>
            <span>Big Sister Appreciation</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-stone-900">
            Why You're the Best Older Sister
          </h2>
          <p className="mt-2 text-sm sm:text-base text-stone-600 font-sans">
            Just a few of the countless reasons why I'm so lucky to have you as my big sis.
          </p>
        </div>

        {/* Interactive Card Presentation */}
        <div className="relative mx-auto max-w-lg">
          {/* Deck background stacked effect */}
          <div className="absolute inset-0 translate-y-3 scale-95 bg-stone-200/70 rounded-3xl -z-10 shadow-xs" />
          <div className="absolute inset-0 translate-y-1.5 scale-98 bg-stone-100 rounded-3xl -z-10 shadow-xs" />

          {/* Main Card */}
          <div
            className={`bg-[#faf7f2] border border-stone-300 rounded-3xl p-8 sm:p-12 shadow-md transition-all duration-200 paper-texture ${
              isFlipping ? 'opacity-40 scale-95' : 'opacity-100 scale-100'
            }`}
          >
            {/* Top Card Bar */}
            <div className="flex items-center justify-between pb-6 border-b border-stone-200/70 mb-6">
              <span className="font-mono text-xs text-stone-500 font-medium">
                Reason #{currentIndex + 1} of {reasons.length}
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-rose-800">
                {currentReason.category}
              </span>
            </div>

            {/* Quote Body */}
            <div className="min-h-[140px] flex items-center justify-center text-center py-4">
              <p className="font-serif text-2xl sm:text-3xl font-normal text-stone-900 leading-snug">
                "{currentReason.text}"
              </p>
            </div>

            {/* Bottom Card Footer */}
            <div className="pt-6 border-t border-stone-200/70 flex items-center justify-between text-xs text-stone-500">
              <span className="font-script text-base text-stone-700 italic">
                For {girlfriendName}
              </span>
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500/20" />
            </div>
          </div>

          {/* Card Action Controls */}
          <div className="mt-8 flex items-center justify-center gap-4">
            <button
              onClick={handlePrev}
              aria-label="Previous card"
              className="p-3 rounded-full bg-white border border-stone-300 text-stone-700 hover:text-stone-950 hover:bg-stone-50 transition-colors shadow-xs cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <button
              onClick={handleShuffle}
              className="px-5 py-2.5 rounded-full bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium inline-flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Shuffle className="w-3.5 h-3.5 text-rose-400" />
              <span>Shuffle Next</span>
            </button>

            <button
              onClick={handleNext}
              aria-label="Next card"
              className="p-3 rounded-full bg-white border border-stone-300 text-stone-700 hover:text-stone-950 hover:bg-stone-50 transition-colors shadow-xs cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
