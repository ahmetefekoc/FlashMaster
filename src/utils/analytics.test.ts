import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeStreak,
  computeDashboardStats,
  computeLeitnerDistribution,
  computeDailyActivity,
  getHardestCards,
} from './analytics';
import type { Flashcard, ReviewLog } from '../types/flashcard';

const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = new Date(2026, 10, 14, 12, 0, 0).getTime();

const sampleCards: Flashcard[] = [
  {
    id: '1',
    deckId: 'd1',
    front: 'F1',
    back: 'B1',
    starred: false,
    easeFactor: 2.5,
    intervalDays: 0,
    repetitions: 0,
    leitnerBox: 1,
    lapses: 0,
    nextReviewAt: NOW - 1000,
    createdAt: NOW - 5 * DAY_MS,
  },
  {
    id: '2',
    deckId: 'd1',
    front: 'F2',
    back: 'B2',
    starred: true,
    easeFactor: 1.9,
    intervalDays: 3,
    repetitions: 2,
    leitnerBox: 2,
    lapses: 3,
    nextReviewAt: NOW + DAY_MS,
    createdAt: NOW - 5 * DAY_MS,
  },
  {
    id: '3',
    deckId: 'd1',
    front: 'F3',
    back: 'B3',
    starred: false,
    easeFactor: 2.7,
    intervalDays: 20,
    repetitions: 5,
    leitnerBox: 5,
    lapses: 0,
    nextReviewAt: NOW + 10 * DAY_MS,
    createdAt: NOW - 10 * DAY_MS,
  },
];

const sampleLogs: ReviewLog[] = [
  { id: 'l1', cardId: '1', deckId: 'd1', rating: 3, mode: 'flip', reviewedAt: NOW - 1000 },
  { id: 'l2', cardId: '2', deckId: 'd1', rating: 1, mode: 'flip', reviewedAt: NOW - 500 },
  { id: 'l3', cardId: '3', deckId: 'd1', rating: 4, mode: 'quiz', reviewedAt: NOW - DAY_MS },
  { id: 'l4', cardId: '3', deckId: 'd1', rating: 3, mode: 'flip', reviewedAt: NOW - 2 * DAY_MS },
];

test('computeStreak counts consecutive active days up to today', () => {
  assert.equal(computeStreak(sampleLogs, NOW), 3);
  assert.equal(computeStreak([], NOW), 0);
});

test('computeDashboardStats summarizes counts and retention rate accurately', () => {
  const stats = computeDashboardStats(sampleCards, sampleLogs, NOW);
  assert.equal(stats.totalCards, 3);
  assert.equal(stats.dueCards, 1);
  assert.equal(stats.newCards, 1);
  assert.equal(stats.learningCards, 1);
  assert.equal(stats.masteredCards, 1);
  assert.equal(stats.reviewedToday, 2);
  assert.equal(stats.retentionRate, 75);
  assert.equal(stats.streakDays, 3);
});

test('computeLeitnerDistribution and computeDailyActivity return complete buckets', () => {
  const dist = computeLeitnerDistribution(sampleCards);
  assert.equal(dist.length, 5);
  assert.equal(dist[0].count, 1);
  assert.equal(dist[4].count, 1);

  const activity = computeDailyActivity(sampleLogs, 14, NOW);
  assert.equal(activity.length, 14);
  assert.equal(activity[13].totalReviews, 2);
  assert.equal(activity[12].totalReviews, 1);
});

test('getHardestCards prioritizes cards with most lapses', () => {
  const hardest = getHardestCards(sampleCards, 5);
  assert.equal(hardest[0].id, '2');
});
