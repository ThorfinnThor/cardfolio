/**
 * Rewrites public/llms.txt from the guides in src/content/guides.ts (titles, slugs and descriptions).
 * Run it after adding or renaming a guide: `npm run llms:generate`. A test fails when the file is out of date.
 */
import { readFileSync, writeFileSync } from "node:fs";

const source = readFileSync("src/content/guides.ts", "utf8");
const blocks = source.split(/\n  \{\n    id: "/).slice(1);
const pattern = (language) => new RegExp(`${language}: \\{\\n      slug: "([^"]+)",\\n      title: "([^"]+)",\\n      metaTitle: "[^"]*",\\n      description: "([^"]+)"`);
const german = [];
const english = [];
for (const block of blocks) {
  const de = block.match(pattern("de"));
  const en = block.match(pattern("en"));
  if (!de || !en) throw new Error(`Cannot read guide ${block.slice(0, 40)}`);
  german.push(de.slice(1));
  english.push(en.slice(1));
}

const line = (path, [slug, title, description]) => `- [${title}](https://yourcardbinder.com${path}${slug}/): ${description}\n`;
const text = `# Your Card Binder

> Your Card Binder helps you put together a Pokémon binder as a gift or for your own collection: pick a favourite Pokémon (or up to four), see the cards as a binder page and get the shopping list prepared for Cardmarket, CardTrader or TCGplayer. No account; binders stay in your browser. Independent project, not affiliated with Nintendo, Creatures, GAME FREAK or The Pokémon Company.

## Tool

- [Your Card Binder (Deutsch)](https://yourcardbinder.com/): Pokémon-Binder als Geschenk zusammenstellen
- [Your Card Binder (English)](https://yourcardbinder.com/en/): put together a Pokémon binder as a gift

## Ratgeber (Deutsch)

${german.map((guide) => line("/ratgeber/", guide)).join("")}
## Guides (English)

${english.map((guide) => line("/en/guides/", guide)).join("")}
## Pokémon binder pages

- [Binder nach Lieblings-Pokémon gestalten](https://yourcardbinder.com/pokemon-binder/): eine Seite pro Pokémon mit Kartenzahl, Jahren und Sammeltipps
- [Design a binder around your favourite Pokémon](https://yourcardbinder.com/en/pokemon-binder/): one page per Pokémon with card count, years and collecting tips

## Optional

- [Kaufanleitung Cardmarket mit Bildern](https://yourcardbinder.com/anleitung/cardmarket/)
- [Kaufanleitung TCGplayer mit Bildern](https://yourcardbinder.com/anleitung/tcgplayer/)
- [Sitemap](https://yourcardbinder.com/sitemap.xml)
`;
writeFileSync("public/llms.txt", text);
console.log(`llms.txt: ${german.length} guides per language`);
