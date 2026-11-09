---
name: "cartoon-audio-short"
description: "Make a vertical animated cartoon short. Offers one best-bet brief and script (entertainment-first), then turns the user's voiceover into a finished MP4 with music and SFX at half the voice level. Use for any cartoon short or animated story video request."
---

# Cartoon short: brief → script → voiceover → finished MP4

The look: flat 2D bean-head cartoon characters (canvas-drawn "cards" with plum outlines) in a colourful, smooth-shaded 3D world with a game-engine look (PBR materials, environment reflections, ACES tone mapping, bloom on lights, no ink outlines on the world unless the user asks for a comic look), detailed procedural textures, depth-of-field and gliding cameras. Output 1080x1920, 30 fps, exactly as long as the voiceover. The user's voice is unchanged. The music bed and SFX are synthesized and sit at **50 % of the voice level**. Reply in the user's language (e.g. Italian) and write the script in the language they want to publish in.

## Rules
- Stories, characters and shots are always original. Never recreate another creator's video shot for shot.
- No real, named living people as characters or as the butt of a joke, no brand mascots or logos. Banknotes, signs and packaging are original designs, never copies of real ones.
- No captions unless the user asks. Diegetic text (price boards, a calculator display, a sign) is fine and must read correctly (not mirrored, not cropped, auto-shrunk to fit its board).
- Never edit or re-time the voice. The picture is timed to it, and every visual reaction lands 0-3 frames before its word.
- **Audio levels:** the music bed sits at 50 % of the voice level (−6 dB, gated RMS). SFX sit at 50 % or slightly less with peaks capped (0.7x the voice peak). Always mix with `mix.py` (write it if the kit lacks it): one linear gain per stem, no ducking, no compression. Finish with ONE linear gain to about −14 LUFS plus a −1 dBFS peak limiter, never `loudnorm`.
- **Facts:** any number, price or date shown or spoken as true is verified on an official or reputable source (web search) before it goes in the script. Flag averages and estimates, list sources in the reply, and say which figures are the assistant's own arithmetic. Illustrative numbers on props are labelled as such to the user.
- Keep the user informed with a task list. Approve the look before the long render (see 4.6).
- **Companion skills:** load `cartoon-look-qa` (look targets, readability traps, QA) before the look check, and `render-engines-objects` (how to build objects, terrain, water and materials in the two engines: toon+ink and PBR) before writing world code.
- **Locations are built from the script:** every location must be rich, interesting and married to the script (4.3d). A beautiful set that contradicts the narration is a failure.
- Never run `pkill -f render.mjs` from a shell whose own command line contains that text (it kills itself). Use `pkill -f "[n]ode render.mjs"`. Start long jobs with Bash `run_in_background`, not `nohup &`.
- **Perfectionist detail is mandatory:** every scene holds **as many objects as possible, all coherent** with the place, the era and the story (see 4.3), and every world gets the extra texture pass (4.3b) and, when water is present, the water pass (4.3c). Work in measured iterations (4.3a) and always document them in video (4.6b).

## Stage 1: Intake (always first)
If an audio file is already attached, skip to Stage 4. If a script was also given, use it for the timing; if no script text is given, ask for it (Claude cannot hear audio; ASR models may not download).
Otherwise ask one AskUserQuestion (or plain text): **"Where are you starting from?"**
- **Voiceover ready**: upload it plus the script text. Go to Stage 4.
- **I have a script, need the voiceover**: apply Stage 3 rules, return the tightened script with recording tips, ask for the upload.
- **Need a brief and script**: go to Stage 2.
Ask the target length if not given. Default 20-30 s. Longer than 35 s only if every beat stands alone; a 50-60 s cut loses viewers.

## Stage 2: One best-bet brief (not a list of ten)
Unless the user asks for options, recommend exactly ONE idea, chosen for entertainment value and share-ability, and say plainly that nothing can predict virality: this improves the odds. Research first (web search): what formats and hooks work now, and verify the key facts.
The brief gives: the idea in one line; why it can work (a shared memory or identity moment, a precise surprising number, something people will comment or send to a friend); length; which sets and props it needs; which facts are verified and which are estimates.
What makes an idea good: one surprising story with a physical cause and effect you can show; an everyman character; escalating stakes; a twist in the last words; a world buildable from simple 3D shapes plus cartoon cards. If the user wants alternatives, offer up to 10 numbered ideas with title, hook line, twist, why it animates, and true-or-legend.
No real living people as the joke, nothing graphic, nothing political. Do not take a side on contested political topics even if a topic invites it.

## Stage 3: Script (entertainment-first)
Write narration only, sized at about 3.5-3.7 words/s: 25 s ≈ 90 words, 30 s ≈ 110. Numbers written as words, contractions, sentences of 8-15 words, never describe what the viewer already sees.
1. **Hook (about 1 s, max 12 words):** a concrete question, a precise number or a contrarian statement. It opens a loop and does not answer it. The same line is on screen at frame 0 as a prop or board, not as a caption.
2. **Setup (1-4 s):** who, what is at stake.
3. **Escalation, 2-4 beats**, each bigger than the last, with one joke or visual gag (the prop or a reaction tells it).
4. **Pivot:** the real mechanism, with an everyday analogy.
5. **Payoff:** the answer to the hook as the last words, short and numeric or ironic. The last frame matches the first so the video loops.
No engagement bait, no "follow for more", no greeting. Pass/fail check before delivering: hook on screen at frame 0; loop open within 4 s; a visual change every 2-4 s; one idea only; payoff in the last words; loop closes; figures verified with sources.
Reply with the script in a copyable block, word count and length, a beat table with seconds, the checklist result, sources, recording tips (one steady narrator voice, e.g. ElevenLabs speed 1.05-1.1, stability 45-55 %, pauses at sentence ends, no music, mp3 or wav) and the ask to upload the voiceover. Keep the final script text; it drives the timing.

## Stage 4: Build the video (after the voiceover is uploaded)
Do everything from here without stopping except at the look approval.

### 4.0 Get the kit
The code kit lives in the skill folder or in the zip the user attached (`engine/`, `tools/`, `example/`). Unzip it into its own empty directory and treat it as read-only. Run `bash tools/setup.sh ~/shorts/<slug>`; it copies engine and tools, fetches three.js r160 and `toon.ts` (network to npm/GitHub is usually allowed), strips types with Node 22 and links Playwright. Requirements: Node 22.6+, Python 3 with numpy + Pillow, ffmpeg, Playwright with Chromium.
Chromium on a CPU-only server: `--use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`, about 3-4 s per frame. Tell the user the real estimate (frames x 3.4 s) before starting and offer to package the project for a Mac or PC with a GPU (remove the swiftshader flags there; expect well under 1 s per frame).

### 4.1 Timing
`python3 timing.py voice.mp3 script.txt --out work`. With whisper it uses word timestamps; otherwise it aligns script phrases to detected speech segments. Check `work/phrases.json`: pauses must fall at sentence ends. Total frames = round(duration x 30).

### 4.2 Shot plan (`work/PLAN.md` before code): density rules
This is where videos get boring. Plan for variety, not one set shown from different angles.
- **Shot count:** at least one new shot every 2-4 s (a 25 s video has 9-12 shots; never fewer than duration/3). Irregular lengths.
- **Places:** at least one new location or set per 6-8 s, and every location is visited for a reason (a shop, a kitchen, a street, a bar, a night scene), not just the same room re-lit. Light changes the beat (day, golden, night-blue).
- **Shot sizes cycle:** hook medium close-up, wide reveal, two-shot, insert close-up on the key object, reaction close-up, environment move for the payoff. No two consecutive shots with the same size and angle.
- **Every sentence illustrated literally;** props carry the jokes. Each set has 10+ distinct dressed props and one moving secondary element (steam, a hanging sign, a fan, leaves, coins, a clock).
- **Cast variety:** besides the two leads, add extras or a shopkeeper with their own outfit and idle gag; vary expressions per beat.
- **Inserts:** every key number or object gets its own close-up (a display, a price board, a calendar, a cup, a coin).
- Frame 0 is the hook image with the hook line on a prop. The last shot's physical payoff lands on the last word and its frame matches frame 0.
- A time or place jump gets a 6-frame white flash. The twist line gets a sting.

### 4.3 World (`web/main.js`)
Keep the engine sections: toon materials, ink contract, `add`/`tbox`, sky, lights, cards, render targets/post, `applyLight`, `drawActors`, `swapForNd`, `renderFrame`. Replace the example world and the story parts of `worldState()`.
- Build from primitives with painted canvas textures. Place each set far apart on the X axis (0, 80, 160 ...) so cuts are real location changes. Interiors have walls with `cast:false`; use a big ground box under everything.
- **Live text boards:** one canvas per board with `drawBoard(name, key, fn)`, redrawn only when the key changes, MeshBasic with `transparent:true, alphaTest:0.02` (otherwise black corners), auto-shrinking text. Make boards **portrait-shaped** (about 2.2 x 2.2 m) because the vertical frame is narrow.
- Vertical frame maths: visible width = 2·d·tan(hfov/2), hfov = 2·atan(tan(vfov/2)·0.5625). At fov 36 and d = 6 m only about 2.2 m is visible. Size boards and place cameras with this in mind.
- Do not hang pendants, salami or beams between the camera and a board. A point light (`L.lamp`) gives night mood.
- Set pieces (a drawer, a flipping calendar, a clock, a bag filling up) are groups driven by 0..1 progress from `worldAt(f)`.
- **Maximum coherent density:** fill each set with as many objects as the place would really contain. Before building, write an inventory per set (at least 25-40 distinct object types for an exterior, 20-30 for an interior), grouped by what belongs there: infrastructure (roads, fences, poles and wires, signs, lamps, drains), activity (vehicles, tools, crates, carts, boats, stalls, products), nature (trees, bushes, flowers, rocks, grass, puddles), life (extras, animals, birds), weather and motion (smoke, flags, leaves, ripples). Every object must make sense for the location, the period and the story: no random filler, no anachronisms, no brands. Repeat objects with variation (size, colour, rotation, wear) and keep the acting area, faces, boards and signs clear.
- **Richness per shot:** three populated depth layers in every frame: foreground (geometric grass tufts, pebbles, small props), middle (structures, furniture, characters), background (volumetric hills, trees at several distances, clouds). Props in readable clusters (crates + tools + rope; bench + bin + lamp), never scattered at random. Structures built properly: joints, plates, bolt heads, bevels, handrails, steps, roof thickness. Vegetation irregular: crowns of leaf clusters on real branches, conifers with uneven tiers, undergrowth, red-earth patches and trampled zones with irregular edges. Density goes where the camera actually looks; off-screen objects do not count. Every object sits at the real ground height; nothing new in front of faces, boards or signs.

### 4.3a Iteration loop (always)
1. Pick 6-12 key frames (day, night, close-ups, wides, action). Render at half resolution into a NEW folder per revision (keep them all: they feed the timelapse).
2. Build a before/after grid next to the reference (same frames). List the concrete defects you see, fix the 2-3 biggest, repeat. Count the visible object types per shot and add coherent ones wherever a frame looks empty.
3. Then check full-resolution crops of ground, water, materials and faces (aliasing and noise hide in thumbnails).
4. When a subject must be in frame, compute the camera: project the key points with `Vector3.project` and search positions, instead of guessing.
5. Iteration scripts use `set -eo pipefail`, so a failed render is never mistaken for a new one.

### 4.3b Texture pass (extra pass, always)
After the first working version, do a second round on textures only:
- Procedural canvas textures that tile (periodic noise, drawing with wrap), 512-1024 px.
- Three scales per surface: macro tint variation (20-80 m), meso patches (2-8 m), micro texture; sample the same texture twice at different scale and rotation to break repetition.
- World-space mapping through `onBeforeCompile` for ground and large surfaces (no seams between meshes); set `customProgramCacheKey` per variant.
- For PBR materials also generate a normal map (Sobel from the height) and a roughness map from the same base: asphalt with aggregate, wood grain with plank joints, painted metal with edge wear, matte rust, stained concrete, bricks with mortar.
- Mipmaps + anisotropy 4-8; consistent texel density between neighbouring objects (UVs in metres). No moiré, stretching or high-contrast noise that sparkles in motion.

### 4.3c Water pass (whenever there is water)
- Multi-octave animated waves (2-3 sines + noise), small and slow, normals recomputed; plus a scrolling detail normal map.
- PBR material with a PMREM environment from the sky: low roughness (0.05-0.15), sky and sun reflections (glint), visible Fresnel.
- Depth gradient: lighter and greener near the shore, darker in the middle; never one flat teal plane.
- Foam line along the shore contour and around piers or objects, ripples where things touch the water, shore rocks anchored at the waterline, boats with wakes when coherent; splashes as soft sprites (not spheres), expanding wave rings, wakes.
- Check from several cameras: stable reflections, no frame-to-frame shimmer.

### 4.3d Script-coupled location (always)
1. For every script line, write what the viewer must SEE to believe it, and build it first. "Wind" → flags, windsock, bending grass, wind streaks, waves; "thin" or "huge" → proportions that are visibly true on screen (measure them: e.g. a deck called thin stays under 1/100 of its span); a date or era → period vehicles, poles, buildings, clothes, no modern objects.
2. Then add the coherent inventory (25-40 object types for an exterior): what that place, in that period, would really contain.
3. Make it interesting: one hero detail per shot that the camera rests on, secondary motion everywhere (boats rocking, gulls, flags, smoke), and one small surprise per location (a cameraman, a dog-free onlooker gag, a detail that rewards a rewatch). Keep faces, boards and the action clear.
4. Re-read the script against the finished stills: every claim is visible, nothing visible contradicts a claim.

### 4.3e Texture and scene traps (each one already happened; do not repeat)
- **Black backdrops (the "black mountains"):** a hand-built heightfield whose index winding faces down gets normals pointing down, so a lit material renders it black; beyond the fog far distance it also washes out. After `computeVertexNormals()` check that the average normal.y is positive (otherwise reverse the triangle order). For far backdrops (mountain ranges, distant ridges) use an unlit `MeshBasicMaterial` with vertex colours pre-blended toward the horizon haze, `fog: false`, `side: DoubleSide`, and check the silhouette in the widest shot.
- **Script contradicted by the model:** the narration said "thin as a blade" while the deck girders were 2.5 m on a 116 m span. Check every proportion the script names against the real ratio before rendering.
- **Build order:** texture and material factories used before their declaration crash the scene (temporal dead zone). Declare all texture builders and materials at the top, before any geometry that uses them.
- **Merging geometry:** all merged parts need the same attributes (position, normal, uv, index). `DodecahedronGeometry`/`IcosahedronGeometry` are non-indexed and lack what boxes have: add a zero uv and a sequential index before merging.
- **Colour vs data textures:** colour maps use sRGB; normal, roughness, noise and mask maps stay linear (`NoColorSpace`), and data maps sampled by world position use `flipY = false`. Build normal maps from height with a wrap-around Sobel so tiles stay seamless; anisotropy 8.
- **Stretched textures on boxes:** scale box UVs per face by the face size in metres (helper like `tbox`/`boxAt`), never the default 0-1 UVs.
- **Grass turning to stipple at distance:** blades grow slightly with distance, density drops, blade colour stays close to the ground colour; never a per-frame LOD.
- **Floating or buried objects:** rocks, trees, logs and props sample the same height function that builds the terrain mesh, and the mesh is dense enough for the slope.
- **Popcorn splashes:** spheres read as popcorn; use soft camera-facing sprites with opacity fading as (1 - age)².
- **Interrupted renders:** the encoder must work with the frames that exist, so stopping always leaves a deliverable preview.

### 4.4 Cast (`web/roman.js` → `web/toon.js`)
Add outfits to `OUTFITS` (tunic, cap, hair, apron, moustache, brows, stout, dress) and effect cards (thought bubble, question marks, spark, hearts) in the same module. Arm poses: hang, spear, point, up, wave, hip, belly, temple (+swirl), lift, reach (+lift), cheek, shield, cross, thumb. Expressions: the toon.ts FACE set plus snore, stubborn, squint. Rebuild with `cat web/toonbase.js web/roman.js > web/toon.js`. Billboards turn on yaw only. Build card keys from `q()`-rounded values. Character `s` scales the card (child 0.6, adult 0.9-0.95).

### 4.5 Motion
- Cameras: `camFromKeys` with smootherstep glides (18-45 f) and `kicks` on impacts. Every hold creeps. Prefer continuous moves (pull-back, rack focus, push-in); hard cut only on place or time jumps, with a flash.
- Characters never freeze: `idle`, `blinkAt`, head bobs on stressed words. Actions: anticipation → overshoot → settle. Secondary motion everywhere. DOF on close-ups, wides sharp.

### 4.6 Look check and approval (before the full render)
Render stills per shot (start, middle and key actions, 3+ per shot) and build a labelled contact sheet; then a second board with the first frame of every shot (shot name and frame number). Fix the usual traps: cropped boards or props in the narrow frame, text clipped, things floating, missing ink, objects between camera and subject, characters too small or off-frame, mirrored text. Send both sheets with a one-line summary per shot and **wait for the user's OK** (or their corrections) before the long render. Then give the real render time estimate.

### 4.6b Always a video
Besides the contact sheets, always deliver a **timelapse video of the improvements**: vertical 1080x1920 cards, one per iteration step (before → steps → after), each labelled with what changed and, if there is a reference, the reference frame in a corner, joined with short crossfades. Send it as soon as a round of fixes is done, then the final video.

### 4.7 Sound (`audio.py` → stems → `mix.py`)
Rewrite the cue table for the story. `audio.py` writes only stems (`music.wav`, `sfx.wav`): a warm music loop whose chords change with the story beats, stopping or resolving on the last word, plus SFX on events (whooshes on big moves, clicks, coin chimes, pops on reveals, creaks, page flips, ticks, stings). Mix with `python3 mix.py voice.mp3 music.wav sfx.wav`; confirm it prints music at −6.0 dB vs voice and SFX at or below, then normalise the whole mix to peak 0.8 before `finish.sh`. Lock picture timing before making sound.

### 4.8 Render + finish
- `RESUME=1 node render.mjs frames "0-<N-1>"` with Bash `run_in_background` and a Monitor loop that reports every 100 frames and exits when the process ends. Don't run heavy Python at the same time.
- If the user asks to stop, stop the render cleanly, keep the frames, and offer an MP4 preview of what exists.
- `bash finish.sh "Title"`: one linear gain to about −14 LUFS plus the limiter, H.264 CRF 17 + AAC, freeze/black and loudness QA, `out/qa_sheet.jpg`. Look at the sheet; frozen spans of 0.4 s or more or black frames need a fix.
- Deliver the MP4 with SendUserFile and a few lines on what each shot shows. If a Higgsfield virality tool is available, offer to run it on the finished video.

## Engine gotchas (keep them if rebuilding)
- Faster CPU path on Linux: three.js through a local EGL/Mesa bridge (headless GL, about 0.3-1.5 s per 1080x1920 frame) instead of Chromium + swiftshader.
- Double-sided grass flips its normal on back faces → black tufts. Remove `normal *= faceDirection` for blades and give them a flat ground normal in the normal/depth pass.
- Ink on foliage and grass becomes a noisy web of lines: give crowns their own normal/depth material (smooth crown normal, depth compressed toward the crown centre).
- Canvas pixels with alpha 0 lose their RGB: use RGB channels for masks.
- A function that resets colours every frame (e.g. `applyLight`) overrides changes made only when a material is created.
- The bundler/destructuring path does not support `import { a as b }`.
- `#include <fog_vertex>` / `<fog_fragment>` on their own lines. The final pass writes `linearToOutputTexel(...)`.
- The normal+depth pass swaps materials per mesh: world → normal/depth, cards → alpha-tested mask, blobs/clouds/sky hidden. Fog and shadows are off during it. Ink goes on the near side of depth jumps only.
- DOF: 48 taps with a per-sample CoC test. The shadow camera is centred on each shot's look point.

## Architecture (reference)
`web/index.html` loads `main.js` (ES module) over a local HTTP server. `main.js`: renderer, toon materials, world, cards, passes colour → normal/depth → ink+grade → DOF, exposing `window.renderFrame(f)` and `window.ready`. `story.js` exports SHOTS, `shotAt`, `camAt`, `dofAt`, LIGHTS/`lightFor`, `worldAt`, `actorsAt`, `fxAt`, all pure functions of the frame. `render.mjs`: Playwright → `renderFrame(f)` → JPEG per frame. `mix.py` and `finish.sh`: level lock, linear loudness, limiter, encode, QA.