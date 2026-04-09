# Phase 30 — Deferred Items

## From Plan 30-01 (Playwright e2e drift, pre-existing)

Confirmed via `git stash` on the pre-fix tree: these 8 failures exist on HEAD before any Plan 30-01 changes. They are test-suite drift from earlier refactors (v1.8 GIR addition, Formula/Morphine redesign). None are a11y/axe issues. All 16 axe sweeps are green.

| # | Spec | Failure | Likely root cause |
|---|---|---|---|
| 1 | `e2e/navigation.spec.ts:21` | Bottom nav tabs `toHaveCount(2)` — finds 3 | Not updated after GIR became the 3rd calculator tab. Expectation should be `3` with GIR in the asserted list. |
| 2 | `e2e/formula.spec.ts:12` | `heading 'Formula Recipe'` not visible | Heading copy changed in a prior polish pass. |
| 3 | `e2e/formula.spec.ts:18` | `'Choose a formula brand above to see the recipe'` not visible | Empty-state copy drifted. |
| 4 | `e2e/formula.spec.ts:22` | `'Select Brand'` placeholder not visible | Picker placeholder copy drifted. |
| 5 | `e2e/gir.spec.ts:22` (mobile) | `TARGET GIR` exact text not found | Eyebrow copy changed to `ADJUST RATE` / `HYPERGLYCEMIA` / `TARGET REACHED` in Phase 29 (and reaffirmed by Plan 30-01 `b278e7c`). Test needs to match the new discriminated-union eyebrows. |
| 6 | `e2e/gir.spec.ts:22` (desktop) | Same as above | Same fix. |
| 7 | `e2e/morphine-wean.spec.ts:25` | Summary card `90.0%` not found | Test expected pre-compound default; summary copy or defaults drifted. |
| 8 | `e2e/morphine-wean.spec.ts:45` | Summary card compounding % regex not matched | Same family — compounding default / copy drift. |

**Scope call:** All 8 are test-suite maintenance, not product polish. They do NOT block the "impeccable polish" success criteria of plan 30-01 (all findings + 16/16 axe). Recommend a dedicated `fix(e2e):` sweep in Plan 30-02 or a small standalone debug plan.
