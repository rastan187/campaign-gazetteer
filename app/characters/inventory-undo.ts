import type { InventoryItem, PrototypeState } from "./data";

export type DeletedItem = {
  item: InventoryItem;
  owner: "character" | "store";
  ownerId: string;
  parentId?: string;
  index: number;
};

function remove(items: InventoryItem[], id: string, owner: DeletedItem["owner"], ownerId: string, parentId?: string): { items: InventoryItem[]; deletion?: DeletedItem } {
  const index = items.findIndex((item) => item.id === id);
  if (index >= 0) return { items: items.filter((_, i) => i !== index), deletion: { item: items[index], owner, ownerId, parentId, index } };
  for (let i = 0; i < items.length; i++) {
    if (!items[i].contents?.length) continue;
    const result = remove(items[i].contents!, id, owner, ownerId, items[i].id);
    if (result.deletion) return { items: items.map((item, n) => n === i ? { ...item, contents: result.items } : item), deletion: result.deletion };
  }
  return { items };
}

export function deleteWithUndo(state: PrototypeState, id: string): { state: PrototypeState; deletion?: DeletedItem } {
  for (const owner of state.characters) {
    const result = remove(owner.inventory, id, "character", owner.id);
    if (result.deletion) return { state: { ...state, characters: state.characters.map((character) => character.id === owner.id ? { ...character, inventory: result.items } : character) }, deletion: result.deletion };
  }
  for (const owner of state.stores) {
    const result = remove(owner.items, id, "store", owner.id);
    if (result.deletion) return { state: { ...state, stores: state.stores.map((store) => store.id === owner.id ? { ...store, items: result.items } : store) }, deletion: result.deletion };
  }
  return { state };
}

function flatten(items: InventoryItem[]): InventoryItem[] { return items.flatMap((item) => [item, ...flatten(item.contents ?? [])]); }
function slots(item: InventoryItem): number {
  if (item.sackSize) return item.contents?.length ? item.contents.reduce((sum, child) => sum + slots(child), 0) : 1;
  return item.slotRule === "free" ? 0 : item.slotRule === "custom" ? Math.max(0, item.customSlots ?? 1) : 1;
}

/** Restore just the deleted subtree; retain all subsequent edits elsewhere. */
export function restoreDeletedItem(state: PrototypeState, deletion: DeletedItem): { state: PrototypeState; restored: boolean; message: string } {
  const existingIds = new Set(flatten([...state.characters.flatMap((character) => character.inventory), ...state.stores.flatMap((store) => store.items)]).map((item) => item.id));
  if (flatten([deletion.item]).some((item) => existingIds.has(item.id))) return { state, restored: false, message: "This item or one of its contents already exists. Nothing was overwritten." };
  const owner = deletion.owner === "character" ? state.characters.find((character) => character.id === deletion.ownerId) : state.stores.find((store) => store.id === deletion.ownerId);
  if (!owner) return { state, restored: false, message: "The original owner is unavailable. This deletion is still available to undo." };
  const originalItems = "inventory" in owner ? owner.inventory : owner.items;
  let message = `${deletion.item.name} restored.`;
  let item = deletion.item;
  if (!deletion.parentId && deletion.owner === "character" && item.location !== "pack" && originalItems.some((existing) => existing.location === item.location)) {
    item = { ...item, location: "pack" };
    message = `${item.name} restored to the pack because its equipped slot is now occupied.`;
  }
  function insert(items: InventoryItem[]): InventoryItem[] { const next = [...items]; next.splice(Math.min(deletion.index, next.length), 0, item); return next; }
  let nextItems: InventoryItem[];
  if (deletion.parentId) {
    const parent = flatten(originalItems).find((entry) => entry.id === deletion.parentId);
    if (!parent) return { state, restored: false, message: "Restore the original container first, then try Undo again." };
    const limit = parent.sackSize === "small" ? 2 : parent.sackSize === "large" ? 4 : Infinity;
    if ((parent.contents ?? []).reduce((sum, entry) => sum + slots(entry), 0) + slots(item) > limit) return { state, restored: false, message: "The original container is now full. Make room, then try Undo again." };
    const restoreParent = (items: InventoryItem[]): InventoryItem[] => items.map((entry) => entry.id === parent.id ? { ...entry, contents: insert(entry.contents ?? []) } : entry.contents ? { ...entry, contents: restoreParent(entry.contents) } : entry);
    nextItems = restoreParent(originalItems);
  } else nextItems = insert(originalItems);
  return { restored: true, message, state: deletion.owner === "character"
    ? { ...state, characters: state.characters.map((character) => character.id === deletion.ownerId ? { ...character, inventory: nextItems } : character) }
    : { ...state, stores: state.stores.map((store) => store.id === deletion.ownerId ? { ...store, items: nextItems } : store) } };
}
