import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { toFamiliarDTO, getAchievementsForUser, getRecentLogs } from '@/lib/familiar-logic';
import { SPECIES_INFO } from '@/lib/constants';

// GET /api/familiar/profile — full profile data for the current user's familiar.
// Includes familiar DTO + achievements summary + recent logs + species info.
export async function GET() {
  try {
    const me = await getCurrentUser();
    if (!me) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    const familiar = await db.familiar.findUnique({ where: { userId: me.id } });
    if (!familiar) return NextResponse.json({ error: 'Фамильяр не найден' }, { status: 404 });

    const dto = toFamiliarDTO(familiar);
    const achievements = await getAchievementsForUser(me.id);
    const unlockedCount = achievements.filter((a) => a.unlocked).length;
    const logs = await getRecentLogs(familiar.id, 8);

    // Evolution history from logs.
    const evolveLogs = await db.interactionLog.findMany({
      where: { familiarId: familiar.id, actionType: 'evolve', detail: { contains: '->' } },
      orderBy: { timestamp: 'asc' },
      select: { detail: true, timestamp: true },
    });

    return NextResponse.json({
      familiar: dto,
      speciesInfo: SPECIES_INFO[familiar.species] || SPECIES_INFO.construct,
      achievements: {
        unlockedCount,
        total: achievements.length,
        recent: achievements.filter((a) => a.unlocked).slice(0, 4),
      },
      logs,
      evolutionHistory: evolveLogs.map((l) => ({
        detail: l.detail,
        timestamp: l.timestamp instanceof Date ? l.timestamp.toISOString() : l.timestamp,
      })),
      createdAt: familiar.createdAt instanceof Date ? familiar.createdAt.toISOString() : familiar.createdAt,
    });
  } catch (e) {
    console.error('[familiar/profile]', e);
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 });
  }
}
