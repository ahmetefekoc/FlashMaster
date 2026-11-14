import { Check, Eye, Lightbulb, RotateCcw, RotateCw, Star, Volume2 } from 'lucide-react';
import { useEffect, useRef, useState, type PointerEvent } from 'react';
import type { Flashcard, RatingGrade } from '../../types/flashcard';
import {
  computeSwipeFeedback,
  resolveSwipeCommit,
  triggerHaptic,
} from '../../utils/gestures';
import { previewIntervals } from '../../utils/srs';
import { hasClozeSyntax, stripClozeBraces } from '../../utils/studyModes';
import { ClozeText } from '../ClozeText';

interface FlipCardStageProps {
  card: Flashcard;
  reversed: boolean;
  remainingCount?: number;
  langCode?: string;
  onRate: (rating: RatingGrade) => void;
  onToggleStar: (cardId: string) => void;
}

const RATING_OPTIONS: {
  grade: RatingGrade;
  label: string;
  shortcut: string;
  style: string;
}[] = [
  {
    grade: 1,
    label: 'Tekrar',
    shortcut: '1',
    style:
      'border-red-200 bg-red-50 text-red-800 hover:bg-red-100 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-200 dark:hover:bg-red-950/70',
  },
  {
    grade: 2,
    label: 'Zor',
    shortcut: '2',
    style:
      'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-200 dark:hover:bg-amber-950/70',
  },
  {
    grade: 3,
    label: 'İyi',
    shortcut: '3',
    style:
      'border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100 dark:border-blue-900/70 dark:bg-blue-950/40 dark:text-blue-200 dark:hover:bg-blue-950/70',
  },
  {
    grade: 4,
    label: 'Kolay',
    shortcut: '4',
    style:
      'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-200 dark:hover:bg-emerald-950/70',
  },
];

export function FlipCardStage({
  card,
  reversed,
  remainingCount = 1,
  langCode = 'tr-TR',
  onRate,
  onToggleStar,
}: FlipCardStageProps) {
  const [flipped, setFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Swipe gesture state
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [exitingDirection, setExitingDirection] = useState<'left' | 'right' | null>(null);
  const pointerStartRef = useRef<{ x: number; y: number; pointerId: number } | null>(null);
  const exitTimerRef = useRef<number | null>(null);

  // Reset state whenever active card changes
  useEffect(() => {
    setFlipped(false);
    setShowHint(false);
    setDragX(0);
    setIsDragging(false);
    setExitingDirection(null);
    pointerStartRef.current = null;
    if (exitTimerRef.current) {
      window.clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
  }, [card.id, reversed]);

  useEffect(() => {
    return () => {
      if (exitTimerRef.current) window.clearTimeout(exitTimerRef.current);
    };
  }, []);

  // Keyboard shortcuts: Space to flip, 1-4 to grade when flipped
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT')
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        triggerHaptic(8);
        setFlipped((f) => !f);
      } else if (flipped && ['1', '2', '3', '4'].includes(e.key)) {
        e.preventDefault();
        triggerHaptic(12);
        onRate(Number(e.key) as RatingGrade);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [flipped, onRate]);

  const speakText = (raw: string, lang: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(stripClozeBraces(raw));
    utterance.lang = lang;
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  const commitSwipe = (direction: 'left' | 'right') => {
    setExitingDirection(direction);
    setIsDragging(false);
    triggerHaptic(18);
    exitTimerRef.current = window.setTimeout(() => {
      onRate(direction === 'right' ? 3 : 1);
    }, 160);
  };

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (exitingDirection) return;
    const target = e.target as HTMLElement | null;
    if (target && target.closest('button, a, input, select, textarea')) return;

    pointerStartRef.current = { x: e.clientX, y: e.clientY, pointerId: e.pointerId };
    setIsDragging(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture isn't supported
    }
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !pointerStartRef.current || exitingDirection) return;
    const dx = e.clientX - pointerStartRef.current.x;
    const dy = e.clientY - pointerStartRef.current.y;
    // Only engage horizontal drag if horizontal intent outweighs vertical scroll
    if (Math.abs(dx) > 6 || Math.abs(dragX) > 0) {
      if (Math.abs(dx) >= Math.abs(dy) * 0.8 || Math.abs(dragX) > 12) {
        setDragX(dx);
      }
    }
  };

  const handlePointerEnd = (e: PointerEvent<HTMLDivElement>) => {
    if (!pointerStartRef.current || exitingDirection) return;
    const start = pointerStartRef.current;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    pointerStartRef.current = null;
    setIsDragging(false);

    try {
      if (e.currentTarget.hasPointerCapture(start.pointerId)) {
        e.currentTarget.releasePointerCapture(start.pointerId);
      }
    } catch {
      // Ignore
    }

    const committed = resolveSwipeCommit(dragX);
    if (committed === 'good') {
      commitSwipe('right');
      return;
    }
    if (committed === 'again') {
      commitSwipe('left');
      return;
    }

    // Short tap (< 8px travel) on card surface flips the card
    if (Math.abs(dx) < 8 && Math.abs(dy) < 8 && Math.abs(dragX) < 8) {
      triggerHaptic(8);
      setFlipped((f) => !f);
    }
    setDragX(0);
  };

  const intervals = previewIntervals(card);
  const frontIsCloze = !reversed && hasClozeSyntax(card.front);
  const frontDisplay = reversed ? card.back : card.front;
  const backDisplay = reversed ? stripClozeBraces(card.front) : card.back;
  const swipeFeedback = computeSwipeFeedback(dragX);

  const transformStyle = exitingDirection
    ? `translateX(${exitingDirection === 'right' ? 420 : -420}px) rotate(${
        exitingDirection === 'right' ? 14 : -14
      }deg)`
    : `translateX(${dragX}px) rotate(${swipeFeedback.rotationDeg}deg)`;

  return (
    <div className="space-y-4 sm:space-y-5 overflow-x-clip">
      {/* Stacked Deck Depth Wrapper */}
      <div className="relative pb-2">
        {remainingCount > 2 && (
          <div
            aria-hidden="true"
            className="absolute inset-x-6 bottom-0 h-6 rounded-b-2xl border border-t-0 border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/70"
          />
        )}
        {remainingCount > 1 && (
          <div
            aria-hidden="true"
            className="absolute inset-x-3 bottom-1 h-6 rounded-b-2xl border border-t-0 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90"
          />
        )}

        {/* Swipeable Flashcard Surface */}
        <div
          data-testid="swipeable-card"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          style={{
            transform: transformStyle,
            opacity: exitingDirection ? 0 : 1,
            transition: isDragging
              ? 'none'
              : 'transform 180ms cubic-bezier(0.16, 1, 0.3, 1), opacity 160ms ease',
          }}
          className={`relative z-10 touch-pan-y select-none bg-white dark:bg-slate-900 border rounded-3xl sm:rounded-2xl p-5 sm:p-10 min-h-[300px] sm:min-h-[340px] flex flex-col justify-between shadow-xs motion-reduce-instant ${
            swipeFeedback.action === 'good'
              ? 'border-emerald-400 dark:border-emerald-500'
              : swipeFeedback.action === 'again'
              ? 'border-red-400 dark:border-red-500'
              : 'border-slate-200 dark:border-slate-800'
          }`}
        >
          {/* Live Directional Swipe Overlay */}
          {swipeFeedback.action && (
            <div
              aria-hidden="true"
              style={{ opacity: Math.max(0.2, swipeFeedback.progress) }}
              className={`pointer-events-none absolute top-16 ${
                swipeFeedback.action === 'good'
                  ? 'left-5 border-emerald-500 text-emerald-700 bg-emerald-50/95 dark:bg-emerald-950/90 dark:text-emerald-300'
                  : 'right-5 border-red-500 text-red-700 bg-red-50/95 dark:bg-red-950/90 dark:text-red-300'
              } border-2 rounded-xl px-3 py-1.5 text-xs font-bold tracking-wide inline-flex items-center gap-1.5 shadow-sm`}
            >
              {swipeFeedback.action === 'good' ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>İYİ · {intervals[3]}</span>
                </>
              ) : (
                <>
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>TEKRAR · {intervals[1]}</span>
                </>
              )}
            </div>
          )}

          {/* Card Header Metadata & Quick Tools */}
          <div className="flex items-center justify-between gap-4">
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <span className="font-mono-tabular font-medium text-slate-700 dark:text-slate-300">
                Kutu {card.leitnerBox}/5
              </span>
              <span aria-hidden="true">·</span>
              <span>{flipped ? 'Cevap Yüzü' : 'Soru Yüzü'}</span>
              {card.tag && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{card.tag}</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() =>
                  speakText(flipped && !reversed ? backDisplay : frontDisplay, flipped ? 'tr-TR' : langCode)
                }
                aria-label="Kart metnini sesli oku"
                title="Sesli oku"
                className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Volume2 className="w-5 h-5 sm:w-4 sm:h-4" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic(8);
                  onToggleStar(card.id);
                }}
                aria-label={card.starred ? 'Yıldızı kaldır' : 'Kartı yıldızla'}
                aria-pressed={card.starred}
                className={`min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-xl transition-colors ${
                  card.starred
                    ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                    : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Star className={`w-5 h-5 sm:w-4 sm:h-4 ${card.starred ? 'fill-current' : ''}`} aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Card Content Body */}
          <div className="my-6 sm:my-8 text-center space-y-4 sm:space-y-5 max-w-2xl mx-auto">
            <div className="text-2xl sm:text-3xl font-serif-card font-semibold text-slate-900 dark:text-slate-50 leading-snug">
              {frontIsCloze ? (
                <ClozeText text={card.front} revealed={flipped} />
              ) : (
                <span>{frontDisplay}</span>
              )}
            </div>

            {!flipped && card.hint && (
              <div>
                {showHint ? (
                  <p className="text-sm text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl px-4 py-2 inline-block">
                    İpucu: {card.hint}
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowHint(true)}
                    className="min-h-[40px] px-3 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                  >
                    <Lightbulb className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>İpucunu Göster</span>
                  </button>
                )}
              </div>
            )}

            {flipped && (
              <div className="pt-5 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="text-xl sm:text-2xl font-semibold text-blue-700 dark:text-blue-300">
                  {backDisplay}
                </div>
                {card.example && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 italic leading-relaxed">
                    “{card.example}”
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Bottom Prompt / Flip Toggle */}
          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={() => {
                triggerHaptic(8);
                setFlipped((f) => !f);
              }}
              className="w-full sm:w-auto min-h-[46px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border border-slate-300 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 transition-colors active:scale-[0.99]"
            >
              {flipped ? (
                <>
                  <RotateCw className="w-4 h-4" aria-hidden="true" />
                  <span>Ön Yüze Dön (Boşluk)</span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" aria-hidden="true" />
                  <span>Cevabı Göster (Boşluk)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Swipe Gesture Guidance + SM-2 Rating Controls */}
      <div className="text-center text-xs text-slate-500 dark:text-slate-400">
        ← Sola kaydır: Tekrar · Dokun: Çevir · Sağa kaydır: İyi →
      </div>

      {flipped && (
        <div className="space-y-2" role="group" aria-label="Hatırlama derecesi seçimi">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            {RATING_OPTIONS.map((opt) => (
              <button
                key={opt.grade}
                type="button"
                onClick={() => {
                  triggerHaptic(12);
                  onRate(opt.grade);
                }}
                className={`min-h-[54px] px-4 py-2.5 rounded-xl border text-center transition-colors active:scale-[0.98] flex flex-col items-center justify-center gap-0.5 ${opt.style}`}
              >
                <span className="text-sm font-semibold">
                  {opt.shortcut}. {opt.label}
                </span>
                <span className="text-xs font-mono-tabular opacity-80">{intervals[opt.grade]}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
