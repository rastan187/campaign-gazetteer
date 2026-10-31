import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const routes = ["", "campaign-primer/", "map/", "house-rules/", "characters/"];

test("all existing routes still export and the four reference pages share navigation", async () => {
  for (const route of routes) {
    const html = await read(`out/${route}index.html`);
    assert.match(html, /<h1\b/);
    if (route === "characters/") continue;
    assert.match(html, /aria-label="Main navigation"/);
    assert.match(html, /href="\/campaign-gazetteer\/campaign-primer\/"/);
    assert.match(html, /href="\/campaign-gazetteer\/house-rules\/"/);
    assert.match(html, /href="\/campaign-gazetteer\/map\/"/);
    assert.match(html, /Skip to content/);
    assert.match(html, /id="main-content"/);
    assert.doesNotMatch(html, /Serafine Vale|Oruk Cold-Eye|hyperborea-character-ledger-v1/);
  }
});

test("every existing rule and primer heading retains its exact public anchor", async () => {
  const ids = JSON.parse(await read("content/section-ids.json"));
  for (const name of ["house-rules", "campaign-primer"]) {
    const markdown = await read(`content/${name}.md`);
    const html = await read(`out/${name}/index.html`);
    for (const match of markdown.matchAll(/^#{2,4}\s+(.+)$/gm)) {
      const title = match[1].trim();
      const originalId = title.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      assert.equal(ids[title], originalId);
      assert.match(html, new RegExp(`id="${originalId}"`));
      assert.match(html, new RegExp(`href="#${originalId}"`));
    }
  }
});

test("realm anchors and Pinterest fallback links survive; moodboards start expanded", async () => {
  const html = await read("out/index.html");
  for (const id of ["xiiom", "kumoi", "namarath", "endulia", "serevan-empire", "top"]) assert.match(html, new RegExp(`id="${id}"`));
  assert.equal((html.match(/Hide moodboard/g) ?? []).length, 5);
  assert.equal((html.match(/data-pin-do="embedBoard"/g) ?? []).length, 5);
  assert.equal((html.match(/>Open on Pinterest/g) ?? []).length, 5);
  assert.doesNotMatch(html, /<script[^>]+src="https:\/\/assets\.pinterest/);
});

test("Characters opens the approved shared Google Sheets ledger, without changing the prototype route", async () => {
  const html = await read("out/index.html");
  const ledgerLinks = [...html.matchAll(/<a\b[^>]*>/g)].map((match) => match[0]).filter((tag) => tag.includes('href="https://docs.google.com/spreadsheets/d/1QWx9Q0bw0CI3B1yt-mPkOCjboYCdxUqwLnUt4sA06oI/edit"'));
  assert.ok(ledgerLinks.length > 0);
  ledgerLinks.forEach((tag) => assert.match(tag, /target="_blank"/));
  assert.match(await read("out/characters/index.html"), /Character Ledger/);
});

test("search map links refer only to named, published cells and all map assets exist", async () => {
  const map = JSON.parse(await read("content/region1-player-map.json"));
  const html = await read("out/map/index.html");
  assert.match(html, /Find a location or hex/);
  assert.match(html, /Travel rules/);
  for (const coordinate of [...html.matchAll(/hex-(\d{4})/g)].map((match) => match[1])) assert.ok(map.cells.some((cell) => cell.coordinate === coordinate));
  for (const asset of new Set(map.cells.flatMap((cell) => cell.tiles.map((tile) => tile.asset)))) await readFile(new URL(`../public/map-tiles/${asset}`, import.meta.url));
  assert.doesNotMatch(JSON.stringify(map), /"fogged"|"foggedHexCount"/);
});
