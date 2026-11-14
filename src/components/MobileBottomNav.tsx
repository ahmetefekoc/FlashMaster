import { BarChart3, FolderKanban, Layers, Upload } from 'lucide-react';
import type { ActiveTab } from '../types/flashcard';

interface MobileBottomNavProps {
  activeTab: ActiveTab;
  dueTotal: number;
  onSelectTab: (tab: Exclude<ActiveTab, 'deck-detail'>) => void;
}

const MOBILE_TABS: {
  id: Exclude<ActiveTab, 'deck-detail'>;
  label: string;
  Icon: typeof Layers;
}[] = [
  { id: 'decks', label: 'Desteler', Icon: FolderKanban },
  { id: 'study', label: 'Çalışma', Icon: Layers },
  { id: 'analytics', label: 'Analiz', Icon: BarChart3 },
  { id: 'import', label: 'Aktarım', Icon: Upload },
];

export function MobileBottomNav({ activeTab, dueTotal, onSelectTab }: MobileBottomNavProps) {
  return (
    <nav
      aria-label="Alt mobil gezinme"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-safe"
    >
      <div className="grid grid-cols-4 h-16 items-center">
        {MOBILE_TABS.map(({ id, label, Icon }) => {
          const isActive =
            activeTab === id || (id === 'decks' && activeTab === 'deck-detail');
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelectTab(id)}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex flex-col items-center justify-center min-h-[48px] w-full gap-1 transition-colors active:scale-95 ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon
                  className="w-5 h-5"
                  strokeWidth={isActive ? 2.25 : 1.75}
                  aria-hidden="true"
                />
                {id === 'study' && dueTotal > 0 && (
                  <span
                    aria-label={`${dueTotal} bekleyen kart`}
                    className="absolute -top-1.5 -right-3 text-[10px] font-bold tabular-nums leading-none text-blue-700 dark:text-blue-300"
                  >
                    {dueTotal}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-medium tracking-tight leading-none">
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
