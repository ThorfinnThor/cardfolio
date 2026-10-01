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
  onReviewSelection?: (items: CatalogSearchItem[]) => void;
  selectionLimit?: number;
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

export function SemanticCardSearch({ onPreview, onFallbackToCatalog, onReviewSelection, selectionLimit = 9 }: SemanticCardSearchProps) {
  const [query, setQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<SemanticTag[]>([]);
  const [selectedItems, setSelectedItems] = useState<Map<string, CatalogSearchItem>>(new Map());
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

  function toggleItem(item: CatalogSearchItem) {
    const key = `${item.ref.language}:${item.ref.id}`;
    setSelectedItems((current) => {
      const next = new Map(current);
      if (next.has(key)) {
        next.delete(key);
        return next;
      }
      if (next.size >= selectionLimit) return current;
      next.set(key, item);
      return next;
    });
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
      {selectedItems.size ? (
        <div className={styles.semanticSelectionSummary} aria-live="polite">
          <div>
            <strong>{selectedItems.size} von {selectionLimit} Karten ausgewählt</strong>
            <span>Die Auswahl wird erst nach der Variantenprüfung gespeichert.</span>
          </div>
          <div className={styles.semanticSelectionActions}>
            <button type="button" className={styles.clearSemanticTags} onClick={() => setSelectedItems(new Map())}>Auswahl leeren</button>
            <button type="button" className={styles.primaryButton} onClick={() => onReviewSelection?.([...selectedItems.values()])} disabled={!onReviewSelection}>
              Als Binderseite übernehmen
            </button>
          </div>
        </div>
      ) : null}
      <ul className={`${styles.results} ${styles.semanticResults}`}>
        {outcome?.results.map((result) => {
          const item = semanticResultToCatalogItem(result);
          const itemKey = `${item.ref.language}:${item.ref.id}`;
          const selected = selectedItems.has(itemKey);
          const atLimit = selectedItems.size >= selectionLimit && !selected;
          return (
            <li key={item.ref.id}>
              <SemanticResultArtwork result={result} />
              <span>
                <strong>{item.name}</strong>
                <small>EN · {item.setName} · Nr. {formatCollectorNumber(item.collectorNumber, item.collectorTotal)}</small>
                <span className={styles.semanticCaption}>{result.row[2]}</span>
                <span className={styles.semanticResultTags}>Automatisch: {result.tags.map((tag) => SEMANTIC_TAG_LABELS[tag]).join(" · ")}</span>
              </span>
              <div className={styles.semanticResultActions}>
                <button type="button" onClick={() => onPreview(item)}>Prüfen</button>
                <button
                  type="button"
                  aria-pressed={selected}
                  disabled={atLimit}
                  className={selected ? styles.semanticSelectedButton : undefined}
                  onClick={() => toggleItem(item)}
                >
                  {selected ? "Ausgewählt" : "Auswählen"}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
