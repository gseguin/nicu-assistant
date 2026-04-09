# NICU Assistant — Requirements

## Milestone v1.9 — GIR Titration Hero Swap + Polish

**Goal:** Act on first clinical field feedback by making the actionable Δ rate the hero on every GIR titration bucket, and take a polish + tech-debt pass across the app.

**Context:** First real clinician feedback on v1.8 GIR — bedside priority is the *action* ("increase drip by 0.9 ml/hr"), not the recalculated GIR value. No new calculators this milestone.

---

### GIR Hero Swap (client field feedback)

- [ ] **GIR-SWAP-01**: On every GIR titration bucket card (all 6 buckets + the "current state" card), Δ rate (▲/▼ X.X ml/hr with "increase"/"decrease" label) is rendered as the hero — same typographic weight/size GIR `mg/kg/min` had in v1.8.
- [ ] **GIR-SWAP-02**: GIR `mg/kg/min` moves into the secondary metrics row, taking the rightmost slot Δ rate vacated (row order: Fluids | Rate | GIR).
- [ ] **GIR-SWAP-03**: The "current state" top card (Δ rate = 0) shows a neutral/placeholder treatment instead of ▲/▼ arrows — no misleading "increase" on a zero-change bucket.
- [ ] **GIR-SWAP-04**: Identity color, focus rings, roving tabindex, `role="radiogroup"` semantics, `aria-live` announcements, and `prefers-reduced-motion` behavior from v1.8 are preserved unchanged.
- [ ] **GIR-SWAP-05**: Component tests updated — GlucoseTitrationGrid tests assert Δ rate is in the hero slot and GIR mg/kg/min is in the secondary row; keyboard matrix + radiogroup tests still pass.
- [ ] **GIR-SWAP-06**: Playwright E2E updated — GIR happy-path at mobile 375 + desktop 1280 asserts the new hero layout.
- [ ] **GIR-SWAP-07**: All 16 axe sweeps (morphine 6 + fortification 4 + gir 6) stay green in light + dark; new layout audited before PR (per v1.8 "axe before PR" decision).

### Impeccable Polish Pass

- [ ] **POLISH-01**: Run `impeccable:critique` across all three calculators (Morphine, Formula, GIR) in both themes at mobile 375 + desktop 1280; capture findings with severity ratings.
- [ ] **POLISH-02**: Fix all P1 findings from critique (anything that undermines clinical trust, legibility, or hierarchy).
- [ ] **POLISH-03**: Fix all P2 findings that can be addressed without architectural change (spacing, typography, alignment, token consistency).
- [ ] **POLISH-04**: Any token adjustments preserve WCAG 2.1 AA contrast — verified with axe-core, no regressions.

### Tech Debt Sweep

- [ ] **DEBT-01**: Dependency audit and update — SvelteKit, Svelte, Vite, Tailwind, Vitest, Playwright, `@lucide/svelte`, bits-ui; update within current majors; run full test suite after each group.
- [ ] **DEBT-02**: Dead code sweep — remove unused exports, unreferenced files, commented-out blocks deferred from v1.5–v1.8.
- [ ] **DEBT-03**: Lint + TypeScript strict cleanup — zero warnings from `svelte-check` and ESLint across `src/`.
- [ ] **DEBT-04**: Deferred cleanups from prior milestones addressed or explicitly re-deferred with rationale in PROJECT.md Key Decisions.

### Release

- [ ] **REL-01**: `package.json` version bumped to 1.9.0.
- [ ] **REL-02**: AboutSheet reflects v1.9 (version + any copy updates from polish pass).
- [ ] **REL-03**: PROJECT.md Validated list updated with v1.9 entries at milestone completion.

---

## Future Requirements (deferred)

- New calculators (TPN, bilirubin, fluid balance) — future milestone
- PDF export / print layouts — future milestone
- Shareable calculation links — future milestone
- Localization (i18n) — future milestone

## Out of Scope (v1.9)

- Architectural changes to GIR titration grid semantics — v1.8 chose `role="radiogroup"`, stays
- New identity hues or OKLCH token additions
- Native app builds, accounts, backend, analytics (per PROJECT.md)
- Major version dependency upgrades (e.g., SvelteKit 3, Svelte 6, Vite 9) — stay within current majors

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| GIR-SWAP-01 | Phase 29 | Pending |
| GIR-SWAP-02 | Phase 29 | Pending |
| GIR-SWAP-03 | Phase 29 | Pending |
| GIR-SWAP-04 | Phase 29 | Pending |
| GIR-SWAP-05 | Phase 29 | Pending |
| GIR-SWAP-06 | Phase 29 | Pending |
| GIR-SWAP-07 | Phase 29 | Pending |
| POLISH-01 | Phase 30 | Pending |
| POLISH-02 | Phase 30 | Pending |
| POLISH-03 | Phase 30 | Pending |
| POLISH-04 | Phase 30 | Pending |
| DEBT-01 | Phase 30 | Pending |
| DEBT-02 | Phase 30 | Pending |
| DEBT-03 | Phase 30 | Pending |
| DEBT-04 | Phase 30 | Pending |
| REL-01 | Phase 31 | Pending |
| REL-02 | Phase 31 | Pending |
| REL-03 | Phase 31 | Pending |

**Coverage:** 17/17 v1.9 requirements mapped. No orphans.

---
*Last updated: 2026-04-09 — v1.9 traceability populated by roadmapper*
