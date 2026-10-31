import { publicSearchEntries } from "../../content/reference";
import { SiteNavigation } from "./site-navigation";

export function SiteHeader({ current, dark = false }: { current: string; dark?: boolean }) {
  return <SiteNavigation current={current} dark={dark} entries={publicSearchEntries()} />;
}
