import Link from "next/link";
import { SiteHeader } from "./components/site-header";
import { SiteFooter } from "./components/site-footer";
export default function NotFound() {
  return <><SiteHeader current="" /><main id="main-content" tabIndex={-1} className="not-found"><p className="launch-label">Off the map</p><h1>Page not found</h1><p>This address doesn’t lead to a campaign page. Use Search above, or return to a familiar place.</p><p><Link href="/">Campaign Gazetteer</Link> · <Link href="/map/">Region I Map</Link> · <Link href="/house-rules/">House Rules</Link></p></main><SiteFooter /></>;
}
