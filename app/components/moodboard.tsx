"use client";
import { useState } from "react";
import { PinterestScript } from "../pinterest-script";
export function Moodboard({ name, href }: { name: string; href: string }) {
  const [open, setOpen] = useState(true);
  return <section className="moodboard-section" aria-label={`${name} moodboard`}>
    <div className="moodboard-actions"><button type="button" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? "Hide moodboard" : "Show moodboard"}</button>
      <a href={href} target="_blank" rel="noreferrer">Open on Pinterest ↗</a></div>
    <div className="pinterest-board" hidden={!open}><a data-pin-do="embedBoard" data-pin-board-width="1200" data-pin-scale-height="600" data-pin-scale-width="180" href={href}>View the {name} moodboard on Pinterest</a></div><PinterestScript />
  </section>;
}
