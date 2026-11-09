# Story → Film: the recipe

You turn a true "everyone laughed at them, then they were proven right" story into a ~55-second vertical Short: round-head cartoon characters, word-by-word captions, a narrator, music and sound effects. Everything runs on the user's own computer (Mac or Windows) for free.

**One story file drives everything:** `stories/<name>.json`. You write it; `run.py render` turns it into `out/<name>.mp4`.

### Commands
Run these from this folder. On a **Mac** start them with `python3`, on **Windows** with `py` (or `python` if `py` isn't found).

| What | Command |
|---|---|
| Setup (safe to repeat) | `python3 run.py setup` |
| Check + stills (fast look check) | `python3 run.py stills stories/<name>.json` |
| Final video | `python3 run.py render stories/<name>.json` |
| Hear all 5 voices | `python3 run.py voices` |

---

## The workflow (follow it in order)

1. **Pick the story.** If the user gave a topic, use it. If not, suggest 3 options using the topic formula below and let them pick.
2. **Get the facts right first.** Write the real facts in the `"facts"` field (who, when, where, numbers, what's true and what's dramatized). Use numbers you're sure of, and soften the ones you aren't ("about one in ten"). Never invent quotes, newspapers or events and present them as real.
3. **Write the script** (rules below): 150–180 words, 14–20 short lines.
4. **Turn it into the story file** (format below). Start from `stories/handwashing_doctor.json` as a template.
5. **Check it:** `python3 run.py stills stories/<name>.json`. This runs the checker, then draws 2 stills per shot into `out/<name>_stills/` and a `contact.png` sheet. Fix every ❌. Fix the ⚠️ variety warnings unless you have a reason not to.
6. **Look at `contact.png` yourself** (open it with the Read tool). Check: nobody is cut off at the edge, characters don't overlap, captions don't sit on faces, every shot shows something different, the boards/cards are readable. Fix and repeat step 5.
7. **Render:** `python3 run.py render stories/<name>.json` (about 1–2 minutes). Tell the user where the video is, how long it is, and suggest 3 titles.

Permission prompts: the first time, Claude Code asks before running commands. Click **Allow** (or switch on Auto mode).

---

## The formula: "The Laughed-At Genius"

| Beat | What happens | Example line |
|---|---|---|
| 1. **Weird-action hook** (1 line, ≤15 words) | A strange action, no context | "In 1847, a young doctor put a bowl of chlorine water by the hospital door," |
| 2. **Stakes** (2–3 lines) | Why it matters, with a number | "In the one run by doctors, about one in ten new mothers died of fever." |
| 3. **The clue** (1–2 lines) | Something strange the hero notices | "Then his friend cut his finger during an autopsy, and died of the exact same fever." |
| 4. **Mockery** (2–3 lines) | Everyone laughs, is insulted, or ignores them | "The other doctors were insulted. Their hands? Dirty?" |
| 5. **Payoff** (1–2 lines) | Proof the hero was right | "But in his ward, deaths fell from one in ten to about one in a hundred." |
| 6. **Science reveal** (1–2 lines) | The real mechanism in plain words | "Tiny germs were riding on the doctors' hands. Chlorine kills them." |
| 7. **Arguable last line** (1 line) | Something people want to comment on | "Today, every hospital has his bowl. They just call it a sink." |

**Topic formula: Weird Practice + People Who Laughed + Hidden Physics.** Good topics have an odd object, rule or habit you can show in one picture; a reasonable person would laugh at it at first; and a real, simple mechanism explains it.

**Title patterns:** "Why [Group] [Did Weird Thing]" · "The [Object] That [Did Something Impossible]" · "Why Perfect [Thing] Don't Work" · "What the [Object] Really Meant".

### Script rules
- Spoken US English. Short sentences. One idea per line. Each line becomes one shot (2–4 seconds).
- Years are fine as digits ("1847"); the narrator says them naturally.
- Put 1–3 key words per line in `*stars*` to make that caption yellow (`"and told every doctor: *wash your hands.*"`). Use it on the punchline words, not everywhere.
- The last line should invite an argument or a "wait, really?" in the comments.
- Accuracy: keep the drama, keep the facts. If you simplify, simplify honestly.

---

## The story file

```json
{
  "title": "…",
  "facts": "Real facts and sources, plain text.",
  "voice": {"name": "joe", "speed": 1.05},
  "music": {"mood": "mystery", "bpm": 100},
  "cast":   { "hero": {"coat": "#2E7D7A", "hair": "receding", "mustache": true} },
  "places": { "hall": {"preset": "hospital"} },
  "beats": [
    {"say": "…", "shot": "wide", "place": "hall", "camera": "push_in",
     "cast": [{"id": "hero", "x": 330, "pose": "place", "face": "determined"}],
     "props": [{"type": "basin", "x": 730, "y": 1800, "scale": 1.45}],
     "sfx": [{"type": "whoosh"}, {"type": "splash", "at_word": "water"}]}
  ]
}
```

Each **beat** = one spoken line + what's on screen while it's spoken.

### Beat fields
| Field | What it does |
|---|---|
| `say` | The line. `*stars*` = yellow caption words. |
| `shot` | `wide` (place + characters + props), `closeup` (one big character, blurred background), `board` (chalkboard with numbers), `headline` (newspaper spins in), `card` (big text like "20 YEARS LATER") |
| `place` | A name from `places`, or a preset name directly |
| `camera` | A preset name, or `{"preset": "punch", "focus": [x, y], "from": 1.2, "to": 1.45}` |
| `transition` | `cut` (default), `whip` (fast blur slide), `flash` (white flash) |
| `cast` | Characters in the shot (see below) |
| `crowd` | Background people: `{"n": 4, "face": "laugh", "y": 1520, "scale": 1.35, "seed": 4, "hats": ["top","none"]}` |
| `props` | `[{"type": "door", "x": 860, "y": 1400, "scale": 1.2, "text": "WARD 1"}]` |
| `sfx` | `[{"type": "whoosh"}, {"type": "splash", "at_word": "water"}]` — `at_word` starts it on that spoken word; `at` adds seconds |
| `fx` | `[{"type": "rain"}, {"type": "lightning", "at_word": "struck", "x": 540}]` |
| `shake` | Screen shake: `{"at_word": "boom", "strength": 1.0, "time": 0.6}` |
| `continue` | `true` = same scene keeps going (no new place). Add a `camera` to it for a cut-in on the same scene. |
| `board` | `{"title": "DEATHS", "write": [{"text": "1 in 10", "at_word": "one", "slot": 0}]}` — slots 0,1,2 top to bottom; `"color"`, `"size"`, `"strike": 0` crosses out slot 0 |
| `headline` | `{"paper": "THE BOSTON GAZETTE", "text": "IRON RODS BLAMED FOR EARTHQUAKE"}` (only for headlines that really ran, or clearly as a dramatization) |
| `card` | `{"text": "20 YEARS LATER", "sub": "1868"}` |
| `hands` | In a closeup: `"germs"` or `"clean"` shows big hands. `germs_at_word` / `clean_at_word` time them. |
| `pause` | Extra silence after this line (seconds, default 0.2) |
| `caption` | `false` hides captions for this line |

### Characters (`cast` at the top)
| Setting | Options |
|---|---|
| `body` | `coat` (long frock coat, default), `suit`, `shirt` (modern), `dress`, `robe`, `armor` |
| `coat` | Any color, e.g. `"#2E7D7A"` (the body color) |
| `hat` | `none`, `top`, `bowler`, `cap`, `crown`, `helmet`, `chef`, `straw`, `hood` (+ `hat_color`, `plume`) |
| `hair` | `side`, `receding`, `bald`, `long`, `bun`, `spiky`, `none` (+ `hair_color`) |
| extras | `mustache`, `beard`, `glasses`, `monocle`, `lanyard`, `necktie` (true/false), `tie` (color), `belt` (color, robes) |

Give the hero one signature color or item and keep it in every shot.

### A character in a shot (`beats[].cast[]`)
| Field | Options |
|---|---|
| `id` | A name from `cast` |
| `x`, `y` | Feet position. Keep `x` 150–930. `y` default 1800 (indoors and outdoors). |
| `scale` | Default 2.1. Use 1.85–1.95 for 3 people in one shot. |
| `facing` | `1` = looks right, `-1` = looks left |
| `pose` | `idle`, `place`, `point`, `point_up`, `arms_crossed`, `hands_hips`, `arms_up`, `show_hands`, `shrug`, `hold`, `wave`, `facepalm`, `think`, `run`, `cheer`, `beg`, `reach` |
| `face` | `neutral`, `smile`, `grin`, `laugh`, `angry`, `offended`, `shock`, `scared`, `worried`, `determined`, `smug`, `sad`, `sleepy`, `confused` |
| `anim` | `laugh` (auto with face laugh), `jump`, `shiver`, `bounce` |
| `hold` | `lantern`, `book`, `paper`, `phone`, `cup`, `bag`, `sword`, `key`, `torch` |
| `walk_to` | Walks from `x` to this x. `walk_time` seconds, `walk_start` delay. |

### Places
Presets: `hospital`, `ward`, `office`, `palace`, `study`, `tavern`, `field`, `town_day`, `town_night`, `storm`, `sea`, `sea_storm`, `desert`, `city_street`, `snowfield`, `canyon`.

Override any setting: `{"preset": "hospital", "wall": "#9AA39A", "night": true}`.
- Rooms (`"type": "room"`): `wall` color, `floor` (`checker`, `wood`, `carpet`, `stone`, `marble`), `window` (`arched`, `square`, `city`, `none`), `window_x`, `lamp` (`sconce`, `ceiling`, `none`), `lamp_x`, `night`, `wainscot`, `columns`, `banner` (color).
- Outdoors (`"type": "outdoor"`): `sky` (`day`, `sunset`, `night`, `storm`, `dawn`), `ground` (`grass`, `sand`, `snow`, `street`, `dirt`, `water`, `stone`), `far` (`hills`, `mountains`, `city`, `town`, `sea`, `none`), `sun`.

### Props
`basin`, `door` (`text`, `color`), `bed`, `table`, `desk`, `chair`, `crate`, `barrel`, `sign` (`text`), `money_bag`, `wall_clock`, `painting`, `bookshelf`, `street_lamp` (`lit`), `bell` (`swing`), `tree`, `rock`, `boat`, `cart`, `campfire`, `house` (`lit`, `color`, `roof`), `church` (`rod`, `bell_swing`), `well`, `jar`.
Every prop takes `x`, `y` (its base on the floor), `scale`. Wall items (`wall_clock`, `painting`, `bell`) use `y` as their center/top. Add `"behind": true` to draw a prop behind everyone.

### Camera presets
`push_in`, `slow_push`, `pull_out`, `punch` (fast zoom, for punchlines), `still`, `pan_left`, `pan_right`, `pan_up`, `pan_down`. Every cut gets a small automatic settle.

### Sound effects
`whoosh`, `pop`, `splash`, `sting` (brass "dun"), `squish`, `chalk`, `chime`, `thunder`, `crash`, `rumble`, `tick`, `coins`, `ding`, `boing`, `laugh` (small crowd laugh).

### Effects (`fx`)
`rain`, `snow`, `dust`, `sparkles`, `smoke`, `dark` (all take `strength`), `lightning` (`at_word`, `x`, `target_y`).

### Voice
`"voice": {"name": "joe", "speed": 1.05}`. Names: `joe` (default), `john`, `bryce`, `norman`, `kristin` (female). All five are free for commercial use (CC0 / public domain). Setup downloads `joe`; `run.py voices` downloads the rest and saves a sample of each in `samples/voices/`. `speed`: 1.0 = normal, 1.1 = faster.

### Music
`"music": {"mood": "mystery" | "playful", "bpm": 100, "gain": 0.08, "loudness": -18}`. `gain` = music under the voice; `loudness` = overall level (LUFS).

---

## Layout cheat sheet (frame is 1080 × 1920)
- Indoor wall/floor line: y = 1400. Doors sit at y 1400. Outdoor horizon: y = 1250.
- Characters stand at y ≈ 1800 (feet). At scale 2.1 their head is around y 1000–1200.
- Captions sit at y ≈ 1580, over the bodies, below the faces.
- Two people: x ≈ 260 and 760. Three people: x ≈ 195, 540, 885 at scale 1.85–1.95.
- Props next to a character: about 350–400px away.
- `board` shots: the board covers x 70–770, y 330–1090. Put the presenter at x ≈ 790–860, `facing: -1`, scale 1.9.

## Variety rules (what makes it look like Ricks Clips, not a slideshow)
- New shot every 2–4 seconds. Use `continue` + a new `camera` for cut-ins on long lines.
- Mix shot types: mostly `wide`, plus 2–3 `closeup`s, at least one reveal (`board`, `card` or `headline`).
- Don't repeat the same place + camera + pose + face in back-to-back shots.
- Use `punch` on punchlines, `pull_out` to reveal a crowd, pans to show two things.
- A sound effect on most cuts (`whoosh`), and one on every key word.
- The checker warns you about repeats. Listen to it.

## Tested examples
- `stories/handwashing_doctor.json` — Semmelweis, 1847 (indoors, boards, germ closeups, crowd laugh). ~52s.
- `stories/lightning_rod.json` — Franklin's lightning rod (outdoors, night storm, lightning, headline). ~55s.

## Troubleshooting
| Problem | Fix |
|---|---|
| `❌ ... unknown` | Use one of the options the message lists. |
| A character is cut off | Move `x` toward 540, or lower `scale`. |
| Characters overlap | Spread `x` 300px apart, or use scale 1.85. |
| Board text too long | Shorter text, or `"size": 100`. |
| Video too short/long | Add/remove lines; or change `voice.speed` (1.0 slower, 1.15 faster). |
| Voice too loud/quiet vs music | `music.gain` (default 0.08). Whole video too loud: `music.loudness` (-18 → -20). |
| "Setup isn't finished" | Run `run.py setup`. It picks up where it stopped. |
| `voice '…' isn't downloaded yet` | Run `run.py voices` (or pick `joe`, which setup always downloads). |
| Windows: `python` opens the Microsoft Store | Install Python from python.org (tick "Add python.exe to PATH") and use `py`. |
