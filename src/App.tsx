import React, { useState, useEffect } from 'react';
import { DEFAULT_BIRTHDAY_DATA } from './data/defaultData';
import { PersonalizationData, LoveCoupon, Memory } from './types';
import { romanticAudio } from './utils/audioSynth';
import { idbGet, idbSet } from './utils/persistentStorage';
import { AuthGate } from './components/AuthGate';
import { Navbar } from './components/Navbar';
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

const IDB_DATA_KEY = 'amore_birthday_data_permanent_v1';
const IDB_IMAGES_KEY = 'amore_memory_images_permanent_v1';

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
          // If localStorage still holds the old romantic template ("Julian" or "My Sunshine"), refresh to Older Sister defaults
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

  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [isPersonalizeOpen, setIsPersonalizeOpen] = useState(false);

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

    // 1. Save full data & image map permanently to IndexedDB
    const imageMap: Record<string, string> = {};
    newData.memories.forEach((m) => {
      imageMap[m.id] = m.imageUrl || '';
    });
    void idbSet(IDB_DATA_KEY, newData);
    void idbSet(IDB_IMAGES_KEY, imageMap);

    // 2. Save to localStorage (with automatic fallback if photos exceed 5MB localStorage quota)
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

  return (
    <AuthGate sisterName={data.girlfriendName} senderName={data.boyfriendName}>
      {({ userEmail, onSignOut, onSwitchAccount }) => (
        <div className="min-h-screen bg-[#faf7f5] text-stone-900 selection:bg-rose-200 selection:text-rose-900">
          {/* Top Navigation conforming to 3-zone contract */}
          <Navbar
            brandName={data.girlfriendName}
            isMusicPlaying={isMusicPlaying}
            onToggleMusic={handleToggleMusic}
            onOpenPersonalize={() => setIsPersonalizeOpen(true)}
          />

          {/* Main Content Area */}
          <main>
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

            {/* Interactive Birthday Game Arcade (3 Playable Games) */}
            <BirthdayGameArcade
              girlfriendName={data.girlfriendName}
              boyfriendName={data.boyfriendName}
              onUnlockBonusCoupon={handleUnlockBonusCoupon}
              bonusUnlocked={hasBonusCoupon}
            />

            {/* Memory Lane Scrapbook (10 Polaroid Slots + Permanent IndexedDB Storage) */}
            <TimelineSection
              memories={data.memories}
              onUpdateMemoryImage={handleUpdateMemoryImage}
              onRemoveMemoryImage={handleRemoveMemoryImage}
              onAddMemory={handleAddMemory}
            />

            {/* "Open When..." Wax-Sealed Letters */}
            <LoveLettersSection
              letters={data.letters}
              girlfriendName={data.girlfriendName}
              boyfriendName={data.boyfriendName}
              onAddLetter={() => setIsPersonalizeOpen(true)}
            />

            {/* Perforated Birthday Love Coupons */}
            <VouchersSection
              coupons={data.coupons}
              girlfriendName={data.girlfriendName}
              onUpdateCoupons={handleUpdateCoupons}
            />

            {/* Reasons Why I Adore You Interactive Shuffle Cards */}
            <ReasonsDeck
              reasons={data.adoreReasons}
              girlfriendName={data.girlfriendName}
            />

            {/* AI-Powered 5-Question Sisterhood Trivia Quiz */}
            <CoupleQuiz
              quiz={data.quiz}
              girlfriendName={data.girlfriendName}
            />

            {/* Sibling Chat Section (Didi responds to Anik; Anik responds to Didi) */}
            <AnikAIChatSection
              girlfriendName={data.girlfriendName}
              boyfriendName={data.boyfriendName}
              userEmail={userEmail}
            />

            {/* Night Sky of Floating Wishes Lanterns + Tap Lantern to Reveal Photo */}
            <LanternWishCanvas
              memories={data.memories}
              onUpdateMemoryImage={handleUpdateMemoryImage}
              onRemoveMemoryImage={handleRemoveMemoryImage}
            />
          </main>

          {/* Footer with Dedicated Logout & Switch Account Section */}
          <Footer
            girlfriendName={data.girlfriendName}
            boyfriendName={data.boyfriendName}
            userEmail={userEmail}
            onSignOut={onSignOut}
            onSwitchAccount={onSwitchAccount}
            onOpenPersonalize={() => setIsPersonalizeOpen(true)}
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
