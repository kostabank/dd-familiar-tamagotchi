'use client';

import { useEffect } from 'react';
import { useStore } from '@/lib/store';

/**
 * Floating stat-change indicators overlaid on the 3D canvas.
 * Each entry rises + fades over ~2s, then self-dismisses.
 */
export function FloatingStatNumbers() {
  const floatingChanges = useStore((s) => s.floatingChanges);
  const dismiss = useStore((s) => s.dismissFloatingChange);

  // Auto-dismiss each indicator after 2s.
  useEffect(() => {
    if (floatingChanges.length === 0) return;
    const timers = floatingChanges.map((f) =>
      window.setTimeout(() => dismiss(f.id), 2000),
    );
    return () => {
      for (const t of timers) window.clearTimeout(t);
    };
  }, [floatingChanges, dismiss]);

  if (floatingChanges.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 flex items-start justify-center overflow-hidden">
      <div className="relative w-full h-full">
        {floatingChanges.map((f, idx) => {
          // Stagger horizontal position so stacked deltas don't fully overlap.
          const offset = (idx - (floatingChanges.length - 1) / 2) * 14;
          const topPct = 22 + (idx % 3) * 6;
          return (
            <span
              key={f.id}
              className="absolute left-1/2 font-bold text-sm md:text-base select-none floating-stat-pop"
              style={{
                top: `${topPct}%`,
                transform: `translateX(calc(-50% + ${offset}px))`,
                color: f.color,
                textShadow: `0 0 8px ${f.color}99, 0 1px 2px rgba(0,0,0,0.9)`,
                animationDelay: `${idx * 60}ms`,
              }}
            >
              {f.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
