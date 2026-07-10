import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import type { ModelConfig, Species } from '@/lib/types';

export interface DmEvolutionEntry {
  id: string;
  species: Species;
  fromStage: number;
  toStage: number;
  pathName: string;
  visualDescription: string;
  hiddenBuff: string;
  modelConfig: ModelConfig;
}

// GET /api/admin/evolutions — returns ALL 24 evolution paths across all 4
// species, for the DM's Evolution Codex view. No discovery filtering — the DM
// sees everything to plan encounters and understand player progressions.
// Requires DM role.
export async function GET() {
  try {
    const me = await getCurrentUser();
    if (!me) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    if (me.role !== 'dm') return NextResponse.json({ error: 'Только для Мастера' }, { status: 403 });

    const allOptions = await db.evolutionOption.findMany({
      orderBy: [{ species: 'asc' }, { fromStage: 'asc' }, { pathName: 'asc' }],
    });

    const entries: DmEvolutionEntry[] = allOptions.map((o) => ({
      id: o.id,
      species: o.species as Species,
      fromStage: o.fromStage,
      toStage: o.toStage,
      pathName: o.pathName,
      visualDescription: o.visualDescription,
      hiddenBuff: o.hiddenBuff,
      modelConfig: JSON.parse(o.modelConfig) as ModelConfig,
    }));

    return NextResponse.json({ entries });
  } catch (e) {
    console.error('[admin/evolutions]', e);
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 });
  }
}
