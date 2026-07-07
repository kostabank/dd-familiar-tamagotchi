import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { applyDecay, toFamiliarDTO, computePartyResonance } from '@/lib/familiar-logic';
import { broadcastFamiliarUpdate, broadcastPartyResonance } from '@/lib/supabase';

// POST /api/cron/tick — Vercel Cron calls this every hour.
// Applies decay to ALL familiars using Europe/Moscow time logic.
// Protected by CRON_SECRET header (Vercel automatically sends it).
export async function POST(req: NextRequest) {
  // Verify cron secret (Vercel sends it as Authorization: Bearer <secret>).
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('[cron/tick] running at', new Date().toISOString());
    const familiars = await db.familiar.findMany();
    let changed = 0;

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
        await broadcastFamiliarUpdate(toFamiliarDTO(updated));
        console.log(`[cron/tick] updated ${f.name} -> E:${decayed.energy} M:${decayed.mood} F:${decayed.fatigue} H:${decayed.health}`);
      } catch (e) {
        console.error(`[cron/tick] failed for ${f.id}:`, e);
      }
    }

    const resonance = await computePartyResonance();
    await broadcastPartyResonance(resonance);
    console.log(`[cron/tick] done. processed=${familiars.length} changed=${changed}`);
    return NextResponse.json({ ok: true, processed: familiars.length, changed, resonance });
  } catch (e) {
    console.error('[cron/tick]', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// Also allow GET for manual testing (without secret).
export async function GET() {
  return POST(new NextRequest('http://localhost/api/cron/tick'));
}
