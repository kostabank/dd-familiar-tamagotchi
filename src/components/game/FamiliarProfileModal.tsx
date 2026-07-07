'use client';

import { useEffect, useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useStore } from '@/lib/store';
import { STAT_BAR_META } from '@/lib/constants';
import { Battery, Smile, BatteryLow, HeartPulse, Wifi, Coins, Calendar, Sparkles, Trophy, BookOpen, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileData {
  familiar: {
    id: string;
    species: string;
    name: string;
    stage: number;
    evolutionPath: string | null;
    hiddenBuff: string | null;
    energy: number;
    mood: number;
    fatigue: number;
    health: number;
    sync: number;
    coins: number;
    accentColor: string | null;
    bio: string | null;
    state: string;
  };
  speciesInfo: { label: string; emoji: string; tagline: string; accent: string };
  achievements: {
    unlockedCount: number;
    total: number;
    recent: { icon: string; title: string; tier: string }[];
  };
  logs: { id: string; actionType: string; detail: string | null; timestamp: string }[];
  evolutionHistory: { detail: string; timestamp: string }[];
  createdAt: string;
}

const ACTION_LABELS: Record<string, string> = {
  feed: 'Кормление',
  play: 'Игра',
  pet: 'Ласка',
  sleep: 'Сон',
  wake: 'Пробуждение',
  evolve: 'Эволюция',
  claim_buff: 'Бафф/Награда',
  event: 'Событие Мастера',
  admin_edit: 'Правка Мастера',
};

const ACTION_COLORS: Record<string, string> = {
  feed: 'text-amber-400',
  play: 'text-emerald-400',
  pet: 'text-pink-400',
  sleep: 'text-frost',
  wake: 'text-yellow-400',
  evolve: 'text-arcane',
  claim_buff: 'text-amber-300',
  event: 'text-red-400',
  admin_edit: 'text-muted-foreground',
};

export function FamiliarProfileModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const familiar = useStore((s) => s.familiar);
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    Promise.resolve().then(async () => {
      try {
        const res = await fetch('/api/familiar/profile', { credentials: 'same-origin' });
        if (res.ok) {
          const d = await res.json();
          if (!cancelled) setData(d);
        }
      } catch {
        /* noop */
      } finally {
        if (!cancelled) setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [open]);

  const accent = familiar?.accentColor || data?.speciesInfo.accent || '#A855F7';

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="pb-3">
          <DialogTitle className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center text-lg font-bold shrink-0"
              style={{ background: `${accent}25`, border: `1px solid ${accent}50`, color: accent }}
            >
              {data?.speciesInfo.emoji || '◈'}
            </div>
            <div className="min-w-0">
              <div className="truncate">{familiar?.name || 'Фамильяр'}</div>
              <div className="text-xs font-normal text-muted-foreground">
                {data?.speciesInfo.label} · Стадия {familiar?.stage || 1}
              </div>
            </div>
            <Button variant="ghost" size="sm" className="ml-auto h-7 w-7 p-0" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <DialogDescription className="sr-only">Профиль фамильяра</DialogDescription>
        </DialogHeader>

        {loading || !data ? (
          <div className="py-12 text-center text-sm text-muted-foreground">Загрузка профиля...</div>
        ) : (
          <ScrollArea className="max-h-[calc(90vh-100px)] pr-2">
            <div className="space-y-4">
              {/* Bio */}
              {data.familiar.bio && (
                <div className="rounded-lg border border-white/8 bg-white/[0.02] p-3">
                  <div className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                    <BookOpen className="h-3 w-3" /> Био
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{data.familiar.bio}</p>
                </div>
              )}

              {/* Stats grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <StatTile label="Энергия" value={data.familiar.energy} icon={<Battery className="h-3.5 w-3.5" />} />
                <StatTile label="Настроение" value={data.familiar.mood} icon={<Smile className="h-3.5 w-3.5" />} />
                <StatTile label="Усталость" value={data.familiar.fatigue} icon={<BatteryLow className="h-3.5 w-3.5" />} />
                <StatTile label="Здоровье" value={data.familiar.health} icon={<HeartPulse className="h-3.5 w-3.5" />} />
                <StatTile label="Синхр." value={data.familiar.sync} icon={<Wifi className="h-3.5 w-3.5" />} />
                <StatTile label="Монеты" value={data.familiar.coins} icon={<Coins className="h-3.5 w-3.5" />} />
              </div>

              {/* Evolution + buff */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="rounded-lg border border-white/8 bg-white/[0.02] p-3">
                  <div className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                    <Sparkles className="h-3 w-3" /> Путь эволюции
                  </div>
                  <div className="text-sm font-medium">
                    {data.familiar.evolutionPath || 'Не эволюционировал'}
                  </div>
                  {data.familiar.hiddenBuff && (
                    <div className="text-[10px] text-arcane mt-0.5">{data.familiar.hiddenBuff}</div>
                  )}
                </div>
                <div className="rounded-lg border border-white/8 bg-white/[0.02] p-3">
                  <div className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                    <Trophy className="h-3 w-3" /> Достижения
                  </div>
                  <div className="text-sm font-medium">
                    {data.achievements.unlockedCount} / {data.achievements.total}
                  </div>
                  {data.achievements.recent.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {data.achievements.recent.map((a, i) => (
                        <span key={i} className="text-base" title={a.title}>{a.icon}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Creation date */}
              <div className="rounded-lg border border-white/8 bg-white/[0.02] p-3 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">Создан</div>
                  <div className="text-sm">
                    {new Intl.DateTimeFormat('ru-RU', {
                      timeZone: 'Europe/Moscow',
                      day: '2-digit', month: 'long', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    }).format(new Date(data.createdAt))} МСК
                  </div>
                </div>
              </div>

              {/* Evolution history */}
              {data.evolutionHistory.length > 0 && (
                <div>
                  <div className="text-xs text-muted-foreground mb-2">История эволюции</div>
                  <div className="space-y-1">
                    {data.evolutionHistory.map((e, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs rounded-md border border-white/5 bg-white/[0.01] px-2 py-1.5">
                        <Sparkles className="h-3 w-3 text-arcane shrink-0" />
                        <span className="text-foreground/80 flex-1 truncate">{e.detail}</span>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {new Intl.DateTimeFormat('ru-RU', { timeZone: 'Europe/Moscow', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(e.timestamp))} МСК
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent activity */}
              <div>
                <div className="text-xs text-muted-foreground mb-2">Недавняя активность</div>
                <div className="space-y-1">
                  {data.logs.map((log) => (
                    <div key={log.id} className="flex items-center gap-2 text-xs rounded-md border border-white/5 bg-white/[0.01] px-2 py-1.5">
                      <span className={cn('font-medium shrink-0', ACTION_COLORS[log.actionType] || 'text-muted-foreground')}>
                        {ACTION_LABELS[log.actionType] || log.actionType}
                      </span>
                      {log.detail && <span className="text-muted-foreground flex-1 truncate">{log.detail}</span>}
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {new Intl.DateTimeFormat('ru-RU', { timeZone: 'Europe/Moscow', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(log.timestamp))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}

function StatTile({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  const color = value < 30 ? 'text-red-400' : value < 60 ? 'text-amber-400' : 'text-emerald-400';
  return (
    <div className="rounded-lg border border-white/8 bg-white/[0.02] p-2.5">
      <div className="text-[10px] text-muted-foreground flex items-center gap-1">{icon} {label}</div>
      <div className={cn('text-lg font-bold font-mono tabular-nums', color)}>{value}</div>
    </div>
  );
}
