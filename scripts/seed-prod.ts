// Seed the PRODUCTION database (Supabase PostgreSQL) with:
//   - 24 evolution options (4 species × 3 paths × 2 stages)
//   - 13 achievements
//   - 1 DM account (dm / dmdnd123) — change the password after first login!
//
// Usage (run locally, the script connects to your Supabase DB):
//
//   DATABASE_URL="postgresql://postgres:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres" \
//   DIRECT_URL="$DATABASE_URL" \
//   bun run scripts/seed-prod.ts
//
// Or with a .env.local that has these vars, just: bun run scripts/seed-prod.ts
//
// This script is SAFE to re-run: it upserts (updates if exists) and only
// creates the DM account if it doesn't already exist.

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const db = new PrismaClient();

const DM_USERNAME = process.env.DM_USERNAME || 'dm';
const DM_PASSWORD = process.env.DM_PASSWORD || 'dmdnd123';
const DM_CHARACTER_NAME = process.env.DM_CHARACTER_NAME || 'Мастер Подземелий';

// ===== Evolution options (24 total) =====
const STAGE2_BUFF = '+1d4 к атаке (1 раз в день)';
const STAGE3_BUFF = 'Переброс проваленного спасброска (1 раз в день)';

interface SeedOption {
  species: string;
  fromStage: number;
  toStage: number;
  pathName: string;
  visualDescription: string;
  hiddenBuff: string;
  modelConfig: object;
}

const options: SeedOption[] = [
  // CONSTRUCT
  { species: 'construct', fromStage: 1, toStage: 2, pathName: 'Сентинель', visualDescription: 'Металл темнеет до оружейной стали. Кольца утолщаются в бронепластины, ядро пульсирует рубиновым светом.', hiddenBuff: STAGE2_BUFF, modelConfig: { primaryColor: '#3a3f4a', emissiveColor: '#ef4444', emissiveIntensity: 1.4, scale: 1.1, metalness: 0.95, roughness: 0.25, ornamentColor: '#ef4444' } },
  { species: 'construct', fromStage: 1, toStage: 2, pathName: 'Оракул', visualDescription: 'Поверхность становится полупрозрачным кристаллом, ядро — сапфиром. Кольца превращаются в световые орбиты.', hiddenBuff: STAGE2_BUFF, modelConfig: { primaryColor: '#1e293b', emissiveColor: '#38bdf8', emissiveIntensity: 1.8, scale: 1.05, metalness: 0.6, roughness: 0.1, ornamentColor: '#a855f7' } },
  { species: 'construct', fromStage: 1, toStage: 2, pathName: 'Разведчик', visualDescription: 'Форма вытягивается, грани заостряются. Кольца превращаются в лезвия-пропеллеры.', hiddenBuff: STAGE2_BUFF, modelConfig: { primaryColor: '#2d3a2d', emissiveColor: '#22c55e', emissiveIntensity: 1.2, scale: 0.95, metalness: 0.8, roughness: 0.4, ornamentColor: '#22c55e' } },
  { species: 'construct', fromStage: 2, toStage: 3, pathName: 'Архонт', visualDescription: 'Грани умножаются, формируя звезду. Кольца расщепляются на шесть орбит. Ядро вспыхивает белым пламенем.', hiddenBuff: STAGE3_BUFF, modelConfig: { primaryColor: '#fef3c7', emissiveColor: '#fbbf24', emissiveIntensity: 2.2, scale: 1.3, metalness: 0.9, roughness: 0.15, ornamentColor: '#fde68a' } },
  { species: 'construct', fromStage: 2, toStage: 3, pathName: 'Титан', visualDescription: 'Размер увеличивается вдвое, броня наращивается слоями. Ядро — пульсирующий кратер магмы.', hiddenBuff: STAGE3_BUFF, modelConfig: { primaryColor: '#1c1917', emissiveColor: '#f97316', emissiveIntensity: 1.9, scale: 1.5, metalness: 0.95, roughness: 0.35, ornamentColor: '#f97316' } },
  { species: 'construct', fromStage: 2, toStage: 3, pathName: 'Эфириум', visualDescription: 'Материал теряет плотность, становясь чистым светом. Грани — грани призмы.', hiddenBuff: STAGE3_BUFF, modelConfig: { primaryColor: '#e0e7ff', emissiveColor: '#818cf8', emissiveIntensity: 2.5, scale: 1.2, metalness: 0.3, roughness: 0.05, ornamentColor: '#c7d2fe' } },
  // DRAGON
  { species: 'dragon', fromStage: 1, toStage: 2, pathName: 'Багровый', visualDescription: 'Чешуя наливается багрянцем, рог удлиняется и чернеет. Крылья расширяются, мерцая жаром.', hiddenBuff: STAGE2_BUFF, modelConfig: { primaryColor: '#991b1b', emissiveColor: '#dc2626', emissiveIntensity: 0.8, scale: 1.15, metalness: 0.4, roughness: 0.5, accentColor: '#fca5a5', ornamentColor: '#450a0a' } },
  { species: 'dragon', fromStage: 1, toStage: 2, pathName: 'Лазурный', visualDescription: 'Окрас холодеет до индиго, по хребту — иней. Крылья полупрозрачны, как лёд.', hiddenBuff: STAGE2_BUFF, modelConfig: { primaryColor: '#1e3a8a', emissiveColor: '#60a5fa', emissiveIntensity: 1.0, scale: 1.1, metalness: 0.3, roughness: 0.2, accentColor: '#dbeafe', ornamentColor: '#bfdbfe' } },
  { species: 'dragon', fromStage: 1, toStage: 2, pathName: 'Изумрудный', visualDescription: 'Чешуя зеленеет малахитом, рог зазубрен. Хвост удлиняется, мерцая слизью.', hiddenBuff: STAGE2_BUFF, modelConfig: { primaryColor: '#166534', emissiveColor: '#22c55e', emissiveIntensity: 0.9, scale: 1.1, metalness: 0.4, roughness: 0.55, accentColor: '#86efac', ornamentColor: '#14532d' } },
  { species: 'dragon', fromStage: 2, toStage: 3, pathName: 'Древний', visualDescription: 'Размах крыльев огромен, чешуя покрыта рунами возраста. Рога ветвятся.', hiddenBuff: STAGE3_BUFF, modelConfig: { primaryColor: '#581c87', emissiveColor: '#c084fc', emissiveIntensity: 1.3, scale: 1.45, metalness: 0.5, roughness: 0.45, accentColor: '#e9d5ff', ornamentColor: '#7e22ce' } },
  { species: 'dragon', fromStage: 2, toStage: 3, pathName: 'Виверн-Лорд', visualDescription: 'Тело вытягивается, хищное. Крылья рвутся на перепонки-лезвия. Хвост — ядовитое жало.', hiddenBuff: STAGE3_BUFF, modelConfig: { primaryColor: '#0f766e', emissiveColor: '#2dd4bf', emissiveIntensity: 1.1, scale: 1.35, metalness: 0.45, roughness: 0.4, accentColor: '#99f6e4', ornamentColor: '#134e4a' } },
  { species: 'dragon', fromStage: 2, toStage: 3, pathName: 'Теневой', visualDescription: 'Чешуя — дымчатая полупрозрачность, контуры размываются. Глаза — два уголька.', hiddenBuff: STAGE3_BUFF, modelConfig: { primaryColor: '#18181b', emissiveColor: '#a855f7', emissiveIntensity: 1.6, scale: 1.3, metalness: 0.2, roughness: 0.7, accentColor: '#7c3aed', ornamentColor: '#3f3f46' } },
  // MAGPIE
  { species: 'magpie', fromStage: 1, toStage: 2, pathName: 'Вещун', visualDescription: 'Оперение темнеет до смоляного, на груди — серебряный знак. Клюв удлиняется.', hiddenBuff: STAGE2_BUFF, modelConfig: { primaryColor: '#0a0a0a', emissiveColor: '#94a3b8', emissiveIntensity: 0.5, scale: 1.1, metalness: 0.6, roughness: 0.3, accentColor: '#e2e8f0', ornamentColor: '#cbd5e1' } },
  { species: 'magpie', fromStage: 1, toStage: 2, pathName: 'Крадущийся', visualDescription: 'Перья становятся серыми, как сумерки. Клюв кривится в ухмылке.', hiddenBuff: STAGE2_BUFF, modelConfig: { primaryColor: '#374151', emissiveColor: '#6b7280', emissiveIntensity: 0.4, scale: 1.0, metalness: 0.3, roughness: 0.6, accentColor: '#9ca3af', ornamentColor: '#1f2937' } },
  { species: 'magpie', fromStage: 1, toStage: 2, pathName: 'Говорящий', visualDescription: 'Грудь белеет, на голове — хохолок из ярких перьев. Клюв золотится.', hiddenBuff: STAGE2_BUFF, modelConfig: { primaryColor: '#111827', emissiveColor: '#fbbf24', emissiveIntensity: 0.7, scale: 1.05, metalness: 0.5, roughness: 0.4, accentColor: '#fef3c7', ornamentColor: '#f59e0b' } },
  { species: 'magpie', fromStage: 2, toStage: 3, pathName: 'Ворон-Пророк', visualDescription: 'Размах крыльев утраивается, оперение иссиня-чёрное. На груди — третий глаз.', hiddenBuff: STAGE3_BUFF, modelConfig: { primaryColor: '#0c0a09', emissiveColor: '#3b82f6', emissiveIntensity: 1.2, scale: 1.4, metalness: 0.7, roughness: 0.25, accentColor: '#93c5fd', ornamentColor: '#1d4ed8' } },
  { species: 'magpie', fromStage: 2, toStage: 3, pathName: 'Буревестник', visualDescription: 'Перья наэлектризованы, между ними проскакивают искры. Клюв — молния.', hiddenBuff: STAGE3_BUFF, modelConfig: { primaryColor: '#1e1b4b', emissiveColor: '#facc15', emissiveIntensity: 1.5, scale: 1.35, metalness: 0.5, roughness: 0.3, accentColor: '#fef9c3', ornamentColor: '#a855f7' } },
  { species: 'magpie', fromStage: 2, toStage: 3, pathName: 'Серебряный', visualDescription: 'Оперение зеркально-серебряное. Клюв — полированное серебро.', hiddenBuff: STAGE3_BUFF, modelConfig: { primaryColor: '#e5e7eb', emissiveColor: '#f8fafc', emissiveIntensity: 0.8, scale: 1.3, metalness: 0.95, roughness: 0.05, accentColor: '#ffffff', ornamentColor: '#cbd5e1' } },
  // DOLL
  { species: 'doll', fromStage: 1, toStage: 2, pathName: 'Хранитель', visualDescription: 'Ткань уплотняется защитной вышивкой. Пуговичные глаза становятся медными.', hiddenBuff: STAGE2_BUFF, modelConfig: { primaryColor: '#7f1d1d', emissiveColor: '#b45309', emissiveIntensity: 0.5, scale: 1.1, metalness: 0.2, roughness: 0.85, accentColor: '#fbbf24', ornamentColor: '#92400e' } },
  { species: 'doll', fromStage: 1, toStage: 2, pathName: 'Мститель', visualDescription: 'Ткань рвётся, обнажая нитяные сухожилия. Глаза-пуговицы трескаются, светя красным.', hiddenBuff: STAGE2_BUFF, modelConfig: { primaryColor: '#450a0a', emissiveColor: '#dc2626', emissiveIntensity: 1.0, scale: 1.1, metalness: 0.1, roughness: 0.9, accentColor: '#7f1d1d', ornamentColor: '#991b1b' } },
  { species: 'doll', fromStage: 1, toStage: 2, pathName: 'Шептун', visualDescription: 'Ткань сереет, становится полупрозрачной. Рот расшивается нитями-зубами.', hiddenBuff: STAGE2_BUFF, modelConfig: { primaryColor: '#3f3f46', emissiveColor: '#8b5cf6', emissiveIntensity: 0.9, scale: 1.05, metalness: 0.15, roughness: 0.8, accentColor: '#c4b5fd', ornamentColor: '#52525b' } },
  { species: 'doll', fromStage: 2, toStage: 3, pathName: 'Марионетка', visualDescription: 'Конечности удлиняются, соединённые видимыми нитями судьбы. Семь пуговиц по телу.', hiddenBuff: STAGE3_BUFF, modelConfig: { primaryColor: '#4c1d95', emissiveColor: '#c084fc', emissiveIntensity: 1.3, scale: 1.4, metalness: 0.2, roughness: 0.75, accentColor: '#ddd6fe', ornamentColor: '#7c3aed' } },
  { species: 'doll', fromStage: 2, toStage: 3, pathName: 'Порченая', visualDescription: 'Ткань чернеет, гниёт. Из ран сочатся фиолетовые нити. Глаза — провалы шёпота.', hiddenBuff: STAGE3_BUFF, modelConfig: { primaryColor: '#0a0a0a', emissiveColor: '#7c3aed', emissiveIntensity: 1.7, scale: 1.35, metalness: 0.1, roughness: 0.95, accentColor: '#6d28d9', ornamentColor: '#2e1065' } },
  { species: 'doll', fromStage: 2, toStage: 3, pathName: 'Штопанная', visualDescription: 'Ткань лоскутно сшита, стежки золотом. Глаза — жемчужины. Аура тепла.', hiddenBuff: STAGE3_BUFF, modelConfig: { primaryColor: '#fef3c7', emissiveColor: '#fde047', emissiveIntensity: 0.9, scale: 1.3, metalness: 0.3, roughness: 0.7, accentColor: '#facc15', ornamentColor: '#f59e0b' } },
];

// ===== Achievements (13 total) =====
interface AchievementSeed {
  code: string;
  title: string;
  description: string;
  icon: string;
  tier: string;
  goal: number;
  metric: string;
}

const achievements: AchievementSeed[] = [
  { code: 'first_evolution', title: 'Первая Метаморфоза', description: 'Эволюционируй своего фамильяра впервые', icon: '🥚', tier: 'bronze', goal: 1, metric: 'evolutions' },
  { code: 'playful', title: 'Игривый', description: 'Сыграй в мини-игру 10 раз', icon: '🎮', tier: 'bronze', goal: 10, metric: 'play_count' },
  { code: 'feeder', title: 'Кормилец', description: 'Покорми фамильяра 15 раз', icon: '🍖', tier: 'bronze', goal: 15, metric: 'feed_count' },
  { code: 'affectionate', title: 'Ласковый', description: 'Погладь фамильяра 20 раз', icon: '💗', tier: 'bronze', goal: 20, metric: 'pet_count' },
  { code: 'consistent', title: 'Постоянство', description: 'Активен 3 дня подряд (МСК)', icon: '📅', tier: 'bronze', goal: 3, metric: 'streak_days' },
  { code: 'generous', title: 'Щедрый', description: 'Отправь 3 подарка другим игрокам', icon: '🎁', tier: 'bronze', goal: 3, metric: 'gift_count' },
  { code: 'perfection', title: 'Совершенство', description: 'Достигни 3-й стадии эволюции', icon: '👑', tier: 'gold', goal: 3, metric: 'stage' },
  { code: 'coin_hoarder', title: 'Дракон-Скупец', description: 'Накопи 300 монет', icon: '🐉', tier: 'gold', goal: 300, metric: 'coins' },
  { code: 'adolescent', title: 'Подросток', description: 'Достигни 2-й стадии эволюции', icon: '⭐', tier: 'silver', goal: 2, metric: 'stage' },
  { code: 'treasure_hunter', title: 'Кладоискатель', description: 'Накопи 100 монет', icon: '💰', tier: 'silver', goal: 100, metric: 'coins' },
  { code: 'game_master', title: 'Мастер Игры', description: 'Сыграй в мини-игру 25 раз', icon: '🕹️', tier: 'silver', goal: 25, metric: 'play_count' },
  { code: 'weekly_ritual', title: 'Недельный Ритуал', description: 'Активен 7 дней подряд (МСК)', icon: '🔥', tier: 'silver', goal: 7, metric: 'streak_days' },
  { code: 'patron', title: 'Покровитель', description: 'Отправь 10 подарков другим игрокам', icon: '💝', tier: 'silver', goal: 10, metric: 'gift_count' },
];

async function main() {
  console.log('🌱 Seeding PRODUCTION database...\n');

  // 1. Evolution options (upsert by species+pathName+fromStage)
  console.log('📋 Evolution options...');
  for (const opt of options) {
    await db.evolutionOption.upsert({
      where: { species_fromStage_pathName: { species: opt.species, fromStage: opt.fromStage, pathName: opt.pathName } },
      update: {
        toStage: opt.toStage,
        visualDescription: opt.visualDescription,
        hiddenBuff: opt.hiddenBuff,
        modelConfig: JSON.stringify(opt.modelConfig),
      },
      create: {
        species: opt.species,
        fromStage: opt.fromStage,
        toStage: opt.toStage,
        pathName: opt.pathName,
        visualDescription: opt.visualDescription,
        hiddenBuff: opt.hiddenBuff,
        modelConfig: JSON.stringify(opt.modelConfig),
      },
    });
  }
  console.log(`  ✓ ${options.length} evolution options upserted`);

  // 2. Achievements (upsert by code)
  console.log('🏆 Achievements...');
  for (const a of achievements) {
    await db.achievement.upsert({
      where: { code: a.code },
      update: { title: a.title, description: a.description, icon: a.icon, tier: a.tier, goal: a.goal, metric: a.metric },
      create: a,
    });
  }
  console.log(`  ✓ ${achievements.length} achievements upserted`);

  // 3. DM account (create only if doesn't exist)
  console.log('🛡️  DM account...');
  const dmExists = await db.user.findUnique({ where: { username: DM_USERNAME } });
  if (!dmExists) {
    const passwordHash = bcrypt.hashSync(DM_PASSWORD, 10);
    await db.user.create({
      data: {
        username: DM_USERNAME,
        passwordHash,
        role: 'dm',
        characterName: DM_CHARACTER_NAME,
      },
    });
    console.log(`  ✓ Created DM: ${DM_USERNAME} / ${DM_PASSWORD}`);
    console.log(`  ⚠️  CHANGE THIS PASSWORD after first login!`);
  } else {
    console.log(`  ✓ DM "${DM_USERNAME}" already exists (skipped)`);
  }

  console.log('\n✅ Production seed complete!');
  console.log(`   Login as DM: ${DM_USERNAME} / ${DM_PASSWORD}`);
  console.log('   Players can now self-register at the app.');
}

main()
  .then(() => db.$disconnect())
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    db.$disconnect();
    process.exit(1);
  });
