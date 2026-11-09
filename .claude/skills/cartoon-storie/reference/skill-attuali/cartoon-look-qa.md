---
name: "cartoon-look-qa"
description: "Companion to cartoon-audio-short: look targets, readability traps and QA checks for 2D-characters-in-3D-world cartoon shorts. Use alongside it before the look approval and final render."
---

# Cartoon look + QA (companion to cartoon-audio-short)

Use together with `cartoon-audio-short`. That skill owns intake, script, facts, timing, audio and delivery. This one only raises the picture quality and catches readability mistakes. Never copy another creator's scripts, characters or shots. Story, characters and voice are always original.

## Look targets (measured values, start here)
- **Default style = smooth PBR world, no world ink** (engine B in `render-engines-objects`): only the character cards have outlines. The world-ink values below apply only if the user asks for the comic look.
- **World ink (comic look only):** near-black #0b0a0c, about 3 px at 1080 wide, nearly constant with distance. Lines only on silhouettes, depth jumps and sharp creases. No line on wall/floor joins or the horizon. Character cards are never outlined by the world ink. Foliage and grass use their own normal/depth materials so they do not become a web of lines.
- **Character ink:** dark plum #201628-#2f1d28, thicker on the shadow side.
- **Day colour:** median luma about .57, no crushed blacks (p5 about .23). Sky top about #2c62c8-#5e93d9, horizon lighter. Saturated grass (render about rgb 70-75 / 130-155 / 45-55), red earth about rgb 165-180 / 90-120 / 60-75. Fog colour = horizon colour. Cool tint only in shade.
- **Night:** ground stays readable blue-green (about rgb 26-35 / 40-50 / 58-70), darker grass blades on top, a lighter earth path, warm local lights; never a global over-exposure. Moon with halo, blue-lit soft clouds, small coloured bulbs that bloom, warm lantern pools on the ground, low ground mist, dark tree silhouettes on lighter hills.
- **Golden hour:** backlit low sun, peach horizon about #ffd08a, violet-blue shadows (never brown), peach fog only far away, inner rim light on heads/torso only.
- **Depth of field:** on about 1/3 of screen time (close-ups, mediums, inserts), focus on the eyes. Establishing and wide shots stay sharp. Bloom only on emissive/HDR parts.
- **Camera:** hard cuts only on place or time jumps. Otherwise smootherstep glides of 18-40 frames. Every hold creeps in slowly. Impact shakes flip sign every frame and decay in about 7 frames. About one shot in three has a foreground prop.
- **Characters:** bean head (h/w about .93), about 3.5 head-heights tall, thin stick limbs, ink-dot hands. Blinks every 0.5-2.3 s lasting about 4 frames. Contact shadow under the feet; grass kept clear of the feet.
- **Film grain:** off.

## Readability traps (check every new prop and shot)
- A swing drawn as one rope hidden behind the kid reads as a hanging. Use two ropes and a wide plank.
- Props closer than about 2 m to the lens become huge cut-off blobs at the frame edge. Re-check props whenever a camera moves.
- A foreground bush cut by the frame edge reads as a green ball. Make it recognisable or remove it.
- Flags: avoid combinations that read as another country's flag unless the setting requires it; then use a period-correct design.
- Painted signs lit from the side go grey and unreadable. Give the face an unlit material; keep text portrait-sized and unmirrored.
- Rails or beams at chest height cut through characters. Raise the lens so they cross the legs.
- Anything between the camera and a board or subject must go.
- Frozen holds read as freezes in QA. Every hold needs a creeping push-in.
- Far backdrops that render black or white: wrong normals or beyond fog far (see the traps in cartoon-audio-short 4.3e).

## Look check (before asking the user to approve)
1. Render 3+ stills per shot and a first-frame board of every shot, plus full-resolution crops of ground, water and materials.
2. Score each area out of 10: day colour, night colour, lighting, ink, textures, water, object density, characters, depth, composition, script match.
3. List numbered fixes with frame numbers. Fix, re-render stills, re-score. Stop at 7 or more in every area, or after 3 rounds.
4. Show the sheets and the improvement timelapse to the user and wait for approval before the long render.

## Final QA (after the render)
- Scan every frame for black, white, frozen (12+ frames) and pop frames.
- Check loudness (about -14 LUFS) and peak (-1 dBFS), and that the voice is untouched.
- Look at the contact sheet: text readable, nothing cropped, last frame matches the first.
- Determinism: the same frame rendered twice gives the same hash.
- Pixel-sized post parameters must scale with output height (stills at a lower scale can look different from the final render).