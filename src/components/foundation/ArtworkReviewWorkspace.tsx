"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { verifiedImageFallback } from "@/data/catalog/image-fallbacks";
import { inferredCardImageBaseUrl } from "@/data/catalog/images";
import { loadArtworkReviewIndex, loadSemanticSearchIndex } from "@/data/catalog/semantic-search";
import { setMetadataForSearchItem } from "@/data/catalog/set-counts";
import {
  ARTWORK_REVIEW_VERDICTS,
  artworkReviewKey,
  type ArtworkReviewRecord,
  type ArtworkReviewVerdict,
} from "@/domain/artwork-review";
import { GIFT_THEME_PRESETS } from "@/domain/gift-theme-presets";
import { searchSemanticCards, type SemanticCardRow, type SemanticSearchIndex, type SemanticSearchResult, type SemanticTag } from "@/domain/semantic-card-search";

import { CardArtwork } from "./CardArtwork";
import styles from "./artwork-review.module.css";

const STORAGE_KEY = "cardfolio-artwork-review-v1";
const PER_THEME = 20;
const RESERVES_PER_THEME = 20;
const DOMINANT_TARGET = 9;
const RECENT_SERIES = new Set(["me", "sv"]);

export interface QueueItem {
  row: SemanticCardRow;
  tag: SemanticTag;
  themeId: string;
  themeLabel: string;
}

function isLikelyFullArt(row: SemanticCardRow): boolean {
  if (!/^\d+$/.test(row[4])) return false;
  const set = setMetadataForSearchItem("en", row[0], row[4]);
  return Boolean(set && set.cardCount.official > 0 && Number(row[4]) > set.cardCount.official);
}

function newestFirst(left: SemanticSearchResult, right: SemanticSearchResult): number {
  const seriesRank = (seriesId: string) => seriesId === "me" ? 3 : seriesId === "sv" ? 2 : seriesId === "swsh" ? 1 : 0;
  return seriesRank(right.row[7]) - seriesRank(left.row[7])
    || right.row[5].localeCompare(left.row[5], "en", { numeric: true })
    || Number(right.row[4]) - Number(left.row[4])
    || right.score - left.score
    || left.row[0].localeCompare(right.row[0]);
}

function spreadAcrossSets(results: readonly SemanticSearchResult[]): SemanticSearchResult[] {
  const groups = new Map<string, SemanticSearchResult[]>();
  for (const result of [...results].sort(newestFirst)) {
    const group = groups.get(result.row[5]) ?? [];
    group.push(result);
    groups.set(result.row[5], group);
  }
  const orderedGroups = [...groups.values()].sort((left, right) => newestFirst(left[0], right[0]));
  const spread: SemanticSearchResult[] = [];
  for (let round = 0; spread.length < results.length; round += 1) {
    let added = false;
    for (const group of orderedGroups) {
      const candidate = group[round];
      if (!candidate) continue;
      spread.push(candidate);
      added = true;
    }
    if (!added) break;
  }
  return spread;
}

export function sampleTheme(index: SemanticSearchIndex, theme: (typeof GIFT_THEME_PRESETS)[number]): QueueItem[] {
  const results = searchSemanticCards(index, theme.query, { limit: index.cards.length }).results;
  const selected: SemanticSearchResult[] = [];
  const selectedIds = new Set<string>();
  const take = (candidates: readonly SemanticSearchResult[], maximum: number) => {
    let added = 0;
    for (const candidate of spreadAcrossSets(candidates)) {
      if (added >= maximum) break;
      if (selectedIds.has(candidate.row[0])) continue;
      selected.push(candidate);
      selectedIds.add(candidate.row[0]);
      added += 1;
    }
  };
  const recentFullArts = results.filter((result) => RECENT_SERIES.has(result.row[7]) && isLikelyFullArt(result.row));
  const recentRegular = results.filter((result) => RECENT_SERIES.has(result.row[7]) && !isLikelyFullArt(result.row));
  const swordShieldFullArts = results.filter((result) => result.row[7] === "swsh" && isLikelyFullArt(result.row));
  const earlierCards = results.filter((result) => !RECENT_SERIES.has(result.row[7]) && result.row[7] !== "swsh");
  take(recentFullArts, 12);
  take(recentRegular, 4);
  take(swordShieldFullArts, 2);
  take(earlierCards, 2);
  take(results, PER_THEME + RESERVES_PER_THEME - selected.length);
  return selected.slice(0, PER_THEME + RESERVES_PER_THEME).map((result) => ({
    row: result.row,
    tag: theme.mappedTags.find((tag) => result.tags.includes(tag)) ?? theme.mappedTags[0],
    themeId: theme.id,
    themeLabel: theme.label,
  }));
}

function reviewMap(records: readonly ArtworkReviewRecord[]): Map<string, ArtworkReviewRecord> {
  return new Map(records.map((review) => [artworkReviewKey(review.cardId, review.tag), review]));
}

export function reviewThemeQueueLimit(
  themeId: string,
  candidatePool: readonly QueueItem[],
  reviews: ReadonlyMap<string, ArtworkReviewRecord>,
): number {
  const theme = GIFT_THEME_PRESETS.find((candidate) => candidate.id === themeId);
  const themeItems = candidatePool.filter((item) => item.themeId === themeId);
  const initial = themeItems.slice(0, PER_THEME);
  const reviewed = initial.filter((item) => reviews.has(artworkReviewKey(item.row[0], item.tag))).length;
  const dominant = theme
    ? [...reviews.values()].filter((review) => theme.mappedTags.includes(review.tag) && review.verdict === "dominant").length
    : 0;
  return reviewed >= PER_THEME && dominant < DOMINANT_TARGET ? PER_THEME + RESERVES_PER_THEME : PER_THEME;
}

function verdictLabel(verdict: ArtworkReviewVerdict): string {
  if (verdict === "dominant") return "Dominant";
  if (verdict === "secondary") return "Nur Nebenmotiv";
  if (verdict === "incorrect") return "Falsch";
  return "Unsicher";
}

export function ArtworkReviewWorkspace({ enabled }: { enabled: boolean }) {
  const [index, setIndex] = useState<SemanticSearchIndex>();
  const [reviews, setReviews] = useState<Map<string, ArtworkReviewRecord>>(new Map());
  const [position, setPosition] = useState(0);
  const [themeFilter, setThemeFilter] = useState("all");
  const [error, setError] = useState<string>();
  const [unavailableImageIds, setUnavailableImageIds] = useState<Set<string>>(new Set());
  const [loadedImageId, setLoadedImageId] = useState<string>();

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    void Promise.all([loadSemanticSearchIndex(controller.signal), loadArtworkReviewIndex(controller.signal)])
      .then(([semanticIndex, shippedReviews]) => {
        if (controller.signal.aborted) return;
        const stored = window.localStorage.getItem(STORAGE_KEY);
        const localReviews = stored ? JSON.parse(stored) as ArtworkReviewRecord[] : [];
        setIndex(semanticIndex);
        setReviews(reviewMap([...shippedReviews.reviews, ...localReviews]));
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Prüfdaten konnten nicht geladen werden.");
      });
    return () => controller.abort();
  }, [enabled]);

  const candidatePool = useMemo(() => index ? GIFT_THEME_PRESETS.flatMap((theme) => sampleTheme(index, theme)) : [], [index]);
  const themeLimits = useMemo(() => new Map(GIFT_THEME_PRESETS.map((theme) => [
    theme.id,
    reviewThemeQueueLimit(theme.id, candidatePool, reviews),
  ])), [candidatePool, reviews]);
  const fullQueue = useMemo(() => GIFT_THEME_PRESETS.flatMap((theme) => candidatePool
    .filter((item) => item.themeId === theme.id && !unavailableImageIds.has(item.row[0]))
    .slice(0, themeLimits.get(theme.id) ?? PER_THEME)), [candidatePool, themeLimits, unavailableImageIds]);
  const totalReviewCount = [...themeLimits.values()].reduce((total, limit) => total + limit, 0);
  const queue = useMemo(() => themeFilter === "all" ? fullQueue : fullQueue.filter((item) => item.themeId === themeFilter), [fullQueue, themeFilter]);
  const safePosition = Math.min(position, Math.max(0, queue.length - 1));
  const current = queue[safePosition];
  const completed = queue.filter((item) => reviews.has(artworkReviewKey(item.row[0], item.tag))).length;
  const currentId = current?.row[0];
  const imageReady = Boolean(currentId && loadedImageId === currentId);

  const handleImageUnavailable = useCallback(() => {
    if (!currentId) return;
    setUnavailableImageIds((existing) => existing.has(currentId) ? existing : new Set(existing).add(currentId));
  }, [currentId]);

  const decide = useCallback((verdict: ArtworkReviewVerdict) => {
    if (!current || !imageReady) return;
    const record: ArtworkReviewRecord = {
      cardId: current.row[0],
      tag: current.tag,
      verdict,
      reviewedAt: new Date().toISOString(),
      source: "human",
    };
    setReviews((existing) => {
      const next = new Map(existing).set(artworkReviewKey(record.cardId, record.tag), record);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...next.values()]));
      return next;
    });
    setPosition((value) => value + 1);
  }, [current, imageReady]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement || event.target instanceof HTMLTextAreaElement) return;
      const verdict = ARTWORK_REVIEW_VERDICTS[Number(event.key) - 1];
      if (verdict) {
        event.preventDefault();
        decide(verdict);
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setPosition((value) => Math.max(0, value - 1));
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        setPosition((value) => Math.min(value + 1, Math.max(0, queue.length - 1)));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [decide, queue.length]);

  function exportReviews() {
    const payload = {
      version: 1,
      generatedAt: new Date().toISOString(),
      reviews: [...reviews.values()].sort((left, right) => left.cardId.localeCompare(right.cardId) || left.tag.localeCompare(right.tag)),
    };
    const url = URL.createObjectURL(new Blob([`${JSON.stringify(payload, null, 2)}\n`], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "cardfolio-artwork-reviews.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function resetLocalReviews() {
    if (!window.confirm("Alle lokalen Prüfentscheidungen verwerfen und auf den eingecheckten Stand zurücksetzen?")) return;
    window.localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  }

  if (!enabled) return <main className={styles.shell}><h1>Artwork-Prüfung</h1><p>Diese lokale Qualitätsoberfläche ist in Produktions-Builds deaktiviert.</p><Link href="/">Zurück zu Cardfolio</Link></main>;
  if (error) return <main className={styles.shell}><h1>Artwork-Prüfung</h1><p role="alert">{error}</p><Link href="/">Zurück zu Cardfolio</Link></main>;
  if (!current) return <main className={styles.shell}><h1>Artwork-Prüfung wird geladen…</h1></main>;

  const [id, , caption, name, collectorNumber, setId, setName, seriesId] = current.row;
  const card = {
    ref: { provider: "tcgdex" as const, id, language: "en" as const },
    name,
    setName,
    collectorNumber,
    imageBaseUrl: inferredCardImageBaseUrl("en", seriesId, setId, collectorNumber),
    imageFallbackBaseUrl: verifiedImageFallback("en", id),
  };
  const currentReview = reviews.get(artworkReviewKey(id, current.tag));
  const fullArtCandidate = isLikelyFullArt(current.row);

  return <main className={styles.shell}>
    <header className={styles.header}>
      <div><p className={styles.eyebrow}>LOKALES QUALITÄTSWERKZEUG</p><h1>Artwork-Motive prüfen</h1><p>Bewerte ausschließlich das eigentliche Artwork – nicht Kartenname, Typ, Angriffe oder Rahmen. Pro Thema priorisiert die Stichprobe mindestens zehn neuere Full-Art-Kandidaten.</p></div>
      <Link href="/">Cardfolio öffnen</Link>
    </header>
    <section className={styles.toolbar}>
      <label>Thema<select value={themeFilter} onChange={(event) => { setThemeFilter(event.target.value); setPosition(0); }}><option value="all">Alle 10 Themen · {totalReviewCount} Prüfungen</option>{GIFT_THEME_PRESETS.map((theme) => { const limit = themeLimits.get(theme.id) ?? PER_THEME; return <option key={theme.id} value={theme.id}>{theme.label} · {limit}{limit > PER_THEME ? " · Zusatzrunde" : ""}</option>; })}</select></label>
      <div><strong>{completed} / {queue.length}</strong><span>in dieser Auswahl bewertet{unavailableImageIds.size ? ` · ${unavailableImageIds.size} ohne Bild ersetzt` : ""}</span></div>
      <button type="button" onClick={resetLocalReviews}>Lokale Eingaben löschen</button>
      <button type="button" onClick={exportReviews}>JSON exportieren</button>
    </section>
    <div className={styles.progress} aria-label={`${completed} von ${queue.length} bewertet`}><span style={{ width: `${queue.length ? completed / queue.length * 100 : 0}%` }} /></div>
    {themeFilter !== "all" && (themeLimits.get(themeFilter) ?? PER_THEME) > PER_THEME ? <p className={styles.reviewNotice} role="status">Zusatzrunde aktiv: Dieses Motiv hat nach den ersten 20 Bewertungen noch weniger als neun dominante Treffer. Weitere Kandidaten werden eingeblendet.</p> : null}
    <section className={styles.reviewCard}>
      <CardArtwork card={card} className={styles.artwork} fallback={<span className={styles.fallback} role="status">Bild wird übersprungen…</span>} onAvailable={() => setLoadedImageId(id)} onUnavailable={handleImageUnavailable} />
      <div className={styles.details}>
        <p className={styles.eyebrow}>{current.themeLabel} · {safePosition + 1} / {queue.length}{fullArtCandidate ? " · NEUERE FULL-ART-KANDIDATIN" : ""}</p>
        <h2>{name}</h2><p>{setName} · Nr. {collectorNumber}</p>
        <blockquote>{caption}</blockquote>
        <p className={styles.question}>Ist „{current.themeLabel}“ das prägende Motiv des Artworks?</p>
        <div className={styles.verdicts}>{ARTWORK_REVIEW_VERDICTS.map((verdict, verdictIndex) => <button type="button" key={verdict} disabled={!imageReady} data-selected={currentReview?.verdict === verdict} data-verdict={verdict} onClick={() => decide(verdict)}><kbd>{verdictIndex + 1}</kbd>{verdictLabel(verdict)}</button>)}</div>
        <p className={styles.hint}><strong>Dominant:</strong> Das Thema bestimmt das Bild. <strong>Nebenmotiv:</strong> nur Hintergrund/Detail. <strong>Falsch:</strong> nicht vorhanden oder verwechselt.</p>
        <div className={styles.navigation}><button type="button" onClick={() => setPosition((value) => Math.max(0, value - 1))} disabled={safePosition === 0}>← Zurück</button><button type="button" onClick={() => setPosition((value) => Math.min(value + 1, queue.length - 1))} disabled={safePosition >= queue.length - 1}>Weiter →</button></div>
      </div>
    </section>
    <footer>Bereits gespeicherte Bewertungen bleiben auch bei einer Neuordnung der Stichprobe erhalten. Nach dem Export: <code>npm run semantic:reviews:import -- ~/Downloads/cardfolio-artwork-reviews.json</code> und danach <code>npm run semantic:index:build</code>.</footer>
  </main>;
}
