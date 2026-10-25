"use client";

import { useEffect, useMemo, useState } from "react";

import { CardTraderGiftPriceProvider } from "@/data/pricing/cardtrader-price-provider";
import { priceOwnedCopies } from "@/data/pricing/binder-value-service";
import { binderMarketHistory } from "@/data/pricing/price-history";
import { loadValueHistory, saveValueHistory } from "@/data/persistence/value-history";
import { deriveBinderValue, ownedCopies, type OwnedCopy, recordValuePoint, todayUtc, valueChange } from "@/domain/collection-value";
import type { PriceProvider } from "@/domain/gift-builder";
import type { Binder, CardSnapshot, UUID, ValuePoint } from "@/domain/types";

import { formatDate, formatMoney } from "./gift-format";
import styles from "./binder-value-panel.module.css";

export interface ValueHistoryStore {
  load(binderId: UUID): Promise<ValuePoint[]>;
  save(binderId: UUID, history: readonly ValuePoint[]): Promise<void>;
}

const defaultStore: ValueHistoryStore = { load: loadValueHistory, save: saveValueHistory };
const defaultProvider = new CardTraderGiftPriceProvider();

type Status = { state: "idle" } | { state: "loading" } | { state: "ready"; valueMinor: number; pricedCopies: number; ownedCopies: number; unrecorded: number };

const CHART_WIDTH = 260;
const CHART_HEIGHT = 56;

/** A line through the saved values, spaced by date. Needs at least two points. */
export function ValueSparkline({ history }: { history: readonly ValuePoint[] }) {
  if (history.length < 2) return null;
  const times = history.map((point) => Date.parse(point.date));
  const [first, last] = [times[0]!, times.at(-1)!];
  const values = history.map((point) => point.valueMinor);
  const low = Math.min(...values);
  const high = Math.max(...values);
  const x = (time: number) => (last === first ? 0 : ((time - first) / (last - first)) * (CHART_WIDTH - 8) + 4);
  const y = (value: number) => (high === low ? CHART_HEIGHT / 2 : CHART_HEIGHT - 6 - ((value - low) / (high - low)) * (CHART_HEIGHT - 12));
  const path = history.map((point, index) => `${index === 0 ? "M" : "L"}${x(times[index]!).toFixed(1)},${y(point.valueMinor).toFixed(1)}`).join(" ");
  return (
    <svg className={styles.chart} viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} role="img" aria-label={`Wertverlauf von ${formatDate(history[0]!.date)} bis ${formatDate(history.at(-1)!.date)}`}>
      <path d={path} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(last)} cy={y(values.at(-1)!)} r="3.5" fill="currentColor" />
    </svg>
  );
}

/**
 * What the owned cards of the open binder are roughly worth: the cheapest CardTrader listing per card in its
 * condition, times the number of copies. One point per day is kept on this device for the history.
 */
export function BinderValuePanel({ binder, cards, provider = defaultProvider, store = defaultStore, marketHistory = binderMarketHistory }: {
  binder: Binder;
  cards: ReadonlyMap<string, CardSnapshot>;
  provider?: PriceProvider;
  store?: ValueHistoryStore;
  /** Weekly price movement of the owned cards, from the synced price series. */
  marketHistory?: (copies: readonly OwnedCopy[]) => Promise<ValuePoint[]>;
}) {
  const copies = useMemo(() => ownedCopies(binder, cards), [binder, cards]);
  const signature = useMemo(() => copies.map((owned) => `${owned.entry.id}:${owned.card.key}:${owned.condition}:${owned.copies}`).join("|"), [copies]);
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const [history, setHistory] = useState<ValuePoint[]>([]);
  const [market, setMarket] = useState<ValuePoint[]>([]);
  const binderId = binder.id;

  useEffect(() => {
    if (copies.length === 0) {
      queueMicrotask(() => setStatus({ state: "idle" }));
      return;
    }
    let cancelled = false;
    const controller = new AbortController();
    queueMicrotask(() => { if (!cancelled) setStatus({ state: "loading" }); });
    void (async () => {
      const prices = await priceOwnedCopies(copies, provider, controller.signal);
      if (cancelled) return;
      const value = deriveBinderValue(copies, prices);
      const saved = await store.load(binderId).catch(() => [] as ValuePoint[]);
      if (cancelled) return;
      const next = value.pricedCopies > 0
        ? recordValuePoint(saved, { date: todayUtc(), valueMinor: value.valueMinor, pricedCopies: value.pricedCopies, ownedCopies: value.ownedCopies })
        : saved;
      if (next !== saved) await store.save(binderId, next).catch(() => undefined);
      if (cancelled) return;
      const weekly = await marketHistory(copies).catch(() => [] as ValuePoint[]);
      if (cancelled) return;
      setHistory(next);
      setMarket(weekly);
      setStatus({ state: "ready", valueMinor: value.valueMinor, pricedCopies: value.pricedCopies, ownedCopies: value.ownedCopies, unrecorded: copies.filter((owned) => !owned.conditionRecorded).length });
    })();
    return () => { cancelled = true; controller.abort(); };
    // `signature` stands for the owned cards, their condition and quantity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, binderId, provider, store, marketHistory]);

  const weeklyMarket = market.length >= 2;
  const change = valueChange(weeklyMarket ? market : history);
  return (
    <section className={styles.panel} aria-label="Sammlungswert">
      <h2>Sammlungswert</h2>
      {copies.length === 0 ? <p className={styles.hint}>Markiere Karten als vorhanden, dann zeigt dir der Binder, was sie ungefähr wert sind.</p> : null}
      {status.state === "loading" ? <p className={styles.hint} role="status">Preise werden geladen …</p> : null}
      {status.state === "ready" && copies.length > 0 ? (
        status.pricedCopies === 0 ? <p className={styles.hint}>Für diese Karten liegt noch kein Preis vor.</p> : (
          <>
            <p className={styles.value}><span>ca.</span> <strong>{formatMoney(status.valueMinor, "EUR")}</strong></p>
            <p className={styles.coverage}>{status.pricedCopies} von {status.ownedCopies} vorhandenen Karten bepreist</p>
            {status.unrecorded > 0 ? <p className={styles.coverage}>{status.unrecorded === 1 ? "1 Karte ohne eingetragenen Zustand: Es gilt der Mindestzustand." : `${status.unrecorded} Karten ohne eingetragenen Zustand: Es gilt der Mindestzustand.`}</p> : null}
            <ValueSparkline history={weeklyMarket ? market : history} />
            {change ? (
              <p className={styles.coverage}>{weeklyMarket ? "Preisentwicklung deiner aktuellen Karten" : "Verlauf"} seit {formatDate(change.since)}: {change.deltaMinor >= 0 ? "+" : "−"}{formatMoney(Math.abs(change.deltaMinor), "EUR")}</p>
            ) : <p className={styles.coverage}>Die Preisreihe füllt sich mit jedem Wochenpreis. Öffne den Binder später wieder, dann siehst du hier die Entwicklung.</p>}
            {weeklyMarket ? <p className={styles.coverage}>{market[0]!.pricedCopies} von {market[0]!.ownedCopies} Karten hatten in jeder Woche ein Angebot und zählen für die Kurve.</p> : null}
          </>
        )
      ) : null}
      <p className={styles.note}>Richtwert: das günstigste CardTrader-Angebot im jeweiligen Zustand, ohne Versand, aus der wöchentlichen Preisliste. Kein Verkaufspreis und keine Anlageberatung. Der Verlauf liegt nur in diesem Browser.</p>
    </section>
  );
}
