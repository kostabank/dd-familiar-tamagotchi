import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { toFamiliarDTO, computePartyResonance } from '@/lib/familiar-logic';
import { clamp } from '@/lib/constants';
import { broadcastFamiliarUpdate, broadcastPartyResonance, broadcastAdminEvent } from '@/lib/supabase';

// POST /api/admin/event — DM triggers a global event ('storm' | 'festival').
// Applies DB changes directly + broadcasts via Supabase Realtime.
export async function POST(req: NextRequest) {
  try {
    const me = await getCurrentUser();
    if (!me) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    if (me.role !== 'dm') return NextResponse.json({ error: 'Только для Мастера' }, { status: 403 });

    const { event } = await req.json();
    if (event !== 'storm' && event !== 'festival') {
      return NextResponse.json({ error: 'Неверное событие (storm | festival)' }, { status: 400 });
    }

    // Apply to all familiars directly.
    const familiars = await db.familiar.findMany();
    let affected = 0;
    for (const f of familiars) {
      try {
        const data = event === 'storm' ? { energy: clamp(f.energy - 20) } : { mood: clamp(f.mood + 50) };
        await db.familiar.update({ where: { id: f.id }, data });
        await db.interactionLog.create({
          data: { familiarId: f.id, userId: f.userId, actionType: 'event', detail: `global_event:${event}` },
        });
        affected++;
      } catch {
        /* skip on error */
      }
    }

    // Broadcast all updated familiars + resonance + event notification.
    const refreshed = await db.familiar.findMany();
    for (const f of refreshed) {
      await broadcastFamiliarUpdate(toFamiliarDTO(f));
    }
    const resonance = await computePartyResonance();
    await broadcastPartyResonance(resonance);
    await broadcastAdminEvent(event, affected);

    return NextResponse.json({ event, affected });
  } catch (e) {
    console.error('[admin/event]', e);
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 });
  }
}
