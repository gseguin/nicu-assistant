# Phase 42.1 Visual Regression Capture

**Workflow:** Capture `b-*` screenshots after Phase 42.1 lands, diff against the pre-existing `a-*` baseline at the repo root.

## Scope (23 captures total)

Routes (5) × Viewports (2) × Themes (2) = 20:

- `/morphine-wean` × {375x667, 1280x800} × {light, dark}
- `/formula` × {375x667, 1280x800} × {light, dark}
- `/gir` × {375x667, 1280x800} × {light, dark}
- `/feeds` × {375x667, 1280x800} × {light, dark}
- `/uac-uvc` × {375x667, 1280x800} × {light, dark}

Plus 3 special states:

- Hamburger drawer open (mobile)
- Disclaimer banner visible (clear localStorage to simulate fresh install) (mobile)
- AboutSheet open scrolled to the Disclaimer row (mobile)

## Naming

`b-{route-slug}-{viewport}-{theme}.png` — for example:

- `b-morphine-wean-mobile-light.png`
- `b-uac-uvc-desktop-dark.png`

Special states:

- `b-hamburger-open-mobile.png`
- `b-banner-visible-mobile-light.png`
- `b-aboutsheet-disclaimer-mobile-light.png`

## Diffing

Pair each `b-` capture with its `a-*` counterpart at the repo root (e.g. `a-morphine-mobile-light.png` ↔ `b-morphine-wean-mobile-light.png`). Use any image-diff tool (ImageMagick `compare`, Pixelmatch, or a Playwright snapshot diff).

Document material differences in `42.1-VERIFICATION.md` (a TBD file authored after the captures land).

## Capture instructions

1. `pnpm dev` (or `pnpm preview` post-build) so the live app is reachable.
2. Set the theme via the toggle in the title bar.
3. Set the viewport via browser DevTools or Playwright's `setViewportSize`.
4. Use Playwright codegen + `page.screenshot({ path: '.planning/ui-reviews/42.1-screenshots/b-...png' })` for repeatable, hydration-stable captures.
5. For the disclaimer-banner state, run `localStorage.clear()` before navigating so the banner renders.
6. For the hamburger state, click the menu button and wait for the `<dialog>` to be visible before capturing.

## Notes

The `b-*` screenshots are deliberately NOT committed to git — large binary artifacts. They live under `.planning/ui-reviews/42.1-screenshots/` for local diff workflows; add a per-developer `.gitignore` line if your local pipeline auto-generates them. The `42.1-VERIFICATION.md` doc that summarizes the diff outcome IS committed; the raw `b-*` PNGs are not.
