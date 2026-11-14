import { Play, Pause, RotateCcw, Coffee, Brain } from 'lucide-react';
import { useEffect, useState } from 'react';

type TimerPhase = 'focus' | 'break';

const FOCUS_SECONDS = 25 * 60;
const BREAK_SECONDS = 5 * 60;

export function PomodoroWidget() {
  const [phase, setPhase] = useState<TimerPhase>('focus');
  const [secondsLeft, setSecondsLeft] = useState(FOCUS_SECONDS);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setRunning(false);
          const nextPhase: TimerPhase = phase === 'focus' ? 'break' : 'focus';
          setPhase(nextPhase);
          return nextPhase === 'focus' ? FOCUS_SECONDS : BREAK_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running, phase]);

  const switchPhase = (target: TimerPhase) => {
    setRunning(false);
    setPhase(target);
    setSecondsLeft(target === 'focus' ? FOCUS_SECONDS : BREAK_SECONDS);
  };

  const resetTimer = () => {
    setRunning(false);
    setSecondsLeft(phase === 'focus' ? FOCUS_SECONDS : BREAK_SECONDS);
  };

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const secs = String(secondsLeft % 60).padStart(2, '0');

  return (
    <section
      aria-label="Odak Zamanlayıcı"
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          {phase === 'focus' ? (
            <Brain className="w-4 h-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
          ) : (
            <Coffee className="w-4 h-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          )}
        </div>
        <div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {phase === 'focus' ? 'Derin Odak Oturumu (25 dk)' : 'Kısa Dinlenme Molası (5 dk)'}
          </div>
          <div className="text-2xl font-mono-tabular font-semibold text-slate-900 dark:text-slate-50">
            {mins}:{secs}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <button
            type="button"
            onClick={() => switchPhase('focus')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              phase === 'focus'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Odak 25 dk
          </button>
          <button
            type="button"
            onClick={() => switchPhase('break')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              phase === 'break'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Mola 5 dk
          </button>
        </div>

        <button
          type="button"
          onClick={() => setRunning((r) => !r)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors whitespace-nowrap"
        >
          {running ? (
            <>
              <Pause className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Duraklat</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Başlat</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={resetTimer}
          aria-label="Odak sayacını sıfırla"
          className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <RotateCcw className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
