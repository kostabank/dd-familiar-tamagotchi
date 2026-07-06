import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { recomputeAndPersist, toFamiliarDTO, computePartyResonance } from '@/lib/familiar-logic';
import { GAME, clamp } from '@/lib/constants';
import { broadcastFamiliarUpdate, broadcastPartyResonance } from '@/lib/socket-client';

// POST /api/familiar/play — accepts { score, target } from the mini-game.
// success threshold: score >= target (e.g. caught >= 5 spheres).
export async function POST(req: NextRequest) {
  try {
    const me = await getCurrentUser();
    if (!me) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    let familiar = await db.familiar.findUnique({ where: { userId: me.id } });
    if (!familiar) return NextResponse.json({ error: 'Фамильяр не найден' }, { status: 404 });

    await recomputeAndPersist(familiar.id);
    familiar = await db.familiar.findUnique({ where: { userId: me.id } });
    if (!familiar) return NextResponse.json({ error: 'Фамильяр не найден' }, { status: 404 });

    if (familiar.isSleeping) {
      return NextResponse.json({ error: 'Фамильяр спит — нельзя играть' }, { status: 400 });
    }
    if (familiar.fatigue > GAME.FATIGUE_BLOCK_THRESHOLD) {
      return NextResponse.json({ error: 'Фамильяр слишком устал' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const score = Number(body.score) || 0;
    const target = Number(body.target) || 5;
    const success = score >= target;

    const moodGain = success ? GAME.PLAY_MOOD_GAIN_SUCCESS : GAME.PLAY_MOOD_GAIN_FAIL;
    const syncGain = success ? GAME.PLAY_SYNC_GAIN_SUCCESS : GAME.PLAY_SYNC_GAIN_FAIL;
    const coins = success ? GAME.PLAY_COINS_SUCCESS : GAME.PLAY_COINS_FAIL;

    const updated = await db.familiar.update({
      where: { id: familiar.id },
      data: {
        mood: clamp(familiar.mood + moodGain),
        sync: clamp(familiar.sync + syncGain),
        fatigue: clamp(familiar.fatigue + GAME.FATIGUE_PER_ACTION),
        coins: familiar.coins + coins,
      },
    });
    await db.interactionLog.create({
      data: {
        familiarId: familiar.id,
        userId: me.id,
        actionType: 'play',
        detail: `score=${score}/${target} success=${success}`,
      },
    });

    const dto = toFamiliarDTO(updated);
    await broadcastFamiliarUpdate(dto);
    await broadcastPartyResonance(await computePartyResonance());
    return NextResponse.json({ familiar: dto, success, moodGain, syncGain, coins });
  } catch (e) {
    console.error('[familiar/play]', e);
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 });
  }
}
