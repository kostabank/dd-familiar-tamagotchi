// Helper to broadcast familiar updates to the Socket.io mini-service (port 3003)
// from Next.js API routes, so all connected clients (DM panel, other players)
// see changes immediately rather than waiting for the hourly cron tick.
import { io } from 'socket.io-client';
import type { FamiliarDTO, PartyResonance } from './types';

const SERVICE_URL = '/?XTransformPort=3003';

function emitToService(event: string, payload: unknown, waitFor?: string, timeoutMs = 3000): Promise<unknown | null> {
  return new Promise((resolve) => {
    const socket = io(SERVICE_URL, {
      transports: ['websocket'],
      reconnection: false,
      timeout: timeoutMs,
      forceNew: true,
    });
    let settled = false;
    const done = (val: unknown | null) => {
      if (settled) return;
      settled = true;
      try { socket.disconnect(); } catch { /* noop */ }
      resolve(val);
    };
    socket.on('connect', () => {
      if (waitFor) {
        socket.once(waitFor, (data: unknown) => done(data));
        socket.emit(event, payload);
      } else {
        socket.emit(event, payload);
        done(null);
      }
    });
    socket.on('connect_error', () => done(null));
    setTimeout(() => done(null), timeoutMs);
  });
}

export async function broadcastFamiliarUpdate(familiar: FamiliarDTO): Promise<void> {
  await emitToService('broadcast:update', { familiar });
}

export async function broadcastPartyResonance(resonance: PartyResonance): Promise<void> {
  await emitToService('broadcast:resonance', resonance);
}

export async function triggerGlobalEvent(event: 'storm' | 'festival', token: string): Promise<{ affected: number } | null> {
  const res = await emitToService('admin:event', { event, token }, 'admin:event:result', 5000);
  if (res && typeof res === 'object' && 'affected' in res) {
    return res as { affected: number };
  }
  return null;
}
