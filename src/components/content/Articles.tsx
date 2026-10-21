import Link from "next/link";

import { SITE_NAME, absoluteUrl, type PageLanguage } from "@/config/site";
import { GUIDES, guideById, type Guide, type GuideBlock } from "@/content/guides";
import { LANDING } from "@/content/landing";
import type { PublishedSpecies } from "@/content/pokemon-stats";
import { TOOL_START_PATH, guideIndexPath, guidePath, homePath, speciesIndexPath, speciesPath } from "@/content/routes";
import { SEMANTIC_TAG_LABELS, type SemanticTag } from "@/domain/semantic-card-search";

import styles from "./content.module.css";
import { ArticleLayout, sectionId } from "./ArticleLayout";
import { JsonLd } from "./JsonLd";
import { ToolLink } from "./ToolLink";

const POCKETS_PER_PAGE = 9;

const THEME_LABELS_EN: Readonly<Record<SemanticTag, string>> = {
  beach: "Beach",
  "water-surface": "Water surface",
  underwater: "Underwater",
  forest: "Forest",
  "grassland-field": "Meadow / field",
  "mountain-rocks": "Mountains / rocks",
  cave: "Cave",
  desert: "Desert",
  "snow-ice": "Snow / ice",
  city: "City",
  indoors: "Indoors",
  "ruins-building": "Buildings / ruins",
  "sky-clouds": "Sky / clouds",
  night: "Night",
  "sunset-sunrise": "Sunrise / sunset",
  "fire-lava": "Fire / lava",
  flowers: "Flowers",
  "food-visible": "Food visible",
  "human-present": "Person / trainer",
  "multiple-pokemon": "Several Pokémon",
  sleeping: "Sleeping",
  flying: "Flying",
  swimming: "Swimming",
};

function formatDate(language: PageLanguage, iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString(language === "de" ? "de-DE" : "en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

function formatNumber(language: PageLanguage, value: number): string {
  return value.toLocaleString(language === "de" ? "de-DE" : "en-GB");
}

export function Block({ block }: { block: GuideBlock }) {
  if (block.type === "p") return <p>{block.text}</p>;
  if (block.type === "ul") return <ul>{block.items.map((item) => <li key={item}>{item}</li>)}</ul>;
  return (
    <div className={styles.tableWrap} role="region" aria-label={block.caption} tabIndex={0}>
      <table className={styles.table}>
        <caption>{block.caption}</caption>
        <thead><tr>{block.head.map((cell, index) => <th key={`${cell}-${index}`} scope="col">{cell}</th>)}</tr></thead>
        <tbody>{block.rows.map((row) => <tr key={row.join("|")}>{row.map((cell, index) => (index === 0 ? <th key={`${cell}-${index}`} scope="row">{cell}</th> : <td key={`${cell}-${index}`}>{cell}</td>))}</tr>)}</tbody>
      </table>
    </div>
  );
}

function ToolCta({ language, label }: { language: PageLanguage; label: string }) {
  return <ToolLink href={TOOL_START_PATH} language={language} className={styles.cta}>{label}</ToolLink>;
}

export function GuideArticle({ guide, language }: { guide: Guide; language: PageLanguage }) {
  const text = guide[language];
  const copy = LANDING[language];
  const updatedLabel = language === "de" ? "Zuletzt aktualisiert" : "Last updated";
  const relatedHeading = language === "de" ? "Weiterlesen" : "Keep reading";
  return (
    <>
      <header className={styles.header}>
        <p className={styles.eyebrow}>{language === "de" ? "Ratgeber" : "Guide"}</p>
        <h1>{text.title}</h1>
        <p className={styles.lead}>{text.intro}</p>
        <p className={styles.meta}>{updatedLabel}: <time dateTime={guide.updated}>{formatDate(language, guide.updated)}</time></p>
      </header>
      <ArticleLayout language={language} toc={[...text.sections.map((section, index) => ({ id: sectionId(index), label: section.heading })), { id: "weiterlesen", label: relatedHeading }]}>
        {text.sections.map((section, index) => (
          <section key={section.heading} id={sectionId(index)} className={styles.section}>
            <h2>{section.heading}</h2>
            {section.blocks.map((block, blockIndex) => <Block key={blockIndex} block={block} />)}
          </section>
        ))}
        <section id="weiterlesen" className={styles.section}>
          <h2>{relatedHeading}</h2>
          <ul>
            {guide.related.flatMap((id) => {
              const related = guideById(id);
              return related ? [<li key={id}><Link href={guidePath(language, related)}>{related[language].title}</Link></li>] : [];
            })}
            {language === "de" ? <li><Link href="/anleitung/cardmarket/">{copy.buyingGuideLabel}</Link>. {copy.buyingGuideText}</li> : null}
          </ul>
        </section>
      </ArticleLayout>
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "Article",
        headline: text.title,
        description: text.description,
        inLanguage: language,
        dateModified: guide.updated,
        mainEntityOfPage: absoluteUrl(guidePath(language, guide)),
        author: { "@type": "Organization", name: SITE_NAME, url: absoluteUrl("/") },
        publisher: { "@type": "Organization", name: SITE_NAME, url: absoluteUrl("/") },
      }} />
    </>
  );
}

export function GuideIndex({ language }: { language: PageLanguage }) {
  const copy = LANDING[language];
  return (
    <>
      <header className={styles.header}>
        <p className={styles.eyebrow}>{language === "de" ? "Ratgeber" : "Guides"}</p>
        <h1>{language === "de" ? "Ratgeber für Pokémon-Binder und Sammelkarten" : "Guides to Pokémon binders and trading cards"}</h1>
        <p className={styles.lead}>{copy.guidesText}</p>
      </header>
      <section className={styles.section}>
        <ul className={styles.cards}>
          {GUIDES.map((guide) => (
            <li key={guide.id}>
              <Link href={guidePath(language, guide)}>
                <strong>{guide[language].title}</strong>
                <span>{guide[language].description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

function themeLabel(language: PageLanguage, tag: SemanticTag): string {
  return language === "de" ? SEMANTIC_TAG_LABELS[tag] : THEME_LABELS_EN[tag];
}

export function SpeciesArticle({ published, language, all }: { published: PublishedSpecies; language: PageLanguage; all: readonly PublishedSpecies[] }) {
  const { entry, stats } = published;
  const name = entry.names[language];
  const copy = LANDING[language];
  const de = language === "de";
  const pages = Math.ceil(stats.cardCount / POCKETS_PER_PAGE);
  const relatedSpecies = entry.related.flatMap((slug) => all.filter((candidate) => candidate.entry.slug === slug));
  const n = (value: number) => formatNumber(language, value);

  return (
    <>
      <header className={styles.header}>
        <p className={styles.eyebrow}>{de ? "Pokémon-Binder" : "Pokémon binder"}</p>
        <h1>{de ? `${name}-Binder: Karten sammeln und verschenken` : `${name} binder: collecting and gifting the cards`}</h1>
        <p className={styles.lead}>{entry.about[language][0]}</p>
      </header>
      <ArticleLayout
        language={language}
        toc={[
          { id: "glance", label: de ? "Auf einen Blick" : "At a glance" },
          { id: "about", label: de ? `Über ${name}` : `About ${name}` },
          { id: "numbers", label: de ? "In Zahlen" : "By the numbers" },
          ...(stats.topThemes.length > 0 ? [{ id: "themes", label: de ? "Häufige Motive" : "Common artwork themes" }] : []),
          { id: "plan", label: de ? "Binder planen" : "Planning the binder" },
          { id: "examples", label: de ? "Beispielkarten" : "Example cards" },
          { id: "weiterlesen", label: de ? "Weiterlesen" : "Keep reading" },
        ]}
      >

      <section id="glance" className={styles.section} aria-labelledby="glance-title">
        <h2 id="glance-title">{de ? "Auf einen Blick" : "At a glance"}</h2>
        <dl className={styles.facts}>
          <div><dt>{de ? "Pokédex-Nr." : "Pokédex no."}</dt><dd>{entry.dexNumber}</dd></div>
          <div><dt>{de ? "Typ" : "Type"}</dt><dd>{entry.types[language]}</dd></div>
          <div><dt>{de ? "Karten im Katalog" : "Cards in the catalogue"}</dt><dd>{n(stats.cardCount)}</dd></div>
          <div><dt>{de ? "Verschiedene Sets" : "Different sets"}</dt><dd>{n(stats.setCount)}</dd></div>
          <div><dt>{de ? "Zeitraum" : "Period"}</dt><dd>{stats.firstYear}–{stats.lastYear}</dd></div>
        </dl>
        <p>{de ? "Entwicklung" : "Family"}: {entry.family[language]}.</p>
      </section>

      <section id="about" className={styles.section}>
        <h2>{de ? `Über ${name}` : `About ${name}`}</h2>
        <p>{entry.about[language][1]}</p>
      </section>

      <section id="numbers" className={styles.section}>
        <h2>{de ? `${name} im Sammelkartenspiel in Zahlen` : `${name} in the trading card game by the numbers`}</h2>
        <p>
          {de
            ? `Im Katalog (englische Karten, Datenstand ${formatDate(language, stats.dataDate)}) tragen ${n(stats.cardCount)} Karten „${entry.cardName}“ im Namen. Sie verteilen sich auf ${n(stats.setCount)} Sets aus ${n(stats.seriesCount)} Serien und stammen aus den Jahren ${stats.firstYear} bis ${stats.lastYear}. Gezählt werden alle Karten, auf denen der Name vorkommt, also auch Varianten wie ex-Karten oder Karten mit mehreren Pokémon.`
            : `In the catalogue (English cards, data as of ${formatDate(language, stats.dataDate)}) ${n(stats.cardCount)} cards have “${entry.cardName}” in the name. They are spread over ${n(stats.setCount)} sets from ${n(stats.seriesCount)} series and date from ${stats.firstYear} to ${stats.lastYear}. All cards containing the name are counted, including variants such as ex cards or cards showing several Pokémon.`}
        </p>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <caption>{de ? `Die fünf Sets mit den meisten ${name}-Karten` : `The five sets with the most ${name} cards`}</caption>
            <thead><tr><th scope="col">Set</th><th scope="col">{de ? "Jahr" : "Year"}</th><th scope="col">{de ? "Karten" : "Cards"}</th></tr></thead>
            <tbody>{stats.topSets.map((set) => <tr key={set.setName}><th scope="row">{set.setName}</th><td>{set.year}</td><td>{set.cards}</td></tr>)}</tbody>
          </table>
        </div>
      </section>

      {stats.topThemes.length > 0 ? (
        <section id="themes" className={styles.section}>
          <h2>{de ? "Häufige Motive auf den Karten" : "Common artwork themes"}</h2>
          <ul>
            {stats.topThemes.map(({ tag, cards }) => (
              <li key={tag}>{themeLabel(language, tag)}: {cards} {de ? "von" : "of"} {stats.cardCount} {de ? "Karten" : "cards"} ({Math.round((cards / stats.cardCount) * 100)} %)</li>
            ))}
          </ul>
          <p>{de ? "Diese Merkmale wurden automatisch aus dem Bild erkannt und nicht einzeln geprüft. Sie zeigen eine Tendenz, ersetzen aber nicht den Blick auf die konkrete Karte." : "These features were detected automatically from the image and not checked one by one. They show a tendency but do not replace looking at the actual card."}</p>
        </section>
      ) : null}

      <section id="plan" className={styles.section}>
        <h2>{de ? `So planst du einen ${name}-Binder` : `How to plan a ${name} binder`}</h2>
        <p>
          {de
            ? `Alle ${n(stats.cardCount)} Karten würden bei neun Taschen pro Seite etwa ${n(pages)} Seiten füllen. Für ein Geschenk ist das zu viel: Eine einzige Seite mit neun verschiedenen Motiven wirkt sofort fertig, und die Sammlung lässt sich später erweitern.`
            : `At nine pockets per page, all ${n(stats.cardCount)} cards would fill about ${n(pages)} pages. For a gift that is far too much: a single page of nine different designs looks finished at once, and the collection can be extended later.`}
        </p>
        <p>{entry.collectingNote[language]}</p>
        <p>
          {de ? "Welche Binder-Größe passt, steht im " : "Which binder size fits is covered in the "}
          <Link href={guidePath(language, guideById("binder-size")!)}>{guideById("binder-size")![language].title}</Link>.
        </p>
      </section>

      <section id="examples" className={styles.section}>
        <h2>{de ? `Beispielkarten mit ${name}` : `Example cards featuring ${name}`}</h2>
        <p>{de ? "Eine Auswahl über die Jahre, höchstens eine Karte pro Set:" : "A selection across the years, at most one card per set:"}</p>
        <ul>
          {stats.examples.map((card) => <li key={card.id}>{card.name} · {card.setName} · Nr. {card.number} · {card.year}</li>)}
        </ul>
      </section>

      <section id="weiterlesen" className={styles.section}>
        <h2>{de ? "Weiterlesen" : "Keep reading"}</h2>
        {relatedSpecies.length > 0 ? (
          <ul className={styles.cards}>
            {relatedSpecies.map((other) => (
              <li key={other.entry.slug}>
                <Link href={speciesPath(language, other.entry)}>
                  <strong>{other.entry.names[language]}</strong>
                  <span>{n(other.stats.cardCount)} {copy.cardsLabel}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
        <p><Link href={guidePath(language, guideById("gift")!)}>{guideById("gift")![language].title}</Link></p>
      </section>

      </ArticleLayout>

      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "Article",
        headline: de ? `${name}-Binder: Karten sammeln und verschenken` : `${name} binder: collecting and gifting the cards`,
        inLanguage: language,
        dateModified: stats.dataDate,
        mainEntityOfPage: absoluteUrl(speciesPath(language, entry)),
        author: { "@type": "Organization", name: SITE_NAME, url: absoluteUrl("/") },
        publisher: { "@type": "Organization", name: SITE_NAME, url: absoluteUrl("/") },
      }} />
    </>
  );
}

export function SpeciesIndex({ all, language }: { all: readonly PublishedSpecies[]; language: PageLanguage }) {
  const copy = LANDING[language];
  const de = language === "de";
  return (
    <>
      <header className={styles.header}>
        <p className={styles.eyebrow}>{de ? "Pokémon-Binder" : "Pokémon binders"}</p>
        <h1>{de ? "Binder nach Lieblings-Pokémon gestalten" : "Design a binder around your favourite Pokémon"}</h1>
        <p className={styles.lead}>{copy.speciesText}</p>
      </header>
      <section className={styles.section}>
        <ul className={styles.cards}>
          {all.map(({ entry, stats }) => (
            <li key={entry.slug}>
              <Link href={speciesPath(language, entry)}>
                <strong>{entry.names[language]}</strong>
                <span>{formatNumber(language, stats.cardCount)} {copy.cardsLabel}, {stats.firstYear}–{stats.lastYear}</span>
              </Link>
            </li>
          ))}
        </ul>
        <p>
          {de
            ? "Wir veröffentlichen nur Seiten zu Pokémon, für die der Katalog genügend Karten enthält, damit sich eine eigene Seite lohnt. Jede Seite beruht auf denselben Katalogdaten, die auch das Binder-Werkzeug nutzt."
            : "We only publish pages for Pokémon where the catalogue holds enough cards to make a page of its own worthwhile. Every page rests on the same catalogue data the binder tool uses."}
        </p>
      </section>
    </>
  );
}

/** The explanation below the hero on the German and English landing pages. */
export function LandingSections({ language, species }: { language: PageLanguage; species: readonly PublishedSpecies[] }) {
  const copy = LANDING[language];
  return (
    <>
      <div className={styles.landingGrid}>
      <section className={styles.section}>
        <h2>{copy.whatHeading}</h2>
        {copy.whatText.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </section>
      <section className={styles.section}>
        <h2>{copy.stepsHeading}</h2>
        <ol>{copy.steps.map((step) => <li key={step.title}><strong>{step.title}.</strong> {step.text}</li>)}</ol>
      </section>
      <section className={styles.section}>
        <h2>{copy.knowHeading}</h2>
        <ul>{copy.know.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>
      <section className={styles.section}>
        <h2>{copy.guidesHeading}</h2>
        <p>{copy.guidesText}</p>
        <ul>
          {GUIDES.map((guide) => <li key={guide.id}><Link href={guidePath(language, guide)}>{guide[language].title}</Link></li>)}
          {language === "de" ? <li><Link href="/anleitung/cardmarket/">{copy.buyingGuideLabel}</Link></li> : null}
        </ul>
        <p><Link href={guideIndexPath(language)}>{language === "de" ? "Alle Ratgeber" : "All guides"}</Link></p>
      </section>
      <section className={`${styles.section} ${styles.spanAll}`}>
        <h2>{copy.speciesHeading}</h2>
        <p>{copy.speciesText}</p>
        <ul className={styles.cards}>
          {species.map(({ entry, stats }) => (
            <li key={entry.slug}>
              <Link href={speciesPath(language, entry)}>
                <strong>{entry.names[language]}</strong>
                <span>{formatNumber(language, stats.cardCount)} {copy.cardsLabel}</span>
              </Link>
            </li>
          ))}
        </ul>
        <p><Link href={speciesIndexPath(language)}>{language === "de" ? "Alle Pokémon-Binder-Seiten" : "All Pokémon binder pages"}</Link></p>
      </section>
      <section className={`${styles.section} ${styles.faq} ${styles.spanAll}`}>
        <h2>{copy.faqHeading}</h2>
        <dl>
          {copy.faq.map((item) => (<div key={item.q}><dt>{item.q}</dt><dd>{item.a}</dd></div>))}
        </dl>
        <ToolCta language={language} label={copy.cta} />
      </section>
      </div>
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: SITE_NAME,
        url: absoluteUrl(homePath(language)),
        description: copy.metaDescription,
        inLanguage: language,
        applicationCategory: "LifestyleApplication",
        operatingSystem: "Any (web browser)",
        offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
      }} />
    </>
  );
}
