"use client";

import { useSearchParams } from "next/navigation";
import { DesignPreviewCanvas } from "./DesignPreviewCanvas";

export function DesignPreviewClient() {
  const searchParams = useSearchParams();
  const variant = searchParams.get("variant") === "3" ? "design-3" : "design-2";

  return <DesignPreviewCanvas variant={variant} />;
}
