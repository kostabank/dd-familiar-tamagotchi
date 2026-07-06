import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { recomputeAndPersist, toFamiliarDTO, computePartyResonance } from '@/lib/familiar-logic';
import { GAME, clamp } from '@/lib/constants';
import { broadcastFamiliarUpdate, broadcastPartyResonance } from '@/lib/socket-client';
import type { ModelConfig } from '@/lib/types';

// POST /api/familiar/evolve — accepts { optionId }. Performs blind evolution.
export async function POST(req: NextRequest) {
  try {
    const me = await getCurrentUser();
    if (!me) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    let familiar = await db.familiar.findUnique({ where: { userId: me.id } });
    if (!familiar) return NextResponse.json({ error: 'Фамильяр не найден' }, { status: 404 });

    await recomputeAndPersist(familiar.id);
    familiar = await db.familiar.findUnique({ where: { userId: me.id } });
    if (!familiar) return NextResponse.json({ error: 'Фамильяр не найден' }, { status: 404 });

    if (familiar.stage >= GAME.MAX_STAGE) {
      return NextResponse.json({ error: 'Максимальная стадия достигнута' }, { status: 400 });
    }
    if (familiar.sync < GAME.EVOLUTION_SYNC_THRESHOLD) {
      return NextResponse.json({ error: 'Недостаточно синхронизации' }, { status: 400 });
    }

    const { optionId } = await req.json();
    if (!optionId) return NextResponse.json({ error: 'optionId обязателен' }, { status: 400 });

    const option = await db.evolutionOption.findUnique({ where: { id: optionId } });
    if (!option || option.species !== familiar.species || option.fromStage !== familiar.stage) {
      return NextResponse.json({ error: 'Неверная опция эволюции' }, { status: 400 });
    }

    const modelConfig = JSON.parse(option.modelConfig) as ModelConfig;
    const updated = await db.familiar.update({
      where: { id: familiar.id },
      data: {
        stage: option.toStage,
        sync: 0,
        evolutionPath: option.pathName,
        hiddenBuff: option.hiddenBuff,
        coins: familiar.coins + GAME.EVOLUTION_COIN_REWARD,
        // small heal on evolution
        health: clamp(familiar.health + 20),
        mood: clamp(familiar.mood + 20),
      },
    });
    await db.interactionLog.create({
      data: {
        familiarId: familiar.id,
        userId: me.id,
        actionType: 'evolve',
        detail: `${familiar.stage}->${option.toStage} path=${option.pathName} buff=${option.hiddenBuff}`,
      },
    });

    const dto = toFamiliarDTO(updated);
    await broadcastFamiliarUpdate(dto);
    await broadcastPartyResonance(await computePartyResonance());
    return NextResponse.json({
      familiar: dto,
      revealedBuff: option.hiddenBuff,
      modelConfig,
      pathName: option.pathName,
    });
  } catch (e) {
    console.error('[familiar/evolve]', e);
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 });
  }
}
