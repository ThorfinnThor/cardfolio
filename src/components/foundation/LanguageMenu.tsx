"use client";

import { Languages } from "lucide-react";

import { useLocale } from "@/i18n/locale";

import styles from "./language-menu.module.css";

export function LanguageMenu({ className = "" }: { className?: string }) {
  const { locale, setLocale } = useLocale();

  return (
    <div className={`${styles.menu} ${className}`.trim()} aria-label={locale === "de" ? "Seitensprache" : "Website language"} data-no-translate>
      <Languages size={16} aria-hidden="true" />
      <button type="button" aria-pressed={locale === "de"} onClick={() => setLocale("de")}>DE</button>
      <span aria-hidden="true" />
      <button type="button" aria-pressed={locale === "en"} onClick={() => setLocale("en")}>EN</button>
    </div>
  );
}

