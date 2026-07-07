'use client';

import { useEffect, useState, useCallback } from 'react';

interface CelebrationConfig {
  emoji: string;
  label: string;
  color: string;
}

interface CelebrationState extends CelebrationConfig {
  id: number;
}

/**
 * Full-screen celebration overlay: shows a big emoji + label in the center
 * with a burst of confetti particles. Returns a `celebrate` function that
 * can be called to trigger it. Auto-dismisses after 2.5s.
 */
export function useCelebration() {
  const [celebration, setCelebration] = useState<CelebrationState | null>(null);

  const celebrate = useCallback((config: CelebrationConfig) => {
    const id = Date.now();
    setCelebration({ ...config, id });
    setTimeout(() => {
      setCelebration((c) => (c?.id === id ? null : c));
    }, 2500);
  }, []);

  return { celebration, celebrate };
}

export function CelebrationOverlay({ celebration }: { celebration: CelebrationState | null }) {
  if (!celebration) return null;

  const confetti = Array.from({ length: 30 }, (_, i) => {
    const angle = (i / 30) * Math.PI * 2;
    const dist = 120 + Math.random() * 80;
    return {
      id: i,
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist,
      color: ['#A855F7', '#3B82F6', '#22c55e', '#f97316', '#ef4444', '#ec4899', '#eab308'][i % 7],
      delay: Math.random() * 0.2,
      size: 6 + Math.random() * 6,
    };
  });

  return (
    <div
      key={celebration.id}
      className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
      style={{ animation: 'celebration-fade 2.5s ease-out forwards' }}
    >
      <style>{`
        @keyframes celebration-fade {
          0% { opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes confetti-burst {
          0% { transform: translate(0, 0) scale(0); opacity: 1; }
          100% { transform: translate(var(--x), var(--y)) scale(1); opacity: 0; }
        }
        @keyframes celebration-pop {
          0% { transform: scale(0.5); opacity: 0; }
          30% { transform: scale(1.1); opacity: 1; }
          70% { transform: scale(1); opacity: 1; }
          100% { transform: scale(0.9); opacity: 0; }
        }
      `}</style>

      {/* Confetti burst */}
      {confetti.map((c) => (
        <div
          key={c.id}
          className="absolute rounded-sm"
          style={{
            width: `${c.size}px`,
            height: `${c.size}px`,
            backgroundColor: c.color,
            animation: `confetti-burst 1.2s ease-out ${c.delay}s forwards`,
            ['--x' as string]: `${c.x}px`,
            ['--y' as string]: `${c.y}px`,
          }}
        />
      ))}

      {/* Center content */}
      <div
        className="relative text-center"
        style={{ animation: 'celebration-pop 2.5s ease-out forwards' }}
      >
        <div className="text-6xl mb-2">{celebration.emoji}</div>
        <div
          className="text-2xl font-bold"
          style={{ color: celebration.color, textShadow: `0 0 20px ${celebration.color}` }}
        >
          {celebration.label}
        </div>
      </div>
    </div>
  );
}
