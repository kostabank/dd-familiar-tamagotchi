'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFamiliar } from '@/hooks/use-familiar';
import { useStore } from '@/lib/store';
import type { PlayerQuestDTO } from '@/lib/familiar-logic';
import { questMetricLabel } from '@/lib/familiar-logic';
import { ScrollText, Target, Coins, Wifi, CheckCircle2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export function QuestTrackerPanel() {
  const { fetchActiveQuest } = useFamiliar();
  const familiar = useStore((s) => s.familiar);
  const petEffect = useStore((s) => s.petEffect);
  const [quest, setQuest] = useState<PlayerQuestDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(async () => {
      if (cancelled) return;
      const q = await fetchActiveQuest();
      if (!cancelled) {
        setQuest(q);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
    // Re-fetch when familiar changes (actions progress the quest)
  }, [familiar?.energy, familiar?.mood, familiar?.sync, familiar?.coins, familiar?.stage, petEffect, fetchActiveQuest]);

  return (
    <Card className="arcane-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <ScrollText className="h-4 w-4 text-amber-400" /> Квест Мастера
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4 text-xs text-muted-foreground">Загрузка...</div>
        ) : !quest ? (
          <div className="text-center py-4 text-xs text-muted-foreground">
            <ScrollText className="h-8 w-8 mx-auto mb-2 opacity-30" />
            Мастер ещё не выдал квест.
            <br />Ожидай нового поручения!
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-sm font-semibold text-amber-300 leading-tight">{quest.title}</h4>
                <Badge variant="outline" className="border-amber-400/40 text-amber-400 shrink-0">
                  <Target className="h-3 w-3 mr-1" />
                  {questMetricLabel(quest.metric)}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1 leading-snug">{quest.description}</p>
            </div>

            {/* Progress bar */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">Прогресс</span>
                <span className="font-mono tabular-nums">
                  <span className={cn(quest.progress >= quest.goal && 'text-emerald-400')}>
                    {Math.min(quest.progress, quest.goal)}
                  </span>
                  <span className="text-muted-foreground">/{quest.goal}</span>
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden ring-1 ring-white/5">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    quest.progress >= quest.goal
                      ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
                      : 'bg-gradient-to-r from-amber-500 to-arcane'
                  )}
                  style={{ width: `${Math.min(100, (quest.progress / quest.goal) * 100)}%` }}
                />
              </div>
            </div>

            {/* Rewards */}
            <div className="flex items-center gap-3 pt-1 border-t border-white/5">
              <div className="flex items-center gap-1 text-xs">
                <Wifi className="h-3.5 w-3.5 text-arcane" />
                <span className="text-muted-foreground">+</span>
                <span className="font-mono text-arcane">{quest.syncReward} синхр.</span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <Coins className="h-3.5 w-3.5 text-amber-400" />
                <span className="text-muted-foreground">+</span>
                <span className="font-mono text-amber-400">{quest.coinReward} монет</span>
              </div>
              {quest.progress >= quest.goal && (
                <Badge className="ml-auto bg-emerald-500/20 text-emerald-400 border-emerald-500/40">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Готово!
                </Badge>
              )}
            </div>

            {quest.progress >= quest.goal && (
              <div className="text-[10px] text-center text-emerald-400 animate-pulse-glow flex items-center justify-center gap-1">
                <Sparkles className="h-3 w-3" /> Награда получена автоматически!
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
