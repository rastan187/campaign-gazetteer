"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { navigation, type SearchEntry } from "../../content/navigation";
import styles from "./site-navigation.module.css";

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function SiteNavigation({ current, dark, entries }: { current: string; dark: boolean; entries: SearchEntry[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const menu = useRef<HTMLDetailsElement>(null);
  const [query, setQuery] = useState("");
  const terms = normalize(query).trim().split(/\s+/).filter(Boolean);
  const results = terms.length ? entries.filter((entry) => terms.every((term) =>
    normalize(`${entry.title} ${entry.excerpt} ${entry.keywords ?? ""}`).includes(term),
  )).sort((a, b) => Number(normalize(b.title).includes(normalize(query))) - Number(normalize(a.title).includes(normalize(query)))) : [];

  function links() {
    return navigation.map((item) => <Link key={item.href} href={item.href}
      target={"external" in item ? "_blank" : undefined} rel={"external" in item ? "noreferrer" : undefined}
      aria-current={current === item.href ? "page" : undefined}
      onClick={() => { if (menu.current) menu.current.open = false; }}>{item.label}{"external" in item ? " ↗" : ""}{"external" in item && <span className="visually-hidden"> (Google Sheets, opens in a new tab)</span>}</Link>);
  }

  return (
    <header className={`${styles.header} ${dark ? styles.dark : ""}`}>
      <a className={styles.skip} href="#main-content">Skip to content</a>
      <div className={styles.inner}>
        <Link className={styles.brand} href="/">Campaign Gazetteer</Link>
        <nav className={styles.desktop} aria-label="Main navigation">{links()}</nav>
        <button className={styles.searchButton} type="button" onClick={() => dialog.current?.showModal()}>Search<span aria-hidden="true"> ↗</span></button>
        <details ref={menu} className={styles.menu} onKeyDown={(event) => {
          if (event.key === "Escape" && menu.current) { menu.current.open = false; menu.current.querySelector("summary")?.focus(); }
        }}>
          <summary>Menu</summary>
          <nav aria-label="Main navigation">{links()}</nav>
        </details>
      </div>
      <dialog ref={dialog} className={styles.dialog} aria-labelledby="search-title" onClick={(event) => {
        if (event.target === dialog.current) dialog.current.close();
      }}>
        <div className={styles.dialogHead}><h2 id="search-title">Search the campaign</h2>
          <button type="button" onClick={() => dialog.current?.close()} aria-label="Close search">Close ×</button></div>
        <label htmlFor="campaign-search">Find a rule, realm, or known location</label>
        <input id="campaign-search" type="search" autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try luck, Xiiom, or a hex coordinate…" />
        <p className={styles.status} role="status">{terms.length ? `${results.length} result${results.length === 1 ? "" : "s"}${results.length > 30 ? " · showing the first 30" : ""}` : "Search published reference material. Character records are not searched."}</p>
        {terms.length > 0 && results.length === 0 && <p>Try a shorter name or another word. You can also browse the pages from the menu.</p>}
        <ul className={styles.results}>{results.slice(0, 30).map((entry) => <li key={entry.href}>
          <Link href={entry.href} onClick={() => dialog.current?.close()}><span>{entry.type}</span><strong>{entry.title}</strong><p>{entry.excerpt}</p></Link>
        </li>)}</ul>
      </dialog>
    </header>
  );
}
