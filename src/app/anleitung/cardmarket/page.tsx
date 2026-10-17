import type { Metadata } from "next";

import { CardmarketHowTo } from "@/components/howto/CardmarketHowTo";

export const metadata: Metadata = {
  title: "Karten bei Cardmarket kaufen – Anleitung · Cardfolio",
  description: "Schritt für Schritt von der Cardfolio-Liste zum Warenkorb bei Cardmarket: Konto, Wants-Liste, Kartenzustand per Massenveränderung, Shopping Wizard.",
};

export default function CardmarketHowToPage() {
  return <CardmarketHowTo />;
}
