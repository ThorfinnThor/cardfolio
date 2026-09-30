# Full-catalogue tagging audit

Audit date: 2026-09-30. Scope before the next tagging block: 56 sets and 5,060 English cards.

## Method

- Structural validation of every result row: expected id, exactly one row per card, known tags, canonical tag order and a non-empty bounded caption.
- Positive precision check: eight deterministic examples for each of the 23 frozen tags (184 checks).
- Recall probes from caption/tag disagreements, expanded for the categories where misses were found.
- Relationship probes for beach/water, swimming/water and split surface/underwater scenes.
- Independent random sample: 10 sets across eras, 24 cards per set (240 cards).

The targeted sheets and the random sample overlap in places; they are not added together as an error-rate denominator.
The temporary contact sheets were generated outside the repository and removed after the audit.

## Result

- The 23-tag vocabulary and its frozen decision rules remain suitable. No tag was added, removed or redefined.
- The structural audit passes: 5,060/5,060 rows valid, zero missing or duplicate ids and zero schema errors.
- The random sample found five cards needing a tag correction: 5/240, a pre-correction card-level error rate of 2.1%.
- Targeted recall probes found additional real omissions. In total, 109 cards were corrected: 107 missing tag assignments were added and four false assignments were removed.
- The six remaining relationship flags are legitimate exceptions: two split waterline scenes, three stylized swimming scenes without a separately visible body of water, and one sandy tropical beach artwork without visible water.

The applied corrections and their visual reasons are recorded in `out/full/audit-fixes.json`. The machine-readable audit report is `out/full/audit.json`.

After the audit corrections, the next four sets (`pl3`, `pl4`, `ru1`, `hgss1`) were tagged by visually checking every artwork. The same structural and relationship audit was then rerun over the expanded data: 60 sets, 5,464/5,464 valid rows, zero schema errors and no new relationship conflicts. The six documented exceptions above remain unchanged.

## Limit

This is a strong model-assisted audit, not a human review of all 5,060 individual artworks. Every tag was checked, every row was validated, and the targeted and random checks were corrected; isolated visual judgement errors can still exist. Tags remain automatically detected data and must be labelled accordingly in the product.
