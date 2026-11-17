import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

import ts from "typescript";
import { describe, expect, it } from "vitest";

import { translateGermanText } from "@/i18n/locale";

/**
 * Every German text the app renders on its own (the only text of an element, or an attribute such as aria-label) needs
 * an English translation, or English visitors see German. Texts that sit next to other nodes or elements are
 * translated as part of a sentence and cannot be judged here.
 */
const APP_FILES = [
  "src/components/foundation",
  "src/app/help",
  "src/app/kinder",
  "src/app/geschenk",
  "src/app/app",
];
/** Developer tool, not shown to visitors. */
const SKIPPED = ["ArtworkReviewWorkspace.tsx"];
/** Rendered German-only on purpose (the English branch is a separate element) or not text a visitor reads. */
const ALLOWED = new Set<string>([]);

const ATTRIBUTES = new Set(["aria-label", "aria-description", "placeholder", "title", "alt"]);
const GERMAN_WORDS = new Set(("der die das den dem des und oder nicht für mit ein eine einen einem einer zu zum zur auf bei von im am ist wird werden kann können "
  + "du dein deine deinen deiner dich dir noch sind hat haben nach vor über unter aus wenn dann auch nur jetzt hier wähle klicke karte karten seite seiten fehlt "
  + "vorhanden zustand ausführung wählen öffnen speichern abbrechen schließen weiter zurück sie er es wir ihr ihre mehr kein keine keinen sehr bitte wurde wurden").split(" "));

function looksGerman(text: string): boolean {
  if (/[äöüÄÖÜß]/.test(text)) return true;
  return (text.toLowerCase().match(/[a-zäöüß]+/g) ?? []).some((word) => GERMAN_WORDS.has(word));
}

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    return statSync(full).isDirectory() ? files(full) : name.endsWith(".tsx") && !SKIPPED.includes(name) ? [full] : [];
  });
}

describe("English translations", () => {
  it("cover every standalone German text and attribute in the app", () => {
    const missing: string[] = [];
    for (const file of APP_FILES.flatMap(files)) {
      const source = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
      const check = (node: ts.Node, raw: string) => {
        const text = raw.replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
        if (!/\p{L}{2,}/u.test(text) || !looksGerman(text) || ALLOWED.has(text)) return;
        if (translateGermanText(text) === text) missing.push(`${file}:${source.getLineAndCharacterOfPosition(node.getStart()).line + 1} ${text}`);
      };
      const visit = (node: ts.Node) => {
        if ((ts.isJsxElement(node)) && node.children.length === 1 && ts.isJsxText(node.children[0]!)) check(node.children[0]!, node.children[0]!.text);
        if (ts.isJsxAttribute(node) && ATTRIBUTES.has(node.name.getText()) && node.initializer && ts.isStringLiteral(node.initializer)) check(node, node.initializer.text);
        ts.forEachChild(node, visit);
      };
      visit(source);
    }
    expect(missing).toEqual([]);
  });
});
