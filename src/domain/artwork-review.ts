import type { SemanticTag } from "./semantic-card-search";

export const ARTWORK_REVIEW_VERDICTS = ["dominant", "secondary", "incorrect", "unsure"] as const;

export type ArtworkReviewVerdict = (typeof ARTWORK_REVIEW_VERDICTS)[number];

export const ARTWORK_REVIEW_SOURCES = ["human", "ai-assisted"] as const;

export type ArtworkReviewSource = (typeof ARTWORK_REVIEW_SOURCES)[number];

export interface ArtworkReviewRecord {
  cardId: string;
  tag: SemanticTag;
  verdict: ArtworkReviewVerdict;
  reviewedAt: string;
  source?: ArtworkReviewSource;
}

export interface ArtworkReviewIndex {
  version: 1;
  generatedAt: string;
  reviews: readonly ArtworkReviewRecord[];
}

export function artworkReviewKey(cardId: string, tag: SemanticTag): string {
  return `${cardId}:${tag}`;
}

export function isDominantArtworkMatch(
  reviews: ArtworkReviewIndex,
  cardId: string,
  tags: readonly SemanticTag[],
): boolean {
  const wanted = new Set(tags.map((tag) => artworkReviewKey(cardId, tag)));
  return reviews.reviews.some((review) => review.verdict === "dominant" && wanted.has(artworkReviewKey(review.cardId, review.tag)));
}
