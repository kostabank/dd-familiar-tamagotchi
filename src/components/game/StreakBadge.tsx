'use client';

import { useEffect, useState } from 'react';
import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * A compact streak badge for the header. Shows the current consecutive-day
 * activity streak (Moscow days) with a flickering flame. Polls on mount and
 * refreshes every 60s.
 */
export function StreakBadge() {
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      fetch('/api/familiar/streak', { credentials: 'same-origin' })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (!cancelled && d && typeof d.streak === 'number') setStreak(d.streak);
        })
        .catch(() => {});
    load();
    const t = window.setInterval(load, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(t);
    };
  }, []);

  if (streak <= 0) return null;

  // Color intensity grows with streak length.
  const hot = streak >= 7;
  const warm = streak >= 3;
  const color = hot ? '#ef4444' : warm ? '#f97316' : '#eab308';

  return (
    <div
      className={cn(
        'flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-semibold backdrop-blur',
        'bg-black/30',
      )}
      style={{ borderColor: `${color}55`, color }}
      title={`Серия активности: ${streak} дн. подряд (МСК)`}
    >
      <Flame className={cn('h-3.5 w-3.5 flame-flicker')} style={{ color }} />
      <span className="tabular-nums">{streak}</span>
      <span className="text-[10px] text-muted-foreground font-normal">дн.</span>
    </div>
  );
}
