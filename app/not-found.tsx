import Link from "next/link";
import { SiteHeader } from "./components/site-header";
import { SiteFooter } from "./components/site-footer";
export default function NotFound() {
  return <><SiteHeader current="" /><main id="main-content" tabIndex={-1} className="not-found"><h1>Page not found</h1><p>The requested page could not be found. Use search or the navigation links.</p><nav className="not-found-links" aria-label="Page navigation"><Link href="/">Campaign Gazetteer</Link><Link href="/map/">Region I Map</Link><Link href="/house-rules/">House Rules</Link></nav></main><SiteFooter /></>;
}
