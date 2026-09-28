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
  "tcgplayerPrefill: false",
  "cardtraderCommerce: false",
  "publicSharing: false",
]);
requireText(".github/workflows/sync-public-data.yml", [
  "permissions:",
  "contents: write",
  "git add public/data/catalog public/data/marketplace",
  "npm run release:check",
]);

for (const workflow of [".github/workflows/ci.yml", ".github/workflows/sync-public-data.yml"]) {
  const content = readFileSync(join(root, workflow), "utf8");
  for (const line of content.split("\n").filter((value) => value.includes("uses:"))) {
    if (!/@[a-f0-9]{40}(?:\s+#|\s*$)/.test(line)) failures.push(`${workflow} contains an action that is not pinned to a full commit SHA: ${line.trim()}`);
  }
  if (/wrangler|cloudflare\/pages-action/i.test(content)) failures.push(`${workflow} must not deploy; Cloudflare Pages Git integration owns deployment.`);
}

if (existsSync(join(root, "out/design-preview/index.html"))) {
  failures.push("The disabled design preview was emitted into the production export.");
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
