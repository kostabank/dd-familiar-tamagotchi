'use client';

import dynamic from 'next/dynamic';
import { useAuth } from '@/hooks/use-auth';
import { useStore } from '@/lib/store';
import { AuthScreen } from '@/components/game/AuthScreen';
import { Loader2 } from 'lucide-react';

// The dashboard imports three.js / R3F which must be client-only.
const PlayerDashboard = dynamic(
  () => import('@/components/game/PlayerDashboard').then((m) => m.PlayerDashboard),
  { ssr: false }
);
const AdminPanel = dynamic(
  () => import('@/components/game/AdminPanel').then((m) => m.AdminPanel),
  { ssr: false }
);

export default function Page() {
  const { user, authLoading, authed } = useAuth();
  const role = useStore((s) => s.user?.role);

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-arcane" />
        <p className="text-sm text-muted-foreground">Загрузка фамильяра...</p>
      </div>
    );
  }

  if (!authed || !user) {
    return <AuthScreen />;
  }

  if (role === 'dm') {
    return <AdminPanel />;
  }

  return <PlayerDashboard />;
}
