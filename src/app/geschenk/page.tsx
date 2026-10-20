import type { Metadata } from "next";

import { FoundationWorkspace } from "@/components/foundation/FoundationWorkspace";
import { pageUrlMetadata } from "@/config/site";

const TITLE = "Pokémon-Binder verschenken · Cardfolio";
const DESCRIPTION = "Ein persönlicher Pokémon-Binder als Geschenk: Lieblings-Pokémon wählen, Karten ansehen und Binder samt Karten besorgen. Ohne Konto, lokal im Browser.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  ...pageUrlMetadata("/geschenk/", TITLE, DESCRIPTION),
};

export default function GiftEntry() {
  return <FoundationWorkspace shell="gift" />;
}
