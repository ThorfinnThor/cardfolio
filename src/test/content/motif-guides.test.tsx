// @vitest-environment node
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { GuideArticle } from "@/components/content/Articles";
import { type PageLanguage } from "@/config/site";
import { ALL_GUIDES, GUIDES, type Guide, type GuideText } from "@/content/guides";
import { MOTIF_GUIDES } from "@/content/motif-guides";
import { guidePath, toolStartPathForTheme } from "@/content/routes";
import { giftCollectionPreset } from "@/domain/gift-collections";
import { giftThemePreset } from "@/domain/gift-theme-presets";
import sitemap from "@/app/sitemap";

const LANGUAGES: PageLanguage[] = ["de", "en"];

/** Everything an article says in its body, headings and tables included. */
function bodyText(text: GuideText): string {
  const parts = [text.intro];
  for (const section of text.sections) {
    parts.push(section.heading);
    for (const block of section.blocks) {
      if (block.type === "p") parts.push(block.text);
      else if (block.type === "ul") parts.push(...block.items);
      else parts.push(block.caption, ...block.head, ...block.rows.flat());
    }
  }
  return parts.join(" ");
}

function shingles(value: string, size = 5): Set<string> {
  const tokens = value.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean);
  const result = new Set<string>();
  for (let index = 0; index + size <= tokens.length; index += 1) result.add(tokens.slice(index, index + size).join(" "));
  return result;
}

function overlap(a: Set<string>, b: Set<string>): number {
  let shared = 0;
  for (const item of a) if (b.has(item)) shared += 1;
  return shared / Math.max(1, Math.min(a.size, b.size));
}

function outline(guide: Guide): string {
  return guide.de.sections.map((section) => section.blocks.map((block) => block.type[0]).join("")).join("/");
}

describe("motif guides", () => {
  it("point at a picture theme or card group the gift builder really offers", () => {
    for (const guide of MOTIF_GUIDES) {
      expect(guide.themeId, guide.id).toBeTruthy();
      expect(giftThemePreset(guide.themeId) ?? giftCollectionPreset(guide.themeId), guide.id).toBeDefined();
      expect(toolStartPathForTheme(guide.themeId!)).toContain(`motiv=${guide.themeId}`);
    }
    expect(new Set(MOTIF_GUIDES.map((guide) => guide.themeId)).size).toBe(MOTIF_GUIDES.length);
  });

  it("link only to guides that exist", () => {
    const ids = new Set(ALL_GUIDES.map((guide) => guide.id));
    for (const guide of ALL_GUIDES) for (const id of guide.related) expect(ids.has(id), `${guide.id} -> ${id}`).toBe(true);
  });

  it("keep unreleased pages out of routes, the sitemap and the hub", () => {
    const hidden = MOTIF_GUIDES.filter((guide) => guide.live === false);
    const urls = sitemap().map((entry) => entry.url);
    for (const guide of hidden) {
      expect(GUIDES.includes(guide), guide.id).toBe(false);
      for (const language of LANGUAGES) expect(urls.some((url) => url.endsWith(guidePath(language, guide))), `${language}/${guide.id}`).toBe(false);
    }
    for (const guide of MOTIF_GUIDES.filter((entry) => entry.live !== false)) {
      for (const language of LANGUAGES) expect(urls.some((url) => url.endsWith(guidePath(language, guide))), `${language}/${guide.id}`).toBe(true);
    }
  });

  it("exist in both languages with the same structure", () => {
    for (const guide of MOTIF_GUIDES) {
      expect(guide.de.sections.length, guide.id).toBe(guide.en.sections.length);
      guide.de.sections.forEach((section, index) => {
        expect(section.blocks.map((block) => block.type), `${guide.id} section ${index}`).toEqual(guide.en.sections[index]!.blocks.map((block) => block.type));
      });
    }
  });

  it("are substantial articles", () => {
    for (const language of LANGUAGES) {
      for (const guide of MOTIF_GUIDES) {
        const words = renderToStaticMarkup(<GuideArticle guide={guide} language={language} />).replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
        expect(words, `${language}/${guide.id}`).toBeGreaterThanOrEqual(400);
      }
    }
  });

  it("do not follow one template: headings differ and the outlines are not all alike", () => {
    for (const language of LANGUAGES) {
      for (const motif of MOTIF_GUIDES) {
        for (const section of motif[language].sections) {
          const sameHeading = ALL_GUIDES.filter((guide) => guide[language].sections.some((other) => other.heading.toLowerCase() === section.heading.toLowerCase()));
          expect(sameHeading.map((guide) => guide.id), `${language}: "${section.heading}"`).toEqual([motif.id]);
        }
      }
    }
    const outlines = MOTIF_GUIDES.map(outline);
    expect(new Set(outlines).size, outlines.join(" | ")).toBeGreaterThanOrEqual(7);
  });

  it("share no large passages of text with each other or with the older guides", () => {
    for (const language of LANGUAGES) {
      const bodies = ALL_GUIDES.map((guide) => ({ id: guide.id, shingles: shingles(bodyText(guide[language])) }));
      for (const motif of MOTIF_GUIDES) {
        const mine = bodies.find((entry) => entry.id === motif.id)!;
        for (const other of bodies) {
          if (other.id === motif.id) continue;
          expect(overlap(mine.shingles, other.shingles), `${language}: ${motif.id} vs ${other.id}`).toBeLessThan(0.1);
        }
      }
    }
  });
});
