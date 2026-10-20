import { LandingPage } from "@/components/content/Landing";
import { homeMetadata } from "@/content/page-meta";
import { homePath } from "@/content/routes";

export const metadata = homeMetadata("en");

export default function EnglishHome() {
  return <LandingPage language="en" alternatePath={homePath("de")} />;
}
