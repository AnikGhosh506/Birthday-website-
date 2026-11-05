import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { QuizQuestion } from '../types';
import { EXTENDED_QUIZ_POOL } from '../data/defaultData';
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  Award,
  Sparkles,
  RefreshCw,
  Trophy,
  ListChecks,
  PartyPopper,
} from 'lucide-react';
import { triggerConfettiExplosion } from '../utils/confettiExplosion';
import { romanticAudio } from '../utils/audioSynth';
import { triggerGlobalFireworksShow } from './FireworksShowCanvas';

interface CoupleQuizProps {
  quiz: QuizQuestion[];
  girlfriendName: string;
}

const RELOAD_COUNTER_KEY = 'amore_quiz_reload_counter_v2';
const SEEN_QUESTIONS_KEY = 'amore_quiz_seen_questions_v2';

function pickUniqueFiveFromPool(
  reloadIndex: number,
  fallbackQuiz: QuizQuestion[]
): QuizQuestion[] {
  const pool =
    EXTENDED_QUIZ_POOL.length >= 5 ? EXTENDED_QUIZ_POOL : fallbackQuiz;
  const total = pool.length;
  const start = (reloadIndex * 5) % total;
  const selected: QuizQuestion[] = [];
  for (let i = 0; i < 5; i++) {
    const item = pool[(start + i) % total];
    selected.push({
      ...item,
      id: `q-reload-${reloadIndex}-${i + 1}`,
    });
  }
  return selected;
}

function sanitizeAIQuestions(
  rawList: unknown[],
  fallbackSet: QuizQuestion[]
): QuizQuestion[] {
  const sanitized: QuizQuestion[] = [];
  rawList.forEach((raw, idx) => {
    if (!raw || typeof raw !== 'object') return;
    const item = raw as Record<string, unknown>;
    const qText = typeof item.question === 'string' ? item.question.trim() : '';
    const rawOpts = Array.isArray(item.options) ? item.options : [];
    const opts = rawOpts
      .map((o) => (typeof o === 'string' ? o.trim() : String(o ?? '').trim()))
      .filter((o) => o.length > 0)
      .slice(0, 4);

    if (!qText || opts.length < 4) return;

    const rawCorrect = Number(item.correctIndex);
    const correctIndex =
      Number.isInteger(rawCorrect) && rawCorrect >= 0 && rawCorrect < 4
        ? rawCorrect
        : 0;
    const explanation =
      typeof item.explanation === 'string' && item.explanation.trim().length > 0
        ? item.explanation.trim()
        : fallbackSet[idx % fallbackSet.length]?.explanation ||
          'Every sibling memory is special!';

    sanitized.push({
      id: `ai-q-${Date.now()}-${idx + 1}`,
      question: qText,
      options: opts,
      correctIndex,
      explanation,
    });
  });

  // Fill any missing slots from fallbackSet if AI returned fewer than 5 valid items
  let fillIdx = 0;
  while (sanitized.length < 5 && fillIdx < fallbackSet.length) {
    const candidate = fallbackSet[fillIdx];
    if (!sanitized.some((s) => s.question === candidate.question)) {
      sanitized.push({
        ...candidate,
        id: `ai-fallback-${Date.now()}-${sanitized.length + 1}`,
      });
    }
    fillIdx++;
  }

  return sanitized.slice(0, 5);
}

function getQuizRankDetails(score: number, total: number, sisName: string) {
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;
  if (score === total) {
    return {
      rankTitle: '👑 Supreme Queen Big Sister · 100% Sibling Telepathy!',
      rankSubtitle: `Flawless ${score}/${total}! You remember every single inside joke, late-night chat, and childhood memory with Anik!`,
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
      pct,
    };
  }
  if (score >= 4) {
    return {
      rankTitle: '🌟 Legendary Big Sis · Certified Best Friend!',
      rankSubtitle: `Amazing ${score}/${total} score, ${sisName}! Your sibling memory bank is practically unbeatable.`,
      badgeColor: 'bg-rose-100 text-rose-900 border-rose-300',
      pct,
    };
  }
  if (score >= 3) {
    return {
      rankTitle: '💖 Iconic Older Sister · Partner-in-Crime!',
      rankSubtitle: `Great job scoring ${score}/${total}! Check out the sibling memory notes below and try a fresh AI set anytime.`,
      badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      pct,
    };
  }
  return {
    rankTitle: '🎂 Forever Best Big Sis · Ready for Round Two!',
    rankSubtitle: `You scored ${score}/${total}! Read Anik's memory notes below or hit Retry to get 5/5!`,
    badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
    pct,
  };
}

export const CoupleQuiz: React.FC<CoupleQuizProps> = ({
  quiz,
  girlfriendName,
}) => {
  // Every page reload increments the counter so 5 different questions appear immediately
  const [reloadBatchIndex, setReloadBatchIndex] = useState<number>(() => {
    try {
      const prev = Number(localStorage.getItem(RELOAD_COUNTER_KEY) || '0');
      const next = prev + 1;
      localStorage.setItem(RELOAD_COUNTER_KEY, String(next));
      return next;
    } catch {
      return Math.floor(Math.random() * 100);
    }
  });

  const [activeQuestions, setActiveQuestions] = useState<QuizQuestion[]>(() =>
    pickUniqueFiveFromPool(reloadBatchIndex, quiz)
  );
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>(
    {}
  );
  const [showResults, setShowResults] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<'questions' | 'results'>(
    'questions'
  );
  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);
  const [aiBadgeText, setAiBadgeText] = useState<string>(
    '5 Unique Questions · Fresh Set Loaded'
  );

  const fetchAIQuizQuestions = useCallback(
    async (isManualTrigger = false) => {
      setIsGeneratingAI(true);
      if (isManualTrigger) {
        romanticAudio.playSoftClick();
      }
      try {
        let seenQuestions: string[] = [];
        try {
          const raw = sessionStorage.getItem(SEEN_QUESTIONS_KEY);
          if (raw) seenQuestions = JSON.parse(raw);
        } catch {}

        const response = await fetch('/api/ai/quiz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            previousQuestions: [
              ...seenQuestions.slice(-15),
              ...activeQuestions.map((q) => q.question),
            ],
            reloadNonce: Date.now(),
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data.questions) && data.questions.length > 0) {
            const fallbackSlice = pickUniqueFiveFromPool(
              reloadBatchIndex + 1,
              quiz
            );
            const cleanFive = sanitizeAIQuestions(
              data.questions,
              fallbackSlice
            );
            if (cleanFive.length === 5) {
              setActiveQuestions(cleanFive);
              setSelectedAnswers({});
              setShowResults(false);
              setActiveView('questions');
              setAiBadgeText('5 Unique AI Questions · Freshly Generated');
              try {
                const updatedSeen = [
                  ...seenQuestions,
                  ...cleanFive.map((q: QuizQuestion) => q.question),
                ].slice(-25);
                sessionStorage.setItem(
                  SEEN_QUESTIONS_KEY,
                  JSON.stringify(updatedSeen)
                );
              } catch {}
              setIsGeneratingAI(false);
              return;
            }
          }
        }
      } catch {
        // Fallback to next rotating 5-question slice from EXTENDED_QUIZ_POOL
      }

      if (isManualTrigger) {
        const nextIdx = reloadBatchIndex + 1;
        setReloadBatchIndex(nextIdx);
        try {
          localStorage.setItem(RELOAD_COUNTER_KEY, String(nextIdx));
        } catch {}
        setActiveQuestions(pickUniqueFiveFromPool(nextIdx, quiz));
        setSelectedAnswers({});
        setShowResults(false);
        setActiveView('questions');
        setAiBadgeText('5 Fresh Sibling Trivia Questions Loaded');
      }
      setIsGeneratingAI(false);
    },
    [activeQuestions, quiz, reloadBatchIndex]
  );

  // Automatically request 5 unique AI-generated questions on page reload
  useEffect(() => {
    void fetchAIQuizQuestions(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectOption = (
    questionId: string,
    optionIndex: number,
    e?: React.MouseEvent<HTMLButtonElement>
  ) => {
    if (selectedAnswers[questionId] !== undefined) return;

    const targetQuestion = activeQuestions.find((q) => q.id === questionId);
    const isAnsweredCorrectly =
      targetQuestion && optionIndex === targetQuestion.correctIndex;

    if (isAnsweredCorrectly) {
      romanticAudio.playMatchSuccess();
    } else {
      romanticAudio.playMissSound();
    }

    const clickCoords = e
      ? { clientX: e.clientX, clientY: e.clientY }
      : undefined;

    const next = { ...selectedAnswers, [questionId]: optionIndex };
    setSelectedAnswers(next);

    // If all 5 answered, open Results Summary Page & trigger multi-stage confetti explosion
    if (Object.keys(next).length === activeQuestions.length) {
      setTimeout(() => {
        setShowResults(true);
        setActiveView('results');
        romanticAudio.playCelebrationChime();
        triggerConfettiExplosion(clickCoords);
      }, 580);
    }
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setShowResults(false);
    setActiveView('questions');
    romanticAudio.playSoftClick();
  };

  const answeredCount = Object.keys(selectedAnswers).length;
  const totalQuestions = activeQuestions.length || 5;
  const progressPercentage = Math.round((answeredCount / totalQuestions) * 100);

  const correctCount = activeQuestions.filter(
    (q) => selectedAnswers[q.id] === q.correctIndex
  ).length;

  const rankDetails = getQuizRankDetails(
    correctCount,
    totalQuestions,
    girlfriendName || 'Atrayee'
  );

  return (
    <section
      id="quiz"
      className="py-20 border-b border-stone-200/80 bg-stone-50/50"
    >
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-rose-800 uppercase tracking-widest mb-2">
            <span>Chapter 06</span>
            <span aria-hidden="true">·</span>
            <span>AI-Powered Sibling Trivia (5 Questions)</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-stone-900 heading-3d">
            The Ultimate Sisterhood Quiz
          </h2>
          <p className="mt-2 text-sm sm:text-base text-stone-600 font-sans">
            5 unique questions generated fresh for {girlfriendName} every time
            the page reloads — inspired by real sibling memories & WhatsApp
            chats!
          </p>

          {/* AI Status & Instant Regenerate Bar */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-50 border border-rose-200/80 text-xs font-medium text-rose-900">
              <Sparkles className="w-3.5 h-3.5 text-rose-600" />
              <span>{aiBadgeText}</span>
            </span>

            <button
              type="button"
              onClick={() => void fetchAIQuizQuestions(true)}
              disabled={isGeneratingAI}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 disabled:opacity-60 text-white text-xs font-semibold transition-all cursor-pointer btn-3d-dark"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isGeneratingAI ? 'animate-spin' : ''}`}
              />
              <span>
                {isGeneratingAI
                  ? 'AI Generating 5 New Questions...'
                  : 'Ask AI for 5 New Questions'}
              </span>
            </button>
          </div>
        </div>

        {/* Interactive Quiz Progress Bar & Question Stepper */}
        <div className="mb-8 p-5 sm:p-6 rounded-2xl bg-white border border-stone-200/90 shadow-sm paper-texture">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-stone-900 text-amber-300 text-xs font-bold">
                {answeredCount}/{totalQuestions}
              </span>
              <div>
                <h3 className="text-xs sm:text-sm font-serif font-bold text-stone-900">
                  Quiz Completion Progress · {progressPercentage}%
                </h3>
                <p className="text-[11px] text-stone-500">
                  {answeredCount === totalQuestions
                    ? 'All 5 questions completed! View your Results Summary below.'
                    : `Answer ${
                        totalQuestions - answeredCount
                      } more question${
                        totalQuestions - answeredCount === 1 ? '' : 's'
                      } to unlock your Results Summary Page`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                Score: {correctCount}/{totalQuestions}
              </span>

              {showResults && (
                <button
                  type="button"
                  onClick={() => {
                    romanticAudio.playSoftClick();
                    setActiveView((prev) =>
                      prev === 'results' ? 'questions' : 'results'
                    );
                  }}
                  className="px-3 py-1 rounded-full bg-stone-900 text-white hover:bg-stone-800 text-xs font-semibold transition-colors cursor-pointer"
                >
                  {activeView === 'results'
                    ? 'View Question Cards'
                    : 'View Results Summary'}
                </button>
              )}
            </div>
          </div>

          {/* Animated Gradient Progress Bar Track */}
          <div className="w-full h-3 rounded-full bg-stone-200/80 overflow-hidden p-0.5 shadow-inner">
            <div
              style={{ width: `${Math.max(4, progressPercentage)}%` }}
              className="h-full rounded-full bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 transition-all duration-500 ease-out"
            />
          </div>

          {/* 5 Stepper Pills (Q1 - Q5) */}
          <div className="mt-3.5 grid grid-cols-5 gap-2">
            {activeQuestions.map((q, idx) => {
              const isAnswered = selectedAnswers[q.id] !== undefined;
              const isRight = selectedAnswers[q.id] === q.correctIndex;
              return (
                <div
                  key={q.id}
                  className={`px-2 py-1.5 rounded-xl border text-center text-xs font-semibold transition-all flex items-center justify-center gap-1 ${
                    !isAnswered
                      ? 'bg-stone-50 text-stone-500 border-stone-200'
                      : isRight
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-400'
                      : 'bg-rose-50 text-rose-900 border-rose-300'
                  }`}
                >
                  <span>Q{idx + 1}</span>
                  {isAnswered &&
                    (isRight ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    ))}
                </div>
              );
            })}
          </div>
        </div>

        {/* VIEW 1: Dedicated 'Results' Summary Page at the End of the 5-Question Quiz */}
        {showResults && activeView === 'results' ? (
          <div className="rounded-3xl bg-white border-2 border-amber-300/90 p-6 sm:p-10 shadow-xl paper-texture">
            {/* Top Celebration Header & Score Medallion */}
            <div className="text-center pb-8 border-b border-stone-200/90">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-stone-900 text-amber-300 shadow-lg mb-4 border-2 border-amber-400">
                <Trophy className="w-10 h-10" />
              </div>

              <div className="block">
                <span
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold border ${rankDetails.badgeColor}`}
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>{rankDetails.rankTitle}</span>
                </span>
              </div>

              <h3 className="mt-4 text-3xl sm:text-4xl font-serif font-bold text-stone-900 heading-3d">
                Quiz Results: {correctCount} out of {totalQuestions} ({rankDetails.pct}%)
              </h3>
              <p className="mt-2 text-sm sm:text-base text-stone-600 max-w-xl mx-auto leading-relaxed">
                {rankDetails.rankSubtitle}
              </p>

              {/* Results Action Bar */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => void fetchAIQuizQuestions(true)}
                  disabled={isGeneratingAI}
                  className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-rose-700 hover:bg-rose-800 transition-all inline-flex items-center gap-2 cursor-pointer btn-3d-rose"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Play 5 New AI Questions</span>
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-stone-800 bg-white hover:bg-stone-50 border border-stone-300 transition-all inline-flex items-center gap-2 cursor-pointer tile-3d-extruded"
                >
                  <RotateCcw className="w-4 h-4 text-stone-700" />
                  <span>Retry Same 5</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    romanticAudio.playCelebrationChime();
                    triggerConfettiExplosion({
                      clientX: e.clientX,
                      clientY: e.clientY,
                    });
                    triggerGlobalFireworksShow();
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-amber-950 bg-amber-100 hover:bg-amber-200 border border-amber-300 transition-all inline-flex items-center gap-2 cursor-pointer tile-3d-extruded"
                >
                  <PartyPopper className="w-4 h-4 text-amber-700" />
                  <span>Celebrate Fireworks</span>
                </button>
              </div>
            </div>

            {/* Detailed Question-by-Question Answer Breakdown */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-base sm:text-lg font-serif font-bold text-stone-900 inline-flex items-center gap-2">
                  <ListChecks className="w-5 h-5 text-rose-700" />
                  <span>Complete 5-Question Answer Breakdown</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setActiveView('questions')}
                  className="text-xs font-semibold text-rose-700 hover:text-rose-900 underline cursor-pointer"
                >
                  Switch to Card View
                </button>
              </div>

              <div className="space-y-4">
                {activeQuestions.map((q, idx) => {
                  const userChoice = selectedAnswers[q.id];
                  const isRight = userChoice === q.correctIndex;
                  return (
                    <div
                      key={q.id}
                      className={`p-4 sm:p-5 rounded-2xl border bg-white ${
                        isRight ? 'border-emerald-300' : 'border-rose-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                          Question #{idx + 1}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            isRight
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {isRight ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Correct</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Missed</span>
                            </>
                          )}
                        </span>
                      </div>

                      <p className="mt-1.5 font-serif font-bold text-base text-stone-900">
                        {q.question}
                      </p>

                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div
                          className={`p-2.5 rounded-xl border ${
                            isRight
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                              : 'bg-rose-50 border-rose-200 text-rose-950'
                          }`}
                        >
                          <span className="font-bold block text-[10px] uppercase tracking-wider opacity-75">
                            Your Answer
                          </span>
                          <span className="font-semibold">
                            {userChoice !== undefined
                              ? q.options[userChoice]
                              : 'Not answered'}
                          </span>
                        </div>

                        {!isRight && (
                          <div className="p-2.5 rounded-xl border bg-emerald-50 border-emerald-200 text-emerald-950">
                            <span className="font-bold block text-[10px] uppercase tracking-wider opacity-75">
                              Correct Answer
                            </span>
                            <span className="font-semibold">
                              {q.options[q.correctIndex]}
                            </span>
                          </div>
                        )}
                      </div>

                      <p className="mt-3 text-xs text-stone-600 italic">
                        💡 {q.explanation}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* VIEW 2: 5 Interactive Quiz Question Cards — With Framer Motion Bounce & Shake */
          <div className="space-y-6">
            {activeQuestions.map((q, idx) => {
              const hasAnswered = selectedAnswers[q.id] !== undefined;
              const chosenOption = selectedAnswers[q.id];
              const isQuestionCorrect =
                hasAnswered && chosenOption === q.correctIndex;
              const isQuestionIncorrect =
                hasAnswered && chosenOption !== q.correctIndex;

              return (
                <motion.div
                  key={q.id}
                  initial={false}
                  animate={
                    isQuestionCorrect
                      ? {
                          y: [0, -12, 0, -6, 0],
                          scale: [1, 1.02, 1, 1.01, 1],
                        }
                      : isQuestionIncorrect
                        ? {
                            x: [0, -10, 10, -8, 8, -4, 4, 0],
                          }
                        : { x: 0, y: 0, scale: 1 }
                  }
                  transition={{
                    duration: isQuestionCorrect ? 0.52 : 0.45,
                    ease: 'easeInOut',
                  }}
                  className={`relative bg-white border rounded-2xl p-6 sm:p-8 shadow-[0_6px_0_0_#d6cec2,0_12px_24px_-6px_rgba(43,37,35,0.12)] transition-colors duration-200 ${
                    isQuestionCorrect
                      ? 'border-emerald-400'
                      : isQuestionIncorrect
                        ? 'border-rose-300'
                        : 'border-stone-200 hover:-translate-y-1'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs font-mono text-stone-500 mb-3">
                    <span className="font-semibold text-stone-600">
                      QUESTION {idx + 1} OF {activeQuestions.length}
                    </span>
                    <span className="text-[11px] text-rose-700 font-sans font-medium">
                      {hasAnswered
                        ? isQuestionCorrect
                          ? '✓ Correct · Sibling Telepathy!'
                          : '✗ Missed · Check Anik’s Note Below'
                        : `Unique AI Question #${idx + 1}`}
                    </span>
                  </div>

                  {/* Full-width, unobstructed question heading */}
                  <h3
                    style={{
                      textShadow:
                        '0 1px 0 #e7e0d8, 0 2px 4px rgba(43, 37, 35, 0.08)',
                    }}
                    className="block w-full font-serif text-lg sm:text-xl font-bold text-stone-900 leading-relaxed break-words whitespace-normal mb-5"
                  >
                    {q.question}
                  </h3>

                  {/* 3D Extruded Option Buttons with Framer Motion Bounce / Shake */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = chosenOption === optIdx;
                      const isCorrect = optIdx === q.correctIndex;

                      let btnStyle =
                        'bg-stone-50 hover:bg-stone-100/80 border-stone-200 text-stone-900 tile-3d-extruded';

                      if (hasAnswered) {
                        if (isCorrect) {
                          btnStyle =
                            'bg-emerald-50 border-emerald-500 text-emerald-950 font-semibold shadow-[0_4px_0_0_#10b981]';
                        } else if (isSelected) {
                          btnStyle =
                            'bg-rose-50 border-rose-400 text-rose-950 font-medium shadow-[0_4px_0_0_#fb7185]';
                        } else {
                          btnStyle =
                            'border-stone-200 bg-stone-100/70 text-stone-500';
                        }
                      }

                      return (
                        <motion.button
                          key={optIdx}
                          type="button"
                          disabled={hasAnswered}
                          onClick={(e) => handleSelectOption(q.id, optIdx, e)}
                          initial={false}
                          animate={
                            hasAnswered && isSelected && isCorrect
                              ? {
                                  y: [0, -8, 0, -4, 0],
                                  scale: [1, 1.04, 1],
                                }
                              : hasAnswered && isSelected && !isCorrect
                                ? {
                                    x: [0, -8, 8, -6, 6, -3, 3, 0],
                                  }
                                : { x: 0, y: 0, scale: 1 }
                          }
                          transition={{
                            duration: 0.45,
                            ease: 'easeInOut',
                          }}
                          className={`w-full p-4 rounded-xl border text-left text-sm sm:text-base leading-snug transition-colors duration-200 flex items-start justify-between gap-3 cursor-pointer ${btnStyle}`}
                        >
                          <span className="flex-1 break-words whitespace-normal">
                            {opt}
                          </span>
                          {hasAnswered && isCorrect && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          )}
                          {hasAnswered && isSelected && !isCorrect && (
                            <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          )}
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Explanation text after answer */}
                  {hasAnswered && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                      className="mt-4 pt-3 border-t border-stone-200/80 text-xs sm:text-sm text-stone-700 font-sans italic leading-relaxed break-words"
                    >
                      💡 {q.explanation}
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
