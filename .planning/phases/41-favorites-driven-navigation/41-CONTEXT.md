# Phase 41: Favorites-Driven Navigation - Context

**Gathered:** 2026-04-23
**Status:** Ready for planning
**Mode:** `--auto` (all decisions are recommended defaults — review before planning if any feel wrong)

<domain>
## Phase Boundary

Flip `NavShell.svelte` so the mobile bottom bar and desktop top nav render only the favorited calculators (in favorite order, i.e. registry order filtered by `favorites.current`). When a user navigates to a non-favorited calculator via the hamburger, the bar does NOT grow a temporary tab — the header/title indicates the active route instead. Phase 40 already shipped the favorites store + hamburger menu + the hamburger button wiring in `NavShell`; this phase is the single-responsibility flip from "render all registered calculators" to "render only favorites", plus the Playwright E2E + axe coverage required by FAV-TEST-03 and FAV-TEST-04.

**Requirements covered:** NAV-FAV-01..04, FAV-TEST-03, FAV-TEST-04 (6 requirements).

**Explicit non-goals (belong to other phases):**
- No new calculator, no new registry entry (Phase 42 adds UAC/UVC).
- No changes to the favorites store shape or API (Phase 40 locked these).
- No hamburger menu changes — that component is feature-complete from Phase 40 and is the designated path to non-favorited calculators.
- No version bump or AboutSheet edit (Phase 43).

</domain>

<decisions>
## Implementation Decisions

### Render source for both nav bars
- **D-01 [auto / recommended]:** Both nav bars (mobile bottom + desktop top) iterate a single derived value: `favorites.current.map(id => byId.get(id)).filter(Boolean)`, where `byId` is a module-scope `Map<CalculatorId, CalculatorEntry>` built from `CALCULATOR_REGISTRY`. The `.filter(Boolean)` is defense-in-depth — the favorites store already filters unknown ids via D-08 recovery, but the map lookup makes the render path null-safe if registry entries are ever removed.
  - Rationale: single source of truth for "which tabs render" means mobile and desktop can never drift. `Map` lookup is O(1) vs iterating the registry for each id; matters for E2E test perf where favorites toggle rapidly.
  - Derivation lives in `NavShell.svelte` via `$derived`, NOT in the favorites store itself. The store owns ids; NavShell owns the id→entry resolution. Keeps the store dependency-free and registry-free at the data layer.
  - Registry order is preserved because `favorites.current` is already sorted by registry order (Phase 40 D-07 / favorites.svelte.ts:59).

### Handling of the "no favorites" edge case
- **D-02 [auto / recommended]:** Treat "zero favorites" as unreachable in practice — the favorites store's D-08 recovery pipeline already guarantees a minimum of the defaults (`['morphine-wean', 'formula', 'gir', 'feeds']`) on first run, and the hamburger menu blocks the user from un-starring below 1 only... actually the store does NOT enforce a minimum (Phase 40 D-10 `toggle()` removes freely). So: if `favorites.current.length === 0`, the bars render empty — no placeholder, no fallback to "all calculators". The hamburger button in the title bar remains the escape hatch, so users can always re-favorite something.
  - Rationale: A "zero favorites" state is user-chosen (they actively un-starred every tab) and is recoverable via the always-visible hamburger. Adding a fallback "render the registry if empty" creates a second render path that masks a real UX signal ("I intentionally cleared my favorites").
  - Not adding a minimum-1 constraint to the store in this phase (that would be a Phase 40 change, and it wasn't scoped there). Flagged as a candidate for Deferred Ideas.

### Active-route indication when active is NOT a favorite (NAV-FAV-03 + NAV-FAV-04)
- **D-03 [auto / recommended]:** When the user is on `/uac-uvc` (in Phase 42) or any other non-favorited route, the mobile bottom bar and desktop top nav indicate NO active tab (no `aria-current`, no identity color, no underline on any rendered tab). The route identity is carried by the AboutSheet / page `<h1>` / calculator-page chrome instead — those live in the route, not in NavShell.
  - Rationale: NAV-FAV-03 explicitly says the bars do NOT grow a temporary tab, and NAV-FAV-04 says the hamburger button does NOT gain `aria-current` for non-favorited active routes. Leaving all rendered nav items in their "inactive" visual state is the correct signal: "none of these is what you're looking at right now."
  - Downstream implication (caught for Phase 42): the UAC/UVC page needs to self-identify its route via on-page header chrome since NavShell won't highlight it. Noted in Deferred Ideas so Phase 42's research picks it up.

### ARIA semantics for the nav bars
- **D-04 [auto / recommended]:** **Keep the existing `role="tab"` + `aria-selected` pattern** currently in NavShell — do NOT migrate to `aria-current="page"` despite the ROADMAP.md Phase 41 line "`aria-current="page"` semantics preserved." The roadmap line is describing the HAMBURGER's `aria-current` (which is already wired on the in-hamburger link list via `page.url.pathname.startsWith(calc.href)`), not an ARIA migration of the nav bars.
  - Rationale: the v1.0 nav bars shipped as `role="tab"` / `aria-selected` (NAV-FAV-01/02 call out "preserving the v1.4 shell styling" — and the shell's ARIA is part of that shell). Flipping to `aria-current="page"` would change the exposed role from "tablist with a selected tab" to "navigation with a current page" — audible to screen readers. Not required by the requirements wording.
  - NAV-FAV-04 ("`aria-current="page"` logic unchanged") is satisfied by NOT touching that logic — the HamburgerMenu already sets `aria-current="page"` correctly based on pathname (HamburgerMenu.svelte:101); that behavior is unchanged by Phase 41.
  - If any requirements auditor pushes back during `/gsd-secure-phase`, the deferred idea "ARIA: nav bars → `role="navigation"` with `aria-current="page"`" is ready to be pulled forward as its own phase.

### `activeCalculatorId` derivation in NavShell
- **D-05 [auto / recommended]:** Replace the hardcoded ternary in `NavShell.svelte` (`activeCalculatorId = $derived<CalculatorId>(page.url.pathname.startsWith('/formula') ? 'formula' : ...)`) with a registry-driven lookup:
  ```ts
  const activeCalculatorId = $derived<CalculatorId | undefined>(
    (CALCULATOR_REGISTRY.find((c) => page.url.pathname.startsWith(c.href))?.id as CalculatorId) ?? undefined
  );
  ```
  and let `AboutSheet` accept `CalculatorId | undefined` (fallback to a default calculator — likely `morphine-wean`, since that's what the hardcoded fallback was).
  - Rationale: (a) The hardcoded ternary was a Phase 36-39 latent debt that happened to work for 4 calculators but will silently bucket `/uac-uvc` as `morphine-wean` in Phase 42 — fixing it now is a one-line Wave-0-style cleanup that Phase 42 would otherwise need to do. (b) A registry-driven `activeCalculatorId` is necessary anyway because Phase 42's UAC/UVC calculator needs to be the active id when on `/uac-uvc`, and that id isn't in the hardcoded union branches today.
  - Done in this phase because this file (`NavShell.svelte`) is being edited for D-01 / D-02 / D-03 regardless — doing the `activeCalculatorId` fix in the same phase avoids a redundant edit + commit in Phase 42.
  - Acceptable even though the roadmap attributes this to Phase 42 — Phase 42's success criteria only require that UAC/UVC is reachable from the hamburger; the `activeCalculatorId` cleanup is plumbing that Phase 42 benefits from but Phase 41 needs for its own correctness once the bars render only favorites.
  - **Scope-guardrail check:** This is a Wave-0 cleanup inside a file we're already editing, not a new capability — aligned with the v1.8 "Wave 0 latent-bug fixes before feature work" Key Decision.

### AboutSheet + `activeCalculatorId` contract
- **D-06 [auto / recommended]:** `AboutSheet` continues to receive a `calculatorId` prop. When `activeCalculatorId` is `undefined` (user on `/` or some future non-calculator route), pass a sensible default (`'morphine-wean'` — same as the current hardcoded fallback). No change to `AboutSheet.svelte` itself in Phase 41.
  - Rationale: keeps Phase 41's footprint confined to `NavShell.svelte` + the favorites-driven E2E tests. `AboutSheet` and its per-calculator copy are phase-neutral.

### First-render correctness (Svelte 5 SSR + client init)
- **D-07 [auto / recommended]:** `favorites.init()` is already called in `+layout.svelte` `onMount` (Phase 40 D-10 + the shipped init wiring per commit `733f45e`). During the brief window between `onMount`-triggered init and the first `$state` write, `favorites.current` is `[]` (initialized to `[]` in the store at `favorites.svelte.ts:70`). On client-hydrated SSR output the initial render will therefore show an empty bar for one paint.
  - Mitigation: seed `_ids` synchronously to `defaultIds()` at module scope so the very first render (before `init()` ever runs) shows the defaults. `init()` then reconciles with localStorage — which in the default case is a no-op visual, and in the "user has custom favorites" case flips the bar contents on the first microtask after mount.
  - Rationale: visible "blink" from empty-bar to default-bar would look like a regression from v1.12 for the vast majority of users (who will be on the default set). Seeding to defaults means the first paint is always valid, and localStorage reconciliation is the async adjustment.
  - **Implementation note:** change `let _ids = $state<CalculatorId[]>([])` to `let _ids = $state<CalculatorId[]>(defaultIds())` in `favorites.svelte.ts`. This is a one-line tweak to a Phase 40 file — justified because Phase 40 never exercised the "what does NavShell render before init()?" question (NavShell didn't consume the store in Phase 40). Document in the Phase 41 commit message that this is a latent-init fix.
  - Alternative considered: gate NavShell rendering on `favorites.initialized`. Rejected because it introduces a loading-skeleton state for what should be instantaneous nav, and `initialized` is already exposed by the store (Phase 40 D-10 extension) for other uses.

### Focus / keyboard behavior when favorites change mid-session
- **D-08 [auto / recommended]:** If the user un-favorites the current active calculator from the hamburger (e.g., they're on `/gir` and un-star GIR), the bar silently removes the GIR tab. The user stays on `/gir` — no auto-redirect, no toast. When they close the hamburger, focus returns to the hamburger button (Phase 40 D-02 behavior), NOT to the now-missing GIR tab.
  - Rationale: auto-redirecting would confuse clinicians ("I just opened the menu, why am I suddenly on Morphine?"). Leaving them on `/gir` is consistent with NAV-FAV-03 (non-favorited routes are reachable and don't grow temporary tabs). The active-route indication for the now-non-favorited route is handled by D-03 (no tab lit) plus the hamburger being the path to get back there.
  - Edge case captured in E2E (FAV-TEST-03): part of the flow is "open hamburger → unfavorite current tab → close → confirm bar updated AND URL unchanged".

### Mobile + desktop consistency
- **D-09 [auto / recommended]:** Mobile bottom bar and desktop top nav both read the SAME derived value from D-01 — do not introduce per-breakpoint favorite lists. Desktop shows the same favorites as mobile (in the same order).
  - Rationale: clinicians commonly move between mobile bedside and a desktop workstation; seeing a different set on each device would break trust in the personalization. Cap-of-4 is comfortable for both layouts at 375px and 1280px (already validated by the current v1.12 4-tab layout).
  - Per-breakpoint caps (e.g., "6 on desktop, 4 on mobile") is deferred (FAV-FUT-02).

### Test strategy (FAV-TEST-03, FAV-TEST-04)
- **D-10 [auto / recommended]:** Three new Playwright files, co-located with existing specs in `e2e/`:
  1. `favorites-nav.spec.ts` — FAV-TEST-03 happy path E2E:
     - Navigate to `/`, open hamburger, un-favorite one tab (e.g., Feeds), confirm bottom bar now shows 3 tabs (Morphine/Formula/GIR), confirm desktop top nav (viewport 1280) shows the same 3 tabs.
     - Favorite a non-favorited calculator — but Phase 41's registry still has only 4 calculators, so this sub-step can't use UAC/UVC yet. Use "un-favorite then re-favorite Feeds" as the substitute round-trip for Phase 41; Phase 42 extends this spec to use UAC/UVC.
     - Reload the page, confirm the cleared favorite stays cleared (localStorage persistence).
     - Navigate to the un-favorited route via hamburger, confirm the bar does NOT regrow the tab, and the active indication is absent on all rendered tabs (NAV-FAV-03).
  2. `favorites-nav-a11y.spec.ts` — FAV-TEST-04 axe sweep:
     - Open hamburger, run `@axe-core/playwright` scan in light theme, then toggle dark and re-scan. Expect zero violations in both.
     - This is the "open hamburger" scan; existing per-calculator a11y specs already sweep the closed state.
  3. Add the two specs to the a11y-count in PROJECT.md at Phase 43 rollup (not in this phase).
  - Rationale: splitting functional (flow) from axe (visual/a11y) keeps each spec focused and matches the existing `gir.spec.ts` / `gir-a11y.spec.ts` convention.
  - Use viewport `{ width: 375, height: 667 }` for mobile, `{ width: 1280, height: 800 }` for desktop — matches existing Playwright convention.

### Test — store reset between runs
- **D-11 [auto / recommended]:** E2E favorites test reliability: each Playwright test pre-clears `localStorage['nicu:favorites']` in a `beforeEach` via `page.addInitScript`, then navigates. This ensures the suite is order-independent and doesn't rely on a prior test's state.
  - Rationale: existing e2e specs (e.g., `disclaimer.spec.ts`) pre-clear `localStorage` with the same pattern; reuse is consistent with project convention.

### Commit granularity / plan breakdown hint
- **D-12 [auto / recommended]:** This phase likely fits in 2 plans (mirroring the Phase 40 split pattern — store → component → integration became 3 plans there; Phase 41 has less scope so 2 is a good target):
  1. `41-01-PLAN.md` — NavShell nav-bar flip + `activeCalculatorId` cleanup + `_ids` seeding tweak + component tests (viewport-per-breakpoint rendering, empty-favorites case, registry-order preservation).
  2. `41-02-PLAN.md` — Playwright E2E (`favorites-nav.spec.ts`) + Playwright axe (`favorites-nav-a11y.spec.ts`) + update PROJECT.md axe count in the commit that closes the phase.
  - Non-prescriptive — gsd-planner may split differently. Surfacing this estimate so the researcher knows the "expected rough shape" and doesn't over-engineer.

### Out-of-scope for this phase (explicit)
- **D-OUT-01:** No changes to `HamburgerMenu.svelte`. Phase 40 shipped it complete; star toggles, cap-full caption, and in-menu `aria-current` are all correct and untouched.
- **D-OUT-02:** No changes to `favorites.svelte.ts` API — except the single-line `_ids` initialization tweak in D-07 (documented explicitly so it doesn't look like drift). Store's public API (`get current`, `toggle`, `has`, `canAdd`, `isFull`, `count`, `init`, `initialized`) is frozen for v1.13.
- **D-OUT-03:** No Phase 42 work. UAC/UVC is not added to the registry in this phase. The E2E "round trip" uses un-favorite/re-favorite of an existing calculator (D-10).
- **D-OUT-04:** No per-breakpoint cap, no drag-reorder, no export/import, no search box in the hamburger. All tracked in Deferred Ideas.
- **D-OUT-05:** No `role="navigation"` / `aria-current="page"` migration on the nav bars (D-04). Stays as `role="tab"` / `aria-selected` per current shell semantics.

### Claude's Discretion
- Exact naming of the `byId` Map vs inlined `CALCULATOR_REGISTRY.find()` per-iteration — use whichever keeps the `.svelte` file most readable (Map is preferred at 5+ calculators, inline `find()` is fine at 4).
- Whether to extract the `activeCalculatorId` derivation to a helper fn in `registry.ts` (e.g., `getActiveCalculatorId(pathname)`) — nice-to-have but not required.
- Whether the empty-favorites state renders an empty `<div>` vs a `<nav>` with no children vs a sentinel whitespace. Any is fine as long as axe stays green and no layout shift occurs on the title bar.
- Playwright selector strategy inside the E2E (role-based vs text-based vs data-testid) — follow what existing `feeds.spec.ts` does.
- Whether to add a component-level test for NavShell (`NavShell.test.ts`) or rely solely on E2E. Recommended: component test for the breakpoint/rendering invariant + E2E for the user flow (two levels of coverage, consistent with Phase 40 split).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone-level
- `.planning/PROJECT.md` — Core value, constraints (tech stack, PWA-only, WCAG 2.1 AA, 48px touch targets), v1.13 milestone goals.
- `.planning/REQUIREMENTS.md` §NAV-FAV-01..04, §FAV-TEST-03..04 — the 6 requirements this phase closes.
- `.planning/ROADMAP.md` §"Phase 41: Favorites-Driven Navigation" — success criteria; §"Order Rationale" for why this precedes Phase 42.

### Prior phase context (must-read)
- `.planning/phases/40-favorites-store-hamburger-menu/40-CONTEXT.md` — All of Phase 40's decisions (D-01..D-14). Phase 41 is downstream of the favorites store contract shipped there.
- `.planning/phases/40-favorites-store-hamburger-menu/40-VERIFICATION.md` — Captures what Phase 40 actually delivered vs planned (important for knowing what's already correct before Phase 41 flips NavShell).
- `.planning/phases/40-favorites-store-hamburger-menu/40-PATTERNS.md` — Phase 40's analog-mapping (e.g., favorites store ← theme.svelte.ts). Same patterns apply when Phase 41 adds the `byId` derivation + `_ids` seeding tweak.

### Existing code that Phase 41 edits
- `src/lib/shell/NavShell.svelte` — The primary edit target: flip both nav bars from `CALCULATOR_REGISTRY` → favorites-driven, fix `activeCalculatorId` derivation (D-05).
- `src/lib/shared/favorites.svelte.ts` — Edited minimally (one line: `_ids` initial value, per D-07).
- `src/lib/shell/registry.ts` — Read-only in Phase 41. Consulted for Map construction and (possibly) a helper fn.
- `src/lib/shared/types.ts` §`CalculatorId` — The id union stays `'morphine-wean' | 'formula' | 'gir' | 'feeds'` until Phase 42 extends it. NavShell code must tolerate `CalculatorId | undefined` for the active route.
- `src/routes/+layout.svelte` — Confirms `favorites.init()` is called on mount (Phase 40 integration). Not edited in Phase 41.

### Existing code Phase 41 reuses but does NOT edit
- `src/lib/shell/HamburgerMenu.svelte` — Read-only. The hamburger's in-list `aria-current="page"` (line 101) is already correct and is what NAV-FAV-04 preserves.
- `src/lib/shared/components/AboutSheet.svelte` — Read-only. Accepts `calculatorId`; D-06 uses the existing fallback.
- `src/lib/shared/theme.svelte.ts` — Read-only. Reference pattern for module-scope `$state` initialization — D-07 mirrors its synchronous default.
- `src/lib/shared/favorites.test.ts` — Existing Phase 40 unit tests; Phase 41 should not need to touch them (the `_ids` seeding tweak in D-07 may need one new case covering "module-scope default before init()").

### A11y / design tokens
- `src/app.css` §`--color-identity`, §`--color-text-secondary`, §`--color-border`, §`--color-surface` — used by the inactive-tab and active-tab styling. No new tokens needed.
- `e2e/*-a11y.spec.ts` (all existing axe specs) — Reference pattern for `favorites-nav-a11y.spec.ts` (FAV-TEST-04).
- `e2e/navigation.spec.ts` — Reference pattern for viewport-switched rendering tests.

### Spreadsheets / clinical sources
- None. Phase 41 is pure navigation infrastructure; no clinical calculation parity work.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`favorites.svelte.ts` singleton** — Phase 40 delivered `favorites.current` as a reactive readonly array already in registry order (FAV-06 / D-07). Phase 41 consumes it via a one-line `$derived` in NavShell.
- **`CALCULATOR_REGISTRY` readonly array** — Source of truth for id→CalculatorEntry resolution. Building a `Map` once at module scope is preferred over repeated `Array.find()` when favorites render frequently.
- **Existing Playwright helpers** — `e2e/navigation.spec.ts` pattern for "viewport switch + nav assertions" maps directly to FAV-TEST-03. `e2e/*-a11y.spec.ts` pattern (axe-core + light/dark toggle) maps directly to FAV-TEST-04.
- **`page.addInitScript` for localStorage reset** — already used in `disclaimer.spec.ts` to pre-clear `nicu:disclaimer-accepted`; reuse for `nicu:favorites`.
- **`aria-selected` + `role="tab"` styling** — Current NavShell pattern works unchanged when the iterand flips from registry to favorites.

### Established Patterns
- **`.svelte.ts` singleton with `get` accessor** — 5 existing examples (theme, disclaimer, per-calculator state, favorites). `favorites.current` is consumed exactly like `theme.current`.
- **Reactive id → entry resolution** — No prior pattern in-repo for "filter registry by a reactive set of ids". Phase 41 introduces this with a minimal `$derived` — no new abstraction needed.
- **`$derived` in NavShell** — Already used for `activeCalculatorId`. Adding a second `$derived` for `visibleCalculators` follows the same pattern.
- **Playwright convention: one spec per calculator's functional flow, one spec per calculator's a11y sweep** — Phase 41 adds `favorites-nav.spec.ts` + `favorites-nav-a11y.spec.ts` following this precedent.
- **`localStorage`-backed singleton's module-scope default** — `theme.svelte.ts` seeds synchronously (`let currentTheme = $state<Theme>(getInitialTheme())`). D-07 mirrors this for favorites to avoid the "empty first paint" regression.

### Integration Points
- **`src/lib/shell/NavShell.svelte`** — Two `{#each CALCULATOR_REGISTRY as calc}` blocks (mobile bottom bar ~line 99, desktop top nav ~line 52) become `{#each visibleCalculators as calc}` where `visibleCalculators` is the new `$derived`. Everything else (identity classes, active-selection styling) stays.
- **`src/lib/shared/favorites.svelte.ts`** — One-line change: `let _ids = $state<CalculatorId[]>([])` → `let _ids = $state<CalculatorId[]>(defaultIds())`. Localized and behavior-preserving for existing callers.
- **`e2e/` directory** — Two new specs added, no existing specs edited.
- **Playwright config** — No change; existing baseURL/project setup handles both new specs.
- **Vitest config** — No change; `NavShell.test.ts` (if added) co-locates next to `NavShell.svelte` per project convention.

</code_context>

<specifics>
## Specific Ideas

- **Order rationale stays registry-order**: morphine-wean (leftmost) → formula → gir → feeds. When a user un-favorites GIR and re-favorites it, it slots back in the third position — matching the v1.12 bottom bar muscle memory. This is already locked by Phase 40 D-07 and the favorites store's `toggle()` implementation; Phase 41 just displays it.
- **"Active without a tab" visual language**: when the user is on `/uac-uvc` (Phase 42) with UAC/UVC not favorited, no tab in the bar is highlighted. The AboutSheet header and the page `<h1>` carry the identity. This keeps the "bar = your favorites" mental model intact — the bar is not trying to be a breadcrumb.
- **"Menu is the path, bar is the shortcut"**: hamburger is reachable everywhere; the bar is optimized for 90% of the time (users are on favorited calculators). Matches the "restrained, focused" design principle (PROJECT.md §Design Principles).
- **Existing v1.4 shell styling must be preserved pixel-perfect** (per NAV-FAV-01): `min-h-14`, safe-area padding on the bottom bar, focus outlines using `--color-identity`. Any regression here = visible change to v1.12 users on default favorites = milestone goal violated.

</specifics>

<deferred>
## Deferred Ideas

- **Minimum-favorite floor (e.g., "you must keep at least 1 favorite")** — Not needed for v1.13; hamburger is always reachable. Revisit if clinicians report "my bar is empty and I panicked". Would be a Phase-40-adjacent change (the store would enforce it).
- **Auto-redirect on active-tab un-favorite** — Considered in D-08, rejected. If clinician feedback strongly prefers an auto-redirect, add as a new phase in a future milestone.
- **Per-breakpoint cap (e.g., 6 favorites on desktop, 4 on mobile)** — FAV-FUT-02 in REQUIREMENTS.md. Holding at 4 universal for v1.13.
- **Drag-reorder favorites** — FAV-FUT-01. Registry-order D-07 (Phase 40) makes order stable without user-controlled reordering.
- **Export / import favorites** — FAV-FUT-03. No surface for this in v1.13.
- **Search box in the hamburger menu** — CAT-FUT-01. Not relevant at 5 calculators (post-Phase 42).
- **Visible `aria-current="page"` on the hamburger button itself** when the user is on a non-favorited route — explicitly rejected by NAV-FAV-04 ("hamburger button does not gain `aria-current` for non-favorited active routes"). Captured here so future phases don't re-propose it.
- **Wave-0 registry-driven `activeCalculatorId` helper extraction to `registry.ts`** — Claude's Discretion says OK to skip; if a future phase extends `activeCalculatorId` to multiple consumers, extract at that point.
- **ARIA migration: nav bars → `role="navigation"` with `aria-current="page"`** — D-04 declines this. If a future WCAG audit flags the current `role="tab"` pattern as mismatched for site-wide navigation (vs tablist within a page), lift this into its own phase.
- **On-page header chrome for `/uac-uvc`** — caught by D-03 as a downstream implication for Phase 42; Phase 42 research should pick it up.

</deferred>

---

*Phase: 41-favorites-driven-navigation*
*Context gathered: 2026-04-23 (auto mode — 12 decisions auto-selected from recommended defaults; 5 explicit out-of-scope items)*
</content>
</invoke>