// Seed the achievement catalog.
import { db } from '../src/lib/db';

const achievements = [
  // Stage / evolution
  { code: 'first_evolution', title: 'Первая Метаморфоза', description: 'Эволюционируй своего фамильяра впервые', icon: '🥚', tier: 'bronze', goal: 1, metric: 'evolutions' },
  { code: 'stage_3', title: 'Совершенство', description: 'Достигни 3-й стадии эволюции', icon: '👑', tier: 'gold', goal: 3, metric: 'stage' },
  { code: 'stage_2', title: 'Подросток', description: 'Достигни 2-й стадии эволюции', icon: '⭐', tier: 'silver', goal: 2, metric: 'stage' },
  // Coins
  { code: 'coin_hoarder', title: 'Кладоискатель', description: 'Накопи 100 монет', icon: '💰', tier: 'silver', goal: 100, metric: 'coins' },
  { code: 'coin_rich', title: 'Дракон-Скупец', description: 'Накопи 300 монет', icon: '🐉', tier: 'gold', goal: 300, metric: 'coins' },
  // Actions
  { code: 'playful', title: 'Игривый', description: 'Сыграй в мини-игру 10 раз', icon: '🎮', tier: 'bronze', goal: 10, metric: 'play_count' },
  { code: 'play_master', title: 'Мастер Игры', description: 'Сыграй в мини-игру 25 раз', icon: '🕹️', tier: 'silver', goal: 25, metric: 'play_count' },
  { code: 'feeder', title: 'Кормилец', description: 'Покорми фамильяра 15 раз', icon: '🍎', tier: 'bronze', goal: 15, metric: 'feed_count' },
  { code: 'pet_lover', title: 'Ласковый', description: 'Погладь фамильяра 20 раз', icon: '💗', tier: 'bronze', goal: 20, metric: 'pet_count' },
  // Streak (consecutive MSK days with at least one action)
  { code: 'streak_3', title: 'Постоянство', description: 'Активен 3 дня подряд (МСК)', icon: '🔥', tier: 'bronze', goal: 3, metric: 'streak_days' },
  { code: 'streak_7', title: 'Недельный Ритуал', description: 'Активен 7 дней подряд (МСК)', icon: '⚡', tier: 'silver', goal: 7, metric: 'streak_days' },
  // Gifting
  { code: 'generous', title: 'Щедрый', description: 'Отправь 3 подарка другим игрокам', icon: '🎁', tier: 'bronze', goal: 3, metric: 'gift_count' },
  { code: 'patron', title: 'Покровитель', description: 'Отправь 10 подарков другим игрокам', icon: '💝', tier: 'silver', goal: 10, metric: 'gift_count' },
];

async function main() {
  console.log('Seeding achievements...');
  for (const a of achievements) {
    await db.achievement.upsert({
      where: { code: a.code },
      update: { title: a.title, description: a.description, icon: a.icon, tier: a.tier, goal: a.goal, metric: a.metric },
      create: a,
    });
  }
  console.log(`Seeded ${achievements.length} achievements.`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
