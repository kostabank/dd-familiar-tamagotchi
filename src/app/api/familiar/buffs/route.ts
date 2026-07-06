import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { computeBuffs } from '@/lib/familiar-logic';

// GET /api/familiar/buffs — individual buff, debuff, and party resonance.
export async function GET() {
  try {
    const me = await getCurrentUser();
    if (!me) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    const buffs = await computeBuffs(me.id);
    return NextResponse.json(buffs);
  } catch (e) {
    console.error('[familiar/buffs]', e);
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 });
  }
}
