import { DateTime } from 'luxon';
import { db } from './db';
import { GAME, clamp } from './constants';
import type { FamiliarDTO, FamiliarState, Species, BuffSummary, PartyResonance } from './types';

// All time math uses Europe/Moscow zone, as required.
const MOSCOW_ZONE = 'Europe/Moscow';

export function nowMoscow(): DateTime {
  return DateTime.now().setZone(MOSCOW_ZONE);
}

export function toMoscowISO(date: Date | string): string {
  const dt = typeof date === 'string' ? DateTime.fromISO(date, { zone: MOSCOW_ZONE }) : DateTime.fromJSDate(date, { zone: MOSCOW_ZONE });
  return dt.toISO()!;
}

/** Returns the current Moscow calendar day as 'yyyy-MM-dd'. */
export function todayMoscowDate(): string {
  return nowMoscow().toISODate();
}

/** Returns true if the player has already claimed their daily buff today (Moscow day). */
export async function getDailyClaimStatus(userId: string): Promise<{ claimedToday: boolean; lastClaimMsk: string | null; claimCount: number }> {
  const today = todayMoscowDate();
  const row = await db.dailyBuffClaim.findUnique({ where: { userId } });
  if (!row) return { claimedToday: false, lastClaimMsk: null, claimCount: 0 };
  return {
    claimedToday: row.lastClaimMsk === today,
    lastClaimMsk: row.lastClaimMsk,
    claimCount: row.claimCount,
  };
}

/** Records a daily buff claim for the player (upserts the row). */
export async function recordDailyClaim(userId: string): Promise<void> {
  const today = todayMoscowDate();
  const existing = await db.dailyBuffClaim.findUnique({ where: { userId } });
  if (existing) {
    await db.dailyBuffClaim.update({
      where: { userId },
      data: { lastClaimMsk: today, claimCount: { increment: 1 } },
    });
  } else {
    await db.dailyBuffClaim.create({
      data: { userId, lastClaimMsk: today, claimCount: 1 },
    });
  }
}

export function hoursBetweenMs(lastTick: Date | string): number {
  const last = typeof lastTick === 'string' ? DateTime.fromISO(lastTick, { zone: MOSCOW_ZONE }) : DateTime.fromJSDate(lastTick, { zone: MOSCOW_ZONE });
  const now = nowMoscow();
  const diffMs = now.toMillis() - last.toMillis();
  return diffMs / (1000 * 60 * 60);
}

/**
 * Apply server-side decay for a familiar based on real elapsed time.
 * Rules:
 *  - per 6 hours: energy -= 5, mood -= 5
 *  - if energy < 10: health -= 2 per hour
 *  - if sleeping: fatigue -= 10 per hour (min 0), energy does NOT decay
 *  - sleeping ends automatically after SLEEP_DURATION_MS real time
 * Returns the updated familiar record (not yet persisted).
 */
export function applyDecay(familiar: {
  id: string;
  energy: number;
  mood: number;
  fatigue: number;
  health: number;
  isSleeping: boolean;
  sleepStartedAt: Date | string | null;
  lastTick: Date | string;
}): {
  energy: number;
  mood: number;
  fatigue: number;
  health: number;
  isSleeping: boolean;
  sleepStartedAt: Date | string | null;
  lastTick: Date;
  changed: boolean;
} {
  const hours = hoursBetweenMs(familiar.lastTick);
  const changed = hours > 0;

  let energy = familiar.energy;
  let mood = familiar.mood;
  let fatigue = familiar.fatigue;
  let health = familiar.health;
  let isSleeping = familiar.isSleeping;
  let sleepStartedAt = familiar.sleepStartedAt;

  // Check if sleep should auto-end
  if (isSleeping && sleepStartedAt) {
    const sleepStart = typeof sleepStartedAt === 'string' ? DateTime.fromISO(sleepStartedAt, { zone: MOSCOW_ZONE }) : DateTime.fromJSDate(sleepStartedAt, { zone: MOSCOW_ZONE });
    const sleptMs = nowMoscow().toMillis() - sleepStart.toMillis();
    if (sleptMs >= GAME.SLEEP_DURATION_MS) {
      isSleeping = false;
      sleepStartedAt = null;
      fatigue = 0; // fully rested
    }
  }

  if (hours > 0) {
    if (isSleeping) {
      // Sleeping: recover fatigue, energy stable
      fatigue = clamp(fatigue - GAME.SLEEP_FATIGUE_RECOVERY_PER_HOUR * hours);
    } else {
      // Awake: normal decay
      const decayCycles = Math.floor(hours / 6);
      energy = clamp(energy - GAME.ENERGY_DECAY_PER_6H * decayCycles);
      mood = clamp(mood - GAME.MOOD_DECAY_PER_6H * decayCycles);
      // Starvation health damage per hour
      if (energy < GAME.ENERGY_STARVATION_THRESHOLD) {
        health = clamp(health - GAME.HEALTH_DECAY_WHEN_STARVING * hours);
      }
    }
  }

  return {
    energy: Math.round(energy),
    mood: Math.round(mood),
    fatigue: Math.round(fatigue),
    health: Math.round(health),
    isSleeping,
    sleepStartedAt,
    lastTick: new Date(),
    changed,
  };
}

/**
 * Recompute a familiar's decay and persist it. Used by API routes on read
 * and by the socket cron job on its hourly tick.
 */
export async function recomputeAndPersist(familiarId: string): Promise<FamiliarDTO | null> {
  const f = await db.familiar.findUnique({ where: { id: familiarId } });
  if (!f) return null;
  const decayed = applyDecay(f);
  const updated = await db.familiar.update({
    where: { id: familiarId },
    data: {
      energy: decayed.energy,
      mood: decayed.mood,
      fatigue: decayed.fatigue,
      health: decayed.health,
      isSleeping: decayed.isSleeping,
      sleepStartedAt: decayed.sleepStartedAt,
      lastTick: decayed.lastTick,
    },
  });
  return toFamiliarDTO(updated);
}

/**
 * Derive the current visible state of a familiar from its stats.
 */
export function deriveState(f: { energy: number; mood: number; fatigue: number; isSleeping: boolean }): FamiliarState {
  if (f.isSleeping) return 'sleeping';
  if (f.fatigue > GAME.FATIGUE_BLOCK_THRESHOLD) return 'tired';
  if (f.energy < 30) return 'hungry';
  if (f.mood < 30) return 'sad';
  if (f.energy > 70 && f.mood > 70 && f.fatigue < 50) return 'happy';
  return 'normal';
}

export function toFamiliarDTO(f: {
  id: string;
  userId: string;
  species: string;
  name: string;
  stage: number;
  evolutionPath: string | null;
  hiddenBuff: string | null;
  energy: number;
  mood: number;
  fatigue: number;
  health: number;
  sync: number;
  isSleeping: boolean;
  sleepStartedAt: Date | string | null;
  lastTick: Date | string;
  coins: number;
  accentColor?: string | null;
}): FamiliarDTO {
  return {
    id: f.id,
    userId: f.userId,
    species: f.species as Species,
    name: f.name,
    stage: f.stage as 1 | 2 | 3,
    evolutionPath: f.evolutionPath,
    hiddenBuff: f.hiddenBuff,
    energy: f.energy,
    mood: f.mood,
    fatigue: f.fatigue,
    health: f.health,
    sync: f.sync,
    isSleeping: f.isSleeping,
    sleepStartedAt: f.sleepStartedAt ? (f.sleepStartedAt instanceof Date ? f.sleepStartedAt.toISOString() : f.sleepStartedAt) : null,
    lastTick: f.lastTick instanceof Date ? f.lastTick.toISOString() : f.lastTick,
    coins: f.coins,
    accentColor: f.accentColor ?? null,
    state: deriveState(f),
  };
}

/**
 * Compute individual buffs/debuffs + party resonance for a player.
 */
export function describeIndividualBuff(stage: number, evolutionPath: string | null): string | null {
  if (stage < 1) return null;
  if (stage === 1) return '+1 к проверке Истории (1 раз в день)';
  if (stage === 2) return '+1d4 к атаке (1 раз в день)';
  return 'Переброс проваленного спасброска (1 раз в день)';
}

export function describeDebuff(health: number): string | null {
  if (health < 20) return '-1 ко всем атакам';
  return null;
}

export async function computePartyResonance(): Promise<PartyResonance> {
  const familiars = await db.familiar.findMany({ select: { mood: true } });
  const playerCount = familiars.length;
  if (playerCount === 0) {
    return { averageMood: 0, playerCount: 0, buff: null };
  }
  const avg = familiars.reduce((s, f) => s + f.mood, 0) / playerCount;
  let buff: string | null = null;
  if (avg > 80) buff = '+2 Temp HP в начале боя';
  else if (avg < 30) buff = '-1 к инициативе';
  return { averageMood: Math.round(avg), playerCount, buff };
}

export async function computeBuffs(userId: string): Promise<BuffSummary> {
  const f = await db.familiar.findUnique({ where: { userId } });
  const resonance = await computePartyResonance();
  const claim = await getDailyClaimStatus(userId);
  // Compute next-claim-at: start of next Moscow day.
  let nextClaimAt: string | null = null;
  if (claim.claimedToday) {
    nextClaimAt = nowMoscow().plus({ days: 1 }).startOf('day').toISO();
  }
  if (!f) {
    return {
      individualBuff: null,
      debuff: null,
      partyResonance: resonance,
      dailyClaim: { ...claim, nextClaimAt },
    };
  }
  return {
    individualBuff: describeIndividualBuff(f.stage, f.evolutionPath),
    debuff: describeDebuff(f.health),
    partyResonance: resonance,
    dailyClaim: { ...claim, nextClaimAt },
  };
}

/** Returns the most recent N interaction logs for a familiar (newest first). */
export async function getRecentLogs(familiarId: string, limit = 12): Promise<{ id: string; actionType: string; detail: string | null; timestamp: string }[]> {
  const logs = await db.interactionLog.findMany({
    where: { familiarId },
    orderBy: { timestamp: 'desc' },
    take: limit,
  });
  return logs.map((l) => ({
    id: l.id,
    actionType: l.actionType,
    detail: l.detail,
    timestamp: l.timestamp instanceof Date ? l.timestamp.toISOString() : l.timestamp,
  }));
}

/** Returns a lightweight roster of all players + their familiars (for party sidebar). */
export async function getPartyRoster(): Promise<{ username: string; characterName: string | null; species: string; name: string; stage: number; mood: number; energy: number; state: FamiliarState }[]> {
  const rows = await db.familiar.findMany({
    include: { user: { select: { username: true, characterName: true } } },
    orderBy: { createdAt: 'asc' },
  });
  return rows.map((f) => ({
    username: f.user.username,
    characterName: f.user.characterName,
    species: f.species,
    name: f.name,
    stage: f.stage,
    mood: f.mood,
    energy: f.energy,
    state: deriveState(f),
  }));
}

// ---------------------------------------------------------------------------
// Achievements
// ---------------------------------------------------------------------------

export interface AchievementDTO {
  id: string;
  code: string;
  title: string;
  description: string;
  icon: string;
  tier: string;
  goal: number;
  metric: string;
  unlocked: boolean;
  unlockedAt: string | null;
  progress: number; // current metric value
}

/** Compute the current metric values for a user (used for progress display + unlock checks). */
export async function computeAchievementMetrics(userId: string): Promise<Record<string, number>> {
  const familiar = await db.familiar.findUnique({ where: { userId } });
  if (!familiar) {
    return { evolutions: 0, coins: 0, play_count: 0, feed_count: 0, pet_count: 0, streak_days: 0, stage: 0 };
  }
  // Count action logs by type.
  const logs = await db.interactionLog.groupBy({
    by: ['actionType'],
    where: { userId },
    _count: { _all: true },
  });
  const countBy = (type: string) => logs.find((l) => l.actionType === type)?._count._all ?? 0;
  // Evolutions = count of 'evolve' logs that actually changed stage (detail contains '->').
  const evolveLogs = await db.interactionLog.findMany({
    where: { userId, actionType: 'evolve', detail: { contains: '->' } },
  });
  const evolutions = evolveLogs.length;
  const streak = await computeStreakDays(userId);
  return {
    evolutions,
    coins: familiar.coins,
    play_count: countBy('play'),
    feed_count: countBy('feed'),
    pet_count: countBy('pet'),
    streak_days: streak,
    stage: familiar.stage,
  };
}

/**
 * Compute consecutive MSK days with at least one logged action.
 * Looks at interaction logs by Moscow date; counts back from today until a gap.
 */
export async function computeStreakDays(userId: string): Promise<number> {
  const logs = await db.interactionLog.findMany({
    where: { userId },
    select: { timestamp: true },
    orderBy: { timestamp: 'desc' },
  });
  if (logs.length === 0) return 0;
  const mskDates = new Set<string>();
  for (const l of logs) {
    const d = typeof l.timestamp === 'string' ? DateTime.fromISO(l.timestamp, { zone: MOSCOW_ZONE }) : DateTime.fromJSDate(l.timestamp as Date, { zone: MOSCOW_ZONE });
    mskDates.add(d.toISODate());
  }
  let streak = 0;
  let cursor = nowMoscow();
  // If no action today, streak may still be valid from yesterday — start from today, allow 1 gap at the start.
  for (let i = 0; i < 365; i++) {
    const iso = cursor.toISODate();
    if (mskDates.has(iso)) {
      streak++;
      cursor = cursor.minus({ days: 1 });
    } else if (i === 0) {
      // No action today yet — check yesterday to keep an ongoing streak alive.
      cursor = cursor.minus({ days: 1 });
    } else {
      break;
    }
  }
  return streak;
}

/** Returns all achievements with unlock status + progress for a user. */
export async function getAchievementsForUser(userId: string): Promise<AchievementDTO[]> {
  const all = await db.achievement.findMany({ orderBy: { tier: 'asc' } });
  const unlocked = await db.playerAchievement.findMany({
    where: { userId },
    include: { achievement: true },
  });
  const unlockedMap = new Map(unlocked.map((u) => [u.achievementId, u.unlockedAt]));
  const metrics = await computeAchievementMetrics(userId);
  return all.map((a) => {
    const progress = metrics[a.metric] ?? 0;
    const unlockedAt = unlockedMap.get(a.id);
    return {
      id: a.id,
      code: a.code,
      title: a.title,
      description: a.description,
      icon: a.icon,
      tier: a.tier,
      goal: a.goal,
      metric: a.metric,
      unlocked: !!unlockedAt,
      unlockedAt: unlockedAt ? (unlockedAt instanceof Date ? unlockedAt.toISOString() : unlockedAt) : null,
      progress,
    };
  });
}

/**
 * Checks all locked achievements for a user and unlocks any whose metric
 * has crossed the goal. Returns the list of newly-unlocked achievements.
 * Should be called after every state-changing action.
 */
export async function checkAndUnlockAchievements(userId: string): Promise<AchievementDTO[]> {
  const all = await getAchievementsForUser(userId);
  const newlyUnlocked: AchievementDTO[] = [];
  for (const a of all) {
    if (!a.unlocked && a.progress >= a.goal) {
      try {
        await db.playerAchievement.create({
          data: { userId, achievementId: a.id },
        });
        newlyUnlocked.push({ ...a, unlocked: true, unlockedAt: new Date().toISOString() });
      } catch {
        // Race condition: already unlocked by a concurrent call — safe to ignore.
      }
    }
  }
  return newlyUnlocked;
}

// ---------------------------------------------------------------------------
// Achievement rewards — grant coins on unlock based on tier.
// ---------------------------------------------------------------------------

const ACHIEVEMENT_REWARDS: Record<string, number> = {
  bronze: 20,
  silver: 50,
  gold: 150,
};

/**
 * Grants coin rewards for newly-unlocked achievements. Mutates the familiar's
 * coin balance and returns the total coins awarded.
 */
export async function grantAchievementRewards(userId: string, unlocked: AchievementDTO[]): Promise<number> {
  if (unlocked.length === 0) return 0;
  let total = 0;
  for (const a of unlocked) {
    total += ACHIEVEMENT_REWARDS[a.tier] || 0;
  }
  if (total > 0) {
    await db.familiar.update({
      where: { userId },
      data: { coins: { increment: total } },
    });
    await db.interactionLog.create({
      data: {
        familiarId: (await db.familiar.findUnique({ where: { userId }, select: { id: true } }))!.id,
        userId,
        actionType: 'claim_buff',
        detail: `achievement_reward +${total} coins (${unlocked.map((a) => a.code).join(',')})`,
      },
    });
  }
  return total;
}

// ---------------------------------------------------------------------------
// DM Quest system
// ---------------------------------------------------------------------------

export interface QuestDTO {
  id: string;
  title: string;
  description: string;
  metric: string; // 'feed' | 'play' | 'pet' | 'claim_buff' | 'evolve'
  goal: number;
  syncReward: number;
  coinReward: number;
  createdAt: string;
}

export interface PlayerQuestDTO extends QuestDTO {
  playerQuestId: string;
  progress: number;
  completed: boolean;
  completedAt: string | null;
  assignedAt: string;
}

const QUEST_METRIC_LABELS: Record<string, string> = {
  feed: 'Кормить',
  play: 'Играть',
  pet: 'Гладить',
  claim_buff: 'Получить бафф дня',
  evolve: 'Эволюционировать',
};

export function questMetricLabel(metric: string): string {
  return QUEST_METRIC_LABELS[metric] || metric;
}

function toQuestDTO(q: {
  id: string; title: string; description: string; metric: string;
  goal: number; syncReward: number; coinReward: number; createdAt: Date;
}): QuestDTO {
  return {
    id: q.id, title: q.title, description: q.description, metric: q.metric,
    goal: q.goal, syncReward: q.syncReward, coinReward: q.coinReward,
    createdAt: q.createdAt instanceof Date ? q.createdAt.toISOString() : q.createdAt,
  };
}

function toPlayerQuestDTO(pq: {
  id: string; progress: number; completed: boolean; completedAt: Date | null; assignedAt: Date;
  quest: { id: string; title: string; description: string; metric: string; goal: number; syncReward: number; coinReward: number; createdAt: Date };
}): PlayerQuestDTO {
  return {
    ...toQuestDTO(pq.quest),
    playerQuestId: pq.id,
    progress: pq.progress,
    completed: pq.completed,
    completedAt: pq.completedAt ? (pq.completedAt instanceof Date ? pq.completedAt.toISOString() : pq.completedAt) : null,
    assignedAt: pq.assignedAt instanceof Date ? pq.assignedAt.toISOString() : pq.assignedAt,
  };
}

/**
 * DM creates a quest and assigns it to all players (replaces any active quest
 * for each player by marking old ones... actually we just create new assignments;
 * getActiveQuestForPlayer returns the most recent non-completed one).
 */
export async function createQuestAndAssign(
  dmUserId: string,
  data: { title: string; description: string; metric: string; goal: number; syncReward?: number; coinReward?: number },
): Promise<QuestDTO> {
  const quest = await db.quest.create({
    data: {
      title: data.title,
      description: data.description,
      metric: data.metric,
      goal: data.goal,
      syncReward: data.syncReward ?? 15,
      coinReward: data.coinReward ?? 10,
    },
  });
  // Assign to all players.
  const players = await db.user.findMany({ where: { role: 'player' }, select: { id: true } });
  for (const p of players) {
    // Mark existing active quests for this player as completed-without-reward
    // (superseded) by deleting them — simplest approach for "one active quest".
    await db.playerQuest.deleteMany({ where: { userId: p.id, completed: false } });
    await db.playerQuest.create({
      data: { userId: p.id, questId: quest.id },
    });
  }
  void dmUserId;
  return toQuestDTO(quest);
}

/** Returns the active (non-completed) quest for a player, or null. */
export async function getActiveQuestForPlayer(userId: string): Promise<PlayerQuestDTO | null> {
  const pq = await db.playerQuest.findFirst({
    where: { userId, completed: false },
    include: { quest: true },
    orderBy: { assignedAt: 'desc' },
  });
  if (!pq) return null;
  return toPlayerQuestDTO(pq);
}

/** Returns all active quests across all players (for DM view). */
export async function getAllActiveQuests(): Promise<{ username: string; characterName: string | null; quest: PlayerQuestDTO }[]> {
  const pqs = await db.playerQuest.findMany({
    where: { completed: false },
    include: { quest: true, user: { select: { username: true, characterName: true } } },
    orderBy: { assignedAt: 'desc' },
  });
  return pqs.map((pq) => ({
    username: pq.user.username,
    characterName: pq.user.characterName,
    quest: toPlayerQuestDTO(pq),
  }));
}

/** Returns all quests ever created (DM history). */
export async function getAllQuests(): Promise<QuestDTO[]> {
  const quests = await db.quest.findMany({ orderBy: { createdAt: 'desc' }, take: 30 });
  return quests.map(toQuestDTO);
}

/**
 * Increments quest progress for a player when an action matching the quest's
 * metric is performed. Auto-completes + grants rewards when progress >= goal.
 * Returns the updated PlayerQuestDTO (or null if no active quest / metric mismatch).
 */
export async function progressQuest(
  userId: string,
  actionType: string,
): Promise<{ quest: PlayerQuestDTO | null; justCompleted: boolean; rewardGranted: { sync: number; coins: number } | null }> {
  const active = await getActiveQuestForPlayer(userId);
  if (!active || active.metric !== actionType) {
    return { quest: active, justCompleted: false, rewardGranted: null };
  }
  if (active.completed) {
    return { quest: active, justCompleted: false, rewardGranted: null };
  }
  const newProgress = Math.min(active.goal, active.progress + 1);
  const justCompleted = newProgress >= active.goal;

  const updated = await db.playerQuest.update({
    where: { id: active.playerQuestId },
    data: {
      progress: newProgress,
      completed: justCompleted,
      completedAt: justCompleted ? new Date() : null,
    },
    include: { quest: true },
  });

  let rewardGranted: { sync: number; coins: number } | null = null;
  if (justCompleted) {
    // Grant sync + coin rewards to the familiar.
    const fam = await db.familiar.findUnique({ where: { userId } });
    if (fam) {
      const newSync = clamp(fam.sync + active.syncReward);
      const newCoins = fam.coins + active.coinReward;
      await db.familiar.update({
        where: { userId },
        data: { sync: newSync, coins: newCoins },
      });
      await db.interactionLog.create({
        data: {
          familiarId: fam.id,
          userId,
          actionType: 'claim_buff',
          detail: `quest_completed:${active.title} +${active.syncReward}sync +${active.coinReward}coins`,
        },
      });
      rewardGranted = { sync: active.syncReward, coins: active.coinReward };
    }
  }

  return { quest: toPlayerQuestDTO(updated), justCompleted, rewardGranted };
}
