import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  characterName: string | null;
  species: string;
  familiarName: string;
  stage: number;
  evolutionPath: string | null;
  coins: number;
  achievementsUnlocked: number;
  mood: number;
  energy: number;
}

// GET /api/party/leaderboard — ranked list of all players by a composite score.
// Score = achievements*50 + coins + stage*100 + (mood+energy)/4.
export async function GET() {
  try {
    const me = await getCurrentUser();
    if (!me) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    const familiars = await db.familiar.findMany({
      include: {
        user: { select: { id: true, username: true, characterName: true } },
      },
    });

    // Count achievements per user in one query.
    const achievementCounts = await db.playerAchievement.groupBy({
      by: ['userId'],
      _count: { _all: true },
    });
    const countMap = new Map(achievementCounts.map((a) => [a.userId, a._count._all]));

    const entries: Omit<LeaderboardEntry, 'rank'>[] = familiars.map((f) => {
      const achievementsUnlocked = countMap.get(f.userId) ?? 0;
      const score = achievementsUnlocked * 50 + f.coins + f.stage * 100 + (f.mood + f.energy) / 4;
      return {
        userId: f.user.id,
        username: f.user.username,
        characterName: f.user.characterName,
        species: f.species,
        familiarName: f.name,
        stage: f.stage,
        evolutionPath: f.evolutionPath,
        coins: f.coins,
        achievementsUnlocked,
        mood: f.mood,
        energy: f.energy,
        // score is used for sorting only, not returned to avoid leaking internals
        // but we keep it for the sort
      } as Omit<LeaderboardEntry, 'rank'> & { score: number };
    });

    // Sort by score desc, then by coins desc, then by stage desc.
    entries.sort((a, b) => {
      const sa = (a as { score: number }).score;
      const sb = (b as { score: number }).score;
      if (sb !== sa) return sb - sa;
      if (b.coins !== a.coins) return b.coins - a.coins;
      return b.stage - a.stage;
    });

    const ranked: LeaderboardEntry[] = entries.map((e, i) => {
      const { score, ...rest } = e as { score: number } & Omit<LeaderboardEntry, 'rank'>;
      void score;
      return { rank: i + 1, ...rest };
    });

    return NextResponse.json({ leaderboard: ranked, currentUserId: me.id });
  } catch (e) {
    console.error('[party/leaderboard]', e);
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 });
  }
}
