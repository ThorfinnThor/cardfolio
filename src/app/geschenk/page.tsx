import type { Metadata } from "next";

import { FoundationWorkspace } from "@/components/foundation/FoundationWorkspace";

import { Providers } from "../providers";

export const metadata: Metadata = {
  title: "Pokémon-Binder verschenken · Cardfolio",
  description: "Ein persönlicher Pokémon-Binder als Geschenk: Lieblings-Pokémon wählen, Karten ansehen und Binder samt Karten besorgen. Ohne Konto, lokal im Browser.",
};

export default function GiftEntry() {
  return (
    <Providers>
      <FoundationWorkspace shell="gift" />
    </Providers>
  );
}
