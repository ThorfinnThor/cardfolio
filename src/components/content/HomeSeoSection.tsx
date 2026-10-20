import { LandingSections } from "./Articles";
import { TrademarkNotice } from "./ContentFrame";
import styles from "./content.module.css";
import { publishedSpecies } from "@/content/pokemon-stats";

/**
 * Crawlable explanation placed below the app on the German home page. The app itself is an interactive
 * tool with little running text; this section tells search engines and first-time visitors what it is.
 */
export function HomeSeoSection() {
  return (
    <div lang="de" data-no-translate>
      <section className={styles.page} aria-label="Über Cardfolio">
        <LandingSections language="de" species={publishedSpecies()} />
        <TrademarkNotice language="de" />
      </section>
    </div>
  );
}
