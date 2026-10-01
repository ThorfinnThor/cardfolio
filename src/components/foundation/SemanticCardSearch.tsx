"use client";

import { useQuery } from "@tanstack/react-query";
import { Search, Sparkles } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";

import { cardImageUrl } from "@/data/catalog/images";
import { loadSemanticSearchIndex, semanticResultToCatalogItem } from "@/data/catalog/semantic-search";
import {
  SEMANTIC_TAG_LABELS,
  SEMANTIC_TAGS,
  searchSemanticCards,
  type SemanticSearchResult,
  type SemanticTag,
} from "@/domain/semantic-card-search";
import { formatCollectorNumber } from "@/domain/catalog-search";
import type { CatalogSearchItem } from "@/domain/types";

import styles from "./foundation-workspace.module.css";

interface SemanticCardSearchProps {
  onPreview: (item: CatalogSearchItem) => void;
  onFallbackToCatalog: (query: string) => void;
}

function SemanticResultArtwork({ result }: { result: SemanticSearchResult }) {
  const [failed, setFailed] = useState(false);
  const item = semanticResultToCatalogItem(result);
  if (failed || !item.imageBaseUrl) return <div className={styles.semanticThumbFallback} aria-hidden="true">Kein Bild</div>;
  return (
    // TCGdex artwork stays remote by product decision; Next image optimization would proxy and copy it.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={styles.semanticThumb}
      src={cardImageUrl(item.imageBaseUrl, "low", "webp")}
      alt=""
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

export function SemanticCardSearch({ onPreview, onFallbackToCatalog }: SemanticCardSearchProps) {
  const [query, setQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<SemanticTag[]>([]);
  const deferredQuery = useDeferredValue(query);
  const indexQuery = useQuery({
    queryKey: ["semantic-card-search", 1],
    queryFn: ({ signal }) => loadSemanticSearchIndex(signal),
    retry: false,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  });
  const outcome = useMemo(
    () => indexQuery.data ? searchSemanticCards(indexQuery.data, deferredQuery, { requiredTags: selectedTags, limit: 20 }) : undefined,
    [deferredQuery, indexQuery.data, selectedTags],
  );
  const hasInput = Boolean(query.trim() || selectedTags.length);

  function toggleTag(tag: SemanticTag) {
    setSelectedTags((current) => current.includes(tag) ? current.filter((candidate) => candidate !== tag) : [...current, tag]);
  }

  return (
    <div className={styles.semanticSearch}>
      <p className={styles.semanticDisclosure}>
        <Sparkles size={16} aria-hidden="true" />
        <span><strong>Motivmerkmale automatisch erkannt.</strong> Die Zuordnung kann im Einzelfall falsch sein. Durchsucht werden englische physische Karten.</span>
      </p>
      <label className={styles.searchLabel} htmlFor="semantic-card-search">
        <Search aria-hidden="true" size={18} />
        <input
          id="semantic-card-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Motiv beschreiben, z. B. Pokémon am Strand"
          autoFocus
        />
      </label>
      <details className={styles.semanticTagPicker}>
        <summary>
          Schlagwörter kombinieren
          <span>{selectedTags.length ? `${selectedTags.length} gewählt` : "optional"}</span>
        </summary>
        <fieldset>
          <legend className={styles.srOnly}>Schlagwörter kombinieren</legend>
          <div>
            {SEMANTIC_TAGS.map((tag) => (
              <button key={tag} type="button" aria-pressed={selectedTags.includes(tag)} onClick={() => toggleTag(tag)}>
                {SEMANTIC_TAG_LABELS[tag]}
              </button>
            ))}
          </div>
        </fieldset>
      </details>
      {selectedTags.length ? (
        <button type="button" className={styles.clearSemanticTags} onClick={() => setSelectedTags([])}>Schlagwörter zurücksetzen</button>
      ) : null}

      {indexQuery.isPending ? <p className={styles.searchHint} role="status">Motivindex wird geladen…</p> : null}
      {indexQuery.error ? (
        <div className={styles.semanticError} role="alert">
          <p className={styles.error}>
            {indexQuery.error.name === "TimeoutError"
              ? "Der Motivindex braucht zu lange. Deine normale Suche bleibt verfügbar."
              : `Motivindex konnte nicht geladen werden: ${indexQuery.error.message}`}
          </p>
          <button type="button" className={styles.secondaryButton} onClick={() => onFallbackToCatalog(query.trim())}>
            Mit Name/Nummer suchen
          </button>
        </div>
      ) : null}
      {!hasInput && !indexQuery.isPending && !indexQuery.error ? <p className={styles.searchHint}>Beschreibe das Artwork oder wähle mindestens ein Schlagwort.</p> : null}
      {hasInput && outcome ? (
        <p className={styles.semanticResultCount} aria-live="polite">
          {outcome.total ? `${outcome.total.toLocaleString("de-DE")} passende Karten${outcome.total > outcome.results.length ? ` · beste ${outcome.results.length} angezeigt` : ""}` : "Keine passenden Karten"}
        </p>
      ) : null}
      {hasInput && outcome && !outcome.results.length ? (
        <div className={styles.semanticNoResults} role="status">
          <p className={styles.noResults}>Keine Karte erfüllt alle gewählten Motive. Entferne ein Schlagwort oder formuliere die Beschreibung allgemeiner.</p>
          <button type="button" className={styles.secondaryButton} onClick={() => onFallbackToCatalog(query.trim())}>
            Mit Name/Nummer suchen
          </button>
        </div>
      ) : null}
      <ul className={`${styles.results} ${styles.semanticResults}`}>
        {outcome?.results.map((result) => {
          const item = semanticResultToCatalogItem(result);
          return (
            <li key={item.ref.id}>
              <SemanticResultArtwork result={result} />
              <span>
                <strong>{item.name}</strong>
                <small>EN · {item.setName} · Nr. {formatCollectorNumber(item.collectorNumber, item.collectorTotal)}</small>
                <span className={styles.semanticCaption}>{result.row[2]}</span>
                <span className={styles.semanticResultTags}>Automatisch: {result.tags.map((tag) => SEMANTIC_TAG_LABELS[tag]).join(" · ")}</span>
              </span>
              <button type="button" onClick={() => onPreview(item)}>Prüfen</button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
