import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the campaign atlas", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Campaign Gazetteer<\/title>/i);
  assert.match(html, /Xiiom/);
  assert.match(html, /Kumoi, the Land of the Giants/);
  assert.match(html, /Great Namarath, the Sidonic Court/);
  assert.match(html, /Endulia/);
  assert.match(html, /The Serevan Remnant/);
  assert.equal(html.match(/data-pin-do="embedBoard"/g)?.length, 5);
  assert.match(html, /https:\/\/www\.pinterest\.com\/miguelalopez\/xiiom\//);
  assert.match(html, /https:\/\/www\.pinterest\.com\/miguelalopez\/serevan-remnant\//);
  assert.doesNotMatch(
    html,
    /<script[^>]+src="https:\/\/assets\.pinterest\.com\/js\/pinit\.js"/,
  );
  assert.doesNotMatch(html, /codex-preview|SkeletonPreview|Starter Project/);
});

test("keeps campaign copy separate from the page template", async () => {
  const packageJson = await readFile(
    new URL("../package.json", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  await access(new URL("../content/site.ts", import.meta.url));
  await access(new URL("../public/og-spartan.png", import.meta.url));
});

test("publishes a complete map without leaking concealed discoveries", async () => {
  const serializedMap = await readFile(
    new URL("../content/region1-player-map.json", import.meta.url),
    "utf8",
  );
  const playerMap = JSON.parse(serializedMap);

  assert.equal(playerMap.width, 25);
  assert.equal(playerMap.height, 24);
  assert.equal(playerMap.cells.length, 600);
  assert.equal(
    playerMap.knownLocationCount,
    playerMap.cells.filter((cell) => cell.title).length,
  );
  assert.doesNotMatch(serializedMap, /"fogged"|"foggedHexCount"/);

  for (const cell of playerMap.cells) {
    for (const tile of cell.tiles) {
      await access(new URL(`../public/map-tiles/${tile.asset}`, import.meta.url));
    }
  }
});
