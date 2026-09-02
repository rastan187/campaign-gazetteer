# Campaign Gazetteer

A lightweight, single-page visual reference for five campaign nations.

The site also includes a responsive, player-safe hex map at `/map`. The map
supports panning, zooming, touch input, and per-hex field notes. Terrain remains
visible in concealed hexes while feature icons and discovery text stay out of
the published dataset.

## Updating the map source

Keep complete GM maps outside this public repository—for example in
`E:\books\RPG\Hex Kit`. Never add a `.map` file to the repository. To publish
an update:

1. Open a map in Hex Kit and make the change.
2. To reveal a feature, remove Hex Kit's Fog of War tile from that hex. Make
   sure its label contains the name players should see.
3. Save the map, then double-click `Publish Map.cmd`. The launcher can stay in
   this repository or beside your Hex Kit maps.
4. Choose the `.map` file you just saved in the Windows file picker.
5. Leave the window open until it says the map was published. GitHub Pages
   normally refreshes within about two minutes.

The shortcut updates from GitHub first, rebuilds the player-safe map, performs
a privacy check, and publishes only the generated player files. Other local
work is not included in its commit. If an edit affects only concealed GM
material, it correctly reports that there are no player-visible changes.

The same workflow can be run from a terminal:

```bash
npm run map:publish
```

The generator writes `content/region1-player-map.json` and copies only the tile
images used by the player view into `public/map-tiles`. Concealed feature images
and notes are omitted rather than merely hidden with CSS. The tile folder is
replaced on each update so removed or newly concealed icons cannot linger as
stale public assets.

Rare per-map concealment exceptions can live beside a source map in a private
`<map-name>.player-overrides.json` sidecar. The publisher applies those rules
only while the affected hex still has Fog of War, and the sidecar is excluded
from Git so its coordinates never enter the public repository.

## Editing the writing

All public-facing copy lives in one file:

[`content/site.ts`](content/site.ts)

Open that file in any text editor and change only the words between quotation
marks. Keep the surrounding quotation marks and commas. Each nation has fields
for its name, native-language name, description, capital, gameable-site name,
site description, and Pinterest board URL.

## Editing a moodboard

Each nation has a `pinterestBoard` URL in `content/site.ts`:

```ts
pinterestBoard: "https://www.pinterest.com/miguelalopez/xiiom/",
```

Add, remove, and reorder Pins on Pinterest itself. The embedded board refreshes
from Pinterest without a site rebuild, although Pinterest may briefly cache
changes. Boards must remain public. If a board is renamed or replaced, update
its URL here. Pinterest controls the embedded layout and displays up to 50 Pins;
the site also provides a direct link to the full board.

## Local development

Requires Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Production check

```bash
npm run build
npm test
```

## Publishing

Pushes to the `main` branch publish automatically with GitHub Actions.

Live site:

https://rastan187.github.io/campaign-gazetteer/

The deployment workflow runs the static `npm run build:pages` build and uploads
the generated `out` directory to GitHub Pages.
