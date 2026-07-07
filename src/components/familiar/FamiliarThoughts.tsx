'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { FamiliarState } from '@/lib/types';

interface ThoughtsProps {
  state: FamiliarState;
  energy: number;
  mood: number;
  fatigue: number;
  health: number;
  sync: number;
  /** Increments to force a fresh thought (e.g. after an action). */
  trigger?: number;
}

// Thought pools per state. Each is picked at random; rotated every ~6s.
const THOUGHTS: Record<FamiliarState, string[]> = {
  happy: [
    'Я чувствую магию вокруг! ✨',
    'Хочу приключений!',
    'Сегодня прекрасный день для подземелий.',
    'Мой хозяин — лучший!',
  ],
  hungry: [
    'Хочу есть... 🍎',
    'Урчит в животе...',
    'Покорми меня, пожалуйста!',
    'Я голоден как огр!',
  ],
  sad: [
    'Мне одиноко...',
    'Никто меня не любит...',
    'Погладь меня, прошу...',
    'Отвернусь от мира...',
  ],
  tired: [
    'Я так устал... 💤',
    'Глаза слипаются...',
    'Пора бы отдохнуть.',
    'Еле держусь на ногах.',
  ],
  sleeping: [
    'Zzz...',
    'Сладких снов...',
    'Шшш... я сплю...',
    'Вижу сны о сокровищах...',
  ],
  normal: [
    'Скучно... поиграешь со мной?',
    'Что нового в подземелье?',
    'Я готов к бою!',
    'Расскажи историю.',
    'Хочу блеснуть!',
  ],
};

// Extra condition-based thoughts (checked first, take priority).
function conditionalThoughts(p: { energy: number; mood: number; fatigue: number; health: number; sync: number }): string[] {
  const out: string[] = [];
  if (p.health < 30) out.push('Мне плохо... нужна помощь! 💔');
  if (p.sync >= 80) out.push('Я почти готов эволюционировать! 🌟');
  if (p.fatigue >= 70) out.push('Так устал... уложи меня спать.');
  if (p.energy >= 90 && p.mood >= 90) out.push('Я на пике формы! 💪');
  return out;
}

/**
 * A 3D-positioned speech bubble that floats above the familiar, showing
 * context-aware thoughts. Uses drei <Html> so it renders as DOM overlay
 * (crisp text, CSS styling) positioned in 3D space.
 */
export default function FamiliarThoughts({ state, energy, mood, fatigue, health, sync, trigger = 0 }: ThoughtsProps) {
  const [thought, setThought] = useState<string>('');
  const [visible, setVisible] = useState(false);
  const groupRef = useRef<THREE.Group>(null);
  const lastChange = useRef(0);
  const lastTrigger = useRef(trigger);

  // Pool of candidate thoughts given current state + stats.
  const pool = useMemo(() => {
    const cond = conditionalThoughts({ energy, mood, fatigue, health, sync });
    const base = THOUGHTS[state] || THOUGHTS.normal;
    // Prioritize conditional (urgent) thoughts 50% of the time.
    return cond.length > 0 ? [...cond, ...base] : base;
  }, [state, energy, mood, fatigue, health, sync]);

  useEffect(() => {
    let cancelled = false;
    // Pick a fresh thought whenever the pool changes or trigger increments.
    const pick = () => {
      const next = pool[Math.floor(Math.random() * pool.length)];
      Promise.resolve().then(() => {
        if (cancelled) return;
        setThought(next);
        setVisible(true);
        lastChange.current = Date.now();
      });
    };
    pick();
    // Rotate every 6-9 seconds.
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(pick, 400); // brief hide for transition
    }, 6000 + Math.random() * 3000);
    return () => { cancelled = true; clearInterval(id); };
  }, [pool, trigger]);

  // Trigger an immediate refresh when `trigger` changes (after an action).
  useEffect(() => {
    if (trigger !== lastTrigger.current) {
      lastTrigger.current = trigger;
      const next = pool[Math.floor(Math.random() * pool.length)];
      // Defer setState to avoid synchronous setState in effect body.
      Promise.resolve().then(() => {
        setThought(next);
        setVisible(true);
        lastChange.current = Date.now();
      });
    }
  }, [trigger, pool]);

  // Gentle bobbing animation.
  useFrame((s) => {
    if (groupRef.current) {
      groupRef.current.position.y = 1.6 + Math.sin(s.clock.elapsedTime * 1.5) * 0.08;
    }
  });

  if (!thought) return null;

  return (
    <group ref={groupRef} position={[0, 1.6, 0]}>
      <Html
        center
        distanceFactor={6}
        zIndexRange={[20, 0]}
        style={{
          pointerEvents: 'none',
          transition: 'opacity 0.4s ease, transform 0.4s ease',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(8px) scale(0.9)',
        }}
      >
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(26,26,46,0.95), rgba(35,35,71,0.95))',
            border: '1px solid rgba(168,85,247,0.5)',
            borderRadius: '12px',
            padding: '6px 12px',
            fontSize: '13px',
            color: '#E6E6F0',
            whiteSpace: 'nowrap',
            maxWidth: '260px',
            boxShadow: '0 4px 16px -2px rgba(168,85,247,0.4), 0 0 12px -2px rgba(59,130,246,0.3)',
            fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)',
            fontWeight: 500,
            backdropFilter: 'blur(8px)',
            position: 'relative',
          }}
        >
          {thought}
          {/* Tail */}
          <div
            style={{
              position: 'absolute',
              bottom: '-6px',
              left: '50%',
              transform: 'translateX(-50%) rotate(45deg)',
              width: '10px',
              height: '10px',
              background: 'rgba(35,35,71,0.95)',
              borderRight: '1px solid rgba(168,85,247,0.5)',
              borderBottom: '1px solid rgba(168,85,247,0.5)',
            }}
          />
        </div>
      </Html>
    </group>
  );
}
