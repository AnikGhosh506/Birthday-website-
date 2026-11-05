import React, { useState } from 'react';
import { Memory } from '../types';
import { MapPin, Calendar, Heart, ZoomIn, X, Camera, Plus, Trash2 } from 'lucide-react';
import { romanticAudio } from '../utils/audioSynth';
import { compressImageFile } from '../utils/persistentStorage';

interface TimelineSectionProps {
  memories: Memory[];
  onUpdateMemoryImage: (id: string, dataUrl: string) => void;
  onRemoveMemoryImage: (id: string) => void;
  onAddMemory: () => void;
}

export const TimelineSection: React.FC<TimelineSectionProps> = ({
  memories,
  onUpdateMemoryImage,
  onRemoveMemoryImage,
  onAddMemory,
}) => {
  const [activeTag, setActiveTag] = useState<string>('All');
  const [selectedMemoryId, setSelectedMemoryId] = useState<string | null>(null);

  const selectedMemory = memories.find((m) => m.id === selectedMemoryId) || null;

  // Extract unique tags for filter tabs (functional buttons allowed per skill)
  const tags = ['All', ...Array.from(new Set(memories.map((m) => m.tag)))];

  const filteredMemories =
    activeTag === 'All'
      ? memories
      : memories.filter((m) => m.tag === activeTag);

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    memoryId: string
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedDataUrl = await compressImageFile(file, 1400, 0.85);
        onUpdateMemoryImage(memoryId, compressedDataUrl);
        romanticAudio.playSoftClick();
      } catch (err) {
        console.error('Failed to process image', err);
      }
      e.target.value = '';
    }
  };

  const handleRemovePhoto = (e: React.MouseEvent, memoryId: string) => {
    e.stopPropagation();
    romanticAudio.playSoftClick();
    onRemoveMemoryImage(memoryId);
  };

  // SVG Fallback for photo placeholders with warm romantic aesthetics
  const renderFallbackIllustration = (index: number, title: string) => {
    const gradients = [
      'from-rose-100 to-amber-50',
      'from-stone-100 to-rose-100',
      'from-amber-100 to-stone-100',
      'from-rose-100 to-stone-200',
      'from-orange-100 to-rose-100',
      'from-stone-100 to-amber-100',
    ];
    const grad = gradients[index % gradients.length];

    return (
      <div
        className={`w-full h-full bg-gradient-to-br ${grad} flex flex-col items-center justify-center p-6 text-center select-none relative overflow-hidden`}
      >
        {/* Subtle decorative concentric rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
          <div className="w-48 h-48 rounded-full border border-stone-800" />
          <div className="w-72 h-72 rounded-full border border-stone-800" />
        </div>

        <Heart className="w-8 h-8 text-rose-500 fill-rose-500/20 mb-3" />
        <span className="font-serif text-base font-semibold text-stone-800 tracking-wide line-clamp-2">
          {title}
        </span>
        <span className="text-[11px] font-sans text-stone-500 mt-1">
          Click camera icon to add your photo
        </span>
      </div>
    );
  };

  return (
    <section id="memories" className="py-20 border-b border-stone-200/80 bg-stone-50/50">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-800 uppercase tracking-widest mb-2">
              <span>Chapter 02</span>
              <span aria-hidden="true">·</span>
              <span>Sisterhood Scrapbook</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-stone-900 heading-3d">
              Our Favorite Sister Memories
            </h2>
            <p className="mt-2 text-sm sm:text-base text-stone-600 font-sans max-w-xl">
              From childhood adventures and borrowed outfits to late-night kitchen talks and lifelong support.
            </p>
          </div>

          {/* Interactive Filter Tabs (functional segmented controls per skill) */}
          <div className="flex items-center gap-1.5 p-1 bg-stone-200/70 rounded-lg overflow-x-auto">
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  setActiveTag(tag);
                  romanticAudio.playSoftClick();
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  activeTag === tag
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* 3-Column 3D Polaroid Memory Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 perspective-1200">
          {filteredMemories.map((memory, idx) => (
            <div
              key={memory.id}
              className="group relative bg-white p-4 rounded-xl border border-stone-200 shadow-xs card-3d-tilt flex flex-col"
            >
              {/* Polaroid Photo Frame */}
              <div className="relative aspect-4/3 w-full rounded-lg overflow-hidden bg-stone-100 border border-stone-200/60 mb-4">
                {memory.imageUrl ? (
                  <img
                    src={memory.imageUrl}
                    alt={memory.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                  />
                ) : (
                  renderFallbackIllustration(idx, memory.title)
                )}

                {/* Overlay Action Buttons */}
                <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                  {/* Photo Upload Icon */}
                  <label
                    title={memory.imageUrl ? 'Change photo' : 'Upload real photo'}
                    className="p-1.5 bg-white/90 hover:bg-white text-stone-700 rounded-md shadow-xs cursor-pointer transition-colors backdrop-blur-xs"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(e, memory.id)}
                    />
                  </label>

                  {/* Remove Photo Icon (shown whenever an image is present) */}
                  {memory.imageUrl && (
                    <button
                      type="button"
                      onClick={(e) => handleRemovePhoto(e, memory.id)}
                      title="Remove photo"
                      aria-label="Remove photo"
                      className="p-1.5 bg-white/90 hover:bg-rose-50 text-rose-600 hover:text-rose-700 rounded-md shadow-xs cursor-pointer transition-colors backdrop-blur-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Lightbox Zoom Icon */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMemoryId(memory.id);
                      romanticAudio.playSoftClick();
                    }}
                    title="View details"
                    className="p-1.5 bg-white/90 hover:bg-white text-stone-700 rounded-md shadow-xs cursor-pointer transition-colors backdrop-blur-xs"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Memory Details (Clean unboxed metadata) */}
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs text-stone-500 mb-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-stone-400" />
                      {memory.date}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                      <span className="truncate">{memory.location}</span>
                    </span>
                  </div>

                  <h3 className="font-serif text-lg font-bold text-stone-900 group-hover:text-rose-900 transition-colors">
                    {memory.title}
                  </h3>

                  <p className="mt-2 text-lg sm:text-xl text-[#1e3a8a] line-clamp-3 font-anik-handwriting leading-snug">
                    {memory.caption}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-400">
                  <span className="text-rose-700 font-medium">{memory.tag}</span>
                  <div className="flex items-center gap-3">
                    {memory.imageUrl && (
                      <button
                        type="button"
                        onClick={(e) => handleRemovePhoto(e, memory.id)}
                        className="text-rose-600 hover:text-rose-800 font-medium transition-colors cursor-pointer"
                      >
                        Remove photo
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMemoryId(memory.id);
                        romanticAudio.playSoftClick();
                      }}
                      className="text-stone-700 hover:text-stone-950 font-medium transition-colors cursor-pointer"
                    >
                      Read handwritten note →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Add a new memory card */}
          <div
            onClick={onAddMemory}
            className="border-2 border-dashed border-stone-300 hover:border-stone-400 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-stone-50/60 transition-colors min-h-[340px]"
          >
            <div className="w-12 h-12 rounded-full bg-stone-200/60 flex items-center justify-center text-stone-600 mb-3">
              <Plus className="w-5 h-5" />
            </div>
            <h4 className="font-serif text-base font-semibold text-stone-800">
              Add Another Memory
            </h4>
            <p className="text-xs text-stone-500 mt-1 max-w-[200px]">
              Add a new road trip, quiet evening, or milestone to our story.
            </p>
          </div>
        </div>

        {/* Fullscreen Lightbox / Modal */}
        {selectedMemory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="relative w-full max-w-2xl bg-white rounded-2xl border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              {/* Close Button */}
              <button
                onClick={() => setSelectedMemoryId(null)}
                aria-label="Close memory modal"
                className="absolute top-3 right-3 z-10 p-2 rounded-full bg-stone-900/60 hover:bg-stone-900 text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Photo Area */}
              <div className="relative w-full aspect-16/10 bg-stone-900 flex items-center justify-center">
                {selectedMemory.imageUrl ? (
                  <img
                    src={selectedMemory.imageUrl}
                    alt={selectedMemory.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full bg-stone-800 flex flex-col items-center justify-center text-stone-300 p-6 text-center">
                    <Heart className="w-12 h-12 text-rose-400 mb-2 fill-rose-400/30" />
                    <span className="font-serif text-xl text-white">{selectedMemory.title}</span>
                    <span className="text-xs text-stone-400 mt-2">
                      Upload your real photo below or on the card
                    </span>
                  </div>
                )}
              </div>

              {/* Memory Text & Metadata */}
              <div className="p-6 overflow-y-auto paper-texture">
                <div className="flex items-center gap-2 text-xs text-stone-500 mb-2">
                  <span>{selectedMemory.date}</span>
                  <span aria-hidden="true">·</span>
                  <span>{selectedMemory.location}</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-rose-700 font-medium">{selectedMemory.tag}</span>
                </div>

                <h3 className="font-serif text-2xl font-bold text-stone-900 mb-3">
                  {selectedMemory.title}
                </h3>

                <p className="text-2xl text-[#1e3a8a] leading-relaxed font-anik-handwriting whitespace-pre-line">
                  {selectedMemory.caption}
                </p>

                <div className="mt-6 pt-4 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <label className="px-3.5 py-2 text-xs font-medium text-stone-800 bg-white border border-stone-300 hover:bg-stone-50 rounded-lg inline-flex items-center gap-1.5 cursor-pointer transition-colors">
                      <Camera className="w-3.5 h-3.5 text-stone-600" />
                      <span>{selectedMemory.imageUrl ? 'Change Photo' : 'Upload Photo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e, selectedMemory.id)}
                      />
                    </label>

                    {selectedMemory.imageUrl && (
                      <button
                        type="button"
                        onClick={(e) => handleRemovePhoto(e, selectedMemory.id)}
                        className="px-3.5 py-2 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove Photo</span>
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedMemoryId(null)}
                    className="px-5 py-2 text-sm font-medium text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
