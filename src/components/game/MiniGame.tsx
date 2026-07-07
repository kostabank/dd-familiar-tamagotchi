'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useFamiliar } from '@/hooks/use-familiar';
import { useStore } from '@/lib/store';
import { Timer, Target, Sparkles, Brain, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

type GameType = 'spheres' | 'runes';

interface Sphere {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  caught: boolean;
}

// ===== Spheres game constants =====
const SPHERE_TARGET = 5;
const SPHERE_DURATION = 10;
const SPHERE_COLORS = ['#A855F7', '#3B82F6', '#22c55e', '#f97316', '#ef4444'];

// ===== Runes (memory) game constants =====
const RUNE_SYMBOLS = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ'];
const RUNE_COLORS = ['#A855F7', '#3B82F6', '#22c55e', '#f97316', '#ef4444', '#eab308', '#ec4899', '#14b8a6'];

export function MiniGame() {
  const { showMiniGame, setShowMiniGame } = useStore();
  const { play } = useFamiliar();
  const [gameType, setGameType] = useState<GameType | null>(null);

  return (
    <Dialog open={showMiniGame} onOpenChange={(o) => !o && setShowMiniGame(false)}>
      <DialogContent className="max-w-2xl">
        {gameType === null ? (
          <GameSelector onPick={setGameType} />
        ) : gameType === 'spheres' ? (
          <SpheresGame
            play={play}
            onExit={() => setGameType(null)}
            onClose={() => setShowMiniGame(false)}
          />
        ) : (
          <RunesGame
            play={play}
            onExit={() => setGameType(null)}
            onClose={() => setShowMiniGame(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Game selector
// ============================================================
function GameSelector({ onPick }: { onPick: (t: GameType) => void }) {
  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-arcane" /> Мини-игры
        </DialogTitle>
        <DialogDescription>Выбери игру, чтобы поднять настроение и синхронизацию фамильяра.</DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
        <GameCard
          icon={<Target className="h-6 w-6" />}
          title="Поймай сияющие сферы"
          desc={`Поймай ${SPHERE_TARGET} сфер за ${SPHERE_DURATION}с. Успех = +20 настроения, +10 синхр.`}
          accent="#A855F7"
          onClick={() => onPick('spheres')}
        />
        <GameCard
          icon={<Brain className="h-6 w-6" />}
          title="Память рун"
          desc="Запомни последовательность рун и повтори. Каждый успешный раунд = +настроение."
          accent="#3B82F6"
          onClick={() => onPick('runes')}
        />
      </div>
    </>
  );
}

function GameCard({ icon, title, desc, accent, onClick }: { icon: React.ReactNode; title: string; desc: string; accent: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group rounded-xl border border-white/10 bg-white/[0.02] p-4 text-left transition-all hover:border-arcane/50 hover:scale-[1.02] hover:bg-white/[0.04] arcane-border"
    >
      <div
        className="h-12 w-12 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110"
        style={{ backgroundColor: `${accent}1a`, border: `1px solid ${accent}40`, color: accent, boxShadow: `0 0 16px -4px ${accent}66` }}
      >
        {icon}
      </div>
      <div className="font-semibold text-sm mb-1" style={{ color: accent }}>{title}</div>
      <p className="text-[11px] text-muted-foreground leading-relaxed">{desc}</p>
    </button>
  );
}

// ============================================================
// Spheres game (original)
// ============================================================
function SpheresGame({ play, onExit, onClose }: { play: (score: number, target: number) => void; onExit: () => void; onClose: () => void }) {
  const [spheres, setSpheres] = useState<Sphere[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(SPHERE_DURATION);
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
    setFinished({ success: finalScore >= SPHERE_TARGET });
    await playRef.current(finalScore, SPHERE_TARGET);
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
      color: SPHERE_COLORS[Math.floor(Math.random() * SPHERE_COLORS.length)],
      caught: false,
    };
    setSpheres((prev) => [...prev, s]);
  }, []);

  const start = useCallback(() => {
    setSpheres([]);
    setScore(0);
    setTimeLeft(SPHERE_DURATION);
    setFinished(null);
    setRunning(true);
    lastTickRef.current = performance.now();
  }, []);

  useEffect(() => {
    if (!running) return;
    let spawnTimer = 0;
    const loop = (now: number) => {
      const dt = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;
      spawnTimer += dt;
      if (spawnTimer > 0.7) { spawnTimer = 0; spawnSphere(); }
      setSpheres((prev) =>
        prev
          .map((s) => s.caught ? s : { ...s, x: s.x + s.vx * dt * 30, y: Math.max(5, Math.min(90, s.y + s.vy * dt * 20)) })
          .filter((s) => !s.caught && s.x > -15 && s.x < 115)
      );
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [running, spawnSphere]);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(interval); void finishGame(scoreRef.current); return 0; }
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
    setRunning(false); setSpheres([]); setScore(0); setTimeLeft(SPHERE_DURATION); setFinished(null); onClose();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <button onClick={onExit} className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/8" aria-label="К списку игр">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <Target className="h-5 w-5 text-arcane" /> Поймай сияющие сферы
        </DialogTitle>
        <DialogDescription>Поймай {SPHERE_TARGET} сфер за {SPHERE_DURATION} секунд.</DialogDescription>
      </DialogHeader>

      <div className="flex items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-2 text-sm">
          <Timer className="h-4 w-4 text-frost" />
          <span className="font-mono text-lg tabular-nums">{timeLeft}s</span>
        </div>
        <div className="text-sm">
          Поймано: <span className="font-mono text-lg text-arcane tabular-nums">{score}</span>
          <span className="text-muted-foreground"> / {SPHERE_TARGET}</span>
        </div>
      </div>

      <div className="relative w-full overflow-hidden rounded-xl border border-arcane/20 bg-gradient-to-br from-[#0a0a1a] to-[#1a1a2e]" style={{ height: 360 }}>
        {spheres.map((s) =>
          s.caught ? null : (
            <button key={s.id} onClick={() => catchSphere(s.id)} className="absolute h-9 w-9 rounded-full transition-transform hover:scale-110 active:scale-90"
              style={{ left: `${s.x}%`, top: `${s.y}%`, transform: 'translate(-50%, -50%)', background: `radial-gradient(circle at 35% 30%, #ffffff 0%, ${s.color} 45%, ${s.color}88 100%)`, boxShadow: `0 0 16px ${s.color}, 0 0 32px ${s.color}66` }}
              aria-label="Сфера"
            />
          )
        )}
        {!running && finished && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className={cn('text-3xl font-bold', finished.success ? 'text-emerald-400' : 'text-amber-400')}>
              {finished.success ? 'Победа!' : 'Почти получилось!'}
            </div>
            <div className="text-muted-foreground mt-1">Поймано {score} / {SPHERE_TARGET}</div>
            <Button onClick={close} className="mt-4">Закрыть</Button>
          </div>
        )}
        {!running && !finished && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm">
            <p className="text-muted-foreground mb-4">Готов?</p>
            <Button onClick={start} size="lg" className="bg-arcane hover:bg-arcane/80">Начать игру</Button>
          </div>
        )}
      </div>
    </>
  );
}

// ============================================================
// Runes memory game (new)
// ============================================================
type Phase = 'idle' | 'showing' | 'input' | 'round-win' | 'over';

function RunesGame({ play, onExit, onClose }: { play: (score: number, target: number) => void; onExit: () => void; onClose: () => void }) {
  const [round, setRound] = useState(0); // current round number (sequence length = round+1)
  const [sequence, setSequence] = useState<number[]>([]); // indices into RUNE_SYMBOLS
  const [activeIdx, setActiveIdx] = useState<number | null>(null); // rune currently flashing
  const [inputIdx, setInputIdx] = useState(0); // how many of sequence the player has repeated
  const [phase, setPhase] = useState<Phase>('idle');
  const [bestRound, setBestRound] = useState(0);
  const playRef = useRef(play);
  useEffect(() => { playRef.current = play; }, [play]);

  const TARGET_ROUND = 3; // need to clear 3 rounds to "win"

  const startGame = useCallback(() => {
    const firstSeq = [Math.floor(Math.random() * RUNE_SYMBOLS.length)];
    setSequence(firstSeq);
    setRound(1);
    setInputIdx(0);
    setBestRound(0);
    setPhase('showing');
  }, []);

  // Show the sequence: flash each rune in turn.
  useEffect(() => {
    if (phase !== 'showing') return;
    let i = 0;
    setActiveIdx(null);
    const flashOne = () => {
      if (i >= sequence.length) {
        setActiveIdx(null);
        setPhase('input');
        return;
      }
      setActiveIdx(sequence[i]);
      setTimeout(() => {
        setActiveIdx(null);
        setTimeout(() => { i++; flashOne(); }, 220);
      }, 520);
    };
    const t = setTimeout(flashOne, 400);
    return () => clearTimeout(t);
  }, [phase, sequence]);

  const handleRuneClick = (idx: number) => {
    if (phase !== 'input') return;
    const expected = sequence[inputIdx];
    if (idx === expected) {
      // Flash the clicked rune briefly for feedback.
      setActiveIdx(idx);
      setTimeout(() => setActiveIdx(null), 180);
      const nextInput = inputIdx + 1;
      if (nextInput >= sequence.length) {
        // Round cleared.
        setInputIdx(0);
        setBestRound(round);
        if (round >= TARGET_ROUND) {
          // Overall win.
          setPhase('over');
          void playRef.current(round, TARGET_ROUND);
        } else {
          setPhase('round-win');
          setTimeout(() => {
            // Add a new rune to the sequence and advance.
            const next = [...sequence, Math.floor(Math.random() * RUNE_SYMBOLS.length)];
            setSequence(next);
            setRound((r) => r + 1);
            setPhase('showing');
          }, 1100);
        }
      } else {
        setInputIdx(nextInput);
      }
    } else {
      // Wrong rune — game over.
      setPhase('over');
      void playRef.current(bestRound, TARGET_ROUND);
    }
  };

  const won = phase === 'over' && bestRound >= TARGET_ROUND;

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <button onClick={onExit} className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/8" aria-label="К списку игр">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <Brain className="h-5 w-5 text-frost" /> Память рун
        </DialogTitle>
        <DialogDescription>
          Запомни последовательность светящихся рун и повтори её. Цель — пройти {TARGET_ROUND} раунда.
        </DialogDescription>
      </DialogHeader>

      <div className="flex items-center justify-between gap-4 mb-2 text-sm">
        <div>Раунд: <span className="font-mono text-lg text-frost tabular-nums">{round}</span><span className="text-muted-foreground"> / {TARGET_ROUND}</span></div>
        <div className="text-muted-foreground">
          {phase === 'showing' && <span className="text-frost animate-pulse">Запоминай…</span>}
          {phase === 'input' && <span className="text-arcane">Повтори последовательность</span>}
          {phase === 'round-win' && <span className="text-emerald-400">Верно! Следующий раунд…</span>}
        </div>
      </div>

      {/* Progress dots — sequence length for current round */}
      {phase !== 'idle' && phase !== 'over' && (
        <div className="flex items-center justify-center gap-1.5 mb-2">
          {sequence.map((_, i) => (
            <span
              key={i}
              className={cn('h-1.5 w-6 rounded-full transition-all', i < inputIdx ? 'bg-emerald-400' : 'bg-white/10')}
            />
          ))}
        </div>
      )}

      <div className="grid grid-cols-4 gap-2.5" style={{ minHeight: 280 }}>
        {RUNE_SYMBOLS.map((sym, idx) => {
          const flashing = activeIdx === idx;
          const color = RUNE_COLORS[idx];
          return (
            <button
              key={idx}
              onClick={() => handleRuneClick(idx)}
              disabled={phase !== 'input'}
              className={cn(
                'aspect-square rounded-xl border flex items-center justify-center text-3xl transition-all duration-150 select-none',
                flashing ? 'scale-105' : 'scale-100',
                phase === 'input' ? 'cursor-pointer hover:border-white/40 hover:bg-white/5' : 'cursor-default'
              )}
              style={{
                borderColor: flashing ? color : 'rgba(255,255,255,0.08)',
                backgroundColor: flashing ? `${color}33` : 'rgba(255,255,255,0.02)',
                color: flashing ? '#ffffff' : color,
                boxShadow: flashing ? `0 0 24px -2px ${color}, inset 0 0 16px -4px ${color}` : 'none',
                textShadow: flashing ? `0 0 12px ${color}` : 'none',
              }}
            >
              {sym}
            </button>
          );
        })}
      </div>

      {phase === 'idle' && (
        <div className="flex flex-col items-center gap-3 mt-3">
          <p className="text-xs text-muted-foreground text-center max-w-md">
            В каждом раунде к последовательности добавляется новая руна. Дойди до {TARGET_ROUND}-го раунда, чтобы выиграть!
          </p>
          <Button onClick={startGame} size="lg" className="bg-frost hover:bg-frost/80">Начать игру</Button>
        </div>
      )}

      {phase === 'over' && (
        <div className="flex flex-col items-center gap-3 mt-3">
          <div className={cn('text-2xl font-bold', won ? 'text-emerald-400' : 'text-amber-400')}>
            {won ? 'Победа!' : 'Игра окончена'}
          </div>
          <div className="text-muted-foreground text-sm">
            Пройдено раундов: <span className="font-mono text-arcane tabular-nums">{bestRound}</span> / {TARGET_ROUND}
          </div>
          <div className="flex gap-2">
            <Button onClick={startGame} variant="outline">Ещё раз</Button>
            <Button onClick={onClose}>Закрыть</Button>
          </div>
        </div>
      )}
    </>
  );
}
