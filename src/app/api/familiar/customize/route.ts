import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { recomputeAndPersist, toFamiliarDTO } from '@/lib/familiar-logic';
import { broadcastFamiliarUpdate } from '@/lib/socket-client';

const RENAME_COST = 25;
const ACCENT_UNLOCK_STAGE = 2;
const VALID_HEX = /^#[0-9a-fA-F]{6}$/;

// POST /api/familiar/customize — rename familiar (25 coins) and/or set accent
// color (unlockable at Stage 2, free to change).
export async function POST(req: NextRequest) {
  try {
    const me = await getCurrentUser();
    if (!me) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    let familiar = await db.familiar.findUnique({ where: { userId: me.id } });
    if (!familiar) return NextResponse.json({ error: 'Фамильяр не найден' }, { status: 404 });

    await recomputeAndPersist(familiar.id);
    familiar = await db.familiar.findUnique({ where: { userId: me.id } });
    if (!familiar) return NextResponse.json({ error: 'Фамильяр не найден' }, { status: 404 });

    const body = await req.json();
    const { name, accentColor, bio } = body as { name?: string; accentColor?: string | null; bio?: string | null };

    const updates: { name?: string; accentColor?: string | null; bio?: string | null; coins?: number } = {};
    let cost = 0;

    // Rename (costs coins unless name unchanged).
    if (typeof name === 'string' && name.trim() && name.trim() !== familiar.name) {
      const trimmed = name.trim().slice(0, 30);
      if (familiar.coins < RENAME_COST) {
        return NextResponse.json({ error: `Нужно ${RENAME_COST} монет для переименования` }, { status: 400 });
      }
      updates.name = trimmed;
      cost += RENAME_COST;
    }

    // Accent color (free, but only unlocked at Stage 2+).
    if (accentColor !== undefined) {
      if (familiar.stage < ACCENT_UNLOCK_STAGE) {
        return NextResponse.json({ error: `Акцентный цвет открывается на Стадии ${ACCENT_UNLOCK_STAGE}` }, { status: 400 });
      }
      if (accentColor === null) {
        updates.accentColor = null;
      } else if (typeof accentColor === 'string' && VALID_HEX.test(accentColor)) {
        updates.accentColor = accentColor;
      } else {
        return NextResponse.json({ error: 'Цвет должен быть в формате #RRGGBB' }, { status: 400 });
      }
    }

    // Bio (free, max 500 chars, null to clear).
    if (bio !== undefined) {
      if (bio === null) {
        updates.bio = null;
      } else if (typeof bio === 'string') {
        updates.bio = bio.slice(0, 500);
      }
    }

    if (cost > 0) {
      updates.coins = familiar.coins - cost;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ familiar: toFamiliarDTO(familiar), unchanged: true });
    }

    const updated = await db.familiar.update({ where: { id: familiar.id }, data: updates });
    if (updates.name) {
      await db.interactionLog.create({
        data: { familiarId: familiar.id, userId: me.id, actionType: 'admin_edit', detail: `renamed to "${updates.name}" (-${RENAME_COST} coins)` },
      });
    }

    const dto = toFamiliarDTO(updated);
    await broadcastFamiliarUpdate(dto);
    return NextResponse.json({ familiar: dto, cost });
  } catch (e) {
    console.error('[familiar/customize]', e);
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 });
  }
}
