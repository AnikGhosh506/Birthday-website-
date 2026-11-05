import React, { useState } from 'react';
import { LoveCoupon } from '../types';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Coffee,
  Heart,
  Film,
  Compass,
  CheckCircle2,
  RotateCcw,
  ShieldCheck,
  Gift
} from 'lucide-react';
import { romanticAudio } from '../utils/audioSynth';

interface VouchersSectionProps {
  coupons: LoveCoupon[];
  girlfriendName: string;
  onUpdateCoupons: (updated: LoveCoupon[]) => void;
}

export const VouchersSection: React.FC<VouchersSectionProps> = ({
  coupons,
  girlfriendName,
  onUpdateCoupons,
}) => {
  const [redeemingId, setRedeemingId] = useState<string | null>(null);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'coffee':
        return <Coffee className="w-5 h-5 text-amber-600" />;
      case 'sparkles':
        return <Sparkles className="w-5 h-5 text-rose-600" />;
      case 'film':
        return <Film className="w-5 h-5 text-purple-600" />;
      case 'compass':
        return <Compass className="w-5 h-5 text-emerald-600" />;
      case 'shield-check':
        return <ShieldCheck className="w-5 h-5 text-blue-600" />;
      default:
        return <Heart className="w-5 h-5 text-rose-600" />;
    }
  };

  const handleRedeem = (coupon: LoveCoupon) => {
    if (coupon.isRedeemed) return;
    setRedeemingId(coupon.id);
    romanticAudio.playCelebrationChime();

    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#e11d48', '#f59e0b', '#10b981'],
    });

    const today = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const updated = coupons.map((c) =>
      c.id === coupon.id
        ? { ...c, isRedeemed: true, redeemedDate: today }
        : c
    );

    setTimeout(() => {
      onUpdateCoupons(updated);
      setRedeemingId(null);
    }, 400);
  };

  const handleResetCoupon = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    romanticAudio.playSoftClick();
    const updated = coupons.map((c) =>
      c.id === id ? { ...c, isRedeemed: false, redeemedDate: undefined } : c
    );
    onUpdateCoupons(updated);
  };

  const redeemedCount = coupons.filter((c) => c.isRedeemed).length;

  return (
    <section id="vouchers" className="py-20 border-b border-stone-200/80 bg-stone-50/40">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-800 uppercase tracking-widest mb-2">
              <span>Chapter 04</span>
              <span aria-hidden="true">·</span>
              <span>No Expiration Date</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-stone-900 heading-3d">
              Sisterhood Birthday Vouchers
            </h2>
            <p className="mt-2 text-sm sm:text-base text-stone-600 font-sans max-w-xl">
              Special big-sister perks redeemable anytime you wish—coffee runs, errands, movie nights, and sibling debate free passes!
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-stone-500 bg-white px-4 py-2 rounded-lg border border-stone-200/80 shadow-xs self-start md:self-auto">
            <span>Redeemed:</span>
            <span className="font-bold text-stone-900 tabular-nums">
              {redeemedCount} of {coupons.length}
            </span>
          </div>
        </div>

        {/* 3D Vintage Coupon Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 perspective-1200">
          {coupons.map((coupon) => (
            <div
              key={coupon.id}
              className={`relative bg-white rounded-xl border border-stone-300 shadow-xs overflow-hidden flex flex-col justify-between ${
                coupon.isRedeemed
                  ? 'opacity-80 bg-stone-100/80'
                  : 'card-3d-tilt hover:border-stone-400'
              }`}
            >
              {/* Ticket Notches Left & Right */}
              <div className="absolute top-1/2 -left-3 -translate-y-1/2 w-6 h-6 rounded-full bg-stone-50 border border-stone-300 pointer-events-none" />
              <div className="absolute top-1/2 -right-3 -translate-y-1/2 w-6 h-6 rounded-full bg-stone-50 border border-stone-300 pointer-events-none" />

              {/* Coupon Top Header */}
              <div className="p-6 pb-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center">
                    {getIcon(coupon.icon)}
                  </div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-stone-400">
                    VOUCHER #{coupon.id.slice(-4).toUpperCase()}
                  </span>
                </div>

                <h3 className="font-serif text-lg font-bold text-stone-900">
                  {coupon.title}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-stone-600 leading-relaxed font-sans">
                  {coupon.description}
                </p>
              </div>

              {/* Perforation dashed line */}
              <div className="relative border-b-2 border-dashed border-stone-200 my-1" />

              {/* Coupon Bottom Action / 3D Stamped Area */}
              <div className="p-6 pt-3 flex items-center justify-between">
                {coupon.isRedeemed ? (
                  <div className="flex items-center justify-between w-full">
                    {/* 3D Embossed Redeemed Stamp Badge */}
                    <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border-2 border-rose-700 bg-rose-50 text-rose-800 stamp-3d-redeemed">
                      <CheckCircle2 className="w-4 h-4 text-rose-700" />
                      <span className="font-mono text-xs font-bold uppercase tracking-wider">
                        REDEEMED · {coupon.redeemedDate || 'TODAY'}
                      </span>
                    </div>

                    <button
                      onClick={(e) => handleResetCoupon(coupon.id, e)}
                      title="Reset voucher to use again"
                      className="p-2 text-stone-500 hover:text-stone-900 bg-white border border-stone-300 rounded-lg cursor-pointer tile-3d-extruded"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between w-full gap-3">
                    <span className="text-xs text-stone-500 font-sans">
                      Valid for {girlfriendName}
                    </span>
                    <button
                      onClick={() => handleRedeem(coupon)}
                      disabled={redeemingId === coupon.id}
                      className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-white rounded-xl cursor-pointer inline-flex items-center gap-2 whitespace-nowrap shrink-0 btn-3d-redeem"
                    >
                      <Gift className="w-4 h-4 text-amber-200 drop-shadow-xs" />
                      <span>{redeemingId === coupon.id ? 'Redeeming...' : 'Redeem Now'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
