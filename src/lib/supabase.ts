import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase client for real-time subscriptions + optional DB access.
 * In production (Vercel + Supabase), env vars are set → real-time works.
 * In local dev (no Supabase), env vars are absent → isSupabaseEnabled = false,
 * and the app falls back to polling (see use-realtime.ts).
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseEnabled = !!(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = isSupabaseEnabled
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      realtime: {
        params: { eventsPerSecond: 10 },
      },
    })
  : null;

/**
 * Broadcasts a real-time event to all connected clients via Supabase Realtime.
 * Falls back to no-op if Supabase is not configured (local dev).
 * Used by API routes to notify clients of familiar stat changes.
 */
export async function broadcastFamiliarUpdate(familiarId: string, familiar: unknown): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.channel('familiars').send({
      type: 'broadcast',
      event: 'familiar:update',
      payload: { familiar, userId: (familiar as { userId?: string })?.userId },
    });
  } catch {
    /* noop — non-critical */
  }
}

export async function broadcastPartyResonance(resonance: unknown): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.channel('party').send({
      type: 'broadcast',
      event: 'party:resonance',
      payload: resonance,
    });
  } catch {
    /* noop */
  }
}

export async function broadcastAdminEvent(event: string, affected: number): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.channel('party').send({
      type: 'broadcast',
      event: 'admin:event',
      payload: { event, affected, timestamp: new Date().toISOString() },
    });
  } catch {
    /* noop */
  }
}
