// @vitest-environment node
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SpeciesArticle } from "@/components/content/Articles";
import { type PageLanguage } from "@/config/site";
import { publishedSpecies } from "@/content/pokemon-stats";

const LANGUAGES: PageLanguage[] = ["de", "en"];
const published = publishedSpecies();

/** Prose and list text only: the sidebar, table of contents, figures and the labels of data tables and fact lists are page structure. */
function plain(markup: string): string {
  return markup.replace(/<(aside|nav|table|dl|figcaption|figure|h[1-6])[\s\S]*?<\/\1>/g, " ").replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/g, " ").replace(/\s+/g, " ").trim();
}

function shingles(value: string, size = 5): Set<string> {
  const tokens = value.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean);
  const result = new Set<string>();
  for (let index = 0; index + size <= tokens.length; index += 1) result.add(tokens.slice(index, index + size).join(" "));
  return result;
}

describe("Pokémon pages", () => {
  it("do not read like one template: few shared five-word passages between any two pages", () => {
    for (const language of LANGUAGES) {
      const pages = published.map((entry) => ({ slug: entry.entry.slug, shingles: shingles(plain(renderToStaticMarkup(<SpeciesArticle published={entry} language={language} all={published} />))) }));
      for (const [index, a] of pages.entries()) {
        for (const b of pages.slice(index + 1)) {
          let shared = 0;
          for (const item of a.shingles) if (b.shingles.has(item)) shared += 1;
          const share = shared / Math.min(a.shingles.size, b.shingles.size);
          expect(share, `${language}: ${a.slug} vs ${b.slug}`).toBeLessThan(0.16);
        }
      }
    }
  });

  it("each have a paragraph of their own about their card forms", () => {
    for (const { entry } of published) {
      for (const language of LANGUAGES) expect(entry.story[language].length, `${language}/${entry.slug}`).toBeGreaterThan(150);
      expect(new Set(published.map((other) => other.entry.story.de)).size).toBe(published.length);
    }
  });
});
