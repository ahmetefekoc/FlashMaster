import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnalyticsView } from './components/AnalyticsView';
import { DeckDetailView } from './components/DeckDetailView';
import { DeckLibraryView } from './components/DeckLibraryView';
import { DeckModal } from './components/DeckModal';
import { ImportExportView } from './components/ImportExportView';
import { MobileBottomNav } from './components/MobileBottomNav';
import { PomodoroWidget } from './components/PomodoroWidget';
import { StudyStudioView } from './components/StudyStudioView';
import { TopBar } from './components/TopBar';
import { WorkspaceToolbar } from './components/WorkspaceToolbar';
import type {
  ActiveTab,
  AppState,
  Deck,
  Flashcard,
  RatingGrade,
  ReviewLog,
  StudyFilter,
  StudyMode,
} from './types/flashcard';
import { computeDashboardStats } from './utils/analytics';
import { scheduleCard } from './utils/srs';
import { generateId, loadAppState, resetAppStateToSeed, saveAppState } from './utils/storage';
import type { ParsedBulkCard } from './utils/studyModes';

export default function App() {
  const [state, setState] = useState<AppState>(() => loadAppState());
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') return 'study';
    }
    return 'decks';
  });

  const [selectedDeckId, setSelectedDeckId] = useState<string | 'all'>('all');
  const [detailDeckId, setDetailDeckId] = useState<string | null>(null);
  const [studyInitialFilter, setStudyInitialFilter] = useState<StudyFilter>('due');
  const [showPomodoro, setShowPomodoro] = useState(false);

  const [deckModalOpen, setDeckModalOpen] = useState(false);
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null);

  // Sync theme class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (state.settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [state.settings.theme]);

  // Persist to localStorage
  useEffect(() => {
    saveAppState(state);
  }, [state]);

  const dashboardStats = useMemo(
    () => computeDashboardStats(state.cards, state.reviewLogs),
    [state.cards, state.reviewLogs]
  );

  const handleToggleTheme = () => {
    setState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        theme: prev.settings.theme === 'dark' ? 'light' : 'dark',
      },
    }));
  };

  const handleUpdateDailyGoal = (goal: number) => {
    setState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        dailyGoal: goal,
      },
    }));
  };

  const handleStartStudy = (deckId: string | 'all', filter: StudyFilter = 'due') => {
    setSelectedDeckId(deckId);
    setStudyInitialFilter(filter);
    setActiveTab('study');
  };

  const handleSaveDeck = (payload: {
    title: string;
    description: string;
    category: string;
    langCode: string;
  }) => {
    if (editingDeck) {
      setState((prev) => ({
        ...prev,
        decks: prev.decks.map((d) =>
          d.id === editingDeck.id ? { ...d, ...payload } : d
        ),
      }));
    } else {
      const newDeck: Deck = {
        id: generateId('deck'),
        title: payload.title,
        description: payload.description,
        category: payload.category,
        langCode: payload.langCode,
        createdAt: Date.now(),
      };
      setState((prev) => ({
        ...prev,
        decks: [newDeck, ...prev.decks],
      }));
      setDetailDeckId(newDeck.id);
      setActiveTab('deck-detail');
    }
    setEditingDeck(null);
  };

  const handleDeleteDeck = (deckId: string) => {
    setState((prev) => ({
      ...prev,
      decks: prev.decks.filter((d) => d.id !== deckId),
      cards: prev.cards.filter((c) => c.deckId !== deckId),
      reviewLogs: prev.reviewLogs.filter((l) => l.deckId !== deckId),
    }));
    if (detailDeckId === deckId) {
      setDetailDeckId(null);
      setActiveTab('decks');
    }
    if (selectedDeckId === deckId) {
      setSelectedDeckId('all');
    }
  };

  const handleAddCard = (payload: {
    deckId: string;
    front: string;
    back: string;
    hint?: string;
    example?: string;
    tag?: string;
  }) => {
    const now = Date.now();
    const newCard: Flashcard = {
      id: generateId('card'),
      deckId: payload.deckId,
      front: payload.front,
      back: payload.back,
      hint: payload.hint,
      example: payload.example,
      tag: payload.tag,
      starred: false,
      easeFactor: 2.5,
      intervalDays: 0,
      repetitions: 0,
      leitnerBox: 1,
      lapses: 0,
      nextReviewAt: now,
      createdAt: now,
    };
    setState((prev) => ({
      ...prev,
      cards: [newCard, ...prev.cards],
    }));
  };

  const handleUpdateCard = (
    cardId: string,
    payload: { front: string; back: string; hint?: string; example?: string; tag?: string }
  ) => {
    setState((prev) => ({
      ...prev,
      cards: prev.cards.map((c) => (c.id === cardId ? { ...c, ...payload } : c)),
    }));
  };

  const handleDeleteCard = (cardId: string) => {
    setState((prev) => ({
      ...prev,
      cards: prev.cards.filter((c) => c.id !== cardId),
      reviewLogs: prev.reviewLogs.filter((l) => l.cardId !== cardId),
    }));
  };

  const handleToggleStar = useCallback((cardId: string) => {
    setState((prev) => ({
      ...prev,
      cards: prev.cards.map((c) =>
        c.id === cardId ? { ...c, starred: !c.starred } : c
      ),
    }));
  }, []);

  const handleResetCardProgress = (cardId: string) => {
    const now = Date.now();
    setState((prev) => ({
      ...prev,
      cards: prev.cards.map((c) =>
        c.id === cardId
          ? {
              ...c,
              easeFactor: 2.5,
              intervalDays: 0,
              repetitions: 0,
              leitnerBox: 1,
              lapses: 0,
              nextReviewAt: now,
              lastReviewedAt: undefined,
            }
          : c
      ),
    }));
  };

  const handleRateCard = useCallback(
    (cardId: string, rating: RatingGrade, mode: StudyMode): boolean => {
      const now = Date.now();
      let shouldRequeue = false;

      setState((prev) => {
        const target = prev.cards.find((c) => c.id === cardId);
        if (!target) return prev;

        const nextSchedule = scheduleCard(target, rating, now);
        shouldRequeue = nextSchedule.requeueInSession;

        const newLog: ReviewLog = {
          id: generateId('log'),
          cardId,
          deckId: target.deckId,
          rating,
          mode,
          reviewedAt: now,
        };

        return {
          ...prev,
          cards: prev.cards.map((c) =>
            c.id === cardId
              ? {
                  ...c,
                  easeFactor: nextSchedule.easeFactor,
                  intervalDays: nextSchedule.intervalDays,
                  repetitions: nextSchedule.repetitions,
                  leitnerBox: nextSchedule.leitnerBox,
                  lapses: nextSchedule.lapses,
                  nextReviewAt: nextSchedule.nextReviewAt,
                  lastReviewedAt: nextSchedule.lastReviewedAt,
                }
              : c
          ),
          reviewLogs: [...prev.reviewLogs, newLog],
        };
      });

      return shouldRequeue || rating === 1;
    },
    []
  );

  const handleBulkImportCards = (deckId: string, drafts: ParsedBulkCard[]) => {
    const now = Date.now();
    const newCards: Flashcard[] = drafts.map((d, idx) => ({
      id: generateId(`bulk-${idx}`),
      deckId,
      front: d.front,
      back: d.back,
      hint: d.hint,
      example: d.example,
      starred: false,
      easeFactor: 2.5,
      intervalDays: 0,
      repetitions: 0,
      leitnerBox: 1,
      lapses: 0,
      nextReviewAt: now,
      createdAt: now + idx,
    }));

    setState((prev) => ({
      ...prev,
      cards: [...newCards, ...prev.cards],
    }));
  };

  const detailDeck = detailDeckId
    ? state.decks.find((d) => d.id === detailDeckId) ?? null
    : null;

  const handleSelectTab = (tab: Exclude<ActiveTab, 'deck-detail'>) => {
    setActiveTab(tab);
    setDetailDeckId(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <TopBar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onOpenNewDeck={() => {
          setEditingDeck(null);
          setDeckModalOpen(true);
        }}
      />

      <WorkspaceToolbar
        reviewedToday={dashboardStats.reviewedToday}
        dailyGoal={state.settings.dailyGoal}
        streakDays={dashboardStats.streakDays}
        dueTotal={dashboardStats.dueCards}
        theme={state.settings.theme}
        showPomodoro={showPomodoro}
        onToggleTheme={handleToggleTheme}
        onTogglePomodoro={() => setShowPomodoro((s) => !s)}
        onUpdateDailyGoal={handleUpdateDailyGoal}
      />

      <main className="flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-6 pt-5 pb-24 md:py-8 space-y-5 sm:space-y-6">
        {showPomodoro && <PomodoroWidget />}

        {activeTab === 'decks' && (
          <DeckLibraryView
            decks={state.decks}
            cards={state.cards}
            onStartStudy={(deckId) => handleStartStudy(deckId, 'due')}
            onManageDeck={(deckId) => {
              setDetailDeckId(deckId);
              setActiveTab('deck-detail');
            }}
            onEditDeck={(deck) => {
              setEditingDeck(deck);
              setDeckModalOpen(true);
            }}
            onDeleteDeck={handleDeleteDeck}
            onOpenNewDeck={() => {
              setEditingDeck(null);
              setDeckModalOpen(true);
            }}
          />
        )}

        {activeTab === 'deck-detail' && detailDeck && (
          <DeckDetailView
            deck={detailDeck}
            cards={state.cards.filter((c) => c.deckId === detailDeck.id)}
            onBack={() => {
              setDetailDeckId(null);
              setActiveTab('decks');
            }}
            onStartStudy={(deckId) => handleStartStudy(deckId, 'all')}
            onAddCard={handleAddCard}
            onUpdateCard={handleUpdateCard}
            onDeleteCard={handleDeleteCard}
            onToggleStar={handleToggleStar}
            onResetCardProgress={handleResetCardProgress}
          />
        )}

        {activeTab === 'study' && (
          <StudyStudioView
            decks={state.decks}
            cards={state.cards}
            selectedDeckId={selectedDeckId}
            initialFilter={studyInitialFilter}
            onSelectDeckId={setSelectedDeckId}
            onRateCard={handleRateCard}
            onToggleStar={handleToggleStar}
            onBackToDecks={() => setActiveTab('decks')}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView
            decks={state.decks}
            cards={state.cards}
            reviewLogs={state.reviewLogs}
            onStudyHardCards={() => handleStartStudy('all', 'hard')}
          />
        )}

        {activeTab === 'import' && (
          <ImportExportView
            state={state}
            onBulkImportCards={handleBulkImportCards}
            onRestoreJson={(next) => setState(next)}
            onResetDemoData={() => setState(resetAppStateToSeed())}
          />
        )}
      </main>

      <MobileBottomNav
        activeTab={activeTab}
        dueTotal={dashboardStats.dueCards}
        onSelectTab={handleSelectTab}
      />

      <DeckModal
        open={deckModalOpen}
        editingDeck={editingDeck}
        onClose={() => {
          setDeckModalOpen(false);
          setEditingDeck(null);
        }}
        onSave={handleSaveDeck}
      />
    </div>
  );
}
