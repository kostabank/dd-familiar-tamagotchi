import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { computeStreakDays } from '@/lib/familiar-logic';
import { STREAK_TIERS, reachedStreakTier, nextStreakTier } from '@/lib/constants';

// GET /api/familiar/streak — current consecutive-day activity streak (Moscow days)
// plus milestone tier info for the DailyBuffPanel progress track.
export async function GET() {
  try {
    const me = await getCurrentUser();
    if (!me) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    const streak = await computeStreakDays(me.id);
    const reached = reachedStreakTier(streak);
    const next = nextStreakTier(streak);
    return NextResponse.json({
      streak,
      tiers: STREAK_TIERS,
      reachedTier: reached,
      nextTier: next,
      // days remaining to the next milestone (null if all reached)
      daysToNext: next ? Math.max(0, next.days - streak) : null,
    });
  } catch (e) {
    console.error('[familiar/streak]', e);
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 });
  }
}
