export function formatMoney(amountMinor: number | undefined, currency: string): string {
  if (amountMinor === undefined) return "Preis unbekannt";
  return new Intl.NumberFormat("de-DE", { style: "currency", currency }).format(amountMinor / 100);
}

export function formatDate(value: string | undefined): string {
  if (!value) return "Zeitpunkt unbekannt";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "Zeitpunkt unbekannt" : new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(parsed);
}

/** The shop's name for a button label, taken from the link's host. */
export function shopName(url: string): string {
  const host = (() => { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; } })();
  if (host.includes("amazon")) return "Amazon";
  if (host.includes("vaultx")) return "Vault X";
  if (host.includes("ultimateguard")) return "Ultimate Guard";
  return host;
}
