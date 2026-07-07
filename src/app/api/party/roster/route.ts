import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPartyRoster } from '@/lib/familiar-logic';

// GET /api/party/roster — lightweight list of all players + familiars.
// Available to any authenticated user (players see the party sidebar).
export async function GET() {
  try {
    const me = await getCurrentUser();
    if (!me) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    const roster = await getPartyRoster();
    return NextResponse.json({ roster });
  } catch (e) {
    console.error('[party/roster]', e);
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 });
  }
}
