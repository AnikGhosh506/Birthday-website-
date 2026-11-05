import React, { useState, useEffect } from 'react';
import { PersonalizationData, Memory } from '../types';
import { X, Save, RotateCcw, Copy, Check, Sparkles, Image, Plus, Trash2 } from 'lucide-react';
import { romanticAudio } from '../utils/audioSynth';
import { compressImageFile } from '../utils/persistentStorage';

interface PersonalizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: PersonalizationData;
  onSave: (newData: PersonalizationData) => void;
  onReset: () => void;
}

export const PersonalizeModal: React.FC<PersonalizeModalProps> = ({
  isOpen,
  onClose,
  data,
  onSave,
  onReset,
}) => {
  const [formData, setFormData] = useState<PersonalizationData>(data);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<'basics' | 'memories' | 'coupons'>('basics');

  useEffect(() => {
    if (isOpen) {
      setFormData(data);
    }
  }, [isOpen, data]);

  if (!isOpen) return null;

  const handleTextChange = (field: keyof PersonalizationData, val: string) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleSave = () => {
    onSave(formData);
    romanticAudio.playCelebrationChime();
    onClose();
  };

  const handleShareLink = () => {
    try {
      const serialized = encodeURIComponent(JSON.stringify(formData));
      const url = `${window.location.origin}${window.location.pathname}#gift=${serialized}`;
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleAddMemory = () => {
    const newMem: Memory = {
      id: `mem-${Date.now()}`,
      title: 'A Special Day Together',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      location: 'Our Favorite Spot',
      caption: 'Every moment spent with you is a memory I keep close to my heart.',
      tag: 'New Milestone',
      imageUrl: '',
    };
    setFormData((prev) => ({
      ...prev,
      memories: [...prev.memories, newMem],
    }));
  };

  const handleDeleteMemory = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      memories: prev.memories.filter((m) => m.id !== id),
    }));
  };

  const handleUpdateMemory = (id: string, updates: Partial<Memory>) => {
    setFormData((prev) => ({
      ...prev,
      memories: prev.memories.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl border border-stone-200 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-rose-600" />
            <h3 className="font-serif text-xl font-bold text-stone-900">
              Personalize Her Birthday Website
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs (Functional buttons) */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-stone-100 bg-stone-50/50">
          <button
            onClick={() => setActiveTab('basics')}
            className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'basics'
                ? 'border-stone-900 text-stone-900 font-semibold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Names & Messages
          </button>
          <button
            onClick={() => setActiveTab('memories')}
            className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'memories'
                ? 'border-stone-900 text-stone-900 font-semibold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Memories & Photos ({formData.memories.length})
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'basics' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                    Sister's Name
                  </label>
                  <input
                    type="text"
                    value={formData.girlfriendName}
                    onChange={(e) => handleTextChange('girlfriendName', e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900"
                    placeholder="e.g. Atrayee"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                    Her Title / Nickname
                  </label>
                  <input
                    type="text"
                    value={formData.nickname}
                    onChange={(e) => handleTextChange('nickname', e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900"
                    placeholder="e.g. Best Big Sis"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                    Your Name (From Sibling)
                  </label>
                  <input
                    type="text"
                    value={formData.boyfriendName}
                    onChange={(e) => handleTextChange('boyfriendName', e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900"
                    placeholder="e.g. Anik"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                    Her Birthday Date
                  </label>
                  <input
                    type="date"
                    value={formData.birthdayDate}
                    onChange={(e) => handleTextChange('birthdayDate', e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                  Main Birthday Greeting Headline
                </label>
                <input
                  type="text"
                  value={formData.heroHeadline}
                  onChange={(e) => handleTextChange('heroHeadline', e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900"
                  placeholder="Happy Birthday, My Love"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                  Heartfelt Birthday Letter / Message
                </label>
                <textarea
                  rows={3}
                  value={formData.heroMessage}
                  onChange={(e) => handleTextChange('heroMessage', e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                  Secret Wish Message (Revealed When Candles Are Blown Out)
                </label>
                <textarea
                  rows={3}
                  value={formData.secretWishMessage}
                  onChange={(e) => handleTextChange('secretWishMessage', e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 leading-relaxed"
                />
              </div>
            </div>
          )}

          {activeTab === 'memories' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-xs text-stone-500 font-sans">
                  Customize our shared moments or add new road trips & dates:
                </span>
                <button
                  type="button"
                  onClick={handleAddMemory}
                  className="px-3 py-1.5 text-xs font-medium text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Memory</span>
                </button>
              </div>

              <div className="space-y-4">
                {formData.memories.map((mem) => (
                  <div
                    key={mem.id}
                    className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <input
                        type="text"
                        value={mem.title}
                        onChange={(e) => handleUpdateMemory(mem.id, { title: e.target.value })}
                        placeholder="Memory Title"
                        className="font-serif font-bold text-sm text-stone-900 bg-transparent border-b border-stone-300 focus:outline-none focus:border-stone-900 flex-1 py-1"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteMemory(mem.id)}
                        className="p-1 text-stone-400 hover:text-rose-600 rounded transition-colors"
                        title="Delete memory"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <input
                        type="text"
                        value={mem.date}
                        onChange={(e) => handleUpdateMemory(mem.id, { date: e.target.value })}
                        placeholder="Date (e.g. April 14, 2023)"
                        className="px-3 py-1.5 text-xs bg-white rounded border border-stone-200"
                      />
                      <input
                        type="text"
                        value={mem.location}
                        onChange={(e) => handleUpdateMemory(mem.id, { location: e.target.value })}
                        placeholder="Location"
                        className="px-3 py-1.5 text-xs bg-white rounded border border-stone-200"
                      />
                      <input
                        type="text"
                        value={mem.tag}
                        onChange={(e) => handleUpdateMemory(mem.id, { tag: e.target.value })}
                        placeholder="Tag (e.g. Adventures)"
                        className="px-3 py-1.5 text-xs bg-white rounded border border-stone-200"
                      />
                    </div>

                    <textarea
                      rows={2}
                      value={mem.caption}
                      onChange={(e) => handleUpdateMemory(mem.id, { caption: e.target.value })}
                      placeholder="Story / Caption..."
                      className="w-full px-3 py-1.5 text-xs bg-white rounded border border-stone-200 leading-relaxed focus:outline-none"
                    />

                    {/* Photo input */}
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="px-3 py-1.5 text-xs font-medium text-stone-700 bg-white border border-stone-300 rounded hover:bg-stone-50 cursor-pointer flex items-center gap-1.5">
                        <Image className="w-3.5 h-3.5" />
                        <span>{mem.imageUrl ? 'Change Photo' : 'Upload Photo'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                const compressed = await compressImageFile(file, 1400, 0.85);
                                handleUpdateMemory(mem.id, { imageUrl: compressed });
                              } catch (err) {
                                console.error('Failed to process photo', err);
                              }
                              e.target.value = '';
                            }
                          }}
                        />
                      </label>
                      {mem.imageUrl && (
                        <>
                          <span className="text-[11px] text-emerald-600 font-medium">
                            Photo saved ✓
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateMemory(mem.id, { imageUrl: '' })}
                            className="px-2.5 py-1 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded inline-flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Remove Photo</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-stone-200 bg-stone-50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onReset}
              className="px-3 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 transition-colors inline-flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>

            <button
              type="button"
              onClick={handleShareLink}
              className="px-3 py-2 text-xs font-medium text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors inline-flex items-center gap-1.5"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">Link Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Gift Link</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-xs font-medium text-white bg-stone-900 rounded-lg hover:bg-stone-800 transition-colors inline-flex items-center gap-2 shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save & Update Website</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
