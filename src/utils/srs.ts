import type { Flashcard, MasteryStatus, RatingGrade } from '../types/flashcard';

const DAY_MS = 24 * 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

export function clampEaseFactor(ef: number): number {
  return Math.max(1.3, Math.min(3.0, Number(ef.toFixed(2))));
}

export function isCardDue(card: Pick<Flashcard, 'nextReviewAt'>, now = Date.now()): boolean {
  return card.nextReviewAt <= now;
}

export function getCardMasteryStatus(card: Pick<Flashcard, 'repetitions' | 'leitnerBox' | 'intervalDays'>): MasteryStatus {
  if (card.repetitions === 0) return 'new';
  if (card.leitnerBox >= 4 || card.intervalDays >= 14) return 'mastered';
  return 'learning';
}

export interface ScheduleResult {
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  leitnerBox: 1 | 2 | 3 | 4 | 5;
  lapses: number;
  nextReviewAt: number;
  lastReviewedAt: number;
  requeueInSession: boolean;
}

/**
 * Computes next SM-2 + Leitner scheduling parameters for a card given a 1–4 rating.
 * 1 = Tekrar (Again)
 * 2 = Zor (Hard)
 * 3 = İyi (Good)
 * 4 = Kolay (Easy)
 */
export function scheduleCard(
  card: Pick<Flashcard, 'easeFactor' | 'intervalDays' | 'repetitions' | 'leitnerBox' | 'lapses'>,
  rating: RatingGrade,
  now = Date.now()
): ScheduleResult {
  let { easeFactor, intervalDays, repetitions, leitnerBox, lapses } = card;
  let requeueInSession = false;

  if (rating === 1) {
    // Forgotten: reset repetitions and return to Leitner Box 1
    repetitions = 0;
    intervalDays = 0;
    leitnerBox = 1;
    lapses += 1;
    easeFactor = clampEaseFactor(easeFactor - 0.2);
    requeueInSession = true;
    return {
      easeFactor,
      intervalDays,
      repetitions,
      leitnerBox,
      lapses,
      nextReviewAt: now + 10 * MINUTE_MS,
      lastReviewedAt: now,
      requeueInSession,
    };
  }

  if (rating === 2) {
    // Hard: modest growth, slight ease penalty, box stays or drops at most 0
    easeFactor = clampEaseFactor(easeFactor - 0.14);
    if (repetitions === 0) {
      intervalDays = 0.5; // 12 hours
      repetitions = 1;
      leitnerBox = 1;
    } else {
      intervalDays = Math.max(1, Math.round(intervalDays * 1.2));
      repetitions += 1;
      leitnerBox = Math.min(5, Math.max(leitnerBox, 2)) as 1 | 2 | 3 | 4 | 5;
    }
  } else if (rating === 3) {
    // Good: canonical SM-2 steps (1d -> 6d -> interval * EF)
    if (repetitions === 0) {
      intervalDays = 1;
    } else if (repetitions === 1) {
      intervalDays = 6;
    } else {
      intervalDays = Math.max(intervalDays + 1, Math.round(intervalDays * easeFactor));
    }
    repetitions += 1;
    leitnerBox = Math.min(5, leitnerBox + 1) as 1 | 2 | 3 | 4 | 5;
  } else {
    // Easy (4): bonus EF and interval multiplier
    easeFactor = clampEaseFactor(easeFactor + 0.15);
    if (repetitions === 0) {
      intervalDays = 4;
    } else if (repetitions === 1) {
      intervalDays = 10;
    } else {
      intervalDays = Math.max(intervalDays + 2, Math.round(intervalDays * easeFactor * 1.3));
    }
    repetitions += 1;
    leitnerBox = Math.min(5, leitnerBox + 2) as 1 | 2 | 3 | 4 | 5;
  }

  return {
    easeFactor,
    intervalDays,
    repetitions,
    leitnerBox,
    lapses,
    nextReviewAt: now + Math.round(intervalDays * DAY_MS),
    lastReviewedAt: now,
    requeueInSession,
  };
}

export function formatIntervalTr(intervalDays: number, rating?: RatingGrade): string {
  if (rating === 1 || intervalDays <= 0) return '10 dk';
  if (intervalDays < 1) {
    const hours = Math.max(1, Math.round(intervalDays * 24));
    return `${hours} sa`;
  }
  if (intervalDays < 30) {
    return `${Math.round(intervalDays)} gün`;
  }
  const months = Math.round(intervalDays / 30);
  if (months < 12) return `${months} ay`;
  const years = (intervalDays / 365).toFixed(1).replace(/\.0$/, '');
  return `${years} yıl`;
}

export function previewIntervals(
  card: Pick<Flashcard, 'easeFactor' | 'intervalDays' | 'repetitions' | 'leitnerBox' | 'lapses'>,
  now = Date.now()
): Record<RatingGrade, string> {
  return {
    1: formatIntervalTr(scheduleCard(card, 1, now).intervalDays, 1),
    2: formatIntervalTr(scheduleCard(card, 2, now).intervalDays, 2),
    3: formatIntervalTr(scheduleCard(card, 3, now).intervalDays, 3),
    4: formatIntervalTr(scheduleCard(card, 4, now).intervalDays, 4),
  };
}
