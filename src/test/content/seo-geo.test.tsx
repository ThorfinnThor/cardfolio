// @vitest-environment node
import { readFileSync } from "node:fs";

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { GuideArticle, LandingSections } from "@/components/content/Articles";
import { GUIDE_AUTHOR, OG_IMAGE, type PageLanguage, absoluteUrl } from "@/config/site";
import { GUIDE_EXTRAS } from "@/content/guide-extras";
import { GUIDES } from "@/content/guides";
import { publishedSpecies } from "@/content/pokemon-stats";
import { guidePath } from "@/content/routes";

const LANGUAGES: PageLanguage[] = ["de", "en"];

function jsonLd(markup: string): Array<Record<string, unknown>> {
  return [...markup.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((match) => JSON.parse(match[1]!.replace(/\\u003c/g, "<")) as Record<string, unknown>);
}

describe("guide answers and FAQs", () => {
  it("exist for every guide, in both languages, with matching question counts", () => {
    expect(Object.keys(GUIDE_EXTRAS).sort()).toEqual(GUIDES.map((guide) => guide.id).sort());
    for (const guide of GUIDES) {
      const extras = GUIDE_EXTRAS[guide.id]!;
      expect(extras.de.faq.length, guide.id).toBe(extras.en.faq.length);
      expect(extras.de.faq.length, guide.id).toBeGreaterThanOrEqual(3);
      expect(extras.published <= guide.updated, `${guide.id} published before updated`).toBe(true);
    }
  });

  it("keep the summary short and the answers direct, with no currency amounts", () => {
    for (const extras of Object.values(GUIDE_EXTRAS)) {
      for (const language of LANGUAGES) {
        const extra = extras[language];
        expect(extra.answer.length).toBeGreaterThan(80);
        expect(extra.answer.length).toBeLessThanOrEqual(420);
        for (const item of extra.faq) {
          expect(item.q.endsWith("?")).toBe(true);
          expect(item.a.length).toBeGreaterThan(40);
          expect(item.a.length).toBeLessThanOrEqual(400);
        }
        expect(JSON.stringify(extra)).not.toMatch(/\d\s?(€|\$|EUR|USD)|(€|\$)\s?\d/);
      }
    }
  });

  it("render the summary first and the questions last", () => {
    for (const language of LANGUAGES) {
      const guide = GUIDES[0]!;
      const markup = renderToStaticMarkup(<GuideArticle guide={guide} language={language} />);
      expect(markup).toContain(GUIDE_EXTRAS[guide.id]![language].answer);
      expect(markup).toContain(language === "de" ? "Häufige Fragen" : "Frequently asked questions");
      expect(markup.indexOf("Kurz gesagt") >= 0 || markup.indexOf("In short") >= 0).toBe(true);
      expect(markup).toContain(GUIDE_AUTHOR.name);
    }
  });
});

describe("structured data", () => {
  it("describes each guide as an Article with dates, image and a named author, and as a FAQPage", () => {
    for (const language of LANGUAGES) {
      for (const guide of GUIDES) {
        const blocks = jsonLd(renderToStaticMarkup(<GuideArticle guide={guide} language={language} />));
        const article = blocks.find((block) => block["@type"] === "Article")!;
        expect(article.datePublished).toBe(GUIDE_EXTRAS[guide.id]!.published);
        expect(article.dateModified).toBe(guide.updated);
        expect(article.image).toEqual([absoluteUrl(OG_IMAGE.url)]);
        expect(article.author).toMatchObject({ "@type": "Person", name: GUIDE_AUTHOR.name });
        expect(article.mainEntityOfPage).toBe(absoluteUrl(guidePath(language, guide)));
        const faq = blocks.find((block) => block["@type"] === "FAQPage")!;
        expect((faq.mainEntity as unknown[]).length).toBe(GUIDE_EXTRAS[guide.id]![language].faq.length);
      }
    }
  });

  it("adds Organization, WebSite and the landing FAQ to the home page", () => {
    for (const language of LANGUAGES) {
      const blocks = jsonLd(renderToStaticMarkup(<LandingSections language={language} species={publishedSpecies()} />));
      const graph = blocks.find((block) => "@graph" in block)?.["@graph"] as Array<Record<string, unknown>>;
      expect(graph.map((node) => node["@type"])).toEqual(["Organization", "WebSite", "FAQPage"]);
    }
  });
});

describe("crawler files", () => {
  it("robots.txt allows crawling, keeps data files out and names the sitemap", () => {
    const result = robots();
    expect(result.sitemap).toBe(absoluteUrl("/sitemap.xml"));
    const rule = Array.isArray(result.rules) ? result.rules[0]! : result.rules;
    expect(rule.userAgent).toBe("*");
    expect(rule.allow).toBe("/");
    expect(rule.disallow).toEqual(["/data/", "/artwork-review/"]);
  });

  it("the sitemap carries the guides' last-modified dates", () => {
    const entries = sitemap();
    for (const guide of GUIDES) {
      for (const language of LANGUAGES) {
        const entry = entries.find((item) => item.url === absoluteUrl(guidePath(language, guide)));
        expect(entry?.lastModified, guide.id).toBe(guide.updated);
      }
    }
  });

  it("llms.txt lists every guide in both languages", () => {
    const file = readFileSync("public/llms.txt", "utf8");
    expect(file.startsWith("# Your Card Binder")).toBe(true);
    for (const guide of GUIDES) {
      for (const language of LANGUAGES) {
        expect(file, `llms.txt is missing ${guidePath(language, guide)}; regenerate it`).toContain(absoluteUrl(guidePath(language, guide)));
        expect(file).toContain(guide[language].title);
      }
    }
  });
});
