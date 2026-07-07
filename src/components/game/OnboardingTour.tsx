'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useStore } from '@/lib/store';
import {
  Sparkles,
  MousePointer2,
  Utensils,
  Gamepad2,
  TrendingUp,
  GitBranch,
  BookOpen,
  Keyboard,
  X,
  ChevronRight,
  ChevronLeft,
  PartyPopper,
} from 'lucide-react';

const STORAGE_KEY = 'ddt_onboarding_done_v1';

interface Step {
  icon: React.ReactNode;
  title: string;
  body: string;
  accent: string;
}

const STEPS: Step[] = [
  {
    icon: <Sparkles className="h-6 w-6" />,
    title: 'Добро пожаловать в партию!',
    body: 'Твой 3D-фамильяр живёт в реальном времени: голодает, устаёт, грустит и эволюционирует. Ухаживай за ним между сессиями D&D — его состояние даёт боевые баффы твоему персонажу.',
    accent: '#A855F7',
  },
  {
    icon: <MousePointer2 className="h-6 w-6" />,
    title: '3D-фамильяр',
    body: 'Перетаскивай мышью, чтобы вращать модель. Колесо — приближение. Фамильяр анимирован: дышит, моргает, реагирует на состояние. Наведи курсор — увидишь его мысли.',
    accent: '#3B82F6',
  },
  {
    icon: <Utensils className="h-6 w-6" />,
    title: 'Базовый уход',
    body: 'Кормить (+энергия), Играть (+настроение, +монеты), Гладить (+синхронизация). Усталость растёт от действий — давай фамильяру спать, иначе он откажется действовать.',
    accent: '#f97316',
  },
  {
    icon: <TrendingUp className="h-6 w-6" />,
    title: 'Параметры и decay',
    body: 'Энергия, Настроение, Усталость, Здоровье, Синхронизация. Время идёт по Москве — каждый час статы падают. Если энергия на нуле, фамильяр теряет здоровье. Заходи почаще!',
    accent: '#22c55e',
  },
  {
    icon: <GitBranch className="h-6 w-6" />,
    title: 'Слепая эволюция',
    body: 'Накопи 100 синхронизации — откроется адаптация. Выбери один из 3 путей (всего 24 пути на 4 вида!). Бафф пути скрыт до выбора и необратим. Каждая стадия меняет 3D-модель и усиливает боевой бафф.',
    accent: '#A855F7',
  },
  {
    icon: <BookOpen className="h-6 w-6" />,
    title: 'Кодекс эволюций',
    body: 'Кнопка «Кодекс» (справа над 3D) открывает каталог всех 24 путей. Открытые показывают 3D-превью и бафф, закрытые — замок. Собери все пути, перепроходя эволюции!',
    accent: '#3B82F6',
  },
  {
    icon: <Keyboard className="h-6 w-6" />,
    title: 'Горячие клавиши',
    body: 'F — кормить, P — гладить, S — сон, G — мини-игра, E — эволюция, C — кодекс, ? — эта подсказка. Быстрый уход без мыши!',
    accent: '#eab308',
  },
  {
    icon: <PartyPopper className="h-6 w-6" />,
    title: 'Готов к приключениям!',
    body: 'Получай бафф дня каждый день, выполняй квесты от Мастера, дари подарки союзникам, забирай награды за достижения. Удачи в подземелье!',
    accent: '#22c55e',
  },
];

export function OnboardingTour() {
  const user = useStore((s) => s.user);
  const familiar = useStore((s) => s.familiar);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  // Show onboarding once per browser when a player (not DM) first logs in
  // and hasn't completed the tour yet.
  useEffect(() => {
    if (!user || user.role !== 'player') return;
    if (typeof window === 'undefined') return;
    try {
      const done = window.localStorage.getItem(STORAGE_KEY);
      if (!done) {
        // Small delay so the dashboard settles before the overlay appears.
        const t = window.setTimeout(() => setOpen(true), 600);
        return () => window.clearTimeout(t);
      }
    } catch {
      // localStorage may be unavailable (private mode) — skip onboarding.
    }
  }, [user]);

  const finish = () => {
    setOpen(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* noop */
    }
  };

  const skip = () => finish();
  const next = () => {
    if (step >= STEPS.length - 1) finish();
    else setStep((s) => s + 1);
  };
  const prev = () => setStep((s) => Math.max(0, s - 1));

  if (!open || !familiar) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const pct = Math.round(((step + 1) / STEPS.length) * 100);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm animate-[fade-in_0.2s_ease-out]" />

      {/* Card */}
      <div className="relative w-full max-w-lg rounded-2xl border-2 bg-card/95 shadow-2xl overflow-hidden arcane-border">
        {/* Top accent bar */}
        <div
          className="h-1.5 w-full"
          style={{ background: `linear-gradient(90deg, ${current.accent}, transparent)` }}
        />

        {/* Skip button */}
        <button
          onClick={skip}
          className="absolute top-3 right-3 z-10 h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/8 transition-colors"
          aria-label="Пропустить"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-6 md:p-8">
          {/* Step indicator */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-mono text-muted-foreground tabular-nums">
              Шаг {step + 1} / {STEPS.length}
            </span>
            <div className="flex-1 mx-3 h-1 rounded-full bg-white/8 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${pct}%`, backgroundColor: current.accent }}
              />
            </div>
          </div>

          {/* Icon */}
          <div
            className="mx-auto mb-4 h-16 w-16 rounded-2xl flex items-center justify-center"
            style={{
              backgroundColor: `${current.accent}1a`,
              border: `1px solid ${current.accent}40`,
              color: current.accent,
              boxShadow: `0 0 24px -6px ${current.accent}66`,
            }}
          >
            {current.icon}
          </div>

          {/* Title + body */}
          <h2 className="text-xl font-bold text-center mb-2" style={{ color: current.accent }}>
            {current.title}
          </h2>
          <p className="text-sm text-muted-foreground text-center leading-relaxed mb-6">
            {current.body}
          </p>

          {/* Nav buttons */}
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={prev}
              disabled={step === 0}
              className="text-muted-foreground"
            >
              <ChevronLeft className="h-4 w-4" /> Назад
            </Button>

            {/* Step dots */}
            <div className="flex items-center gap-1.5">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    width: i === step ? 18 : 6,
                    backgroundColor: i === step ? current.accent : 'rgba(255,255,255,0.18)',
                  }}
                  aria-label={`Шаг ${i + 1}`}
                />
              ))}
            </div>

            <Button size="sm" onClick={next} style={{ backgroundColor: current.accent }} className="text-black font-semibold">
              {isLast ? (
                <>
                  Начать! <PartyPopper className="h-4 w-4 ml-1" />
                </>
              ) : (
                <>
                  Далее <ChevronRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Skip link */}
        {!isLast && (
          <button
            onClick={skip}
            className="w-full py-2 text-[11px] text-muted-foreground/70 hover:text-muted-foreground border-t border-white/5 transition-colors"
          >
            Пропустить обучение
          </button>
        )}
      </div>
    </div>
  );
}
