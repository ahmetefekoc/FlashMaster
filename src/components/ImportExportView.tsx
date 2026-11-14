import { CheckCircle2, Download, FileSpreadsheet, RotateCcw, Upload } from 'lucide-react';
import { useMemo, useState, type ChangeEvent } from 'react';
import type { AppState, Deck } from '../types/flashcard';
import { exportCardsToCsv, parseBulkImportText, type ParsedBulkCard } from '../utils/studyModes';

interface ImportExportViewProps {
  state: AppState;
  onBulkImportCards: (deckId: string, drafts: ParsedBulkCard[]) => void;
  onRestoreJson: (nextState: AppState) => void;
  onResetDemoData: () => void;
}

export function ImportExportView({
  state,
  onBulkImportCards,
  onRestoreJson,
  onResetDemoData,
}: ImportExportViewProps) {
  const [targetDeckId, setTargetDeckId] = useState<string>(state.decks[0]?.id ?? '');
  const [bulkText, setBulkText] = useState(
    'Serendipity ; Şans eseri güzel bir keşif ; Beklenmedik mutluluk\nNöroplastisite ; Beynin öğrenmeyle yeni sinaptik bağlar kurma yeteneği ; Öğrenme mekanizması'
  );
  const [exportDeckId, setExportDeckId] = useState<string>(state.decks[0]?.id ?? 'all');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const effectiveDeckId = state.decks.some((d) => d.id === targetDeckId)
    ? targetDeckId
    : state.decks[0]?.id ?? '';

  const parsedDrafts = useMemo(() => parseBulkImportText(bulkText), [bulkText]);

  const handleImportSubmit = () => {
    setErrorMessage(null);
    setStatusMessage(null);

    if (!effectiveDeckId) {
      setErrorMessage('Kart eklemek için önce en az bir deste oluşturmalısınız.');
      return;
    }
    if (parsedDrafts.length === 0) {
      setErrorMessage('Geçerli satır bulunamadı. Her satır "Soru ; Cevap" biçiminde olmalıdır.');
      return;
    }

    onBulkImportCards(effectiveDeckId, parsedDrafts);
    const deckName = state.decks.find((d) => d.id === effectiveDeckId)?.title ?? 'seçili deste';
    setStatusMessage(`${parsedDrafts.length} yeni kart "${deckName}" destesine aktarıldı.`);
    setBulkText('');
  };

  const downloadFile = (filename: string, content: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportJson = () => {
    const json = JSON.stringify(state, null, 2);
    downloadFile('pekistir-yedek.json', json, 'application/json');
    setStatusMessage('Tüm desteler ve öğrenme geçmişi JSON olarak indirildi.');
  };

  const handleExportCsv = () => {
    const cardsToExport =
      exportDeckId === 'all'
        ? state.cards
        : state.cards.filter((c) => c.deckId === exportDeckId);
    const csv = exportCardsToCsv(cardsToExport);
    downloadFile('pekistir-kartlar.csv', csv, 'text/csv;charset=utf-8');
    setStatusMessage(`${cardsToExport.length} kart CSV olarak indirildi.`);
  };

  const handleJsonUpload = (e: ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    setStatusMessage(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as AppState;
        if (!Array.isArray(parsed.decks) || !Array.isArray(parsed.cards)) {
          setErrorMessage('Geçersiz JSON yedek dosyası formatı.');
          return;
        }
        onRestoreJson(parsed);
        setStatusMessage(
          `Yedek yüklendi: ${parsed.decks.length} deste ve ${parsed.cards.length} kart geri getirildi.`
        );
      } catch {
        setErrorMessage('JSON dosyası okunamadı. Lütfen geçerli bir yedek seçin.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
          Toplu Kart Ekleme ve Yedekleme
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Metin yapıştırarak saniyeler içinde onlarca kart oluşturun veya verilerinizi JSON / CSV olarak dışa aktarın.
        </p>
      </div>

      {statusMessage && (
        <div
          role="status"
          className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100 flex items-center gap-2.5 text-sm font-medium"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
          <span>{statusMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100 text-sm font-medium"
        >
          {errorMessage}
        </div>
      )}

      {/* Bulk Text Importer */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
              Metinden Toplu Kart Oluştur
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Her satırı <span className="font-mono-tabular">Ön Yüz ; Arka Yüz ; İpucu</span>{' '}
              (veya Sekme / Tab) ile ayırın.
            </p>
          </div>

          <div className="shrink-0">
            <label htmlFor="bulk-target-deck" className="sr-only">
              Hedef deste seçimi
            </label>
            <select
              id="bulk-target-deck"
              value={effectiveDeckId}
              onChange={(e) => setTargetDeckId(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100"
            >
              {state.decks.map((d: Deck) => (
                <option key={d.id} value={d.id}>
                  Hedef: {d.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="bulk-import-textarea" className="sr-only">
            Toplu kart metni
          </label>
          <textarea
            id="bulk-import-textarea"
            rows={5}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder="Soru 1 ; Cevap 1 ; İpucu 1"
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm font-mono-tabular focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        {/* Live Preview */}
        {parsedDrafts.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Canlı Önizleme ({parsedDrafts.length} kart algılandı)
            </div>
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg divide-y divide-slate-100 dark:divide-slate-800 max-h-48 overflow-y-auto">
              {parsedDrafts.map((item, idx) => (
                <div
                  key={idx}
                  className="px-3.5 py-2 text-xs grid grid-cols-1 sm:grid-cols-3 gap-2"
                >
                  <span className="font-medium text-slate-900 dark:text-slate-100 truncate">
                    {item.front}
                  </span>
                  <span className="text-slate-600 dark:text-slate-300 truncate">{item.back}</span>
                  <span className="text-slate-400 truncate">{item.hint ?? '—'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleImportSubmit}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <Upload className="w-4 h-4" aria-hidden="true" />
            <span>{parsedDrafts.length} Kartı Desteye Aktar</span>
          </button>
        </div>
      </section>

      {/* Export & Restore Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
            CSV Olarak Dışa Aktar
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Excel, Google E-Tablolar veya diğer flashcard araçlarıyla uyumlu noktalı virgül ayrılmış liste.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <label htmlFor="csv-export-deck" className="sr-only">
              CSV için deste seç
            </label>
            <select
              id="csv-export-deck"
              value={exportDeckId}
              onChange={(e) => setExportDeckId(e.target.value)}
              className="flex-1 min-w-40 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100"
            >
              <option value="all">Tüm Kartlar ({state.cards.length})</option>
              {state.decks.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" aria-hidden="true" />
              <span>CSV İndir</span>
            </button>
          </div>
        </section>

        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
            Tam JSON Yedekleme
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tüm desteleri, SM-2 tekrar aralıklarını ve çalışma geçmişini yedekleyin veya geri yükleyin.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleExportJson}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Download className="w-4 h-4" aria-hidden="true" />
              <span>JSON Yedek Al</span>
            </button>

            <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
              <Upload className="w-4 h-4" aria-hidden="true" />
              <span>JSON Yükle</span>
              <input type="file" accept=".json,application/json" onChange={handleJsonUpload} className="sr-only" />
            </label>
          </div>
        </section>
      </div>

      {/* Reset Demo Data */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="text-xs text-slate-500 dark:text-slate-400">
          Başlangıç örnek destelerine dönmek isterseniz yerel verileri sıfırlayabilirsiniz.
        </div>

        {confirmReset ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onResetDemoData();
                setConfirmReset(false);
                setStatusMessage('Örnek desteler ve başlangıç durumu geri yüklendi.');
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-700 text-white"
            >
              Sıfırlamayı Onayla
            </button>
            <button
              type="button"
              onClick={() => setConfirmReset(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              İptal
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Örnek Verileri Sıfırla</span>
          </button>
        )}
      </section>
    </div>
  );
}
