import assert from "node:assert/strict";
import test from "node:test";
import { prototypeState } from "../app/characters/data.ts";
import { deleteWithUndo, restoreDeletedItem } from "../app/characters/inventory-undo.ts";

function fresh() { return structuredClone(prototypeState); }
function item(id, options = {}) { return { id, name: id, quantity: 1, notes: "", location: "pack", slotRule: "standard", ...options }; }

test("undo restores a whole sack, its quantities, notes and order without rolling back HP or later inventory edits", () => {
  const state = fresh();
  const sack = item("test-sack", { sackSize: "large", contents: [item("test-coins", { quantity: 300, notes: "Party treasury" }), item("test-rope")] });
  state.characters[0].inventory = [item("before"), sack, item("after")];
  const deleted = deleteWithUndo(state, sack.id);
  assert.deepEqual(deleted.state.characters[0].inventory.map((i) => i.id), ["before", "after"]);
  deleted.state.characters[0].hpCurrent = -4;
  deleted.state.characters[0].inventory.push(item("later"));
  const restored = restoreDeletedItem(deleted.state, deleted.deletion);
  assert.equal(restored.restored, true);
  assert.equal(restored.state.characters[0].hpCurrent, -4);
  assert.deepEqual(restored.state.characters[0].inventory.map((i) => i.id), ["before", "test-sack", "after", "later"]);
  assert.deepEqual(restored.state.characters[0].inventory[1], sack);
});

test("undo returns a nested item to its original container", () => {
  const state = fresh();
  state.characters[0].inventory = [item("sack", { sackSize: "large", contents: [item("one"), item("two"), item("three")] })];
  const deleted = deleteWithUndo(state, "two");
  const restored = restoreDeletedItem(deleted.state, deleted.deletion);
  assert.deepEqual(restored.state.characters[0].inventory[0].contents.map((i) => i.id), ["one", "two", "three"]);
});

test("undo returns party storage to its original store and preserves other stores", () => {
  const state = fresh();
  state.stores[0].items = [item("test-store-item")];
  const deleted = deleteWithUndo(state, "test-store-item");
  deleted.state.stores[1].detail = "Updated by a later edit";
  const restored = restoreDeletedItem(deleted.state, deleted.deletion);
  assert.equal(restored.state.stores[0].items[0].id, "test-store-item");
  assert.equal(restored.state.stores[1].detail, "Updated by a later edit");
});

test("a newly occupied equipped slot is preserved; the restored item goes into the pack", () => {
  const state = fresh();
  state.characters[0].inventory = [item("old", { location: "equipped1" })];
  const deleted = deleteWithUndo(state, "old");
  deleted.state.characters[0].inventory.push(item("new", { location: "equipped1" }));
  const restored = restoreDeletedItem(deleted.state, deleted.deletion);
  assert.equal(restored.state.characters[0].inventory.find((i) => i.id === "old").location, "pack");
  assert.equal(restored.state.characters[0].inventory.find((i) => i.id === "new").location, "equipped1");
});

test("undo cannot duplicate a restored item or any of its children", () => {
  const state = fresh();
  state.characters[0].inventory = [item("sack", { sackSize: "large", contents: [item("child")] })];
  const deleted = deleteWithUndo(state, "sack");
  deleted.state.stores[0].items.push(item("child"));
  const restored = restoreDeletedItem(deleted.state, deleted.deletion);
  assert.equal(restored.restored, false);
  assert.equal(restored.state, deleted.state);
});

test("undo keeps the deletion recoverable if its container has become full or unavailable", () => {
  const state = fresh();
  state.characters[0].inventory = [item("sack", { sackSize: "small", contents: [item("one"), item("two")] })];
  const deleted = deleteWithUndo(state, "one");
  deleted.state.characters[0].inventory[0].contents.push(item("later"));
  assert.equal(restoreDeletedItem(deleted.state, deleted.deletion).restored, false);
  deleted.state.characters[0].inventory[0].contents.pop();
  assert.equal(restoreDeletedItem(deleted.state, deleted.deletion).restored, true);
  deleted.state.characters[0].inventory = [];
  assert.equal(restoreDeletedItem(deleted.state, deleted.deletion).restored, false);
});
