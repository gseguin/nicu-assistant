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
- [v1.9 GIR Titration Hero Swap + Polish](milestones/v1.9-ROADMAP.md) - Phases 29-31 (shipped 2026-04-09)
- **v1.10 GIR Simplification + Dock + Tech Debt** - Phases 32-34 (in progress)

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

<details>
<summary>v1.0-v1.8 (Phases 1-28) — SHIPPED</summary>

See individual milestone archives under `milestones/`.

</details>

<details>
<summary>v1.9 GIR Titration Hero Swap + Polish (Phases 29-31) — SHIPPED 2026-04-09</summary>

- [x] **Phase 29: GIR Titration Hero Swap** — Δ rate hero on all buckets; mg/kg/min to secondary row; a11y preserved; 16/16 axe green (1/1 plan)
- [x] **Phase 30: Impeccable Polish + Tech Debt Sweep** — Critique-driven P1/P2 fixes; dep groups A–D bumped; dead code removed; svelte-check 0/0 (2/2 plans)
- [x] **Phase 31: Release v1.9** — `package.json` → 1.9.0; AboutSheet via `__APP_VERSION__`; PROJECT.md Validated list (1/1 plan)

See [milestones/v1.9-ROADMAP.md](milestones/v1.9-ROADMAP.md) for full phase details.

</details>

### v1.10 GIR Simplification + Dock + Tech Debt (Phases 32-34)

- [x] **Phase 32: GIR Simplification** — Remove summary hero card, per-card secondary metrics row, reference card; preserve click/tap visual treatment; drop `aria-live` (severe-neuro STOP gating fix dropped from scope mid-flight) (completed 2026-04-10)
- [ ] **Phase 33: GIR Dock Magnification** — Port morphine-wean dock magnification to `GlucoseTitrationGrid`; mobile-only + reduced-motion guards; axe re-verify
- [ ] **Phase 34: Tech Debt Majors + Release v1.10** — Upgrade `@types/node` 22→25 and `typescript` 5→6 (deferred from v1.9); bump package.json to 1.10.0; update PROJECT.md Validated list with retired-entry strikethroughs

## Phase Details

### Phase 32: GIR Simplification
**Goal**: The GIR calculator is stripped down to its essentials — the bucket grid is the sole focal point, cards show only the Δ rate hero + bucket range label, click/tap visual feedback preserved.
**Depends on**: Phase 31 (v1.9 shipped)
**Requirements**: GIR-SIMP-01, GIR-SIMP-02, GIR-SIMP-03, GIR-SIMP-04, GIR-SIMP-05, ~~GIR-SIMP-06~~ (dropped), GIR-SIMP-07
**Success Criteria** (what must be TRUE):
  1. `GirCalculator.svelte` no longer renders the Target GIR summary hero card (ADJUST RATE / HYPERGLYCEMIA / TARGET REACHED eyebrow + treatment). The bucket grid is the only content between the inputs and the disclaimer.
  2. `GlucoseTitrationGrid.svelte` bucket cards no longer show the per-card `Fluids | Rate | GIR` secondary metrics row. Each card shows only the bucket range label (left) and the Δ rate hero (right with ▲/▼ + ml/hr + increase/decrease label).
  3. The "Starting GIR by population" reference card at the bottom of `GirCalculator.svelte` is removed entirely.
  4. Click/tap visual treatment is preserved on bucket cards (border-l-4 + `--color-identity-hero` fill). `role="radiogroup"` / `role="radio"` / roving tabindex / keyboard nav / focus rings are retained. `selectedBucketId` in `state.svelte.ts` is retained for visual continuity across navigation.
  5. `aria-live` announcements on bucket selection are removed (no downstream consumer, Δ rate already visible on every card).
  6. ~~Severe-neuro STOP gating fix~~ — **DROPPED.** The severe-neuro bucket continues to render the same Δ rate hero treatment as every other bucket; no STOP gating change. Deferred clinical bolus copy question from v1.9 NOTES.md remains deferred.
  7. All e2e assertions referencing "ADJUST RATE" / "HYPERGLYCEMIA" / "TARGET REACHED" eyebrow strings and the reference card are deleted. All component test assertions referencing the per-card secondary metrics row are deleted. Full test suite green.
**Plans**: TBD
**UI hint**: yes

### Phase 33: GIR Dock Magnification
**Goal**: The now-thinner GIR bucket list has morphine-wean-style dock magnification on mobile — cards scale with scroll progress to draw the eye to the currently-focused bucket, while respecting reduced-motion and desktop layouts.
**Depends on**: Phase 32
**Requirements**: GIR-DOCK-01, GIR-DOCK-02, GIR-DOCK-03, GIR-DOCK-04
**Success Criteria** (what must be TRUE):
  1. `GlucoseTitrationGrid.svelte` implements scroll-driven dock magnification using the same pattern as `MorphineWeanCalculator.svelte`: floating index from `scrollY / scrollMax`, `MAX_SCALE = 1.06`, `MAX_SHADOW_BOOST = 4`, radius 2.5 (3 cards visibly magnified at once), rAF-throttled scroll handler, cleanup on unmount.
  2. Magnification is guarded by `window.innerWidth < 768` (mobile-only) AND `!prefers-reduced-motion`. On desktop or reduced-motion: cards render flat.
  3. `MutationObserver` on the grid container re-runs magnification when rows change (matches morphine's defensive pattern).
  4. 16/16 Playwright axe sweeps re-run in both themes — all green, no regression from the transform/shadow additions.
**Plans**: TBD
**UI hint**: yes

### Phase 34: Tech Debt Majors + Release v1.10
**Goal**: `@types/node` and `typescript` are on latest majors (closing the two v1.9-deferred items), v1.10 ships as a clean self-describing release with version bump + AboutSheet reflection + PROJECT.md Validated list updated.
**Depends on**: Phase 33
**Requirements**: DEBT-MAJ-01, DEBT-MAJ-02, REL-01, REL-02, REL-03
**Success Criteria** (what must be TRUE):
  1. `@types/node` upgraded from 22 to 25 with no new svelte-check / tsc errors.
  2. `typescript` upgraded from 5 to 6 with full test suite + svelte-check + `pnpm build` green. Any new strictness or deprecation warnings are addressed atomically, or documented in NOTES.md and re-deferred with rationale.
  3. `package.json` version is `1.10.0` and the AboutSheet renders "v1.10.0" in the running app (auto-propagation via `__APP_VERSION__`).
  4. PROJECT.md Validated list contains v1.10 entries. Retired entries from prior milestones (REF-01 reference card, and the summary-hero portion of GIR-SWAP) are struck through with a "retired in v1.10" note.
  5. Final gates green: vitest all tests, svelte-check 0/0, Playwright axe 16/16, `pnpm build` ✓.
**Plans**: TBD

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-25 | v1.0-v1.7 | — | Complete | 2026-04-08 |
| 26-28 | v1.8 | 9/9 | Complete | 2026-04-09 |
| 29-31 | v1.9 | 4/4 | Complete | 2026-04-09 |
| 32. GIR Simplification | v1.10 | 1/1 | Complete   | 2026-04-10 |
| 33. GIR Dock Magnification | v1.10 | 0/0 | Not started | - |
| 34. Tech Debt Majors + Release v1.10 | v1.10 | 0/0 | Not started | - |
