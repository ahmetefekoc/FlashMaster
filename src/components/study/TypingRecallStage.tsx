import { AlertCircle, CheckCircle2, ArrowRight, HelpCircle } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { Flashcard, RatingGrade } from '../../types/flashcard';
import { previewIntervals } from '../../utils/srs';
import {
  evaluateTypedAnswer,
  extractTargetAnswer,
  hasClozeSyntax,
  stripClozeBraces,
  type TypedEvaluation,
} from '../../utils/studyModes';
import { ClozeText } from '../ClozeText';

interface TypingRecallStageProps {
  card: Flashcard;
  reversed: boolean;
  onRate: (rating: RatingGrade) => void;
}

export function TypingRecallStage({ card, reversed, onRate }: TypingRecallStageProps) {
  const [answer, setAnswer] = useState('');
  const [evaluation, setEvaluation] = useState<TypedEvaluation | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setAnswer('');
    setEvaluation(null);
    inputRef.current?.focus();
  }, [card.id, reversed]);

  const expected = extractTargetAnswer(card, reversed);
  const frontIsCloze = !reversed && hasClozeSyntax(card.front);
  const intervals = previewIntervals(card);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (evaluation) return;
    if (!answer.trim()) return;
    setEvaluation(evaluateTypedAnswer(answer, expected));
  };

  const handleRevealSkip = () => {
    setEvaluation(evaluateTypedAnswer('', expected));
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-10 space-y-6">
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>Yazarak Aktif Hatırlama</span>
        <span className="font-mono-tabular">Kutu {card.leitnerBox}/5</span>
      </div>

      {/* Prompt */}
      <div className="text-center space-y-2 py-2">
        <div className="text-2xl sm:text-3xl font-serif-card font-semibold text-slate-900 dark:text-slate-50 leading-snug">
          {frontIsCloze ? (
            <ClozeText text={card.front} revealed={Boolean(evaluation)} />
          ) : reversed ? (
            card.back
          ) : (
            stripClozeBraces(card.front)
          )}
        </div>
        {card.hint && !evaluation && (
          <p className="text-xs text-slate-500 dark:text-slate-400">İpucu: {card.hint}</p>
        )}
      </div>

      {/* Input Form */}
      {!evaluation ? (
        <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-3">
          <label htmlFor="typing-recall-input" className="sr-only">
            Cevabınızı yazın
          </label>
          <input
            id="typing-recall-input"
            ref={inputRef}
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Cevabını buraya yaz ve Enter'a bas..."
            autoComplete="off"
            className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-base focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleRevealSkip}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Hatırlamıyorum, Cevabı Göster
            </button>
            <button
              type="submit"
              disabled={!answer.trim()}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 transition-colors"
            >
              <span>Kontrol Et</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </form>
      ) : (
        <div className="max-w-xl mx-auto space-y-5">
          {/* Dual-coded Evaluation Banner (Icon + Explicit Label + Color) */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 ${
              evaluation.status === 'exact'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-100'
                : evaluation.status === 'close'
                ? 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-100'
                : 'bg-red-50 border-red-200 text-red-900 dark:bg-red-950/40 dark:border-red-900 dark:text-red-100'
            }`}
            role="status"
          >
            {evaluation.status === 'exact' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            ) : evaluation.status === 'close' ? (
              <HelpCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600 dark:text-red-400" aria-hidden="true" />
            )}

            <div className="space-y-1 text-sm">
              <div className="font-semibold">
                {evaluation.status === 'exact'
                  ? 'Tam Doğru Hatırladın!'
                  : evaluation.status === 'close'
                  ? `Çok Yakın (%${Math.round(evaluation.similarity * 100)} benzerlik — küçük yazım farkı)`
                  : 'Yanıt Eşleşmedi — Doğru Cevap Aşağıda'}
              </div>
              {answer.trim() && (
                <div className="text-xs opacity-80">
                  Senin yanıtın: <span className="font-medium">{answer}</span>
                </div>
              )}
              <div className="text-sm font-semibold pt-1">Doğru cevap: {evaluation.expected}</div>
              {card.example && (
                <div className="text-xs opacity-80 italic pt-1">“{card.example}”</div>
              )}
            </div>
          </div>

          {/* SM-2 Rating */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {(
              [
                { grade: 1 as const, label: 'Tekrar' },
                { grade: 2 as const, label: 'Zor' },
                { grade: 3 as const, label: 'İyi' },
                { grade: 4 as const, label: 'Kolay' },
              ] as const
            ).map((btn) => {
              const recommended =
                (evaluation.status === 'exact' && btn.grade === 3) ||
                (evaluation.status === 'close' && btn.grade === 2) ||
                (evaluation.status === 'wrong' && btn.grade === 1);

              return (
                <button
                  key={btn.grade}
                  type="button"
                  onClick={() => onRate(btn.grade)}
                  className={`px-3 py-2.5 rounded-xl border text-center transition-colors flex flex-col items-center ${
                    recommended
                      ? 'border-blue-600 bg-blue-50 text-blue-900 dark:border-blue-400 dark:bg-blue-950/60 dark:text-blue-100 ring-1 ring-blue-600 dark:ring-blue-400'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <span className="text-sm font-semibold">{btn.label}</span>
                  <span className="text-xs font-mono-tabular opacity-75">{intervals[btn.grade]}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
