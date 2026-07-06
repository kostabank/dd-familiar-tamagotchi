import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, signToken, setAuthCookie, toUserPublic } from '@/lib/auth';
import { toFamiliarDTO } from '@/lib/familiar-logic';
import type { Species } from '@/lib/types';

const VALID_SPECIES: Species[] = ['construct', 'dragon', 'magpie', 'doll'];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password, role, characterName, species, familiarName, dmCode } = body as {
      username?: string; password?: string; role?: string; characterName?: string;
      species?: Species; familiarName?: string; dmCode?: string;
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

    const finalRole = role === 'dm' ? (dmCode === 'dungeon-master-2024' ? 'dm' : 'player') : 'player';

    const user = await db.user.create({
      data: {
        username,
        passwordHash: hashPassword(password),
        role: finalRole,
        characterName: characterName || null,
      },
    });

    let familiar = null;
    if (finalRole === 'player') {
      const sp: Species = VALID_SPECIES.includes(species as Species) ? (species as Species) : 'construct';
      const name = familiarName?.trim() || `${username}'s familiar`;
      familiar = await db.familiar.create({
        data: {
          userId: user.id,
          species: sp,
          name,
          stage: 1,
          energy: 80,
          mood: 80,
          fatigue: 0,
          health: 100,
          sync: 0,
          coins: 50,
          lastTick: new Date(),
        },
      });
      await db.interactionLog.create({
        data: { familiarId: familiar.id, userId: user.id, actionType: 'evolve', detail: 'created' },
      });
      familiar = toFamiliarDTO(familiar);
    }

    const token = signToken({ sub: user.id, username: user.username, role: finalRole as 'player' | 'dm' });
    await setAuthCookie(token);

    return NextResponse.json({ user: toUserPublic(user), familiar });
  } catch (e) {
    console.error('[auth/register]', e);
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 });
  }
}
