import React, { useState } from 'react';
import { Memory } from '../types';
import {
  Sprout,
  Flower2,
  Droplets,
  Sparkles,
  RotateCcw,
  Heart,
  Calendar,
  MapPin,
  Camera,
  X,
} from 'lucide-react';
import { romanticAudio } from '../utils/audioSynth';
import { triggerConfettiExplosion } from '../utils/confettiExplosion';
import { compressImageFile } from '../utils/persistentStorage';

interface MemoryGardenSectionProps {
  memories: Memory[];
  girlfriendName: string;
  boyfriendName: string;
  onUpdateMemoryImage: (id: string, dataUrl: string) => void;
}

type FlowerGrowthState = 'seed' | 'sprouting' | 'bloomed';

interface FlowerPalette {
  name: string;
  petalBg: string;
  petalBorder: string;
  centerGlow: string;
  potAccent: string;
}

const FLOWER_PALETTES: FlowerPalette[] = [
  {
    name: 'Himalayan Rose Lotus',
    petalBg: 'from-rose-400 via-pink-300 to-rose-200',
    petalBorder: 'border-rose-300',
    centerGlow: 'ring-amber-300/80',
    potAccent: 'from-amber-700 to-amber-900',
  },
  {
    name: 'Golden Marigold Bloom',
    petalBg: 'from-amber-400 via-yellow-300 to-orange-200',
    petalBorder: 'border-amber-300',
    centerGlow: 'ring-rose-300/80',
    potAccent: 'from-rose-800 to-stone-900',
  },
  {
    name: 'Lavender Starlight',
    petalBg: 'from-purple-400 via-fuchsia-300 to-pink-200',
    petalBorder: 'border-purple-300',
    centerGlow: 'ring-amber-200/80',
    potAccent: 'from-stone-700 to-stone-900',
  },
  {
    name: 'Coral Hibiscus',
    petalBg: 'from-orange-400 via-rose-400 to-amber-200',
    petalBorder: 'border-orange-300',
    centerGlow: 'ring-yellow-300/80',
    potAccent: 'from-amber-800 to-stone-900',
  },
  {
    name: 'Blush Jasmine',
    petalBg: 'from-pink-300 via-rose-200 to-amber-100',
    petalBorder: 'border-pink-300',
    centerGlow: 'ring-rose-400/70',
    potAccent: 'from-rose-900 to-stone-950',
  },
];

const GARDEN_STORAGE_KEY = 'atrayee_memory_garden_bloomed_v1';

export const MemoryGardenSection: React.FC<MemoryGardenSectionProps> = ({
  memories,
  girlfriendName,
  boyfriendName,
  onUpdateMemoryImage,
}) => {
  const [growthMap, setGrowthMap] = useState<Record<string, FlowerGrowthState>>(
    () => {
      try {
        const saved = localStorage.getItem(GARDEN_STORAGE_KEY);
        if (saved) return JSON.parse(saved);
      } catch {
        // ignore storage errors
      }
      // Start with the first 2 seeds already bloomed as a welcoming example
      const initial: Record<string, FlowerGrowthState> = {};
      memories.slice(0, 2).forEach((m) => {
        initial[m.id] = 'bloomed';
      });
      return initial;
    }
  );

  const [selectedFlowerMemoryId, setSelectedFlowerMemoryId] = useState<
    string | null
  >(null);

  const saveGrowthMap = (next: Record<string, FlowerGrowthState>) => {
    setGrowthMap(next);
    try {
      localStorage.setItem(GARDEN_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore storage errors
    }
  };

  const handleSeedOrFlowerClick = (
    e: React.MouseEvent<HTMLDivElement>,
    memory: Memory
  ) => {
    const currentState = growthMap[memory.id] || 'seed';

    if (currentState === 'seed') {
      romanticAudio.playSoftClick();
      const sproutingNext: Record<string, FlowerGrowthState> = {
        ...growthMap,
        [memory.id]: 'sprouting',
      };
      setGrowthMap(sproutingNext);

      const clickCoords = { clientX: e.clientX, clientY: e.clientY };

      window.setTimeout(() => {
        romanticAudio.playCelebrationChime();
        triggerConfettiExplosion(clickCoords);
        setGrowthMap((prev) => {
          const finalMap: Record<string, FlowerGrowthState> = {
            ...prev,
            [memory.id]: 'bloomed',
          };
          try {
            localStorage.setItem(GARDEN_STORAGE_KEY, JSON.stringify(finalMap));
          } catch {
            // ignore
          }
          return finalMap;
        });
        setSelectedFlowerMemoryId(memory.id);
      }, 520);
    } else if (currentState === 'bloomed') {
      romanticAudio.playSoftClick();
      setSelectedFlowerMemoryId(memory.id);
    }
  };

  const handleBloomAllSeeds = (e: React.MouseEvent<HTMLButtonElement>) => {
    romanticAudio.playCelebrationChime();
    triggerConfettiExplosion({ clientX: e.clientX, clientY: e.clientY });
    const allBloomed: Record<string, FlowerGrowthState> = {};
    memories.forEach((m) => {
      allBloomed[m.id] = 'bloomed';
    });
    saveGrowthMap(allBloomed);
  };

  const handleResetToSeeds = () => {
    romanticAudio.playSoftClick();
    setSelectedFlowerMemoryId(null);
    saveGrowthMap({});
  };

  const handlePhotoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    memoryId: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 1400, 0.85);
      onUpdateMemoryImage(memoryId, compressed);
      romanticAudio.playCelebrationChime();
    } catch (err) {
      console.error('Failed to process garden photo:', err);
    }
    e.target.value = '';
  };

  const bloomedCount = memories.filter(
    (m) => growthMap[m.id] === 'bloomed'
  ).length;
  const selectedMemory =
    memories.find((m) => m.id === selectedFlowerMemoryId) || null;

  return (
    <section
      id="memory-garden"
      className="relative py-20 border-b border-stone-200/80 bg-stone-50/50 overflow-hidden"
    >
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 uppercase tracking-widest mb-2">
              <Sprout className="w-3.5 h-3.5 text-emerald-600" />
              <span>Living Botanical Keepsake</span>
              <span aria-hidden="true">·</span>
              <span>
                {bloomedCount} of {memories.length} Flowers in Bloom
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-stone-900 heading-3d">
              {girlfriendName}'s 3D Memory Garden
            </h2>
            <p className="mt-2 text-sm sm:text-base text-stone-600 max-w-2xl">
              Every memory photo is planted here as a golden seed. Click any seed to water it and watch it grow into a 3D animated flower blossoming with our favorite moments.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleBloomAllSeeds}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer btn-3d-dark"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Water & Bloom All ({memories.length})</span>
            </button>

            {bloomedCount > 0 && (
              <button
                type="button"
                onClick={handleResetToSeeds}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 text-xs font-semibold cursor-pointer transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
                <span>Replant as Seeds</span>
              </button>
            )}
          </div>
        </div>

        {/* 3D Living Garden Terrarium Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5 sm:gap-6 perspective-1200">
          {memories.map((memory, idx) => {
            const state: FlowerGrowthState = growthMap[memory.id] || 'seed';
            const palette = FLOWER_PALETTES[idx % FLOWER_PALETTES.length];
            const isSelected = selectedFlowerMemoryId === memory.id;

            return (
              <div
                key={memory.id}
                onClick={(e) => handleSeedOrFlowerClick(e, memory)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSeedOrFlowerClick(
                      e as unknown as React.MouseEvent<HTMLDivElement>,
                      memory
                    );
                  }
                }}
                aria-label={`${memory.title} — ${
                  state === 'seed'
                    ? 'Memory seed, click to grow into a 3D flower'
                    : 'Bloomed 3D memory flower, click to view memory'
                }`}
                className={`group relative h-[285px] rounded-2xl border p-4 flex flex-col items-center justify-between cursor-pointer select-none card-3d-tilt overflow-hidden transition-all ${
                  state === 'bloomed'
                    ? 'bg-gradient-to-b from-amber-50/80 via-white to-emerald-50/70 border-emerald-300/90'
                    : 'bg-gradient-to-b from-stone-50 via-white to-amber-50/60 border-stone-200/90'
                } ${isSelected ? 'ring-2 ring-rose-500' : ''}`}
              >
                {/* Top Plot Label */}
                <div className="w-full flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-stone-500 z-10">
                  <span>Plot #{idx + 1}</span>
                  <span
                    className={
                      state === 'bloomed'
                        ? 'text-emerald-700 font-bold'
                        : 'text-amber-700'
                    }
                  >
                    {state === 'seed'
                      ? '🌱 Seed'
                      : state === 'sprouting'
                        ? '💧 Growing...'
                        : '🌸 In Bloom'}
                  </span>
                </div>

                {/* Center 3D Botanical Stage */}
                <div className="relative flex-1 w-full flex flex-col items-center justify-end pb-2 perspective-1000">
                  {/* Falling Water Droplets during sprouting */}
                  {state === 'sprouting' && (
                    <div className="absolute top-2 inset-x-0 flex justify-center gap-2 text-sky-500 animate-bounce">
                      <Droplets className="w-5 h-5" />
                      <Sparkles className="w-4 h-4 text-amber-400" />
                    </div>
                  )}

                  {/* ================= STAGE 1: 3D MEMORY SEED ================= */}
                  {state === 'seed' && (
                    <div className="flex flex-col items-center mb-3 group-hover:-translate-y-1.5 transition-transform duration-300">
                      <div
                        style={{
                          transform:
                            'perspective(600px) rotateX(14deg) rotateZ(-8deg)',
                        }}
                        className="relative w-16 h-20 rounded-full bg-gradient-to-br from-amber-300 via-amber-600 to-amber-900 border-2 border-amber-200 shadow-lg flex items-center justify-center overflow-hidden"
                      >
                        {memory.imageUrl ? (
                          <img
                            src={memory.imageUrl}
                            alt={memory.title}
                            referrerPolicy="no-referrer"
                            className="w-11 h-11 rounded-full object-cover border border-amber-100 opacity-90"
                          />
                        ) : (
                          <Sprout className="w-7 h-7 text-amber-100" />
                        )}
                      </div>
                      <span className="mt-2 px-2.5 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-[10px] font-bold text-amber-900 shadow-2xs">
                        Tap Seed to Grow
                      </span>
                    </div>
                  )}

                  {/* ================= STAGE 2 & 3: SPROUTING & 3D BLOOMED FLOWER ================= */}
                  {(state === 'sprouting' || state === 'bloomed') && (
                    <div className="relative flex flex-col items-center animate-float">
                      {/* 3D Animated Flower Head */}
                      <div
                        style={{
                          transform:
                            state === 'bloomed'
                              ? 'perspective(800px) rotateX(14deg) scale(1)'
                              : 'perspective(800px) rotateX(35deg) scale(0.45)',
                          transformStyle: 'preserve-3d',
                          transition:
                            'transform 0.55s cubic-bezier(0.22, 1, 0.36, 1)',
                        }}
                        className="relative w-28 h-28 flex items-center justify-center z-20"
                      >
                        {/* 8 Layered 3D Petals */}
                        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
                          <div
                            key={deg}
                            style={{
                              transform: `rotate(${deg}deg) translateY(-28px) rotateX(18deg)`,
                            }}
                            className={`absolute w-8 h-11 rounded-full bg-gradient-to-t ${palette.petalBg} border ${palette.petalBorder} shadow-sm`}
                          />
                        ))}

                        {/* Flower Center Framing the Memory Photo */}
                        <div
                          style={{ transform: 'translateZ(10px)' }}
                          className={`relative w-16 h-16 rounded-full bg-white ring-4 ${palette.centerGlow} shadow-lg overflow-hidden flex items-center justify-center`}
                        >
                          {memory.imageUrl ? (
                            <img
                              src={memory.imageUrl}
                              alt={memory.title}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-rose-100 to-amber-100 flex flex-col items-center justify-center p-1 text-center">
                              <Flower2 className="w-5 h-5 text-rose-600" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 3D Green Stem & Twin Leaves */}
                      <div className="relative w-2 h-11 bg-gradient-to-b from-emerald-500 to-emerald-700 rounded-full -mt-2 z-10">
                        <div className="absolute -left-4 top-3 w-5 h-3 rounded-full bg-emerald-500 border border-emerald-400 -rotate-25 shadow-2xs" />
                        <div className="absolute -right-4 top-5 w-5 h-3 rounded-full bg-emerald-600 border border-emerald-400 rotate-25 shadow-2xs" />
                      </div>
                    </div>
                  )}

                  {/* 3D Terracotta Planter Pot & Soil Mound */}
                  <div className="w-24 flex flex-col items-center z-10">
                    <div className="w-24 h-3.5 rounded-full bg-stone-800 border border-stone-700 shadow-inner" />
                    <div
                      className={`w-20 h-7 rounded-b-xl bg-gradient-to-b ${palette.potAccent} border-x border-b border-amber-950/40 shadow-md flex items-center justify-center`}
                    >
                      <span className="text-[9px] font-mono text-amber-100/90 truncate px-1.5">
                        {memory.date}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Memory Title */}
                <div className="w-full text-center pt-1.5 border-t border-stone-200/70 z-10">
                  <h4 className="font-serif text-xs font-bold text-stone-900 truncate">
                    {memory.title}
                  </h4>
                  <p className="text-[10px] text-stone-500 truncate">
                    {memory.location}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Bloomed Flower Memory Card Drawer */}
        {selectedMemory && (
          <div className="mt-10 rounded-3xl bg-white border-2 border-emerald-300/90 p-6 sm:p-8 shadow-xl paper-texture card-3d-tilt animate-in fade-in duration-200">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                {/* Circular Blossom Photo Frame */}
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full ring-4 ring-rose-300 shadow-lg overflow-hidden bg-stone-100 shrink-0 flex items-center justify-center">
                  {selectedMemory.imageUrl ? (
                    <img
                      src={selectedMemory.imageUrl}
                      alt={selectedMemory.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Flower2 className="w-10 h-10 text-rose-500" />
                  )}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                    <Flower2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Bloomed Memory Flower</span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1 text-stone-600">
                      <Calendar className="w-3 h-3 text-rose-600" />
                      {selectedMemory.date}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1 text-stone-600">
                      <MapPin className="w-3 h-3 text-stone-400" />
                      {selectedMemory.location}
                    </span>
                  </div>

                  <h3 className="font-serif text-2xl font-bold text-stone-900 mt-1">
                    {selectedMemory.title}
                  </h3>

                  <p className="mt-2 text-2xl text-[#1e3a8a] font-anik-handwriting leading-relaxed max-w-2xl">
                    {selectedMemory.caption}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 self-end md:self-center shrink-0">
                <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 text-xs font-semibold cursor-pointer shadow-2xs transition-colors">
                  <Camera className="w-3.5 h-3.5 text-rose-600" />
                  <span>
                    {selectedMemory.imageUrl
                      ? 'Change Flower Photo'
                      : 'Add Flower Photo'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handlePhotoUpload(e, selectedMemory.id)}
                  />
                </label>

                <button
                  type="button"
                  onClick={() => setSelectedFlowerMemoryId(null)}
                  aria-label="Close flower details"
                  className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-stone-200/70 flex items-center justify-between text-xs text-stone-500">
              <span className="inline-flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                <span>
                  Planted in {girlfriendName}'s Memory Garden by {boyfriendName}
                </span>
              </span>
              <span>Click any other seed or flower above to explore</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
