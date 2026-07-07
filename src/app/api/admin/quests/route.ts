import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createQuestAndAssign } from '@/lib/familiar-logic';
import { toast } from 'sonner';

const VALID_METRICS = ['feed', 'play', 'pet', 'claim_buff', 'evolve'];

// POST /api/admin/quests — DM creates a quest and assigns to all players.
export async function POST(req: NextRequest) {
  try {
    const me = await getCurrentUser();
    if (!me) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    if (me.role !== 'dm') return NextResponse.json({ error: 'Только для Мастера' }, { status: 403 });

    const body = await req.json();
    const { title, description, metric, goal, syncReward, coinReward } = body as {
      title?: string; description?: string; metric?: string; goal?: number;
      syncReward?: number; coinReward?: number;
    };

    if (!title || !description || !metric) {
      return NextResponse.json({ error: 'title, description, metric обязательны' }, { status: 400 });
    }
    if (!VALID_METRICS.includes(metric)) {
      return NextResponse.json({ error: `metric должен быть: ${VALID_METRICS.join(', ')}` }, { status: 400 });
    }
    const goalNum = Math.max(1, Math.min(20, Number(goal) || 1));
    const syncNum = Math.max(0, Math.min(100, Number(syncReward) || 15));
    const coinNum = Math.max(0, Math.min(500, Number(coinReward) || 10));

    const quest = await createQuestAndAssign(me.id, {
      title: title.slice(0, 100),
      description: description.slice(0, 300),
      metric,
      goal: goalNum,
      syncReward: syncNum,
      coinReward: coinNum,
    });
    void toast;
    return NextResponse.json({ quest });
  } catch (e) {
    console.error('[admin/quests/create]', e);
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 });
  }
}
