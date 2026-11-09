---
name: "render-engines-objects"
description: "How to build objects, terrain, vegetation, water, materials and effects in the two three.js engines used for cartoon shorts: toon+ink and PBR. Use before writing world code."
---

# Two render engines, one object toolbox

Both engines are three.js r160 (WebGL2), rendered frame by frame from pure functions of the frame number. Same code runs in Playwright/Chromium or, faster on Linux CPU servers, through a local EGL/Mesa bridge (`tools/build_egl.py` + `headless-gl.mjs`: about 0.3-1.5 s per 1080x1920 frame). Everything is procedural: no downloaded models or textures unless the user supplies licensed files.

## Which engine: default is Engine B (PBR)
The user's target style (bean-head 2D cards in a smooth, saturated game-engine world) needs **only Engine B**. The world has no ink outlines and continuous lighting; only the character cards carry their own drawn outline. Use Engine A only if the user explicitly asks for a comic/outlined world. Engine A's object tools (ground shader, grass, trees, rocks, cards) are reused inside Engine B with smooth shading (see the conversion below).

## Engine A: toon + ink (optional comic look)
- Materials: `MeshToonMaterial` with a 2-step gradient (`toon()`, `texM()`), painted canvas textures.
- Passes: colour → normal/depth (materials swapped per mesh) → ink + grade → DOF. Ink on silhouettes, depth jumps, sharp creases.
- Per-object normal/depth control via `mesh.userData.nd`: `crownNd` for tree crowns (smooth crown normal, depth compressed to the crown centre), `flatNd` for grass and pebbles (ground normal, true depth), `ndSkip` only for glows, sky and decals (it removes the object from depth too).
- Use for: the main cartoon world, where the 2D character cards must sit in a graphic, outlined environment.

## Engine B: PBR (game-engine look)
- Materials: `MeshStandardMaterial` with colour + normal + roughness maps; `scene.environment` from `PMREMGenerator.fromScene()` of the sky shader (otherwise metals go black).
- Lights: hemisphere + one shadowed directional sun, shadow camera sized to the shot (about ±60-150 m).
- Post: render into an MSAA half-float target, then one full-screen pass with ACES tone mapping, a small threshold bloom only on bright pixels, mild saturation and vignette, `linearToOutputTexel`.
- Use for: every cartoon short in the target style, plus demos, water and metal-heavy scenes.
- **Converting Engine A tools to Engine B:** replace `MeshToonMaterial` with `MeshStandardMaterial` (roughness 0.85-1, metalness 0) keeping the same `onBeforeCompile` ground/night code and vertex colours; remove the ink pass; keep `customProgramCacheKey`. Grass blades keep the upright normal. Character cards stay `MeshBasicMaterial` (unlit), never affected by world light.

### Target look values (from the reference)
- **Day:** saturated blue sky with a bright hazy horizon and a sun glow; saturated green grass with dense geometric tufts; red-earth patches under structures; light pale wood, dark steel with soft highlights, white steel with sky reflections; crisp sun shadows with soft edges; aerial haze that lightens far hills.
- **Night:** deep saturated blue sky with blue-lit soft clouds and a big bright moon with halo; ground readable blue-green with dark grass blades; red-earth path visibly lighter; strings of small coloured bulbs; **bloom** on bulbs, lanterns and light streaks (threshold bloom on HDR values above about 1.0, wider radius at night); warm light pools from lanterns on the ground; low purple-blue ground mist near structures; dark tree silhouettes against lighter moonlit hills.
- **Effects:** light streaks and sparks are additive HDR sprites so they bloom; smoke and explosions are soft volumetric-looking sprite stacks with dark tops and warm lit cores.

## Object recipes (both engines)
- **Boxes and structures:** `boxAt/tbox` with UVs scaled in metres per face; merge all parts of one material into one geometry (same attributes: position, normal, uv, index). Trusses with a `bar(a, b, width)` helper; bolts and plates as tiny merged boxes/cylinders.
- **Cables and rails:** `TubeGeometry` on a Catmull-Rom or catenary curve; suspenders as unit cylinders scaled and oriented every frame.
- **Deforming parts (twisting deck, cloth, flags):** keep a copy of the base positions and rewrite them per frame from a pure function of time; recompute normals.
- **Terrain:** one height function used both to build the mesh and to place everything on it; ground shader in world space (grass, red earth, gravel, trampled) with a splat (texture or vertex attribute) and noise-broken edges.
- **Vegetation:** `makeForest` (crowns as leaf clusters on real branches, conifers with irregular tiers, bushes) merged per material and chunked for culling; `scatterGrass` with a footprint raster that excludes objects, paths and feet.
- **Rocks and logs:** jittered dodecahedrons / cylinders anchored at the terrain height (convert to indexed + uv before merging).
- **Water:** subdivided plane with 2-3 animated sine waves, two scrolling detail normal maps, PBR low roughness with environment reflections, depth gradient in the shader, foam ribbon along the shore contour and rings around piers, soft sprite splashes.
- **Sky and backdrop:** gradient sky shader with sun glow; soft painted cloud sprites facing the camera; far mountains unlit with hazed vertex colours, `fog: false`.
- **Vehicles and boats:** grouped boxes and cylinders with PBR paint (roughness 0.3-0.4), chrome (metalness 1, roughness 0.2), dark tyres; gentle bob/roll from sines.
- **Characters:** 2D canvas cards (`T.romanFront`) on planes that yaw to the camera, alpha-tested, with a matching depth material for shadows; place the camera by projecting the card position.
- **Particles:** camera-facing sprites with radial-gradient textures, deterministic trajectories from the frame number.

## Performance and determinism
- Merge per material, split big merged meshes into spatial chunks so frustum culling works; grass and pebbles never cast shadows.
- No `Math.random()` or wall-clock time: seeded hashes and the frame number only. Render the same frame twice to check the hash.
- Test at half resolution, check details at full resolution, keep every iteration in its own folder for the timelapse.