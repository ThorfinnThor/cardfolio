"use client";

import { CONSENT_REOPEN_EVENT } from "@/config/analytics";

/** Footer link that opens the analytics question again. */
export function CookieSettingsButton({ label, className }: { label: string; className?: string }) {
  return <button type="button" className={className} onClick={() => window.dispatchEvent(new Event(CONSENT_REOPEN_EVENT))}>{label}</button>;
}
