"use client";

import { ArrowRight, Check, ExternalLink, ShoppingBag } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { loadBinderPartnerCatalog, ReviewedBinderAffiliateAdapter } from "@/data/partners/binder-affiliate-adapter";
import type { BinderAffiliateAdapter, BinderOffer } from "@/domain/binder-affiliate";

import { formatDate, formatMoney, shopName } from "./gift-format";
import styles from "./gift-builder.module.css";

interface GiftPurchaseStepsProps {
  /** How many cards the plan holds; the recommended binder has to fit them. */
  planSize: number;
  onCardsPurchase: () => void;
}

/**
 * The two things a gift buyer still has to do: order a binder, buy the cards. Used right after planning and
 * again when the buyer comes back to the saved gift binder later.
 */
export function GiftPurchaseSteps({ planSize, onCardsPurchase }: GiftPurchaseStepsProps) {
  const [binderOffers, setBinderOffers] = useState<BinderOffer[]>();
  const [partnerAdapter, setPartnerAdapter] = useState<BinderAffiliateAdapter>();
  const [partnerLoadError, setPartnerLoadError] = useState<string>();

  useEffect(() => {
    const controller = new AbortController();
    void loadBinderPartnerCatalog(controller.signal)
      .then((catalog) => {
        if (controller.signal.aborted) return;
        const adapter = new ReviewedBinderAffiliateAdapter(catalog);
        setPartnerAdapter(adapter);
        setBinderOffers([...adapter.listOffers()]);
        setPartnerLoadError(undefined);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setPartnerAdapter(undefined);
        setBinderOffers([]);
        setPartnerLoadError(cause instanceof Error ? cause.message : "Binder-Angebote konnten nicht geladen werden.");
      });
    return () => controller.abort();
  }, []);

  const recommendedBinderOffers = useMemo(() => {
    if (!binderOffers) return undefined;
    const available = binderOffers.filter((offer) => offer.status === "available");
    const capacityMatches = available.filter((offer) => !offer.capacityCards || offer.capacityCards >= planSize);
    const layoutMatches = capacityMatches.filter((offer) => offer.pocketsPerPage === 9);
    const pool = layoutMatches.length ? layoutMatches : capacityMatches.length ? capacityMatches : available;
    return pool.toSorted((left, right) =>
      Number(right.pocketsPerPage === 9) - Number(left.pocketsPerPage === 9)
      || (left.price?.amountMinor ?? Number.MAX_SAFE_INTEGER) - (right.price?.amountMinor ?? Number.MAX_SAFE_INTEGER)
      || left.displayName.localeCompare(right.displayName, "de"),
    ).slice(0, 3);
  }, [binderOffers, planSize]);

  return (
    <section className={styles.purchaseOptions} aria-label="Nächste Schritte: Binder bestellen und Karten kaufen">
      <article className={`${styles.purchaseCard} ${styles.purchaseCardFeatured}`}>
        <div><h3><span className={styles.purchaseNumber} aria-hidden="true">1</span> Binder bestellen</h3><p>Dieser Binder passt zum 3×3-Seitenplan.</p>
          {partnerLoadError ? <p role="status">Angebote sind momentan nicht erreichbar. Du kannst den lokalen Binder weiter bearbeiten.</p> : null}
          {!partnerLoadError && !binderOffers ? <p role="status">Binder-Angebote werden geprüft…</p> : null}
          {!partnerLoadError && recommendedBinderOffers?.length === 0 ? <p role="status">Zurzeit ist kein geprüfter Binder-Shop verfügbar. Du kannst den lokalen Binder trotzdem weiter bearbeiten.</p> : null}
          {recommendedBinderOffers?.length ? <p className={styles.binderMatch}><Check aria-hidden="true" size={20} /><span><strong>Passt zu deinem Plan</strong>{planSize} Karten = {Math.ceil(planSize / 9)} {Math.ceil(planSize / 9) === 1 ? "Binder-Seite" : "Binder-Seiten"}.</span></p> : null}
          {recommendedBinderOffers?.length ? <div className={styles.offerGrid}>{recommendedBinderOffers.map((offer, index) => {
            const destinationUrl = offer.status === "available" ? partnerAdapter?.buildExternalUrl(offer.id) : undefined;
            return <div className={styles.offerCard} data-recommended={index === 0} key={offer.id}>
              <div className={styles.offerDetails}><strong>{offer.displayName}{index === 0 ? <em>Empfohlen</em> : null}</strong><small className={styles.offerPrice}>{offer.price ? `${offer.price.qualifier === "from" ? "ab " : ""}${formatMoney(offer.price.amountMinor, offer.price.currency)}` : "Preis im Shop prüfen"}</small>
                {offer.capacityCards ? <small>{offer.pocketsPerPage ? `${offer.pocketsPerPage}-Pocket · ` : ""}Platz für bis zu {offer.capacityCards} Karten</small> : null}
                {offer.price ? <small>Preis geprüft am {formatDate(offer.price.sourceUpdatedAt)}</small> : null}
                {offer.affiliateDisclosure ? <small className={styles.affiliateDisclosure}>{offer.affiliateDisclosure}</small> : null}
                {offer.status !== "available" ? <small>{offer.statusReason ?? "Angebot nicht verfügbar."}</small> : null}
              </div>
              {destinationUrl ? <a className={styles.offerAction} href={destinationUrl} target="_blank" rel="noopener noreferrer">{offer.kind === "personalized" ? `Bei ${shopName(destinationUrl)} personalisieren` : `Bei ${shopName(destinationUrl)} bestellen`} <ExternalLink aria-hidden="true" size={15} /></a> : <button type="button" className={styles.offerAction} disabled>Derzeit nicht verfügbar</button>}
            </div>;
          })}</div> : null}
          {recommendedBinderOffers?.length ? <p className={styles.offerNote}>Aktuellen Preis, Verfügbarkeit und Versand prüfst du im Shop.</p> : null}
        </div>
      </article>
      <article className={`${styles.purchaseCard} ${styles.purchaseCardCompact}`}>
        <div><h3><span className={styles.purchaseNumber} aria-hidden="true">2</span> Karten kaufen</h3><p>Wähle einen Anbieter und übernimm die vorbereitete Einkaufsliste.</p><a className={styles.howtoLink} href="/anleitung/cardmarket/" target="_blank" rel="noopener noreferrer">Anleitung mit Bildern <ExternalLink aria-hidden="true" size={14} /></a></div>
        <button type="button" className={styles.primaryButton} aria-label="Karten besorgen" onClick={onCardsPurchase}><ShoppingBag aria-hidden="true" size={18} /> Karten jetzt kaufen <ArrowRight aria-hidden="true" size={18} /></button>
      </article>
    </section>
  );
}
