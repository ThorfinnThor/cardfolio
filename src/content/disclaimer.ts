import type { PageLanguage } from "@/config/site";

/**
 * Trademark and independence statement shown on every public content page. The owners are named in full on
 * purpose: it must be unmistakable that Your Card Binder is not connected to them.
 */
export const DISCLAIMER: Record<PageLanguage, { heading: string; lines: readonly string[] }> = {
  de: {
    heading: "Keine Verbindung zu Nintendo, Creatures oder The Pokémon Company",
    lines: [
      "Your Card Binder ist ein unabhängiges Projekt. Es ist nicht mit Nintendo, Creatures Inc., GAME FREAK inc. oder The Pokémon Company verbunden und wird von keinem dieser Unternehmen unterstützt, gesponsert oder genehmigt.",
      "Pokémon und die Namen der Pokémon-Figuren sind Marken von Nintendo, Creatures Inc., GAME FREAK inc. und The Pokémon Company. Kartenabbildungen und Kartendaten gehören ihren jeweiligen Rechteinhabern. Your Card Binder verkauft keine Karten und steht auch mit Cardmarket und TCGplayer in keiner geschäftlichen Verbindung.",
    ],
  },
  en: {
    heading: "Not affiliated with Nintendo, Creatures or The Pokémon Company",
    lines: [
      "Your Card Binder is an independent project. It is not affiliated with Nintendo, Creatures Inc., GAME FREAK inc. or The Pokémon Company, and it is not supported, sponsored or endorsed by any of them.",
      "Pokémon and Pokémon character names are trademarks of Nintendo, Creatures Inc., GAME FREAK inc. and The Pokémon Company. Card images and card data belong to their respective owners. Your Card Binder does not sell cards and has no business relationship with Cardmarket or TCGplayer.",
    ],
  },
};
