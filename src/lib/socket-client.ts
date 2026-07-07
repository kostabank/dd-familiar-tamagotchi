// Helper to broadcast familiar updates via Supabase Realtime.
// In local dev (no Supabase env vars), these are no-ops — clients use polling.
import { broadcastFamiliarUpdate as supabaseBroadcastFamiliar, broadcastPartyResonance as supabaseBroadcastResonance, broadcastAdminEvent } from './supabase';
import type { FamiliarDTO, PartyResonance } from './types';

export async function broadcastFamiliarUpdate(familiar: FamiliarDTO): Promise<void> {
  await supabaseBroadcastFamiliar(familiar.id, familiar);
}

export async function broadcastPartyResonance(resonance: PartyResonance): Promise<void> {
  await supabaseBroadcastResonance(resonance);
}

export async function triggerGlobalEvent(event: 'storm' | 'festival', _token: string): Promise<{ affected: number } | null> {
  // Global events are applied directly via the admin/event API route.
  // This function is kept for backward compat but the admin/event route now
  // applies changes directly + broadcasts via Supabase.
  // The actual DB mutation happens in the route handler, not here.
  await broadcastAdminEvent(event, 0);
  return { affected: 0 };
}
