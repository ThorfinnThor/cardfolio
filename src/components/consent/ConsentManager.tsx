"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { CONSENT_REOPEN_EVENT } from "@/config/analytics";
import { legalPath } from "@/content/routes";
import { type ConsentDecision, readConsent, writeConsent } from "@/data/consent/consent";
import { disableAnalytics, enableAnalytics, trackPageView } from "@/data/consent/google-analytics";
import { fixedLocaleForPath } from "@/i18n/fixed-locale";
import { useLocale } from "@/i18n/locale";

import styles from "./consent.module.css";

const TEXT = {
  de: {
    title: "Darf Your Card Binder die Nutzung messen?",
    body: "Mit deiner Erlaubnis misst Google Analytics, welche Seiten genutzt werden (Seitenaufrufe, Herkunft, Gerät). Dabei setzt Google Cookies und erhält Daten, auch in den USA. Ohne deine Erlaubnis wird nichts von Google geladen, und alles andere funktioniert genauso.",
    more: "Mehr in der Datenschutzerklärung",
    allow: "Erlauben",
    deny: "Ablehnen",
    note: "Du kannst deine Wahl jederzeit unter „Cookie-Einstellungen“ im Seitenfuß ändern.",
  },
  en: {
    title: "May Your Card Binder measure usage?",
    body: "With your permission, Google Analytics measures which pages are used (page views, origin, device). Google sets cookies and receives data, including in the USA. Without your permission nothing from Google is loaded, and everything else works the same.",
    more: "More in the privacy policy",
    allow: "Allow",
    deny: "Decline",
    note: "You can change your choice at any time under “Cookie settings” in the footer.",
  },
} as const;

/**
 * Asks once whether Google Analytics may run, remembers the answer and applies it. Until the visitor agrees nothing
 * of Google's is requested. The two answers are equally prominent, and the footer link asks again.
 */
export function ConsentManager() {
  const pathname = usePathname();
  const { locale } = useLocale();
  const [ready, setReady] = useState(false);
  const [decision, setDecision] = useState<ConsentDecision>();
  const [open, setOpen] = useState(false);
  const firstButton = useRef<HTMLButtonElement>(null);
  const reopened = useRef(false);
  const lastTracked = useRef<string | undefined>(undefined);

  useEffect(() => {
    // Read after mount: the static page has no stored choice, so the first render must match it.
    queueMicrotask(() => {
      const stored = readConsent();
      setDecision(stored);
      setOpen(stored === undefined);
      setReady(true);
    });
    const reopen = () => { reopened.current = true; setOpen(true); };
    window.addEventListener(CONSENT_REOPEN_EVENT, reopen);
    return () => window.removeEventListener(CONSENT_REOPEN_EVENT, reopen);
  }, []);

  useEffect(() => {
    if (decision !== "granted") return;
    enableAnalytics();
    if (lastTracked.current !== pathname) {
      lastTracked.current = pathname;
      trackPageView(pathname);
    }
  }, [decision, pathname]);

  useEffect(() => {
    if (open && reopened.current) firstButton.current?.focus();
  }, [open]);

  function choose(next: ConsentDecision) {
    writeConsent(next);
    if (next === "denied") disableAnalytics();
    setDecision(next);
    setOpen(false);
    reopened.current = false;
  }

  if (!ready || !open) return null;
  const language = fixedLocaleForPath(pathname) ?? locale;
  const text = TEXT[language];
  return (
    <div className={styles.banner} role="dialog" aria-modal="false" aria-labelledby="ycb-consent-title" lang={language} data-no-translate>
      <div className={styles.text}>
        <h2 id="ycb-consent-title">{text.title}</h2>
        <p>{text.body} <Link href={legalPath(language, "privacy")}>{text.more}</Link></p>
        <small>{text.note}</small>
      </div>
      <div className={styles.actions}>
        <button type="button" ref={firstButton} onClick={() => choose("denied")}>{text.deny}</button>
        <button type="button" onClick={() => choose("granted")}>{text.allow}</button>
      </div>
    </div>
  );
}
