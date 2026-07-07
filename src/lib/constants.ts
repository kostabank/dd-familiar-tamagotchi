// Game constants & helpers for D&D Familiar Tamagotchi

export const GAME = {
  // Stat bounds
  MIN_STAT: 0,
  MAX_STAT: 100,
  // Decay per 6 hours of real time (server tick every hour)
  ENERGY_DECAY_PER_6H: 5,
  MOOD_DECAY_PER_6H: 5,
  HEALTH_DECAY_WHEN_STARVING: 2, // per hour when energy < 10
  ENERGY_STARVATION_THRESHOLD: 10,
  // Sleep
  SLEEP_FATIGUE_RECOVERY_PER_HOUR: 10,
  SLEEP_DURATION_MS: 4 * 60 * 60 * 1000, // 4 hours real time
  // Actions
  FATIGUE_PER_ACTION: 15,
  FATIGUE_BLOCK_THRESHOLD: 80,
  FEED_ENERGY_GAIN: 20,
  FEED_MOOD_GAIN: 5,
  PLAY_MOOD_GAIN_SUCCESS: 20,
  PLAY_MOOD_GAIN_FAIL: 5,
  PLAY_SYNC_GAIN_SUCCESS: 10,
  PLAY_SYNC_GAIN_FAIL: 2,
  FEED_SYNC_GAIN: 3,
  // Evolution
  EVOLUTION_SYNC_THRESHOLD: 100,
  MAX_STAGE: 3,
  // Coins
  PLAY_COINS_SUCCESS: 10,
  PLAY_COINS_FAIL: 2,
  EVOLUTION_COIN_REWARD: 25,
  // Pet/Stroke (free low-impact flavor action)
  PET_MOOD_GAIN: 3,
  PET_SYNC_GAIN: 1,
  PET_FATIGUE_GAIN: 5,
  PET_COOLDOWN_MS: 30 * 1000, // 30s cooldown to prevent spam
  // Daily buff claim
  DAILY_CLAIM_COIN_REWARD: 15,
  // Gifts (player-to-player trading)
  GIFT_COOLDOWN_MS: 60 * 1000, // 1 min cooldown per recipient
} as const;

export interface GiftType {
  code: string;
  label: string;
  emoji: string;
  coinCost: number;
  moodBoost: number;
  syncBoost: number;
  description: string;
}

export const GIFT_TYPES: GiftType[] = [
  { code: 'treat', label: 'Лакомство', emoji: '🍖', coinCost: 10, moodBoost: 10, syncBoost: 2, description: 'Вкусное угощение поднимает настроение' },
  { code: 'toy', label: 'Игрушка', emoji: '🧸', coinCost: 20, moodBoost: 15, syncBoost: 5, description: 'Забавная игрушка для игры' },
  { code: 'charm', label: 'Талисман', emoji: '🔮', coinCost: 35, moodBoost: 20, syncBoost: 10, description: 'Магический талисман усиливает связь' },
];

export interface QuestTemplate {
  title: string;
  description: string;
  metric: string;
  goal: number;
  syncReward: number;
  coinReward: number;
  emoji: string;
}

export const QUEST_TEMPLATES: QuestTemplate[] = [
  { title: 'Утренний завтрак', description: 'Фамильяр проголодался после ночного дозора. Покорми его дважды!', metric: 'feed', goal: 2, syncReward: 15, coinReward: 10, emoji: '🍳' },
  { title: 'Щедрый повар', description: 'Устрой пир для своего фамильяра — покорми его 5 раз!', metric: 'feed', goal: 5, syncReward: 25, coinReward: 20, emoji: ' Feast' },
  { title: 'Игривый час', description: 'Поиграй с фамильяром 3 раза — ему нужно размяться!', metric: 'play', goal: 3, syncReward: 20, coinReward: 15, emoji: '🎮' },
  { title: 'Ласковый хозяин', description: 'Погладь фамильяра 5 раз — он скучает по вниманию.', metric: 'pet', goal: 5, syncReward: 15, coinReward: 10, emoji: '💗' },
  { title: 'Испытание магией', description: 'Получи бафф дня, чтобы усилить фамильяра.', metric: 'claim_buff', goal: 1, syncReward: 10, coinReward: 5, emoji: '✨' },
  { title: 'Большое приключение', description: 'Поиграй с фамильяром 5 раз для укрепления связи!', metric: 'play', goal: 5, syncReward: 30, coinReward: 25, emoji: '⚔️' },
];

export function clamp(v: number, min = GAME.MIN_STAT, max = GAME.MAX_STAT): number {
  return Math.max(min, Math.min(max, v));
}

export const SPECIES_INFO: Record<
  string,
  { label: string; emoji: string; tagline: string; accent: string }
> = {
  construct: { label: 'Конструкт', emoji: '◈', tagline: 'Парящий октаэдр с живым ядром', accent: '#3b82f6' },
  dragon: { label: 'Псевдодракончик', emoji: 'dragon', tagline: 'Изумрудно-лазурный зверёк', accent: '#2dd4bf' },
  magpie: { label: 'Сорока', emoji: '✶', tagline: 'Чёрно-белая воровка блёсток', accent: '#e2e8f0' },
  doll: { label: 'Оживленная Кукла', emoji: '♟', tagline: 'Мешковатая тканевая душа', accent: '#a855f7' },
};

export const STATE_INFO: Record<string, { label: string; color: string; desc: string }> = {
  happy: { label: 'Счастлив', color: '#22c55e', desc: 'Все параметры выше 70' },
  hungry: { label: 'Голоден', color: '#f97316', desc: 'Энергия ниже 30' },
  sad: { label: 'Грустит', color: '#64748b', desc: 'Настроение ниже 30' },
  tired: { label: 'Устал', color: '#a855f7', desc: 'Усталость выше 80' },
  sleeping: { label: 'Спит', color: '#3b82f6', desc: 'Восстанавливает силы' },
  normal: { label: 'Бодрствует', color: '#94a3b8', desc: 'Обычное состояние' },
};
