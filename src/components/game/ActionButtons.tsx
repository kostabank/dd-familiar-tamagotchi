'use client';

import { Button } from '@/components/ui/button';
import { useFamiliar } from '@/hooks/use-familiar';
import { useStore } from '@/lib/store';
import { GAME } from '@/lib/constants';
import { Utensils, Gamepad2, Moon, Sun, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ActionButtons() {
  const { familiar, feed, sleep, wake, setShowMiniGame, fetchEvolutionOptions, evolve } = useFamiliar();
  const { setShowEvolutionModal, setEvolving } = useStore();

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
      </Button>
      <Button
        onClick={() => setShowMiniGame(true)}
        disabled={isSleeping || tooTired}
        className="bg-venom/90 hover:bg-venom text-black font-semibold"
        variant="secondary"
      >
        <Gamepad2 className="h-4 w-4" /> Играть
      </Button>
      {isSleeping ? (
        <Button onClick={wake} className="col-span-2 bg-frost/90 hover:bg-frost text-white font-semibold" variant="secondary">
          <Sun className="h-4 w-4" /> Разбудить
        </Button>
      ) : (
        <Button onClick={sleep} className="col-span-2" variant="outline">
          <Moon className="h-4 w-4" /> Уложить спать (4ч)
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
