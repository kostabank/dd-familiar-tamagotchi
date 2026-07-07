import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getAllActiveQuests, getAllQuests } from '@/lib/familiar-logic';

// GET /api/admin/quests/list — DM lists active player quests + quest history.
// Query ?mode=active (default) or ?mode=history.
export async function GET(req: Request) {
  try {
    const me = await getCurrentUser();
    if (!me) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    if (me.role !== 'dm') return NextResponse.json({ error: 'Только для Мастера' }, { status: 403 });

    const url = new URL(req.url);
    const mode = url.searchParams.get('mode') || 'active';
    if (mode === 'history') {
      const quests = await getAllQuests();
      return NextResponse.json({ quests });
    }
    const active = await getAllActiveQuests();
    return NextResponse.json({ active });
  } catch (e) {
    console.error('[admin/quests/list]', e);
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 });
  }
}
