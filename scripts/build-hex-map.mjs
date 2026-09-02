import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { loadPrivateMapOverrides } from "./map-publication-rules.mjs";

const projectRoot = process.cwd();
const hexKitRoot = "E:/books/RPG/Hex Kit";
const mapPath = process.argv[2] ?? `${hexKitRoot}/region1_82126.map`;
const hpsRoot = process.argv[3] ?? `${hexKitRoot}/HPS Cartography Kit`;
const bundledTilesRoot = `${hexKitRoot}/Hex Kit-win32-x64/resources/app.asar.unpacked/tiles`;
const outputDataPath = path.join(projectRoot, "content", "region1-player-map.json");
const outputTileRoot = path.join(projectRoot, "public", "map-tiles");
const nextOutputTileRoot = path.join(projectRoot, "public", ".map-tiles-next");

const rawMap = JSON.parse(await readFile(mapPath, "utf8"));
const fowLayer = rawMap.layers.find((layer) => layer.label === "FOW");
const { hideLayersWhileFogged } = await loadPrivateMapOverrides(mapPath);

if (!fowLayer) {
  throw new Error("The source map does not contain an FOW layer.");
}

await mkdir(path.dirname(outputDataPath), { recursive: true });
await rm(nextOutputTileRoot, { recursive: true, force: true });
await mkdir(nextOutputTileRoot, { recursive: true });

const foggedIndexes = new Set(
  fowLayer.tiles.flatMap((tile, index) =>
    tile?.source?.startsWith("Fog of War:") ? [index] : [],
  ),
);

const copiedAssets = new Map();
let privateLayerTilesOmitted = 0;

function sourcePathFor(source) {
  if (source.startsWith("HPS Cartography Kit:/")) {
    return path.join(hpsRoot, source.slice("HPS Cartography Kit:/".length));
  }

  if (source.startsWith("Blank://")) {
    return path.join(bundledTilesRoot, "blanks", source.slice("Blank://".length));
  }

  if (source.startsWith("HK-Classic:/")) {
    return path.join(
      bundledTilesRoot,
      "HK-Classic",
      source.slice("HK-Classic:/".length),
    );
  }

  throw new Error(`Unsupported tile source: ${source}`);
}

async function copyTile(source) {
  if (copiedAssets.has(source)) {
    return copiedAssets.get(source);
  }

  const inputPath = sourcePathFor(source);
  const extension = path.extname(inputPath).toLowerCase();
  const readableName = path
    .basename(inputPath, extension)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 42);
  const digest = createHash("sha1").update(source).digest("hex").slice(0, 10);
  const outputName = `${readableName}-${digest}${extension}`;

  await copyFile(inputPath, path.join(nextOutputTileRoot, outputName));
  copiedAssets.set(source, outputName);
  return outputName;
}

function cleanTitle(value = "") {
  return value.replace(/^\d{4}\s*:?\s*/, "").trim();
}

const cells = [];

for (let index = 0; index < rawMap.width * rawMap.height; index += 1) {
  const row = Math.floor(index / rawMap.width) + 1;
  const column = (index % rawMap.width) + 1;
  const coordinate = `${String(column).padStart(2, "0")}${String(row).padStart(2, "0")}`;
  const fogged = foggedIndexes.has(index);
  const privatelyHiddenLayers = hideLayersWhileFogged.get(coordinate);
  const info = rawMap.infoLayer[index];
  const tiles = [];

  for (const layer of rawMap.layers) {
    if (layer.label === "FOW") continue;
    if (fogged && layer.label === "Features") continue;
    if (fogged && privatelyHiddenLayers?.has(layer.label)) {
      if (layer.tiles[index]) privateLayerTilesOmitted += 1;
      continue;
    }

    const tile = layer.tiles[index];
    if (!tile) continue;

    tiles.push({
      layer: layer.label,
      asset: await copyTile(tile.source),
      rotation: tile.rotation ?? 0,
      mirror: tile.mirror ?? false,
    });
  }

  cells.push({
    index,
    coordinate,
    column,
    row,
    title: fogged ? "" : cleanTitle(info?.label?.text),
    description: fogged ? "" : (info?.data ?? ""),
    tiles,
  });
}

const playerMap = {
  name: "Region I",
  width: rawMap.width,
  height: rawMap.height,
  flatTop: rawMap.flatTop,
  topStaggered: rawMap.topStaggered,
  generatedFrom: path.basename(mapPath),
  knownLocationCount: cells.filter((cell) => cell.title).length,
  cells,
};

await rm(outputTileRoot, { recursive: true, force: true });
await rename(nextOutputTileRoot, outputTileRoot);
await writeFile(outputDataPath, `${JSON.stringify(playerMap, null, 2)}\n`);

console.log(
  `Built ${playerMap.width}x${playerMap.height} player map with ${copiedAssets.size} tile assets; ${foggedIndexes.size} concealed features were omitted.`,
);
if (privateLayerTilesOmitted > 0) {
  console.log(`Applied ${privateLayerTilesOmitted} private layer concealment overrides.`);
}
