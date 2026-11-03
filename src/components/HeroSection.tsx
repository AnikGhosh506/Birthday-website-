import React from 'react';
import { BirthdayCake } from './BirthdayCake';
import { Heart, Gamepad2, Volume2, VolumeX } from 'lucide-react';

interface HeroSectionProps {
  girlfriendName: string;
  nickname: string;
  heroKicker: string;
  heroHeadline: string;
  heroMessage: string;
  secretWishMessage: string;
  anniversaryDate: string;
  birthdayDate: string;
  isMusicPlaying?: boolean;
  onToggleMusic?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  girlfriendName,
  nickname,
  heroKicker,
  heroHeadline,
  heroMessage,
  secretWishMessage,
  anniversaryDate,
  birthdayDate,
  isMusicPlaying = false,
  onToggleMusic,
}) => {
  // Calculate days together dynamically
  const calculateDaysTogether = () => {
    try {
      const start = new Date(anniversaryDate || '2023-04-14');
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch {
      return 1248;
    }
  };

  const daysTogether = calculateDaysTogether();

  // Format birthday date nicely
  const formatBirthday = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <section id="celebration" className="pt-8 pb-16 border-b border-stone-200/80">
      <div className="max-w-6xl mx-auto px-6">
        {/* Split-Screen Hero Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Column: Typographic Hierarchy */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            {/* Clean unboxed kicker with dot separator */}
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-800 uppercase tracking-widest mb-4">
              <span>{heroKicker || 'A Special Day'}</span>
              <span aria-hidden="true">·</span>
              <span>{formatBirthday(birthdayDate)}</span>
            </div>

            {/* Display Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold tracking-tight text-stone-900 leading-[1.12] text-balance">
              {heroHeadline ? (
                heroHeadline.includes(girlfriendName) ? (
                  heroHeadline
                ) : (
                  <>
                    {heroHeadline}, <span className="italic font-normal text-rose-700">{girlfriendName}</span>
                  </>
                )
              ) : (
                <>
                  Happy Birthday, <span className="italic font-normal text-rose-700">{girlfriendName}</span>
                </>
              )}
            </h1>

            {/* Lead Prose */}
            <p className="mt-6 text-base sm:text-lg text-stone-600 leading-relaxed font-sans max-w-xl">
              {heroMessage}
            </p>

            {/* Action buttons */}
            <div className="mt-8 flex flex-wrap items-center gap-3.5">
              <a
                href="#arcade"
                className="px-6 py-3 text-sm font-medium text-white bg-stone-900 rounded-lg hover:bg-stone-800 transition-colors shadow-xs inline-flex items-center gap-2 whitespace-nowrap shrink-0"
              >
                <Gamepad2 className="w-4 h-4 text-rose-400" />
                <span>Play Birthday Game Arcade</span>
              </a>

              <a
                href="#letters"
                className="px-5 py-3 text-sm font-medium text-stone-800 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors shadow-xs inline-flex items-center gap-2 whitespace-nowrap shrink-0"
              >
                <Heart className="w-4 h-4 text-rose-600" />
                <span>Open Love Letters</span>
              </a>

              {onToggleMusic && (
                <button
                  onClick={onToggleMusic}
                  className="px-4 py-3 text-sm font-medium text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {isMusicPlaying ? (
                    <>
                      <Volume2 className="w-4 h-4 text-rose-600" />
                      <span>Pause Music Box</span>
                    </>
                  ) : (
                    <>
                      <VolumeX className="w-4 h-4 text-stone-500" />
                      <span>Play Music Box</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Quiet metadata line */}
            <div className="mt-6 flex items-center gap-2 text-xs text-stone-500">
              <span>Dedicated with endless love</span>
              <span aria-hidden="true">·</span>
              <span>Always {nickname || 'My Favorite Soul'}</span>
            </div>
          </div>

          {/* Right Column: Interactive Birthday Cake */}
          <div className="lg:col-span-5 flex justify-center">
            <BirthdayCake
              girlfriendName={girlfriendName}
              nickname={nickname}
              secretWishMessage={secretWishMessage}
            />
          </div>
        </div>

        {/* 4-Column KPI / Relationship Milestones Strip (Full-width row below hero split) */}
        <div className="mt-14 pt-8 border-t border-stone-200/80 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="p-4 rounded-xl bg-white border border-stone-200/70 shadow-xs">
            <span className="text-xs text-stone-500 font-medium">Days We've Loved Each Other</span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-serif font-bold text-stone-900 tabular-nums">
                {daysTogether}
              </span>
              <span className="text-xs text-rose-600 font-medium">days</span>
            </div>
            <p className="text-[11px] text-stone-400 mt-0.5">And counting every second</p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-stone-200/70 shadow-xs">
            <span className="text-xs text-stone-500 font-medium">Adventures & Date Nights</span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-serif font-bold text-stone-900 tabular-nums">
                100+
              </span>
              <span className="text-xs text-stone-500 font-medium">shared</span>
            </div>
            <p className="text-[11px] text-stone-400 mt-0.5">From cafes to mountain sunsets</p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-stone-200/70 shadow-xs">
            <span className="text-xs text-stone-500 font-medium">Inside Jokes & Laughter</span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-serif font-bold text-stone-900 tabular-nums">
                ∞
              </span>
              <span className="text-xs text-rose-600 font-medium">limitless</span>
            </div>
            <p className="text-[11px] text-stone-400 mt-0.5">The prettiest sound on Earth</p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-stone-200/70 shadow-xs">
            <span className="text-xs text-stone-500 font-medium">Forever Guarantee</span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-serif font-bold text-stone-900 tabular-nums">
                100%
              </span>
              <span className="text-xs text-rose-600 font-medium">devotion</span>
            </div>
            <p className="text-[11px] text-stone-400 mt-0.5">Today, tomorrow, always</p>
          </div>
        </div>
      </div>
    </section>
  );
};
