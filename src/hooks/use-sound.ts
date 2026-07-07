'use client';

import { useEffect, useState, useCallback } from 'react';
import { sound } from '@/lib/sound';

/**
 * Provides a muted flag (synced with localStorage) and a toggle.
 * Also starts the ambient drone on first user interaction (not muted).
 */
export function useSound() {
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    // Defer to avoid synchronous setState in the effect body.
    Promise.resolve().then(() => setMuted(sound.muted));
    // Start ambient on first user gesture if not muted.
    const onFirstGesture = () => {
      if (!sound.muted) sound.startAmbient();
      window.removeEventListener('pointerdown', onFirstGesture);
      window.removeEventListener('keydown', onFirstGesture);
    };
    window.addEventListener('pointerdown', onFirstGesture);
    window.addEventListener('keydown', onFirstGesture);
    return () => {
      window.removeEventListener('pointerdown', onFirstGesture);
      window.removeEventListener('keydown', onFirstGesture);
    };
  }, []);

  const toggle = useCallback(() => {
    const next = sound.toggleMuted();
    setMuted(next);
  }, []);

  const play = useCallback((name: Parameters<typeof sound.play>[0]) => {
    sound.play(name);
  }, []);

  return { muted, toggle, play };
}
