import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, getAuthToken, verifyToken } from '@/lib/auth';
import { toUserPublic } from '@/lib/auth';
import { toFamiliarDTO } from '@/lib/familiar-logic';

// GET /api/auth/me — returns the current user from the session cookie.
// Returns 401 (not an error) when no/invalid cookie — this is the normal
// "not logged in" state, so we don't log it as an error.
export async function GET() {
  try {
    // Check cookie presence first for better diagnostics.
    const token = await getAuthToken();
    if (!token) {
      return NextResponse.json({ error: 'Не авторизован', reason: 'no_cookie' }, { status: 401 });
    }
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Не авторизован', reason: 'invalid_token' }, { status: 401 });
    }
    const user = await db.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован', reason: 'user_not_found' }, { status: 401 });
    }
    const familiar = await db.familiar.findUnique({ where: { userId: user.id } });
    return NextResponse.json({
      user: toUserPublic(user),
      familiar: familiar ? toFamiliarDTO(familiar) : null,
    });
  } catch (e) {
    console.error('[auth/me] FATAL:', e);
    return NextResponse.json({ error: 'Внутренняя ошибка', reason: 'server_error' }, { status: 500 });
  }
}
