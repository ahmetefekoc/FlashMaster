import {
  ArrowLeftRight,
  Award,
  CheckCircle2,
  Layers,
  Shuffle,
  Keyboard,
  ListChecks,
  Grid2x2,
  RotateCcw,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { Deck, Flashcard, RatingGrade, StudyFilter, StudyMode } from '../types/flashcard';
import { isCardDue } from '../utils/srs';
import { shuffleArray } from '../utils/studyModes';
import { FlipCardStage } from './study/FlipCardStage';
import { MatchGameStage } from './study/MatchGameStage';
import { QuizStage } from './study/QuizStage';
import { TypingRecallStage } from './study/TypingRecallStage';

interface StudyStudioViewProps {
  decks: Deck[];
  cards: Flashcard[];
  selectedDeckId: string | 'all';
  initialFilter?: StudyFilter;
  onSelectDeckId: (deckId: string | 'all') => void;
  onRateCard: (cardId: string, rating: RatingGrade, mode: StudyMode) => boolean;
  onToggleStar: (cardId: string) => void;
  onBackToDecks: () => void;
}

const MODE_TABS: { id: StudyMode; label: string; Icon: typeof Layers }[] = [
  { id: 'flip', label: 'Klasik Kart', Icon: Layers },
  { id: 'typing', label: 'Yazarak', Icon: Keyboard },
  { id: 'quiz', label: 'Çoktan Seçmeli', Icon: ListChecks },
  { id: 'match', label: 'Eşleştirme', Icon: Grid2x2 },
];

const FILTER_OPTIONS: { id: StudyFilter; label: string }[] = [
  { id: 'due', label: 'Vadesi Gelenler' },
  { id: 'all', label: 'Tüm Kartlar' },
  { id: 'starred', label: 'Yıldızlı Kartlar' },
  { id: 'hard', label: 'Zorlanılan Kartlar' },
];

export function StudyStudioView({
  decks,
  cards,
  selectedDeckId,
  initialFilter = 'due',
  onSelectDeckId,
  onRateCard,
  onToggleStar,
  onBackToDecks,
}: StudyStudioViewProps) {
  const [mode, setMode] = useState<StudyMode>('flip');
  const [filter, setFilter] = useState<StudyFilter>(initialFilter);
  const [reversed, setReversed] = useState(false);

  const deckCards = useMemo(() => {
    if (selectedDeckId === 'all') return cards;
    return cards.filter((c) => c.deckId === selectedDeckId);
  }, [cards, selectedDeckId]);

  const matchingCards = useMemo(() => {
    const now = Date.now();
    return deckCards.filter((c) => {
      if (filter === 'due') return isCardDue(c, now);
      if (filter === 'starred') return c.starred;
      if (filter === 'hard') return c.lapses > 0 || c.easeFactor < 2.3;
      return true;
    });
  }, [deckCards, filter]);

  const [queueIds, setQueueIds] = useState<string[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [initialTotal, setInitialTotal] = useState(0);
  const [sessionAgainCount, setSessionAgainCount] = useState(0);
  const [sessionSuccessCount, setSessionSuccessCount] = useState(0);

  // Initialize queue whenever deck or filter changes
  useEffect(() => {
    const ids = matchingCards.map((c) => c.id);
    setQueueIds(ids);
    setInitialTotal(ids.length);
    setCompletedCount(0);
    setSessionAgainCount(0);
    setSessionSuccessCount(0);
  }, [selectedDeckId, filter]); // intentionally reset only when deck/filter switches

  const cardById = useMemo(() => {
    const map = new Map<string, Flashcard>();
    for (const c of cards) map.set(c.id, c);
    return map;
  }, [cards]);

  const deckById = useMemo(() => {
    const map = new Map<string, Deck>();
    for (const d of decks) map.set(d.id, d);
    return map;
  }, [decks]);

  const currentCard = queueIds.length > 0 ? cardById.get(queueIds[0]) ?? null : null;
  const currentDeck = currentCard ? deckById.get(currentCard.deckId) : undefined;

  const handleRate = (rating: RatingGrade) => {
    if (!currentCard) return;
    const requeue = onRateCard(currentCard.id, rating, mode);

    if (rating === 1) {
      setSessionAgainCount((n) => n + 1);
    } else {
      setSessionSuccessCount((n) => n + 1);
      setCompletedCount((n) => n + 1);
    }

    setQueueIds((prev) => {
      const rest = prev.slice(1);
      if (requeue) {
        const insertAt = Math.min(2, rest.length);
        return [...rest.slice(0, insertAt), currentCard.id, ...rest.slice(insertAt)];
      }
      return rest;
    });
  };

  const handleShuffleQueue = () => {
    setQueueIds((prev) => shuffleArray(prev));
  };

  const handleRestartAll = () => {
    const allIds = deckCards.map((c) => c.id);
    setFilter('all');
    setQueueIds(allIds);
    setInitialTotal(allIds.length);
    setCompletedCount(0);
    setSessionAgainCount(0);
    setSessionSuccessCount(0);
  };

  const totalActions = sessionSuccessCount + sessionAgainCount;
  const sessionAccuracy =
    totalActions > 0 ? Math.round((sessionSuccessCount / totalActions) * 100) : 100;
  const progressPct =
    initialTotal > 0 ? Math.min(100, Math.round((completedCount / initialTotal) * 100)) : 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Studio Control Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-xl p-3.5 sm:p-5 space-y-3 sm:space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Deck & Filter Selects */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-3">
            <div className="min-w-0">
              <label htmlFor="study-deck-select" className="sr-only">
                Çalışılacak deste
              </label>
              <select
                id="study-deck-select"
                value={selectedDeckId}
                onChange={(e) => onSelectDeckId(e.target.value)}
                className="w-full min-h-[42px] px-2.5 sm:px-3 py-2 rounded-xl sm:rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600 truncate"
              >
                <option value="all">Tüm Desteler ({cards.length})</option>
                {decks.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="min-w-0">
              <label htmlFor="study-filter-select" className="sr-only">
                Kart filtresi
              </label>
              <select
                id="study-filter-select"
                value={filter}
                onChange={(e) => setFilter(e.target.value as StudyFilter)}
                className="w-full min-h-[42px] px-2.5 sm:px-3 py-2 rounded-xl sm:rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {FILTER_OPTIONS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Reverse & Shuffle Toggles */}
          <div className="grid grid-cols-2 sm:flex items-center gap-2">
            <button
              type="button"
              onClick={() => setReversed((r) => !r)}
              aria-pressed={reversed}
              className={`min-h-[40px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl sm:rounded-lg text-xs font-medium border transition-colors whitespace-nowrap ${
                reversed
                  ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/60 dark:border-blue-800 dark:text-blue-300'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Ters Yön</span>
            </button>

            <button
              type="button"
              onClick={handleShuffleQueue}
              disabled={queueIds.length < 2}
              className="min-h-[40px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl sm:rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors whitespace-nowrap"
            >
              <Shuffle className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Karıştır</span>
            </button>
          </div>
        </div>

        {/* Mode Segmented Bar */}
        <div
          className="grid grid-cols-2 sm:grid-cols-4 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl sm:rounded-lg"
          role="tablist"
          aria-label="Çalışma modu seçimi"
        >
          {MODE_TABS.map(({ id, label, Icon }) => {
            const active = mode === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setMode(id)}
                className={`min-h-[40px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg sm:rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {/* Queue Progress Bar (shown for sequential modes) */}
        {mode !== 'match' && initialTotal > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="truncate pr-2">
                {currentDeck ? currentDeck.title : 'Oturum İlerlemesi'}
              </span>
              <span className="font-mono-tabular shrink-0">
                {completedCount}/{initialTotal} · Kalan: {queueIds.length}
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 dark:bg-blue-400 transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Stage Area */}
      {mode === 'match' ? (
        <MatchGameStage cards={matchingCards.length >= 2 ? matchingCards : deckCards} />
      ) : currentCard ? (
        mode === 'flip' ? (
          <FlipCardStage
            card={currentCard}
            reversed={reversed}
            remainingCount={queueIds.length}
            langCode={currentDeck?.langCode}
            onRate={handleRate}
            onToggleStar={onToggleStar}
          />
        ) : mode === 'typing' ? (
          <TypingRecallStage card={currentCard} reversed={reversed} onRate={handleRate} />
        ) : (
          <QuizStage
            card={currentCard}
            allDeckCards={deckCards.length >= 4 ? deckCards : cards}
            reversed={reversed}
            onCompleteCard={handleRate}
          />
        )
      ) : (
        /* Empty Queue / Session Completed Screen */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center space-y-5">
          {totalActions > 0 ? (
            <>
              <Award
                className="w-12 h-12 text-emerald-600 dark:text-emerald-400 mx-auto"
                aria-hidden="true"
              />
              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                  Harika İş! Oturumu Tamamladın
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Bu oturumda{' '}
                  <span className="font-mono-tabular font-semibold">{totalActions}</span> tekrar
                  yaptın ve <span className="font-mono-tabular font-semibold">%{sessionAccuracy}</span>{' '}
                  doğruluk oranına ulaştın.
                </p>
              </div>
            </>
          ) : (
            <>
              <CheckCircle2
                className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto"
                aria-hidden="true"
              />
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                  Bu filtrede bekleyen kart yok
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Seçili destede zamanı gelen tüm kartları tamamladın. Dilersen tüm kartlarla serbest pratik yapabilirsin.
                </p>
              </div>
            </>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {deckCards.length > 0 && (
              <button
                type="button"
                onClick={handleRestartAll}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
                <span>Tüm Kartlarla Pratik Yap ({deckCards.length})</span>
              </button>
            )}
            <button
              type="button"
              onClick={onBackToDecks}
              className="px-4 py-2.5 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Destelere Dön
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
