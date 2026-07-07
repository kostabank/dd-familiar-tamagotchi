import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { recomputeAndPersist, toFamiliarDTO, computePartyResonance } from '@/lib/familiar-logic';
import { broadcastFamiliarUpdate, broadcastPartyResonance } from '@/lib/socket-client';

// POST /api/familiar/sleep — put the familiar to sleep (real-time 4h).
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
      return NextResponse.json({ error: 'Фамильяр уже спит' }, { status: 400 });
    }

    const now = new Date();
    const updated = await db.familiar.update({
      where: { id: familiar.id },
      data: { isSleeping: true, sleepStartedAt: now },
    });
    await db.interactionLog.create({
      data: { familiarId: familiar.id, userId: me.id, actionType: 'sleep', detail: `sleep_started_at=${now.toISOString()}` },
    });

    const dto = toFamiliarDTO(updated);
    await broadcastFamiliarUpdate(dto);
    await broadcastPartyResonance(await computePartyResonance());
    return NextResponse.json({ familiar: dto });
  } catch (e) {
    console.error('[familiar/sleep]', e);
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 });
  }
}
