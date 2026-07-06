import { create } from 'zustand';
import type { UserPublic, FamiliarDTO, BuffSummary, PartyResonance, InteractionLogDTO } from './types';

export interface PartyRosterEntry {
  userId: string;
  username: string;
  characterName: string | null;
  species: string;
  name: string;
  stage: number;
  mood: number;
  energy: number;
  state: string;
}

interface AppState {
  // Auth
  user: UserPublic | null;
  familiar: FamiliarDTO | null;
  authLoading: boolean;
  authed: boolean;

  // Realtime
  partyResonance: PartyResonance | null;
  buffs: BuffSummary | null;
  partyRoster: PartyRosterEntry[];

  // UI
  evolving: boolean;
  showMiniGame: boolean;
  showEvolutionModal: boolean;
  showInventory: boolean; // mobile swipe-up drawer
  petEffect: number; // increments to trigger heart-particle burst in 3D
  celebration: { id: number; emoji: string; label: string; color: string } | null;

  // Actions
  setAuth: (user: UserPublic | null, familiar: FamiliarDTO | null) => void;
  setAuthLoading: (v: boolean) => void;
  setFamiliar: (f: FamiliarDTO | null) => void;
  setPartyResonance: (r: PartyResonance | null) => void;
  setBuffs: (b: BuffSummary | null) => void;
  setPartyRoster: (r: PartyRosterEntry[]) => void;
  setEvolving: (v: boolean) => void;
  setShowMiniGame: (v: boolean) => void;
  setShowEvolutionModal: (v: boolean) => void;
  setShowInventory: (v: boolean) => void;
  triggerPetEffect: () => void;
  triggerCelebration: (emoji: string, label: string, color: string) => void;
  clearCelebration: () => void;
  logout: () => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  familiar: null,
  authLoading: true,
  authed: false,
  partyResonance: null,
  buffs: null,
  partyRoster: [],
  evolving: false,
  showMiniGame: false,
  showEvolutionModal: false,
  showInventory: false,
  petEffect: 0,
  celebration: null,

  setAuth: (user, familiar) =>
    set({ user, familiar, authed: !!user, authLoading: false }),
  setAuthLoading: (v) => set({ authLoading: v }),
  setFamiliar: (f) => set({ familiar: f }),
  setPartyResonance: (r) => set({ partyResonance: r }),
  setBuffs: (b) => set({ buffs: b }),
  setPartyRoster: (r) => set({ partyRoster: r }),
  setEvolving: (v) => set({ evolving: v }),
  setShowMiniGame: (v) => set({ showMiniGame: v }),
  setShowEvolutionModal: (v) => set({ showEvolutionModal: v }),
  setShowInventory: (v) => set({ showInventory: v }),
  triggerPetEffect: () => set((s) => ({ petEffect: s.petEffect + 1 })),
  triggerCelebration: (emoji, label, color) =>
    set({ celebration: { id: Date.now(), emoji, label, color } }),
  clearCelebration: () => set({ celebration: null }),
  logout: () =>
    set({
      user: null,
      familiar: null,
      authed: false,
      authLoading: false,
      partyResonance: null,
      buffs: null,
      partyRoster: [],
    }),
}));

// Re-export for convenience.
export type { InteractionLogDTO };

