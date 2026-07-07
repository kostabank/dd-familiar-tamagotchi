'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { sound } from '@/lib/sound';
import { Volume2, VolumeX, Volume1 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Combined mute toggle + volume slider. The slider expands on hover/click.
 * Volume persists to localStorage.
 */
export function VolumeControl() {
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(70);
  const [expanded, setExpanded] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    Promise.resolve().then(() => {
      setMuted(sound.muted);
      setVolume(sound.getVolume());
    });
  }, []);

  const toggleMute = () => {
    const next = sound.toggleMuted();
    setMuted(next);
  };

  const onVolumeChange = (v: number[]) => {
    const vol = v[0];
    setVolume(vol);
    sound.setVolume(vol);
    // If user raises volume above 0 while muted, unmute.
    if (vol > 0 && muted) {
      sound.setMuted(false);
      setMuted(false);
    }
  };

  const showSlider = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setExpanded(true);
  };
  const scheduleHide = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setExpanded(false), 1200);
  };

  const VolIcon = muted || volume === 0 ? VolumeX : volume < 50 ? Volume1 : Volume2;

  return (
    <div
      className="relative flex items-center"
      onMouseEnter={showSlider}
      onMouseLeave={scheduleHide}
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleMute}
        className="h-8 w-8 p-0"
        title={muted ? 'Включить звук' : 'Выключить звук'}
        aria-label={muted ? 'Включить звук' : 'Выключить звук'}
      >
        <VolIcon className={cn('h-4 w-4', muted ? 'text-muted-foreground' : 'text-frost')} />
      </Button>
      {/* Volume slider — expands width on hover */}
      <div
        className={cn(
          'overflow-hidden transition-all duration-300 ease-out',
          expanded ? 'w-20 opacity-100' : 'w-0 opacity-0'
        )}
      >
        <Slider
          value={[muted ? 0 : volume]}
          min={0}
          max={100}
          step={5}
          onValueChange={onVolumeChange}
          className="mx-2 [&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_[role=slider]]:border-frost"
          aria-label="Громкость"
        />
      </div>
    </div>
  );
}
