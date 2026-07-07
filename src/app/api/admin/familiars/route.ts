import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { toFamiliarDTO } from '@/lib/familiar-logic';
import type { AdminFamiliarRow } from '@/lib/types';

// GET /api/admin/familiars — DM only. Returns all familiars with player info.
export async function GET() {
  try {
    const me = await getCurrentUser();
    if (!me) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    if (me.role !== 'dm') return NextResponse.json({ error: 'Только для Мастера' }, { status: 403 });

    const rows = await db.familiar.findMany({
      include: { user: { select: { username: true, characterName: true } } },
      orderBy: { createdAt: 'asc' },
    });
    const result: AdminFamiliarRow[] = rows.map((f) => ({
      ...toFamiliarDTO(f),
      username: f.user.username,
      characterName: f.user.characterName,
    }));
    return NextResponse.json({ familiars: result });
  } catch (e) {
    console.error('[admin/familiars/get]', e);
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 });
  }
}
