'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useFamiliar } from '@/hooks/use-familiar';
import { useStore } from '@/lib/store';
import { Dices, Gift, Check, Loader2, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StreakTier } from '@/lib/constants';

const DICE_FACES = ['⚀','⚁','⚂','⚃','⚄','⚅'];

interface StreakInfo {
  streak: number;
  tiers: StreakTier[];
  reachedTier: StreakTier | null;
  nextTier: StreakTier | null;
  daysToNext: number | null;
}

export function DailyBuffPanel() {
  const { claimBuff, refreshBuffs } = useFamiliar();
  const { buffs, familiar } = useStore();
  const [rolling, setRolling] = useState(false);
  const [face, setFace] = useState(0);
  const [justClaimed, setJustClaimed] = useState(false);
  const [streakInfo, setStreakInfo] = useState<StreakInfo | null>(null);

  useEffect(() => {
    refreshBuffs();
  }, [familiar?.stage, familiar?.coins, refreshBuffs]);

  // Fetch streak milestone info alongside the buff status.
  useEffect(() => {
    let cancelled = false;
    const load = () =>
      fetch('/api/familiar/streak', { credentials: 'same-origin' })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => { if (!cancelled && d) setStreakInfo(d); })
        .catch(() => {});
    load();
    const t = window.setInterval(load, 60_000);
    return () => { cancelled = true; window.clearInterval(t); };
  }, []);

  const daily = buffs?.dailyClaim;
  const claimedToday = daily?.claimedToday ?? false;
  const buffText = buffs?.individualBuff;
  const streak = streakInfo?.streak ?? 0;
  const tiers = streakInfo?.tiers ?? [];
  const reachedTier = streakInfo?.reachedTier;
  const nextTier = streakInfo?.nextTier;

  const handleClaim = async () => {
    if (claimedToday || rolling) return;
    setRolling(true);
    const start = Date.now();
    const interval = setInterval(() => {
      setFace((f) => (f + 1) % 6);
      if (Date.now() - start > 1000) {
        clearInterval(interval);
        setFace(Math.floor(Math.random() * 6));
      }
    }, 80);
    await new Promise((r) => setTimeout(r, 1100));
    const res = await claimBuff();
    setRolling(false);
    if (res?.claimed) {
      setJustClaimed(true);
      setTimeout(() => setJustClaimed(false), 3000);
      // Refresh streak info after claiming.
      fetch('/api/familiar/streak', { credentials: 'same-origin' })
        .then((r) => r.json())
        .then((d) => setStreakInfo(d))
        .catch(() => {});
    }
  };

  const nextClaimText = daily?.nextClaimAt
    ? new Intl.DateTimeFormat('ru-RU', {
        timeZone: 'Europe/Moscow',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(daily.nextClaimAt))
    : null;

  return (
    <Card className="arcane-border overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Gift className="h-4 w-4 text-amber-400" /> Бафф дня
          {streak > 0 && (
            <span className="ml-auto flex items-center gap-1 text-[11px] text-orange-400">
              <Flame className="h-3 w-3 flame-flicker" /> {streak} дн.
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-3">
          {/* Dice / result display */}
          <div className={cn(
            'relative h-16 w-16 shrink-0 rounded-xl flex items-center justify-center text-3xl font-bold transition-all',
            claimedToday
              ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-400'
              : rolling
              ? 'bg-arcane/20 border border-arcane/50 text-arcane animate-pulse'
              : 'bg-white/5 border border-white/10 text-muted-foreground'
          )}>
            {claimedToday ? (
              <Check className="h-7 w-7" />
            ) : (
              <span className={cn(rolling && 'animate-bounce')}>{DICE_FACES[face]}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            {buffText ? (
              <>
                <div className="text-xs text-muted-foreground">Текущий бафф (Стадия {familiar?.stage})</div>
                <div className="text-sm font-medium text-arcane leading-snug">{buffText}</div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">Бафф появится после создания фамильяра</div>
            )}
            {claimedToday && nextClaimText && (
              <div className="text-[10px] text-muted-foreground mt-1">
                Следующий в {nextClaimText} МСК · всего: {daily?.claimCount ?? 0}
              </div>
            )}
          </div>
        </div>

        {/* Streak milestone track */}
        {tiers.length > 0 && (
          <div className="rounded-lg bg-black/20 border border-white/5 p-2.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Серия активности</span>
              {reachedTier ? (
                <span className="text-[10px] font-medium" style={{ color: reachedTier.color }}>
                  {reachedTier.emoji} {reachedTier.label} · +{reachedTier.bonus} монет
                </span>
              ) : nextTier ? (
                <span className="text-[10px] text-muted-foreground">
                  до {nextTier.emoji} {nextTier.label}: {streakInfo?.daysToNext} дн.
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-1">
              {tiers.map((tier) => {
                const reached = streak >= tier.days;
                const isNext = nextTier?.days === tier.days;
                return (
                  <div key={tier.days} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className={cn(
                        'h-1.5 w-full rounded-full transition-all',
                        reached ? 'opacity-100' : 'bg-white/8',
                      )}
                      style={reached ? { backgroundColor: tier.color, boxShadow: `0 0 8px ${tier.color}80` } : {}}
                    />
                    <div className="flex items-center gap-0.5" title={`${tier.label}: ${tier.days} дн. = +${tier.bonus} монет`}>
                      <span className="text-[11px]" style={{ filter: reached ? 'none' : 'grayscale(0.7) opacity(0.5)' }}>{tier.emoji}</span>
                      <span
                        className={cn('text-[8px] font-mono', isNext && !reached && 'animate-pulse')}
                        style={{ color: reached ? tier.color : 'rgba(255,255,255,0.3)' }}
                      >
                        {tier.days}д
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            {reachedTier && !claimedToday && (
              <div className="mt-1.5 text-center text-[10px]" style={{ color: reachedTier.color }}>
                {reachedTier.emoji} При получении баффа дня: +{reachedTier.bonus} бонусных монет!
              </div>
            )}
          </div>
        )}

        <Button
          onClick={handleClaim}
          disabled={claimedToday || rolling}
          className={cn(
            'w-full font-semibold transition-all',
            claimedToday
              ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-gradient-to-r from-amber-500 to-arcane text-white hover:opacity-90'
          )}
        >
          {rolling ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Бросок костей...</>
          ) : claimedToday ? (
            <><Check className="h-4 w-4" /> Получено сегодня</>
          ) : reachedTier ? (
            <><Dices className="h-4 w-4" /> Получить бафф (+15 +{reachedTier.bonus} серии)</>
          ) : (
            <><Dices className="h-4 w-4" /> Получить бафф дня (+15 монет)</>
          )}
        </Button>

        {justClaimed && (
          <div className="text-center text-xs text-emerald-400 animate-pulse-glow">
            ✓ Бафф активирован на сегодня!
          </div>
        )}
      </CardContent>
    </Card>
  );
}
