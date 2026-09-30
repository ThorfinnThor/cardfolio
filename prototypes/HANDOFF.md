# Handoff: semantic card search (EN)

Status as of 2026-09-30. Branch `claude/project-thread-jqmwl5` (PR #3, draft prototype, not for merge into the app).
Everything here is a prototype under `prototypes/`, each part with its own `package.json`. Nothing touches the app code,
the root `package.json` or the lockfile.

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
| 4 | `semantic-tags/v3` | **Multi-label presence tags** with written decision rules, measured with two independent passes plus a precision check | Phase A done (below). Rule revision for 5 tags running. Phases B and C open |

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

1. **Freeze the tag list** after the revision (`v3/final-tags.mjs`, still to be created). The rules in `tag-rules.md` plus the revision become final.
2. **Phase B: the full EN catalogue.**
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
