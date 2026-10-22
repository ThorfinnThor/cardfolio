"use client";

import { Check, Copy, LoaderCircle, RefreshCw, Share2 } from "lucide-react";
import { useMemo, useState } from "react";

import { TCGdexCatalogAdapter } from "@/data/catalog/tcgdex";
import { GiftCandidateLoader } from "@/data/gift/gift-candidate-loader";
import { giftCandidateHasArtwork, type GiftCardCandidate, type PriceProvider } from "@/domain/gift-builder";
import { giftShareUrl, type GiftShare } from "@/domain/gift-share";
import { matchesGiftSubject, separateRepeatedCards } from "@/domain/gift-subject";

import { CardArtwork } from "./CardArtwork";
import { POPULAR_POKEMON } from "./gift-copy";
import { defaultVariant } from "./GiftBuilderPanel";
import styles from "./kids-wishlist.module.css";

type KidsLoader = Pick<GiftCandidateLoader, "loadCandidatePool" | "hydrateCandidates">;

const PAGE_SIZE = 9;

/** Children see no prices: the wishlist is a link for the parents, who see the estimates when they open it. */
const noPrices: PriceProvider = {
  async getPrice(request) {
    return { currency: request.currency, fetchedAt: request.fetchedAt, confidence: "unknown", issues: ["kids-no-prices"] };
  },
};

async function loadCards(loader: KidsLoader, pokemon: string): Promise<{ shown: GiftCardCandidate[]; spare: GiftCardCandidate[]; language: "de" | "en" }> {
  for (const language of ["de", "en"] as const) {
    const pool = await loader.loadCandidatePool({ subjectQuery: pokemon, language, maximum: 40, pageSize: 24, scan: 480 });
    const hydrated = await loader.hydrateCandidates(pool, {
      currency: "EUR",
      variantFor: defaultVariant,
      concurrency: 4,
      preferences: { minimumCondition: "excellent" },
    });
    const usable = hydrated.filter((candidate) => candidate.card.ref.provider === "tcgdex" && giftCandidateHasArtwork(candidate) && matchesGiftSubject(candidate.card, pokemon));
    const { distinct, ordered } = separateRepeatedCards(usable);
    const list = distinct.length >= PAGE_SIZE ? distinct : ordered;
    if (list.length >= PAGE_SIZE || language === "en") return { shown: list.slice(0, PAGE_SIZE), spare: list.slice(PAGE_SIZE), language };
  }
  return { shown: [], spare: [], language: "de" };
}

export function KidsWishlist({ loader }: { loader?: KidsLoader }) {
  const defaultLoader = useMemo(() => new GiftCandidateLoader(new TCGdexCatalogAdapter(), noPrices), []);
  const activeLoader = loader ?? defaultLoader;
  const [step, setStep] = useState<"pick" | "cards" | "done">("pick");
  const [pokemon, setPokemon] = useState("");
  const [typed, setTyped] = useState("");
  const [language, setLanguage] = useState<"de" | "en">("de");
  const [shown, setShown] = useState<GiftCardCandidate[]>([]);
  const [spare, setSpare] = useState<GiftCardCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [link, setLink] = useState<{ url: string; copied: boolean }>();

  async function choose(name: string) {
    const wanted = name.trim();
    if (wanted.length < 2) return;
    setLoading(true);
    setError(undefined);
    try {
      const result = await loadCards(activeLoader, wanted);
      if (!result.shown.length) {
        setError("Zu diesem Namen habe ich keine Karten gefunden. Probier es mit einem anderen Pokémon oder prüfe die Schreibweise.");
        return;
      }
      setPokemon(wanted);
      setShown(result.shown);
      setSpare(result.spare);
      setLanguage(result.language);
      setStep("cards");
    } catch {
      setError("Die Karten konnten nicht geladen werden. Prüfe das Internet und versuch es noch einmal.");
    } finally {
      setLoading(false);
    }
  }

  function swap(index: number) {
    const next = spare[0];
    if (!next) return;
    setShown((current) => current.map((candidate, position) => position === index ? next : candidate));
    setSpare((current) => [...current.slice(1), shown[index]!]);
  }

  async function finish() {
    const share: GiftShare = {
      subject: pokemon,
      targetCardCount: 9,
      preferredLanguage: language,
      currency: "EUR",
      cards: shown.map((candidate) => ({ id: candidate.card.ref.id, language: candidate.card.ref.language, variant: { finish: candidate.variant.finish, edition: candidate.variant.edition, printing: candidate.variant.printing } })),
    };
    const url = giftShareUrl(window.location.origin, "/geschenk/", share);
    let copied = false;
    try {
      await navigator.clipboard.writeText(url);
      copied = true;
    } catch {
      // The link is still shown for copying by hand.
    }
    setLink({ url, copied });
    setStep("done");
  }

  async function copyAgain() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link.url);
      setLink({ ...link, copied: true });
    } catch {
      // Nothing more to do; the field stays selectable.
    }
  }

  async function sendLink() {
    if (!link || typeof navigator.share !== "function") return;
    try {
      await navigator.share({ title: "Mein Pokémon-Wunschzettel", text: "Das sind meine Wunschkarten:", url: link.url });
    } catch {
      // The dialog was closed; nothing to report.
    }
  }

  return (
    <section className={styles.kids} aria-labelledby="kids-heading">
      {step === "pick" ? <>
        <h1 id="kids-heading">Dein Pokémon-Wunschzettel</h1>
        <p className={styles.lead}>Such dir ein Pokémon aus. Du bekommst neun Karten und darfst jede tauschen. Danach bekommst du einen Link für Mama oder Papa.</p>
        <ul className={styles.pokemonGrid} aria-label="Pokémon auswählen">
          {POPULAR_POKEMON.map((entry) => <li key={entry.en}><button type="button" onClick={() => void choose(entry.de)} disabled={loading}>{entry.de}</button></li>)}
        </ul>
        <form className={styles.typed} onSubmit={(event) => { event.preventDefault(); void choose(typed); }}>
          <label htmlFor="kids-pokemon">Oder schreib den Namen deines Pokémon</label>
          <div><input id="kids-pokemon" value={typed} onChange={(event) => setTyped(event.target.value)} maxLength={40} placeholder="zum Beispiel Lucario" /><button type="submit" disabled={loading || typed.trim().length < 2}>Los</button></div>
        </form>
        {loading ? <p className={styles.status} role="status"><LoaderCircle className={styles.spin} aria-hidden="true" size={18} /> Ich suche Karten…</p> : null}
        {error ? <p className={styles.error} role="alert">{error}</p> : null}
        <p className={styles.note}>Hier wird nichts gekauft und nichts gespeichert. Der Link enthält nur die Karten.</p>
      </> : null}

      {step === "cards" ? <>
        <h1 id="kids-heading">Deine neun Karten: {pokemon}</h1>
        <p className={styles.lead}>Gefällt dir eine Karte nicht? Tipp auf „Tauschen“. Wenn alle passen, drück unten auf den großen Knopf.</p>
        <ul className={styles.cardGrid} aria-label="Deine Karten">
          {shown.map((candidate, index) => (
            <li key={candidate.card.key}>
              <CardArtwork card={candidate.card} className={styles.cardImage} fallback={<div className={styles.cardFallback}>{candidate.card.name}</div>} />
              <span className={styles.cardName}>{candidate.card.name}</span>
              <button type="button" onClick={() => swap(index)} disabled={spare.length === 0} aria-label={`${candidate.card.name} tauschen`}><RefreshCw aria-hidden="true" size={15} /> Tauschen</button>
            </li>
          ))}
        </ul>
        {shown.length < PAGE_SIZE ? <p className={styles.note}>Für dieses Pokémon gibt es nur {shown.length} Karten. Das ist völlig okay.</p> : null}
        <div className={styles.actions}>
          <button type="button" className={styles.secondary} onClick={() => setStep("pick")}>Anderes Pokémon</button>
          <button type="button" className={styles.primary} onClick={() => void finish()}><Check aria-hidden="true" size={20} /> Das ist mein Wunschzettel</button>
        </div>
      </> : null}

      {step === "done" && link ? <>
        <h1 id="kids-heading">Fertig! Zeig das Mama oder Papa.</h1>
        <p className={styles.lead}>{link.copied ? "Der Link ist kopiert. " : ""}Schick ihnen den Link oder zeig ihnen diese Seite. Wenn sie ihn öffnen, sehen sie deine Karten und können sie besorgen.</p>
        <label className={styles.linkLabel} htmlFor="kids-link">Link zu deinem Wunschzettel</label>
        <input id="kids-link" className={styles.linkField} readOnly value={link.url} onFocus={(event) => event.currentTarget.select()} />
        <div className={styles.actions}>
          <button type="button" className={styles.secondary} onClick={() => setStep("cards")}>Noch etwas ändern</button>
          <button type="button" className={styles.secondary} onClick={() => void copyAgain()}><Copy aria-hidden="true" size={18} /> Link kopieren</button>
          {typeof navigator !== "undefined" && typeof navigator.share === "function" ? <button type="button" className={styles.primary} onClick={() => void sendLink()}><Share2 aria-hidden="true" size={18} /> Teilen</button> : null}
        </div>
        <p className={styles.note}>Dein Wunschzettel kauft nichts. Erst Mama oder Papa entscheiden, ob und was bestellt wird.</p>
      </> : null}
    </section>
  );
}
