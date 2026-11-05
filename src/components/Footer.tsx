import React from 'react';
import { Heart, Printer, ArrowUp, LogOut, RefreshCw, ShieldCheck } from 'lucide-react';
import { romanticAudio } from '../utils/audioSynth';

interface FooterProps {
  girlfriendName: string;
  boyfriendName: string;
  userEmail?: string;
  onSignOut?: () => void;
  onSwitchAccount?: () => void;
  onOpenPersonalize: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  girlfriendName,
  boyfriendName,
  onSignOut,
  onSwitchAccount,
  onOpenPersonalize,
}) => {
  const handlePrint = () => {
    romanticAudio.playSoftClick();
    window.print();
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    romanticAudio.playSoftClick();
  };

  return (
    <footer id="account" className="py-16 bg-stone-100 border-t border-stone-200/90 text-stone-600">
      <div className="max-w-6xl mx-auto px-6">
        {/* Dedicated 3D Logout & Switch Account Section */}
        {(onSignOut || onSwitchAccount) && (
          <div className="mb-12 p-6 sm:p-8 rounded-2xl bg-white border border-stone-200/90 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6 card-3d-tilt">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-stone-900 text-rose-300 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-rose-800 mb-1">
                  <span>Account & Session Control</span>
                  <span aria-hidden="true">·</span>
                  <span>Private Access Active</span>
                </div>
                <h3 className="font-serif text-xl font-bold text-stone-900 heading-3d">
                  Switch Account or Log Out
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-xl">
                  You are currently viewing {girlfriendName || 'Atrayee'}'s private birthday keepsake. You can switch to another Google email account or log out of this session anytime.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto shrink-0">
              {onSwitchAccount && (
                <button
                  onClick={onSwitchAccount}
                  className="px-4 py-2.5 text-xs sm:text-sm font-medium text-stone-800 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded-xl transition-colors inline-flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap tile-3d-extruded"
                >
                  <RefreshCw className="w-4 h-4 text-stone-700" />
                  <span>Switch Account</span>
                </button>
              )}

              {onSignOut && (
                <button
                  onClick={onSignOut}
                  className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-xl transition-colors inline-flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap btn-3d-dark"
                >
                  <LogOut className="w-4 h-4 text-rose-300" />
                  <span>Log Out</span>
                </button>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-stone-200">
          <div>
            <span className="font-serif text-lg font-bold text-stone-900 block heading-3d">
              Amore · Made for {girlfriendName || 'Atrayee'}
            </span>
            <p className="text-xs text-stone-500 font-sans mt-1">
              An eternal keepsake celebrating the kindest, brightest older sister in the world.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 text-xs font-medium text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
              title="Save or print as physical keepsake"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Keepsake</span>
            </button>

            <button
              onClick={scrollToTop}
              className="p-2 text-stone-500 hover:text-stone-900 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors shadow-xs cursor-pointer"
              title="Return to top"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-400 font-sans">
          <div className="flex flex-wrap items-center gap-1.5">
            <span>Crafted with sibling love by</span>
            <span className="font-semibold text-stone-700">{boyfriendName || 'Anik'}</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>for big sister</span>
            <span className="font-semibold text-stone-700">{girlfriendName || 'Atrayee'}</span>
          </div>

          <button
            onClick={onOpenPersonalize}
            className="text-stone-500 hover:text-stone-900 transition-colors underline cursor-pointer"
          >
            Edit Names & Photos
          </button>
        </div>
      </div>
    </footer>
  );
};


