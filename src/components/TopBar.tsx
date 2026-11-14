import { Plus } from 'lucide-react';
import type { ActiveTab } from '../types/flashcard';

interface TopBarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: Exclude<ActiveTab, 'deck-detail'>) => void;
  onOpenNewDeck: () => void;
}

const NAV_ITEMS: { id: Exclude<ActiveTab, 'deck-detail'>; label: string }[] = [
  { id: 'decks', label: 'Desteler' },
  { id: 'study', label: 'Çalışma' },
  { id: 'analytics', label: 'İstatistikler' },
  { id: 'import', label: 'İçe / Dışa Aktar' },
];

export function TopBar({ activeTab, onSelectTab, onOpenNewDeck }: TopBarProps) {
  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line brand wordmark */}
        <button
          type="button"
          onClick={() => onSelectTab('decks')}
          className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50 whitespace-nowrap shrink-0 min-h-[44px] flex items-center focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600 rounded"
        >
          Pekiştir
        </button>

        {/* Zone 2: 4 single-line navigation links (Desktop; mobile uses MobileBottomNav) */}
        <nav aria-label="Ana gezinme" className="hidden md:flex items-center gap-7">
          {NAV_ITEMS.map((item) => {
            const isActive =
              activeTab === item.id || (item.id === 'decks' && activeTab === 'deck-detail');
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`py-5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                  isActive
                    ? 'border-blue-600 text-blue-700 dark:text-blue-400 dark:border-blue-400'
                    : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onOpenNewDeck}
            className="inline-flex items-center gap-1.5 px-4 min-h-[44px] sm:min-h-[38px] text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-xl sm:rounded-lg transition-colors active:scale-[0.98] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Yeni Deste</span>
          </button>
        </div>
      </div>
    </header>
  );
}
