import type { Metadata } from "next";
import Link from "next/link";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import styles from "./campaign-primer.module.css";

const assetBase = process.env.GITHUB_PAGES === "true" ? "/campaign-gazetteer" : "";

export const metadata: Metadata = {
  title: "Campaign Primer · Campaign Gazetteer",
  description: "The world, starting region, and central megadungeon of the campaign.",
  openGraph: {
    title: "Campaign Primer",
    description: "The world, starting region, and central megadungeon of the campaign.",
    type: "article",
    images: [`${assetBase}/images/campaign-primer/the-world.jpg`],
  },
  twitter: {
    card: "summary_large_image",
    title: "Campaign Primer",
    description: "The world, starting region, and central megadungeon of the campaign.",
    images: [`${assetBase}/images/campaign-primer/the-world.jpg`],
  },
};

const sections = [
  ["the-world", "The World"],
  ["the-starting-region", "The Starting Region"],
  ["the-chasm-of-man", "The Chasm of Man"],
] as const;

const imageClasses: Record<string, string> = {
  "/images/campaign-primer/the-world.jpg": styles.worldImage,
  "/images/campaign-primer/the-starting-region-3.jpg": styles.regionWide,
  "/images/campaign-primer/the-starting-region-2.jpg": styles.regionPortrait,
  "/images/campaign-primer/the-starting-region-1.jpg": styles.regionPortrait,
  "/images/campaign-primer/the-chasm-of-man.png": styles.chasmMap,
};

function textOf(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (node && typeof node === "object" && "props" in node) {
    return textOf((node as { props: { children?: ReactNode } }).props.children);
  }
  return "";
}

function slugify(children: ReactNode): string {
  return textOf(children)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function SectionNav() {
  return (
    <nav aria-label="Campaign primer sections">
      {sections.map(([id, label]) => (
        <a key={id} href={`#${id}`}>{label}</a>
      ))}
    </nav>
  );
}

export default function CampaignPrimerPage() {
  const markdown = readFileSync(
    join(process.cwd(), "content", "campaign-primer.md"),
    "utf8",
  );

  return (
    <main className={styles.page}>
      <header className={styles.masthead}>
        <div className={styles.mastheadInner}>
          <Link className={styles.backLink} href="/">← Campaign Gazetteer</Link>
          <span className={styles.edition}>Player briefing · Xiiom campaign</span>
        </div>
      </header>

      <details className={styles.mobileJump}>
        <summary>Jump to a section</summary>
        <SectionNav />
      </details>

      <div className={styles.layout}>
        <aside className={styles.toc}>
          <p className={styles.tocTitle}>In this primer</p>
          <SectionNav />
        </aside>

        <article className={styles.primer}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => (
                <header className={styles.hero}>
                  <p className={styles.eyebrow}>Before the first expedition</p>
                  <h1>{children}</h1>
                  <p className={styles.deck}>
                    What every adventurer should know about the world, Xiiom,
                    and the place waiting beneath Mount Uxal.
                  </p>
                </header>
              ),
              h2: ({ children }) => <h2 id={slugify(children)}>{children}</h2>,
              p: ({ node, children }) => {
                const onlyChild = node?.children.length === 1 ? node.children[0] : null;
                if (
                  onlyChild?.type === "element" &&
                  onlyChild.tagName === "img"
                ) {
                  return <>{children}</>;
                }
                return <p>{children}</p>;
              },
              img: ({ src, alt }) => {
                const path = typeof src === "string" ? src : "";
                return (
                  <figure className={imageClasses[path] ?? styles.image}>
                    <img src={`${assetBase}${path}`} alt={alt ?? ""} loading="lazy" />
                  </figure>
                );
              },
            }}
          >
            {markdown}
          </ReactMarkdown>
        </article>
      </div>

      <footer className={styles.footer}>
        <span>Campaign Primer</span>
        <span>Xiiom · Mount Uxal · The Chasm of Man</span>
      </footer>
    </main>
  );
}
