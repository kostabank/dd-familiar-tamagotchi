import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import {
  recomputeAndPersist,
  toFamiliarDTO,
  computeBuffs,
  recordDailyClaim,
  getDailyClaimStatus,
  nowMoscow,
} from '@/lib/familiar-logic';
import { GAME, clamp } from '@/lib/constants';
import { broadcastFamiliarUpdate } from '@/lib/socket-client';

// POST /api/familiar/claim-buff — claim the once-daily (Moscow day) stage buff.
// Rewards coins + a small mood boost; the actual D&D buff is "activated" for the day.
export async function POST() {
  try {
    const me = await getCurrentUser();
    if (!me) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    let familiar = await db.familiar.findUnique({ where: { userId: me.id } });
    if (!familiar) return NextResponse.json({ error: 'Фамильяр не найден' }, { status: 404 });

    await recomputeAndPersist(familiar.id);
    familiar = await db.familiar.findUnique({ where: { userId: me.id } });
    if (!familiar) return NextResponse.json({ error: 'Фамильяр не найден' }, { status: 404 });

    const status = await getDailyClaimStatus(me.id);
    if (status.claimedToday) {
      return NextResponse.json({ error: 'Бафф уже получен сегодня (по МСК). Возвращайся завтра!' }, { status: 400 });
    }

    await recordDailyClaim(me.id);
    const updated = await db.familiar.update({
      where: { id: familiar.id },
      data: {
        coins: familiar.coins + GAME.DAILY_CLAIM_COIN_REWARD,
        mood: clamp(familiar.mood + 10),
      },
    });
    await db.interactionLog.create({
      data: { familiarId: familiar.id, userId: me.id, actionType: 'claim_buff', detail: `daily buff #${status.claimCount + 1}` },
    });

    const dto = toFamiliarDTO(updated);
    const buffs = await computeBuffs(me.id);
    await broadcastFamiliarUpdate(dto);
    return NextResponse.json({ familiar: dto, buffs, claimed: true });
  } catch (e) {
    console.error('[familiar/claim-buff]', e);
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 });
  }
}

// GET — check claim status without claiming.
export async function GET() {
  try {
    const me = await getCurrentUser();
    if (!me) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    const status = await getDailyClaimStatus(me.id);
    let nextClaimAt: string | null = null;
    if (status.claimedToday) {
      nextClaimAt = nowMoscow().plus({ days: 1 }).startOf('day').toISO();
    }
    return NextResponse.json({ ...status, nextClaimAt });
  } catch (e) {
    console.error('[familiar/claim-buff/get]', e);
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 });
  }
}
