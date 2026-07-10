'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import dynamic from 'next/dynamic';
import { SPECIES_INFO } from '@/lib/constants';
import type { Species, ModelConfig } from '@/lib/types';
import { BookOpen, Lock, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

// 3D preview is client-only.
const FamiliarCanvas = dynamic(
  () => import('@/components/familiar/FamiliarCanvas').then((m) => m.default),
  { ssr: false },
);

interface DmEvolutionEntry {
  id: string;
  species: Species;
  fromStage: number;
  toStage: number;
  pathName: string;
  visualDescription: string;
  hiddenBuff: string;
  modelConfig: ModelConfig;
}

const SPECIES_ORDER: Species[] = ['construct', 'dragon', 'magpie', 'doll'];

/**
 * DM Evolution Codex — shows ALL 24 evolution paths grouped by species.
 * The DM picks a species, then sees its 6 paths (3 → stage 2, 3 → stage 3)
 * with 3D previews, visual descriptions, and the hidden buffs (which the DM
 * can see to plan encounters and understand player choices).
 */
export function DmEvolutionCodex() {
  const [entries, setEntries] = useState<DmEvolutionEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterSpecies, setFilterSpecies] = useState<Species>('dragon');
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return;
      setLoading(true);
      fetch('/api/admin/evolutions', { credentials: 'same-origin' })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (!cancelled && d) setEntries(d.entries);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const visible = entries.filter((e) => e.species === filterSpecies);
  // Split into stage 1→2 and stage 2→3 groups.
  const stage2 = visible.filter((e) => e.toStage === 2);
  const stage3 = visible.filter((e) => e.toStage === 3);

  return (
    <Card className="arcane-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-arcane" /> Кодекс эволюций
          <span className="ml-auto text-xs text-muted-foreground font-normal">
            Все 24 пути · выберите вид
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Species selector */}
        <div className="flex flex-wrap gap-1.5">
          {SPECIES_ORDER.map((sp) => (
            <button
              key={sp}
              onClick={() => setFilterSpecies(sp)}
              className={cn(
                'px-3 py-1 rounded-full text-xs border transition-all flex items-center gap-1',
                filterSpecies === sp
                  ? 'border-arcane bg-arcane/20 text-arcane'
                  : 'border-white/10 bg-white/5 text-muted-foreground hover:border-arcane/40'
              )}
            >
              <span style={{ color: SPECIES_INFO[sp].accent }}>{SPECIES_INFO[sp].emoji}</span>
              {SPECIES_INFO[sp].label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-xl" />
            ))}
          </div>
        )}

        {!loading && (
          <div className="space-y-4">
            {/* Stage 1 → 2 */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-frost">Стадия I → II</span>
                <span className="text-[10px] text-muted-foreground">3 пути · бафф: +1d4 к атаке (1/день)</span>
                <div className="flex-1 h-px bg-gradient-to-r from-frost/30 to-transparent" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {stage2.map((entry) => (
                  <EvolutionCard
                    key={entry.id}
                    entry={entry}
                    expanded={expanded === entry.id}
                    onToggle={() => setExpanded(expanded === entry.id ? null : entry.id)}
                  />
                ))}
              </div>
            </div>

            {/* Stage 2 → 3 */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-arcane">Стадия II → III</span>
                <span className="text-[10px] text-muted-foreground">3 пути · бафф: переброс спасброска (1/день)</span>
                <div className="flex-1 h-px bg-gradient-to-r from-arcane/30 to-transparent" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {stage3.map((entry) => (
                  <EvolutionCard
                    key={entry.id}
                    entry={entry}
                    expanded={expanded === entry.id}
                    onToggle={() => setExpanded(expanded === entry.id ? null : entry.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <p className="text-[10px] text-muted-foreground/70 italic text-center pt-1">
          Игроки видят только открытые ими пути. Вы, как Мастер, видите все 24 заранее.
        </p>
      </CardContent>
    </Card>
  );
}

function EvolutionCard({
  entry,
  expanded,
  onToggle,
}: {
  entry: DmEvolutionEntry;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden flex flex-col">
      <div className="h-32 bg-gradient-to-b from-[#0a0a1a] to-[#15152a] relative">
        <FamiliarCanvas
          species={entry.species}
          stage={entry.toStage as 1 | 2 | 3}
          state="happy"
          modelConfigOverride={entry.modelConfig}
        />
        <div className="absolute top-1.5 left-1.5">
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-black/50 text-muted-foreground">
            {entry.fromStage}→{entry.toStage}
          </span>
        </div>
      </div>
      <div className="p-2.5 flex-1 flex flex-col">
        <div className="font-semibold text-sm text-arcane">{entry.pathName}</div>
        <p className={cn('text-[10px] text-muted-foreground mt-1 leading-relaxed', !expanded && 'line-clamp-2')}>
          {entry.visualDescription}
        </p>
        <div className="mt-2 rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-1">
          <div className="text-[9px] text-emerald-400/70 uppercase tracking-wide">Скрытый бафф</div>
          <div className="text-[10px] text-emerald-300 leading-tight">{entry.hiddenBuff}</div>
        </div>
        <button
          onClick={onToggle}
          className="mt-1.5 text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-0.5 transition-colors"
        >
          {expanded ? <><ChevronUp className="h-3 w-3" /> Свернуть</> : <><ChevronDown className="h-3 w-3" /> Подробнее</>}
        </button>
      </div>
    </div>
  );
}
