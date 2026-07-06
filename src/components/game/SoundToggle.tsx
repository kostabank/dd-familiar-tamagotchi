'use client';

import { Button } from '@/components/ui/button';
import { useSound } from '@/hooks/use-sound';
import { Volume2, VolumeX } from 'lucide-react';

export function SoundToggle() {
  const { muted, toggle } = useSound();
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      className="h-8 w-8 p-0"
      title={muted ? 'Включить звук' : 'Выключить звук'}
      aria-label={muted ? 'Включить звук' : 'Выключить звук'}
    >
      {muted ? <VolumeX className="h-4 w-4 text-muted-foreground" /> : <Volume2 className="h-4 w-4 text-frost" />}
    </Button>
  );
}
