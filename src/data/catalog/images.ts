export type CardImageQuality = "low" | "high";
export type CardImageFormat = "webp" | "png";

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
