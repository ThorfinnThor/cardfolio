import type { Metadata } from "next";

import { ArtworkReviewWorkspace } from "@/components/foundation/ArtworkReviewWorkspace";
import { FEATURES } from "@/config/feature-flags";
import { pageUrlMetadata } from "@/config/site";

const TITLE = "Artwork review · Your Card Binder";
const DESCRIPTION = "Internal review tool for card artwork tags.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  robots: { index: false, follow: false },
  ...pageUrlMetadata("/artwork-review/", TITLE, DESCRIPTION),
};

export default function ArtworkReviewPage() {
  return <ArtworkReviewWorkspace enabled={FEATURES.artworkReview} />;
}
