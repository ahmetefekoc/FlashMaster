import test from 'node:test';
import assert from 'node:assert/strict';
import { computeSwipeFeedback, resolveSwipeCommit, SWIPE_THRESHOLD_PX } from './gestures';

test('computeSwipeFeedback stays neutral below activation deadzone', () => {
  const res = computeSwipeFeedback(10);
  assert.equal(res.action, null);
  assert.equal(res.progress, 0);
});

test('computeSwipeFeedback detects right (good) and left (again) swipe intensity', () => {
  const right = computeSwipeFeedback(SWIPE_THRESHOLD_PX);
  assert.equal(right.action, 'good');
  assert.equal(right.progress, 1);
  assert.ok(right.rotationDeg > 0);

  const left = computeSwipeFeedback(-50);
  assert.equal(left.action, 'again');
  assert.ok(left.progress > 0 && left.progress < 1);
  assert.ok(left.rotationDeg < 0);
});

test('resolveSwipeCommit triggers only when passing threshold', () => {
  assert.equal(resolveSwipeCommit(84), null);
  assert.equal(resolveSwipeCommit(85), 'good');
  assert.equal(resolveSwipeCommit(-84), null);
  assert.equal(resolveSwipeCommit(-85), 'again');
});
