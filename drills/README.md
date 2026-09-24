# Drill library

`drills.json` is the app-bundled drill library: **50 drills** authored
2026-09-23 from published boxing coaching curricula (see `sources.md`
for every source consulted and where sources disagreed).

## Files

- `drills.json` — canonical library. Each drill:
  ```json
  {
    "id": "snap-back-guard",
    "title": "Jab Snap-Back in the Mirror",
    "category": "guard",
    "instructions": ["Step one…", "Step two…"],
    "sets_reps": "3 x 3-minute rounds",
    "coaching_points": ["…", "…"],
    "targets_faults": ["drops-guard-on-jab", "hands-low"],
    "difficulty": "beginner",
    "equipment": "mirror"
  }
  ```
  Categories: `stance`, `guard`, `punch-mechanics`, `footwork`,
  `head-movement`, `defense`, `combinations`, `conditioning`.
  Equipment: `none`, `bag`, `mitts`, `rope`, `mirror`, `slip-rope`.
- `sources.md` — source list, the 36-key fault vocabulary (drill
  mapping is a deterministic lookup on these keys), and technique
  disagreements between sources.
- `seed_drills.sql` — upserts all 50 drills into the Supabase
  `drills` table. Generated from `drills.json`; regenerate rather
  than hand-editing (generator snippet below).

## Schema notes (JSON vs DB)

The DB table (`../backend/schema.sql`) predates the final content
schema and differs in three places — reconcile before shipping:

1. Column is `for_faults`; JSON uses `targets_faults`. The seed maps
   them; consider renaming the column for consistency.
2. `instructions` is a single `text` column; JSON stores numbered
   steps as an array. The seed flattens steps to a numbered text
   block. If step-level rendering is wanted in the app, add a
   `steps text[]` column instead.
3. There is no `equipment` column; the seed prepends an
   `Equipment: <value>` line to instructions. Add an `equipment`
   column if the app should filter by it.

## Regenerating seed_drills.sql

```python
import json
drills = json.load(open("drills.json"))
def lit(s): return "'" + s.replace("'", "''") + "'"
def arr(items): return "ARRAY[" + ",".join(lit(i) for i in items) + "]"
out = []
for d in drills:
    steps = "\n".join(f"{i+1}. {s}" for i, s in enumerate(d["instructions"]))
    text = f"Equipment: {d['equipment']}\n\n{steps}"
    out.append(
      "insert into public.drills (id, title, category, difficulty, instructions,"
      " sets_reps, coaching_points, for_faults) values ("
      + ",".join([lit(d["id"]), lit(d["title"]), lit(d["category"]),
                   lit(d["difficulty"]), lit(text), lit(d["sets_reps"]),
                   arr(d["coaching_points"]), arr(d["targets_faults"])])
      + ") on conflict (id) do update set title=excluded.title,"
        " category=excluded.category, difficulty=excluded.difficulty,"
        " instructions=excluded.instructions, sets_reps=excluded.sets_reps,"
        " coaching_points=excluded.coaching_points, for_faults=excluded.for_faults;")
open("seed_drills.sql", "w").write("\n".join(out) + "\n")
```

## Validation

After any edit, re-run: JSON must parse, ids unique, `category` /
`difficulty` / `equipment` within the enums above, `coaching_points`
2–4 entries, and every `targets_faults` value present in the fault
vocabulary in `sources.md`.
