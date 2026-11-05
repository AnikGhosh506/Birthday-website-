import React, { useState, useEffect, useRef } from 'react';
import {
  Shuffle,
  Sparkles,
  MapPin,
  Calendar,
  Camera,
  Heart,
  Maximize2,
  X,
} from 'lucide-react';
import { Memory } from '../types';
import { romanticAudio } from '../utils/audioSynth';

interface BirthdayCollageSectionProps {
  memories: Memory[];
  girlfriendName: string;
  boyfriendName: string;
  onUpdateMemoryImage?: (id: string, dataUrl: string) => void;
}

const FALLBACK_ART_GRADIENTS = [
  'linear-gradient(135deg, #fde68a 0%, #fca5a5 50%, #f43f5e 100%)',
  'linear-gradient(135deg, #fbcfe8 0%, #f9a8d4 45%, #e11d48 100%)',
  'linear-gradient(135deg, #fed7aa 0%, #fdba74 50%, #ea580c 100%)',
  'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 50%, #6366f1 100%)',
  'linear-gradient(135deg, #d1fae5 0%, #fde68a 55%, #f59e0b 100%)',
];

function selectFiveRandomMemories(allMemories: Memory[]): Memory[] {
  if (!Array.isArray(allMemories) || allMemories.length === 0) return [];

  // Prioritize memories that have uploaded photos, while shuffling randomly
  const withPhotos = [...allMemories.filter((m) => Boolean(m.imageUrl))].sort(
    () => Math.random() - 0.5
  );
  const withoutPhotos = [...allMemories.filter((m) => !m.imageUrl)].sort(
    () => Math.random() - 0.5
  );

  const combined = [...withPhotos, ...withoutPhotos];
  return combined.slice(0, 5);
}

export const BirthdayCollageSection: React.FC<BirthdayCollageSectionProps> = ({
  memories,
  girlfriendName,
  boyfriendName,
  onUpdateMemoryImage,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    selectFiveRandomMemories(memories).map((m) => m.id)
  );
  const [isShuffling, setIsShuffling] = useState(false);
  const [spotlightMemoryId, setSpotlightMemoryId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingForId, setUploadingForId] = useState<string | null>(null);

  // Keep selectedIds valid if memories list changes, and ensure 5 items are selected
  useEffect(() => {
    setSelectedIds((prev) => {
      const validIds = prev.filter((id) => memories.some((m) => m.id === id));
      if (validIds.length === 5) return validIds;
      return selectFiveRandomMemories(memories).map((m) => m.id);
    });
  }, [memories]);

  const fiveMosaicMemories: Memory[] = selectedIds
    .map((id) => memories.find((m) => m.id === id))
    .filter((m): m is Memory => Boolean(m));

  const handleShuffleMosaic = () => {
    romanticAudio.playCelebrationChime();
    setIsShuffling(true);
    window.setTimeout(() => {
      const shuffled = [...memories].sort(() => Math.random() - 0.5);
      // Still prefer keeping uploaded photos visible while randomizing order & selection
      const withPhotos = shuffled.filter((m) => Boolean(m.imageUrl));
      const withoutPhotos = shuffled.filter((m) => !m.imageUrl);
      const nextFive = [...withPhotos, ...withoutPhotos]
        .slice(0, 5)
        .sort(() => Math.random() - 0.5);
      setSelectedIds(nextFive.map((m) => m.id));
      setIsShuffling(false);
    }, 220);
  };

  const handleTriggerPhotoUpload = (memId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setUploadingForId(memId);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingForId || !onUpdateMemoryImage) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 1100;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const compressed = canvas.toDataURL('image/jpeg', 0.84);
          onUpdateMemoryImage(uploadingForId, compressed);
          romanticAudio.playSoftClick();
        }
      };
      img.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const spotlightMemory = spotlightMemoryId
    ? memories.find((m) => m.id === spotlightMemoryId) || null
    : null;

  const tileRotations = [
    '-rotate-1',
    'rotate-2',
    '-rotate-2',
    'rotate-1',
    '-rotate-1',
  ];

  return (
    <section
      id="birthday-collage"
      className="py-20 border-b border-stone-200/80 bg-stone-50/50 overflow-hidden"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="max-w-6xl mx-auto px-6">
        {/* Section Header + Shuffle Button */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-rose-800 uppercase tracking-widest mb-2">
              <Sparkles className="w-3.5 h-3.5 text-rose-600" />
              <span>Chapter 10 · 3D Scrapbook Mosaic</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-stone-900 heading-3d">
              {girlfriendName || 'Atrayee'}'s 3D Birthday Collage
            </h2>
            <p className="mt-2 text-sm sm:text-base text-stone-600 max-w-xl leading-relaxed">
              Five randomly curated snapshots from our Memory Lane scrapbook arranged
              in an interactive 3D spatial mosaic. Hover to tilt in 3D or shuffle for
              a fresh combination!
            </p>
          </div>

          <button
            type="button"
            onClick={handleShuffleMosaic}
            className="self-start md:self-auto inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-semibold text-white bg-stone-900 hover:bg-stone-800 transition-all cursor-pointer shrink-0 btn-3d-dark"
          >
            <Shuffle
              className={`w-4 h-4 text-amber-300 transition-transform duration-300 ${
                isShuffling ? 'rotate-180 scale-110' : ''
              }`}
            />
            <span>Shuffle 5 Random Memories</span>
          </button>
        </div>

        {/* Dynamic 5-Photo 3D Mosaic Grid */}
        <div
          className={`grid grid-cols-1 md:grid-cols-12 gap-6 perspective-1200 transition-all duration-300 ${
            isShuffling ? 'opacity-40 scale-98' : 'opacity-100 scale-100'
          }`}
        >
          {fiveMosaicMemories.map((mem, idx) => {
            const isHeroTile = idx === 0;
            const spanClasses = isHeroTile
              ? 'md:col-span-6 md:row-span-2'
              : 'md:col-span-3';
            const fallbackGrad =
              FALLBACK_ART_GRADIENTS[idx % FALLBACK_ART_GRADIENTS.length];

            return (
              <div
                key={mem.id}
                onClick={() => {
                  romanticAudio.playSoftClick();
                  setSpotlightMemoryId(mem.id);
                }}
                className={`${spanClasses} ${tileRotations[idx]} group relative rounded-2xl bg-white p-3.5 sm:p-4 border border-stone-200/90 cursor-pointer flex flex-col justify-between paper-texture card-3d-tilt`}
              >
                {/* Decorative Translucent Golden Washi Tape on Top Center */}
                <div
                  aria-hidden="true"
                  className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-20 h-5 bg-amber-200/75 border border-amber-300/60 rotate-[-2deg] shadow-2xs pointer-events-none z-10"
                />

                {/* Photo / Visual Frame */}
                <div
                  className={`relative w-full overflow-hidden rounded-xl border border-stone-200/80 bg-stone-100 ${
                    isHeroTile ? 'h-72 sm:h-96' : 'h-44 sm:h-48'
                  }`}
                >
                  {mem.imageUrl ? (
                    <img
                      src={mem.imageUrl}
                      alt={mem.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div
                      style={{ background: fallbackGrad }}
                      className="w-full h-full p-5 flex flex-col items-center justify-center text-center relative overflow-hidden"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-white/85 backdrop-blur-xs flex items-center justify-center shadow-sm mb-3">
                        <Heart className="w-6 h-6 text-rose-600 fill-rose-500" />
                      </div>
                      <span className="text-[11px] font-bold uppercase tracking-widest text-stone-900/75">
                        {mem.tag} · {mem.date}
                      </span>
                      <p className="mt-1 font-serif font-bold text-base sm:text-lg text-stone-900 line-clamp-2">
                        {mem.title}
                      </p>
                      {onUpdateMemoryImage && (
                        <button
                          type="button"
                          onClick={(e) => handleTriggerPhotoUpload(mem.id, e)}
                          className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-stone-900/90 text-white hover:bg-stone-900 transition-colors shadow-sm cursor-pointer"
                        >
                          <Camera className="w-3 h-3 text-amber-300" />
                          <span>Add Scrapbook Photo</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Top-left Mosaic Number Badge */}
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-stone-950/75 backdrop-blur-xs text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <span>#{idx + 1}</span>
                    <span>·</span>
                    <span>{mem.tag}</span>
                  </div>

                  {/* Top-right Expand & Photo Swap Actions */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                    {onUpdateMemoryImage && mem.imageUrl && (
                      <button
                        type="button"
                        onClick={(e) => handleTriggerPhotoUpload(mem.id, e)}
                        title="Change photo for this memory"
                        className="p-1.5 rounded-lg bg-white/90 text-stone-800 hover:bg-white shadow-sm cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <span className="p-1.5 rounded-lg bg-white/90 text-stone-800 shadow-sm">
                      <Maximize2 className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>

                {/* Polaroid Caption Strip */}
                <div className="pt-3.5 px-1">
                  <div className="flex items-center justify-between text-[11px] text-stone-500 font-medium mb-1">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-rose-600" />
                      {mem.date}
                    </span>
                    <span className="inline-flex items-center gap-1 truncate max-w-[130px]">
                      <MapPin className="w-3 h-3 text-amber-600 shrink-0" />
                      <span className="truncate">{mem.location}</span>
                    </span>
                  </div>

                  <h3
                    className={`font-serif font-bold text-stone-900 leading-snug ${
                      isHeroTile ? 'text-xl sm:text-2xl' : 'text-sm sm:text-base'
                    }`}
                  >
                    {mem.title}
                  </h3>

                  <p
                    className={`mt-1 text-stone-600 font-anik-handwriting leading-snug ${
                      isHeroTile
                        ? 'text-lg sm:text-xl line-clamp-3'
                        : 'text-base line-clamp-2'
                    }`}
                  >
                    "{mem.caption}"
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Subtle Handwritten Caption under the 3D Mosaic */}
        <div className="mt-8 text-center">
          <p className="text-lg sm:text-xl font-anik-handwriting text-stone-600">
            "Every single snapshot with you is a treasure, {girlfriendName || 'Didi'}{' '}
            — here's to making a thousand more memories together!" —{' '}
            <span className="font-semibold text-stone-800">
              {boyfriendName || 'Anik'}
            </span>
          </p>
        </div>
      </div>

      {/* 3D Spotlight Lightbox Modal when clicking any mosaic photo */}
      {spotlightMemory && (
        <div
          className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSpotlightMemoryId(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg rounded-3xl bg-white border border-stone-200 shadow-2xl p-5 sm:p-7 paper-texture"
          >
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-rose-700">
                  {spotlightMemory.tag} · {spotlightMemory.date}
                </span>
                <h3 className="text-xl font-serif font-bold text-stone-900">
                  {spotlightMemory.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSpotlightMemoryId(null)}
                className="p-2 rounded-xl bg-stone-100 text-stone-600 hover:text-stone-900 hover:bg-stone-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {spotlightMemory.imageUrl && (
              <div className="rounded-2xl overflow-hidden border border-stone-200 bg-stone-100 max-h-80 mb-4">
                <img
                  src={spotlightMemory.imageUrl}
                  alt={spotlightMemory.title}
                  className="w-full max-h-80 object-cover"
                />
              </div>
            )}

            <p className="text-xl font-anik-handwriting text-stone-800 leading-relaxed">
              "{spotlightMemory.caption}"
            </p>

            <div className="mt-4 pt-3 border-t border-stone-200/80 flex items-center justify-between text-xs text-stone-500">
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-600" />
                {spotlightMemory.location}
              </span>
              {onUpdateMemoryImage && (
                <button
                  type="button"
                  onClick={(e) => handleTriggerPhotoUpload(spotlightMemory.id, e)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-white bg-stone-900 hover:bg-stone-800 transition-colors cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5 text-amber-300" />
                  <span>
                    {spotlightMemory.imageUrl ? 'Replace Photo' : 'Upload Photo'}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
