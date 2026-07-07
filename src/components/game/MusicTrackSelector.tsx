'use client';

import { useState, useEffect } from 'react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { sound, type AmbientTrack } from '@/lib/sound';
import { Music, Trees, Mountain, Beer, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const TRACKS: { code: AmbientTrack; label: string; icon: React.ReactNode; desc: string }[] = [
  { code: 'default', label: 'Мистический дрон', icon: <Sparkles className="h-3.5 w-3.5" />, desc: 'Тёмный пятый аккорд' },
  { code: 'forest', label: 'Лес', icon: <Trees className="h-3.5 w-3.5" />, desc: 'Зелёные тона, шепот листьев' },
  { code: 'cave', label: 'Пещера', icon: <Mountain className="h-3.5 w-3.5" />, desc: 'Глубокие низкие частоты' },
  { code: 'tavern', label: 'Таверна', icon: <Beer className="h-3.5 w-3.5" />, desc: 'Тёплая мажорная атмосфера' },
];

export function MusicTrackSelector() {
  const [current, setCurrent] = useState<AmbientTrack>('default');

  useEffect(() => {
    // Defer to avoid synchronous setState in the effect body.
    Promise.resolve().then(() => setCurrent(sound.getSavedTrack()));
  }, []);

  const selectTrack = (track: AmbientTrack) => {
    setCurrent(track);
    sound.setSavedTrack(track);
    sound.startTrack(track);
  };

  const currentMeta = TRACKS.find((t) => t.code === current) || TRACKS[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-2" title="Выбрать музыку">
          <Music className="h-4 w-4 text-frost" />
          <span className="hidden sm:inline text-xs">{currentMeta.label}</span>
          {/* Animated waveform */}
          <span className="flex items-end gap-0.5 h-3">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-0.5 bg-frost rounded-full animate-pulse-glow"
                style={{
                  height: '100%',
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: `${0.8 + i * 0.2}s`,
                }}
              />
            ))}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs">Фоновая музыка</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {TRACKS.map((t) => (
          <DropdownMenuItem
            key={t.code}
            onClick={() => selectTrack(t.code)}
            className={cn('flex items-start gap-2 py-2', current === t.code && 'bg-arcane/10')}
          >
            <span className="shrink-0 mt-0.5 text-frost">{t.icon}</span>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium flex items-center justify-between">
                {t.label}
                {current === t.code && <span className="text-arcane">●</span>}
              </div>
              <div className="text-[10px] text-muted-foreground leading-tight">{t.desc}</div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
