---
workstream: pert
milestone: v1.15
created: 2026-04-25
granularity: coarse
---

# Roadmap — Workstream `pert` / Milestone v1.15

**Pediatric EPI PERT Calculator** — sixth clinical calculator added to the NICU Assistant PWA, sourced from `epi-pert-calculator.xlsx` Pediatric tabs (`Pediatric Oral PERT Tool`, `Pediatric Tube Feed PERT`).

## Milestone Goal

Add a sixth calculator (`/pert`) with two modes (Pediatric Oral / Pediatric Tube-Feed) parity-tested within ~1% epsilon against `epi-pert-calculator.xlsx` Pediatric tabs, integrated into the registry, navigation, AboutSheet, and PWA shell with zero regressions to the five shipped calculators (Morphine, Formula, GIR, Feeds, UAC/UVC) or the v1.13 favorites store / hamburger menu.

## Phases

- [ ] **Phase 1: Architecture, Identity Hue & Clinical Data** — Foundations: registry entry, `/pert` route shell, `.identity-pert` OKLCH tokens, `pert-config.json`, AboutSheet entry, NavShell ternary extension. Wave 0 latent-bug prep so downstream phases compile cleanly.
- [ ] **Phase 2: Calculator Core (Both Modes + Safety)** — Oral mode, Tube-Feed mode, SegmentedToggle mode switching, shared inputs across modes, max-lipase safety advisory, range advisories, empty-state messaging.
- [ ] **Phase 3: Tests** — Spreadsheet-parity vitest (Oral + Tube-Feed fixture matrices), config shape tests, component tests, Playwright E2E mobile + desktop, 2 axe sweeps (light + dark) added to extended axe suite.
- [x] **Phase 3.1: KI-1 Resolution — SelectPicker Click-Revert Bug Fix** (INSERTED 2026-04-25; **COMPLETE 2026-04-26**) — Fix the bidirectional `bind:value` race in `<PertInputs />` SelectPicker bridges so clicks persist instead of silently reverting. Closes the 4 picker-driven happy-path e2e tests deferred from Phase 3. PERT-TEST-05 PARTIAL → FULL.
- [x] **Phase 4: Design Polish (`/impeccable` Critique Sweep)** (**COMPLETE 2026-04-26**) -- Light + dark x mobile + desktop critique pass, P1 fixes pre-merge, DESIGN.md / DESIGN.json contract enforcement, >= 35/40 score target. Wave 3 closure: aggregate 36.25/40 (Wave 1 baseline 35.6/40, delta +0.65); 8/8 contexts at >= 35/40; zero unhandled P1; 1 P2 fix-now shipped (F-03); AUDIT.sh exit 0; 18-gate verification all PASS; PERT-DESIGN-01..06 Validated.
- [ ] **Phase 5: Release** — Version bump, AboutSheet version reflect, full clinical gate, PROJECT.md / ROADMAP / main-PROJECT integration, workstream-completion artifacts.

## Phase Details

### Phase 1: Architecture, Identity Hue & Clinical Data
**Goal**: A `/pert` route shell exists, registers a sixth calculator with a hand-tuned identity hue and embedded clinical config, and downstream phases can compile against `CalculatorId = 'pert'` without modifying any existing calculator.
**Depends on**: Nothing (first phase)
**Requirements**: PERT-ARCH-01, PERT-ARCH-02, PERT-ARCH-03, PERT-ARCH-04, PERT-ARCH-05, PERT-ARCH-06, PERT-ARCH-07, PERT-HUE-01, PERT-HUE-02, PERT-HUE-03, PERT-DATA-01, PERT-DATA-02, PERT-DATA-03, PERT-DATA-04
**Success Criteria** (what must be TRUE):
  1. A clinician can navigate to `/pert`, see a registered sixth calculator entry in the hamburger menu, and favorite it (bringing it into the bottom-nav 4-cap), with first-run defaults `['morphine-wean', 'formula', 'gir', 'feeds']` unchanged.
  2. The `/pert` route renders with a distinct identity color (different at-a-glance from Morphine 220 blue, Formula ~60 amber, GIR 145 green, Feeds ~30 terracotta, and UAC/UVC) on result hero, focus rings, eyebrows, and active nav indicator in both light and dark themes.
  3. AboutSheet shows a `pert` entry citing `epi-pert-calculator.xlsx` Pediatric tabs and DailyMed, with the institutional-protocol disclaimer matching the GIR/UAC pattern.
  4. `pnpm svelte-check` reports 0 errors / 0 warnings; `CalculatorId = 'pert'` resolves cleanly across NavShell, registry, AboutSheet, and favorites consumers.
  5. A pre-PR axe-core sweep confirms `.identity-pert` clears 4.5:1 on all four identity surfaces in both themes on first run (no post-merge OKLCH retuning, per v1.8 decision).
**Plans**: TBD
**UI hint**: yes

### Phase 2: Calculator Core (Both Modes + Safety)
**Goal**: A clinician at the bedside can compute capsules-per-dose for a pediatric oral meal and capsules-per-day for a pediatric tube-feed using the same `/pert` calculator, switch between modes without losing weight/medication/strength selections, and receive a STOP-style advisory when the dose would exceed the 10,000 units/kg/day cap.
**Depends on**: Phase 1
**Requirements**: PERT-ORAL-01, PERT-ORAL-02, PERT-ORAL-03, PERT-ORAL-04, PERT-ORAL-05, PERT-ORAL-06, PERT-ORAL-07, PERT-ORAL-08, PERT-TUBE-01, PERT-TUBE-02, PERT-TUBE-03, PERT-TUBE-04, PERT-TUBE-05, PERT-TUBE-06, PERT-TUBE-07, PERT-MODE-01, PERT-MODE-02, PERT-MODE-03, PERT-MODE-04, PERT-SAFE-01, PERT-SAFE-02, PERT-SAFE-03, PERT-SAFE-04
**Success Criteria** (what must be TRUE):
  1. In Oral mode, entering weight + fat-grams + lipase-units/kg + medication + strength produces a capsules-per-dose hero output matching xlsx `B11` within 1%, with secondary outputs for total lipase needed, lipase per dose, and an "Estimated daily total (3 meals/day)" tertiary line clearly flagged as an estimate.
  2. In Tube-Feed mode, entering weight + pediatric formula (one of 17) + volume/day + lipase-units/kg/day + medication + strength produces a capsules-per-day hero output matching xlsx `B13` within 1%, plus secondary outputs for total fat (g), total lipase needed, lipase per kg, and capsules/month (matching `B14`).
  3. Switching modes via the SegmentedToggle (Oral / Tube-Feed) preserves weight, medication, and strength across modes; mode-specific inputs (fat g, formula, volume, lipase/kg) persist independently per mode in sessionStorage; mode itself persists across reload (`nicu:pert:mode` schema `{v:1, mode}`); `←/→/Home/End` keyboard nav works on the toggle.
  4. When computed daily lipase (oral × 3 meals OR tube-feed total) exceeds `weight × 10000`, a STOP-style red advisory surfaces ("Exceeds 10,000 units/kg/day cap — verify with prescriber") matching the v1.13 STOP-red carve-out semantics; weight, fat, and volume out-of-range trigger blur-gated "Outside expected range — verify" messages without auto-clamp.
  5. With required inputs missing, the hero shows neutral empty-state copy ("Enter weight and fat grams" or the tube-feed equivalent) consistent with the v1.13 empty-state copy unification.
**Plans**: TBD
**UI hint**: yes

### Phase 3: Tests
**Goal**: The `/pert` calculator has spreadsheet-parity, component, E2E, and a11y test coverage at the same depth as the v1.8 GIR / v1.12 Feeds / v1.13 UAC/UVC milestones, and the extended axe suite grows from 33/33 to 35/35 sweeps green.
**Depends on**: Phase 2
**Requirements**: PERT-TEST-01, PERT-TEST-02, PERT-TEST-03, PERT-TEST-04, PERT-TEST-05, PERT-TEST-06
**Success Criteria** (what must be TRUE):
  1. `pnpm test` runs spreadsheet-parity vitest within 1% epsilon for Oral mode (≥3 weight × 3 fat fixtures including the xlsx default of weight 22 lbs ≈ 9.98 kg, fat 25 g, lipase 1000/kg, Creon 12000 → expected `B11`) and Tube-Feed mode (≥3 weight × 3 formula × 2 volume fixtures including the xlsx default of weight 15 lbs ≈ 6.80 kg, Kate Farms Pediatric Standard 1.2 at 40 g/L, volume 1000 mL → expected `B13` and `B14`), all green.
  2. Component tests for `PertCalculator.svelte` cover empty / valid Oral flow / valid Tube-Feed flow / mode-switch / SegmentedToggle keyboard nav / formula picker search / advisory rendering / max-lipase advisory firing, plus config shape tests proving every medication has `brand` + `strengths[]` and every formula has `name` + `fatGPerL` with no out-of-FDA-set strength values surviving the load filter.
  3. Playwright E2E happy-path passes at mobile 375 + desktop 1280 in both modes, with `inputmode="decimal"` regression guard, favorites round-trip (favorite from hamburger → reload → persists), and sessionStorage round-trip.
  4. Two new axe sweeps for `/pert` (light + dark) join the existing extended axe suite, taking it from 33/33 to 35/35 green on first run with no `disableRules` escape hatches (research-before-PR contract).
**Plans**: TBD

### Phase 3.1: KI-1 Resolution — SelectPicker Click-Revert Bug Fix (INSERTED 2026-04-25)
**Goal**: A clinician can click any option in any of the three `<PertInputs />` SelectPickers (medication / strength / formula) and the selection persists — the picker no longer silently reverts to its placeholder. After this phase, the 4 picker-driven happy-path e2e tests deferred from Phase 3 (PERT-TEST-05 partial closure per KI-1) ship green, closing PERT-TEST-05 fully before v1.15 release.
**Depends on**: Phase 3 (PARTIAL)
**Requirements**: closes the PERT-TEST-05 partial gap from Phase 3 + restores PertInputs.svelte clinical UX. No new PERT-* requirement IDs (KI-1 is a Phase-2-origin defect surfaced + deferred during Phase 3).
**Success Criteria** (what must be TRUE):
  1. A clinician at `/pert` clicks "Creon" in the medication SelectPicker → `pertState.current.medicationId === 'creon'` AND the picker trigger displays "Creon" (not the "Select medication" placeholder). Same for strength + formula pickers.
  2. The D-11 contract from Phase 2 still holds: changing `medicationId` (whether via picker click OR external mutation) clears `strengthValue` to `null` and clears the strength picker UI to "Choose medication first" / "Select strength" placeholder.
  3. External mutations to `pertState.current.medicationId` / `strengthValue` / `tubeFeed.formulaId` (from `pertState.reset()`, from localStorage rehydration on load, from D-11 cascade) propagate into the SelectPicker UI on the next microtask flush. No write-effect-clobbers-external-write race.
  4. Phase 3 Wave 1 + Wave 2 tests (`PertCalculator.test.ts` 10 cases, `PertInputs.test.ts` 7 cases including D-11 reset, `calculations.test.ts` 45 cases including parity matrix) all stay green.
  5. The 2 picker-driven happy-path e2e tests deferred from Plan 03-04 (Oral mode + Tube-Feed mode happy paths × 2 viewports = 4 tests) get unskipped and pass cleanly under `CI=1 pnpm exec playwright test pert.spec` — taking the count from 8/8 to 12/12.
**Plans**: 4 plans
  - [x] 03.1-01-PLAN.md — Replace SelectPicker string-bridge proxies in PertInputs.svelte with Svelte 5 function bindings (KI-1 root-cause fix) — **COMPLETE 2026-04-25 (commit `f2da16d`)**: PertInputs.svelte 248 -> 221 LOC, svelte-check 0/0, vitest 423/423, D-11 reset test green without modification per D-03
  - [x] 03.1-02-PLAN.md — Add D-01 click-persist + D-04 external-mutation regression-guard component tests to PertInputs.test.ts — **COMPLETE 2026-04-25 (commit `dfb6a62`)**: PertInputs.test.ts 96 -> 153 LOC (+57 additive), 7 -> 9 it() cases, full vitest 425/425 (was 423; +2 new), svelte-check 0/0, existing 7 cases byte-identical per D-03 (verified zero removed lines)
  - [x] 03.1-03-PLAN.md — Author 2 picker-driven happy-path e2e tests in pert.spec.ts (Oral + Tube-Feed); delete deferred prose comment block — **COMPLETE 2026-04-26 (commit `0d9636f`)**: e2e/pert.spec.ts 197 -> 259 LOC (+62 net), CI=1 pert.spec 12/12 (was 8/8; +4 new picker-driven runner cases = 2 new unique tests × 2 viewports), CI=1 pert-a11y 4/4 (unchanged), svelte-check 0/0, em-dash + en-dash count: 0 / 0 (D-08 closed as side effect of prose-block deletion per D-05 reframing). PERT-TEST-05 now ready for FULL closure record at Plan 03.1-04 clinical gate.
  - [x] 03.1-04-PLAN.md — Clinical gate (verification only): 7-gate sequence + PERT-TEST-05 FULL closure record — **COMPLETE 2026-04-26 (commit pending)**: All 7 gates green (svelte-check 0/0; vitest 425/425; pnpm build OK at PWA 49 entries / 576.03 KiB; CI=1 pert-a11y 4/4; CI=1 pert.spec **12/12**; CI=1 full Playwright 117/118 with the same 1 baseline flake on disclaimer-banner.spec.ts:28 as Phase 1+2+3; negative-space audit clean — exactly 3 files modified across the entire phase). PERT-TEST-05 transitioned PARTIAL → FULL. Phase 3.1 closed.
**Resolution recommendation** (per KI-1 known-issue analysis): Option 2 — `$derived`-backed binding wrapper for SelectPicker `bind:value` in PertInputs.svelte. Eliminates the bidirectional `$effect` race at the source; smallest blast radius; no shared-component change. Alternative: Option 1 (add `onValueChange` callback prop to SelectPicker — touches a shared component used by feeds/gir/uac-uvc, larger scope).
**Origin**: Bug originated Phase 2 plan 02-03 (`3171b06`); discovered Phase 3 plan 03-04 e2e execution (2026-04-25); two failed hotfix attempts during Phase 3 confirmed the fix requires architectural change rather than effect-order tweak. Full root-cause + 3 candidate paths documented at `.planning/workstreams/pert/phases/02-calculator-core-both-modes-safety/known-issues.md` (KI-1).

### Phase 4: Design Polish (`/impeccable` Critique Sweep)
**Goal**: The `/pert` UI passes a critique sweep at the v1.13 Phase 42.2 bar (≥35/40), the design-contract rules from DESIGN.md / DESIGN.json hold across both modes, and no P1 finding ships to release.
**Depends on**: Phase 3.1 (was Phase 3 pre-2026-04-25 KI-1 insertion)
**Requirements**: PERT-DESIGN-01, PERT-DESIGN-02, PERT-DESIGN-03, PERT-DESIGN-04, PERT-DESIGN-05, PERT-DESIGN-06
**Success Criteria** (what must be TRUE):
  1. A clinician viewing `/pert` in light + dark themes at mobile 375 + desktop 1280 sees the `<HeroResult>` shared component owning the above-the-fold viewport on mount in both Oral and Tube-Feed modes, with the sticky `<InputDrawer>` collapsibility consistent with v1.13 cross-route adoption.
  2. The DESIGN.md / DESIGN.json contract is enforced — Identity-Inside Rule (`.identity-pert` only on inside-the-route surfaces, not chrome), Amber-as-Semantic, OKLCH-Only, Red-Means-Wrong (with the v1.13 STOP-red carve-out for the max-lipase cap, PERT-SAFE-01), Tabular-Numbers on every numerical output, Eyebrow-Above-Numeral hero pattern, 11px font-size floor — verified by visual inspection in both themes.
  3. The SegmentedToggle (Oral / Tube-Feed) reads as part of the existing identity-hue idiom (consistent with v1.6 SegmentedToggle treatment) — does not introduce a new visual primitive.
  4. The `/impeccable` critique sweep records ≥35/40, with all P1 findings fixed before merge and addressable P2/P3 fixed inline (or deferred with explicit triage notes per v1.9 POLISH-04 precedent).
**Plans**: 4 plans (3 shipped at Phase 4 closure 2026-04-26; 1 gap-closure plan shipped 2026-04-26 closing the F-03 hierarchy gap surfaced in human UAT post-Phase-4-closure)
  - [x] 04-01-PLAN.md -- Wave 1 critique sweep + FINDINGS triage (PRODUCT.md authoring, 8 /impeccable critique transcripts, auto-disposition per CONTEXT D-03, Wave-2 plan-count recommendation) -- **COMPLETE 2026-04-26 (commits `eec18c2`, `e1e60cb`, `72be821`, `187bb4c`)**: aggregate 35.6/40 (8/8 at >= 35/40); 0 P1; 3 P2 (1 fix-now F-03; 2 D-08b forced-defer F-01 + F-02); 2 P3 deferred.
  - [x] 04-02-PLAN.md -- Wave 2 F-03 fix (Tube-Feed Capsules-per-month visual hierarchy bump per UI-SPEC Watch Item 5; single-token `font-bold` -> `font-extrabold` on PertCalculator.svelte numeral) -- **COMPLETE 2026-04-26 (commits `29306e7`, `136b624`, `e6f454a`)**: 1 token swap; PERT-route only; +1 LOC; PERT-route allowlist honored; D-08b forced-defer for F-01 + F-02 carried forward as cross-calculator backlog.
  - [x] 04-03-PLAN.md -- Wave 3 clinical gate + 18-gate verification (re-run 8 /impeccable critique passes on post-fix UI; 7 inherited clinical gates from Phase 3.1 plan 04 + 11 design-polish gates per UI-SPEC; 04-VERIFICATION.md + Phase 4 closure with PERT-DESIGN-01..06 Validated) -- **COMPLETE 2026-04-26 (commits `95e31b0`, `3001c2a`, `33695e1`, `a6d9469`)**: aggregate 36.25/40 (delta +0.65 vs Wave 1); 8/8 at >= 35/40; AUDIT.sh exit 0; all 18 gates PASS; PERT-DESIGN-01..06 flipped Active -> Validated.
  - [x] 04-04-PLAN.md -- Wave 4 gap closure (F-03 escalation to Approach C: eyebrow `tracking-wide` -> `tracking-wider` bump on Capsules per month row at PertCalculator.svelte line 288; combines with Wave 2 numeral `font-extrabold` for both-vectors typographic delta; PERT-route only; ~1 LOC; D-08 allowlist honored; F-03 numeral from commit `29306e7` byte-identical; includes `checkpoint:human-verify` gate as corrective process insertion replacing the LLM-Design-Review fallback verdict from Phase 4 closure with human-eye review; escalation ladder (Approach D = numeral text-title -> text-[28px] / text-display; Approach E = visual isolation) preserved as forward-context for any future regression) -- **COMPLETE 2026-04-26 (commits `d82aa30` Task 1 source edit + `78686f9` Task 4 SUMMARY)**: 1 token swap on eyebrow; PERT-route allowlist honored (only PertCalculator.svelte modified); all 9 plan-level gates green (svelte-check 0/0; vitest src/lib/pert/ 81/81; em + en-dash 0/0; tabular-numerals 9; F-03 numeral preserved; Approach C bump landed; function-binding bridges 3+; pert-config.json byte-identical; negative-space audit clean); human-eye visual UAT verdict `approved` (verbatim, single-token); F-03 hierarchy gap row in 04-UAT.md test #1 resolved by human verdict; PERT-DESIGN-02..05 stay Validated (gap row resolution flows through `/gsd-verify-work 4 --ws pert`); REQUIREMENTS.md NOT touched.
  - [ ] 04-05-PLAN.md -- Wave 5 gap closure (D-12 Oral hierarchy promotion + D-13 Prescribing-Artifact-Leads Rule cross-mode codification: 3-token swap on `Estimated daily total (3 meals/day)` row at PertCalculator.svelte:213-227 to mirror Tube-Feed Wave 4 treatment; tracking-wide -> tracking-wider on eyebrow; text-base -> text-title + font-medium -> font-extrabold on numeral; PERT-route only; ~3 LOC; D-08 allowlist honored; Wave 4 Tube-Feed treatment byte-identical; includes `checkpoint:human-verify` gate enforcing D-13 audit-both-modes principle; closes UAT test #4).
**UI hint**: yes

### Phase 5: Release
**Goal**: Workstream `pert` v1.15 ships with a clean clinical gate, the AboutSheet reflects the new version automatically, and validated requirements + decisions fold back into the main project's `.planning/PROJECT.md` so `pert` can be archived.
**Depends on**: Phase 4
**Requirements**: PERT-REL-01, PERT-REL-02, PERT-REL-03, PERT-REL-04, PERT-REL-05
**Success Criteria** (what must be TRUE):
  1. `package.json` is bumped to the agreed target version (v1.14.0 if `pert` ships before main `v1.14`, else v1.15.0), and the AboutSheet displays that version automatically via the `__APP_VERSION__` Vite-define constant — no hardcoded version strings in `about-content.ts`.
  2. The full clinical gate runs green pre-bump: `pnpm svelte-check` 0/0, `pnpm test` all green, `pnpm build` ✓, Playwright E2E + extended axe suite (35/35) green in both themes.
  3. Workstream `pert` PROJECT.md Validated list is updated with all v1.15 entries; the workstream-local ROADMAP.md Progress rows are flipped to Complete; orphan planning artifacts are cleaned.
  4. The main project `.planning/PROJECT.md` Validated list absorbs the v1.15 entries at workstream completion, ready for `/gsd-workstreams complete pert` to archive the workstream.
**Plans**: TBD

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Architecture, Identity Hue & Clinical Data | 0/0 | Not started | - |
| 2. Calculator Core (Both Modes + Safety) | 0/0 | Not started | - |
| 3. Tests | 0/0 | Not started | - |
| 3.1. KI-1 Resolution (SelectPicker bridge) | 4/4 | Complete | 2026-04-26 (Wave 3 — plan 04 clinical gate; PERT-TEST-05 FULL) |
| 4. Design Polish (`/impeccable` Critique Sweep) | 4/4 | Complete | 2026-04-26 (Wave 3 plan 04-03 -- aggregate 36.25/40; 8/8 at >= 35/40; PERT-DESIGN-01..06 Validated. Wave 4 plan 04-04 -- F-03 Approach C escalation; human-UAT verdict `approved`; gap row resolved.) |
| 5. Release | 0/0 | Not started | - |

## Coverage Summary

**Total v1.15 requirements:** 54
**Mapped:** 54 / 54 ✓
**Orphans:** 0
**Duplicates:** 0

| Category | Count | Phase |
|----------|-------|-------|
| PERT-ARCH-01..07 | 7 | Phase 1 |
| PERT-HUE-01..03 | 3 | Phase 1 |
| PERT-DATA-01..04 | 4 | Phase 1 |
| PERT-ORAL-01..08 | 8 | Phase 2 |
| PERT-TUBE-01..07 | 7 | Phase 2 |
| PERT-MODE-01..04 | 4 | Phase 2 |
| PERT-SAFE-01..04 | 4 | Phase 2 |
| PERT-TEST-01..06 | 6 | Phase 3 |
| PERT-DESIGN-01..06 | 6 | Phase 4 |
| PERT-REL-01..05 | 5 | Phase 5 |

## Notes

- **Phase numbering is workstream-local.** This roadmap starts at Phase 1 despite the main workstream having shipped phases through 43. Workstream phase directories will be `01-*`, `02-*`, `03-*`, `04-*`, `05-*` under `.planning/workstreams/pert/phases/`.
- **Past-pattern analogs:**
  - Phase 1 mirrors v1.8 GIR Phase 26 (architecture + Wave 0) + Phase 36 Feed Advance setup pattern, plus v1.13 UAC Phase 42 identity-hue research-before-PR contract.
  - Phase 2 mirrors v1.12 Feed Advance Phase 37 (two-mode calculator with SegmentedToggle and shared state) plus v1.8 GIR safety advisory plumbing.
  - Phase 3 mirrors the test gate pattern from v1.8 / v1.12 / v1.13 — separate phase covering parity, component, E2E, and axe sweeps.
  - Phase 4 mirrors v1.13 Phases 42.1 / 42.2 design polish + critique sweep with explicit ≥35/40 score target.
  - Phase 5 mirrors v1.13 Phase 43 release pattern with workstream-completion fold-back into main PROJECT.md.
- Plan numbering inside each phase will follow `01-*`, `02-*`, etc. and is decided at `/gsd-plan-phase` time.

---
*Last updated: 2026-04-26 -- Phase 4 COMPLETE (Wave 3 clinical gate + score validation, plan 04-03; Wave 4 gap closure for F-03 hierarchy issue surfaced in human UAT, plan 04-04). All 4 Phase-4 plans shipped (`eec18c2..72be821` Wave 1; `29306e7`, `136b624` Wave 2 + out-of-band `2dc7ae2`, `5cd3386`; `95e31b0`, `3001c2a`, `33695e1`, `a6d9469` Wave 3; `d82aa30`, `78686f9` Wave 4). Wave 3: aggregate 36.25/40; 8/8 at >= 35/40; AUDIT.sh exit 0; 18-gate verification all PASS; PERT-DESIGN-01..06 Active -> Validated. Wave 4: F-03 Approach C eyebrow `tracking-wide` -> `tracking-wider` shipped (combined with Wave 2 numeral `font-extrabold` = full COMBINED RECIPE per 04-02-PLAN.md `<interfaces>`); 9/9 plan-level gates green; human-eye visual UAT verdict `approved`; F-03 gap row in 04-UAT.md test #1 resolved by human verdict; PERT-DESIGN-02..05 stay Validated (resolution flows through `/gsd-verify-work 4 --ws pert`). Next phase: Phase 5 (Release).*
