'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useStore } from '@/lib/store';
import type { Species } from '@/lib/types';
import { SPECIES_INFO } from '@/lib/constants';

// 3D preview is client-only (three.js).
const FamiliarCanvas = dynamic(
  () => import('@/components/familiar/FamiliarCanvas').then((m) => m.default),
  { ssr: false },
);

const SPECIES_LIST: Species[] = ['construct', 'dragon', 'magpie', 'doll'];

export function AuthScreen() {
  const setAuth = useStore((s) => s.setAuth);
  const [tab, setTab] = useState<'login' | 'register'>('login');

  // login form
  const [loginUser, setLoginUser] = useState('dm');
  const [loginPass, setLoginPass] = useState('dmdnd123');

  // register form
  const [regUser, setRegUser] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regChar, setRegChar] = useState('');
  const [regSpecies, setRegSpecies] = useState<Species>('dragon');
  const [regFamiliarName, setRegFamiliarName] = useState('');
  const [isDM, setIsDM] = useState(false);
  const [dmCode, setDmCode] = useState('');
  const [busy, setBusy] = useState(false);

  const doLogin = async () => {
    setBusy(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUser, password: loginPass }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Ошибка входа');
        return;
      }
      setAuth(data.user, data.familiar);
      toast.success(`С возвращением, ${data.user.username}!`);
    } finally {
      setBusy(false);
    }
  };

  const doRegister = async () => {
    setBusy(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: regUser,
          password: regPass,
          characterName: regChar,
          species: regSpecies,
          familiarName: regFamiliarName,
          role: isDM ? 'dm' : 'player',
          dmCode,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Ошибка регистрации');
        return;
      }
      setAuth(data.user, data.familiar);
      toast.success('Аккаунт создан!');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 h-12 w-12 rounded-xl logo-animated flex items-center justify-center font-bold text-sm animate-float-slow text-white shadow-lg">
            D&D
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-glow-arcane">
            D&D Familiar Tamagotchi
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ухаживай за 3D-фамильяром в реальном времени
          </p>
        </div>

        <Card className="arcane-border glow-arcane">
          <CardHeader>
            <CardTitle className="text-center text-lg">Вход в партию</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={tab} onValueChange={(v) => setTab(v as 'login' | 'register')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Войти</TabsTrigger>
                <TabsTrigger value="register">Регистрация</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="lu">Имя пользователя</Label>
                  <Input id="lu" value={loginUser} onChange={(e) => setLoginUser(e.target.value)} placeholder="dm" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lp">Пароль</Label>
                  <Input id="lp" type="password" value={loginPass} onChange={(e) => setLoginPass(e.target.value)} />
                </div>
                <Button onClick={doLogin} disabled={busy} className="w-full">
                  {busy ? 'Входим...' : 'Войти'}
                </Button>
                <div className="text-xs text-muted-foreground text-center space-y-0.5">
                  <p>Демо-Мастер: <span className="font-mono text-arcane">dm / dmdnd123</span></p>
                  <p>Демо-Игрок: <span className="font-mono text-arcane">raven / pass1234</span></p>
                </div>
              </TabsContent>

              <TabsContent value="register" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="ru">Логин</Label>
                    <Input id="ru" value={regUser} onChange={(e) => setRegUser(e.target.value)} placeholder="hero" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rp">Пароль</Label>
                    <Input id="rp" type="password" value={regPass} onChange={(e) => setRegPass(e.target.value)} placeholder="≥ 6 символов" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rc">Имя персонажа</Label>
                  <Input id="rc" value={regChar} onChange={(e) => setRegChar(e.target.value)} placeholder="Эльра Старшая" />
                </div>

                {!isDM && (
                  <>
                    <div className="space-y-2">
                      <Label>Вид фамильяра</Label>
                      {/* Live 3D preview of the selected species */}
                      <div
                        className="relative rounded-xl overflow-hidden border bg-gradient-to-b from-[#0a0a1a] to-[#15152a] scanlines h-44"
                        style={{
                          borderColor: `${SPECIES_INFO[regSpecies].accent}40`,
                          boxShadow: `inset 0 0 20px -6px ${SPECIES_INFO[regSpecies].accent}40`,
                        }}
                      >
                        <FamiliarCanvas
                          species={regSpecies}
                          stage={1}
                          state="happy"
                        />
                        <div className="absolute top-2 left-2 pointer-events-none">
                          <span
                            className="text-xs font-medium px-2 py-0.5 rounded-md backdrop-blur"
                            style={{
                              backgroundColor: `${SPECIES_INFO[regSpecies].accent}25`,
                              color: SPECIES_INFO[regSpecies].accent,
                            }}
                          >
                            {SPECIES_INFO[regSpecies].label}
                          </span>
                        </div>
                        <div className="absolute bottom-2 right-2 pointer-events-none text-[10px] text-muted-foreground/80 bg-black/30 backdrop-blur px-2 py-0.5 rounded">
                          вращай мышью
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {SPECIES_LIST.map((sp) => (
                          <button
                            key={sp}
                            type="button"
                            onClick={() => setRegSpecies(sp)}
                            className={`rounded-lg border p-2 text-left transition-all ${
                              regSpecies === sp
                                ? 'border-arcane bg-arcane/15 glow-arcane'
                                : 'border-white/10 bg-white/5 hover:border-arcane/50'
                            }`}
                          >
                            <div className="text-sm font-semibold">{SPECIES_INFO[sp].label}</div>
                            <div className="text-[10px] text-muted-foreground leading-tight">{SPECIES_INFO[sp].tagline}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rfn">Имя фамильяра</Label>
                      <Input id="rfn" value={regFamiliarName} onChange={(e) => setRegFamiliarName(e.target.value)} placeholder="Искра" />
                    </div>
                  </>
                )}

                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDM}
                    onChange={(e) => setIsDM(e.target.checked)}
                    className="accent-arcane"
                  />
                  Я Мастер Подземелий
                </label>
                {isDM && (
                  <div className="space-y-2">
                    <Label htmlFor="dmc">Код Мастера</Label>
                    <Input id="dmc" value={dmCode} onChange={(e) => setDmCode(e.target.value)} placeholder="dungeon-master-2024" />
                    <p className="text-[10px] text-muted-foreground">Код: <span className="font-mono">dungeon-master-2024</span></p>
                  </div>
                )}

                <Button onClick={doRegister} disabled={busy} className="w-full">
                  {busy ? 'Создаём...' : 'Создать персонажа'}
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
