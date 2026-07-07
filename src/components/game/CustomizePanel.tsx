'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useStore } from '@/lib/store';
import { toast } from 'sonner';
import { sound } from '@/lib/sound';
import { Pencil, Palette, Check, Lock, Coins, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

const RENAME_COST = 25;
const ACCENT_UNLOCK_STAGE = 2;
const BIO_MAX = 500;
const PRESET_COLORS = [
  '#A855F7', '#3B82F6', '#22c55e', '#f97316', '#ef4444',
  '#ec4899', '#14b8a6', '#eab308', '#8b5cf6', '#06b6d4',
];

export function CustomizePanel() {
  const { familiar, setFamiliar } = useStore();
  const [editName, setEditName] = useState(false);
  const [nameInput, setNameInput] = useState(familiar?.name || '');
  const [busy, setBusy] = useState(false);

  if (!familiar) return null;

  const canAccent = familiar.stage >= ACCENT_UNLOCK_STAGE;

  const saveName = async () => {
    if (!nameInput.trim() || nameInput.trim() === familiar.name) {
      setEditName(false);
      return;
    }
    if (familiar.coins < RENAME_COST) {
      toast.error(`Нужно ${RENAME_COST} монет для переименования`);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/familiar/customize', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameInput }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Не удалось переименовать');
        return;
      }
      setFamiliar(data.familiar);
      sound.play('click');
      toast.success(`Фамильяр переименован в "${data.familiar.name}"`, { description: `−${RENAME_COST} монет` });
      setEditName(false);
    } finally {
      setBusy(false);
    }
  };

  const setAccent = async (color: string | null) => {
    setBusy(true);
    try {
      const res = await fetch('/api/familiar/customize', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accentColor: color }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Не удалось изменить цвет');
        return;
      }
      setFamiliar(data.familiar);
      sound.play('click');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="arcane-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Palette className="h-4 w-4 text-frost" /> Кастомизация
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Rename */}
        <div className="space-y-1.5">
          <Label className="text-xs flex items-center justify-between">
            <span>Имя фамильяра</span>
            {!editName && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                <Coins className="h-3 w-3" /> {RENAME_COST}
              </span>
            )}
          </Label>
          {editName ? (
            <div className="flex gap-1.5">
              <Input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveName()}
                maxLength={30}
                className="h-8 text-sm"
                autoFocus
              />
              <Button size="sm" onClick={saveName} disabled={busy} className="h-8 px-2">
                <Check className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2 rounded-md border border-white/8 bg-white/[0.02] px-2.5 py-1.5">
              <span className="text-sm font-medium truncate">{familiar.name}</span>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={() => { setNameInput(familiar.name); setEditName(true); }}
                title="Переименовать"
              >
                <Pencil className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        {/* Accent color */}
        <div className="space-y-1.5">
          <Label className="text-xs flex items-center justify-between">
            <span>Акцентный цвет</span>
            {!canAccent && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                <Lock className="h-3 w-3" /> Стадия {ACCENT_UNLOCK_STAGE}+
              </span>
            )}
          </Label>
          {canAccent ? (
            <div className="grid grid-cols-6 gap-1.5">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  disabled={busy}
                  onClick={() => setAccent(c)}
                  className={cn(
                    'h-7 w-7 rounded-md border-2 transition-all hover:scale-110',
                    familiar.accentColor === c ? 'border-white scale-110' : 'border-white/10'
                  )}
                  style={{ backgroundColor: c, boxShadow: familiar.accentColor === c ? `0 0 10px ${c}` : 'none' }}
                  aria-label={`Цвет ${c}`}
                />
              ))}
              <button
                type="button"
                disabled={busy}
                onClick={() => setAccent(null)}
                className={cn(
                  'h-7 w-7 rounded-md border-2 flex items-center justify-center text-[10px] transition-all hover:scale-110',
                  !familiar.accentColor ? 'border-white' : 'border-white/10'
                )}
                style={{ background: 'linear-gradient(135deg, #1a1a2e, #232347)' }}
                title="Сбросить"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="text-[11px] text-muted-foreground italic rounded-md border border-white/5 bg-white/[0.01] px-2.5 py-2">
              Эволюционируй до Стадии {ACCENT_UNLOCK_STAGE}, чтобы настроить акцентный цвет фамильяра.
            </div>
          )}
          {familiar.accentColor && (
            <div className="text-[10px] text-muted-foreground flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: familiar.accentColor }} />
              <span className="font-mono">{familiar.accentColor}</span>
            </div>
          )}
        </div>

        {/* Bio / Lore */}
        <BioSection familiar={familiar} setFamiliar={setFamiliar} busy={busy} setBusy={setBusy} />
      </CardContent>
    </Card>
  );
}

function BioSection({
  familiar,
  setFamiliar,
  busy,
  setBusy,
}: {
  familiar: NonNullable<ReturnType<typeof useStore.getState>['familiar']>;
  setFamiliar: (f: ReturnType<typeof useStore.getState>['familiar']) => void;
  busy: boolean;
  setBusy: (v: boolean) => void;
}) {
  const [editBio, setEditBio] = useState(false);
  const [bioInput, setBioInput] = useState(familiar.bio || '');

  const saveBio = async () => {
    const trimmed = bioInput.slice(0, BIO_MAX);
    if (trimmed === (familiar.bio || '')) {
      setEditBio(false);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/familiar/customize', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio: trimmed || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Не удалось сохранить био');
        return;
      }
      setFamiliar(data.familiar);
      sound.play('click');
      toast.success('Био сохранено');
      setEditBio(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-xs flex items-center justify-between">
        <span className="flex items-center gap-1">
          <BookOpen className="h-3 w-3" /> Био / Лор
        </span>
        {editBio && (
          <span className={cn('text-[10px] font-mono', bioInput.length > BIO_MAX ? 'text-red-400' : 'text-muted-foreground')}>
            {bioInput.length}/{BIO_MAX}
          </span>
        )}
      </Label>
      {editBio ? (
        <div className="space-y-1.5">
          <Textarea
            value={bioInput}
            onChange={(e) => setBioInput(e.target.value)}
            placeholder="Расскажи историю своего фамильяра: откуда он родом, как присоединился к партии, его привычки и мечты..."
            maxLength={BIO_MAX}
            className="text-sm min-h-[80px] resize-none"
            autoFocus
          />
          <div className="flex gap-1.5">
            <Button size="sm" onClick={saveBio} disabled={busy} className="h-7 flex-1">
              <Check className="h-3.5 w-3.5" /> Сохранить
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setEditBio(false); setBioInput(familiar.bio || ''); }} className="h-7">
              Отмена
            </Button>
          </div>
        </div>
      ) : (
        <div
          className="group rounded-md border border-white/8 bg-white/[0.02] px-2.5 py-2 cursor-pointer hover:border-arcane/30 transition-colors"
          onClick={() => { setBioInput(familiar.bio || ''); setEditBio(true); }}
        >
          {familiar.bio ? (
            <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap line-clamp-4">{familiar.bio}</p>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              Нажми, чтобы добавить историю фамильяра...
            </p>
          )}
          <div className="flex items-center justify-end mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <Pencil className="h-2.5 w-2.5" /> {familiar.bio ? 'Редактировать' : 'Добавить'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
