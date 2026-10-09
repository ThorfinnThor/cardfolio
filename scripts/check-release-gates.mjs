import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const failures = [];

function requireFile(relativePath) {
  const absolutePath = join(root, relativePath);
  if (!existsSync(absolutePath)) failures.push(`Missing required file: ${relativePath}`);
  return absolutePath;
}

function requireText(relativePath, expected) {
  const absolutePath = requireFile(relativePath);
  if (!existsSync(absolutePath)) return;
  const content = readFileSync(absolutePath, "utf8");
  for (const value of expected) {
    if (!content.includes(value)) failures.push(`${relativePath} is missing: ${value}`);
  }
}

requireFile("out/index.html");
requireFile("out/help/index.html");
requireFile("src/app/icon.svg");
requireFile("data/semantic/card-artwork-tags-v1.manifest.json");
requireFile("data/semantic/card-artwork-tags-v1.jsonl");
requireFile("data/semantic/gift-theme-reviews-v1.json");
requireFile("data/semantic/catalog-coverage.json");
requireFile("data/semantic/search-evaluation-v1.json");
requireFile("public/data/semantic/card-artwork-search-v1.json");
requireFile("public/data/semantic/gift-theme-reviews-v1.json");
const binderPartnerCatalogPath = requireFile("public/data/partners/binder-partners.v1.json");
requireFile("docs/gift-commerce-release-gates.md");
requireFile("docs/cardtrader-release-gate.md");
requireFile("docs/cardtrader-secret-operations.md");
requireFile("scripts/release-evidence.mjs");
requireFile("data/marketplace/cardtrader-set-review.json");
requireFile("data/marketplace/cardtrader-set-candidates.json");
requireFile("data/marketplace/cardtrader-set-exclusions.json");
const cardtraderWorkflowPath = requireFile(".github/workflows/cardtrader-discovery.yml");
const exampleEnvironmentPath = requireFile(".env.example");
requireText("out/_headers", [
  "X-Content-Type-Options: nosniff",
  "X-Frame-Options: DENY",
  "Permissions-Policy:",
  "Content-Security-Policy:",
  "connect-src 'self' https://api.tcgdex.net",
  "img-src 'self' https://assets.tcgdex.net",
  "frame-ancestors 'none'",
  "object-src 'none'",
]);
requireText("next.config.ts", ['output: "export"', "unoptimized: true"]);
requireText("src/config/feature-flags.ts", [
  "designPreview: false",
  "pricing: false",
  "giftBuilderPricing: false",
  'giftPriceEstimates: process.env.NEXT_PUBLIC_FEATURE_GIFT_PRICE_ESTIMATES !== "false"',
  "giftBudgetGuarantee: false",
  'artworkReview: process.env.NEXT_PUBLIC_FEATURE_ARTWORK_REVIEW === "true" || process.env.NODE_ENV !== "production"',
  'smartSearch: process.env.NEXT_PUBLIC_FEATURE_SMART_SEARCH !== "false"',
  "tcgplayerPrefill: false",
  "cardtraderPreview: true",
  "cardtraderCatalog: false",
  "cardtraderImages: false",
  "cardtraderPrices: false",
  "cardtraderWishlist: false",
  "cardtraderCommerce: false",
  "publicSharing: false",
]);
requireText(".github/workflows/sync-public-data.yml", [
  "permissions:",
  "contents: write",
  "git add public/data/catalog public/data/marketplace data/semantic/catalog-coverage.json",
  "npm run release:check",
]);
requireText(".github/workflows/cardtrader-discovery.yml", [
  "workflow_dispatch:",
  "contents: read",
  "CARDTRADER_API_TOKEN: ${{ secrets.CARDTRADER_API_TOKEN }}",
  "npm run cardtrader:discover",
  "npm run cardtrader:audit",
  "npm run cardtrader:blueprint-id-audit",
  "npm run cardtrader:review-report",
  ".cardtrader/discovery-summary.json",
  ".cardtrader/mapping-audit.json",
  ".cardtrader/mapping-review.md",
  ".cardtrader/blueprint-id-audit.json",
  "if-no-files-found: error",
  "retention-days: 7",
]);
requireText(".github/workflows/ci.yml", [
  "npm run release:evidence",
]);

for (const workflow of [
  ".github/workflows/ci.yml",
  ".github/workflows/sync-public-data.yml",
  ".github/workflows/cardtrader-discovery.yml",
]) {
  const content = readFileSync(join(root, workflow), "utf8");
  for (const line of content.split("\n").filter((value) => value.includes("uses:"))) {
    if (!/@[a-f0-9]{40}(?:\s+#|\s*$)/.test(line)) failures.push(`${workflow} contains an action that is not pinned to a full commit SHA: ${line.trim()}`);
  }
  if (/wrangler|cloudflare\/pages-action/i.test(content)) failures.push(`${workflow} must not deploy; Cloudflare Pages Git integration owns deployment.`);
}

if (existsSync(cardtraderWorkflowPath)) {
  const workflow = readFileSync(cardtraderWorkflowPath, "utf8");
  if (/^\s*schedule:/m.test(workflow)) failures.push("CardTrader discovery must remain manually triggered.");
  if (/contents:\s*write/.test(workflow)) failures.push("CardTrader discovery must not receive repository write access.");
  for (const forbidden of ["marketplace/products", "wishlist", "cart/add", "purchase"]) {
    if (workflow.toLocaleLowerCase("en-US").includes(forbidden)) {
      failures.push(`CardTrader discovery workflow contains forbidden capability: ${forbidden}`);
    }
  }
  const secretReferences = workflow.match(/secrets\.CARDTRADER_API_TOKEN/g) ?? [];
  if (secretReferences.length !== 1) {
    failures.push("CardTrader discovery must reference CARDTRADER_API_TOKEN exactly once in its step environment.");
  }
  const uploadStep = workflow.slice(workflow.indexOf("Upload redacted audit artifacts"));
  if (/\.cardtrader\/discovery\.json/.test(uploadStep)) {
    failures.push("CardTrader discovery must never upload the raw discovery snapshot.");
  }
}

if (existsSync(join(root, "out/design-preview/index.html"))) {
  failures.push("The disabled design preview was emitted into the production export.");
}

if (existsSync(exampleEnvironmentPath)) {
  const exampleEnvironment = readFileSync(exampleEnvironmentPath, "utf8");
  if (!/^CARDTRADER_API_TOKEN=\s*$/m.test(exampleEnvironment)) {
    failures.push(".env.example must contain an empty CARDTRADER_API_TOKEN placeholder.");
  }
  if (/NEXT_PUBLIC_CARDTRADER_API_TOKEN/.test(exampleEnvironment)) {
    failures.push("The CardTrader token must never be exposed as a NEXT_PUBLIC variable.");
  }
}

if (existsSync(binderPartnerCatalogPath)) {
  try {
    const catalog = JSON.parse(readFileSync(binderPartnerCatalogPath, "utf8"));
    if (catalog.schemaVersion !== 1 || typeof catalog.enabled !== "boolean" || !Array.isArray(catalog.partners)) {
      failures.push("Binder partner catalog has an invalid top-level format.");
    } else if (catalog.enabled) {
      const active = catalog.partners.filter((partner) => partner.enabled);
      if (!active.length) failures.push("Enabled binder partner catalog has no enabled offer.");
      for (const partner of active) {
        if (!partner.destinationUrl?.startsWith("https://")) failures.push(`Binder partner ${partner.id ?? "unknown"} has no HTTPS destination.`);
        if (!partner.reviewAfter || Date.parse(partner.reviewAfter) < Date.now()) failures.push(`Binder partner ${partner.id ?? "unknown"} is stale.`);
        if (!Array.isArray(partner.evidenceUrls) || !partner.evidenceUrls.length) failures.push(`Binder partner ${partner.id ?? "unknown"} has no evidence URLs.`);
        if (partner.affiliate?.enabled && !partner.affiliate.text?.trim()) failures.push(`Binder partner ${partner.id ?? "unknown"} has no affiliate disclosure.`);
      }
    }
  } catch {
    failures.push("Binder partner catalog is not valid JSON.");
  }
}

for (const scaffoldAsset of ["public/next.svg", "public/vercel.svg", "src/app/favicon.ico"]) {
  if (existsSync(join(root, scaffoldAsset))) failures.push(`Unused Create Next App scaffold asset is still present: ${scaffoldAsset}`);
}

const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const allowedLicenses = new Set(["MIT", "ISC", "Apache-2.0", "BSD-2-Clause", "BSD-3-Clause"]);
for (const dependencyName of Object.keys(packageJson.dependencies ?? {})) {
  const dependencyPackage = JSON.parse(readFileSync(join(root, "node_modules", dependencyName, "package.json"), "utf8"));
  if (!allowedLicenses.has(dependencyPackage.license)) {
    failures.push(`Runtime dependency ${dependencyName}@${dependencyPackage.version} has an unreviewed license: ${dependencyPackage.license ?? "missing"}`);
  }
}

if (failures.length) {
  console.error(`Release checks failed (${failures.length}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log("Release checks passed: static output, help route, headers, feature gates, workflows and runtime licenses.");
}
