# Rakesh Surampalli — Portfolio

My portfolio, built as a macOS desktop. **[rakeshsurampalli.github.io/Rakesh_portfolio](https://rakeshsurampalli.github.io/Rakesh_portfolio/)**

It opens with a macOS-setup style greeting sequence — **hello → bonjour → welcome** — each written on in script, then hands off to the desktop.

One screen, no scrolling. The profile lives in a Find My window; everything else is behind apps in the dock. Windows drag, resize, minimise and zoom. **⌘K** opens Spotlight.

Hand-written HTML, CSS, and JavaScript. No framework, no build step, no dependencies.

---

## Running locally

```bash
python -m http.server 3000
```

Then open <http://localhost:3000>. (VS Code: the *Serve Portfolio* task in `.vscode/tasks.json` does the same.)

Don't open `index.html` over `file://` — the self-hosted fonts and the `<picture>` sources need a real origin.

## Deploying

GitHub Pages, **deploy from branch → `main` → `/ (root)`**. Pushing to `main` publishes. No CI step.

`.nojekyll` is deliberate: without it Pages runs the site through Jekyll, which silently drops anything whose name starts with `_`.

---

## Structure

```
index.html      Menu bar, wallpaper, five app windows, dock. Icon sprite at the top of <body>.
styles.css      Tokens, boot screen, window chrome, each app, then the compact layout.
script.js       Window manager (open/close/minimize/zoom/drag/focus) + the terminal.
fonts/          Self-hosted woff2. No Google Fonts request.
img/            WebP with PNG fallbacks, favicons, and the OG card.
tools/          One-off asset scripts. Not part of any build.
Rakesh_CV.pdf   Résumé — loaded lazily, only when Preview is first opened.
```

### The apps

| Window | Holds | Opens with |
|---|---|---|
| **Find My** | Name, title, location, bio, contact actions | dock, `a`, `open about` |
| **Terminal** | Everything, via commands | dock, `~`, `open terminal` |
| **Finder** | The three projects, with live / code / case-study links | dock, `p`, `projects` |
| **Notes** | Experience, Skills, Education + three case studies | dock, `n`, `experience` / `skills` / `education` |
| **Safari** | Live embeds of the actual project sites | dock, `s` |
| **Mail** | A real contact form (Formspree) | dock, `m` |
| **Photos** | Screenshots of each project | dock |
| **Preview** | The résumé PDF | dock, `r`, `resume` |
| **About This Engineer** | Spec-sheet bio | Apple menu |

Desktop icons (Projects, Screenshots, Case Studies, Résumé.pdf) open the same windows. A single
click opens them — authentic macOS wants a double-click, but visitors read a dead single click as
a broken page.

### Spotlight

**⌘K** (or the menu-bar magnifier) opens a fuzzy search over apps, notes, case studies, projects,
individual skills, jobs and links. Arrow keys move, Enter runs, Esc closes. The index is built from
the DOM on first open, so new content in Notes or Finder appears in search automatically — nothing
to register by hand. Matching is accent-insensitive, so "resume" finds "Résumé".

### Safari and framing

Safari embeds the real project sites in an iframe. **GitHub and LinkedIn cannot be embedded** — they
send `X-Frame-Options: deny` and `frame-ancestors 'self'` respectively, and every browser honours
that. Those two tabs show the same "refuses to be displayed" card real Safari shows, plus an
Open-in-new-tab button. There is no client-side workaround and none should be attempted.

Terminal commands: `help`, `about`, `experience`, `skills`, `education`, `projects`, `resume`, `contact`, `email`, `github`, `linkedin`, `open <app>`, `whoami`, `pwd`, `ls`, `date`, `echo`, `clear`. Arrow keys walk the history; `⌃L` clears.

## Design tokens

All in `:root` at the top of `styles.css`. Fonts: **Inter** (UI), **JetBrains Mono** (terminal and
labels), **Instrument Serif** (names and figures), **Pacifico** (the boot "hello").

| Token | Value | Why |
|---|---|---|
| `--accent` | `#0a84ff` | Apple system blue, used as a **mark** colour — 5.5:1 on the desktop, 4.6:1 on glass |
| `--accent-fill` | `#0b6ad2` | Filled buttons. White on `#0a84ff` is only **3.65:1** — Apple's own buttons fail AA, so the fill is a step deeper (5.2:1) |
| `--accent-soft` | `#64d2ff` | Highlights and the "needs your input" markers |
| `--win-bg` | `rgba(20,20,32,.76)` | The glass material, plus `--glass-blur` |
| `--text-1/2/3` | `#f2f3f5` / `#aeb6c4` / `#98a0b0` | Lightened for glass: the whole ramp clears AA even over the brightest part of the wallpaper |

**If you change the glass alpha, re-check the text ramp.** At 76% over the brightest wallpaper patch
the worst case is `--text-3` at 4.8:1. Drop much below that and muted text stops passing. Measured
against real rendered pixels, not just the token values.

---

### Boot screen

`#boot` covers the viewport and writes each greeting in Pacifico in turn, then fades out. The reveal is a soft-edged
`mask-image` slid across the word (`@keyframes boot-write`) rather than a stroke animation — a font
glyph is a filled outline, so stroke-drawing it would trace the outline instead of the pen stroke.

- Greetings live in `GREETINGS` in `script.js`. **Keep them Latin** — Pacifico has no Devanagari or CJK glyphs, so a non-Latin greeting renders as tofu.
- ~820ms write + 210ms hold + 260ms fade per word; the last one fades with the whole overlay. ~4.4s total. Tune via `WRITE_MS` / `HOLD_MS` / `LEAVE_MS`.
- Click anywhere, press any key, or hit **Skip** to dismiss early.
- The dismissing keypress is captured and `stopPropagation`'d so it does not also fire a desktop shortcut.
- Under `prefers-reduced-motion` the wipe is dropped and it shows for ~0.9s.
- It is scoped to `.js`, so a visitor without JavaScript never sees an overlay nothing can dismiss.

## Things worth knowing before editing

- **The page must never scroll.** `html, body { height: 100%; overflow: hidden }`. Content scrolls *inside* windows. If something makes the body scroll, that is a bug.
- **Window geometry is defined twice, on purpose.** CSS (`.win-findmy` etc.) sets the default so windows are correctly sized on first paint; `placeWindow()` in `script.js` then clamps them to the actual viewport. Without the CSS half, windows briefly render shrink-to-fit and look broken on a slow load.
- **Don't hide the icon sprite with `display: none`.** Chrome then refuses to resolve `url(#gradient)` paint servers defined inside it and every gradient-filled icon renders blank. It is hidden with `.sprite { position: absolute; width: 0; height: 0; overflow: hidden }` instead.
- **`data-open="<id>"` is the universal launcher.** Dock buttons, Finder sidebar rows, and the Résumé pill all use it. Add the attribute and the handler picks it up — no new wiring.
- **The résumé PDF is lazy.** `#cv-frame` has no `src` in the HTML; `openWindow('preview')` sets it the first time. Don't put it back in the markup.
- **Compact layout is one window at a time.** Under 860px wide (or 560px tall) every window goes full-bleed and `.window.is-open:not(.is-front)` is hidden, so the dock acts as an app switcher. Dragging is disabled there.
- **Reduced motion is handled in CSS**, and `script.js` exposes `reduceMotion()` if you add anything animated in JS.
- **Resize grips must sit inside the frame.** `.window` is `overflow: hidden` for its rounded corners, and that clips hit-testing too — a grip at a negative offset is invisible to the pointer.
- **Window placement reserves a 128px gutter on the right** so the desktop icons are not buried the moment the page loads.
- **Dock magnification grows the icon's `width`, not `transform: scale()`.** Scaling makes an icon spill over its neighbours; growing the box makes the flex row reflow so they move aside, which is what the real dock does. Sizes come from `--dock-size`.
- **The dock drops GitHub and LinkedIn below 400px.** Ten icons do not fit a small phone, and both are already in the Find My card and Spotlight.
- **The Notes sidebar has two lists** (`#nt-tabs` and `#nt-tabs-cs`). `NOTE_TABS` covers both — bind and highlight through it, or the case studies silently stop responding.
- **There is no Apple logo.** The menu-bar mark is a monochrome dog silhouette (`#i-dog`); the dock icons are original SVG, not Apple artwork. Keep it that way.

## Regenerating assets

Images (only if you replace a source file):

```bash
python tools/optimize-images.py
```

Project screenshots (`img/shot-*.webp`, `img/thumb-*.webp`) are headless-Chrome captures of the live
sites, resized to 1200×750 and 480×300. Re-shoot them when a project's landing page changes.

The OG card (`img/og-cover.jpg`) is a real 1200×630 screenshot of the desktop taken through Chrome's DevTools Protocol — it has to be captured after JavaScript has placed the windows, so a plain `--screenshot` run catches them mid-layout and looks wrong. Keep it JPEG or PNG; LinkedIn and Slack do not reliably unfurl WebP.

---

© Rakesh Surampalli
