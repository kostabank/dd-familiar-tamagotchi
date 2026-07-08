-- Seed data for D&D Familiar Tamagotchi
-- Run this in Supabase SQL Editor AFTER supabase-schema.sql

-- DM account (dm / dmdnd123)
INSERT INTO "User" ("id", "username", "passwordHash", "role", "characterName", "createdAt", "updatedAt")
VALUES ('dm-user-id', 'dm', '$2b$10$8XsymqiYbfbUJkLQ9vg6duPx3bf6NGkeY0gD0T77N5K6PK5cqKPUW', 'dm', 'Мастер Подземелий', NOW(), NOW())
ON CONFLICT ("username") DO NOTHING;

-- Evolution options (24)
INSERT INTO "EvolutionOption" ("id", "species", "fromStage", "toStage", "pathName", "visualDescription", "hiddenBuff", "modelConfig")
VALUES (gen_random_uuid(), 'construct', 1, 2, 'Сентинель', 'Металл темнеет до оружейной стали. Кольца утолщаются в бронепластины, ядро пульсирует рубиновым светом. На гранях проступают руны щита.', '+1d4 к атаке (1 раз в день)', '{"primaryColor":"#3a3f4a","emissiveColor":"#ef4444","emissiveIntensity":1.4,"scale":1.1,"metalness":0.95,"roughness":0.25,"ornamentColor":"#ef4444"}');
INSERT INTO "EvolutionOption" ("id", "species", "fromStage", "toStage", "pathName", "visualDescription", "hiddenBuff", "modelConfig")
VALUES (gen_random_uuid(), 'construct', 1, 2, 'Оракул', 'Поверхность становится полупрозрачным кристаллом, ядро — сияющим сапфиром. Кольца превращаются в тонкие световые орбиты, на гранях мерцают созвездия.', '+1d4 к атаке (1 раз в день)', '{"primaryColor":"#1e293b","emissiveColor":"#38bdf8","emissiveIntensity":1.8,"scale":1.05,"metalness":0.6,"roughness":0.1,"ornamentColor":"#a855f7"}');
INSERT INTO "EvolutionOption" ("id", "species", "fromStage", "toStage", "pathName", "visualDescription", "hiddenBuff", "modelConfig")
VALUES (gen_random_uuid(), 'construct', 1, 2, 'Разведчик', 'Форма вытягивается, грани заостряются. Кольца превращаются в лезвия-пропеллеры. Ядро светится изумрудом, металл приобретает матовый хаки.', '+1d4 к атаке (1 раз в день)', '{"primaryColor":"#2d3a2d","emissiveColor":"#22c55e","emissiveIntensity":1.2,"scale":0.95,"metalness":0.8,"roughness":0.4,"ornamentColor":"#22c55e"}');
INSERT INTO "EvolutionOption" ("id", "species", "fromStage", "toStage", "pathName", "visualDescription", "hiddenBuff", "modelConfig")
VALUES (gen_random_uuid(), 'construct', 2, 3, 'Архонт', 'Грани умножаются, формируя сложный многогранник-звезду. Кольца расщепляются на шесть орбит. Ядро вспыхивает белым пламенем, руны горят золотом.', 'Переброс проваленного спасброска (1 раз в день)', '{"primaryColor":"#fef3c7","emissiveColor":"#fbbf24","emissiveIntensity":2.2,"scale":1.3,"metalness":0.9,"roughness":0.15,"ornamentColor":"#fde68a"}');
INSERT INTO "EvolutionOption" ("id", "species", "fromStage", "toStage", "pathName", "visualDescription", "hiddenBuff", "modelConfig")
VALUES (gen_random_uuid(), 'construct', 2, 3, 'Титан', 'Размер увеличивается вдвое, броня наращивается слоями. Кольца сливаются в защитный купол. Ядро становится пульсирующим кратером магмы.', 'Переброс проваленного спасброска (1 раз в день)', '{"primaryColor":"#1c1917","emissiveColor":"#f97316","emissiveIntensity":1.9,"scale":1.5,"metalness":0.95,"roughness":0.35,"ornamentColor":"#f97316"}');
INSERT INTO "EvolutionOption" ("id", "species", "fromStage", "toStage", "pathName", "visualDescription", "hiddenBuff", "modelConfig")
VALUES (gen_random_uuid(), 'construct', 2, 3, 'Эфириум', 'Материал теряет плотность, становясь чистым светом. Грани — теперь грани призмы, преломляющие реальность. Кольца — потоки данных.', 'Переброс проваленного спасброска (1 раз в день)', '{"primaryColor":"#e0e7ff","emissiveColor":"#818cf8","emissiveIntensity":2.5,"scale":1.2,"metalness":0.3,"roughness":0.05,"ornamentColor":"#c7d2fe"}');
INSERT INTO "EvolutionOption" ("id", "species", "fromStage", "toStage", "pathName", "visualDescription", "hiddenBuff", "modelConfig")
VALUES (gen_random_uuid(), 'dragon', 1, 2, 'Багровый', 'Чешуя наливается багрянцем, рог удлиняется и чернеет. Крылья расширяются, мерцая жаром. Хвост утолщается, на кончике — шип.', '+1d4 к атаке (1 раз в день)', '{"primaryColor":"#991b1b","emissiveColor":"#dc2626","emissiveIntensity":0.8,"scale":1.15,"metalness":0.4,"roughness":0.5,"accentColor":"#fca5a5","ornamentColor":"#450a0a"}');
INSERT INTO "EvolutionOption" ("id", "species", "fromStage", "toStage", "pathName", "visualDescription", "hiddenBuff", "modelConfig")
VALUES (gen_random_uuid(), 'dragon', 1, 2, 'Лазурный', 'Окрас холодеет до глубокого индиго, по хребту проступает иней. Крылья полупрозрачны, как лёд. Рог покрывается кристаллами мороза.', '+1d4 к атаке (1 раз в день)', '{"primaryColor":"#1e3a8a","emissiveColor":"#60a5fa","emissiveIntensity":1,"scale":1.1,"metalness":0.3,"roughness":0.2,"accentColor":"#dbeafe","ornamentColor":"#bfdbfe"}');
INSERT INTO "EvolutionOption" ("id", "species", "fromStage", "toStage", "pathName", "visualDescription", "hiddenBuff", "modelConfig")
VALUES (gen_random_uuid(), 'dragon', 1, 2, 'Изумрудный', 'Чешуя зеленеет ядовитым малахитом, по бокам проступают пятна. Рог становится зазубренным. Хвост удлиняется, мерцая слизью.', '+1d4 к атаке (1 раз в день)', '{"primaryColor":"#166534","emissiveColor":"#22c55e","emissiveIntensity":0.9,"scale":1.1,"metalness":0.4,"roughness":0.55,"accentColor":"#86efac","ornamentColor":"#14532d"}');
INSERT INTO "EvolutionOption" ("id", "species", "fromStage", "toStage", "pathName", "visualDescription", "hiddenBuff", "modelConfig")
VALUES (gen_random_uuid(), 'dragon', 2, 3, 'Древний', 'Размах крыльев становится огромным, чешуя покрывается рунами возраста. Рога ветвятся. Хребет венчает гребень из кристаллов.', 'Переброс проваленного спасброска (1 раз в день)', '{"primaryColor":"#581c87","emissiveColor":"#c084fc","emissiveIntensity":1.3,"scale":1.45,"metalness":0.5,"roughness":0.45,"accentColor":"#e9d5ff","ornamentColor":"#7e22ce"}');
INSERT INTO "EvolutionOption" ("id", "species", "fromStage", "toStage", "pathName", "visualDescription", "hiddenBuff", "modelConfig")
VALUES (gen_random_uuid(), 'dragon', 2, 3, 'Виверн-Лорд', 'Тело вытягивается, становясь хищным. Крылья рвутся на перепонки-лезвия. Хвост оканчивается ядовитым жалом.', 'Переброс проваленного спасброска (1 раз в день)', '{"primaryColor":"#0f766e","emissiveColor":"#2dd4bf","emissiveIntensity":1.1,"scale":1.35,"metalness":0.45,"roughness":0.4,"accentColor":"#99f6e4","ornamentColor":"#134e4a"}');
INSERT INTO "EvolutionOption" ("id", "species", "fromStage", "toStage", "pathName", "visualDescription", "hiddenBuff", "modelConfig")
VALUES (gen_random_uuid(), 'dragon', 2, 3, 'Теневой', 'Чешуя становится дымчатой полупрозрачностью, контуры размываются. Глаза — два уголька. Крылья поглощают свет вокруг.', 'Переброс проваленного спасброска (1 раз в день)', '{"primaryColor":"#18181b","emissiveColor":"#a855f7","emissiveIntensity":1.6,"scale":1.3,"metalness":0.2,"roughness":0.7,"accentColor":"#7c3aed","ornamentColor":"#3f3f46"}');
INSERT INTO "EvolutionOption" ("id", "species", "fromStage", "toStage", "pathName", "visualDescription", "hiddenBuff", "modelConfig")
VALUES (gen_random_uuid(), 'magpie', 1, 2, 'Вещун', 'Оперение темнеет до смоляного, на груди проступает серебряный знак. Клюв удлиняется, хвост распадается на ленты с рунами.', '+1d4 к атаке (1 раз в день)', '{"primaryColor":"#0a0a0a","emissiveColor":"#94a3b8","emissiveIntensity":0.5,"scale":1.1,"metalness":0.6,"roughness":0.3,"accentColor":"#e2e8f0","ornamentColor":"#cbd5e1"}');
INSERT INTO "EvolutionOption" ("id", "species", "fromStage", "toStage", "pathName", "visualDescription", "hiddenBuff", "modelConfig")
VALUES (gen_random_uuid(), 'magpie', 1, 2, 'Крадущийся', 'Перья становятся серыми, как сумерки, контуры размываются. Клюв кривится в ухмылке. Хвост распушён для баланса.', '+1d4 к атаке (1 раз в день)', '{"primaryColor":"#374151","emissiveColor":"#6b7280","emissiveIntensity":0.4,"scale":1,"metalness":0.3,"roughness":0.6,"accentColor":"#9ca3af","ornamentColor":"#1f2937"}');
INSERT INTO "EvolutionOption" ("id", "species", "fromStage", "toStage", "pathName", "visualDescription", "hiddenBuff", "modelConfig")
VALUES (gen_random_uuid(), 'magpie', 1, 2, 'Говорящий', 'Грудь белеет, на голове — хохолок из ярких перьев. Клюв золотится. Хвост распускается веером.', '+1d4 к атаке (1 раз в день)', '{"primaryColor":"#111827","emissiveColor":"#fbbf24","emissiveIntensity":0.7,"scale":1.05,"metalness":0.5,"roughness":0.4,"accentColor":"#fef3c7","ornamentColor":"#f59e0b"}');
INSERT INTO "EvolutionOption" ("id", "species", "fromStage", "toStage", "pathName", "visualDescription", "hiddenBuff", "modelConfig")
VALUES (gen_random_uuid(), 'magpie', 2, 3, 'Ворон-Пророк', 'Размах крыльев увеличивается втрое, оперение становится иссиня-чёрным. На груди — третий глаз из сапфира. Хвост — длинные ленты судьбы.', 'Переброс проваленного спасброска (1 раз в день)', '{"primaryColor":"#0c0a09","emissiveColor":"#3b82f6","emissiveIntensity":1.2,"scale":1.4,"metalness":0.7,"roughness":0.25,"accentColor":"#93c5fd","ornamentColor":"#1d4ed8"}');
INSERT INTO "EvolutionOption" ("id", "species", "fromStage", "toStage", "pathName", "visualDescription", "hiddenBuff", "modelConfig")
VALUES (gen_random_uuid(), 'magpie', 2, 3, 'Буревестник', 'Перья наэлектризованы, между ними проскакивают искры. Клюв — молния. Хвост — растрёпанный шторм.', 'Переброс проваленного спасброска (1 раз в день)', '{"primaryColor":"#1e1b4b","emissiveColor":"#facc15","emissiveIntensity":1.5,"scale":1.35,"metalness":0.5,"roughness":0.3,"accentColor":"#fef9c3","ornamentColor":"#a855f7"}');
INSERT INTO "EvolutionOption" ("id", "species", "fromStage", "toStage", "pathName", "visualDescription", "hiddenBuff", "modelConfig")
VALUES (gen_random_uuid(), 'magpie', 2, 3, 'Серебряный', 'Оперение становится зеркально-серебряным, отражает мир. Клюв — полированное серебро. Хвост — струящийся металл.', 'Переброс проваленного спасброска (1 раз в день)', '{"primaryColor":"#e5e7eb","emissiveColor":"#f8fafc","emissiveIntensity":0.8,"scale":1.3,"metalness":0.95,"roughness":0.05,"accentColor":"#ffffff","ornamentColor":"#cbd5e1"}');
INSERT INTO "EvolutionOption" ("id", "species", "fromStage", "toStage", "pathName", "visualDescription", "hiddenBuff", "modelConfig")
VALUES (gen_random_uuid(), 'doll', 1, 2, 'Хранитель', 'Ткань уплотняется, покрываясь защитной вышивкой. Пуговичные глаза становятся медными. На руках — нитяные когти.', '+1d4 к атаке (1 раз в день)', '{"primaryColor":"#7f1d1d","emissiveColor":"#b45309","emissiveIntensity":0.5,"scale":1.1,"metalness":0.2,"roughness":0.85,"accentColor":"#fbbf24","ornamentColor":"#92400e"}');
INSERT INTO "EvolutionOption" ("id", "species", "fromStage", "toStage", "pathName", "visualDescription", "hiddenBuff", "modelConfig")
VALUES (gen_random_uuid(), 'doll', 1, 2, 'Мститель', 'Ткань рвётся, обнажая нитяные сухожилия. Глаза-пуговицы трескаются, светя красным. Стежки становятся шрамами-рунами.', '+1d4 к атаке (1 раз в день)', '{"primaryColor":"#450a0a","emissiveColor":"#dc2626","emissiveIntensity":1,"scale":1.1,"metalness":0.1,"roughness":0.9,"accentColor":"#7f1d1d","ornamentColor":"#991b1b"}');
INSERT INTO "EvolutionOption" ("id", "species", "fromStage", "toStage", "pathName", "visualDescription", "hiddenBuff", "modelConfig")
VALUES (gen_random_uuid(), 'doll', 1, 2, 'Шептун', 'Ткань сереет, становится полупрозрачной. Рот расшивается нитями-зубами. Из швов сочатся тени.', '+1d4 к атаке (1 раз в день)', '{"primaryColor":"#3f3f46","emissiveColor":"#8b5cf6","emissiveIntensity":0.9,"scale":1.05,"metalness":0.15,"roughness":0.8,"accentColor":"#c4b5fd","ornamentColor":"#52525b"}');
INSERT INTO "EvolutionOption" ("id", "species", "fromStage", "toStage", "pathName", "visualDescription", "hiddenBuff", "modelConfig")
VALUES (gen_random_uuid(), 'doll', 2, 3, 'Марионетка', 'Конечности удлиняются, соединённые видимыми нитями судьбы. Ткань покрывается знаками. Глаза — семь пуговиц по телу.', 'Переброс проваленного спасброска (1 раз в день)', '{"primaryColor":"#4c1d95","emissiveColor":"#c084fc","emissiveIntensity":1.3,"scale":1.4,"metalness":0.2,"roughness":0.75,"accentColor":"#ddd6fe","ornamentColor":"#7c3aed"}');
INSERT INTO "EvolutionOption" ("id", "species", "fromStage", "toStage", "pathName", "visualDescription", "hiddenBuff", "modelConfig")
VALUES (gen_random_uuid(), 'doll', 2, 3, 'Порченая', 'Ткань чернеет, гниёт местами. Из рваных ран сочатся фиолетовые нити. Глаза — провалы, полные шёпота.', 'Переброс проваленного спасброска (1 раз в день)', '{"primaryColor":"#0a0a0a","emissiveColor":"#7c3aed","emissiveIntensity":1.7,"scale":1.35,"metalness":0.1,"roughness":0.95,"accentColor":"#6d28d9","ornamentColor":"#2e1065"}');
INSERT INTO "EvolutionOption" ("id", "species", "fromStage", "toStage", "pathName", "visualDescription", "hiddenBuff", "modelConfig")
VALUES (gen_random_uuid(), 'doll', 2, 3, 'Штопанная', 'Ткань лоскутно сшита из множества цветов, стежки золотом. Глаза — две жемчужины. Аура тепла и исцеления.', 'Переброс проваленного спасброска (1 раз в день)', '{"primaryColor":"#fef3c7","emissiveColor":"#fde047","emissiveIntensity":0.9,"scale":1.3,"metalness":0.3,"roughness":0.7,"accentColor":"#facc15","ornamentColor":"#f59e0b"}');

-- Achievements (13)
INSERT INTO "Achievement" ("id", "code", "title", "description", "icon", "tier", "goal", "metric")
VALUES (gen_random_uuid(), 'first_evolution', 'Первая Метаморфоза', 'Эволюционируй своего фамильяра впервые', '🥚', 'bronze', 1, 'evolutions')
ON CONFLICT ("code") DO NOTHING;
INSERT INTO "Achievement" ("id", "code", "title", "description", "icon", "tier", "goal", "metric")
VALUES (gen_random_uuid(), 'stage_3', 'Совершенство', 'Достигни 3-й стадии эволюции', '👑', 'gold', 3, 'stage')
ON CONFLICT ("code") DO NOTHING;
INSERT INTO "Achievement" ("id", "code", "title", "description", "icon", "tier", "goal", "metric")
VALUES (gen_random_uuid(), 'stage_2', 'Подросток', 'Достигни 2-й стадии эволюции', '⭐', 'silver', 2, 'stage')
ON CONFLICT ("code") DO NOTHING;
INSERT INTO "Achievement" ("id", "code", "title", "description", "icon", "tier", "goal", "metric")
VALUES (gen_random_uuid(), 'coin_hoarder', 'Кладоискатель', 'Накопи 100 монет', '💰', 'silver', 100, 'coins')
ON CONFLICT ("code") DO NOTHING;
INSERT INTO "Achievement" ("id", "code", "title", "description", "icon", "tier", "goal", "metric")
VALUES (gen_random_uuid(), 'coin_rich', 'Дракон-Скупец', 'Накопи 300 монет', '🐉', 'gold', 300, 'coins')
ON CONFLICT ("code") DO NOTHING;
INSERT INTO "Achievement" ("id", "code", "title", "description", "icon", "tier", "goal", "metric")
VALUES (gen_random_uuid(), 'playful', 'Игривый', 'Сыграй в мини-игру 10 раз', '🎮', 'bronze', 10, 'play_count')
ON CONFLICT ("code") DO NOTHING;
INSERT INTO "Achievement" ("id", "code", "title", "description", "icon", "tier", "goal", "metric")
VALUES (gen_random_uuid(), 'play_master', 'Мастер Игры', 'Сыграй в мини-игру 25 раз', '🕹️', 'silver', 25, 'play_count')
ON CONFLICT ("code") DO NOTHING;
INSERT INTO "Achievement" ("id", "code", "title", "description", "icon", "tier", "goal", "metric")
VALUES (gen_random_uuid(), 'feeder', 'Кормилец', 'Покорми фамильяра 15 раз', '🍎', 'bronze', 15, 'feed_count')
ON CONFLICT ("code") DO NOTHING;
INSERT INTO "Achievement" ("id", "code", "title", "description", "icon", "tier", "goal", "metric")
VALUES (gen_random_uuid(), 'pet_lover', 'Ласковый', 'Погладь фамильяра 20 раз', '💗', 'bronze', 20, 'pet_count')
ON CONFLICT ("code") DO NOTHING;
INSERT INTO "Achievement" ("id", "code", "title", "description", "icon", "tier", "goal", "metric")
VALUES (gen_random_uuid(), 'streak_3', 'Постоянство', 'Активен 3 дня подряд (МСК)', '🔥', 'bronze', 3, 'streak_days')
ON CONFLICT ("code") DO NOTHING;
INSERT INTO "Achievement" ("id", "code", "title", "description", "icon", "tier", "goal", "metric")
VALUES (gen_random_uuid(), 'streak_7', 'Недельный Ритуал', 'Активен 7 дней подряд (МСК)', '⚡', 'silver', 7, 'streak_days')
ON CONFLICT ("code") DO NOTHING;
INSERT INTO "Achievement" ("id", "code", "title", "description", "icon", "tier", "goal", "metric")
VALUES (gen_random_uuid(), 'generous', 'Щедрый', 'Отправь 3 подарка другим игрокам', '🎁', 'bronze', 3, 'gift_count')
ON CONFLICT ("code") DO NOTHING;
INSERT INTO "Achievement" ("id", "code", "title", "description", "icon", "tier", "goal", "metric")
VALUES (gen_random_uuid(), 'patron', 'Покровитель', 'Отправь 10 подарков другим игрокам', '💝', 'silver', 10, 'gift_count')
ON CONFLICT ("code") DO NOTHING;

