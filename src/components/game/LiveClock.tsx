'use client';

import { useEffect, useState } from 'react';

/**
 * Shows the current time in Europe/Moscow, updated every second.
 * Uses Intl with timeZone for accurate display regardless of the
 * server's local timezone.
 */
export function LiveClock() {
  const [now, setNow] = useState<string>('--:--:--');
  const [date, setDate] = useState<string>('');

  useEffect(() => {
    const fmt = new Intl.DateTimeFormat('ru-RU', {
      timeZone: 'Europe/Moscow',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    const dateFmt = new Intl.DateTimeFormat('ru-RU', {
      timeZone: 'Europe/Moscow',
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    });
    const tick = () => {
      setNow(fmt.format(new Date()));
      setDate(dateFmt.format(new Date()));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="text-right leading-tight">
      <div className="font-mono text-sm tabular-nums text-frost text-glow-frost">{now}</div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{date} · МСК</div>
    </div>
  );
}
