import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Compass,
  Star,
  RefreshCw,
  ScrollText,
  Sun,
  Moon,
  Heart,
} from 'lucide-react';
import { romanticAudio } from '../utils/audioSynth';
import { triggerConfettiExplosion } from '../utils/confettiExplosion';

interface AstrologyWishesSectionProps {
  girlfriendName: string;
  boyfriendName: string;
  birthdayDate: string;
}

interface CosmicChapter {
  heading: string;
  body: string;
}

interface AstrologyReading {
  title: string;
  sunSignSummary: string;
  cosmicChapters: CosmicChapter[];
  celestialBlessing: string;
  luckyElements: {
    constellation: string;
    rulingPlanet: string;
    powerCrystal: string;
    cosmicMotto: string;
  };
}

const AVAILABLE_TRAITS = [
  'Brilliant NIT Mind',
  'Fierce Big-Sis Protector',
  'Data Science & Analytics Whiz',
  'Warm & Selfless Heart',
  'Cinema & Sci-Fi Connoisseur',
  'Quick Wit & Humor',
  'Unstoppable Ambition',
  'Built-In Best Friend',
];

const FOCUS_THEMES = [
  'Year of Radiant Triumphs & Sisterhood Joy',
  'Career Milestones & Bangalore Adventures',
  'The Eternal Constellation of Didi & Anik',
  'Happiness, Peace & Endless Celebrations',
];

function getZodiacDetails(dateStr: string) {
  let month = 5;
  let day = 28;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const parts = dateStr.split('-').map(Number);
    if (parts[1] >= 1 && parts[1] <= 12) month = parts[1];
    if (parts[2] >= 1 && parts[2] <= 31) day = parts[2];
  }

  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) {
    return {
      sign: 'Gemini',
      symbol: '♊',
      element: 'Air',
      rulingPlanet: 'Mercury',
      constellationName: 'Castor & Pollux (The Celestial Twins)',
      dateLabel: 'May 28 · First Decan Gemini',
    };
  }
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) {
    return {
      sign: 'Taurus',
      symbol: '♉',
      element: 'Earth',
      rulingPlanet: 'Venus',
      constellationName: 'Aldebaran & The Pleiades',
      dateLabel: `${dateStr} · Natal Star`,
    };
  }
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) {
    return {
      sign: 'Cancer',
      symbol: '♋',
      element: 'Water',
      rulingPlanet: 'The Moon',
      constellationName: 'Cancri Star Cluster',
      dateLabel: `${dateStr} · Natal Star`,
    };
  }
  return {
    sign: 'Gemini',
    symbol: '♊',
    element: 'Air',
    rulingPlanet: 'Mercury',
    constellationName: 'Castor & Pollux (The Celestial Twins)',
    dateLabel: 'May 28 · Natal Star',
  };
}

function getDefaultReading(sisterName: string, brotherName: string): AstrologyReading {
  return {
    title: `The Celestial Scroll of May 28th · ${sisterName}'s Natal Star`,
    sunSignSummary: `Born on May 28th under the luminous Air sign of Gemini and guided by Mercury, ${sisterName} carries the rare celestial gift of twin brilliance: an analytical, razor-sharp mind paired with a deeply protective, compassionate heart.`,
    cosmicChapters: [
      {
        heading: 'I. The Star of Mercury · Brilliance & Grace',
        body: `The stars of late May aligned to bless ${sisterName} with unstoppable curiosity and intellectual grace. Whether conquering complex algorithms in Data Science and Business Analytics, excelling at NIT, or debating the finest details of cinema from Dune to The Odyssey, her mind shines like a guiding beacon.`,
      },
      {
        heading: `II. Castor & Pollux · The Eternal Bond of ${sisterName} & ${brotherName}`,
        body: `In ancient astronomy, the Gemini constellation is anchored by two inseparable sibling stars that weather every cosmic storm side by side. To ${brotherName}, ${sisterName} has always been that brightest guiding star—protector, mentor, secret-keeper, and built-in best friend for life.`,
      },
      {
        heading: 'III. Solar Return Prophecy · The Year of Golden Horizons',
        body: `As the Sun returns to its exact natal degree on May 28th, a transformative chapter opens before her. Her upcoming journey in Bangalore, her career milestones, and her cherished relationships are crowned with Jupiter's favor—bringing effortless success, joyful reunions during Puja, and nights filled with laughter.`,
      },
    ],
    celestialBlessing: `May every constellation in the night sky conspire to protect your smile, reward your hard work, and remind you how deeply you are loved, Didi.`,
    luckyElements: {
      constellation: 'Gemini (Castor & Pollux)',
      rulingPlanet: 'Mercury · Star of Wisdom',
      powerCrystal: 'Citrine & Moonstone',
      cosmicMotto: 'Shine fiercely, lead kindly, and conquer every horizon.',
    },
  };
}

export const AstrologyWishesSection: React.FC<AstrologyWishesSectionProps> = ({
  girlfriendName,
  boyfriendName,
  birthdayDate,
}) => {
  const sisName = girlfriendName || 'Atrayee';
  const broName = boyfriendName || 'Anik';
  const zodiac = getZodiacDetails(birthdayDate);

  const [selectedTraits, setSelectedTraits] = useState<string[]>([
    'Brilliant NIT Mind',
    'Fierce Big-Sis Protector',
    'Data Science & Analytics Whiz',
    'Warm & Selfless Heart',
    'Cinema & Sci-Fi Connoisseur',
  ]);
  const [focusTheme, setFocusTheme] = useState<string>(FOCUS_THEMES[0]);
  const [reading, setReading] = useState<AstrologyReading>(() =>
    getDefaultReading(sisName, broName)
  );
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const toggleTrait = (trait: string) => {
    romanticAudio.playSoftClick();
    setSelectedTraits((prev) => {
      if (prev.includes(trait)) {
        if (prev.length <= 2) return prev; // Keep at least 2 traits active
        return prev.filter((t) => t !== trait);
      }
      return [...prev, trait];
    });
  };

  const generateStarReading = async (
    e?: React.MouseEvent<HTMLButtonElement>,
    traitsOverride?: string[],
    themeOverride?: string
  ) => {
    if (e) {
      romanticAudio.playCelebrationChime();
      triggerConfettiExplosion({ clientX: e.clientX, clientY: e.clientY });
    }
    setIsGenerating(true);

    try {
      const res = await fetch('/api/ai/astrology-wishes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sisterName: sisName,
          brotherName: broName,
          birthdayDate: birthdayDate || '2002-05-28',
          zodiacSign: zodiac.sign,
          traits: traitsOverride || selectedTraits,
          focusTheme: themeOverride || focusTheme,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.reading?.title && Array.isArray(data?.reading?.cosmicChapters)) {
          setReading(data.reading);
        }
      }
    } catch (err) {
      console.warn('Using fallback celestial reading:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Automatically fetch a fresh personalized Gemini reading on initial mount
  useEffect(() => {
    void generateStarReading();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section
      id="astrology-wishes"
      className="py-20 border-b border-stone-200/80 bg-stone-50/60"
    >
      <div className="max-w-5xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-800 uppercase tracking-widest mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Celestial Birthday Star Reading</span>
            <span aria-hidden="true">·</span>
            <span>{zodiac.dateLabel}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-stone-900 heading-3d">
            Astrology Wishes & Natal Star Scroll
          </h2>
          <p className="mt-3 text-sm sm:text-base text-stone-600 leading-relaxed">
            A personalized birthday star reading crafted for{' '}
            <strong>{sisName}</strong>'s {zodiac.sign} birth chart ({zodiac.symbol}) and
            signature traits, inscribed on an heirloom scrollable parchment.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (4 cols): Natal Chart Badge & Interactive Trait Selector */}
          <div className="lg:col-span-5 space-y-5">
            {/* Zodiac Natal Medallion Card */}
            <div className="p-6 rounded-2xl bg-white border border-amber-200/90 shadow-sm paper-texture card-3d-tilt">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-stone-900 text-amber-300 flex items-center justify-center text-3xl font-serif shadow-md shrink-0">
                  {zodiac.symbol}
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-amber-800">
                    Natal Sun Sign · {zodiac.element} Element
                  </span>
                  <h3 className="text-xl font-serif font-bold text-stone-900">
                    {zodiac.sign} · {sisName}
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {zodiac.constellationName}
                  </p>
                </div>
              </div>

              {/* Traits Customization */}
              <div className="mt-5 pt-5 border-t border-stone-200/80">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2.5">
                  Her Signature Star Traits (Tap to toggle)
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_TRAITS.map((trait) => {
                    const active = selectedTraits.includes(trait);
                    return (
                      <button
                        key={trait}
                        type="button"
                        onClick={() => toggleTrait(trait)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                          active
                            ? 'bg-amber-100 text-amber-950 border-amber-400 shadow-2xs font-semibold'
                            : 'bg-white/80 text-stone-600 border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        {active ? '✦ ' : '+ '}
                        {trait}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Reading Focus Selector */}
              <div className="mt-4 pt-4 border-t border-stone-200/80">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
                  Celestial Blessing Focus
                </label>
                <select
                  value={focusTheme}
                  onChange={(e) => {
                    setFocusTheme(e.target.value);
                    romanticAudio.playSoftClick();
                  }}
                  className="w-full px-3 py-2 rounded-xl text-xs font-medium bg-white border border-stone-300 text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  {FOCUS_THEMES.map((theme) => (
                    <option key={theme} value={theme}>
                      {theme}
                    </option>
                  ))}
                </select>
              </div>

              {/* Generate Button */}
              <button
                type="button"
                disabled={isGenerating}
                onClick={(e) => void generateStarReading(e)}
                className="mt-5 w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold text-white bg-stone-900 hover:bg-stone-800 disabled:opacity-60 transition-all inline-flex items-center justify-center gap-2 cursor-pointer btn-3d-dark"
              >
                <RefreshCw
                  className={`w-4 h-4 text-amber-300 ${
                    isGenerating ? 'animate-spin' : ''
                  }`}
                />
                <span>
                  {isGenerating
                    ? 'Aligning the Birthday Stars...'
                    : 'Generate New Star Reading'}
                </span>
              </button>
            </div>

            {/* Lucky Cosmic Elements Strip */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-white border border-stone-200/80 card-3d-tilt">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                  Constellation
                </span>
                <p className="text-xs font-serif font-bold text-stone-900 mt-0.5">
                  {reading.luckyElements.constellation}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-white border border-stone-200/80 card-3d-tilt">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                  Ruling Planet
                </span>
                <p className="text-xs font-serif font-bold text-stone-900 mt-0.5">
                  {reading.luckyElements.rulingPlanet}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-white border border-stone-200/80 card-3d-tilt">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                  Power Crystal
                </span>
                <p className="text-xs font-serif font-bold text-stone-900 mt-0.5">
                  {reading.luckyElements.powerCrystal}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-white border border-stone-200/80 card-3d-tilt">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                  Natal Motto
                </span>
                <p className="text-xs font-serif font-bold text-stone-900 mt-0.5 line-clamp-2">
                  {reading.luckyElements.cosmicMotto}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column (7 cols): Scrollable Heirloom Parchment Manuscript */}
          <div className="lg:col-span-7">
            {/* Top 3D Brass & Mahogany Scroll Roller */}
            <div className="h-5 mx-2 rounded-full bg-gradient-to-r from-amber-900 via-amber-700 to-amber-900 border-y-2 border-amber-400/80 shadow-md flex items-center justify-between px-3">
              <span className="w-3 h-3 rounded-full bg-amber-300 shadow-inner" />
              <span className="text-[9px] font-serif uppercase tracking-[0.25em] text-amber-100/90">
                ✦ Royal Observatory of Sisterhood · Natal Scroll ✦
              </span>
              <span className="w-3 h-3 rounded-full bg-amber-300 shadow-inner" />
            </div>

            {/* Scrollable Parchment Body */}
            <div
              className="relative max-h-[520px] overflow-y-auto rounded-b-none border-x-2 border-amber-300/80 shadow-xl p-6 sm:p-9 paper-texture"
              style={{
                backgroundImage:
                  'radial-gradient(rgba(180, 120, 28, 0.22) 1px, transparent 1px), linear-gradient(180deg, #f9efd8 0%, #fffcf2 15%, #fff9e6 85%, #f7e8c6 100%)',
                backgroundSize: '24px 24px, 100% 100%',
              }}
            >
              {/* Subtle Scroll Indicator Pill */}
              <div className="flex items-center justify-between gap-2 pb-4 mb-5 border-b border-amber-800/20 text-xs text-amber-900/80">
                <span className="inline-flex items-center gap-1.5 font-semibold">
                  <ScrollText className="w-3.5 h-3.5 text-amber-700" />
                  <span>Scrollable Celestial Parchment</span>
                </span>
                <span className="font-mono text-[11px]">
                  {zodiac.symbol} {zodiac.sign} · May 28
                </span>
              </div>

              {/* Parchment Title */}
              <h3 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 leading-snug">
                {reading.title}
              </h3>

              {/* Lead Sun Sign Summary */}
              <p className="mt-3 text-sm sm:text-base font-serif italic text-amber-950/90 bg-amber-100/55 border-l-4 border-amber-600 pl-4 py-2.5 rounded-r-xl leading-relaxed">
                {reading.sunSignSummary}
              </p>

              {/* 3 Scrollable Cosmic Chapters */}
              <div className="mt-6 space-y-6">
                {reading.cosmicChapters.map((chap, idx) => (
                  <div
                    key={idx}
                    className="p-4 sm:p-5 rounded-2xl bg-white/75 border border-amber-300/60 shadow-2xs"
                  >
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-rose-800 mb-1.5">
                      {idx === 0 ? (
                        <Sun className="w-3.5 h-3.5 text-amber-600" />
                      ) : idx === 1 ? (
                        <Star className="w-3.5 h-3.5 text-rose-600" />
                      ) : (
                        <Moon className="w-3.5 h-3.5 text-indigo-600" />
                      )}
                      <span>{chap.heading}</span>
                    </div>
                    <p className="text-sm sm:text-base text-stone-800 leading-relaxed font-sans">
                      {chap.body}
                    </p>
                  </div>
                ))}
              </div>

              {/* Handwritten Celestial Blessing Footer inside the Scroll */}
              <div className="mt-8 pt-6 border-t border-amber-800/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-amber-900 mb-1">
                    <Compass className="w-3.5 h-3.5 text-amber-700" />
                    <span>Written in the Stars by {broName}</span>
                  </div>
                  <p className="text-xl sm:text-2xl text-stone-900 font-anik-handwriting leading-relaxed">
                    "{reading.celestialBlessing}"
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <Heart className="w-4 h-4 text-rose-600 fill-rose-600" />
                  <img
                    src="/assets/aistudio/anik_signature.png"
                    alt="Anik signature"
                    className="h-9 object-contain opacity-90"
                  />
                </div>
              </div>
            </div>

            {/* Bottom 3D Brass & Mahogany Scroll Roller */}
            <div className="h-5 mx-2 rounded-full bg-gradient-to-r from-amber-900 via-amber-700 to-amber-900 border-y-2 border-amber-400/80 shadow-lg flex items-center justify-between px-3">
              <span className="w-3 h-3 rounded-full bg-amber-300 shadow-inner" />
              <span className="text-[9px] font-serif uppercase tracking-[0.2em] text-amber-100/85">
                Scroll Up or Down Inside the Parchment
              </span>
              <span className="w-3 h-3 rounded-full bg-amber-300 shadow-inner" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
