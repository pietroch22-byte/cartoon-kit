---
name: make-video
description: Turns a chosen story into a finished animated vertical Short (narrator, word-by-word captions, music, sound effects) using this folder's free video engine. Use after /find-story when the user picks an option number, or when they give any true science, invention or history story and want the video. Example /make-video 2
argument-hint: "<option number from /find-story, or a story>"
---

# Make the video

Story to make: $ARGUMENTS

## 0. Make sure the kit is set up
All commands run from this folder. Use `python3` on a Mac and `py` on Windows (if `py` isn't found, use `python`). Below, `<py>` means whichever one works here.

| What | Command |
|---|---|
| Setup (safe to repeat; fast if done) | `<py> run.py setup` |
| Check + stills | `<py> run.py stills stories/<name>.json` |
| Final video | `<py> run.py render stories/<name>.json` |

Run Setup first. The first time it downloads about 150 MB and takes a few minutes; it prints what it's doing. If it fails, show the user the ❌ message and the matching fix from `START HERE.pdf` / `docs/STORY_TO_FILM.md` (Troubleshooting).

## 1. Load the story
- If `$ARGUMENTS` is a number (or "option 2", or a title), read that option from `topics/latest_options.md`.
- If it's a free-text story, research it first: find at least 2 reliable sources with web search, and check that the doubt really happened. If you can't verify it, say so and suggest `/find-story` instead.
- If it's empty, ask which option or story they want, and stop.

## 2. Read the recipe
Read `docs/STORY_TO_FILM.md` fully before writing anything. It has the formula, every setting, the layout cheat sheet and the variety rules. Use `stories/handwashing_doctor.json` (indoors) and `stories/lightning_rod.json` (outdoors, storm) as templates.

## 3. Write the facts, then the script
- Fill the `"facts"` field first: real facts, numbers, what is dramatized, and the source links.
- Write 150–180 words in 14–20 short lines following the 7 beats. Spoken US English, one idea per line, 1–3 `*star*` words per line for yellow captions.
- Accuracy rule: keep the drama, keep the facts. Never invent quotes, newspapers or events. Use a `headline` shot only for a headline that really ran.

## 4. Write the story file
Create `stories/<short_name>.json` (lowercase, underscores). Use `"voice": {"name": "joe", "speed": 1.05}` unless the user picked another voice (`john`, `bryce`, `norman`, `kristin`). Give the hero one signature color or item and keep it in every shot. Vary shot types, places, cameras, poses and faces.

## 5. Check the look (repeat until clean)
1. Run the **Check + stills** command. It runs the checker first. Fix every ❌, and fix the ⚠️ warnings unless you have a good reason.
2. Open `out/<short_name>_stills/contact.png` with the Read tool and **look at it yourself**. Check that:
   - nobody is cut off at the edge, and characters don't overlap;
   - captions don't cover faces;
   - the key object of the story is actually on screen (not off the top of the frame);
   - boards and cards are readable, and back-to-back shots look different;
   - the last line's claim is visible (if it says "his rod is still up there", show the rod).
3. Fix the story file and repeat. Usually 2–3 rounds.

## 6. Render the final video
Run the **Final video** command (about 1–2 minutes; it prints progress). Then:
- add the story's name to `topics/used.txt`, so `/find-story` won't suggest it again;
- write `out/<short_name>_upload.txt` with 3 title ideas (using the title patterns in `docs/STORY_TO_FILM.md`), a 2–3 sentence description, the sources, and 5 hashtags.

## 7. Report
Tell the user, in a few short lines:
- where the video is (`out/<short_name>.mp4`), how long it is, and how many shots;
- the 3 title ideas;
- that they can change anything by asking ("make the hero's coat red", "make it a sunset", "use the john voice", "make it longer"). After a change, run the stills check again, then the final video.

Remind them once: give the channel its own look and pick original stories. YouTube doesn't monetize reused or mass-produced content.

Permission prompts: the first time, Claude Code asks before running commands. Tell the user to click **Allow** (or turn on Auto mode).
