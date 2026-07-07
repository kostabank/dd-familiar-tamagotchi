# Task 6 — Subagent B — 3D Familiar Models

## Task
Build stylized low-poly dark-fantasy 3D familiar models using React Three Fiber (`@react-three/fiber` + `@react-three/drei`) + Three.js for 4 species (construct, dragon, magpie, doll), with state animations, evolution animation, and a Canvas wrapper.

## Work Log

### Files created under `src/components/familiar/`
1. **`FamiliarCanvas.tsx`** — `<Canvas>` wrapper with camera (pos [0,1,5], fov 45, dpr [1,2]), dark background `#0F0F1A` + matching fog, ambient + spotLight + purple pointLight, Suspense-wrapped scene, `<Environment preset="night">` for reflections, `<ContactShadows>` at y=-1.5, and `<OrbitControls>` (autoRotate, damping, disabled during evolution so the camera dolly in `EvolutionAnimation` actually takes effect).
2. **`models/FamiliarModel.tsx`** — dispatcher exporting `DEFAULTS: Record<Species, ModelConfig>` (matches the spec exactly). Merges `modelConfigOverride` onto the default, applies stage scale `1 + (stage-1)*0.15` to the whole group, renders the species-specific model, and overlays `<ZParticles>` when `state === 'sleeping'`.
3. **`models/ConstructFamiliar.tsx`** — hovering flat-shaded octahedron (matte metal), a glowing core sphere inside (emissive, `toneMapped={false}`), a single emissive eye sphere on the +X+Y+Z face, two orbital torus rings (radii 1.4 & 1.6) rotating on different axes at state-dependent speeds, all wrapped in drei `<Float>`. State anims via `useFrame` + lerps.
4. **`models/DragonFamiliar.tsx`** — elongated teal body sphere (scaled [1, 0.7, 1.4]) with a smaller head sphere at z=0.9, a forward-tilted horn cone, two iridescent `meshPhysicalMaterial` wing planes (transmission 0.6, iridescence 1, IOR 1.5) animated with `sin(t)*0.2` flap, and a sinuous 3-segment tail (parented groups, each adds a sin-offset rotation), plus a tail-tip spike cone. Two tiny dark eye spheres.
5. **`models/MagpieFamiliar.tsx`** — glossy black body sphere with a flattened white belly sphere in front, smaller black head sphere on top, vivid orange beak cone, two white eye spheres with black pupil spheres, two horizontal black wing planes (offset within their groups so they pivot from the body), and a long metallic black tail plane (offset so it extends backward and wags around Y).
6. **`models/DollFamiliar.tsx`** — baggy fabric body sphere scaled [1, 1.1, 1] with high-roughness low-metalness material, two black button cylinders as eyes, a thin torus-arc smile mouth, four `Stitch` rings at various angles (extracted as a module-level component to satisfy `react-hooks/static-components`), and four thin cylinder limbs (arms angled out, legs straight down) in dark thread color.
7. **`EvolutionAnimation.tsx`** — Canvas-level overlay rendered when `evolving=true`. Uses `<Sparkles count={60} scale={6} size={4} speed={0.6}>`, a `<pointLight>` whose intensity is driven `0 -> 10 -> 0` via `sin(t/1.5 * PI) * 10`, a parent group that spins at `delta * 8` rad/s, and a camera dolly that lerps `camera.position.z` from 5 to ~3.2 and back over the 2s window, then calls `onComplete`. Uses `useEffect` to reset on `active` flip and a `doneRef` to fire `onComplete` once.
8. **`ZParticles.tsx`** — floating dream motes above sleeping familiars. Spec preferred drei `<Text>` but flagged that font CDN loading can be flaky; chose the spec-permitted fallback of 3 small glowing emissive octahedrons (icy blue, `toneMapped={false}`) that drift up, fade in/out via `sin(local*PI)`, and loop. Guaranteed visible regardless of network.
9. **`state-anim.ts`** — internal helper exporting `getStateTargets(state)` and `applyStateToGroup(group, targets, t, delta)`. Centralizes the per-state Float speed/intensity, emissive multiplier, group position/rotation targets (sleeping → lie on side at `rotZ = π/2 * 0.6`, sad → `rotY = π*0.3` + jitter, hungry → sink to y=-0.4, tired → slow bob, happy → fast/bouncy with 1.4× emissive). Uses frame-rate-independent lerp factor `1 - 0.001^delta`.

### Lint / type-check
- `bun run lint` → **clean** (0 errors, 0 warnings).
- `npx tsc --noEmit` → no errors in any `familiar/**` file (only pre-existing errors in `skills/**` which is excluded from lint).
- Two lint rules required fixes during development:
  - `react-hooks/static-components` — extracted the doll's `Stitch` helper to module scope.
  - `react-hooks/immutability` — direct `camera.position.z` mutation (idiomatic R3F in `useFrame`) needed an inline `eslint-disable-next-line`. Only the first call site needed it; the second (inside the `if` branch) was unused and removed.

### Notable design decisions
- **Outer group + Float + inner model** hierarchy: state-driven pos/rot goes on the outer `rootRef` group, drei `<Float>` lives between them so the floaty hover still works while the model is being rotated/translated by state.
- **Material refs** for emissive parts (`coreMatRef`, `eyeMatRef`, `bodyMatRef`, etc.) so `useFrame` can lerp `emissiveIntensity` per-state for smooth happy→hungry→sleeping dim transitions.
- **OrbitControls disabled while evolving** so the evolution camera dolly isn't fought by autoRotate/damping.
- **Stage scale applied at `FamiliarModel`** level (single `<group scale={stageScale}>`), so each species model only deals with its own proportions.
- **Dark-fantasy palette** preserved: deep purples (`#a855f7`), teals (`#0d9488`/`#2dd4bf`/`#5eead4`), ember orange (`#f97316`), cold blue (`#3b82f6`), neutral charcoal (`#4a5568`), burlap brown (`#6b5b4a`).
- **Construct's core** is hidden inside the opaque matte-metal shell (per spec wording "Inside"), so the construct's visible glow comes from the eye + the inner emissive ring; the core remains a conceptual magic source and pulses on `useFrame`.
- **ZParticles fallback** to glowing octahedrons chosen for sandbox reliability over drei `<Text>` (which depends on troika fetching a remote font).

## Stage Summary
All 9 requested files delivered (`FamiliarCanvas`, 4 species models, `FamiliarModel` dispatcher, `EvolutionAnimation`, `ZParticles`) plus one shared helper (`state-anim.ts`). Lint-clean and type-clean. Ready to be imported by the page/UI agents via:
```tsx
import FamiliarCanvas from '@/components/familiar/FamiliarCanvas';
<FamiliarCanvas species={...} stage={...} state={...} modelConfigOverride={...} evolving={...} onEvolutionComplete={...} />
```
The canvas fills its parent — wrap it in a `div` with explicit width/height (e.g. `aspect-square` or fixed `h-[480px]`).
