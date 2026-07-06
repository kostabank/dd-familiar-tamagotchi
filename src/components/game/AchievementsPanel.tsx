'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFamiliar } from '@/hooks/use-familiar';
import { useStore } from '@/lib/store';
import type { AchievementDTO } from '@/lib/familiar-logic';
import { Trophy, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

const TIER_STYLES: Record<string, { ring: string; glow: string; label: string; labelColor: string }> = {
  bronze: { ring: 'border-amber-700/50', glow: 'shadow-[0_0_12px_-2px_rgba(180,83,9,0.5)]', label: 'Бронза', labelColor: 'text-amber-700' },
  silver: { ring: 'border-slate-400/50', glow: 'shadow-[0_0_12px_-2px_rgba(148,163,184,0.6)]', label: 'Серебро', labelColor: 'text-slate-300' },
  gold: { ring: 'border-amber-400/60', glow: 'shadow-[0_0_16px_-2px_rgba(251,191,36,0.7)]', label: 'Золото', labelColor: 'text-amber-400' },
};

export function AchievementsPanel() {
  const { fetchAchievements } = useFamiliar();
  const familiar = useStore((s) => s.familiar);
  const petEffect = useStore((s) => s.petEffect);
  const [data, setData] = useState<{ achievements: AchievementDTO[]; unlockedCount: number; total: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(async () => {
      if (cancelled) return;
      const d = await fetchAchievements();
      if (!cancelled) setData(d);
    });
    return () => { cancelled = true; };
    // Re-fetch when familiar changes (after actions that might unlock achievements)
  }, [familiar?.stage, familiar?.coins, familiar?.sync, familiar?.energy, familiar?.mood, petEffect, fetchAchievements]);

  const achievements = data?.achievements ?? [];
  const unlockedCount = data?.unlockedCount ?? 0;
  const total = data?.total ?? 0;
  const pct = total > 0 ? Math.round((unlockedCount / total) * 100) : 0;

  return (
    <Card className="arcane-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-400" /> Достижения
          <Badge variant="outline" className="ml-auto border-amber-400/40 text-amber-400">
            {unlockedCount}/{total}
          </Badge>
        </CardTitle>
        {/* Overall progress bar */}
        <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden mt-2">
          <div
            className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-yellow-300 transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-56 px-4 pb-4">
          {achievements.length === 0 ? (
            <div className="text-center py-6 text-xs text-muted-foreground">Загрузка...</div>
          ) : (
            <ul className="space-y-2">
              {achievements.map((a) => {
                const tier = TIER_STYLES[a.tier] || TIER_STYLES.bronze;
                const progressPct = Math.min(100, a.goal > 0 ? Math.round((a.progress / a.goal) * 100) : 0);
                return (
                  <li
                    key={a.id}
                    className={cn(
                      'rounded-lg border p-2.5 transition-all',
                      a.unlocked
                        ? `${tier.ring} bg-white/[0.05] ${tier.glow}`
                        : 'border-white/5 bg-white/[0.01] opacity-70'
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className={cn(
                        'h-9 w-9 shrink-0 rounded-lg flex items-center justify-center text-xl',
                        a.unlocked ? 'bg-white/10' : 'bg-white/[0.02] grayscale'
                      )}>
                        {a.unlocked ? a.icon : <Lock className="h-4 w-4 text-muted-foreground" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className={cn('text-xs font-semibold truncate', a.unlocked && 'text-amber-300')}>
                            {a.title}
                          </span>
                          <span className={cn('text-[9px] uppercase tracking-wide shrink-0', tier.labelColor)}>
                            {tier.label}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{a.description}</p>
                        {!a.unlocked && (
                          <div className="mt-1.5 flex items-center gap-1.5">
                            <div className="h-1 flex-1 rounded-full bg-white/5 overflow-hidden">
                              <div
                                className={cn('h-full transition-all', tier.labelColor.replace('text-', 'bg-'))}
                                style={{ width: `${progressPct}%` }}
                              />
                            </div>
                            <span className="text-[9px] text-muted-foreground font-mono tabular-nums shrink-0">
                              {Math.min(a.progress, a.goal)}/{a.goal}
                            </span>
                          </div>
                        )}
                        {a.unlocked && a.unlockedAt && (
                          <div className="text-[9px] text-emerald-400 mt-0.5">
                            ✓ {new Intl.DateTimeFormat('ru-RU', { timeZone: 'Europe/Moscow', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(a.unlockedAt))} МСК
                          </div>
                        )}
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
