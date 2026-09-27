import { FoundationWorkspace } from "@/components/foundation/FoundationWorkspace";

import { Providers } from "./providers";

export default function Home() {
  return (
    <Providers>
      <FoundationWorkspace />
    </Providers>
  );
}
