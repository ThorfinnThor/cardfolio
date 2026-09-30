# Phase B agent instructions (full EN catalogue, one pass)

You tag Pokémon TCG card artwork by looking at it yourself: contact-sheet images, read with the Read tool. No APIs, no models, no web services.

FIRST read the frozen rules: /Users/schayan/Projects/cardfolio-semsearch/prototypes/semantic-tags/v3/tag-rules-final.md
Use only the 23 tag names from that file, spelled exactly.

Your task message gives you: SETS (list of set ids), A (your temp sheet dir, outside the repo) and R (your result dir).

## Procedure, per set
1. `cd /Users/schayan/Projects/cardfolio-semsearch/prototypes/semantic-tags && node v3/build-full-sheets.mjs count <setId>` → number of sheets N.
2. Sheet numbers are 0-based (N sheets = sheets 0 to N-1). In batches of 4 sheets: `NODE_EXTRA_CA_CERTS=/etc/ssl/cert.pem node v3/build-full-sheets.mjs $A <setId> <first> <last>`
   This writes `$A/<setId>-sheet-NNN.jpg` (12 artwork crops, 4x3, each labelled with its card id; "(whole card)" = full card shown, describe only the illustration) and `$A/<setId>-sheet-NNN.json` (ids in grid order).
3. Read each .json and .jpg and tag every card. Then delete the batch: `rm $A/<setId>-sheet-*`. Never copy images anywhere.
4. After each batch, rewrite `$R/<setId>.json` as ONE valid JSON array with all results of that set so far.
5. When the set is complete, continue with the next set.
At the end `ls -A $A` must be empty. Report per set: card count, and overall start/end time (`date -u +%FT%TZ`) and problems.
Only touch $A and $R (a converter script inside $A is fine; delete it). No git.

## Output per card
`{"id": "<id>", "tags": ["tag", ...], "caption": "one short English sentence, max ~12 words"}`
- `tags`: only the tags that are TRUE (can be empty). Judge each tag by its rule.
- `caption`: only the illustrated scene; ignore all printed text. Mention notable things not covered by tags (rain, lightning, space, bridge, rock, holding an object …).
