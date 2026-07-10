import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import type { ModelConfig, Species } from '@/lib/types';

export interface CodexEntry {
  id: string;
  species: Species;
  fromStage: number;
  toStage: number;
  pathName: string;
  visualDescription: string;
  hiddenBuff: string;
  modelConfig: ModelConfig;
  /** true if the player has chosen this path at least once (across this familiar's life). */
  discovered: boolean;
  /** ISO timestamp of the first time the player picked this path, if discovered. */
  discoveredAt: string | null;
  /** how many times the player has picked this path. */
  pickCount: number;
}

// GET /api/familiar/codex — full catalogue of all 24 evolution paths with
// discovery status for the current player. Used by the in-game Codex modal.
export async function GET() {
  try {
    const me = await getCurrentUser();
    if (!me) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    const familiar = await db.familiar.findUnique({
      where: { userId: me.id },
      select: { id: true, species: true, stage: true, evolutionPath: true },
    });
    if (!familiar) return NextResponse.json({ error: 'Фамильяр не найден' }, { status: 404 });

    const allOptions = await db.evolutionOption.findMany({
      orderBy: [{ species: 'asc' }, { fromStage: 'asc' }, { pathName: 'asc' }],
    });

    // Discover which paths the player has ever picked by scanning evolve logs.
    // The evolve route writes detail like "1->2 path=Багровый buff=...".
    const evolveLogs = await db.interactionLog.findMany({
      where: { userId: me.id, actionType: 'evolve', detail: { contains: 'path=' } },
      select: { detail: true, timestamp: true },
    });

    // Aggregate: pathName -> { firstAt, count }
    const discovery = new Map<string, { firstAt: string; count: number }>();
    for (const log of evolveLogs) {
      const m = /path=([^ ]+)/.exec(log.detail ?? '');
      if (!m) continue;
      const name = m[1];
      const ts = log.timestamp instanceof Date ? log.timestamp.toISOString() : String(log.timestamp);
      const existing = discovery.get(name);
      if (existing) {
        existing.count += 1;
        if (ts < existing.firstAt) existing.firstAt = ts;
      } else {
        discovery.set(name, { firstAt: ts, count: 1 });
      }
    }

    const entries: CodexEntry[] = allOptions.map((o) => {
      const d = discovery.get(o.pathName);
      return {
        id: o.id,
        species: o.species as Species,
        fromStage: o.fromStage,
        toStage: o.toStage,
        pathName: o.pathName,
        visualDescription: o.visualDescription,
        hiddenBuff: o.hiddenBuff,
        modelConfig: JSON.parse(o.modelConfig) as ModelConfig,
        discovered: !!d,
        discoveredAt: d?.firstAt ?? null,
        pickCount: d?.count ?? 0,
      };
    });

    // Summary stats for the header.
    const totalPaths = entries.length;
    const discoveredCount = entries.filter((e) => e.discovered).length;
    // A species is "complete" if the player has discovered at least one path
    // leading INTO stage 3 for that species (i.e. reached stage 3 once).
    const speciesReachedStage3 = new Set<Species>();
    for (const e of entries) {
      if (e.discovered && e.toStage === 3) speciesReachedStage3.add(e.species);
    }

    return NextResponse.json({
      species: familiar.species as Species,
      currentStage: familiar.stage,
      currentPath: familiar.evolutionPath,
      entries,
      summary: {
        totalPaths,
        discoveredPaths: discoveredCount,
        speciesReachedStage3: speciesReachedStage3.size,
        totalSpecies: 4,
      },
    });
  } catch (e) {
    console.error('[familiar/codex]', e);
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 });
  }
}
