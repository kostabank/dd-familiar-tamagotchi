'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useFamiliar } from '@/hooks/use-familiar';
import { useStore } from '@/lib/store';
import { Dices, Gift, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const DICE_FACES = ['⚀','⚁','⚂','⚃','⚄','⚅'];

export function DailyBuffPanel() {
  const { claimBuff, refreshBuffs } = useFamiliar();
  const { buffs, familiar } = useStore();
  const [rolling, setRolling] = useState(false);
  const [face, setFace] = useState(0);
  const [justClaimed, setJustClaimed] = useState(false);

  useEffect(() => {
    refreshBuffs();
  }, [familiar?.stage, familiar?.coins, refreshBuffs]);

  const daily = buffs?.dailyClaim;
  const claimedToday = daily?.claimedToday ?? false;
  const buffText = buffs?.individualBuff;

  const handleClaim = async () => {
    if (claimedToday || rolling) return;
    setRolling(true);
    // Dice roll animation: cycle faces for ~1s.
    const start = Date.now();
    const interval = setInterval(() => {
      setFace((f) => (f + 1) % 6);
      if (Date.now() - start > 1000) {
        clearInterval(interval);
        setFace(Math.floor(Math.random() * 6));
      }
    }, 80);
    // Wait for animation, then claim.
    await new Promise((r) => setTimeout(r, 1100));
    const res = await claimBuff();
    setRolling(false);
    if (res?.claimed) {
      setJustClaimed(true);
      setTimeout(() => setJustClaimed(false), 3000);
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
