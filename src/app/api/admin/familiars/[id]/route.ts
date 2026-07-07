import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { toFamiliarDTO, computePartyResonance } from '@/lib/familiar-logic';
import { clamp } from '@/lib/constants';
import { broadcastFamiliarUpdate, broadcastPartyResonance } from '@/lib/socket-client';

// PATCH /api/admin/familiars/:id — DM edits any familiar stat.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const me = await getCurrentUser();
    if (!me) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    if (me.role !== 'dm') return NextResponse.json({ error: 'Только для Мастера' }, { status: 403 });

    const { id } = await params;
    const body = await req.json();
    const { energy, mood, fatigue, health, sync, coins, isSleeping, stage } = body as {
      energy?: number; mood?: number; fatigue?: number; health?: number; sync?: number;
      coins?: number; isSleeping?: boolean; stage?: number;
    };

    const existing = await db.familiar.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Фамильяр не найден' }, { status: 404 });

    const data: Record<string, unknown> = {};
    if (typeof energy === 'number') data.energy = clamp(energy);
    if (typeof mood === 'number') data.mood = clamp(mood);
    if (typeof fatigue === 'number') data.fatigue = clamp(fatigue);
    if (typeof health === 'number') data.health = clamp(health);
    if (typeof sync === 'number') data.sync = clamp(sync);
    if (typeof coins === 'number') data.coins = coins;
    if (typeof isSleeping === 'boolean') {
      data.isSleeping = isSleeping;
      data.sleepStartedAt = isSleeping ? new Date() : null;
    }
    if (typeof stage === 'number' && stage >= 1 && stage <= 3) data.stage = stage;

    const updated = await db.familiar.update({ where: { id }, data });
    await db.interactionLog.create({
      data: { familiarId: id, userId: me.id, actionType: 'admin_edit', detail: JSON.stringify(body).slice(0, 200) },
    });

    const dto = toFamiliarDTO(updated);
    await broadcastFamiliarUpdate(dto);
    await broadcastPartyResonance(await computePartyResonance());
    return NextResponse.json({ familiar: dto });
  } catch (e) {
    console.error('[admin/familiars/patch]', e);
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 });
  }
}
