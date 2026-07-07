import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { recomputeAndPersist } from '@/lib/familiar-logic';
import { GAME } from '@/lib/constants';
import type { EvolutionOptionDTO, ModelConfig } from '@/lib/types';

// GET /api/familiar/evolution-options — returns 3 options when sync >= 100 and stage < 3.
export async function GET() {
  try {
    const me = await getCurrentUser();
    if (!me) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    let familiar = await db.familiar.findUnique({ where: { userId: me.id } });
    if (!familiar) return NextResponse.json({ error: 'Фамильяр не найден' }, { status: 404 });

    await recomputeAndPersist(familiar.id);
    familiar = await db.familiar.findUnique({ where: { userId: me.id } });
    if (!familiar) return NextResponse.json({ error: 'Фамильяр не найден' }, { status: 404 });

    if (familiar.stage >= GAME.MAX_STAGE) {
      return NextResponse.json({ options: [], reason: 'Максимальная стадия достигнута' });
    }
    if (familiar.sync < GAME.EVOLUTION_SYNC_THRESHOLD) {
      return NextResponse.json({ options: [], reason: `Требуется синхронизация ${GAME.EVOLUTION_SYNC_THRESHOLD}` });
    }

    const options = await db.evolutionOption.findMany({
      where: { species: familiar.species, fromStage: familiar.stage },
    });
    const dtos: EvolutionOptionDTO[] = options.map((o) => ({
      id: o.id,
      species: o.species as EvolutionOptionDTO['species'],
      fromStage: o.fromStage,
      toStage: o.toStage,
      pathName: o.pathName,
      visualDescription: o.visualDescription,
      modelConfig: JSON.parse(o.modelConfig) as ModelConfig,
    }));
    return NextResponse.json({ options: dtos });
  } catch (e) {
    console.error('[familiar/evolution-options]', e);
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 });
  }
}
