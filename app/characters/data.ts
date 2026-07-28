export type Attributes = {
  st: number;
  dx: number;
  cn: number;
  in: number;
  ws: number;
  ch: number;
};

export type ItemLocation = "pack" | "armor" | "equipped1" | "equipped2";
export type SlotRule = "standard" | "free" | "custom";
export type SackSize = "small" | "large";

export type InventoryItem = {
  id: string;
  name: string;
  quantity: number;
  notes: string;
  location: ItemLocation;
  slotRule: SlotRule;
  customSlots?: number;
  sackSize?: SackSize;
  contents?: InventoryItem[];
};

export type Character = {
  id: string;
  name: string;
  epithet: string;
  className: string;
  level: number;
  race: string;
  alignment: string;
  armour: string;
  baseMovement: number;
  hpCurrent: number;
  hpMax: number;
  armourClass: number;
  fightingAbility: number;
  savingThrow: number;
  castingAbility?: number;
  turningAbility?: number;
  attributes: Attributes;
  abilities: string[];
  inventory: InventoryItem[];
};

export type PartyStore = {
  id: string;
  name: string;
  kind: string;
  capacity?: number;
  detail: string;
  items: InventoryItem[];
};

export type PrototypeState = {
  characters: Character[];
  stores: PartyStore[];
};

const item = (
  id: string,
  name: string,
  options: Partial<InventoryItem> = {},
): InventoryItem => ({
  id,
  name,
  quantity: 1,
  notes: "",
  location: "pack",
  slotRule: "standard",
  ...options,
});

export const prototypeState: PrototypeState = {
  characters: [
    {
      id: "serafine",
      name: "Serafine Vale",
      epithet: "The Ashen Compact",
      className: "Warlock",
      level: 4,
      race: "Kelt",
      alignment: "Chaotic Good",
      armour: "Blackened mail",
      baseMovement: 30,
      hpCurrent: 21,
      hpMax: 27,
      armourClass: 4,
      fightingAbility: 3,
      savingThrow: 15,
      castingAbility: 4,
      attributes: { st: 13, dx: 15, cn: 12, in: 16, ws: 10, ch: 14 },
      abilities: [
        "Sorcerous casting",
        "Weapon mastery: broad sword",
        "Familiar bond",
      ],
      inventory: [
        item("ser-armour", "Blackened mail", { location: "armor" }),
        item("ser-sword", "Moon-bitten broad sword", {
          location: "equipped1",
          notes: "+1 weapon; cold iron edge",
        }),
        item("ser-wand", "Wand of blue embers", {
          location: "equipped2",
          notes: "4 charges",
        }),
        item("ser-cloak", "Ash-grey travelling cloak", { slotRule: "free" }),
        item("ser-book", "Grimoire of the Outer Dark", {
          customSlots: 2,
          slotRule: "custom",
        }),
        item("ser-potions", "Healing draughts", { quantity: 2 }),
        item("ser-rope", "Silk rope, 50 feet"),
        item("ser-chalk", "Chalk and sealing wax", { slotRule: "free" }),
      ],
    },
    {
      id: "oruk",
      name: "Oruk Cold-Eye",
      epithet: "Voice Beneath the Ice",
      className: "Shaman",
      level: 5,
      race: "Esquimaux",
      alignment: "Neutral",
      armour: "Hide armour",
      baseMovement: 30,
      hpCurrent: 31,
      hpMax: 31,
      armourClass: 5,
      fightingAbility: 3,
      savingThrow: 14,
      castingAbility: 5,
      turningAbility: 4,
      attributes: { st: 16, dx: 11, cn: 15, in: 9, ws: 17, ch: 12 },
      abilities: ["Spirit communion", "Ecclesiastical spells", "Totem ward"],
      inventory: [
        item("oru-armour", "White bear hide", { location: "armor" }),
        item("oru-spear", "Whalebone spear", { location: "equipped1" }),
        item("oru-totem", "Raven-skull totem", {
          location: "equipped2",
          notes: "Holy symbol",
        }),
        item("oru-charms", "Bone and sinew charms", { slotRule: "free" }),
        item("oru-sack", "Small sealskin sack", {
          sackSize: "small",
          contents: [
            item("oru-herbs", "Bitter healing herbs"),
            item("oru-coins", "Silver coins", {
              quantity: 85,
              notes: "Loose coin",
            }),
          ],
        }),
        item("oru-blanket", "Fur sleeping roll", {
          customSlots: 2,
          slotRule: "custom",
        }),
      ],
    },
    {
      id: "maelis",
      name: "Maelis of the Reed",
      epithet: "Keeper of the Fen",
      className: "Druid",
      level: 4,
      race: "Amazon",
      alignment: "Neutral",
      armour: "Leather armour",
      baseMovement: 40,
      hpCurrent: 19,
      hpMax: 24,
      armourClass: 6,
      fightingAbility: 2,
      savingThrow: 15,
      castingAbility: 4,
      attributes: { st: 10, dx: 14, cn: 13, in: 12, ws: 16, ch: 11 },
      abilities: ["Druidic spells", "Woodland stride", "Animal friendship"],
      inventory: [
        item("mae-armour", "Oiled leather armour", { location: "armor" }),
        item("mae-staff", "Blackthorn staff", { location: "equipped1" }),
        item("mae-sling", "Sling", { location: "equipped2" }),
        item("mae-wreath", "Reed-and-amber wreath", { slotRule: "free" }),
        item("mae-satchel", "Herbalist's satchel"),
        item("mae-stones", "Sling stones", { quantity: 20 }),
        item("mae-lantern", "Hooded lantern"),
        item("mae-oil", "Oil flasks", { quantity: 3 }),
        item("mae-net", "Weighted marsh net", {
          customSlots: 2,
          slotRule: "custom",
        }),
        item("mae-reeds", "Bundle of whispering reeds", { slotRule: "free" }),
      ],
    },
    {
      id: "cassian",
      name: "Brother Cassian",
      epithet: "The Last Bell",
      className: "Cleric",
      level: 5,
      race: "Common",
      alignment: "Lawful Good",
      armour: "Plate mail",
      baseMovement: 20,
      hpCurrent: 34,
      hpMax: 38,
      armourClass: 2,
      fightingAbility: 3,
      savingThrow: 13,
      castingAbility: 5,
      turningAbility: 5,
      attributes: { st: 15, dx: 9, cn: 16, in: 10, ws: 18, ch: 13 },
      abilities: ["Ecclesiastical spells", "Turn undead", "Lay ministry"],
      inventory: [
        item("cas-armour", "Sun-disc plate mail", { location: "armor" }),
        item("cas-mace", "Flanged mace", { location: "equipped1" }),
        item("cas-shield", "Round shield of Helios", { location: "equipped2" }),
        item("cas-symbol", "Golden solar medallion", { slotRule: "free" }),
        item("cas-water", "Holy water", { quantity: 3 }),
        item("cas-kit", "Field chirurgeon's kit", {
          customSlots: 2,
          slotRule: "custom",
        }),
        item("cas-rations", "Iron rations", { quantity: 7 }),
      ],
    },
    {
      id: "hroth",
      name: "Hroth Vitrsson",
      epithet: "Stone-Speaker",
      className: "Runegraver",
      level: 4,
      race: "Viking",
      alignment: "Lawful Neutral",
      armour: "Chain mail",
      baseMovement: 30,
      hpCurrent: 28,
      hpMax: 32,
      armourClass: 4,
      fightingAbility: 3,
      savingThrow: 14,
      castingAbility: 4,
      turningAbility: 4,
      attributes: { st: 17, dx: 10, cn: 15, in: 13, ws: 16, ch: 8 },
      abilities: ["Runegraving", "Ecclesiastical spells", "Turn undead"],
      inventory: [
        item("hro-armour", "Riveted chain mail", { location: "armor" }),
        item("hro-axe", "Bearded axe", { location: "equipped1" }),
        item("hro-hammer", "Rune hammer", { location: "equipped2" }),
        item("hro-ring", "Oath-ring of carved jet", { slotRule: "free" }),
        item("hro-tools", "Runegraver's tools"),
        item("hro-sack", "Large canvas sack", {
          sackSize: "large",
          contents: [
            item("hro-silver", "Silver ingots", {
              customSlots: 2,
              slotRule: "custom",
            }),
            item("hro-coal", "Consecrated charcoal"),
          ],
        }),
        item("hro-spikes", "Iron spikes", { quantity: 6 }),
      ],
    },
    {
      id: "nyx",
      name: "Nyx Farrow",
      epithet: "No Door Unopened",
      className: "Thief",
      level: 5,
      race: "Half-Blood Pict",
      alignment: "Chaotic Neutral",
      armour: "Leather armour",
      baseMovement: 40,
      hpCurrent: 18,
      hpMax: 23,
      armourClass: 5,
      fightingAbility: 2,
      savingThrow: 14,
      attributes: { st: 9, dx: 18, cn: 12, in: 14, ws: 10, ch: 15 },
      abilities: ["Backstab", "Climb", "Tinker", "Move silently"],
      inventory: [
        item("nyx-armour", "Supple leather armour", { location: "armor" }),
        item("nyx-dagger", "Star-metal dagger", { location: "equipped1" }),
        item("nyx-bow", "Short bow", { location: "equipped2" }),
        item("nyx-boots", "Soft-soled boots", { slotRule: "free" }),
        item("nyx-picks", "Lock picks", { slotRule: "free" }),
        item("nyx-arrows", "Arrows", { quantity: 20 }),
        item("nyx-line", "Silk line and hook"),
        item("nyx-mirror", "Steel mirror", { slotRule: "free" }),
        item("nyx-sack", "Empty small sack", { sackSize: "small", contents: [] }),
      ],
    },
  ],
  stores: [
    {
      id: "mule",
      name: "Old Chalk",
      kind: "Pack mule",
      capacity: 24,
      detail: "Tethered outside the ruin",
      items: [
        item("mule-rations", "Iron rations", { quantity: 28 }),
        item("mule-water", "Water skins", { quantity: 8 }),
        item("mule-tent", "Canvas pavilion", {
          customSlots: 4,
          slotRule: "custom",
        }),
      ],
    },
    {
      id: "cart",
      name: "The Red Cart",
      kind: "Two-wheeled cart",
      capacity: 60,
      detail: "Camped at the standing stones",
      items: [
        item("cart-tools", "Mining tools", {
          customSlots: 5,
          slotRule: "custom",
        }),
        item("cart-chest", "Locked iron chest", {
          customSlots: 4,
          slotRule: "custom",
        }),
        item("cart-oil", "Lamp oil", { quantity: 12 }),
      ],
    },
    {
      id: "bag",
      name: "The Bottomless Satchel",
      kind: "Enchanted container",
      detail: "Carried by Brother Cassian",
      items: [
        item("bag-idol", "Serpentine idol"),
        item("bag-scroll", "Sealed funerary scroll"),
      ],
    },
  ],
};

