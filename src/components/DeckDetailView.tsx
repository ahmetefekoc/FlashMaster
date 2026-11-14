import {
  ArrowLeft,
  Edit3,
  EyeOff,
  Play,
  Plus,
  Search,
  Star,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import { useMemo, useRef, useState, type FormEvent } from 'react';
import type { Deck, Flashcard, MasteryStatus } from '../types/flashcard';
import { getCardMasteryStatus, isCardDue } from '../utils/srs';
import { ClozeText } from './ClozeText';

interface DeckDetailViewProps {
  deck: Deck;
  cards: Flashcard[];
  onBack: () => void;
  onStartStudy: (deckId: string) => void;
  onAddCard: (payload: {
    deckId: string;
    front: string;
    back: string;
    hint?: string;
    example?: string;
    tag?: string;
  }) => void;
  onUpdateCard: (
    cardId: string,
    payload: { front: string; back: string; hint?: string; example?: string; tag?: string }
  ) => void;
  onDeleteCard: (cardId: string) => void;
  onToggleStar: (cardId: string) => void;
  onResetCardProgress: (cardId: string) => void;
}

const MASTERY_LABELS: Record<MasteryStatus, string> = {
  new: 'Yeni',
  learning: 'Öğreniliyor',
  mastered: 'Pekiştirildi',
};

export function DeckDetailView({
  deck,
  cards,
  onBack,
  onStartStudy,
  onAddCard,
  onUpdateCard,
  onDeleteCard,
  onToggleStar,
  onResetCardProgress,
}: DeckDetailViewProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | MasteryStatus | 'starred'>('all');
  const [editingCardId, setEditingCardId] = useState<string | null>(null);

  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [hint, setHint] = useState('');
  const [example, setExample] = useState('');
  const [tag, setTag] = useState('');
  const [formError, setFormError] = useState('');

  const frontTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const filteredCards = useMemo(() => {
    const q = search.trim().toLocaleLowerCase('tr-TR');
    return cards.filter((c) => {
      if (statusFilter === 'starred' && !c.starred) return false;
      if (
        statusFilter !== 'all' &&
        statusFilter !== 'starred' &&
        getCardMasteryStatus(c) !== statusFilter
      ) {
        return false;
      }
      if (!q) return true;
      return (
        c.front.toLocaleLowerCase('tr-TR').includes(q) ||
        c.back.toLocaleLowerCase('tr-TR').includes(q) ||
        (c.tag ?? '').toLocaleLowerCase('tr-TR').includes(q)
      );
    });
  }, [cards, search, statusFilter]);

  const startEdit = (card: Flashcard) => {
    setEditingCardId(card.id);
    setFront(card.front);
    setBack(card.back);
    setHint(card.hint ?? '');
    setExample(card.example ?? '');
    setTag(card.tag ?? '');
    setFormError('');
    frontTextareaRef.current?.focus();
  };

  const cancelEdit = () => {
    setEditingCardId(null);
    setFront('');
    setBack('');
    setHint('');
    setExample('');
    setTag('');
    setFormError('');
  };

  const wrapSelectionWithCloze = () => {
    const el = frontTextareaRef.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    if (start === end) {
      setFront((prev) => `${prev}${prev ? ' ' : ''}{{gizli kelime}}`);
      return;
    }
    const selected = front.slice(start, end);
    const updated = `${front.slice(0, start)}{{${selected}}}${front.slice(end)}`;
    setFront(updated);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const f = front.trim();
    const b = back.trim();
    if (!f || !b) {
      setFormError('Ön yüz (soru) ve arka yüz (cevap) alanları zorunludur.');
      return;
    }
    if (editingCardId) {
      onUpdateCard(editingCardId, {
        front: f,
        back: b,
        hint: hint.trim() || undefined,
        example: example.trim() || undefined,
        tag: tag.trim() || undefined,
      });
      cancelEdit();
    } else {
      onAddCard({
        deckId: deck.id,
        front: f,
        back: b,
        hint: hint.trim() || undefined,
        example: example.trim() || undefined,
        tag: tag.trim() || undefined,
      });
      setFront('');
      setBack('');
      setHint('');
      setExample('');
      setTag('');
      setFormError('');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Destelere Dön</span>
          </button>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">{deck.title}</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {deck.category} · {cards.length} kart · {deck.description}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onStartStudy(deck.id)}
          disabled={cards.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors whitespace-nowrap self-start sm:self-auto"
        >
          <Play className="w-4 h-4" aria-hidden="true" />
          <span>Bu Desteyi Çalış</span>
        </button>
      </div>

      {/* Add / Edit Card Form */}
      <section
        aria-label={editingCardId ? 'Kartı Düzenle' : 'Yeni Kart Ekle'}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
            {editingCardId ? 'Kartı Düzenle' : 'Desteye Yeni Kart Ekle'}
          </h2>
          <button
            type="button"
            onClick={wrapSelectionWithCloze}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Seçili kelimeyi {{...}} boşluk doldurma alanına çevirir"
          >
            <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Boşluk Ekle {'{{...}}'}</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="card-front-input"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Ön Yüz (Soru / Kavram / Cloze cümle)
              </label>
              <textarea
                id="card-front-input"
                ref={frontTextareaRef}
                rows={3}
                value={front}
                onChange={(e) => {
                  setFront(e.target.value);
                  if (formError) setFormError('');
                }}
                placeholder="Örn: Hücrenin enerji santrali {{mitokondri}} organelidir."
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label
                htmlFor="card-back-input"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Arka Yüz (Cevap / Açıklama)
              </label>
              <textarea
                id="card-back-input"
                rows={3}
                value={back}
                onChange={(e) => {
                  setBack(e.target.value);
                  if (formError) setFormError('');
                }}
                placeholder="Örn: Mitokondri (ATP sentezi)"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="card-hint-input"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                İpucu (İsteğe bağlı)
              </label>
              <input
                id="card-hint-input"
                type="text"
                value={hint}
                onChange={(e) => setHint(e.target.value)}
                placeholder="Örn: Çift zarlı organel"
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label
                htmlFor="card-example-input"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Örnek Cümle / Bağlam (İsteğe bağlı)
              </label>
              <input
                id="card-example-input"
                type="text"
                value={example}
                onChange={(e) => setExample(e.target.value)}
                placeholder="Örn: Kas hücrelerinde bol bulunur."
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label
                htmlFor="card-tag-input"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Etiket (İsteğe bağlı)
              </label>
              <input
                id="card-tag-input"
                type="text"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder="Örn: Hücre, Sıfat, Temel"
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          {formError && (
            <p className="text-xs font-medium text-red-600 dark:text-red-400" role="alert">
              {formError}
            </p>
          )}

          <div className="flex items-center justify-end gap-2">
            {editingCardId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Düzenlemeyi İptal Et
              </button>
            )}
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>{editingCardId ? 'Kartı Güncelle' : 'Kartı Ekle'}</span>
            </button>
          </div>
        </form>
      </section>

      {/* Card List Controls */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto">
            {(
              [
                { id: 'all', label: `Tümü (${cards.length})` },
                { id: 'new', label: 'Yeni' },
                { id: 'learning', label: 'Öğreniliyor' },
                { id: 'mastered', label: 'Pekiştirildi' },
                { id: 'starred', label: 'Yıldızlı' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  statusFilter === tab.id
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <label htmlFor="card-search-input" className="sr-only">
              Kartlarda ara
            </label>
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="card-search-input"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Soru, cevap veya etiket ara..."
              className="w-full pl-9 pr-3.5 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>

        {/* Cards List */}
        {filteredCards.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center text-sm text-slate-500 dark:text-slate-400">
            Bu filtreyle eşleşen kart bulunamadı.
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-200 dark:divide-slate-800">
            {filteredCards.map((card) => {
              const mastery = getCardMasteryStatus(card);
              const due = isCardDue(card);

              return (
                <div
                  key={card.id}
                  className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-mono-tabular font-medium text-slate-700 dark:text-slate-300">
                        Kutu {card.leitnerBox}/5
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{MASTERY_LABELS[mastery]}</span>
                      <span aria-hidden="true">·</span>
                      <span className={due ? 'text-blue-700 dark:text-blue-400 font-medium' : ''}>
                        {due ? 'Tekrar zamanı geldi' : `${card.intervalDays} gün aralık`}
                      </span>
                      {card.tag && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{card.tag}</span>
                        </>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        <ClozeText text={card.front} revealed={true} />
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-300">{card.back}</div>
                    </div>

                    {(card.hint || card.example) && (
                      <div className="text-xs text-slate-500 dark:text-slate-400 pt-0.5">
                        {card.hint && <span>İpucu: {card.hint}</span>}
                        {card.hint && card.example && <span className="mx-2">·</span>}
                        {card.example && <span>Örnek: {card.example}</span>}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onToggleStar(card.id)}
                      aria-label={card.starred ? `Yıldızı kaldır: ${card.front}` : `Yıldızla: ${card.front}`}
                      aria-pressed={card.starred}
                      className={`w-9 h-9 inline-flex items-center justify-center rounded-lg transition-colors ${
                        card.starred
                          ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                          : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Star
                        className={`w-4 h-4 ${card.starred ? 'fill-current' : ''}`}
                        aria-hidden="true"
                      />
                    </button>

                    <button
                      type="button"
                      onClick={() => startEdit(card)}
                      aria-label={`Kartı düzenle: ${card.front}`}
                      className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" aria-hidden="true" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onResetCardProgress(card.id)}
                      aria-label={`Kart ilerlemesini sıfırla: ${card.front}`}
                      title="SM-2 ilerlemesini sıfırla"
                      className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-blue-950/40 transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" aria-hidden="true" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteCard(card.id)}
                      aria-label={`Kartı sil: ${card.front}`}
                      className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-950/40 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
