import { describe, expect, it, vi } from "vitest";

describe("smart-search feature flag", () => {
  it("is enabled by default and can be disabled for a static build", async () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_SMART_SEARCH", "false");
    vi.resetModules();
    expect((await import("@/config/feature-flags")).FEATURES.smartSearch).toBe(false);

    vi.unstubAllEnvs();
    vi.resetModules();
    expect((await import("@/config/feature-flags")).FEATURES.smartSearch).toBe(true);
  });
});

describe("Gift Builder pricing feature flag", () => {
  it("shows estimates while keeping budget guarantees disabled", async () => {
    vi.resetModules();
    expect((await import("@/config/feature-flags")).FEATURES.giftBuilderPricing).toBe(false);
    expect((await import("@/config/feature-flags")).FEATURES.giftPriceEstimates).toBe(true);
    expect((await import("@/config/feature-flags")).FEATURES.giftBudgetGuarantee).toBe(false);
  });
});
