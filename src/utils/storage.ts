import type { AppState } from '../types/flashcard';
import { createSeedState } from '../data/seedDecks';

const STORAGE_KEY = 'pekistir_flashcards_v1';

export function loadAppState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = createSeedState();
      saveAppState(seeded);
      return seeded;
    }
    const parsed = JSON.parse(raw) as Partial<AppState>;
    if (!Array.isArray(parsed.decks) || !Array.isArray(parsed.cards)) {
      const seeded = createSeedState();
      saveAppState(seeded);
      return seeded;
    }
    return {
      decks: parsed.decks,
      cards: parsed.cards,
      reviewLogs: Array.isArray(parsed.reviewLogs) ? parsed.reviewLogs : [],
      settings: {
        dailyGoal: parsed.settings?.dailyGoal ?? 20,
        theme: parsed.settings?.theme === 'dark' ? 'dark' : 'light',
        autoReadFront: Boolean(parsed.settings?.autoReadFront),
      },
    };
  } catch {
    return createSeedState();
  }
}

export function saveAppState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export function resetAppStateToSeed(): AppState {
  const seeded = createSeedState();
  saveAppState(seeded);
  return seeded;
}

export function generateId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}
