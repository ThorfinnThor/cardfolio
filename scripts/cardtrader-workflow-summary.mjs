import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const discoveryPath = resolve(process.argv[2] ?? ".cardtrader/discovery-summary.json");
const auditPath = resolve(process.argv[3] ?? ".cardtrader/mapping-audit.json");
const discovery = JSON.parse(await readFile(discoveryPath, "utf8"));
const audit = JSON.parse(await readFile(auditPath, "utf8"));
const nameAudited = audit.decisions?.filter((decision) => decision.cardNameCoverage?.status === "complete") ?? [];
const fullNormalizedNameCoverage = nameAudited.filter((decision) => decision.cardNameCoverage.normalizedCoverage === 1);

const rows = [
  "## CardTrader Read-only-Discovery",
  "",
  `- Authentifizierung: ${discovery.authentication?.verified ? "erfolgreich" : "nicht bestätigt"}`,
  `- Geprüfte CardTrader-Expansionen: ${discovery.summary?.sampledExpansionCount ?? 0}`,
  `- Gelesene Blueprints: ${discovery.summary?.blueprintCount ?? 0}`,
  `- TCGdex-Setdatensätze im Mapping-Audit: ${audit.catalogSetCount ?? 0}`,
  `- Verifiziert: ${audit.counts?.verified ?? 0}`,
  `- Manuell zu prüfen: ${audit.counts?.["review-required"] ?? 0}`,
  `- Mehrdeutig: ${audit.counts?.ambiguous ?? 0}`,
  `- Nicht zugeordnet: ${audit.counts?.unmapped ?? 0}`,
  `- Kandidaten mit englischem Kartennamen-Abgleich: ${nameAudited.length}`,
  `- Davon mit vollständiger normalisierter Namensabdeckung: ${fullNormalizedNameCoverage.length}`,
  "",
  "> Der rohe Discovery-Snapshot wurde nicht als Artifact hochgeladen. Preise, Marketplace-Produkte, Bild-URLs, Wishlists, Warenkörbe und Käufe wurden nicht angefordert beziehungsweise nicht veröffentlicht.",
];

console.log(rows.join("\n"));
