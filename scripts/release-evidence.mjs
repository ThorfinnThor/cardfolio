import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";
import { gzipSync } from "node:zlib";

const root = process.cwd();
const outputRoot = join(root, "out");

if (!existsSync(outputRoot)) {
  console.error("Static output is missing. Run npm run build before npm run release:evidence.");
  process.exit(1);
}

function filesBelow(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesBelow(path) : [path];
  });
}

function bytes(paths) {
  return paths.reduce((total, path) => total + statSync(path).size, 0);
}

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(root, relativePath), "utf8"));
}

function formatBytes(value) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 ** 2) return `${(value / 1024).toFixed(1)} KiB`;
  return `${(value / 1024 ** 2).toFixed(2)} MiB`;
}

const outputFiles = filesBelow(outputRoot);
const javascriptFiles = outputFiles.filter((path) => extname(path) === ".js");
const cssFiles = outputFiles.filter((path) => extname(path) === ".css");
const publicDataFiles = outputFiles.filter((path) => relative(outputRoot, path).startsWith(`data${process.platform === "win32" ? "\\" : "/"}`));
const rasterFiles = outputFiles.filter((path) => [".gif", ".jpeg", ".jpg", ".png", ".webp"].includes(extname(path).toLowerCase()));
// The guide's screenshots of Cardmarket's pages (howto/) are the only allowed rasters: no card artwork, names blurred.
const howtoScreenshotPrefix = `howto${process.platform === "win32" ? "\\" : "/"}`;
const howtoScreenshots = rasterFiles.filter((path) => relative(outputRoot, path).startsWith(howtoScreenshotPrefix));
// The text-only social preview (public/og-cardfolio.png) is the second named exception: it shows no card artwork.
const socialPreviewFiles = rasterFiles.filter((path) => relative(outputRoot, path) === "og-cardfolio.png");
const rasterCardCandidates = rasterFiles.filter((path) => !howtoScreenshots.includes(path) && !socialPreviewFiles.includes(path));
const semanticPath = join(root, "public/data/semantic/card-artwork-search-v1.json");
const semanticBytes = readFileSync(semanticPath);
const manifest = readJson("public/data/catalog/manifest.json");
const semanticCoverage = readJson("data/semantic/catalog-coverage.json");
const evaluation = readJson("data/semantic/search-evaluation-v1.json");
const cardtraderReview = readJson("data/marketplace/cardtrader-set-review.json");
const cardtraderExclusions = readJson("data/marketplace/cardtrader-set-exclusions.json");

const evidence = {
  commit: execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim(),
  staticOutput: {
    files: outputFiles.length,
    rawBytes: bytes(outputFiles),
    javascript: {
      files: javascriptFiles.length,
      rawBytes: bytes(javascriptFiles),
      gzipBytes: javascriptFiles.reduce((total, path) => total + gzipSync(readFileSync(path), { level: 9 }).byteLength, 0),
    },
    css: {
      files: cssFiles.length,
      rawBytes: bytes(cssFiles),
      gzipBytes: cssFiles.reduce((total, path) => total + gzipSync(readFileSync(path), { level: 9 }).byteLength, 0),
    },
    publicDataBytes: bytes(publicDataFiles),
    bundledRasterImageFiles: rasterCardCandidates.map((path) => relative(outputRoot, path)),
    howtoScreenshotFiles: howtoScreenshots.map((path) => relative(outputRoot, path)),
  },
  semanticSearch: {
    rawBytes: semanticBytes.byteLength,
    gzipBytes: gzipSync(semanticBytes, { level: 9 }).byteLength,
    evaluationQueries: evaluation.queries.length,
    indexedCards: semanticCoverage.indexedCardCount,
    eligibleCards: semanticCoverage.eligibleSourceCardCount,
    backlogCards: semanticCoverage.backlogCount,
    blockedSourceCards: semanticCoverage.blockedSourceCardCount,
  },
  catalog: {
    englishSets: manifest.counts.en,
    germanSets: manifest.counts.de,
    tcgplayerMappedSets: manifest.tcgplayer.mappedSets,
    tcgplayerUnavailableSets: manifest.tcgplayer.unavailableSets,
    tcgplayerMappedCards: manifest.tcgplayer.mappedCards,
    tcgplayerUnmappedCards: manifest.tcgplayer.unmappedCards,
  },
  cardtrader: {
    reviewedAt: cardtraderReview.reviewedAt,
    verifiedLocaleMappings: cardtraderReview.mappings.length,
    explicitExclusions: cardtraderExclusions.exclusions.length,
    productiveFlagsExpectedOff: ["catalog", "wishlist", "commerce"],
  },
};

if (process.argv.includes("--json")) {
  console.log(JSON.stringify(evidence, null, 2));
} else {
  console.log(`Release evidence for ${evidence.commit}`);
  console.log(`Static export: ${evidence.staticOutput.files} files, ${formatBytes(evidence.staticOutput.rawBytes)}`);
  console.log(`JavaScript: ${evidence.staticOutput.javascript.files} files, ${formatBytes(evidence.staticOutput.javascript.rawBytes)} raw / ${formatBytes(evidence.staticOutput.javascript.gzipBytes)} gzip`);
  console.log(`CSS: ${evidence.staticOutput.css.files} files, ${formatBytes(evidence.staticOutput.css.rawBytes)} raw / ${formatBytes(evidence.staticOutput.css.gzipBytes)} gzip`);
  console.log(`Public data: ${formatBytes(evidence.staticOutput.publicDataBytes)}`);
  console.log(`Bundled raster images: ${evidence.staticOutput.bundledRasterImageFiles.length} (plus ${evidence.staticOutput.howtoScreenshotFiles.length} guide screenshots under howto/ and ${socialPreviewFiles.length} social preview)`);
  console.log(`Semantic index: ${formatBytes(evidence.semanticSearch.rawBytes)} raw / ${formatBytes(evidence.semanticSearch.gzipBytes)} gzip; ${evidence.semanticSearch.indexedCards}/${evidence.semanticSearch.eligibleCards} indexed; ${evidence.semanticSearch.evaluationQueries} evaluation queries`);
  console.log(`Catalog: ${evidence.catalog.englishSets} EN sets, ${evidence.catalog.germanSets} DE sets; TCGplayer ${evidence.catalog.tcgplayerMappedCards} mapped cards / ${evidence.catalog.tcgplayerUnmappedCards} unresolved`);
  console.log(`CardTrader: ${evidence.cardtrader.verifiedLocaleMappings} verified locale mappings, ${evidence.cardtrader.explicitExclusions} explicit exclusions; CardTrader catalog (marketplace mode), wishlist and commerce flags remain off`);
}

if (rasterCardCandidates.length) {
  console.error("Release evidence failed: raster image files were bundled into the static export.");
  process.exitCode = 1;
}
