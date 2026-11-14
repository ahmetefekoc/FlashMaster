import { X } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import type { Deck } from '../types/flashcard';

interface DeckModalProps {
  open: boolean;
  editingDeck: Deck | null;
  onClose: () => void;
  onSave: (payload: { title: string; description: string; category: string; langCode: string }) => void;
}

const CATEGORIES = ['Yabancı Dil', 'Fen Bilimleri', 'Yazılım', 'Tarih & Kültür', 'Matematik', 'Genel'];

export function DeckModal({ open, editingDeck, onClose, onSave }: DeckModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Genel');
  const [langCode, setLangCode] = useState('tr-TR');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    if (editingDeck) {
      setTitle(editingDeck.title);
      setDescription(editingDeck.description);
      setCategory(editingDeck.category || 'Genel');
      setLangCode(editingDeck.langCode || 'tr-TR');
    } else {
      setTitle('');
      setDescription('');
      setCategory('Genel');
      setLangCode('tr-TR');
    }
    setError('');
  }, [open, editingDeck]);

  if (!open) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Lütfen deste için bir başlık girin.');
      return;
    }
    onSave({
      title: trimmedTitle,
      description: description.trim() || 'Kişisel çalışma destesi.',
      category,
      langCode,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/50 backdrop-blur-xs sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="deck-modal-title"
    >
      <div className="w-full sm:max-w-lg bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-xl shadow-xl px-5 pt-3 pb-6 sm:p-6 pb-safe max-h-[90vh] overflow-y-auto">
        {/* Mobile bottom-sheet drag handle */}
        <div
          className="sm:hidden w-10 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-3"
          aria-hidden="true"
        />

        <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <h2 id="deck-modal-title" className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            {editingDeck ? 'Desteyi Düzenle' : 'Yeni Deste Oluştur'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Pencereyi kapat"
            className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="deck-title-input"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Deste Başlığı
            </label>
            <input
              id="deck-title-input"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError('');
              }}
              placeholder="Örn: Tıbbi Terimler veya İspanyolca Fiiller"
              autoFocus
              className="w-full px-3.5 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            {error && (
              <p className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400" role="alert">
                {error}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="deck-desc-input"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Açıklama
            </label>
            <textarea
              id="deck-desc-input"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Bu destede neleri pekiştireceksiniz?"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="deck-category-select"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Kategori
              </label>
              <select
                id="deck-category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="deck-lang-select"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Sesli Okuma Dili
              </label>
              <select
                id="deck-lang-select"
                value={langCode}
                onChange={(e) => setLangCode(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="tr-TR">Türkçe (tr-TR)</option>
                <option value="en-US">İngilizce (en-US)</option>
                <option value="de-DE">Almanca (de-DE)</option>
                <option value="fr-FR">Fransızca (fr-FR)</option>
                <option value="es-ES">İspanyolca (es-ES)</option>
              </select>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              className="flex-1 sm:flex-initial min-h-[44px] px-5 py-2 text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white transition-colors"
            >
              {editingDeck ? 'Değişiklikleri Kaydet' : 'Deste Oluştur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
