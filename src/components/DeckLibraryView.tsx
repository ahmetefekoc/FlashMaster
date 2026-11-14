import { BookOpen, Edit3, FolderOpen, Play, Search, Trash2, Star } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Deck, Flashcard } from '../types/flashcard';
import { getCardMasteryStatus, isCardDue } from '../utils/srs';

interface DeckLibraryViewProps {
  decks: Deck[];
  cards: Flashcard[];
  onStartStudy: (deckId: string | 'all') => void;
  onManageDeck: (deckId: string) => void;
  onEditDeck: (deck: Deck) => void;
  onDeleteDeck: (deckId: string) => void;
  onOpenNewDeck: () => void;
}

export function DeckLibraryView({
  decks,
  cards,
  onStartStudy,
  onManageDeck,
  onEditDeck,
  onDeleteDeck,
  onOpenNewDeck,
}: DeckLibraryViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tümü');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const categories = useMemo(() => {
    const set = new Set(decks.map((d) => d.category || 'Genel'));
    return ['Tümü', ...Array.from(set)];
  }, [decks]);

  const deckStats = useMemo(() => {
    const now = Date.now();
    const map = new Map<
      string,
      { total: number; due: number; mastered: number; starred: number }
    >();
    for (const deck of decks) {
      map.set(deck.id, { total: 0, due: 0, mastered: 0, starred: 0 });
    }
    for (const card of cards) {
      const bucket = map.get(card.deckId);
      if (!bucket) continue;
      bucket.total += 1;
      if (isCardDue(card, now)) bucket.due += 1;
      if (getCardMasteryStatus(card) === 'mastered') bucket.mastered += 1;
      if (card.starred) bucket.starred += 1;
    }
    return map;
  }, [decks, cards]);

  const totalDue = useMemo(() => {
    let count = 0;
    deckStats.forEach((s) => {
      count += s.due;
    });
    return count;
  }, [deckStats]);

  const filteredDecks = useMemo(() => {
    const q = searchQuery.trim().toLocaleLowerCase('tr-TR');
    return decks.filter((deck) => {
      if (selectedCategory !== 'Tümü' && deck.category !== selectedCategory) return false;
      if (!q) return true;
      return (
        deck.title.toLocaleLowerCase('tr-TR').includes(q) ||
        deck.description.toLocaleLowerCase('tr-TR').includes(q) ||
        deck.category.toLocaleLowerCase('tr-TR').includes(q)
      );
    });
  }, [decks, searchQuery, selectedCategory]);

  return (
    <div className="space-y-8">
      {/* Primary Hero / Daily Review Focal Anchor */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-xl p-5 sm:p-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 sm:gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="text-xs font-medium text-blue-700 dark:text-blue-400">
            Aralıklı Tekrar ve Aktif Hatırlama
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-[-0.01em] text-slate-900 dark:text-slate-50 leading-snug">
            {totalDue > 0
              ? `Bugün pekiştirmen gereken ${totalDue} kart hazır`
              : 'Bugünkü tüm tekrarlarını tamamladın'}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            {totalDue > 0
              ? 'SM-2 algoritması unutma eğrine göre zamanı gelen kartları öne çıkardı. Klasik çevirme, yazarak hatırlama, test veya eşleştirme modlarıyla hemen çalış.'
              : 'Tüm vadesi gelen kartları gözden geçirdin. İstersen tüm desteler üzerinden serbest pratik yapabilir veya yeni kartlar ekleyebilirsin.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onStartStudy('all')}
            disabled={cards.length === 0}
            className="w-full sm:w-auto min-h-[48px] inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl sm:rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors active:scale-[0.98] whitespace-nowrap"
          >
            <Play className="w-4 h-4" aria-hidden="true" />
            <span>{totalDue > 0 ? `Bekleyen ${totalDue} Kartı Çalış` : 'Serbest Pratik Başlat'}</span>
          </button>
        </div>
      </section>

      {/* Search & Category Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-lg overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`min-h-[38px] px-3 py-1.5 text-xs font-medium rounded-lg sm:rounded-md transition-colors whitespace-nowrap shrink-0 ${
                selectedCategory === cat
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <label htmlFor="deck-search-input" className="sr-only">
            Destelerde ara
          </label>
          <Search
            className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            id="deck-search-input"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Deste veya konu ara..."
            className="w-full min-h-[44px] pl-9 pr-3.5 py-2 text-sm rounded-xl sm:rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </div>

      {/* Deck Grid */}
      {decks.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-4">
          <BookOpen className="w-10 h-10 text-slate-400 mx-auto" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Henüz hiç deste yok
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            Öğrenmek istediğin konu için ilk desteni oluşturarak aralıklı tekrar yolculuğuna başlayabilirsin.
          </p>
          <button
            type="button"
            onClick={onOpenNewDeck}
            className="min-h-[44px] px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            İlk Desteyi Oluştur
          </button>
        </div>
      ) : filteredDecks.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center space-y-2">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Aramana uyan deste bulunamadı
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Farklı bir kategori seçebilir veya arama metnini temizleyebilirsin.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5" data-testid="deck-grid">
          {filteredDecks.map((deck) => {
            const stats = deckStats.get(deck.id) ?? { total: 0, due: 0, mastered: 0, starred: 0 };
            const masteryPct =
              stats.total > 0 ? Math.round((stats.mastered / stats.total) * 100) : 0;

            return (
              <article
                key={deck.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-xl p-5 sm:p-6 flex flex-col justify-between gap-4 sm:gap-5 transition-colors hover:border-slate-300 dark:hover:border-slate-700"
              >
                <div className="space-y-3">
                  {/* Unboxed metadata line (Zero-pill discipline) */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {deck.category}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-tabular">{stats.total} kart</span>
                      <span aria-hidden="true">·</span>
                      <span
                        className={`font-mono-tabular font-medium ${
                          stats.due > 0
                            ? 'text-blue-700 dark:text-blue-400'
                            : 'text-emerald-700 dark:text-emerald-400'
                        }`}
                      >
                        {stats.due > 0 ? `${stats.due} bekliyor` : 'Tamamlandı'}
                      </span>
                    </div>

                    {stats.starred > 0 && (
                      <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-mono-tabular">
                        <Star className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                        <span>{stats.starred}</span>
                      </span>
                    )}
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 leading-snug">
                      {deck.title}
                    </h2>
                    <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {deck.description}
                    </p>
                  </div>

                  {/* Mastery progress bar */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>Kalıcı Pekiştirme</span>
                      <span className="font-mono-tabular font-medium text-slate-700 dark:text-slate-300">
                        %{masteryPct} ({stats.mastered}/{stats.total})
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 dark:bg-emerald-500 transition-all duration-300"
                        style={{ width: `${masteryPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onStartStudy(deck.id)}
                      disabled={stats.total === 0}
                      className="min-h-[44px] sm:min-h-[36px] inline-flex items-center gap-1.5 px-4 sm:px-3.5 py-2 rounded-xl sm:rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors active:scale-[0.98] whitespace-nowrap"
                    >
                      <Play className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Çalış</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onManageDeck(deck.id)}
                      className="min-h-[44px] sm:min-h-[36px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl sm:rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
                    >
                      <FolderOpen className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Kartlar ({stats.total})</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    {confirmDeleteId === deck.id ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteDeck(deck.id);
                            setConfirmDeleteId(null);
                          }}
                          className="min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-700 text-white"
                        >
                          Silmeyi Onayla
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          İptal
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => onEditDeck(deck)}
                          aria-label={`Desteyi düzenle: ${deck.title}`}
                          className="min-w-[44px] min-h-[44px] sm:min-w-[36px] sm:min-h-[36px] inline-flex items-center justify-center rounded-xl sm:rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Edit3 className="w-4 h-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(deck.id)}
                          aria-label={`Desteyi sil: ${deck.title}`}
                          className="min-w-[44px] min-h-[44px] sm:min-w-[36px] sm:min-h-[36px] inline-flex items-center justify-center rounded-xl sm:rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-950/40 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
