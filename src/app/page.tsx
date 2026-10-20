import { LandingPage } from "@/components/content/Landing";
import { homeMetadata } from "@/content/page-meta";
import { homePath } from "@/content/routes";

export const metadata = homeMetadata("de");

export default function Home() {
  return <LandingPage language="de" alternatePath={homePath("en")} />;
}
