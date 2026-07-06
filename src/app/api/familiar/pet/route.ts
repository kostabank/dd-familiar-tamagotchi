import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { recomputeAndPersist, toFamiliarDTO, computePartyResonance, checkAndUnlockAchievements } from '@/lib/familiar-logic';
import { GAME, clamp } from '@/lib/constants';
import { broadcastFamiliarUpdate, broadcastPartyResonance } from '@/lib/socket-client';

// POST /api/familiar/pet — gentle stroke. Low-impact flavor action with a
// short cooldown to prevent spam. Bypasses the fatigue>80 block (it's gentle).
export async function POST() {
  try {
    const me = await getCurrentUser();
    if (!me) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    let familiar = await db.familiar.findUnique({ where: { userId: me.id } });
    if (!familiar) return NextResponse.json({ error: 'Фамильяр не найден' }, { status: 404 });

    await recomputeAndPersist(familiar.id);
    familiar = await db.familiar.findUnique({ where: { userId: me.id } });
    if (!familiar) return NextResponse.json({ error: 'Фамильяр не найден' }, { status: 404 });

    if (familiar.isSleeping) {
      return NextResponse.json({ error: 'Фамильяр спит — не буди его' }, { status: 400 });
    }

    // Find the most recent 'pet' log to enforce cooldown.
    const lastPet = await db.interactionLog.findFirst({
      where: { familiarId: familiar.id, actionType: 'pet' },
      orderBy: { timestamp: 'desc' },
    });
    if (lastPet) {
      const since = Date.now() - new Date(lastPet.timestamp).getTime();
      if (since < GAME.PET_COOLDOWN_MS) {
        const wait = Math.ceil((GAME.PET_COOLDOWN_MS - since) / 1000);
        return NextResponse.json({ error: `Подожди ${wait} сек. перед следующей лаской` }, { status: 429 });
      }
    }

    const updated = await db.familiar.update({
      where: { id: familiar.id },
      data: {
        mood: clamp(familiar.mood + GAME.PET_MOOD_GAIN),
        sync: clamp(familiar.sync + GAME.PET_SYNC_GAIN),
        fatigue: clamp(familiar.fatigue + GAME.PET_FATIGUE_GAIN),
      },
    });
    await db.interactionLog.create({
      data: { familiarId: familiar.id, userId: me.id, actionType: 'pet', detail: `+${GAME.PET_MOOD_GAIN} mood` },
    });

    const newlyUnlocked = await checkAndUnlockAchievements(me.id);
    const dto = toFamiliarDTO(updated);
    await broadcastFamiliarUpdate(dto);
    await broadcastPartyResonance(await computePartyResonance());
    return NextResponse.json({ familiar: dto, petted: true, newAchievements: newlyUnlocked });
  } catch (e) {
    console.error('[familiar/pet]', e);
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 });
  }
}
