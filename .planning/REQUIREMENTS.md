# Requirements: NICU Assistant — v1.10 GIR Simplification + Dock + Tech Debt

**Milestone goal:** Strip the GIR calculator down to its essentials — remove the summary hero, per-card secondary metrics row, and bottom reference card; keep the bucket grid as the sole focal point with click/tap visual feedback preserved but no downstream consumer. Port morphine's dock magnification to the now-thinner GIR bucket list. Resolve v1.9's deferred severe-neuro clinical bolus correctness fix. Bring `@types/node` and `typescript` to latest majors in a parallel tech-debt track.

**Key context:** Follow-up clinician feedback after v1.9 shipped. The Δ rate hero swap was the right move, but the summary card + per-card secondary row + reference card are all noise around the actual bedside artifact (the bucket grid). Simpler = faster to read = safer at bedside.

---

## Traceability

| REQ-ID | Phase | Status |
|--------|-------|--------|
| GIR-SIMP-01 | Phase 32 | Pending |
| GIR-SIMP-02 | Phase 32 | Pending |
| GIR-SIMP-03 | Phase 32 | Pending |
| GIR-SIMP-04 | Phase 32 | Pending |
| GIR-SIMP-05 | Phase 32 | Pending |
| GIR-SIMP-06 | Phase 32 | Dropped (severe-neuro card stays as-is; deferred clinical question remains deferred) |
| GIR-SIMP-07 | Phase 32 | Pending |
| GIR-DOCK-01 | Phase 33 | Pending |
| GIR-DOCK-02 | Phase 33 | Pending |
| GIR-DOCK-03 | Phase 33 | Pending |
| GIR-DOCK-04 | Phase 33 | Pending |
| DEBT-MAJ-01 | Phase 34 | Pending |
| DEBT-MAJ-02 | Phase 34 | Pending |
| REL-01 | Phase 34 | Pending |
| REL-02 | Phase 34 | Pending |
| REL-03 | Phase 34 | Pending |

---

## Phase 32 — GIR Simplification

- [ ] **GIR-SIMP-01**: Remove the Target GIR summary hero card from `GirCalculator.svelte` (the card showing `ADJUST RATE` / `HYPERGLYCEMIA` / `TARGET REACHED` eyebrow + hero treatment + secondary metrics). The grid is now the sole focal point.

- [ ] **GIR-SIMP-02**: Remove the per-card secondary metrics row from `GlucoseTitrationGrid.svelte` — no more `Fluids | Rate | GIR` strip inside each bucket card. Cards display only the bucket range label (left) and the Δ rate hero (right, with ▲/▼ arrow + ml/hr + "increase"/"decrease" label).

- [ ] **GIR-SIMP-03**: Remove the "Starting GIR by population" reference card at the bottom of `GirCalculator.svelte` (IDM/LGA, IUGR, Preterm/NPO). The card is retired — not relocated.

- [ ] **GIR-SIMP-04**: Preserve click/tap visual treatment on bucket cards — `border-l-4 border-l-[var(--color-identity)] bg-[var(--color-identity-hero)]` on selection, same as v1.9. Preserve `role="radiogroup"` / `role="radio"` / roving tabindex / keyboard nav / focus rings. Selection state (`selectedBucketId` in `state.svelte.ts`) is retained for visual continuity across navigation, even though nothing downstream consumes it.

- [ ] **GIR-SIMP-05**: Drop `aria-live` announcements on bucket selection — with no downstream consumer and the Δ rate already visible on every card, the announcement is redundant noise for screen-reader users.

- [ ] ~~**GIR-SIMP-06**: Fix the deferred severe-neuro clinical bolus correctness issue~~ — **DROPPED.** The `severe-neuro` bucket continues to render the same Δ rate hero treatment as every other bucket (no unconditional STOP gating). The deferred clinical bolus copy question from v1.9 NOTES.md remains deferred. No change to `GlucoseTitrationGrid.svelte` STOP gating logic, no new test, no parity fixture changes.

- [ ] **GIR-SIMP-07**: Tests updated — delete all e2e assertions referencing "ADJUST RATE" / "HYPERGLYCEMIA" / "TARGET REACHED" eyebrow strings and the summary hero card; delete all component test assertions referencing the per-card secondary metrics row and the reference card. All tests green.

---

## Phase 33 — GIR Dock Magnification

- [ ] **GIR-DOCK-01**: Port the morphine-wean dock magnification implementation to `GlucoseTitrationGrid.svelte`. Same pattern: scroll-driven floating index (`scrollY / scrollMax → 0..n-1`), `MAX_SCALE = 1.06`, `MAX_SHADOW_BOOST = 4`, radius of 2.5 so 3 cards are always visibly magnified. Shared logic where practical — extract to `$lib/shared` if the duplication warrants it, otherwise inline per component with a clear "cloned from morphine" comment.

- [ ] **GIR-DOCK-02**: Mobile-only + reduced-motion guards. Same as morphine: `window.innerWidth < 768` AND not `prefers-reduced-motion: reduce`. On desktop or reduced-motion: cards render flat (no transform, no shadow, no zIndex).

- [ ] **GIR-DOCK-03**: `MutationObserver` on the grid container to re-run magnification when bucket rows change (defensive — buckets are static, but the observer matches morphine's pattern and handles future dynamic content).

- [ ] **GIR-DOCK-04**: 16/16 axe sweeps remain green after adding magnification. `transform: scale()` does not affect axe, but the full sweep is re-run in both themes to confirm no regression.

---

## Phase 34 — Tech Debt Majors + Release v1.10

- [ ] **DEBT-MAJ-01**: Upgrade `@types/node` 22 → 25. This is a dev-only type package; verify `tsc --noEmit` / `svelte-check` stay clean and no new errors surface.

- [ ] **DEBT-MAJ-02**: Upgrade `typescript` 5 → 6. Major version. Re-run full test suite, svelte-check, and `pnpm build`. Address any new strictness or deprecation warnings atomically. If TS 6 introduces breaking changes that require non-trivial source edits, document the breakage in NOTES.md and decide (fix vs. re-defer) before committing.

- [ ] **REL-01**: `package.json` version bumped to 1.10.0.

- [ ] **REL-02**: AboutSheet reflects v1.10.0 (auto-propagates via `__APP_VERSION__` build-time constant — no source change needed; verify via successful `pnpm build`).

- [ ] **REL-03**: PROJECT.md Validated list updated with v1.10 entries. Retired entries get a strikethrough note: REF-01 (v1.8 — population reference card, removed in v1.10) and the relevant parts of GIR-SWAP-01..03 describing the summary hero card (removed in v1.10; the grid-level Δ rate hero stays).

---

## Out of Scope for v1.10

- No new calculators — fourth clinical tool deferred.
- No changes to GIR calculation logic itself (formula, constants, buckets, ranges). Severe-neuro fix is a rendering/gating change, not a math change.
- No changes to Morphine Wean or Formula calculators (unless shared magnification extraction touches them).
- No i18n / user accounts / backend / analytics / native shell — all still out of scope per PROJECT.md.
- No changes to identity tokens or dark-mode OKLCH values.
- No other dep upgrades beyond `@types/node` and `typescript` (current majors were all bumped in v1.9).

---

## Quality Gates (end-of-milestone, non-negotiable)

- Vitest: all tests green
- svelte-check: 0 errors, 0 warnings
- Playwright axe: 16/16 green in both themes
- Playwright e2e: all prior-phase assertions green post-update
- `pnpm build`: PWA built successfully with v1.10.0
