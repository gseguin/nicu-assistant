# Phase 40: Favorites Store + Hamburger Menu - Context

**Gathered:** 2026-04-23
**Status:** Ready for planning
**Mode:** `--auto` (all decisions are recommended defaults — review before planning if any feel wrong)

<domain>
## Phase Boundary

Clinicians can open a hamburger menu, see every registered calculator, and star/unstar calculators to choose which appear in their nav — with a cap of 4 favorites enforced and their choices surviving across sessions. **NavShell rendering is unchanged in this phase** — it still renders all 4 v1.12 calculators as tabs. Phase 41 flips NavShell to read from the favorites store. This keeps Phase 40 independently verifiable (favorites can be written + read without any visible nav change) and makes Phase 41 a single-commit NavShell flip.

**Requirements covered:** FAV-01..07, NAV-HAM-01..05, FAV-TEST-01, FAV-TEST-02 (14 requirements).

</domain>

<decisions>
## Implementation Decisions

### Hamburger button placement & icon
- **D-01 [auto / recommended]:** Hamburger button lives in the title bar as the **leftmost action button** in the existing right-side action cluster — order becomes: `Menu, Info, Theme`. Visible on all viewports (not mobile-only), 48×48 touch target, uses `@lucide/svelte`'s `Menu` icon (already the Lucide standard; no new dep).
  - Rationale: consistent with the existing `icon-btn` pattern in `NavShell.svelte`; Menu-left keeps Info/Theme anchored right so muscle memory from v1.12 is preserved. Desktop needs the hamburger too (Phase 42 puts UAC/UVC behind the hamburger even on desktop, since the top nav becomes favorites-only in Phase 41).
  - Why not mobile-only: v1.13 goal is "hamburger is the path to non-favorited calculators" — desktop users with 4 favorites also need a way to reach UAC/UVC.

### Hamburger menu presentation
- **D-02 [auto / recommended]:** Full-screen **`<dialog>`-based modal sheet** using `HTMLDialogElement.showModal()`, mirroring the v1.4 SelectPicker + AboutSheet pattern. Uses the existing `--color-scrim` token for backdrop. Closes on Esc, scrim click, and close-button click. Focus returns to the hamburger button on close.
  - Rationale: zero new dependencies, proven a11y (SelectPicker unit tests cover Esc + focus return + jsdom polyfill), consistent with every other overlay in the app (AboutSheet, DisclaimerModal, SelectPicker).
  - Why not a side-drawer: drawers need custom focus-trap + swipe + animation code; `<dialog>` gives us focus trap and Esc for free.

### Menu row composition (per calculator)
- **D-03 [auto / recommended]:** Each row is a `<div>` with an internal layout of: `icon | label | star-button`. The **row itself is NOT a button** — instead, the label+icon area is an `<a href={calc.href}>` link, and the star is a sibling `<button>`. Tapping the link navigates and closes the menu; tapping the star toggles the favorite without navigating and without closing the menu.
  - Rationale: single-element "row is a button with a nested star button" causes interactive-nested-interactive a11y violations and iOS Safari double-activation bugs. Two siblings side-by-side are unambiguous for AT and touch. Prior v1.12 pattern confirmed this when porting EPIC paste interactions.
  - Menu closes on navigation link activation (not on star toggle) so the user can quickly star multiple calculators in one visit without reopening.

### Star button semantics & visual state
- **D-04 [auto / recommended]:** Star icon is `@lucide/svelte`'s `Star` for unfavorited and `Star` with `fill="currentColor"` for favorited (single icon, two visual states — no icon swap). `aria-pressed` toggles `true`/`false`; `aria-label` is dynamic: `"Add Morphine Wean to favorites"` / `"Remove Morphine Wean from favorites"`. 48×48 touch target.
  - Rationale: `aria-pressed` is the correct ARIA pattern for toggle buttons (vs `role="switch"` which implies on/off binary state across a setting surface — wrong semantic for a collection-add action). Single icon with `fill` avoids layout shift when toggling.
  - Color: the star uses `--color-identity` of the row's calculator when favorited, neutral `--color-text-secondary` when unfavorited. Ties the star to the tab identity system already shipped in v1.5.

### Cap-full state — visible feedback
- **D-05 [auto / recommended]:** When `favorites.size >= 4`, star buttons on **non-favorited** rows are rendered as `<button disabled aria-disabled="true">` with:
  - Visual: `opacity-60 cursor-not-allowed`, no hover tint.
  - Accessible label extended: `"Add UAC/UVC to favorites (limit reached — remove one to add another)"`.
  - No tooltip needed for MVP — the extended aria-label reads to AT, and the disabled visual reads to sighted users. Add a small helper caption **at the top of the menu** when cap is reached: `"4 of 4 favorites — remove one to add another."` (single-line, `text-2xs`, `--color-text-secondary`).
  - Rationale: disabled + aria-disabled is the accessible primitive; avoids native tooltip inconsistency across OS/browsers. Menu-level caption gives sighted users the "why" without needing to hover each disabled star.
  - Favorited stars stay enabled at cap — the user can always un-star.

### Favorites storage shape
- **D-06 [auto / recommended]:** Store as a JSON array of calculator ids (not a set, not an object map), versioned with a schema key:
  ```json
  { "v": 1, "ids": ["morphine-wean", "formula", "gir", "feeds"] }
  ```
  - Key: `nicu:favorites`.
  - Storage: `localStorage` (persists across sessions per FAV-03).
  - Array (not Set) so order is meaningful (D-07). Schema version (`v: 1`) lets Phase 41+ migrate without breaking if the shape evolves.
  - Invalid payload (bad JSON, missing `v`, missing `ids`, non-array `ids`, unknown schema version): silently fall back to defaults. Store owns the recovery logic; consumers always see a valid array.

### Favorite order
- **D-07 [auto / recommended]:** Order is **registry order** — the array is always kept in the same order as `CALCULATOR_REGISTRY` appears, regardless of insertion order. Newly favorited calculators slot into their registry position, not at the end.
  - Rationale: predictable bottom-bar order for clinicians ("Morphine is always leftmost, Formula is always second"). Avoids the "did I unfavorite Formula and re-add it, or not?" cognitive tax. Matches the current v1.12 bottom-bar order exactly.
  - Implication: FAV-06 ("stable order") is satisfied trivially because order is a pure function of registry + favorites-set, not a mutable ordering the user controls. Drag-reorder is Out of Scope per REQUIREMENTS.md, so no conflict.

### Schema-safe recovery (FAV-07)
- **D-08 [auto / recommended]:** On load:
  1. Parse JSON; if it throws, reset to defaults.
  2. Validate shape (`{ v: 1, ids: string[] }`); if invalid, reset to defaults.
  3. Filter `ids` to only those present in `CALCULATOR_REGISTRY` (drops stale ids silently).
  4. Cap the filtered list at 4 (drops overflow if the stored value violates the cap, e.g., from a future schema downgrade).
  5. If the filtered list is empty, reset to defaults (`['morphine-wean', 'formula', 'gir', 'feeds']`).
  6. Sort by registry order (D-07) before returning.
  - Defaults are recomputed from `CALCULATOR_REGISTRY.map(c => c.id).slice(0, 4)` — not a hardcoded array — so the default "adapts" if registry order ever changes (it won't without explicit intent, but this future-proofs the recovery path).

### First-run seeding
- **D-09 [auto / recommended]:** If `localStorage` has no `nicu:favorites` key, initialize to `['morphine-wean', 'formula', 'gir', 'feeds']` and write to storage immediately. This makes the "first-run default" indistinguishable from "user who favorited exactly these 4" — Phase 41 can read the store without caring which case it's in.
  - Covers FAV-04 and the follow-up question from milestone scoping.

### Store API shape (Svelte 5 runes)
- **D-10 [auto / recommended]:** Expose as a `.svelte.ts` singleton (same pattern as `theme.svelte.ts`, `disclaimer.svelte.ts`, calculator state singletons). API:
  ```ts
  export const favorites = {
    get current(): readonly CalculatorId[];
    get count(): number;
    get isFull(): boolean;                  // count >= MAX
    has(id: CalculatorId): boolean;
    toggle(id: CalculatorId): void;         // add if absent & not full; remove if present
    canAdd(id: CalculatorId): boolean;      // !has(id) && !isFull
  };
  export const FAVORITES_MAX = 4;
  ```
  - `toggle()` is a no-op if trying to add while full — UI uses `canAdd()` to disable the star BEFORE the user taps; `toggle()`'s guard is defense-in-depth.
  - `current` exposed as readonly array so downstream NavShell (Phase 41) cannot mutate.
  - Reactivity via Svelte 5 `$state` internally; `get` accessors return the reactive value so consumers using `{favorites.current}` re-render on change.

### Cap constant
- **D-11 [auto / recommended]:** `FAVORITES_MAX = 4`, exported from the favorites module. NOT in `config.json` — this is a hard UX constraint tied to the 375px mobile bottom-bar layout, not a clinical parameter.
  - Rationale: Changing the cap requires re-auditing the bottom-bar layout (touch targets, safe-area padding, labels) — not a value a clinician should tweak. Code-level constant makes the coupling explicit.

### Menu rendering source
- **D-12 [auto / recommended]:** The hamburger menu iterates `CALCULATOR_REGISTRY` directly, not a separate "menu items" config. Registry IS the catalog (NAV-HAM-02).
  - Order in menu = registry order = same as favorite order (D-07). Visual consistency between menu and bottom bar.
  - New calculators added to the registry appear in the menu automatically — zero touch to the hamburger code when Phase 42 adds UAC/UVC.

### Keyboard navigation (NAV-HAM-04)
- **D-13 [auto / recommended]:** Rely on native `<dialog>` + native link/button tab order. Tab moves: `[close-button, link1, star1, link2, star2, ...]`. Shift+Tab reverses. Enter on a link = navigate + close. Enter or Space on a star = toggle. Esc = close. Focus returns to the hamburger `<button>` on close (native `<dialog>` behavior).
  - No roving tabindex, no custom arrow-key handling — menu is short (≤8 items for the foreseeable future), plain tab order is clear and standard.
  - Close button is the first tab stop so users can escape without traversing the list.

### Reduced-motion and identity
- **D-14 [auto / recommended]:** Open/close animations gated behind `prefers-reduced-motion: reduce` (follow the v1.10 GIR dock-magnification + v1.6 result-pulse pattern). Backdrop uses `--color-scrim`. Menu header reads `"Calculators"` (not `"Menu"` — clinical context first).

### Out-of-scope for this phase (explicit)
- **D-OUT-01:** NavShell does NOT read the favorites store in Phase 40. Bottom bar / top nav still render all 4 registered calculators hardcoded from the current logic. Phase 41 flips this. **Why:** keeps Phase 40 a pure additive change — the hamburger ships, users can toggle favorites, but the bottom bar doesn't move. Phase 41 is then a single-commit flip backed by a fully-tested favorites store.
- **D-OUT-02:** UAC/UVC calculator is not in the registry yet (lands in Phase 42). The hamburger shows the 4 existing calculators.
- **D-OUT-03:** No per-breakpoint cap in Phase 40. If the 4-cap feels tight in practice, FAV-FUT-02 revisits this in a future milestone.

### Claude's Discretion
- Exact pixel values for scrim opacity (match existing SelectPicker).
- Exact transition durations (match existing modal patterns; gate on reduced-motion).
- Whether the menu header shows the app version — can be added if it fits naturally, but not required.
- Unit-test file organization: co-located `favorites.test.ts` beside `favorites.svelte.ts`, per project convention.
- Whether to throttle/batch `localStorage` writes (the store writes on every toggle; for a 4-max set this is fine, but can be batched if profiling shows it matters).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone-level
- `.planning/PROJECT.md` — Core value, constraints (tech stack, PWA-only, WCAG 2.1 AA, 48px touch targets), v1.13 milestone goals.
- `.planning/REQUIREMENTS.md` — All 41 v1.13 requirements; this phase covers FAV-01..07, NAV-HAM-01..05, FAV-TEST-01..02.
- `.planning/ROADMAP.md` §"v1.13" — Phase 40–43 definitions, order rationale, success criteria.

### Existing code that informs this phase
- `src/lib/shell/NavShell.svelte` — Current title bar + bottom bar + desktop top nav; Phase 40 adds a hamburger button to the title bar action cluster WITHOUT changing nav rendering.
- `src/lib/shell/registry.ts` — `CALCULATOR_REGISTRY` is the source of truth for the hamburger's list; `CalculatorEntry.identityClass` union is used for the favorited-star color.
- `src/lib/shared/types.ts` §`CalculatorId` — Favorites store types its array as `CalculatorId[]`.
- `src/lib/shared/components/SelectPicker.svelte` + `SelectPicker.test.ts` — Reference pattern for `<dialog>`-based modal with focus return, Esc close, scrim backdrop, and jsdom polyfill test setup.
- `src/lib/shared/components/AboutSheet.svelte` — Reference pattern for a calculator-scoped side-sheet with `<dialog>` semantics.
- `src/lib/shared/theme.svelte.ts` — Reference pattern for a `.svelte.ts` singleton using Svelte 5 runes with a `get`-accessor API and `localStorage` persistence (theme is the closest architectural analog to the favorites store).
- `src/lib/shared/disclaimer.svelte.ts` — Another localStorage-backed singleton; reference for schema-safe recovery patterns.
- `src/test-setup.ts` — Existing jsdom polyfills for `HTMLDialogElement`, `matchMedia`, `Element.animate` that favorites tests will inherit.

### Spreadsheets / clinical sources
- None for this phase (pure navigation infrastructure). UAC/UVC spreadsheet references are relevant only to Phase 42.

### A11y / design tokens
- `src/app.css` — `--color-scrim`, `--color-text-secondary`, `--color-text-primary`, `--color-border`, `--color-surface`, `--color-identity` tokens used by the hamburger.
- Existing Playwright axe suite in `e2e/` — Phase 40 extends this with a hamburger-open axe sweep (light + dark) in FAV-TEST-04 (actually in Phase 41 per roadmap, but the fixture setup lands here).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`<dialog>` modal pattern** — SelectPicker + AboutSheet + DisclaimerModal all use `HTMLDialogElement.showModal()` with `--color-scrim` backdrop, Esc close, and focus return. Copy that pattern for the hamburger menu. Zero new components needed beyond the hamburger itself.
- **`icon-btn` utility class in `app.css`** — Used by Info + Theme buttons in the title bar. The hamburger button uses the same class for visual consistency.
- **`@lucide/svelte` `Menu` and `Star` icons** — Already installed (v1.12 bumped to `@lucide/svelte` 1.8.0). No new icon deps.
- **`theme.svelte.ts` singleton pattern** — Closest architectural sibling: localStorage persistence, Svelte 5 `$state` rune, `get current()` accessor, singleton export. Favorites store mirrors this shape exactly.
- **`jsdom` dialog polyfill in `src/test-setup.ts`** — Existing self-test guards against the polyfill breaking; favorites tests inherit this for free.

### Established Patterns
- **`.svelte.ts` for reactive singletons** — Not classes, not stores, not props. Module-scoped `$state` with exported `get`-accessor object. 5 existing examples.
- **`localStorage` schema + recovery** — `theme.svelte.ts` reads with try/catch, falls back to defaults on any failure. Favorites store follows the same defensive pattern but with stricter shape validation (D-08) because the payload is richer than a single string.
- **Co-located Vitest tests** — `favorites.test.ts` next to `favorites.svelte.ts`, not in `__tests__/`. Project memory `feedback_test_colocation.md` confirms.
- **ARIA conventions** — `aria-pressed` on toggles, `aria-label` for icon-only buttons, `aria-disabled` + native `disabled` on cap-full stars. Consistent with SelectPicker / SegmentedToggle ARIA.
- **Identity-class consumption** — v1.5 `identityClass` field on registry entries drives `--color-identity` — reused by the favorited-star color (D-04) so the star visually ties to the calculator's tab color.

### Integration Points
- **`NavShell.svelte` — title bar action cluster** — Insert hamburger button as the leftmost of the three action buttons (Menu, Info, Theme). Import `Menu` icon from `@lucide/svelte`.
- **`src/lib/shell/` — new component** — `HamburgerMenu.svelte` lives here alongside `NavShell.svelte`. It receives no props (reads registry + favorites store directly); exposes an `open: boolean` bind or an imperative `open()` method — recommended: bind pattern matching SelectPicker so `NavShell` stays declarative.
- **`src/lib/shared/` — new singleton** — `favorites.svelte.ts` alongside `theme.svelte.ts`. Imported by `HamburgerMenu.svelte` (star toggle + cap check) and, in Phase 41, by `NavShell.svelte` (render only favorited tabs).
- **Test setup (`src/test-setup.ts`)** — No changes needed. jsdom dialog polyfill already present.
- **`CALCULATOR_REGISTRY` in `src/lib/shell/registry.ts`** — No changes in Phase 40 (UAC/UVC is added in Phase 42). The hamburger iterates this array as-is.

</code_context>

<specifics>
## Specific Ideas

- The hamburger icon lives LEFT of Info + Theme in the title bar action cluster — matches mental model of "menu > info > display setting" hierarchy.
- The menu header reads **"Calculators"** not "Menu" — clinical-context-first labeling, consistent with app tone.
- Favorited star is filled + tinted with the calculator's identity hue (Morphine blue, Formula teal, GIR green, Feeds terracotta) — ties the star to the tab identity system so the visual pattern is "star color = tab color".
- When the cap is reached, the menu shows a single-line caption at the top: `"4 of 4 favorites — remove one to add another."` — zero-jargon, action-oriented.

</specifics>

<deferred>
## Deferred Ideas

- **Drag-reorder favorites** — FAV-FUT-01 (REQUIREMENTS.md). Registry-order D-07 makes order stable without user-controlled reordering; revisit only if users ask.
- **Per-breakpoint cap** — FAV-FUT-02. Holding at 4 for v1.13 per milestone scoping.
- **Export / import favorites** — FAV-FUT-03. Requires surface we don't have; not in v1.13.
- **Search box in hamburger** — CAT-FUT-01. Relevant only past ~8 calculators; 5 is still easy to scan.
- **Visible "recent" or "active-but-not-favorited" indicator in the menu** — Considered for UX clarity when the user is looking at UAC/UVC (non-favorited) and opens the menu; decided the active row's `aria-current="page"` on the internal link is sufficient. Revisit if users complain about "where am I in the menu".
- **Haptic feedback on star toggle** — iOS PWA limitation; not worth the fragmentation for v1.13.

</deferred>

---

*Phase: 40-favorites-store-hamburger-menu*
*Context gathered: 2026-04-23 (auto mode — 14 decisions auto-selected from recommended defaults)*
