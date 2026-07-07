import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getActiveQuestForPlayer } from '@/lib/familiar-logic';

// GET /api/familiar/quest — returns the player's active (non-completed) quest.
export async function GET() {
  try {
    const me = await getCurrentUser();
    if (!me) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    const quest = await getActiveQuestForPlayer(me.id);
    return NextResponse.json({ quest });
  } catch (e) {
    console.error('[familiar/quest]', e);
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 });
  }
}
