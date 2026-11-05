import React, { useState } from 'react';
import { DEFAULT_BIRTHDAY_DATA } from './data/defaultData';
import { PersonalizationData, LoveCoupon } from './types';
import { romanticAudio } from './utils/audioSynth';
import { AuthGate } from './components/AuthGate';
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
          const parsed = JSON.parse(saved);
          // If localStorage still holds the old romantic template ("Julian" or "My Sunshine"), refresh to Older Sister defaults
          if (parsed.boyfriendName === 'Julian' || parsed.nickname === 'My Sunshine') {
            localStorage.setItem('amore_birthday_data', JSON.stringify(DEFAULT_BIRTHDAY_DATA));
            return DEFAULT_BIRTHDAY_DATA;
          }
          if (parsed.boyfriendName === 'Arpita') {
            parsed.boyfriendName = 'Anik';
            localStorage.setItem('amore_birthday_data', JSON.stringify({ ...DEFAULT_BIRTHDAY_DATA, ...parsed }));
          }
          return { ...DEFAULT_BIRTHDAY_DATA, ...parsed };
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
    if (window.confirm('Reset all details, messages, and memories to the default sisterhood birthday template?')) {
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

            {/* Sisterhood Trivia Quiz */}
            <CoupleQuiz
              quiz={data.quiz}
              girlfriendName={data.girlfriendName}
            />

            {/* Night Sky of Floating Wishes Lanterns */}
            <LanternWishCanvas />
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


