'use client';

import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useStore, type PartyRosterEntry } from '@/lib/store';
import { SPECIES_INFO, STATE_INFO } from '@/lib/constants';
import { Users } from 'lucide-react';

export function PartyRosterSidebar() {
  const { partyRoster, setPartyRoster, user } = useStore();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/party/roster', { credentials: 'same-origin' });
        if (res.ok) {
          const data = await res.json();
          setPartyRoster(data.roster as PartyRosterEntry[]);
        }
      } catch {
        /* noop */
      }
    };
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, [setPartyRoster]);

  return (
    <Card className="arcane-border h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Users className="h-4 w-4 text-frost" /> Партия
          <span className="ml-auto text-xs text-muted-foreground font-normal">{partyRoster.length} игр.</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100%-2.5rem)] px-4 pb-4" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          {partyRoster.length === 0 ? (
            <div className="text-center py-6 text-xs text-muted-foreground">Нет игроков</div>
          ) : (
            <ul className="space-y-2">
              {partyRoster.map((p) => {
                const isMe = p.username === user?.username;
                const stateInfo = STATE_INFO[p.state] || STATE_INFO.normal;
                return (
                  <li
                    key={p.username}
                    className={`rounded-lg border p-2 transition-all ${
                      isMe ? 'border-arcane/50 bg-arcane/10' : 'border-white/5 bg-white/[0.02]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs font-semibold truncate">
                          {p.characterName || p.username}
                          {isMe && <span className="text-arcane ml-1">(вы)</span>}
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate">
                          {SPECIES_INFO[p.species]?.label} · {p.name} · С{p.stage}
                        </div>
                      </div>
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: stateInfo.color, boxShadow: `0 0 8px ${stateInfo.color}` }}
                        title={stateInfo.label}
                      />
                    </div>
                    {/* Mini mood/energy bars */}
                    <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                      <MiniBar label=" Mood" value={p.mood} color="bg-emerald-500" />
                      <MiniBar label=" Energy" value={p.energy} color="bg-amber-500" />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function MiniBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-[8px] text-muted-foreground w-7 shrink-0">{label}</span>
      <div className="h-1 flex-1 rounded-full bg-white/5 overflow-hidden">
        <div className={`h-full ${color} transition-all`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
    </div>
  );
}
