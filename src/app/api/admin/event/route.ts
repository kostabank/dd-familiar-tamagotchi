import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { triggerGlobalEvent } from '@/lib/socket-client';

const ADMIN_SECRET = process.env.ADMIN_EVENT_SECRET || 'dnd-event-secret';

// POST /api/admin/event — DM triggers a global event ('storm' | 'festival').
// Forwards to the Socket.io service which applies the DB changes + broadcasts.
export async function POST(req: NextRequest) {
  try {
    const me = await getCurrentUser();
    if (!me) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    if (me.role !== 'dm') return NextResponse.json({ error: 'Только для Мастера' }, { status: 403 });

    const { event } = await req.json();
    if (event !== 'storm' && event !== 'festival') {
      return NextResponse.json({ error: 'Неверное событие (storm | festival)' }, { status: 400 });
    }

    const result = await triggerGlobalEvent(event, ADMIN_SECRET);
    if (!result) {
      return NextResponse.json({ error: 'Сервис реального времени недоступен' }, { status: 503 });
    }
    return NextResponse.json({ event, affected: result.affected });
  } catch (e) {
    console.error('[admin/event]', e);
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 });
  }
}
