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
} as const;

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
