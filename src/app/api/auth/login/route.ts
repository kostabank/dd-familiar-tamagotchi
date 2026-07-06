import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword, signToken, setAuthCookie, toUserPublic } from '@/lib/auth';
import { toFamiliarDTO } from '@/lib/familiar-logic';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ error: 'username и password обязательны' }, { status: 400 });
    }
    const user = await db.user.findUnique({ where: { username } });
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: 'Неверные учётные данные' }, { status: 401 });
    }
    const familiar = await db.familiar.findUnique({ where: { userId: user.id } });
    const token = signToken({ sub: user.id, username: user.username, role: user.role as 'player' | 'dm' });
    await setAuthCookie(token);
    return NextResponse.json({
      user: toUserPublic(user),
      familiar: familiar ? toFamiliarDTO(familiar) : null,
    });
  } catch (e) {
    console.error('[auth/login]', e);
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 });
  }
}
