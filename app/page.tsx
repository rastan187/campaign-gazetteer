import { nations, site } from "../content/site";
import Link from "next/link";
import { SiteHeader } from "./components/site-header";
import { SiteFooter } from "./components/site-footer";
import { Moodboard } from "./components/moodboard";

export default function Home() {
  return (
    <><SiteHeader current="/" />
    <main id="main-content" className="gazetteer" tabIndex={-1}>
      <div id="top" />
      <section className="site-introduction" aria-labelledby="site-title">
        <h1 id="site-title">{site.title}</h1>
        <p className="introduction">{site.introduction}</p>
      </section>

      <section className="realm-index" aria-label="Realm index"><nav aria-label="Realms on this page">{nations.map((nation) => <a key={nation.id} href={`#${nation.id}`}><strong>{nation.name}</strong><span>{nation.siteName}</span></a>)}</nav></section>

      {nations.map((nation) => (
        <article id={nation.id} key={nation.id}>
          <header className="realm-heading">
            <h2>{nation.name}</h2>
            {nation.nativeName ? (
              <p className="native-name" lang="ja">
                {nation.nativeName}
              </p>
            ) : null}
          </header>

          <div className="realm-info">
            <p className="description">{nation.description}</p>

            <dl className="realm-details">
              <div>
                <dt>Capital</dt>
                <dd>{nation.capital}</dd>
              </div>
              <div>
                <dt>Key locale</dt>
                <dd>
                  <strong>{nation.id === "xiiom" ? <Link href="/campaign-primer/#the-chasm-of-man">{nation.siteName}</Link> : nation.siteName}</strong>
                  <span>{nation.siteDescription}</span>
                </dd>
              </div>
            </dl>
          </div>

          <Moodboard name={nation.name} href={nation.pinterestBoard} />

          <a className="section-link" href="#top">
            Back to index
          </a>
        </article>
      ))}

      <p className="draft-note">Setting notes are a working draft and may change as the campaign develops.</p>
    </main><SiteFooter /></>
  );
}
