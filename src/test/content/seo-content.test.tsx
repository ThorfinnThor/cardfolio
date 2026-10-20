// @vitest-environment node
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { GuideArticle, GuideIndex, LandingSections, SpeciesArticle, SpeciesIndex } from "@/components/content/Articles";
import { ContentFrame } from "@/components/content/ContentFrame";
import { type PageLanguage } from "@/config/site";
import { DISCLAIMER } from "@/content/disclaimer";
import { GUIDES } from "@/content/guides";
import { guideMetadata, homeMetadata, speciesMetadata } from "@/content/page-meta";
import { SPECIES } from "@/content/pokemon-species";
import { MIN_CARDS, MIN_SETS, computeSpeciesStats, publishedSpecies } from "@/content/pokemon-stats";
import { BROWSER_STORAGE_KEYS, LEGAL } from "@/content/legal";
import { OPERATOR } from "@/config/operator";
import { guideIndexPath, guidePath, homePath, legalPath, speciesIndexPath, speciesPath, speciesSlug } from "@/content/routes";
import sitemap from "@/app/sitemap";
import { fixedLocaleForPath } from "@/i18n/fixed-locale";

const LANGUAGES: PageLanguage[] = ["de", "en"];
const published = publishedSpecies();

function text(markup: string): string {
  return markup.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/g, " ").replace(/\s+/g, " ").trim();
}
function words(markup: string): number {
  return text(markup).split(" ").length;
}

/** Every route the site publishes, as paths with trailing slash. */
function knownPaths(): Set<string> {
  const paths = new Set<string>(["/", "/en/", "/geschenk/", "/help/", "/anleitung/cardmarket/", "/impressum/", "/datenschutz/", "/en/legal-notice/", "/en/privacy/"]);
  for (const language of LANGUAGES) {
    paths.add(guideIndexPath(language));
    paths.add(speciesIndexPath(language));
    for (const guide of GUIDES) paths.add(guidePath(language, guide));
    for (const { entry } of published) paths.add(speciesPath(language, entry));
  }
  return paths;
}

function hrefs(markup: string): string[] {
  /* next/link adds the configured trailing slash at build time only, so compare the normalised form. */
  return [...markup.matchAll(/href="([^"]+)"/g)].map((match) => match[1]!).filter((href) => href.startsWith("/")).map((href) => (href.endsWith("/") ? href : `${href}/`));
}

describe("Pokémon pages are only published with real material behind them", () => {
  it("every curated Pokémon meets the data thresholds, so no page is silently dropped or thin", () => {
    for (const entry of SPECIES) {
      const stats = computeSpeciesStats(entry);
      expect(stats, entry.slug).toBeDefined();
      expect(stats!.cardCount, `${entry.slug} cards`).toBeGreaterThanOrEqual(MIN_CARDS);
      expect(stats!.setCount, `${entry.slug} sets`).toBeGreaterThanOrEqual(MIN_SETS);
    }
    expect(published).toHaveLength(SPECIES.length);
  });

  it("has unique slugs in both languages", () => {
    for (const language of LANGUAGES) {
      const slugs = SPECIES.map((entry) => speciesSlug(language, entry));
      expect(new Set(slugs).size).toBe(slugs.length);
    }
  });

  it("gives every page its own title, description and set of figures", () => {
    for (const language of LANGUAGES) {
      const titles = published.map((item) => String(speciesMetadata(language, item).title));
      const descriptions = published.map((item) => String(speciesMetadata(language, item).description));
      expect(new Set(titles).size).toBe(titles.length);
      expect(new Set(descriptions).size).toBe(descriptions.length);
    }
    const intros = SPECIES.map((entry) => entry.about.de[0]);
    expect(new Set(intros).size).toBe(intros.length);
    const figures = published.map(({ stats }) => `${stats.cardCount}|${stats.setCount}|${stats.firstYear}|${stats.topSets.map((set) => set.setName).join(",")}`);
    expect(new Set(figures).size).toBe(figures.length);
  });

  it("carries enough text per page to be a useful article", () => {
    for (const language of LANGUAGES) {
      for (const item of published) {
        const markup = renderToStaticMarkup(<SpeciesArticle published={item} language={language} all={published} />);
        expect(words(markup), `${language}/${item.entry.slug}`).toBeGreaterThanOrEqual(280);
      }
    }
  });
});

describe("guides", () => {
  it("exist in both languages with the same structure", () => {
    for (const guide of GUIDES) {
      expect(guide.de.sections.length, guide.id).toBe(guide.en.sections.length);
      guide.de.sections.forEach((section, index) => {
        expect(section.blocks.map((block) => block.type), `${guide.id} section ${index}`).toEqual(guide.en.sections[index]!.blocks.map((block) => block.type));
      });
    }
  });

  it("have distinct slugs, titles and descriptions", () => {
    for (const language of LANGUAGES) {
      for (const key of ["slug", "title", "description"] as const) {
        const values = GUIDES.map((guide) => guide[language][key]);
        expect(new Set(values).size, `${language} ${key}`).toBe(values.length);
      }
    }
  });

  it("are substantial articles", () => {
    for (const language of LANGUAGES) {
      for (const guide of GUIDES) {
        expect(words(renderToStaticMarkup(<GuideArticle guide={guide} language={language} />)), `${language}/${guide.id}`).toBeGreaterThanOrEqual(300);
      }
    }
  });

  it("keep titles and descriptions within search result limits", () => {
    for (const language of LANGUAGES) {
      for (const guide of GUIDES) {
        const meta = guideMetadata(language, guide);
        expect(String(meta.title).length, `${language}/${guide.id} title`).toBeLessThanOrEqual(75);
        expect(String(meta.description).length, `${language}/${guide.id} description`).toBeLessThanOrEqual(200);
      }
    }
  });
});

describe("no invented prices or guarantees", () => {
  it("contains no currency amounts in any content text", () => {
    const sources = [JSON.stringify(GUIDES), JSON.stringify(SPECIES)];
    for (const source of sources) expect(source).not.toMatch(/\d\s?(€|\$|EUR|USD)|(€|\$)\s?\d/);
  });
});

describe("trademark notice", () => {
  it("names Nintendo, Creatures, GAME FREAK and The Pokémon Company in both languages", () => {
    for (const language of LANGUAGES) {
      const all = [DISCLAIMER[language].heading, ...DISCLAIMER[language].lines].join(" ");
      for (const name of ["Nintendo", "Creatures", "GAME FREAK", "The Pokémon Company"]) expect(all, `${language} ${name}`).toContain(name);
    }
  });

  it("appears on every content page", () => {
    for (const language of LANGUAGES) {
      const heading = DISCLAIMER[language].heading;
      const pages = [
        <ContentFrame key="guides" language={language}><GuideIndex language={language} /></ContentFrame>,
        <ContentFrame key="species" language={language}><SpeciesIndex all={published} language={language} /></ContentFrame>,
        ...GUIDES.map((guide) => <ContentFrame key={guide.id} language={language}><GuideArticle guide={guide} language={language} /></ContentFrame>),
        ...published.map((item) => <ContentFrame key={item.entry.slug} language={language}><SpeciesArticle published={item} language={language} all={published} /></ContentFrame>),
      ];
      for (const page of pages) expect(renderToStaticMarkup(page)).toContain(heading);
    }
  });
});

describe("internal links", () => {
  it("only point at pages that exist", () => {
    const known = knownPaths();
    for (const language of LANGUAGES) {
      const pages = [
        <ContentFrame key="home" language={language}><LandingSections language={language} species={published} withIntro /></ContentFrame>,
        <ContentFrame key="guides" language={language}><GuideIndex language={language} /></ContentFrame>,
        ...GUIDES.map((guide) => <ContentFrame key={guide.id} language={language}><GuideArticle guide={guide} language={language} /></ContentFrame>),
        ...published.map((item) => <ContentFrame key={item.entry.slug} language={language}><SpeciesArticle published={item} language={language} all={published} /></ContentFrame>),
      ];
      for (const page of pages) {
        for (const href of hrefs(renderToStaticMarkup(page))) expect(known.has(href), `${language}: ${href}`).toBe(true);
      }
    }
  });
});

describe("sitemap", () => {
  const entries = sitemap();
  const urls = entries.map((entry) => entry.url);

  it("lists every page once, without duplicates", () => {
    expect(new Set(urls).size).toBe(urls.length);
  });

  it("leaves out pages that must not be indexed", () => {
    expect(urls.some((url) => url.includes("/artwork-review/"))).toBe(false);
    expect(urls).not.toContain("https://yourcardbinder.com/geschenk/");
  });

  it("declares hreflang in both directions", () => {
    for (const entry of entries) {
      const languages = entry.alternates?.languages as Record<string, string> | undefined;
      if (!languages) continue;
      for (const alternate of [languages.de!, languages.en!]) {
        const counterpart = entries.find((candidate) => candidate.url === alternate);
        expect(counterpart, `${entry.url} -> ${alternate}`).toBeDefined();
        expect((counterpart!.alternates?.languages as Record<string, string>).de).toBe(languages.de);
      }
    }
  });

  it("only contains routes that exist", () => {
    const known = knownPaths();
    for (const url of urls) expect(known.has(new URL(url).pathname), url).toBe(true);
  });
});

describe("home metadata", () => {
  it("points the German and English home pages at each other", () => {
    expect((homeMetadata("de").alternates?.languages as Record<string, string>).en).toBe("/en/");
    expect((homeMetadata("en").alternates?.languages as Record<string, string>).de).toBe("/");
    expect(homePath("en")).toBe("/en/");
  });
});

describe("fixed language routes", () => {
  it("keeps content pages in their own language and leaves the app alone", () => {
    expect(fixedLocaleForPath("/en/")).toBe("en");
    expect(fixedLocaleForPath("/en/guides/gift-pokemon-cards/")).toBe("en");
    expect(fixedLocaleForPath("/ratgeber/pokemon-kartenzustand")).toBe("de");
    expect(fixedLocaleForPath("/pokemon-binder/glurak/")).toBe("de");
    expect(fixedLocaleForPath("/")).toBeNull();
    expect(fixedLocaleForPath("/geschenk/")).toBeNull();
    expect(fixedLocaleForPath("/help/")).toBeNull();
    expect(fixedLocaleForPath("/entry/")).toBeNull();
  });
});

describe("legal pages", () => {
  const text = (language: PageLanguage, id: "imprint" | "privacy") => {
    const document = LEGAL.find((entry) => entry.id === id)![language];
    return JSON.stringify([document.intro, document.sections]);
  };

  it("name the operator and a contact address in the legal notice and the privacy policy", () => {
    for (const language of LANGUAGES) {
      for (const id of ["imprint", "privacy"] as const) {
        const all = text(language, id);
        for (const part of [OPERATOR.businessName, OPERATOR.owner, OPERATOR.street, OPERATOR.postalCode, OPERATOR.email]) expect(all, `${language}/${id} ${part}`).toContain(part);
      }
    }
  });

  it("carry the Amazon Associates statement wherever Amazon links are described", () => {
    expect(text("de", "imprint")).toContain("Als Amazon-Partner verdiene ich an qualifizierten Verkäufen.");
    expect(text("de", "privacy")).toContain("Als Amazon-Partner verdiene ich an qualifizierten Verkäufen.");
    expect(text("en", "imprint")).toContain("As an Amazon Associate I earn from qualifying purchases.");
    expect(text("en", "privacy")).toContain("As an Amazon Associate I earn from qualifying purchases.");
  });

  it("list every browser storage entry the app writes, and every external host it connects to", () => {
    for (const language of LANGUAGES) {
      const privacy = text(language, "privacy");
      for (const key of BROWSER_STORAGE_KEYS) expect(privacy, `${language} ${key}`).toContain(key);
      for (const host of ["api.tcgdex.net", "assets.tcgdex.net", "Cloudflare", "Cardmarket", "TCGplayer", "amazon.de"]) expect(privacy, `${language} ${host}`).toContain(host);
    }
  });

  it("are linked from every public content page and have matching paths in both languages", () => {
    for (const language of LANGUAGES) {
      const markup = renderToStaticMarkup(<ContentFrame language={language}><GuideIndex language={language} /></ContentFrame>);
      expect(hrefs(markup)).toContain(legalPath(language, "imprint"));
      expect(hrefs(markup)).toContain(legalPath(language, "privacy"));
    }
    expect(legalPath("de", "privacy")).toBe("/datenschutz/");
    expect(legalPath("en", "imprint")).toBe("/en/legal-notice/");
  });

  it("are not offered to search engines", () => {
    const urls = sitemap().map((entry) => entry.url).join(" ");
    for (const path of ["/impressum/", "/datenschutz/", "/en/legal-notice/", "/en/privacy/"]) expect(urls).not.toContain(path);
  });
});
