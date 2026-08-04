# Jiankang Historical Network

A static website about Buddhist people, institutions, inscriptions, images, objects, legends, and landscapes in Jiankang and Nanjing.

## Site structure

- `index.html` — compiled interactive network homepage
- `pages/monk-day.html` — daily monastic life
- `pages/monks.html` — historical monk profiles
- `pages/buddhist-objects.html` — Buddhist objects and places
- `pages/buddhist-images.html` — Buddhist image traditions
- `pages/buddhist-legends.html` — legends and sacred memory
- `pages/buddhist-branches.html` — Buddhist branches in Nanjing
- `pages/temple-map.html` / `pages/maps.html` — historical temple atlas
- `pages/inscriptions.html` — Qixia inscription archive
- `pages/figures.html` — connected historical figures

## Assets

- `site.js` and `site.css` — compiled homepage bundle loaded by `index.html`
- `assets/css/site-shell.css` — small maintainable navigation layer around the compiled homepage
- `assets/styles.css` and `assets/static-pages.css` — shared styles for the historical-network pages
- `assets/css` — page-specific legacy styles
- `assets/js/temple-map.js` — interactive temple-map rendering and dialog behavior
- `assets/js/temple-data.js` — temple records, period definitions, image paths, and research text
- `assets/js/home-links.js` — maps legacy links emitted by the compiled homepage to `pages/`
- `assets/images/home` — images referenced by the compiled homepage
- `assets/images` — remaining map, inscription, and documentary images

All local images belong under `assets/images/`; the validation script rejects image files added to the repository root.

## Development

Run a local server from the repository root so module and asset paths behave like they do in production:

```sh
python3 -m http.server 4173
```

Run the repository checks before committing:

```sh
npm run check
```

When shared navigation changes, edit `scripts/site-navigation.mjs` and synchronize the seven historical-network pages:

```sh
npm run sync-nav
```

The check covers local references, JavaScript syntax, page metadata, heading structure, Qixia image loading hints, and exact duplicate image files.

Each page includes Open Graph title and description metadata. Add canonical URLs and absolute social-preview images only after the project's public deployment URL is confirmed.

The React/Vite source project and source maps for `site.js` and `site.css` are not included in this repository. Treat these two files as generated artifacts: avoid formatting them by hand, and make homepage shell changes in `index.html` and `assets/css/site-shell.css`. The image path strings in `site.js` were updated mechanically when the homepage images moved into `assets/images/home/`.
