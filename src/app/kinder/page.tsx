import type { Metadata } from "next";

import { ContentFrame } from "@/components/content/ContentFrame";
import { KidsWishlist } from "@/components/foundation/KidsWishlist";
import { pageUrlMetadata } from "@/config/site";

const TITLE = "Pokémon-Wunschzettel für Kinder · Your Card Binder";
const DESCRIPTION = "Kinder suchen sich ein Pokémon aus, tauschen neun Karten und schicken ihren Wunschzettel als Link an Mama oder Papa. Ohne Konto, ohne Kauf.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  /* A tool page for families; the guides and the home page are the entry points for search. */
  robots: { index: false, follow: true },
  ...pageUrlMetadata("/kinder/", TITLE, DESCRIPTION),
};

export default function KidsPage() {
  return (
    <ContentFrame language="de">
      <KidsWishlist />
    </ContentFrame>
  );
}
