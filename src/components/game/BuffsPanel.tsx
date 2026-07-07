'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@/lib/store';
import type { BuffSummary } from '@/lib/types';
import { Shield, Swords, Heart, Zap, Users } from 'lucide-react';

export function BuffsPanel() {
  const { familiar, partyResonance, setPartyResonance, setBuffs } = useStore();
  const [localBuffs, setLocalBuffs] = useState<{
    individualBuff: string | null;
    debuff: string | null;
  } | null>(null);

  useEffect(() => {
    fetch('/api/familiar/buffs', { credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: BuffSummary | null) => {
        if (!d) return;
        setLocalBuffs({ individualBuff: d.individualBuff, debuff: d.debuff });
        setBuffs(d);
        // Use the server-computed resonance as a fallback if the socket
        // hasn't pushed one yet.
        if (d.partyResonance) setPartyResonance(d.partyResonance);
      })
      .catch(() => {});
  }, [familiar?.stage, familiar?.evolutionPath, familiar?.health, familiar?.coins, setBuffs, setPartyResonance]);

  const resonanceBuff = partyResonance?.buff;
  const avg = partyResonance?.averageMood ?? 0;

  return (
    <Card className="arcane-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Shield className="h-4 w-4 text-arcane" /> Баффы и Дебаффы
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2.5 text-sm">
        <BuffRow
          icon={<Zap className="h-4 w-4 text-arcane" />}
          label="Индивидуальный"
          value={localBuffs?.individualBuff}
          tone="buff"
        />
        <BuffRow
          icon={<Heart className="h-4 w-4 text-red-400" />}
          label="Дебаф"
          value={localBuffs?.debuff}
          tone="debuff"
        />
        <BuffRow
          icon={<Users className="h-4 w-4 text-frost" />}
          label="Резонанс партии"
          value={resonanceBuff}
          tone={resonanceBuff?.startsWith('+') ? 'buff' : resonanceBuff ? 'debuff' : 'neutral'}
          hint={`Среднее настроение: ${avg}%`}
        />
        {familiar?.evolutionPath && (
          <div className="pt-2 border-t border-white/5">
            <div className="text-xs text-muted-foreground">Путь эволюции</div>
            <Badge variant="outline" className="mt-1 border-arcane/50 text-arcane">
              {familiar.evolutionPath} · Стадия {familiar.stage}
            </Badge>
          </div>
        )}
        {familiar?.hiddenBuff && (
          <div className="text-xs text-muted-foreground italic">
            <Swords className="inline h-3 w-3 mr-1" />
            Раскрытый бафф: {familiar.hiddenBuff}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BuffRow({
  icon,
  label,
  value,
  tone,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null | undefined;
  tone: 'buff' | 'debuff' | 'neutral';
  hint?: string;
}) {
  const toneClass =
    tone === 'buff'
      ? 'text-emerald-400'
      : tone === 'debuff'
      ? 'text-red-400'
      : 'text-muted-foreground';
  return (
    <div className="flex items-start justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <span className="shrink-0">{icon}</span>
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground">{label}</div>
          {hint && <div className="text-[10px] text-muted-foreground/70">{hint}</div>}
        </div>
      </div>
      <div className={`text-right text-xs font-medium ${toneClass}`}>
        {value || '—'}
      </div>
    </div>
  );
}
