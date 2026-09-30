# Handoff: semantic card search (EN)

Status as of 2026-09-30. Branch `claude/project-thread-jqmwl5` (PR #3, draft prototype, not for merge into the app).
Everything here is a prototype under `prototypes/`, each part with its own `package.json`. Nothing touches the app code,
the root `package.json` or the lockfile.

## Status (updated on every stop)

**2026-09-30 ~18:05 Berlin: Phase A complete, tag list frozen, Phase B at 65/164 sets.**

- **Final tags (23, `semantic-tags/v3/final-tags.mjs`):** beach, water-surface, underwater, forest, grassland-field,
  mountain-rocks, cave, desert, snow-ice, city, indoors, ruins-building, sky-clouds, night, sunset-sunrise, fire-lava,
  flowers, food-visible, human-present, multiple-pokemon, sleeping, flying, swimming.
- **Dropped (free text only):** storm-weather (agreement 56 %), space (1 card in the test set).
- **Rule revision** passed for all 5 borderline tags (`v3/out/phaseA/reliability.json` → `revision1`):

  | Tag | Precision | Agreement |
  | --- | --- | --- |
  | night | 96 % | 93 % |
  | flying | 96 % | 89 % |
  | ruins-building | 92 % | 89 % |
  | water-surface | 100 % | 92 % |
  | multiple-pokemon | 88 % | 92 % |

- **Final rules:** `v3/tag-rules-final.md`. Phase B agent instructions: `v3/agent-instructions-full.md`.
- **Phase B:** 164 sets with images, 1,911 sheets. **65 sets and 5,876 of 21,990 cards are complete (27%).** The latest completed block is `hgssp`, `hgss2`, `hgss3`, `hgss4`, `col1`; the next open block is `bw3`, `bw4`, `bw5`.
- **Audit:** all 23 frozen tags were cross-checked before these blocks. A 240-card random sample found five cards requiring correction (2.1% before correction); targeted checks brought the total to 109 corrected cards. Details: `v3/AUDIT.md`, `v3/out/full/audit.json`, `v3/out/full/audit-fixes.json`. The latest validation passes with 5,876/5,876 valid rows and no new relationship conflicts.
- **Progress:** `v3/out/full/progress.json` (per set: cards, valid, invalid, tokens, minutes). Results per set: `v3/out/full/<setId>.json`. Invalid results: `v3/out/full/failed.json`.
- **Starting / resuming:** `node v3/plan-full.mjs 36` lists only the jobs still open. For each job, an agent gets `SETS`, a temp folder `A` (outside the repo) and a result folder `R`, and follows `v3/agent-instructions-full.md`. Afterwards run `node v3/ingest-full.mjs R/<setId>.json <tokens> <minutes>` for each set, then commit and push.
- **Known issues:** Node on macOS needs `NODE_EXTRA_CA_CERTS=/etc/ssl/cert.pem`. `high.webp` returns a 404 for a few cards (e.g. sv03.5-163); the sheet builder then uses `high.png`. The usage limit can stop runs; everything is resumable per set.

## Goal

Users should be able to search cards by what the **artwork shows**, for example "pokemon at the beach", "sleeping" or
"at night". This comes in addition to the existing name and number search (`src/domain/catalog-search.ts`), which
stays unchanged. English only. No server, no running costs: static data plus search in the browser.

## What was tried, and the result

| Step | Folder | Method | Result (strict self-check, borderline = miss) |
| --- | --- | --- | --- |
| 1 | `semantic-search/` | CLIP image vectors (ViT-B/32 and B/16, transformers.js), text query → cosine similarity | **Not usable.** CLIP reads the printed card text: Drowzee HGSS 62 ranks first for "sleeping" because of the attack "Sleep Inducer", while the artwork shows it surfing. 38–46 % of top-8 hits contain the query word in the card text; random cards: 10 %. |
| 2 | `semantic-tags/` (v1) | Artwork crops on contact sheets, scene tags written by Claude (Sonnet) agents, simple tag search | **127/160** correct top-8 hits across 20 queries (CLIP: "sleeping" 1–2/8, "eating" 0/8) |
| 3 | `semantic-tags/out/v2` | Stricter schema (kitchen, lightning, interaction, food) and a re-tag | **122/160.** Stricter rules made rare values nearly empty. The two passes also disagreed a lot. 6 untuned queries: 28/48 |
| 4 | `semantic-tags/v3` | **Multi-label presence tags** with written decision rules, measured with two independent passes plus a precision check | Phase A done; all 23 tags passed. Phase B is 65/164 sets complete and audited. Phase C open. |

Main lesson: **tags that are reliable and understandable beat vectors and fine-grained categories.** Anything that
isn't reliably taggable goes into the free-text caption.

## v3 Phase A: reliability of the 25 candidate tags (1,579 test cards, 10 sets)

- Two independent Sonnet passes, same rules (`semantic-tags/v3/tag-rules.md`).
- Precision was checked by eye on up to 24 random cards that both passes marked (strict).
- Gate: precision ≥ 85 % **and** positive agreement ≥ 80 %.

| Tag | Precision | Agreement | Cards (both passes) | Gate |
| --- | --- | --- | --- | --- |
| beach | 96 % | 97 % | 29 | ✅ |
| underwater | 96 % | 99 % | 66 | ✅ |
| forest | 96 % | 87 % | 206 | ✅ |
| grassland-field | 92 % | 88 % | 143 | ✅ |
| mountain-rocks | 96 % | 85 % | 140 | ✅ |
| cave | 94 % | 90 % | 18 | ✅ |
| desert | 91 % | 96 % | 22 | ✅ |
| snow-ice | 100 % | 87 % | 16 | ✅ |
| city | 95 % | 92 % | 22 | ✅ |
| indoors | 100 % | 90 % | 37 | ✅ |
| sky-clouds | 92 % | 85 % | 181 | ✅ |
| sunset-sunrise | 88 % | 87 % | 26 | ✅ |
| fire-lava | 96 % | 83 % | 52 | ✅ |
| flowers | 96 % | 94 % | 101 | ✅ |
| food-visible | 100 % | 91 % | 26 | ✅ |
| human-present | 100 % | 99 % | 83 | ✅ |
| sleeping | 100 % | 80 % | 6 | ✅ (small sample) |
| swimming | 100 % | 84 % | 58 | ✅ |
| night | 88 % | 79 % | 33 | ❌ → rule revision |
| flying | 100 % | 79 % | 85 | ❌ → rule revision |
| ruins-building | 100 % | 79 % | 19 | ❌ → rule revision |
| water-surface | 83 % | 93 % | 125 | ❌ → rule revision |
| multiple-pokemon | 79 % | 80 % | 57 | ❌ → rule revision (Dugtrio, Exeggcute and Klink were counted as several Pokémon) |
| storm-weather | 100 % | 56 % | 11 | ❌ dropped, free text only |
| space | – | – | 1 | ❌ dropped, free text only |

- **Where the two passes disagree:** mostly on real scenes that one pass missed (recall), not on false hits.
- **Captions:** in 60 random cards, none contradicts its tags. In 3 of them the caption names a setting whose tag is missing, so the caption helps as a fallback.
- **Details:** `semantic-tags/v3/out/phaseA/` (`reliability.json`, `agreement.json`, `precision-sample.json`, `caption-check.json`, `passA.json`, `passB.json`).

**Rule revision** (`v3/tag-rules-rev1.md`, at most one per tag): the 5 borderline tags are being re-tagged twice on the
same cards and then measured against the same gate. If they pass, the final list has up to 23 tags; if not, 18.

## Plan for the rest (agreed with the owner)

1. **Tag list frozen:** `v3/final-tags.mjs`; the combined final rules are in `v3/tag-rules-final.md`.
2. **Phase B: the full EN catalogue (in progress).**
   - Scope: `v3/out/catalog.json` has 220 sets, 21,990 cards with an image and 1,780 without (those are skipped).
   - Tagging: one pass per set, 12 artwork crops per sheet, up to 4 parallel agents.
   - Crops: per series in `v3/sheet-full.mjs`; whole card for secret rares and full-art rule boxes.
   - Tooling: `v3/plan-full.mjs` builds the jobs and skips sets that are already done. `v3/build-full-sheets.mjs` builds the sheets. `v3/ingest-full.mjs` validates and writes `v3/out/full/<setId>.json`, `progress.json` and `failed.json`.
   - Pushes: every few sets. The run can be resumed at any time.
   - Estimate: about 1.5–2 h of wall time, about 9 M tokens (at the Phase A rate of about 0.42 M tokens per 1,000 cards).
   - Quality check: 10 random sets × 24 cards checked by eye, reported as an error rate.
3. **Phase C: free-text search.**
   - Module: `v3/search.mjs`, plain JS with no dependencies, runs in the browser and in Node.
   - Matching: an explicit synonym table maps query words to tags (e.g. seaside/shore → beach, woods/jungle → forest). Words it can't map are returned as `unmappedTerms` and searched in the caption instead; no invented matches.
   - Index: compact (tags as a bitmask plus the caption); raw and gzip size to be reported.
   - Test: 20 original plus 10 new queries on the full catalogue, strict self-check on 240 slots.

## Rules that apply (AGENTS.md plus the owner's decisions)

- **Card images:** the owner explicitly approved a narrow exception. For tagging, `high.webp` is loaded into memory, cropped and composited into a contact sheet in a **temp folder outside the repo**; the sheet is deleted after each batch. No image bytes in git, no cache, no mirror. Leftover temp files are removed after aborted runs (last check: 0 files).
  - Caveat: the sheets Claude looks at stay in the session history as image content.
- **API use:** the tagging calls no API and no model service. Claude agents look at the sheets themselves, and the cost comes out of the owner's normal Claude allowance.
- **Data:** everything comes from the TCGdex EN API; nothing is invented. Tags are machine-made judgements and must be **labelled as automatically detected** in the app.
- **TCGdex:** at most 4 parallel requests, retry with backoff.

## Decisions for `docs/decisions.md` (still to be written, with integration review)

1. Image exception: temporary contact sheets outside the repo for one-off tagging, deleted right away. No images in git or the cache.
2. Tags and captions are marked as "automatically detected" in the app; wrong tags can be corrected.
3. The search runs entirely in the browser on a static file under `public/data`, loaded only when semantic search is opened. No model in the browser (unlike the CLIP plan, which would have needed a text encoder of about 64 MB).
4. New sets are tagged incrementally (`plan-full.mjs` skips sets that are already done).

## What a later app integration needs

- A data file with id, tags (bitmask) and caption per card, plus a version and the tag list. Validate it on load, like the other catalogue data.
- The search module as domain logic outside React (AGENTS.md), with tests over a small fixture file.
- UI: its own mode next to the name/number search, tag chips plus a free-text field, and a note that tags are auto-detected. Show few hits honestly instead of padding the list.
- Card identity: tags belong to the artwork, i.e. the TCGdex card id (EN). Variants of a card share the tags.
- No dependency changes without integration review.

## Where things are

| Path | Content |
| --- | --- |
| `semantic-search/` | CLIP prototype (vectors, 20 queries, `out/results.json`) |
| `semantic-tags/` | Tag prototype v1 (`out/tags.json`, `out/results.json`, `out/self-check.json`) and v2 (`out/v2/`) |
| `semantic-tags/sheet.mjs` | Contact-sheet builder (in memory, temp output only) |
| `semantic-tags/v3/` | Current approach: rules, Phase A results, catalogue, full-run tooling |

## Running it locally

```sh
cd prototypes/semantic-tags && npm install
# Node on macOS sometimes rejects the certificate chain:
export NODE_EXTRA_CA_CERTS=/etc/ssl/cert.pem
node v3/fetch-catalog.mjs              # refresh the EN catalogue (metadata only)
node v3/plan-full.mjs 36               # jobs for sets not done yet
node v3/build-full-sheets.mjs "$(mktemp -d)" <setId> 0 3   # sheets into a temp folder, delete after use
node v3/ingest-full.mjs <result.json>  # validate and store one set
```

## Costs so far (Claude allowance, no API)

- **Per full pass over 1,579 cards:** about 0.65–0.7 M tokens in 5–8 minutes with 4 agents.
- **Total so far:** about 5 M tokens across all passes, including v1, v2, Phase A and part of the revision.
- **Usage limit:** reached once on 2026-09-30 (09:10–13:40 Berlin); work continued at the point where it stopped.

## Decisions by the owner (Palico), in order

- 2026-09-29: English only. Semantic search should find cards by motif, not by card text.
- 2026-09-29: CLIP is dropped after the first results (see table above). Claude looks at the artwork instead of a vector model.
- 2026-09-29: Sonnet (not Opus) for the tagging agents, no API key: the agents run inside the Claude Code session on the owner's Mac and use the owner's Claude allowance.
- 2026-09-29: Temporary contact sheets outside the repo are acceptable, deleted after every batch (the exception described under "Rules that apply").
- 2026-09-30: Keep only reliable tags, extend to about 20, then tag the **full** English catalogue and add free-text search on top.
- 2026-09-30: Document everything in this file on GitHub before the full-catalogue run starts.

## Honest limits

- Every precision and "x/160" figure in this file was judged by a Claude session (strict, borderline = miss), not by a human. Palico should spot-check a sample before anything ships.
- Tags come from an LLM looking at small crops. Two independent passes agreed on `place` for only 77 % of cards in v2, which is why v3 uses presence tags with written rules and a gate.
- Tags that are reliable but rare (`sleeping`: 9 cards in the test set) have small samples, so their measured precision is uncertain.
- Whole-card thumbnails (secret rares, full arts) are small, so their tags have lower confidence.
- `v3/ingest-full.mjs` imports `v3/final-tags.mjs`, which does not exist until the tag list is frozen. Create it first (export `FINAL_TAGS`, same order as `TAGS` in `v3/tags.mjs` minus the dropped ones).

## Environment notes

- The Claude cloud container used by the project thread cannot reach `api.tcgdex.net`, `assets.tcgdex.net` or `huggingface.co`. All fetching and tagging runs on the owner's Mac through a Remote Control session (worktree `~/Projects/cardfolio-semsearch`).
- The Mac session can stop when the usage limit is hit or the Mac goes offline. It resumes from the files on the branch, so push often and keep this file's status current.
- Preview: Cloudflare Pages builds the branch as `https://claude-project-thread-jqmwl5.cardfolio-780.pages.dev`. It shows the unchanged app, because the prototype adds no app code.

## How a new session continues

1. `git fetch` and check out `claude/project-thread-jqmwl5`. Read this file, `semantic-tags/v3/tag-rules-final.md` and `semantic-tags/v3/AUDIT.md`.
2. Run `node v3/plan-full.mjs 36`; the next open job is currently `bw3`, `bw4`, `bw5`.
3. Run Phase B per set with the commands under "Running it locally". Push every few sets and update the status here.
4. After Phase B, build Phase C (`v3/search.mjs`) and test it on the full catalogue.
5. Only after that, prepare a separate integration PR (data file, domain search module with tests, UI, `docs/decisions.md` entries) with integration review.

## Before merging PR #3

This PR is a record of the experiments, not meant for `main` as it is: 59+ files and about 140,000 added lines.
`semantic-search/out/*.bin` (about 17 MB of CLIP vectors) and the per-pass JSON files are experiment output.
Suggested cleanup: keep scripts and the final tag data that are needed, drop the CLIP outputs, and move the final data into `public/data` in a separate reviewed PR.
