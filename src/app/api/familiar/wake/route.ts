import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { recomputeAndPersist, toFamiliarDTO, computePartyResonance } from '@/lib/familiar-logic';
import { broadcastFamiliarUpdate, broadcastPartyResonance } from '@/lib/socket-client';

// POST /api/familiar/wake — manually wake the familiar before the 4h auto-wake.
export async function POST() {
  try {
    const me = await getCurrentUser();
    if (!me) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    let familiar = await db.familiar.findUnique({ where: { userId: me.id } });
    if (!familiar) return NextResponse.json({ error: 'Фамильяр не найден' }, { status: 404 });

    await recomputeAndPersist(familiar.id);
    familiar = await db.familiar.findUnique({ where: { userId: me.id } });
    if (!familiar) return NextResponse.json({ error: 'Фамильяр не найден' }, { status: 404 });

    if (!familiar.isSleeping) {
      return NextResponse.json({ error: 'Фамильяр не спит' }, { status: 400 });
    }

    const updated = await db.familiar.update({
      where: { id: familiar.id },
      data: { isSleeping: false, sleepStartedAt: null, fatigue: 0 },
    });
    await db.interactionLog.create({
      data: { familiarId: familiar.id, userId: me.id, actionType: 'wake', detail: 'manual wake' },
    });

    const dto = toFamiliarDTO(updated);
    await broadcastFamiliarUpdate(dto);
    await broadcastPartyResonance(await computePartyResonance());
    return NextResponse.json({ familiar: dto });
  } catch (e) {
    console.error('[familiar/wake]', e);
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 });
  }
}
