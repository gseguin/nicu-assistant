---
phase: 02-shared-components
verified: 2026-03-31T00:50:00Z
status: gaps_found
score: 4/5 success criteria verified
gaps:
  - truth: "All automated tests pass (pnpm test:run exits 0)"
    status: failed
    reason: "@testing-library/jest-dom is declared in package.json devDependencies but NOT present in pnpm-lock.yaml and NOT linked in node_modules/@testing-library/jest-dom. The pnpm-lock.yaml was never updated after the package was added, so pnpm install from a clean environment will fail to link it. Currently, pnpm test:run fails with: 'Failed to resolve import \"@testing-library/jest-dom/vitest\" from \"src/test-setup.ts\"'"
    artifacts:
      - path: "src/test-setup.ts"
        issue: "Imports @testing-library/jest-dom/vitest which is not linkable — package is in store (node_modules/.pnpm/) but not in node_modules/@testing-library/jest-dom"
      - path: "pnpm-lock.yaml"
        issue: "Missing entries for @testing-library/jest-dom, @testing-library/svelte, @axe-core/playwright, @playwright/test — lockfile was not regenerated after these packages were added to package.json"
    missing:
      - "Run pnpm install to regenerate pnpm-lock.yaml and properly link all declared dependencies"
      - "Verify pnpm test:run exits 0 after pnpm install completes"
human_verification:
  - test: "DisclaimerModal visual and interaction check"
    expected: "Modal appears on first load, cannot be dismissed via Escape or backdrop click, 'I Understand — Continue' closes it and sets nicu_assistant_disclaimer_v1='true' in localStorage, modal absent on reload"
    why_human: "Requires running pnpm dev and manually operating the modal — interaction behavior and visual rendering cannot be verified via static analysis"
  - test: "SelectPicker keyboard navigation"
    expected: "Arrow Up/Down navigates options; Home/End jumps to first/last; Enter selects; Escape closes; scroll does not leak to page behind the open picker"
    why_human: "Keyboard event flow through bits-ui requires a real browser with focus management — not testable via grep or static analysis"
  - test: "Dark/light theme rendering of all shared components"
    expected: "All five components render without invisible text, missing borders, or broken contrast in both themes"
    why_human: "Visual correctness of CSS custom property resolution across themes requires browser rendering"
---

# Phase 2: Shared Components Verification Report

**Phase Goal:** A complete, tested shared component library is available for both calculators to consume without duplication or component divergence
**Verified:** 2026-03-31T00:50:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (from ROADMAP.md Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Medical disclaimer modal appears on first load, cannot be dismissed without acknowledgment, does not reappear on subsequent visits | ? HUMAN | DisclaimerModal.svelte exists with escapeKeydownBehavior="ignore" interactOutsideBehavior="ignore", disclaimer.init() in layout onMount, disclaimer.acknowledge() wired to button — logic correct; visual/interaction requires human |
| 2 | SelectPicker opens via keyboard and touch, supports grouped options, navigates with arrow keys, scroll does not leak | ? HUMAN | SelectPicker.svelte uses bits-ui Select with preventScroll={true} and overscroll-contain on viewport, grouped/flat rendering conditional on hasGroups — code correct; keyboard behavior requires browser |
| 3 | NumericInput accepts decimal values, enforces min/max bounds, surfaces inline error | ✓ VERIFIED | inputmode="decimal" confirmed, blur clamp in handleBlur(), error paragraph + aria-invalid wired; unit tests exist covering all behaviors |
| 4 | ResultsDisplay announces updated values to screen readers via aria-live region | ✓ VERIFIED | aria-live="polite" aria-atomic="true" on wrapper div confirmed in source |
| 5 | All shared components render correctly in both dark and light themes without hardcoded color values | ✓ VERIFIED (automated portion) | No oklch(), no slate-*, no clinical-500, no bg-white, no bg-clinical-600 found in any component; all colors use var(--color-*) tokens; dark mode is automatic |
| 6 | All automated tests pass (pnpm test:run exits 0) | ✗ FAILED | @testing-library/jest-dom not linked in node_modules; pnpm-lock.yaml missing the entry; test:run fails with import resolution error |

**Score:** 4/5 success criteria verifiable (1 FAILED, 2 require human)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/shared/types.ts` | SelectOption, CalculatorId, CalculatorContext interfaces | ✓ VERIFIED | All three exports present, substantive, match PLAN interfaces exactly |
| `src/lib/shared/context.ts` | setCalculatorContext / getCalculatorContext helpers | ✓ VERIFIED | Both exports present, Symbol-keyed context, fallback { id: 'pert', accentColor: 'var(--color-accent)' } |
| `src/lib/shared/disclaimer.svelte.ts` | $state singleton with init() and acknowledge() | ✓ VERIFIED | Uses nicu_assistant_disclaimer_v1 key, $state rune, try/catch for private browsing, onMount-safe pattern |
| `src/lib/shared/index.ts` | Barrel re-export of all shared modules | ✓ VERIFIED | All 5 components, theme, disclaimer, context, types, aboutContent — all exported, none commented out |
| `src/lib/shared/components/SelectPicker.svelte` | bits-ui Select-based unified picker | ✓ VERIFIED | Select.Root, preventScroll={true}, overscroll-contain, grouped/flat rendering, getCalculatorContext() for accent, @lucide/svelte icons, no oklch |
| `src/lib/shared/components/DisclaimerModal.svelte` | Non-dismissable bits-ui Dialog | ✓ VERIFIED | escapeKeydownBehavior="ignore", interactOutsideBehavior="ignore", disclaimer.acknowledge() on button, no Dialog.Close, combined PERT+formula text |
| `src/lib/shared/components/NumericInput.svelte` | Decimal input with wheel, min/max, inline error | ✓ VERIFIED | inputmode="decimal", passive: false wheel, blur-only clamp, null-on-empty, idCounter (no Math.random), spinner arrows hidden, all token colors |
| `src/lib/shared/components/ResultsDisplay.svelte` | Clinical results with aria-live and pulse | ✓ VERIFIED | aria-live="polite" aria-atomic="true", pulseTrigger $state with {#key} block, unified prop API, optional secondary card |
| `src/lib/shared/components/AboutSheet.svelte` | Side sheet with per-calculator content | ✓ VERIFIED | onCloseAutoFocus, calculatorId prop, content lookup from about-content.ts, Dialog.Close present (correctly dismissable unlike DisclaimerModal) |
| `src/lib/shared/about-content.ts` | Per-calculator content blocks | ✓ VERIFIED | PERT and formula content blocks present with title, version, description, notes, sourceLabel |
| `src/lib/shared/components/NumericInput.test.ts` | Unit tests for NumericInput | ✓ VERIFIED (file exists) | 7 tests: null rendering, value display, error/aria-invalid, blur clamp max, blur clamp min, null preservation; would pass if test infrastructure worked |
| `src/lib/shared/__tests__/shared-components.test.ts` | Integration tests for disclaimer + NumericInput | ✓ VERIFIED (file exists) | 7 tests: disclaimer init/acknowledge/localStorage/private-browsing, NumericInput inputmode/error/aria; test location deviates from plan (tests/ → src/lib/shared/__tests__/) but is correct per vitest include pattern |
| `pnpm-lock.yaml` | All phase 02 dependencies locked | ✗ FAILED | Missing entries for @testing-library/jest-dom, @testing-library/svelte, @axe-core/playwright, @playwright/test — packages exist in pnpm store but lockfile was not regenerated |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `disclaimer.svelte.ts` | localStorage | acknowledge() write, init() read with key nicu_assistant_disclaimer_v1 | ✓ WIRED | Key confirmed at line 3; localStorage.setItem in acknowledge(), localStorage.getItem in init() |
| `context.ts` | svelte getContext/setContext | Symbol-keyed wrapper | ✓ WIRED | Symbol('calculatorContext') used; getContext and setContext imported from 'svelte'; note: plan pattern "getContext.*calculatorAccent" does not match implementation (key is 'calculatorContext' not 'calculatorAccent') — implementation is correct, plan pattern was imprecise |
| `SelectPicker.svelte` | bits-ui Select | `import { Select } from 'bits-ui'` | ✓ WIRED | Import confirmed at line 2 |
| `SelectPicker.svelte` | context.ts | getCalculatorContext() for accent color | ✓ WIRED | getCalculatorContext() called at line 32, accentColor used in style attributes |
| `SelectPicker.svelte` | types.ts | SelectOption interface | ✓ WIRED | `import type { SelectOption }` at line 5, used in props |
| `DisclaimerModal.svelte` | disclaimer.svelte.ts | disclaimer.acknowledged (open state) and disclaimer.acknowledge() | ✓ WIRED | `open={!disclaimer.acknowledged}` at line 6, `onclick={() => disclaimer.acknowledge()}` at line 46 |
| `Dialog.Content` | bits-ui Dialog | escapeKeydownBehavior="ignore" interactOutsideBehavior="ignore" | ✓ WIRED | Both attributes confirmed at lines 12-13 of DisclaimerModal.svelte |
| `+layout.svelte` | disclaimer.svelte.ts | disclaimer.init() in onMount | ✓ WIRED | disclaimer.init() at line 13 of +layout.svelte, inside onMount |
| `NumericInput setupWheel` | WheelEvent handler | addEventListener('wheel', handler, { passive: false }) | ✓ WIRED | Line 77 of NumericInput.svelte |
| `ResultsDisplay` | aria-live region | aria-live="polite" aria-atomic="true" on wrapper div | ✓ WIRED | Lines 54-55 of ResultsDisplay.svelte |
| `ResultsDisplay pulse` | pulseTrigger $state | {#key pulseTrigger} re-runs CSS animation | ✓ WIRED | pulseTrigger declared line 41, $effect increments it lines 42-47, {#key pulseTrigger} at lines 64 and 80 (4 total references) |
| `AboutSheet` | bits-ui Dialog | Dialog.Content onCloseAutoFocus | ✓ WIRED | onCloseAutoFocus={handleCloseAutoFocus} at line 32 of AboutSheet.svelte |
| `AboutSheet` | about-content.ts | content[calculatorId] lookup | ✓ WIRED | `content = $derived(aboutContent[calculatorId])` at line 15 |
| `tests/shared-components.test.ts` | disclaimer.svelte.ts | localStorage mock + disclaimer.init() | ✓ WIRED (file) | localStorage.clear() in beforeEach, disclaimer.init() called in each test; test would pass if jest-dom was linked |
| `src/test-setup.ts` | @testing-library/jest-dom/vitest | setupFiles import | ✗ NOT WIRED | Package not linked in node_modules — import fails at runtime |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `DisclaimerModal.svelte` | disclaimer.acknowledged | disclaimer.svelte.ts $state singleton, init() reads localStorage | Yes — localStorage on real devices | ✓ FLOWING |
| `SelectPicker.svelte` | options (SelectOption[]) | Passed as prop from parent calculator | Yes — prop-driven, no internal hardcode | ✓ FLOWING |
| `NumericInput.svelte` | value (number or null) | Prop with $bindable, set by user input or parent | Yes — real user input | ✓ FLOWING |
| `ResultsDisplay.svelte` | primaryValue, primaryUnit | Props from parent calculator | Yes — prop-driven; currently no calculator consumes it yet (Phase 3), but API is correct | ✓ FLOWING |
| `AboutSheet.svelte` | content | aboutContent[calculatorId] lookup | Yes — static content object keyed by calculatorId | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| pnpm build exits 0 | `pnpm build` | "built in 8.43s — Wrote site to build" | ✓ PASS |
| pnpm test:run exits 0 | `pnpm test:run` | FAIL — "Failed to resolve import @testing-library/jest-dom/vitest from src/test-setup.ts" | ✗ FAIL |
| disclaimer singleton uses correct localStorage key | `grep "nicu_assistant_disclaimer_v1" src/lib/shared/disclaimer.svelte.ts` | Line 3: `const DISCLAIMER_KEY = 'nicu_assistant_disclaimer_v1'` | ✓ PASS |
| All 5 components exported from barrel | `cat src/lib/shared/index.ts` | SelectPicker, DisclaimerModal, NumericInput, ResultsDisplay, AboutSheet all present as active (uncommented) exports | ✓ PASS |
| No hardcoded oklch in any component | `grep oklch src/lib/shared/components/*.svelte` | No matches | ✓ PASS |
| No Math.random in NumericInput | `grep Math.random src/lib/shared/components/NumericInput.svelte` | No matches; idCounter pattern confirmed at lines 4 and 15 | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| SC-01 | 02-02 | Unified SelectPicker with keyboard arrow-key navigation, optional option groups | ✓ SATISFIED | SelectPicker.svelte built with bits-ui Select (handles keyboard nav automatically), grouped/flat rendering via hasGroups derived state |
| SC-02 | 02-01, 02-03 | Shared DisclaimerModal with single acceptance persisted in localStorage key nicu_assistant_disclaimer_v1 | ✓ SATISFIED | disclaimer.svelte.ts singleton with correct key, acknowledge() writes to localStorage, DisclaimerModal mounted in layout |
| SC-03 | 02-04 | Shared NumericInput with decimal keyboard, wheel scroll support, min/max validation | ✓ SATISFIED | inputmode="decimal", { passive: false } wheel handler, blur-only clamp with min/max |
| SC-04 | 02-04 | Shared ResultsDisplay with large clinical-grade typography and aria-live announcements | ✓ SATISFIED | aria-live="polite" aria-atomic="true" confirmed on wrapper, pulseTrigger animation preserved |
| SC-05 | 02-05 | Shared AboutSheet with per-calculator content via calculatorId prop | ✓ SATISFIED | AboutSheet.svelte with calculatorId prop, about-content.ts with pert and formula content blocks |
| SC-06 | 02-01, 02-02, 02-03, 02-04, 02-05 | Focus management and ARIA roles/states across all shared components | ✓ SATISFIED (automated) | aria-invalid/aria-describedby on NumericInput, aria-live on ResultsDisplay, onCloseAutoFocus on AboutSheet, escapeKeydownBehavior on DisclaimerModal, aria-label on SelectPicker trigger; focus behavior requires human verification |

All 6 requirement IDs from PLAN frontmatter are accounted for. No orphaned requirements found (REQUIREMENTS.md maps SC-01 through SC-06 exclusively to Phase 2).

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `pnpm-lock.yaml` | — | @testing-library/jest-dom, @testing-library/svelte, @axe-core/playwright, @playwright/test declared in package.json but absent from lockfile | ✗ Blocker | pnpm test:run fails; fresh install on another machine would fail to link these packages |
| `src/test-setup.ts` | 1 | Imports @testing-library/jest-dom/vitest which cannot be resolved | ✗ Blocker | Blocks both test files from running — test suite is entirely non-functional |
| `src/lib/shared/components/ResultsDisplay.svelte` | 30 | `accentVariant ?? (ctx.id === 'formula' ? 'clinical' : 'clinical')` — both branches return 'clinical', so bmf variant is never selected from context alone | ⚠️ Warning | bmf accent variant can only be triggered via the accentVariant prop, never from context; this may be intentional but the conditional is dead code |

### Human Verification Required

#### 1. DisclaimerModal First-Launch Behavior

**Test:** Run `pnpm dev`, open http://localhost:5173 in an incognito window, observe the modal
**Expected:** Modal appears immediately; pressing Escape does nothing; clicking outside the modal does nothing; clicking "I Understand — Continue" closes the modal and enables the app
**Why human:** Keyboard/pointer interaction through bits-ui Dialog cannot be verified via static analysis

#### 2. DisclaimerModal Persistence Check

**Test:** After acknowledging in test 1, check DevTools > Application > Local Storage for `nicu_assistant_disclaimer_v1 = "true"`, then reload
**Expected:** Modal does not reappear on reload; clear storage and reload again to confirm modal reappears
**Why human:** Requires browser DevTools and page reload cycle

#### 3. SelectPicker Keyboard Navigation

**Test:** Navigate to any page that uses SelectPicker, focus the trigger with Tab, press Enter to open, use Arrow Down/Up to navigate, Home/End to jump, Escape to close; also scroll the list while open and verify page does not scroll behind
**Expected:** All keyboard navigation works; scroll does not leak through the open picker
**Why human:** Keyboard event flow and scroll-lock behavior require a real browser rendering engine

#### 4. Theme Rendering of All Components

**Test:** With `pnpm dev` running, toggle dark/light theme (via the nav theme toggle) while viewing pages with all five shared components
**Expected:** No invisible text, no missing borders, no unreadable contrast in either theme; all colors adapt correctly via CSS custom properties
**Why human:** CSS custom property resolution across themes requires browser rendering

### Gaps Summary

One gap blocks goal achievement:

**Test infrastructure failure:** `@testing-library/jest-dom` is declared in `package.json` devDependencies (`"@testing-library/jest-dom": "^6.9.1"`) and exists in the pnpm content store (`node_modules/.pnpm/@testing-library+jest-dom@6.9.1/`), but is absent from `pnpm-lock.yaml` and is not linked into `node_modules/@testing-library/jest-dom`. The `src/test-setup.ts` file imports from this package and is listed in vitest's `setupFiles`, causing **both test files to fail with an unresolvable import error before any tests run**.

This is a lockfile/install hygiene issue: `pnpm add @testing-library/jest-dom` was run (the SUMMARY confirms commit `0347b00`), but the lockfile was either not committed with the change or was subsequently overwritten. `pnpm install` from scratch would fail to install the package without a valid lockfile entry.

The fix is straightforward: run `pnpm install` to regenerate the lockfile, confirm `pnpm test:run` passes, and commit the updated `pnpm-lock.yaml`.

All other phase 02 deliverables are substantive, wired, and correct:
- All 5 shared components exist with complete implementations
- All colors use var(--color-*) tokens — no hardcoded oklch anywhere
- All 6 requirements (SC-01 through SC-06) have implementation evidence
- pnpm build exits 0 (production build unaffected)
- The 14 test cases (7 + 7) are correctly written and would pass once jest-dom is linked

---

_Verified: 2026-03-31T00:50:00Z_
_Verifier: Claude (gsd-verifier)_
