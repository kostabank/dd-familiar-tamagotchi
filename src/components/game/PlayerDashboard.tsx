'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import FamiliarCanvas from '@/components/familiar/FamiliarCanvas';
import { StatBar } from './StatBar';
import { ActionButtons } from './ActionButtons';
import { BuffsPanel } from './BuffsPanel';
import { MiniGame } from './MiniGame';
import { EvolutionModal } from './EvolutionModal';
import { DailyBuffPanel } from './DailyBuffPanel';
import { ActivityLogPanel } from './ActivityLogPanel';
import { PartyRosterSidebar } from './PartyRosterSidebar';
import { AchievementsPanel } from './AchievementsPanel';
import { QuestTrackerPanel } from './QuestTrackerPanel';
import { LiveClock } from './LiveClock';
import { AmbientBackground } from './AmbientBackground';
import { SoundToggle } from './SoundToggle';
import { CustomizePanel } from './CustomizePanel';
import { CelebrationOverlay } from './CelebrationOverlay';
import { MobilePanelsDrawer } from './MobilePanelsDrawer';
import { LeaderboardPanel } from './LeaderboardPanel';
import { FamiliarProfileModal } from './FamiliarProfileModal';
import { NotificationFeed } from './NotificationFeed';
import { MusicTrackSelector } from './MusicTrackSelector';
import { VolumeControl } from './VolumeControl';
import { FloatingStatNumbers } from './FloatingStatNumbers';
import { EvolutionCodex } from './EvolutionCodex';
import { ShortcutsHelp } from './ShortcutsHelp';
import { OnboardingTour } from './OnboardingTour';
import { StreakBadge } from './StreakBadge';
import { StreakWarningBanner } from './StreakWarningBanner';
import { useStore } from '@/lib/store';
import { useFamiliar } from '@/hooks/use-familiar';
import { useAuth } from '@/hooks/use-auth';
import { useRealtime } from '@/hooks/use-realtime';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { SPECIES_INFO, STATE_INFO } from '@/lib/constants';
import { Battery, Smile, BatteryLow, HeartPulse, Wifi, Coins, LogOut, Sparkles, BookOpen, Keyboard } from 'lucide-react';

export function PlayerDashboard() {
  const { user, familiar, partyResonance, evolving, petEffect, celebration, clearCelebration } = useStore();
  const setShowCodex = useStore((s) => s.setShowCodex);
  const setShowShortcutsHelp = useStore((s) => s.setShowShortcutsHelp);
  const { doLogout: logout } = useAuth();
  useRealtime();
  useKeyboardShortcuts();
  const fam = useStore((s) => s.familiar) ?? familiar;
  const [showProfile, setShowProfile] = useState(false);

  // Periodic refresh as a fallback to socket updates.
  useEffect(() => {
    const t = setInterval(() => {
      fetch('/api/familiar', { credentials: 'same-origin' })
        .then((r) => r.ok && r.json())
        .then((d) => d && useStore.getState().setFamiliar(d.familiar))
        .catch(() => {});
    }, 30000);
    return () => clearInterval(t);
  }, []);

  // Auto-clear celebration overlay after 2.6s.
  useEffect(() => {
    if (!celebration) return;
    const id = setTimeout(clearCelebration, 2600);
    return () => clearTimeout(id);
  }, [celebration, clearCelebration]);

  if (!user || !fam) return null;

  const stateInfo = STATE_INFO[fam.state];

  return (
    <div className="min-h-screen flex flex-col">
      <AmbientBackground />
      {/* Header */}
      <header className="border-b border-arcane/15 bg-card/40 backdrop-blur sticky top-0 z-20">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-lg logo-animated flex items-center justify-center font-bold text-sm shrink-0 animate-float-slow text-white">
              D&D
            </div>
            <div className="min-w-0">
              <div className="font-semibold truncate">
                {user.characterName || user.username}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {user.username} · игрок
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <StreakBadge />
            <LiveClock />
            <MusicTrackSelector />
            <VolumeControl />
            <Badge variant="outline" className="border-amber-400/40 text-amber-400">
              <Coins className="h-3 w-3 mr-1" /> {fam.coins}
            </Badge>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4" /> Выйти
            </Button>
          </div>
        </div>
      </header>

      {/* Main: desktop = 3D canvas (3/5) + right panels (2/5); plus far-left party sidebar on xl */}
      <main className="flex-1 mx-auto max-w-7xl w-full p-3 md:p-4">
        <StreakWarningBanner />
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 md:gap-4">
          {/* Party roster — hidden on small/medium, visible as left column on xl */}
          <aside className="hidden xl:block xl:col-span-1 order-3 xl:order-1">
            <div className="sticky top-20">
              <PartyRosterSidebar />
            </div>
          </aside>

          {/* 3D Canvas */}
          <section className="lg:col-span-3 xl:col-span-3 order-1 xl:order-2">
            <div
              className="relative rounded-2xl overflow-hidden border-2 bg-gradient-to-b from-[#0a0a1a] to-[#15152a] scanlines"
              style={{
                height: 'clamp(340px, 52vh, 580px)',
                borderColor: `${SPECIES_INFO[fam.species].accent}40`,
                boxShadow: `inset 0 0 24px -8px ${SPECIES_INFO[fam.species].accent}40, 0 0 24px -8px ${SPECIES_INFO[fam.species].accent}30`,
              }}
            >
              <FamiliarCanvas
                species={fam.species}
                stage={fam.stage}
                state={fam.state}
                evolving={evolving}
                onEvolutionComplete={() => useStore.getState().setEvolving(false)}
                petTrigger={petEffect}
                modelConfigOverride={{
                  // Full persisted evolution modelConfig (colors + ornaments + aura).
                  ...(fam.modelConfig ?? {}),
                  // Player-chosen accent color (unlocked at Stage 2) overrides the
                  // emissive + accent tint so customization still works on top of evolution.
                  ...(fam.accentColor
                    ? { emissiveColor: fam.accentColor, accentColor: fam.accentColor }
                    : {}),
                }}
                thoughts={{
                  energy: fam.energy,
                  mood: fam.mood,
                  fatigue: fam.fatigue,
                  health: fam.health,
                  sync: fam.sync,
                }}
              />
              {/* Floating stat-change indicators (+20 Энергия etc.) */}
              <FloatingStatNumbers />

              {/* Overlay info */}
              <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none">
                <Badge className="bg-arcane/30 border-arcane/40 backdrop-blur w-fit">
                  {SPECIES_INFO[fam.species].label} · Стадия {fam.stage}
                </Badge>
                <Badge
                  className="backdrop-blur w-fit"
                  style={{ backgroundColor: `${stateInfo.color}30`, borderColor: `${stateInfo.color}66`, color: stateInfo.color }}
                >
                  {stateInfo.label}
                </Badge>
              </div>
              <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5 pointer-events-none">
                <div className="rounded-lg bg-black/30 backdrop-blur px-2 py-1 text-[10px] text-muted-foreground border border-white/5">
                  перетаскивай для вращения
                </div>
                <div className="flex items-center gap-1 pointer-events-auto">
                  <button
                    onClick={() => setShowCodex(true)}
                    className="rounded-lg bg-black/40 backdrop-blur px-2 py-1 text-[10px] text-arcane border border-arcane/30 hover:bg-arcane/20 hover:border-arcane/60 transition-colors flex items-center gap-1"
                    title="Кодекс эволюций (C)"
                  >
                    <BookOpen className="h-3 w-3" /> Кодекс
                  </button>
                  <button
                    onClick={() => setShowShortcutsHelp(true)}
                    className="rounded-lg bg-black/40 backdrop-blur px-2 py-1 text-[10px] text-muted-foreground border border-white/10 hover:bg-white/10 hover:text-foreground transition-colors flex items-center gap-1"
                    title="Горячие клавиши (?)"
                  >
                    <Keyboard className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2 pointer-events-none">
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-muted-foreground">Имя фамильяра</div>
                  <button
                    onClick={() => setShowProfile(true)}
                    className="text-lg font-semibold text-glow-arcane truncate hover:underline decoration-arcane/50 underline-offset-4 cursor-pointer pointer-events-auto text-left"
                    title="Открыть профиль"
                  >
                    {fam.name}
                  </button>
                  {fam.bio && (
                    <p className="text-[10px] text-muted-foreground/80 italic line-clamp-2 mt-0.5 max-w-xs">{fam.bio}</p>
                  )}
                </div>
                {fam.evolutionPath && (
                  <Badge variant="outline" className="border-frost/40 text-frost backdrop-blur shrink-0">
                    {fam.evolutionPath}
                  </Badge>
                )}
              </div>
            </div>

            {/* Stat bars below canvas on desktop too, for compactness */}
            <Card className="arcane-border mt-3">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>Параметры</span>
                  {partyResonance && (
                    <span className="text-xs text-muted-foreground font-normal">
                      Резонанс партии: {partyResonance.averageMood}%
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <StatBar label="Энергия" value={fam.energy} icon={<Battery className="h-3.5 w-3.5" />} />
                <StatBar label="Настроение" value={fam.mood} icon={<Smile className="h-3.5 w-3.5" />} />
                <StatBar label="Усталость" value={fam.fatigue} icon={<BatteryLow className="h-3.5 w-3.5" />} colorClass="from-violet-500 to-purple-600" />
                <StatBar label="Здоровье" value={fam.health} icon={<HeartPulse className="h-3.5 w-3.5" />} />
                <StatBar label="Синхронизация" value={fam.sync} icon={<Wifi className="h-3.5 w-3.5" />} colorClass="from-arcane to-frost" />
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-muted-foreground">Монеты</span>
                  <span className="font-mono text-amber-400 tabular-nums">{fam.coins}</span>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Right panels — primary always visible; secondary hidden on mobile (in drawer) */}
          <section className="lg:col-span-2 xl:col-span-1 order-2 xl:order-3 space-y-3 md:space-y-4">
            <Card className="arcane-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-arcane" /> Действия
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ActionButtons />
              </CardContent>
            </Card>

            <DailyBuffPanel />
            <QuestTrackerPanel />
            {/* Secondary panels — hidden on mobile, available in the drawer */}
            <div className="hidden lg:block space-y-3 md:space-y-4">
              <LeaderboardPanel />
              <NotificationFeed />
              <BuffsPanel />
              <AchievementsPanel />
              <CustomizePanel />
              <ActivityLogPanel />
            </div>

            {/* Mobile: show party roster inline at the bottom */}
            <div className="xl:hidden hidden lg:block">
              <PartyRosterSidebar />
            </div>
          </section>
        </div>

        {/* Mobile floating drawer for secondary panels */}
        <MobilePanelsDrawer />
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-arcane/15 bg-card/30 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-3 text-xs text-muted-foreground flex flex-wrap items-center justify-between gap-2">
          <span>D&D Familiar Tamagotchi · Время по Москве · Decay каждый час</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                try { window.localStorage.removeItem('ddt_onboarding_done_v1'); } catch { /* noop */ }
                window.location.reload();
              }}
              className="text-muted-foreground/70 hover:text-arcane transition-colors"
              title="Показать обучение снова"
            >
              Обучение
            </button>
            {partyResonance?.buff && (
              <span className="text-arcane">{partyResonance.buff}</span>
            )}
          </div>
        </div>
      </footer>

      <MiniGame />
      <EvolutionModal />
      <EvolutionCodex />
      <ShortcutsHelp />
      <OnboardingTour />
      <FamiliarProfileModal open={showProfile} onClose={() => setShowProfile(false)} />
      <CelebrationOverlay celebration={celebration} />
    </div>
  );
}
