"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

type Theme = "tag" | "nacht";

const STORAGE_KEY = "cardfolio-theme";
const listeners = new Set<() => void>();

function readTheme(): Theme {
  if (typeof document === "undefined") return "nacht";
  return document.documentElement.dataset.theme === "tag" ? "tag" : "nacht";
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Storage can be unavailable (private mode); the mode then applies to this visit only.
  }
  listeners.forEach((listener) => listener());
}

/** Switches between the shared "Tag" (light) and "Nacht" (dark) token sets. UI preference only. */
export function ThemeToggle({ className }: { className?: string }) {
  const theme = useSyncExternalStore(subscribe, readTheme, () => "nacht" as Theme);
  const next: Theme = theme === "nacht" ? "tag" : "nacht";

  return (
    <button
      type="button"
      className={className}
      onClick={() => applyTheme(next)}
      aria-label={next === "tag" ? "Zum hellen Modus wechseln" : "Zum dunklen Modus wechseln"}
      title={next === "tag" ? "Tag-Modus" : "Nacht-Modus"}
    >
      {theme === "nacht" ? <Sun aria-hidden="true" size={16} /> : <Moon aria-hidden="true" size={16} />}
    </button>
  );
}
