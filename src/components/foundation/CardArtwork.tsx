"use client";

/* eslint-disable @next/next/no-img-element -- The catalog supplies dynamic external artwork URLs with a runtime fallback chain. */

import { useEffect, useMemo, useState, type ReactNode } from "react";

import { FEATURES } from "@/config/feature-flags";
import { imageLanguage } from "@/data/catalog/image-fallbacks";
import { cardImageUrl, inferredCardImageBaseUrl } from "@/data/catalog/images";
import { catalogSetIndex } from "@/data/catalog/set-counts";
import { cardtraderCatalog, cardtraderImageUrl } from "@/data/cardtrader/catalog";
import type { CardSnapshot } from "@/domain/types";

const IMAGE_LANGUAGE_LABELS: Record<string, string> = {
  de: "Bild auf Deutsch",
  en: "Bild auf Englisch",
  es: "Bild auf Spanisch",
  fr: "Bild auf Französisch",
  it: "Bild auf Italienisch",
  pt: "Bild auf Portugiesisch",
};

let seriesBySet: Map<string, string> | undefined;

/**
 * TCGdex has no German picture for about a quarter of the German cards. The English print of the same card (same set,
 * same number) almost always has one, so it comes next, labelled "Bild auf Englisch" like any picture in another language.
 */
function englishPictureOfSameCard(card: Pick<CardSnapshot, "ref" | "collectorNumber"> & { setId?: string }): string | undefined {
  if (card.ref.language !== "de" || !card.setId) return undefined;
  // The catalogue id is "<set>-<local number>"; the collector number shown on the card can be padded differently.
  const localId = card.ref.id.startsWith(`${card.setId}-`) ? card.ref.id.slice(card.setId.length + 1) : card.collectorNumber;
  if (!localId) return undefined;
  seriesBySet ??= new Map(catalogSetIndex().flatMap((entry) => {
    const series = entry.series.en?.id ?? entry.series.de?.id;
    return series ? [[entry.id, series] as const] : [];
  }));
  const series = seriesBySet.get(card.setId);
  return series ? inferredCardImageBaseUrl("en", series, card.setId, localId) : undefined;
}

interface CardArtworkProps {
  card: Pick<CardSnapshot, "name" | "setName" | "collectorNumber" | "ref" | "imageBaseUrl" | "imageFallbackBaseUrl"> & { setId?: string; englishIdentity?: { name: string } };
  className: string;
  fallback: ReactNode;
  onAvailable?: () => void;
  onUnavailable?: () => void;
}

export function CardArtwork({ card, className, fallback, onAvailable, onUnavailable }: CardArtworkProps) {
  const candidates = useMemo(() => [card.imageBaseUrl, card.imageFallbackBaseUrl, englishPictureOfSameCard(card)]
    .filter((value): value is string => Boolean(value))
    .filter((value, index, values) => values.indexOf(value) === index),
  // eslint-disable-next-line react-hooks/exhaustive-deps -- the English picture follows from these fields of the card
  [card.imageBaseUrl, card.imageFallbackBaseUrl, card.ref.language, card.ref.id, card.setId, card.collectorNumber]);
  const signature = candidates.join("\n");
  const [attempt, setAttempt] = useState({ signature, candidateIndex: 0 });
  const candidateIndex = attempt.signature === signature ? attempt.candidateIndex : 0;
  const exhausted = candidateIndex >= candidates.length;

  // When TCGdex has no usable image, look the card up in the CardTrader data (verified set mapping, unique number).
  const cardtraderKey = `${card.ref.language}|${card.setId}|${card.collectorNumber}|${card.name}`;
  const [cardtrader, setCardtrader] = useState<{ key: string; url?: string; done: boolean }>({ key: cardtraderKey, done: false });
  const cardtraderState = cardtrader.key === cardtraderKey ? cardtrader : { key: cardtraderKey, done: false };
  const useCardtrader = FEATURES.cardtraderImages && exhausted && Boolean(card.setId);
  const nameHint = card.englishIdentity?.name ?? card.name;

  useEffect(() => {
    if (!useCardtrader || cardtraderState.done) return;
    let cancelled = false;
    void cardtraderCatalog.blueprint(card.ref.language, card.setId!, card.collectorNumber, nameHint).then((match) => {
      if (cancelled) return;
      setCardtrader({ key: cardtraderKey, url: match?.blueprint.img ? cardtraderImageUrl(match.blueprint.img) : undefined, done: true });
    });
    return () => { cancelled = true; };
  }, [useCardtrader, cardtraderState.done, cardtraderKey, card.ref.language, card.setId, card.collectorNumber, nameHint]);

  const waitingForCardtrader = useCardtrader && !cardtraderState.done;
  const unavailable = exhausted && !waitingForCardtrader && !cardtraderState.url;
  useEffect(() => {
    if (unavailable) onUnavailable?.();
  }, [unavailable, onUnavailable, signature, cardtraderState.url]);

  if (exhausted && cardtraderState.url) {
    return (
      <span className={className}>
        <img
          src={cardtraderState.url}
          alt={`${card.name}, ${card.setName} ${card.collectorNumber}`}
          onLoad={onAvailable}
          onError={() => setCardtrader({ key: cardtraderKey, done: true })}
        />
        <span>Bild: CardTrader</span>
      </span>
    );
  }
  const imageBaseUrl = candidates[candidateIndex];
  if (!imageBaseUrl) return fallback;
  const shownLanguage = imageLanguage(imageBaseUrl);
  const languageLabel = shownLanguage && shownLanguage !== card.ref.language ? IMAGE_LANGUAGE_LABELS[shownLanguage] : undefined;

  return (
    <span className={className}>
      <img
        src={cardImageUrl(imageBaseUrl)}
        alt={`${card.name}, ${card.setName} ${card.collectorNumber}`}
        onLoad={onAvailable}
        onError={() => setAttempt({ signature, candidateIndex: candidateIndex + 1 })}
      />
      {languageLabel ? <span>{languageLabel}</span> : null}
    </span>
  );
}
