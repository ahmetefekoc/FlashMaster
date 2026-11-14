import type { Flashcard, ReviewLog } from '../types/flashcard';
import { getCardMasteryStatus, isCardDue } from './srs';

const DAY_MS = 24 * 60 * 60 * 1000;

export function getLocalDayKey(timestampMs: number): string {
  const d = new Date(timestampMs);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export interface DashboardStats {
  totalCards: number;
  dueCards: number;
  masteredCards: number;
  learningCards: number;
  newCards: number;
  reviewedToday: number;
  retentionRate: number; // 0..100
  streakDays: number;
}

export function computeStreak(reviewLogs: ReviewLog[], now = Date.now()): number {
  if (reviewLogs.length === 0) return 0;

  const activeDays = new Set<string>(reviewLogs.map((log) => getLocalDayKey(log.reviewedAt)));
  const todayKey = getLocalDayKey(now);
  const yesterdayKey = getLocalDayKey(now - DAY_MS);

  // Streak stays alive if reviewed today OR yesterday
  let cursorMs = activeDays.has(todayKey)
    ? now
    : activeDays.has(yesterdayKey)
    ? now - DAY_MS
    : null;

  if (cursorMs === null) return 0;

  let streak = 0;
  while (activeDays.has(getLocalDayKey(cursorMs))) {
    streak += 1;
    cursorMs -= DAY_MS;
  }
  return streak;
}

export function computeDashboardStats(
  cards: Flashcard[],
  reviewLogs: ReviewLog[],
  now = Date.now()
): DashboardStats {
  const todayKey = getLocalDayKey(now);
  let dueCards = 0;
  let masteredCards = 0;
  let learningCards = 0;
  let newCards = 0;

  for (const card of cards) {
    if (isCardDue(card, now)) dueCards += 1;
    const status = getCardMasteryStatus(card);
    if (status === 'mastered') masteredCards += 1;
    else if (status === 'learning') learningCards += 1;
    else newCards += 1;
  }

  const reviewedToday = reviewLogs.filter((l) => getLocalDayKey(l.reviewedAt) === todayKey).length;

  const recentLogs = reviewLogs.filter((l) => l.reviewedAt >= now - 30 * DAY_MS);
  const successLogs = recentLogs.filter((l) => l.rating >= 2).length;
  const retentionRate =
    recentLogs.length > 0 ? Math.round((successLogs / recentLogs.length) * 100) : 100;

  return {
    totalCards: cards.length,
    dueCards,
    masteredCards,
    learningCards,
    newCards,
    reviewedToday,
    retentionRate,
    streakDays: computeStreak(reviewLogs, now),
  };
}

export interface LeitnerBoxBucket {
  box: 1 | 2 | 3 | 4 | 5;
  label: string;
  count: number;
  percentage: number;
}

const BOX_LABELS: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: 'Kutu 1 · Yeni / Tekrar',
  2: 'Kutu 2 · Tanıdık',
  3: 'Kutu 3 · Pekiştiriliyor',
  4: 'Kutu 4 · Güçlü',
  5: 'Kutu 5 · Kalıcı Bellek',
};

export function computeLeitnerDistribution(cards: Flashcard[]): LeitnerBoxBucket[] {
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const c of cards) {
    counts[c.leitnerBox] = (counts[c.leitnerBox] || 0) + 1;
  }
  const total = Math.max(1, cards.length);
  return ([1, 2, 3, 4, 5] as const).map((box) => ({
    box,
    label: BOX_LABELS[box],
    count: counts[box],
    percentage: Math.round((counts[box] / total) * 100),
  }));
}

export interface DailyActivityPoint {
  dayKey: string;
  shortLabel: string;
  totalReviews: number;
  successfulReviews: number;
}

const TR_MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

export function computeDailyActivity(
  reviewLogs: ReviewLog[],
  days = 14,
  now = Date.now()
): DailyActivityPoint[] {
  const map = new Map<string, { total: number; success: number }>();

  for (const log of reviewLogs) {
    const key = getLocalDayKey(log.reviewedAt);
    const prev = map.get(key) ?? { total: 0, success: 0 };
    prev.total += 1;
    if (log.rating >= 2) prev.success += 1;
    map.set(key, prev);
  }

  const points: DailyActivityPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const ts = now - i * DAY_MS;
    const d = new Date(ts);
    const key = getLocalDayKey(ts);
    const bucket = map.get(key) ?? { total: 0, success: 0 };
    points.push({
      dayKey: key,
      shortLabel: `${d.getDate()} ${TR_MONTHS[d.getMonth()]}`,
      totalReviews: bucket.total,
      successfulReviews: bucket.success,
    });
  }

  return points;
}

export function getHardestCards(cards: Flashcard[], limit = 8): Flashcard[] {
  return [...cards]
    .filter((c) => c.lapses > 0 || c.easeFactor < 2.3 || c.starred)
    .sort((a, b) => {
      if (b.lapses !== a.lapses) return b.lapses - a.lapses;
      return a.easeFactor - b.easeFactor;
    })
    .slice(0, limit);
}
