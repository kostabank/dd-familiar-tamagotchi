import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { getRecentLogs } from '@/lib/familiar-logic';

// GET /api/familiar/logs — recent interactions for the current user's familiar.
export async function GET() {
  try {
    const me = await getCurrentUser();
    if (!me) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    const familiar = await db.familiar.findUnique({ where: { userId: me.id }, select: { id: true } });
    if (!familiar) return NextResponse.json({ error: 'Фамильяр не найден' }, { status: 404 });
    const logs = await getRecentLogs(familiar.id, 15);
    return NextResponse.json({ logs });
  } catch (e) {
    console.error('[familiar/logs]', e);
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 });
  }
}
