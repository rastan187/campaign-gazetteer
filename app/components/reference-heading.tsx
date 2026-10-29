import type { ReactNode } from "react";
import { headingId } from "../../content/reference";
import { SectionLink } from "./section-link";

function textOf(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (node && typeof node === "object" && "props" in node) return textOf((node as { props: { children?: ReactNode } }).props.children);
  return "";
}

export function ReferenceHeading({ level, children }: { level: 2 | 3 | 4; children?: ReactNode }) {
  const title = textOf(children);
  const id = headingId(title);
  const Heading = level === 2 ? "h2" : level === 3 ? "h3" : "h4";
  return <Heading id={id}>{children}<SectionLink id={id} title={title} /></Heading>;
}
