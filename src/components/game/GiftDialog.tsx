'use client';

import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStore } from '@/lib/store';
import { toast } from 'sonner';
import { sound } from '@/lib/sound';
import { GIFT_TYPES } from '@/lib/constants';
import type { GiftType } from '@/lib/constants';
import type { AchievementDTO } from '@/lib/familiar-logic';
import { Gift, Coins, Heart, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GiftDialogProps {
  open: boolean;
  onClose: () => void;
  toUsername: string;
  toCharacterName: string | null;
  toUserId: string;
}

export function GiftDialog({ open, onClose, toUsername, toCharacterName, toUserId }: GiftDialogProps) {
  const { familiar, setFamiliar } = useStore();
  const [selected, setSelected] = useState<GiftType | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const send = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      const res = await fetch('/api/familiar/gift', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toUserId, giftType: selected.code, message: message.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        sound.play('error');
        toast.error(data.error || 'Не удалось отправить подарок');
        return;
      }
      setFamiliar(data.familiar);
      sound.play('quest');
      // Announce achievement unlocks if any.
      if (data.newAchievements?.length > 0) {
        for (const a of data.newAchievements as AchievementDTO[]) {
          const reward = a.tier === 'gold' ? 150 : a.tier === 'silver' ? 50 : 20;
          sound.play('achievement');
          toast.success(`🏆 Достижение: ${a.title}`, {
            description: `${a.icon} ${a.description} · +${reward} монет`,
            duration: 6000,
          });
        }
      }
      toast.success(`Подарок отправлен: ${selected.emoji} ${selected.label} → ${data.gift.recipientUsername}`, {
        description: `−${selected.coinCost} монет, +${selected.moodBoost} настроения получателю`,
      });
      onClose();
      setSelected(null);
      setMessage('');
    } finally {
      setBusy(false);
    }
  };

  const displayName = toCharacterName || toUsername;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-arcane" /> Подарок для {displayName}
          </DialogTitle>
          <DialogDescription>
            Выбери подарок — он поднимет настроение и синхронизацию фамильяра игрока.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Gift type picker */}
          <div className="space-y-2">
            {GIFT_TYPES.map((g) => {
              const canAfford = (familiar?.coins ?? 0) >= g.coinCost;
              const isSelected = selected?.code === g.code;
              return (
                <button
                  key={g.code}
                  type="button"
                  disabled={!canAfford || busy}
                  onClick={() => setSelected(g)}
                  className={cn(
                    'w-full rounded-lg border p-3 text-left transition-all',
                    isSelected
                      ? 'border-arcane/60 bg-arcane/10 glow-arcane'
                      : canAfford
                      ? 'border-white/10 bg-white/[0.02] hover:border-arcane/40'
                      : 'border-white/5 bg-white/[0.01] opacity-50 cursor-not-allowed'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{g.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-sm font-semibold">{g.label}</span>
                        <span className={cn('text-xs font-mono flex items-center gap-0.5', canAfford ? 'text-amber-400' : 'text-red-400')}>
                          <Coins className="h-3 w-3" /> {g.coinCost}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{g.description}</p>
                      <div className="flex items-center gap-2 mt-1 text-[10px]">
                        <span className="text-emerald-400 flex items-center gap-0.5">
                          <Heart className="h-2.5 w-2.5" /> +{g.moodBoost} настроение
                        </span>
                        <span className="text-arcane">+{g.syncBoost} синхр.</span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Optional message */}
          {selected && (
            <div className="space-y-1.5">
              <Label htmlFor="gm" className="text-xs">Сообщение (необязательно)</Label>
              <Input
                id="gm"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={100}
                placeholder="С праздником!"
                className="text-sm"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Отмена
            </Button>
            <Button
              onClick={send}
              disabled={!selected || busy}
              className="flex-1 bg-gradient-to-r from-arcane to-frost"
            >
              <Send className="h-4 w-4" /> {busy ? 'Отправка...' : 'Подарить'}
            </Button>
          </div>

          {familiar && (
            <div className="text-center text-[10px] text-muted-foreground">
              У вас {familiar.coins} монет
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
