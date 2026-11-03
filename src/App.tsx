import React, { useState } from 'react';
import { DEFAULT_BIRTHDAY_DATA } from './data/defaultData';
import { PersonalizationData, LoveCoupon } from './types';
import { romanticAudio } from './utils/audioSynth';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { BirthdayGameArcade } from './components/BirthdayGameArcade';
import { TimelineSection } from './components/TimelineSection';
import { LoveLettersSection } from './components/LoveLettersSection';
import { VouchersSection } from './components/VouchersSection';
import { ReasonsDeck } from './components/ReasonsDeck';
import { CoupleQuiz } from './components/CoupleQuiz';
import { LanternWishCanvas } from './components/LanternWishCanvas';
import { Footer } from './components/Footer';
import { PersonalizeModal } from './components/PersonalizeModal';

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
          return { ...DEFAULT_BIRTHDAY_DATA, ...parsed };
        }
      } catch (err) {
        console.error('Failed to parse URL hash data', err);
      }
    }

    // 2. Check localStorage
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('amore_birthday_data');
        if (saved) {
          return { ...DEFAULT_BIRTHDAY_DATA, ...JSON.parse(saved) };
        }
      } catch (err) {
        console.error('Failed to read localStorage data', err);
      }
    }

    return DEFAULT_BIRTHDAY_DATA;
  });

  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [isPersonalizeOpen, setIsPersonalizeOpen] = useState(false);

  // Sync to localStorage
  const handleSaveData = (newData: PersonalizationData) => {
    setData(newData);
    try {
      localStorage.setItem('amore_birthday_data', JSON.stringify(newData));
    } catch (e) {
      console.warn('Could not save to localStorage', e);
    }
  };

  const handleResetData = () => {
    if (window.confirm('Reset all details, messages, and memories to default romantic templates?')) {
      setData(DEFAULT_BIRTHDAY_DATA);
      try {
        localStorage.removeItem('amore_birthday_data');
      } catch {}
      romanticAudio.playSoftClick();
    }
  };

  const handleToggleMusic = () => {
    const nextState = romanticAudio.toggle();
    setIsMusicPlaying(nextState);
  };

  const handleUpdateMemoryImage = (id: string, dataUrl: string) => {
    const updatedMemories = data.memories.map((m) =>
      m.id === id ? { ...m, imageUrl: dataUrl } : m
    );
    handleSaveData({ ...data, memories: updatedMemories });
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
      title: '★ Golden Arcade Champion Wish',
      description:
        'Unlocked in the Birthday Game Arcade! Good for one spontaneous weekend getaway or dream date night of your choice, planned down to the last detail.',
      category: 'Dream Adventure',
      code: 'ARCADE-CHAMPION-VIP',
      isRedeemed: false,
    };
    handleSaveData({
      ...data,
      coupons: [bonusCoupon, ...data.coupons],
    });
  };

  return (
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
        />

        {/* Interactive Birthday Game Arcade (3 Playable Games) */}
        <BirthdayGameArcade
          girlfriendName={data.girlfriendName}
          boyfriendName={data.boyfriendName}
          onUnlockBonusCoupon={handleUnlockBonusCoupon}
          bonusUnlocked={hasBonusCoupon}
        />

        {/* Memory Lane Scrapbook */}
        <TimelineSection
          memories={data.memories}
          onUpdateMemoryImage={handleUpdateMemoryImage}
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

        {/* Couple Trivia / Relationship Quiz */}
        <CoupleQuiz
          quiz={data.quiz}
          girlfriendName={data.girlfriendName}
        />

        {/* Night Sky of Floating Wishes Lanterns */}
        <LanternWishCanvas />
      </main>

      {/* Footer */}
      <Footer
        girlfriendName={data.girlfriendName}
        boyfriendName={data.boyfriendName}
        onOpenPersonalize={() => setIsPersonalizeOpen(true)}
      />

      {/* Personalization Modal for Boyfriend */}
      <PersonalizeModal
        isOpen={isPersonalizeOpen}
        onClose={() => setIsPersonalizeOpen(false)}
        data={data}
        onSave={handleSaveData}
        onReset={handleResetData}
      />
    </div>
  );
}

