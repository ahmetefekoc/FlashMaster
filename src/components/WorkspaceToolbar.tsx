import { Moon, Sun, Flame, Target, Timer } from 'lucide-react';

interface WorkspaceToolbarProps {
  reviewedToday: number;
  dailyGoal: number;
  streakDays: number;
  dueTotal: number;
  theme: 'light' | 'dark';
  showPomodoro: boolean;
  onToggleTheme: () => void;
  onTogglePomodoro: () => void;
  onUpdateDailyGoal: (goal: number) => void;
}

export function WorkspaceToolbar({
  reviewedToday,
  dailyGoal,
  streakDays,
  dueTotal,
  theme,
  showPomodoro,
  onToggleTheme,
  onTogglePomodoro,
  onUpdateDailyGoal,
}: WorkspaceToolbarProps) {
  const goalPercent = Math.min(100, Math.round((reviewedToday / Math.max(1, dailyGoal)) * 100));

  return (
    <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/50">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-2 flex items-center justify-between gap-3 text-xs sm:text-sm">
        {/* Left: Compact daily goal + streak metadata (scrolls cleanly if ultra-narrow) */}
        <div className="flex items-center gap-3 sm:gap-5 text-slate-600 dark:text-slate-400 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <Target className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
              Günlük Hedef:
            </span>
            <span className="tabular-nums font-semibold text-slate-900 dark:text-slate-100">
              {reviewedToday}/{dailyGoal}
            </span>
            <div
              className="hidden sm:block w-20 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={goalPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Günlük çalışma hedefi ilerlemesi"
            >
              <div
                className="h-full bg-blue-600 dark:bg-blue-400 transition-all duration-200"
                style={{ width: `${goalPercent}%` }}
              />
            </div>
            <label htmlFor="daily-goal-select" className="sr-only">
              Günlük kart hedefi
            </label>
            <select
              id="daily-goal-select"
              value={dailyGoal}
              onChange={(e) => onUpdateDailyGoal(Number(e.target.value))}
              className="hidden md:block bg-transparent text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 cursor-pointer tabular-nums"
              aria-label="Günlük hedef sayısı"
            >
              <option value={10}>10/gün</option>
              <option value={20}>20/gün</option>
              <option value={30}>30/gün</option>
              <option value={50}>50/gün</option>
            </select>
          </div>

          <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">
            ·
          </span>

          <div className="flex items-center gap-1 whitespace-nowrap shrink-0">
            <Flame className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" aria-hidden="true" />
            <span className="tabular-nums font-semibold text-slate-900 dark:text-slate-100">
              {streakDays} gün
            </span>
            <span className="hidden sm:inline">seri</span>
          </div>

          <span className="hidden sm:inline text-slate-300 dark:text-slate-700" aria-hidden="true">
            ·
          </span>

          <div className="hidden sm:block whitespace-nowrap">
            <span className="tabular-nums font-semibold text-slate-900 dark:text-slate-100">
              {dueTotal}
            </span>{' '}
            <span>kart tekrar bekliyor</span>
          </div>
        </div>

        {/* Right: Pomodoro toggle & Theme switch (44px touch targets on mobile) */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onTogglePomodoro}
            aria-pressed={showPomodoro}
            aria-label="Odak sayacını aç veya kapat"
            className={`inline-flex items-center justify-center gap-1.5 min-h-[40px] sm:min-h-0 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap shrink-0 ${
              showPomodoro
                ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/60 dark:border-blue-800 dark:text-blue-300'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            <Timer className="w-4 h-4 sm:w-3.5 sm:h-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Odak Sayacı</span>
            <span className="sm:hidden">Odak</span>
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Açık temaya geç' : 'Koyu temaya geç'}
            className="inline-flex items-center justify-center gap-1.5 min-h-[40px] min-w-[40px] sm:min-h-0 sm:min-w-0 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-amber-400" aria-hidden="true" />
                <span className="hidden sm:inline">Açık Tema</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-slate-600" aria-hidden="true" />
                <span className="hidden sm:inline">Koyu Tema</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
