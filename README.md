# D&D Familiar Tamagotchi 🐉

Интерактивный 3D-тамагочи для D&D-партии. У каждого игрока есть 3D-фамильяр, требующий ухода в реальном времени. Built with Next.js 16 + React Three Fiber + Prisma + Supabase.

![D&D Familiar Tamagotchi](https://img.shields.io/badge/Next.js-16-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Prisma](https://img.shields.io/badge/Prisma-PostgreSQL-indigo) ![Supabase](https://img.shields.io/badge/Supabase-Realtime-green)

## ✨ Возможности

- **4 стилизованных 3D-вида** (конструкт/дракон/сорока/кукла) с анимациями состояний
- **Серверный decay** по времени Европа/Москва (cron каждый час)
- **Слепая эволюция** — 24 пути эволюции, скрытые баффы
- **Действия**: кормить, играть, гладить, спать, будить + мини-игра
- **DM-панель** — слайдеры статов, глобальные события, квесты с шаблонами
- **Достижения** (13 шт.) с наградами + детальная модалка
- **Подарки** между игроками (3 типа, cooldown)
- **Лидерборд** с медалями топ-3
- **Кастомизация** — переименование, акцентный цвет, био
- **Звук** — 10 SFX + 4 ambient-трека + volume slider (Web Audio API)
- **Real-time** через Supabase Realtime (с polling fallback для dev)
- **Адаптивный UI** — desktop 3-колонки + mobile swipe drawer
- **Профиль фамильяра** — клик по имени для полного профиля
- **Мысли фамильяра** — speech bubbles по состоянию
- **Уведомления** + Хроника + Celebration overlay

## 🚀 Быстрый старт (локальная разработка)

### Требования
- [Bun](https://bun.sh) >= 1.0
- Node.js >= 18

### Установка

```bash
git clone https://github.com/kostabank/dd-familiar-tamagotchi.git
cd dd-familiar-tamagotchi
bun install
```

### Локальная БД (SQLite для dev)

Проект использует PostgreSQL в продакшене, но для локальной разработки есть SQLite-схема:

```bash
# Запушить SQLite-схему в локальную БД
bun run db:push:dev

# Сгенерировать Prisma client для SQLite
bun run db:generate:dev

# Заполнить БД: опции эволюции + достижения + DM-аккаунт
bun run seed
```

### Запуск dev-сервера

```bash
bun run dev
```

Откройте http://localhost:3000

### Демо-аккаунты

| Роль | Логин | Пароль |
|---|---|---|
| Мастер (DM) | `dm` | `dmdnd123` |
| Игрок | `raven` | `pass1234` |
| Игрок | `thorn` | `pass1234` |

## 🌐 Деплой на Vercel + Supabase

### Шаг 1: Создайте проект Supabase

1. Зайдите на [supabase.com](https://supabase.com) → New Project
2. Запомните пароль БД (нужен для DATABASE_URL)
3. Дождитесь создания проекта (~2 мин)
4. **Project Settings → Database**: скопируйте Connection String
   - Формат: `postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres`
5. **Project Settings → API**: скопируйте URL и anon key
   - URL: `https://[PROJECT_REF].supabase.co`
   - Anon Key: `eyJhbG...` (длинная строка)

### Шаг 2: Залейте схему в Supabase

Локально (с env vars Supabase):

```bash
# Установите env vars (или добавьте в .env)
export DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres"

# Запушите схему
bun run db:push

# Заполните БД
bun run seed
```

Или выполните SQL напрямую в Supabase SQL Editor (сгенерируйте через `prisma migrate diff`).

### Шаг 3: Деплой на Vercel

1. Зайдите на [vercel.com](https://vercel.com) → New Project
2. Импортируйте репозиторий `kostabank/dd-familiar-tamagotchi`
3. **Settings → Environment Variables** — добавьте:

| Variable | Value |
|---|---|
| `DATABASE_URL` | `postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://[PROJECT_REF].supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbG...` (anon key) |
| `JWT_SECRET` | (любая длинная строка, `openssl rand -base64 32`) |
| `ADMIN_EVENT_SECRET` | `dnd-event-secret` |
| `CRON_SECRET` | (любая строка, например `my-cron-secret-123`) |

4. Deploy!
5. После деплоя откройте проект — всё должно работать.

### Шаг 4: Настройте Vercel Cron

Cron уже настроен в `vercel.json` (каждый час: `0 * * * *`).

**Важно:** Vercel Free tier поддерживает только daily cron. Для hourly cron:
- **Вариант A:** Vercel Pro ($20/мес) — hourly cron работает из коробки
- **Вариант B (бесплатно):** GitHub Action, который дёргает endpoint каждый час:

Создайте `.github/workflows/cron.yml`:
```yaml
name: Hourly Tick
on:
  schedule:
    - cron: '0 * * * *'
jobs:
  tick:
    runs-on: ubuntu-latest
    steps:
      - run: |
          curl -X POST https://YOUR_APP.vercel.app/api/cron/tick \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

И добавьте `CRON_SECRET` в GitHub repo Secrets.

### Шаг 5: Настройте Supabase Realtime

1. В Supabase Dashboard → **Realtime** → включите
2. Всё! API-роуты уже используют `broadcastFamiliarUpdate()` через Supabase channels

## 🏗️ Архитектура

```
┌─────────────────────┐     ┌──────────────────┐
│   Vercel (Next.js)  │────▶│  Supabase (PG)   │
│   - UI + API routes │     │  - PostgreSQL    │
│   - 3D (R3F)        │     │  - Realtime WS   │
│   - Vercel Cron     │     │                  │
└─────────┬───────────┘     └────────┬─────────┘
          │                          │
          │   Supabase Realtime      │
          │   (WebSocket broadcast)  │
          ▼                          ▼
   ┌─────────────────────────────────────┐
   │        Браузер (клиент)              │
   │  - useRealtime hook                  │
   │  - Supabase JS client (WS)           │
   │  - Polling fallback (15s, dev only)  │
   └─────────────────────────────────────┘
```

### Real-time: Supabase Realtime (замена Socket.io)

Раньше проект использовал отдельный Socket.io mini-service на порту 3003. После миграции:
- **1 порт вместо 2** — только Next.js (3000)
- **Supabase Realtime** — встроен в Supabase, WebSocket broadcast через channels
- **Polling fallback** — в локальном dev (без Supabase env vars) клиент опрашивает `/api/familiar` каждые 15с
- **Vercel Cron** — `/api/cron/tick` вызывается каждый час для применения decay

## 🧪 Тестирование

### Локально

```bash
# 1. Запустите dev-сервер
bun run dev

# 2. Откройте http://localhost:3000
# 3. Залогиньтесь как dm/dmdnd123 (Мастер) или raven/pass1234 (игрок)
```

### Что тестировать

- **Игрок**: кормить, играть, гладить, спать, эволюция, достижения, подарки, кастомизация
- **DM**: слайдеры статов, глобальные события (Буря/Праздник), квесты с шаблонами
- **Real-time**: откройте 2 вкладки (raven + thorn), отправьте подарок — получатель увидит toast + конфетти
- **Мобильный**: сузьте окно <1024px → плавающая кнопка "Открыть панели" (drawer)
- **Звук**: 4 трека в шапке, volume slider, SFX на действия
- **Cron**: `curl http://localhost:3000/api/cron/tick` — применит decay вручную

### API проверки

```bash
# Логин
curl -s -c /tmp/cj -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"raven","password":"pass1234"}'

# Статы фамильяра
curl -s -b /tmp/cj http://localhost:3000/api/familiar

# Достижения
curl -s -b /tmp/cj http://localhost:3000/api/familiar/achievements

# Ручной cron tick
curl -s http://localhost:3000/api/cron/tick
```

## 🛠️ Технологии

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui
- **3D**: Three.js, @react-three/fiber, @react-three/drei
- **БД**: Prisma ORM + PostgreSQL (Supabase)
- **Real-time**: Supabase Realtime (WebSocket)
- **Cron**: Vercel Cron Jobs
- **Звук**: Web Audio API (синтезированные SFX + ambient)
- **Auth**: JWT (httpOnly cookies) + bcrypt

## 📁 Структура

```
├── prisma/
│   ├── schema.prisma          # PostgreSQL (продакшн)
│   ├── schema.dev.prisma      # SQLite (локальный dev)
│   ├── seed.ts                # Опции эволюции + DM-аккаунт
│   └── seed-achievements.ts   # 13 достижений
├── src/
│   ├── app/
│   │   ├── api/               # REST API + cron endpoint
│   │   ├── page.tsx           # Главный маршрут (auth gate)
│   │   └── layout.tsx
│   ├── components/
│   │   ├── familiar/          # 3D-модели (R3F)
│   │   └── game/              # UI-панели
│   ├── hooks/                 # useRealtime, useFamiliar, useSound, etc.
│   └── lib/                   # supabase.ts, db.ts, auth.ts, familiar-logic.ts
├── vercel.json                # Cron config
└── .env.example               # Шаблон env vars
```

## 📜 Лицензия

MIT
