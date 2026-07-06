# D&D Familiar Tamagotchi — Worklog

Project: Next.js 16 App Router + Prisma (SQLite) + React Three Fiber + Socket.io mini-service.
Goal: Build a D&D Familiar Tamagotchi with 4 stylized 3D species, server-time decay (Europe/Moscow), blind evolution, mini-game, DM admin panel.

---
Task ID: 0
Agent: orchestrator
Task: Bootstrap — install deps, write Prisma schema, set up shared lib.

Work Log:
- Installed three, @react-three/fiber, @react-three/drei, bcryptjs, jsonwebtoken, socket.io, socket.io-client, luxon, node-cron + types.
- Will write Prisma schema (User, Familiar, EvolutionOption, InteractionLog) and seed evolution options.
- Will create shared lib: types.ts, auth.ts (JWT + bcrypt), familiar-logic.ts (Luxon MSK decay calc, buff calc).

Stage Summary:
- Foundation in progress. Next: schema push, then parallel subagents for 3D models + socket service.

---
Task ID: 5
Agent: Subagent A (familiar-service)
Task: Build Socket.io mini-service on port 3003 with hourly cron tick (Europe/Moscow) that applies decay to all familiars, broadcasts updates, and handles admin global events.

Work Log:
- Read worklog + parent lib files (familiar-logic.ts, db.ts, constants.ts, types.ts) and Prisma schema. Confirmed shared helpers `applyDecay`, `toFamiliarDTO`, `computePartyResonance`, `nowMoscow`, `clamp` are all importable.
- Created `/home/z/my-project/mini-services/familiar-service/` with:
  - `package.json` (type:module, scripts: `dev: bun --hot index.ts`, `start: bun index.ts`; deps: socket.io, luxon, node-cron, @prisma/client).
  - `.env` with `DATABASE_URL=file:/home/z/my-project/db/custom.db` + `ADMIN_EVENT_SECRET=dnd-event-secret`.
  - `index.ts` (~200 lines) — Socket.io server on port 3003 with `path:'/'`, hourly cron `0 * * * *`, startup tick, admin:event handler, subscribe handler, graceful shutdown.
- Imports parent lib via relative paths: `../../src/lib/db`, `../../src/lib/familiar-logic`, `../../src/lib/constants`, `../../src/lib/types`. Bun resolves transitive `@prisma/client` from parent node_modules automatically.
- Ran `bun install` in the mini-service folder (succeeded, 25 packages, local node_modules created).
- Started service in background: `cd /home/z/my-project/mini-services/familiar-service && (bun run dev > /home/z/my-project/familiar-service.log 2>&1 &)`.
- Verified boot:
  - `[familiar-service] WebSocket server running on port 3003` ✓
  - `[familiar-service] cron scheduled: '0 * * * *' (hourly, Europe/Moscow semantics via luxon)` ✓
  - `[familiar-service] [MSK tick] running at 2026-07-06T22:17:46.928+03:00` ✓ (Moscow ISO time)
  - Startup tick ran immediately and completed cleanly (0 familiars in DB currently — Agent 0 only set up foundation).
  - Port 3003 LISTEN confirmed via ss.
- Verified socket events with ad-hoc bun -e client checks (NOT a test file, just runtime verification):
  - `connect` → server logs `client connected: <id>` ✓
  - `subscribe` → server sends `party:resonance {averageMood:0, playerCount:0, buff:null}` ✓
  - `admin:event { event:'storm', token:'dnd-event-secret' }` → server processes, queries DB, replies `admin:event {event:'storm', affected:0, timestamp:'2026-07-06T22:18:12.733+03:00'}` ✓
  - `disconnect` → server logs `client disconnected` ✓
- Service still running stably on PID 2017 (`bun --hot index.ts`) after all tests.

Key design decisions:
- Server->Client events: `familiar:update` ({familiar: FamiliarDTO, userId}), `party:resonance` ({averageMood, playerCount, buff}), `admin:event` ({event, affected, timestamp}).
- Client->Server events: `subscribe` (server replies with current state of ALL familiars + party resonance), `admin:event` ({event:'storm'|'festival', token}). Storm = energy-20 clamped; festival = mood+50 clamped; both log to InteractionLog with actionType='event' and re-broadcast all familiar:update + party:resonance.
- Each familiar processed in try/catch inside the tick loop so one bad record never crashes the whole tick.
- `sleepStartedAt` normalized to Date before persisting (applyDecay may return string|Date|null).
- Admin token check is dev-friendly: trusts if absent, rejects if present but wrong (matches ADMIN_EVENT_SECRET env).

Stage Summary:
- familiar-service is live on port 3003, broadcasting on the `/` path so Caddy can forward `XTransformPort=3003` requests. Hourly cron will apply decay to all familiars using Europe/Moscow time once Agent 1/2/3 populate the DB with Users + Familiars. Frontend (Agent 4) can connect via `io("/?XTransformPort=3003")` and listen for `familiar:update` / `party:resonance` / `admin:event`.

---
Task ID: 6
Agent: Subagent B (3D Familiar Models)
Task: Build stylized low-poly dark-fantasy 3D familiar models with React Three Fiber for 4 species (construct, dragon, magpie, doll) + state animations + evolution overlay + Canvas wrapper.

Work Log:
- Created 9 files under `src/components/familiar/`:
  - `FamiliarCanvas.tsx` — Canvas wrapper: camera [0,1,5]/fov 45/dpr [1,2], `#0F0F1A` background + fog, ambient + spotLight + purple pointLight, Suspense, `<Environment preset="night">`, `<ContactShadows>` at y=-1.5, `<OrbitControls>` (autoRotate + damping, disabled while evolving so the evolution camera dolly works).
  - `models/FamiliarModel.tsx` — dispatcher; exports `DEFAULTS: Record<Species, ModelConfig>` matching spec exactly; merges `modelConfigOverride`, applies stage scale `1 + (stage-1)*0.15`, overlays `<ZParticles>` when sleeping.
  - `models/ConstructFamiliar.tsx` — flat-shaded matte-metal octahedron shell, glowing emissive core sphere inside (toneMapped=false), emissive eye on a face, two orbital torus rings (radii 1.4/1.6, different axes/speeds). State-driven ring speed & emissive pulse via useFrame.
  - `models/DragonFamiliar.tsx` — elongated teal body sphere [1,0.7,1.4], head at z=0.9, forward-tilted horn cone, two iridescent `meshPhysicalMaterial` wings (transmission 0.6, iridescence 1, IOR 1.5) animated with sin flap, sinuous 3-segment parented tail with tip spike, two dark eyes.
  - `models/MagpieFamiliar.tsx` — black body + flattened white belly + smaller head, vivid orange beak cone, two white eye spheres with black pupils, two horizontal black wing planes (offset to pivot from body) with flap, long metallic black tail plane (offset, wagging around Y).
  - `models/DollFamiliar.tsx` — baggy fabric body sphere scaled [1,1.1,1] with high-roughness low-metalness material, two black button-cylinder eyes, torus-arc smile mouth, four `Stitch` rings (extracted to module scope to satisfy `react-hooks/static-components`), four thin cylinder limbs in dark thread color.
  - `EvolutionAnimation.tsx` — Canvas-level overlay: drei `<Sparkles count=60 scale=6 size=4 speed=0.6>`, pointLight intensity 0→10→0 via `sin(t/1.5*PI)*10`, parent group spins at `delta*8`, camera dolly lerps z 5→3.2→5, fires `onComplete` after 2s.
  - `ZParticles.tsx` — chose spec-permitted fallback (3 glowing icy-blue emissive octahedrons) over drei `<Text>` for sandbox reliability; drift up + fade in/out via `sin(local*PI)` + loop.
  - `state-anim.ts` — internal helper: `getStateTargets(state)` (Float speed/intensity, emissive multiplier, group pos/rot targets) + `applyStateToGroup()` with frame-rate-independent lerp. Encodes happy=fast/bouncy+1.4× emissive, hungry=sink to y=-0.4+0.3× emissive, sad=rotate away+jitter, tired=slow bob+nod, sleeping=lie on side (rotZ=π/2*0.6, rotX=0.2)+0.2× emissive+show Z, normal=gentle float.
- Hierarchy: outer `<group ref=rootRef>` (state pos/rot) → drei `<Float>` → inner species meshes. Material refs let `useFrame` lerp emissiveIntensity per-state for smooth dim transitions.
- Lint clean (0 errors, 0 warnings). tsc clean for all `familiar/**` files. Two lint fixes during dev: extracted doll's `Stitch` to module scope (`react-hooks/static-components`); added inline `eslint-disable-next-line react-hooks/immutability` for the idiomatic R3F `camera.position.z` mutation in `EvolutionAnimation` useFrame.

Stage Summary:
3D familiar system complete and lint-clean. Page/UI agents can mount it via:
```tsx
import FamiliarCanvas from '@/components/familiar/FamiliarCanvas';
<FamiliarCanvas species={...} stage={1|2|3} state={...} modelConfigOverride={...} evolving={...} onEvolutionComplete={...} />
```
Canvas fills its parent — wrap in a `div` with explicit width/height (e.g. `h-[480px]` or `aspect-square`). Dark-fantasy palette preserved across all species (purples, teals, ember orange, cold blue, burlap brown, charcoal).

---
Task ID: 4
Agent: orchestrator
Task: Build all REST API routes (auth, familiar actions, admin).

Work Log:
- Created src/lib/socket-client.ts — helper to broadcast familiar updates & trigger global events via the Socket.io mini-service (port 3003).
- Added broadcast:update / broadcast:resonance / admin:event:result handlers to the socket service.
- API routes created:
  - POST /api/auth/register (creates user + familiar for players; DM requires dmCode='dungeon-master-2024')
  - POST /api/auth/login, GET /api/auth/me, POST /api/auth/logout
  - GET /api/familiar (recomputes decay on read)
  - POST /api/familiar/feed (+20 energy, +5 mood, +3 sync, +15 fatigue; blocks if sleeping/fatigue>80)
  - POST /api/familiar/play (accepts {score,target}; success>=target => +20 mood/+10 sync/+10 coins, fail => +5/+2/+2)
  - POST /api/familiar/sleep, POST /api/familiar/wake
  - GET /api/familiar/evolution-options (3 options when sync>=100 & stage<3)
  - POST /api/familiar/evolve (blind evolution: stage++, sync=0, stores hiddenBuff)
  - GET /api/familiar/buffs (individual + debuff + party resonance)
  - GET /api/admin/familiars (DM only, all familiars + player info)
  - PATCH /api/admin/familiars/[id] (DM edits any stat)
  - POST /api/admin/event (DM storm/festival, forwards to socket service)
- All routes use getCurrentUser() (JWT cookie), recompute decay before actions, broadcast updates via socket.

Stage Summary:
- Backend complete & lint-clean. Auth via JWT httpOnly cookie. Real-time via socket service broadcasts.
- Ready for UI layer.

---
Task ID: 7-9
Agent: orchestrator
Task: Build UI (auth, dashboard, admin, mini-game, evolution modal), wire page.tsx, test end-to-end with agent-browser.

Work Log:
- globals.css: dark fantasy palette (#0F0F1A bg, #1A1A2E cards, #A855F7 arcane + #3B82F6 frost accents), custom scrollbars, glow utilities, animated gradient borders.
- layout.tsx: dark theme forced, Russian lang, D&D title.
- Zustand store (src/lib/store.ts): user, familiar, partyResonance, buffs, UI flags (evolving, showMiniGame, showEvolutionModal).
- Hooks: use-auth (me check + logout), use-familiar (feed/play/sleep/wake/evolve/refresh + toasts), use-socket (connects to port 3003, listens familiar:update/party:resonance/admin:event).
- UI components (src/components/game/):
  - AuthScreen: tabbed login/register, species picker (4 species), DM code gate.
  - StatBar: color-coded progress (red<30, amber<60, green≥60) with shimmer.
  - ActionButtons: Кормить/Играть/Спать/Разбудить/Адаптация (disabled states for sleeping/tired, sync threshold gate).
  - BuffsPanel: individual buff (by stage), debuff (health<20), party resonance, evolution path badge.
  - MiniGame: catch 5 glowing spheres in 10s (requestAnimationFrame loop), score→server, success/fail rewards.
  - EvolutionModal: 3 options each with live 3D RRF preview (FamiliarCanvas with modelConfig override), blind choice, hidden buff revealed after.
  - PlayerDashboard: desktop 60/40 (canvas/panels), mobile stacked; sticky header + footer; 30s fallback refresh.
  - AdminPanel: DM table with 5 sliders per familiar (energy/mood/fatigue/health/sync), quick actions (sleep/stage/heal), global event buttons (Магическая Буря / Праздник), live refresh via socket.
- page.tsx: auth gate → role-based view (PlayerDashboard | AdminPanel), dynamic ssr:false imports for 3D.

Verification (agent-browser, all passed):
- Auth screen renders, login as dm (dm/dmdnd123) → admin panel with global event buttons.
- Register dragon player "raven/Искра" → player dashboard with 3D dragon (happy state), stats 80/80/0/100/0.
- Feed: energy 80→100, mood +5, sync +3, fatigue +15. ✓
- Mini-game: ran 10s, score 0 → fail → mood +5, sync +2, fatigue +15. ✓
- Sleep: actions disabled, button→Разбудить, state→Спит. ✓
- DM panel: sliders show player's stats, End key on sync slider → 100 (PATCH persisted). ✓
- Evolution: "Адаптация доступна!" enabled at sync=100, modal shows 3 dragon paths (Багровый/Лазурный/Изумрудный) with 3D previews, chose Изумрудный → Stage 1→2, sync→0, path stored, buff revealed "+1d4 к атаке (1 раз в день)". ✓
- Wake: state→Счастлив, Stage 2 dragon renders. ✓
- Lint: 0 errors. Dev log + service log: 0 errors. Only benign Three.js deprecation warnings.

Stage Summary:
- FULLY WORKING end-to-end. All required features implemented & browser-verified:
  1. 4 stylized 3D species (construct/dragon/magpie/doll) with state animations (happy/hungry/sad/tired/sleeping) + evolution animation (sparkles + light flash + spin + camera zoom).
  2. Server-time decay via Luxon Europe/Moscow hourly cron (energy/mood -5 per 6h, health -2/h when starving, fatigue -10/h when sleeping, 4h sleep auto-wake).
  3. Fatigue blocks actions >80; sleep blocks interactions for real 4h.
  4. Mini-game (catch spheres) with score-based mood/sync/coin rewards.
  5. Blind evolution: sync≥100 → 3 options → stage++ + hidden buff reveal.
  6. D&D buffs: stage-based individual (+1 History / +1d4 attack / reroll save), health<20 debuff, party resonance (avg mood >80 → +2 Temp HP, <30 → -1 initiative).
  7. DM admin: slider edits, global events (storm/festival), live table.
  8. Real-time via Socket.io (port 3003) — broadcasts on every action + hourly tick.
  9. Responsive dark-fantasy UI (desktop horizontal 60/40, mobile stacked), sticky footer.
- Services running: Next.js dev on :3000, familiar-service on :3003.
- DM demo account: dm / dmdnd123. Player registration self-service.

---
Task ID: 11 (QA + Feature Round 1)
Agent: orchestrator (webDevReview cron)
Task: Assess project status, QA via agent-browser, add new features (daily buff, pet action, activity log, party roster, styling polish).

## Current Project Status (assessment)
- Project was fully functional from previous round: 4 species 3D, server-time decay (MSK), blind evolution, mini-game, DM panel, Socket.io realtime.
- Both services were DOWN on arrival (Next.js dev killed, familiar-service up). Restarted Next.js dev.
- QA via agent-browser confirmed auth, login, dashboard all working. No browser/console/runtime errors.
- Existing player "raven" (Stage 2 dragon "Изумрудный") intact from previous round; hourly cron had correctly run at 23:00 MSK.

## Completed Modifications (this round)

### 1. Daily Buff Claim (new feature)
- **DB:** Added `DailyBuffClaim` model (userId unique, lastClaimMsk 'yyyy-MM-dd', claimCount). Pushed schema + regenerated Prisma client.
- **Lib:** `todayMoscowDate()`, `getDailyClaimStatus(userId)`, `recordDailyClaim(userId)` in familiar-logic.ts. Extended `BuffSummary` type with `dailyClaim { claimedToday, lastClaimMsk, claimCount, nextClaimAt }`. `computeBuffs()` now includes daily-claim status + next-claim-at (start of next MSK day).
- **API:** `POST /api/familiar/claim-buff` (once per MSK day, +15 coins, +10 mood, logs 'claim_buff'), `GET /api/familiar/claim-buff` (status check).
- **UI:** `DailyBuffPanel.tsx` — dice-roll animation (cycles ⚀-⚅ for 1s), then claims. Shows current stage buff, claim count, next-claim time (00:00 MSK), "Получено сегодня" disabled state.

### 2. Pet/Stroke Action (new feature)
- **Constants:** PET_MOOD_GAIN=3, PET_SYNC_GAIN=1, PET_FATIGUE_GAIN=5, PET_COOLDOWN_MS=30s.
- **API:** `POST /api/familiar/pet` — gentle action bypassing fatigue>80 block, 30s cooldown enforced via last-log lookup, returns 429 with countdown if on cooldown.
- **3D:** `HeartBurst.tsx` — 10 glowing pink octahedrons burst upward + fade when `trigger` prop increments. Wired into `FamiliarCanvas` via new `petTrigger` prop + ambient `Sparkles` dust added to canvas.
- **UI:** "Погладить" button (pink) in ActionButtons; triggers `triggerPetEffect()` in store → HeartBurst in 3D.

### 3. Activity Log (new feature)
- **Lib:** `getRecentLogs(familiarId, limit=15)` in familiar-logic.ts.
- **API:** `GET /api/familiar/logs` — recent 15 interactions.
- **UI:** `ActivityLogPanel.tsx` — scrollable list with per-action icons (Utensils/Gamepad2/Heart/Moon/Sun/Sparkles/Gift/CloudLightning/Wrench), relative timestamps ("2м назад"), auto-refresh every 20s + on familiar change.

### 4. Party Roster Sidebar (new feature)
- **Lib:** `getPartyRoster()` in familiar-logic.ts — lightweight list of all players + species/stage/mood/energy/state.
- **API:** `GET /api/party/roster` (any authenticated user).
- **UI:** `PartyRosterSidebar.tsx` — desktop xl-only left column (sticky), shows each player with species badge, mini mood/energy bars, state indicator dot. Current user highlighted with "(вы)". Auto-refresh every 15s. Falls back to inline at bottom on mobile.

### 5. Styling Polish
- `AmbientBackground.tsx` — 14 floating colored orbs (purple/blue/green) with blur-3xl + subtle grid overlay, fixed -z-10 pointer-events-none. Added to both PlayerDashboard and AdminPanel.
- `LiveClock.tsx` — real-time MSK clock (HH:MM:SS + weekday/day/month) via Intl.DateTimeFormat with timeZone='Europe/Moscow'. Added to both dashboards' headers.
- PlayerDashboard layout: 3-column on xl (party sidebar | canvas+stats | action/buff/log panels), 2-column on lg, stacked on mobile. Stat bars now in a 2-col grid below canvas. "перетаскивай для вращения" hint overlay on canvas.
- FamiliarCanvas: ambient `Sparkles` dust (40 particles, purple, slow drift) for atmosphere.

### 6. Bug fix
- BuffsPanel was showing "Среднее настроение: 0%" because it only used the socket-pushed partyResonance (which fires on socket connect/tick) and discarded the server-computed resonance from /api/familiar/buffs. Fixed: BuffsPanel now also stores the fetched resonance as a fallback via `setPartyResonance()`, and stores full buffs via `setBuffs()`. Now correctly shows "90% · +2 Temp HP в начале боя".

## Verification (agent-browser, all passed)
- Login as raven → dashboard renders with all new panels (Действия with Погладить, Бафф дня, Баффы, Хроника, Партия sidebar on desktop).
- Daily buff claim: dice-roll animation (1s) → "Получено сегодня" disabled, buff text "+1d4 к атаке", next-claim "00:00 МСК", claim count 1. Coins +15. ✓
- Pet action: click → heart-particle burst in 3D, mood +3 (capped at 100), logged as "Ласка · +3 mood". 30s cooldown verified via API (429 with countdown). ✓
- Activity log: shows Ласка, Бафф дня #1, Проснулся, Эволюция 1->2, Правка Мастера, Уснул, Игра — all with relative timestamps. ✓
- Party roster: registered 2nd player "thorn" (construct) → sidebar shows both players with mini bars + state dots, "(вы)" on current. Resonance now "90% · +2 Temp HP". ✓
- Live clock: shows "23:53:51 · ПН, 06 ИЮЛ. · МСК", updates every second. ✓
- Ambient background: visible (orbs + grid), no pointer interference. ✓
- No browser errors, no console errors, no dev-log errors, no service-log errors.
- Lint: 0 errors, 0 warnings.

## Unresolved Issues / Risks
- **Mobile swipe-up inventory drawer** (todo #5) deferred — the current mobile layout already stacks all panels vertically with the party roster at the bottom, which is functional. A dedicated swipe-up drawer would be a nice UX enhancement for a future round.
- The `editing` state in AdminPanel is unused (pre-existing, harmless).
- Three.js deprecation warnings (THREE.Clock, PCFSoftShadowMap) are benign and come from upstream drei/r3f.

## Next-Phase Priority Recommendations
1. Mobile swipe-up inventory drawer (vaul-based) for better mobile UX.
2. Sound effects / ambient audio toggle for actions (feed/play/pet/evolve).
3. Achievements/milestones system (e.g., "first evolution", "7-day streak", "100 coins").
4. Familiar "thoughts" / speech bubbles that react to current state (e.g., "Хочу есть!" when hungry).
5. Trading/gifting between players (spend coins to send a mood boost to a party member).
6. DM "quest" system — DM can assign a daily quest that grants sync on completion.

Stage Summary:
- 4 new features added (daily buff claim, pet action, activity log, party roster) + styling polish (ambient bg, live clock, 3-col desktop layout, sparkle dust) + 1 bug fix (BuffsPanel resonance). All browser-verified, lint-clean, no errors. Services running on :3000 and :3003.

---
Task ID: 12 (QA + Feature Round 2)
Agent: orchestrator (webDevReview cron)
Task: Assess project status, QA via agent-browser, add achievements system + familiar thoughts + styling polish.

## Current Project Status (assessment)
- Both services were UP on arrival (Next.js :3000, familiar-service :3003). No restart needed.
- QA via agent-browser: auth, login (raven + thorn), dashboard, pet, daily-buff all working. No browser/console/runtime errors.
- Previous round's features (daily buff, pet, activity log, party roster, ambient bg, live clock) all intact.
- Project was stable → proceeded with new feature development.

## Completed Modifications (this round)

### 1. Achievements System (new feature)
- **DB:** Added `Achievement` model (catalog: code, title, description, icon, tier bronze/silver/gold, goal, metric) + `PlayerAchievement` model (userId+achievementId unique, unlockedAt). Pushed schema + regenerated Prisma client.
- **Seed:** `prisma/seed-achievements.ts` — 11 achievements across 4 categories:
  - Evolution: Первая Метаморфоза (🥚 bronze, 1 evolution), Подросток (⭐ silver, stage 2), Совершенство (👑 gold, stage 3)
  - Coins: Кладоискатель (💰 silver, 100), Дракон-Скупец (🐉 gold, 300)
  - Actions: Игривый (🎮 bronze, 10 plays), Мастер Игры (🕹️ silver, 25), Кормилец (🍎 bronze, 15 feeds), Ласковый (💗 bronze, 20 pets)
  - Streak: Постоянство (🔥 bronze, 3 days), Недельный Ритуал (⚡ silver, 7 days) — consecutive MSK days with ≥1 action
- **Lib:** `computeAchievementMetrics()` (counts logs by type, computes streak via MSK-date set), `computeStreakDays()` (walks back from today allowing 1 gap for "not yet active today"), `getAchievementsForUser()` (returns DTOs with progress + unlock status), `checkAndUnlockAchievements()` (unlocks any whose progress ≥ goal, returns newly-unlocked list).
- **API:** `GET /api/familiar/achievements` (lists all + progress, also runs unlock check). Wired `checkAndUnlockAchievements()` into feed/play/pet/evolve/claim-buff routes — each returns `newAchievements` array.
- **UI:** `AchievementsPanel.tsx` — scrollable list with tier-colored rings/glow (bronze/silver/gold), progress bars for locked, unlock timestamp for unlocked, overall progress bar in header (X/11). Re-fetches on familiar state changes.
- **Hook:** `useFamiliar.fetchAchievements()` + `announceAchievements()` helper that fires celebratory toasts (🏆 "Достижение: {title}") for each newly-unlocked achievement.

### 2. Familiar Thoughts / Speech Bubbles (new feature)
- **3D component:** `FamiliarThoughts.tsx` — uses drei `<Html>` for crisp DOM text positioned in 3D space above the familiar. Gentle bobbing via useFrame. Rotates thoughts every 6-9s with fade transition.
- **Context-aware thought pools:** 6 state-based pools (happy/hungry/sad/tired/sleeping/normal) with 4 messages each, PLUS conditional urgent thoughts (health<30 → "Мне плохо...", sync≥80 → "почти готов эволюционировать", fatigue≥70 → "Так устал...", energy≥90+mood≥90 → "на пике формы").
- **Wiring:** Added `thoughts` prop to FamiliarCanvas; PlayerDashboard passes current stats. Hidden during evolution. Refreshes on pet trigger (action feedback).
- **Styling:** Glassmorphic bubble with arcane border, tail pointer, backdrop-blur.

### 3. Styling Polish
- **globals.css additions:**
  - `.glass` / `.glass-strong` — glassmorphism utilities (backdrop-blur + gradient bg)
  - `.stat-pop` — keyframe for stat-bar pulse-on-change (scaleY + brightness flash)
  - `.achievement-flash` — golden ring flash for unlocks
  - `.skeleton-shimmer` — shimmer loading skeleton
  - `.animate-bubble-in` — thought bubble entrance
  - `.scanlines` — subtle CRT scanline overlay for the 3D canvas frame
- **StatBar enhancement:** Added `useRef` + `useState` to detect value changes → triggers `stat-pop` animation (0.5s brightness+scale pulse) when stats update after an action.
- **3D canvas frame:** Added `scanlines` class for a subtle retro-magical overlay.
- **EvolutionAnimation:** Already had sparkles + light flash + spin (from round 0); unchanged.

## Verification (agent-browser, all passed)
- Login as raven → dashboard renders with all panels including new AchievementsPanel (2/11 unlocked visible).
- AchievementsPanel shows: 🥚 Первая Метаморфоза (unlocked 07 июл 00:05 МСК), ⭐ Подросток (unlocked), plus progress bars: coins 92/300, play 1/10, feed 1/15, pet 3→4/20, streak 1/3, stage 2/3. ✓
- API confirms 2/11 unlocked (Первая Метаморфоза bronze + Подросток silver). ✓
- Pet action: count 3→4, achievement progress updated live, no errors. ✓
- Daily buff: new MSK day (00:06 Jul 7) correctly reset claim → "Получить бафф дня" available → dice roll → "Получено сегодня" (count 2, +15 coins → 107 total). ✓
- Thought bubble: renders above familiar ("Я..." visible), context-aware, bobs gently. ✓
- Stat bars: pulse animation on value change (verified visually). ✓
- No browser errors, no console errors, no dev-log errors, no service-log errors.
- Lint: 0 errors, 0 warnings.
- Services: both running (:3000, :3003), hourly cron ticking (2 familiars, resonance 90%, buff "+2 Temp HP").

## Unresolved Issues / Risks
- None critical. All features browser-verified.
- The `editing` unused state in AdminPanel (pre-existing, harmless) still present.
- Three.js deprecation warnings (THREE.Clock, PCFSoftShadowMap) — benign, from upstream drei/r3f.
- Thought bubble uses drei `<Html>` which renders DOM in 3D — works well but adds a small DOM node per canvas; fine for single-familiar view.

## Next-Phase Priority Recommendations
1. **DM Quest system** — DM can assign a daily quest (e.g., "feed 3 times", "play once") that grants sync on completion. New DB model + DM UI + player quest tracker.
2. **Sound effects / ambient audio toggle** — feed/play/pet/evolve SFX + background ambient track (with mute toggle).
3. **Mobile swipe-up inventory drawer** (vaul-based) — better mobile UX for the right-panel stack.
4. **Trading/gifting** — spend coins to send a mood/sync boost to a party member.
5. **Achievement reward system** — unlocking achievements grants coins or cosmetic rewards.
6. **Familiar customization** — rename, choose accent color after evolution.

Stage Summary:
- 2 new features (achievements system with 11 unlockable badges + familiar thoughts speech bubbles) + styling polish (glassmorphism, stat-pulse animation, scanlines, skeleton shimmer utilities). All browser-verified, lint-clean, no errors. Services running on :3000 and :3003. 2/11 achievements correctly auto-unlocked for existing Stage-2 dragon player.
