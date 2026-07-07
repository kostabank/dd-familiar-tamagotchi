'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { questMetricLabel } from '@/lib/familiar-logic';
import { QUEST_TEMPLATES, type QuestTemplate } from '@/lib/constants';
import type { PlayerQuestDTO, QuestDTO } from '@/lib/familiar-logic';
import { ScrollText, Plus, History, Target, Coins, Wifi, LayoutTemplate } from 'lucide-react';
import { cn } from '@/lib/utils';

const METRICS = ['feed', 'play', 'pet', 'claim_buff', 'evolve'] as const;
type Metric = typeof METRICS[number];

export function DmQuestPanel() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [metric, setMetric] = useState<Metric>('feed');
  const [goal, setGoal] = useState(3);
  const [syncReward, setSyncReward] = useState(15);
  const [coinReward, setCoinReward] = useState(10);
  const [busy, setBusy] = useState(false);
  const [active, setActive] = useState<{ username: string; characterName: string | null; quest: PlayerQuestDTO }[]>([]);
  const [history, setHistory] = useState<QuestDTO[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const refresh = async () => {
    const [aRes, hRes] = await Promise.all([
      fetch('/api/admin/quests/list?mode=active', { credentials: 'same-origin' }),
      fetch('/api/admin/quests/list?mode=history', { credentials: 'same-origin' }),
    ]);
    if (aRes.ok) {
      const d = await aRes.json();
      setActive(d.active || []);
    }
    if (hRes.ok) {
      const d = await hRes.json();
      setHistory(d.quests || []);
    }
  };

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 15000);
    return () => clearInterval(id);
  }, []);

  const create = async () => {
    if (!title.trim() || !description.trim()) {
      toast.error('Заполни название и описание');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/admin/quests', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, metric, goal, syncReward, coinReward }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Не удалось создать квест');
        return;
      }
      toast.success(`Квест "${title}" выдан всем игрокам!`);
      setTitle('');
      setDescription('');
      setGoal(3);
      setSyncReward(15);
      setCoinReward(10);
      refresh();
    } finally {
      setBusy(false);
    }
  };

  const applyTemplate = (t: QuestTemplate) => {
    setTitle(t.title);
    setDescription(t.description);
    setMetric(t.metric as Metric);
    setGoal(t.goal);
    setSyncReward(t.syncReward);
    setCoinReward(t.coinReward);
    toast(`Шаблон "${t.title}" загружен`);
  };

  return (
    <Card className="arcane-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <ScrollText className="h-4 w-4 text-amber-400" /> Квесты партии
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-7 text-xs"
            onClick={() => setShowHistory((v) => !v)}
          >
            <History className="h-3.5 w-3.5" /> {showHistory ? 'Скрыть историю' : 'История'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Template selector */}
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <LayoutTemplate className="h-3 w-3" /> Шаблоны квестов
          </div>
          <div className="flex flex-wrap gap-1.5">
            {QUEST_TEMPLATES.map((t) => (
              <button
                key={t.title}
                type="button"
                onClick={() => applyTemplate(t)}
                className="px-2 py-1 rounded-md text-[10px] border border-white/10 bg-white/5 text-muted-foreground hover:border-amber-400/40 hover:text-amber-300 transition-all"
                title={`${t.title} — ${questMetricLabel(t.metric)} ×${t.goal}`}
              >
                {t.emoji} {t.title}
              </button>
            ))}
          </div>
        </div>

        {/* Creation form */}
        <div className="space-y-3 rounded-lg border border-amber-400/20 bg-amber-400/[0.03] p-3">
          <div className="space-y-1.5">
            <Label htmlFor="qt" className="text-xs">Название квеста</Label>
            <Input id="qt" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Напр. Утренний завтрак" className="h-8 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="qd" className="text-xs">Описание (лорное)</Label>
            <Textarea id="qd" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Фамильяр проголодался после ночного дозора..." className="text-sm min-h-[50px]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Тип действия</Label>
            <div className="flex flex-wrap gap-1.5">
              {METRICS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMetric(m)}
                  className={cn(
                    'px-2.5 py-1 rounded-md text-xs border transition-all',
                    metric === m
                      ? 'border-amber-400/60 bg-amber-400/15 text-amber-300'
                      : 'border-white/10 bg-white/5 text-muted-foreground hover:border-amber-400/30'
                  )}
                >
                  {questMetricLabel(m)}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Цель</span>
                <span className="font-mono text-amber-300">{goal}</span>
              </div>
              <Slider value={[goal]} min={1} max={10} step={1} onValueChange={(v) => setGoal(v[0])} />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Синхр.</span>
                <span className="font-mono text-arcane">+{syncReward}</span>
              </div>
              <Slider value={[syncReward]} min={5} max={50} step={5} onValueChange={(v) => setSyncReward(v[0])} />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Монеты</span>
                <span className="font-mono text-amber-400">+{coinReward}</span>
              </div>
              <Slider value={[coinReward]} min={5} max={100} step={5} onValueChange={(v) => setCoinReward(v[0])} />
            </div>
          </div>
          <Button onClick={create} disabled={busy} className="w-full bg-gradient-to-r from-amber-500 to-arcane">
            <Plus className="h-4 w-4" /> {busy ? 'Создаём...' : 'Выдать квест всем'}
          </Button>
        </div>

        {/* Active quests / history */}
        {showHistory ? (
          <div>
            <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <History className="h-3 w-3" /> История квестов ({history.length})
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto fantasy-scroll pr-1">
              {history.length === 0 ? (
                <div className="text-center text-xs text-muted-foreground py-3">Пока нет квестов</div>
              ) : history.map((q) => (
                <div key={q.id} className="rounded-md border border-white/5 bg-white/[0.02] p-2 text-xs">
                  <div className="font-semibold text-amber-300">{q.title}</div>
                  <div className="text-muted-foreground text-[10px] mt-0.5">
                    {questMetricLabel(q.metric)} ×{q.goal} · +{q.syncReward}синхр +{q.coinReward}м
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <Target className="h-3 w-3" /> Активные квесты игроков ({active.length})
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto fantasy-scroll pr-1">
              {active.length === 0 ? (
                <div className="text-center text-xs text-muted-foreground py-3">Нет активных квестов</div>
              ) : active.map((a) => (
                <div key={a.quest.playerQuestId} className="rounded-md border border-white/5 bg-white/[0.02] p-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold truncate">{a.characterName || a.username}</span>
                    <Badge variant="outline" className="text-[9px] shrink-0">
                      {a.quest.progress}/{a.quest.goal}
                    </Badge>
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate mt-0.5">{a.quest.title}</div>
                  <div className="h-1 w-full rounded-full bg-white/5 overflow-hidden mt-1">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-arcane"
                      style={{ width: `${Math.min(100, (a.quest.progress / a.quest.goal) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
