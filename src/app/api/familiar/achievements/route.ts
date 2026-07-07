import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getAchievementsForUser, checkAndUnlockAchievements } from '@/lib/familiar-logic';

// GET /api/familiar/achievements — list all achievements with unlock status + progress.
// Also runs an unlock check (idempotent) so achievements unlock even if the
// action route's check was missed.
export async function GET() {
  try {
    const me = await getCurrentUser();
    if (!me) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    // Opportunistically unlock any newly-qualified achievements.
    await checkAndUnlockAchievements(me.id);
    const achievements = await getAchievementsForUser(me.id);
    const unlockedCount = achievements.filter((a) => a.unlocked).length;
    return NextResponse.json({ achievements, unlockedCount, total: achievements.length });
  } catch (e) {
    console.error('[familiar/achievements]', e);
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 });
  }
}
