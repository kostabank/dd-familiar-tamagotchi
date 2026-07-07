/**
 * Familiar Service — Socket.io mini-service for D&D Familiar Tamagotchi.
 *
 * Responsibilities:
 *  - Run an hourly cron tick (Europe/Moscow time) that applies decay to every familiar.
 *  - Broadcast `familiar:update` to all clients when stats change.
 *  - Broadcast `party:resonance` after each tick.
 *  - Accept `subscribe` from clients and immediately send current state.
 *  - Accept `admin:event` ({ event: 'storm' | 'festival', token }) to apply global events.
 *
 * Port: 3003 (hardcoded — Caddy forwards `XTransformPort=3003` here).
 * DB:   shared SQLite via Prisma — reuses parent project's lib (familiar-logic, db, constants, types).
 */

import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cron from 'node-cron';
import { DateTime } from 'luxon';

// Reuse parent project's lib via relative paths. Bun resolves transitive
// imports (including @prisma/client) from the parent node_modules automatically.
import { db } from '../../src/lib/db';
import { applyDecay, toFamiliarDTO, nowMoscow, computePartyResonance } from '../../src/lib/familiar-logic';
import { clamp } from '../../src/lib/constants';
import type { FamiliarDTO, PartyResonance, GlobalEventResult } from '../../src/lib/types';

const PORT = 3003;
const MOSCOW_ZONE = 'Europe/Moscow';
const ADMIN_SECRET = process.env.ADMIN_EVENT_SECRET ?? 'dnd-event-secret';

const log = (...args: unknown[]) => console.log('[familiar-service]', ...args);
const errLog = (...args: unknown[]) => console.error('[familiar-service]', ...args);

// ---------------------------------------------------------------------------
// HTTP + Socket.io server
// ---------------------------------------------------------------------------

const httpServer = createServer();
const io = new Server(httpServer, {
  // Caddy relies on path '/' + XTransformPort query to route here.
  path: '/',
  cors: { origin: '*', methods: ['GET', 'POST'] },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// ---------------------------------------------------------------------------
// Tick logic — applies decay to ALL familiars using Europe/Moscow time.
// ---------------------------------------------------------------------------

interface TickResult {
  processed: number;
  changed: number;
  updatedFamiliars: FamiliarDTO[];
  resonance: PartyResonance;
}

async function runTick(): Promise<TickResult> {
  const mskIso = nowMoscow().toISO();
  log(`[MSK tick] running at ${mskIso}`);

  let familiars: Awaited<ReturnType<typeof db.familiar.findMany>> = [];
  try {
    familiars = await db.familiar.findMany();
  } catch (e) {
    errLog('[MSK tick] failed to fetch familiars:', e);
    return { processed: 0, changed: 0, updatedFamiliars: [], resonance: { averageMood: 0, playerCount: 0, buff: null } };
  }

  const updatedFamiliars: FamiliarDTO[] = [];
  let changedCount = 0;

  for (const f of familiars) {
    try {
      const decayed = applyDecay(f);

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
            : (typeof decayed.sleepStartedAt === 'string'
                ? new Date(decayed.sleepStartedAt)
                : null),
          lastTick: decayed.lastTick,
        },
      });

      const dto = toFamiliarDTO(updated);
      updatedFamiliars.push(dto);

      if (decayed.changed) {
        changedCount++;
        io.emit('familiar:update', { familiar: dto, userId: f.userId });
        log(`[MSK tick] updated familiar ${f.id} (${f.name}) -> E:${dto.energy} M:${dto.mood} F:${dto.fatigue} H:${dto.health} sleep:${dto.isSleeping}`);
      }
    } catch (e) {
      errLog(`[MSK tick] failed to process familiar ${f.id}:`, e);
    }
  }

  // Party resonance — average mood across all familiars.
  let resonance: PartyResonance = { averageMood: 0, playerCount: 0, buff: null };
  try {
    resonance = await computePartyResonance();
  } catch (e) {
    errLog('[MSK tick] failed to compute party resonance:', e);
  }
  io.emit('party:resonance', resonance);

  log(`[MSK tick] done. processed=${familiars.length} changed=${changedCount} resonance=avg:${resonance.averageMood} players:${resonance.playerCount} buff:${resonance.buff ?? 'none'}`);
  return { processed: familiars.length, changed: changedCount, updatedFamiliars, resonance };
}

// ---------------------------------------------------------------------------
// Admin global events — storm / festival.
// ---------------------------------------------------------------------------

async function applyGlobalEvent(event: 'storm' | 'festival'): Promise<GlobalEventResult> {
  log(`[admin:event] received '${event}'`);
  const familiars = await db.familiar.findMany();
  let affected = 0;

  for (const f of familiars) {
    try {
      const data =
        event === 'storm'
          ? { energy: clamp(f.energy - 20) }
          : { mood: clamp(f.mood + 50) };

      await db.familiar.update({ where: { id: f.id }, data });

      await db.interactionLog.create({
        data: {
          familiarId: f.id,
          userId: f.userId,
          actionType: 'event',
          detail: `global_event:${event}`,
        },
      });

      affected++;
    } catch (e) {
      errLog(`[admin:event] failed for familiar ${f.id}:`, e);
    }
  }

  // Broadcast refreshed familiar state to everyone.
  const refreshed = await db.familiar.findMany();
  for (const f of refreshed) {
    const dto = toFamiliarDTO(f);
    io.emit('familiar:update', { familiar: dto, userId: f.userId });
  }

  const resonance = await computePartyResonance();
  io.emit('party:resonance', resonance);

  const payload = {
    event,
    affected,
    timestamp: nowMoscow().toISO(),
  };
  io.emit('admin:event', payload);
  log(`[admin:event] ${event} applied to ${affected} familiars`);
  return { event, affected };
}

// ---------------------------------------------------------------------------
// Connection handlers
// ---------------------------------------------------------------------------

io.on('connection', (socket: Socket) => {
  log(`client connected: ${socket.id}`);

  // On subscribe, immediately send current state of all familiars + party resonance.
  socket.on('subscribe', async () => {
    try {
      const familiars = await db.familiar.findMany();
      for (const f of familiars) {
        const dto = toFamiliarDTO(f);
        socket.emit('familiar:update', { familiar: dto, userId: f.userId });
      }
      const resonance = await computePartyResonance();
      socket.emit('party:resonance', resonance);
      log(`sent initial state to ${socket.id}: ${familiars.length} familiars`);
    } catch (e) {
      errLog(`subscribe failed for ${socket.id}:`, e);
    }
  });

  // Broadcast a single familiar update to all clients (used by Next.js API
  // routes after feed/play/sleep/evolve/admin-edit so everyone sees it live).
  socket.on('broadcast:update', (payload: { familiar: FamiliarDTO }) => {
    if (payload?.familiar) {
      io.emit('familiar:update', { familiar: payload.familiar, userId: payload.familiar.userId });
    }
  });

  // Broadcast a party resonance refresh.
  socket.on('broadcast:resonance', (resonance: PartyResonance) => {
    if (resonance) io.emit('party:resonance', resonance);
  });

  // Admin global event trigger.
  socket.on('admin:event', async (payload: { event: 'storm' | 'festival'; token?: string }) => {
    try {
      if (!payload || (payload.event !== 'storm' && payload.event !== 'festival')) {
        socket.emit('admin:event:result', { error: 'invalid event type', timestamp: nowMoscow().toISO() });
        return;
      }
      // Lightweight shared-secret check (dev-friendly: trust if absent).
      if (payload.token && payload.token !== ADMIN_SECRET) {
        socket.emit('admin:event:result', { error: 'unauthorized', timestamp: nowMoscow().toISO() });
        return;
      }
      const result = await applyGlobalEvent(payload.event);
      socket.emit('admin:event:result', { ...result, timestamp: nowMoscow().toISO() });
    } catch (e) {
      errLog('admin:event handler failed:', e);
      socket.emit('admin:event:result', { error: 'internal', timestamp: nowMoscow().toISO() });
    }
  });

  socket.on('disconnect', (reason) => {
    log(`client disconnected: ${socket.id} (${reason})`);
  });

  socket.on('error', (error) => {
    errLog(`socket error (${socket.id}):`, error);
  });
});

// ---------------------------------------------------------------------------
// Cron schedule — hourly at minute 0, Europe/Moscow semantics via luxon.
// ---------------------------------------------------------------------------

cron.schedule('0 * * * *', async () => {
  try {
    await runTick();
  } catch (e) {
    errLog('cron tick crashed:', e);
  }
});

log(`cron scheduled: '0 * * * *' (hourly, ${MOSCOW_ZONE} semantics via luxon)`);

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

httpServer.listen(PORT, () => {
  log(`WebSocket server running on port ${PORT}`);
  // Run an initial tick immediately so decay is current when the service starts.
  setTimeout(async () => {
    try {
      await runTick();
    } catch (e) {
      errLog('startup tick crashed:', e);
    }
  }, 1000);
});

// Graceful shutdown
const shutdown = (signal: string) => {
  log(`received ${signal}, shutting down...`);
  httpServer.close(() => {
    log('http server closed');
    io.close(() => {
      log('socket.io closed');
      process.exit(0);
    });
  });
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
