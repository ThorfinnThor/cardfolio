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

## Semantic-search reference: `bhavnicksm/pokemon-card-explorer`

- Reviewed on: 2026-10-01
- Repository: `bhavnicksm/pokemon-card-explorer`
- Reviewed commit: `92cd922c889ed0c3cf32df0d64dfdb5436d677e6`
- Repository license: MIT (`LICENSE`, blob `7df0fe3db58d120ff2f50b92cb043874d712636e`)
- Observed architecture: Python/Streamlit UI, OpenAI embeddings, Pinecone vector storage and Cohere reranking. Its augmented dataset also contains scraped PokémonDB text and images plus generated BLIP captions.
- Fit for Cardfolio: rejected. The runtime providers, vector database, server deployment and scraped augmentation conflict with Cardfolio's static, local-first and provider-neutral release boundary.
- Reuse decision: no source code, prompts, embeddings, datasets, scraped content, screenshots, diagrams or assets were copied. The repository was used only as a documented architectural comparison. Cardfolio's reviewed 23-tag source, deterministic index builder and browser-only ranking were developed independently.

The MIT license permits reuse of the repository's software subject to its notice, but it does not independently establish rights to the upstream card imagery or scraped third-party content. Because Cardfolio reused none of it, no new bundled notice is required for this implementation.
