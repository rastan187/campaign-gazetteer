import { nations, site } from "../content/site";
import Link from "next/link";

export default function Home() {
  return (
    <main id="top">
      <header className="site-header">
        <nav aria-label="Realm index">
          <Link className="player-tools-link" href="/map">
            Region I Map
          </Link>
          <Link className="player-tools-link" href="/house-rules">
            House Rules
          </Link>
          {nations.map((nation) => (
            <a key={nation.id} href={`#${nation.id}`}>
              {nation.name}
            </a>
          ))}
        </nav>
      </header>

      <section className="site-introduction" aria-labelledby="site-title">
        <h1 id="site-title">{site.title}</h1>
        <p className="introduction">{site.introduction}</p>
      </section>

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
                  <strong>{nation.siteName}</strong>
                  <span>{nation.siteDescription}</span>
                </dd>
              </div>
            </dl>
          </div>

          <section
            className="moodboard-section"
            aria-label={`${nation.name} moodboard`}
          >
            <div className="pinterest-board">
              <a
                data-pin-do="embedBoard"
                data-pin-board-width="1200"
                data-pin-scale-height="900"
                data-pin-scale-width="180"
                href={nation.pinterestBoard}
              >
                View the {nation.name} moodboard on Pinterest
              </a>
            </div>
            <noscript>
              JavaScript is required for the live board. You can still view it
              directly on Pinterest.
            </noscript>
          </section>

          <a className="section-link" href="#top">
            Back to index
          </a>
        </article>
      ))}

      <footer>
        <p>{site.title}</p>
        <p>Working draft. Text and images may change before publication.</p>
      </footer>
    </main>
  );
}
