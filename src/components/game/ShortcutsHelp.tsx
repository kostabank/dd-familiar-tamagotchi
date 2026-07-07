'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useStore } from '@/lib/store';
import { Utensils, Heart, Moon, Gamepad2, Sparkles, BookOpen, Keyboard } from 'lucide-react';

const SHORTCUTS: { keys: string[]; label: string; icon: React.ReactNode }[] = [
  { keys: ['F'], label: 'Покормить', icon: <Utensils className="h-4 w-4 text-ember" /> },
  { keys: ['P'], label: 'Погладить', icon: <Heart className="h-4 w-4 text-pink-400" /> },
  { keys: ['S'], label: 'Усыпить / Разбудить', icon: <Moon className="h-4 w-4 text-frost" /> },
  { keys: ['G'], label: 'Мини-игра', icon: <Gamepad2 className="h-4 w-4 text-venom" /> },
  { keys: ['E'], label: 'Эволюция (если доступна)', icon: <Sparkles className="h-4 w-4 text-arcane" /> },
  { keys: ['C'], label: 'Открыть Кодекс эволюций', icon: <BookOpen className="h-4 w-4 text-arcane" /> },
  { keys: ['?'], label: 'Эта подсказка', icon: <Keyboard className="h-4 w-4 text-muted-foreground" /> },
];

export function ShortcutsHelp() {
  const open = useStore((s) => s.showShortcutsHelp);
  const setOpen = useStore((s) => s.setShowShortcutsHelp);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-arcane" /> Горячие клавиши
          </DialogTitle>
          <DialogDescription>
            Быстрый уход за фамильяром без мыши. Клавиши не работают во время ввода текста или открытых модалок.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5 mt-2">
          {SHORTCUTS.map((s) => (
            <div
              key={s.keys[0]}
              className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-white/4 hover:bg-white/8 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span className="shrink-0">{s.icon}</span>
                <span className="text-sm">{s.label}</span>
              </div>
              <div className="flex gap-1">
                {s.keys.map((k) => (
                  <kbd key={k} className="kbd">
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground italic text-center mt-3">
          Подсказка: нажми <kbd className="kbd">?</kbd> в любой момент, чтобы открыть это окно снова.
        </p>
      </DialogContent>
    </Dialog>
  );
}
