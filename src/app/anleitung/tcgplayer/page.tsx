import type { Metadata } from "next";

import { AppLegalFooter } from "@/components/content/AppLegalFooter";
import { TcgplayerHowTo } from "@/components/howto/TcgplayerHowTo";
import { pageUrlMetadata } from "@/config/site";

const TITLE = "Karten bei TCGplayer kaufen mit Mass Entry – Anleitung · Your Card Binder";
const DESCRIPTION = "Von der Your Card Binder-Liste zum Warenkorb bei TCGplayer: Mass Entry öffnen, Printing und Zustand einstellen, Add to Cart und Versand nach Deutschland prüfen.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  ...pageUrlMetadata("/anleitung/tcgplayer/", TITLE, DESCRIPTION),
};

export default function TcgplayerHowToPage() {
  return (
    <>
      <TcgplayerHowTo />
      <AppLegalFooter />
    </>
  );
}
