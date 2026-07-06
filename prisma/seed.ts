// Seed evolution options for all 4 species (construct/dragon/magpie/doll),
// 3 paths for stage 1->2 and 3 paths for stage 2->3 each = 24 options total.
import { db } from '../src/lib/db';

interface SeedOption {
  species: string;
  fromStage: number;
  toStage: number;
  pathName: string;
  visualDescription: string;
  hiddenBuff: string;
  modelConfig: object;
}

const STAGE1_BUFF = '+1 к проверке Истории (1 раз в день)';
const STAGE2_BUFF = '+1d4 к атаке (1 раз в день)';
const STAGE3_BUFF = 'Переброс проваленного спасброска (1 раз в день)';

const options: SeedOption[] = [
  // ===== CONSTRUCT =====
  {
    species: 'construct',
    fromStage: 1,
    toStage: 2,
    pathName: 'Сентинель',
    visualDescription: 'Металл темнеет до оружейной стали. Кольца утолщаются в бронепластины, ядро пульсирует рубиновым светом. На гранях проступают руны щита.',
    hiddenBuff: STAGE2_BUFF,
    modelConfig: { primaryColor: '#3a3f4a', emissiveColor: '#ef4444', emissiveIntensity: 1.4, scale: 1.1, metalness: 0.95, roughness: 0.25, ornamentColor: '#ef4444' },
  },
  {
    species: 'construct',
    fromStage: 1,
    toStage: 2,
    pathName: 'Оракул',
    visualDescription: 'Поверхность становится полупрозрачным кристаллом, ядро — сияющим сапфиром. Кольца превращаются в тонкие световые орбиты, на гранях мерцают созвездия.',
    hiddenBuff: STAGE2_BUFF,
    modelConfig: { primaryColor: '#1e293b', emissiveColor: '#38bdf8', emissiveIntensity: 1.8, scale: 1.05, metalness: 0.6, roughness: 0.1, ornamentColor: '#a855f7' },
  },
  {
    species: 'construct',
    fromStage: 1,
    toStage: 2,
    pathName: 'Разведчик',
    visualDescription: 'Форма вытягивается, грани заостряются. Кольца превращаются в лезвия-пропеллеры. Ядро светится изумрудом, металл приобретает матовый хаки.',
    hiddenBuff: STAGE2_BUFF,
    modelConfig: { primaryColor: '#2d3a2d', emissiveColor: '#22c55e', emissiveIntensity: 1.2, scale: 0.95, metalness: 0.8, roughness: 0.4, ornamentColor: '#22c55e' },
  },
  {
    species: 'construct',
    fromStage: 2,
    toStage: 3,
    pathName: 'Архонт',
    visualDescription: 'Грани умножаются, формируя сложный многогранник-звезду. Кольца расщепляются на шесть орбит. Ядро вспыхивает белым пламенем, руны горят золотом.',
    hiddenBuff: STAGE3_BUFF,
    modelConfig: { primaryColor: '#fef3c7', emissiveColor: '#fbbf24', emissiveIntensity: 2.2, scale: 1.3, metalness: 0.9, roughness: 0.15, ornamentColor: '#fde68a' },
  },
  {
    species: 'construct',
    fromStage: 2,
    toStage: 3,
    pathName: 'Титан',
    visualDescription: 'Размер увеличивается вдвое, броня наращивается слоями. Кольца сливаются в защитный купол. Ядро становится пульсирующим кратером магмы.',
    hiddenBuff: STAGE3_BUFF,
    modelConfig: { primaryColor: '#1c1917', emissiveColor: '#f97316', emissiveIntensity: 1.9, scale: 1.5, metalness: 0.95, roughness: 0.35, ornamentColor: '#f97316' },
  },
  {
    species: 'construct',
    fromStage: 2,
    toStage: 3,
    pathName: 'Эфириум',
    visualDescription: 'Материал теряет плотность, становясь чистым светом. Грани — теперь грани призмы, преломляющие реальность. Кольца — потоки данных.',
    hiddenBuff: STAGE3_BUFF,
    modelConfig: { primaryColor: '#e0e7ff', emissiveColor: '#818cf8', emissiveIntensity: 2.5, scale: 1.2, metalness: 0.3, roughness: 0.05, ornamentColor: '#c7d2fe' },
  },

  // ===== DRAGON =====
  {
    species: 'dragon',
    fromStage: 1,
    toStage: 2,
    pathName: 'Багровый',
    visualDescription: 'Чешуя наливается багрянцем, рог удлиняется и чернеет. Крылья расширяются, мерцая жаром. Хвост утолщается, на кончике — шип.',
    hiddenBuff: STAGE2_BUFF,
    modelConfig: { primaryColor: '#991b1b', emissiveColor: '#dc2626', emissiveIntensity: 0.8, scale: 1.15, metalness: 0.4, roughness: 0.5, accentColor: '#fca5a5', ornamentColor: '#450a0a' },
  },
  {
    species: 'dragon',
    fromStage: 1,
    toStage: 2,
    pathName: 'Лазурный',
    visualDescription: 'Окрас холодеет до глубокого индиго, по хребту проступает иней. Крылья полупрозрачны, как лёд. Рог покрывается кристаллами мороза.',
    hiddenBuff: STAGE2_BUFF,
    modelConfig: { primaryColor: '#1e3a8a', emissiveColor: '#60a5fa', emissiveIntensity: 1.0, scale: 1.1, metalness: 0.3, roughness: 0.2, accentColor: '#dbeafe', ornamentColor: '#bfdbfe' },
  },
  {
    species: 'dragon',
    fromStage: 1,
    toStage: 2,
    pathName: 'Изумрудный',
    visualDescription: 'Чешуя зеленеёт ядовитым малахитом, по бокам проступают пятна. Рог становится зазубренным. Хвост удлиняется, мерцая слизью.',
    hiddenBuff: STAGE2_BUFF,
    modelConfig: { primaryColor: '#166534', emissiveColor: '#22c55e', emissiveIntensity: 0.9, scale: 1.1, metalness: 0.4, roughness: 0.55, accentColor: '#86efac', ornamentColor: '#14532d' },
  },
  {
    species: 'dragon',
    fromStage: 2,
    toStage: 3,
    pathName: 'Древний',
    visualDescription: 'Размах крыльев становится огромным, чешуя покрывается рунами возраста. Рога ветвятся. Хребет венчает гребень из кристаллов.',
    hiddenBuff: STAGE3_BUFF,
    modelConfig: { primaryColor: '#581c87', emissiveColor: '#c084fc', emissiveIntensity: 1.3, scale: 1.45, metalness: 0.5, roughness: 0.45, accentColor: '#e9d5ff', ornamentColor: '#7e22ce' },
  },
  {
    species: 'dragon',
    fromStage: 2,
    toStage: 3,
    pathName: 'Виверн-Лорд',
    visualDescription: 'Тело вытягивается, становясь хищным. Крылья рвутся на перепонки-лезвия. Хвост оканчивается ядовитым жалом.',
    hiddenBuff: STAGE3_BUFF,
    modelConfig: { primaryColor: '#0f766e', emissiveColor: '#2dd4bf', emissiveIntensity: 1.1, scale: 1.35, metalness: 0.45, roughness: 0.4, accentColor: '#99f6e4', ornamentColor: '#134e4a' },
  },
  {
    species: 'dragon',
    fromStage: 2,
    toStage: 3,
    pathName: 'Теневой',
    visualDescription: 'Чешуя становится дымчатой полупрозрачностью, контуры размываются. Глаза — два уголька. Крылья поглощают свет вокруг.',
    hiddenBuff: STAGE3_BUFF,
    modelConfig: { primaryColor: '#18181b', emissiveColor: '#a855f7', emissiveIntensity: 1.6, scale: 1.3, metalness: 0.2, roughness: 0.7, accentColor: '#7c3aed', ornamentColor: '#3f3f46' },
  },

  // ===== MAGPIE =====
  {
    species: 'magpie',
    fromStage: 1,
    toStage: 2,
    pathName: 'Вещун',
    visualDescription: 'Оперение темнеет до смоляного, на груди проступает серебряный знак. Клюв удлиняется, хвост распадается на ленты с рунами.',
    hiddenBuff: STAGE2_BUFF,
    modelConfig: { primaryColor: '#0a0a0a', emissiveColor: '#94a3b8', emissiveIntensity: 0.5, scale: 1.1, metalness: 0.6, roughness: 0.3, accentColor: '#e2e8f0', ornamentColor: '#cbd5e1' },
  },
  {
    species: 'magpie',
    fromStage: 1,
    toStage: 2,
    pathName: 'Крадущийся',
    visualDescription: 'Перья становятся серыми, как сумерки, контуры размываются. Клюв кривится в ухмылке. Хвост распушён для баланса.',
    hiddenBuff: STAGE2_BUFF,
    modelConfig: { primaryColor: '#374151', emissiveColor: '#6b7280', emissiveIntensity: 0.4, scale: 1.0, metalness: 0.3, roughness: 0.6, accentColor: '#9ca3af', ornamentColor: '#1f2937' },
  },
  {
    species: 'magpie',
    fromStage: 1,
    toStage: 2,
    pathName: 'Говорящий',
    visualDescription: 'Грудь белеет, на голове — хохолок из ярких перьев. Клюв золотится. Хвост распускается веером.',
    hiddenBuff: STAGE2_BUFF,
    modelConfig: { primaryColor: '#111827', emissiveColor: '#fbbf24', emissiveIntensity: 0.7, scale: 1.05, metalness: 0.5, roughness: 0.4, accentColor: '#fef3c7', ornamentColor: '#f59e0b' },
  },
  {
    species: 'magpie',
    fromStage: 2,
    toStage: 3,
    pathName: 'Ворон-Пророк',
    visualDescription: 'Размах крыльев увеличивается втрое, оперение становится иссиня-чёрным. На груди — третий глаз из сапфира. Хвост — длинные ленты судьбы.',
    hiddenBuff: STAGE3_BUFF,
    modelConfig: { primaryColor: '#0c0a09', emissiveColor: '#3b82f6', emissiveIntensity: 1.2, scale: 1.4, metalness: 0.7, roughness: 0.25, accentColor: '#93c5fd', ornamentColor: '#1d4ed8' },
  },
  {
    species: 'magpie',
    fromStage: 2,
    toStage: 3,
    pathName: 'Буревестник',
    visualDescription: 'Перья наэлектризованы, между ними проскакивают искры. Клюв — молния. Хвост — растрёпанный шторм.',
    hiddenBuff: STAGE3_BUFF,
    modelConfig: { primaryColor: '#1e1b4b', emissiveColor: '#facc15', emissiveIntensity: 1.5, scale: 1.35, metalness: 0.5, roughness: 0.3, accentColor: '#fef9c3', ornamentColor: '#a855f7' },
  },
  {
    species: 'magpie',
    fromStage: 2,
    toStage: 3,
    pathName: 'Серебряный',
    visualDescription: 'Оперение становится зеркально-серебряным, отражает мир. Клюв — полированное серебро. Хвост — струящийся металл.',
    hiddenBuff: STAGE3_BUFF,
    modelConfig: { primaryColor: '#e5e7eb', emissiveColor: '#f8fafc', emissiveIntensity: 0.8, scale: 1.3, metalness: 0.95, roughness: 0.05, accentColor: '#ffffff', ornamentColor: '#cbd5e1' },
  },

  // ===== DOLL =====
  {
    species: 'doll',
    fromStage: 1,
    toStage: 2,
    pathName: 'Хранитель',
    visualDescription: 'Ткань уплотняется, покрываясь защитной вышивкой. Пуговичные глаза становятся медными. На руках — нитяные когти.',
    hiddenBuff: STAGE2_BUFF,
    modelConfig: { primaryColor: '#7f1d1d', emissiveColor: '#b45309', emissiveIntensity: 0.5, scale: 1.1, metalness: 0.2, roughness: 0.85, accentColor: '#fbbf24', ornamentColor: '#92400e' },
  },
  {
    species: 'doll',
    fromStage: 1,
    toStage: 2,
    pathName: 'Мститель',
    visualDescription: 'Ткань рвётся, обнажая нитяные сухожилия. Глаза-пуговицы трескаются, светя красным. Стежки становятся шрамами-рунами.',
    hiddenBuff: STAGE2_BUFF,
    modelConfig: { primaryColor: '#450a0a', emissiveColor: '#dc2626', emissiveIntensity: 1.0, scale: 1.1, metalness: 0.1, roughness: 0.9, accentColor: '#7f1d1d', ornamentColor: '#991b1b' },
  },
  {
    species: 'doll',
    fromStage: 1,
    toStage: 2,
    pathName: 'Шептун',
    visualDescription: 'Ткань сереет, становится полупрозрачной. Рот расшивается нитями-зубами. Из швов сочатся тени.',
    hiddenBuff: STAGE2_BUFF,
    modelConfig: { primaryColor: '#3f3f46', emissiveColor: '#8b5cf6', emissiveIntensity: 0.9, scale: 1.05, metalness: 0.15, roughness: 0.8, accentColor: '#c4b5fd', ornamentColor: '#52525b' },
  },
  {
    species: 'doll',
    fromStage: 2,
    toStage: 3,
    pathName: 'Марионетка',
    visualDescription: 'Конечности удлиняются, соединённые видимыми нитями судьбы. Ткань покрывается знаками. Глаза — семь пуговиц по телу.',
    hiddenBuff: STAGE3_BUFF,
    modelConfig: { primaryColor: '#4c1d95', emissiveColor: '#c084fc', emissiveIntensity: 1.3, scale: 1.4, metalness: 0.2, roughness: 0.75, accentColor: '#ddd6fe', ornamentColor: '#7c3aed' },
  },
  {
    species: 'doll',
    fromStage: 2,
    toStage: 3,
    pathName: 'Порченая',
    visualDescription: 'Ткань чернеет, гниёт местами. Из рваных ран сочатся фиолетовые нити. Глаза — провалы, полные шёпота.',
    hiddenBuff: STAGE3_BUFF,
    modelConfig: { primaryColor: '#0a0a0a', emissiveColor: '#7c3aed', emissiveIntensity: 1.7, scale: 1.35, metalness: 0.1, roughness: 0.95, accentColor: '#6d28d9', ornamentColor: '#2e1065' },
  },
  {
    species: 'doll',
    fromStage: 2,
    toStage: 3,
    pathName: 'Штопанная',
    visualDescription: 'Ткань лоскутно сшита из множества цветов, стежки золотом. Глаза — две жемчужины. Аура тепла и исцеления.',
    hiddenBuff: STAGE3_BUFF,
    modelConfig: { primaryColor: '#fef3c7', emissiveColor: '#fde047', emissiveIntensity: 0.9, scale: 1.3, metalness: 0.3, roughness: 0.7, accentColor: '#facc15', ornamentColor: '#f59e0b' },
  },
];

async function main() {
  console.log('Seeding evolution options...');
  // Clear existing
  await db.evolutionOption.deleteMany({});
  for (const opt of options) {
    await db.evolutionOption.create({
      data: {
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
  // Seed a DM account if not exists
  const dmExists = await db.user.findUnique({ where: { username: 'dm' } });
  if (!dmExists) {
    const { hashPassword } = await import('../src/lib/auth');
    await db.user.create({
      data: {
        username: 'dm',
        passwordHash: hashPassword('dmdnd123'),
        role: 'dm',
        characterName: 'Мастер Подземелий',
      },
    });
    console.log('Created DM account: dm / dmdnd123');
  }
  console.log(`Seeded ${options.length} evolution options.`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
