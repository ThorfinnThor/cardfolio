# Scene tags prototype (EN only)

This is an alternative to the CLIP prototype in `../semantic-search`. CLIP mostly matched printed card text:
Drowzee (HGSS 62) ranked first for "sleeping" because of its attack "Sleep Inducer", although the artwork shows it
surfing. Here the artwork itself is described with fixed tags, and the search runs over those tags.

It has its own `package.json`, so the root dependencies and lockfile are untouched.

## Method

1. Uses the same 1,579 cards as the CLIP test (`../semantic-search/out/cards.json`, 10 EN sets).
2. `build-sheets.mjs` fetches `${image}/high.webp` into memory and crops the artwork window.
   - Crop boxes are set per layout era in `sheet.mjs`.
   - Secret rares and full-art rule boxes are shown as the whole card.
   - It writes contact sheets of 12 crops (4×3), each labelled with its card id, into a temp directory **outside the repo**.
3. Claude Sonnet subagents (4 in parallel) looked at the sheets and wrote the tags by hand.
   No API or model service was used. Sheets were deleted after every batch of 4, and the temp directory was removed at the end.
4. `search.mjs` answers the 20 test queries. The query-to-tag table is small and explicit, so the test judges the tags, not clever search logic.
5. Self-check: `check-sheets.mjs` builds one sheet of the top 8 per query (again temp only).
   The orchestrating session (not the taggers) judged each result → `out/self-check.json`.

No image bytes are committed. Git contains only scripts and JSON.

## Tag schema (`out/tags.json`)

Each card also carries `id, name, set, setId, localId, image` from TCGdex.

| Field | Values |
| --- | --- |
| `kind` | pokemon · trainer · energy · other |
| `place` | beach · ocean · underwater · river-lake · forest · jungle · grassland · mountain · volcano · cave · desert · snow-ice · city · indoors · sky · space · ruins · garden · swamp · plain-background · abstract · unclear |
| `time` | day · sunset-sunrise · night · unclear |
| `weather` | clear · rain · snow · storm · fog · wind · none-visible |
| `activity` | up to 2 of: sleeping · eating · flying · swimming · fighting · running · playing · resting · posing · using-move · none-visible · other |
| `pokemon_count` | 0 · 1 · 2 · 3+ |
| `human_present`, `has_flowers` | booleans |
| `caption` | one short sentence |
| `confidence` | high · medium · low |

After merging, 9 tags that broke the schema were corrected by hand. Each one is listed in `out/tagging-meta.json`.

## Results

- **Self-check:** 127 of 160 top-8 slots matched the query when checked by eye. Details are in `out/results.json` → `selfCheck`.
- **Weak queries:**
  - "in a kitchen": the schema has no kitchen value.
  - "in space": only 4 cards were tagged as space.
  - "in the rain": storm and lightning got mixed up with rain.
  - "two pokemon playing together".
- **Limits:**
  - Whole-card thumbnails (full art, illustration rares) are small, so their tags have low confidence.
  - Tags are machine-written judgements, not TCGdex data, and must be labelled that way in any UI.
  - Tie order within equal scores is alphabetical, not by relevance.

## v2: extended schema and re-tag (`out/v2/`, v1 kept as baseline)

**What changed**
- New values:
  - `place: kitchen`
  - `weather: lightning`
- New fields:
  - `interaction`: none · playing-together · fighting-each-other · caring-cuddling · with-human · other
  - `food_visible`
- Stricter rules for `space` (no holo sparkle), `volcano` (a volcano or lava must be visible, fire alone doesn't count), `rain` (visible rain only), `eating` (a Pokémon eating) and `playing` (two or more Pokémon interacting).
- `place`, `weather` and `activity` were re-tagged for all 1,579 cards. This was not a candidate subset, so no random control sample was needed.
- `search-v2.mjs` maps the queries to the new fields. It also fixes "rain" matching "rainbow" in captions.

**Outputs**
- `tags.json`
- `changes.json`: every changed field (old → new)
- `tagging-meta.json`
- `results.json`: same structure as v1, plus `extraQueries`
- `self-check.json`
- `self-check-extra.json`

**Result (honest)**
- **Overall:** 122 of 160, compared with 127 in v1. The stricter rules raised precision but made the new values very sparse:
  - kitchen: 1 card
  - space: 2 cards
  - volcano: 4 cards
  - lightning: 4 cards
  - rain: 4 cards
  - playing-together: 1 card
- **Why the weak queries still miss:** they now return 1–6 results, and the empty top-8 slots count as misses.
- **Where precision improved:**
  - rain: 5 of 6 results correct
  - volcano: 5 of 6
  - kitchen: 1 of 1
- **Where it dropped:** "two pokemon playing together" fell from 4 to 1, because the re-tag was much stricter than v1.
- **Consistency between passes:** the two passes disagree on many fields. 966 of 1,579 cards changed in at least one field, but most changes are cosmetic:
  - `weather` none-visible → clear: 318 cards
  - `place` plain-background → abstract: 95 cards
- **Generalisation check:** 6 queries that were not used for tuning scored 28 of 48 (see `self-check-extra.json`).
- **Lesson:** strict rules on their own just move errors from precision to recall. Rare scenes (kitchen, space, playing) need either a looser rule, or an "only N matches" UI that doesn't pad the list.

## Run

```sh
npm install
node build-sheets.mjs "$(mktemp -d)" 0 3   # sheets 0-3 into a temp dir (delete after use)
node search.mjs                            # out/tags.json -> out/results.json
```

If Node rejects TLS certificates on macOS, prefix the commands with `NODE_EXTRA_CA_CERTS=/etc/ssl/cert.pem`.
