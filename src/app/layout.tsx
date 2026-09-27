import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cardfolio",
  description: "Lokaler Wunschbinder für physische Pokémon-Sammelkarten.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="de" className="h-full antialiased">
      <body>{children}</body>
    </html>
  );
}
