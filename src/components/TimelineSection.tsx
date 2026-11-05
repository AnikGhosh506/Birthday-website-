import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  increment,
  serverTimestamp,
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { db, auth } from '../firebase';
import { Memory } from '../types';
import {
  MapPin,
  Calendar,
  Heart,
  ZoomIn,
  X,
  Camera,
  Plus,
  Trash2,
  Gift,
  Sparkles,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Film,
  RotateCw,
  Search,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { romanticAudio } from '../utils/audioSynth';
import { compressImageFile } from '../utils/persistentStorage';
import { MemoryFlipCarousel } from './MemoryFlipCarousel';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const LOCAL_MEMORY_LIKES_KEY = 'amore_memory_likes_cache_v1';

interface TimelineSectionProps {
  memories: Memory[];
  onUpdateMemoryImage: (id: string, dataUrl: string) => void;
  onRemoveMemoryImage: (id: string) => void;
  onAddMemory: () => void;
}

const SLIDESHOW_DURATION_MS = 4500;

const BIRTHDAY_SURPRISE_NOTES = [
  {
    kicker: 'Birthday Surprise · Secret Note #1',
    title: 'A Little Scrapbook Secret for Didi 🎂',
    note: 'Psst, Atrayee Didi! Every Polaroid here holds a handwritten memory from me — tap any card to read the full note or add our favorite photos forever!',
  },
  {
    kicker: 'Birthday Surprise · Secret Note #2',
    title: '3:30 AM Little Brother Confession 🍦',
    note: 'Even when I stay up till 3:30 AM watching cinema and eating Magnum ice cream, you are still my biggest inspiration from home to NIT & Bangalore!',
  },
  {
    kicker: 'Birthday Surprise · Secret Note #3',
    title: 'Kali Pujo & Birthday Treat Promise ✨',
    note: 'Hovering over Memory Lane officially unlocks 1 extra Magnum & street-food treat next time we meet in Durgapur or Kali Pujo!',
  },
];

export const TimelineSection: React.FC<TimelineSectionProps> = ({
  memories,
  onUpdateMemoryImage,
  onRemoveMemoryImage,
  onAddMemory,
}) => {
  const [activeTag, setActiveTag] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMemoryId, setSelectedMemoryId] = useState<string | null>(null);
  const [flippedCardId, setFlippedCardId] = useState<string | null>(null);

  // Firestore-persisted Memory Likes state
  const [currentUser, setCurrentUser] = useState<User | null>(() => auth.currentUser);
  const [likesByMemoryId, setLikesByMemoryId] = useState<Record<string, number>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(LOCAL_MEMORY_LIKES_KEY);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch {}
    }
    return {};
  });
  const [animatingHeartId, setAnimatingHeartId] = useState<string | null>(null);
  const existingLikeDocsRef = useRef<Set<string>>(new Set());
  const heartAnimTimeoutRef = useRef<number | null>(null);

  // Track Firebase Auth user state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsub();
  }, []);

  // Real-time Firestore listener for /memoryLikes
  useEffect(() => {
    if (!currentUser) return;

    const likesPath = 'memoryLikes';
    const q = query(
      collection(db, likesPath),
      where('authorUid', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const nextLikes: Record<string, number> = {};
        const docSet = new Set<string>();
        snapshot.docs.forEach((docSnap) => {
          const d = docSnap.data();
          if (typeof d.memoryId === 'string' && typeof d.likes === 'number') {
            nextLikes[d.memoryId] = d.likes;
            docSet.add(d.memoryId);
          }
        });
        existingLikeDocsRef.current = docSet;
        setLikesByMemoryId((prev) => {
          const merged = { ...prev, ...nextLikes };
          try {
            localStorage.setItem(LOCAL_MEMORY_LIKES_KEY, JSON.stringify(merged));
          } catch {}
          return merged;
        });
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, likesPath);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    return () => {
      if (heartAnimTimeoutRef.current) {
        window.clearTimeout(heartAnimTimeoutRef.current);
      }
    };
  }, []);

  // Handle clicking the 3D Heart button on a memory card
  const handleLikeMemory = async (e: React.MouseEvent, memoryId: string) => {
    e.stopPropagation();
    const safeMemoryId = memoryId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
    if (!safeMemoryId) return;

    // Trigger 3D scale animation & celebratory chime
    setAnimatingHeartId(memoryId);
    if (heartAnimTimeoutRef.current) {
      window.clearTimeout(heartAnimTimeoutRef.current);
    }
    heartAnimTimeoutRef.current = window.setTimeout(() => {
      setAnimatingHeartId((prev) => (prev === memoryId ? null : prev));
    }, 520);

    romanticAudio.playCatchChime(2);
    confetti({
      particleCount: 18,
      spread: 48,
      startVelocity: 24,
      origin: {
        x: Math.min(0.9, Math.max(0.1, e.clientX / (window.innerWidth || 1000))),
        y: Math.min(0.9, Math.max(0.1, e.clientY / (window.innerHeight || 800))),
      },
      colors: ['#e11d48', '#fb7185', '#f59e0b', '#fde047'],
    });

    // Optimistic local increment
    const currentLikes = likesByMemoryId[memoryId] || 0;
    const nextCount = Math.min(100000, currentLikes + 1);
    setLikesByMemoryId((prev) => {
      const updated = { ...prev, [memoryId]: nextCount };
      try {
        localStorage.setItem(LOCAL_MEMORY_LIKES_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    if (!currentUser) return;

    const docId = `${currentUser.uid}_${safeMemoryId}`.replace(/[^a-zA-Z0-9_-]/g, '');
    const docPath = `memoryLikes/${docId}`;
    const docRef = doc(db, 'memoryLikes', docId);

    try {
      if (existingLikeDocsRef.current.has(safeMemoryId) || currentLikes > 0) {
        await updateDoc(docRef, {
          likes: increment(1),
          updatedAt: serverTimestamp(),
        });
      } else {
        existingLikeDocsRef.current.add(safeMemoryId);
        await setDoc(docRef, {
          authorUid: currentUser.uid,
          memoryId: safeMemoryId,
          likes: 1,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      // If updateDoc failed because document didn't exist yet in Firestore, create it
      try {
        existingLikeDocsRef.current.add(safeMemoryId);
        await setDoc(docRef, {
          authorUid: currentUser.uid,
          memoryId: safeMemoryId,
          likes: 1,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (innerError) {
        handleFirestoreError(innerError, OperationType.WRITE, docPath);
      }
    }
  };

  // Slideshow Mode state
  const [isSlideshowOpen, setIsSlideshowOpen] = useState<boolean>(false);
  const [isSlideshowPlaying, setIsSlideshowPlaying] = useState<boolean>(true);
  const [slideshowIndex, setSlideshowIndex] = useState<number>(0);
  const [slideshowProgress, setSlideshowProgress] = useState<number>(0);
  const [slideshowFilterUploadedOnly, setSlideshowFilterUploadedOnly] =
    useState<boolean>(true);
  const [isTransitioningSlide, setIsTransitioningSlide] =
    useState<boolean>(false);

  // Cute 'Birthday Surprise' notification state when hovering over the Memory Lane section
  const [isSurpriseVisible, setIsSurpriseVisible] = useState<boolean>(false);
  const [isSurpriseDismissed, setIsSurpriseDismissed] = useState<boolean>(false);
  const [surpriseIndex, setSurpriseIndex] = useState<number>(0);
  const hasChimedOnHoverRef = useRef<boolean>(false);

  const selectedMemory = memories.find((m) => m.id === selectedMemoryId) || null;

  // Extract unique tags for filter tabs (functional buttons allowed per skill)
  const tags = ['All', ...Array.from(new Set(memories.map((m) => m.tag)))];

  // Filter memories by both activeTag and searchQuery (keyword or date)
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredMemories = memories.filter((m) => {
    const matchesTag = activeTag === 'All' || m.tag === activeTag;
    if (!matchesTag) return false;
    if (!normalizedQuery) return true;
    const haystack = `${m.title} ${m.caption} ${m.date} ${m.location} ${m.tag}`.toLowerCase();
    return haystack.includes(normalizedQuery);
  });

  const totalScrapbookLikes = Object.values(likesByMemoryId).reduce(
    (sum: number, val: number) => sum + (Number(val) || 0),
    0
  );

  // Determine the memories available for Slideshow Mode:
  // Prioritizes uploaded photos when available & toggled, otherwise falls back to filteredMemories so slideshow always works smoothly
  const uploadedPhotoMemories = memories.filter((m) => Boolean(m.imageUrl));
  const slideshowMemories =
    slideshowFilterUploadedOnly && uploadedPhotoMemories.length > 0
      ? uploadedPhotoMemories
      : filteredMemories.length > 0
        ? filteredMemories
        : memories;

  const safeSlideshowIndex =
    slideshowMemories.length > 0
      ? slideshowIndex % slideshowMemories.length
      : 0;
  const activeSlideshowMemory = slideshowMemories[safeSlideshowIndex] || null;

  const advanceSlide = useCallback(
    (direction: 1 | -1) => {
      if (slideshowMemories.length <= 1) return;
      setIsTransitioningSlide(true);
      setSlideshowProgress(0);
      setTimeout(() => {
        setSlideshowIndex((prev) => {
          const len = slideshowMemories.length;
          return (prev + direction + len) % len;
        });
        setIsTransitioningSlide(false);
      }, 240);
    },
    [slideshowMemories.length]
  );

  // Automatic cycling timer for Slideshow Mode
  useEffect(() => {
    if (!isSlideshowOpen || !isSlideshowPlaying || slideshowMemories.length <= 1) {
      return;
    }

    const tickMs = 50;
    const step = (tickMs / SLIDESHOW_DURATION_MS) * 100;

    const interval = window.setInterval(() => {
      setSlideshowProgress((prev) => {
        if (prev + step >= 100) {
          advanceSlide(1);
          return 0;
        }
        return prev + step;
      });
    }, tickMs);

    return () => window.clearInterval(interval);
  }, [
    isSlideshowOpen,
    isSlideshowPlaying,
    slideshowMemories.length,
    advanceSlide,
  ]);

  // Keyboard shortcuts for Slideshow Mode
  useEffect(() => {
    if (!isSlideshowOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSlideshowOpen(false);
        romanticAudio.playSoftClick();
      } else if (e.key === 'ArrowRight') {
        romanticAudio.playSoftClick();
        advanceSlide(1);
      } else if (e.key === 'ArrowLeft') {
        romanticAudio.playSoftClick();
        advanceSlide(-1);
      } else if (e.key === ' ') {
        e.preventDefault();
        romanticAudio.playSoftClick();
        setIsSlideshowPlaying((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSlideshowOpen, advanceSlide]);

  const handleOpenSlideshow = () => {
    romanticAudio.playCelebrationChime();
    setSlideshowFilterUploadedOnly(uploadedPhotoMemories.length > 0);
    setSlideshowIndex(0);
    setSlideshowProgress(0);
    setIsSlideshowPlaying(true);
    setIsSlideshowOpen(true);
  };

  const handleSectionMouseEnter = () => {
    if (!isSurpriseDismissed) {
      setIsSurpriseVisible(true);
      if (!hasChimedOnHoverRef.current) {
        hasChimedOnHoverRef.current = true;
        romanticAudio.playSoftClick();
      }
    }
  };

  const handleSectionMouseLeave = () => {
    setIsSurpriseVisible(false);
  };

  const handleTriggerSurpriseAction = () => {
    romanticAudio.playCelebrationChime();
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.75 },
    });
    setSurpriseIndex((prev) => (prev + 1) % BIRTHDAY_SURPRISE_NOTES.length);
    if (filteredMemories.length > 0) {
      const randomMem =
        filteredMemories[Math.floor(Math.random() * filteredMemories.length)];
      setSelectedMemoryId(randomMem.id);
    }
  };

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

  const currentSurprise = BIRTHDAY_SURPRISE_NOTES[surpriseIndex];

  return (
    <section
      id="memories"
      onMouseEnter={handleSectionMouseEnter}
      onMouseLeave={handleSectionMouseLeave}
      className="relative py-20 border-b border-stone-200/80 bg-stone-50/50 overflow-hidden"
    >
      {/* Cute 'Birthday Surprise' Floating Notification on Section Hover */}
      <div
        role="status"
        aria-live="polite"
        className={`fixed bottom-6 right-6 z-40 max-w-xs sm:max-w-sm transition-all duration-200 ease-out ${
          isSurpriseVisible && !isSurpriseDismissed
            ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
            : 'opacity-0 translate-y-4 scale-95 pointer-events-none'
        }`}
      >
        <div className="bg-white border border-rose-200/90 rounded-2xl p-4 shadow-xl paper-texture">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 shadow-2xs">
                <Gift className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] font-semibold text-rose-800 tracking-wide">
                  {currentSurprise.kicker}
                </div>
                <h4 className="font-serif text-sm font-bold text-stone-900">
                  {currentSurprise.title}
                </h4>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsSurpriseVisible(false);
                setIsSurpriseDismissed(true);
                romanticAudio.playSoftClick();
              }}
              aria-label="Dismiss birthday surprise notification"
              className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="mt-2.5 text-lg text-[#1e3a8a] font-anik-handwriting leading-snug">
            {currentSurprise.note}
          </p>

          <div className="mt-3 pt-2.5 border-t border-stone-200/70 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                romanticAudio.playSoftClick();
                setSurpriseIndex(
                  (prev) => (prev + 1) % BIRTHDAY_SURPRISE_NOTES.length
                );
              }}
              className="text-xs font-medium text-stone-600 hover:text-stone-900 transition-colors cursor-pointer whitespace-nowrap"
            >
              Next Secret Note →
            </button>

            <button
              type="button"
              onClick={handleTriggerSurpriseAction}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap btn-3d-rose"
            >
              <Sparkles className="w-3 h-3" />
              <span>Open Surprise Memory</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-800 uppercase tracking-widest mb-2">
              <span>Chapter 02</span>
              <span aria-hidden="true">·</span>
              <span>Memory Lane Scrapbook</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-stone-900 heading-3d">
              Our Favorite Sister Memories
            </h2>
            <p className="mt-2 text-sm sm:text-base text-stone-600 font-sans max-w-xl">
              From childhood adventures and borrowed outfits to late-night kitchen talks and lifelong support.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Slideshow Mode Button */}
            <button
              type="button"
              onClick={handleOpenSlideshow}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-rose-800 hover:bg-rose-700 rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer btn-3d-rose"
            >
              <Film className="w-3.5 h-3.5" />
              <span>Slideshow Mode</span>
              {uploadedPhotoMemories.length > 0 && (
                <span className="ml-0.5 px-1.5 py-0.5 rounded bg-white/20 text-[10px] font-mono">
                  {uploadedPhotoMemories.length}
                </span>
              )}
            </button>

            {/* Button to re-open the Birthday Surprise popup anytime */}
            <button
              type="button"
              onClick={() => {
                setIsSurpriseDismissed(false);
                setIsSurpriseVisible(true);
                romanticAudio.playCelebrationChime();
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Gift className="w-3.5 h-3.5 text-rose-600" />
              <span>Birthday Surprise</span>
            </button>

            {/* Interactive Filter Tabs (functional segmented controls per skill) */}
            <div className="flex items-center gap-1.5 p-1 bg-stone-200/70 rounded-lg overflow-x-auto">
              {tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    setActiveTag(tag);
                    romanticAudio.playSoftClick();
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
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
        </div>

        {/* Search Bar at the Top of Memory Lane (Filter by Keyword or Date) + Total Likes Badge */}
        <div className="mb-8 p-4 rounded-2xl bg-white border border-stone-200/90 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search memories by keyword, location, or date (e.g. Kali Pujo, Childhood, 28th May, NIT)..."
              aria-label="Filter memory cards by keyword or date"
              className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-stone-50 border border-stone-200/90 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  romanticAudio.playSoftClick();
                  setSearchQuery('');
                }}
                aria-label="Clear search query"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 text-xs shrink-0">
            <span className="text-stone-500 font-medium">
              Showing{' '}
              <strong className="text-stone-900 font-mono">
                {filteredMemories.length}
              </strong>{' '}
              of {memories.length} memories
            </span>

            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-800 font-semibold">
              <Heart className="w-3.5 h-3.5 text-rose-600 fill-rose-600" />
              <span className="font-mono tabular-nums">{totalScrapbookLikes}</span>
              <span>Total Likes</span>
            </span>
          </div>
        </div>

        {/* Automated 3D Card-Flip Carousel (Rotates & Flips in Idle Mode) */}
        <MemoryFlipCarousel
          memories={filteredMemories.length > 0 ? filteredMemories : memories}
          onSelectMemory={(memId) => setSelectedMemoryId(memId)}
          onUploadPhoto={handleImageUpload}
        />

        {/* Empty Search State if no cards match keyword/date */}
        {filteredMemories.length === 0 ? (
          <div className="my-8 p-10 rounded-2xl bg-white border border-stone-200/90 text-center shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-xl font-bold text-stone-900">
              No scrapbook memories match “{searchQuery}”
            </h3>
            <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-md mx-auto">
              Try searching for another keyword, location, or date, or clear the filter to view all memory cards.
            </p>
            <button
              type="button"
              onClick={() => {
                romanticAudio.playSoftClick();
                setSearchQuery('');
                setActiveTag('All');
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold cursor-pointer btn-3d-rose"
            >
              Reset Search & Show All Memories
            </button>
          </div>
        ) : (
          /* 3-Column 3D Polaroid Memory Grid with 3D Flip on Hover */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 perspective-1200">
            {filteredMemories.map((memory, idx) => {
              const isManuallyFlipped = flippedCardId === memory.id;
              const likeCount = likesByMemoryId[memory.id] || 0;
              const isHeartAnimating = animatingHeartId === memory.id;

              return (
                <div
                  key={memory.id}
                  onMouseEnter={() => romanticAudio.playSoftClick()}
                  className={`group memory-flip-stage min-h-[410px] ${
                    isManuallyFlipped ? 'is-flipped' : ''
                  }`}
                >
                  <div className="memory-flip-inner min-h-[410px]">
                    {/* ================= FRONT OF POLAROID ================= */}
                    <div className="memory-flip-face memory-flip-front bg-white p-4 rounded-xl border border-stone-200 flex flex-col justify-between">
                      {/* Decorative Scrapbook Washi Tape */}
                      <div
                        aria-hidden="true"
                        className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-20 h-5 bg-amber-100/80 border border-amber-200/70 rotate-[-1.5deg] shadow-2xs pointer-events-none z-10"
                      />

                      <div>
                        {/* Polaroid Photo Frame */}
                        <div className="relative aspect-4/3 w-full rounded-lg overflow-hidden bg-stone-100 border border-stone-200/60 mb-4">
                          {memory.imageUrl ? (
                            <img
                              src={memory.imageUrl}
                              alt={memory.title}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover transition-transform duration-500"
                            />
                          ) : (
                            renderFallbackIllustration(idx, memory.title)
                          )}

                          {/* Corner Scrapbook Number Badge */}
                          <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-stone-900/65 text-white text-[10px] font-mono backdrop-blur-xs">
                            #{String(idx + 1).padStart(2, '0')}
                          </div>

                          {/* 3D Heart Like Button on Polaroid Front Corner */}
                          <button
                            type="button"
                            onClick={(e) => void handleLikeMemory(e, memory.id)}
                            aria-label={`Like ${memory.title} (${likeCount} likes)`}
                            title="Send a heart like to this memory (persists in Firestore)"
                            style={{
                              transform: isHeartAnimating
                                ? 'perspective(400px) scale3d(1.28, 1.28, 1.28) translateZ(14px) rotate(-8deg)'
                                : 'perspective(400px) scale3d(1, 1, 1) translateZ(0px) rotate(0deg)',
                              transition:
                                'transform 320ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                            }}
                            className={`absolute top-2.5 right-2.5 z-20 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold shadow-md cursor-pointer border backdrop-blur-xs ${
                              likeCount > 0
                                ? 'bg-rose-600 text-white border-rose-400'
                                : 'bg-white/90 hover:bg-rose-50 text-stone-800 border-stone-200'
                            }`}
                          >
                            <Heart
                              className={`w-3.5 h-3.5 transition-transform ${
                                likeCount > 0
                                  ? 'fill-white text-white'
                                  : 'text-rose-600 fill-rose-500/20'
                              }`}
                            />
                            <span className="font-mono tabular-nums text-[11px]">
                              {likeCount}
                            </span>
                          </button>
                        </div>

                        {/* Front Metadata & Title */}
                        <div className="flex items-center gap-2 text-xs text-stone-500 mb-1.5">
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

                        <h3 className="font-serif text-lg font-bold text-stone-900">
                          {memory.title}
                        </h3>

                        <p className="mt-1.5 text-lg text-[#1e3a8a] line-clamp-2 font-anik-handwriting leading-snug">
                          {memory.caption}
                        </p>
                      </div>

                      {/* Front Footer Hint */}
                      <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-400">
                        <span className="text-rose-700 font-medium">
                          {memory.tag}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            romanticAudio.playSoftClick();
                            setFlippedCardId((prev) =>
                              prev === memory.id ? null : memory.id
                            );
                          }}
                          className="inline-flex items-center gap-1 text-stone-500 hover:text-rose-700 font-medium transition-colors cursor-pointer"
                        >
                          <RotateCw className="w-3 h-3" />
                          <span>Hover to flip Polaroid</span>
                        </button>
                      </div>
                    </div>

                    {/* ================= BACK OF POLAROID (3D FLIPPED) ================= */}
                    <div className="memory-flip-face memory-flip-back bg-white p-5 rounded-xl border border-rose-200/90 paper-texture flex flex-col justify-between">
                      {/* Back Header Stamp */}
                      <div>
                        <div className="flex items-center justify-between gap-2 pb-3 border-b border-stone-200/80">
                          <div>
                            <div className="text-[10px] font-semibold uppercase tracking-widest text-rose-800">
                              Scrapbook Backside · {memory.tag}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-stone-500 mt-0.5">
                              <Calendar className="w-3 h-3 text-rose-500" />
                              <span>{memory.date}</span>
                              <span aria-hidden="true">·</span>
                              <MapPin className="w-3 h-3 text-stone-400" />
                              <span className="truncate max-w-[140px]">
                                {memory.location}
                              </span>
                            </div>
                          </div>

                          {/* Interactive 3D Heart Like Button on Flipped Backside */}
                          <button
                            type="button"
                            onClick={(e) => void handleLikeMemory(e, memory.id)}
                            title="Click to increment likes in Firestore"
                            style={{
                              transform: isHeartAnimating
                                ? 'perspective(400px) scale3d(1.3, 1.3, 1.3) translateZ(14px) rotate(-8deg)'
                                : 'perspective(400px) scale3d(1, 1, 1)',
                              transition:
                                'transform 320ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                            }}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border shadow-2xs cursor-pointer transition-colors ${
                              likeCount > 0
                                ? 'bg-rose-600 text-white border-rose-500'
                                : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                            }`}
                          >
                            <Heart
                              className={`w-3.5 h-3.5 ${
                                likeCount > 0
                                  ? 'fill-white text-white'
                                  : 'fill-rose-600 text-rose-600'
                              }`}
                            />
                            <span className="font-mono tabular-nums">{likeCount}</span>
                          </button>
                        </div>

                        <h4 className="font-serif text-lg font-bold text-stone-900 mt-3">
                          {memory.title}
                        </h4>

                        {/* Full Handwritten Note on Back of Polaroid */}
                        <div className="mt-2 max-h-[175px] overflow-y-auto pr-1">
                          <p className="text-xl text-[#1e3a8a] font-anik-handwriting leading-snug whitespace-pre-line">
                            {memory.caption}
                          </p>
                        </div>
                      </div>

                      {/* Back Footer Controls (Upload, Remove, Fullscreen Lightbox) */}
                      <div className="pt-3 border-t border-stone-200/80 flex flex-col gap-2.5">
                        <div className="flex items-center justify-between text-[11px] text-stone-500">
                          <span className="font-serif italic text-rose-800">
                            — Handwritten by Anik
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFlippedCardId(null);
                            }}
                            className="sm:hidden text-stone-500 hover:text-stone-800 underline cursor-pointer"
                          >
                            Flip back
                          </button>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            {/* Upload / Replace Photo */}
                            <label
                              title={
                                memory.imageUrl
                                  ? 'Change Polaroid photo'
                                  : 'Upload real photo'
                              }
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white hover:bg-stone-50 text-stone-700 border border-stone-300 text-xs font-medium shadow-2xs cursor-pointer transition-colors"
                            >
                              <Camera className="w-3.5 h-3.5 text-rose-600" />
                              <span>
                                {memory.imageUrl ? 'Change' : 'Add Photo'}
                              </span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleImageUpload(e, memory.id)}
                              />
                            </label>

                            {/* Remove Photo */}
                            {memory.imageUrl && (
                              <button
                                type="button"
                                onClick={(e) => handleRemovePhoto(e, memory.id)}
                                title="Remove photo"
                                aria-label="Remove photo"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-medium cursor-pointer transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Remove</span>
                              </button>
                            )}
                          </div>

                          {/* Open Fullscreen Modal */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedMemoryId(memory.id);
                              romanticAudio.playSoftClick();
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold cursor-pointer transition-colors"
                          >
                            <ZoomIn className="w-3.5 h-3.5" />
                            <span>Expand Note</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

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
        )}

        {/* Immersive Slideshow Mode Modal */}
        {isSlideshowOpen && activeSlideshowMemory && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Memory Lane Photo Slideshow"
            className="fixed inset-0 z-50 flex flex-col bg-stone-950/95 backdrop-blur-md animate-in fade-in duration-300"
          >
            {/* Top Cinema Control Bar */}
            <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-4 pb-3 flex flex-wrap items-center justify-between gap-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <Film className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-rose-300">
                    <span>Memory Lane Cinema</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono">
                      Slide {safeSlideshowIndex + 1} of {slideshowMemories.length}
                    </span>
                  </div>
                  <h3 className="font-serif text-base sm:text-lg font-bold text-white">
                    {activeSlideshowMemory.title}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                {/* Toggle between Uploaded Photos Only and All Scrapbook Memories */}
                {uploadedPhotoMemories.length > 0 && (
                  <div className="hidden sm:flex items-center bg-white/10 p-1 rounded-lg border border-white/10">
                    <button
                      type="button"
                      onClick={() => {
                        romanticAudio.playSoftClick();
                        setSlideshowFilterUploadedOnly(true);
                        setSlideshowIndex(0);
                        setSlideshowProgress(0);
                      }}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                        slideshowFilterUploadedOnly
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'text-stone-300 hover:text-white'
                      }`}
                    >
                      Uploaded Photos ({uploadedPhotoMemories.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        romanticAudio.playSoftClick();
                        setSlideshowFilterUploadedOnly(false);
                        setSlideshowIndex(0);
                        setSlideshowProgress(0);
                      }}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                        !slideshowFilterUploadedOnly
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'text-stone-300 hover:text-white'
                      }`}
                    >
                      All Memories ({memories.length})
                    </button>
                  </div>
                )}

                {/* Play / Pause Button */}
                <button
                  type="button"
                  onClick={() => {
                    romanticAudio.playSoftClick();
                    setIsSlideshowPlaying((prev) => !prev);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  {isSlideshowPlaying ? (
                    <>
                      <Pause className="w-3.5 h-3.5 text-amber-300" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Play</span>
                    </>
                  )}
                </button>

                {/* Upload photo directly for current slide */}
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-stone-200 text-xs font-medium transition-colors cursor-pointer">
                  <Camera className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">
                    {activeSlideshowMemory.imageUrl ? 'Replace Photo' : 'Add Photo'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      handleImageUpload(e, activeSlideshowMemory.id)
                    }
                  />
                </label>

                {/* Exit Slideshow Button */}
                <button
                  type="button"
                  onClick={() => {
                    romanticAudio.playSoftClick();
                    setIsSlideshowOpen(false);
                  }}
                  aria-label="Close slideshow"
                  className="p-2 rounded-lg bg-white/10 hover:bg-rose-600/80 text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Segmented Auto-Advance Progress Bars */}
            <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-2 flex items-center gap-1.5">
              {slideshowMemories.map((mem, idx) => {
                const widthPercent =
                  idx < safeSlideshowIndex
                    ? 100
                    : idx === safeSlideshowIndex
                      ? slideshowProgress
                      : 0;
                return (
                  <button
                    key={mem.id}
                    type="button"
                    onClick={() => {
                      romanticAudio.playSoftClick();
                      setSlideshowIndex(idx);
                      setSlideshowProgress(0);
                    }}
                    aria-label={`Jump to slide ${idx + 1}: ${mem.title}`}
                    className="flex-1 h-1.5 rounded-full bg-white/15 overflow-hidden cursor-pointer"
                  >
                    <div
                      className="h-full bg-gradient-to-r from-rose-500 to-amber-400 transition-all duration-75"
                      style={{ width: `${widthPercent}%` }}
                    />
                  </button>
                );
              })}
            </div>

            {/* Main Cinema Stage */}
            <div className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col lg:flex-row items-center justify-center gap-6 overflow-y-auto">
              {/* Photo Frame with Smooth Crossfade & Subtle Zoom Transition */}
              <div className="relative w-full lg:w-7/12 aspect-4/3 max-h-[60vh] rounded-2xl overflow-hidden bg-stone-900 border border-white/15 shadow-2xl flex items-center justify-center">
                <div
                  className={`w-full h-full transition-all duration-500 ease-out ${
                    isTransitioningSlide
                      ? 'opacity-0 scale-95'
                      : 'opacity-100 scale-100'
                  }`}
                >
                  {activeSlideshowMemory.imageUrl ? (
                    <img
                      src={activeSlideshowMemory.imageUrl}
                      alt={activeSlideshowMemory.title}
                      referrerPolicy="no-referrer"
                      className={`w-full h-full object-contain bg-stone-950 transition-transform duration-[4500ms] ease-out ${
                        isSlideshowPlaying && !isTransitioningSlide
                          ? 'scale-105'
                          : 'scale-100'
                      }`}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {renderFallbackIllustration(
                        safeSlideshowIndex,
                        activeSlideshowMemory.title
                      )}
                    </div>
                  )}
                </div>

                {/* Previous / Next Navigation Arrows */}
                {slideshowMemories.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        romanticAudio.playSoftClick();
                        advanceSlide(-1);
                      }}
                      aria-label="Previous memory slide"
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-stone-950/70 hover:bg-stone-900 text-white border border-white/15 shadow-lg transition-all cursor-pointer"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        romanticAudio.playSoftClick();
                        advanceSlide(1);
                      }}
                      aria-label="Next memory slide"
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-stone-950/70 hover:bg-stone-900 text-white border border-white/15 shadow-lg transition-all cursor-pointer"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>

              {/* Handwritten Scrapbook Story Card */}
              <div
                className={`w-full lg:w-5/12 bg-white rounded-2xl p-6 sm:p-8 border border-stone-200 shadow-2xl paper-texture transition-all duration-500 ${
                  isTransitioningSlide
                    ? 'opacity-0 translate-y-3'
                    : 'opacity-100 translate-y-0'
                }`}
              >
                <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 mb-3">
                  <span className="inline-flex items-center gap-1 font-medium text-stone-700">
                    <Calendar className="w-3.5 h-3.5 text-rose-600" />
                    {activeSlideshowMemory.date}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-stone-400" />
                    {activeSlideshowMemory.location}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="text-rose-700 font-semibold">
                    {activeSlideshowMemory.tag}
                  </span>
                </div>

                <h4 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mb-4">
                  {activeSlideshowMemory.title}
                </h4>

                <p className="text-2xl text-[#1e3a8a] font-anik-handwriting leading-relaxed whitespace-pre-line">
                  {activeSlideshowMemory.caption}
                </p>

                <div className="mt-6 pt-4 border-t border-stone-200/80 flex items-center justify-between text-xs text-stone-500">
                  <span>
                    {uploadedPhotoMemories.length === 0
                      ? 'Tip: Upload photos to any Polaroid to personalize the slideshow'
                      : 'Auto-cycling every 4.5 seconds'}
                  </span>
                  <span className="font-serif italic text-rose-800">
                    — With love, Anik
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Filmstrip Thumbnails */}
            <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 pb-4 pt-2 border-t border-white/10">
              <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                {slideshowMemories.map((mem, idx) => {
                  const isCurrent = idx === safeSlideshowIndex;
                  return (
                    <button
                      key={mem.id}
                      type="button"
                      onClick={() => {
                        romanticAudio.playSoftClick();
                        setSlideshowIndex(idx);
                        setSlideshowProgress(0);
                      }}
                      className={`group relative shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                        isCurrent
                          ? 'border-rose-400 scale-105 shadow-md'
                          : 'border-white/15 opacity-60 hover:opacity-100'
                      }`}
                    >
                      {mem.imageUrl ? (
                        <img
                          src={mem.imageUrl}
                          alt={mem.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-rose-200 to-amber-100 flex items-center justify-center p-1">
                          <span className="text-[9px] font-serif font-bold text-stone-800 line-clamp-2 leading-tight">
                            {mem.title}
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

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
