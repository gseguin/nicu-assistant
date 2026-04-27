# Phase 47: Wave-0 — Test Scaffolding - Pattern Map

**Mapped:** 2026-04-27
**Files analyzed:** 5 (2 NEW, 3 MODIFIED) + 1 implied co-located unit test
**Analogs found:** 5 / 5 (all in-repo, no RESEARCH.md fallback needed)

## File Classification

| File | Status | Role | Data Flow | Closest Analog | Match Quality |
|------|--------|------|-----------|----------------|---------------|
| `src/test-setup.ts` (visualViewport block) | MODIFIED | test polyfill / setup-fixture | event-driven | `src/test-setup.ts:78-150` `HTMLDialogElement` block (same file) | exact (sibling) |
| `src/lib/test/visual-viewport-mock.ts` | NEW | test utility (stateless helper) | event-driven (synthetic dispatch) | `src/test-setup.ts:22-36` `matchMedia` stub shape (closest behavioral analog for `dispatchEvent`-driven mocks) | partial (helper category is new) |
| `src/lib/test/visual-viewport-mock.test.ts` | NEW (implied — Wave-0 gap) | unit test | request-response | `src/lib/shared/favorites.test.ts:1-30` (vitest + describe/it/beforeEach skeleton) | role-match |
| `playwright.config.ts` (webkit-iphone entry) | MODIFIED | config | n/a | `playwright.config.ts:16-19` `chromium` entry (same file) | exact (sibling) |
| `e2e/webkit-smoke.spec.ts` | NEW | smoke spec | request-response | `e2e/pwa.spec.ts:1-32` (minimal `goto` + `evaluate` shape) | role-match |
| `.github/workflows/ci.yml:70` (browser list) | MODIFIED | CI config | n/a | `.github/workflows/ci.yml:69-70` (line being edited) | exact (in-place) |

## Pattern Assignments

### `src/test-setup.ts` — visualViewport polyfill block (MODIFIED, additive after line 150)

**Analog:** `src/test-setup.ts:78-150` (HTMLDialogElement polyfill — same file, sibling block)

**Defensive gate pattern** (line 78):
```ts
if (typeof HTMLDialogElement !== 'undefined') {
  // …polyfill body…
}
```
The new block uses the parallel gate `typeof window !== 'undefined' && typeof window.visualViewport === 'undefined'` (D-02). Same shape, different predicate. Never overwrites a real implementation.

**Class-extends shim shape** (lines 5-11, ResizeObserver — secondary analog for the class form):
```ts
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}
```
Mirror this `as unknown as <DomType>` cast idiom for the polyfill assignment. The new block uses `class VisualViewportPolyfill extends EventTarget` so `instanceof EventTarget` is satisfied natively — no `Object.setPrototypeOf` ceremony.

**Self-test pattern — THE KEY ANALOG** (lines 121-149, verbatim):
```ts
  // Self-test: catches regressions at suite startup.
  try {
    const probe = document.createElement('dialog') as HTMLDialogElement;
    document.body.appendChild(probe);
    ensureHidden(probe);
    if (probe.style.display !== 'none') {
      throw new Error('dialog polyfill: default closed state is not display:none');
    }
    probe.showModal();
    if (probe.style.display === 'none') {
      throw new Error('dialog polyfill: showModal did not unset display');
    }
    let closed = false;
    probe.addEventListener('close', () => {
      closed = true;
    });
    probe.close();
    if (!closed) {
      throw new Error('dialog polyfill: close() did not dispatch close event synchronously');
    }
    if (probe.style.display !== 'none') {
      throw new Error('dialog polyfill: close() did not re-hide dialog');
    }
    probe.remove();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[test-setup] HTMLDialogElement polyfill self-test failed:', err);
    throw err;
  }
```

**Integration notes:**
- New visualViewport block follows the same `try { probe → mutate → assert → throw } catch (err) { console.error(...); throw err; }` shape (D-03, CONTEXT.md specifics §1).
- Probe steps for visualViewport: (a) `instanceof EventTarget` check, (b) `addEventListener('resize', handler)` + `dispatchEvent(new Event('resize'))` — assert listener fired, (c) `removeEventListener` + dispatch — assert listener detached.
- Place the new block AFTER line 150 (after the existing HTMLDialogElement block closes) so file-order matches load-order: simpler shims first, more complex shims last.
- Keep the same `// eslint-disable-next-line no-console` comment immediately above `console.error` — matches line 146.
- `throw err;` (NOT `console.warn`) is mandatory per CONTEXT.md specifics §1 — invisible warnings are the failure mode this phase exists to prevent.

---

### `src/lib/test/visual-viewport-mock.ts` (NEW, plain TS module — no runtime imports)

**Analog:** No direct precedent in the repo (this phase introduces the `src/lib/test/` directory per D-07).

**Closest behavioral analog:** the `matchMedia` stub at `src/test-setup.ts:22-36`:
```ts
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false
    })
  });
}
```
The shape to mirror: a stateless function that returns / mutates the polyfill's listener-capable object. The new helper does NOT install anything (the polyfill in `test-setup.ts` already did that) — it mutates the polyfill's properties and dispatches a synthetic event.

**NOT a singleton — explicit anti-pattern guidance:**
`src/lib/shared/theme.svelte.ts` is the closest *file-shape* sibling in tone but is the WRONG pattern to copy. Theme uses `$state` runes and exports a singleton object with `init()` / `set()` / `get current()`:
```ts
let _theme = $state<'light' | 'dark'>('light');
export const theme = {
  get current(): 'light' | 'dark' { return _theme; },
  set(value): void { _theme = value; /* …side-effects… */ },
  init(): void { /* …reads localStorage… */ }
};
```
Visual-viewport-mock is plain TypeScript (no `.svelte.ts` extension, no `$state`, no singleton). The polyfill instance lives on `window.visualViewport` and is the implicit shared state. The helper is a set of free functions that mutate that single live instance — see CONTEXT.md Pitfall 2: "do NOT replace the instance, mutate properties of the same instance and dispatchEvent."

**Required exports** (per D-08 / D-09 / D-10):
```ts
// src/lib/test/visual-viewport-mock.ts
// Phase 47 / TEST-02: test-only helpers that drive the visualViewport polyfill
// installed in src/test-setup.ts. Plain TS — no test-framework imports so any
// test file (vitest, future jest, etc.) can use these helpers.

export function dispatchVisualViewportResize(
  height: number,
  offsetTop = 0,
  width?: number
): void {
  const vv = window.visualViewport as unknown as {
    width: number; height: number; offsetTop: number;
    dispatchEvent: (e: Event) => boolean;
  };
  if (typeof width === 'number') vv.width = width;
  vv.height = height;
  vv.offsetTop = offsetTop;
  vv.dispatchEvent(new Event('resize'));
}

export function simulateKeyboardOpen(): void {
  // 290 px = iOS portrait soft-keyboard height (PITFALLS.md DRAWER-09 heuristic)
  dispatchVisualViewportResize(window.innerHeight - 290, 0);
}

export function simulateKeyboardDown(): void {
  dispatchVisualViewportResize(window.innerHeight, 0);
}

export function simulateBfcacheRestore(): void {
  // Phase 49 DRAWER-03: singleton must rebind on bfcache restore.
  const ev = new PageTransitionEvent('pageshow', { persisted: true });
  window.dispatchEvent(ev);
}
```

**Integration notes:**
- Mutate, don't replace (Pitfall 2 — RESEARCH.md). Tests holding references via `const vv = window.visualViewport` must observe the new values.
- Cast through `unknown` to satisfy `verbatimModuleSyntax` strict mode (mirrors the `as unknown as typeof ResizeObserver` idiom at `src/test-setup.ts:10`).
- No `import { vi, ... } from 'vitest'` — helpers must remain framework-agnostic so component tests, unit tests, and future suites all reuse them (CONTEXT.md "Established Patterns" — module-scope test helpers).
- `PageTransitionEvent` constructor availability in jsdom 29 is RESEARCH.md A3 (LOW risk). Fallback if needed: `const ev = new Event('pageshow'); Object.defineProperty(ev, 'persisted', { value: true });`
- Optional `_resetVisualViewportMock()` export recommended by RESEARCH.md Open Question §1 — resets to D-05 baseline (`width: window.innerWidth, height: window.innerHeight, offsetTop: 0, offsetLeft: 0, scale: 1`). Cheap to include (4 lines) and Phase 49 will use it in `beforeEach`.

---

### `src/lib/test/visual-viewport-mock.test.ts` (NEW co-located unit test)

**Analog:** `src/lib/shared/favorites.test.ts:1-30`

**Vitest skeleton pattern** (lines 1-30):
```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FAVORITES_MAX } from './favorites.svelte.js';

const STORAGE_KEY = 'nicu:favorites';

describe('favorites store', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it('T-01 first-run: init() with empty storage seeds defaults and persists them', async () => {
    const { favorites } = await import('./favorites.svelte.js');
    favorites.init();
    expect([...favorites.current]).toEqual(['feeds', 'formula', 'gir', 'morphine-wean']);
  });
});
```

**Integration notes:**
- Co-locate per project memory `feedback_test_colocation.md` (do NOT use `src/lib/test/__tests__/`). The sibling `.test.ts` lives directly next to `visual-viewport-mock.ts`.
- Use `T-01`, `T-02`, … numeric prefixes in test descriptions — convention seen across `favorites.test.ts`, `InputDrawer.test.ts`, `state.test.ts` etc.
- Required behaviors (RESEARCH.md "Phase Requirements → Test Map"):
  - `dispatchVisualViewportResize` mutates and dispatches → assert `vv.height` updated AND a registered listener fires.
  - `simulateKeyboardOpen` produces height = `innerHeight - 290`.
  - `simulateKeyboardDown` produces height = `innerHeight`.
  - `simulateBfcacheRestore` dispatches `pageshow` with `persisted: true` (assert via `addEventListener('pageshow', e => …)` capturing `e.persisted`).
- No `vi.resetModules()` needed (helpers are stateless free functions, not module-state singletons) — that's the favorites.test.ts feature; do NOT carry it over.

---

### `playwright.config.ts` — webkit-iphone project entry (MODIFIED)

**Analog:** `playwright.config.ts:15-20` (existing chromium project — same file, sibling array entry)

**Existing chromium entry to mirror** (verbatim):
```ts
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],
```

**Required new entry** (D-11, D-12 — appended, NOT replacing):
```ts
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'webkit-iphone',
      use: { ...devices['iPhone 14 Pro'] }
    }
  ],
```

**Integration notes:**
- The `import { defineConfig, devices } from '@playwright/test'` at line 1 already provides `devices` — no new imports.
- `devices['iPhone 14 Pro']` includes `defaultBrowserType: 'webkit'`, so no separate `browserName: 'webkit'` override is needed (RESEARCH.md Q3).
- Existing `chromium` entry MUST remain byte-for-byte identical (D-13, D-18). Only add the new entry; never refactor or reorder.
- Do NOT add `testIgnore` / `testMatch` filtering (D-15). Both projects run all e2e specs by default.
- `webServer` block (lines 21-32) is project-agnostic — no change.

---

### `e2e/webkit-smoke.spec.ts` (NEW)

**Analog:** `e2e/pwa.spec.ts:1-14` (smallest existing spec with the bare `goto` + `evaluate` shape)

**Boilerplate excerpt to mirror** (`e2e/pwa.spec.ts:1-14`):
```ts
import { test, expect } from '@playwright/test';

// PWA features (manifest, SW, offline) require a production build.
// These tests verify the HTML meta tags …

test.describe('PWA meta tags', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/morphine-wean');
    await page
      .getByRole('button', { name: /understand/i })
      .click({ timeout: 2000 })
      .catch(() => {});
  });

  test('has viewport meta with width=device-width', async ({ page }) => {
    const viewport = page.locator('meta[name="viewport"]');
    const content = await viewport.getAttribute('content');
    expect(content).toContain('width=device-width');
  });
});
```

**Integration notes — keep this minimal (D-14, D-16, RESEARCH.md Q7):**
- This is wiring proof, NOT a behavioral assertion. Phase 49 will add the substantive assertions.
- Do NOT include the `disclaimer dismiss` boilerplate from pwa.spec.ts (`getByRole('button', { name: /understand/i })…`) — the smoke spec doesn't interact with calculator UI. Bare `await page.goto('/')` is enough.
- Goal: prove (a) the project loads, (b) the page navigates, (c) WebKit reports a non-null `window.visualViewport` (real WebKit — independent of the jsdom polyfill).

**Required content** (per RESEARCH.md Q7):
```ts
// e2e/webkit-smoke.spec.ts
// Phase 47 / TEST-03: smoke check that the webkit-iphone Playwright project
// is wired correctly. Behavioral assertions belong to Phase 49.
import { test, expect } from '@playwright/test';

test('webkit-iphone project is wired and visualViewport is defined', async ({ page }) => {
  await page.goto('/');
  const hasVV = await page.evaluate(
    () => typeof window.visualViewport === 'object' && window.visualViewport !== null
  );
  expect(hasVV).toBe(true);
});
```

**Optional sanity additions** (CONTEXT.md "Claude's Discretion" §3 — planner may include):
```ts
expect(await page.evaluate(() => navigator.userAgent)).toContain('iPhone');
expect(page.viewportSize()).toEqual({ width: 393, height: 660 });
```

**No `test.describe` block needed** — single spec, single test. The describe-block pattern in pwa.spec.ts is for grouping related assertions; the smoke spec is a standalone wiring proof.

---

### `.github/workflows/ci.yml:70` — Playwright browser install (MODIFIED, single line)

**Analog:** the same line being edited (`.github/workflows/ci.yml:69-70`)

**Existing line to edit** (verbatim):
```yaml
      - name: Install Playwright browsers
        run: pnpm exec playwright install --with-deps chromium
```

**Required edit** (RESEARCH.md Q5 — CI gap):
```yaml
      - name: Install Playwright browsers
        run: pnpm exec playwright install --with-deps chromium webkit
```

**Integration notes:**
- Single space-separated browser list — Playwright's documented invocation pattern.
- `--with-deps` keeps the system-library install behavior (e.g. `libnss3`, `libgbm1`) for both browsers.
- Cost: webkit binary download ~80 MB; CI step time +~30s on `ubuntu-latest`. Acceptable.
- No other CI changes needed — `pnpm exec playwright test` at `.github/workflows/ci.yml:73` is bare (no `--project` filter) so the new `webkit-iphone` project is auto-discovered (RESEARCH.md Q4).
- Local-dev gotcha: developers running `pnpm exec playwright test` for the first time after this phase merges will hit "Executable doesn't exist at …/webkit-XXXX/…". The Playwright error message is actionable; planner should call this out in the phase Verification section.

---

## Shared Patterns

### Defensive gating
**Source:** `src/test-setup.ts:5,16,22,39,78`
**Apply to:** the new visualViewport polyfill block in `src/test-setup.ts`

Every polyfill in `src/test-setup.ts` is gated on `typeof X === 'undefined'` so it never overwrites a real implementation. The new block uses:
```ts
if (typeof window !== 'undefined' && typeof window.visualViewport === 'undefined') {
  // …
}
```
This is mandatory per D-02 / D-17 (existing 439+ vitest tests must still pass — polyfill must be additive, not destructive).

### Probe-then-throw self-test
**Source:** `src/test-setup.ts:121-149`
**Apply to:** the new visualViewport polyfill block in `src/test-setup.ts`

Self-test pattern: build a probe instance → mutate it → assert each invariant → on first failure `console.error([test-setup] X polyfill self-test failed:, err); throw err;`. Catches "polyfill regressed and is silently broken" failure modes that `console.warn` would hide in CI logs. CONTEXT.md specifics §1 calls this out explicitly: "console warning is invisible in CI."

### `as unknown as <DomType>` cast idiom
**Source:** `src/test-setup.ts:10`
**Apply to:** the new visualViewport polyfill block AND the helper module

```ts
} as unknown as typeof ResizeObserver;
```
Used to satisfy `verbatimModuleSyntax` strict mode and `lib.dom.d.ts` interface compatibility when constructing a polyfill via a `class` that doesn't implement every property of the real DOM type. The polyfill assignment becomes:
```ts
Object.defineProperty(window, 'visualViewport', {
  configurable: true, writable: false,
  value: new VisualViewportPolyfill() as unknown as VisualViewport
});
```
And the helper uses the same idiom to mutate the polyfill's mutable properties.

### Test colocation (numbered test IDs)
**Source:** `src/lib/shared/favorites.test.ts`, `src/lib/shared/components/InputDrawer.test.ts`
**Apply to:** `src/lib/test/visual-viewport-mock.test.ts`

- Co-locate `.test.ts` next to the module (project memory `feedback_test_colocation.md`).
- Use `T-01`, `T-02`, … numeric prefixes in `it()` descriptions for traceability against requirement IDs.
- Do NOT introduce `__tests__/` directories.

---

## No Analog Found

| File | Role | Data Flow | Mitigation |
|------|------|-----------|------------|
| `src/lib/test/` directory | test-helper module dir | n/a | No precedent — Phase 47 creates the directory. Convention defined in CONTEXT.md "Established Patterns" §3: plain TypeScript modules, no test framework imports. |

The `src/lib/test/visual-viewport-mock.ts` helper itself has no exact in-repo precedent (the matchMedia stub is the closest behavioral cousin). For deeper precedent, the planner should reference RESEARCH.md Q2 (helper sketch verified against `lib.dom.d.ts` and `EventTarget` semantics in jsdom 29).

---

## Metadata

**Analog search scope:**
- `src/test-setup.ts` (read in full)
- `playwright.config.ts` (read in full)
- `.github/workflows/ci.yml` (read in full)
- `e2e/*.spec.ts` (inventory + smallest specs read: `favorites-nav-a11y.spec.ts`, `pwa.spec.ts`)
- `src/lib/shared/theme.svelte.ts` (singleton anti-pattern reference)
- `src/lib/shared/favorites.test.ts` (vitest skeleton)
- `src/lib/shared/components/InputDrawer.test.ts` (matchMedia stub usage)

**Files scanned:** ~10 source files plus directory listings.
**Pattern extraction date:** 2026-04-27
**Confidence:** HIGH — every cited line range was read directly this session.
