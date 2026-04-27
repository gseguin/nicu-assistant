# Phase 43: Release v1.13.0 - Context

**Gathered:** 2026-04-24
**Status:** Ready for planning
**Mode:** discuss (all gray areas resolved via defaults — recommended choices accepted by user)

<domain>
## Phase Boundary

Ship v1.13.0: bump `package.json` to `1.13.0`, update PROJECT.md (Validated list + Current State) to reflect everything that landed in v1.13, and drive the full clinical quality gate green (svelte-check + vitest + build + Playwright + axe).

**Not in scope:** new features, UI changes, calculation modifications, identity-hue tuning. Those were Phases 40, 41, 42, 42.1, and the post-42.1 follow-up commits.

**v1.13 covers an unusually large scope for a release phase.** The milestone includes:
- 4 planned phases (40 · 41 · 42 · 42.1) with 14 committed plans + 15 SUMMARY.md files
- 14+ post-phase-42.1 follow-up commits (em-dash purge, Amber rescope, RangedNumericInput unification, drawer polish, PWA meta, mobile-nav icon centering)
- The 42.2 critique sweep (commit `1ce4493`, 50 files, 29→35/40 impeccable score)
- The STOP-red clinical-safety carve-out (commit `8fde90e`)
- The InputsRecap desktop-hide refinement (commit `390aba6`)

The Validated-list entries must capture all of it. Phase 43 is the receipt.

</domain>

<decisions>
## Implementation Decisions

### Version Bump
- **D-01:** Update `package.json` version from `1.12.5` to `1.13.0`. AboutSheet reflects this automatically via the `__APP_VERSION__` build-time constant — no manual AboutSheet edit needed. Pattern identical to Phase 39 (v1.12 release).

### PROJECT.md Validated-List Granularity (gray area 1 → option 1c: hybrid)
- **D-02:** Phases 40, 41, and 42 use the v1.12-style per-requirement-ID treatment in the Validated list. These phases have clean REQUIREMENTS.md IDs (`NAV-HAM-01..05`, `FAV-01..07`, `UAC-01..09`, `UAC-ARCH-01..05`, `UAC-TEST-01..04`, etc.). Flip each from Pending to ✓ validated; group under a Phase-keyed section header. Faithful, traceable.
- **D-03:** Phase 42.1 and the post-42.1 follow-up work use **narrative bullet summaries** in the Validated list (no forced requirement-ID fabrication). Phase 42.1 had 33 CONTEXT decisions with D-* numbers and 6 plans — the decisions are tracked in `42.1-CONTEXT.md`, not REQUIREMENTS.md. The Validated entry reads as a short prose summary of what shipped, with phase-tag `— v1.13 (Phase 42.1)`.
- **D-04:** Update PROJECT.md Current State section to reflect v1.13.0 shipped status. Summary prose should mention: 5 calculators live (Morphine, Formula, GIR, Feeds, UAC/UVC), favorites-driven nav with hamburger menu, design polish sweep completed, clinical-safety STOP-red carve-out.

### How to Record the 42.2 Critique Sweep + STOP-Red + Follow-Ups (gray area 2 → option 2a: explicit labels)
- **D-05:** Add a distinct section in the Validated list under the v1.13 group, explicitly labeled `— v1.13 (Phase 42.1 follow-up + 42.2 critique sweep)`. Does NOT create a synthetic Phase 42.2 requirement ID block in REQUIREMENTS.md. Does NOT absorb silently into Phase 42.1. Narrative bullets enumerate:
  - Post-42.1 polish wave (em-dash purge, Amber rescope, RangedNumericInput unification, drawer UX, mobile-nav centering, PWA meta)
  - 42.2 impeccable critique sweep — harden/clarify/distill/shape/layout/polish (29 → 35/40)
  - Clinical-safety carve-out: STOP red on severe-neuro (Red-as-Error rule single authorized exception)
  - InputsRecap desktop-hide refinement (redundant with sticky sidebar)
- **D-06:** Capture the specific commit hashes for the post-42.1 sweeps in the Validated bullets so git history is easy to reach: `1ce4493` (42.2 sweep), `8fde90e` (STOP-red), `390aba6` (recap desktop-hide).

### Verification Debt Triage (gray area 3 → option 3c: quick triage)
- **D-07:** Before the version bump, spot-check the 7 `human_needed` items across `40-VERIFICATION.md` and `41-VERIFICATION.md` flagged by `/gsd-progress`:
  - Items that are trivially verifiable from code/test state (e.g. "33 new tests land, full suite is 260/260") — mark ✓ in the VERIFICATION.md and continue.
  - Items that require manual verification on a real device (e.g. iOS PWA QA) — move to release-notes reminders and backlog for v1.14.
  - Items that indicate genuine gaps — flag as pre-release blockers; fix before bump.
- **D-08:** Triage output should land as a short updated block in each VERIFICATION.md with per-item status (verified-via-grep, manual-QA-needed, or fix-required). Not a new phase, not a new plan — inline grooming during Phase 43 execution.

### Orphan Planning Artifacts (gray area 4 → option 4a: delete)
- **D-09:** Delete `.planning/HANDOFF.json` (stale from the 42.1 pause; all work described is complete and superseded by the 42.2 sweep + STOP-red commits).
- **D-10:** Delete `.planning/phases/42.1-design-polish-sweep-impeccable-critique-remainder-onboard-co/.continue-here.md` (same reason). The phase is closed; the pause checkpoint is noise at this point.
- **D-11:** Do this cleanup as part of the Phase 43 plan, not as a separate housekeeping commit. Single commit titled appropriately, with brief rationale referencing the commits that superseded them.

### iOS Smoke Test as Release Gate (gray area 5 → option 5b: soft reminder)
- **D-12:** Do NOT block the v1.13.0 version-bump merge on real-iPhone verification. Playwright mobile emulation + the two iOS-specific fixes that shipped post-42.1 (`drawer position:fixed` → `flex-end`, textbox keyboard focus via `sheet.contains()`) give us sufficient confidence to ship.
- **D-13:** Add a release-notes reminder (surface in the Phase 43 SUMMARY.md and in PROJECT.md Current State): "Verify drawer + keyboard + STOP-red contrast on a real iPhone in standalone PWA mode post-deploy". Non-blocking. If the manual QA surfaces a regression, it becomes v1.13.1 hotfix fuel, not a v1.13.0 blocker.

### Final Gate (carried forward from Phase 39 / v1.12)
- **D-14:** All gates must pass before release is considered complete:
  - `pnpm check` → 0 errors / 0 warnings (baseline at commit time: 4571 files)
  - `pnpm test:run` → all tests green (baseline 340/340)
  - `pnpm build` → exits 0
  - `pnpm exec playwright test` → Playwright E2E green in both themes
  - axe sweeps green (extended vs v1.12 with UAC/UVC + hamburger variants)
- **D-15:** If any Playwright or axe assertion fails during the final gate, fix it before marking release complete. No "known issue" deferrals on the clinical-safety gate.

### Claude's Discretion
- Exact prose wording for PROJECT.md Current State paragraph.
- Order of Validated-list entries within each Phase group (by requirement ID vs by narrative impact).
- Whether to split Phase 43 into multiple plans (probably single plan — mechanics are linear) or keep as one.
- How to handle any svelte-check / test regression discovered during the final gate (normal debug flow).

### Folded Todos
None folded — `/gsd-progress` reported 0 pending todos.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Version + Build
- `package.json` — version field to bump (currently `1.12.5` based on test harness output; confirm before writing the exact target)
- `vite.config.ts` — `__APP_VERSION__` build-time constant wiring; confirms AboutSheet auto-picks up the new version
- `src/app.html` — meta description (check if it still accurately reflects v1.13 scope; Phase 42.1-followup already synced it to the 5-calculator scope)

### Documentation
- `.planning/PROJECT.md` — Validated section + Current State paragraph to update
- `.planning/REQUIREMENTS.md` — source of the 41 pending v1.13 requirement IDs (NAV-HAM-*, FAV-*, UAC-*, REL-*) to flip to ✓ validated
- `.planning/ROADMAP.md` — milestone definition; Phase 43 Progress table row to update

### Prior Release Patterns
- `.planning/milestones/v1.12-phases/39-release-v1-12/39-CONTEXT.md` — the template this phase follows
- Phase 31 (v1.9), Phase 34 (v1.10), Phase 35 (v1.11) — prior release phase patterns in git history for tone/granularity reference

### Phase Artifacts Landing in v1.13
- `.planning/phases/40-favorites-store-hamburger-menu/` — 3 plans, 3 summaries, VERIFICATION.md (7 human_needed items to triage)
- `.planning/phases/41-favorites-driven-navigation/` — 2 plans, 2 summaries, VERIFICATION.md (human_needed items to triage)
- `.planning/phases/42-uac-uvc-calculator/` — 3 plans, 3 summaries
- `.planning/phases/42.1-design-polish-sweep-impeccable-critique-remainder-onboard-co/` — 6 plans, 7 summaries, 33 CONTEXT decisions; DESIGN.md + DESIGN.json also landed here

### Post-Phase Follow-up Commits (for Validated bullet references)
- Commit `1ce4493` — feat(42.2): impeccable critique sweep — 6 tasks addressing 29/40 baseline
- Commit `8fde90e` — fix(gir): promote STOP semantics to error color on severe-neuro
- Commit `390aba6` — fix(recap): hide inputs summary at md+ viewports
- 14+ earlier follow-up commits between `1826069` (Phase 42.1 close) and `1ce4493` — git log range for narrative reference

### Orphan Artifacts to Delete
- `.planning/HANDOFF.json`
- `.planning/phases/42.1-design-polish-sweep-impeccable-critique-remainder-onboard-co/.continue-here.md`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `__APP_VERSION__` build-time constant (vite.config.ts) — reads `package.json.version` at build time, injects into AboutSheet. Zero manual updates needed when the version field changes.
- Existing Playwright + axe-core test infrastructure — extended in v1.13 with UAC/UVC and hamburger variants; the full suite runs as the final gate.
- Existing `svelte-check` + `vitest` + `pnpm build` scripts — no tooling changes needed for v1.13 release.

### Established Patterns
- Release-phase pattern (v1.9 → v1.12): version bump + PROJECT.md update + gate sweep in a single focused phase, shipped in one plan.
- Validated-list entries follow one-line-per-ID format with `— vX.Y (Phase N)` suffix; carries the milestone tag for traceability.

### Integration Points
- `package.json` — single version field edit
- `.planning/PROJECT.md` — multiple section edits (Current State paragraph + Validated list section)
- `.planning/REQUIREMENTS.md` — 41 requirement rows flip from "Pending" to "✓ Validated" (or equivalent status column update)
- `.planning/ROADMAP.md` — Progress table row for Phase 43 updates to "Complete"

</code_context>

<specifics>
## Specific Ideas

- **42.1 + post-42.1 work has no clean REQUIREMENTS.md IDs** — the 33 CONTEXT decisions and the post-phase sweeps were design-polish work, not new-feature requirements. Forcing them into synthetic IDs would be bureaucratic noise. The hybrid granularity (D-02 + D-03) trusts readers of PROJECT.md to scan the Phase 42.1 narrative bullets alongside the Phase 40/41/42 per-ID lists.
- **The STOP-red carve-out deserves its own Validated entry** — it's a locked exception to the Red-as-Error rule in DESIGN.md, not just a visual fix. Document with a commit hash + one-line rationale ("single authorized exception: severe-neuro STOP on GIR").
- **The Phase 43 plan is probably a single plan file** — mechanics are linear: (1) version bump, (2) verification-debt triage, (3) orphan cleanup, (4) PROJECT.md + REQUIREMENTS.md updates, (5) final gate sweep, (6) commit + summary. No branches, no dependencies, no long-running tasks worth splitting.
- **Prior release phases (v1.9, v1.10, v1.11, v1.12) all followed the same exact shape** — this phase is that shape + the extra narrative bullets for 42.1 + post-42.1 work.

</specifics>

<deferred>
## Deferred Ideas

### Hide InputsRecap on desktop (done pre-Phase-43)
Shipped as commit `390aba6` before Phase 43 kickoff per user direction — small standalone fix, ships with v1.13 as a pre-release polish commit rather than a Phase 43 scope item.

### Real-iPhone iOS PWA smoke test
Per D-12, not a release blocker. Surface as a release-notes reminder (v1.13.1 hotfix fuel if a regression is found). Candidate v1.14 housekeeping item if iOS-specific test coverage becomes worth automating.

### Verification-debt items that require manual QA
Per D-07 triage: items in `40-VERIFICATION.md` / `41-VERIFICATION.md` that can't be verified from code state land in a v1.14 backlog entry, not as Phase 43 blockers.

### Impeccable critique P1-P3 remainder
The critique re-run surfaced 4 remaining issues below P0 (HeroResult children-as-default, mobile scroll-to-hero on row select, Morphine hero reading order, largeChange caption color). Not Phase 43 scope — parking for a post-release follow-up or v1.14 design pass.

</deferred>

---

*Phase: 43-release-v1-13-0*
*Context gathered: 2026-04-24*
