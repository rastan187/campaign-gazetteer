import type { Metadata } from "next";
import { CharacterApp } from "./character-app";

export const metadata: Metadata = {
  title: "Character Ledger | Campaign Gazetteer",
  description:
    "A mobile-first Hyperborea character and inventory tracker prototype.",
  openGraph: {
    title: "Character Ledger",
    description:
      "A mobile-first Hyperborea character and inventory tracker prototype.",
    images: [{ url: "/og-ledger.png", width: 1728, height: 909 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Character Ledger",
    description:
      "A mobile-first Hyperborea character and inventory tracker prototype.",
    images: ["/og-ledger.png"],
  },
};

export default function CharactersPage() {
  return <CharacterApp />;
}
