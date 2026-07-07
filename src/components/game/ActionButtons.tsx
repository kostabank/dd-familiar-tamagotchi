'use client';

import { Button } from '@/components/ui/button';
import { useFamiliar } from '@/hooks/use-familiar';
import { useStore } from '@/lib/store';
import { GAME } from '@/lib/constants';
import { Utensils, Gamepad2, Moon, Sun, Sparkles, Loader2, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Small keyboard-key hint chip shown on action buttons (desktop only). */
function KbdHint({ k }: { k: string }) {
  return (
    <kbd className="kbd ml-1 hidden sm:inline-flex" aria-hidden>
      {k}
    </kbd>
  );
}

export function ActionButtons() {
  const { familiar, feed, pet, sleep, wake, setShowMiniGame, fetchEvolutionOptions } = useFamiliar();
  const { setShowEvolutionModal } = useStore();

  if (!familiar) return null;

  const isSleeping = familiar.isSleeping;
  const tooTired = familiar.fatigue > GAME.FATIGUE_BLOCK_THRESHOLD;
  const canEvolve = familiar.sync >= GAME.EVOLUTION_SYNC_THRESHOLD && familiar.stage < GAME.MAX_STAGE;

  const handleEvolveClick = async () => {
    const options = await fetchEvolutionOptions();
    if (options.length === 0) return;
    setShowEvolutionModal(true);
  };

  return (
    <div className="grid grid-cols-2 gap-2.5">
      <Button
        onClick={feed}
        disabled={isSleeping || tooTired}
        className="bg-ember/90 hover:bg-ember text-black font-semibold"
        variant="secondary"
      >
        <Utensils className="h-4 w-4" /> Кормить
        <KbdHint k="F" />
      </Button>
      <Button
        onClick={() => setShowMiniGame(true)}
        disabled={isSleeping || tooTired}
        className="bg-venom/90 hover:bg-venom text-black font-semibold"
        variant="secondary"
      >
        <Gamepad2 className="h-4 w-4" /> Играть
        <KbdHint k="G" />
      </Button>
      <Button
        onClick={pet}
        disabled={isSleeping}
        className="bg-pink-500/80 hover:bg-pink-500 text-white font-semibold"
        variant="secondary"
      >
        <Heart className="h-4 w-4" /> Погладить
        <KbdHint k="P" />
      </Button>
      {isSleeping ? (
        <Button onClick={wake} className="bg-frost/90 hover:bg-frost text-white font-semibold" variant="secondary">
          <Sun className="h-4 w-4" /> Разбудить
          <KbdHint k="S" />
        </Button>
      ) : (
        <Button onClick={sleep} variant="outline">
          <Moon className="h-4 w-4" /> Усыпить
          <KbdHint k="S" />
        </Button>
      )}

      <Button
        onClick={handleEvolveClick}
        disabled={!canEvolve}
        className={cn(
          'col-span-2 font-semibold transition-all',
          canEvolve
            ? 'bg-gradient-to-r from-arcane to-frost text-white glow-arcane animate-pulse-glow'
            : 'opacity-50'
        )}
      >
        {canEvolve ? <Sparkles className="h-4 w-4" /> : <Loader2 className="h-4 w-4" />}
        {canEvolve ? 'Адаптация доступна!' : `Синхронизация ${familiar.sync}/100`}
        {canEvolve && <KbdHint k="E" />}
      </Button>

      {tooTired && !isSleeping && (
        <p className="col-span-2 text-xs text-amber-400 text-center">
          Фамильяр слишком устал — дай ему поспать
        </p>
      )}
      {isSleeping && (
        <p className="col-span-2 text-xs text-frost text-center">
          Фамильяр спит и восстанавливается...
        </p>
      )}
    </div>
  );
}
