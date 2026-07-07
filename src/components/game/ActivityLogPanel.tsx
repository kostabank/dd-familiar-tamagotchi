'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFamiliar } from '@/hooks/use-familiar';
import { useStore } from '@/lib/store';
import type { InteractionLogDTO } from '@/lib/types';
import { History, Utensils, Gamepad2, Moon, Sun, Sparkles, Heart, Gift, CloudLightning, Wrench } from 'lucide-react';

const ACTION_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  feed: { label: 'Кормление', icon: <Utensils className="h-3.5 w-3.5" />, color: 'text-amber-400' },
  play: { label: 'Игра', icon: <Gamepad2 className="h-3.5 w-3.5" />, color: 'text-emerald-400' },
  pet: { label: 'Ласка', icon: <Heart className="h-3.5 w-3.5" />, color: 'text-pink-400' },
  sleep: { label: 'Уснул', icon: <Moon className="h-3.5 w-3.5" />, color: 'text-frost' },
  wake: { label: 'Проснулся', icon: <Sun className="h-3.5 w-3.5" />, color: 'text-yellow-400' },
  evolve: { label: 'Эволюция', icon: <Sparkles className="h-3.5 w-3.5" />, color: 'text-arcane' },
  claim_buff: { label: 'Бафф дня', icon: <Gift className="h-3.5 w-3.5" />, color: 'text-amber-300' },
  event: { label: 'Событие', icon: <CloudLightning className="h-3.5 w-3.5" />, color: 'text-red-400' },
  admin_edit: { label: 'Правка Мастера', icon: <Wrench className="h-3.5 w-3.5" />, color: 'text-muted-foreground' },
};

function fmtRelative(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}с назад`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}м назад`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}ч назад`;
  const days = Math.floor(h / 24);
  return `${days}д назад`;
}

export function ActivityLogPanel() {
  const { fetchLogs } = useFamiliar();
  const familiar = useStore((s) => s.familiar);
  const [logs, setLogs] = useState<InteractionLogDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const l = await fetchLogs();
    setLogs(l);
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;
    // Defer to avoid synchronous setState in the effect body.
    Promise.resolve().then(() => {
      if (!cancelled) load();
    });
    // Refresh every 20s + when familiar changes (after an action).
    const id = setInterval(load, 20000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [familiar?.id, familiar?.energy, familiar?.mood, familiar?.sync, familiar?.coins, familiar?.stage]);

  return (
    <Card className="arcane-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <History className="h-4 w-4 text-frost" /> Хроника
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-48 px-4 pb-4">
          {loading ? (
            <div className="text-center py-6 text-xs text-muted-foreground">Загрузка...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-6 text-xs text-muted-foreground">Пока пусто</div>
          ) : (
            <ul className="space-y-1.5">
              {logs.map((log) => {
                const meta = ACTION_META[log.actionType] || { label: log.actionType, icon: <History className="h-3.5 w-3.5" />, color: 'text-muted-foreground' };
                return (
                  <li key={log.id} className="flex items-start gap-2 text-xs py-1 border-b border-white/5 last:border-0">
                    <span className={`shrink-0 mt-0.5 ${meta.color}`}>{meta.icon}</span>
                    <div className="min-w-0 flex-1">
                      <span className={`font-medium ${meta.color}`}>{meta.label}</span>
                      {log.detail && (
                        <span className="text-muted-foreground ml-1 truncate">· {log.detail.slice(0, 60)}</span>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">{fmtRelative(log.timestamp)}</span>
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
