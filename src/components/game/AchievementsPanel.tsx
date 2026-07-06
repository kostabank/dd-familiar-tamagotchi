'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useFamiliar } from '@/hooks/use-familiar';
import { useStore } from '@/lib/store';
import type { AchievementDTO } from '@/lib/familiar-logic';
import { Trophy, Lock, Coins, Calendar, Target, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const TIER_STYLES: Record<string, { ring: string; glow: string; label: string; labelColor: string; reward: number }> = {
  bronze: { ring: 'border-amber-700/50', glow: 'shadow-[0_0_12px_-2px_rgba(180,83,9,0.5)]', label: 'Бронза', labelColor: 'text-amber-700', reward: 20 },
  silver: { ring: 'border-slate-400/50', glow: 'shadow-[0_0_12px_-2px_rgba(148,163,184,0.6)]', label: 'Серебро', labelColor: 'text-slate-300', reward: 50 },
  gold: { ring: 'border-amber-400/60', glow: 'shadow-[0_0_16px_-2px_rgba(251,191,36,0.7)]', label: 'Золото', labelColor: 'text-amber-400', reward: 150 },
};

const METRIC_LABELS: Record<string, string> = {
  evolutions: 'Эволюции',
  coins: 'Монеты',
  play_count: 'Игры',
  feed_count: 'Кормления',
  pet_count: 'Ласки',
  streak_days: 'Дни подряд',
  stage: 'Стадия',
  gift_count: 'Подарки',
};

export function AchievementsPanel() {
  const { fetchAchievements } = useFamiliar();
  const familiar = useStore((s) => s.familiar);
  const petEffect = useStore((s) => s.petEffect);
  const [data, setData] = useState<{ achievements: AchievementDTO[]; unlockedCount: number; total: number } | null>(null);
  const [selected, setSelected] = useState<AchievementDTO | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(async () => {
      if (cancelled) return;
      const d = await fetchAchievements();
      if (!cancelled) setData(d);
    });
    return () => { cancelled = true; };
  }, [familiar?.stage, familiar?.coins, familiar?.sync, familiar?.energy, familiar?.mood, petEffect, fetchAchievements]);

  const achievements = data?.achievements ?? [];
  const unlockedCount = data?.unlockedCount ?? 0;
  const total = data?.total ?? 0;
  const pct = total > 0 ? Math.round((unlockedCount / total) * 100) : 0;

  return (
    <>
      <Card className="arcane-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-400" /> Достижения
            <Badge variant="outline" className="ml-auto border-amber-400/40 text-amber-400">
              {unlockedCount}/{total}
            </Badge>
          </CardTitle>
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
                      onClick={() => setSelected(a)}
                      className={cn(
                        'rounded-lg border p-2.5 transition-all cursor-pointer hover:scale-[1.01] hover:border-arcane/40',
                        a.unlocked
                          ? `${tier.ring} bg-white/[0.05] ${tier.glow}`
                          : 'border-white/5 bg-white/[0.01] opacity-70 hover:opacity-100'
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

      <AchievementDetailDialog achievement={selected} onClose={() => setSelected(null)} />
    </>
  );
}

function AchievementDetailDialog({ achievement, onClose }: { achievement: AchievementDTO | null; onClose: () => void }) {
  if (!achievement) return null;
  const tier = TIER_STYLES[achievement.tier] || TIER_STYLES.bronze;
  const progressPct = Math.min(100, achievement.goal > 0 ? Math.round((achievement.progress / achievement.goal) * 100) : 0);
  const metricLabel = METRIC_LABELS[achievement.metric] || achievement.metric;

  return (
    <Dialog open={!!achievement} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className={cn(
              'h-12 w-12 rounded-xl flex items-center justify-center text-2xl',
              achievement.unlocked ? 'bg-white/10' : 'bg-white/[0.02] grayscale'
            )}>
              {achievement.unlocked ? achievement.icon : <Lock className="h-6 w-6 text-muted-foreground" />}
            </span>
            <div className="min-w-0">
              <div className="truncate">{achievement.title}</div>
              <span className={cn('text-[10px] uppercase tracking-wide', tier.labelColor)}>{tier.label}</span>
            </div>
          </DialogTitle>
          <DialogDescription className="pt-2">
            {achievement.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Status badge */}
          <div className="flex items-center justify-center">
            {achievement.unlocked ? (
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40">
                ✓ Разблокировано
              </Badge>
            ) : (
              <Badge variant="outline" className="border-amber-400/40 text-amber-400">
                <Lock className="h-3 w-3 mr-1" /> Заблокировано
              </Badge>
            )}
          </div>

          {/* Progress */}
          <div className="rounded-lg border border-white/8 bg-white/[0.02] p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <TrendingUp className="h-3.5 w-3.5" /> Прогресс
              </span>
              <span className="font-mono tabular-nums">
                <span className={cn(achievement.unlocked && 'text-emerald-400')}>
                  {Math.min(achievement.progress, achievement.goal)}
                </span>
                <span className="text-muted-foreground">/{achievement.goal}</span>
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  achievement.unlocked
                    ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
                    : 'bg-gradient-to-r from-amber-500 to-arcane'
                )}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-white/8 bg-white/[0.02] p-2.5">
              <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Target className="h-3 w-3" /> Метрика
              </div>
              <div className="text-xs font-medium mt-0.5">{metricLabel}</div>
            </div>
            <div className="rounded-lg border border-white/8 bg-white/[0.02] p-2.5">
              <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Coins className="h-3 w-3" /> Награда
              </div>
              <div className="text-xs font-medium mt-0.5 text-amber-400">+{tier.reward} монет</div>
            </div>
          </div>

          {/* Unlock date */}
          {achievement.unlocked && achievement.unlockedAt && (
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.05] p-2.5 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-emerald-400 shrink-0" />
              <div>
                <div className="text-[10px] text-muted-foreground">Дата разблокировки</div>
                <div className="text-xs font-medium text-emerald-400">
                  {new Intl.DateTimeFormat('ru-RU', {
                    timeZone: 'Europe/Moscow',
                    day: '2-digit', month: 'long', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  }).format(new Date(achievement.unlockedAt))} МСК
                </div>
              </div>
            </div>
          )}

          <Button onClick={onClose} className="w-full" variant="outline">
            Закрыть
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
