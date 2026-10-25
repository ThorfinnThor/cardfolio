"use client";

import { useEffect, useState } from "react";

import { cardPriceTrend, type PriceTrendPoint } from "@/data/pricing/price-history";
import type { CardSnapshot, PlannedCard } from "@/domain/types";

import { ValueSparkline } from "./BinderValuePanel";
import { formatDate, formatMoney } from "./gift-format";
import styles from "./binder-value-panel.module.css";

/** The weekly price of one card at its condition (the recorded one, else the wanted minimum), once two weeks exist. */
export function CardPriceTrend({ card, entry, load = cardPriceTrend }: { card: CardSnapshot; entry: PlannedCard; load?: typeof cardPriceTrend }) {
  const [points, setPoints] = useState<PriceTrendPoint[]>([]);
  const condition = entry.condition ?? entry.preferences.minimumCondition;
  useEffect(() => {
    let cancelled = false;
    void load(card, entry.variant, condition).then((result) => { if (!cancelled) setPoints(result); }).catch(() => { if (!cancelled) setPoints([]); });
    return () => { cancelled = true; };
  }, [card, entry.variant, condition, load]);

  if (points.length < 2) return null;
  const first = points[0]!;
  const last = points.at(-1)!;
  return (
    <div className={styles.cardTrend}>
      <strong>Preisverlauf</strong>
      <ValueSparkline history={points.map((point) => ({ date: point.date, valueMinor: point.amountMinor, pricedCopies: 1, ownedCopies: 1 }))} />
      <small>Preis seit {formatDate(first.date)}: {formatMoney(first.amountMinor, "EUR")} → {formatMoney(last.amountMinor, "EUR")}</small>
    </div>
  );
}
