import test from 'node:test';
import assert from 'node:assert/strict';
import {
  scheduleCard,
  previewIntervals,
  formatIntervalTr,
  isCardDue,
  getCardMasteryStatus,
} from './srs';

const baseCard = {
  easeFactor: 2.5,
  intervalDays: 0,
  repetitions: 0,
  leitnerBox: 1 as const,
  lapses: 0,
};

test('SM-2 Good rating progresses 1 day -> 6 days -> EF multiplied', () => {
  const now = 1_700_000_000_000;
  const step1 = scheduleCard(baseCard, 3, now);
  assert.equal(step1.intervalDays, 1);
  assert.equal(step1.repetitions, 1);
  assert.equal(step1.leitnerBox, 2);
  assert.equal(step1.requeueInSession, false);

  const step2 = scheduleCard(step1, 3, now);
  assert.equal(step2.intervalDays, 6);
  assert.equal(step2.repetitions, 2);
  assert.equal(step2.leitnerBox, 3);

  const step3 = scheduleCard(step2, 3, now);
  assert.equal(step3.intervalDays, 15);
  assert.equal(step3.repetitions, 3);
  assert.equal(step3.leitnerBox, 4);
});

test('SM-2 Again rating resets repetitions, increments lapses, drops to Box 1, and requeues', () => {
  const now = 1_700_000_000_000;
  const mature = {
    easeFactor: 2.5,
    intervalDays: 15,
    repetitions: 3,
    leitnerBox: 4 as const,
    lapses: 0,
  };
  const reset = scheduleCard(mature, 1, now);
  assert.equal(reset.repetitions, 0);
  assert.equal(reset.intervalDays, 0);
  assert.equal(reset.leitnerBox, 1);
  assert.equal(reset.lapses, 1);
  assert.equal(reset.easeFactor, 2.3);
  assert.equal(reset.requeueInSession, true);
  assert.equal(reset.nextReviewAt, now + 10 * 60 * 1000);
});

test('SM-2 Easy rating accelerates box & clamps ease factor <= 3.0', () => {
  const now = 1_700_000_000_000;
  const highEase = {
    easeFactor: 2.95,
    intervalDays: 10,
    repetitions: 2,
    leitnerBox: 4 as const,
    lapses: 0,
  };
  const next = scheduleCard(highEase, 4, now);
  assert.equal(next.easeFactor, 3.0);
  assert.equal(next.leitnerBox, 5);
  assert.ok(next.intervalDays >= 30);
});

test('previewIntervals returns readable Turkish interval labels', () => {
  const previews = previewIntervals(baseCard, 1_700_000_000_000);
  assert.equal(previews[1], '10 dk');
  assert.equal(previews[2], '12 sa');
  assert.equal(previews[3], '1 gün');
  assert.equal(previews[4], '4 gün');
  assert.equal(formatIntervalTr(60), '2 ay');
});

test('isCardDue and getCardMasteryStatus classify cards accurately', () => {
  const now = 1_700_000_000_000;
  assert.equal(isCardDue({ nextReviewAt: now - 1 }, now), true);
  assert.equal(isCardDue({ nextReviewAt: now + 5000 }, now), false);

  assert.equal(getCardMasteryStatus({ repetitions: 0, leitnerBox: 1, intervalDays: 0 }), 'new');
  assert.equal(getCardMasteryStatus({ repetitions: 2, leitnerBox: 2, intervalDays: 6 }), 'learning');
  assert.equal(getCardMasteryStatus({ repetitions: 4, leitnerBox: 4, intervalDays: 15 }), 'mastered');
});
