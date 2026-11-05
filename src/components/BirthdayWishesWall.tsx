import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import {
  Sparkles,
  Plus,
  Trash2,
  Pin,
  Heart,
  MessageSquareHeart,
  CheckCircle2,
} from 'lucide-react';
import { db, auth } from '../firebase';
import { romanticAudio } from '../utils/audioSynth';
import { triggerConfettiExplosion } from '../utils/confettiExplosion';

interface BirthdayWishesWallProps {
  girlfriendName: string;
  boyfriendName: string;
  userEmail?: string;
}

type StickyNoteColor =
  | 'sunrise-yellow'
  | 'blush-rose'
  | 'mint-sage'
  | 'lavender-sky'
  | 'peach-coral';

interface StickyWishDoc {
  id: string;
  authorUid: string;
  senderName: string;
  wishText: string;
  noteColor: StickyNoteColor;
  stickerEmoji: string;
  createdAtMs: number;
}

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

const NOTE_COLOR_THEMES: Array<{
  id: StickyNoteColor;
  label: string;
  cardBg: string;
  border: string;
  pinColor: string;
  swatchHex: string;
}> = [
  {
    id: 'sunrise-yellow',
    label: 'Sunrise Yellow',
    cardBg: 'linear-gradient(145deg, #fef9c3 0%, #fef08a 60%, #fde047 100%)',
    border: 'border-amber-300',
    pinColor: 'bg-rose-600 border-rose-300',
    swatchHex: '#fde047',
  },
  {
    id: 'blush-rose',
    label: 'Blush Rose',
    cardBg: 'linear-gradient(145deg, #ffe4e6 0%, #fecdd3 60%, #fda4af 100%)',
    border: 'border-rose-300',
    pinColor: 'bg-amber-500 border-amber-200',
    swatchHex: '#fda4af',
  },
  {
    id: 'mint-sage',
    label: 'Mint Sage',
    cardBg: 'linear-gradient(145deg, #d1fae5 0%, #a7f3d0 60%, #6ee7b7 100%)',
    border: 'border-emerald-300',
    pinColor: 'bg-rose-600 border-rose-200',
    swatchHex: '#6ee7b7',
  },
  {
    id: 'lavender-sky',
    label: 'Lavender Sky',
    cardBg: 'linear-gradient(145deg, #e0e7ff 0%, #c7d2fe 60%, #a5b4fc 100%)',
    border: 'border-indigo-300',
    pinColor: 'bg-amber-500 border-amber-200',
    swatchHex: '#a5b4fc',
  },
  {
    id: 'peach-coral',
    label: 'Peach Coral',
    cardBg: 'linear-gradient(145deg, #ffedd5 0%, #fed7aa 60%, #fdba74 100%)',
    border: 'border-orange-300',
    pinColor: 'bg-rose-600 border-rose-200',
    swatchHex: '#fdba74',
  },
];

const STICKER_EMOJIS = ['🎂', '💖', '✨', '👑', '🌸', '🎉'];

const QUICK_WISH_TEMPLATES = [
  'Happy 28th May Birthday to the coolest, smartest older sister in the world! 👑',
  'All the best for your Bangalore Data Science internship, Didi! So proud of you! ✨',
  'Thank you for always having my back and being my built-in best friend forever! 💖',
  'Don’t forget my Kali Pujo treat and Magnum ice cream party! Happy Birthday! 🎂',
];

export const BirthdayWishesWall: React.FC<BirthdayWishesWallProps> = ({
  girlfriendName,
  boyfriendName,
  userEmail,
}) => {
  const defaultSender =
    userEmail?.toLowerCase() === 'atrayeede0025@gmail.com'
      ? girlfriendName || 'Atrayee'
      : boyfriendName || 'Anik';

  const [currentUid, setCurrentUid] = useState<string | null>(
    () => auth.currentUser?.uid || null
  );
  const [wishes, setWishes] = useState<StickyWishDoc[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [senderName, setSenderName] = useState<string>(defaultSender);
  const [wishText, setWishText] = useState<string>('');
  const [selectedColor, setSelectedColor] =
    useState<StickyNoteColor>('sunrise-yellow');
  const [selectedEmoji, setSelectedEmoji] = useState<string>('🎂');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    setSenderName(defaultSender);
  }, [defaultSender]);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUid(user?.uid || null);
    });
    return () => unsubAuth();
  }, []);

  // Real-time Firestore listener scoped specifically to the logged-in user's UID
  useEffect(() => {
    if (!currentUid) {
      setWishes([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const wishesQuery = query(
      collection(db, 'wishes'),
      where('authorUid', '==', currentUid)
    );

    const unsubscribe = onSnapshot(
      wishesQuery,
      (snapshot) => {
        const loaded: StickyWishDoc[] = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          const createdTs = d.createdAt as Timestamp | undefined;
          return {
            id: docSnap.id,
            authorUid: String(d.authorUid || ''),
            senderName: String(d.senderName || 'Anik'),
            wishText: String(d.wishText || ''),
            noteColor: (d.noteColor as StickyNoteColor) || 'sunrise-yellow',
            stickerEmoji: String(d.stickerEmoji || '🎂'),
            createdAtMs: createdTs?.toMillis ? createdTs.toMillis() : Date.now(),
          };
        });

        loaded.sort((a, b) => b.createdAtMs - a.createdAtMs);
        setWishes(loaded);
        setIsLoading(false);
      },
      (error) => {
        setIsLoading(false);
        handleFirestoreError(error, OperationType.LIST, 'wishes');
      }
    );

    return () => unsubscribe();
  }, [currentUid]);

  const handlePostWish = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const cleanSender = senderName.trim().slice(0, 60) || defaultSender;
    const cleanText = wishText.trim().slice(0, 280);
    if (!cleanText) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'wishes'), {
        authorUid: uid,
        senderName: cleanSender,
        wishText: cleanText,
        noteColor: selectedColor,
        stickerEmoji: selectedEmoji.slice(0, 16),
        createdAt: serverTimestamp(),
      });

      setWishText('');
      romanticAudio.playCelebrationChime();
      triggerConfettiExplosion();
      setToastMsg('Pinned your 3D sticky note to the Firestore Birthday Wishes Wall!');
      window.setTimeout(() => setToastMsg(null), 4000);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'wishes');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSeedStarterNotes = async (e: React.MouseEvent<HTMLButtonElement>) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    setIsSubmitting(true);
    romanticAudio.playCelebrationChime();
    triggerConfettiExplosion({ clientX: e.clientX, clientY: e.clientY });

    const starterNotes: Array<{
      senderName: string;
      wishText: string;
      noteColor: StickyNoteColor;
      stickerEmoji: string;
    }> = [
      {
        senderName: boyfriendName || 'Anik',
        wishText: `Happy 28th May Birthday, ${
          girlfriendName || 'Didi'
        }! You are the best older sister in the universe — thank you for always guiding and protecting me!`,
        noteColor: 'sunrise-yellow',
        stickerEmoji: '👑',
      },
      {
        senderName: `${boyfriendName || 'Anik'} (Dion)`,
        wishText:
          'So proud of your NIT journey and your Bangalore Data Science & Business Analytics internship! Keep shining!',
        noteColor: 'blush-rose',
        stickerEmoji: '✨',
      },
      {
        senderName: boyfriendName || 'Anik',
        wishText:
          'Don’t forget our Kali Pujo treat and late-night movie marathons (Dune 3 & Avengers: Doomsday waiting for us)!',
        noteColor: 'mint-sage',
        stickerEmoji: '🎂',
      },
    ];

    try {
      for (const note of starterNotes) {
        await addDoc(collection(db, 'wishes'), {
          authorUid: uid,
          senderName: note.senderName.slice(0, 60),
          wishText: note.wishText.slice(0, 280),
          noteColor: note.noteColor,
          stickerEmoji: note.stickerEmoji,
          createdAt: serverTimestamp(),
        });
      }
      setToastMsg('Pinned 3 starter birthday sticky notes to your Firestore wall!');
      window.setTimeout(() => setToastMsg(null), 4000);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'wishes');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteWish = async (wishId: string) => {
    romanticAudio.playSoftClick();
    try {
      await deleteDoc(doc(db, 'wishes', wishId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `wishes/${wishId}`);
    }
  };

  const rotations = [
    '-rotate-2',
    'rotate-1',
    '-rotate-1',
    'rotate-2',
    '-rotate-1',
    'rotate-1',
  ];

  return (
    <section
      id="wishes-wall"
      className="py-20 border-b border-stone-200/80 bg-stone-50/60"
    >
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-rose-800 uppercase tracking-widest mb-2">
            <Pin className="w-3.5 h-3.5 text-rose-600" />
            <span>Firestore Persistent Keepsake Board</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-stone-900 heading-3d">
            {girlfriendName || 'Atrayee'}'s 3D Birthday Wishes Wall
          </h2>
          <p className="mt-3 text-sm sm:text-base text-stone-600 leading-relaxed">
            Pin short, 3D-styled sticky notes with heartfelt birthday wishes, inside
            jokes, and blessings — saved permanently in Firestore specifically for
            your logged-in account.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (4 cols): 3D Sticky Note Composer */}
          <div className="lg:col-span-4">
            <form
              onSubmit={(e) => void handlePostWish(e)}
              className="p-6 rounded-2xl bg-white border border-stone-200/90 shadow-md paper-texture card-3d-tilt"
            >
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl bg-stone-900 text-amber-300 flex items-center justify-center shrink-0">
                  <MessageSquareHeart className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-serif font-bold text-stone-900">
                    Write a 3D Sticky Note
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Saved privately to your Firestore Wishes Wall
                  </p>
                </div>
              </div>

              {/* Signed By Input */}
              <div className="mb-3.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Signed By
                </label>
                <input
                  type="text"
                  maxLength={60}
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="e.g., Anik, Didi, Family..."
                  className="w-full px-3.5 py-2 rounded-xl text-xs sm:text-sm bg-white border border-stone-300 text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-400"
                  required
                />
              </div>

              {/* Sticky Note Message */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-700">
                    Birthday Message
                  </label>
                  <span className="text-[11px] font-mono text-stone-400">
                    {wishText.length}/280
                  </span>
                </div>
                <textarea
                  rows={3}
                  maxLength={280}
                  value={wishText}
                  onChange={(e) => setWishText(e.target.value)}
                  placeholder={`Write a sweet birthday wish for ${
                    girlfriendName || 'Atrayee'
                  }...`}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-white border border-stone-300 text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-400 resize-none font-anik-handwriting text-lg"
                  required
                />
              </div>

              {/* Quick Inspiration Chips */}
              <div className="mb-4">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">
                  Quick Wish Ideas (Tap to fill)
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_WISH_TEMPLATES.map((tpl, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        romanticAudio.playSoftClick();
                        setWishText(tpl);
                      }}
                      className="px-2.5 py-1 rounded-lg text-[11px] bg-stone-100 hover:bg-rose-50 text-stone-700 hover:text-rose-900 border border-stone-200 transition-colors cursor-pointer truncate max-w-full"
                    >
                      {tpl.slice(0, 34)}...
                    </button>
                  ))}
                </div>
              </div>

              {/* Sticky Note Color Picker */}
              <div className="mb-4">
                <span className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
                  Sticky Note Color
                </span>
                <div className="flex items-center gap-2.5">
                  {NOTE_COLOR_THEMES.map((theme) => {
                    const active = selectedColor === theme.id;
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => {
                          romanticAudio.playSoftClick();
                          setSelectedColor(theme.id);
                        }}
                        title={theme.label}
                        style={{ backgroundColor: theme.swatchHex }}
                        className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer ${
                          active
                            ? 'scale-115 border-stone-900 ring-2 ring-stone-900/25'
                            : 'border-white shadow-xs hover:scale-105'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Pin Sticker Picker */}
              <div className="mb-5">
                <span className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
                  Corner Sticker
                </span>
                <div className="flex items-center gap-2">
                  {STICKER_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        romanticAudio.playSoftClick();
                        setSelectedEmoji(emoji);
                      }}
                      className={`w-8 h-8 rounded-lg border text-sm flex items-center justify-center transition-all cursor-pointer ${
                        selectedEmoji === emoji
                          ? 'bg-stone-900 text-white border-stone-900 scale-110'
                          : 'bg-stone-50 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !wishText.trim()}
                className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold text-white bg-stone-900 hover:bg-stone-800 disabled:opacity-60 transition-all inline-flex items-center justify-center gap-2 cursor-pointer btn-3d-dark"
              >
                <Plus className="w-4 h-4 text-amber-300" />
                <span>
                  {isSubmitting
                    ? 'Pinning to Wall...'
                    : 'Pin 3D Sticky Note to Wall'}
                </span>
              </button>

              {toastMsg && (
                <div className="mt-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{toastMsg}</span>
                </div>
              )}
            </form>
          </div>

          {/* Right Column (8 cols): 3D Corkboard / Keepsake Sticky Notes Grid */}
          <div className="lg:col-span-8">
            {isLoading ? (
              <div className="p-12 rounded-3xl bg-white/80 border border-stone-200 text-center text-sm text-stone-500">
                Loading your Firestore Birthday Wishes Wall...
              </div>
            ) : wishes.length === 0 ? (
              <div className="p-10 sm:p-12 rounded-3xl bg-white border border-dashed border-stone-300 text-center paper-texture card-3d-tilt">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-serif font-bold text-stone-900">
                  Your Birthday Wishes Wall is Ready!
                </h3>
                <p className="mt-1.5 text-xs sm:text-sm text-stone-600 max-w-md mx-auto">
                  Write your first 3D sticky note on the left, or click below to
                  pin 3 heartfelt starter sticky notes from {boyfriendName || 'Anik'}{' '}
                  directly to Firestore!
                </p>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={(e) => void handleSeedStarterNotes(e)}
                  className="mt-5 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-rose-700 hover:bg-rose-800 transition-all inline-flex items-center gap-2 cursor-pointer btn-3d-rose"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Pin 3 Starter Sibling Sticky Notes</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 perspective-1200">
                {wishes.map((note, idx) => {
                  const colorCfg =
                    NOTE_COLOR_THEMES.find((c) => c.id === note.noteColor) ||
                    NOTE_COLOR_THEMES[0];
                  const rotClass = rotations[idx % rotations.length];

                  return (
                    <div
                      key={note.id}
                      style={{ background: colorCfg.cardBg }}
                      className={`${rotClass} relative rounded-2xl p-6 border ${colorCfg.border} text-stone-900 sticky-note-ink shadow-[0_8px_0_0_rgba(120,113,108,0.22),0_16px_28px_-6px_rgba(28,25,23,0.16)] transition-all duration-300 hover:rotate-0 hover:-translate-y-1.5 flex flex-col justify-between min-h-[210px]`}
                    >
                      {/* 3D Metallic Pushpin at Top Center */}
                      <div
                        aria-hidden="true"
                        className={`absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full border-2 shadow-md flex items-center justify-center ${colorCfg.pinColor}`}
                      >
                        <div className="w-2 h-2 rounded-full bg-white/80" />
                      </div>

                      <div>
                        {/* Sticker Emoji & Delete Button */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="text-2xl select-none">
                            {note.stickerEmoji}
                          </span>
                          <button
                            type="button"
                            onClick={() => void handleDeleteWish(note.id)}
                            title="Remove sticky note from wall"
                            className="p-1.5 rounded-lg text-stone-700/60 hover:text-rose-700 hover:bg-white/50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Handwritten Sticky Note Body */}
                        <p className="text-xl sm:text-2xl font-anik-handwriting text-stone-900 sticky-note-ink leading-snug break-words">
                          "{note.wishText}"
                        </p>
                      </div>

                      {/* Sticky Note Footer Signature */}
                      <div className="mt-4 pt-3 border-t border-stone-900/10 flex items-center justify-between text-xs text-stone-800 sticky-note-ink">
                        <span className="font-serif font-bold italic inline-flex items-center gap-1">
                          <Heart className="w-3 h-3 text-rose-600 fill-rose-600" />
                          <span>— {note.senderName}</span>
                        </span>
                        <span className="text-[10px] font-mono opacity-75">
                          {new Date(note.createdAtMs).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
