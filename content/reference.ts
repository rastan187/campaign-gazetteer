import { readFileSync } from "node:fs";
import { join } from "node:path";
import { nations } from "./site";
import { navigation, type DocumentHeading, type SearchEntry } from "./navigation";
import map from "./region1-player-map.json";
import sectionIds from "./section-ids.json";

export function slugify(text: string): string {
  return text.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function headingId(title: string): string {
  return (sectionIds as Record<string, string>)[title] ?? slugify(title);
}

export function readReference(name: "house-rules" | "campaign-primer") {
  const markdown = readFileSync(join(process.cwd(), "content", `${name}.md`), "utf8");
  const headings: DocumentHeading[] = [...markdown.matchAll(/^(#{2,4})\s+(.+)$/gm)].map((match) => ({
    level: match[1].length, title: match[2].trim(), id: headingId(match[2].trim()),
  }));
  return { markdown, headings };
}

function plainText(text: string) {
  return text.replace(/!\[[^\]]*\]\([^)]*\)/g, "").replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#*>_|`]/g, "").replace(/\s+/g, " ").trim();
}

/** Only public writing and the already-sanitized player map enter this index. */
export function publicSearchEntries(): SearchEntry[] {
  const entries: SearchEntry[] = navigation.filter((item) => item.label !== "Characters").map((item) => ({
    title: item.label === "Primer" ? "Campaign Primer" : item.label,
    href: item.href, type: "Page", excerpt: item.description,
  }));
  for (const name of ["house-rules", "campaign-primer"] as const) {
    const { markdown, headings } = readReference(name);
    const sections = markdown.split(/^#{2,4}\s+.+$/m).slice(1);
    headings.forEach((heading, index) => entries.push({
      title: heading.title, href: `/${name}/#${heading.id}`,
      type: name === "house-rules" ? "House rule" : "Primer",
      excerpt: plainText(sections[index] ?? "").slice(0, 240),
      keywords: name === "house-rules" ? "rules reference" : "world setting",
    }));
  }
  for (const nation of nations) entries.push({
    title: nation.name, href: `/#${nation.id}`, type: "Realm",
    excerpt: nation.description, keywords: `${nation.capital} ${nation.siteName} ${nation.siteDescription}`,
  });
  for (const cell of map.cells.filter((cell) => cell.title)) entries.push({
    title: cell.title, href: `/map/#hex-${cell.coordinate}`, type: "Map location",
    excerpt: `Hex ${cell.coordinate}. ${cell.description}`.slice(0, 240), keywords: cell.coordinate,
  });
  return entries;
}
