import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const defaultHexKitRoot = "E:/books/RPG/Hex Kit";
const sourceMapPath = process.argv[2] ?? `${defaultHexKitRoot}/region1_82126.map`;
const playerMapPath = path.join(projectRoot, "content", "region1-player-map.json");
const tileRoot = path.join(projectRoot, "public", "map-tiles");

const [rawMapText, playerMapText] = await Promise.all([
  readFile(sourceMapPath, "utf8"),
  readFile(playerMapPath, "utf8"),
]);
const rawMap = JSON.parse(rawMapText);
const playerMap = JSON.parse(playerMapText);
const fowLayer = rawMap.layers.find((layer) => layer.label === "FOW");

assert(fowLayer, "The source map does not contain an FOW layer.");
assert.equal(playerMap.width, rawMap.width, "Player-map width differs from the source.");
assert.equal(playerMap.height, rawMap.height, "Player-map height differs from the source.");
assert.equal(
  playerMap.cells.length,
  rawMap.width * rawMap.height,
  "Player map has the wrong number of hexes.",
);
assert.doesNotMatch(playerMapText, /"fogged"|"foggedHexCount"/);

const foggedIndexes = new Set(
  fowLayer.tiles.flatMap((tile, index) =>
    tile?.source?.startsWith("Fog of War:") ? [index] : [],
  ),
);
const referencedAssets = new Set();

for (const cell of playerMap.cells) {
  assert.equal(Object.hasOwn(cell, "fogged"), false, `Hex ${cell.coordinate} exposes fog state.`);
  assert.equal(
    cell.tiles.some((tile) => tile.layer === "FOW"),
    false,
    `Hex ${cell.coordinate} contains a fog tile.`,
  );

  if (foggedIndexes.has(cell.index)) {
    assert.equal(cell.title, "", `Hex ${cell.coordinate} exposes a concealed name.`);
    assert.equal(cell.description, "", `Hex ${cell.coordinate} exposes concealed notes.`);
    assert.equal(
      cell.tiles.some((tile) => tile.layer === "Features"),
      false,
      `Hex ${cell.coordinate} exposes a concealed feature icon.`,
    );
  }

  for (const tile of cell.tiles) {
    referencedAssets.add(tile.asset);
    await access(path.join(tileRoot, tile.asset));
  }
}

assert.equal(
  playerMap.knownLocationCount,
  playerMap.cells.filter((cell) => cell.title).length,
  "Known-location count is out of sync.",
);

const publishedAssets = (await readdir(tileRoot)).sort();
assert.deepEqual(
  publishedAssets,
  [...referencedAssets].sort(),
  "The published tile folder contains missing or stale assets.",
);

console.log(`Privacy check passed: ${foggedIndexes.size} concealed features omitted.`);
console.log(`Player map ready: ${playerMap.knownLocationCount} named locations, ${publishedAssets.length} tile assets.`);
