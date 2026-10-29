import Link from "next/link";
import { navigation } from "../../content/navigation";
export function SiteFooter() {
  return <footer className="campaign-footer"><span>Campaign Gazetteer · A living campaign reference</span>
    <nav aria-label="Footer navigation">{navigation.map((item) => <Link key={item.href} href={item.href} target={"external" in item ? "_blank" : undefined} rel={"external" in item ? "noreferrer" : undefined}>{item.label}{"external" in item ? " ↗" : ""}</Link>)}</nav></footer>;
}
