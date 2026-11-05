import React from 'react';
import { Sparkles, Sun, Sunset, Moon, PartyPopper, X } from 'lucide-react';
import { AmbianceTheme, AMBIANCE_THEMES } from '../utils/themeAmbiance';
import { NavbarBirthdayClock } from './NavbarBirthdayClock';
import { triggerGlobalFireworksShow } from './FireworksShowCanvas';

export type KeepsakePageId =
  | 'home'
  | 'arcade'
  | 'memories'
  | 'letters'
  | 'chat'
  | 'wishes'
  | 'finale';

export interface KeepsakePageMeta {
  id: KeepsakePageId;
  label: string;
  shortLabel: string;
  href: string;
  badge: string;
}

export const KEEPSAKE_PAGES: KeepsakePageMeta[] = [
  { id: 'home', label: 'Home', shortLabel: 'Home', href: '#home', badge: '01' },
  { id: 'arcade', label: '3D Arcade', shortLabel: 'Arcade', href: '#arcade', badge: '02' },
  { id: 'memories', label: 'Memories', shortLabel: 'Memories', href: '#memories', badge: '03' },
  { id: 'letters', label: 'Letters & Vouchers', shortLabel: 'Letters', href: '#letters', badge: '04' },
  { id: 'chat', label: 'Sibling Chat', shortLabel: 'Chat', href: '#chat', badge: '05' },
  { id: 'wishes', label: 'Sky & Wishes', shortLabel: 'Wishes', href: '#wishes', badge: '06' },
  { id: 'finale', label: 'Grand Gift', shortLabel: 'Gift', href: '#finale', badge: '07' },
];

interface NavbarProps {
  brandName: string;
  birthdayDate?: string;
  isMusicPlaying: boolean;
  onToggleMusic: () => void;
  onOpenPersonalize: () => void;
  activeTheme: AmbianceTheme;
  onChangeTheme: (theme: AmbianceTheme) => void;
  activePage: KeepsakePageId;
  onNavigatePage: (page: KeepsakePageId) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  brandName,
  birthdayDate,
  onOpenPersonalize,
  activeTheme,
  onChangeTheme,
  activePage,
  onNavigatePage,
}) => {
  const isMidnight = activeTheme === 'midnight-indigo';

  const getThemeIcon = (themeId: AmbianceTheme, isActive: boolean) => {
    const baseClass = `w-3.5 h-3.5 transition-transform duration-200 ${
      isActive ? 'scale-110' : 'opacity-80'
    }`;
    switch (themeId) {
      case 'sunrise-gold':
        return <Sun className={`${baseClass} ${isActive ? 'text-amber-600' : ''}`} />;
      case 'sunset-rose':
        return <Sunset className={`${baseClass} ${isActive ? 'text-rose-600' : ''}`} />;
      case 'midnight-indigo':
        return <Moon className={`${baseClass} ${isActive ? 'text-indigo-300' : ''}`} />;
    }
  };

  const handleCycleTheme = () => {
    const currentIndex = AMBIANCE_THEMES.findIndex((t) => t.id === activeTheme);
    const nextIndex = (currentIndex + 1) % AMBIANCE_THEMES.length;
    onChangeTheme(AMBIANCE_THEMES[nextIndex].id);
  };

  const currentThemeObj =
    AMBIANCE_THEMES.find((t) => t.id === activeTheme) || AMBIANCE_THEMES[0];

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    pageId: KeepsakePageId
  ) => {
    e.preventDefault();
    onNavigatePage(pageId);
  };

  return (
    <header
      style={{
        backgroundColor: 'var(--theme-nav-bg)',
        borderColor: 'var(--theme-nav-border)',
      }}
      className="sticky top-0 z-40 w-full backdrop-blur-md border-b transition-colors duration-300"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6">
        {/* Top Row: Brand + Clock + Hyperlinked Page Tabs (Desktop) + Theme & Action Buttons */}
        <div className="min-h-16 py-2 flex flex-wrap lg:flex-nowrap items-center justify-between gap-2 sm:gap-3">
          {/* Zone 1: 3D Brand Wordmark + Interactive 3D Metallic Birthday Countdown Clock */}
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 shrink-0">
            <a
              href="#home"
              onClick={(e) => handleNavClick(e, 'home')}
              className={`text-sm sm:text-base lg:text-lg font-serif font-bold tracking-tight transition-colors whitespace-nowrap heading-3d ${
                isMidnight
                  ? 'text-slate-100 hover:text-indigo-200'
                  : 'text-stone-900 hover:text-stone-700'
              }`}
            >
              {brandName ? `Happy Birthday · ${brandName}` : 'Birthday Keepsake'}
            </a>

            {/* Interactive 3D Metallic Countdown Clock */}
            <div className="hidden sm:block shrink-0">
              <NavbarBirthdayClock
                birthdayDate={birthdayDate}
                activeTheme={activeTheme}
              />
            </div>
          </div>

          {/* Zone 2: Hyperlinked Multi-Page Navigation Links (Desktop xl+) */}
          <nav
            aria-label="Keepsake Pages"
            className="hidden xl:flex items-center gap-1.5 text-xs font-medium shrink-0"
          >
            {KEEPSAKE_PAGES.map((page) => {
              const isCurrent = activePage === page.id;
              return (
                <a
                  key={page.id}
                  href={page.href}
                  onClick={(e) => handleNavClick(e, page.id)}
                  className={`relative inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                    isCurrent
                      ? isMidnight
                        ? 'bg-indigo-950/90 text-amber-300 font-semibold border border-indigo-400/50 shadow-xs'
                        : 'bg-rose-700 text-white font-semibold shadow-xs'
                      : isMidnight
                      ? 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      : 'text-stone-600 hover:text-stone-950 hover:bg-stone-200/60'
                  }`}
                >
                  {isCurrent && (
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-85" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-300" />
                    </span>
                  )}
                  <span>{page.shortLabel}</span>
                </a>
              );
            })}
          </nav>

          {/* Zone 3: Ambiance Theme Switcher + Celebrate + Black Personalize Gift Button + Return Home Cross */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-auto lg:ml-0">
            {/* Desktop 3-Theme Segmented Toggle */}
            <div
              role="group"
              aria-label="Site Ambiance Theme"
              className={`hidden md:inline-flex items-center p-1 rounded-xl border transition-colors shrink-0 ${
                isMidnight
                  ? 'bg-slate-900/90 border-indigo-500/40 shadow-inner'
                  : activeTheme === 'sunset-rose'
                  ? 'bg-rose-100/75 border-rose-300/70 shadow-inner'
                  : 'bg-amber-100/70 border-amber-300/75 shadow-inner'
              }`}
            >
              {AMBIANCE_THEMES.map((themeItem) => {
                const isSelected = activeTheme === themeItem.id;
                return (
                  <button
                    key={themeItem.id}
                    type="button"
                    onClick={() => onChangeTheme(themeItem.id)}
                    title={`${themeItem.label} — ${themeItem.description}`}
                    aria-pressed={isSelected}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      isSelected
                        ? isMidnight
                          ? 'bg-indigo-950 text-indigo-100 shadow-sm border border-indigo-400/50'
                          : themeItem.id === 'sunset-rose'
                          ? 'bg-white text-rose-900 shadow-sm border border-rose-300/80'
                          : 'bg-white text-amber-950 shadow-sm border border-amber-300/80'
                        : isMidnight
                        ? 'text-slate-400 hover:text-slate-200'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0 border border-white/60 shadow-xs"
                      style={{ background: themeItem.swatchGradient }}
                    />
                    {getThemeIcon(themeItem.id, isSelected)}
                    <span className="hidden 2xl:inline">{themeItem.label}</span>
                    <span className="2xl:hidden">{themeItem.shortLabel}</span>
                  </button>
                );
              })}
            </div>

            {/* Compact Theme Cycle Button (< md) */}
            <button
              type="button"
              onClick={handleCycleTheme}
              title={`Current theme: ${currentThemeObj.label}. Tap to switch ambiance.`}
              className={`md:hidden inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer shrink-0 ${
                isMidnight
                  ? 'bg-slate-900 text-indigo-100 border-indigo-500/40'
                  : activeTheme === 'sunset-rose'
                  ? 'bg-rose-50 text-rose-900 border-rose-300'
                  : 'bg-amber-50 text-amber-950 border-amber-300'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 border border-white/60"
                style={{ background: currentThemeObj.swatchGradient }}
              />
              {getThemeIcon(currentThemeObj.id, true)}
              <span className="hidden sm:inline">{currentThemeObj.shortLabel}</span>
            </button>

            {/* Celebrate Fireworks Button with Pulse Animation */}
            <button
              type="button"
              onClick={() => triggerGlobalFireworksShow()}
              title="Launch Full-Screen Birthday Fireworks Show!"
              className="relative inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold text-white bg-rose-700 hover:bg-rose-600 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer btn-3d-rose"
            >
              <PartyPopper className="w-3.5 h-3.5 text-amber-300 animate-pulse shrink-0" />
              <span>Celebrate</span>
            </button>

            {/* Primary 3D Action (Black Button beside Celebrate — always fully visible) */}
            <button
              type="button"
              onClick={onOpenPersonalize}
              title="Personalize Birthday Keepsake"
              className={`inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer btn-3d-dark shadow-xs ${
                isMidnight
                  ? 'bg-indigo-600 text-white hover:bg-indigo-500'
                  : 'bg-stone-900 text-white hover:bg-stone-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span>Personalize Gift</span>
            </button>

            {/* Top-Right Cross (X) Button to Return to Home Screen when on any Sub-Page */}
            {activePage !== 'home' && (
              <a
                href="#home"
                onClick={(e) => handleNavClick(e, 'home')}
                title="Return to Home Screen"
                aria-label="Return to Home Screen"
                className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-rose-100 hover:bg-rose-600 text-rose-800 hover:text-white border border-rose-300 transition-all shrink-0 cursor-pointer shadow-xs animate-pulse"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </a>
            )}
          </div>
        </div>

        {/* Responsive Sub-Row for Tablet & Mobile (< xl): Hyperlinked Multi-Page Bar */}
        <nav
          aria-label="Mobile & Tablet Keepsake Pages"
          className="xl:hidden flex items-center gap-1.5 pb-2.5 overflow-x-auto no-scrollbar border-t border-stone-200/40 pt-2"
        >
          {KEEPSAKE_PAGES.map((page) => {
            const isCurrent = activePage === page.id;
            return (
              <a
                key={page.id}
                href={page.href}
                onClick={(e) => handleNavClick(e, page.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                  isCurrent
                    ? isMidnight
                      ? 'bg-indigo-950 text-amber-300 border border-indigo-400/50'
                      : 'bg-rose-700 text-white shadow-2xs'
                    : isMidnight
                    ? 'text-slate-300 hover:text-white bg-slate-900/50'
                    : 'text-stone-600 hover:text-stone-950 bg-stone-200/50'
                }`}
              >
                {isCurrent && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-ping" />
                )}
                <span>{page.label}</span>
              </a>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
