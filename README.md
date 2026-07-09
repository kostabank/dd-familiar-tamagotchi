# D&D Familiar Tamagotchi 🐉

Интерактивный 3D-тамагочи для D&D-партии. У каждого игрока есть 3D-фамильяр, требующий ухода в реальном времени. Мастер (DM) управляет партией через админ-панель.

![Next.js 16](https://img.shields.io/badge/Next.js-16-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Prisma](https://img.shields.io/badge/Prisma-PostgreSQL-indigo) ![Supabase](https://img.shields.io/badge/Supabase-Realtime-green)

---

## 📋 Содержание
- [Возможности для игроков](#-возможности-для-игроков)
- [Возможности для Мастера (DM)](#-возможности-для-мастера-dm)
- [Быстрый старт](#-быстрый-старт)
- [Деплой на Vercel + Supabase](#-деплой-на-vercel--supabase)
- [3D-модели](#-3d-модели)
- [Архитектура](#-архитектура)

---

## 🎮 Возможности для игроков

### Базовый уход за фамильяром
- **Кормить** (+20 энергия, +5 настроение, +3 синхр.) — нельзя когда спит или слишком устал
- **Играть** (мини-игра → +20 настроение, +10 синхр., +монеты при успехе)
- **Гладить** (+3 настроение, +1 синхр.) — лёгкое действие с cooldown 30с
- **Усыпить / Разбудить** — сон восстанавливает усталость (4 часа реального времени)

### Параметры фамильяра (decay по времени МСК)
| Параметр | Что значит | Decay |
|---|---|---|
| Энергия | Голод | −5 каждые 6 часов |
| Настроение | Счастье | −5 каждые 6 часов |
| Усталость | Накопление от действий | растёт от действий, −10/час во сне |
| Здоровье | Жизненная сила | −2/час если энергия < 10 |
| Синхронизация | Связь с игроком | нужна для эволюции (цель: 100) |
| Монеты | Валюта | за действия, квесты, достижения |

### Эволюция (слепая адаптация)
- Накопи **100 синхронизации** → открывается эволюция
- Выбери **1 из 3 путей** (всего 24 пути: 4 вида × 3 стадии × 3 пути)
- **Бафф пути скрыт** до выбора и необратим
- Каждая стадия меняет 3D-модель + усиливает боевой бафф:
  - **Стадия 1**: +1 к проверке Истории (1/день)
  - **Стадия 2**: +1d4 к атаке (1/день)
  - **Стадия 3**: переброс проваленного спасброска (1/день)

### Кодекс эволюций (для игрока)
- Каталог всех 24 путей
- Открытые пути — с 3D-превью + названием + описанием + баффом
- Закрытые — с замком и «???»
- Фильтр по виду, «только открытые», сортировка (стадия/алфавит/открытые)
- Поиск по названию/описанию/баффу
- **3D-галерея** — клик по превью открывает fullscreen с крупной моделью
- Бейдж «текущий» на выбранном пути

### Мини-игры (2 вида)
1. **Поймай сияющие сферы** — лови 5 сфер за 10 секунд
2. **Память рун** — запомни последовательность рун и повтори (3 уровня сложности: Лёгкий/Обычный/Сложный)

### Ежедневные награды и серии
- **Бафф дня** — забирай каждый день (+15 монет + mood boost)
- **Серии активности** (streak) — бонусные монеты за consecutive дни:
  - 🔥 3 дня = +10 монет
  - ⚡ 7 дней = +25 монет
  - 🌙 14 дней = +50 монет
  - 👑 30 дней = +100 монет
- **Streak milestone track** — визуальный прогресс серий
- **Streak warning** — баннер «Серия под угрозой!» если нет действий сегодня

### Достижения (13 шт.)
- По tier: Бронза / Серебро / Золото
- Награды: 20 / 50 / 150 монет соответственно
- Метрики: эволюции, монеты, игры, кормления, ласки, дни подряд, стадия, подарки
- Фильтр по tier + сортировка (прогресс/tier/алфавит)
- Детальная модалка с прогресс-баром

### Социальные функции
- **Подарки** между игроками (3 типа: Лакомство/Игрушка/Талисман, разные стоимость/бафф)
- **Лидерборд** с медалями топ-3
- **Party roster** — список всех игроков с их фамильярами + hover-тултипы

### Прочее
- **Кастомизация** — переименование, акцентный цвет (после стадии 2), био
- **Floating stat numbers** — анимированные +/- числа при действиях
- **Горячие клавиши** — F (кормить), P (гладить), S (сон), G (игра), E (эволюция), C (кодекс), ? (подсказка)
- **Onboarding tutorial** — 8 шагов для новичков (один раз, replay через footer)
- **Звук** — 10 SFX + 4 ambient-трека + volume slider
- **Real-time** — изменения видны всем игрокам мгновенно (через Supabase Realtime)

---

## 🛡️ Возможности для Мастера (DM)

### Управление фамильярами
- **Таблица всех фамильяров** партии с stat-барами
- **Слайдеры статов** — меняй энергию/настроение/усталость/здоровье/синхр. напрямую
- **Усыпить / Разбудить** любого фамильяра
- **Стадия →** — продвинуть эволюцию (для тестирования)
- **Полное исцеление** — восстановить здоровье

### Глобальные события
- **Магическая Буря** — −20 энергии всем фамильярам
- **Праздник** — +50 настроения всем

### Квесты
- **12 шаблонных квестов** (кормить/играть/гладить/спать/бафф-дня)
- **Создание кастомного квеста** — название, описание, метрика, цель, награды
- Квест назначается **всем игрокам** сразу
- Отслеживание прогресса по каждому игроку

### Кодекс эволюций (для DM)
- **Просмотр всех 24 путей** заранее (игроки видят только открытые)
- Выбор вида → 6 путей (3 для стадии I→II, 3 для II→III)
- 3D-превью каждого пути + описание + скрытый бафф
- Помогает планироватьencounters и понимать выборы игроков

### Управление Мастерами
- **Создание нового DM** — только существующий DM может создать нового
- Игроки **не могут** стать DM самостоятельно (нет self-registration)

---

## 🚀 Быстрый старт

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
```bash
# Запушить SQLite-схему в локальную БД
bun run db:push

# Сгенерировать Prisma client
bun run db:generate

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
| Игрок | `lyra` | `pass1234` |
| Игрок | `zara` | `pass1234` |

> ⚠️ **Смените пароль DM после первого деплоя!** Используйте функцию создания нового DM в админ-панели.

---

## 🌐 Деплой на Vercel + Supabase

### Шаг 1: Создайте проект Supabase
1. Зайдите на [supabase.com](https://supabase.com) → New Project
2. Запомните пароль БД
3. **Project Settings → Database** → скопируйте Connection String (Session pooler, port 5432)
4. **Project Settings → API** → скопируйте URL и anon key

### Шаг 2: Залейте схему в Supabase
```bash
export DATABASE_URL="postgresql://postgres:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
export DIRECT_URL="$DATABASE_URL"

# Запушите prod-схему (PostgreSQL)
bun run db:push:prod

# Заполните БД
DATABASE_URL="$DATABASE_URL" bun run seed
```

### Шаг 3: Деплой на Vercel
1. [vercel.com](https://vercel.com) → New Project → импортируйте репозиторий
2. **Settings → Environment Variables** — добавьте:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Connection string от Supabase |
| `DIRECT_URL` | То же самое |
| `JWT_SECRET` | `openssl rand -base64 32` |
| `CRON_SECRET` | любая строка (та же в GitHub Secrets) |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://[PROJECT].supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key |

3. Deploy!

### Шаг 4: GitHub Action для hourly cron (Vercel Free = daily cron)
1. В GitHub repo → **Settings → Secrets → Actions**:
   - `VERCEL_APP_URL` = `https://your-app.vercel.app`
   - `CRON_SECRET` = тот же, что на Vercel
2. `.github/workflows/cron-tick.yml` уже настроен (каждый час)

---

## 🎨 3D-модели

Приложение использует **процедурные 3D-модели** по умолчанию (с bloom-свечением). Чтобы добавить настоящие 3D-модели:

1. Скачайте CC0 low-poly модели (бесплатно) с [quaternius.com](https://quaternius.com/packs.html), [poly.pizza](https://poly.pizza), или [Sketchfab](https://sketchfab.com) (фильтр CC0)
2. Переименуйте в `dragon.glb`, `construct.glb`, `magpie.glb`, `doll.glb`
3. Положите в `public/models/`
4. Приложение **автоматически** подхватит их

Подробности — в [`public/models/CHECKLIST.md`](public/models/CHECKLIST.md) (требования к моделям, где брать, как тестировать).

---

## 🏗️ Архитектура

```
┌─────────────────────┐     ┌──────────────────┐
│   Vercel (Next.js)  │────▶│  Supabase (PG)   │
│   - UI + API routes │     │  - PostgreSQL    │
│   - 3D (R3F+bloom)  │     │  - Realtime WS   │
│   - Vercel/GH Cron  │     │                  │
└─────────┬───────────┘     └────────┬─────────┘
          │  Supabase Realtime       │
          ▼                          ▼
   ┌─────────────────────────────────────┐
   │        Браузер (клиент)              │
   │  - useRealtime hook                  │
   │  - Polling fallback (15s, dev only)  │
   └─────────────────────────────────────┘
```

### Стек
- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui
- **3D**: Three.js, @react-three/fiber, @react-three/drei, @react-three/postprocessing (bloom)
- **БД**: Prisma ORM + PostgreSQL (Supabase prod) / SQLite (dev)
- **Real-time**: Supabase Realtime (WebSocket broadcast)
- **Cron**: GitHub Actions (hourly tick, бесплатно на free tier)
- **Звук**: Web Audio API (синтезированные SFX + ambient)
- **Auth**: JWT (httpOnly cookies) + bcrypt, DM-аккаунты только через админ-панель

### Структура
```
├── prisma/
│   ├── schema.prisma          # PostgreSQL (продакшн, дефолтная)
│   ├── schema.dev.prisma      # SQLite (локальный dev)
│   ├── seed.ts                # 24 опции эволюции + DM-аккаунт
│   └── seed-achievements.ts   # 13 достижений
├── src/
│   ├── app/
│   │   ├── api/               # REST API + cron + admin
│   │   │   ├── familiar/      # действия игрока + codex + streak
│   │   │   ├── admin/         # familiars + event + quests + evolutions + create-dm
│   │   │   ├── auth/          # login + register (player only)
│   │   │   ├── party/         # roster + leaderboard
│   │   │   └── cron/tick      # hourly decay (GitHub Action)
│   │   ├── page.tsx           # auth gate → dashboard/admin
│   │   └── layout.tsx
│   ├── components/
│   │   ├── familiar/          # 3D-модели (R3F) + canvas + bloom
│   │   │   └── models/        # dragon/construct/magpie/doll + GLB loader + sprite
│   │   └── game/              # UI-панели (dashboard, admin, codex, mini-game, etc.)
│   ├── hooks/                 # use-familiar, use-auth, use-realtime, use-keyboard-shortcuts
│   └── lib/                   # db, auth, familiar-logic, supabase, store (zustand)
├── .github/workflows/cron-tick.yml  # hourly cron
├── public/models/             # GLB-модели (опционально) + CHECKLIST.md
└── vercel.json
```

## 📜 Лицензия
MIT
