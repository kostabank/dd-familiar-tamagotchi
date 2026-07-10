'use client';

import { useEffect, useState } from 'react';
import { Flame, AlertTriangle, X } from 'lucide-react';
import { useFamiliar } from '@/hooks/use-familiar';
import { cn } from '@/lib/utils';

interface StreakInfo {
  streak: number;
  atRisk: boolean;
  actedToday: boolean;
}

const DISMISS_KEY = 'ddt_streak_warning_dismissed_for';

/**
 * A dismissible warning banner shown at the top of the dashboard when the
 * player has an active streak (>= 1 day) but hasn't performed any action yet
 * today — i.e. the streak will reset at midnight MSK if they don't act.
 *
 * Auto-dismisses once the player performs an action (actedToday becomes true),
 * or until the next Moscow day if manually dismissed.
 */
export function StreakWarningBanner() {
  const { familiar } = useFamiliar();
  const [info, setInfo] = useState<StreakInfo | null>(null);
  const [dismissed, setDismissed] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      fetch('/api/familiar/streak', { credentials: 'same-origin' })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (!cancelled && d) {
            setInfo({ streak: d.streak, atRisk: d.atRisk, actedToday: d.actedToday });
            try {
              setDismissed(window.localStorage.getItem(DISMISS_KEY));
            } catch {
              /* noop */
            }
          }
        })
        .catch(() => {});
    load();
    // Re-check every 2 minutes (covers acting → banner should disappear).
    const t = window.setInterval(load, 120_000);
    return () => {
      cancelled = true;
      window.clearInterval(t);
    };
  }, [familiar?.sync, familiar?.energy, familiar?.mood]);

  if (!info || !info.atRisk || info.streak < 1) return null;

  // Dismissed for the current streak value → hide until streak changes.
  if (dismissed === String(info.streak)) return null;

  const dismiss = () => {
    try {
      window.localStorage.setItem(DISMISS_KEY, String(info.streak));
    } catch {
      /* noop */
    }
    setDismissed(String(info.streak));
  };

  const isHot = info.streak >= 7;

  return (
    <div
      className={cn(
        'mx-auto max-w-7xl mt-2 md:mt-3 rounded-xl border px-3 py-2 flex items-center gap-2.5 text-sm',
        'animate-[fade-in_0.3s_ease-out]',
      )}
      style={{
        borderColor: isHot ? 'rgba(239,68,68,0.45)' : 'rgba(249,115,22,0.45)',
        background: isHot
          ? 'linear-gradient(90deg, rgba(239,68,68,0.14), rgba(168,85,247,0.10))'
          : 'linear-gradient(90deg, rgba(249,115,22,0.14), rgba(234,179,8,0.10))',
      }}
    >
      <Flame className={cn('h-4 w-4 shrink-0 flame-flicker', isHot ? 'text-red-400' : 'text-orange-400')} />
      <div className="min-w-0 flex-1">
        <span className="font-semibold" style={{ color: isHot ? '#f87171' : '#fb923c' }}>
          Серия {info.streak} дн. под угрозой!
        </span>
        <span className="text-muted-foreground ml-1.5 text-xs md:text-sm">
          Любое действие сегодня сохранит серию — иначе она обнулится в полночь (МСК).
        </span>
      </div>
      <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0 hidden sm:block" />
      <button
        onClick={dismiss}
        className="shrink-0 h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/8 transition-colors"
        aria-label="Скрыть"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
