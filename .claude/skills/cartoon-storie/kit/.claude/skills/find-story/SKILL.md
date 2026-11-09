---
name: find-story
description: Researches true science, invention and history stories with a hidden-science twist and offers 3-4 video options, each with a short story outline. Use when the user wants video ideas or a topic, or types /find-story, optionally with an area like "medicine", "the ocean", "ancient inventions" or a person's name.
argument-hint: "[optional area, e.g. medicine, ships, ancient China, a scientist's name]"
---

# Find a story

You research real stories that make great 50–65 second animated Shorts, then offer the user **3–4 options** to pick from. You do **not** make the video here. The user picks one, then runs `/make-video`.

Area the user asked for (may be empty): $ARGUMENTS

## What a good story looks like

Read the formula section of `docs/STORY_TO_FILM.md` first. Every option needs all five:

1. **A weird action or object you can show in one picture**: cutting gaps in rails, washing hands in chlorine, an iron rod on a church, a bell on a grave.
2. **Doubt**: people laughed, were insulted, banned it, ignored it, or it simply looked silly, dangerous or impossible.
3. **Proof**: a result, a disaster or a number that shows the idea was right.
4. **Hidden science**: a simple, real mechanism you can explain in 1–2 sentences (heat expansion, pressure, germs, resonance, psychology…).
5. **An arguable last line**: something viewers will want to comment on.

Four story types count (mix them across your options):
- **A. Laughed-at genius**: someone was mocked or ignored, then proven right. *(Semmelweis and handwashing.)*
- **B. Weird old practice, real reason**: a custom that looks silly but works. *(Why sailors poured oil on stormy seas.)*
- **C. "You" story**: the viewer is the hero of a strange real situation ("Imagine your boss walks you to a room with no work…").
- **D. A famous person's strange habit**, with the science behind it. *(Edison napping with steel balls in his hands.)*

## Steps

### 1. Brainstorm
List 8–10 candidates in the area. If no area was given, spread them across fields: medicine, engineering, food, ships and sea, space, everyday objects, ancient inventions, animals, the human body.

Skip:
- stories already in `stories/` or listed in `topics/used.txt`;
- topics Ricks Clips already made: the ancient earthquake jar, Japan's "do-nothing" job, railroad expansion gaps, sailors' storm oil, the grave bell, the spear vs shield, Edison's steel-ball naps, the Japanese gambling window, cashiers winning the lottery;
- anything that needs graphic violence or gore to tell.

### 2. Verify with web search
For each candidate, use web search and find **at least 2 independent, reliable sources** (encyclopedias, museums, universities, science journals, government or history sites, well-known science magazines). Check:
- who, when and where;
- **whether the doubt really happened**. Many "everyone laughed" stories are myths. If the doubt was real but milder, say "doubted" or "ignored", not "laughed";
- the proof, and one solid number;
- the science, in plain words.

Drop any candidate you can't verify. Never invent quotes, newspapers or events. If a famous story is a legend, either drop it or label it clearly as a legend.

### 3. Score and pick the best 3–4
Rate each 1–5 on: one-picture weirdness, real doubt, dramatic proof, simple science, arguable ending, and **can the kit draw it**. The kit has rooms (hospital, office, palace, study, tavern), outdoor scenes (field, town by day or night, storm, sea, desert, city street, snow, canyon), 25 props, crowds, close-ups, chalkboards, title cards and weather. Microscopic or abstract things work as a chalkboard, a close-up or a title card. Keep the top 3–4.

### 4. Present the options
For each option, show:

```
## Option N: <Title idea>  (type A/B/C/D · score x/30)
Hook (first line): "<under 15 words, a weird action>"
The story in 7 beats:
  1. Weird action: ...
  2. Stakes: ... (one number)
  3. Clue: ...
  4. Doubt: ...
  5. Payoff: ...
  6. Science: ...
  7. Last line: "..."
Why it works: <one line>
Looks like: <places / characters / key shots from the kit>
Facts checked: <2-3 key facts>
Sources: <2+ links>
Honesty notes: <what is simplified or dramatized, if anything>
```

Keep each option short. The user should be able to read all of them in under 2 minutes.

### 5. Save and hand off
- Save all options (with the full facts and sources) to `topics/latest_options.md` (overwrite it) and a copy to `topics/options_<YYYY-MM-DD>.md`.
- End with: **"Pick one: type `/make-video 2` (or the number you like). You can also ask for more options or a different area."**

The first time, Claude Code asks permission for web search. Tell the user to click **Allow**.
