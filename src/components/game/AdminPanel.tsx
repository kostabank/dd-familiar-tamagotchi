'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { useAuth } from '@/hooks/use-auth';
import { useStore } from '@/lib/store';
import { useSocket } from '@/hooks/use-socket';
import { toast } from 'sonner';
import { SPECIES_INFO, STATE_INFO } from '@/lib/constants';
import type { AdminFamiliarRow, FamiliarDTO } from '@/lib/types';
import { CloudLightning, PartyPopper, LogOut, RefreshCw, Users } from 'lucide-react';
import { LiveClock } from './LiveClock';
import { AmbientBackground } from './AmbientBackground';

export function AdminPanel() {
  const { doLogout } = useAuth();
  useSocket();
  const { partyResonance } = useStore();
  const [rows, setRows] = useState<AdminFamiliarRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<Record<string, Partial<FamiliarDTO>>>({});

  const refresh = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/familiars', { credentials: 'same-origin' });
    if (res.ok) {
      const data = await res.json();
      setRows(data.familiars);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 15000);
    return () => clearInterval(t);
  }, [refresh]);

  // Listen for socket updates to refresh the table live.
  useEffect(() => {
    const unsub = useStore.subscribe((s, prev) => {
      if (s.familiar !== prev.familiar) refresh();
    });
    return unsub;
  }, [refresh]);

  const handleEvent = async (event: 'storm' | 'festival') => {
    setBusy(true);
    try {
      const res = await fetch('/api/admin/event', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Событие не удалось');
        return;
      }
      toast.success(
        event === 'storm' ? 'Магическая Буря обрушилась!' : 'Праздник начался!',
        { description: `Затронуто: ${data.affected}` }
      );
      setTimeout(refresh, 800);
    } finally {
      setBusy(false);
    }
  };

  const patchFamiliar = async (id: string, patch: Record<string, number | boolean>) => {
    const res = await fetch(`/api/admin/familiars/${id}`, {
      method: 'PATCH',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      const d = await res.json();
      toast.error(d.error || 'Не удалось изменить');
      return;
    }
    const data = await res.json();
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...data.familiar } : r)));
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AmbientBackground />
      <header className="border-b border-arcane/15 bg-card/40 backdrop-blur sticky top-0 z-20">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-red-600 to-arcane flex items-center justify-center font-bold text-sm">
              DM
            </div>
            <div>
              <div className="font-semibold">Панель Мастера</div>
              <div className="text-xs text-muted-foreground">Управление фамильярами партии</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LiveClock />
            <Button variant="ghost" size="sm" onClick={refresh} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Обновить
            </Button>
            <Button variant="ghost" size="sm" onClick={doLogout}>
              <LogOut className="h-4 w-4" /> Выйти
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto max-w-7xl w-full p-3 md:p-4 space-y-4">
        {/* Global event bar */}
        <Card className="arcane-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-frost" /> Глобальные события
              {partyResonance && (
                <Badge variant="outline" className="ml-auto">
                  Игроков: {partyResonance.playerCount} · Ср. настроение: {partyResonance.averageMood}%
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button
              onClick={() => handleEvent('storm')}
              disabled={busy}
              className="bg-gradient-to-r from-red-600 to-purple-700"
            >
              <CloudLightning className="h-4 w-4" /> Магическая Буря (−20 энергии всем)
            </Button>
            <Button
              onClick={() => handleEvent('festival')}
              disabled={busy}
              className="bg-gradient-to-r from-amber-500 to-emerald-500 text-black"
            >
              <PartyPopper className="h-4 w-4" /> Праздник (+50 настроения всем)
            </Button>
          </CardContent>
        </Card>

        {/* Players table */}
        <Card className="arcane-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Фамильяры партии</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && rows.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Загрузка...</div>
            ) : rows.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Нет игроков с фамильярами</div>
            ) : (
              <div className="space-y-3 max-h-[65vh] overflow-y-auto fantasy-scroll pr-1">
                {rows.map((r) => (
                  <PlayerRow key={r.id} row={r} onPatch={patchFamiliar} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <footer className="mt-auto border-t border-arcane/15 bg-card/30">
        <div className="mx-auto max-w-7xl px-4 py-3 text-xs text-muted-foreground">
          D&D Familiar Tamagotchi · Мастер-панель · Изменения применяются в реальном времени
        </div>
      </footer>
    </div>
  );
}

function PlayerRow({
  row,
  onPatch,
}: {
  row: AdminFamiliarRow;
  onPatch: (id: string, patch: Record<string, number | boolean>) => Promise<void>;
}) {
  const stateInfo = STATE_INFO[row.state];
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="font-semibold">{row.username}</div>
        {row.characterName && (
          <span className="text-xs text-muted-foreground">({row.characterName})</span>
        )}
        <Badge variant="outline" className="border-arcane/40 text-arcane">
          {SPECIES_INFO[row.species].label}
        </Badge>
        <Badge variant="outline">Стадия {row.stage}</Badge>
        {row.evolutionPath && (
          <Badge variant="outline" className="border-frost/40 text-frost">{row.evolutionPath}</Badge>
        )}
        <Badge
          className="ml-auto"
          style={{ backgroundColor: `${stateInfo.color}25`, color: stateInfo.color }}
        >
          {stateInfo.label}
        </Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatSlider label="Энергия" value={row.energy} color="#f97316" onChange={(v) => onPatch(row.id, { energy: v })} />
        <StatSlider label="Настроение" value={row.mood} color="#22c55e" onChange={(v) => onPatch(row.id, { mood: v })} />
        <StatSlider label="Усталость" value={row.fatigue} color="#A855F7" onChange={(v) => onPatch(row.id, { fatigue: v })} />
        <StatSlider label="Здоровье" value={row.health} color="#ef4444" onChange={(v) => onPatch(row.id, { health: v })} />
        <StatSlider label="Синхр." value={row.sync} color="#3B82F6" onChange={(v) => onPatch(row.id, { sync: v })} />
      </div>

      <div className="flex flex-wrap gap-2 mt-3">
        <Button
          size="sm"
          variant={row.isSleeping ? 'default' : 'outline'}
          onClick={() => onPatch(row.id, { isSleeping: !row.isSleeping })}
        >
          {row.isSleeping ? 'Разбудить' : 'Усыпить'}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onPatch(row.id, { stage: row.stage >= 3 ? 1 : row.stage + 1 })}
        >
          Стадия →
        </Button>
        <Button size="sm" variant="outline" onClick={() => onPatch(row.id, { energy: 100, mood: 100, health: 100, fatigue: 0 })}>
          Полное исцеление
        </Button>
      </div>
    </div>
  );
}

function StatSlider({
  label,
  value,
  color,
  onChange,
}: {
  label: string;
  value: number;
  color: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono tabular-nums" style={{ color }}>
          {value}
        </span>
      </div>
      <Slider
        value={[value]}
        min={0}
        max={100}
        step={1}
        onValueChange={(v) => onChange(v[0])}
        className="[&_[role=slider]]:border-arcane"
      />
    </div>
  );
}
