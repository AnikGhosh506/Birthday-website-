import React from 'react';
import { Heart, Printer, ArrowUp } from 'lucide-react';
import { romanticAudio } from '../utils/audioSynth';

interface FooterProps {
  girlfriendName: string;
  boyfriendName: string;
  onOpenPersonalize: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  girlfriendName,
  boyfriendName,
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
    <footer className="py-14 bg-stone-100 border-t border-stone-200/90 text-stone-600">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-stone-200">
          <div>
            <span className="font-serif text-lg font-bold text-stone-900 block">
              Amore · Made for {girlfriendName || 'My Love'}
            </span>
            <p className="text-xs text-stone-500 font-sans mt-1">
              An eternal keepsake celebrating the kindest, brightest heart in the world.
            </p>
          </div>

          <div className="flex items-center gap-3">
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
          <div className="flex items-center gap-1.5">
            <span>Crafted with devotion by</span>
            <span className="font-semibold text-stone-700">{boyfriendName || 'Julian'}</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>for</span>
            <span className="font-semibold text-stone-700">{girlfriendName || 'Maya'}</span>
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
