'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useStore } from '@/lib/store';
import { SPECIES_INFO } from '@/lib/constants';
import { Trophy, Crown, Medal, Award, Coins, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  characterName: string | null;
  species: string;
  familiarName: string;
  stage: number;
  evolutionPath: string | null;
  coins: number;
  achievementsUnlocked: number;
  mood: number;
  energy: number;
}

const RANK_STYLES: Record<number, { icon: React.ReactNode; color: string; bg: string }> = {
  1: { icon: <Crown className="h-4 w-4" />, color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/40' },
  2: { icon: <Medal className="h-4 w-4" />, color: 'text-slate-300', bg: 'bg-slate-400/10 border-slate-400/40' },
  3: { icon: <Award className="h-4 w-4" />, color: 'text-amber-700', bg: 'bg-amber-700/10 border-amber-700/40' },
};

export function LeaderboardPanel() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const familiar = useStore((s) => s.familiar);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch('/api/party/leaderboard', { credentials: 'same-origin' });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setEntries(data.leaderboard || []);
        setCurrentUserId(data.currentUserId);
      } catch {
        /* noop */
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    Promise.resolve().then(load);
    const id = setInterval(load, 20000);
    return () => { cancelled = true; clearInterval(id); };
  }, [familiar?.coins, familiar?.stage, familiar?.mood, familiar?.energy]);

  return (
    <Card className="arcane-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-400" /> Лидерборд
          <span className="ml-auto text-xs text-muted-foreground font-normal">{entries.length} игр.</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-64 px-4 pb-4">
          {loading ? (
            <div className="text-center py-6 text-xs text-muted-foreground">Загрузка...</div>
          ) : entries.length === 0 ? (
            <div className="text-center py-6 text-xs text-muted-foreground">Нет игроков</div>
          ) : (
            <ul className="space-y-1.5">
              {entries.map((e) => {
                const isMe = e.userId === currentUserId;
                const rankStyle = RANK_STYLES[e.rank] || { icon: null, color: 'text-muted-foreground', bg: 'border-white/5 bg-white/[0.02]' };
                return (
                  <li
                    key={e.userId}
                    className={cn(
                      'rounded-lg border p-2 transition-all',
                      rankStyle.bg,
                      isMe && 'ring-1 ring-arcane/40'
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      {/* Rank badge */}
                      <div className={cn(
                        'h-7 w-7 shrink-0 rounded-full flex items-center justify-center text-xs font-bold',
                        e.rank <= 3 ? rankStyle.color : 'text-muted-foreground'
                      )}>
                        {e.rank <= 3 ? rankStyle.icon : e.rank}
                      </div>

                      {/* Player info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className={cn('text-xs font-semibold truncate', isMe && 'text-arcane')}>
                            {e.characterName || e.username}
                          </span>
                          {isMe && <span className="text-[9px] text-arcane">(вы)</span>}
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate">
                          {SPECIES_INFO[e.species]?.label} · {e.familiarName} · С{e.stage}
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-0.5 text-[10px]" title="Достижения">
                          <Star className="h-3 w-3 text-amber-400" />
                          <span className="font-mono tabular-nums">{e.achievementsUnlocked}</span>
                        </div>
                        <div className="flex items-center gap-0.5 text-[10px]" title="Монеты">
                          <Coins className="h-3 w-3 text-amber-400" />
                          <span className="font-mono tabular-nums">{e.coins}</span>
                        </div>
                      </div>
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
