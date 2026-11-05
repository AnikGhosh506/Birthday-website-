import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Home,
  X,
  Gamepad2,
  Camera,
  MailOpen,
  MessageCircleHeart,
  Sparkles,
  Gift,
} from 'lucide-react';
import { DEFAULT_BIRTHDAY_DATA } from './data/defaultData';
import { PersonalizationData, LoveCoupon, Memory } from './types';
import { romanticAudio } from './utils/audioSynth';
import { idbGet, idbSet } from './utils/persistentStorage';
import { AmbianceTheme, THEME_STORAGE_KEY } from './utils/themeAmbiance';
import { AuthGate } from './components/AuthGate';
import { Navbar, KeepsakePageId, KEEPSAKE_PAGES } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { BirthdayGameArcade } from './components/BirthdayGameArcade';
import { TimelineSection } from './components/TimelineSection';
import { LoveLettersSection } from './components/LoveLettersSection';
import { VouchersSection } from './components/VouchersSection';
import { ReasonsDeck } from './components/ReasonsDeck';
import { CoupleQuiz } from './components/CoupleQuiz';
import { AnikAIChatSection } from './components/AnikAIChatSection';
import { LanternWishCanvas } from './components/LanternWishCanvas';
import { Footer } from './components/Footer';
import { PersonalizeModal } from './components/PersonalizeModal';
import { BirthdayBurstOverlay } from './components/BirthdayBurstOverlay';
import { SiblingSoundboard } from './components/SiblingSoundboard';
import { AstrologyWishesSection } from './components/AstrologyWishesSection';
import { BirthdayCollageSection } from './components/BirthdayCollageSection';
import { FloatingBalloonsCanvas } from './components/FloatingBalloonsCanvas';
import { BirthdayWishesWall } from './components/BirthdayWishesWall';
import { FireworksShowCanvas } from './components/FireworksShowCanvas';
import { BirthdayPromiseGiftBox } from './components/BirthdayPromiseGiftBox';
import { DailyAffirmationsSection } from './components/DailyAffirmationsSection';
import { MemoryGardenSection } from './components/MemoryGardenSection';
import { PersistentConfettiRainCanvas } from './components/PersistentConfettiRainCanvas';
import { SiblingVideoMessageTopFrame } from './components/SiblingVideoMessageTopFrame';
import { IdleSurpriseStickyNote } from './components/IdleSurpriseStickyNote';

const IDB_DATA_KEY = 'amore_birthday_data_permanent_v1';
const IDB_IMAGES_KEY = 'amore_memory_images_permanent_v1';
const CONFETTI_RAIN_STORAGE_KEY = 'amore_persistent_confetti_rain_v1';

// Map any URL hash or anchor link to the corresponding keepsake page
function resolvePageFromHash(hashStr: string): KeepsakePageId | null {
  const clean = hashStr.replace(/^#/, '').trim().toLowerCase();
  if (!clean || clean.startsWith('gift=')) return null;
  if (clean === 'home' || clean === 'celebration' || clean === 'video-message') {
    return 'home';
  }
  if (clean === 'arcade' || clean === 'quiz') {
    return 'arcade';
  }
  if (clean === 'memories' || clean === 'memory-garden' || clean === 'timeline') {
    return 'memories';
  }
  if (
    clean === 'letters' ||
    clean === 'vouchers' ||
    clean === 'coupons' ||
    clean === 'reasons' ||
    clean === 'affirmations' ||
    clean === 'daily-affirmations'
  ) {
    return 'letters';
  }
  if (clean === 'chat' || clean === 'anik-ai-chat' || clean === 'soundboard') {
    return 'chat';
  }
  if (
    clean === 'wishes' ||
    clean === 'lanterns' ||
    clean === 'astrology' ||
    clean === 'wishes-wall'
  ) {
    return 'wishes';
  }
  if (clean === 'finale' || clean === 'collage' || clean === 'promise-gift') {
    return 'finale';
  }
  return null;
}

// Ensure all 10 default memory slots (mem-1..mem-10) exist even if storage had an older 6-slot list
function mergeWithAllDefaultMemories(savedMemories?: Memory[]): Memory[] {
  if (!Array.isArray(savedMemories) || savedMemories.length === 0) {
    return DEFAULT_BIRTHDAY_DATA.memories;
  }
  const byId = new Map<string, Memory>();
  savedMemories.forEach((m) => byId.set(m.id, m));

  const merged: Memory[] = DEFAULT_BIRTHDAY_DATA.memories.map((defMem) => {
    const existing = byId.get(defMem.id);
    if (existing) {
      byId.delete(defMem.id);
      return {
        ...defMem,
        ...existing,
        imageUrl: existing.imageUrl ?? defMem.imageUrl,
      };
    }
    return defMem;
  });

  // Append any custom user-created memories
  byId.forEach((customMem) => merged.push(customMem));
  return merged;
}

export default function App() {
  const [data, setData] = useState<PersonalizationData>(() => {
    // 1. Check if shared via URL hash
    if (typeof window !== 'undefined' && window.location.hash) {
      try {
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const giftParam = params.get('gift');
        if (giftParam) {
          const parsed = JSON.parse(decodeURIComponent(giftParam));
          return {
            ...DEFAULT_BIRTHDAY_DATA,
            ...parsed,
            memories: mergeWithAllDefaultMemories(parsed.memories),
          };
        }
      } catch (err) {
        console.error('Failed to parse URL hash data', err);
      }
    }

    // 2. Check localStorage synchronously for instant first paint
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('amore_birthday_data');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.boyfriendName === 'Julian' || parsed.nickname === 'My Sunshine') {
            localStorage.setItem('amore_birthday_data', JSON.stringify(DEFAULT_BIRTHDAY_DATA));
            return DEFAULT_BIRTHDAY_DATA;
          }
          if (parsed.boyfriendName === 'Arpita') {
            parsed.boyfriendName = 'Anik';
          }
          return {
            ...DEFAULT_BIRTHDAY_DATA,
            ...parsed,
            memories: mergeWithAllDefaultMemories(parsed.memories),
            quiz: DEFAULT_BIRTHDAY_DATA.quiz,
          };
        }
      } catch (err) {
        console.error('Failed to read localStorage data', err);
      }
    }

    return DEFAULT_BIRTHDAY_DATA;
  });

  const [activePage, setActivePage] = useState<KeepsakePageId>(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const resolved = resolvePageFromHash(window.location.hash);
      if (resolved) return resolved;
    }
    return 'home';
  });

  const handleNavigatePage = useCallback((nextPage: KeepsakePageId) => {
    romanticAudio.playSoftClick();
    setActivePage(nextPage);
    if (typeof window !== 'undefined') {
      try {
        window.history.replaceState(null, '', `#${nextPage}`);
      } catch {}
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  // Listen to browser hash changes and any in-page anchor clicks (#memories, #arcade, etc.)
  useEffect(() => {
    const onHashChange = () => {
      const resolved = resolvePageFromHash(window.location.hash);
      if (resolved) {
        setActivePage(resolved);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [isPersonalizeOpen, setIsPersonalizeOpen] = useState(false);
  const [burstTriggerKey, setBurstTriggerKey] = useState(0);
  const [isConfettiRainEnabled, setIsConfettiRainEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(CONFETTI_RAIN_STORAGE_KEY);
        if (saved !== null) {
          return saved === 'true';
        }
      } catch {}
    }
    return true;
  });

  const handleToggleConfettiRain = () => {
    setIsConfettiRainEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(CONFETTI_RAIN_STORAGE_KEY, String(next));
      } catch {}
      return next;
    });
  };

  const [activeTheme, setActiveTheme] = useState<AmbianceTheme>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      if (
        savedTheme === 'sunrise-gold' ||
        savedTheme === 'sunset-rose' ||
        savedTheme === 'midnight-indigo'
      ) {
        return savedTheme;
      }
    }
    return 'sunrise-gold';
  });

  // Sync data-theme attribute on <html> and persist in localStorage
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', activeTheme);
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, activeTheme);
    } catch {}
  }, [activeTheme]);

  const handleChangeTheme = (nextTheme: AmbianceTheme) => {
    setActiveTheme(nextTheme);
    romanticAudio.playSoftClick();
  };

  // Keep isMusicPlaying button state synced with automatic candle-blowout playback & fade-out
  useEffect(() => {
    return romanticAudio.subscribe((playing) => {
      setIsMusicPlaying(playing);
    });
  }, []);

  // Hydrate permanent data and memory photos from IndexedDB on mount so photos stay forever across refreshes
  useEffect(() => {
    let mounted = true;
    async function restorePermanentStorage() {
      const [savedIdbData, savedImageMap] = await Promise.all([
        idbGet<PersonalizationData>(IDB_DATA_KEY),
        idbGet<Record<string, string>>(IDB_IMAGES_KEY),
      ]);
      if (!mounted) return;

      if (savedIdbData || savedImageMap) {
        setData((prev) => {
          const base = savedIdbData ? { ...DEFAULT_BIRTHDAY_DATA, ...savedIdbData } : prev;
          if (base.boyfriendName === 'Arpita') {
            base.boyfriendName = 'Anik';
          }
          const fullMemories = mergeWithAllDefaultMemories(base.memories);
          const mergedMemories = fullMemories.map((mem) => {
            if (savedImageMap && Object.prototype.hasOwnProperty.call(savedImageMap, mem.id)) {
              return { ...mem, imageUrl: savedImageMap[mem.id] };
            }
            return mem;
          });
          return {
            ...base,
            memories: mergedMemories,
            quiz: DEFAULT_BIRTHDAY_DATA.quiz,
          };
        });
      }
    }
    void restorePermanentStorage();
    return () => {
      mounted = false;
    };
  }, []);

  // Persist to both IndexedDB (unlimited photo capacity) and localStorage
  const handleSaveData = (newData: PersonalizationData) => {
    setData(newData);

    const imageMap: Record<string, string> = {};
    newData.memories.forEach((m) => {
      imageMap[m.id] = m.imageUrl || '';
    });
    void idbSet(IDB_DATA_KEY, newData);
    void idbSet(IDB_IMAGES_KEY, imageMap);

    try {
      localStorage.setItem('amore_birthday_data', JSON.stringify(newData));
    } catch {
      try {
        const lightweightData: PersonalizationData = {
          ...newData,
          memories: newData.memories.map((m) => ({ ...m, imageUrl: '' })),
        };
        localStorage.setItem('amore_birthday_data', JSON.stringify(lightweightData));
      } catch (e) {
        console.warn('Could not save to localStorage', e);
      }
    }
  };

  const handleResetData = () => {
    if (window.confirm('Reset all details, messages, and memories to the default sisterhood birthday template?')) {
      setData(DEFAULT_BIRTHDAY_DATA);
      try {
        localStorage.removeItem('amore_birthday_data');
      } catch {}
      void idbSet(IDB_DATA_KEY, DEFAULT_BIRTHDAY_DATA);
      void idbSet(IDB_IMAGES_KEY, {});
      romanticAudio.playSoftClick();
    }
  };

  const handleToggleMusic = () => {
    const nextState = romanticAudio.toggle();
    setIsMusicPlaying(nextState);
  };

  const handleUpdateMemoryImage = (id: string, dataUrl: string) => {
    setData((prev) => {
      const updatedMemories = prev.memories.map((m) =>
        m.id === id ? { ...m, imageUrl: dataUrl } : m
      );
      const nextData = { ...prev, memories: updatedMemories };

      const imageMap: Record<string, string> = {};
      nextData.memories.forEach((m) => {
        imageMap[m.id] = m.imageUrl || '';
      });
      void idbSet(IDB_DATA_KEY, nextData);
      void idbSet(IDB_IMAGES_KEY, imageMap);

      try {
        localStorage.setItem('amore_birthday_data', JSON.stringify(nextData));
      } catch {
        try {
          const lightweightData: PersonalizationData = {
            ...nextData,
            memories: nextData.memories.map((m) => ({ ...m, imageUrl: '' })),
          };
          localStorage.setItem('amore_birthday_data', JSON.stringify(lightweightData));
        } catch {}
      }
      return nextData;
    });
  };

  const handleRemoveMemoryImage = (id: string) => {
    handleUpdateMemoryImage(id, '');
  };

  const handleAddMemory = () => {
    setIsPersonalizeOpen(true);
  };

  const handleUpdateCoupons = (updatedCoupons: LoveCoupon[]) => {
    handleSaveData({ ...data, coupons: updatedCoupons });
  };

  const hasBonusCoupon = data.coupons.some((c) => c.id === 'arcade-golden-prize');

  const handleUnlockBonusCoupon = () => {
    if (hasBonusCoupon) return;
    const bonusCoupon: LoveCoupon = {
      id: 'arcade-golden-prize',
      title: '★ Golden Arcade Queen Sis Pass',
      description:
        'Unlocked in the Birthday Game Arcade! Good for one ultimate Sister Day Out—your choice of restaurant, dessert spot, or shopping treat, 100% sponsored!',
      category: 'pampering',
      icon: 'sparkles',
      isRedeemed: false,
    };
    handleSaveData({
      ...data,
      coupons: [bonusCoupon, ...data.coupons],
    });
  };

  const currentPageIndex = KEEPSAKE_PAGES.findIndex((p) => p.id === activePage);
  const currentPageMeta = KEEPSAKE_PAGES[currentPageIndex] || KEEPSAKE_PAGES[0];
  const prevPageMeta =
    currentPageIndex > 0 ? KEEPSAKE_PAGES[currentPageIndex - 1] : null;
  const nextPageMeta =
    currentPageIndex < KEEPSAKE_PAGES.length - 1
      ? KEEPSAKE_PAGES[currentPageIndex + 1]
      : null;

  const HOME_DIRECTORY_CARDS: Array<{
    id: KeepsakePageId;
    title: string;
    subtitle: string;
    badge: string;
    icon: React.ReactNode;
    accent: string;
  }> = [
    {
      id: 'arcade',
      title: '3D Game Lounge & Quiz',
      subtitle: 'Play 3 interactive Three.js mini-games & Sisterhood Trivia',
      badge: 'Page 02',
      icon: <Gamepad2 className="w-5 h-5 text-rose-700" />,
      accent: 'from-rose-50 to-amber-50/60 border-rose-200',
    },
    {
      id: 'memories',
      title: 'Memory Lane & 3D Garden',
      subtitle: '3D Polaroid carousel, scrapbook search, likes & blooming flowers',
      badge: 'Page 03',
      icon: <Camera className="w-5 h-5 text-amber-700" />,
      accent: 'from-amber-50 to-stone-50 border-amber-200',
    },
    {
      id: 'letters',
      title: 'Wax-Sealed Letters & Vouchers',
      subtitle: '3D wax-seal break letters, daily affirmations & love coupons',
      badge: 'Page 04',
      icon: <MailOpen className="w-5 h-5 text-rose-700" />,
      accent: 'from-rose-50/80 to-white border-rose-200',
    },
    {
      id: 'chat',
      title: 'Sibling Chat & Soundboard',
      subtitle: 'Direct sibling chat with profile studio & musical soundboard',
      badge: 'Page 05',
      icon: <MessageCircleHeart className="w-5 h-5 text-emerald-700" />,
      accent: 'from-emerald-50/80 to-white border-emerald-200',
    },
    {
      id: 'wishes',
      title: 'Sky Lanterns, Stars & Wall',
      subtitle: 'Floating night lanterns, natal star chart & sticky notes wall',
      badge: 'Page 06',
      icon: <Sparkles className="w-5 h-5 text-indigo-700" />,
      accent: 'from-indigo-50/80 to-white border-indigo-200',
    },
    {
      id: 'finale',
      title: '3D Collage & Grand Gift Box',
      subtitle: 'Interactive 5-photo mosaic & unwrappable 3D birthday gift box',
      badge: 'Page 07',
      icon: <Gift className="w-5 h-5 text-amber-700" />,
      accent: 'from-amber-50/90 to-rose-50/60 border-amber-300',
    },
  ];

  return (
    <AuthGate sisterName={data.girlfriendName} senderName={data.boyfriendName}>
      {({ userEmail, onSignOut, onSwitchAccount }) => (
        <div
          data-theme={activeTheme}
          className="min-h-screen flex flex-col justify-between theme-app-shell selection:bg-rose-200 selection:text-rose-900"
        >
          {/* 3D Floating Hearts & Glitter Birthday Burst on Website Open */}
          <BirthdayBurstOverlay
            sisterName={data.girlfriendName}
            triggerKey={burstTriggerKey}
          />

          {/* Persistent Page-Wide Confetti Rain (User-toggled in the Birthday Arcade) */}
          <PersistentConfettiRainCanvas enabled={isConfettiRainEnabled} />

          {/* Slow-Floating Interactive Birthday Balloons (Click any balloon to pop with confetti) */}
          <FloatingBalloonsCanvas sisterName={data.girlfriendName} />

          {/* Full-Screen Canvas Firework Show triggered by clicking any 'Celebrate' button */}
          <FireworksShowCanvas
            sisterName={data.girlfriendName}
            triggerCount={0}
            onReturnHome={() => handleNavigatePage('home')}
          />

          {/* Draggable 3D Surprise Sticky Note appearing randomly after 30s of idle time */}
          <IdleSurpriseStickyNote
            sisterName={data.girlfriendName}
            senderName={data.boyfriendName}
          />

          {/* Top Navigation with Hyperlinked Multi-Page Tabs, Countdown Clock & Theme Switcher */}
          <Navbar
            brandName={data.girlfriendName}
            birthdayDate={data.birthdayDate}
            isMusicPlaying={isMusicPlaying}
            onToggleMusic={handleToggleMusic}
            onOpenPersonalize={() => setIsPersonalizeOpen(true)}
            activeTheme={activeTheme}
            onChangeTheme={handleChangeTheme}
            activePage={activePage}
            onNavigatePage={handleNavigatePage}
          />

          {/* Sub-Page Top Bar + Floating Top-Right Cross (X) Button to Return to Home Screen */}
          {activePage !== 'home' && (
            <>
              {/* Floating Top-Right Cross Button to Return to Home Screen */}
              <a
                href="#home"
                onClick={(e) => {
                  e.preventDefault();
                  handleNavigatePage('home');
                }}
                title="Return to Home Screen"
                aria-label="Return to Home Screen"
                className="fixed top-20 right-5 z-30 group flex items-center gap-2 px-3.5 py-2 rounded-full bg-stone-900/95 hover:bg-rose-700 text-white border border-amber-400/70 shadow-lg transition-all cursor-pointer"
              >
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
                </span>
                <span className="text-xs font-semibold hidden sm:inline">
                  Home
                </span>
                <span className="w-6 h-6 rounded-full bg-white/15 group-hover:bg-white/25 flex items-center justify-center animate-pulse">
                  <X className="w-3.5 h-3.5 text-white stroke-[2.5]" />
                </span>
              </a>

              {/* Sub-Page Breadcrumb Banner */}
              <div className="bg-white/80 backdrop-blur-xs border-b border-stone-200/80">
                <div className="max-w-6xl mx-auto px-6 py-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 text-xs">
                    <a
                      href="#home"
                      onClick={(e) => {
                        e.preventDefault();
                        handleNavigatePage('home');
                      }}
                      className="inline-flex items-center gap-1.5 font-semibold text-rose-700 hover:text-rose-900 transition-colors"
                    >
                      <Home className="w-3.5 h-3.5" />
                      <span>Home</span>
                    </a>
                    <span className="text-stone-400">/</span>
                    <span className="inline-flex items-center gap-1.5 font-serif font-bold text-stone-900">
                      <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                      Page {currentPageMeta.badge}: {currentPageMeta.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {prevPageMeta && (
                      <a
                        href={prevPageMeta.href}
                        onClick={(e) => {
                          e.preventDefault();
                          handleNavigatePage(prevPageMeta.id);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium transition-colors"
                      >
                        <ArrowLeft className="w-3 h-3" />
                        <span>{prevPageMeta.shortLabel}</span>
                      </a>
                    )}
                    {nextPageMeta && (
                      <a
                        href={nextPageMeta.href}
                        onClick={(e) => {
                          e.preventDefault();
                          handleNavigatePage(nextPageMeta.id);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold transition-colors animate-pulse"
                      >
                        <span>Next: {nextPageMeta.shortLabel}</span>
                        <ArrowRight className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Main Content Area — Renders the Active Hyperlinked Page so the page is never overly long */}
          <main className="flex-1">
            {activePage === 'home' && (
              <>
                {/* Hero Section: Editorial typography + Interactive Birthday Cake */}
                <HeroSection
                  girlfriendName={data.girlfriendName}
                  nickname={data.nickname}
                  heroKicker={data.heroKicker}
                  heroHeadline={data.heroHeadline}
                  heroMessage={data.heroMessage}
                  secretWishMessage={data.secretWishMessage}
                  anniversaryDate={data.anniversaryDate}
                  birthdayDate={data.birthdayDate}
                  isMusicPlaying={isMusicPlaying}
                  onToggleMusic={handleToggleMusic}
                  onSwitchAccount={onSwitchAccount}
                  onSignOut={onSignOut}
                />

                {/* 3D-Styled Sibling Video Message Frame & Gemini AI Script Studio */}
                <SiblingVideoMessageTopFrame
                  girlfriendName={data.girlfriendName}
                  boyfriendName={data.boyfriendName}
                  memories={data.memories}
                />

                {/* Interactive Multi-Page Chapter Directory on the Home Screen */}
                <section className="py-16 bg-[#f7f3ed] border-b border-stone-200/80">
                  <div className="max-w-6xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                      <div>
                        <div className="inline-flex items-center gap-2 text-xs font-semibold text-rose-800 uppercase tracking-widest mb-2">
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600" />
                          </span>
                          <span>Hyperlinked Keepsake Chapters</span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 heading-3d">
                          Explore {data.girlfriendName}&apos;s Birthday Pages
                        </h2>
                        <p className="mt-1 text-sm text-stone-600">
                          Click any chapter card below or use the top navigation bar to open each dedicated page.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {HOME_DIRECTORY_CARDS.map((card) => (
                        <a
                          key={card.id}
                          href={`#${card.id}`}
                          onClick={(e) => {
                            e.preventDefault();
                            handleNavigatePage(card.id);
                          }}
                          className={`group rounded-2xl p-5 bg-gradient-to-br ${card.accent} border shadow-xs hover:shadow-md transition-all flex flex-col justify-between card-3d-tilt`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-3">
                              <div className="w-10 h-10 rounded-xl bg-white border border-stone-200/80 flex items-center justify-center shadow-2xs">
                                {card.icon}
                              </div>
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/90 border border-stone-200 text-[10px] font-mono font-bold uppercase tracking-wider text-stone-700">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                                {card.badge}
                              </span>
                            </div>
                            <h3 className="text-lg font-serif font-bold text-stone-900 group-hover:text-rose-800 transition-colors">
                              {card.title}
                            </h3>
                            <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                              {card.subtitle}
                            </p>
                          </div>

                          <div className="mt-4 pt-3 border-t border-stone-200/60 flex items-center justify-between text-xs font-semibold text-rose-800">
                            <span>Open Page</span>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                </section>
              </>
            )}

            {activePage === 'arcade' && (
              <>
                <BirthdayGameArcade
                  girlfriendName={data.girlfriendName}
                  boyfriendName={data.boyfriendName}
                  onUnlockBonusCoupon={handleUnlockBonusCoupon}
                  bonusUnlocked={hasBonusCoupon}
                  isConfettiRainEnabled={isConfettiRainEnabled}
                  onToggleConfettiRain={handleToggleConfettiRain}
                />
                <CoupleQuiz
                  quiz={data.quiz}
                  girlfriendName={data.girlfriendName}
                />
              </>
            )}

            {activePage === 'memories' && (
              <>
                <TimelineSection
                  memories={data.memories}
                  onUpdateMemoryImage={handleUpdateMemoryImage}
                  onRemoveMemoryImage={handleRemoveMemoryImage}
                  onAddMemory={handleAddMemory}
                />
                <MemoryGardenSection
                  memories={data.memories}
                  girlfriendName={data.girlfriendName}
                  boyfriendName={data.boyfriendName}
                  onUpdateMemoryImage={handleUpdateMemoryImage}
                />
              </>
            )}

            {activePage === 'letters' && (
              <>
                <LoveLettersSection
                  letters={data.letters}
                  girlfriendName={data.girlfriendName}
                  boyfriendName={data.boyfriendName}
                  onAddLetter={() => setIsPersonalizeOpen(true)}
                />
                <DailyAffirmationsSection
                  girlfriendName={data.girlfriendName}
                  boyfriendName={data.boyfriendName}
                />
                <VouchersSection
                  coupons={data.coupons}
                  girlfriendName={data.girlfriendName}
                  onUpdateCoupons={handleUpdateCoupons}
                />
                <ReasonsDeck
                  reasons={data.adoreReasons}
                  girlfriendName={data.girlfriendName}
                />
              </>
            )}

            {activePage === 'chat' && (
              <>
                <AnikAIChatSection
                  girlfriendName={data.girlfriendName}
                  boyfriendName={data.boyfriendName}
                  userEmail={userEmail}
                />
                <SiblingSoundboard
                  girlfriendName={data.girlfriendName}
                  boyfriendName={data.boyfriendName}
                />
              </>
            )}

            {activePage === 'wishes' && (
              <>
                <LanternWishCanvas
                  memories={data.memories}
                  onUpdateMemoryImage={handleUpdateMemoryImage}
                  onRemoveMemoryImage={handleRemoveMemoryImage}
                />
                <AstrologyWishesSection
                  girlfriendName={data.girlfriendName}
                  boyfriendName={data.boyfriendName}
                  birthdayDate={data.birthdayDate}
                />
                <BirthdayWishesWall
                  girlfriendName={data.girlfriendName}
                  boyfriendName={data.boyfriendName}
                  userEmail={userEmail}
                />
              </>
            )}

            {activePage === 'finale' && (
              <>
                <BirthdayCollageSection
                  memories={data.memories}
                  girlfriendName={data.girlfriendName}
                  boyfriendName={data.boyfriendName}
                  onUpdateMemoryImage={handleUpdateMemoryImage}
                />
                <BirthdayPromiseGiftBox
                  girlfriendName={data.girlfriendName}
                  boyfriendName={data.boyfriendName}
                />
              </>
            )}

            {/* Bottom Hyperlinked Page Switcher Bar */}
            <div className="bg-white border-b border-stone-200/80 py-6">
              <div className="max-w-6xl mx-auto px-6 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  {prevPageMeta ? (
                    <a
                      href={prevPageMeta.href}
                      onClick={(e) => {
                        e.preventDefault();
                        handleNavigatePage(prevPageMeta.id);
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs sm:text-sm font-semibold transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Previous: {prevPageMeta.label}</span>
                    </a>
                  ) : (
                    <span className="text-xs text-stone-400 font-medium">
                      Page 01 of {KEEPSAKE_PAGES.length} · Home
                    </span>
                  )}
                </div>

                {/* Page Dots with Pulse Indicator */}
                <div className="flex items-center gap-1.5">
                  {KEEPSAKE_PAGES.map((p) => {
                    const isCur = p.id === activePage;
                    return (
                      <a
                        key={p.id}
                        href={p.href}
                        onClick={(e) => {
                          e.preventDefault();
                          handleNavigatePage(p.id);
                        }}
                        title={p.label}
                        className={`h-2.5 rounded-full transition-all ${
                          isCur
                            ? 'w-7 bg-rose-700 animate-pulse'
                            : 'w-2.5 bg-stone-300 hover:bg-stone-400'
                        }`}
                      />
                    );
                  })}
                </div>

                <div className="flex items-center gap-2">
                  {activePage !== 'home' && (
                    <a
                      href="#home"
                      onClick={(e) => {
                        e.preventDefault();
                        handleNavigatePage('home');
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-700 text-xs sm:text-sm font-semibold transition-colors"
                    >
                      <Home className="w-4 h-4" />
                      <span>Home</span>
                    </a>
                  )}
                  {nextPageMeta && (
                    <a
                      href={nextPageMeta.href}
                      onClick={(e) => {
                        e.preventDefault();
                        handleNavigatePage(nextPageMeta.id);
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs sm:text-sm font-semibold transition-colors shadow-xs btn-3d-rose"
                    >
                      <span className="w-2 h-2 rounded-full bg-amber-300 animate-ping" />
                      <span>Next Page: {nextPageMeta.label}</span>
                      <ArrowRight className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </main>

          {/* Footer with Print Keepsake Booklet Studio & Account Section */}
          <Footer
            girlfriendName={data.girlfriendName}
            boyfriendName={data.boyfriendName}
            data={data}
            userEmail={userEmail}
            onSignOut={onSignOut}
            onSwitchAccount={onSwitchAccount}
            onOpenPersonalize={() => setIsPersonalizeOpen(true)}
            onReplayBirthdayBurst={() => setBurstTriggerKey((k) => k + 1)}
          />

          {/* Personalization Modal */}
          <PersonalizeModal
            isOpen={isPersonalizeOpen}
            onClose={() => setIsPersonalizeOpen(false)}
            data={data}
            onSave={handleSaveData}
            onReset={handleResetData}
          />
        </div>
      )}
    </AuthGate>
  );
}
