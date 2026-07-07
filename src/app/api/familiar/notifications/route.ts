import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET /api/familiar/notifications — recent significant events for the player:
// evolutions, achievement rewards, quest completions, DM events, daily claims.
// Returns up to 12 items, newest first.
export async function GET() {
  try {
    const me = await getCurrentUser();
    if (!me) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    const familiar = await db.familiar.findUnique({ where: { userId: me.id }, select: { id: true } });
    if (!familiar) return NextResponse.json({ error: 'Фамильяр не найден' }, { status: 404 });

    const logs = await db.interactionLog.findMany({
      where: {
        familiarId: familiar.id,
        actionType: { in: ['evolve', 'claim_buff', 'event', 'admin_edit'] },
      },
      orderBy: { timestamp: 'desc' },
      take: 12,
    });

    const notifications = logs.map((l) => {
      // Classify severity based on actionType + detail.
      let severity: 'success' | 'info' | 'warning' | 'event' = 'info';
      let label = l.actionType;
      if (l.actionType === 'evolve') {
        severity = 'success';
        label = 'Эволюция';
      } else if (l.actionType === 'claim_buff') {
        if (l.detail?.startsWith('quest_completed')) {
          severity = 'success';
          label = 'Квест выполнен';
        } else if (l.detail?.startsWith('achievement_reward')) {
          severity = 'success';
          label = 'Награда за достижение';
        } else if (l.detail?.startsWith('gift_received')) {
          severity = 'success';
          label = 'Получен подарок';
        } else {
          severity = 'info';
          label = 'Бафф дня';
        }
      } else if (l.actionType === 'event') {
        severity = 'event';
        label = l.detail?.includes('storm') ? 'Магическая Буря' : l.detail?.includes('festival') ? 'Праздник' : 'Событие';
      } else if (l.actionType === 'admin_edit') {
        if (l.detail?.startsWith('gift_sent')) {
          severity = 'info';
          label = 'Подарок отправлен';
        } else {
          severity = 'warning';
          label = 'Вмешательство Мастера';
        }
      }
      return {
        id: l.id,
        severity,
        label,
        detail: l.detail,
        timestamp: l.timestamp instanceof Date ? l.timestamp.toISOString() : l.timestamp,
      };
    });

    return NextResponse.json({ notifications });
  } catch (e) {
    console.error('[familiar/notifications]', e);
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 });
  }
}
