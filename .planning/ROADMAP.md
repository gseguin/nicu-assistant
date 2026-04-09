# Roadmap: NICU Assistant

## Milestones

- v1.0 MVP - Phases 1-4 (shipped 2026-04-01)
- v1.1 Morphine Wean Calculator - Phases 5-6 (shipped 2026-04-02)
- v1.2 UI Polish - Phases 7-8 (shipped 2026-04-07)
- v1.3 Fortification Calculator Refactor - Phases 9-11 (shipped 2026-04-07) — see [milestones/v1.3-ROADMAP.md](milestones/v1.3-ROADMAP.md)
- v1.4 UI Polish - Phases 12-17 (shipped 2026-04-07) — see [milestones/v1.4-ROADMAP.md](milestones/v1.4-ROADMAP.md)
- [v1.5 Tab Identity & Search](milestones/v1.5-ROADMAP.md) - Phases 18-20 (shipped 2026-04-07)
- [v1.6 Toggle & Harden](milestones/v1.6-ROADMAP.md) - Phases 21-24 (shipped 2026-04-08)
- [v1.7 Formula Micro-Polish](milestones/v1.7-ROADMAP.md) - Phase 25 (shipped 2026-04-08)
- [v1.8 GIR Calculator](milestones/v1.8-ROADMAP.md) - Phases 26-28 (shipped 2026-04-09)
- **v1.9 GIR Titration Hero Swap + Polish** - Phases 29-31 (in progress)

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

<details>
<summary>v1.0-v1.7 (Phases 1-25) — SHIPPED</summary>

See individual milestone archives under `milestones/`.

</details>

<details>
<summary>v1.8 GIR Calculator (Phases 26-28) — SHIPPED 2026-04-09</summary>

- [x] **Phase 26: GIR Foundation** — Types, config JSON, pure calculations, state singleton (2/2 plans)
- [x] **Phase 27: GIR UI, Identity & Registration** — GlucoseTitrationGrid, GirCalculator, /gir route, .identity-gir (3/3 plans)
- [x] **Phase 28: GIR A11y, E2E & Ship** — E2E, axe sweeps, AboutSheet, 1.8.0 (4/4 plans)

See [milestones/v1.8-ROADMAP.md](milestones/v1.8-ROADMAP.md) for full phase details.

</details>

### v1.9 GIR Titration Hero Swap + Polish (Phases 29-31)

- [x] **Phase 29: GIR Titration Hero Swap** — Δ rate becomes hero on all buckets; GIR mg/kg/min moves to secondary row; a11y preserved; tests + axe updated (completed 2026-04-09)
- [ ] **Phase 30: Impeccable Polish + Tech Debt Sweep** — Critique-driven P1/P2 fixes across all 3 calculators; dep updates, dead code, lint/TS strict, deferred cleanups
- [ ] **Phase 31: Release v1.9** — Version bump, AboutSheet refresh, PROJECT.md Validated list update

## Phase Details

### Phase 29: GIR Titration Hero Swap
**Goal**: A bedside clinician reading a GIR titration bucket sees the actionable Δ rate first, not the recalculated GIR value — and every v1.8 a11y guarantee still holds.
**Depends on**: Phase 28 (v1.8 GIR shipped)
**Requirements**: GIR-SWAP-01, GIR-SWAP-02, GIR-SWAP-03, GIR-SWAP-04, GIR-SWAP-05, GIR-SWAP-06, GIR-SWAP-07
**Success Criteria** (what must be TRUE):
  1. On every GIR titration bucket card (all 6 buckets + the "current state" card), Δ rate (▲/▼ X.X ml/hr with "increase"/"decrease" label) renders as the hero using the same weight/size GIR mg/kg/min had in v1.8.
  2. GIR mg/kg/min appears in the secondary metrics row in the rightmost slot (row order: Fluids | Rate | GIR).
  3. The Δ=0 "current state" card shows a neutral/placeholder treatment — no ▲/▼ and no misleading "increase" label.
  4. Keyboard nav, roving tabindex, `role="radiogroup"`, `aria-live` announcements, identity color, focus rings, and `prefers-reduced-motion` behave identically to v1.8 (component tests + E2E pass).
  5. All 16 axe sweeps (morphine 6 + fortification 4 + gir 6) are green in light + dark on the new layout, audited BEFORE PR.
**Plans**: 1 plan
- [x] 29-01-PLAN.md — Hero swap + em-dash Δ=0 + STOP card + action-first aria-label + tests + axe gate
**UI hint**: yes

### Phase 30: Impeccable Polish + Tech Debt Sweep
**Goal**: All three calculators feel clinically impeccable in both themes at mobile + desktop, and the codebase is on clean, current dependencies with zero lint/type noise.
**Depends on**: Phase 29
**Requirements**: POLISH-01, POLISH-02, POLISH-03, POLISH-04, DEBT-01, DEBT-02, DEBT-03, DEBT-04
**Success Criteria** (what must be TRUE):
  1. A documented `impeccable:critique` pass exists for Morphine, Formula, and GIR in both themes at mobile 375 + desktop 1280, with severity-rated findings.
  2. Every P1 finding and every P2 finding addressable without architectural change is fixed and visible in the running app.
  3. Axe-core reports zero WCAG 2.1 AA regressions after polish — 16/16 sweeps remain green in both themes.
  4. Dependencies (SvelteKit, Svelte, Vite, Tailwind, Vitest, Playwright, @lucide/svelte, bits-ui) are updated within current majors and the full test suite passes.
  5. `svelte-check` and ESLint report zero warnings across `src/`; dead code and deferred cleanups from v1.5–v1.8 are removed or re-deferred with rationale in PROJECT.md Key Decisions.
**Plans**: 2 plans
- [ ] 30-01-PLAN.md — Impeccable critique + P1/P2 fix loop (POLISH-01..04)
- [ ] 30-02-PLAN.md — Tech debt sweep: deps, dead code, lint/TS, Phase 29 deferred pickup (DEBT-01..04)
**UI hint**: yes

### Phase 31: Release v1.9
**Goal**: v1.9 ships as a clean, self-describing release — users opening the app see the correct version and updated About content, and PROJECT.md reflects what shipped.
**Depends on**: Phase 30
**Requirements**: REL-01, REL-02, REL-03
**Success Criteria** (what must be TRUE):
  1. `package.json` version is `1.9.0` and the AboutSheet renders "1.9.0" in the running app.
  2. AboutSheet copy reflects v1.9 (version string plus any copy updates from the polish pass).
  3. PROJECT.md Validated list contains v1.9 entries for the GIR hero swap, polish pass, and tech-debt sweep.
**Plans**: TBD

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-25 | v1.0-v1.7 | — | Complete | 2026-04-08 |
| 26-28 | v1.8 | 9/9 | Complete | 2026-04-09 |
| 29. GIR Titration Hero Swap | v1.9 | 1/1 | Complete   | 2026-04-09 |
| 30. Polish + Tech Debt Sweep | v1.9 | 0/0 | Not started | - |
| 31. Release v1.9 | v1.9 | 0/0 | Not started | - |
