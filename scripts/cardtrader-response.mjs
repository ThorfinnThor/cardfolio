/** Normalize the collection shapes returned by different CardTrader endpoints. */
export function asCollection(payload, label) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") {
    throw new Error(`CardTrader ${label} response is not a collection.`);
  }

  for (const wrapper of ["data", "items", "results"]) {
    if (Object.hasOwn(payload, wrapper)) return asCollection(payload[wrapper], label);
  }

  const values = Object.values(payload);
  if (values.every((item) => item && typeof item === "object" && !Array.isArray(item))) {
    return values;
  }

  throw new Error(`CardTrader ${label} response has an unsupported collection shape.`);
}
