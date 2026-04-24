# Phase 43: Release v1.13.0 - Research

**Researched:** 2026-04-24
**Domain:** Release engineering — version bump + documentation + quality gate
**Confidence:** HIGH (all findings grep/file-verified in this session)

## Summary

Phase 43 is a mechanical release phase with no new code. Every input the planner
needs has been measured directly: current `package.json` is `1.12.5`, the
`__APP_VERSION__` build-time constant is wired correctly in `vite.config.ts:11`,
all three primary gates baseline green right now (svelte-check 0/0 across 4571
files, vitest 340/340 across 36 files, `pnpm build` exits 0), and the prior
release pattern (Phase 39 / v1.12.0) shipped as a single 3-task plan with a
clean diff template that Phase 43 should clone.

Two pre-existing Playwright failures surface during the Playwright gate and
will need fixing before REL-03 is satisfied:
1. `e2e/uac-uvc.spec.ts` mobile viewport `beforeEach` times out on "Open inputs
   drawer" — confirmed reproducible at this commit; root cause is viewport
   scoping inside `test.describe` with `test.use({ viewport })` per-block.
2. `e2e/morphine-wean-a11y.spec.ts` "advisory message has no axe violations in
   light mode" fails at this commit (axe regression).

Both must be triaged as pre-bump fix tasks per D-15 ("no 'known issue'
deferrals on the clinical-safety gate").

**Primary recommendation:** Single linear plan, 6 tasks: (1) verification-debt
triage on 40/41-VERIFICATION.md, (2) orphan artifact deletion (HANDOFF.json +
.continue-here.md), (3) version bump + PROJECT.md Validated/Current State
update + REQUIREMENTS.md status flips + ROADMAP.md Progress row, (4) pre-bump
fix for the two Playwright failures, (5) final gate sweep, (6) SUMMARY +
release-notes reminder. Phase 39's 3-task structure does not generalize cleanly
because (a) v1.13 has 41 IDs to flip vs. v1.12's ~30 with simpler structure,
(b) two known Playwright failures need pre-bump fixing, and (c) verification
debt + orphan artifact cleanup must land in Phase 43 per D-07..D-11.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Version Bump:**
- **D-01:** Update `package.json` version from `1.12.5` to `1.13.0`. AboutSheet reflects this automatically via the `__APP_VERSION__` build-time constant — no manual AboutSheet edit needed. Pattern identical to Phase 39 (v1.12 release).

**PROJECT.md Validated-List Granularity (hybrid):**
- **D-02:** Phases 40, 41, and 42 use the v1.12-style per-requirement-ID treatment in the Validated list. These phases have clean REQUIREMENTS.md IDs (`NAV-HAM-01..05`, `FAV-01..07`, `UAC-01..09`, `UAC-ARCH-01..05`, `UAC-TEST-01..04`, etc.). Flip each from Pending to ✓ validated; group under a Phase-keyed section header. Faithful, traceable.
- **D-03:** Phase 42.1 and the post-42.1 follow-up work use **narrative bullet summaries** in the Validated list (no forced requirement-ID fabrication). Phase 42.1 had 33 CONTEXT decisions with D-* numbers and 6 plans — the decisions are tracked in `42.1-CONTEXT.md`, not REQUIREMENTS.md. The Validated entry reads as a short prose summary of what shipped, with phase-tag `— v1.13 (Phase 42.1)`.
- **D-04:** Update PROJECT.md Current State section to reflect v1.13.0 shipped status. Summary prose should mention: 5 calculators live (Morphine, Formula, GIR, Feeds, UAC/UVC), favorites-driven nav with hamburger menu, design polish sweep completed, clinical-safety STOP-red carve-out.

**How to Record the 42.2 Critique Sweep + STOP-Red + Follow-Ups (explicit labels):**
- **D-05:** Add a distinct section in the Validated list under the v1.13 group, explicitly labeled `— v1.13 (Phase 42.1 follow-up + 42.2 critique sweep)`. Does NOT create a synthetic Phase 42.2 requirement ID block in REQUIREMENTS.md. Does NOT absorb silently into Phase 42.1. Narrative bullets enumerate:
  - Post-42.1 polish wave (em-dash purge, Amber rescope, RangedNumericInput unification, drawer UX, mobile-nav centering, PWA meta)
  - 42.2 impeccable critique sweep — harden/clarify/distill/shape/layout/polish (29 → 35/40)
  - Clinical-safety carve-out: STOP red on severe-neuro (Red-as-Error rule single authorized exception)
  - InputsRecap desktop-hide refinement (redundant with sticky sidebar)
- **D-06:** Capture the specific commit hashes for the post-42.1 sweeps in the Validated bullets so git history is easy to reach: `1ce4493` (42.2 sweep), `8fde90e` (STOP-red), `390aba6` (recap desktop-hide).

**Verification Debt Triage (quick triage):**
- **D-07:** Before the version bump, spot-check the 7 `human_needed` items across `40-VERIFICATION.md` and `41-VERIFICATION.md` flagged by `/gsd-progress`:
  - Items that are trivially verifiable from code/test state (e.g. "33 new tests land, full suite is 260/260") — mark ✓ in the VERIFICATION.md and continue.
  - Items that require manual verification on a real device (e.g. iOS PWA QA) — move to release-notes reminders and backlog for v1.14.
  - Items that indicate genuine gaps — flag as pre-release blockers; fix before bump.
- **D-08:** Triage output should land as a short updated block in each VERIFICATION.md with per-item status (verified-via-grep, manual-QA-needed, or fix-required). Not a new phase, not a new plan — inline grooming during Phase 43 execution.

**Orphan Planning Artifacts (delete):**
- **D-09:** Delete `.planning/HANDOFF.json` (stale from the 42.1 pause; all work described is complete and superseded by the 42.2 sweep + STOP-red commits).
- **D-10:** Delete `.planning/phases/42.1-design-polish-sweep-impeccable-critique-remainder-onboard-co/.continue-here.md` (same reason). The phase is closed; the pause checkpoint is noise at this point.
- **D-11:** Do this cleanup as part of the Phase 43 plan, not as a separate housekeeping commit. Single commit titled appropriately, with brief rationale referencing the commits that superseded them.

**iOS Smoke Test as Release Gate (soft reminder):**
- **D-12:** Do NOT block the v1.13.0 version-bump merge on real-iPhone verification. Playwright mobile emulation + the two iOS-specific fixes that shipped post-42.1 (`drawer position:fixed` → `flex-end`, textbox keyboard focus via `sheet.contains()`) give us sufficient confidence to ship.
- **D-13:** Add a release-notes reminder (surface in the Phase 43 SUMMARY.md and in PROJECT.md Current State): "Verify drawer + keyboard + STOP-red contrast on a real iPhone in standalone PWA mode post-deploy". Non-blocking. If the manual QA surfaces a regression, it becomes v1.13.1 hotfix fuel, not a v1.13.0 blocker.

**Final Gate (carried forward from Phase 39 / v1.12):**
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

### Deferred Ideas (OUT OF SCOPE)

- **Hide InputsRecap on desktop** — Already shipped as commit `390aba6` before Phase 43 kickoff. Pre-release polish; not Phase 43 work.
- **Real-iPhone iOS PWA smoke test** — Per D-12, not a release blocker. Surface as a release-notes reminder. v1.13.1 hotfix fuel if a regression is found. Candidate v1.14 housekeeping.
- **Verification-debt items that require manual QA** — Per D-07 triage: items in `40-VERIFICATION.md` / `41-VERIFICATION.md` that can't be verified from code state land in a v1.14 backlog entry, not as Phase 43 blockers.
- **Impeccable critique P1-P3 remainder** — 4 issues below P0 (HeroResult children-as-default, mobile scroll-to-hero on row select, Morphine hero reading order, largeChange caption color). Not Phase 43 scope; parking for post-release follow-up or v1.14 design pass.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REL-01 | `package.json` bumped to `1.13.0`; AboutSheet reflects new version via existing `__APP_VERSION__` build-time constant | `package.json:4` is `"version": "1.12.5"` [VERIFIED via Read]. `vite.config.ts:11` defines `__APP_VERSION__: JSON.stringify(pkg.version)` reading from `pkg = JSON.parse(readFileSync('package.json', ...))` [VERIFIED via Read]. Bump is a single-character-class edit; no AboutSheet code change needed. |
| REL-02 | PROJECT.md Validated list updated with v1.13 entries at milestone completion | PROJECT.md is 196 lines [VERIFIED via wc]. Validated section starts line 17, ends line 105 (last v1.12 bullet). Active section header at line 107, Current Milestone at 109, Context at 130, Constraints at 150, Key Decisions at 158. v1.12 entries at lines 101-105 are the canonical template (D-02). |
| REL-03 | Final gates: svelte-check 0/0, vitest fully green, `pnpm build` ✓, Playwright E2E + axe sweeps green (extends 20/20 sweeps with UAC/UVC + hamburger variants) | `pnpm check` baseline: 0 errors / 0 warnings / 4571 files [VERIFIED in this session]. `pnpm test:run` baseline: 340 passed / 36 files [VERIFIED]. `pnpm build` baseline: exits 0, `built in 6.80s`, 45 PWA precache entries [VERIFIED]. Playwright: 102 tests in 16 files [VERIFIED via `--list`]; **2 pre-existing failures observed** (see Step 5 below). |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **Tech stack** locked: SvelteKit 2 + Svelte 5 + Tailwind CSS 4 + Vite 8 + pnpm — no version-bump-during-release shenanigans.
- **No native** (PWA only) — favicon/manifest already correct.
- **Offline-first** — service worker registered via `@vite-pwa/sveltekit`; release build verifies manifest.
- **WCAG 2.1 AA** with 48px touch targets — axe-core gate enforces this.
- **GSD Workflow Enforcement** — all edits MUST go through GSD commands; this phase opens via `/gsd-execute-phase` after planning.

## Architectural Responsibility Map

This is a release/docs phase, not a runtime feature, but the changes still
touch multiple tiers:

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Version constant | Build-time (Vite define) | — | `__APP_VERSION__` is a compile-time string substitution; no runtime IO. |
| Version display in AboutSheet | Frontend (SSR + hydration) | — | AboutSheet reads `appVersion` constant from `about-content.ts:12` (which references `__APP_VERSION__`); render path is client-only post-hydration. |
| PROJECT.md / REQUIREMENTS.md / ROADMAP.md updates | Documentation (planning artifacts) | — | Markdown only; no code path. |
| HANDOFF.json / .continue-here.md deletion | Documentation (planning artifacts) | — | Stale orphan files; deletion is a `git rm` on planning artifacts only. |
| Quality gate sweep | CI/Tooling (svelte-check, vitest, Playwright, build) | — | Read-only verification; no source-code mutation unless gate fails (then debug-loop applies). |

**No multi-tier surprises.** The only place where misassignment could happen is
treating the version bump as a code change — it isn't; it's a build-time
constant injection that the frontend consumes through a single read-only path.

## Standard Stack

This phase adds nothing. Versions verified via `package.json` and `pnpm` resolutions:

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| svelte-check | ^4.4.2 | Type/svelte semantic gate | Already wired as `pnpm check`; baseline 0/0 [VERIFIED] |
| vitest | ^4.1.4 | Unit + component tests | 340/340 currently [VERIFIED] |
| @playwright/test | ^1.59.1 | E2E gate | Installed; chromium browser confirmed at `~/.cache/ms-playwright/chromium_headless_shell-1208/` [VERIFIED via ls] |
| @axe-core/playwright | ^4.11.2 | A11y gate | 7 spec files: morphine-wean-a11y, fortification-a11y, gir-a11y, feeds-a11y, uac-uvc-a11y, favorites-nav-a11y, disclaimer-banner.spec.ts (uses axe imports) [VERIFIED via grep] |
| @sveltejs/adapter-static | ^3.0.10 | Build adapter | `pnpm build` produces `build/` SPA + 200.html [VERIFIED] |

**No installation needed.** Phase 43 does not add or upgrade any dependency.

**Version verification of recommendation table:** All version constraints in
this table come directly from `package.json` lines 24-51 [VERIFIED via Read].
No registry hits needed because we're not picking versions, just running the
existing toolchain.

## Architecture Patterns

### System Architecture Diagram

```
                ┌─────────────────────────────────────────┐
                │  package.json   "version": "1.12.5"     │
                │  (single source of truth)               │
                └──────────────┬──────────────────────────┘
                               │ readFileSync at config-load time
                               ▼
                ┌─────────────────────────────────────────┐
                │  vite.config.ts:11                      │
                │  __APP_VERSION__: JSON.stringify(...)   │
                │  (build-time string constant)           │
                └──────────────┬──────────────────────────┘
                               │ injected at compile time
                               ▼
                ┌─────────────────────────────────────────┐
                │  src/lib/.../about-content.ts:12        │
                │  const appVersion = __APP_VERSION__     │
                └──────────────┬──────────────────────────┘
                               │ consumed by all 5 calculator entries
                               ▼
                ┌─────────────────────────────────────────┐
                │  AboutSheet.svelte                      │
                │  Renders "v1.13.0" in dialog header     │
                └─────────────────────────────────────────┘

   ┌─── PHASE 43 EDITS ───────────────────────────────────────┐
   │                                                          │
   │  package.json          1.12.5 → 1.13.0   (REL-01)        │
   │  .planning/PROJECT.md  Validated + Current State (REL-02)│
   │  .planning/REQUIREMENTS.md  41 status flips    (REL-02)  │
   │  .planning/ROADMAP.md  Phase 43 row → Complete           │
   │  .planning/HANDOFF.json                  → DELETED       │
   │  42.1/.continue-here.md                  → DELETED       │
   │  40-VERIFICATION.md, 41-VERIFICATION.md  → triage block  │
   │                                                          │
   │  Final gate: pnpm check / test:run / build / playwright  │
   │              (REL-03)                                    │
   └──────────────────────────────────────────────────────────┘

   Component Responsibilities (file → role):
   - package.json — version field; only line 4 mutates
   - vite.config.ts — UNCHANGED (already correctly wired)
   - src/app.html — UNCHANGED (meta description already covers 5 calculators
     including UAC/UVC at line 41-43, set by commit 41b6e6b)
   - .planning/PROJECT.md — Validated list append + Current State rewrite
   - .planning/REQUIREMENTS.md — Traceability table status column updates
   - .planning/ROADMAP.md — Progress row for Phase 43 + milestone "shipped"
```

### Recommended Project Structure

No structural changes. The release phase only edits files that already exist.

### Pattern 1: Version Bump (clone of Phase 39 / commit ec50793)

**What:** Single-line `package.json` edit + Validated-list append + Current
State rewrite, as one commit. Phase 39's `ec50793` shows the exact diff shape.

**When to use:** Every release phase. This is the canonical template.

**Example (verbatim from `git show ec50793 -- .planning/PROJECT.md`):**
```diff
-**Shipped:** v1.11 Morphine Mode Removal — Single Source of Truth (2026-04-09) — ...
-**In progress:** v1.12 Feed Advance Calculator — Phase 38 ...
+**Shipped:** v1.12.0 Feed Advance Calculator (2026-04-10) — Fourth clinical calculator ...
```
For Phase 43:
```diff
-**Shipped:** v1.12.0 Feed Advance Calculator (2026-04-10) — ...
+**Shipped:** v1.13.0 UAC/UVC Calculator + Favorites Nav (2026-04-24) — Fifth ...
```

### Pattern 2: Validated-List Append (Phase 39 §"PROJECT.md Validated section")

**What:** Bullets follow `- ✓ <description with requirement IDs in parens> — vX.Y` format.
Phase 39 added 5 v1.12 bullets, one per phase (36/37/38/39).

**When to use:** D-02 phases (Phase 40, 41, 42) follow this pattern. The
diff at `git show ec50793 -- .planning/PROJECT.md` shows the exact shape.

### Pattern 3: Narrative Bullets for ID-less Phases (D-03 + D-05)

**What:** Phase 42.1 + post-42.1 work has no clean REQUIREMENTS.md IDs. Use
prose bullets: short imperative summary + commit hash references where useful.

**Example shape (suggested):**
```markdown
- ✓ Phase 42.1 Design Polish + Redesign Sweep: HeroResult shared contract,
  DisclaimerBanner v1→v2 migration, mobile-nav clearance fix, dock magnification
  removal, hero-fills-viewport InputDrawer pattern across all 5 routes (6 plans,
  closed at commit 1826069) — v1.13 (Phase 42.1)
- ✓ Phase 42.1 follow-up + 42.2 critique sweep: post-critique fixes
  (em-dash purge `e66e7bf`, Amber rescope `b548ce4`, HeroResult display-numeral
  rule `86c5a6c`, RangedNumericInput unification `0558253`, drawer + nav
  clearance polish `c20128d` `045edc0` `371e1e7` `af6ee9c`, PWA meta refresh
  `41b6e6b`); 42.2 impeccable critique sweep harden/clarify/distill/shape/
  layout/polish (29→35/40, commit `1ce4493`); STOP-red clinical-safety
  carve-out as the single authorized exception to the Red-as-Error rule
  (commit `8fde90e`); InputsRecap desktop-hide (commit `390aba6`)
  — v1.13 (Phase 42.1 follow-up + 42.2 critique sweep)
- ✓ `package.json` version bumped to 1.13.0; AboutSheet reflects v1.13.0 via
  the `__APP_VERSION__` build-time constant; PROJECT.md Validated list updated
  with v1.13 entries (REL-01..03) — v1.13 (Phase 43)
```

### Anti-Patterns to Avoid

- **Manual AboutSheet edit:** `__APP_VERSION__` is the single source of truth.
  Editing `about-content.ts` for the version is wrong. [VERIFIED:
  `vite.config.ts:11` + `package.json:4` → `about-content.ts:12`]
- **Forgetting REQUIREMENTS.md status column:** 41 IDs are still marked
  Pending [VERIFIED via `grep "Pending" .planning/REQUIREMENTS.md` count=41].
  REL-02 implies these flip too — Phase 39's plan covered this implicitly via
  "PROJECT.md Validated list updated", but the traceability table in
  REQUIREMENTS.md is a second touchpoint that must move from Pending to ✓ Validated.
- **Splitting orphan-artifact deletion into a separate commit:** D-11 explicitly
  forbids this. Single commit, brief rationale.
- **Ignoring the two pre-existing Playwright failures:** D-15 forbids "known
  issue" deferrals on the clinical-safety gate. Both must be fixed before bump.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Version display in UI | Manual hardcode in AboutSheet | `__APP_VERSION__` already wired | Single source of truth via `vite.config.ts:11` define; clones cleanly to AboutSheet |
| Multi-target favicon generation | Per-size hand-export | (N/A — already shipped in v1.12 Phase 39 commit `a9d2fa2`) | Phase 39 used ImageMagick `convert -resize` against `static/favicon.svg`; favicon is unchanged in v1.13 |
| Custom Validated-list format | Bespoke YAML / JSON | Existing markdown bullet pattern | 100+ existing bullets follow `- ✓ description (REQ-IDs) — vX.Y` shape; consistent and grep-friendly |

**Key insight:** Phase 39 already solved every infrastructure problem
(version constant, favicon pipeline, Validated-list format). Phase 43 reuses
all of it; nothing new to design.

## Runtime State Inventory

> Phase 43 is a docs/release phase. The version bump is the only "rename"-style
> change, and it is consumed by exactly one constant resolution chain.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — `localStorage` keys (`nicu:favorites`, `nicu_assistant_theme`, per-calculator `nicu_*_state*`) do not embed version strings; service worker `precache` cache will revalidate naturally on next deploy | None |
| Live service config | None — no external services |
| OS-registered state | PWA service worker precache will refresh on `Update Prompt` accept (`registerType: 'prompt'` per `vite.config.ts:17`); released users may run v1.12.5 SW until they accept the update prompt — this is intentional | Release-notes reminder D-13 already covers this |
| Secrets/env vars | None |
| Build artifacts | `build/` directory is rewritten on every `pnpm build`; no stale `.egg-info`-style artifacts | None |

**Nothing found in category 'live service config' or 'secrets/env vars':**
verified by grep for `1.12` across `src/` and `static/`:
```
src/lib/**/about-content.ts:12 — uses appVersion (the constant, not a literal)
vite.config.ts:11 — uses pkg.version (read from package.json)
```
No literal `1.12.5` strings exist in source code that would need updating.
[VERIFIED via reading the relevant files]

## Common Pitfalls

### Pitfall 1: Forgetting REQUIREMENTS.md traceability flip

**What goes wrong:** Plan covers PROJECT.md Validated list (REL-02 says
"Validated list updated") but leaves the REQUIREMENTS.md traceability table
showing 41 IDs as `Pending` after release.

**Why it happens:** Phase 39's plan didn't make the REQUIREMENTS.md flip
explicit because v1.12 used a different REQUIREMENTS.md schema (no
traceability table). v1.13 introduced the traceability table; the planner
must add an explicit task line.

**How to avoid:** Plan task should call out "update Status column from
Pending to ✓ Validated for all 41 v1.13 IDs". The 3 REL-* rows flip last,
once REL-03 gate is green.

**Warning signs:** `grep -c "Pending" .planning/REQUIREMENTS.md` after the
release commit should be 0 for v1.13 IDs.

### Pitfall 2: The two pre-existing Playwright failures

**What goes wrong:** Final gate (D-14 / REL-03) tries to assert "Playwright
E2E green in both themes". But two tests fail at this commit:

1. **`e2e/uac-uvc.spec.ts:98 — UAC/UVC happy path (mobile) > weight textbox
   has inputmode="decimal" (regression guard)`** [VERIFIED reproducible via
   `pnpm exec playwright test --project=chromium --workers=1 e2e/uac-uvc.spec.ts -g "weight textbox has inputmode"` in this session]
   - Symptom: `Test timeout of 30000ms exceeded while running "beforeEach" hook.`
   - Root: `await page.getByLabel('Open inputs drawer').click()` at line 64
     never finds the drawer button.
   - Likely cause: `test.use({ viewport })` inside the per-iteration
     `test.describe` does not apply the mobile viewport on this Playwright
     version; the page renders desktop-style and the InputDrawer trigger has
     `md:hidden` styling making it invisible. The page snapshot
     (`test-results/uac-uvc-UAC-UVC-happy-path-07d40-.../error-context.md`)
     confirms a desktop layout (top tablist with all 4 tabs visible) was
     rendered instead of the 375px mobile shell.
   - Desktop iteration of the same test passes [VERIFIED in same run].

2. **`e2e/morphine-wean-a11y.spec.ts:87 — morphine wean advisory message has
   no axe violations in light mode`** [VERIFIED reproducible via
   `pnpm exec playwright test --project=chromium --reporter=line e2e/morphine-wean-a11y.spec.ts -g "no axe violations in light mode"` in this session — `1 passed, 1 failed`]
   - Symptom: axe-core surfaces a violation when the morphine-wean advisory
     state is rendered in light mode.
   - Root: not investigated in research scope; likely related to recent
     Amber rescope (commit `b548ce4`) or RangedNumericInput unification
     (commit `0558253`) changing color tokens.
   - Light "primary" axe sweep (no advisory) passed in the same isolated run.

**Why it happens:** Both failures pre-date Phase 43 — they were not surfaced
because Phase 41/42 verifications were `human_needed` status and the full
suite hasn't been re-run cleanly between Phase 41 ship and Phase 43 kickoff.
The Phase 41 VERIFICATION.md (lines 130-138) acknowledges 2 OTHER pre-existing
navigation.spec failures (about-button locator) that are now FIXED at this
commit (per the Phase-40 followup that moved About into the hamburger
drawer); but these two new ones are different failures that emerged later.

**How to avoid:** Plan must include a pre-bump fix task explicitly scoped to:
- Diagnose `uac-uvc.spec.ts` mobile-viewport beforeEach failure. Likely
  fix: convert `test.describe(...)` + `test.use({ viewport })` into
  per-test `test.use({ viewport })` calls, OR use `test.beforeEach` with
  `await page.setViewportSize(...)`.
- Diagnose morphine-wean advisory axe regression. Read the axe-core
  violation output, identify the element + rule (likely color-contrast or
  aria), fix in `MorphineWeanCalculator.svelte` or relevant token.

**Warning signs:** D-15 enforces "no known-issue deferrals" — both must be
green before REL-03 can be marked satisfied. Surface these in the plan as
explicit pre-bump tasks (Task 4 in the recommended single-plan structure
above).

### Pitfall 3: Old Phase 41 VERIFICATION.md references obsolete failures

**What goes wrong:** `41-VERIFICATION.md` lines 130-138 lists 2 pre-existing
`navigation.spec.ts` failures: "top title bar shows app name, info, and
theme toggle" + "info button opens the about sheet". Both look for an About
button in the header that was moved to the hamburger drawer.

**Why it happens:** Phase 40 moved About into the hamburger drawer (commit
`00e66f8`), but Phase 41's verification didn't update the spec — it just
flagged the failures as out-of-scope.

**Check current state:** `pnpm exec playwright test --list` [VERIFIED in
this session] shows the spec at line 81 is now
`navigation.spec.ts:81:3 › Navigation (v1.2 restructure) › hamburger drawer About row opens the about sheet`
— so the spec WAS updated at some point (likely during Phase 42.1 e2e
cleanup, commit `c2800df` "test(42.1-05): adapt e2e specs for hero-drawer
shell on mobile"). This means the 2 failures called out in
`41-VERIFICATION.md` are NO LONGER FAILING. The triage task in Phase 43
should mark these `human_needed` items in 41-VERIFICATION.md as ✓
verified-via-grep / now-passing.

**How to avoid:** Triage task (D-07/D-08) should grep the current state
of the 7 `human_needed` items in 40-VERIFICATION.md + 41-VERIFICATION.md
against current code/tests before assuming they need manual QA.

## Code Examples

### Version bump (Task: clone of Phase 39 commit ec50793)

```diff
# package.json (line 4)
-  "version": "1.12.5",
+  "version": "1.13.0",
```

```typescript
// vite.config.ts:7-12 — UNCHANGED (already correctly wired)
const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version)
  },
  ...
});
```

[VERIFIED via Read of both files]

### REQUIREMENTS.md status flip (41 rows, Phase-by-Phase)

```diff
-| UAC-01 | Phase 42 | Pending |
+| UAC-01 | Phase 42 | ✓ Validated |
```
Apply to all 41 rows currently `Pending` (REL-01..03 flip LAST, after
REL-03's gate is green). [VERIFIED: 41 rows currently match `Pending` in
the traceability table, lines 108-148.]

### PROJECT.md Current State paragraph (rewrite, follows Phase 39 template)

```diff
-**Shipped:** v1.12.0 Feed Advance Calculator (2026-04-10) — Fourth clinical calculator added: ...
+**Shipped:** v1.13.0 UAC/UVC Catheter + Favorites Nav (2026-04-24) — Fifth clinical calculator added: UAC/UVC umbilical-catheter depth (`weight × 3 + 9` cm and half-depth UVC) using `uac-uvc-calculator.xlsx`; new hamburger menu lists every registered calculator with star toggles; favorites-driven nav (max 4) replaces the static bottom bar with first-run defaults `['morphine-wean', 'formula', 'gir', 'feeds']` preserving the v1.12 layout for existing users. Design polish sweep: HeroResult shared contract, DisclaimerBanner v1→v2, mobile-nav clearance correct against 3.5rem nav + 1px border, hero-fills-viewport InputDrawer across all 5 routes, dock magnification removed, RangedNumericInput unification, scoped CSS transitions. Clinical-safety carve-out: STOP-red on severe-neuro GIR (single authorized exception to Red-as-Error rule). PWA at version 1.13.0; svelte-check 0/0, vitest 340/340, Playwright + extended axe suite green (UAC/UVC + hamburger variants in both themes).
```

(Counts will update during the gate sweep — 340 is the current baseline;
the planner should treat the count as "TBD-at-gate-time".)

### Orphan deletion (D-09/D-10/D-11)

```bash
git rm .planning/HANDOFF.json
git rm .planning/phases/42.1-design-polish-sweep-impeccable-critique-remainder-onboard-co/.continue-here.md
```

Single commit per D-11. Suggested commit subject:
`chore(43): remove stale 42.1 handoff artifacts (superseded by 1ce4493/8fde90e/390aba6)`

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `_ids = $state<CalculatorId[]>([])` (empty seed, requires `init()` to populate) | `_ids = $state<CalculatorId[]>(defaultIds())` (D-07 in Phase 41) | Phase 41 commit `41-01` | Module-scope default seed means SSR / pre-init-hydration renders nav with 4 default favorites instead of 0; relevant only as background — no Phase 43 action |
| About button in title bar (Info icon) | About row inside HamburgerMenu drawer | Phase 40 commit `00e66f8` | `e2e/navigation.spec.ts` test renamed to `hamburger drawer About row opens the about sheet` (line 81 per Playwright `--list`) — verified in this session |
| Per-calculator inline Slider blocks | Shared `RangedNumericInput` (textbox + slider) | Post-42.1 commit `0558253` | Used by all 5 calculators including UAC/UVC; weight ranges normalized to 0.3-10 kg step 0.1 |
| Hero fills viewport, inputs in fixed sticky aside (desktop) / drawer (mobile) | Same pattern shipped Phase 42.1-05; `InputDrawer` polished by 6 follow-up commits | Phase 42.1 + post-42.1 (`5bebe3a`, `c20128d`, `045edc0`, `371e1e7`, `af6ee9c`) | All 5 routes use `getInputsScope` helper to disambiguate the dual-render layout (sticky aside on md+, drawer on mobile) — affects e2e spec strategy |
| InputsRecap visible at all viewports | Hidden at md+ (commit `390aba6`) | Pre-Phase-43 polish | Test (`InputsRecap.test.ts`?) updated to assert desktop group role absent |

**Deprecated/outdated:**
- `dock-magnification` mobile pattern: removed in Phase 42.1-04 (per
  HANDOFF.json `decisions` block).
- `--color-amber-*` as a generic warning token: rescoped to BMF-only by
  commit `b548ce4`.
- `WeanMode` / `calculateCompoundingSchedule`: deleted in v1.11 (Phase 35);
  no v1.13 action.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The two pre-existing Playwright failures (`uac-uvc.spec.ts` mobile, `morphine-wean-a11y.spec.ts` light advisory) are tractable within Phase 43's pre-bump fix task and won't require deeper architectural work. | Pitfalls §2 | If either fix turns into a multi-hour rabbit hole, Phase 43 timeline expands; the planner may need to plan a contingency for splitting one off as a v1.13.1 hotfix instead of blocking the bump. Recommend: time-box each fix to ~30 minutes; if not resolved, escalate to user (per D-15 there is no "skip" option, so this becomes a blocker conversation, not a deferral). |
| A2 | The 7 `human_needed` items in 40-VERIFICATION.md (4 items) and 41-VERIFICATION.md (4 items, total 8 — research found 8 not 7; CONTEXT D-07 says "7", suggest planner double-check) are mostly verifiable from current code state. | Verification debt §3 | If most items genuinely require iOS-real-device testing, Phase 43's triage task balloons. Mitigation: D-07 rubric explicitly allows shifting to v1.14 backlog. |
| A3 | Phase 43 is a single linear plan, not multi-plan. CONTEXT.md `<specifics>` strongly suggests this; Phase 39 also used 1 plan. | Summary §"Primary recommendation" | If splitting is needed (e.g., orphan cleanup as a separate commit), the planner can override per CONTEXT "Claude's Discretion". |
| A4 | The `Pending` count in REQUIREMENTS.md traceability table (41) matches the 41 v1.13 IDs verbatim. | Pitfalls §1 | [VERIFIED in this session via grep] — count is exactly 41 Pending rows, all v1.13 IDs. No risk. |
| A5 | The morphine-wean advisory axe failure is a token regression (Amber rescope or RangedNumericInput unification) not a structural a11y bug. | Pitfalls §2 | Not investigated; could be a missing `aria-label` or focus-ring contrast issue requiring more than a token tweak. Recommend the fix task starts with `pnpm exec playwright test e2e/morphine-wean-a11y.spec.ts -g "advisory"` to read the axe violation output before assuming a fix shape. |

## Open Questions (RESOLVED)

1. **Should the 2 pre-existing Playwright failures live in their own
   pre-bump-fix plan, or as Tasks within the single Phase 43 plan?**
   - What we know: D-15 says no "known-issue deferrals". Phase 39's release
     plan absorbed similar fixes (GIR contrast bug, navigation.spec tab count)
     as Task 3 deviations, not as separate plans.
   - What's unclear: whether these 2 failures may surface 3rd-order issues
     during the fix that warrant a clean separation.
   - Recommendation: Single plan, Task 4 = "Pre-bump fix: triage 2 pre-existing
     Playwright failures". If the morphine-wean axe regression turns out to be
     a P1 design issue, escalate to user mid-flight.

2. **Does the Phase 42.1 narrative bullet (D-03) need to be updated for the
   42.2 sweep + STOP-red + recap-hide commits, or are those already covered
   by the separate D-05 narrative bullet?**
   - What we know: D-05 explicitly creates a separate `— v1.13 (Phase 42.1
     follow-up + 42.2 critique sweep)` bullet for those commits. Phase 42.1's
     own bullet (D-03) covers ONLY the 6 plans that closed at commit `1826069`.
   - What's unclear: whether the planner should write 1 phase-42.1 bullet
     (6 plans only) + 1 follow-up bullet, or a single combined bullet.
   - Recommendation: 2 bullets per D-03 + D-05 explicit-labels decision.
     Combined would lose the explicit labeling that D-05 mandates.

3. **Does PROJECT.md "Current Milestone" section need rewriting from "v1.13
   UAC/UVC Calculator + Favorites Nav (in progress)" to "v1.13 (Shipped)"?**
   - What we know: Phase 39's diff at line 109 of PROJECT.md updated
     `## Current Milestone: v1.12 Feed Advance Calculator` → `## Current
     Milestone: v1.12 Feed Advance Calculator (Shipped)` and replaced the
     "Target features" list with a one-paragraph "Shipped." prose block.
   - What's unclear: whether this is REL-02 scope or post-release cleanup.
   - Recommendation: yes, include in REL-02 scope (matches Phase 39 pattern;
     leaving "in progress" verbiage in the doc after release is a documentation
     bug). The planner should explicitly call this out as a sub-task.

4. **Do `.planning/STATE.md` and `.planning/ROADMAP.md` get updated in
   Phase 43, or are those handled by `/gsd-complete-milestone` afterward?**
   - What we know: ROADMAP.md line 163 currently shows `| 43. Release v1.13.0
     | v1.13 | 0/? | Not started | — |`. STATE.md frontmatter shows
     `stopped_at: Phase 43 context gathered`. After release these need to
     update to "Complete" / shipped state. Phase 39 followed up with a
     separate `446cbd4 chore: archive v1.12 Feed Advance Calculator
     milestone` after the release commit.
   - What's unclear: whether this archive step is part of Phase 43 or a
     separate "milestone close" command.
   - Recommendation: ROADMAP.md row update (Phase 43 → Complete) IS
     Phase 43 scope (REL-02 spirit). Milestone archive (move v1.13 phases to
     `milestones/v1.13-phases/` directory + create
     `milestones/v1.13-ROADMAP.md`) is `/gsd-complete-milestone`'s job, NOT
     Phase 43's.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | All scripts | ✓ | (per pnpm 10.33 host requirements) | — |
| pnpm | All scripts | ✓ | 10.33.0 | — |
| svelte-check | `pnpm check` | ✓ | 4.4.2 | — |
| vitest | `pnpm test:run` | ✓ | 4.1.4 | — |
| @sveltejs/kit | `pnpm build` | ✓ | 2.57.1 | — |
| @playwright/test | `pnpm exec playwright test` | ✓ | 1.59.1 | — |
| Playwright chromium browser | E2E + axe specs | ✓ | chromium_headless_shell-1208 at `~/.cache/ms-playwright/` | — |
| @axe-core/playwright | A11y specs | ✓ | 4.11.2 | — |
| git | Phase 43 commits + orphan deletion | ✓ | — | — |

**All dependencies present.** No install step needed before Phase 43 execution.

## Security Domain

> Required when `security_enforcement` is enabled (absent = enabled).

This phase ships no new code paths and no new attack surface. The version
constant is intentionally public (shown in AboutSheet for clinical
provenance). Same disposition as Phase 39's threat model.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | App is anonymous (Out of Scope per PROJECT.md) |
| V3 Session Management | no | sessionStorage holds non-PII clinical inputs only |
| V4 Access Control | no | No multi-tenant boundary |
| V5 Input Validation | no (this phase) | Existing NumericInput hardening unchanged |
| V6 Cryptography | no | No secrets, no encryption boundaries |
| V12 File Handling | yes (PNG favicons in static/) | Static assets served as inert images; service worker precache integrity |
| V14 Configuration | yes | `package.json` version + `vite.config.ts` PWA manifest are public configuration; no secrets |

### Known Threat Patterns for {SvelteKit + adapter-static + PWA}

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Stale service worker serving v1.12 to user who hasn't accepted update | Information Disclosure (informational, not security) | `registerType: 'prompt'` + non-blocking update banner [VERIFIED in `vite.config.ts:17`] — mitigated by D-13 release-notes reminder |
| Tampered version string injected into AboutSheet | Tampering | `__APP_VERSION__` is build-time constant resolved from `package.json` at config-load — no runtime input path [VERIFIED in `vite.config.ts:11`] |
| Information Disclosure via version string | Information Disclosure | Version is intentionally public (clinical provenance trust signal) — accept |

## Sources

### Primary (HIGH confidence — verified via tool in this session)

- `/mnt/data/src/nicu-assistant/package.json` lines 1-52 (current version `1.12.5`)
- `/mnt/data/src/nicu-assistant/vite.config.ts` lines 1-75 (`__APP_VERSION__` wiring at line 11)
- `/mnt/data/src/nicu-assistant/src/app.html` lines 1-69 (meta description at lines 41-43 already covers UAC/UVC; meta tags v1.13-correct)
- `/mnt/data/src/nicu-assistant/.planning/PROJECT.md` lines 1-196 (Validated section 17-105, Active 107, Current Milestone 109, Context 130)
- `/mnt/data/src/nicu-assistant/.planning/REQUIREMENTS.md` lines 1-163 (41 Pending v1.13 IDs in traceability table)
- `/mnt/data/src/nicu-assistant/.planning/ROADMAP.md` lines 1-172 (Phase 43 row at line 163, milestone definition at line 18)
- `/mnt/data/src/nicu-assistant/.planning/STATE.md` lines 1-75 (frontmatter `stopped_at: Phase 43 context gathered`)
- `/mnt/data/src/nicu-assistant/.planning/HANDOFF.json` lines 1-49 (orphan, last-modified 2026-04-24 11:42, references commit `1826069`)
- `/mnt/data/src/nicu-assistant/.planning/phases/42.1-.../.continue-here.md` lines 1-127 (orphan, last-modified 2026-04-24 11:43, "Phase 43 ... unblocked")
- `/mnt/data/src/nicu-assistant/.planning/phases/40-favorites-store-hamburger-menu/40-VERIFICATION.md` (4 human_needed items, lines 13-25)
- `/mnt/data/src/nicu-assistant/.planning/phases/41-favorites-driven-navigation/41-VERIFICATION.md` (4 human_needed items, lines 7-19)
- `/mnt/data/src/nicu-assistant/.planning/milestones/v1.12-phases/39-release-v1-12/39-CONTEXT.md` (template)
- `/mnt/data/src/nicu-assistant/.planning/milestones/v1.12-phases/39-release-v1-12/39-01-PLAN.md` (template, 3 tasks)
- `/mnt/data/src/nicu-assistant/.planning/milestones/v1.12-phases/39-release-v1-12/39-01-SUMMARY.md` (template — auto-fixed nav tab + GIR contrast bugs)
- `/mnt/data/src/nicu-assistant/.planning/milestones/v1.12-phases/39-release-v1-12/39-VERIFICATION.md` (5/5 truths verified, no human_needed)
- `git show ec50793` (Phase 39 PROJECT.md diff template — verbatim)
- `git show 1ce4493` (42.2 critique sweep — 50 files, all 6 tasks documented in commit body)
- `git show 8fde90e` (STOP-red carve-out — single GirCalculator change with full clinical-safety rationale)
- `git show 390aba6` (recap desktop-hide — InputsRecap.svelte single behavior change)
- `git log --format="%h %s" 1826069..HEAD` (21 commits since Phase 42.1 close, validated against HANDOFF.json `completed_tasks` block)
- `pnpm check` baseline run (0 errors, 0 warnings, 4571 files)
- `pnpm test:run` baseline run (340 tests, 36 files, all passing)
- `pnpm build` baseline run (exits 0, 45 PWA precache entries, 549.70 KiB)
- `pnpm exec playwright test --list` (102 tests in 16 files)
- `pnpm exec playwright test e2e/uac-uvc.spec.ts -g "weight textbox has inputmode"` (REPRODUCED mobile failure)
- `pnpm exec playwright test e2e/morphine-wean-a11y.spec.ts -g "no axe violations in light mode"` (REPRODUCED light-advisory failure)
- `ls ~/.cache/ms-playwright/` (browser binaries present)

### Secondary (MEDIUM confidence)

- N/A — no web sources consulted for this phase. Everything was direct
  filesystem + git + tool inspection.

### Tertiary (LOW confidence)

- N/A.

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — every version verified against `package.json`
- Architecture: HIGH — diagram traced from `package.json` → `vite.config.ts` → `about-content.ts` → AboutSheet via direct file reads
- Pitfalls: HIGH — two Playwright failures reproduced in this session; Phase 41 obsolete-failure note grep-checked
- Patterns: HIGH — Phase 39 template extracted verbatim from commit `ec50793` and from `39-01-PLAN.md`
- Verification debt: MEDIUM — 8 human_needed items identified by reading the files; CONTEXT.md says 7 (one-off discrepancy worth noting)
- Orphan artifacts: HIGH — both files confirmed present with timestamps and contents read

**Research date:** 2026-04-24
**Valid until:** 2026-05-08 (14 days; release toolchain is stable, no
upstream churn expected; if planning slips beyond this, re-run gate
baselines because dependencies could be patch-bumped by automated tools)

---

*Phase: 43-release-v1-13-0*
*Researched: 2026-04-24*
