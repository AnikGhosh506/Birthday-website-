import React, { useState, useEffect, useMemo } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { db, auth } from '../firebase';
import {
  Sparkles,
  Heart,
  CheckCircle2,
  Shuffle,
  Calendar,
  Sun,
  BookOpenCheck,
} from 'lucide-react';
import { romanticAudio } from '../utils/audioSynth';
import { triggerConfettiExplosion } from '../utils/confettiExplosion';

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

interface DailyAffirmationsSectionProps {
  girlfriendName: string;
  boyfriendName: string;
}

interface AffirmationCardItem {
  id: string;
  kicker: string;
  title: string;
  message: string;
  blessing: string;
  accentColor: string;
}

interface PersistedAffirmationRecord {
  id: string;
  authorUid: string;
  dateKey: string;
  affirmationId: string;
  affirmationTitle: string;
  affirmationText: string;
  status: 'Read';
  createdAt?: Timestamp | null;
}

const DAILY_AFFIRMATIONS_DECK: AffirmationCardItem[] = [
  {
    id: 'aff-01',
    kicker: 'Strength & Grace',
    title: 'You Are the Heartbeat of Our Home',
    message:
      'No matter where life takes us — from our childhood rooms in Durgapur to NIT and Bangalore — your warmth, wisdom, and quiet strength make everything brighter. Never forget how deeply you are loved and admired.',
    blessing: 'Today, may every step you take feel light, confident, and protected.',
    accentColor: 'from-amber-100 via-rose-50 to-amber-50',
  },
  {
    id: 'aff-02',
    kicker: 'Unstoppable Brilliance',
    title: 'Your Dreams Deserve Every Sky',
    message:
      'I have watched you work tirelessly and carry yourself with so much dignity even on the hardest days. You are capable of achieving every single milestone your heart has ever wished for, Didi.',
    blessing: 'May today bring you a moment of pure pride in how far you have come.',
    accentColor: 'from-rose-100 via-pink-50 to-amber-50',
  },
  {
    id: 'aff-03',
    kicker: 'Little Brother Reminder',
    title: 'You Never Have to Carry It All Alone',
    message:
      'Even when you are being the strong, responsible older sister for everyone else, remember you always have your little brother in your corner — ready with Magnum ice cream, bad jokes, and a listening ear at 3:30 AM.',
    blessing: 'Give yourself permission to rest, laugh, and be celebrated today.',
    accentColor: 'from-emerald-50 via-amber-50 to-rose-50',
  },
  {
    id: 'aff-04',
    kicker: 'Radiant Kindness',
    title: 'Your Kindness Leaves a Mark Everywhere',
    message:
      'The way you care for the people around you is rare and precious. Every person lucky enough to know you leaves happier — and I am the luckiest of all to call you my sister.',
    blessing: 'May the kindness you pour into the world return to you tenfold today.',
    accentColor: 'from-purple-100/70 via-rose-50 to-amber-50',
  },
  {
    id: 'aff-05',
    kicker: 'Joy & Peace',
    title: 'Your Smile Is Our Favorite Festival',
    message:
      'Like Kali Pujo lights back home, your laughter turns an ordinary evening into a celebration. Keep shining your authentic, fearless light — the world is better with you in it.',
    blessing: 'May something unexpectedly sweet make you smile wide today.',
    accentColor: 'from-amber-100 via-orange-50 to-rose-100',
  },
  {
    id: 'aff-06',
    kicker: 'Lifelong Pride',
    title: 'My Forever Role Model & Best Friend',
    message:
      'Whenever someone asks who inspires me most, the answer is always you. Thank you for guiding me, protecting me, and showing me what true grace looks like every single day.',
    blessing: 'Walk through today knowing your little brother is cheering for you always.',
    accentColor: 'from-rose-100 via-amber-50 to-stone-100',
  },
  {
    id: 'aff-07',
    kicker: 'New Chapter Energy',
    title: 'The Best Days of Our Story Are Still Ahead',
    message:
      'More reunions, more late-night movie marathons, more street-food walks, and more big wins await us. You are blooming into your happiest, strongest chapter yet.',
    blessing: 'May peace, good health, and joyful surprises follow you all day long.',
    accentColor: 'from-teal-50 via-amber-50 to-rose-50',
  },
];

function getTodayDateKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDailyDefaultIndex(dateKey: string, total: number): number {
  let hash = 0;
  for (let i = 0; i < dateKey.length; i++) {
    hash = (hash * 31 + dateKey.charCodeAt(i)) % 1000003;
  }
  return Math.abs(hash) % total;
}

export const DailyAffirmationsSection: React.FC<
  DailyAffirmationsSectionProps
> = ({ girlfriendName, boyfriendName }) => {
  const todayDateKey = useMemo(() => getTodayDateKey(), []);
  const [currentUser, setCurrentUser] = useState<User | null>(() => auth.currentUser);
  const [activeIndex, setActiveIndex] = useState<number>(() =>
    getDailyDefaultIndex(todayDateKey, DAILY_AFFIRMATIONS_DECK.length)
  );
  const [readRecords, setReadRecords] = useState<PersistedAffirmationRecord[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isFlippingCard, setIsFlippingCard] = useState<boolean>(false);

  // Track Firebase Auth user
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setCurrentUser(u);
    });
    return () => unsub();
  }, []);

  // Subscribe to Firestore /dailyAffirmations for the logged-in user
  useEffect(() => {
    if (!currentUser?.uid) {
      setReadRecords([]);
      return;
    }

    const path = 'dailyAffirmations';
    const q = query(
      collection(db, path),
      where('authorUid', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: PersistedAffirmationRecord[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          items.push({
            id: docSnap.id,
            authorUid: String(data.authorUid || ''),
            dateKey: String(data.dateKey || ''),
            affirmationId: String(data.affirmationId || ''),
            affirmationTitle: String(data.affirmationTitle || ''),
            affirmationText: String(data.affirmationText || ''),
            status: 'Read',
            createdAt: data.createdAt || null,
          });
        });
        items.sort((a, b) => b.dateKey.localeCompare(a.dateKey));
        setReadRecords(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );

    return () => unsubscribe();
  }, [currentUser?.uid]);

  const currentAffirmation = DAILY_AFFIRMATIONS_DECK[activeIndex];

  // Check if the currently displayed affirmation is already marked 'Read' in Firestore
  const isCurrentAffirmationRead = useMemo(() => {
    return readRecords.some(
      (r) =>
        r.affirmationId === currentAffirmation.id ||
        (r.dateKey === todayDateKey && r.affirmationId === currentAffirmation.id)
    );
  }, [readRecords, currentAffirmation.id, todayDateKey]);

  const isTodayRead = useMemo(() => {
    return readRecords.some((r) => r.dateKey === todayDateKey);
  }, [readRecords, todayDateKey]);

  const handleShuffleAffirmation = () => {
    romanticAudio.playSoftClick();
    setIsFlippingCard(true);
    window.setTimeout(() => {
      setActiveIndex((prev) => {
        if (DAILY_AFFIRMATIONS_DECK.length <= 1) return 0;
        let next = prev;
        while (next === prev) {
          next = Math.floor(Math.random() * DAILY_AFFIRMATIONS_DECK.length);
        }
        return next;
      });
      setIsFlippingCard(false);
    }, 220);
  };

  const handleMarkAsRead = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!currentUser?.uid || isSaving || isCurrentAffirmationRead) return;

    const clickPos = { clientX: e.clientX, clientY: e.clientY };
    setIsSaving(true);

    // Deterministic, regex-safe document ID combining user UID, dateKey, and affirmationId
    const safeUid = currentUser.uid.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 48);
    const docId = `${safeUid}_${todayDateKey}_${currentAffirmation.id}`;
    const path = `dailyAffirmations/${docId}`;

    try {
      await setDoc(doc(db, 'dailyAffirmations', docId), {
        authorUid: currentUser.uid,
        dateKey: todayDateKey,
        affirmationId: currentAffirmation.id,
        affirmationTitle: currentAffirmation.title.slice(0, 120),
        affirmationText: currentAffirmation.message.slice(0, 600),
        status: 'Read',
        createdAt: serverTimestamp(),
      });

      romanticAudio.playCelebrationChime();
      triggerConfettiExplosion(clickPos);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section
      id="daily-affirmations"
      className="relative py-20 border-b border-stone-200/80 bg-stone-50/60 overflow-hidden"
    >
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-800 uppercase tracking-widest mb-2">
              <Sun className="w-3.5 h-3.5 text-amber-600" />
              <span>Daily Sibling Sunshine</span>
              <span aria-hidden="true">·</span>
              <span>Persisted in Cloud Keepsake</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-stone-900 heading-3d">
              Daily Affirmations from {boyfriendName}
            </h2>
            <p className="mt-2 text-sm sm:text-base text-stone-600 max-w-2xl">
              A randomized, heartfelt 3D message for {girlfriendName} each day — mark each affirmation as <strong>Read</strong> to save it permanently in your keepsake journal.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-stone-200/90 text-xs font-semibold text-stone-700 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-rose-600" />
              <span>Today: {todayDateKey}</span>
              {isTodayRead && (
                <span className="ml-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                  ✓ Today Read
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleShuffleAffirmation}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold cursor-pointer btn-3d-dark"
            >
              <Shuffle className="w-3.5 h-3.5 text-amber-300" />
              <span>Draw Another Affirmation</span>
            </button>
          </div>
        </div>

        {/* Main 3D Affirmation Stage + Persisted Read History */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left 7 Columns: 3D Extruded Daily Affirmation Card */}
          <div className="lg:col-span-7 perspective-1200">
            <div
              className={`relative rounded-3xl border-2 p-6 sm:p-10 bg-gradient-to-br ${
                currentAffirmation.accentColor
              } paper-texture card-3d-tilt transition-all duration-300 ${
                isCurrentAffirmationRead
                  ? 'border-emerald-300/90'
                  : 'border-amber-300/90'
              } ${
                isFlippingCard
                  ? 'opacity-0 scale-95 rotate-y-12'
                  : 'opacity-100 scale-100'
              }`}
            >
              {/* Top Card Badge & Read Status Stamp */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-stone-200/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-rose-700 text-white flex items-center justify-center shadow-md">
                    <Heart className="w-5 h-5 fill-white" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-widest text-rose-800">
                      {currentAffirmation.kicker} · Daily Note
                    </div>
                    <div className="text-xs text-stone-500">
                      For {girlfriendName} · From {boyfriendName}
                    </div>
                  </div>
                </div>

                {/* 3D Status Badge */}
                {isCurrentAffirmationRead ? (
                  <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider stamp-3d-redeemed">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Read & Saved ✓</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-100 border border-amber-300 text-amber-900 text-xs font-semibold">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Unread Today</span>
                  </div>
                )}
              </div>

              {/* 3D Extruded Affirmation Heading */}
              <h3 className="mt-6 font-serif text-2xl sm:text-3xl font-bold text-stone-900 heading-3d">
                "{currentAffirmation.title}"
              </h3>

              {/* Handwritten Fountain-Pen Message */}
              <p className="mt-4 text-2xl sm:text-[27px] text-[#1e3a8a] font-anik-handwriting leading-relaxed">
                Dearest {girlfriendName} Didi,{' '}
                {currentAffirmation.message}
              </p>

              {/* Daily Blessing Box */}
              <div className="mt-6 p-4 rounded-2xl bg-white/85 border border-rose-200/80 flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-rose-600 shrink-0 mt-1" />
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-rose-800">
                    Today's Sibling Blessing
                  </div>
                  <p className="text-sm font-serif italic text-stone-800 mt-0.5">
                    {currentAffirmation.blessing}
                  </p>
                </div>
              </div>

              {/* Bottom Action Bar: Mark as Read in Firestore */}
              <div className="mt-7 pt-5 border-t border-stone-200/80 flex flex-wrap items-center justify-between gap-4">
                <div className="text-xl text-[#1e3a8a] font-anik-handwriting">
                  — Always cheering for you, {boyfriendName} ♥
                </div>

                {isCurrentAffirmationRead ? (
                  <button
                    type="button"
                    onClick={handleShuffleAffirmation}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer transition-colors shadow-sm"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                    <span>Marked as Read · Draw Another →</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isSaving || !currentUser}
                    onClick={handleMarkAsRead}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white cursor-pointer btn-3d-redeem disabled:opacity-50"
                  >
                    <Heart className="w-4 h-4 fill-white" />
                    <span>
                      {isSaving
                        ? 'Saving Read Status...'
                        : "Mark Today's Affirmation as Read ♥"}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right 5 Columns: Persisted Firestore 'Read' Affirmations Log */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-stone-200/90 p-6 shadow-xs card-3d-tilt">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200/80">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-stone-900 text-amber-300 flex items-center justify-center shrink-0">
                  <BookOpenCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-serif text-base font-bold text-stone-900">
                    Affirmations Read Archive
                  </h4>
                  <p className="text-xs text-stone-500">
                    Synced with your private Firestore keepsake
                  </p>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-xs font-bold text-rose-800">
                {readRecords.length} Read
              </span>
            </div>

            {readRecords.length === 0 ? (
              <div className="py-10 text-center">
                <Heart className="w-8 h-8 text-rose-300 mx-auto mb-2" />
                <p className="text-sm font-serif font-semibold text-stone-700">
                  No affirmations marked as Read yet
                </p>
                <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
                  Click <strong>"Mark Today's Affirmation as Read ♥"</strong> on the 3D card to save your first daily reminder from {boyfriendName}.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-3 max-h-[340px] overflow-y-auto pr-1">
                {readRecords.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-3.5 rounded-2xl bg-stone-50/90 border border-stone-200/80 flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-mono font-semibold text-stone-600">
                        {rec.dateKey}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold">
                        <CheckCircle2 className="w-3 h-3" />
                        {rec.status}
                      </span>
                    </div>
                    <h5 className="font-serif text-sm font-bold text-stone-900">
                      {rec.affirmationTitle}
                    </h5>
                    <p className="text-base text-[#1e3a8a] font-anik-handwriting line-clamp-2 leading-snug">
                      {rec.affirmationText}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
