# Domain Pitfalls — v1.12 Feed Advance Calculator

**Domain:** NICU Feed Advance (Sheet1 TPN + full nutrition / Sheet2 bedside advancement)
**Researched:** 2026-04-09
**Source authority:** `nutrition-calculator.xlsx` (Sheet1 + Sheet2)
**Prior pain referenced:** v1.5 Phase 20 (Morphine OKLCH axe failure), v1.6 (NumericInput advisory contract), v1.8 Phase 28 Wave 0 (`CalculatorId` + `NavShell.activeCalculatorId` latent bugs), v1.8 GIR (~1% epsilon for truncated constants), v1.11 (xlsx as sole source of truth, row-by-row parity)

---

## Critical Pitfalls

These will cause rewrites, silent clinical errors, or broken builds if not pre-empted.

---

### P1. Spreadsheet parity drift when xlsx constants become user-selectable dropdowns

**Risk category:** Clinical correctness / test discipline
**Phase:** Calculator phase (pure-logic sub-phase, BEFORE UI)
**Severity:** CRITICAL

**What goes wrong:**
The xlsx hardcodes trophic `/6` (q4h), advance `/2` (twice-daily), and IV backfill `/3` (q3h). Our calculator exposes all three as dropdowns. If the parity test just calls `calculateFeedAdvance(weight)` with defaults that don't *exactly* match the xlsx's hardcoded divisors, the test either (a) silently passes a different formula than the spreadsheet, or (b) the divisor constants drift between the engine and the xlsx and no one notices because tests are green.

**Trigger scenario:**
A future phase "simplifies" the dropdown default from `twiceDaily` to `everyOtherFeed` without re-locking the xlsx fixture. Parity test still passes (because the fixture was recomputed from the new default), but the output no longer matches the authoritative spreadsheet.

**Prevention strategy (fixture discipline):**

1. **Fixture file `feed-advance-parity.fixtures.json`** with TWO sections:
   - `xlsxLocked`: weight **1.94**, trophic `q4h` (÷6), advance `twiceDaily` (÷2), IV backfill divisor `3` — the EXACT divisors the xlsx hardcodes. Row-by-row expected values copied directly from Sheet1 + Sheet2 cells. These tests are the "xlsx is God" gate.
   - `parameterMatrix`: derived expected values for the other dropdown combinations (q3h trophic, every-feed / every-other / every-3rd / once-daily advance). These are NOT parity-locked; they are computed from the same pure function under different inputs and assert *internal consistency* (e.g., "every-other-feed of 10 feeds/day = 5 advances/day", "sum of per-feed volumes × feed count == daily volume").

2. **Fixture header comment** citing exact xlsx cell addresses (e.g., `Sheet2!B15..B24`) so the next reader can re-verify without opening the xlsx blind.

3. **Test structure** — mirror `morphine/calculations.test.ts`:
   ```ts
   describe('Feed Advance — xlsx Sheet2 spreadsheet parity (locked)', () => {
     // canonical: weight 1.94, trophic q4h, advance twiceDaily, backfill /3
     for (const row of expected) { it(`step ${row.step} matches Sheet2 row`, ...) }
   });
   describe('Feed Advance — parameter matrix (internal consistency)', () => {
     // every dropdown combo × expected shape, not locked to xlsx
   });
   ```

4. **Guard comment in `calculations.ts`**: `// xlsx Sheet2 hardcodes trophic /6, advance /2, backfill /3. Our dropdowns parameterize these. The LOCKED parity fixture uses those exact divisors and MUST NOT be edited to match new defaults.`

**Detection:** CI runs `pnpm test -- feed-advance`. If the locked block fails, stop and re-verify the xlsx.

---

### P2. Sheet1 dual dextrose source — single-line UI under-reports kcal

**Risk category:** Clinical correctness (silent under-dose)
**Phase:** Requirements + calculator phase
**Severity:** CRITICAL

**What goes wrong:**
Sheet1 has TWO parallel dextrose lines (B3/B4 and B5/B6), both feeding the dextrose-kcal total. A naive port reads only one pair, and total kcal/kg silently under-reports. This is the worst class of bug for a clinical calculator: it produces a *plausible* number that is *wrong*.

**Trigger scenario:**
Port authors the UI with one "Dextrose %" + one "Volume" input, wires `calculateDextroseKcal(pct, ml)`, runs parity against a single-line fixture they themselves constructed, and ships. The xlsx row that uses both lines never gets tested.

**Prevention strategy:**

1. **Requirements phase: explicit dual-line callout.** REQUIREMENTS.md must state "Sheet1 has two dextrose lines (B3/B4 + B5/B6). Both contribute to dextrose kcal. UI must expose both inputs or justify in writing why one is deprecated."
2. **Data model:** `Sheet1Inputs.dextroseLines: Array<{ pct: number; volumeMl: number }>` — an array, never two scalar fields. Makes the dual nature structural.
3. **Parity fixture** for Sheet1 uses a realistic case where **both** lines are non-zero. Row-by-row assert `dextroseKcal` matches xlsx `=B4*B3/100*3.4 + B6*B5/100*3.4`.
4. **Unit test** explicitly named `"dextrose kcal sums BOTH lines"` — a regression anchor for future refactors.

---

### P3. Sheet1 unit confusion — wrong constant × wrong variable pairing

**Risk category:** Clinical correctness
**Phase:** Calculator phase (pure-logic sub-phase)
**Severity:** CRITICAL

**What goes wrong:**
Sheet1 mixes three totally different unit conversions:

| Component   | Formula                         | Unit meaning                                  |
| ----------- | ------------------------------- | --------------------------------------------- |
| Dextrose    | `(vol_ml × pct/100) × 3.4`      | ml × g/ml × kcal/g                            |
| IL (SMOF)   | `vol_ml × 2`                    | ml × 2 kcal/ml (SMOF 20% is 2 kcal/ml)        |
| Enteral     | `(vol_ml × kcal_per_oz) / 30`   | ml × kcal/oz ÷ 30 ml/oz = kcal                |

Swap `3.4` and `2`, or forget `/30`, and the number is plausibly close but wrong.

**Prevention strategy:**

1. **Named constants in a `constants.ts` sibling** with JSDoc citing the unit derivation:
   ```ts
   /** kcal per gram of dextrose (Atwater factor for carbohydrate from glucose monohydrate) */
   export const KCAL_PER_G_DEXTROSE = 3.4;
   /** kcal per ml of SMOF 20% lipid emulsion (per xlsx Sheet1 B7 formula) */
   export const KCAL_PER_ML_SMOF = 2;
   /** ml per fluid ounce — xlsx Sheet1 uses 30, not 29.5735 */
   export const ML_PER_OZ = 30;
   ```
2. **Three isolated pure functions** — `dextroseKcal()`, `lipidKcal()`, `enteralKcal()` — each independently unit-tested with a hand-calculated case in the comment above the test.
3. **One aggregate test** asserting `totalKcal === dextroseKcal + lipidKcal + enteralKcal` (no hidden coupling).
4. **Parity fixture** covers a row where removing any one component changes the total meaningfully (rules out the "sum accidentally matches because two terms are tiny" class of false-green).

---

### P4. CalculatorId union + NavShell branch — Wave 0 latent bug (v1.8 pattern)

**Risk category:** Build / latent routing bug
**Phase:** **WAVE 0 — before any calculator work**
**Severity:** HIGH (blocks compilation of downstream phases)

**What goes wrong:**
v1.8 GIR hit exactly this: `CalculatorId` type union was missing `'gir'`, and `NavShell.activeCalculatorId` had no `/gir` branch (fell through to Morphine), which would have poisoned AboutSheet content routing if not caught. v1.12 will repeat this pattern unless the type extension is a Wave-0 task.

**Prevention strategy:**

1. **Wave 0 grep checklist** (add to roadmap):
   ```
   grep -rn "CalculatorId" src/lib/shell/
   grep -rn "activeCalculatorId" src/
   grep -rn "'morphine' | 'formula' | 'gir'" src/
   grep -rn "identityClass" src/lib/shell/registry.ts
   grep -rn "about-content" src/lib/shared/
   ```
2. **Wave 0 task list** (all BEFORE calculator logic):
   - Extend `CalculatorId` union to include `'feed-advance'` (or chosen id).
   - Add `/feeds` branch to `NavShell.activeCalculatorId` derivation.
   - Add registry entry stub in `src/lib/shell/registry.ts` with `identityClass: 'identity-feeds'`.
   - Add placeholder route `src/routes/feeds/+page.svelte`.
   - Add AboutSheet stub entry in `src/lib/shared/about-content.ts`.
   - Compile + smoke: `pnpm check` green, nav shows 4 tabs, `/feeds` renders placeholder, about dialog shows stub entry.
3. **Verification gate:** Wave 0 is its own commit with `pnpm check` and `pnpm test` both green before any calculator logic lands.

---

### P5. 4th identity hue — axe-core failure repeat of v1.5 Phase 20

**Risk category:** Accessibility / rework churn
**Phase:** Calculator phase, **pre-PR** gate
**Severity:** HIGH

**What goes wrong:**
v1.5 Phase 20 Morphine re-used `--color-accent-light` for the identity hero and hit 3.61:1 against the eyebrow text — caught only by Phase 20's axe sweep, required OKLCH tuning (`oklch(95% 0.04 220)`). v1.8 GIR learned from this and pre-researched the hue (145 green), shipped green on first sweep. v1.12 must follow the GIR pattern, not the Morphine pattern.

**Prevention strategy:**

1. **Hue pre-research task in STACK.md / ARCHITECTURE.md** — pick a hue NOT already in use (avoid 220 Morphine blue, 195 Formula teal, 145 GIR green). Candidates: ~30 (warm amber — collides with BMF, REJECT), ~300 (magenta/purple), ~25 (terracotta). Pre-check target OKLCH values against text tokens.
2. **Axe sweep as a hard gate BEFORE PR**, not a PR-time discovery. Phase verification checklist:
   - `pnpm test:e2e:a11y` must return **20/20** (16 existing + 4 new feed-advance sweeps).
   - New sweeps: feeds-light, feeds-dark, feeds-light-selected, feeds-dark-selected.
3. **Contrast sanity math in the phase plan**, not just "trust axe" — hand-compute the `--color-identity-hero` lightness against `--color-text-primary` and `--color-text-secondary` before writing the token.
4. **Do not inline-tune.** If axe fails, file the finding as a sub-task ("hue retuning") and treat it as a failure of pre-research, not a routine PR revision.

---

## Moderate Pitfalls

---

### P6. Mode switching (Sheet1 ↔ Sheet2) — state preservation ambiguity

**Risk category:** UX / clinical trust
**Phase:** Requirements (decision), calculator phase (implementation)
**Severity:** MEDIUM

**What goes wrong:**
User enters TPN values in Sheet1 mode, toggles to Sheet2, enters bedside inputs, toggles back — is Sheet1 state still there? If wiped, users lose work and stop trusting the toggle. If preserved without visual cue, they don't realize old values are still there.

**Prevention:**

1. **Decision in REQUIREMENTS.md:** Preserve both modes' inputs independently in sessionStorage (`feedAdvanceState.sheet1` + `feedAdvanceState.sheet2`), mirroring Morphine's `morphineState` shape.
2. **No cross-mode field coupling.** Weight lives in both but is stored per-mode (clinicians may be computing for different patients). Document explicitly.
3. **Test:** Playwright E2E — enter Sheet1 inputs, toggle to Sheet2, enter Sheet2 inputs, toggle back, assert Sheet1 values intact.
4. **Stale-key migration:** Follow v1.11 pattern — `{ ...defaultState(), ...parsed }` spread silently drops unknown keys, no version bump needed.

---

### P7. Trophic /6 vs /8 × advance cadence coherence

**Risk category:** Clinical coherence / usability trap
**Phase:** Requirements + calculator phase
**Severity:** MEDIUM

**What goes wrong:**
User selects trophic q4h (÷6 = 6 feeds/day) but advance cadence "every 3rd feed" — that's fine, 2 advances/day. But if they could separately select trophic q3h (÷8) while the goal-phase feed frequency is q4h, the schedule is clinically incoherent.

**Prevention:**

1. **Decision in REQUIREMENTS.md:** *Single* feed-frequency dropdown at the top of the card ("Feed frequency: q3h / q4h"), which drives BOTH the trophic divisor (÷6 or ÷8) AND the IV backfill divisor (÷3 vs ÷4). The user cannot mix them. This also solves P8.
2. **Advance cadence is orthogonal** — "how often to step up" (once daily, twice daily, every feed, every other, every 3rd) is independent of feed frequency. That's fine.
3. **No clinical coherence-check advisories needed** if the dropdowns are structured correctly.

---

### P8. IV backfill `total_fluids − enteral/3` stale constant when frequency is q4h

**Risk category:** Clinical correctness
**Phase:** Calculator phase
**Severity:** MEDIUM → CRITICAL if shipped wrong

**What goes wrong:**
The xlsx IV backfill formula uses `/3` because it assumes q3h feeds. If the user picks q4h but the code still uses `/3`, IV rate is wrong by ~25%.

**Prevention:**

1. **Audit the xlsx cell formula** before writing a line of code. Document the derivation in a comment above the function. Do not "port from memory" — open the cell and read the reference chain.
2. **Parameterize on feed frequency**, not on the literal `3`. Pull from the same single feed-frequency dropdown as P7.
3. **Parity fixture** must include an IV backfill row for BOTH q3h and q4h feed frequency (one locked to xlsx, one hand-derived).
4. **Unit test** named `"IV backfill uses feed-frequency-aware divisor, not literal 3"` as a regression anchor.

---

### P9. Auto-advance divisor mismatch between Sheet1 (/2 hardcoded) and Sheet2 (dropdown)

**Risk category:** Internal consistency
**Phase:** Calculator phase
**Severity:** MEDIUM

**What goes wrong:**
Sheet1 hardcodes `/2` for its auto-advance calculation. Sheet2 exposes a dropdown. If the Sheet1 mode calculation silently uses `/2` while Sheet2 mode uses the dropdown, two modes return different numbers for the same user intent.

**Prevention:**

1. **Single source of truth in code:** one `calculateAdvance(advancePerDay, divisor)` function shared by both modes. Sheet1 mode passes the dropdown value; Sheet1 xlsx parity fixture locks it to `2` to match the spreadsheet.
2. **Document in AboutSheet + inline comment:** "Sheet1 xlsx hardcodes ÷2 (twice daily); in this app, both modes use the same dropdown, with ÷2 as the default."
3. **Parity test** for Sheet1 mode uses `divisor: 2` exactly, the default.
4. **Cross-mode test:** `"Sheet1 and Sheet2 modes produce identical advance numbers given identical inputs"`.

---

### P10. "Every 3rd feed" with q3h (8 feeds/day) → non-integer advances-per-day

**Risk category:** Clinical convention / UX
**Phase:** Requirements (decision), calculator phase
**Severity:** LOW-MEDIUM

**What goes wrong:**
q3h × every-3rd = 8/3 = 2.67 advances per day. Is that "round down to 2" (safer, slower wean up), "round up to 3" (faster), or "2.67 steps shown with fractional labeling"?

**Prevention:**

1. **Clinical decision in REQUIREMENTS.md** — recommend **floor** (round down, safer: fewer volume jumps per day).
2. **Document in AboutSheet** for feed-advance: "When feed frequency and advance cadence produce a non-integer number of advances per day, the schedule rounds down to stay clinically conservative."
3. **Unit test** — `"q3h feeds with every-3rd advance rounds 8/3 down to 2 advances/day"`.
4. **Alternative if clinical team objects:** surface an advisory "{combo} is unusual — verify intent" rather than rejecting.

---

### P11. NumericInput advisory-only contract violation

**Risk category:** Clinical safety regression
**Phase:** Calculator phase
**Severity:** MEDIUM

**What goes wrong:**
v1.6 locked `NumericInput` as advisory-only: `min`/`max` surface a blur-gated "Outside expected range — verify" message; they DO NOT clamp (see `NumericInput.svelte` lines 43–52). A well-meaning port author adds `Math.min/max` "just to be safe," silently corrupting user input.

**Prevention:**

1. **Inputs config in JSON only** — `feed-advance-config.json` with `inputs.weightKg.min/max`, mirroring `morphine-config.json` and `fortification-config.json`. No call-site magic numbers.
2. **No clamp anywhere.** Grep the phase diff for `Math.min`/`Math.max` near input handlers before merging.
3. **Scroll-wheel clamp is allowed** (explicit user gesture with immediate feedback; the v1.6 contract permits it — see `setupWheel` in NumericInput).
4. **Test:** `"weight above max shows advisory on blur, does not clamp value"`.

---

### P12. Playwright `inputmode="decimal"` regression

**Risk category:** Mobile UX regression
**Phase:** Calculator phase (Playwright sub-phase)
**Severity:** LOW (easy to prevent)

**What goes wrong:**
GIR v1.8 added a regression test asserting every numeric input exposes `inputmode="decimal"` so mobile gets the decimal keyboard. Feed Advance has 5+ numeric inputs; if any use `<input type="text">` or a custom widget, mobile keyboard regresses for that field and users don't notice until bedside.

**Prevention:**

1. **Mandatory use of shared `NumericInput.svelte`** for every numeric field (already sets `inputmode="decimal"` — line 135).
2. **Playwright regression test** extending the GIR `inputmode` assertion:
   ```ts
   for (const selector of feedAdvanceNumericSelectors) {
     await expect(page.locator(selector)).toHaveAttribute('inputmode', 'decimal');
   }
   ```
3. **Grep gate** in phase verification: `grep -rn 'type="text"' src/lib/feed-advance/` must return zero results.

---

## Minor Pitfalls

---

### P13. AboutSheet drift — copy written late, fixup commit required

**Risk category:** Release hygiene
**Phase:** Calculator phase (NOT a polish phase)
**Severity:** LOW

**What goes wrong:**
Every prior calculator (v1.3 Formula, v1.8 GIR, v1.11 Morphine rewrite) required an AboutSheet copy fixup commit because it was written last. Small but embarrassing.

**Prevention:**

1. **AboutSheet entry is a Wave 0 task (stub) and a Calculator Phase exit criterion (final copy).**
2. **Required content** (per v1.8 GIR pattern): description, source citation (`nutrition-calculator.xlsx` Sheet1 + Sheet2), institutional-protocol disclaimer, note on user-selectable divisors that differ from the raw xlsx.
3. **Phase verification checklist item:** "AboutSheet entry renders in both `/feeds` and global about dialog, cites xlsx, notes divisor parameterization."

---

### P14. Parity epsilon — clinical insignificance floor

**Risk category:** Test flakiness vs. over-strictness
**Phase:** Calculator phase (test sub-phase)
**Severity:** LOW

**What goes wrong:**
GIR used 1% relative tolerance + 0.15 ml/hr absolute floor because truncated spreadsheet constants cascade into delta math. Feed Advance has similar risk: `/30`, `/3`, `×3.4` are all susceptible to xlsx-side rounding. Strict `toBeCloseTo(n, 4)` will produce fragile tests.

**Prevention:**

1. **Reuse the `closeEnough()` pattern** from `gir/calculations.test.ts` (EPSILON 0.01, ABS_FLOOR tuned to the unit — e.g., 0.5 kcal for kcal totals, 0.5 ml for per-feed volumes).
2. **Document tolerance choice** in a comment: "0.5 kcal abs floor reflects xlsx cell display truncation of `3.4` kcal/g; clinically negligible."
3. **Do NOT widen epsilon beyond clinical insignificance.** 1% on a kcal/kg/day number is the ceiling.

---

## Phase-Specific Warnings

| Phase / Wave                          | Pitfalls addressed                          | Mitigation                                                                  |
| ------------------------------------- | ------------------------------------------- | --------------------------------------------------------------------------- |
| **Wave 0 (pre-feature)**              | P4, P5 (hue pre-research), P13 (AboutSheet stub) | Grep checklist, hue pre-research, stub entries, compile gate                |
| **Calculator pure-logic sub-phase**   | P1, P2, P3, P8, P9, P14                     | Locked + matrix fixture file, named constants, audit xlsx cells directly    |
| **Calculator UI sub-phase**           | P2 (dual dextrose UI), P6, P7, P10, P11, P12 | Dual dextrose inputs, single feed-frequency dropdown, shared NumericInput   |
| **Polish / pre-PR gate**              | P5 (axe sweep), P13 (AboutSheet final copy) | 20/20 axe mandatory, AboutSheet rendered in both contexts                    |
| **Release**                           | version bump, PROJECT.md update (standard)  | Follow v1.11 release checklist                                               |

---

## Prioritized Pitfall List (for requirements author)

1. **P1** spreadsheet parity fixture discipline — CRITICAL
2. **P2** Sheet1 dual dextrose — CRITICAL
3. **P3** Sheet1 unit confusion — CRITICAL
4. **P4** Wave 0 `CalculatorId` / NavShell extension — HIGH (build blocker)
5. **P5** 4th identity hue axe pre-gate — HIGH
6. **P8** IV backfill stale `/3` — MEDIUM (CRITICAL if shipped wrong)
7. **P9** Sheet1 ↔ Sheet2 divisor consistency — MEDIUM
8. **P7** trophic × goal frequency coherence (single-dropdown fix) — MEDIUM
9. **P6** mode state preservation policy — MEDIUM
10. **P11** NumericInput advisory contract — MEDIUM
11. **P10** non-integer advances-per-day — LOW-MEDIUM
12. **P12** Playwright `inputmode="decimal"` — LOW
13. **P14** parity epsilon tuning — LOW
14. **P13** AboutSheet drift — LOW

---

## Sources

- `src/lib/gir/calculations.test.ts` — `closeEnough()` epsilon pattern (1% relative + absolute floor)
- `src/lib/morphine/calculations.test.ts` — xlsx Sheet1 row-by-row parity pattern (v1.11)
- `src/lib/shared/components/NumericInput.svelte` — advisory-only contract (v1.6, lines 43–52, 96–120, 135)
- `.planning/PROJECT.md` — v1.5 Phase 20 axe pain; v1.8 Phase 28 Wave 0 latent bugs; v1.11 xlsx-as-sole-source-of-truth
- `.planning/MILESTONES.md` v1.8 — "Two latent bugs caught before ship — Phase 28 Wave 0 fixed `CalculatorId` union (missing `'gir'`) and `NavShell.activeCalculatorId` `/gir` branch"
- `.planning/MILESTONES.md` v1.5 — "Real WCAG failure caught and fixed by Phase 20's axe sweep: Phase 19's Morphine schedule eyebrow was 3.61:1"
- `nutrition-calculator.xlsx` Sheet1 (TPN + full nutrition) + Sheet2 (bedside advance) — sole clinical authority
