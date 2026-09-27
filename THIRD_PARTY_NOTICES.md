# Third-party notices and review record

Review date: 2026-09-27. Versions are those resolved by the current `package-lock.json`.

Cardfolio was implemented as a fresh project after the CF-02 reuse review. No code or assets from the external binder reference projects were copied. The initial repository scaffold was produced by Create Next App; Next.js is MIT licensed. The repository currently has no top-level project license, so no permission to reuse Cardfolio's own source is granted by default. The owner must choose and add a project license before presenting the repository as open source.

## Runtime dependencies

| Package | Version | Declared license |
|---|---:|---|
| `@dnd-kit/core` | 6.3.1 | MIT |
| `@dnd-kit/utilities` | 3.2.2 | MIT |
| `@tanstack/react-query` | 5.104.0 | MIT |
| `idb` | 8.0.3 | ISC |
| `lucide-react` | 1.48.0 | ISC |
| `next` | 16.3.6 | MIT |
| `react` | 19.2.8 | MIT |
| `react-dom` | 19.2.8 | MIT |
| `zod` | 4.6.5 | MIT |
| `zustand` | 5.0.15 | MIT |

The release check reads the installed metadata for every runtime dependency and fails if a license outside the reviewed permissive set appears.

## Development dependency review

Direct development dependencies currently declare MIT, ISC or Apache-2.0. The installed dependency tree contained 423 distinct package/version pairs at review time: 358 MIT, 26 Apache-2.0, 16 ISC, 9 BSD-2-Clause, 3 BSD-3-Clause, 3 MPL-2.0, 2 MIT-0, 2 CC0-1.0, and one each of 0BSD, Python-2.0, CC-BY-4.0 and LGPL-3.0-or-later.

The LGPL entry is the optional platform package `@img/sharp-libvips-darwin-arm64@1.3.3`, used on the build machine through the Next.js/sharp toolchain. It is not present in the static `out/` deployment. Anyone redistributing the development dependency bundle rather than the static output must review its LGPL obligations separately.

The authoritative license texts and copyright notices remain in each installed package and its upstream repository. This file is an inventory, not a replacement for those texts.

## Data and image sources are separate

TCGdex describes its cards-database repository as MIT licensed and its API as free without an API key. This does not establish a blanket license for Pokémon names, logos, card artwork or externally hosted card scans. Cardfolio stores TCGdex data references and loads images directly; the public image/brand operating model remains a human release gate.

Marketplace names and links are used only to describe user-initiated handoffs. Cardfolio does not claim partnership, endorsement, price accuracy, an exact match or a completed purchase.
