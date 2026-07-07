'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useStore } from '@/lib/store';
import dynamic from 'next/dynamic';
import { SPECIES_INFO } from '@/lib/constants';
import type { Species, ModelConfig } from '@/lib/types';
import { BookOpen, Lock, CheckCircle2, Sparkles, Trophy, MapPin } from 'lucide-react';

// 3D preview is client-only.
const FamiliarCanvas = dynamic(
  () => import('@/components/familiar/FamiliarCanvas').then((m) => m.default),
  { ssr: false },
);

interface CodexEntry {
  id: string;
  species: Species;
  fromStage: number;
  toStage: number;
  pathName: string;
  visualDescription: string;
  hiddenBuff: string;
  modelConfig: ModelConfig;
  discovered: boolean;
  discoveredAt: string | null;
  pickCount: number;
}

interface CodexData {
  species: Species;
  currentStage: number;
  currentPath: string | null;
  entries: CodexEntry[];
  summary: {
    totalPaths: number;
    discoveredPaths: number;
    speciesReachedStage3: number;
    totalSpecies: number;
  };
}

const SPECIES_ORDER: Species[] = ['construct', 'dragon', 'magpie', 'doll'];

export function EvolutionCodex() {
  const showCodex = useStore((s) => s.showCodex);
  const setShowCodex = useStore((s) => s.setShowCodex);
  const [data, setData] = useState<CodexData | null>(null);
  const [loading, setLoading] = useState(false);
  const [filterSpecies, setFilterSpecies] = useState<Species | 'all'>('all');
  const [onlyDiscovered, setOnlyDiscovered] = useState(false);

  useEffect(() => {
    if (!showCodex) return;
    let cancelled = false;
    // Defer setState to a microtask so it isn't synchronous in the effect body.
    Promise.resolve().then(() => {
      if (cancelled) return;
      setLoading(true);
      fetch('/api/familiar/codex', { credentials: 'same-origin' })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (!cancelled && d) setData(d);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    });
    return () => {
      cancelled = true;
    };
  }, [showCodex]);

  const entries = data?.entries ?? [];
  const visible = entries
    .filter((e) => filterSpecies === 'all' || e.species === filterSpecies)
    .filter((e) => !onlyDiscovered || e.discovered);
  const grouped = SPECIES_ORDER.map((sp) => ({
    species: sp,
    items: visible.filter((e) => e.species === sp),
  })).filter((g) => g.items.length > 0);

  const pct = data ? Math.round((data.summary.discoveredPaths / data.summary.totalPaths) * 100) : 0;

  return (
    <Dialog open={showCodex} onOpenChange={(o) => !o && setShowCodex(o)}>
      <DialogContent className="max-w-6xl max-h-[92vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <BookOpen className="h-5 w-5 text-arcane" /> Кодекс Эволюций
          </DialogTitle>
          <DialogDescription>
            Все 24 пути эволюции. Открытые пути показывают скрытый бафф и 3D-превью. Соберите их все!
          </DialogDescription>
        </DialogHeader>

        {/* Summary + progress bar */}
        {data && (
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <Badge variant="outline" className="border-arcane/40 text-arcane">
              <Sparkles className="h-3 w-3 mr-1" />
              {data.summary.discoveredPaths}/{data.summary.totalPaths} путей
            </Badge>
            <Badge variant="outline" className="border-amber-400/40 text-amber-400">
              <Trophy className="h-3 w-3 mr-1" />
              {data.summary.speciesReachedStage3}/{data.summary.totalSpecies} видов до стадии III
            </Badge>
            <div className="flex-1 min-w-[120px] h-2 rounded-full bg-white/8 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-arcane to-frost transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground tabular-nums">{pct}%</span>
          </div>
        )}

        {/* Species filter chips */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          <button
            onClick={() => setFilterSpecies('all')}
            className={`px-3 py-1 rounded-full text-xs border transition-all ${
              filterSpecies === 'all'
                ? 'border-arcane bg-arcane/20 text-arcane'
                : 'border-white/10 bg-white/5 text-muted-foreground hover:border-arcane/40'
            }`}
          >
            Все виды
          </button>
          {SPECIES_ORDER.map((sp) => (
            <button
              key={sp}
              onClick={() => setFilterSpecies(sp)}
              className={`px-3 py-1 rounded-full text-xs border transition-all flex items-center gap-1 ${
                filterSpecies === sp
                  ? 'border-arcane bg-arcane/20 text-arcane'
                  : 'border-white/10 bg-white/5 text-muted-foreground hover:border-arcane/40'
              }`}
            >
              <span style={{ color: SPECIES_INFO[sp].accent }}>{SPECIES_INFO[sp].emoji}</span>
              {SPECIES_INFO[sp].label}
            </button>
          ))}
          <button
            onClick={() => setOnlyDiscovered((v) => !v)}
            className={`ml-auto px-3 py-1 rounded-full text-xs border transition-all flex items-center gap-1 ${
              onlyDiscovered
                ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-400'
                : 'border-white/10 bg-white/5 text-muted-foreground hover:border-emerald-500/40'
            }`}
            title="Показать только открытые пути"
          >
            <CheckCircle2 className="h-3 w-3" /> Только открытые
          </button>
        </div>

        {/* Grid */}
        <div className="overflow-y-auto fantasy-scroll pr-1 -mr-1 space-y-5">
          {loading && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-44 rounded-xl" />
              ))}
            </div>
          )}

          {!loading && data && grouped.length === 0 && (
            <div className="text-center py-10 text-muted-foreground text-sm">
              Нет путей для этого фильтра.
            </div>
          )}

          {!loading &&
            data &&
            grouped.map((group) => (
              <div key={group.species}>
                <div className="flex items-center gap-2 mb-2 sticky top-0 bg-background/80 backdrop-blur py-1 z-10">
                  <span
                    className="text-base font-semibold"
                    style={{ color: SPECIES_INFO[group.species].accent }}
                  >
                    {SPECIES_INFO[group.species].emoji} {SPECIES_INFO[group.species].label}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {group.items.filter((e) => e.discovered).length}/{group.items.length} открыто
                  </span>
                  <div className="flex-1 h-px bg-gradient-to-r from-arcane/30 to-transparent" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {group.items.map((entry) => {
                    const isCurrent =
                      !!data.currentPath &&
                      entry.pathName === data.currentPath &&
                      entry.toStage === data.currentStage;
                    return (
                    <div
                      key={entry.id}
                      className={`rounded-xl border overflow-hidden flex flex-col relative ${
                        isCurrent
                          ? 'border-arcane/70 current-path-badge'
                          : entry.discovered
                            ? 'border-emerald-500/40 codex-card-discovered'
                            : 'border-white/10 codex-card-locked'
                      }`}
                    >
                      <div className="h-28 bg-gradient-to-b from-[#0a0a1a] to-[#15152a] relative">
                        {entry.discovered ? (
                          <FamiliarCanvas
                            species={entry.species}
                            stage={entry.toStage as 1 | 2 | 3}
                            state="happy"
                            modelConfigOverride={entry.modelConfig}
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Lock className="h-8 w-8 text-muted-foreground/40" />
                          </div>
                        )}
                        <div className="absolute top-1.5 left-1.5 codex-badge">
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-black/50 text-muted-foreground">
                            {entry.fromStage}→{entry.toStage}
                          </span>
                        </div>
                        {isCurrent ? (
                          <div className="absolute top-1.5 right-1.5 codex-badge flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-arcane/80 text-white text-[9px] font-semibold">
                            <MapPin className="h-3 w-3" /> текущий
                          </div>
                        ) : entry.discovered ? (
                          <div className="absolute top-1.5 right-1.5 codex-badge">
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          </div>
                        ) : null}
                      </div>
                      <div className="p-2.5 flex-1 flex flex-col">
                        <div className={`font-semibold text-sm flex items-center gap-1 ${entry.discovered ? 'text-arcane' : 'text-muted-foreground'}`}>
                          {entry.discovered ? entry.pathName : '???'}
                        </div>
                        {entry.discovered ? (
                          <>
                            <p className="text-[10px] text-muted-foreground mt-1 line-clamp-3 leading-relaxed flex-1">
                              {entry.visualDescription}
                            </p>
                            <div className="mt-2 rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-1">
                              <div className="text-[9px] text-emerald-400/70 uppercase tracking-wide">Скрытый бафф</div>
                              <div className="text-[10px] text-emerald-300 leading-tight">{entry.hiddenBuff}</div>
                            </div>
                            {entry.pickCount > 1 && (
                              <div className="text-[9px] text-amber-400/70 mt-1">
                                выбран ×{entry.pickCount}
                              </div>
                            )}
                          </>
                        ) : (
                          <p className="text-[10px] text-muted-foreground/60 mt-1 italic flex-1">
                            Путь ещё не открыт. Эволюционируйте, чтобы раскрыть.
                          </p>
                        )}
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>
            ))}
        </div>

        <div className="mt-2 text-center text-[11px] text-muted-foreground italic">
          Прогресс сохраняется навсегда — даже после сброса фамильяра открытые пути остаются в Кодексе.
        </div>
      </DialogContent>
    </Dialog>
  );
}
