import { ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { Flashcard, RatingGrade } from '../../types/flashcard';
import { generateQuizOptions, hasClozeSyntax, stripClozeBraces } from '../../utils/studyModes';
import { ClozeText } from '../ClozeText';

interface QuizStageProps {
  card: Flashcard;
  allDeckCards: Flashcard[];
  reversed: boolean;
  onCompleteCard: (rating: RatingGrade) => void;
}

export function QuizStage({ card, allDeckCards, reversed, onCompleteCard }: QuizStageProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const options = useMemo(
    () => generateQuizOptions(card, allDeckCards, reversed),
    [card, allDeckCards, reversed]
  );

  useEffect(() => {
    setSelectedId(null);
  }, [card.id, reversed]);

  const selectedOption = options.find((o) => o.id === selectedId) ?? null;

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

      if (!selectedId && ['1', '2', '3', '4'].includes(e.key)) {
        const idx = Number(e.key) - 1;
        if (options[idx]) {
          e.preventDefault();
          setSelectedId(options[idx].id);
        }
      } else if (selectedId && e.key === 'Enter') {
        e.preventDefault();
        onCompleteCard(selectedOption?.isCorrect ? 3 : 1);
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedId, options, selectedOption, onCompleteCard]);

  const frontIsCloze = !reversed && hasClozeSyntax(card.front);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-10 space-y-6">
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>Çoktan Seçmeli Sınav (Kısayol: 1–4)</span>
        <span className="font-mono-tabular">Kutu {card.leitnerBox}/5</span>
      </div>

      <div className="text-center py-2">
        <div className="text-2xl sm:text-3xl font-serif-card font-semibold text-slate-900 dark:text-slate-50 leading-snug">
          {frontIsCloze ? (
            <ClozeText text={card.front} revealed={Boolean(selectedId)} />
          ) : reversed ? (
            card.back
          ) : (
            stripClozeBraces(card.front)
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
        {options.map((opt, idx) => {
          const isChosen = selectedId === opt.id;
          let stateClasses =
            'border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100';

          if (selectedId) {
            if (opt.isCorrect) {
              stateClasses =
                'border-emerald-500 bg-emerald-50 text-emerald-900 dark:border-emerald-500 dark:bg-emerald-950/50 dark:text-emerald-100';
            } else if (isChosen && !opt.isCorrect) {
              stateClasses =
                'border-red-500 bg-red-50 text-red-900 dark:border-red-500 dark:bg-red-950/50 dark:text-red-100';
            } else {
              stateClasses =
                'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 opacity-70';
            }
          }

          return (
            <button
              key={opt.id}
              type="button"
              disabled={Boolean(selectedId)}
              onClick={() => setSelectedId(opt.id)}
              className={`p-4 rounded-xl border text-left transition-colors flex items-center justify-between gap-3 ${stateClasses}`}
            >
              <div className="flex items-start gap-2.5">
                <span className="font-mono-tabular text-xs font-semibold opacity-60 mt-0.5">
                  {idx + 1}.
                </span>
                <span className="text-sm font-medium leading-snug">{opt.label}</span>
              </div>

              {selectedId && opt.isCorrect && (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
              )}
              {selectedId && isChosen && !opt.isCorrect && (
                <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" aria-hidden="true" />
              )}
            </button>
          );
        })}
      </div>

      {selectedOption && (
        <div className="max-w-2xl mx-auto pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-200 dark:border-slate-800">
          <div className="text-sm">
            <span
              className={`font-semibold ${
                selectedOption.isCorrect
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-red-700 dark:text-red-400'
              }`}
            >
              {selectedOption.isCorrect
                ? 'Doğru! Kart bir sonraki aralığa taşındı.'
                : 'Yanlış. Kart tekrar sırasına eklendi.'}
            </span>
            {card.example && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic">
                “{card.example}”
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => onCompleteCard(selectedOption.isCorrect ? 3 : 1)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shrink-0 self-end sm:self-auto"
          >
            <span>Sonraki Kart</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
