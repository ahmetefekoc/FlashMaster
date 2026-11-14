import { Play } from 'lucide-react';
import { useMemo } from 'react';
import type { Deck, Flashcard, ReviewLog } from '../types/flashcard';
import {
  computeDailyActivity,
  computeDashboardStats,
  computeLeitnerDistribution,
  getHardestCards,
} from '../utils/analytics';
import { stripClozeBraces } from '../utils/studyModes';

interface AnalyticsViewProps {
  decks: Deck[];
  cards: Flashcard[];
  reviewLogs: ReviewLog[];
  onStudyHardCards: () => void;
}

export function AnalyticsView({
  decks,
  cards,
  reviewLogs,
  onStudyHardCards,
}: AnalyticsViewProps) {
  const stats = useMemo(() => computeDashboardStats(cards, reviewLogs), [cards, reviewLogs]);
  const leitnerBoxes = useMemo(() => computeLeitnerDistribution(cards), [cards]);
  const activity = useMemo(() => computeDailyActivity(reviewLogs, 14), [reviewLogs]);
  const hardestCards = useMemo(() => getHardestCards(cards, 8), [cards]);

  const deckTitleMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const d of decks) map.set(d.id, d.title);
    return map;
  }, [decks]);

  const maxDailyReviews = Math.max(1, ...activity.map((a) => a.totalReviews));

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Öğrenme ve Pekiştirme Analitiği
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Leitner kutu dağılımı, günlük hatırlama başarısı ve zorlanılan kavramlar.
          </p>
        </div>

        {hardestCards.length > 0 && (
          <button
            type="button"
            onClick={onStudyHardCards}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors whitespace-nowrap self-start sm:self-auto"
          >
            <Play className="w-4 h-4" aria-hidden="true" />
            <span>Zor Kartları Çalış</span>
          </button>
        )}
      </div>

      {/* KPI Strip */}
      <section
        aria-label="Temel öğrenme metrikleri"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="text-xs text-slate-500 dark:text-slate-400">Toplam Kart</div>
          <div className="mt-1 text-2xl font-mono-tabular font-bold text-slate-900 dark:text-slate-50">
            {stats.totalCards}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-mono-tabular">
            {stats.newCards} yeni · {stats.learningCards} öğreniliyor
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="text-xs text-slate-500 dark:text-slate-400">Kalıcı Bellek (Kutu 4–5)</div>
          <div className="mt-1 text-2xl font-mono-tabular font-bold text-emerald-700 dark:text-emerald-400">
            {stats.masteredCards}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-mono-tabular">
            %{stats.totalCards > 0 ? Math.round((stats.masteredCards / stats.totalCards) * 100) : 0}{' '}
            pekiştirme oranı
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="text-xs text-slate-500 dark:text-slate-400">30 Günlük Hatırlama</div>
          <div className="mt-1 text-2xl font-mono-tabular font-bold text-blue-700 dark:text-blue-400">
            %{stats.retentionRate}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-mono-tabular">
            Bugün: {stats.reviewedToday} tekrar
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="text-xs text-slate-500 dark:text-slate-400">Çalışma Serisi</div>
          <div className="mt-1 text-2xl font-mono-tabular font-bold text-amber-700 dark:text-amber-400">
            {stats.streakDays} gün
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-mono-tabular">
            Bekleyen: {stats.dueCards} kart
          </div>
        </div>
      </section>

      {/* Two-Column Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leitner Box Distribution */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
              Leitner Kutu Dağılımı
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Kartlar doğru hatırlandıkça Kutu 1’den kalıcı bellek Kutu 5’e taşınır.
            </p>
          </div>

          <div className="space-y-3.5">
            {leitnerBoxes.map((bucket) => (
              <div key={bucket.box} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {bucket.label}
                  </span>
                  <span className="font-mono-tabular text-slate-600 dark:text-slate-400">
                    {bucket.count} kart (%{bucket.percentage})
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      bucket.box >= 4
                        ? 'bg-emerald-600 dark:bg-emerald-500'
                        : bucket.box >= 2
                        ? 'bg-blue-600 dark:bg-blue-500'
                        : 'bg-slate-400 dark:bg-slate-500'
                    }`}
                    style={{ width: `${bucket.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 14-Day Activity Chart */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5 flex flex-col justify-between">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                Son 14 Günlük Tekrar Aktivitesi
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Günlük yapılan toplam kart tekrarı ve başarılı hatırlama sayısı.
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-blue-600 dark:bg-blue-500 inline-block" aria-hidden="true" />
                Başarılı
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-slate-300 dark:bg-slate-700 inline-block" aria-hidden="true" />
                Tekrar
              </span>
            </div>
          </div>

          <div className="h-44 flex items-end gap-1.5 pt-4" aria-label="14 günlük çalışma grafiği">
            {activity.map((point) => {
              const totalHeightPct = Math.round((point.totalReviews / maxDailyReviews) * 100);
              const successHeightPct =
                point.totalReviews > 0
                  ? Math.round((point.successfulReviews / point.totalReviews) * 100)
                  : 0;

              return (
                <div
                  key={point.dayKey}
                  className="flex-1 flex flex-col items-center justify-end h-full gap-1.5"
                  title={`${point.shortLabel}: ${point.totalReviews} tekrar (${point.successfulReviews} başarılı)`}
                >
                  <span
                    className={`text-[10px] font-mono-tabular ${
                      point.totalReviews > 0
                        ? 'text-slate-600 dark:text-slate-300 font-medium'
                        : 'text-transparent select-none'
                    }`}
                  >
                    {point.totalReviews}
                  </span>
                  <div className="w-full max-w-7 flex-1 flex items-end">
                    <div
                      className="w-full bg-slate-200 dark:bg-slate-800 rounded-t-sm overflow-hidden flex flex-col justify-end"
                      style={{ height: `${Math.max(point.totalReviews > 0 ? 12 : 4, totalHeightPct)}%` }}
                    >
                      {point.totalReviews > 0 && (
                        <div
                          className="w-full bg-blue-600 dark:bg-blue-500"
                          style={{ height: `${successHeightPct}%` }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono-tabular text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>{activity[0]?.shortLabel}</span>
            <span>{activity[Math.floor(activity.length / 2)]?.shortLabel}</span>
            <span>{activity[activity.length - 1]?.shortLabel}</span>
          </div>
        </section>
      </div>

      {/* Hardest Cards Table */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
            En Çok Zorlanılan Kartlar
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Hata sayısı (lapse) yüksek veya kolaylık katsayısı düşük kartlar.
          </p>
        </div>

        {hardestCards.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
            Henüz zorlanılan kart kaydı bulunmuyor.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 bg-slate-50/70 dark:bg-slate-950/40">
                  <th className="py-3 px-5 font-medium">Ön Yüz</th>
                  <th className="py-3 px-5 font-medium">Cevap</th>
                  <th className="py-3 px-5 font-medium">Deste</th>
                  <th className="py-3 px-5 font-medium text-right">Kutu</th>
                  <th className="py-3 px-5 font-medium text-right">Hata</th>
                  <th className="py-3 px-5 font-medium text-right">Katsayı</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {hardestCards.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-5 font-medium text-slate-900 dark:text-slate-100 max-w-xs truncate">
                      {stripClozeBraces(c.front)}
                    </td>
                    <td className="py-3 px-5 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                      {c.back}
                    </td>
                    <td className="py-3 px-5 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {deckTitleMap.get(c.deckId) ?? '—'}
                    </td>
                    <td className="py-3 px-5 text-right font-mono-tabular text-slate-700 dark:text-slate-300">
                      {c.leitnerBox}/5
                    </td>
                    <td className="py-3 px-5 text-right font-mono-tabular text-red-700 dark:text-red-400 font-semibold">
                      {c.lapses}
                    </td>
                    <td className="py-3 px-5 text-right font-mono-tabular text-slate-600 dark:text-slate-400">
                      {c.easeFactor.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
