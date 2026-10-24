"use client";

import { useMemo, useState } from "react";

import { catalogSetAssetUrl, type CatalogSetAsset } from "@/domain/catalog-set";
import { catalogSetIndex } from "@/data/catalog/set-counts";
import type { CardLanguage } from "@/domain/types";

/**
 * The logo of a set, or its symbol when there is no logo, or nothing when the catalogue has neither. The image is
 * loaded from the allow-listed TCGdex asset host and never stored. Decorative: the set name stands next to it.
 */
export function SetLogo({ setId, language, className }: { setId: string; language: CardLanguage; className?: string }) {
  const candidates = useMemo(() => {
    const entry = catalogSetIndex().find((candidate) => candidate.id === setId);
    if (!entry) return [];
    const other: CardLanguage = language === "de" ? "en" : "de";
    return [entry.assets[language]?.logo, entry.assets[other]?.logo, entry.assets[language]?.symbol, entry.assets[other]?.symbol]
      .filter((asset): asset is CatalogSetAsset => Boolean(asset))
      .filter((asset, index, assets) => assets.findIndex((candidate) => candidate.baseUrl === asset.baseUrl) === index);
  }, [setId, language]);
  const [failed, setFailed] = useState(0);
  const asset = candidates[failed];
  if (!asset) return <span className={className} aria-hidden="true" />;
  return (
    <span className={className} data-asset-kind={asset.kind} aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element -- static export; same asset host as the card pictures */}
      <img src={catalogSetAssetUrl(asset)} alt="" loading="lazy" decoding="async" onError={() => setFailed((current) => current + 1)} />
    </span>
  );
}
