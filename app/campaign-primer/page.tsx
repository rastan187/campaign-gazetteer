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
import styles from "./campaign-primer.module.css";

const assetBase = process.env.GITHUB_PAGES === "true" ? "/campaign-gazetteer" : "";
export const metadata: Metadata = {
  title: "Campaign Primer · Campaign Gazetteer", description: "The world, starting region, and central megadungeon of the campaign.",
  openGraph: { title: "Campaign Primer", description: "The world, starting region, and central megadungeon of the campaign.", type: "article", images: [`${assetBase}/images/campaign-primer/the-world.jpg`] },
  twitter: { card: "summary_large_image", title: "Campaign Primer", images: [`${assetBase}/images/campaign-primer/the-world.jpg`] },
};
const imageClasses: Record<string, string> = {
  "/images/campaign-primer/the-world.jpg": styles.worldImage,
  "/images/campaign-primer/the-starting-region-3.jpg": styles.regionWide,
  "/images/campaign-primer/the-starting-region-2.jpg": styles.regionPortrait,
  "/images/campaign-primer/the-starting-region-1.jpg": styles.regionPortrait,
  "/images/campaign-primer/chasm-of-man-surroundings-pointcrawl.png": styles.chasmMap,
};

export default function CampaignPrimerPage() {
  const { markdown, headings } = readReference("campaign-primer");
  return <><SiteHeader current="/campaign-primer/" />
    <main id="main-content" tabIndex={-1} className={styles.page}>
      <header className="primer-intro"><h1>Campaign Primer</h1></header>
      <div className={styles.layout}>
        <Contents headings={headings} />
        <article className={styles.primer}>
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
            h1: () => null,
            h2: ({ children }) => <ReferenceHeading level={2}>{children}</ReferenceHeading>,
            p: ({ node, children }) => { const child = node?.children.length === 1 ? node.children[0] : null; return child?.type === "element" && child.tagName === "img" ? <>{children}</> : <p>{children}</p>; },
            img: ({ src, alt }) => { const path = typeof src === "string" ? src : ""; return <figure className={imageClasses[path] ?? styles.image}><a href={`${assetBase}${path}`} target="_blank" rel="noreferrer" aria-label={`Enlarge image: ${alt ?? "Campaign illustration"}`}><img src={`${assetBase}${path}`} alt={alt ?? ""} loading="lazy" /></a><figcaption>Open image at full size ↗</figcaption></figure>; },
          }}>{markdown}</ReactMarkdown>
          <nav className={shared.related} aria-label="Related pages"><strong>Related pages</strong><Link href="/house-rules/#character-creation-and-advancement">Character creation</Link><Link href="/map/">Region I Map</Link><Link href="/">Campaign Gazetteer</Link><Link href="/#xiiom">Xiiom</Link></nav>
        </article>
      </div>
    </main><SiteFooter /></>;
}
