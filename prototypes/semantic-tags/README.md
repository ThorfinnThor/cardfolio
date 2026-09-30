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

## Run

```sh
npm install
node build-sheets.mjs "$(mktemp -d)" 0 3   # sheets 0-3 into a temp dir (delete after use)
node search.mjs                            # out/tags.json -> out/results.json
```

If Node rejects TLS certificates on macOS, prefix the commands with `NODE_EXTRA_CA_CERTS=/etc/ssl/cert.pem`.
