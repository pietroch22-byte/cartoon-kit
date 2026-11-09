# START HERE: Ricks Claude Workflow

Make animated science-story Shorts like Ricks Clips, for free, on your own computer. You type one line; Claude researches the story, writes it, draws it, voices it and renders the video.

**What you get:** a ~55-second vertical video (1080×1920) with cartoon characters, word-by-word captions, a narrator, background music and sound effects. No credits, no subscriptions to video tools, and the same characters in every shot.

---

## 1. What you need
- A **Mac** (Apple Silicon or Intel) or a **Windows 10/11** PC (64-bit)
- A **Claude** plan that includes **Claude Code** (Pro or higher)
- About **1 GB** of free space, and internet for the first setup

## 2. Install the two tools (one time)

**Claude Code:** download the Claude desktop app from **claude.ai/download**, sign in, and open the **Code** tab. (If you already use Claude Code in a terminal, that works too.)

**Python 3** (the kit runs on it):
- **Mac:** open the **Terminal** app and type `python3 --version`. If a window asks to install the "command line developer tools", click **Install** and wait. That's it.
- **Windows:** go to **python.org/downloads**, download Python 3.12, and run it. On the first screen, **tick "Add python.exe to PATH"**, then click Install Now.

## 3. Get the folder
Download the zip from the link, then unzip it (double-click it on Mac; right-click → **Extract All** on Windows). Move the **Ricks Claude Workflow** folder somewhere easy, like Documents.

## 4. Open it in Claude Code and run setup
1. In Claude Code, open the **Ricks Claude Workflow** folder as your project folder.
2. Type: **`Run the setup for this folder`**
3. Click **Allow** when Claude asks to run a command (or turn on Auto mode).

Setup installs everything **inside this folder only**: drawing, voice and video tools, plus the narrator voice. It takes 2–5 minutes the first time and prints what it's doing. If your internet drops, just run it again; it continues where it stopped.

*(Without Claude: Mac, run `bash setup.sh` in Terminal from this folder. Windows, double-click `setup.bat`.)*

## 5. Make your first video
1. Type **`/find-story`** (or add an area, like `/find-story medicine` or `/find-story the ocean`).
   Claude researches real stories on the web and shows you **3–4 options**, each with a short outline, the facts and the sources.
2. Pick one: type **`/make-video 2`** (use the number you like).
3. Wait 5–10 minutes. Claude checks the facts, writes the script, builds the scenes, looks at its own still frames, fixes problems, and renders.

Your video is in the **`out`** folder, with a text file of title ideas, a description and the sources.

**One example to paste:**
```
/make-video John Snow, the doctor who stopped London's 1854 cholera outbreak by removing a water pump handle
```

## 6. Write your own story
You can skip `/find-story` and give any true story to `/make-video`. The best stories have:
1. a **weird action** you can show in one picture,
2. people who **doubted** it,
3. **proof** it worked (a number or a disaster),
4. a **simple science reason**,
5. a **last line** people will argue about in the comments.

## 7. Change a video
Just ask, in plain words:
- "Make the hero's coat red."
- "Make the first scene a sunset."
- "Use the john voice." / "Make the voice a bit slower."
- "Make it 60 seconds."
- "Add a crowd laughing in the third shot."

Claude edits the story file and renders again.

**Voices:** type `Run the voices command` to download all 5 narrators (**joe**, **john**, **bryce**, **norman**, **kristin**) and hear a sample of each in `samples/voices`. All five are free for commercial use.

## 8. Troubleshooting

| Problem | Fix |
|---|---|
| Claude keeps asking permission | Click **Allow**, or turn on Auto mode. |
| "Python 3 isn't installed" (Mac) | In Terminal run `xcode-select --install`, then setup again. |
| Windows: typing `python` opens the Microsoft Store | Reinstall Python from python.org with **"Add python.exe to PATH"** ticked. Claude will use `py`. |
| Setup stopped halfway / download failed | Run setup again. It continues where it stopped. |
| Windows: setup fails with a "path too long" or "file not found" error | Move the folder somewhere short, like `Documents\Ricks Claude Workflow` (not deep inside Downloads or OneDrive), and run setup again. |
| "voice … isn't downloaded yet" | Ask Claude to run the voices command, or use the `joe` voice. |
| Someone is cut off or characters overlap | Tell Claude: "Shot 4: the doctor is cut off, fix it." |
| Video too short or long | "Make it about 60 seconds." |
| Too loud / music too loud | "Lower the music." / "Make the whole video quieter." |
| `/find-story` or `/make-video` isn't recognized | Make sure you opened **this folder** in Claude Code (not a folder above it). Then type `Run the setup for this folder` (it restores the skills if your download dropped them) and start a new session. |

## 9. Make it your own before uploading
YouTube doesn't monetize **reused or mass-produced** content. Before you upload:
- pick **your own** stories (not ones other channels already made),
- give your hero a **signature look** (a color, a hat) and keep it,
- keep the **facts right**; viewers check, and wrong history gets called out in the comments,
- choose a voice and stick with it, so your channel sounds like you.

The kit makes the work fast. Your taste makes it yours.

---

### What's inside
| | |
|---|---|
| `START HERE.pdf` | This guide |
| `.claude/skills/` | The two skills: `/find-story` and `/make-video` |
| `claude-skills/` | A visible backup of the skills (setup restores them if a download drops hidden folders) |
| `docs/STORY_TO_FILM.md` | The full recipe Claude follows (formula, every setting) |
| `stories/` | One file per video, plus 2 tested examples |
| `samples/` | An example finished video |
| `engine/` | The video engine (drawing, voice, music, sound effects) |
| `run.py`, `setup.sh`, `setup.bat` | Setup and render commands |
| `fonts/` | Fonts used for captions, chalkboards and signs |
| `topics/` | Story options and the list of topics you've already made |

### Credits and licenses
- **Fonts:** Fredoka, Cabin Sketch and Patua One, under the SIL Open Font License (`fonts/OFL-*.txt`).
- **Voices:** Piper voices joe (CC0), john, bryce, norman and kristin (public domain recordings), downloaded from rhasspy/piper-voices during setup.
- **Music and sound effects** are generated by the kit itself.
- **Libraries** (skia-python, piper-tts, numpy, Pillow, imageio-ffmpeg) are installed from PyPI under their own licenses.
