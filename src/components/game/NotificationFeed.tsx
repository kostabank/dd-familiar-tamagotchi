'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useStore } from '@/lib/store';
import {
  Bell, Sparkles, Gift, CloudLightning, PartyPopper, Wrench, Trophy, CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  severity: 'success' | 'info' | 'warning' | 'event';
  label: string;
  detail: string | null;
  timestamp: string;
}

const SEVERITY_META: Record<string, { icon: React.ReactNode; color: string; border: string }> = {
  success: { icon: <CheckCircle2 className="h-3.5 w-3.5" />, color: 'text-emerald-400', border: 'border-l-emerald-400' },
  info: { icon: <Gift className="h-3.5 w-3.5" />, color: 'text-amber-300', border: 'border-l-amber-300' },
  warning: { icon: <Wrench className="h-3.5 w-3.5" />, color: 'text-amber-400', border: 'border-l-amber-400' },
  event: { icon: <CloudLightning className="h-3.5 w-3.5" />, color: 'text-red-400', border: 'border-l-red-400' },
};

function fmtRelative(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}с`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}м`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}ч`;
  const days = Math.floor(h / 24);
  return `${days}д`;
}

export function NotificationFeed() {
  const familiar = useStore((s) => s.familiar);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch('/api/familiar/notifications', { credentials: 'same-origin' });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setNotifications(data.notifications || []);
        }
      } catch {
        /* noop */
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    Promise.resolve().then(load);
    const id = setInterval(load, 15000);
    return () => { cancelled = true; clearInterval(id); };
  }, [familiar?.coins, familiar?.stage, familiar?.sync, familiar?.energy, familiar?.mood]);

  return (
    <Card className="arcane-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Bell className="h-4 w-4 text-frost" /> Уведомления
          {notifications.length > 0 && (
            <span className="ml-auto text-[10px] text-muted-foreground font-normal">{notifications.length}</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-48 px-4 pb-4">
          {loading ? (
            <div className="text-center py-6 text-xs text-muted-foreground">Загрузка...</div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-6 text-xs text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
              Пока пусто
            </div>
          ) : (
            <ul className="space-y-1.5">
              {notifications.map((n) => {
                const meta = SEVERITY_META[n.severity] || SEVERITY_META.info;
                return (
                  <li
                    key={n.id}
                    className={cn(
                      'rounded-r-md border-l-2 border-white/5 bg-white/[0.02] py-1.5 px-2.5 text-xs flex items-start gap-2'
                    )}
                  >
                    <span className={cn('shrink-0 mt-0.5', meta.color)}>{meta.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className={cn('font-medium', meta.color)}>{n.label}</span>
                        <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">{fmtRelative(n.timestamp)}</span>
                      </div>
                      {n.detail && (
                        <p className="text-[10px] text-muted-foreground truncate mt-0.5">{n.detail}</p>
                      )}
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
