import { readFile } from "node:fs/promises";
import path from "node:path";

export function overridePathForMap(mapPath) {
  const parsed = path.parse(mapPath);
  return path.join(parsed.dir, `${parsed.name}.player-overrides.json`);
}

export async function loadPrivateMapOverrides(mapPath) {
  const overridePath = overridePathForMap(mapPath);
  let rawRules;

  try {
    rawRules = JSON.parse(await readFile(overridePath, "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") {
      return { overridePath, hideLayersWhileFogged: new Map() };
    }
    throw error;
  }

  const entries = Object.entries(rawRules.hideLayersWhileFogged ?? {});
  const hideLayersWhileFogged = new Map();

  for (const [coordinate, layers] of entries) {
    if (!/^\d{4}$/.test(coordinate) || !Array.isArray(layers)) {
      throw new Error(`Invalid private map override for '${coordinate}'.`);
    }
    if (layers.some((layer) => typeof layer !== "string" || !layer.trim())) {
      throw new Error(`Private map override '${coordinate}' has an invalid layer name.`);
    }
    hideLayersWhileFogged.set(coordinate, new Set(layers));
  }

  return { overridePath, hideLayersWhileFogged };
}
