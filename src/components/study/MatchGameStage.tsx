import { CheckCircle2, RotateCcw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { Flashcard } from '../../types/flashcard';
import { buildMatchPairsRound, type MatchTile } from '../../utils/studyModes';

interface MatchGameStageProps {
  cards: Flashcard[];
}

export function MatchGameStage({ cards }: MatchGameStageProps) {
  const [roundSeed, setRoundSeed] = useState(0);
  const tiles = useMemo(() => buildMatchPairsRound(cards, 6), [cards, roundSeed]);

  const [selectedTile, setSelectedTile] = useState<MatchTile | null>(null);
  const [matchedPairIds, setMatchedPairIds] = useState<Set<string>>(new Set());
  const [wrongPairTiles, setWrongPairTiles] = useState<[string, string] | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);

  const totalPairs = tiles.length / 2;
  const isCompleted = totalPairs > 0 && matchedPairIds.size === totalPairs;

  useEffect(() => {
    setSelectedTile(null);
    setMatchedPairIds(new Set());
    setWrongPairTiles(null);
    setMistakes(0);
    setElapsedSec(0);
  }, [roundSeed, cards]);

  useEffect(() => {
    if (isCompleted || totalPairs === 0) return;
    const timer = window.setInterval(() => {
      setElapsedSec((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isCompleted, totalPairs]);

  const handleTileClick = (tile: MatchTile) => {
    if (matchedPairIds.has(tile.pairId) || wrongPairTiles) return;
    if (selectedTile?.tileId === tile.tileId) {
      setSelectedTile(null);
      return;
    }

    if (!selectedTile) {
      setSelectedTile(tile);
      return;
    }

    if (selectedTile.pairId === tile.pairId && selectedTile.side !== tile.side) {
      setMatchedPairIds((prev) => {
        const next = new Set(prev);
        next.add(tile.pairId);
        return next;
      });
      setSelectedTile(null);
    } else {
      setMistakes((m) => m + 1);
      const firstId = selectedTile.tileId;
      const secondId = tile.tileId;
      setWrongPairTiles([firstId, secondId]);
      setSelectedTile(null);
      window.setTimeout(() => {
        setWrongPairTiles(null);
      }, 450);
    }
  };

  if (cards.length < 2) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center text-sm text-slate-600 dark:text-slate-400">
        Eşleştirme oyunu için seçili destede en az 2 kart bulunmalıdır.
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-3">
          <span className="font-medium text-slate-800 dark:text-slate-200">
            Kavram – Anlam Eşleştirme
          </span>
          <span aria-hidden="true">·</span>
          <span className="font-mono-tabular">
            Eşleşen: {matchedPairIds.size}/{totalPairs}
          </span>
          <span aria-hidden="true">·</span>
          <span className="font-mono-tabular">Hata: {mistakes}</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono-tabular">Süre: {elapsedSec} sn</span>
        </div>

        <button
          type="button"
          onClick={() => setRoundSeed((s) => s + 1)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Yeni Tur</span>
        </button>
      </div>

      {isCompleted ? (
        <div className="py-10 text-center space-y-4">
          <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-emerald-400 mx-auto" aria-hidden="true" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
            Tur Tamamlandı!
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 font-mono-tabular">
            {totalPairs} çift {elapsedSec} saniyede, {mistakes} hata ile eşleştirildi.
          </p>
          <button
            type="button"
            onClick={() => setRoundSeed((s) => s + 1)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            <span>Tekrar Oyna</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3" data-testid="match-grid">
          {tiles.map((tile) => {
            const isMatched = matchedPairIds.has(tile.pairId);
            const isSelected = selectedTile?.tileId === tile.tileId;
            const isWrong =
              wrongPairTiles !== null &&
              (wrongPairTiles[0] === tile.tileId || wrongPairTiles[1] === tile.tileId);

            return (
              <button
                key={tile.tileId}
                type="button"
                disabled={isMatched}
                onClick={() => handleTileClick(tile)}
                className={`min-h-24 p-3.5 rounded-xl border text-sm font-medium text-center flex items-center justify-center transition-all ${
                  isMatched
                    ? 'border-emerald-200 bg-emerald-50/60 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400 opacity-50'
                    : isWrong
                    ? 'border-red-500 bg-red-50 text-red-900 dark:border-red-500 dark:bg-red-950/50 dark:text-red-100'
                    : isSelected
                    ? 'border-blue-600 bg-blue-50 text-blue-900 dark:border-blue-400 dark:bg-blue-950/50 dark:text-blue-100 ring-2 ring-blue-600 dark:ring-blue-400'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className="line-clamp-3 leading-snug">{tile.text}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
