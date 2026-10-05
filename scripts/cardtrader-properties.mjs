const primitive = (value) =>
  (typeof value === "string" || typeof value === "boolean" || typeof value === "number")
    ? value
    : undefined;

function addValue(values, value) {
  const safe = primitive(value);
  if (safe !== undefined) values.add(JSON.stringify(safe));
}

function sortValues(values) {
  return [...values]
    .map((value) => JSON.parse(value))
    .sort((left, right) => String(left).localeCompare(String(right), "en-US", { numeric: true }));
}

/**
 * Creates a small, safe summary of CardTrader property definitions.
 * It intentionally copies only primitive property metadata and never card rows.
 */
export function summarizeProperties(groups) {
  const definitions = new Map();

  for (const { properties = [], source = "unknown" } of groups) {
    for (const property of properties) {
      if (!property || typeof property !== "object" || typeof property.name !== "string" || !property.name) continue;
      const existing = definitions.get(property.name) ?? {
        name: property.name,
        types: new Set(),
        defaultValues: new Set(),
        possibleValues: new Set(),
        occurrenceCount: 0,
        categoryCount: 0,
        blueprintCount: 0,
      };

      existing.occurrenceCount += 1;
      if (source === "category") existing.categoryCount += 1;
      if (source === "blueprint") existing.blueprintCount += 1;
      if (typeof property.type === "string" && property.type) existing.types.add(property.type);
      addValue(existing.defaultValues, property.default_value);
      for (const value of Array.isArray(property.possible_values) ? property.possible_values : []) {
        addValue(existing.possibleValues, value);
      }
      definitions.set(property.name, existing);
    }
  }

  return [...definitions.values()]
    .map((property) => ({
      name: property.name,
      types: [...property.types].sort(),
      defaultValues: sortValues(property.defaultValues),
      possibleValues: sortValues(property.possibleValues),
      occurrenceCount: property.occurrenceCount,
      categoryCount: property.categoryCount,
      blueprintCount: property.blueprintCount,
    }))
    .sort((left, right) => left.name.localeCompare(right.name, "en-US"));
}
