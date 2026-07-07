'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useStore, type PartyRosterEntry } from '@/lib/store';
import { SPECIES_INFO, STATE_INFO } from '@/lib/constants';
import { Users, Gift } from 'lucide-react';
import { GiftDialog } from './GiftDialog';

export function PartyRosterSidebar() {
  const { partyRoster, setPartyRoster, user } = useStore();
  const [giftTarget, setGiftTarget] = useState<PartyRosterEntry | null>(null);

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
    <>
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
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold truncate">
                            {p.characterName || p.username}
                            {isMe && <span className="text-arcane ml-1">(вы)</span>}
                          </div>
                          <div className="text-[10px] text-muted-foreground truncate">
                            {SPECIES_INFO[p.species]?.label} · {p.name} · С{p.stage}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: stateInfo.color, boxShadow: `0 0 8px ${stateInfo.color}` }}
                            title={stateInfo.label}
                          />
                          {!isMe && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={() => setGiftTarget(p)}
                              title={`Подарить ${p.characterName || p.username}`}
                            >
                              <Gift className="h-3.5 w-3.5 text-arcane" />
                            </Button>
                          )}
                        </div>
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

      {giftTarget && (
        <GiftDialog
          open={!!giftTarget}
          onClose={() => setGiftTarget(null)}
          toUsername={giftTarget.username}
          toCharacterName={giftTarget.characterName}
          toUserId={giftTarget.userId}
        />
      )}
    </>
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
