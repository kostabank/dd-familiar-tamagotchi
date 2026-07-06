// Shared TypeScript types for D&D Familiar Tamagotchi

export type Species = 'construct' | 'dragon' | 'magpie' | 'doll';
export type UserRole = 'player' | 'dm';
export type FamiliarState = 'happy' | 'hungry' | 'sad' | 'tired' | 'sleeping' | 'normal';

export interface UserPublic {
  id: string;
  username: string;
  role: UserRole;
  characterName: string | null;
}

export interface FamiliarDTO {
  id: string;
  userId: string;
  species: Species;
  name: string;
  stage: 1 | 2 | 3;
  evolutionPath: string | null;
  hiddenBuff: string | null;
  energy: number;
  mood: number;
  fatigue: number;
  health: number;
  sync: number;
  isSleeping: boolean;
  sleepStartedAt: string | null;
  lastTick: string;
  coins: number;
  accentColor: string | null;
  bio: string | null;
  state: FamiliarState;
}

export interface EvolutionOptionDTO {
  id: string;
  species: Species;
  fromStage: number;
  toStage: number;
  pathName: string;
  visualDescription: string;
  modelConfig: ModelConfig;
}

export interface ModelConfig {
  primaryColor: string;
  emissiveColor: string;
  emissiveIntensity: number;
  scale: number;
  metalness: number;
  roughness: number;
  accentColor?: string;
  ornamentColor?: string;
}

export interface InteractionLogDTO {
  id: string;
  familiarId: string;
  actionType: string;
  detail: string | null;
  timestamp: string;
}

export interface AdminFamiliarRow extends FamiliarDTO {
  username: string;
  characterName: string | null;
}

export interface GlobalEventResult {
  event: string;
  affected: number;
}

export interface PartyResonance {
  averageMood: number;
  playerCount: number;
  buff: string | null; // '+2 Temp HP' | '-1 Initiative' | null
}

export interface BuffSummary {
  individualBuff: string | null;
  debuff: string | null;
  partyResonance: PartyResonance | null;
  dailyClaim: {
    claimedToday: boolean;
    lastClaimMsk: string | null;
    claimCount: number;
    nextClaimAt: string | null; // ISO when the next Moscow day starts
  } | null;
}

export interface ApiError {
  error: string;
  code?: string;
}

export interface AuthResponse {
  user: UserPublic;
  familiar: FamiliarDTO | null;
}
