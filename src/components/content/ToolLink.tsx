"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import type { PageLanguage } from "@/config/site";

const LOCALE_STORAGE_KEY = "cardfolio-locale";

/** Opens the binder tool in the language of the page the visitor came from. */
export function ToolLink({ href, language, className, children }: { href: string; language: PageLanguage; className?: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => {
        try {
          window.localStorage.setItem(LOCALE_STORAGE_KEY, language);
        } catch {
          /* Storage can be unavailable; the tool then falls back to the browser language. */
        }
      }}
    >
      {children}
    </Link>
  );
}
