import type { Metadata } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";
import "./globals.css";

import { OG_IMAGE, SITE_ORIGIN } from "@/config/site";
import { FIXED_ENGLISH_PREFIX, FIXED_GERMAN_PREFIXES } from "@/i18n/fixed-locale";

import { Providers } from "./providers";

const displayFont = localFont({
  src: "./fonts/unbounded-latin-wght-normal.woff2",
  weight: "200 900",
  variable: "--font-display",
  display: "swap",
});

const uiFont = localFont({
  src: "./fonts/manrope-latin-variable.woff2",
  weight: "200 800",
  variable: "--font-ui",
  display: "swap",
});

const monoFont = localFont({
  src: [
    { path: "./fonts/ibm-plex-mono-latin-400.woff2", weight: "400" },
    { path: "./fonts/ibm-plex-mono-latin-500.woff2", weight: "500" },
    { path: "./fonts/ibm-plex-mono-latin-600.woff2", weight: "600" },
    { path: "./fonts/ibm-plex-mono-latin-700.woff2", weight: "700" },
  ],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: "Cardfolio",
  description: "Pokémon-Binder als Geschenk zusammenstellen: Lieblings-Pokémon wählen, Karten ansehen und die Kaufliste für Cardmarket oder TCGplayer vorbereiten.",
  openGraph: { images: [OG_IMAGE] },
};

/* Applies the stored or system colour mode before the first paint to avoid a light/dark flash. */
const themeScript = `(function(){try{var s=localStorage.getItem("cardfolio-theme");var t=s==="tag"||s==="nacht"?s:(window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"nacht":"tag");document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme="nacht";}})();`;

/* Uses the browser language only on the first visit. A manual choice is stored locally and always wins. */
const localeScript = `(function(){try{var q=location.pathname;if(q.slice(-1)!=="/")q+="/";var f=q==="/"?"de":q.indexOf(${JSON.stringify(FIXED_ENGLISH_PREFIX)})===0?"en":(${JSON.stringify(FIXED_GERMAN_PREFIXES)}.some(function(x){return q.indexOf(x)===0})?"de":null);var s=localStorage.getItem("cardfolio-locale");var p=(navigator.languages&&navigator.languages[0])||navigator.language||"en";var l=f||(s==="de"||s==="en"?s:(String(p).toLowerCase().indexOf("de")===0?"de":"en"));document.documentElement.dataset.locale=l;document.documentElement.lang=l;}catch(e){document.documentElement.dataset.locale="de";document.documentElement.lang="de";}})();`;

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="de" className={`h-full antialiased ${displayFont.variable} ${uiFont.variable} ${monoFont.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script dangerouslySetInnerHTML={{ __html: localeScript }} />
      </head>
      <body><Providers>{children}</Providers></body>
    </html>
  );
}
