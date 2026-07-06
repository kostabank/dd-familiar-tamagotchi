import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { recomputeAndPersist, toFamiliarDTO, checkAndUnlockAchievements } from '@/lib/familiar-logic';
import { GAME, clamp } from '@/lib/constants';
import { broadcastFamiliarUpdate, broadcastPartyResonance } from '@/lib/socket-client';
import { computePartyResonance } from '@/lib/familiar-logic';

// POST /api/familiar/feed — feed the familiar.
export async function POST() {
  try {
    const me = await getCurrentUser();
    if (!me) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    let familiar = await db.familiar.findUnique({ where: { userId: me.id } });
    if (!familiar) return NextResponse.json({ error: 'Фамильяр не найден' }, { status: 404 });

    // Recompute decay first.
    await recomputeAndPersist(familiar.id);
    familiar = await db.familiar.findUnique({ where: { userId: me.id } });
    if (!familiar) return NextResponse.json({ error: 'Фамильяр не найден' }, { status: 404 });

    if (familiar.isSleeping) {
      return NextResponse.json({ error: 'Фамильяр спит — нельзя кормить' }, { status: 400 });
    }
    if (familiar.fatigue > GAME.FATIGUE_BLOCK_THRESHOLD) {
      return NextResponse.json({ error: 'Фамильяр слишком устал' }, { status: 400 });
    }

    const updated = await db.familiar.update({
      where: { id: familiar.id },
      data: {
        energy: clamp(familiar.energy + GAME.FEED_ENERGY_GAIN),
        mood: clamp(familiar.mood + GAME.FEED_MOOD_GAIN),
        sync: clamp(familiar.sync + GAME.FEED_SYNC_GAIN),
        fatigue: clamp(familiar.fatigue + GAME.FATIGUE_PER_ACTION),
      },
    });
    await db.interactionLog.create({
      data: { familiarId: familiar.id, userId: me.id, actionType: 'feed', detail: `+${GAME.FEED_ENERGY_GAIN} energy` },
    });

    const newlyUnlocked = await checkAndUnlockAchievements(me.id);
    const dto = toFamiliarDTO(updated);
    await broadcastFamiliarUpdate(dto);
    await broadcastPartyResonance(await computePartyResonance());
    return NextResponse.json({ familiar: dto, newAchievements: newlyUnlocked });
  } catch (e) {
    console.error('[familiar/feed]', e);
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 });
  }
}

