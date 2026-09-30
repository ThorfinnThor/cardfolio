"use client";

/* eslint-disable @next/next/no-img-element -- The catalog supplies dynamic external artwork URLs with a runtime fallback chain. */

import { useMemo, useState, type ReactNode } from "react";

import { imageLanguage } from "@/data/catalog/image-fallbacks";
import { cardImageUrl } from "@/data/catalog/images";
import type { CardSnapshot } from "@/domain/types";

const IMAGE_LANGUAGE_LABELS: Record<string, string> = {
  de: "Bild auf Deutsch",
  en: "Bild auf Englisch",
  es: "Bild auf Spanisch",
  fr: "Bild auf Französisch",
  it: "Bild auf Italienisch",
  pt: "Bild auf Portugiesisch",
};

interface CardArtworkProps {
  card: Pick<CardSnapshot, "name" | "setName" | "collectorNumber" | "ref" | "imageBaseUrl" | "imageFallbackBaseUrl">;
  className: string;
  fallback: ReactNode;
}

export function CardArtwork({ card, className, fallback }: CardArtworkProps) {
  const candidates = useMemo(() => [card.imageBaseUrl, card.imageFallbackBaseUrl]
    .filter((value): value is string => Boolean(value))
    .filter((value, index, values) => values.indexOf(value) === index), [card.imageBaseUrl, card.imageFallbackBaseUrl]);
  const signature = candidates.join("\n");
  const [attempt, setAttempt] = useState({ signature, candidateIndex: 0 });
  const candidateIndex = attempt.signature === signature ? attempt.candidateIndex : 0;

  const imageBaseUrl = candidates[candidateIndex];
  if (!imageBaseUrl) return fallback;
  const shownLanguage = imageLanguage(imageBaseUrl);
  const languageLabel = shownLanguage && shownLanguage !== card.ref.language ? IMAGE_LANGUAGE_LABELS[shownLanguage] : undefined;

  return (
    <span className={className}>
      <img
        src={cardImageUrl(imageBaseUrl)}
        alt={`${card.name}, ${card.setName} ${card.collectorNumber}`}
        onError={() => setAttempt({ signature, candidateIndex: candidateIndex + 1 })}
      />
      {languageLabel ? <span>{languageLabel}</span> : null}
    </span>
  );
}
