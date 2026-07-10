import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, signToken, setAuthCookie, toUserPublic } from '@/lib/auth';
import { toFamiliarDTO } from '@/lib/familiar-logic';
import { SPECIES_MODEL_DEFAULTS } from '@/lib/species-defaults';
import type { Species } from '@/lib/types';

const VALID_SPECIES: Species[] = ['construct', 'dragon', 'magpie', 'doll'];

// POST /api/auth/register — creates a NEW PLAYER account.
//
// SECURITY: This endpoint can ONLY create player accounts. DM (admin) accounts
// cannot be self-registered — there is no dmCode, no role field accepted.
// The only way to create a DM account is via /api/admin/create-dm, which
// requires an already-authenticated DM (see AdminPanel → "Create DM").
//
// The initial DM is created once via `bun run seed` (dm / dmdnd123) and the
// password should be changed after first login. Players can never become DM.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password, characterName, species, familiarName } = body as {
      username?: string; password?: string; characterName?: string;
      species?: Species; familiarName?: string;
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

    // Always create a PLAYER. DM accounts are created only via /api/admin/create-dm.
    const finalRole = 'player' as const;

    const user = await db.user.create({
      data: {
        username,
        passwordHash: hashPassword(password),
        role: finalRole,
        characterName: characterName || null,
      },
    });

    const sp: Species = VALID_SPECIES.includes(species as Species) ? (species as Species) : 'construct';
    const name = familiarName?.trim() || `${username}'s familiar`;
    const initialModelConfig = JSON.stringify(SPECIES_MODEL_DEFAULTS[sp]);
    let familiar = await db.familiar.create({
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
        modelConfig: initialModelConfig,
      },
    });
    await db.interactionLog.create({
      data: { familiarId: familiar.id, userId: user.id, actionType: 'evolve', detail: 'created' },
    });
    familiar = toFamiliarDTO(familiar) as typeof familiar;

    const token = signToken({ sub: user.id, username: user.username, role: finalRole });
    await setAuthCookie(token);

    return NextResponse.json({ user: toUserPublic(user), familiar });
  } catch (e) {
    console.error('[auth/register]', e);
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 });
  }
}
