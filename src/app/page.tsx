import { FoundationWorkspace } from "@/components/foundation/FoundationWorkspace";
import { HomeSeoSection } from "@/components/content/HomeSeoSection";
import { homeMetadata } from "@/content/page-meta";

export const metadata = homeMetadata("de");

export default function Home() {
  return (
    <>
      <FoundationWorkspace />
      <HomeSeoSection />
    </>
  );
}
