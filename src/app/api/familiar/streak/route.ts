import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { computeStreakDays } from '@/lib/familiar-logic';

// GET /api/familiar/streak — current consecutive-day activity streak (Moscow days).
export async function GET() {
  try {
    const me = await getCurrentUser();
    if (!me) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    const streak = await computeStreakDays(me.id);
    return NextResponse.json({ streak });
  } catch (e) {
    console.error('[familiar/streak]', e);
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 });
  }
}
