export type RatingGrade = 1 | 2 | 3 | 4; // 1: Tekrar (Again), 2: Zor (Hard), 3: İyi (Good), 4: Kolay (Easy)

export type StudyMode = 'flip' | 'typing' | 'quiz' | 'match';

export type StudyFilter = 'due' | 'all' | 'starred' | 'hard';

export type MasteryStatus = 'new' | 'learning' | 'mastered';

export type ActiveTab = 'decks' | 'study' | 'analytics' | 'import' | 'deck-detail';

export interface Flashcard {
  id: string;
  deckId: string;
  front: string;
  back: string;
  hint?: string;
  example?: string;
  tag?: string;
  starred: boolean;
  // SM-2 & Leitner state
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  leitnerBox: 1 | 2 | 3 | 4 | 5;
  lapses: number;
  nextReviewAt: number; // timestamp ms
  lastReviewedAt?: number;
  createdAt: number;
}

export interface Deck {
  id: string;
  title: string;
  description: string;
  category: string;
  langCode?: string; // e.g., 'en-US', 'tr-TR' for Web Speech API
  createdAt: number;
}

export interface ReviewLog {
  id: string;
  cardId: string;
  deckId: string;
  rating: RatingGrade;
  mode: StudyMode;
  reviewedAt: number; // timestamp ms
}

export interface AppSettings {
  dailyGoal: number;
  theme: 'light' | 'dark';
  autoReadFront: boolean;
}

export interface AppState {
  decks: Deck[];
  cards: Flashcard[];
  reviewLogs: ReviewLog[];
  settings: AppSettings;
}
