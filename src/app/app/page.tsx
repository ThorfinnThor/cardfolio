import type { Metadata } from "next";

import { FoundationWorkspace } from "@/components/foundation/FoundationWorkspace";

/* The full app with the collector's navigation. The public start page is `/`; this view is for people who already use Your Card Binder. */
export const metadata: Metadata = {
  title: "Your Card Binder · Meine Binder",
  robots: { index: false, follow: true },
  alternates: { canonical: "/app/" },
};

export default function AppHome() {
  return <FoundationWorkspace />;
}
