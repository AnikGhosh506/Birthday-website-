import React from 'react';
import { Sparkles } from 'lucide-react';

interface NavbarProps {
  brandName: string;
  isMusicPlaying: boolean;
  onToggleMusic: () => void;
  onOpenPersonalize: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  brandName,
  onOpenPersonalize,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-stone-50/95 backdrop-blur-md border-b border-stone-200/80 transition-all">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: 3D Brand Wordmark */}
        <a
          href="#"
          className="text-xl md:text-2xl font-serif font-bold tracking-tight text-stone-900 hover:text-stone-700 transition-colors whitespace-nowrap shrink-0 heading-3d"
        >
          {brandName ? `Happy Birthday · ${brandName}` : 'Birthday Keepsake'}
        </a>

        {/* Zone 2: 5 concise single-line nav links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-stone-600">
          <a
            href="#celebration"
            className="hover:text-stone-950 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Celebration
          </a>
          <a
            href="#arcade"
            className="hover:text-stone-950 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Game Arcade
          </a>
          <a
            href="#memories"
            className="hover:text-stone-950 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Memories
          </a>
          <a
            href="#letters"
            className="hover:text-stone-950 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Birthday Notes
          </a>
          <a
            href="#vouchers"
            className="hover:text-stone-950 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Vouchers
          </a>
        </nav>

        {/* Zone 3: 1 primary 3D action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenPersonalize}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs md:text-sm font-medium text-white bg-stone-900 rounded-lg hover:bg-stone-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer btn-3d-dark"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Personalize Gift</span>
          </button>
        </div>
      </div>
    </header>
  );
};

