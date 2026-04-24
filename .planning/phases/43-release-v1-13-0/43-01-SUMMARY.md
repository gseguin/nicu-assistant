---
phase: 43-release-v1-13-0
plan: 01
subsystem: release
tags: [release, version-bump, documentation, gates, orphan-cleanup, traceability-flip, verification-triage, pre-bump-e2e-fix]
dependency_graph:
  requires: [40-03, 41-02, 42-03, 42.1-06]
  provides: [v1.13.0-release]
  affects: [package.json, PROJECT.md, REQUIREMENTS.md, ROADMAP.md, app.css, e2e]
tech_stack:
  added: []
  patterns: [release-commit-granularity, validated-bullet-tag-format, build-time-version-resolution, gate-sweep-cadence, conventional-commit-prefix]
key_files:
  created:
    - .planning/phases/43-release-v1-13-0/43-01-SUMMARY.md
  modified:
    - package.json
    - .planning/PROJECT.md
    - .planning/REQUIREMENTS.md
    - .planning/ROADMAP.md
    - .planning/phases/40-favorites-store-hamburger-menu/40-VERIFICATION.md
    - .planning/phases/41-favorites-driven-navigation/41-VERIFICATION.md
    - src/app.css
    - e2e/uac-uvc.spec.ts
    - e2e/morphine-wean-a11y.spec.ts
    - e2e/feeds-a11y.spec.ts
    - e2e/gir-a11y.spec.ts
    - e2e/feeds.spec.ts
    - e2e/gir.spec.ts
    - e2e/morphine-wean.spec.ts
    - e2e/formula.spec.ts
  deleted:
    - .planning/HANDOFF.json
    - .planning/phases/42.1-design-polish-sweep-impeccable-critique-remainder-onboard-co/.continue-here.md
decisions:
  - "Hybrid Validated-list granularity (D-02/D-03/D-05): per-ID bullets for Phases 40/41/42 + narrative bullets for Phase 42.1 + 42.1-followup+42.2"
  - "D-15 no-deferrals enforcement: pre-bump Playwright failures fixed via cascade fix(43) commits, not deferred"
  - "Token-tweak fix for color-contrast: --color-text-tertiary darkened from oklch(50%) to oklch(47%) (light mode only) to clear 4.5:1 on --color-surface-alt"
  - "Test-only locator fixes preferred where the underlying surface is correct (RangedNumericInput slider aria-label vs strict-mode getByLabel)"
  - "STOP-red carve-out (commit 8fde90e) called out in Validated bullets as the single authorized exception to Red-as-Error rule"
metrics:
  duration: 35m
  completed: 2026-04-24
  tasks: 6
  files: 17
---

# Phase 43 Plan 01: Release v1.13.0 Summary

Shipped v1.13.0 — version bump from 1.12.5 to 1.13.0, all v1.13 documentation updated to reflect milestone closure, two pre-existing Playwright failures plus a cascade of sibling regressions from the post-42.1 RangedNumericInput unification and InputsRecap desktop-hide refactor fixed pre-bump per D-15 (no known-issue deferrals on the clinical-safety gate), full clinical quality gate green (svelte-check 0/0 / 4571 files, vitest 340/340, build ✓, Playwright 99 passed / 3 skipped, 33/33 axe sweeps in both themes).

## Task Results

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Verification-debt triage (40/41-VERIFICATION.md) | 70bc557 | 40-VERIFICATION.md, 41-VERIFICATION.md |
| 2 | Delete orphan planning artifacts | 7d17a35 | HANDOFF.json (deleted), .continue-here.md (deleted) |
| 3 | Pre-bump fix — uac-uvc mobile beforeEach hook | d6b8d50 | e2e/uac-uvc.spec.ts |
| 4 | Pre-bump fix — morphine-wean a11y strict-mode (cascade across feeds, gir a11y) | d328b5a | e2e/morphine-wean-a11y.spec.ts, e2e/feeds-a11y.spec.ts, e2e/gir-a11y.spec.ts |
| 4b | Color-contrast token tweak (severe-neuro card surface-alt vs text-tertiary) | 0c26370 | src/app.css |
| 4c | Cascade e2e repair (feeds, gir, morphine-wean, formula happy-path specs) | 58e16a7 | e2e/feeds.spec.ts, e2e/gir.spec.ts, e2e/morphine-wean.spec.ts, e2e/formula.spec.ts |
| 5 | Version bump + PROJECT.md + REQUIREMENTS.md (38/41) + ROADMAP.md | 9a86738 | package.json, PROJECT.md, REQUIREMENTS.md, ROADMAP.md |
| 6 | Final gate sweep + REL-* traceability flips | 399b19d | REQUIREMENTS.md, PROJECT.md |

## What Was Done

### Task 1 — Verification-debt triage (D-07/D-08)
Appended a `## Phase 43 Triage` block to both 40-VERIFICATION.md and 41-VERIFICATION.md with per-item status:
- 40-VERIFICATION.md: 2 verified-via-grep (localStorage seed via T-01/T-18/T-19; D-OUT-01 obsolete after Phase 41 flip — bottom bar now reads from favorites), 2 manual-QA-needed (full keyboard Esc round-trip, reduced-motion sanity check).
- 41-VERIFICATION.md: 1 verified-via-grep (the 2 pre-existing navigation.spec failures called out as Phase-40 regressions are now passing per commit `c2800df`), 3 manual-QA-needed (mobile bar visual identity + safe-area, inactive-tab color, desktop identity indicators).
- 0 fix-required items surfaced. Manual-QA items routed to v1.13.1 release-notes reminder per D-13 and v1.14 backlog.

### Task 2 — Orphan deletion (D-09/D-10/D-11)
Single chore(43) commit `git rm`-ing `.planning/HANDOFF.json` and `.planning/phases/42.1-…/.continue-here.md`, both stale from the Phase 42.1 pause and superseded by commits 1ce4493 (42.2 critique sweep) / 8fde90e (STOP-red) / 390aba6 (recap desktop-hide).

### Task 3 — uac-uvc mobile beforeEach fix
The `Open inputs drawer` aria-label no longer exists; commits 0558253 + 390aba6 replaced the InputDrawer handle with the InputsRecap mobile button (composed aria-label ends with "Tap to edit inputs."). Replaced the locator with `getByRole('button', { name: /tap to edit inputs/i })`. All 9 uac-uvc spec tests green.

### Task 4 — Pre-bump a11y fixes
The reproducible morphine-wean light-advisory failure flagged by RESEARCH was a strict-mode locator violation, NOT a token regression as A5 suspected. The shared `RangedNumericInput` now wraps every weight input with both an `<input aria-label="Weight">` and a `<span role="slider" aria-label="Weight slider">` — the bare `getByLabel('Weight')` matches both. Added `{ exact: true }` across morphine-wean-a11y.spec.ts, feeds-a11y.spec.ts, gir-a11y.spec.ts. No `disableRules()` or `withTags()` exclusions used.

### Task 4b — Color-contrast surface fix
A separate axe-core color-contrast violation surfaced once strict-mode was resolved: the GIR severe-neuro card carries a `--color-surface-alt` tint when not selected, and the secondary text inside (`(increase)` / `ml/hr`) in `--color-text-tertiary` (#5f6467) on surface-alt (#d9dfe2) rendered at 4.45:1 — 0.05 shy of WCAG AA. Smallest-possible-diff fix: light-mode `--color-text-tertiary` darkened from `oklch(50% 0.008 225)` to `oklch(47% 0.008 225)`. Dark mode unchanged (already 62% and compliant).

### Task 4c — Cascade e2e repair
Same systemic strict-mode issue affected feeds.spec.ts, gir.spec.ts, morphine-wean.spec.ts (RangedNumericInput sliders) plus formula.spec.ts (drawer dialog mounts hidden copy on desktop, which `.first()` was picking before any visible match). Applied `{ exact: true }` to the input locators, switched mobile drawer triggers to `/tap to edit inputs/i`, scoped formula desktop test to the aside + used `.locator('visible=true').first()` for the recipe `ml` text.

### Task 5 — Release receipt
Single atomic commit:
- `package.json` line 4: `1.12.5` → `1.13.0`. AboutSheet auto-renders v1.13.0 via the `__APP_VERSION__` build-time constant.
- PROJECT.md Validated list: 6 v1.13 bullets appended chronologically after the v1.12 release bullet — 4 per-ID bullets (Phase 40 favorites store + hamburger; Phase 41 favorites-driven nav; Phase 42 UAC/UVC architecture/identity; Phase 42 UAC/UVC UI/calculations), 1 narrative bullet for Phase 42.1 (closing at commit 1826069), 1 narrative bullet for Phase 42.1-followup + 42.2 critique sweep with explicit commit hashes 1ce4493/8fde90e/390aba6 per D-06, 1 release bullet for Phase 43.
- PROJECT.md Current State paragraph rewritten to v1.13.0 prose mentioning all 5 calculators, hamburger menu + favorites nav, design polish sweep, STOP-red carve-out, and the real-iPhone smoke-test reminder per D-13.
- PROJECT.md Current Milestone header flipped to `(Shipped)` with a single Shipped paragraph replacing the Goal + Target features blocks.
- PROJECT.md footer timestamp updated.
- REQUIREMENTS.md: 38 non-REL v1.13 IDs flipped Pending → ✓ Validated. REL-01..03 stayed Pending pending the gate sweep.
- ROADMAP.md Phase 43 row: `0/? | Not started | —` → `1/1 | Complete | 2026-04-24`.

### Task 6 — Final gate + REL flips
All 5 gates per D-14 ran green in this exact order:
- `pnpm check` → 0 errors / 0 warnings / 4571 files
- `pnpm test:run` → 340/340 passing (36 files, 25.82s)
- `pnpm build` → exits 0, 45 PWA precache entries / 549.71 KiB
- `pnpm exec playwright test` → 99 passed / 3 skipped (PWA service-worker tests) / 0 failed
- Explicit axe sweep across 7 a11y specs → 33/33 passing in both themes

REL-01..03 flipped to ✓ Validated; PROJECT.md test-count placeholder substituted with actual figures (vitest 340/340, Playwright 99/3-skipped, axe 33/33).

## Deviations from Plan

The plan was authored against a baseline of "2 pre-existing Playwright failures" identified in RESEARCH.md. After RESEARCH was committed, two further commits landed (`0558253` RangedNumericInput unification and `390aba6` InputsRecap desktop-hide) which broke ~30 additional tests via two systemic refactors not captured in the plan. Per D-15 (no deferrals on the clinical-safety gate), the cascade was fixed inline.

### Auto-fixed Issues

**1. [Rule 3 - Blocking] morphine-wean light-mode advisory failure was strict-mode, not OKLCH**
- **Found during:** Task 4 (RESEARCH had labelled the failure as a likely token regression per A5)
- **Issue:** The failing test `expect(results.violations).toEqual([])` actually never ran — the test failed earlier on `weight.fill('99999')` with a Playwright strict-mode error: `getByLabel('Dosing weight')` resolved to the NumericInput AND the bits-ui slider thumb (aria-label="Dosing weight slider"), introduced by commit `0558253`.
- **Fix:** Added `{ exact: true }` to all `getByLabel('Dosing weight')` calls in morphine-wean-a11y.spec.ts.
- **Files modified:** e2e/morphine-wean-a11y.spec.ts
- **Commit:** d328b5a

**2. [Rule 3 - Blocking] Sibling a11y specs (feeds, gir) hit the same strict-mode issue**
- **Found during:** Task 4 verify (the broader axe sweep across all 7 specs)
- **Issue:** feeds-a11y.spec.ts and gir-a11y.spec.ts both used `getByLabel('Weight')` etc. without `{ exact: true }`, matching both the input and the new slider thumb.
- **Fix:** Same `{ exact: true }` pattern applied to all weight/dextrose/fluid-order locators.
- **Files modified:** e2e/feeds-a11y.spec.ts, e2e/gir-a11y.spec.ts
- **Commit:** d328b5a (bundled with morphine-wean-a11y per Task 4 acceptance criteria covering all 7 a11y specs)

**3. [Rule 1 - Bug] GIR severe-neuro card 4.45:1 contrast on surface-alt**
- **Found during:** Task 4 verify (after strict-mode was resolved, axe surfaced a real WCAG AA color-contrast violation on the severe-neuro card's "(increase)" + "ml/hr" secondary text)
- **Issue:** When the calculation produces a positive `targetGirMgKgMin` for the severe-neuro row (i.e., not the STOP-infusion branch), the card retains its `--color-surface-alt` tint, and `text-tertiary` (#5f6467) on surface-alt (#d9dfe2) measures 4.45:1 — 0.05 shy of WCAG AA 4.5:1.
- **Fix:** Darkened light-mode `--color-text-tertiary` from `oklch(50% 0.008 225)` to `oklch(47% 0.008 225)`, lifting contrast to ~4.84:1 while preserving visual hierarchy against text-secondary (35%) and text-primary (18%). Dark-mode token unchanged (already 62% and compliant). No `disableRules()` used per D-15.
- **Files modified:** src/app.css
- **Commit:** 0c26370

**4. [Rule 3 - Blocking] Sibling happy-path specs (feeds, gir, morphine-wean, formula) regressed from 0558253/390aba6**
- **Found during:** Task 4c (`pnpm exec playwright test` to confirm the broader gate before Task 5 commit)
- **Issue:** ~20 happy-path tests across feeds.spec.ts, gir.spec.ts, morphine-wean.spec.ts, formula.spec.ts all hit `getByLabel('Open inputs drawer')` (now retired) or strict-mode locator violations from RangedNumericInput.
- **Fix:** Replaced `Open inputs drawer` with `/tap to edit inputs/i` regex; added `{ exact: true }` to weight/dextrose/fluid-order locators; scoped formula desktop test to `aside[aria-label="Formula inputs"]` and used `.locator('visible=true').first()` for the recipe `ml` text (the drawer dialog's hidden copy was being picked first).
- **Files modified:** e2e/feeds.spec.ts, e2e/gir.spec.ts, e2e/morphine-wean.spec.ts, e2e/formula.spec.ts
- **Commit:** 58e16a7

**5. [Plan deviation - acknowledged] Verification-debt count was 8, not 7**
- **Found during:** Task 1 (CONTEXT.md said "7 human_needed items"; RESEARCH.md A2 already flagged 4+4=8 in the two VERIFICATION.md files)
- **Resolution:** Triaged all 8 items per the D-07 rubric; the +1 discrepancy was already acknowledged in RESEARCH metadata.
- **Commit:** 70bc557 (no separate fix commit)

## Gate Results

| Gate | Result | Detail |
|------|--------|--------|
| svelte-check | PASS | 0 errors / 0 warnings across 4571 files |
| vitest | PASS | 340/340 tests across 36 files in 25.82s |
| pnpm build | PASS | exits 0, 45 PWA precache entries / 549.71 KiB |
| Playwright E2E | PASS | 99 passed / 3 skipped (PWA SW tests) / 0 failed across 102 tests |
| Axe sweeps | PASS | 33/33 across 7 a11y specs (morphine-wean, feeds, fortification, gir, uac-uvc, favorites-nav, disclaimer-banner) in both light + dark themes |

## Release Notes / Follow-ups (D-13)

**Recommended post-deploy verification on a real iPhone (non-blocking):**
- InputDrawer bottom-sheet behavior in standalone PWA mode (slide-up animation, backdrop tap to close, focus management on first input)
- Native keyboard appearance (decimal pad triggered by `inputmode="decimal"` on every NumericInput)
- STOP-red contrast on severe-neuro GIR card in both light and dark themes
- Hamburger menu Esc/Tab keyboard flow with focus return
- Bottom bar identity color rendering and safe-area inset clearance at 375 + 414 viewports

If a regression surfaces, it becomes v1.13.1 hotfix fuel — not a v1.13.0 blocker per D-12. v1.14 backlog candidates if iOS-specific test coverage becomes worth automating.

**v1.14 backlog (from Phase 43 verification triage):**
- Mobile bar visual identity + safe-area padding live confirmation
- Non-favorited active route inactive-tab color confirmation
- Desktop top nav identity indicator (border-b-2 + identity color) confirmation
- Reduced-motion sanity check on hamburger open/close

## Self-Check: PASSED

- [x] `package.json:4` reads `"version": "1.13.0"` — verified via grep
- [x] PROJECT.md Validated list contains ≥1 each `v1.13 (Phase 40)`, `v1.13 (Phase 41)`, `v1.13 (Phase 42.1)`, `v1.13 (Phase 42.1 follow-up + 42.2 critique sweep)`, `v1.13 (Phase 43)`; ≥2 `v1.13 (Phase 42)` — verified via grep counts (1/1/1/1/1/2)
- [x] PROJECT.md Validated bullets reference commit hashes 1ce4493, 8fde90e, 390aba6 — verified via grep
- [x] PROJECT.md Current State `**Shipped:**` paragraph mentions v1.13.0, fifth calculator, hamburger, favorites, Phase 42.1 polish, STOP-red carve-out — verified via grep `v1.13.0 UAC/UVC`
- [x] PROJECT.md `## Current Milestone: v1.13 UAC/UVC Calculator + Favorites Nav (Shipped)` header present — verified via grep
- [x] PROJECT.md footer reads `*Last updated: 2026-04-24 — v1.13.0 Phase 43 complete …*` — verified via tail
- [x] REQUIREMENTS.md traceability table: 0 `| Pending |` rows; 41 `| ✓ Validated |` rows — verified via grep counts
- [x] REQUIREMENTS.md footer reads `*Last updated: 2026-04-24 — all v1.13 requirements validated at release (Phase 43)*` — verified via grep
- [x] ROADMAP.md Phase 43 row reads `| 43. Release v1.13.0 | v1.13 | 1/1 | Complete | 2026-04-24 |` — verified via grep
- [x] Two orphan files deleted (`.planning/HANDOFF.json`, Phase 42.1 `.continue-here.md`) — verified via test ! -f
- [x] Both VERIFICATION.md files contain `## Phase 43 Triage` section with per-item status — verified via grep
- [x] All 5 D-14 gates green at HEAD — verified by running each
- [x] No `disableRules()` or `withTags(...)` exclusions added in Tasks 3/4/4b/4c — surface fixes only per D-15
- [x] Plan-driven ROADMAP.md Phase 43 Progress row update inside Task 5 §G; no other ROADMAP edits — verified via git diff
- [x] No `.planning/STATE.md` modifications — orchestrator owns
- [x] All commit subjects use conventional `<type>(43-NN)` or `<type>(43)` prefixes per Pattern S5
- [x] 9 Phase 43 commits in the chronological history (3 docs/chore + 4 fix + 2 feat) — verified via `git log --oneline | head -10`

## Commits

| Hash | Subject |
|------|---------|
| 70bc557 | docs(43): triage Phase 40 + 41 verification debt for v1.13 release |
| 7d17a35 | chore(43): remove stale 42.1 handoff artifacts (superseded by 1ce4493/8fde90e/390aba6) |
| d6b8d50 | fix(43): repair uac-uvc mobile viewport beforeEach hook |
| d328b5a | fix(43): resolve a11y spec strict-mode locator violations post-RangedNumericInput |
| 0c26370 | fix(43): darken light-mode text-tertiary to 47% for 4.5:1 on surface-alt |
| 58e16a7 | fix(43): repair sibling e2e specs after RangedNumericInput + InputsRecap refactor |
| 9a86738 | feat(43-01): bump v1.13.0 + PROJECT.md + REQUIREMENTS.md (38/41) + ROADMAP.md |
| 399b19d | feat(43-01): green-gate REL-* traceability flips for v1.13.0 |
