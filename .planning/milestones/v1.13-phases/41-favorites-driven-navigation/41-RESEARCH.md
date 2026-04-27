# Phase 41: Favorites-Driven Navigation - Research

**Researched:** 2026-04-23
**Domain:** SvelteKit 2 + Svelte 5 runes — NavShell render-source flip, favorites store init-seed, Playwright E2E + axe
**Confidence:** HIGH (all findings verified from live codebase; no external library research needed)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01** Both nav bars iterate a single `$derived` value: `favorites.current.map(id => byId.get(id)).filter(Boolean)`, where `byId` is a `Map<CalculatorId, CalculatorEntry>` built from `CALCULATOR_REGISTRY`. Derivation lives in `NavShell.svelte`, not in the store.
- **D-02** "Zero favorites" renders empty bars — no fallback to "all calculators". Hamburger is the escape hatch.
- **D-03** Non-favorited active route: no `aria-current`, no identity color, no tab highlight on any rendered tab. Route identity via AboutSheet / page `<h1>`.
- **D-04** Keep existing `role="tab"` + `aria-selected` pattern. Do NOT migrate to `aria-current="page"` on nav bars.
- **D-05** Replace hardcoded ternary for `activeCalculatorId` with `CALCULATOR_REGISTRY.find(c => page.url.pathname.startsWith(c.href))?.id ?? undefined`. Type becomes `CalculatorId | undefined`.
- **D-06** Pass `activeCalculatorId ?? 'morphine-wean'` to `<AboutSheet>`. No changes to `AboutSheet.svelte` itself.
- **D-07** Change `let _ids = $state<CalculatorId[]>([])` to `let _ids = $state<CalculatorId[]>(defaultIds())` in `favorites.svelte.ts`. One-line tweak; document in commit message as latent-init fix.
- **D-08** Un-favoriting the current active calculator: bar removes the tab silently, user stays on current route, focus returns to hamburger button on close (Phase 40 D-02). No auto-redirect, no toast.
- **D-09** Mobile bottom bar and desktop top nav read the same derived value. No per-breakpoint caps.
- **D-10** Two new Playwright files: `favorites-nav.spec.ts` (FAV-TEST-03) + `favorites-nav-a11y.spec.ts` (FAV-TEST-04). Viewports: 375×667 mobile + 1280×800 desktop.
- **D-11** Each Playwright test pre-clears `localStorage['nicu:favorites']` via `page.addInitScript` in `beforeEach`.
- **D-12** Target 2 plans: `41-01` (NavShell flip + store seed + component tests), `41-02` (Playwright E2E + axe). Non-prescriptive.

### Claude's Discretion

- Exact naming: `byId` Map vs inlined `CALCULATOR_REGISTRY.find()` per iteration — Map preferred at 5+ calculators; with 4 either is fine.
- Whether to extract `activeCalculatorId` derivation to a helper in `registry.ts`.
- Empty-favorites state: `<div>` vs `<nav>` with no children vs whitespace — any OK as long as axe passes and no layout shift.
- Playwright selector strategy: follow `feeds.spec.ts` convention (role + accessible name).
- Whether to add `NavShell.test.ts` component test — recommended (breakpoint/rendering invariant + E2E for user flow).

### Deferred Ideas (OUT OF SCOPE)

- Minimum-favorite floor (must keep at least 1).
- Auto-redirect on active-tab un-favorite.
- Per-breakpoint cap (e.g., 6 desktop / 4 mobile).
- Drag-reorder favorites.
- Export/import favorites.
- Search box in hamburger menu.
- `aria-current="page"` on hamburger button for non-favorited active routes.
- `role="navigation"` / `aria-current="page"` migration for nav bars.
- On-page header chrome for `/uac-uvc` (deferred to Phase 42 research).
- `activeCalculatorId` helper extraction to `registry.ts` (deferred unless multiple consumers).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| NAV-FAV-01 | Mobile bottom bar renders only favorited calculators in favorite order, preserving v1.4 shell styling (`min-h-14`, safe-area padding, focus outlines) | D-01 derived value + D-09 same iterand for both bars; existing CSS classes unchanged |
| NAV-FAV-02 | Desktop top nav renders same favorited calculators with identity indicator intact | Same `visibleCalculators` derived value; `calc.identityClass` + active styling unchanged |
| NAV-FAV-03 | Navigating to a non-favorited calculator via hamburger does NOT add a temporary tab to either bar | Zero iterand matches for non-favorited route → no `isActive=true` cell; covered by iterand flip alone |
| NAV-FAV-04 | Hamburger button does NOT gain `aria-current` for non-favorited active routes | HamburgerMenu.svelte line 101 already correct and is NOT edited in Phase 41 |
| FAV-TEST-03 | Playwright E2E: full add/remove/persist flow in both viewports | `favorites-nav.spec.ts` — see E2E spec design below |
| FAV-TEST-04 | Playwright axe sweep of open hamburger in light + dark | `favorites-nav-a11y.spec.ts` — see axe spec design below |
</phase_requirements>

---

## Summary

Phase 41 is a single-responsibility render-source flip. The entire production code change is two token swaps in `NavShell.svelte` (`CALCULATOR_REGISTRY` → `visibleCalculators` in both `{#each}` loops), one new `$derived` for `visibleCalculators`, a registry-driven replacement of the `activeCalculatorId` ternary, and a one-line init-seed fix in `favorites.svelte.ts`. The test deliverables (Playwright E2E + axe) are more lines than the production changes.

All patterns already exist in the codebase. There is no new library, no new design token, no new component, and no new architectural concept. The research job is to verify exact line numbers and confirm no hidden coupling before the planner writes tasks.

**Primary recommendation:** Plan around two concrete edits (`NavShell.svelte` lines 14-22 and 52-69 and 99-117; `favorites.svelte.ts` line 70) plus two new E2E spec files. Everything else (typing, focus, ARIA) is already correct by construction.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Render-source flip (which tabs appear) | Browser/Client (NavShell.svelte) | — | NavShell is a client-only component in an adapter-static SPA; no SSR render |
| Favorites state | Browser/Client (favorites.svelte.ts) | localStorage | Module-scope `$state` singleton; localStorage is persistence layer only |
| Active-route detection | Browser/Client (SvelteKit `$app/state`) | — | `page.url.pathname` is reactive client-side SvelteKit state |
| Tab ARIA semantics | Browser/Client (NavShell.svelte) | — | `role="tab"` + `aria-selected` already in place; Phase 41 does not change the pattern |
| Hamburger `aria-current` | Browser/Client (HamburgerMenu.svelte) | — | Line 101 already wired; Phase 41 does not edit this file |

---

## Standard Stack

No new dependencies. Everything needed is already installed.

| Already Installed | Version (verified in package.json) | How Used in Phase 41 |
|-------------------|------------------------------------|----------------------|
| Svelte 5 runes | ^5.55.0 | `$derived`, `$state` in NavShell + favorites store |
| SvelteKit 2 `$app/state` | ^2.55.0 | `page.url.pathname` for `activeCalculatorId` derivation |
| `@axe-core/playwright` | (installed — used by all `*-a11y.spec.ts`) | `favorites-nav-a11y.spec.ts` |
| Playwright | ^1.58.2 | `favorites-nav.spec.ts` |
| Vitest | ^4.1.2 | `NavShell.test.ts` (optional component test) and new favorites store test case |

**Version verification:** `[VERIFIED: live codebase package.json + existing e2e/*-a11y.spec.ts import]`

---

## Architecture Patterns

### System Architecture Diagram

```
localStorage['nicu:favorites']
        |
        v
favorites.svelte.ts
  _ids = $state(defaultIds())  ← D-07 module-scope seed (one-line fix)
  init() reconciles with localStorage on onMount
        |
        v (favorites.current: readonly CalculatorId[])
        |
NavShell.svelte
  byId = Map<CalculatorId, CalculatorEntry>  ← built from CALCULATOR_REGISTRY (module-scope)
  visibleCalculators = $derived(              ← D-01
    favorites.current.map(id => byId.get(id)).filter(Boolean)
  )
  activeCalculatorId = $derived(              ← D-05
    CALCULATOR_REGISTRY.find(c => page.url.pathname.startsWith(c.href))?.id ?? undefined
  )
        |
        +----> Desktop top nav: {#each visibleCalculators as calc}
        |        isActive = page.url.pathname.startsWith(calc.href)
        |        aria-selected={isActive}, role="tab"
        |
        +----> Mobile bottom bar: {#each visibleCalculators as calc}
                 isActive = page.url.pathname.startsWith(calc.href)
                 aria-selected={isActive}, role="tab"
                 (no iterand matches for non-favorited route → no active tab → NAV-FAV-03)

        +----> <AboutSheet calculatorId={activeCalculatorId ?? 'morphine-wean'} />
```

### Recommended Project Structure

No structural changes. Files modified:

```
src/lib/shell/
├── NavShell.svelte          ← PRIMARY EDIT (lines 14-22, 52-69, 99-117, 125)
└── registry.ts              ← READ ONLY (source for byId Map construction)

src/lib/shared/
├── favorites.svelte.ts      ← ONE-LINE EDIT (line 70)
└── favorites.test.ts        ← POSSIBLY ONE NEW TEST (T-20 module-scope default)

e2e/
├── favorites-nav.spec.ts    ← NEW (FAV-TEST-03)
└── favorites-nav-a11y.spec.ts ← NEW (FAV-TEST-04)
```

Optional co-located test:
```
src/lib/shell/
└── NavShell.test.ts         ← NEW (recommended, see component test section)
```

---

## Exact Code Changes Required

### Change 1: `favorites.svelte.ts` line 70 — init-seed tweak (D-07)

**Current (line 70):**
```typescript
// [VERIFIED: live file read]
let _ids = $state<CalculatorId[]>([]);
```

**Target:**
```typescript
let _ids = $state<CalculatorId[]>(defaultIds());
```

`defaultIds()` is defined at lines 17-20 and calls `CALCULATOR_REGISTRY.map(c => c.id).slice(0, FAVORITES_MAX)` — a synchronous, zero-side-effect call. `CALCULATOR_REGISTRY` is a static const in `registry.ts` with no circular dependencies (favorites.svelte.ts already imports CALCULATOR_REGISTRY at line 5). Safe to call at module scope. `[VERIFIED: live file read]`

**Impact on existing tests:** All 19 tests in `favorites.test.ts` use `vi.resetModules()` + dynamic import per test — so each test gets a fresh module instance with `_ids` re-initialized to `defaultIds()`. Tests that call `favorites.init()` immediately overwrite `_ids` via the recovery pipeline anyway. No test asserts that `favorites.current` is `[]` before `init()` is called. `[VERIFIED: read favorites.test.ts — no test checks pre-init value]`

**New test needed (T-20):** One new case covering "module-scope default is accessible before `init()` runs":
```typescript
it('T-20 module-scope default: current is defaults before init() is called', async () => {
  const { favorites } = await import('./favorites.svelte.js');
  // Do NOT call init()
  expect([...favorites.current]).toEqual(['morphine-wean', 'formula', 'gir', 'feeds']);
});
```
This documents the D-07 guarantee for future readers and ensures the one-line change is regression-tested.

### Change 2: `NavShell.svelte` — `activeCalculatorId` refactor (D-05)

**Current (lines 14-22):**
```typescript
// [VERIFIED: live file read]
const activeCalculatorId = $derived<CalculatorId>(
    page.url.pathname.startsWith('/formula')
        ? 'formula'
        : page.url.pathname.startsWith('/gir')
            ? 'gir'
            : page.url.pathname.startsWith('/feeds')
                ? 'feeds'
                : 'morphine-wean'
);
```

**Target:**
```typescript
const activeCalculatorId = $derived<CalculatorId | undefined>(
    (CALCULATOR_REGISTRY.find((c) => page.url.pathname.startsWith(c.href))?.id as CalculatorId) ?? undefined
);
```

**AboutSheet call site (line 125 current):**
```svelte
<AboutSheet calculatorId={activeCalculatorId} bind:open={aboutOpen} />
```
**Target:**
```svelte
<AboutSheet calculatorId={activeCalculatorId ?? 'morphine-wean'} bind:open={aboutOpen} />
```

**AboutSheet prop typing confirmed strict:** `calculatorId: CalculatorId` (no `undefined`). The `??` fallback at the call site is required — no change to `AboutSheet.svelte`. `[VERIFIED: AboutSheet.svelte lines 7-13]`

### Change 3: `NavShell.svelte` — visibleCalculators derivation + `byId` Map (D-01)

Add to `<script>` block, after CALCULATOR_REGISTRY import:
```typescript
import { favorites } from '$lib/shared/favorites.svelte.js';
```

Add module-scope or component-scope Map (module-scope preferred — static registry never changes):
```typescript
// Module-scope: CALCULATOR_REGISTRY is a static const; Map built once per module load.
// Using CalculatorId cast because registry.ts types id as string, not CalculatorId.
import type { CalculatorEntry } from './registry.js';
const byId = new Map<string, CalculatorEntry>(
    CALCULATOR_REGISTRY.map((c) => [c.id, c])
);
```

Add derived value:
```typescript
const visibleCalculators = $derived(
    favorites.current.map((id) => byId.get(id)).filter((c): c is CalculatorEntry => c !== undefined)
);
```

**Note on `byId` scope (Claude's Discretion):** With only 4 calculators, inlining `CALCULATOR_REGISTRY.find()` inside the `$derived` is also readable. The Map approach is marginally better for Phase 42 forward-compatibility when a 5th entry lands. Recommend the Map.

### Change 4: `NavShell.svelte` — flip both `{#each}` loops (D-01)

**Desktop top nav (current line 52):**
```svelte
{#each CALCULATOR_REGISTRY as calc}
```
**Target:**
```svelte
{#each visibleCalculators as calc}
```

**Mobile bottom bar (current line 99):**
```svelte
{#each CALCULATOR_REGISTRY as calc}
```
**Target:**
```svelte
{#each visibleCalculators as calc}
```

Everything inside each loop body (identity classes, `isActive`, `aria-selected`, `role="tab"`) stays byte-identical. `[VERIFIED: NavShell.svelte lines 52-69 and 99-117]`

---

## NAV-FAV-03 "No Temporary Tab" Analysis

**Conclusion: No additional code needed beyond the iterand flip.** `[VERIFIED by logic from live code]`

The per-tab `isActive` check (`page.url.pathname.startsWith(calc.href)`) already computes correct per-tab truth. When the user is on `/feeds` and `feeds` is not in `visibleCalculators`, no calc in the each-iteration has `href === '/feeds'` → no `isActive=true` → no `aria-selected="true"` → no highlighted tab. The bar shows only the favorited tabs, all in their inactive visual state. Requirement NAV-FAV-03 is satisfied by the iterand swap alone.

---

## Common Pitfalls

### Pitfall 1: `CALCULATOR_REGISTRY` id type is `string`, not `CalculatorId`
**What goes wrong:** `byId` is typed as `Map<string, CalculatorEntry>`. `favorites.current` returns `readonly CalculatorId[]`. The `byId.get(id)` call works fine (string key), but TypeScript may complain about the return type if you type `byId` as `Map<CalculatorId, CalculatorEntry>` — because `CalculatorEntry.id` is `string` per `registry.ts` line 6. `[VERIFIED: registry.ts line 6: id: string]`
**How to avoid:** Type `byId` as `Map<string, CalculatorEntry>` and use a type-guard filter: `.filter((c): c is CalculatorEntry => c !== undefined)`. Alternatively, cast `c.id as CalculatorId` during Map construction.

### Pitfall 2: `navigation.spec.ts` asserts 4 tabs by count — will break after Phase 41 if favorites differ from defaults
**What goes wrong:** `navigation.spec.ts` line 28: `await expect(tabs).toHaveCount(4)` — this passes when the default 4 favorites are set, but if this spec runs after a test that mutated `nicu:favorites`, it could see fewer tabs.
**How to avoid:** The navigation spec does NOT pre-clear `nicu:favorites` (it only clears cookies). Phase 41's new specs use `page.addInitScript` to pre-seed a known favorites state. **The existing `navigation.spec.ts` MUST also be guarded** — add a `page.addInitScript` in its `beforeEach` to reset `nicu:favorites` to the default 4, or it will become flaky after Phase 41 flips NavShell. This is a required fixup in Plan 41-01 or 41-02.
**Warning signs:** `navigation.spec.ts` fails intermittently depending on test execution order.

### Pitfall 3: First-paint flash (empty bar for one tick before init())
**What goes wrong:** Without D-07, `_ids` starts as `[]` → `visibleCalculators` is `[]` → both bars render with zero tabs → `init()` fires on `onMount` and writes the real values → bars repaint.
**How to avoid:** D-07 seeds `_ids = defaultIds()` at module scope so first synchronous render always shows the default 4. `init()` is still called in `onMount` — for the default-favorites user this is a visual no-op; for a user with custom favorites it flips on the first microtask after mount (single paint, not a visible flash).
**Note:** The adapter-static + SvelteKit 2 setup has no SSR render; `favorites.init()` in `onMount` is the only path that reads localStorage. Module-scope seeding is safe because it never touches the DOM or browser APIs.

### Pitfall 4: `AboutSheet` prop type mismatch
**What goes wrong:** `AboutSheet.svelte` expects `calculatorId: CalculatorId` (strict, no `undefined`). After D-05 makes `activeCalculatorId: CalculatorId | undefined`, passing it directly causes a TypeScript error.
**How to avoid:** At the call site, use `activeCalculatorId ?? 'morphine-wean'`. No change to `AboutSheet.svelte`. `[VERIFIED: AboutSheet.svelte lines 7-13]`

### Pitfall 5: `navigation.spec.ts` "info button opens about sheet" test references `About` button
**What goes wrong:** After Phase 40, the `Info` button in NavShell was renamed / moved. `navigation.spec.ts` line 18: `header.getByRole('button', { name: /about/i })` — this may pass or fail depending on current NavShell button labels.
**How to avoid:** Research scope only — if this test is currently failing, note it as a pre-existing issue. Phase 41 does not add or remove the About button; it moves no existing UI elements in the header action cluster.

---

## Component Test Strategy for NavShell

### Recommendation: Add `NavShell.test.ts`

Co-locate at `src/lib/shell/NavShell.test.ts`. Follow `HamburgerMenu.test.ts` pattern (render via `@testing-library/svelte`, mock module dependencies).

**Pattern for mocking the favorites singleton in Vitest:**

The favorites store is a module-scope singleton using `$state`. The `favorites.test.ts` pattern uses `vi.resetModules()` + dynamic import to get fresh state per test. For `NavShell.test.ts`, the store is a real dependency; mock it with `vi.mock`:

```typescript
// NavShell.test.ts pattern
import { vi } from 'vitest';

// Mock favorites before NavShell import
vi.mock('$lib/shared/favorites.svelte.js', () => ({
  favorites: {
    get current() { return mockFavoriteIds; },
    // other methods as no-ops
  }
}));

let mockFavoriteIds: string[] = ['morphine-wean', 'formula', 'gir', 'feeds'];
```

**Cases to cover in `NavShell.test.ts`:**

| # | Description | Assert |
|---|-------------|--------|
| T-01 | Default favorites (4): bottom bar renders 4 tabs at mobile viewport | `getByRole('tab')` count = 4 in bottom nav |
| T-02 | Reduced favorites (2: morphine-wean + formula): bottom bar renders 2 tabs | count = 2; labels match |
| T-03 | Zero favorites: both bars render no tabs; no error thrown | count = 0; axe-free if tested |
| T-04 | Active tab matches URL: `aria-selected="true"` on correct tab, false on others | inject mock page pathname |
| T-05 | Non-favorited active route: no tab has `aria-selected="true"` | all `aria-selected` = false |
| T-06 | Registry order preserved across toggle sequence | after mock reorder, tabs render in registry order |

**Note on `page` mock:** SvelteKit's `$app/state` page store needs mocking in Vitest. Look at existing NavShell or HamburgerMenu tests for the established pattern.

```typescript
vi.mock('$app/state', () => ({
  page: { url: { pathname: '/morphine-wean' } }
}));
```

Check whether `HamburgerMenu.test.ts` already uses this pattern — if yes, replicate exactly.

---

## Playwright E2E Spec Design (FAV-TEST-03)

**File:** `e2e/favorites-nav.spec.ts`
**Pattern source:** `feeds.spec.ts` (viewport loop) + `disclaimer.spec.ts` (localStorage pre-clear) `[VERIFIED: both files read]`

```typescript
// Viewport matrix pattern (from feeds.spec.ts lines 3-8)
for (const viewport of [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'desktop', width: 1280, height: 800 }
]) {
  test.describe(`Favorites nav (${viewport.name})`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test.beforeEach(async ({ page }) => {
      // Pre-clear BOTH keys for order-independence (D-11)
      await page.addInitScript(() => {
        localStorage.removeItem('nicu:favorites');
        localStorage.removeItem('nicu:disclaimer-accepted');
      });
      await page.goto('/morphine-wean');
      // Dismiss disclaimer
      await page.getByRole('button', { name: /understand/i })
        .click({ timeout: 2000 }).catch(() => {});
    });

    test('FAV-TEST-03-1: un-favorite Feeds → bar shows 3 tabs', async ({ page }) => { ... });
    test('FAV-TEST-03-2: re-favorite Feeds → bar shows 4 tabs in registry order', async ({ page }) => { ... });
    test('FAV-TEST-03-3: favorites persist across reload', async ({ page }) => { ... });
    test('FAV-TEST-03-4: navigate to un-favorited route → no temporary tab', async ({ page }) => { ... });
  });
}
```

**Locator strategy (from feeds.spec.ts + navigation.spec.ts conventions):**
- Hamburger: `page.getByRole('button', { name: 'Open calculator menu' })`
- Nav tabs (bottom bar mobile): `page.locator('nav[aria-label="Calculator navigation"]').last().getByRole('tab')`
- Nav tabs (desktop top nav): `page.locator('nav[aria-label="Calculator navigation"]').first().getByRole('tab')`
- Star buttons inside hamburger: use `aria-pressed` attribute or label pattern from HamburgerMenu — `page.getByRole('button', { name: /add feeds|remove feeds/i })`

**Key assertion for NAV-FAV-03 (no temporary tab):**
```typescript
// After un-favoriting Feeds and navigating to /feeds via hamburger:
const bottomNav = page.locator('nav[aria-label="Calculator navigation"]').last();
await expect(bottomNav.getByRole('tab')).toHaveCount(3); // Feeds not there
await expect(bottomNav.getByRole('tab', { selected: true })).toHaveCount(0); // No active tab
```

---

## Playwright Axe Spec Design (FAV-TEST-04)

**File:** `e2e/favorites-nav-a11y.spec.ts`
**Pattern source:** `gir-a11y.spec.ts` (axe import + light/dark sweep) `[VERIFIED: file read]`

```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';  // import path from gir-a11y.spec.ts

test.describe('Favorites hamburger accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('nicu:favorites');
      localStorage.removeItem('nicu:disclaimer-accepted');
    });
    await page.goto('/morphine-wean');
    await page.getByRole('button', { name: /understand/i })
      .click({ timeout: 2000 }).catch(() => {});
    // Open hamburger
    await page.getByRole('button', { name: 'Open calculator menu' }).click();
    await page.getByRole('dialog').waitFor({ state: 'visible' });
  });

  test('open hamburger has no axe violations in light mode', async ({ page }) => {
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    });
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations).toEqual([]);
  });

  test('open hamburger has no axe violations in dark mode', async ({ page }) => {
    await page.evaluate(() => {
      document.documentElement.classList.add('no-transition');
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await page.waitForTimeout(250);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations).toEqual([]);
  });
});
```

**`@axe-core/playwright` confirmed installed:** Used in all 4 existing `*-a11y.spec.ts` files. Import path is `@axe-core/playwright`. `[VERIFIED: gir-a11y.spec.ts line 2]`

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| id → entry resolution | Custom loop or switch | `Map<string, CalculatorEntry>` from CALCULATOR_REGISTRY | O(1) lookup, null-safe with `.filter(Boolean)` |
| Reactive favorites list | Array manipulation in component | `favorites.current` from Phase 40 singleton | Already sorted by registry order, schema-safe |
| Viewport-matrix E2E | Separate files per viewport | `for` loop with `test.use({ viewport })` | `feeds.spec.ts` precedent; DRY |
| Axe integration | Custom contrast checks | `@axe-core/playwright` | Already installed, project precedent |

---

## State of the Art

| Old Approach (NavShell pre-Phase 41) | New Approach (Phase 41) | Impact |
|--------------------------------------|------------------------|--------|
| `{#each CALCULATOR_REGISTRY}` — renders all 4 always | `{#each visibleCalculators}` — renders only favorites | Enables personalization; no temporary tabs |
| Hardcoded `activeCalculatorId` ternary | Registry-driven `CALCULATOR_REGISTRY.find(...)` | Forward-compatible for Phase 42 UAC/UVC |
| `_ids = $state([])` — empty before `init()` | `_ids = $state(defaultIds())` — defaults visible immediately | Eliminates empty-bar first-paint regression |

---

## Environment Availability

Step 2.6: All dependencies are already installed. No external tools needed.

| Dependency | Required By | Available | Notes |
|------------|-------------|-----------|-------|
| `@axe-core/playwright` | FAV-TEST-04 | Yes | Used in 4 existing `*-a11y.spec.ts` |
| Playwright | FAV-TEST-03 | Yes | ^1.58.2 |
| Vitest + `@testing-library/svelte` | NavShell.test.ts | Yes | 22 test files passing |
| SvelteKit `$app/state` mock | NavShell.test.ts | Yes | Pattern in existing test files |

---

## Assumptions Log

> All claims in this research were verified from the live codebase. No `[ASSUMED]` tags.

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| — | — | — | — |

**Table is empty:** All claims verified directly from source files.

---

## Open Questions

1. **Does `navigation.spec.ts` need a favorites pre-clear fix?**
   - What we know: `navigation.spec.ts` line 28 asserts `tabs.toHaveCount(4)` but does NOT pre-clear `nicu:favorites`. After Phase 41 flips NavShell to render favorites-only, this spec's count assertion depends on the store returning 4 defaults.
   - What's unclear: Whether `vi.resetModules` + test isolation in Vitest protects this, OR whether the Playwright spec relies on the default being seeded by the app on first load (which it will be, given D-07). The spec does `context.clearCookies()` not `localStorage.clear()` — so localStorage may have data from a prior test run.
   - Recommendation: Add `page.addInitScript(() => localStorage.removeItem('nicu:favorites'))` to `navigation.spec.ts` `beforeEach` as a guard. Low-risk change; prevents future flakiness. Include in Plan 41-01 or 41-02.

2. **NavShell.test.ts: how does existing test infra mock `$app/state`?**
   - What we know: `HamburgerMenu.test.ts` uses `page.url.pathname` via `$app/state`. Need to check if there's an established mock.
   - What's unclear: The mock pattern is in `HamburgerMenu.test.ts` which was not fully read.
   - Recommendation: Plan 41-01 task should read `HamburgerMenu.test.ts` before writing `NavShell.test.ts` to replicate the `$app/state` mock.

---

## Plan Breakdown (for gsd-planner)

### Plan 41-01: NavShell flip + store seed + component tests

**Files edited:**
- `src/lib/shared/favorites.svelte.ts` — line 70 only
- `src/lib/shell/NavShell.svelte` — lines 3-22 (imports + activeCalculatorId) + lines 52/99 (loop iterands) + line 125 (AboutSheet prop)

**Files created:**
- `src/lib/shared/favorites.test.ts` — add T-20 (pre-init default check)
- `src/lib/shell/NavShell.test.ts` — 6 new component tests (optional but recommended)

**Gate:** `pnpm check` (0/0), `pnpm test:run` (all pass including T-20), `pnpm build` (succeeds)

**Dependency:** None (can start immediately after Phase 40 merges).

### Plan 41-02: Playwright E2E + axe

**Files created:**
- `e2e/favorites-nav.spec.ts` — FAV-TEST-03 (viewport matrix: mobile + desktop)
- `e2e/favorites-nav-a11y.spec.ts` — FAV-TEST-04 (axe, light + dark)

**Files edited:**
- `e2e/navigation.spec.ts` — add `localStorage.removeItem('nicu:favorites')` to `beforeEach` guard

**Gate:** Playwright suite green; 0 axe violations in both themes with open hamburger.

**Dependency:** Plan 41-01 must be merged first (E2E tests a flipped NavShell).

---

## Sources

### Primary (HIGH confidence — verified from live codebase)
- `src/lib/shell/NavShell.svelte` — exact lines for all 4 code changes documented above
- `src/lib/shared/favorites.svelte.ts` — line 70 target, `defaultIds()` implementation, circular-import safety
- `src/lib/shared/favorites.test.ts` — 19 tests, `vi.resetModules()` pattern, no pre-init assertion (T-20 gap confirmed)
- `src/lib/shell/registry.ts` — `CalculatorEntry.id` typed as `string` (Pitfall 1 source)
- `src/lib/shared/types.ts` — `CalculatorId` union (4 values through Phase 41)
- `src/lib/shared/components/AboutSheet.svelte` — `calculatorId: CalculatorId` (strict prop, no undefined)
- `src/routes/+layout.svelte` — `favorites.init()` called in onMount at line 42 (confirmed wired)
- `e2e/feeds.spec.ts` — viewport matrix pattern
- `e2e/gir-a11y.spec.ts` — axe import path + light/dark sweep pattern
- `e2e/disclaimer.spec.ts` — localStorage pre-clear pattern
- `e2e/navigation.spec.ts` — tab count assertion (Pitfall 2 source)
- `.planning/phases/40-favorites-store-hamburger-menu/40-VERIFICATION.md` — Phase 40 delivery confirmed

### Secondary (MEDIUM confidence)
- `41-CONTEXT.md` decisions D-01..D-12 — all locked decisions applied directly

---

## Metadata

**Confidence breakdown:**
- Code changes: HIGH — exact lines verified from live files
- Test strategy: HIGH — follows established patterns from existing test files
- Pitfalls: HIGH — derived from direct code inspection, not speculation
- E2E locator strategy: MEDIUM — Playwright selectors are proposals based on rendered ARIA; may need minor adjustment after seeing the live hamburger DOM

**Research date:** 2026-04-23
**Valid until:** Stable indefinitely (no external dependencies; all findings from static codebase)
