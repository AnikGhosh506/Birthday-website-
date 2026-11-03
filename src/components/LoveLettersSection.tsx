import React, { useState } from 'react';
import { LoveLetter } from '../types';
import { Mail, Heart, CheckCircle2, X } from 'lucide-react';
import { romanticAudio } from '../utils/audioSynth';

interface LoveLettersSectionProps {
  letters: LoveLetter[];
  girlfriendName: string;
  boyfriendName: string;
  onAddLetter: () => void;
}

export const LoveLettersSection: React.FC<LoveLettersSectionProps> = ({
  letters,
  girlfriendName,
  boyfriendName,
  onAddLetter,
}) => {
  const [openedLetterId, setOpenedLetterId] = useState<string | null>(null);
  const [readLetterIds, setReadLetterIds] = useState<Set<string>>(new Set());

  const handleOpenLetter = (letter: LoveLetter) => {
    romanticAudio.playCelebrationChime();
    setOpenedLetterId(letter.id);
    setReadLetterIds((prev) => new Set([...prev, letter.id]));
  };

  const currentLetter = letters.find((l) => l.id === openedLetterId);

  return (
    <section id="letters" className="py-20 border-b border-stone-200/80 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-rose-800 uppercase tracking-widest mb-2">
            <span>Chapter 03</span>
            <span aria-hidden="true">·</span>
            <span>Wax-Sealed Envelopes</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-stone-900">
            Open When...
          </h2>
          <p className="mt-3 text-sm sm:text-base text-stone-600 font-sans">
            Handwritten notes for when you need a smile, a warm embrace across the distance, or a reminder of how cherished you are.
          </p>
        </div>

        {/* Envelopes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {letters.map((letter) => {
            const isRead = readLetterIds.has(letter.id);
            return (
              <div
                key={letter.id}
                onClick={() => handleOpenLetter(letter)}
                className="group relative bg-[#fcfaf7] border border-stone-200/90 rounded-2xl p-6 shadow-xs hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden"
              >
                {/* Envelope Flap visual decoration */}
                <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-stone-200 via-rose-200 to-stone-200 opacity-60" />

                {/* Wax Seal Stamp */}
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md transition-transform group-hover:scale-105"
                    style={{ backgroundColor: letter.sealColor || '#b91c1c' }}
                  >
                    <Heart className="w-4 h-4 fill-white" />
                  </div>

                  {isRead ? (
                    <span className="flex items-center gap-1 text-xs text-rose-700 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Opened
                    </span>
                  ) : (
                    <span className="text-[11px] uppercase tracking-wider text-stone-400 font-medium">
                      Sealed
                    </span>
                  )}
                </div>

                {/* Title & Open Condition */}
                <div>
                  <span className="text-xs text-rose-800 font-semibold uppercase tracking-wider">
                    {letter.subtitle}
                  </span>
                  <h3 className="mt-1 font-serif text-xl font-bold text-stone-900 group-hover:text-rose-900 transition-colors">
                    {letter.title}
                  </h3>
                  <div className="mt-3 p-2.5 rounded-lg bg-stone-100/70 border border-stone-200/50">
                    <p className="text-xs text-stone-600 font-sans italic">
                      "{letter.openWhen}"
                    </p>
                  </div>
                </div>

                {/* Open Affordance */}
                <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between text-xs font-medium text-stone-700 group-hover:text-stone-950">
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-stone-400" />
                    Break Wax Seal
                  </span>
                  <span className="text-rose-700 transition-transform group-hover:translate-x-1">
                    Read letter →
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Unfolded Letter Modal */}
        {currentLetter && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/75 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="relative w-full max-w-2xl bg-[#faf6f0] rounded-2xl border border-stone-300 shadow-2xl p-6 sm:p-10 paper-texture max-h-[90vh] overflow-y-auto">
              {/* Close Button */}
              <button
                onClick={() => setOpenedLetterId(null)}
                aria-label="Close letter"
                className="absolute top-4 right-4 p-2 rounded-full bg-stone-200/70 hover:bg-stone-300 text-stone-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Wax Seal Header */}
              <div className="flex items-center justify-between border-b border-stone-300/80 pb-4 mb-6">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md"
                    style={{ backgroundColor: currentLetter.sealColor || '#b91c1c' }}
                  >
                    <Heart className="w-5 h-5 fill-white" />
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wider text-stone-500 font-sans">
                      A Letter For {girlfriendName}
                    </span>
                    <h4 className="font-serif text-lg font-bold text-stone-900">
                      {currentLetter.title}
                    </h4>
                  </div>
                </div>
                <span className="text-xs font-script italic text-stone-500 hidden sm:inline">
                  Written with love
                </span>
              </div>

              {/* Letter Content */}
              <div className="font-serif text-stone-800 text-base sm:text-lg leading-relaxed whitespace-pre-line py-2">
                {currentLetter.content}
              </div>

              {/* Sign-off & Signature */}
              <div className="mt-8 pt-6 border-t border-stone-300/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <span className="font-script text-xl italic text-rose-900 block">
                    {currentLetter.signOff || 'Forever yours,'}
                  </span>
                  <span className="font-serif font-bold text-base text-stone-900">
                    {boyfriendName || 'Julian'}
                  </span>
                </div>

                <button
                  onClick={() => setOpenedLetterId(null)}
                  className="px-6 py-2.5 text-sm font-medium text-white bg-stone-900 rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
                >
                  Keep in My Heart
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
