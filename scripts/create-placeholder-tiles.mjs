import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const output = new URL("../public/images/moodboard/", import.meta.url);
await mkdir(output, { recursive: true });

const sources = ["gilded-reach", "verdant-crown", "iron-coast"];
const tiles = [
  { suffix: "01", left: 0, top: 0, width: 768, height: 512, out: [720, 480] },
  { suffix: "02", left: 768, top: 0, width: 768, height: 512, out: [420, 560] },
  { suffix: "03", left: 0, top: 512, width: 768, height: 512, out: [520, 520] },
  { suffix: "04", left: 768, top: 512, width: 768, height: 512, out: [760, 420] },
];

await Promise.all(
  sources.flatMap((source) =>
    tiles.map((tile) =>
      sharp(fileURLToPath(new URL(`../public/images/${source}.png`, import.meta.url)))
        .extract({
          left: tile.left,
          top: tile.top,
          width: tile.width,
          height: tile.height,
        })
        .resize(tile.out[0], tile.out[1], { fit: "cover" })
        .webp({ quality: 82 })
        .toFile(fileURLToPath(new URL(`${source}-${tile.suffix}.webp`, output))),
    ),
  ),
);

console.log("Created temporary moodboard tiles.");
