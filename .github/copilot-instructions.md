# Copilot / AI agent instructions

Rakesh Surampalli's portfolio, built as a **macOS desktop**: one screen, no scrolling, content held in draggable app windows. Vanilla HTML + CSS + JS. **No framework, no bundler, no package.json, no build step.** Deployed to GitHub Pages from `main` at the repo root.

Files: `index.html`, `styles.css`, `script.js`, plus `fonts/`, `img/`, `tools/`.

## Ground rules

- **Do not introduce a build step, a framework, or npm dependencies.** The deployed files are the source files.
- **Do not add CDN links.** Fonts are self-hosted in `fonts/`; icons are an inline SVG `<symbol>` sprite at the top of `<body>`. Zero external origins, by design.
- **Use the design tokens** in `:root` at the top of `styles.css`. Never hard-code a hex value or a duration in a component rule.
- **The page must never scroll.** `html, body { overflow: hidden }`. Anything long scrolls inside its window body. A body scrollbar is a bug.

## Architecture invariants

Each of these caused a real bug when violated. Do not undo them.

1. **The sprite is hidden with zero size, not `display: none`.** `.sprite { position: absolute; width: 0; height: 0; overflow: hidden }`. Under `display: none` Chrome will not resolve `url(#gradient)` paint servers defined inside it, and every gradient-filled dock icon renders blank.
2. **Window geometry is defined in both CSS and JS, deliberately.** `.win-findmy`/`.win-terminal`/… in `styles.css` set defaults so the windows are sized correctly on first paint. `placeWindow()` in `script.js` then clamps to the real viewport. Deleting the CSS half makes windows render shrink-to-fit before JS runs.
3. **`data-open="<windowId>"` is the only launcher mechanism.** Dock buttons, Finder sidebar rows, and the Résumé pill all rely on it. Add the attribute rather than new click handlers.
4. **`#cv-frame` has no `src` in the markup.** `openWindow('preview')` assigns it on first open so the PDF is not fetched on every page load.
5. **Compact layout shows one window at a time.** Under 860px wide or 560px tall, `.window` goes full-bleed with `!important` and `.window.is-open:not(.is-front)` is hidden; the dock becomes an app switcher. `isCompact()` in `script.js` must agree with that media query — change both together.
6. **Percentage `max-height` on logos does not work.** It has to resolve through the grid area and silently no-ops when it can't, letting a 640px logo render full size. Use an absolute cap (see `.fd-thumb img`).
7. **Reduced motion** is handled in CSS; use `reduceMotion()` from `script.js` before adding any JS-driven animation.
8. **The boot screen is `.js`-scoped.** `.boot { display: none }` with `.js .boot { display: grid }`. Never make it visible unconditionally — without JavaScript nothing would ever remove it and the site would be a dead purple screen. `initBoot()` owns dismissal and must always call its `onDone` callback.
9. **The "hello" reveal is a mask slide, not a stroke draw.** Pacifico glyphs are filled outlines; `stroke-dasharray` on them traces the outline, not the pen stroke. Keep `mask-position` animation.
10. **Resize grips live inside the frame.** `.window` is `overflow: hidden`, which clips hit-testing as well as paint, so a grip at a negative offset cannot be clicked. Keep `.rs-*` at `0`, never negative.
11. **Placement reserves `iconGutter = 128` on the right.** Without it the default Terminal position lands on top of the desktop icons.
12. **Never try to iframe GitHub or LinkedIn.** `X-Frame-Options: deny` / `frame-ancestors 'self'`. Tabs marked `data-noframe="1"` render the blocked card instead; that is correct behaviour, not a bug to fix.
13. **Filled accent surfaces use `--accent-fill`, never `--accent`.** White on `#0a84ff` is 3.65:1 and fails AA; `--accent-fill` (`#0b6ad2`) is 5.2:1. `--accent` is for text, marks, borders and focus rings only.
14. **Glass alpha and the text ramp are coupled.** `--win-bg` at 76% keeps `--text-3` at 4.8:1 over the brightest wallpaper. Lower the alpha or darken the text and muted copy stops passing — re-measure against rendered pixels if you touch either.
15. **The Notes sidebar is two lists.** Use the `NOTE_TABS` selector (`#nt-tabs li, #nt-tabs-cs li`); binding only the first silently breaks the case studies.
16. **No Apple logo anywhere.** The menu-bar mark is a monochrome dog silhouette (`#i-dog`) and every dock icon is original SVG. Do not reintroduce Apple artwork.
16b. **Dock magnification is width-based, never `transform: scale()`.** Scaling overlaps neighbours instead of displacing them. Icon size comes from `--dock-size`; the falloff radius is deliberately tight (~92px) so only the hovered icon and its immediate neighbours grow.
17. **Spotlight builds its index from the DOM** (`buildSpotlightIndex`) on first open. Add content to Notes or Finder and it becomes searchable with no extra registration. Keep `deburr()` in the matcher so accented titles stay findable.

## Content map

| Window id | App | Content |
|---|---|---|
| `findmy` | Find My | Name, title, location, bio, contact pills |
| `terminal` | Terminal | Interactive commands; drives the other windows |
| `finder` | Finder | Projects — FinAI, Tudu, Atharva |
| `notes` | Notes | Experience / Skills / Education, switched by `showNote()` |
| `preview` | Preview | Résumé PDF |
| `safari` | Safari | Live iframes of the project sites; blocked card for GitHub/LinkedIn |
| `mail` | Mail | Contact form, posts to Formspree over fetch |
| `photos` | Photos | Project screenshots with an in-window viewer |
| `about` | About This Engineer | Spec-sheet bio, opened from the Apple menu |

The boot screen (`#boot`) is not a window — it is a one-shot overlay above everything at `z-index: 9000`.

Terminal output is plain text — no emoji. Keep command descriptions short; `help` renders them in a padded column.

## Before you commit

- Confirm the page does not scroll at 1440×900 and at 390×844.
- `grep -n 'href="#"' index.html` must return nothing.
- Open every window from the dock and check each one still fits above the dock.
- Check the dock icons still render (they break silently if the sprite hiding changes).
- Confirm the dock does not overflow at 360px, and that desktop icons are not covered by a window on load.
- Open Spotlight and search a project, a skill and "resume"; all three must return results.
- Click every row in both Notes sidebar lists, including the case studies.
