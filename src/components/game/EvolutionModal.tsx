'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useStore } from '@/lib/store';
import { useFamiliar } from '@/hooks/use-familiar';
import FamiliarCanvas from '@/components/familiar/FamiliarCanvas';
import type { EvolutionOptionDTO, ModelConfig } from '@/lib/types';
import { Eye, Sparkles, ChevronRight } from 'lucide-react';

export function EvolutionModal() {
  const { showEvolutionModal, setShowEvolutionModal, familiar } = useStore();
  const { fetchEvolutionOptions, evolve } = useFamiliar();
  const [options, setOptions] = useState<EvolutionOptionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [picking, setPicking] = useState(false);

  useEffect(() => {
    if (!showEvolutionModal) return;
    let cancelled = false;
    // Defer setState to a microtask so it isn't synchronous in the effect body.
    Promise.resolve().then(() => {
      if (cancelled) return;
      setLoading(true);
      fetchEvolutionOptions()
        .then((opts) => {
          if (!cancelled) setOptions(opts);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    });
    return () => {
      cancelled = true;
    };
  }, [showEvolutionModal, fetchEvolutionOptions]);

  const pick = async (optionId: string) => {
    setPicking(true);
    await evolve(optionId);
    setPicking(false);
  };

  return (
    <Dialog open={showEvolutionModal} onOpenChange={(o) => !o && !picking && setShowEvolutionModal(false)}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-arcane" /> Слепая Адаптация
          </DialogTitle>
          <DialogDescription>
            Ваш фамильяр готов эволюционировать. Выберите путь — скрытый бафф раскроется только после выбора.
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-80 rounded-xl" />
            ))}
          </div>
        )}

        {!loading && options.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Эволюция недоступна. Нужно 100 синхронизации.
          </div>
        )}

        {!loading && options.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-h-[70vh] overflow-y-auto fantasy-scroll pr-1">
            {options.map((opt) => (
              <div
                key={opt.id}
                className="rounded-xl border border-arcane/25 bg-card/60 overflow-hidden flex flex-col arcane-border"
              >
                <div className="h-56 bg-gradient-to-b from-[#0a0a1a] to-[#15152a] relative">
                  <FamiliarCanvas
                    species={familiar!.species}
                    stage={opt.toStage as 1 | 2 | 3}
                    state="happy"
                    modelConfigOverride={opt.modelConfig as ModelConfig}
                    evolving={false}
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-arcane/30 backdrop-blur text-[10px] font-medium border border-arcane/40">
                    {opt.toStage === 2 ? 'Стадия II' : 'Стадия III'}
                  </div>
                </div>
                <div className="p-3 flex-1 flex flex-col">
                  <h3 className="font-semibold text-arcane text-glow-arcane">{opt.pathName}</h3>
                  <p className="text-xs text-muted-foreground mt-1 flex-1 leading-relaxed">
                    {opt.visualDescription}
                  </p>
                  <div className="flex items-center gap-1.5 text-[10px] text-amber-400/80 mt-2">
                    <Eye className="h-3 w-3" /> Скрытый бафф неизвестен
                  </div>
                  <Button
                    onClick={() => pick(opt.id)}
                    disabled={picking}
                    className="mt-3 w-full bg-gradient-to-r from-arcane to-frost"
                  >
                    Выбрать путь <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
