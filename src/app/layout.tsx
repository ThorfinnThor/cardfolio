import type { Metadata } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";
import "./globals.css";

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
  title: "Cardfolio",
  description: "Lokaler Wunschbinder für physische Pokémon-Sammelkarten.",
};

/* Applies the stored or system colour mode before the first paint to avoid a light/dark flash. */
const themeScript = `(function(){try{var s=localStorage.getItem("cardfolio-theme");var t=s==="tag"||s==="nacht"?s:(window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"nacht":"tag");document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme="nacht";}})();`;

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="de" className={`h-full antialiased ${displayFont.variable} ${uiFont.variable} ${monoFont.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
