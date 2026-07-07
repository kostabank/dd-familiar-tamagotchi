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

/** A floating stat-change indicator rendered over the 3D canvas. */
export interface FloatingChange {
  id: number;
  label: string;   // e.g. "+20 Энергия"
  color: string;   // tailwind-ish hex
  createdAt: number;
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
  showCodex: boolean;
  showShortcutsHelp: boolean;
  showInventory: boolean; // mobile swipe-up drawer
  petEffect: number; // increments to trigger heart-particle burst in 3D
  celebration: { id: number; emoji: string; label: string; color: string } | null;

  // Floating stat-change indicators (auto-expire after ~2s via component).
  floatingChanges: FloatingChange[];

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
  setShowCodex: (v: boolean) => void;
  setShowShortcutsHelp: (v: boolean) => void;
  setShowInventory: (v: boolean) => void;
  triggerPetEffect: () => void;
  triggerCelebration: (emoji: string, label: string, color: string) => void;
  clearCelebration: () => void;
  /** Push one or more floating stat-change indicators over the 3D canvas. */
  pushFloatingChanges: (items: { label: string; color: string }[]) => void;
  dismissFloatingChange: (id: number) => void;
  logout: () => void;
}

let floatingIdCounter = 0;

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
  showCodex: false,
  showShortcutsHelp: false,
  showInventory: false,
  petEffect: 0,
  celebration: null,
  floatingChanges: [],

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
  setShowCodex: (v) => set({ showCodex: v }),
  setShowShortcutsHelp: (v) => set({ showShortcutsHelp: v }),
  setShowInventory: (v) => set({ showInventory: v }),
  triggerPetEffect: () => set((s) => ({ petEffect: s.petEffect + 1 })),
  triggerCelebration: (emoji, label, color) =>
    set({ celebration: { id: Date.now(), emoji, label, color } }),
  clearCelebration: () => set({ celebration: null }),
  pushFloatingChanges: (items) =>
    set((s) => {
      if (items.length === 0) return {};
      const now = Date.now();
      const additions: FloatingChange[] = items.map((it) => ({
        id: ++floatingIdCounter,
        label: it.label,
        color: it.color,
        createdAt: now,
      }));
      // Keep the list bounded — only the 8 most recent.
      const next = [...s.floatingChanges, ...additions].slice(-8);
      return { floatingChanges: next };
    }),
  dismissFloatingChange: (id) =>
    set((s) => ({ floatingChanges: s.floatingChanges.filter((f) => f.id !== id) })),
  logout: () =>
    set({
      user: null,
      familiar: null,
      authed: false,
      authLoading: false,
      partyResonance: null,
      buffs: null,
      partyRoster: [],
      floatingChanges: [],
    }),
}));

// Re-export for convenience.
export type { InteractionLogDTO };
