/**
 * Lets a pattern translate a part it captured ("Mindestzustand: <condition>"). locale.tsx registers the real
 * translator at load time; the indirection avoids an import cycle between the dictionary files and locale.tsx.
 */
let translateNested: (value: string) => string = (value) => value;

export function registerNestedTranslator(translate: (value: string) => string): void {
  translateNested = translate;
}

export function nested(value: string): string {
  return translateNested(value);
}
