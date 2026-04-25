# Phase 45: Desktop Full-Nav Divergence - Context

**Gathered:** 2026-04-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Diverge desktop top-toolbar rendering from mobile bottom-bar rendering in `src/lib/shell/NavShell.svelte`. Desktop (md+) renders **every registered calculator** from `CALCULATOR_REGISTRY` (currently 5: Morphine, Formula, GIR, Feeds, UAC/UVC) regardless of favorites state. Mobile (< md) keeps **identical favorites-driven behavior** as v1.13 (Phase 41 NAV-FAV-01..04 — same 4-cap, same hamburger management, same first-run defaults). NavShell.svelte is the only source file modified; the hamburger menu, registry, favorites store, and AboutSheet are not touched.

This phase is a deliberate, scoped reversal of **Phase 41 D-09** ("mobile + desktop consistency, do not introduce per-breakpoint favorite lists"). The v1.14 milestone kickoff (commit `f7388bd`) explicitly authorized the divergence: clinicians on a desktop workstation should never have a calculator hidden behind the hamburger.

**Requirements covered:** NAV-ALL-01..05, NAV-ALL-TEST-01..03 (8 requirements).

**Explicit non-goals:**
- No registry changes (the 5 calculators are fixed for v1.14).
- No favorites-store API changes (Phase 40 contract unchanged).
- No HamburgerMenu.svelte changes — the hamburger renders identically on every breakpoint per D-08.
- No DESIGN.md / DESIGN.json contract changes (per REQUIREMENTS Out of Scope).
- No new identity hue (no new calculators added).
- No mobile bottom-bar visual changes — explicitly unchanged per user direction.

</domain>

<decisions>
## Implementation Decisions

### Splitting strategy (NavShell.svelte internals)

- **D-01:** Rename the existing `visibleCalculators` derived value to **`mobileVisibleCalculators`** (favorites-driven, 4-cap, registry-order — same logic as today, just renamed for symmetry). Add a new module-scope const **`desktopVisibleCalculators`** that equals `[...CALCULATOR_REGISTRY]` (registry-driven, all 5, registry order). REQUIREMENTS NAV-ALL-01 explicitly names both shapes; the rename forces every reader (and every test) to confirm which bar consumes which list, making the divergence self-documenting.

- **D-02:** `desktopVisibleCalculators` is a **module-scope const**, not a `$derived` value. `CALCULATOR_REGISTRY` is `readonly` (registry.ts:19) and never mutates at runtime — `$derived` would add pointless reactivity. This mirrors the existing `byId` Map at NavShell.svelte:12-14, which is also module-scope for the same reason. Implementation:
  ```ts
  // Module scope, alongside `byId`:
  const desktopVisibleCalculators: readonly CalculatorEntry[] = [...CALCULATOR_REGISTRY];

  // $derived (renamed):
  const mobileVisibleCalculators = $derived(
    favorites.current.map((id) => byId.get(id)).filter((c): c is CalculatorEntry => c !== undefined)
  );
  ```
  The desktop `<nav>` iterates `desktopVisibleCalculators`; the mobile `<nav>` iterates `mobileVisibleCalculators`. The `byId` Map and the favorites-import remain unchanged.

### Active-route semantics divergence

- **D-03:** **Desktop top toolbar: active tab is ALWAYS lit.** Because all 5 calculators are always rendered on desktop, the active tab will always match the current pathname — `aria-selected="true"` and the identity color / `border-b-2` indicator always render on the active tab. This is the natural, expected behavior of the divergence; users on `/uac-uvc` see UAC/UVC highlighted in the desktop toolbar.

- **D-04:** **Mobile bottom bar: Phase 41 D-03 unchanged.** If the active route is non-favorited (e.g., user on `/uac-uvc` but UAC/UVC is not in their 4-favorite list), NO mobile tab is lit (no `aria-selected="true"`, no identity color, no underline). The route identity is carried by on-page chrome (page heading + AboutSheet) — same as v1.13. Mobile-only behavior; no regression to Phase 41 NAV-FAV-03.

- **D-05:** **ARIA semantics: keep `role="tablist"` / `role="tab"` / `aria-selected` on BOTH bars (Phase 41 D-04 unchanged).** Do NOT migrate to `role="navigation"` + `aria-current="page"`, despite the ROADMAP.md Phase 45 success-criterion 3 mentioning `aria-current="page"`. Phase 41 D-04 explicitly carved out the v1.0 shell ARIA contract (role=tab + aria-selected) because flipping to `aria-current="page"` would silently change screen-reader audibility from "tablist with a selected tab" to "navigation with a current page" — out of scope for this phase. The ROADMAP wording is treated as pre-merge guidance superseded by Phase 41 D-04. **Documented here so a future `/gsd-secure-phase` audit doesn't re-litigate.** A full ARIA migration of the nav bars to `role="navigation"` + `aria-current="page"` is captured as a Deferred Idea below.

### Narrow-desktop reflow (NAV-ALL-05)

- **D-06:** **Horizontal scroll on the desktop nav at narrow widths.** Add `overflow-x-auto` to the inner desktop `<nav>` container. All 5 tabs render at full padding (`px-4`), full label, and full 48px touch target at every viewport width — zero compromise on the v1.13 visual contract. At ≥1280px the tabs fit with whitespace to spare; at 768px (5 tabs ≈ 580px + header chrome ≈ 240px ≈ 820px > 768px) the nav scrolls horizontally. Math walked through during discussion (see DISCUSSION-LOG.md). Future-proof: when a 6th calculator is ever added, no reflow strategy needs re-tuning.

- **D-07:** **Auto-scroll the active tab into view on route change.** A `$effect` runs when `page.url.pathname` changes (and on first mount), finds the active tab via a ref or query selector, and calls `.scrollIntoView({ inline: 'nearest', behavior: 'smooth' })`. `inline: 'nearest'` means in-view tabs don't trigger animation — only clipped tabs scroll. `behavior: 'smooth'` matches the calm clinical pacing per CLAUDE.md "Calm. Trustworthy." aesthetic. Implementation lives in NavShell.svelte; the effect references the desktop nav via `bind:this` on the inner container.

- **D-08:** **Right-edge gradient fade only when content overflows.** A 24px wide right-edge gradient (`mask-image: linear-gradient(to right, black calc(100% - 24px), transparent)` or pseudo-element with `pointer-events: none`) appears only when `scrollWidth > clientWidth` on the desktop nav. At ≥1280px (no overflow), the fade is invisible; at 768px (overflow), it hints at scrollable content. Detection via a `$effect` that toggles a CSS class based on a `ResizeObserver` or scroll-width comparison. Subtle, professional, vanishes when not needed.

### Hamburger contents on desktop (NAV-ALL-04)

- **D-09:** **HamburgerMenu.svelte is unchanged on desktop.** The per-calculator list with star-toggles renders identically on every breakpoint. NAV-ALL-04 only requires the hamburger BUTTON to remain visible on desktop (NavShell.svelte change) — the hamburger DRAWER contents are mobile-and-desktop alike. Pro: zero code change to HamburgerMenu.svelte → Phase 45 stays a NavShell-only change → smaller test surface → smaller blast radius. Con: star-toggles are inert on desktop because favorites only affect the mobile bottom bar — mitigated by the fact that clinicians frequently move between mobile bedside and desktop workstation, and being able to manage their mobile favorites from any device is a feature, not a bug.

### Claude's Discretion

- Exact CSS class names for the scroll/fade implementation — planner picks Tailwind utility composition (e.g., `overflow-x-auto`, `scrollbar-thin`, custom `mask-image` via `style` prop or a `:global` rule).
- Whether to use `ResizeObserver` vs a simpler `$effect` reading `scrollWidth/clientWidth` for overflow detection (functionally equivalent at this scale).
- Exact selector for finding the active tab in the auto-scroll `$effect` — `bind:this` array, `data-active="true"` attribute, or `querySelector('[aria-selected="true"]')` are all acceptable.
- Test fixture layout (parameterized vs duplicated) for NAV-ALL-TEST-01/02/03 — match existing e2e/fortification-a11y.spec.ts and NavShell.test.ts patterns.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Requirements & Roadmap

- `.planning/REQUIREMENTS.md` §"Desktop Full-Nav Divergence" — NAV-ALL-01 through NAV-ALL-05, NAV-ALL-TEST-01 through NAV-ALL-TEST-03 (8 requirements for Phase 45)
- `.planning/ROADMAP.md` §"Phase 45: Desktop Full-Nav Divergence" — goal, success criteria 1-5, dependencies (none structural)

### Prior Decisions to Honor (Phase 41)

- `git show 5ac9625:.planning/phases/41-favorites-driven-navigation/41-CONTEXT.md` — Phase 41 CONTEXT.md (cleaned up, retrievable from git history)
  - **D-01** (unified `byId` Map + derived value pattern) — extend, don't replace
  - **D-03** (mobile non-favorited active route = no tab lit) — preserved on mobile only (Phase 45 D-04)
  - **D-04** (keep role=tab + aria-selected, don't migrate to aria-current=page) — preserved on both bars (Phase 45 D-05)
  - **D-05** (registry-driven `activeCalculatorId` derivation) — already correct, no change needed in Phase 45
  - **D-07** (first-render seed via `defaultIds()` at module scope) — applies to mobile only now; desktop always-fully-rendered means no first-paint concern there
  - **D-09** (mobile + desktop consistency, no per-breakpoint favorites) — **EXPLICITLY OVERRIDDEN by Phase 45**, authorized by v1.14 milestone kickoff

### NavShell module (the only file this phase touches)

- `src/lib/shell/NavShell.svelte` — single source file; rename + add desktopVisibleCalculators const + horizontal-scroll affordance + auto-scroll $effect + fade overlay
- `src/lib/shell/NavShell.test.ts` — extend with NAV-ALL-TEST-02 (desktopVisibleCalculators = full registry regardless of favorites.current)
- `src/lib/shell/registry.ts` §lines 19-60 — `CALCULATOR_REGISTRY` is `readonly` const; the 5 entries (`morphine-wean`, `formula`, `gir`, `feeds`, `uac-uvc`) are the always-rendered desktop set
- `src/lib/shared/favorites.svelte.ts` — `favorites.current` is consumed by mobile only now; do NOT modify this file
- `src/lib/shell/HamburgerMenu.svelte` — DO NOT modify; renders identically on every breakpoint per D-09

### E2E + axe testing

- `e2e/` directory — locate the existing nav E2E spec (likely `e2e/navigation.spec.ts` or similar) and the Playwright axe sweep pattern from `e2e/fortification-a11y.spec.ts` (recently extended in Phase 44 with the `for (const theme of ['light','dark'] as const)` block — same shape applies here for NAV-ALL-TEST-03)
- `e2e/fortification-a11y.spec.ts` — analog for the desktop-axe extension (light + dark + viewport resize)

### CLAUDE.md project guidelines

- `./CLAUDE.md` — TypeScript + pnpm + SvelteKit 2 + Svelte 5 + Tailwind 4 stack; "Calm. Trustworthy." aesthetic informs auto-scroll behavior choice (smooth, not instant)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **`byId: Map<string, CalculatorEntry>` at NavShell.svelte:12-14** — module-scope const, mirrors the new `desktopVisibleCalculators` shape (also module-scope const). The new const lives directly below `byId` for visual parity.
- **`$derived` favorites pattern at NavShell.svelte:25-27** — the existing `visibleCalculators` derived block is the literal text being renamed to `mobileVisibleCalculators`; the body stays identical.
- **`isActive` computation at NavShell.svelte:58 + 106** — `page.url.pathname.startsWith(calc.href)` works for both bars; reused unchanged in the new desktop iteration.
- **48px touch target + identity color + focus-visible outline at NavShell.svelte:61-66** — the entire desktop tab class block is reused unchanged; only the iteration source changes from `visibleCalculators` to `desktopVisibleCalculators`.
- **NavShell.test.ts source-string-analysis pattern at lines 21-36** — `classAttrContainsAll` + `BOTTOM_NAV_ATTR` regex pattern is reused for new structural assertions (e.g., asserting the desktop nav has `overflow-x-auto`).
- **NavShell.test.ts render-based pattern at lines 82-156** — Phase 41 T-01..T-06 use `render(NavShell)` + `container.querySelector('nav[aria-label="Calculator navigation"]')` to test favorites-driven rendering; the new T-07..T-10 tests for `desktopVisibleCalculators` follow the same pattern but query the desktop nav (the FIRST nav, since the bottom nav is the second).

### Established Patterns

- **`favorites.init()` is called once in +layout.svelte `onMount`** — Phase 40 contract; do not invoke from NavShell. The desktop list does not depend on favorites at all, so the initialization timing is irrelevant for desktop rendering.
- **CSS-only responsive layout** — existing pattern uses `hidden md:flex` (desktop nav at NavShell.svelte:55) and `md:hidden` (mobile bottom nav at line 101). The horizontal-scroll affordance lives inside the existing `md:flex` container; no new breakpoint logic.
- **No new dependencies** — per CLAUDE.md "no other new runtime dependencies needed". `scrollIntoView` is native; `mask-image` is native CSS; `ResizeObserver` is native if needed.
- **Registry order is the canonical sort** — `CALCULATOR_REGISTRY` declares Morphine→Formula→GIR→Feeds→UAC/UVC; the desktop list preserves this order (it's just `[...CALCULATOR_REGISTRY]`).

### Integration Points

- **NavShell.svelte's `<nav class="ml-4 hidden gap-2 md:flex" aria-label="Calculator navigation">`** at line 55 is the desktop container. The horizontal-scroll affordance + auto-scroll ref + overflow detection all live inside this element. The mobile `<nav class="fixed right-0 bottom-0 left-0 ... md:hidden">` at line 98 is unchanged.
- **Phase 41 D-05 already wired `activeCalculatorId` registry-driven** — the AboutSheet/HamburgerMenu integration is correct; no changes needed.
- **No NavShell coupling to fortification-config.json** — Phase 44's Kendamil work runs in parallel with Phase 45; touching different files entirely. ROADMAP "Depends on: Nothing structural" is accurate.

</code_context>

<specifics>
## Specific Ideas

- The horizontal scroll affordance must include both the scroll mechanism (`overflow-x-auto`) AND the auto-scroll-to-active behavior — clinicians arriving at `/uac-uvc` via the hamburger should immediately see UAC/UVC highlighted in view, not scrolled off-screen. This is what makes the divergence trustworthy at narrow widths.
- 768px is the realistic narrow-desktop case (Tailwind `md` breakpoint = 768px). Most clinical desktop workstations run 1280+, but the design must degrade gracefully at the breakpoint where mobile→desktop transition happens.
- The existing v1.13 visual contract is non-negotiable: identityClass border colors, 48px min touch targets (mobile WCAG and desktop pointer comfort), focus-visible outlines, smooth color transitions on hover. Phase 45 adds capability without subtracting from any of those.
- The "scroll fade" gradient is a common pattern in modern UIs (Material 3 tabs, iOS native pickers) — use it as a quiet hint, not as decoration. Visible only when actually scrollable; vanishes at wide viewports.

</specifics>

<deferred>
## Deferred Ideas

- **Full ARIA migration to `role="navigation"` + `aria-current="page"` on both bars** — The roadmap success-criterion 3 mentioned this, but Phase 41 D-04 carved out keeping role=tab/aria-selected and Phase 45 inherits that. A formal migration would warrant its own phase (e.g., "v1.X NavShell ARIA modernization") with screen-reader regression testing across NVDA/JAWS/VoiceOver.
- **Per-breakpoint favorites caps** (e.g., 6 on desktop, 4 on mobile) — Out of scope for v1.14; Phase 45 makes desktop registry-driven and mobile favorites-driven, but doesn't introduce a "desktop favorites" concept. Captured as FAV-FUT-02 in REQUIREMENTS Future Requirements.
- **Sticky/snap-scroll on the desktop nav** (`scroll-snap-type: x mandatory`) — Considered and rejected for D-06; nav bars don't benefit from snap, and the smooth scrollIntoView behavior already handles the "land on the active tab" case.
- **Hamburger drawer customization for desktop** (e.g., hide per-calc list, show "manages mobile" subtitle) — Considered in D-09 and rejected to keep Phase 45 a NavShell-only change. If clinicians later report confusion about inert stars on desktop, that's a Phase 4X UX phase, not Phase 45.
- **Hide the hamburger button on desktop** — Already in REQUIREMENTS Future Requirements; would require relocating the AboutSheet trigger to a different desktop affordance. Out of v1.14 scope per Out of Scope.
- **Show the App name "NICU Assist" with a tighter logo at narrow widths** — Considered briefly during D-06 discussion; rejected because horizontal scroll preserves the App name at every width, eliminating the need.

</deferred>

---

*Phase: 45-desktop-full-nav-divergence*
*Context gathered: 2026-04-25*
