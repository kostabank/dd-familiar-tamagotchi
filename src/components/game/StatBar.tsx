'use client';

import { cn } from '@/lib/utils';

interface StatBarProps {
  label: string;
  value: number;
  max?: number;
  icon?: React.ReactNode;
  colorClass?: string; // tailwind gradient classes
  showValue?: boolean;
  compact?: boolean;
}

function colorForValue(v: number): string {
  if (v < 30) return 'from-red-500 to-rose-600';
  if (v < 60) return 'from-amber-400 to-orange-500';
  return 'from-emerald-400 to-teal-500';
}

export function StatBar({
  label,
  value,
  max = 100,
  icon,
  colorClass,
  showValue = true,
  compact = false,
}: StatBarProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const gradient = colorClass || colorForValue(value);
  return (
    <div className={cn('w-full', compact ? 'space-y-1' : 'space-y-1.5')}>
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
          {icon}
          {label}
        </span>
        {showValue && (
          <span className="font-mono text-foreground/90 tabular-nums">
            {Math.round(value)}<span className="text-muted-foreground">/{max}</span>
          </span>
        )}
      </div>
      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-white/5 ring-1 ring-white/5">
        <div
          className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-500 ease-out', gradient)}
          style={{ width: `${pct}%` }}
        />
        <div
          className="pointer-events-none absolute inset-0 rounded-full opacity-40"
          style={{
            background: `linear-gradient(90deg, transparent ${pct - 8}%, rgba(255,255,255,0.35) ${pct}%, transparent ${pct + 8}%)`,
          }}
        />
      </div>
    </div>
  );
}
