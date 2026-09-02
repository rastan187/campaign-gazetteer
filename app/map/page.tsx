import type { Metadata } from "next";
import playerMap from "../../content/region1-player-map.json";
import { MapViewer } from "./map-viewer";

export const metadata: Metadata = {
  title: "Region I Map · Campaign Gazetteer",
  description: "The players’ living map of Region I.",
};

export default function MapPage() {
  return <MapViewer map={playerMap} />;
}
