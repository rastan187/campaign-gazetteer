import type { Metadata } from "next";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { readReference } from "../../content/reference";
import { SiteHeader } from "../components/site-header";
import { SiteFooter } from "../components/site-footer";
import { Contents } from "../components/contents";
import { ReferenceHeading } from "../components/reference-heading";
import shared from "../components/reference.module.css";
import styles from "./house-rules.module.css";
import { characterLedger } from "../../content/navigation";

export const metadata: Metadata = {
  title: "Campaign House Rules", description: "House rules for the current Hyperborea 3e campaign.",
  openGraph: { title: "Campaign House Rules", description: "House rules for the current Hyperborea 3e campaign.", type: "article" },
  twitter: { card: "summary_large_image", title: "Campaign House Rules", description: "House rules for the current Hyperborea 3e campaign." },
};

export default function HouseRulesPage() {
  const { markdown, headings } = readReference("house-rules");
  return <><SiteHeader current="/house-rules/" />
    <main id="main-content" tabIndex={-1} className={styles.page}>
      <section className={styles.hero}><h1>Campaign House Rules</h1><p className="page-deck">Jump to a topic, or use Search to find an individual rule.</p></section>
      <div className={styles.layout}>
        <Contents headings={headings} />
        <article className={styles.rules}>
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
            h2: ({ children }) => <ReferenceHeading level={2}>{children}</ReferenceHeading>,
            h3: ({ children }) => <ReferenceHeading level={3}>{children}</ReferenceHeading>,
            h4: ({ children }) => <ReferenceHeading level={4}>{children}</ReferenceHeading>,
            table: ({ children }) => <div className={styles.tableWrap} role="region" aria-label="Rule reference table" tabIndex={0}><table>{children}</table></div>,
          }}>{markdown}</ReactMarkdown>
          <nav className={shared.related} aria-label="Related pages"><strong>Related pages</strong><Link href="/map/">Region I Map</Link><a href={characterLedger} target="_blank" rel="noreferrer">Shared Character Ledger ↗</a><Link href="/campaign-primer/">Campaign Primer</Link></nav>
        </article>
      </div>
    </main><SiteFooter /></>;
}
