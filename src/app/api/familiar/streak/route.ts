import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { computeStreakDays, hasActionToday } from '@/lib/familiar-logic';
import { STREAK_TIERS, reachedStreakTier, nextStreakTier } from '@/lib/constants';

// GET /api/familiar/streak — current consecutive-day activity streak (Moscow days)
// plus milestone tier info for the DailyBuffPanel progress track + a
// "streak at risk" flag (streak >= 1 but no action logged today yet).
export async function GET() {
  try {
    const me = await getCurrentUser();
    if (!me) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    const streak = await computeStreakDays(me.id);
    const actedToday = await hasActionToday(me.id);
    const reached = reachedStreakTier(streak);
    const next = nextStreakTier(streak);
    return NextResponse.json({
      streak,
      actedToday,
      // Streak is "at risk" if the player has an active streak but hasn't
      // performed any action yet today — they'd lose it at midnight MSK.
      atRisk: streak >= 1 && !actedToday,
      tiers: STREAK_TIERS,
      reachedTier: reached,
      nextTier: next,
      daysToNext: next ? Math.max(0, next.days - streak) : null,
    });
  } catch (e) {
    console.error('[familiar/streak]', e);
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 });
  }
}
