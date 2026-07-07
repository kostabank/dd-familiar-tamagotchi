'use client';

import { useEffect, useRef, useState } from 'react';

interface AnimatedNumberProps {
  value: number;
  duration?: number; // ms
  className?: string;
  suffix?: string;
}

/**
 * Smoothly animates a number from its previous value to the new value.
 * Uses requestAnimationFrame with an ease-out curve.
 */
export function AnimatedNumber({ value, duration = 600, className, suffix }: AnimatedNumberProps) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    if (from === to) return;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / duration);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      const current = Math.round(from + (to - from) * eased);
      setDisplay(current);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      fromRef.current = value;
    };
  }, [value, duration]);

  return (
    <span className={className}>
      {display}
      {suffix}
    </span>
  );
}
