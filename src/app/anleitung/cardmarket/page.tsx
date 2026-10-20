import type { Metadata } from "next";

import { AppLegalFooter } from "@/components/content/AppLegalFooter";
import { CardmarketHowTo } from "@/components/howto/CardmarketHowTo";
import { pageUrlMetadata } from "@/config/site";

const TITLE = "Karten bei Cardmarket kaufen – Anleitung · Cardfolio";
const DESCRIPTION = "Schritt für Schritt von der Cardfolio-Liste zum Warenkorb bei Cardmarket: Konto, Wants-Liste, Kartenzustand per Massenveränderung, Shopping Wizard.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  ...pageUrlMetadata("/anleitung/cardmarket/", TITLE, DESCRIPTION),
};

export default function CardmarketHowToPage() {
  return (
    <>
      <CardmarketHowTo />
      <AppLegalFooter />
    </>
  );
}
