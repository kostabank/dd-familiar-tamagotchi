import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { recomputeAndPersist, toFamiliarDTO } from '@/lib/familiar-logic';

// GET /api/familiar — returns the current user's familiar, with decay recomputed.
export async function GET() {
  try {
    const me = await getCurrentUser();
    if (!me) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    const familiar = await db.familiar.findUnique({ where: { userId: me.id } });
    if (!familiar) return NextResponse.json({ error: 'Фамильяр не найден' }, { status: 404 });
    // Recompute decay on read so stats are always fresh.
    const dto = await recomputeAndPersist(familiar.id);
    return NextResponse.json({ familiar: dto });
  } catch (e) {
    console.error('[familiar/get]', e);
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 });
  }
}
