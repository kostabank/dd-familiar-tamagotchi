'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useFamiliar } from '@/hooks/use-familiar';
import { useStore } from '@/lib/store';
import { Timer, Target } from 'lucide-react';

interface Sphere {
  id: number;
  x: number; // 0-100 %
  y: number; // 0-100 %
  vx: number;
  vy: number;
  color: string;
  caught: boolean;
}

const TARGET = 5;
const DURATION = 10; // seconds
const COLORS = ['#A855F7', '#3B82F6', '#22c55e', '#f97316', '#ef4444'];

export function MiniGame() {
  const { showMiniGame, setShowMiniGame } = useStore();
  const { play } = useFamiliar();
  const [spheres, setSpheres] = useState<Sphere[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState<null | { success: boolean }>(null);
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);
  const sphereIdRef = useRef(0);
  const scoreRef = useRef(0);
  const playRef = useRef(play);
  useEffect(() => { playRef.current = play; }, [play]);
  useEffect(() => { scoreRef.current = score; }, [score]);

  const finishGame = useCallback(async (finalScore: number) => {
    setRunning(false);
    setFinished({ success: finalScore >= TARGET });
    await playRef.current(finalScore, TARGET);
  }, []);

  const spawnSphere = useCallback(() => {
    const id = sphereIdRef.current++;
    const side = Math.random() < 0.5 ? -1 : 1;
    const s: Sphere = {
      id,
      x: side < 0 ? -5 : 105,
      y: 15 + Math.random() * 70,
      vx: side * (1.2 + Math.random() * 1.6),
      vy: (Math.random() - 0.5) * 1.2,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      caught: false,
    };
    setSpheres((prev) => [...prev, s]);
  }, []);

  const start = useCallback(() => {
    setSpheres([]);
    setScore(0);
    setTimeLeft(DURATION);
    setFinished(null);
    setRunning(true);
    lastTickRef.current = performance.now();
  }, []);

  // Game loop
  useEffect(() => {
    if (!running) return;
    let spawnTimer = 0;
    const loop = (now: number) => {
      const dt = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;

      spawnTimer += dt;
      if (spawnTimer > 0.7) {
        spawnTimer = 0;
        spawnSphere();
      }

      setSpheres((prev) =>
        prev
          .map((s) =>
            s.caught
              ? s
              : { ...s, x: s.x + s.vx * dt * 30, y: Math.max(5, Math.min(90, s.y + s.vy * dt * 20)) }
          )
          .filter((s) => !s.caught && s.x > -15 && s.x < 115)
      );

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [running, spawnSphere]);

  // Timer — finishes the game directly when it reaches 0.
  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          const finalScore = scoreRef.current;
          void finishGame(finalScore);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [running, finishGame]);

  const catchSphere = (id: number) => {
    setSpheres((prev) => prev.map((s) => (s.id === id ? { ...s, caught: true } : s)));
    setScore((s) => s + 1);
  };

  const close = () => {
    setRunning(false);
    setSpheres([]);
    setScore(0);
    setTimeLeft(DURATION);
    setFinished(null);
    setShowMiniGame(false);
  };

  return (
    <Dialog open={showMiniGame} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-arcane" /> Поймай сияющие сферы
          </DialogTitle>
          <DialogDescription>
            Поймай {TARGET} сфер за {DURATION} секунд. Успех = +20 настроения и +10 синхронизации.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-2 text-sm">
            <Timer className="h-4 w-4 text-frost" />
            <span className="font-mono text-lg tabular-nums">{timeLeft}s</span>
          </div>
          <div className="text-sm">
            Поймано: <span className="font-mono text-lg text-arcane tabular-nums">{score}</span>
            <span className="text-muted-foreground"> / {TARGET}</span>
          </div>
        </div>

        <div
          className="relative w-full overflow-hidden rounded-xl border border-arcane/20 bg-gradient-to-br from-[#0a0a1a] to-[#1a1a2e]"
          style={{ height: 360 }}
        >
          {spheres.map((s) =>
            s.caught ? null : (
              <button
                key={s.id}
                onClick={() => catchSphere(s.id)}
                className="absolute h-9 w-9 rounded-full transition-transform hover:scale-110 active:scale-90"
                style={{
                  left: `${s.x}%`,
                  top: `${s.y}%`,
                  transform: 'translate(-50%, -50%)',
                  background: `radial-gradient(circle at 35% 30%, #ffffff 0%, ${s.color} 45%, ${s.color}88 100%)`,
                  boxShadow: `0 0 16px ${s.color}, 0 0 32px ${s.color}66`,
                }}
                aria-label="Сфера"
              />
            )
          )}

          {!running && finished && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className={`text-3xl font-bold ${finished.success ? 'text-emerald-400' : 'text-amber-400'}`}>
                {finished.success ? 'Победа!' : 'Почти получилось!'}
              </div>
              <div className="text-muted-foreground mt-1">Поймано {score} / {TARGET}</div>
              <Button onClick={close} className="mt-4">Закрыть</Button>
            </div>
          )}

          {!running && !finished && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm">
              <p className="text-muted-foreground mb-4">Готов?</p>
              <Button onClick={start} size="lg" className="bg-arcane hover:bg-arcane/80">
                Начать игру
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
