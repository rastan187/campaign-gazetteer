"use client";
import { useState } from "react";

export function SectionLink({ id, title }: { id: string; title: string }) {
  const [copied, setCopied] = useState(false);
  return <a className="heading-permalink" href={`#${id}`} aria-label={`Copy link to ${title}`} onClick={async () => {
    try {
      const url = new URL(window.location.href);
      url.hash = id;
      await navigator.clipboard.writeText(url.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch { /* The native anchor still provides a usable, shareable URL. */ }
  }}>{copied ? "✓" : "#"}<span className="visually-hidden" role="status">{copied ? "Link copied" : ""}</span></a>;
}
