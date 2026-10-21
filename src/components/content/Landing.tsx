import Link from "next/link";

import { SITE_NAME, type PageLanguage } from "@/config/site";
import { LANDING } from "@/content/landing";
import { publishedSpecies } from "@/content/pokemon-stats";
import { TOOL_START_PATH, appPath } from "@/content/routes";

import { LandingSections } from "./Articles";
import { ContentFrame } from "./ContentFrame";
import styles from "./content.module.css";
import { ToolLink } from "./ToolLink";

const HERO = {
  de: {
    headline: "Ein Binder voller Karten vom Lieblings-Pokémon",
    reassurance: "Ohne Konto starten · Karten später austauschen · lokal gespeichert",
    collector: "Ich sammle selbst",
    preview: "So könnte deine erste Seite aussehen",
  },
  en: {
    headline: "A binder full of cards from a favourite Pokémon",
    reassurance: "Start without an account · swap cards later · stored locally",
    collector: "I collect cards myself",
    preview: "What your first page could look like",
  },
} as const;

/**
 * Example page for the hero: the same nine Pikachu cards the app's start screen shows. TCGdex serves the
 * artwork at runtime; Your Card Binder does not store or copy the image bytes. Purely decorative, so no alt text. The small
 * image size (about 20 KB each) is enough for a pocket this size.
 */
const EXAMPLE_CARDS = [
  "https://assets.tcgdex.net/en/base/base1/58/low.webp",
  "https://assets.tcgdex.net/en/base/base2/60/low.webp",
  "https://assets.tcgdex.net/en/base/basep/1/low.webp",
  "https://assets.tcgdex.net/en/bw/bw1/115/low.webp",
  "https://assets.tcgdex.net/en/bw/bw11/RC7/low.webp",
  "https://assets.tcgdex.net/en/bw/bw4/39/low.webp",
  "https://assets.tcgdex.net/en/dp/dp5/70/low.webp",
  "https://assets.tcgdex.net/en/ecard/ecard3/84/low.webp",
  "https://assets.tcgdex.net/en/swsh/cel25/5/low.webp",
] as const;

function BinderPage({ label }: { label: string }) {
  return (
    <figure className={styles.binder} aria-hidden="true">
      <div className={styles.binderPage}>
        {EXAMPLE_CARDS.map((src) => (
          <span key={src} className={styles.pocket}>
            {/* eslint-disable-next-line @next/next/no-img-element -- static export without the image optimiser */}
            <img src={src} alt="" width={63} height={88} loading="eager" decoding="async" />
          </span>
        ))}
      </div>
      <figcaption>{label}</figcaption>
    </figure>
  );
}

/** The public start page, in either language: a promise, one clear button, and the explanation search engines and newcomers need. */
export function LandingPage({ language, alternatePath }: { language: PageLanguage; alternatePath: string }) {
  const copy = LANDING[language];
  const hero = HERO[language];
  return (
    <ContentFrame language={language} alternatePath={alternatePath}>
      <header className={styles.hero}>
        <div className={styles.heroText}>
          <p className={styles.eyebrow}>{SITE_NAME}</p>
          <h1>{hero.headline}</h1>
          <p className={styles.lead}>{copy.metaDescription}</p>
          <div className={styles.heroActions}>
            <ToolLink href={TOOL_START_PATH} language={language} className={styles.cta}>{copy.cta}</ToolLink>
            <Link className={styles.secondary} href={appPath()}>{hero.collector}</Link>
          </div>
          <p className={styles.meta}>{hero.reassurance}</p>
        </div>
        <BinderPage label={hero.preview} />
      </header>
      <LandingSections language={language} species={publishedSpecies()} />
    </ContentFrame>
  );
}
