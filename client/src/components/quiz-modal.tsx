import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Lightbulb, CheckCircle2, XCircle, ChevronLeft, ChevronRight, Trophy, RotateCcw } from "lucide-react";

export interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  hint: string;
  explanation: string;
}

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: QuizQuestion[];
  isLoading: boolean;
  title?: string;
}

export function QuizModal({ isOpen, onClose, questions, isLoading, title = "Examination" }: QuizModalProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [hintsShown, setHintsShown] = useState<Set<number>>(new Set());
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const total = questions.length;
  const current = questions[currentIdx];
  const answered = Object.keys(answers).length;

  function selectAnswer(optIdx: number) {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [currentIdx]: optIdx }));
  }

  function toggleHint() {
    setHintsShown(prev => {
      const n = new Set(prev);
      if (n.has(currentIdx)) n.delete(currentIdx); else n.add(currentIdx);
      return n;
    });
  }

  function submit() {
    if (answered < total) return;
    setSubmitted(true);
  }

  function restart() {
    setCurrentIdx(0);
    setAnswers({});
    setHintsShown(new Set());
    setSubmitted(false);
  }

  const correctCount = submitted
    ? questions.reduce((acc, q, i) => acc + (answers[i] === q.correct ? 1 : 0), 0)
    : 0;
  const hintsUsedCount = hintsShown.size;
  const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;

  const getGrade = () => {
    if (accuracy >= 90) return { label: "Excellent!", color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20" };
    if (accuracy >= 75) return { label: "Good Job!", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" };
    if (accuracy >= 60) return { label: "Fair", color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20" };
    return { label: "Keep Practicing", color: "text-red-500", bg: "bg-red-50 dark:bg-red-900/20" };
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-3">
      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-800 bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30 flex-shrink-0">
          <div>
            <h2 className="font-bold text-zinc-900 dark:text-zinc-100 text-base">{title}</h2>
            {!isLoading && !submitted && total > 0 && (
              <p className="text-xs text-zinc-500 mt-0.5">
                Question {currentIdx + 1} of {total} · {answered}/{total} answered
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-12 h-12 rounded-full border-4 border-violet-200 border-t-violet-500 animate-spin" />
              <p className="text-zinc-500 text-sm font-medium">Generating your examination…</p>
              <p className="text-zinc-400 text-xs">Crafting questions based on your curriculum</p>
            </div>
          ) : total === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <p className="text-zinc-500">No questions available. Please try again.</p>
              <Button onClick={onClose} variant="outline" size="sm">Close</Button>
            </div>
          ) : submitted ? (
            // Results screen
            <div className="p-5 space-y-5">
              {/* Score card */}
              <div className={`rounded-xl p-5 text-center ${getGrade().bg}`}>
                <Trophy className={`h-10 w-10 mx-auto mb-2 ${getGrade().color}`} />
                <p className={`text-2xl font-bold ${getGrade().color}`}>{getGrade().label}</p>
                <p className="text-4xl font-black text-zinc-900 dark:text-zinc-100 mt-1">{accuracy}%</p>
                <p className="text-zinc-500 text-sm mt-1">{correctCount} / {total} correct</p>
                <div className="flex justify-center gap-4 mt-3 text-xs text-zinc-500">
                  <span>✓ {correctCount} correct</span>
                  <span>✗ {total - correctCount} wrong</span>
                  <span>💡 {hintsUsedCount} hints used</span>
                </div>
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex justify-between text-xs text-zinc-500 mb-1">
                  <span>Accuracy</span><span>{accuracy}%</span>
                </div>
                <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${accuracy}%`,
                      background: accuracy >= 75 ? '#10b981' : accuracy >= 60 ? '#f59e0b' : '#ef4444'
                    }}
                  />
                </div>
              </div>

              {/* Per-question review */}
              <div>
                <h3 className="font-semibold text-sm text-zinc-700 dark:text-zinc-300 mb-3">Review</h3>
                <div className="space-y-3">
                  {questions.map((q, i) => {
                    const userAns = answers[i];
                    const isCorrect = userAns === q.correct;
                    return (
                      <div key={i} className={`rounded-xl border p-3.5 ${isCorrect ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10' : 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10'}`}>
                        <div className="flex items-start gap-2">
                          {isCorrect
                            ? <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                            : <XCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Q{i + 1}. {q.question}</p>
                            {!isCorrect && (
                              <>
                                <p className="text-xs text-red-500 mt-1">Your answer: {q.options[userAns] ?? 'Not answered'}</p>
                                <p className="text-xs text-emerald-600 mt-0.5">Correct: {q.options[q.correct]}</p>
                              </>
                            )}
                            {isCorrect && <p className="text-xs text-emerald-600 mt-1">{q.options[q.correct]}</p>}
                            <p className="text-xs text-zinc-400 mt-1 italic">{q.explanation}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            // Question screen
            <div className="p-5">
              {/* Progress dots */}
              <div className="flex flex-wrap gap-1.5 mb-5">
                {questions.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIdx(i)}
                    className={`w-7 h-7 rounded-full text-xs font-semibold transition-all ${
                      i === currentIdx
                        ? 'bg-violet-500 text-white ring-2 ring-violet-300 scale-110'
                        : answers[i] !== undefined
                          ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              {/* Question */}
              <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 mb-4">
                <p className="font-semibold text-zinc-900 dark:text-zinc-100 text-base leading-relaxed">{current.question}</p>
              </div>

              {/* Options */}
              <div className="space-y-2.5 mb-4">
                {current.options.map((opt, i) => {
                  const selected = answers[currentIdx] === i;
                  return (
                    <button
                      key={i}
                      onClick={() => selectAnswer(i)}
                      className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all duration-150 ${
                        selected
                          ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300'
                          : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-violet-300 hover:bg-violet-50/50 dark:hover:bg-violet-900/10'
                      }`}
                    >
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold mr-3 ${selected ? 'bg-violet-500 text-white' : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-500'}`}>
                        {String.fromCharCode(65 + i)}
                      </span>
                      {opt}
                    </button>
                  );
                })}
              </div>

              {/* Hint */}
              {hintsShown.has(currentIdx) && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 mb-4">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800 dark:text-amber-300">{current.hint}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!isLoading && total > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-100 dark:border-zinc-800 flex-shrink-0 bg-white dark:bg-zinc-900">
            {submitted ? (
              <>
                <Button variant="outline" size="sm" onClick={restart} className="gap-1.5">
                  <RotateCcw className="h-3.5 w-3.5" /> Retry
                </Button>
                <Button size="sm" onClick={onClose} className="bg-violet-500 hover:bg-violet-600 text-white">
                  Done
                </Button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setCurrentIdx(i => Math.max(0, i - 1))} disabled={currentIdx === 0} className="gap-1">
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setCurrentIdx(i => Math.min(total - 1, i + 1))} disabled={currentIdx === total - 1} className="gap-1">
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleHint}
                    className={`gap-1.5 text-xs ${hintsShown.has(currentIdx) ? 'text-amber-500' : 'text-zinc-400'}`}
                  >
                    <Lightbulb className="h-3.5 w-3.5" />
                    {hintsShown.has(currentIdx) ? 'Hide Hint' : 'Hint'}
                  </Button>
                </div>
                <Button
                  size="sm"
                  onClick={submit}
                  disabled={answered < total}
                  className="bg-violet-500 hover:bg-violet-600 text-white disabled:opacity-40"
                >
                  {answered < total ? `Answer all (${answered}/${total})` : 'Submit Quiz'}
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
