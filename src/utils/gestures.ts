export type SwipeAction = 'again' | 'good' | null;

export interface SwipeFeedback {
  action: SwipeAction;
  progress: number; // 0..1 intensity
  rotationDeg: number;
}

export const SWIPE_THRESHOLD_PX = 85;
export const SWIPE_ACTIVATE_PX = 18;

export function computeSwipeFeedback(dx: number, threshold = SWIPE_THRESHOLD_PX): SwipeFeedback {
  const abs = Math.abs(dx);
  if (abs < SWIPE_ACTIVATE_PX) {
    return {
      action: null,
      progress: 0,
      rotationDeg: Number((dx * 0.03).toFixed(2)),
    };
  }

  const action: SwipeAction = dx > 0 ? 'good' : 'again';
  const progress = Math.min(1, Number(((abs - SWIPE_ACTIVATE_PX) / (threshold - SWIPE_ACTIVATE_PX)).toFixed(2)));
  const clampedDx = Math.max(-180, Math.min(180, dx));
  const rotationDeg = Number((clampedDx * 0.05).toFixed(2));

  return {
    action,
    progress,
    rotationDeg,
  };
}

export function resolveSwipeCommit(dx: number, threshold = SWIPE_THRESHOLD_PX): SwipeAction {
  if (dx >= threshold) return 'good';
  if (dx <= -threshold) return 'again';
  return null;
}

export function triggerHaptic(durationMs = 12): void {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(durationMs);
    } catch {
      // Ignore environments blocking vibration without prior gesture
    }
  }
}
