import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, toUserPublic } from '@/lib/auth';
import { toFamiliarDTO } from '@/lib/familiar-logic';

export async function GET() {
  try {
    const me = await getCurrentUser();
    if (!me) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    const user = await db.user.findUnique({ where: { id: me.id } });
    if (!user) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    const familiar = await db.familiar.findUnique({ where: { userId: user.id } });
    return NextResponse.json({
      user: toUserPublic(user),
      familiar: familiar ? toFamiliarDTO(familiar) : null,
    });
  } catch (e) {
    console.error('[auth/me]', e);
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 });
  }
}
