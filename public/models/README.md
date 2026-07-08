# 3D Models (optional — CC0 / free)

This folder is for **real 3D models** (`.glb` files). The app auto-detects them:
if a file named `{species}.glb` exists here, the app loads it as a true 3D mesh
with evolution-path color tints. If not, the built-in procedural 3D models are
used (they look good and cost nothing).

## Where to get FREE CC0 models (no money needed)

These sites offer free, CC0-licensed low-poly 3D models you can use commercially:

| Site | URL | Notes |
|---|---|---|
| **Quaternius** | https://quaternius.com/packs.html | "Ultimate Animals", "Ultimate Fantasy Creatures" packs — CC0, direct .zip download |
| **Poly Pizza** | https://poly.pizza | Search "dragon", "turtle", "owl", "doll" — CC0, download as .glb |
| **KayKit** | https://kaylousberg.com/game-assets | Stylized low-poly packs — CC0 |
| **Sketchfab** | https://sketchfab.com | Filter: "Downloadable" + license "CC0" — some free models |

## How to add models (one-time, ~10 minutes)

1. **Download** a model pack (e.g. Quaternius "Ultimate Fantasy Creatures").
2. **Pick 4 models** and rename them to match the species:
   - `dragon.glb` — a small dragon / wyrm
   - `construct.glb` — a golem / crystal / automaton
   - `magpie.glb` — a bird / raven
   - `doll.glb` — a plush / doll / figurine
3. **Drop them** into this folder (`public/models/`).
4. **Done!** The app auto-detects them on next load.

## Optional: stage-specific models

For a more dramatic visual progression, add stage-specific models:
- `dragon-2.glb` — used at Stage 2 (juvenile)
- `dragon-3.glb` — used at Stage 3 (ancient)

If a stage-specific file is missing, the base `dragon.glb` is scaled up and
recolors via the evolution path's colors instead.

## How evolution colors work with GLB

The loader walks the model's meshes and tints non-metallic surfaces with the
evolution path's `primaryColor`, and adds an `emissiveColor` glow. This means:
- **One base model per species** (4 files total) covers all 24 evolution paths.
- Metallic accents (armor, horns with metalness > 0.4) keep their original look.
- Stage 3 adds a magical aura ring.

So you don't need 24 separate models — just 4, and the evolution paths recolor
them automatically.

## Format requirements
- **Format**: `.glb` (binary glTF) — preferred. `.gltf` + textures also works
  but requires more files.
- **Scale**: models should fit roughly in a 2×2×2 unit cube. The loader applies
  a stage-based scale factor on top.
- **Polycount**: keep it low-poly (under 10k tris) for smooth web performance.
- **Materials**: use `MeshStandardMaterial` in your modeling tool — the loader
  reads metalness/roughness to decide what to tint.

## Removing models
To go back to the procedural 3D models, just delete the `.glb` files from this
folder. The app falls back automatically.
