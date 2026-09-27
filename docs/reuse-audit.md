# Reuse audit

Date: 2026-09-27

## Candidate

- Repository: `greenpure61/PokemonBinder`
- Observed HEAD: `3135568987bb6d8926f4d5d842749dbf0e21cbb3`
- Observed package scope: Prisma/PostgreSQL, authentication, Capacitor, social login and other runtime choices outside Cardfolio P0.
- License check: `LICENSE` returned HTTP 404 on both `master` and `main` at review time.
- Assets separately verified: no.

## Decision

Implement the small local-first core from scratch with public libraries. No source file or asset from the candidate repository was copied. The unresolved license therefore does not block Cardfolio and creates no third-party source notice for this implementation.
