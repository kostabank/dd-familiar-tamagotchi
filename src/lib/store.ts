import { create } from 'zustand';
import type { UserPublic, FamiliarDTO, BuffSummary, PartyResonance } from './types';

interface AppState {
  // Auth
  user: UserPublic | null;
  familiar: FamiliarDTO | null;
  authLoading: boolean;
  authed: boolean;

  // Realtime
  partyResonance: PartyResonance | null;
  buffs: BuffSummary | null;

  // UI
  evolving: boolean;
  showMiniGame: boolean;
  showEvolutionModal: boolean;

  // Actions
  setAuth: (user: UserPublic | null, familiar: FamiliarDTO | null) => void;
  setAuthLoading: (v: boolean) => void;
  setFamiliar: (f: FamiliarDTO | null) => void;
  setPartyResonance: (r: PartyResonance | null) => void;
  setBuffs: (b: BuffSummary | null) => void;
  setEvolving: (v: boolean) => void;
  setShowMiniGame: (v: boolean) => void;
  setShowEvolutionModal: (v: boolean) => void;
  logout: () => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  familiar: null,
  authLoading: true,
  authed: false,
  partyResonance: null,
  buffs: null,
  evolving: false,
  showMiniGame: false,
  showEvolutionModal: false,

  setAuth: (user, familiar) =>
    set({ user, familiar, authed: !!user, authLoading: false }),
  setAuthLoading: (v) => set({ authLoading: v }),
  setFamiliar: (f) => set({ familiar: f }),
  setPartyResonance: (r) => set({ partyResonance: r }),
  setBuffs: (b) => set({ buffs: b }),
  setEvolving: (v) => set({ evolving: v }),
  setShowMiniGame: (v) => set({ showMiniGame: v }),
  setShowEvolutionModal: (v) => set({ showEvolutionModal: v }),
  logout: () =>
    set({
      user: null,
      familiar: null,
      authed: false,
      authLoading: false,
      partyResonance: null,
      buffs: null,
    }),
}));
