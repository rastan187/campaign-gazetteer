# Campaign Gazetteer

A lightweight, single-page visual reference for five campaign nations.

The site also includes a responsive, player-safe hex map at `/map`. The map
supports panning, zooming, touch input, and per-hex field notes. Terrain remains
visible in concealed hexes while feature icons and discovery text stay out of
the published dataset.

## Updating the map source

The committed player map is generated from the Hex Kit `.map` file and its tile
library:

```bash
npm run map:build
```

The generator writes `content/region1-player-map.json` and copies only the tile
images used by the player view into `public/map-tiles`. Concealed feature images
and notes are omitted rather than merely hidden with CSS.

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
