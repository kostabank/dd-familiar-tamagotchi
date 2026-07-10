import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { applyDecay, toFamiliarDTO, computePartyResonance } from '@/lib/familiar-logic';
import { broadcastFamiliarUpdate, broadcastPartyResonance } from '@/lib/socket-client';

// POST /api/cron/tick — Vercel Cron (or GitHub Action) calls this every hour.
// Applies decay to ALL familiars using Europe/Moscow time logic.
// Protected by CRON_SECRET header (Vercel automatically sends it).
//
// Robustness: every step is wrapped in try/catch so a single bad familiar
// or a transient DB error never fails the whole tick (which would 500 and
// break the GitHub Action). Broadcasts are best-effort (no-op without
// Supabase env vars). Returns 200 with a diagnostic payload.
export async function POST(req: NextRequest) {
  // Verify cron secret (Vercel sends it as Authorization: Bearer <secret>).
  // GitHub Action sends it the same way. If CRON_SECRET is unset, skip
  // the check (local dev / first deploy).
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startedAt = Date.now();
  let processed = 0;
  let changed = 0;
  let errors = 0;
  const errorDetails: string[] = [];

  try {
    const familiars = await db.familiar.findMany();
    processed = familiars.length;

    for (const f of familiars) {
      try {
        const decayed = applyDecay(f);
        if (!decayed.changed) continue;

        const updated = await db.familiar.update({
          where: { id: f.id },
          data: {
            energy: decayed.energy,
            mood: decayed.mood,
            fatigue: decayed.fatigue,
            health: decayed.health,
            isSleeping: decayed.isSleeping,
            sleepStartedAt: decayed.sleepStartedAt instanceof Date
              ? decayed.sleepStartedAt
              : (typeof decayed.sleepStartedAt === 'string' ? new Date(decayed.sleepStartedAt) : null),
            lastTick: decayed.lastTick,
          },
        });
        changed++;
        // Broadcast is best-effort — never let a realtime failure 500 the tick.
        try {
          await broadcastFamiliarUpdate(toFamiliarDTO(updated));
        } catch (bErr) {
          console.error(`[cron/tick] broadcast failed for ${f.id}:`, bErr);
        }
      } catch (e) {
        errors++;
        const msg = e instanceof Error ? e.message : String(e);
        errorDetails.push(`${f.id}: ${msg}`);
        console.error(`[cron/tick] failed for ${f.id}:`, e);
      }
    }

    let resonance = null;
    try {
      resonance = await computePartyResonance();
      await broadcastPartyResonance(resonance);
    } catch (rErr) {
      console.error('[cron/tick] resonance/broadcast failed:', rErr);
    }

    const durationMs = Date.now() - startedAt;
    console.log(`[cron/tick] done in ${durationMs}ms. processed=${processed} changed=${changed} errors=${errors}`);
    return NextResponse.json({
      ok: true,
      processed,
      changed,
      errors,
      durationMs,
      resonance,
      // Include first few error messages so the GitHub Action log is useful.
      ...(errorDetails.length > 0 ? { errorDetails: errorDetails.slice(0, 5) } : {}),
    });
  } catch (e) {
    const durationMs = Date.now() - startedAt;
    console.error('[cron/tick] FATAL:', e);
    return NextResponse.json({
      error: 'Internal error',
      message: e instanceof Error ? e.message : String(e),
      processed,
      changed,
      errors,
      durationMs,
    }, { status: 500 });
  }
}

// Also allow GET for manual testing (without secret). This is what you'd
// curl locally to verify the tick works.
export async function GET() {
  return POST(new NextRequest('http://localhost/api/cron/tick'));
}
