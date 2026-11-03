import React, { useState } from 'react';
import { QuizQuestion } from '../types';
import { CheckCircle2, XCircle, RotateCcw, Award } from 'lucide-react';
import confetti from 'canvas-confetti';
import { romanticAudio } from '../utils/audioSynth';

interface CoupleQuizProps {
  quiz: QuizQuestion[];
  girlfriendName: string;
}

export const CoupleQuiz: React.FC<CoupleQuizProps> = ({
  quiz,
  girlfriendName,
}) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState(false);

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (selectedAnswers[questionId] !== undefined) return;
    romanticAudio.playSoftClick();

    const next = { ...selectedAnswers, [questionId]: optionIndex };
    setSelectedAnswers(next);

    // If all answered, show results & celebration
    if (Object.keys(next).length === quiz.length) {
      setTimeout(() => {
        setShowResults(true);
        romanticAudio.playCelebrationChime();
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
        });
      }, 500);
    }
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setShowResults(false);
    romanticAudio.playSoftClick();
  };

  const correctCount = quiz.filter(
    (q) => selectedAnswers[q.id] === q.correctIndex
  ).length;

  return (
    <section id="quiz" className="py-20 border-b border-stone-200/80 bg-stone-50/50">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-rose-800 uppercase tracking-widest mb-2">
            <span>Chapter 06</span>
            <span aria-hidden="true">·</span>
            <span>Memory Check</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-stone-900">
            How Well Do You Know Our Story?
          </h2>
          <p className="mt-2 text-sm sm:text-base text-stone-600 font-sans">
            A lighthearted trivia challenge just for the birthday girl.
          </p>
        </div>

        {/* Quiz Questions List */}
        <div className="space-y-6">
          {quiz.map((q, idx) => {
            const hasAnswered = selectedAnswers[q.id] !== undefined;
            const chosenOption = selectedAnswers[q.id];

            return (
              <div
                key={q.id}
                className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-xs"
              >
                <div className="flex items-center gap-2 text-xs font-mono text-stone-400 mb-2">
                  <span>QUESTION {idx + 1} OF {quiz.length}</span>
                </div>

                <h3 className="font-serif text-xl font-bold text-stone-900 mb-5">
                  {q.question}
                </h3>

                {/* Option Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {q.options.map((opt, optIdx) => {
                    const isSelected = chosenOption === optIdx;
                    const isCorrect = optIdx === q.correctIndex;

                    let btnStyle =
                      'bg-stone-50 hover:bg-stone-100/80 border-stone-200 text-stone-800';

                    if (hasAnswered) {
                      if (isCorrect) {
                        btnStyle =
                          'bg-emerald-50 border-emerald-400 text-emerald-900 font-medium';
                      } else if (isSelected) {
                        btnStyle =
                          'bg-rose-50 border-rose-300 text-rose-900';
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
                  Score: {correctCount} of {quiz.length} Correct!
                </h4>
                <p className="text-xs text-stone-600">
                  {correctCount === quiz.length
                    ? 'A perfect score! You remember every single magical detail ❤️'
                    : `Every moment with you is unforgettable, ${girlfriendName}!`}
                </p>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="px-4 py-2 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Play Again</span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
