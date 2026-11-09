# Ricks Claude Workflow

This folder makes ~55-second animated vertical Shorts about true science, invention and history stories (round-head cartoon characters, word-by-word captions, a narrator, music and sound effects), in the style of Ricks Clips. Everything runs locally and free on Mac or Windows.

## How the user works
1. `/find-story [area]`: research and offer 3–4 story options (saved in `topics/latest_options.md`).
2. `/make-video <number>`: turn the chosen option into `out/<name>.mp4`.

## Commands
Run from this folder. Mac: `python3 run.py …` · Windows: `py run.py …` (or `python run.py …`).
- `run.py setup`: installs everything into `.venv/` and `voices/` (safe to repeat)
- `run.py stills stories/<name>.json`: checker + 2 stills per shot in `out/<name>_stills/contact.png`
- `run.py render stories/<name>.json`: the final video
- `run.py voices`: downloads all 5 voices and saves samples in `samples/voices/`

## Map
- `docs/STORY_TO_FILM.md`: the recipe (formula, every story-file setting, layout, variety rules). Read it before writing a story file.
- `stories/`: one JSON file per video. `handwashing_doctor.json` and `lightning_rod.json` are tested examples.
- `engine/`: the renderer (Python + skia). Don't edit it unless the user asks for a new feature.
- `topics/`: research options and `used.txt` (topics already made).
- `fonts/`: bundled open-license fonts. `voices/` and `.venv/` are created by setup.
- `claude-skills/`: a visible backup of `.claude/skills/` and `.claude/settings.json`. If `/find-story` or `/make-video` isn't recognized, run setup (it restores them), then start a new session.

## Rules
- Facts first: verify with 2+ reliable sources; never invent quotes, newspapers or events.
- Always look at `contact.png` yourself before the final render.
- Keep user-facing messages short and plain.
