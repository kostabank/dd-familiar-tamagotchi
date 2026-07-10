-- ============================================================
-- D&D Familiar Tamagotchi — CLEAN reinstall (drop + recreate)
-- Run this in Supabase SQL Editor to FULLY reset the database.
-- ⚠️  WARNING: this DELETES all data (players, familiars, logs).
--      Use only on a fresh/staging DB, or if you want a clean reset.
-- ============================================================

-- Drop all tables (order matters: child tables first)
DROP TABLE IF EXISTS "Gift" CASCADE;
DROP TABLE IF EXISTS "PlayerQuest" CASCADE;
DROP TABLE IF EXISTS "Quest" CASCADE;
DROP TABLE IF EXISTS "PlayerAchievement" CASCADE;
DROP TABLE IF EXISTS "Achievement" CASCADE;
DROP TABLE IF EXISTS "DailyBuffClaim" CASCADE;
DROP TABLE IF EXISTS "InteractionLog" CASCADE;
DROP TABLE IF EXISTS "EvolutionOption" CASCADE;
DROP TABLE IF EXISTS "Familiar" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

-- ============================================================
-- Recreate all tables (clean)
-- ============================================================

CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'player',
    "characterName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

CREATE TABLE "Familiar" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "species" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "stage" INTEGER NOT NULL DEFAULT 1,
    "evolutionPath" TEXT,
    "hiddenBuff" TEXT,
    "energy" INTEGER NOT NULL DEFAULT 80,
    "mood" INTEGER NOT NULL DEFAULT 80,
    "fatigue" INTEGER NOT NULL DEFAULT 0,
    "health" INTEGER NOT NULL DEFAULT 100,
    "sync" INTEGER NOT NULL DEFAULT 0,
    "isSleeping" BOOLEAN NOT NULL DEFAULT false,
    "sleepStartedAt" TIMESTAMP(3),
    "lastTick" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "coins" INTEGER NOT NULL DEFAULT 50,
    "accentColor" TEXT,
    "bio" TEXT,
    "modelConfig" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Familiar_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Familiar_userId_key" ON "Familiar"("userId");
ALTER TABLE "Familiar" ADD CONSTRAINT "Familiar_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;

CREATE TABLE "EvolutionOption" (
    "id" TEXT NOT NULL,
    "species" TEXT NOT NULL,
    "fromStage" INTEGER NOT NULL,
    "toStage" INTEGER NOT NULL,
    "pathName" TEXT NOT NULL,
    "visualDescription" TEXT NOT NULL,
    "hiddenBuff" TEXT NOT NULL,
    "modelConfig" TEXT NOT NULL,
    CONSTRAINT "EvolutionOption_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "EvolutionOption_species_fromStage_pathName_key" ON "EvolutionOption"("species", "fromStage", "pathName");

CREATE TABLE "InteractionLog" (
    "id" TEXT NOT NULL,
    "familiarId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "detail" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InteractionLog_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "InteractionLog" ADD CONSTRAINT "InteractionLog_familiarId_fkey" FOREIGN KEY ("familiarId") REFERENCES "Familiar"("id") ON DELETE CASCADE;
ALTER TABLE "InteractionLog" ADD CONSTRAINT "InteractionLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;

CREATE TABLE "DailyBuffClaim" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastClaimMsk" TEXT NOT NULL,
    "claimCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DailyBuffClaim_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "DailyBuffClaim_userId_key" ON "DailyBuffClaim"("userId");
ALTER TABLE "DailyBuffClaim" ADD CONSTRAINT "DailyBuffClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;

CREATE TABLE "Achievement" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "tier" TEXT NOT NULL DEFAULT 'bronze',
    "goal" INTEGER NOT NULL,
    "metric" TEXT NOT NULL,
    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Achievement_code_key" ON "Achievement"("code");

CREATE TABLE "PlayerAchievement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PlayerAchievement_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PlayerAchievement_userId_achievementId_key" ON "PlayerAchievement"("userId", "achievementId");
ALTER TABLE "PlayerAchievement" ADD CONSTRAINT "PlayerAchievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
ALTER TABLE "PlayerAchievement" ADD CONSTRAINT "PlayerAchievement_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "Achievement"("id") ON DELETE CASCADE;

CREATE TABLE "Quest" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "goal" INTEGER NOT NULL,
    "syncReward" INTEGER NOT NULL DEFAULT 15,
    "coinReward" INTEGER NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Quest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PlayerQuest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PlayerQuest_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PlayerQuest_userId_questId_key" ON "PlayerQuest"("userId", "questId");
ALTER TABLE "PlayerQuest" ADD CONSTRAINT "PlayerQuest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
ALTER TABLE "PlayerQuest" ADD CONSTRAINT "PlayerQuest_questId_fkey" FOREIGN KEY ("questId") REFERENCES "Quest"("id") ON DELETE CASCADE;

CREATE TABLE "Gift" (
    "id" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "giftType" TEXT NOT NULL,
    "coinCost" INTEGER NOT NULL,
    "moodBoost" INTEGER NOT NULL,
    "syncBoost" INTEGER NOT NULL,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Gift_pkey" PRIMARY KEY ("id")
);

-- ============================================================
-- Disable RLS (app uses JWT auth, not Supabase RLS)
-- ============================================================
ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Familiar" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "EvolutionOption" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "InteractionLog" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "DailyBuffClaim" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Achievement" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "PlayerAchievement" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Quest" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "PlayerQuest" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Gift" DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- Seed: DM account (dm / dmdnd123)
-- ============================================================
INSERT INTO "User" ("id", "username", "passwordHash", "role", "characterName", "createdAt", "updatedAt")
VALUES ('dm-0000000000', 'dm', '$2b$10$WGbl.IKHxRI0.YS5f4OkLO8ZqwcBraOh3I.SaUgvyw8k4oPCdUlQW', 'dm', 'Мастер Подземелий', NOW(), NOW());

-- ============================================================
-- Seed: 24 Evolution options
-- ============================================================
INSERT INTO "EvolutionOption" ("id", "species", "fromStage", "toStage", "pathName", "visualDescription", "hiddenBuff", "modelConfig") VALUES
(gen_random_uuid(), 'construct', 1, 2, 'Сентинель', 'Металл темнеет до оружейной стали. Кольца утолщаются в бронепластины, ядро пульсирует рубиновым светом.', '+1d4 к атаке (1 раз в день)', '{"primaryColor":"#3a3f4a","emissiveColor":"#ef4444","emissiveIntensity":1.4,"scale":1.1,"metalness":0.95,"roughness":0.25,"ornamentColor":"#ef4444"}'),
(gen_random_uuid(), 'construct', 1, 2, 'Оракул', 'Полупрозрачный кристалл, ядро — сапфир. Кольца — световые орбиты, созвездия на гранях.', '+1d4 к атаке (1 раз в день)', '{"primaryColor":"#1e293b","emissiveColor":"#38bdf8","emissiveIntensity":1.8,"scale":1.05,"metalness":0.6,"roughness":0.1,"ornamentColor":"#a855f7"}'),
(gen_random_uuid(), 'construct', 1, 2, 'Разведчик', 'Форма вытягивается, грани заостряются. Кольца — лезвия-пропеллеры. Ядро светится изумрудом.', '+1d4 к атаке (1 раз в день)', '{"primaryColor":"#2d3a2d","emissiveColor":"#22c55e","emissiveIntensity":1.2,"scale":0.95,"metalness":0.8,"roughness":0.4,"ornamentColor":"#22c55e"}'),
(gen_random_uuid(), 'construct', 2, 3, 'Архонт', 'Грани умножаются в звезду. Кольца расщепляются на шесть орбит. Ядро — белое пламя, руны золотом.', 'Переброс проваленного спасброска (1 раз в день)', '{"primaryColor":"#fef3c7","emissiveColor":"#fbbf24","emissiveIntensity":2.2,"scale":1.3,"metalness":0.9,"roughness":0.15,"ornamentColor":"#fde68a"}'),
(gen_random_uuid(), 'construct', 2, 3, 'Титан', 'Размер вдвое больше, броня слоями. Ядро — кратер магмы.', 'Переброс проваленного спасброска (1 раз в день)', '{"primaryColor":"#1c1917","emissiveColor":"#f97316","emissiveIntensity":1.9,"scale":1.5,"metalness":0.95,"roughness":0.35,"ornamentColor":"#f97316"}'),
(gen_random_uuid(), 'construct', 2, 3, 'Эфириум', 'Чистый свет, грани призмы. Кольца — потоки данных.', 'Переброс проваленного спасброска (1 раз в день)', '{"primaryColor":"#e0e7ff","emissiveColor":"#818cf8","emissiveIntensity":2.5,"scale":1.2,"metalness":0.3,"roughness":0.05,"ornamentColor":"#c7d2fe"}'),
(gen_random_uuid(), 'dragon', 1, 2, 'Багровый', 'Чешуя багровеет, рог чернеет. Крылья расширяются, мерцают жаром.', '+1d4 к атаке (1 раз в день)', '{"primaryColor":"#991b1b","emissiveColor":"#dc2626","emissiveIntensity":0.8,"scale":1.15,"metalness":0.4,"roughness":0.5,"accentColor":"#fca5a5","ornamentColor":"#450a0a"}'),
(gen_random_uuid(), 'dragon', 1, 2, 'Лазурный', 'Окрас индиго, иней на хребте. Крылья как лёд.', '+1d4 к атаке (1 раз в день)', '{"primaryColor":"#1e3a8a","emissiveColor":"#60a5fa","emissiveIntensity":1.0,"scale":1.1,"metalness":0.3,"roughness":0.2,"accentColor":"#dbeafe","ornamentColor":"#bfdbfe"}'),
(gen_random_uuid(), 'dragon', 1, 2, 'Изумрудный', 'Чешуя малахит, рог зазубрен. Хвост с шипом.', '+1d4 к атаке (1 раз в день)', '{"primaryColor":"#166534","emissiveColor":"#22c55e","emissiveIntensity":0.9,"scale":1.1,"metalness":0.4,"roughness":0.55,"accentColor":"#86efac","ornamentColor":"#14532d"}'),
(gen_random_uuid(), 'dragon', 2, 3, 'Древний', 'Огромные крылья, руны возраста. Рога ветвятся, гребень из кристаллов.', 'Переброс проваленного спасброска (1 раз в день)', '{"primaryColor":"#581c87","emissiveColor":"#c084fc","emissiveIntensity":1.3,"scale":1.45,"metalness":0.5,"roughness":0.45,"accentColor":"#e9d5ff","ornamentColor":"#7e22ce"}'),
(gen_random_uuid(), 'dragon', 2, 3, 'Виверн-Лорд', 'Хищное тело, крылья-лезвия. Хвост — ядовитое жало.', 'Переброс проваленного спасброска (1 раз в день)', '{"primaryColor":"#0f766e","emissiveColor":"#2dd4bf","emissiveIntensity":1.1,"scale":1.35,"metalness":0.45,"roughness":0.4,"accentColor":"#99f6e4","ornamentColor":"#134e4a"}'),
(gen_random_uuid(), 'dragon', 2, 3, 'Теневой', 'Дымчатая полупрозрачность, контуры размываются. Глаза — угольки.', 'Переброс проваленного спасброска (1 раз в день)', '{"primaryColor":"#18181b","emissiveColor":"#a855f7","emissiveIntensity":1.6,"scale":1.3,"metalness":0.2,"roughness":0.7,"accentColor":"#7c3aed","ornamentColor":"#3f3f46"}'),
(gen_random_uuid(), 'magpie', 1, 2, 'Вещун', 'Оперение смоляное, серебряный знак на груди. Клюв удлинён.', '+1d4 к атаке (1 раз в день)', '{"primaryColor":"#0a0a0a","emissiveColor":"#94a3b8","emissiveIntensity":0.5,"scale":1.1,"metalness":0.6,"roughness":0.3,"accentColor":"#e2e8f0","ornamentColor":"#cbd5e1"}'),
(gen_random_uuid(), 'magpie', 1, 2, 'Крадущийся', 'Серые перья сумерек, ухмылка. Хвост распушён.', '+1d4 к атаке (1 раз в день)', '{"primaryColor":"#374151","emissiveColor":"#6b7280","emissiveIntensity":0.4,"scale":1.0,"metalness":0.3,"roughness":0.6,"accentColor":"#9ca3af","ornamentColor":"#1f2937"}'),
(gen_random_uuid(), 'magpie', 1, 2, 'Говорящий', 'Белая грудь, хохолок ярких перьев. Клюв золотится.', '+1d4 к атаке (1 раз в день)', '{"primaryColor":"#111827","emissiveColor":"#fbbf24","emissiveIntensity":0.7,"scale":1.05,"metalness":0.5,"roughness":0.4,"accentColor":"#fef3c7","ornamentColor":"#f59e0b"}'),
(gen_random_uuid(), 'magpie', 2, 3, 'Ворон-Пророк', 'Крылья втрое больше, иссиня-чёрный. Третий глаз — сапфир.', 'Переброс проваленного спасброска (1 раз в день)', '{"primaryColor":"#0c0a09","emissiveColor":"#3b82f6","emissiveIntensity":1.2,"scale":1.4,"metalness":0.7,"roughness":0.25,"accentColor":"#93c5fd","ornamentColor":"#1d4ed8"}'),
(gen_random_uuid(), 'magpie', 2, 3, 'Буревестник', 'Перья наэлектризованы, искры. Клюв — молния.', 'Переброс проваленного спасброска (1 раз в день)', '{"primaryColor":"#1e1b4b","emissiveColor":"#facc15","emissiveIntensity":1.5,"scale":1.35,"metalness":0.5,"roughness":0.3,"accentColor":"#fef9c3","ornamentColor":"#a855f7"}'),
(gen_random_uuid(), 'magpie', 2, 3, 'Серебряный', 'Зеркально-серебряное оперение. Клюв — полированное серебро.', 'Переброс проваленного спасброска (1 раз в день)', '{"primaryColor":"#e5e7eb","emissiveColor":"#f8fafc","emissiveIntensity":0.8,"scale":1.3,"metalness":0.95,"roughness":0.05,"accentColor":"#ffffff","ornamentColor":"#cbd5e1"}'),
(gen_random_uuid(), 'doll', 1, 2, 'Хранитель', 'Ткань с вышивкой, медные глаза. Нитяные когти.', '+1d4 к атаке (1 раз в день)', '{"primaryColor":"#7f1d1d","emissiveColor":"#b45309","emissiveIntensity":0.5,"scale":1.1,"metalness":0.2,"roughness":0.85,"accentColor":"#fbbf24","ornamentColor":"#92400e"}'),
(gen_random_uuid(), 'doll', 1, 2, 'Мститель', 'Ткань рвётся, сухожилия. Глаза трескаются, краснеют.', '+1d4 к атаке (1 раз в день)', '{"primaryColor":"#450a0a","emissiveColor":"#dc2626","emissiveIntensity":1.0,"scale":1.1,"metalness":0.1,"roughness":0.9,"accentColor":"#7f1d1d","ornamentColor":"#991b1b"}'),
(gen_random_uuid(), 'doll', 1, 2, 'Шептун', 'Серая полупрозрачная ткань. Нити-зубы, тени из швов.', '+1d4 к атаке (1 раз в день)', '{"primaryColor":"#3f3f46","emissiveColor":"#8b5cf6","emissiveIntensity":0.9,"scale":1.05,"metalness":0.15,"roughness":0.8,"accentColor":"#c4b5fd","ornamentColor":"#52525b"}'),
(gen_random_uuid(), 'doll', 2, 3, 'Марионетка', 'Конечности на нитях судьбы. Семь пуговиц по телу.', 'Переброс проваленного спасброска (1 раз в день)', '{"primaryColor":"#4c1d95","emissiveColor":"#c084fc","emissiveIntensity":1.3,"scale":1.4,"metalness":0.2,"roughness":0.75,"accentColor":"#ddd6fe","ornamentColor":"#7c3aed"}'),
(gen_random_uuid(), 'doll', 2, 3, 'Порченая', 'Чёрная гниющая ткань. Фиолетовые нити из ран. Глаза — шёпот.', 'Переброс проваленного спасброска (1 раз в день)', '{"primaryColor":"#0a0a0a","emissiveColor":"#7c3aed","emissiveIntensity":1.7,"scale":1.35,"metalness":0.1,"roughness":0.95,"accentColor":"#6d28d9","ornamentColor":"#2e1065"}'),
(gen_random_uuid(), 'doll', 2, 3, 'Штопанная', 'Лоскутная ткань, золотые стежки. Жемчужные глаза. Аура тепла.', 'Переброс проваленного спасброска (1 раз в день)', '{"primaryColor":"#fef3c7","emissiveColor":"#fde047","emissiveIntensity":0.9,"scale":1.3,"metalness":0.3,"roughness":0.7,"accentColor":"#facc15","ornamentColor":"#f59e0b"}');

-- ============================================================
-- Seed: 13 Achievements
-- ============================================================
INSERT INTO "Achievement" ("id", "code", "title", "description", "icon", "tier", "goal", "metric") VALUES
(gen_random_uuid(), 'first_evolution', 'Первая Метаморфоза', 'Эволюционируй своего фамильяра впервые', '🥚', 'bronze', 1, 'evolutions'),
(gen_random_uuid(), 'playful', 'Игривый', 'Сыграй в мини-игру 10 раз', '🎮', 'bronze', 10, 'play_count'),
(gen_random_uuid(), 'feeder', 'Кормилец', 'Покорми фамильяра 15 раз', '🍖', 'bronze', 15, 'feed_count'),
(gen_random_uuid(), 'affectionate', 'Ласковый', 'Погладь фамильяра 20 раз', '💗', 'bronze', 20, 'pet_count'),
(gen_random_uuid(), 'consistent', 'Постоянство', 'Активен 3 дня подряд (МСК)', '📅', 'bronze', 3, 'streak_days'),
(gen_random_uuid(), 'generous', 'Щедрый', 'Отправь 3 подарка другим игрокам', '🎁', 'bronze', 3, 'gift_count'),
(gen_random_uuid(), 'perfection', 'Совершенство', 'Достигни 3-й стадии эволюции', '👑', 'gold', 3, 'stage'),
(gen_random_uuid(), 'coin_hoarder', 'Дракон-Скупец', 'Накопи 300 монет', '🐉', 'gold', 300, 'coins'),
(gen_random_uuid(), 'adolescent', 'Подросток', 'Достигни 2-й стадии эволюции', '⭐', 'silver', 2, 'stage'),
(gen_random_uuid(), 'treasure_hunter', 'Кладоискатель', 'Накопи 100 монет', '💰', 'silver', 100, 'coins'),
(gen_random_uuid(), 'game_master', 'Мастер Игры', 'Сыграй в мини-игру 25 раз', '🕹️', 'silver', 25, 'play_count'),
(gen_random_uuid(), 'weekly_ritual', 'Недельный Ритуал', 'Активен 7 дней подряд (МСК)', '🔥', 'silver', 7, 'streak_days'),
(gen_random_uuid(), 'patron', 'Покровитель', 'Отправь 10 подарков другим игрокам', '💝', 'silver', 10, 'gift_count');

-- ============================================================
-- DONE. Login as DM: dm / dmdnd123
-- ============================================================
