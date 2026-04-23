# Phase 41: Favorites-Driven Navigation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in 41-CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-23
**Phase:** 41-favorites-driven-navigation
**Mode:** `--auto` (all gray areas auto-selected; all questions resolved via recommended defaults without interactive Q&A)
**Areas discussed:** Render source, Zero-favorites handling, Active-route indication, ARIA semantics, `activeCalculatorId` derivation, AboutSheet contract, First-render correctness, Focus behavior, Breakpoint consistency, Test strategy, Test reset, Plan breakdown

---

## Render source for both nav bars

| Option | Description | Selected |
|--------|-------------|----------|
| Single `$derived` in NavShell that maps `favorites.current` through a registry `Map` | One source of truth; mobile + desktop can't drift | ✓ |
| Separate derivations for mobile vs desktop | Could support breakpoint-specific lists later but risks drift now | |
| Expose `favorites.visibleEntries` from the store itself | Couples the store to the registry, making unit tests heavier | |

**Auto choice:** Single `$derived` in NavShell, using a module-scope `Map<CalculatorId, CalculatorEntry>` built from `CALCULATOR_REGISTRY`. Registry order already enforced by the store.

---

## Zero-favorites handling

| Option | Description | Selected |
|--------|-------------|----------|
| Render empty bars; hamburger remains escape hatch | Respects user's explicit un-favorite choice; no hidden fallback | ✓ |
| Fall back to rendering full registry if empty | Masks a real UX signal; creates second render path | |
| Enforce minimum-1 in the favorites store | Scope creep into Phase 40 territory | |

**Auto choice:** Empty bars allowed (unreachable on default path anyway). Minimum-1 enforcement noted as Deferred Idea.

---

## Active-route indication when route is not a favorite

| Option | Description | Selected |
|--------|-------------|----------|
| No `aria-current`, no identity color on any rendered tab; page chrome carries identity | Matches NAV-FAV-03 literal wording + keeps bar as "your favorites" mental model | ✓ |
| Add a "current route" pseudo-tab | Violates NAV-FAV-03 explicitly | |
| Grey-out all bars when off-favorite | Visually noisy; no semantic gain | |

**Auto choice:** Inactive state on all rendered tabs when active route is non-favorited.

---

## ARIA semantics for the nav bars

| Option | Description | Selected |
|--------|-------------|----------|
| Keep existing `role="tab"` / `aria-selected` | Preserves v1.4 shell styling + exposed semantics; NAV-FAV-04 satisfied by not editing HamburgerMenu | ✓ |
| Migrate to `role="navigation"` + `aria-current="page"` | Changes screen-reader exposure; not required by requirements wording | |

**Auto choice:** Keep existing pattern. Migration deferred to its own phase if a future audit requires it.

---

## `activeCalculatorId` derivation

| Option | Description | Selected |
|--------|-------------|----------|
| Registry-driven `find()` over `CALCULATOR_REGISTRY` | Scales to Phase 42 without edit; fixes latent debt Wave-0 style | ✓ |
| Leave hardcoded ternary; fix in Phase 42 | Extra commit churn; Phase 41 is already editing this file | |
| Extract to `registry.ts` helper | Nice-to-have; deferred to Claude's Discretion | |

**Auto choice:** Registry-driven `find()` inline in NavShell. Type becomes `CalculatorId | undefined`.

---

## AboutSheet `calculatorId` contract

| Option | Description | Selected |
|--------|-------------|----------|
| Pass `activeCalculatorId ?? 'morphine-wean'` (keeps current fallback) | No AboutSheet.svelte changes needed | ✓ |
| Make AboutSheet accept `undefined` and handle it internally | Broader edit; not warranted for Phase 41 | |

**Auto choice:** Fallback to `'morphine-wean'` in NavShell; AboutSheet unchanged.

---

## First-render correctness (empty vs defaults on first paint)

| Option | Description | Selected |
|--------|-------------|----------|
| Seed `_ids` synchronously to `defaultIds()` at module scope | One-line tweak; first paint always valid; no loading skeleton | ✓ |
| Gate NavShell render on `favorites.initialized` | Adds a loading state for what should be instantaneous | |
| Hydrate from cookie + SSR | Out of scope; app is `adapter-static` (no SSR runtime) | |

**Auto choice:** Module-scope default seeding in `favorites.svelte.ts`.

---

## Focus + URL behavior when active route is un-favorited mid-session

| Option | Description | Selected |
|--------|-------------|----------|
| Silent — user stays on the route, bar removes the tab, focus returns to hamburger button on close | Respects user intent; no surprise redirect | ✓ |
| Auto-redirect to first favorite | Confusing ("why did my screen change?") | |
| Show a toast asking to confirm | Extra surface; not needed | |

**Auto choice:** Silent tab removal; URL unchanged; hamburger-button focus restoration is Phase 40 D-02 behavior.

---

## Mobile + desktop consistency

| Option | Description | Selected |
|--------|-------------|----------|
| Same favorites on both breakpoints | Clinicians move across devices; trust in personalization | ✓ |
| Per-breakpoint cap (e.g., 6 desktop / 4 mobile) | FAV-FUT-02; not in v1.13 | |

**Auto choice:** Single favorite list for both breakpoints.

---

## Test strategy (FAV-TEST-03 + FAV-TEST-04)

| Option | Description | Selected |
|--------|-------------|----------|
| Split functional (`favorites-nav.spec.ts`) from a11y (`favorites-nav-a11y.spec.ts`) | Matches existing `gir.spec.ts` / `gir-a11y.spec.ts` convention | ✓ |
| Single combined spec | Breaks project convention; harder to read failures | |

**Auto choice:** Two-spec split. Viewports 375/667 for mobile, 1280/800 for desktop.

---

## E2E localStorage reset strategy

| Option | Description | Selected |
|--------|-------------|----------|
| `page.addInitScript` pre-clearing `nicu:favorites` in `beforeEach` | Matches `disclaimer.spec.ts` precedent | ✓ |
| `localStorage.clear()` in a `beforeAll` | Nukes other keys (theme, disclaimer); risk of flaky side effects | |
| Dedicated test fixture with a clean storage state | Overkill for two specs | |

**Auto choice:** `addInitScript` targeted clear.

---

## Plan breakdown (non-prescriptive estimate)

| Option | Description | Selected |
|--------|-------------|----------|
| 2 plans: `41-01` NavShell flip + store seeding + component tests; `41-02` E2E + a11y | Matches Phase 40's split pattern scaled down | ✓ (estimate only) |
| 1 monolithic plan | Harder to review; larger single commit scope | |
| 3 plans (separate the `activeCalculatorId` cleanup) | Over-fragmented for the scope | |

**Auto choice:** 2-plan estimate surfaced for researcher/planner; final breakdown is planner's decision.

---

## Claude's Discretion

- `byId` Map vs inline `.find()` — pick for readability.
- `activeCalculatorId` helper extraction — skip unless needed.
- Empty-favorites render element (empty `<nav>` vs `<div>` vs whitespace) — any is fine if axe is green.
- Playwright selector style — follow `feeds.spec.ts`.
- Adding `NavShell.test.ts` component test — recommended but not required.

## Deferred Ideas

- Minimum-favorite floor (store-level change; not scoped here).
- Auto-redirect on active-tab un-favorite (rejected; could be revisited).
- Per-breakpoint cap (FAV-FUT-02).
- Drag-reorder (FAV-FUT-01).
- Export/import (FAV-FUT-03).
- Hamburger search box (CAT-FUT-01).
- `aria-current="page"` on hamburger button for non-favorited active routes (explicitly rejected by NAV-FAV-04).
- `activeCalculatorId` helper extraction.
- Full ARIA migration of nav bars to `role="navigation"`.
- On-page header chrome for `/uac-uvc` (Phase 42 concern).
</content>
</invoke>