import type { Metadata } from "next";
import Link from "next/link";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import styles from "./house-rules.module.css";

export const metadata: Metadata = {
  title: "Campaign House Rules",
  description: "House rules for the current Hyperborea 3e campaign.",
  openGraph: {
    title: "Campaign House Rules",
    description: "House rules for the current Hyperborea 3e campaign.",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Campaign House Rules",
    description: "House rules for the current Hyperborea 3e campaign.",
  },
};

const sections = [
  ["character-creation-and-advancement", "Character creation"],
  ["luck-and-combat", "Luck & combat"],
  ["downtime", "Downtime"],
  ["inventory-and-encumbrance", "Inventory & encumbrance"],
  ["exploration-and-survival", "Exploration & survival"],
  ["class-rules", "Class rules"],
] as const;

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
    <nav aria-label="House rules sections">
      {sections.map(([id, label]) => (
        <a key={id} href={`#${id}`}>{label}</a>
      ))}
    </nav>
  );
}

export default function HouseRulesPage() {
  const markdown = readFileSync(join(process.cwd(), "content", "house-rules.md"), "utf8");

  return (
    <main className={styles.page}>
      <header className={styles.masthead}>
        <div className={styles.mastheadInner}>
          <Link className={styles.backLink} href="/">← Campaign Gazetteer</Link>
          <span className={styles.edition}>Living document · Hyperborea 3e</span>
        </div>
      </header>

      <section className={styles.hero}>
        <h1>Campaign House Rules</h1>
      </section>

      <details className={styles.mobileJump}>
        <summary>Jump to a section</summary>
        <SectionNav />
      </details>

      <div className={styles.layout}>
        <aside className={styles.toc}>
          <p className={styles.tocTitle}>On this page</p>
          <SectionNav />
        </aside>

        <article className={styles.rules}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h2: ({ children }) => <h2 id={slugify(children)}>{children}</h2>,
              h3: ({ children }) => <h3 id={slugify(children)}>{children}</h3>,
              h4: ({ children }) => <h4 id={slugify(children)}>{children}</h4>,
              table: ({ children }) => (
                <div className={styles.tableWrap}><table>{children}</table></div>
              ),
            }}
          >
            {markdown}
          </ReactMarkdown>
        </article>
      </div>

      <footer className={styles.footer}>
        <span>Campaign House Rules</span>
        <span>Edit one Markdown file to revise this page</span>
      </footer>
    </main>
  );
}
