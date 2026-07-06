'use client';

import { useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { BuffsPanel } from './BuffsPanel';
import { AchievementsPanel } from './AchievementsPanel';
import { CustomizePanel } from './CustomizePanel';
import { ActivityLogPanel } from './ActivityLogPanel';
import { PartyRosterSidebar } from './PartyRosterSidebar';
import { LeaderboardPanel } from './LeaderboardPanel';
import { Layers, X } from 'lucide-react';

/**
 * Mobile-only floating button that opens a swipeable drawer containing the
 * secondary panels (Buffs, Achievements, Customize, Activity Log, Party).
 * Visible only on screens below lg. The primary panels (Actions, DailyBuff,
 * Quest) stay inline above the canvas.
 */
export function MobilePanelsDrawer() {
  const [open, setOpen] = useState(false);

  return (
    <Drawer open={open} onOpenChange={setOpen} shouldScaleBackground>
      <DrawerTrigger asChild>
        <Button
          className="lg:hidden fixed bottom-4 right-4 z-30 h-12 w-12 rounded-full p-0 bg-gradient-to-br from-arcane to-frost shadow-lg glow-arcane"
          size="icon"
          aria-label="Открыть панели"
        >
          <Layers className="h-5 w-5" />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[85vh] bg-card/95 backdrop-blur-xl border-arcane/30">
        <DrawerHeader className="pb-2 flex flex-row items-center justify-between">
          <DrawerTitle className="flex items-center gap-2 text-base">
            <Layers className="h-4 w-4 text-arcane" /> Панели
          </DrawerTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </DrawerHeader>
        <div className="overflow-y-auto fantasy-scroll px-4 pb-6 space-y-3" style={{ maxHeight: 'calc(85vh - 60px)' }}>
          <LeaderboardPanel />
          <BuffsPanel />
          <AchievementsPanel />
          <CustomizePanel />
          <ActivityLogPanel />
          <PartyRosterSidebar />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
