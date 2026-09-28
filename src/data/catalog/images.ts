export type CardImageQuality = "low" | "high";
export type CardImageFormat = "webp" | "png";

function imagePathSegment(value: string): string {
  return encodeURIComponent(value.trim());
}

export function inferredCardImageBaseUrl(
  language: "de" | "en",
  seriesId: string,
  setId: string,
  collectorNumber: string,
): string {
  return `https://assets.tcgdex.net/${language}/${imagePathSegment(seriesId)}/${imagePathSegment(setId)}/${imagePathSegment(collectorNumber)}`;
}

export function cardImageUrl(
  imageBaseUrl: string,
  quality: CardImageQuality = "high",
  format: CardImageFormat = "webp",
): string {
  const base = new URL(imageBaseUrl);
  if (base.protocol !== "https:" || base.hostname !== "assets.tcgdex.net") {
    throw new Error("Unsupported card image origin.");
  }
  return `${base.toString().replace(/\/$/, "")}/${quality}.${format}`;
}
