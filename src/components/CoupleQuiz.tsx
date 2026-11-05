import React, { useState, useEffect, useCallback } from 'react';
import { QuizQuestion } from '../types';
import { EXTENDED_QUIZ_POOL } from '../data/defaultData';
import { CheckCircle2, XCircle, RotateCcw, Award, Sparkles, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { romanticAudio } from '../utils/audioSynth';

interface CoupleQuizProps {
  quiz: QuizQuestion[];
  girlfriendName: string;
}

const RELOAD_COUNTER_KEY = 'amore_quiz_reload_counter_v2';
const SEEN_QUESTIONS_KEY = 'amore_quiz_seen_questions_v2';

function pickUniqueFiveFromPool(reloadIndex: number, fallbackQuiz: QuizQuestion[]): QuizQuestion[] {
  const pool = EXTENDED_QUIZ_POOL.length >= 5 ? EXTENDED_QUIZ_POOL : fallbackQuiz;
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
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState<boolean>(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);
  const [aiBadgeText, setAiBadgeText] = useState<string>('5 Unique Questions · Fresh Set Loaded');

  const fetchAIQuizQuestions = useCallback(async (isManualTrigger = false) => {
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
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.questions) && data.questions.length === 5) {
          setActiveQuestions(data.questions);
          setSelectedAnswers({});
          setShowResults(false);
          setAiBadgeText('Generated Live by Gemini Flash-Lite AI · 5 Unique Questions');
          try {
            const updatedSeen = [
              ...seenQuestions,
              ...data.questions.map((q: QuizQuestion) => q.question),
            ].slice(-25);
            sessionStorage.setItem(SEEN_QUESTIONS_KEY, JSON.stringify(updatedSeen));
          } catch {}
          setIsGeneratingAI(false);
          return;
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
      setAiBadgeText('5 Fresh Sibling Trivia Questions Loaded');
    }
    setIsGeneratingAI(false);
  }, [activeQuestions, quiz, reloadBatchIndex]);

  // Automatically request 5 unique AI-generated questions on page reload
  useEffect(() => {
    void fetchAIQuizQuestions(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (selectedAnswers[questionId] !== undefined) return;
    romanticAudio.playSoftClick();

    const next = { ...selectedAnswers, [questionId]: optionIndex };
    setSelectedAnswers(next);

    // If all 5 answered, show results & celebration
    if (Object.keys(next).length === activeQuestions.length) {
      setTimeout(() => {
        setShowResults(true);
        romanticAudio.playCelebrationChime();
        confetti({
          particleCount: 55,
          spread: 65,
          origin: { y: 0.8 },
        });
      }, 450);
    }
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setShowResults(false);
    romanticAudio.playSoftClick();
  };

  const correctCount = activeQuestions.filter(
    (q) => selectedAnswers[q.id] === q.correctIndex
  ).length;

  return (
    <section id="quiz" className="py-20 border-b border-stone-200/80 bg-stone-50/50">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-rose-800 uppercase tracking-widest mb-2">
            <span>Chapter 06</span>
            <span aria-hidden="true">·</span>
            <span>AI-Powered Sibling Trivia (5 Questions)</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-stone-900 heading-3d">
            The Ultimate Sisterhood Quiz
          </h2>
          <p className="mt-2 text-sm sm:text-base text-stone-600 font-sans">
            5 unique questions generated fresh for {girlfriendName} every time the page reloads — inspired by real sibling memories & WhatsApp chats!
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
              <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingAI ? 'animate-spin' : ''}`} />
              <span>{isGeneratingAI ? 'AI Generating 5 New Questions...' : 'Ask AI for 5 New Questions'}</span>
            </button>
          </div>
        </div>

        {/* 3D Quiz Questions List (Always 5 Questions) */}
        <div className="space-y-6 perspective-1200">
          {activeQuestions.map((q, idx) => {
            const hasAnswered = selectedAnswers[q.id] !== undefined;
            const chosenOption = selectedAnswers[q.id];

            return (
              <div
                key={q.id}
                className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-xs card-3d-tilt"
              >
                <div className="flex items-center justify-between gap-2 text-xs font-mono text-stone-400 mb-2">
                  <span>QUESTION {idx + 1} OF {activeQuestions.length}</span>
                  <span className="text-[11px] text-rose-700 font-sans font-medium">
                    Unique AI Set
                  </span>
                </div>

                <h3 className="font-serif text-xl font-bold text-stone-900 mb-5 heading-3d">
                  {q.question}
                </h3>

                {/* 3D Extruded Option Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {q.options.map((opt, optIdx) => {
                    const isSelected = chosenOption === optIdx;
                    const isCorrect = optIdx === q.correctIndex;

                    let btnStyle =
                      'bg-stone-50 hover:bg-stone-100/80 border-stone-200 text-stone-800 tile-3d-extruded';

                    if (hasAnswered) {
                      if (isCorrect) {
                        btnStyle =
                          'bg-emerald-50 border-emerald-400 text-emerald-900 font-medium shadow-[0_4px_0_0_#10b981]';
                      } else if (isSelected) {
                        btnStyle =
                          'bg-rose-50 border-rose-300 text-rose-900 shadow-[0_4px_0_0_#fb7185]';
                      } else {
                        btnStyle = 'opacity-40 border-stone-100 bg-stone-50 text-stone-400';
                      }
                    }

                    return (
                      <button
                        key={optIdx}
                        disabled={hasAnswered}
                        onClick={() => handleSelectOption(q.id, optIdx)}
                        className={`p-4 rounded-xl border text-left text-sm transition-all duration-200 flex items-start justify-between gap-3 cursor-pointer ${btnStyle}`}
                      >
                        <span>{opt}</span>
                        {hasAnswered && isCorrect && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        )}
                        {hasAnswered && isSelected && !isCorrect && (
                          <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation text after answer */}
                {hasAnswered && (
                  <div className="mt-4 pt-3 border-t border-stone-100 text-xs sm:text-sm text-stone-600 font-sans italic">
                    💡 {q.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Completion summary */}
        {showResults && (
          <div className="mt-8 p-6 bg-white border border-rose-200 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-serif font-bold text-base text-stone-900">
                  Score: {correctCount} of {activeQuestions.length} Correct!
                </h4>
                <p className="text-xs text-stone-600">
                  {correctCount === activeQuestions.length
                    ? 'A perfect 5/5 score! You remember every single sibling detail ❤️'
                    : `Every moment with you is unforgettable, ${girlfriendName}!`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={handleReset}
                className="px-4 py-2 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry Same 5</span>
              </button>
              <button
                onClick={() => void fetchAIQuizQuestions(true)}
                disabled={isGeneratingAI}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-700 hover:bg-rose-800 rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer btn-3d-rose"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>New 5 AI Questions</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
