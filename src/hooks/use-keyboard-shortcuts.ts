'use client';

import { useEffect } from 'react';
import { useFamiliar } from './use-familiar';
import { useStore } from '@/lib/store';
import { GAME } from '@/lib/constants';
import { toast } from 'sonner';

/**
 * Global keyboard shortcuts for quick familiar actions.
 *  F = feed, P = pet, E = evolve (if available), S = sleep/wake toggle,
 *  C = open Codex, ? = shortcuts help.
 *
 * Shortcuts are ignored while typing in an input/textarea, while a modal
 * (mini-game / evolution / codex) is open, or during evolution animation.
 */
const isTypingTarget = (el: EventTarget | null): boolean => {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || el.isContentEditable || tag === 'select';
};

export function useKeyboardShortcuts() {
  const { familiar, feed, pet, sleep, wake, fetchEvolutionOptions } = useFamiliar();
  const setShowMiniGame = useStore((s) => s.setShowMiniGame);
  const setShowEvolutionModal = useStore((s) => s.setShowEvolutionModal);
  const setShowCodex = useStore((s) => s.setShowCodex);
  const setShowShortcutsHelp = useStore((s) => s.setShowShortcutsHelp);
  const evolving = useStore((s) => s.evolving);
  const showMiniGame = useStore((s) => s.showMiniGame);
  const showEvolutionModal = useStore((s) => s.showEvolutionModal);
  const showCodex = useStore((s) => s.showCodex);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Never intercept modifier combos (Ctrl/Cmd/Alt).
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;
      // Skip if a modal/overlay is open — let the user interact normally.
      if (evolving || showMiniGame || showEvolutionModal || showCodex) {
        // Only allow ? to toggle help even inside modals? No — keep it simple.
        return;
      }
      if (!familiar) return;

      const key = e.key.toLowerCase();
      switch (key) {
        case 'f': {
          e.preventDefault();
          if (!familiar.isSleeping && familiar.fatigue <= GAME.FATIGUE_BLOCK_THRESHOLD) {
            feed();
          } else {
            toast('Нельзя покормить сейчас', { description: familiar.isSleeping ? 'Фамильяр спит' : 'Слишком устал' });
          }
          break;
        }
        case 'p': {
          e.preventDefault();
          if (!familiar.isSleeping) {
            pet();
          } else {
            toast('Фамильяр спит — его нельзя погладить');
          }
          break;
        }
        case 's': {
          e.preventDefault();
          if (familiar.isSleeping) wake();
          else sleep();
          break;
        }
        case 'g': {
          e.preventDefault();
          if (!familiar.isSleeping && familiar.fatigue <= GAME.FATIGUE_BLOCK_THRESHOLD) {
            setShowMiniGame(true);
          } else {
            toast('Нельзя играть сейчас', { description: familiar.isSleeping ? 'Фамильяр спит' : 'Слишком устал' });
          }
          break;
        }
        case 'e': {
          e.preventDefault();
          if (familiar.sync >= GAME.EVOLUTION_SYNC_THRESHOLD && familiar.stage < GAME.MAX_STAGE) {
            fetchEvolutionOptions().then((opts) => {
              if (opts.length > 0) setShowEvolutionModal(true);
            });
          } else {
            toast('Эволюция недоступна', {
              description: `Нужно ${GAME.EVOLUTION_SYNC_THRESHOLD} синхронизации (сейчас ${familiar.sync})`,
            });
          }
          break;
        }
        case 'c': {
          e.preventDefault();
          setShowCodex(true);
          break;
        }
        case '?':
        case '/': {
          e.preventDefault();
          setShowShortcutsHelp(true);
          break;
        }
        default:
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    familiar,
    feed,
    pet,
    sleep,
    wake,
    fetchEvolutionOptions,
    setShowMiniGame,
    setShowEvolutionModal,
    setShowCodex,
    setShowShortcutsHelp,
    evolving,
    showMiniGame,
    showEvolutionModal,
    showCodex,
  ]);
}
