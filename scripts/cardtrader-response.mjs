/** Normalize the collection shapes returned by different CardTrader endpoints. */
export function asCollection(payload, label) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") {
    throw new Error(`CardTrader ${label} response is not a collection.`);
  }

  for (const wrapper of ["array", "data", "items", "results", label]) {
    if (Object.hasOwn(payload, wrapper)) return asCollection(payload[wrapper], label);
  }

  const values = Object.values(payload);
  const identifiedRecords = values.filter((item) => (
    item && typeof item === "object" && !Array.isArray(item) && Object.hasOwn(item, "id")
  ));
  if (identifiedRecords.length) return identifiedRecords;
  if (values.every((item) => item && typeof item === "object" && !Array.isArray(item))) {
    return values;
  }

  const shape = Object.entries(payload)
    .slice(0, 12)
    .map(([key, value]) => `${key}:${Array.isArray(value) ? "array" : typeof value}`)
    .join(",");
  throw new Error(`CardTrader ${label} response has an unsupported collection shape (${shape || "empty"}).`);
}
