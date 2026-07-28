"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Character,
  InventoryItem,
  ItemLocation,
  PartyStore,
  PrototypeState,
  SackSize,
  SlotRule,
  prototypeState,
} from "./data";
import styles from "./character-app.module.css";

type View = "inventory" | "record" | "party";

type EditorState = {
  item?: InventoryItem;
  source: "character" | "store";
  storeId?: string;
  initialDestination?: string;
};

type ItemDraft = {
  name: string;
  quantity: number;
  notes: string;
  slotRule: SlotRule;
  customSlots: number;
  sackSize: "" | SackSize;
  destination: string;
};

const STORAGE_KEY = "hyperborea-character-ledger-v1";

function clonePrototype(): PrototypeState {
  return JSON.parse(JSON.stringify(prototypeState)) as PrototypeState;
}

function itemOwnSlots(item: InventoryItem): number {
  if (item.sackSize) {
    const contents = item.contents ?? [];
    return contents.length === 0
      ? 1
      : contents.reduce((sum, child) => sum + itemOwnSlots(child), 0);
  }

  if (item.slotRule === "free") return 0;
  if (item.slotRule === "custom") return Math.max(0, item.customSlots ?? 1);
  return 1;
}

function itemCharacterSlots(item: InventoryItem): number {
  if (
    item.location === "armor" ||
    item.location === "equipped1" ||
    item.location === "equipped2"
  ) {
    return 0;
  }
  return itemOwnSlots(item);
}

function usedSlots(character: Character): number {
  return character.inventory.reduce(
    (sum, inventoryItem) => sum + itemCharacterSlots(inventoryItem),
    0,
  );
}

function capacity(character: Character): number {
  return Math.max(10, character.attributes.st);
}

function movement(character: Character): {
  used: number;
  max: number;
  over: number;
  penalty: number;
  current: number;
} {
  const used = usedSlots(character);
  const max = capacity(character);
  const over = Math.max(0, used - max);
  const penalty = over > 0 ? Math.ceil(over / 2) * 10 : 0;
  return {
    used,
    max,
    over,
    penalty,
    current: Math.max(0, character.baseMovement - penalty),
  };
}

function findItem(items: InventoryItem[], id: string): InventoryItem | undefined {
  for (const inventoryItem of items) {
    if (inventoryItem.id === id) return inventoryItem;
    const nested = findItem(inventoryItem.contents ?? [], id);
    if (nested) return nested;
  }
}

function removeItem(
  items: InventoryItem[],
  id: string,
): { items: InventoryItem[]; removed?: InventoryItem } {
  let removed: InventoryItem | undefined;
  const next: InventoryItem[] = [];

  for (const inventoryItem of items) {
    if (inventoryItem.id === id) {
      removed = inventoryItem;
      continue;
    }

    if (!removed && inventoryItem.contents?.length) {
      const nested = removeItem(inventoryItem.contents, id);
      if (nested.removed) {
        removed = nested.removed;
        next.push({ ...inventoryItem, contents: nested.items });
        continue;
      }
    }
    next.push(inventoryItem);
  }

  return { items: next, removed };
}

function addToSack(
  items: InventoryItem[],
  sackId: string,
  addition: InventoryItem,
): InventoryItem[] {
  return items.map((inventoryItem) => {
    if (inventoryItem.id === sackId) {
      return {
        ...inventoryItem,
        contents: [...(inventoryItem.contents ?? []), addition],
      };
    }
    return inventoryItem;
  });
}

function itemSummary(item: InventoryItem): string {
  const details = [];
  if (item.quantity > 1) details.push(`×${item.quantity}`);
  if (item.sackSize) {
    const max = item.sackSize === "small" ? 2 : 4;
    details.push(`${itemOwnSlots(item)}/${max} slots`);
  }
  if (item.notes) details.push(item.notes);
  return details.join(" · ") || "No additional notes";
}

function destinationLocation(destination: string): ItemLocation {
  return destination.replace("character:", "") as ItemLocation;
}

function characterInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
}

function ItemCard({
  item,
  onOpen,
}: {
  item: InventoryItem;
  onOpen: () => void;
}) {
  const slots = itemCharacterSlots(item);
  const free =
    item.location === "armor" ||
    item.location === "equipped1" ||
    item.location === "equipped2" ||
    slots === 0;

  return (
    <div className={styles.itemCard}>
      <div className={styles.itemCopy}>
        <strong>
          {item.name}
          {item.quantity > 1 ? ` ×${item.quantity}` : ""}
        </strong>
        <p>{itemSummary(item)}</p>
      </div>
      <span className={styles.slotBadge}>
        {free ? "Free" : `${slots} slot${slots === 1 ? "" : "s"}`}
      </span>
      {item.sackSize && item.contents?.length ? (
        <div className={styles.sackContents}>
          {item.contents.map((child) => (
            <span key={child.id}>{child.name}</span>
          ))}
        </div>
      ) : null}
      <button
        className={styles.itemButton}
        type="button"
        aria-label={`Edit ${item.name}`}
        onClick={onOpen}
      />
    </div>
  );
}

function ItemEditor({
  editor,
  character,
  stores,
  onClose,
  onSave,
  onDelete,
}: {
  editor: EditorState;
  character: Character;
  stores: PartyStore[];
  onClose: () => void;
  onSave: (draft: ItemDraft) => void;
  onDelete: () => void;
}) {
  const current = editor.item;
  const defaultDestination =
    editor.initialDestination ??
    (editor.source === "store" && editor.storeId
      ? `store:${editor.storeId}`
      : `character:${current?.location ?? "pack"}`);
  const [draft, setDraft] = useState<ItemDraft>({
    name: current?.name ?? "",
    quantity: current?.quantity ?? 1,
    notes: current?.notes ?? "",
    slotRule: current?.slotRule ?? "standard",
    customSlots: current?.customSlots ?? 2,
    sackSize: current?.sackSize ?? "",
    destination: defaultDestination,
  });
  const [error, setError] = useState("");
  const sacks = character.inventory.filter(
    (entry) => entry.sackSize && entry.id !== current?.id,
  );

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!draft.name.trim()) {
      setError("Give the item a name.");
      return;
    }

    if (draft.destination.startsWith("sack:")) {
      const sackId = draft.destination.slice(5);
      const sack = findItem(character.inventory, sackId);
      if (sack?.sackSize) {
        const max = sack.sackSize === "small" ? 2 : 4;
        const existing = (sack.contents ?? [])
          .filter((entry) => entry.id !== current?.id)
          .reduce((sum, entry) => sum + itemOwnSlots(entry), 0);
        const proposed: InventoryItem = {
          id: current?.id ?? "new",
          name: draft.name,
          quantity: draft.quantity,
          notes: draft.notes,
          location: "pack",
          slotRule: draft.slotRule,
          customSlots: draft.customSlots,
          sackSize: draft.sackSize || undefined,
          contents: current?.contents ?? [],
        };
        if (existing + itemOwnSlots(proposed) > max) {
          setError(`That would exceed this sack's ${max}-slot capacity.`);
          return;
        }
      }
    }
    onSave(draft);
  }

  return (
    <div className={styles.modalBackdrop} role="presentation" onMouseDown={onClose}>
      <section
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="item-editor-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className={styles.modalHead}>
          <h2 id="item-editor-title">{current ? "Edit item" : "Add item"}</h2>
          <button
            className={styles.iconButton}
            type="button"
            aria-label="Close"
            onClick={onClose}
          >
            ×
          </button>
        </header>
        <form className={styles.form} onSubmit={submit}>
          <div className={`${styles.field} ${styles.fieldWide}`}>
            <label htmlFor="item-name">Item name</label>
            <input
              id="item-name"
              autoFocus
              value={draft.name}
              onChange={(event) =>
                setDraft({ ...draft, name: event.target.value })
              }
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="item-quantity">Quantity</label>
            <input
              id="item-quantity"
              type="number"
              min="1"
              value={draft.quantity}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  quantity: Math.max(1, Number(event.target.value)),
                })
              }
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="item-type">Item type</label>
            <select
              id="item-type"
              value={draft.sackSize}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  sackSize: event.target.value as "" | SackSize,
                })
              }
            >
              <option value="">Normal item</option>
              <option value="small">Small sack</option>
              <option value="large">Large sack</option>
            </select>
          </div>

          {!draft.sackSize ? (
            <>
              <div className={styles.field}>
                <label htmlFor="slot-rule">Slot cost</label>
                <select
                  id="slot-rule"
                  value={draft.slotRule}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      slotRule: event.target.value as SlotRule,
                    })
                  }
                >
                  <option value="standard">1 slot</option>
                  <option value="free">Slot-free</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              {draft.slotRule === "custom" ? (
                <div className={styles.field}>
                  <label htmlFor="custom-slots">Total slots</label>
                  <input
                    id="custom-slots"
                    type="number"
                    min="0"
                    value={draft.customSlots}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        customSlots: Math.max(0, Number(event.target.value)),
                      })
                    }
                  />
                </div>
              ) : null}
            </>
          ) : null}

          <div className={`${styles.field} ${styles.fieldWide}`}>
            <label htmlFor="destination">Location</label>
            <select
              id="destination"
              value={draft.destination}
              onChange={(event) =>
                setDraft({ ...draft, destination: event.target.value })
              }
            >
              <optgroup label={character.name}>
                <option value="character:pack">Pack</option>
                <option value="character:armor">Armour</option>
                <option value="character:equipped1">Equipped item 1</option>
                <option value="character:equipped2">Equipped item 2</option>
              </optgroup>
              {!draft.sackSize && sacks.length ? (
                <optgroup label="Sacks">
                  {sacks.map((sack) => (
                    <option key={sack.id} value={`sack:${sack.id}`}>
                      Inside {sack.name}
                    </option>
                  ))}
                </optgroup>
              ) : null}
              <optgroup label="Party storage">
                {stores.map((store) => (
                  <option key={store.id} value={`store:${store.id}`}>
                    {store.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <div className={`${styles.field} ${styles.fieldWide}`}>
            <label htmlFor="item-notes">Description and notes</label>
            <textarea
              id="item-notes"
              value={draft.notes}
              onChange={(event) =>
                setDraft({ ...draft, notes: event.target.value })
              }
            />
          </div>

          {error ? <p className={styles.formError}>{error}</p> : null}

          <div className={styles.formActions}>
            {current ? (
              <button
                className={styles.dangerButton}
                type="button"
                onClick={onDelete}
              >
                Delete item
              </button>
            ) : null}
            <div className={styles.saveGroup}>
              <button
                className={styles.cancelButton}
                type="button"
                onClick={onClose}
              >
                Cancel
              </button>
              <button className={styles.primaryButton} type="submit">
                {current ? "Save changes" : "Add item"}
              </button>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}

export function CharacterApp() {
  const [state, setState] = useState<PrototypeState>(() => clonePrototype());
  const [selectedId, setSelectedId] = useState(prototypeState.characters[0].id);
  const [view, setView] = useState<View>("inventory");
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved) setState(JSON.parse(saved) as PrototypeState);
      } catch {
        // A prototype should remain usable if local storage is unavailable.
      }
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [hydrated, state]);

  const character =
    state.characters.find((entry) => entry.id === selectedId) ??
    state.characters[0];
  const load = useMemo(() => movement(character), [character]);

  function updateCharacter(change: (current: Character) => Character) {
    setState((current) => ({
      ...current,
      characters: current.characters.map((entry) =>
        entry.id === character.id ? change(entry) : entry,
      ),
    }));
  }

  function changeHp(amount: number) {
    updateCharacter((current) => ({
      ...current,
      hpCurrent: Math.min(
        current.hpMax,
        Math.max(0, current.hpCurrent + amount),
      ),
    }));
  }

  function stripItemEverywhere(
    current: PrototypeState,
    itemId: string,
  ): { next: PrototypeState; removed?: InventoryItem } {
    let removed: InventoryItem | undefined;
    const characters = current.characters.map((entry) => {
      const result = removeItem(entry.inventory, itemId);
      if (result.removed) removed = result.removed;
      return { ...entry, inventory: result.items };
    });
    const stores = current.stores.map((store) => {
      const result = removeItem(store.items, itemId);
      if (result.removed) removed = result.removed;
      return { ...store, items: result.items };
    });
    return { next: { characters, stores }, removed };
  }

  function saveItem(draft: ItemDraft) {
    setState((current) => {
      const itemId =
        editor?.item?.id ??
        `item-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const stripped = editor?.item
        ? stripItemEverywhere(current, itemId)
        : { next: current, removed: undefined };
      const savedItem: InventoryItem = {
        id: itemId,
        name: draft.name.trim(),
        quantity: draft.quantity,
        notes: draft.notes.trim(),
        location: "pack",
        slotRule: draft.sackSize ? "standard" : draft.slotRule,
        customSlots:
          !draft.sackSize && draft.slotRule === "custom"
            ? draft.customSlots
            : undefined,
        sackSize: draft.sackSize || undefined,
        contents: draft.sackSize
          ? (editor?.item?.contents ?? [])
          : undefined,
      };

      if (draft.destination.startsWith("store:")) {
        const storeId = draft.destination.slice(6);
        return {
          ...stripped.next,
          stores: stripped.next.stores.map((store) =>
            store.id === storeId
              ? { ...store, items: [...store.items, savedItem] }
              : store,
          ),
        };
      }

      if (draft.destination.startsWith("sack:")) {
        const sackId = draft.destination.slice(5);
        return {
          ...stripped.next,
          characters: stripped.next.characters.map((entry) =>
            entry.id === character.id
              ? {
                  ...entry,
                  inventory: addToSack(entry.inventory, sackId, savedItem),
                }
              : entry,
          ),
        };
      }

      const location = destinationLocation(draft.destination);
      savedItem.location = location;
      return {
        ...stripped.next,
        characters: stripped.next.characters.map((entry) => {
          if (entry.id !== character.id) return entry;
          let inventory = entry.inventory;
          if (location !== "pack") {
            inventory = inventory.map((existing) =>
              existing.location === location
                ? { ...existing, location: "pack" }
                : existing,
            );
          }
          return { ...entry, inventory: [...inventory, savedItem] };
        }),
      };
    });
    setEditor(null);
  }

  function deleteEditorItem() {
    if (!editor?.item) return;
    setState((current) =>
      stripItemEverywhere(current, editor.item!.id).next,
    );
    setEditor(null);
  }

  function resetPrototype() {
    if (!window.confirm("Reset all prototype changes on this device?")) return;
    const fresh = clonePrototype();
    setState(fresh);
    setSelectedId(fresh.characters[0].id);
    setView("inventory");
  }

  const armour = character.inventory.find((entry) => entry.location === "armor");
  const equipped1 = character.inventory.find(
    (entry) => entry.location === "equipped1",
  );
  const equipped2 = character.inventory.find(
    (entry) => entry.location === "equipped2",
  );
  const slotFree = character.inventory.filter(
    (entry) => entry.location === "pack" && itemCharacterSlots(entry) === 0,
  );
  const pack = character.inventory.filter(
    (entry) => entry.location === "pack" && itemCharacterSlots(entry) > 0,
  );

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <strong>Character Ledger</strong>
          <span>Hyperborea 3e prototype</span>
        </div>
        <div className={styles.topActions}>
          <span className={styles.localNote}>Saved on this device</span>
          <button
            className={styles.quietButton}
            type="button"
            onClick={resetPrototype}
          >
            Reset test data
          </button>
        </div>
      </header>

      <div className={styles.workspace}>
        <aside className={styles.roster} aria-label="Character roster">
          <p className={styles.eyebrow}>The company</p>
          <div className={styles.characterList}>
            {state.characters.map((entry) => (
              <button
                key={entry.id}
                className={`${styles.characterChip} ${
                  entry.id === character.id ? styles.characterChipActive : ""
                }`}
                type="button"
                onClick={() => setSelectedId(entry.id)}
              >
                <span className={styles.monogram}>
                  {characterInitials(entry.name)}
                </span>
                <span className={styles.chipText}>
                  <strong>{entry.name}</strong>
                  <span>
                    Level {entry.level} {entry.className}
                  </span>
                </span>
              </button>
            ))}
          </div>
          <p className={styles.rosterFoot}>
            Dummy values are illustrative. Inventory arithmetic follows the
            campaign house rules.
          </p>
        </aside>

        <main className={styles.main}>
          <section className={styles.hero}>
            <div>
              <p className={styles.eyebrow}>
                Level {character.level} {character.className}
              </p>
              <h1>{character.name}</h1>
              <p className={styles.epithet}>{character.epithet}</p>
            </div>
            <div className={styles.heroMeta}>
              <span>{character.race}</span>
              <span>{character.alignment}</span>
              <span>ST {character.attributes.st}</span>
            </div>
          </section>

          <section className={styles.vitals} aria-label="Character vitals">
            <div className={styles.vital}>
              <span className={styles.vitalLabel}>Hit points</span>
              <div className={styles.hpControl}>
                <button
                  className={styles.stepButton}
                  type="button"
                  aria-label="Reduce hit points"
                  onClick={() => changeHp(-1)}
                >
                  −
                </button>
                <strong className={styles.vitalValue}>
                  {character.hpCurrent}/{character.hpMax}
                </strong>
                <button
                  className={styles.stepButton}
                  type="button"
                  aria-label="Increase hit points"
                  onClick={() => changeHp(1)}
                >
                  +
                </button>
              </div>
            </div>
            <div className={styles.vital}>
              <span className={styles.vitalLabel}>Armour class</span>
              <strong className={styles.vitalValue}>{character.armourClass}</strong>
              <span className={styles.vitalSub}>{character.armour}</span>
            </div>
            <div className={styles.vital}>
              <span className={styles.vitalLabel}>Movement</span>
              <strong className={styles.vitalValue}>{load.current}′</strong>
              <span className={styles.vitalSub}>
                Base {character.baseMovement}′
              </span>
            </div>
            <div className={styles.vital}>
              <span className={styles.vitalLabel}>Fighting ability</span>
              <strong className={styles.vitalValue}>{character.fightingAbility}</strong>
              <span className={styles.vitalSub}>Editable class value</span>
            </div>
            <div className={styles.vital}>
              <span className={styles.vitalLabel}>Saving throw</span>
              <strong className={styles.vitalValue}>{character.savingThrow}</strong>
              <span className={styles.vitalSub}>Meet or exceed on d20</span>
            </div>
          </section>

          <nav className={styles.tabs} aria-label="Character sections">
            {(
              [
                ["inventory", "Inventory"],
                ["record", "Character"],
                ["party", "Party stores"],
              ] as [View, string][]
            ).map(([tab, label]) => (
              <button
                key={tab}
                className={`${styles.tab} ${
                  view === tab ? styles.tabActive : ""
                }`}
                type="button"
                onClick={() => setView(tab)}
              >
                {label}
              </button>
            ))}
          </nav>

          {view === "inventory" ? (
            <>
              <section
                className={`${styles.encumbrance} ${
                  load.over > 0 ? styles.encumbranceDanger : ""
                }`}
              >
                <div>
                  <div className={styles.meterHead}>
                    <strong>
                      {load.used} / {load.max} slots
                    </strong>
                    <span>
                      {load.over > 0
                        ? `${load.over} over capacity`
                        : `${load.max - load.used} slots open`}
                    </span>
                  </div>
                  <div
                    className={styles.meter}
                    role="meter"
                    aria-label="Inventory capacity"
                    aria-valuemin={0}
                    aria-valuemax={load.max}
                    aria-valuenow={load.used}
                  >
                    <div
                      className={styles.meterFill}
                      style={{
                        width: `${Math.min(100, (load.used / load.max) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
                <div className={styles.movementBreakdown}>
                  <strong>{load.current}′ movement</strong>
                  {load.penalty
                    ? `Base ${character.baseMovement}′ − ${load.penalty}′ encumbrance`
                    : `Base ${character.baseMovement}′ · no penalty`}
                </div>
              </section>

              <section className={styles.section}>
                <div className={styles.sectionHeading}>
                  <h2>Free loadout</h2>
                  <span>Armour + two equipped items</span>
                </div>
                <div className={styles.itemGrid}>
                  {[armour, equipped1, equipped2].map((entry, index) =>
                    entry ? (
                      <ItemCard
                        key={entry.id}
                        item={entry}
                        onOpen={() =>
                          setEditor({ item: entry, source: "character" })
                        }
                      />
                    ) : (
                      <div className={styles.emptyState} key={index}>
                        {index === 0 ? "No armour" : `Equipped item ${index}`}
                      </div>
                    ),
                  )}
                </div>
              </section>

              <section className={styles.section}>
                <div className={styles.sectionHeading}>
                  <h2>Slot-free and worn</h2>
                  <span>Player-designated</span>
                </div>
                {slotFree.length ? (
                  <div className={styles.itemGrid}>
                    {slotFree.map((entry) => (
                      <ItemCard
                        key={entry.id}
                        item={entry}
                        onOpen={() =>
                          setEditor({ item: entry, source: "character" })
                        }
                      />
                    ))}
                  </div>
                ) : (
                  <div className={styles.emptyState}>No slot-free items</div>
                )}
              </section>

              <section className={styles.section}>
                <div className={styles.sectionHeading}>
                  <h2>Pack</h2>
                  <button
                    className={styles.primaryButton}
                    type="button"
                    onClick={() =>
                      setEditor({
                        source: "character",
                        initialDestination: "character:pack",
                      })
                    }
                  >
                    + Add item
                  </button>
                </div>
                {pack.length ? (
                  <div className={styles.itemGrid}>
                    {pack.map((entry) => (
                      <ItemCard
                        key={entry.id}
                        item={entry}
                        onOpen={() =>
                          setEditor({ item: entry, source: "character" })
                        }
                      />
                    ))}
                  </div>
                ) : (
                  <div className={styles.emptyState}>The pack is empty</div>
                )}
              </section>
            </>
          ) : null}

          {view === "record" ? (
            <div className={styles.recordGrid}>
              <section className={styles.panel}>
                <h2>Attributes</h2>
                <div className={styles.attributeGrid}>
                  {Object.entries(character.attributes).map(([key, value]) => (
                    <div className={styles.attribute} key={key}>
                      <span>{key}</span>
                      <strong>{value}</strong>
                    </div>
                  ))}
                </div>
              </section>
              <section className={styles.panel}>
                <h2>Record</h2>
                <dl className={styles.detailList}>
                  <div className={styles.detailRow}>
                    <dt>Class</dt>
                    <dd>
                      Level {character.level} {character.className}
                    </dd>
                  </div>
                  <div className={styles.detailRow}>
                    <dt>Race</dt>
                    <dd>{character.race}</dd>
                  </div>
                  <div className={styles.detailRow}>
                    <dt>Alignment</dt>
                    <dd>{character.alignment}</dd>
                  </div>
                  <div className={styles.detailRow}>
                    <dt>Casting ability</dt>
                    <dd>{character.castingAbility ?? "—"}</dd>
                  </div>
                  <div className={styles.detailRow}>
                    <dt>Turning ability</dt>
                    <dd>{character.turningAbility ?? "—"}</dd>
                  </div>
                </dl>
              </section>
              <section className={styles.panel}>
                <h2>Class abilities</h2>
                <ul className={styles.abilityList}>
                  {character.abilities.map((ability) => (
                    <li key={ability}>{ability}</li>
                  ))}
                </ul>
              </section>
              <section className={styles.panel}>
                <h2>Prototype scope</h2>
                <p className={styles.rosterFoot}>
                  Class numbers are illustrative and editable in the data model.
                  The first prototype concentrates on table speed, inventory,
                  movement, and shared storage.
                </p>
              </section>
            </div>
          ) : null}

          {view === "party" ? (
            <div className={styles.storeGrid}>
              {state.stores.map((store) => {
                const total = store.items.reduce(
                  (sum, entry) => sum + itemOwnSlots(entry),
                  0,
                );
                return (
                  <section className={styles.storeCard} key={store.id}>
                    <div className={styles.storeCardHead}>
                      <div>
                        <h2>{store.name}</h2>
                        <p>
                          {store.kind} · {store.detail}
                        </p>
                      </div>
                      <span className={styles.storeCount}>
                        {store.capacity
                          ? `${total}/${store.capacity} slots`
                          : `${store.items.length} items`}
                      </span>
                    </div>
                    <div className={styles.storeItems}>
                      {store.items.map((entry) => (
                        <button
                          className={styles.storageButton}
                          key={entry.id}
                          type="button"
                          onClick={() =>
                            setEditor({
                              item: entry,
                              source: "store",
                              storeId: store.id,
                            })
                          }
                        >
                          <span>
                            {entry.name}
                            {entry.quantity > 1 ? ` ×${entry.quantity}` : ""}
                          </span>
                          <span>{itemOwnSlots(entry)} sl.</span>
                        </button>
                      ))}
                    </div>
                    <button
                      className={styles.primaryButton}
                      type="button"
                      style={{ marginTop: 12 }}
                      onClick={() =>
                        setEditor({
                          source: "store",
                          storeId: store.id,
                          initialDestination: `store:${store.id}`,
                        })
                      }
                    >
                      + Add to storage
                    </button>
                  </section>
                );
              })}
            </div>
          ) : null}
        </main>
      </div>

      {editor ? (
        <ItemEditor
          key={`${editor.item?.id ?? "new"}-${editor.initialDestination ?? ""}`}
          editor={editor}
          character={character}
          stores={state.stores}
          onClose={() => setEditor(null)}
          onSave={saveItem}
          onDelete={deleteEditorItem}
        />
      ) : null}
    </div>
  );
}
