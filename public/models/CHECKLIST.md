# Checklist: choosing 3D models for the Familiar Tamagotchi

Print or keep this open when browsing Sketchfab / Poly Pizza / Quaternius.

## 1. License (must be free)
- [x] **CC0** (public domain) — best, no attribution needed
- [x] **CC BY** — free, must credit the author in your README
- [ ] CC BY-NC — NO (non-commercial, can't use on Vercel with ads/donations)
- [ ] "Standard" / paid — NO

## 2. Format
- [x] **.glb** (binary glTF) — BEST. Single file, just drop it in.
- [x] **.gltf + .bin + textures** — OK but you must keep all files together.
- [ ] .fbx / .obj / .blend — NO (would need conversion in Blender first).
  - If you only find .fbx: install Blender (free), File → Import → Export as .glb.

## 3. Polycount (performance)
- [x] **Under 5,000 triangles** — ideal, runs smooth on any phone
- [x] Under 10,000 — acceptable
- [ ] Over 20,000 — too heavy for web, will lag on mobile
- Sketchfab shows triangle count on the model page. Poly Pizza is all low-poly.

## 4. Materials (CRITICAL for evolution recoloring)
The loader tints **non-metallic** surfaces with the evolution path's color.
For this to work well:
- [x] Model uses **PBR materials** (MeshStandardMaterial in glTF)
- [x] Has a clear **body material** separate from accents (horns, eyes, metal)
- [x] Metallic parts (armor, gold trim) have **metalness > 0.4** — they stay untinted
- [ ] Single flat-color model with no material separation — recoloring looks flat
- Check: on Sketchfab, the model page shows "Materials" tab — verify there are
  2+ materials (e.g. "body", "eyes", "horns").

## 5. Scale & orientation
- [x] Model faces **+Z** (front toward camera) — most Sketchfab models do
- [x] Stands upright on the ground plane (Y-up)
- [x] Fits roughly in a 2×2×2 unit cube — if huge, we can scale in code, but
      tiny models (under 0.5 units) may have lighting issues
- [x] **Centered at origin** — not offset to the side
- If wrong orientation: Blender → Object → Apply → Rotation, then export.

## 6. Style consistency (important for cohesive look)
All 4 models should look like they belong to the same game:
- [x] Same art style (all low-poly, OR all stylized, OR all chibi)
- [x] Similar level of detail (don't mix 500-tri and 15,000-tri models)
- [x] Compatible color palettes (we recolor them, but base hue matters)
- **Recommendation**: get all 4 from the **same pack** (e.g. one Quaternius pack)
  to guarantee consistency.

## 7. Silhouette readability
The creature must be recognizable from a distance / small thumbnail:
- [x] Clear silhouette — you can tell what it is from the outline alone
- [x] Iconic features visible: dragon has wings+tail, bird has beak+wings,
      doll has stitches/buttons, construct has crystal/orb
- [x] Not too many thin parts (spikes, antennae) — they alias badly on mobile

## 8. What to AVOID
- [ ] Hyper-realistic models (don't match the cute tamagotchi vibe)
- [ ] Models with baked lighting/textures (can't recolor cleanly)
- [ ] Models with complex shaders (toon, outline) — may not export to glTF
- [ ] Models with skeletons/animations (we animate in code; static mesh only)
- [ ] Models with transparent materials (glass, membranes) — render order issues
- [ ] Extremely small or large models (need manual rescaling)

## 9. Stage-specific models (optional, advanced)
For a dramatic visual progression, you can add separate models per stage:
- `dragon.glb` — Stage 1 (baby, small and cute)
- `dragon-2.glb` — Stage 2 (juvenile, bigger horns/crest)
- `dragon-3.glb` — Stage 3 (ancient, majestic with extra features)

If a stage-specific file is missing, the base model is used with scale + tint.
**This is optional** — start with 4 base models, add stage variants later if
you want more visual punch.

## 10. Testing before committing
After dropping a .glb into /public/models/:
1. Reload the app — the creature should appear in the 3D canvas.
2. Check it's centered, upright, facing forward.
3. Evolve it (set sync to 100 via DM panel) — colors should change.
4. Test on mobile width (390px) — should still render smooth (60fps).
5. If broken: open browser console (F12) for glTF loader errors.

## Quick source picks (free, CC0, tested by community)
- **Quaternius** — https://quaternius.com/packs.html
  - "Ultimate Fantasy Creatures" (dragons, golems)
  - "Ultimate Animals" (birds)
- **Poly Pizza** — https://poly.pizza
  - Search any term, all CC0, direct .glb download
- **KayKit** — https://kaylousberg.com/game-assets
  - Stylized packs, CC0
- **Sketchfab** — https://sketchfab.com
  - Filter: Downloadable + CC0 / CC BY
  - Check triangle count + materials tab

## If you get stuck
- DM me the Sketchfab URL of a model you're considering — I can check if it
  meets the requirements before you download.
- If a model is .fbx only, I can write you a Blender conversion script.
