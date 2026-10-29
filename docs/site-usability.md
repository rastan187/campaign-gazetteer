# Site usability implementation

Existing routes (`/`, `/campaign-primer/`, `/map/`, `/house-rules/`, and `/characters/`) and all existing realm and reference heading anchors are retained. No redirects or record migrations are introduced.

## Player-facing changes

- Shared navigation, mobile menu, skip link, footer, and modal search on the four reference pages.
- A realm index separate from site navigation. The requested revision removes the Start Here / Ready to Play boxes, decorative eyebrow headings, brand strapline, primer summary box, and promotional transition copy. Reference pages use plain titles and functional labels. The prototype's decorative roster label is removed while character level/class remain as ordinary data text.
- Characters links open the existing shared Google Sheets ledger in a separate tab. The owner explicitly approved publishing this link. Its existing Google permissions continue to govern access. No spreadsheet values, formulas, sharing settings, or character records were edited.
- Search uses only public Markdown, realm copy, and the already-sanitized player map. Neither the spreadsheet nor prototype records enter the index.
- Reference contents include subsections, indicate the current topic, remain reachable on narrow screens, and close after selecting a topic. Heading links can be copied. Existing IDs are pinned in `content/section-ids.json`.
- Primer images open at full size. Related links connect the primer, gazetteer, rules, and map. Print styles omit navigation and controls.
- Pinterest boards are visible by default, with an independent Hide/Show control for each board. Direct Pinterest links remain available when embeds fail.
- Map fitting accommodates narrow viewports. Added name/coordinate lookup, a published-location list, hash links for hexes, browser-history handling, view memory, non-drag panning controls, keyboard exploration, pinch zoom, collapsible mobile details, and an artwork failure message.
- A useful 404 page offers navigation and search.

## Character prototype scope

The `/characters/` app is a separate older prototype, not the shared Google Sheets ledger used by players. Its storage key, storage schema, save/load code, and other calculations are retained. Apart from the subsequently requested removal of decorative headings, only these changes were made:

1. HP may go below zero; the existing maximum-HP ceiling remains.
2. Undo restores the last 20 item deletions during the current page visit. It restores the deleted subtree to its original owner/container and position without restoring an entire earlier character snapshot. Later HP, notes, items, and other owners' records are retained. Occupied equipment slots cause restoration into the pack; duplicate IDs, full containers, and missing original containers stop restoration with an explanation instead of overwriting data. Resetting prototype test data clears this visit's deletion history.

## Extending the site

- Add major resources to `content/navigation.ts`; the header and footer share this registry. Set the active route through `SiteHeader` on a new reference page.
- Keep durable reference section IDs in `content/section-ids.json`. When renaming a heading, associate its new title with the existing ID. Add compatibility anchors if an ID must ever change.
- Use `readReference`, `Contents`, and `ReferenceHeading` for new Markdown reference pages. Keep page-local links separate from global navigation.
- Extend `publicSearchEntries()` with published content types only. Private source maps, concealment sidecars, and character records must never be inputs.
- Add future session reports, NPCs, factions, and locations under a few durable navigation groups when there is enough actual content. No empty sections or invented campaign updates were added.

## Boasting duration

The referee confirmed **3 days**. The summary table and detailed rule now agree, including the restriction on other downtime activities during those three days.

## Validation and preview

Use Node.js 24 (the GitHub Pages workflow already uses 24). Build the deployment with `GITHUB_PAGES=true`, `NEXT_PUBLIC_SITE_URL=https://rastan187.github.io/campaign-gazetteer`, and `next build`. The local production export was also checked using `next build --webpack`.

After exporting, run:

```sh
node --test tests/public-pages.test.mjs tests/inventory-undo.test.mjs
node scripts/preview-pages.mjs
```

The preview serves only `out` at `http://localhost:4173/campaign-gazetteer/`. Its local-only `/__preview/phone` page embeds the actual exported site in a 390-pixel viewport; use `?page=map/`, `?page=house-rules/`, or `?page=campaign-primer/` to inspect another page. This harness is not part of the published export.

Validation covers all old routes and heading IDs, reference navigation, private-record exclusion from reference pages, public map assets, selective deletion restoration, collision handling, and full-container handling. Browser checks cover search-to-rule navigation, phone menus and section jumps, phone map fit, location selection, negative HP, and delete/undo retaining negative HP. Two-finger pinch was implemented but was not verified on physical touch hardware.

The branch is prepared for review before production rollout. The Pages workflow publishes only after a merge/push to main.
