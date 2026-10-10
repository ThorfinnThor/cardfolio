# Semantic search prototype (EN only)

A self-contained experiment, separate from the app build: it computes CLIP image embeddings of TCGdex EN card
images and checks how well free-text queries ("pokemon at the beach") retrieve matching cards.
It has its own `package.json`, so the root dependencies and lockfile are untouched.

## Run

```sh
cd prototypes/semantic-search
npm install
node fetch-cards.mjs   # card metadata for 10 EN sets + total EN catalogue count -> out/cards.json
node embed.mjs         # image embeddings, both models, f32 + int8 -> out/*.bin, out/vectors.meta.json
node query.mjs         # 20 queries x {raw, template} x {f32, int8} -> out/results.json
```

The first run downloads model files (about 1.4 GB in total) into the gitignored `.models/` folder.
If Node rejects TLS certificates on macOS, prefix the commands with `NODE_EXTRA_CA_CERTS=/etc/ssl/cert.pem`.

## Rules followed

- Card images are fetched from `${card.image}/low.webp`, decoded in memory, embedded and dropped.
  No image bytes are written to disk or committed, and there is no image cache.
- TCGdex requests use at most 4 concurrent fetches, with retry and exponential backoff.
- All data comes from the TCGdex EN API (`https://api.tcgdex.net/v2/en`).

## Output files (`out/`)

| File | Content |
| --- | --- |
| `cards.json` | Sets, card metadata, skipped cards (no `image`), total EN catalogue count |
| `vectors.meta.json` | Row order for every `.bin` file: id, name, setId, setName, localId, image base URL |
| `<model>.f32.bin` | float32, N×512, L2-normalised, full card scan |
| `<model>.i8.bin` + `<model>.i8scale.f32.bin` | int8 N×512 plus one float32 scale per row (value ≈ int8 × scale) |
| `<model>.art.*` | Same layout, embedded from a fixed crop of the artwork window (comparison only) |
| `embed-report.json` | Image fetch and embedding timings |
| `results.json` | Top 8 results for each model × variant × template × precision, overlaps, latencies, model sizes, extrapolation |

Vision encoder: fp32. Query text encoder: q8 (`text_model_quantized.onnx`, 64.5 MB). The fp32 text encoder is
used only to measure how much the q8 text encoder changes the rankings.
