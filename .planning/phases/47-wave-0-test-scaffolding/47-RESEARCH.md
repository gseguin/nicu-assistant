# Phase 47: Wave-0 — Test Scaffolding - Research

**Researched:** 2026-04-27
**Domain:** vitest jsdom polyfill + Playwright multi-project config
**Confidence:** HIGH (all 7 questions answered against in-repo files at exact line numbers; no speculation)

## Summary

Phase 47 is pure scaffolding. Milestone-level research (`.planning/research/{SUMMARY,STACK,ARCHITECTURE,PITFALLS}.md`) is comprehensive — this document does NOT re-cover iOS visualViewport behavior, anti-features, or the Playwright-WebKit-can't-emulate-keyboard finding. It answers ONLY the 7 phase-specific gaps the planner needs to write atomic tasks.

**Primary recommendation:** Polyfill via `class extends EventTarget` (cleanest TS satisfies, no `Object.setPrototypeOf` ceremony) wired in via the existing `vite.config.ts:64` `setupFiles` entry — no test config changes. Add `webkit-iphone` project after the existing `chromium` entry in `playwright.config.ts:16-19`. CI will need TWO surgical edits: install `webkit` browser and explicitly invoke both projects (or accept the no-filter default).

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TEST-01 | `window.visualViewport` polyfill in `src/test-setup.ts` mirroring existing patterns | Q2 (polyfill shape), Q1 (already-wired setupFiles) |
| TEST-02 | Helper `dispatchVisualViewportResize` etc. in `src/lib/test/visual-viewport-mock.ts` | Q2 (must mutate the polyfill the helper imports/references) |
| TEST-03 | New `webkit-iphone` Playwright project + smoke spec | Q3 (device shape), Q4-Q6 (CI gaps), Q7 (smoke spec) |

## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01..D-03: Polyfill in `src/test-setup.ts` (NOT new file), gated on `typeof window.visualViewport === 'undefined'`, with self-test mirroring lines 122-149 of existing dialog polyfill (probe → mutate → assert → throw on regression)
- D-04: Polyfill exposes `{ width, height, offsetTop, offsetLeft, scale, addEventListener, removeEventListener, dispatchEvent }` backed by EventTarget
- D-05: Initial values `{ width: window.innerWidth, height: window.innerHeight, offsetTop: 0, offsetLeft: 0, scale: 1 }`
- D-06: Polyfill does NOT track real viewport changes — tests drive state via D-09 helper exclusively
- D-07: Helper at `src/lib/test/visual-viewport-mock.ts` (new dir `src/lib/test/`)
- D-08..D-10: Helper exports `dispatchVisualViewportResize(height, offsetTop?, width?)`, `simulateKeyboardOpen()` (height = innerHeight − 290), `simulateKeyboardDown()` (height = innerHeight), `simulateBfcacheRestore()` (dispatches `pageshow` with `persisted: true`)
- D-11..D-15: Project named `webkit-iphone`, uses `devices['iPhone 14 Pro']`, sits alongside chromium (no replacement), CI runs both, no testIgnore filtering, smoke spec at `e2e/webkit-smoke.spec.ts`
- D-16..D-18: Phase narrow — only assert (a) self-test passes (b) helper functions importable (c) `--list` shows two projects (d) smoke spec passes; existing 439+ vitest + 99 Playwright must remain green
- Polyfill self-test MUST throw, not warn (specifics block §1)

### Claude's Discretion
- Exact TypeScript shape of EventTarget subclass — see Q2 below
- Smoke spec wording beyond the project-wired assertion
- Whether helper needs a `_resetVisualViewportMock()` between tests (recommend YES — see Q2 closing note)

### Deferred Ideas (OUT OF SCOPE)
- Migrating existing 7+ Playwright specs to webkit (D-15 + Deferred §1 — captured as follow-up if breakage at repo level)
- `simulateOrientationChange()` helper (Phase 49 may need; planner can append)
- Cloud real-device testing (BrowserStack/SauceLabs)
- VirtualKeyboard API shim

## Project Constraints (from CLAUDE.md)

- **GSD Workflow Enforcement** — all edits flow through GSD; this phase already entered via `/gsd-plan-phase 47`
- **TypeScript strict** (`tsconfig.json:6` strict + `verbatimModuleSyntax: true`) — polyfill MUST satisfy `lib.dom.d.ts` `VisualViewport` interface
- **Test colocation** — when Phase 49+ writes singleton tests, co-locate next to source (this is project memory, not Phase 47 work)
- **No new runtime/dev deps** — STACK.md zero-new-deps decision is locked; Phase 47 follows
- **PWA-only / offline-first / a11y AA** — not directly applicable to test scaffolding

## Question 1 — vitest setupFiles wiring (CONFIRMED)

**Verdict:** No test config changes needed. The polyfill plugs into the existing entry.

**File:** `vite.config.ts` (single config — there is NO separate `vitest.config.ts`; verified `ls vitest.config*` returns no matches).

**Exact wiring** (`vite.config.ts:60-65`):
```ts
test: {
  globals: true,
  environment: 'jsdom',
  include: ['src/**/*.{test,spec}.{js,ts}'],
  setupFiles: ['src/test-setup.ts']
}
```

`tsconfig.json:18` already includes `vitest.config.ts` in the include list — that line is dead today (no such file) but harmless. The polyfill only needs to be added to `src/test-setup.ts` and it will be loaded for every `*.test.ts` / `*.spec.ts` under `src/`.

**Confidence:** HIGH (verified against repo).

## Question 2 — visualViewport polyfill TypeScript shape

**Verdict:** Use `class extends EventTarget` (~20 lines). Cleaner than object-literal-with-delegate, satisfies `instanceof EventTarget`, satisfies `lib.dom.d.ts` `VisualViewport` interface under TS 6 strict, and mirrors the in-repo `ResizeObserver` shim shape at `src/test-setup.ts:5-11` which already uses `class … as unknown as typeof X`.

**Sketch:**
```ts
// In src/test-setup.ts, after the HTMLDialogElement self-test block (after line 150).
if (typeof window !== 'undefined' && typeof window.visualViewport === 'undefined') {
  class VisualViewportPolyfill extends EventTarget {
    width = window.innerWidth;
    height = window.innerHeight;
    offsetTop = 0;
    offsetLeft = 0;
    pageTop = 0;
    pageLeft = 0;
    scale = 1;
    onresize: ((this: VisualViewport, ev: Event) => unknown) | null = null;
    onscroll: ((this: VisualViewport, ev: Event) => unknown) | null = null;
    onscrollend: ((this: VisualViewport, ev: Event) => unknown) | null = null;
  }

  Object.defineProperty(window, 'visualViewport', {
    configurable: true,
    writable: false,
    value: new VisualViewportPolyfill() as unknown as VisualViewport
  });

  // Self-test: probe → mutate → assert → throw (mirrors lines 122-149).
  try {
    const vv = window.visualViewport!;
    if (!(vv instanceof EventTarget)) throw new Error('visualViewport polyfill: not an EventTarget');
    let received = 0;
    const handler = () => { received++; };
    vv.addEventListener('resize', handler);
    vv.dispatchEvent(new Event('resize'));
    if (received !== 1) throw new Error('visualViewport polyfill: dispatchEvent did not fire listener');
    vv.removeEventListener('resize', handler);
    vv.dispatchEvent(new Event('resize'));
    if (received !== 1) throw new Error('visualViewport polyfill: removeEventListener did not detach');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[test-setup] visualViewport polyfill self-test failed:', err);
    throw err;
  }
}
```

**Why class over object-literal:**
- `class extends EventTarget` makes `instanceof EventTarget` true natively. Object-literal needs `Object.setPrototypeOf(obj, EventTarget.prototype)` AND `EventTarget.call(obj)` to wire up listener storage — easy to get subtly wrong (the existing code in repo uses class form for `ResizeObserver` at lines 6-10).
- `lib.dom.d.ts` types `VisualViewport` as an interface that extends `EventTarget`. The `as unknown as VisualViewport` cast at the assignment site satisfies `verbatimModuleSyntax` strict; same idiom as `as unknown as typeof ResizeObserver` already used at line 10.
- Properties left as plain mutable fields (no getters) so the helper at `src/lib/test/visual-viewport-mock.ts` can assign directly: `(window.visualViewport as unknown as { height: number }).height = newHeight;`

**Helper sketch (`src/lib/test/visual-viewport-mock.ts`):**
```ts
export function dispatchVisualViewportResize(height: number, offsetTop = 0, width?: number) {
  const vv = window.visualViewport as unknown as {
    width: number; height: number; offsetTop: number;
    dispatchEvent: (e: Event) => boolean;
  };
  if (typeof width === 'number') vv.width = width;
  vv.height = height;
  vv.offsetTop = offsetTop;
  vv.dispatchEvent(new Event('resize'));
}
export function simulateKeyboardOpen() {
  dispatchVisualViewportResize(window.innerHeight - 290, 0);
}
export function simulateKeyboardDown() {
  dispatchVisualViewportResize(window.innerHeight, 0);
}
export function simulateBfcacheRestore() {
  const ev = new PageTransitionEvent('pageshow', { persisted: true });
  window.dispatchEvent(ev);
}
```

**Open question for planner:** add a `_resetVisualViewportMock()` exported helper that resets to the D-05 baseline? Recommend yes — Phase 49 unit tests will benefit from `beforeEach(_resetVisualViewportMock)`. Out of strict TEST-02 acceptance criteria, but cheap to include now.

**Confidence:** HIGH — `lib.dom.d.ts` shape verified via STACK.md §3 typing-gap table; `EventTarget` is a built-in extendable class in jsdom 29 and Node ≥18.

## Question 3 — Playwright `devices['iPhone 14 Pro']` exact properties

**Verdict:** Verified against installed `playwright-core@1.59.1` device descriptor source at `node_modules/.pnpm/playwright-core@1.59.1/.../deviceDescriptorsSource.json`:

```json
{
  "userAgent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.4 Mobile/15E148 Safari/604.1",
  "screen": { "width": 393, "height": 852 },
  "viewport": { "width": 393, "height": 660 },
  "deviceScaleFactor": 3,
  "isMobile": true,
  "hasTouch": true,
  "defaultBrowserType": "webkit"
}
```

**Notes for planner:**
- The descriptor sets `defaultBrowserType: 'webkit'`, so the project entry can simply spread the descriptor — no need to add `use: { browserName: 'webkit' }` separately:
  ```ts
  { name: 'webkit-iphone', use: { ...devices['iPhone 14 Pro'] } }
  ```
- Available variants in 1.59.1: `iPhone 14`, `iPhone 14 Pro`, `iPhone 14 Pro Max`, `iPhone 14 Plus`, plus `landscape` siblings. CONTEXT.md D-12 locks `iPhone 14 Pro` (393×852 screen, 393×660 viewport).
- Per PITFALLS.md / STACK.md §4: this descriptor does NOT inject `env(safe-area-inset-*)` values, does NOT emulate the iOS soft keyboard, does NOT emulate the Dynamic Island. That's the whole reason Phase 50 exists. Don't re-research.

**Confidence:** HIGH (read from installed module; package.json:25 pins `@playwright/test ^1.59.1`).

## Question 4 — CI cost of adding the second project

**Verdict:** CI does NOT pin a `--project` flag — `e2e:` job at `.github/workflows/ci.yml:73` runs `pnpm exec playwright test` (bare). Adding a project to `playwright.config.ts` is automatically picked up.

**Confirmed at `.github/workflows/ci.yml:72-73`:**
```yaml
- name: Run Playwright tests
  run: pnpm exec playwright test
```

No `--project chromium` filter. **Good news for the planner:** zero CI workflow changes needed for project discovery.

**However — see Q5 below — there IS a CI gap that DOES need addressing.**

**Confidence:** HIGH (full CI workflow inspected).

## Question 5 — `pnpm exec playwright install` for webkit (CI GAP — PLANNER MUST ADDRESS)

**Verdict:** **FLAG.** CI installs ONLY chromium today. The new `webkit-iphone` project will fail to launch unless the CI step is amended.

**Exact line in `.github/workflows/ci.yml:69-70`:**
```yaml
- name: Install Playwright browsers
  run: pnpm exec playwright install --with-deps chromium
```

**Required edit:** change to `pnpm exec playwright install --with-deps chromium webkit` (single space-separated browser list — Playwright's documented invocation pattern).

**Cost:** webkit binary download ~80 MB; CI install step time +~30s. Not significant on GitHub Actions.

**Recommendation for planner:** This is a single-line CI edit, but it's a separate task from `playwright.config.ts` because it lives in a different file under `.github/`. The planner should create a dedicated atomic task: **"Add webkit to CI Playwright browser install."** Without it, TEST-03 fails on CI even though it would pass locally on any dev machine that has webkit installed.

**Local-dev gotcha:** developers running `pnpm exec playwright test` for the first time after this phase merges will hit `Executable doesn't exist at /home/.../webkit-XXXX/...`. The Playwright error message is actionable (`Run "pnpm exec playwright install"`), but planner should call this out in the phase's `## Verification` section so the executor doesn't get tripped up.

**Confidence:** HIGH (workflow file inspected directly).

## Question 6 — Existing e2e specs compatibility

**Verdict:** Per CONTEXT.md D-15, existing specs are NOT in scope for migration in Phase 47. The only spec the new project NEEDS to pass is the new smoke spec. Per the no-testIgnore rule (D-15), all existing specs WILL also run under `webkit-iphone` once the project lands — and several WILL fail. Planner must decide: (a) skip-via-`browserName` annotations on known-incompatible specs as part of Phase 47, or (b) accept the breakage and treat as deferred follow-up.

**Existing specs in `e2e/`** (full inventory; recovered via `ls`):

| Spec | Will fail under webkit-iphone (393×660 viewport)? | Reason |
|------|---------------------------------------------------|--------|
| `desktop-full-nav.spec.ts` | **YES** | Calls `page.setViewportSize({ width: 1280, height: 800 })` (lines 19, 41, 71); design assumes desktop nav visible at md+ breakpoint. iPhone viewport will not stop the override but the test asserts desktop-only DOM. |
| `desktop-full-nav-a11y.spec.ts` | **YES** | `test.use({ viewport: 1280×800 })` at line 10. Same reason. |
| `mobile-nav-clearance.spec.ts` | LIKELY OK | Sets its own viewports per-test (375×667, 414×896). Self-contained. |
| `favorites-nav.spec.ts` | LIKELY OK | Loops viewports including 375×667 mobile. Self-contained `test.use`. |
| `favorites-nav-a11y.spec.ts` | unverified | Inherits per-test viewport. |
| `feeds.spec.ts`, `feeds-a11y.spec.ts` | LIKELY OK | Mobile viewport loops. |
| `formula.spec.ts` | LIKELY OK | `test.use({ viewport: 375×667 })` at line 38. |
| `fortification-a11y.spec.ts` | unverified | — |
| `gir.spec.ts`, `gir-a11y.spec.ts` | LIKELY OK | Mobile viewport. |
| `morphine-wean.spec.ts`, `-a11y.spec.ts` | unverified | — |
| `pert.spec.ts`, `pert-a11y.spec.ts` | unverified | Mobile viewport per `test.use` at lines 30, 167, 216. Already has `test.skip(!pertRouteReady)` at pert-a11y:182. |
| `uac-uvc.spec.ts`, `-a11y.spec.ts` | unverified | Mobile viewport per `test.use` at lines 51, 137. |
| `disclaimer-banner.spec.ts` | unverified | — |
| `navigation.spec.ts` | **POSSIBLY** | Sets 1280×800 at line 64 (desktop); 390×844 at 29 (mobile). Mixed. |
| `pwa.spec.ts` | LIKELY OK | Has `test.skip` at line 37 already; meta-viewport assertion is browser-agnostic. |

**KEY INSIGHT for planner:** `test.use({ viewport: ... })` and `page.setViewportSize(...)` **OVERRIDE** the `devices['iPhone 14 Pro']` viewport for the duration of that test. WebKit is still WebKit, and `isMobile/hasTouch/userAgent` carry over. The desktop-full-nav specs that demand 1280×800 will resize webkit to desktop dimensions — the assertions might still fail because `isMobile: true` / touch behavior differs from Desktop Chrome, but the viewport itself will not be the failure point.

**Recommendation for planner — pick option B (accept breakage as deferred):** CONTEXT.md D-15 explicitly says "Phase 47 itself does NOT need to migrate any existing specs; if any of the existing 7 specs breaks on webkit at the repository level, that's captured as a deferred follow-up." Phase 47 should NOT add `test.skip(({browserName}) => browserName === 'webkit')` annotations as part of its tasks. CI will go red on the desktop specs under webkit-iphone — accept that, and create a follow-up todo. The Phase 47 success criteria (D-16) intentionally exclude existing-spec compatibility.

**Caveat for the planner — verify that "existing 99 chromium tests still pass" (D-18) is interpreted correctly.** The new webkit-iphone project will run those same specs in webkit too, and several will fail. D-18's "99-passing chromium suite must still pass" is satisfied (chromium project unchanged), but planner should make the phase verification explicit: **assert chromium project passes 99/99**, do NOT assert webkit-iphone passes everything — only assert it passes the new smoke spec (D-16-d).

**Confidence:** MEDIUM-HIGH for the verdict; LOW-MEDIUM for individual spec predictions in the table (only desktop-full-nav verified by reading; others inferred from grep of `setViewportSize` / `test.use`).

## Question 7 — Smoke spec content

**Verdict:** Single spec file at `e2e/webkit-smoke.spec.ts`, ~5 lines body. Goal: prove the project is wired, nothing more.

**Recommended verbatim content:**
```ts
// e2e/webkit-smoke.spec.ts
// Phase 47 / TEST-03: smoke check that the webkit-iphone Playwright project
// is wired correctly. Behavioral assertions belong to Phase 49.
import { test, expect } from '@playwright/test';

test('webkit-iphone project is wired and visualViewport is defined', async ({ page }) => {
  await page.goto('/');
  const hasVV = await page.evaluate(() => typeof window.visualViewport === 'object' && window.visualViewport !== null);
  expect(hasVV).toBe(true);
});
```

This is the minimum that proves: (a) the project loads, (b) the page navigates, (c) WebKit reports a non-null `window.visualViewport` (real WebKit, not the jsdom polyfill — they are independent worlds). Done.

**Optional sanity additions** (CONTEXT.md "Claude's Discretion" §3 says planner may add 1-2 more). Recommended:
```ts
expect(await page.evaluate(() => navigator.userAgent)).toContain('iPhone');
expect(page.viewportSize()).toEqual({ width: 393, height: 660 });
```

These two extras make the test self-documenting about what `webkit-iphone` actually delivers and would catch a future config regression where someone inadvertently swaps the device descriptor.

**Confidence:** HIGH.

## Standard Stack

No new dependencies. Phase 47 is config and TS file additions only.

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@playwright/test` | ^1.59.1 (already installed) | Multi-project config, device descriptors | In repo since v1.0; supports `iPhone 14 Pro` since 1.30+ |
| `vitest` | ^4.1.4 (already installed) | jsdom test env loading setupFiles | Already wired |
| `jsdom` | ^29.0.2 (already installed) | DOM env without `visualViewport` (this is what we polyfill) | Confirmed by P-18 |

**Don't install:** Anything. STACK.md zero-new-deps decision is locked.

## Architecture Patterns

### Polyfill placement
Add to `src/test-setup.ts` AFTER the existing `HTMLDialogElement` block (after line 150). Loaded once at vitest startup via `vite.config.ts:64`. Self-tested at startup; throws on regression.

### Helper module pattern
New file `src/lib/test/visual-viewport-mock.ts`. Plain TypeScript module, no test framework imports (helpers must be runnable from any test file). Mirrors the no-existing-helpers convention; this phase introduces the directory.

### Playwright project pattern
Append a second `projects[]` entry to `playwright.config.ts`. Existing entry preserved verbatim. No `globalSetup`/`testIgnore`/`testMatch` changes.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| visualViewport polyfill | Custom EventTarget delegate object literal | `class extends EventTarget` | Built-in `instanceof EventTarget`, listener storage handled by base class, ~5 lines shorter |
| Device descriptor for iPhone 14 Pro | Hand-set viewport/userAgent/deviceScaleFactor in `use:` | `...devices['iPhone 14 Pro']` | Maintained upstream; defaults track real iOS versions |
| Smoke-spec page setup | Custom auth/disclaimer-dismiss boilerplate | Bare `await page.goto('/')` | TEST-03 is wiring proof, not a behavioral test |

## Common Pitfalls

### Pitfall 1: Polyfill self-test that warns instead of throws
**What goes wrong:** Polyfill regresses silently, suite stays green, downstream Phase 49 tests give false negatives.
**Why it happens:** `console.warn` is invisible in CI logs unless explicitly grepped.
**How to avoid:** Mirror the exact `console.error(...); throw err;` pattern at `src/test-setup.ts:146-148`. The CONTEXT.md "specifics" block calls this out by name.

### Pitfall 2: Helper assigning to `window.visualViewport` instead of mutating its properties
**What goes wrong:** Tests that hold a reference to the polyfill instance get stale data after a helper call.
**Why it happens:** Easy to write `window.visualViewport = { ...newState }` reflexively.
**How to avoid:** Mutate properties of the same instance (`vv.height = h`) and `dispatchEvent`. Do NOT replace the instance.

### Pitfall 3: CI passes locally but fails in CI on `webkit` browser missing
**What goes wrong:** Developer runs `pnpm exec playwright test` locally (with webkit installed from a previous project), CI fails on browser launch.
**Why it happens:** `.github/workflows/ci.yml:70` only installs `chromium`.
**How to avoid:** Plan a dedicated atomic task to update CI install step (Q5).

### Pitfall 4: Existing desktop-nav specs going red on webkit-iphone
**What goes wrong:** D-18 reads as "99 must pass everywhere," but desktop-full-nav specs assume 1280×800 desktop chrome. Under webkit-iphone they will likely fail.
**Why it happens:** D-15 prohibits per-spec migration as part of Phase 47.
**How to avoid:** Planner explicitly scopes the green criterion: chromium project = 99/99 unchanged; webkit-iphone project = smoke spec passes; treat any other webkit-iphone failures as deferred follow-up (per CONTEXT.md D-15).

## Code Examples

(All sketches consolidated in Q2 and Q7 above. No additional patterns needed.)

## Validation Architecture

**Note:** workflow.nyquist_validation status is not reachable from research, but Phase 47's verification is intrinsically test-infrastructure-self-test, so this section is included for planner visibility.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.1.4 (jsdom env) + Playwright 1.59.1 |
| Config file | `vite.config.ts:60-65` (vitest); `playwright.config.ts` |
| Quick run command | `pnpm test:run` (vitest) |
| Full suite command | `pnpm test:run && pnpm exec playwright test` |
| Phase 47 specific | `pnpm exec playwright test --list` (verifies projects), `pnpm exec playwright test --project webkit-iphone webkit-smoke` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TEST-01 | Polyfill defined + self-test passes at startup | implicit (suite-startup) | `pnpm test:run` (any test file triggers setupFile load) | ✅ existing tests |
| TEST-01 | Polyfill instance is `EventTarget` and listeners fire | unit | new test file e.g. `src/test-setup.visualviewport.test.ts` | ❌ Wave 0 (created in Phase 47) |
| TEST-02 | `dispatchVisualViewportResize` mutates and dispatches | unit | new test file e.g. `src/lib/test/visual-viewport-mock.test.ts` | ❌ Wave 0 (created in Phase 47) |
| TEST-02 | `simulateBfcacheRestore` dispatches `pageshow` with `persisted: true` | unit | same file | ❌ Wave 0 |
| TEST-03 | Two Playwright projects listed | smoke | `pnpm exec playwright test --list` | ❌ Wave 0 |
| TEST-03 | webkit-iphone smoke spec passes | smoke | `pnpm exec playwright test --project webkit-iphone webkit-smoke` | ❌ Wave 0 (created in Phase 47) |

### Sampling Rate
- **Per task commit:** `pnpm test:run` (vitest unit + setup) — < 30s
- **Per phase merge:** Both projects listed; smoke spec green; existing chromium suite still 99/99 green
- **Phase gate:** Same as per-merge, plus svelte-check 0/0 and `pnpm build` ✓ (REL-04 is Phase 51, not 47, but no harm checking)

### Wave 0 Gaps (created by Phase 47 itself)
- [ ] `src/test-setup.ts` polyfill block (additive, after line 150)
- [ ] `src/lib/test/visual-viewport-mock.ts` (new file)
- [ ] `src/lib/test/visual-viewport-mock.test.ts` co-located unit test (project memory: test colocation)
- [ ] `e2e/webkit-smoke.spec.ts` (new file)
- [ ] `playwright.config.ts` projects array entry
- [ ] `.github/workflows/ci.yml:70` browser install line update

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | vitest, Playwright | ✓ | per `.nvmrc` | — |
| pnpm | scripts | ✓ | 10.33.0 | — |
| `@playwright/test` | TEST-03 | ✓ | 1.59.1 | — |
| Playwright `chromium` browser | existing chromium project | ✓ (CI installs) | — | — |
| Playwright `webkit` browser | TEST-03 new project | **✗ (CI gap)** | — | Add to `playwright install` line in CI workflow |
| jsdom | TEST-01 | ✓ | 29.0.2 | — |

**Missing dependencies with fallback:**
- `webkit` browser binary in CI — fix is one line in `.github/workflows/ci.yml:70` (Q5)

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Existing `desktop-full-nav.spec.ts` and `-a11y.spec.ts` will fail under webkit-iphone project (table in Q6) | Q6 | LOW — phase scope (D-15) excludes existing-spec migration; failure is acceptable as deferred. Worst case: planner adds `test.skip` annotations as a small extra task. |
| A2 | `dispatchEvent(new Event('resize'))` on a `class extends EventTarget` instance fires `addEventListener('resize', …)` handlers in jsdom 29 | Q2 | VERY LOW — built-in EventTarget semantics; verified by spec; in-repo `HTMLDialogElement` polyfill at line 102/137 uses `dispatchEvent(new Event('close'))` with the same expectation and it works today. |
| A3 | `PageTransitionEvent` constructor is available in jsdom 29 with `persisted: true` option | Q2 (helper sketch) | LOW — jsdom 29 supports it; if not, fall back to `new Event('pageshow')` and `Object.defineProperty(ev, 'persisted', { value: true })`. Planner should verify during execution. |

**A2 + A3 are LOW risk and don't require user confirmation.** A1 is locked by CONTEXT.md D-15 and is informational only.

## Open Questions

1. **Should the helper module export a `_resetVisualViewportMock()` for use in `beforeEach`?**
   - What we know: D-08 only requires `dispatchVisualViewportResize`, `simulateKeyboardOpen`, `simulateKeyboardDown`, `simulateBfcacheRestore`. CONTEXT.md "Claude's Discretion" allows planner to extend.
   - What's unclear: whether Phase 49's tests will need test isolation between `it()` blocks.
   - Recommendation: Include it now — it's 4 lines and prevents subtle test-order-dependence bugs in Phase 49.

2. **Should Phase 47 also pre-add `test.skip(({browserName}) => browserName === 'webkit')` to the two desktop-nav specs to keep CI green under both projects?**
   - What we know: CONTEXT.md D-15 says no migration in scope. But D-18 says "existing 99 chromium suite must still pass" — that's chromium-only and is satisfied without skips.
   - What's unclear: the milestone-level expectation for CI greenness post-Phase 47.
   - Recommendation: Do NOT skip in Phase 47. Capture as deferred follow-up. If the planner wants to be conservative, add a single trailing task "(optional) skip desktop-nav specs under webkit" with one line per spec — total <10 LOC across both files.

## Sources

### Primary (HIGH confidence — verified in this session)
- `vite.config.ts:60-65` — vitest setupFiles wiring [VERIFIED: read directly]
- `src/test-setup.ts:1-150` — existing polyfill patterns [VERIFIED: read directly]
- `playwright.config.ts:1-33` — single-project structure [VERIFIED: read directly]
- `package.json:25,34,35,40-46` — Playwright 1.59.1, vitest 4.1.4, jsdom 29.0.2, TS 6.0.3 pinned [VERIFIED: read directly]
- `.github/workflows/ci.yml:69-73` — CI Playwright install + invocation [VERIFIED: read directly]
- `node_modules/.pnpm/playwright-core@1.59.1/.../deviceDescriptorsSource.json` — `iPhone 14 Pro` shape [VERIFIED: read directly]
- `e2e/desktop-full-nav.spec.ts:19,41,71`, `e2e/desktop-full-nav-a11y.spec.ts:10,54`, `e2e/favorites-nav.spec.ts:17-23`, `e2e/mobile-nav-clearance.spec.ts:22-42` — viewport patterns [VERIFIED: read directly]

### Secondary (HIGH confidence — milestone-level research)
- `.planning/research/STACK.md` — zero-new-deps decision; visualViewport in lib.dom.d.ts since TS 4.4 [CITED]
- `.planning/research/PITFALLS.md` — P-18 (jsdom no visualViewport), P-19 (Playwright chromium-only), P-04 (bfcache rebind via pageshow.persisted) [CITED]
- `.planning/research/SUMMARY.md`, `ARCHITECTURE.md` [CITED]

### Tertiary (referenced from CONTEXT.md, not re-verified this session)
- MDN VisualViewport — https://developer.mozilla.org/en-US/docs/Web/API/VisualViewport
- Apple Developer Forums #800125 (iOS 26 regression — out of phase scope; mentioned by D-06 to motivate the no-cache helper design)
- Playwright Emulation docs — https://playwright.dev/docs/emulation

## Metadata

**Confidence breakdown:**
- vitest setupFiles wiring (Q1): HIGH — read in repo at exact line numbers
- Polyfill TS shape (Q2): HIGH — `lib.dom.d.ts` confirmed by STACK.md; class form mirrors in-repo `ResizeObserver` shim
- iPhone 14 Pro descriptor (Q3): HIGH — read from installed module
- CI auto-discovery (Q4): HIGH — workflow file read directly, no project flag present
- CI webkit gap (Q5): HIGH — workflow line 70 reads `chromium` only; one-line fix
- Spec compatibility (Q6): MEDIUM-HIGH — desktop-nav clearly broken; others inferred from `test.use` patterns
- Smoke spec (Q7): HIGH — minimal correct shape

**Research date:** 2026-04-27
**Valid until:** 2026-05-27 (30 days — stable test infrastructure; only CI workflow file or Playwright minor version bump would invalidate)
