import { ArtworkReviewWorkspace } from "@/components/foundation/ArtworkReviewWorkspace";
import { FEATURES } from "@/config/feature-flags";

export default function ArtworkReviewPage() {
  return <ArtworkReviewWorkspace enabled={FEATURES.artworkReview} />;
}
