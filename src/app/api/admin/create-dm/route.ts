import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { hashPassword } from '@/lib/auth';

// POST /api/admin/create-dm — creates a NEW DM (admin) account.
//
// SECURITY: Only an already-authenticated DM can call this. Players get 403.
// This is the ONLY way to create a DM account besides the initial seeded one
// (dm / dmdnd123 from `bun run seed`). There is no self-registration path.
//
// Body: { username, password, characterName? }
export async function POST(req: NextRequest) {
  try {
    const me = await getCurrentUser();
    if (!me) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    if (me.role !== 'dm') return NextResponse.json({ error: 'Только для Мастера' }, { status: 403 });

    const body = await req.json();
    const { username, password, characterName } = body as {
      username?: string; password?: string; characterName?: string;
    };

    if (!username || !password) {
      return NextResponse.json({ error: 'username и password обязательны' }, { status: 400 });
    }
    if (username.length < 3 || password.length < 6) {
      return NextResponse.json({ error: 'username ≥ 3 символа, password ≥ 6' }, { status: 400 });
    }

    const existing = await db.user.findUnique({ where: { username } });
    if (existing) {
      return NextResponse.json({ error: 'Имя занято' }, { status: 409 });
    }

    const newDM = await db.user.create({
      data: {
        username,
        passwordHash: hashPassword(password),
        role: 'dm',
        characterName: characterName || null,
      },
      select: { id: true, username: true, role: true, characterName: true, createdAt: true },
    });

    return NextResponse.json({ user: newDM });
  } catch (e) {
    console.error('[admin/create-dm]', e);
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 });
  }
}
