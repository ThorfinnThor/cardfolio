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
  src: "./fonts/figtree-latin-wght-normal.woff2",
  weight: "300 900",
  variable: "--font-ui",
  display: "swap",
});

const monoFont = localFont({
  src: "./fonts/jetbrains-mono-latin-wght-normal.woff2",
  weight: "100 800",
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
