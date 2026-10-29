"use client";
import { useEffect, useRef, useState } from "react";
import type { DocumentHeading } from "../../content/navigation";
import styles from "./reference.module.css";

export function Contents({ headings }: { headings: DocumentHeading[] }) {
  const [active, setActive] = useState("");
  const disclosure = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const first = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (first) setActive(first.target.id);
    }, { rootMargin: "-90px 0px -55% 0px" });
    headings.forEach(({ id }) => { const heading = document.getElementById(id); if (heading) observer.observe(heading); });
    return () => observer.disconnect();
  }, [headings]);
  function links() {
    return <nav aria-label="On this page">{headings.map((heading) => <a key={heading.id} href={`#${heading.id}`}
      className={heading.level > 2 ? styles.subsection : undefined} aria-current={active === heading.id ? "location" : undefined}
      onClick={() => { setActive(heading.id); if (disclosure.current) disclosure.current.open = false; }}>{heading.title}</a>)}</nav>;
  }
  return <>
    <aside className={styles.contents}><p>On this page</p>{links()}</aside>
    <details ref={disclosure} className={styles.mobileContents}>
      <summary>On this page<span>{headings.find((heading) => heading.id === active)?.title ?? "Jump to a topic"}</span></summary>{links()}
    </details>
  </>;
}
