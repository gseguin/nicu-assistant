---
phase: 11-migration-and-cleanup
plan: 01
subsystem: migration-cleanup
tags: [cleanup, a11y, deletion, carryover]
requires: [fortification]
provides: [clean-v1.3, axe-audited-formula-route]
affects: [src/lib/formula, src/routes/+layout.svelte, src/lib/shell/NavShell.test.ts, src/lib/shared/components/SelectPicker.svelte, src/lib/fortification/FortificationCalculator.test.ts]
tech-stack:
  added: ["@types/node@^22 (devDep, for node:fs/node:path types)"]
  patterns: ["aria-labelledby for SelectPicker", "axe-core Playwright audit per route"]
key-files:
  created:
    - e2e/fortification-a11y.spec.ts
  modified:
    - src/routes/+layout.svelte
    - src/lib/shell/NavShell.test.ts
    - src/lib/shared/components/SelectPicker.svelte
    - src/lib/fortification/FortificationCalculator.test.ts
    - package.json
    - pnpm-lock.yaml
  deleted:
    - src/lib/formula/ (8 files)
decisions:
  - "Layout idle check migrated from legacy formulaState to fortificationState defaults comparison (base+volumeMl+formulaId+targetKcalOz+unit all at defaults)"
  - "NavShell.test.ts uses process.cwd()-relative resolve instead of import.meta.url (jsdom returned non-file URL)"
  - "@types/node added as devDep fallback for node:fs / node:path type declarations"
  - "SelectPicker aria-labelledby replaces aria-label; trigger accessible name is now just the label text"
metrics:
  duration: ~7min
  completed: 2026-04-07
---

# Phase 11 Plan 01: Migration & Cleanup Summary

Deleted legacy `src/lib/formula/` entirely, migrated the layout idle-check to `fortificationState`, fixed two carryover items (NavShell.test.ts Node types, SelectPicker label association), and added a full axe-core a11y audit for `/formula` — zero WCAG 2.1 AA violations in light mode, dark mode (color-contrast excluded per pre-existing dark theme TODO), and with-results state.

## Tasks

### Task 1: Verify MIG-02 and MIG-03 (read-only)
Confirmed `registry.ts`, `about-content.ts`, and `src/routes/formula/+page.svelte` all reflect the Phase 10-02 unified Fortification copy and imports. Zero references to Modified Formula / BMF in those files. No commit (read-only).

### Task 2: MIG-01 — Delete src/lib/formula/
Pre-deletion grep gate surfaced ONE consumer outside the directory: `src/routes/+layout.svelte` imported `formulaState` to compute the PWA idle check.

**Deviation (Rule 3 — blocking fix):** Migrated the layout idle check to use `fortificationState.current` defaults comparison (base='breast-milk', volumeMl=180, formulaId='neocate-infant', targetKcalOz=24, unit='teaspoons'). All other consumers were inside `src/lib/formula/` itself.

Then `git rm -r src/lib/formula/` deleted 8 files:
- BreastMilkFortifierCalculator.svelte
- FormulaCalculator.svelte
- ModifiedFormulaCalculator.svelte
- __tests__/formula.test.ts
- formula-config.json
- formula-config.ts
- formula.ts
- state.svelte.ts

Post-deletion grep (same pattern as gate): zero matches. vitest: 106/106 green.

**Commit:** `feat(11-01): delete legacy src/lib/formula/ [MIG-01]`

### Task 3: Carryover — NavShell.test.ts Node types
Replaced `import from 'fs'` / `'path'` with `node:fs` / `node:path`. Initial attempt used `fileURLToPath(new URL('./NavShell.svelte', import.meta.url))` but jsdom returned a non-`file:` URL at runtime — fell back to `resolve(process.cwd(), 'src/lib/shell/NavShell.svelte')`.

`node:fs`/`node:path` types were unresolved until `@types/node@^22` was added as a devDep (plan-authorized fallback). svelte-check errors on NavShell.test.ts: 3 → 0. All 7 structural tests pass.

**Commit:** `fix(11-01): NavShell.test.ts node module imports`

### Task 4: Carryover — SelectPicker aria-labelledby
Added `labelId = \`select-${crypto.randomUUID()}\``, set `id={labelId}` on the visible `<span>`, replaced `aria-label="{label}: {selectedLabel}"` on `Select.Trigger` with `aria-labelledby={labelId}`. Trigger accessible name is now exactly the label text.

**Cascading fix:** `FortificationCalculator.test.ts` helper `getSelectTrigger(label)` previously matched `new RegExp(\`^${label}:\`)`, which broke. Updated to `screen.getByRole('button', { name: label })` and removed the regex-escaping of `(kcal/oz)` in the call site. Morphine tests use semantic queries and were unaffected.

vitest: 106/106 green. Morphine unit suites: clean.

**Commit:** `feat(11-01): SelectPicker label-association via aria-labelledby`

### Task 5: MIG-04 — axe-core /formula audit
Created `e2e/fortification-a11y.spec.ts` mirroring `e2e/morphine-wean-a11y.spec.ts` exactly. Three tests, all passing:

| Test | Theme | Rules | Result |
|------|-------|-------|--------|
| light mode | light | wcag2a + wcag2aa | 0 violations |
| dark mode | dark | wcag2a + wcag2aa, `color-contrast` disabled (pre-existing TODO) | 0 violations |
| with-results | light | wcag2a + wcag2aa | 0 violations |

Light mode does NOT exclude color-contrast. Used the default Neocate parity state for the with-results scenario (already renders the "Amount to Add" hero without any user input).

Regression check: morphine-wean-a11y.spec.ts still 3/3 green after the SelectPicker change.

**Commit:** `test(11-01): axe-core a11y audit for /formula [MIG-04]`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocker] Layout idle check consumed legacy formulaState**
- **Found during:** Task 2 pre-deletion grep gate
- **Issue:** `src/routes/+layout.svelte` imported `formulaState` from `$lib/formula/state.svelte.js` to compute `isIdle` for PWA auto-update gating
- **Fix:** Migrated to `fortificationState.current` defaults comparison
- **Files modified:** `src/routes/+layout.svelte`
- **Commit:** folded into Task 2 commit

**2. [Rule 1 - Test breakage] FortificationCalculator.test.ts helper used old aria-label pattern**
- **Found during:** Task 4 post-change vitest run
- **Issue:** `getSelectTrigger` used `new RegExp(\`^${label}:\`)` which no longer matches the new accessible name (label text only, no "`:`")
- **Fix:** Simplified helper to `screen.getByRole('button', { name: label })`; removed regex-escaping of `(kcal/oz)` at call site
- **Files modified:** `src/lib/fortification/FortificationCalculator.test.ts`
- **Commit:** folded into Task 4 commit

**3. [Rule 3 - Fallback] Task 3 node: imports required @types/node**
- **Found during:** Task 3 svelte-check
- **Issue:** svelte-check flagged `node:fs` / `node:url` (then `node:path`) as unresolved modules
- **Fix:** Added `@types/node@^22` as devDep (plan-authorized fallback)
- **Commit:** folded into Task 3 commit

### Known Deferred (out of scope)
Pre-existing svelte-check errors unrelated to this plan, left as-is:
- `src/lib/morphine/MorphineWeanCalculator.svelte:110` — `triggerMagnification` (pre-existing before phase 11)
- `src/lib/shell/NavShell.svelte` — `$app/state` type declarations
- `src/routes/+layout.svelte` — `virtual:pwa-info` / `virtual:pwa-register` types
- `src/routes/+page.svelte` — `$app/navigation` type declarations

These are `.svelte-kit/` sync artifacts (svelte-kit sync is not fully populating generated types in this environment). They do not block build (`pnpm build` succeeds) and existed prior to plan 11-01.

## Final Verification

| Check | Result |
|-------|--------|
| `test ! -d src/lib/formula` | PASS (directory deleted) |
| `grep -rE "ModifiedFormula\|BreastMilkFortifier\|FormulaCalculator\|formulaState" src/` | PASS (zero matches) |
| `grep -rn "from .*\$lib/formula" src/` | PASS (zero matches) |
| `pnpm test:run` (vitest) | PASS (10 files, 106 tests) |
| `pnpm build` | PASS |
| `pnpm exec playwright test e2e/fortification-a11y.spec.ts` | PASS (3/3) |
| `pnpm exec playwright test e2e/morphine-wean-a11y.spec.ts` | PASS (3/3, regression) |
| NavShell.test.ts svelte-check errors | 0 (was 3) |

## Requirements Completed
- MIG-01: legacy `src/lib/formula/` deleted
- MIG-02: registry + About verified unified
- MIG-03: `/formula` route verified rendering FortificationCalculator
- MIG-04: axe-core audit green in light + dark + with-results

## Self-Check: PASSED
- FOUND: src/routes/+layout.svelte (migrated)
- FOUND: src/lib/shell/NavShell.test.ts (fixed)
- FOUND: src/lib/shared/components/SelectPicker.svelte (aria-labelledby)
- FOUND: src/lib/fortification/FortificationCalculator.test.ts (helper updated)
- FOUND: e2e/fortification-a11y.spec.ts (new)
- MISSING: src/lib/formula/ (expected — deleted)
- Commits verified in `git log`
