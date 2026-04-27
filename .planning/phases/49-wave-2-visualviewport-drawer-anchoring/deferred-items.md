# Phase 49 — Deferred Items

## Plan 49-03 — Pre-existing Playwright failures (out of 49-03 scope)

During Plan 49-03 Task 2 (full-matrix regression gate), the full Playwright run
surfaced 32 failures in the `webkit-iphone` project plus 2 in `chromium`. **All
sampled failures were verified to pre-exist on the pre-49-03 main HEAD `66bf1d5`**
(which is exactly Plan 49-02's final state). Plan 49-03's only code change is
the new file `e2e/drawer-visual-viewport.spec.ts` — no `src/` edits, no config
edits, no markup changes — so these failures cannot be caused by 49-03.

Per the executor SCOPE BOUNDARY rule (only auto-fix issues DIRECTLY caused by the
current task's changes; pre-existing failures in unrelated files are out of
scope), these 32 failures are NOT addressed in 49-03 and are logged here for
follow-up planning.

### Failure inventory (Task 1 HEAD `87d970f`, build+preview at port 5173, workers=2)

Total: 32 failures (1 chromium + 31 webkit-iphone)

**Category 1: Disclaimer-banner v2 persistence (2 cases — chromium + webkit-iphone)**
- `e2e/disclaimer-banner.spec.ts:28` — `dismiss + reload keeps banner hidden (v2 persistence)`
  - Failure mode: after reload, `getByRole('region', { name: /clinical use disclaimer/i })` returns count > 0 instead of 0.
  - Verified pre-existing on `66bf1d5` (sampled chromium variant).

**Category 2: Axe `dlitem` / `definition-list` violations (28 cases — webkit-iphone only)**

Sampled error: `Description list item does not have a <dl> parent element` on
`<dt>` / `<dd>` markup inside `div[title="..."]` containers (e.g., the recap
strip on Morphine, Feeds, GIR, Fortification, PERT). axe rule `dlitem`,
serious impact, WCAG 1.3.1.

Verified pre-existing on `66bf1d5` (sampled `e2e/morphine-wean-a11y.spec.ts:18`).

Cases (all `webkit-iphone` project, file:line):
- `e2e/favorites-nav-a11y.spec.ts:26` (light)
- `e2e/feeds-a11y.spec.ts:19, 33, 49, 66, 85, 96` (6 sweeps)
- `e2e/fortification-a11y.spec.ts:18, 31, 47, 67, 92 (light), 92 (dark)` (6 sweeps)
- `e2e/gir-a11y.spec.ts:19, 31, 45, 58, 82, 108` (6 sweeps)
- `e2e/morphine-wean-a11y.spec.ts:18, 31, 47, 64, 87, 109` (6 sweeps)
- `e2e/pert-a11y.spec.ts:196, 208` (2 sweeps)

Note: `e2e/desktop-full-nav-a11y.spec.ts:29 (dark)` failed in one run but
passed in a clean re-run — flaky, not stable.

`e2e/favorites-nav-a11y.spec.ts:39` (dark) failed in run 1 but passed in
run 2 — also flaky.

**Category 3: Functional Calculator UI (3 cases — webkit-iphone only)**
- `e2e/formula.spec.ts:24` — `renders recipe numeric output with defaults`
- `e2e/morphine-wean.spec.ts:51` — `clear inputs resets to default values`
- `e2e/morphine-wean.spec.ts:61` — `custom inputs produce correct starting dose`

Verified pre-existing on `66bf1d5` (sampled `morphine-wean.spec.ts:51`).

### Why this is NOT a 49-03 regression

`git diff 66bf1d5 HEAD --stat` (Plan 49-03 only adds 1 file):
```
 e2e/drawer-visual-viewport.spec.ts | 100 +++++++++++++++++++++++++++++++++++++
 1 file changed, 100 insertions(+)
```

The new file does not modify any `src/`, `static/`, `routes/`, or shared
component file. It cannot affect rendered HTML on `/morphine-wean`,
`/feeds`, `/gir`, `/fortification`, or `/pert`. The `dlitem` markup it
asserts is a property of those routes' rendered DOM, which is byte-identical
between `66bf1d5` and the post-49-03 HEAD.

### Verification evidence

- Sampled `e2e/morphine-wean-a11y.spec.ts:18` on `66bf1d5` (pre-49-03 HEAD)
  via `git checkout 66bf1d5 && pnpm build && pnpm exec playwright test
  e2e/morphine-wean-a11y.spec.ts:18 --project=webkit-iphone`. → FAILED with
  same `dlitem` error.
- Sampled `e2e/disclaimer-banner.spec.ts:28` on `66bf1d5`. → FAILED with same
  reload-persistence error.
- Sampled `e2e/morphine-wean.spec.ts:51` on `66bf1d5`. → FAILED with same
  clear-inputs assertion error.

### Suggested follow-up

These failures are inherited from earlier phases and should be addressed in
a dedicated maintenance / accessibility follow-up plan, not in 49-03. The
`dlitem` markup violations (Category 2) are likely a single-fix opportunity:
audit the recap strip component for `<dt>`/`<dd>` usage and either wrap in
`<dl>` or change to non-list semantics. The disclaimer-banner test (Category 1)
likely needs a localStorage-isolation fix in the test setup. The
`morphine-wean.spec.ts` calc tests (Category 3) likely need viewport / mobile
layout adjustments.

### What 49-03 DOES achieve

- ✅ New spec `e2e/drawer-visual-viewport.spec.ts` passes 2/2 (chromium 415ms +
  webkit-iphone 1.5s) on a clean preview server.
- ✅ `pnpm exec vitest run` → 464/464 passing (no regression vs 49-02 baseline).
- ✅ `pnpm exec svelte-check --threshold error` → 0 errors.
- ✅ `pnpm build` → succeeds.
- ✅ DRAWER-TEST-03 contract met: synthetic-dispatch CI proxy proves end-to-end
  observability of the singleton + CSS-variable wiring in real Chromium and
  real WebKit.
- ⚠️ DRAWER-TEST-04 contract met as **regression gate against 49-03's own
  changes only** (which are zero src changes). The 32 pre-existing failures
  are NOT caused by 49-03 and the existing axe sweeps are byte-identical
  pre/post-49-03.
