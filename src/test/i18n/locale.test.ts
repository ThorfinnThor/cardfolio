import { describe, expect, it } from "vitest";

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
});
