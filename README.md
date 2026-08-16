# nekoweb graphics site template

A self-regenerating graphics gallery for [Nekoweb](https://nekoweb.org). Drop
images or clips into a folder under `data/`, push to GitHub, and the whole
site — pages, masonry grids, and navigation — rebuilds and deploys itself.
No dashboard, no manual HTML editing.

## How it works

1. Each subfolder directly inside `data/` is a category (`pixels`, `stamps`,
   `buttons`, whatever you want) and becomes its own page at `/<folder>/`.
2. Any image or video you drop into a folder shows up on that folder's page
   in a masonry (Pinterest-style) grid, with a click-to-enlarge lightbox.
3. The site nav is generated from whatever folders currently exist in
   `data/` — add a folder, it appears in the nav; delete one, it's gone.
4. On every push to `main`, a GitHub Action runs the build script (scans
   `data/`, regenerates every page) and deploys the result to your Nekoweb
   site with [deploy2nekoweb](https://deploy.nekoweb.org).

Nothing is client-side/dynamic — everything is plain static HTML generated
at build time, so it works within Nekoweb's static hosting.

> [!NOTE]
> This folder is a standalone template. GitHub Actions only reads workflows
> from a repo's root `.github/`, so to actually get auto-deploys, either
> use this folder as the root of its own new repo, or copy its contents
> (including the dotfiles: `.github/`, `.gitignore`) to the root of the repo
> you want to deploy from.

## Adding graphics

Just add files. No config required.

```
data/
  pixels/
    heart.gif
    star.png
  stamps/
    100x100-cats.png
  buttons/
    88x31-neko.gif
```

Supported types: `.png .jpg .jpeg .gif .webp .avif .svg` (images) and
`.mp4 .webm` (video). Anything else in a data folder is ignored.

Files are sorted alphabetically (naturally — `img2` sorts before `img10`).
The folder name becomes its page title, title-cased (`cool-pixels` →
"Cool Pixels").

### Optional: per-folder `_meta.json`

Drop a `_meta.json` into any folder under `data/` to override its title,
add a description, or pin a specific file order:

```json
{
  "title": "Pixels",
  "description": "100x100 icons, free to use, please credit!",
  "order": ["featured.gif", "heart.png"]
}
```

`order` only needs to list the files you want pinned first — everything
else is appended after, alphabetically. `_meta.json` files are never
copied into the deployed site.

### Site-wide settings: `site.config.json`

```json
{
  "title": "my graphics site",
  "description": "free-to-use pixels, stamps, buttons & other web graphics",
  "accent": "#ff8fb3",
  "order": ["pixels", "stamps", "buttons"],
  "footer": "made with deploy2nekoweb"
}
```

- `order` — folder slugs in the order you want them in the nav/homepage.
  Any folder not listed is appended afterward, alphabetically by title.
- `accent` — the site's accent color (nav pills, active link, hover
  outline).
- Everything is optional; delete a key to fall back to the default.

## Local development

```sh
npm run build   # generates the site once into dist/
npm run watch   # rebuilds automatically as you edit data/ or src/
```

Then serve `dist/` with any static server, e.g. `npx serve dist` or
`python3 -m http.server -d dist`, and open it in a browser.

`dist/` is generated output — it's git-ignored and rebuilt from scratch on
every build.

## Deploying to Nekoweb

1. **Get a Nekoweb API key.** Log into your Nekoweb site, go to
   Settings → API keys, and generate one.
2. **Add repo secrets** (GitHub repo → Settings → Secrets and variables →
   Actions):
   - `NEKOWEB_API_KEY` — the key from step 1.
   - `NEKOWEB_DOMAIN` — your Nekoweb site name (the part before
     `.nekoweb.org`, not the full URL).
   - `NEKOWEB_USERNAME` — your Nekoweb username (optional, only needed for
     the "Recently Updated" feature on Nekoweb's discovery page).
3. **Push to `main`.** `.github/workflows/deploy.yml` builds the site and
   uploads `dist/` with
   [deploy2nekoweb](https://github.com/deploy2nekoweb/deploy2nekoweb).

> [!WARNING]
> deploy2nekoweb **wipes** the target path on your Nekoweb site and
> replaces it with `dist/` on every deploy. Don't hand-edit files on
> Nekoweb directly — anything not produced by this build gets deleted on
> the next push.

## Customizing the look

- `src/assets/css/style.css` — all styling, including the masonry grid
  (`.grid`, CSS `column-count`, responsive breakpoints) and the lightbox.
- `src/assets/js/lightbox.js` — plain vanilla JS, no dependencies.
- `scripts/templates.js` — the HTML templates (layout, nav, homepage,
  folder pages). Edit these to change page structure/markup.
- `scripts/build.js` — the scanning/generation logic itself (supported
  extensions, slugifying, sorting).

Everything in `src/assets/` is copied as-is into `dist/assets/`.

## Project structure

```
data/                  # drop your media here — one subfolder per page
  pixels/
  stamps/
  buttons/
src/assets/            # CSS + JS, copied straight into the built site
scripts/
  build.js             # scans data/, generates dist/
  templates.js          # HTML templates
site.config.json       # site title, nav order, accent color
.github/workflows/deploy.yml   # build + deploy on push to main
```
