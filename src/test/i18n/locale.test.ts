import { describe, expect, it } from "vitest";

import { DISCLAIMER } from "@/content/disclaimer";
import { conditionProfiles } from "@/domain/purchase-preferences";
import { detectLocale, translateGermanText } from "@/i18n/locale";

describe("interface locale", () => {
  it("uses German only when the preferred browser language is German", () => {
    expect(detectLocale(["de-DE", "en-US"])).toBe("de");
    expect(detectLocale(["de-AT"])).toBe("de");
    expect(detectLocale(["en-GB", "de-DE"])).toBe("en");
    expect(detectLocale(["fr-FR"])).toBe("en");
    expect(detectLocale(undefined)).toBe("en");
  });

  it("translates fixed and dynamic interface copy while preserving whitespace", () => {
    expect(translateGermanText("  Meine Binder ")).toBe("  My binders ");
    expect(translateGermanText("9 Karten")).toBe("9 cards");
    expect(translateGermanText("Seite 3")).toBe("Page 3");
    expect(translateGermanText("Pikachu")).toBe("Pikachu");
  });

  it("translates strings built from numbers and names in the gift flow", () => {
    expect(translateGermanText("Alle passenden Karten ansehen (40)")).toBe("View all matching cards (40)");
    expect(translateGermanText("Alle 9 Karten ansehen")).toBe("View all 9 cards");
    expect(translateGermanText("Pikachu, Majestätischer Morgen: Details ansehen")).toBe("Pikachu, Majestätischer Morgen: view details");
    expect(translateGermanText("9 Karten = 1 Binder-Seite.")).toBe("9 cards = 1 binder page.");
    expect(translateGermanText("12 Karten = 2 Binder-Seiten.")).toBe("12 cards = 2 binder pages.");
    expect(translateGermanText("9-Pocket · Platz für bis zu 360 Karten")).toBe("9-pocket · Holds up to 360 cards");
    expect(translateGermanText("Platz für bis zu 360 Karten")).toBe("Holds up to 360 cards");
    expect(translateGermanText("für 3 von 9 Karten")).toBe("for 3 of 9 cards");
    expect(translateGermanText("mind. 55,00 €")).toBe("at least 55,00 €");
    expect(translateGermanText("Geschenk · Glurak")).toBe("Gift · Glurak");
  });

  it("translates the shared trademark notice and the condition explanations", () => {
    expect(translateGermanText(DISCLAIMER.de.heading)).toBe(DISCLAIMER.en.heading);
    expect(translateGermanText(DISCLAIMER.de.lines[0]!)).toBe(DISCLAIMER.en.lines[0]);
    for (const profile of conditionProfiles) {
      expect(translateGermanText(profile.explanation), profile.value).not.toBe(profile.explanation);
      if (profile.providerSummary.includes("bis ") || profile.providerSummary.includes(" oder ") || profile.providerSummary.startsWith("Alle")) {
        expect(translateGermanText(profile.providerSummary), profile.value).not.toBe(profile.providerSummary);
      }
    }
  });
});
