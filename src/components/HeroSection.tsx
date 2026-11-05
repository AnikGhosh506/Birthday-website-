import React from 'react';
import { BirthdayCake } from './BirthdayCake';
import { Heart, Gamepad2, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { triggerGlobalFireworksShow } from './FireworksShowCanvas';

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
  onSwitchAccount?: () => void;
  onSignOut?: () => void;
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
  onSwitchAccount,
  onSignOut,
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

  // Format birthday date nicely without UTC timezone shift
  const formatBirthday = (dateStr: string) => {
    try {
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const [year, month, day] = dateStr.split('-').map(Number);
        const d = new Date(year, month - 1, day);
        return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
      }
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    } catch {
      return 'May 28';
    }
  };

  const [titleTilt, setTitleTilt] = React.useState<{ rx: number; ry: number }>({
    rx: 6,
    ry: -5,
  });

  const handleTitleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    setTitleTilt({
      rx: Number((-ny * 12).toFixed(2)),
      ry: Number((nx * 14).toFixed(2)),
    });
  };

  const handleTitleMouseLeave = () => {
    setTitleTilt({ rx: 6, ry: -5 });
  };

  // Smooth scroll-aware docking: sticks at the top when scrolled past its original position,
  // and glides seamlessly back into its exact original space when scrolling through it.
  const prideBarAnchorRef = React.useRef<HTMLDivElement | null>(null);
  const floatingBarRef = React.useRef<HTMLDivElement | null>(null);
  const [isFloatingActive, setIsFloatingActive] = React.useState(false);

  React.useEffect(() => {
    const STICKY_TOP = 74; // 64px sticky Navbar + 10px breathing room
    let rafId: number | null = null;

    // Spring/lerp state for ultra-smooth landing into original space
    let visualGap = 0; // smoothed vertical distance above original anchor space
    let currentPillAlpha = 0; // 0 = in-place look, 1 = floating pill look
    let isAnimating = false;

    const applyFloatingStyles = (
      anchorRect: DOMRect,
      gap: number,
      pillAlpha: number
    ) => {
      const el = floatingBarRef.current;
      if (!el) return;
      const padX = pillAlpha * 14;
      const padY = pillAlpha * 7;
      // Subtract padX and padY from translate3d so the inner text coordinates
      // match (anchorRect.left, anchorRect.top - gap) with sub-pixel accuracy
      const x = anchorRect.left - padX;
      const y = anchorRect.top + gap - padY;
      el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
      el.style.padding = `${padY.toFixed(2)}px ${padX.toFixed(2)}px`;
      el.style.backgroundColor = `rgba(var(--theme-pill-rgb), ${(pillAlpha * 0.95).toFixed(3)})`;
      el.style.borderColor = `rgba(var(--theme-pill-border-rgb), ${(pillAlpha * 0.9).toFixed(3)})`;
      el.style.boxShadow =
        pillAlpha > 0.02
          ? `0 ${(6 * pillAlpha).toFixed(1)}px ${(18 * pillAlpha).toFixed(1)}px -4px rgba(0, 0, 0, ${(0.18 * pillAlpha).toFixed(3)})`
          : 'none';
      el.style.backdropFilter =
        pillAlpha > 0.04 ? `blur(${(pillAlpha * 8).toFixed(1)}px)` : 'none';
    };

    const tick = () => {
      const anchor = prideBarAnchorRef.current;
      if (!anchor) {
        isAnimating = false;
        return;
      }

      const rect = anchor.getBoundingClientRect();
      const isPastTop = rect.top < STICKY_TOP;

      if (isPastTop) {
        // Keep pinned at STICKY_TOP while smoothly easing in the pill halo
        const exactPinnedGap = STICKY_TOP - rect.top;
        visualGap += (exactPinnedGap - visualGap) * 0.55;
        currentPillAlpha += (1 - currentPillAlpha) * 0.22;
      } else {
        // Gliding back into original space: smoothly ease visualGap -> 0 and pillAlpha -> 0
        visualGap += (0 - visualGap) * 0.2;
        currentPillAlpha += (0 - currentPillAlpha) * 0.18;
      }

      const settledInOriginalSpace =
        !isPastTop &&
        Math.abs(visualGap) < 0.25 &&
        currentPillAlpha < 0.012;

      if (settledInOriginalSpace) {
        visualGap = 0;
        currentPillAlpha = 0;
        setIsFloatingActive(false);
        isAnimating = false;
        rafId = null;
        return;
      }

      setIsFloatingActive(true);
      applyFloatingStyles(rect, visualGap, currentPillAlpha);
      rafId = window.requestAnimationFrame(tick);
    };

    const handleScrollOrResize = () => {
      const anchor = prideBarAnchorRef.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      const isPastTop = rect.top < STICKY_TOP;

      if (isPastTop || isAnimating || currentPillAlpha > 0.01 || Math.abs(visualGap) > 0.2) {
        if (!isAnimating) {
          isAnimating = true;
          setIsFloatingActive(true);
          rafId = window.requestAnimationFrame(tick);
        }
      }
    };

    handleScrollOrResize();
    window.addEventListener('scroll', handleScrollOrResize, { passive: true });
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize);
      window.removeEventListener('resize', handleScrollOrResize);
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, []);

  const renderPrideAndAccountBar = () => (
    <div className="flex flex-wrap items-center gap-2 text-xs text-stone-600">
      <span>Celebrated with endless sibling pride</span>
      <span aria-hidden="true">·</span>
      <span>Always {nickname || 'Best Big Sis'}</span>
      {(onSwitchAccount || onSignOut) && (
        <>
          <span aria-hidden="true">·</span>
          {onSwitchAccount && (
            <button
              onClick={onSwitchAccount}
              className="text-stone-800 hover:text-stone-950 font-medium underline underline-offset-2 transition-colors cursor-pointer"
            >
              Switch Account
            </button>
          )}
          {onSignOut && (
            <>
              <span aria-hidden="true">/</span>
              <button
                onClick={onSignOut}
                className="text-rose-700 hover:text-rose-900 font-medium underline underline-offset-2 transition-colors cursor-pointer"
              >
                Log Out
              </button>
            </>
          )}
        </>
      )}
    </div>
  );

  return (
    <section id="celebration" className="pt-8 pb-16 border-b border-stone-200/80">
      {/* Smooth Floating Pill that glides directly into and out of its exact original space */}
      <div
        ref={floatingBarRef}
        className={`fixed top-0 left-0 z-40 rounded-full border border-transparent will-change-transform ${
          isFloatingActive ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {renderPrideAndAccountBar()}
      </div>

      <div className="max-w-6xl mx-auto px-6">
        {/* Split-Screen Hero Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Column: Typographic Hierarchy */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            {/* Clean unboxed kicker with dot separator */}
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-800 uppercase tracking-widest mb-4">
              <span>{heroKicker || 'A Special Day'}</span>
              <span aria-hidden="true">·</span>
              <span>{formatBirthday(birthdayDate)} Celebration</span>
            </div>

            {/* Interactive 3D Volumetric Extruded Headline ("Happy Birthday, Atrayee") */}
            <div
              onMouseMove={handleTitleMouseMove}
              onMouseLeave={handleTitleMouseLeave}
              className="hero-3d-stage py-3 cursor-grab active:cursor-grabbing select-none"
              title="Move cursor to tilt 3D text"
            >
              <div
                style={{
                  transform: `rotateX(${titleTilt.rx}deg) rotateY(${titleTilt.ry}deg)`,
                  transformStyle: 'preserve-3d',
                  transition: 'transform 0.16s cubic-bezier(0.22, 1, 0.36, 1)',
                }}
                className="relative inline-block preserve-3d"
              >
                {/* 3D Extruded Depth Layers along the Z-axis */}
                {[1, 2, 3, 4, 5, 6, 7, 8].map((layer) => (
                  <div
                    key={layer}
                    aria-hidden="true"
                    style={{
                      transform: `translateZ(${-layer * 2.2}px) translateY(${layer * 0.6}px)`,
                    }}
                    className="absolute inset-0 text-4xl sm:text-5xl lg:text-6xl font-serif font-bold tracking-tight leading-[1.16] text-balance pointer-events-none select-none"
                  >
                    <span
                      style={{
                        color: layer > 5 ? 'var(--theme-h-shadow-5)' : 'var(--theme-h-shadow-3)',
                      }}
                    >
                      Happy Birthday,
                    </span>{' '}
                    <span
                      className="italic font-bold"
                      style={{
                        color: layer > 5 ? 'var(--theme-atrayee-s6)' : 'var(--theme-atrayee-s3)',
                      }}
                    >
                      {girlfriendName || 'Atrayee'}
                    </span>
                  </div>
                ))}

                {/* Front Lit 3D Face */}
                <h1
                  style={{
                    transform: 'translateZ(4px)',
                  }}
                  className="relative text-4xl sm:text-5xl lg:text-6xl font-serif font-bold tracking-tight leading-[1.16] text-balance"
                >
                  <span className="text-3d-birthday">Happy Birthday,</span>{' '}
                  <span className="italic font-bold text-3d-atrayee">
                    {girlfriendName || 'Atrayee'}
                  </span>
                </h1>
              </div>
            </div>

            {/* Lead Prose */}
            <p className="mt-6 text-base sm:text-lg text-stone-600 leading-relaxed font-sans max-w-xl">
              {heroMessage}
            </p>

            {/* 3D Extruded Action buttons */}
            <div className="mt-8 flex flex-wrap items-center gap-3.5">
              <button
                type="button"
                onClick={() => triggerGlobalFireworksShow()}
                className="px-6 py-3 text-sm font-semibold text-white bg-rose-700 rounded-lg hover:bg-rose-600 transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer btn-3d-rose"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Celebrate</span>
              </button>

              <a
                href="#arcade"
                className="px-6 py-3 text-sm font-medium text-white bg-stone-900 rounded-lg hover:bg-stone-800 transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0 btn-3d-dark"
              >
                <Gamepad2 className="w-4 h-4 text-rose-400" />
                <span>Play 3D Birthday Arcade</span>
              </a>

              <a
                href="#letters"
                className="px-5 py-3 text-sm font-medium text-stone-800 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0 tile-3d-extruded"
              >
                <Heart className="w-4 h-4 text-rose-600" />
                <span>Open Sister Letters</span>
              </a>

              {onToggleMusic && (
                <button
                  onClick={onToggleMusic}
                  className="px-4 py-3 text-sm font-medium text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer tile-3d-extruded"
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

            {/* Original Position Anchor for "Celebrated with endless sibling pride · Always Best Big Sis · Switch Account / Log Out" */}
            <div ref={prideBarAnchorRef} className="mt-6 min-h-[24px]">
              <div className={isFloatingActive ? 'invisible pointer-events-none' : ''}>
                {renderPrideAndAccountBar()}
              </div>
            </div>
          </div>

          {/* Right Column: Interactive 3D Birthday Cake */}
          <div className="lg:col-span-5 flex justify-center">
            <BirthdayCake
              girlfriendName={girlfriendName}
              nickname={nickname}
              secretWishMessage={secretWishMessage}
            />
          </div>
        </div>

        {/* 4-Column 3D Sisterhood Milestones Strip */}
        <div className="mt-14 pt-8 border-t border-stone-200/80 grid grid-cols-2 md:grid-cols-4 gap-6 perspective-1200">
          <div className="p-4 rounded-xl bg-white border border-stone-200/70 card-3d-tilt">
            <span className="text-xs text-stone-500 font-medium">{girlfriendName}'s Special Day</span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-serif font-bold text-stone-900 tabular-nums heading-3d">
                {formatBirthday(birthdayDate)}
              </span>
              <span className="text-xs text-rose-600 font-medium">28th May</span>
            </div>
            <p className="text-[11px] text-stone-400 mt-0.5">The day the best big sister was born</p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-stone-200/70 card-3d-tilt">
            <span className="text-xs text-stone-500 font-medium">Built-In Best Friend</span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-serif font-bold text-stone-900 tabular-nums heading-3d">
                Lifetime
              </span>
              <span className="text-xs text-rose-600 font-medium">bond</span>
            </div>
            <p className="text-[11px] text-stone-400 mt-0.5">Protector, guide & partner in crime</p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-stone-200/70 card-3d-tilt">
            <span className="text-xs text-stone-500 font-medium">Inside Jokes & Late Talks</span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-serif font-bold text-stone-900 tabular-nums heading-3d">
                1,000+
              </span>
              <span className="text-xs text-stone-500 font-medium">shared</span>
            </div>
            <p className="text-[11px] text-stone-400 mt-0.5">From childhood secrets to midnight snacks</p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-stone-200/70 card-3d-tilt">
            <span className="text-xs text-stone-500 font-medium">Big Sister Rating</span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-serif font-bold text-stone-900 tabular-nums heading-3d">
                100%
              </span>
              <span className="text-xs text-rose-600 font-medium">iconic</span>
            </div>
            <p className="text-[11px] text-stone-400 mt-0.5">Couldn't ask for a cooler older sister</p>
          </div>
        </div>
      </div>
    </section>
  );
};
