/** Stable public routes. Add new resources here without moving existing pages. */
export const characterLedger = "https://docs.google.com/spreadsheets/d/1QWx9Q0bw0CI3B1yt-mPkOCjboYCdxUqwLnUt4sA06oI/edit";
export const navigation = [
  { href: "/", label: "Gazetteer", description: "The five realms and their visual worlds" },
  { href: "/campaign-primer/", label: "Primer", description: "The world, Xiiom, and the first expedition" },
  { href: "/map/", label: "Map", description: "Explore the party’s map of Region I" },
  { href: "/house-rules/", label: "House Rules", description: "Campaign rulings and table reference" },
  { href: characterLedger, label: "Characters", description: "Open the shared Google Sheets character ledger", external: true },
] as const;

export type SearchEntry = { title: string; href: string; type: string; excerpt: string; keywords?: string };
export type DocumentHeading = { id: string; title: string; level: number };
