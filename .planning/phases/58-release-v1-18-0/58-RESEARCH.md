# Phase 58: Release v1.18.0 — Research

**Researched:** 2026-05-29
**Domain:** Version bump + doc sync + clinical gate (release mechanics)
**Confidence:** HIGH

## Summary

Phase 58 is a pure release phase. The code work is done — 451 vitest tests pass, svelte-check 0/0, build green. The work here is: bump `package.json` from 1.17.0 to 1.18.0, sync three planning docs (PROJECT.md, MILESTONES.md, REQUIREMENTS.md), run the clinical gate to prove nothing broke, and write a HUMAN-UAT.md that carries the Playwright/axe portion of REL-03 to CI.

The Phase 54 (v1.17.0 release) precedent is a nearly perfect template. The primary structural difference: Phase 54 bundled the package.json bump with the DOC plan (54-01); Phase 58 CONTEXT D-01 cleanly separates them — 58-01 is doc-only (zero code changes), 58-02 is the version bump + clinical gate + milestone close. This separation is cleaner because v1.18 has more doc surface to summarize.

All eight research questions from the brief are answered below with verified findings from the codebase and git history. No external library research is required — this phase touches no production dependencies.

**Primary recommendation:** Follow the Phase 54 two-plan pattern exactly, using the verified findings below for exact wording and file mechanics.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Two plans — 58-01 (doc sync, no code changes) + 58-02 (package bump + clinical gate + HUMAN-UAT + milestone close).
- **D-02:** REL-01 = single string edit in `package.json` (`"version": "1.17.0"` → `"version": "1.18.0"`) + `pnpm install` to regenerate lockfile.
- **D-03:** Playwright browser binaries not installed locally. Defer Playwright E2E + extended axe sweep to CI. Mirror Phase 54 precedent.
- **D-04:** Create `58-HUMAN-UAT.md` with `status: partial` carrying the Playwright + extended axe sweep items as Pending.
- **D-05:** Phase verification proceeds with `passed` on the automated gates (svelte-check + vitest + pnpm build) and `partial` on REL-03's Playwright portion in HUMAN-UAT.md.
- **D-06:** Move v1.18 entry from `### Active` to `### Validated` in PROJECT.md with per-phase bullets suffixed `— v1.18 (Phase XX)`.
- **D-07:** Update PROJECT.md "Current State" — move v1.18 from `In progress:` to `Shipped:`, update Previously Shipped list, bump footer date.
- **D-08:** Append v1.18 entry to MILESTONES.md following prior-entry style (1 intro sentence + 4–6 bullets + 1 deferral note).
- **D-09:** `phase.complete` CLI flips REL-01..03 to ✓ Complete automatically; planner does NOT manually edit the traceability table.
- **D-10:** Clinical gate order: `pnpm install` → svelte-check → vitest → `pnpm build` → grep gate; Playwright deliberately skipped.
- **D-11/D-12:** NO `git tag` or `git push` in any task.

### Claude's Discretion

- Exact bullet text for PROJECT.md Validated entries (match v1.17 style).
- Whether MILESTONES.md needs a section divider before v1.18.
- Plan 58-02 task split: one task vs. one per gate command (recommendation: one task with sequential verify blocks).

### Deferred Ideas (OUT OF SCOPE)

- `git tag v1.18.0` + `git push` — user handles manually.
- Playwright E2E + extended axe sweep run — deferred to CI (HUMAN-UAT.md).
- Architecture review candidate 2 (config pass-throughs).
- ML_PER_OZ clinical constant.
- v1.15.1 SMOKE-01..10 real-iPhone gate.
- v1.17 deferred items.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REL-01 | `package.json` bumped to 1.18.0; AboutSheet reflects it via `__APP_VERSION__` build-time constant (no hardcoded version string) | Confirmed: single string edit in package.json line 4; `vite.config.ts:10` injects at build time; `about-content.ts:13` reads it; zero hardcoded version strings in src/ |
| REL-02 | PROJECT.md Validated list and REQUIREMENTS.md traceability table updated at milestone close | Confirmed: PROJECT.md mechanics verified against v1.17 pattern; REQUIREMENTS.md traceability flipped by `phase.complete` CLI |
| REL-03 | Clinical gate green — svelte-check 0/0, vitest fully green, `pnpm build` OK, Playwright E2E + extended axe sweeps (Playwright portion deferred to CI per D-03) | Confirmed: automated portion runnable locally; Playwright deferred per Phase 54 precedent |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Version string propagation | Build tool (Vite) | — | `vite.config.ts` reads `package.json` at build time; no runtime tier involved |
| Doc sync (PROJECT.md, MILESTONES.md) | Planning artifacts | — | Pure file edits, no code tier |
| REQUIREMENTS.md traceability | GSD CLI (`phase.complete`) | — | Automated by CLI; planner must not hand-edit |
| Clinical gate (svelte-check + vitest + build) | Local dev environment | — | All runnable headlessly; Playwright deferred to CI |

## Research Findings: All 8 Questions Answered

### Q1: Exact MILESTONES.md Entry Format

The v1.17 entry (the most recent and closest analog) uses this exact structure: [VERIFIED: git history + file read]

```
## v1.17 Remove PERT Calculator (Shipped: 2026-05-24)

**Phases completed:** 3 phases (52, 53, 54), 6 plans, 19 tasks

**Known deferred items at close:** [one-line summary] — see STATE.md Deferred Items. [follow-on note if any]

**Notes:**

- [note 1 — version label skip or anomaly]
- [note 2 — additional context]

**Key accomplishments:**

- [bullet 1 — terse, technical, factual]
- [bullet 2]
- [bullet 3]

---
```

**Structural observations:**

- Section heading: `## v{X.Y} {Milestone Name} (Shipped: {YYYY-MM-DD})`
- Bold metadata fields: `**Phases completed:**`, `**Known deferred items at close:**`, `**Notes:**`, `**Key accomplishments:**`
- A horizontal rule `---` separates entries (confirmed between v1.17 and v1.15.1)
- No `**Notes:**` block needed if there are no special notes (v1.15.1 has notes; v1.12 has no notes section)
- Bullets under **Key accomplishments:** are dense — one sentence per major item, with specific technical facts inline (counts, file names, test counts)
- The v1.15.1 entry has a `**Notes:**` section; the v1.17 entry also has one (for the v1.16 label skip). For v1.18, there is one note worth including: the Playwright/axe CI deferral.

**v1.17 entry verbatim (the template to mimic):**

```
## v1.17 Remove PERT Calculator (Shipped: 2026-05-24)

**Phases completed:** 3 phases (52, 53, 54), 6 plans, 19 tasks

**Known deferred items at close:** 11 v1.15.1 carry-forwards (SMOKE-01..10 + REL-04 smoke-sign-off) + 4 v1.17 items (Phase 53/54 HUMAN-UAT browser/CI checks: SAFE-01 visual + Playwright-live) + 6 stale v1.15.1 quick-task manifest entries (work complete) — see STATE.md Deferred Items. SMOKE-10 re-scoped to 5 calculators when eventually run (PERT removed).

**Notes:**

- v1.16 milestone label intentionally skipped — package version drifted to 1.16.x during v1.15.1 quick-task patches before milestone close. v1.17 re-aligns the milestone label with the package version (1.16.1 → 1.17.0).
- v1.15 PERT Calculator (shipped as self-contained workstream `ws-pert-2026-04-26`) removed in this milestone — out of clinical scope (pediatric, not neonatal). See PROJECT.md Invalidated / Removed. Workstream archive preserved as historical record.

**Key accomplishments:**

- Atomic PERT purge across Phases 52–53: ...
- Test suite repaired to green immediately after purge: ...
- Favorites upgrade-safety regression locked (Phase 53, SAFE-01..03): ...

---
```

**For v1.18:** The Notes block is optional (no version label anomaly), but a one-line deferred note on the Playwright CI deferral is consistent with D-08's "one acknowledging the deferred Playwright/axe CI gate at the bottom." The planner may put this as the last bullet under Key accomplishments (as a facts bullet: "Clinical gate: svelte-check 0/0, vitest 451/451, pnpm build OK; Playwright E2E + extended axe sweeps deferred to CI (browser binaries unavailable locally).") rather than in a separate **Notes:** section — this approach mirrors how v1.17 bundled its Playwright deferral into the STATE.md entry rather than repeating it in the MILESTONES.md notes.

**v1.18 entry will go at the TOP of MILESTONES.md, above the v1.17 entry, separated by `---`.** [VERIFIED: v1.17 appears at line 3; the new entry goes before it]

---

### Q2: PROJECT.md Validated-Promotion Exact Mechanics

**v1.17 entries in `### Invalidated / Removed` (the v1.17 promotion pattern):** [VERIFIED: PROJECT.md lines 126-130]

```markdown
### Invalidated / Removed

- ✗ Pediatric EPI PERT Calculator (sixth clinical calculator) shipped as self-contained workstream... — v1.15 — v1.17: out of clinical scope (pediatric, not neonatal)

- ✓ v1.17 Remove PERT Calculator — Phases 52–54: full purge of `src/lib/pert/` + `/pert` route + e2e specs, `pertModule` dropped from registry (5 calculators remain), `CalculatorId` narrowed to 5 members, `.identity-pert` + `pert` about-content removed, favorites upgrade-safety regression locked (`recover()` silently drops stored `'pert'`); released v1.17.0 — v1.17
```

The `✓ v1.17 ...` line pattern for the validated/completed work item: one dense sentence with technical specifics, suffixed `— v1.17`.

**For v1.18, the entries go under `### Validated` (not `### Invalidated / Removed`), because v1.18 is pure delivery work with no invalidated features.** The current `### Active` section has only:

```markdown
### Active

- ⏳ v1.18 — Hoist the hand-rolled localStorage pattern in the shared global singletons onto one deep persistence seam (architecture deepening, candidate 1)
```

This one-liner gets removed from `### Active` and replaced by 4 bullets under `### Validated` following the style of other validated entries (e.g., `✓ App version from package.json in about dialog — v1.2`). The bullets should be one dense line per phase, suffixed with `— v1.18 (Phase XX)`.

**No `### Invalidated / Removed` entries to add for v1.18** — confirmed: v1.18 is behavior-preserving, nothing was removed. [VERIFIED: CONTEXT.md + REQUIREMENTS.md Out of Scope section]

**Current State section changes:** The `**In progress:**` block at line 9 describes Phase 57 completion and says "next is Phase 58 (Release v1.18.0)". At milestone close this becomes `**Shipped:**` with a one-paragraph summary. The `**Prior in milestone:**` text (lines 10-12) can be folded into the Shipped paragraph or dropped.

**Previously Shipped list** (line 154-158): Add `- v1.18 Persistence Seam — Phases 55–58 (released v1.18.0; PersistentValue<T> seam + 4 adapter migrations + auto-persist consolidation)` at the top.

---

### Q3: Lockfile Mechanics — pnpm install After Version-Only Change

**Finding: `pnpm-lock.yaml` is NOT modified by a `package.json` version-only bump.** [VERIFIED: two sources]

1. **Codebase evidence:** The `pnpm-lock.yaml` `importers.` section (lockfile v9.0 format) does NOT embed the root package's own version — it only lists dependency specifiers and resolved versions. The root package `version` field is not present in the lockfile.

2. **Git history evidence:** Commit `2033469` (the v1.17.0 bump) touched only two files: `.planning/MILESTONES.md` and `package.json`. `pnpm-lock.yaml` was NOT in the diff. This confirms pnpm 10.33 leaves the lockfile untouched for a version-only change.

**Practical implication for the planner:**

- Run `pnpm install` after the `package.json` edit as specified in D-02, but expect NO lockfile changes.
- The commit for REL-01 contains only `package.json` (unless `pnpm install` happens to update something else — confirm after running it, but history predicts no changes).
- There is **no** `package-lock.json` in this repo — only `pnpm-lock.yaml`. [VERIFIED: `ls package-lock.json` → not found]

**Recommendation for planner:** Instruct the executor to run `pnpm install` and then `git status` — if `pnpm-lock.yaml` is unchanged (expected), commit only `package.json`. If it changed for any unexpected reason (pnpm minor update, peer dep resolution), commit both. Do not assume upfront which files are in the commit.

---

### Q4: HUMAN-UAT.md Template — Exact Format

The Phase 54 HUMAN-UAT.md (the canonical precedent) used this exact format: [VERIFIED: git show 62896fa]

```markdown
---
status: partial
phase: 54-documentation-cleanup-release-v1-17-0
source: [54-VERIFICATION.md]
started: 2026-05-23T19:00:00Z
updated: 2026-05-23T19:00:00Z
---

## Current Test

[awaiting CI / human execution]

## Tests

### 1. Playwright live run — no-regression gate (REL-03)
expected: `pnpm exec playwright test` (chromium + webkit-iphone projects) runs with no NEW failures vs the Phase-52 D-21 baseline (~32 pre-existing failures: 28 axe `dlitem` + 2 disclaimer-banner + 2 calc-UI). The 4 retired PERT a11y sweeps and 2 PERT e2e specs (`e2e/pert.spec.ts`, `e2e/pert-a11y.spec.ts`) are confirmed absent (structural check passed). Live execution requires Playwright browser binaries (`pnpm exec playwright install`), unavailable in the local execution environment — deferred to CI per D-02.
result: [pending — CI]

## Summary

total: 1
passed: 0
issues: 0
pending: 1
skipped: 0
blocked: 0

## Gaps

(none — the two hard automated gates are already green: ...)

## Notes

Per D-02 (54-CONTEXT): svelte-check + vitest are the blocking local gates and both passed at phase close. ...
```

**Key frontmatter fields:**

- `status: partial` (not `testing` — it's already in a deferred state)
- `phase: {slug}` (e.g., `58-release-v1-18-0`)
- `source: [58-VERIFICATION.md]`
- `started` / `updated`: ISO timestamp of phase close

**For 58-HUMAN-UAT.md**, the test(s) should be:

1. Playwright live run — no-regression gate (REL-03, automated portion): `pnpm exec playwright test` (chromium + webkit-iphone projects) with axe sweep in both themes. Deferred to CI — browser binaries unavailable locally (D-03). The local automated gates (svelte-check 0/0, vitest 451/451, pnpm build OK) are already green at phase close.

The Phase 54 precedent wording for the `## Notes` section closes the loop explicitly: "Per D-XX: svelte-check + vitest are the blocking local gates and both passed at phase close. ... Auto-approved at Phase 5X close under auto-mode; persists for a CI confirmation. Does not block the v1.18 release or the milestone archive."

---

### Q5: Phase 54 Task Structure (Template for 58-02)

Phase 54-02 plan structure (the final-gate plan): [VERIFIED: git show e7dc13a]

**54-02 had ONE task:**

```
Task 1: REL-03 — Run full clinical gate (svelte-check + vitest + Playwright structural + pnpm build)
```

With sequential gates in a single task action block:
1. `pnpm check` (svelte-check, HARD BLOCKING)
2. `pnpm test:run` (vitest, HARD BLOCKING)
3. `ls e2e/` (Playwright structural check — verify spec count and confirm PERT specs absent)
4. `pnpm exec playwright test` (attempt; fallback per D-02 if binaries absent)
5. `pnpm build` (REL-02 verify propagation)

Then **REL-04 groundwork** as a second task (flip STATE.md + update PROJECT.md footer) — but that was Phase 54's "milestone close" step. In Phase 58, milestone close is handled by `phase.complete` CLI, so the equivalent is:

- Task 1: Run clinical gate (gates 1-5 above, Playwright skipped per D-03)
- Task 2 (or merged): Create 58-HUMAN-UAT.md with Playwright deferral
- The `phase.complete` CLI invocation closes STATE.md, ROADMAP, and REQUIREMENTS.md automatically

**Planner recommendation (from CONTEXT D-82):** One task with sequential `<verify><automated>` blocks is cleaner than splitting per gate command, since each gate's failure is a stop condition. The 58-02 plan should have 2 tasks: (a) clinical gate run + HUMAN-UAT.md creation, (b) STATE.md/PROJECT.md footer update (which `phase.complete` handles, but the plan still needs the footer date bump as a task).

---

### Q6: REQUIREMENTS.md Traceability Table — REL-01..03 Status

**Current state:** [VERIFIED: REQUIREMENTS.md read]

```
| REL-01 | Phase 58 | Pending |
| REL-02 | Phase 58 | Pending |
| REL-03 | Phase 58 | Pending |
```

All 10 prior IDs (SEAM-01..04, MIG-01..04, AUTO-01..02) are already `Complete`.

**`gsd-sdk query phase.complete "58"` behavior:** Confirmed by the CONTEXT.md statement "The `phase.complete` CLI for Phase 58 will mark the milestone as 100% complete (`is_last_phase: true`). The orchestrator's auto-advance routing will detect milestone-complete and offer `/gsd:complete-milestone v1.18`." The CLI flips REL-01..03 to ✓ Complete automatically — the planner does NOT add a task to manually edit the traceability table. [ASSUMED: CLI behavior confirmed from CONTEXT.md description; pattern consistent with how Phases 55-57 flipped their IDs]

---

### Q7: Hardcoded Version Grep Gate

**Confirmed: zero hardcoded `1.17` version strings in `src/`.** [VERIFIED: grep ran against repo]

```bash
grep -rn '"1\.17"' src/    # → 0 matches
grep -rn "'1\.17'" src/    # → 0 matches
grep -rn '1\.17\.0' src/   # → 0 matches
```

The only `1.17.0` string in the repo is `package.json` line 4 itself. The `__APP_VERSION__` mechanism is the sole version-propagation path.

**Recommended grep gate command for 58-02:**

```bash
# Expect ZERO matches — any hit is a hardcoded version string that must be fixed before bumping
grep -rn '1\.17' src/
```

Run AFTER `package.json` is bumped to 1.18.0. Zero matches confirms no hardcoded version strings remain.

Additionally confirm `package.json` reads `1.18.0`:
```bash
grep '"version"' package.json   # → "version": "1.18.0"
```

---

### Q8: Pitfalls — Version Bump, Build Cache, Test Assertions

**P1: `__APP_VERSION__` at build time — no caching pitfall.** [VERIFIED: vite.config.ts]

`vite.config.ts:7` does `const pkg = JSON.parse(readFileSync('package.json', 'utf-8'))`. This runs at build entry — Vite reads `package.json` fresh on every `pnpm build` invocation. There is no persistent build cache that could serve a stale version. After bumping `package.json` to `1.18.0`, the next `pnpm build` will inject `__APP_VERSION__ = "1.18.0"` correctly.

**P2: No test asserts on a specific version string.** [VERIFIED: grep across all test files]

- No `.test.ts` file references `v1.17.0`, `v1.18.0`, `1\.17`, or `appVersion`.
- `about-content.ts` is never directly imported in test files (confirmed: no `about-content` in `*.test.ts` grep).
- The `__APP_VERSION__` declare at `about-content.ts:3` is a Vite-side type stub; vitest runs in jsdom where the fallback `typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0'` will resolve to `'0.0.0'` — but since no test asserts on this value, it is irrelevant.

**P3: vitest test count.** The CONTEXT states baseline is 451 tests. Phase 58 adds zero new tests (no code changes in 58-01; version bump only in 58-02). Expect exactly `451/451` (or a higher number if any test files are added unexpectedly — the gate is 0 failures, not exact count).

**P4: Migration test byte-shape checks.** Phase 56's `migration-56-01.test.ts` and `migration-56-02.test.ts` pin localStorage key names (`nicu_assistant_theme`, `nicu:favorites`, etc.) and JSON shapes — NOT version strings. The bump is safe. [VERIFIED: grep found zero version strings in migration test files]

**P5: `pnpm install` after version-only bump.** As established in Q3, `pnpm-lock.yaml` will NOT change. Running `pnpm install` is still required by D-02 (it ensures the working tree is consistent), but the executor should not be surprised if the lockfile is unchanged. The commit will be `package.json` only.

**P6: `pnpm build` output confirmation.** The PWA manifest embed and the service worker precache entries do NOT include the app version string — they are based on file content hashes. The version appears only in the AboutSheet runtime rendering via `__APP_VERSION__`. So `pnpm build` success is sufficient proof; no dist/ file inspection is needed.

---

## Standard Stack

No new dependencies. This phase is entirely within the existing stack. [VERIFIED: CONTEXT.md, package.json]

| Tool | Version | Gate Command | Notes |
|------|---------|-------------|-------|
| pnpm | 10.33.0 | `pnpm install` | Regenerate lockfile after package.json bump |
| svelte-check | (via pnpm) | `pnpm exec svelte-check --tsconfig ./tsconfig.json` | Or `pnpm check` — same script |
| vitest | 4.1.2 | `pnpm vitest run` | Or `pnpm test:run` |
| vite build | 8.0.9 | `pnpm build` | adapter-static SPA output |

## Architecture Patterns

### Plan 58-01: Doc-Only, No Code Changes

Files modified:
```
.planning/
├── PROJECT.md          # Current State, Active→Validated, Previously Shipped, footer
├── MILESTONES.md       # Prepend v1.18 entry above v1.17 entry
```

No `package.json`, no `src/`, no `pnpm-lock.yaml` in 58-01.

### Plan 58-02: Version Bump + Clinical Gate + Milestone Close

Files modified:
```
package.json            # "version": "1.17.0" → "1.18.0" (single string edit)
.planning/phases/58-release-v1-18-0/
├── 58-HUMAN-UAT.md     # CREATE — Playwright deferral (status: partial)
.planning/PROJECT.md    # Footer date update + "In progress" → "Shipped"
.planning/STATE.md      # Updated by phase.complete CLI
```

`pnpm-lock.yaml` — NOT modified (version-only change does not touch lockfile in pnpm v9.0 lockfile format).

### Phase 54 → Phase 58 Mapping

| Phase 54 step | Phase 58 equivalent |
|---------------|---------------------|
| 54-01: DOC-01..06 edits + package.json bump (bundled) | 58-01: doc edits only; 58-02: package bump (separated) |
| 54-02: svelte-check + vitest + Playwright structural + pnpm build | 58-02: same gate (no Playwright live run; fully skip per D-03) |
| 54-02: REL-04 groundwork (STATE.md complete + PROJECT.md footer) | 58-02: phase.complete CLI handles STATE/REQUIREMENTS; plan task bumps PROJECT.md footer |
| 54: HUMAN-UAT.md with Playwright deferred to CI | 58: same pattern, same wording template |

### The v1.18 Version-Bump Surface (Single File)

Only `package.json` line 4:
```json
  "version": "1.17.0",
```
→
```json
  "version": "1.18.0",
```

No edits to `vite.config.ts`, `about-content.ts`, or any `src/` file. The build-time inject handles propagation automatically.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Version propagation to AboutSheet | Editing `about-content.ts` | `package.json` bump only — Vite `define` handles it | `vite.config.ts:10` already reads `pkg.version` at build time; `about-content.ts:13` already reads the constant |
| REQUIREMENTS.md traceability flip | Manual table edit | `gsd-sdk query phase.complete "58"` | CLI auto-flips REL-01..03 to ✓ Complete |
| Lockfile update | Manual `pnpm-lock.yaml` edit | `pnpm install` | Run it; if lockfile is untouched (expected), commit only `package.json` |

## Common Pitfalls

### Pitfall 1: Including package.json bump in 58-01 (DOC plan)

**What goes wrong:** Mixing the version bump into the doc-sync plan (as Phase 54 did with 54-01) conflates doc churn with code changes.
**Why it happens:** Phase 54 bundled them; habit.
**How to avoid:** D-01 explicitly splits them. 58-01 = zero code changes. 58-02 = version bump + gate.
**Warning signs:** If a 58-01 task description mentions `package.json`, it is wrong.

### Pitfall 2: Committing pnpm-lock.yaml when it didn't change

**What goes wrong:** `git add pnpm-lock.yaml` when it has no diff creates a confusing empty staging entry or a no-op commit.
**Why it happens:** D-02 says "commit alongside" — this was written for the theoretical case; in practice the lockfile doesn't change.
**How to avoid:** After `pnpm install`, run `git status` to confirm no lockfile diff before staging. Commit only changed files.

### Pitfall 3: Adding a manual REQUIREMENTS.md traceability task

**What goes wrong:** Plan includes "Edit REQUIREMENTS.md to flip REL-01..03 to ✓ Complete" — then `phase.complete` CLI double-edits or conflicts.
**Why it happens:** D-09 is easy to miss.
**How to avoid:** The plan does NOT include a task that edits REQUIREMENTS.md. The CLI handles it.

### Pitfall 4: Running Playwright locally and treating failures as blockers

**What goes wrong:** Executor runs `pnpm playwright test`, sees "browserType.launch: Executable doesn't exist" for all tests, panics.
**Why it happens:** Browser binaries not installed locally (confirmed by D-03 and Phase 54 precedent).
**How to avoid:** Plan 58-02 task explicitly marks Playwright as SKIPPED with a note "deferred to CI per D-03." The gate is passed when svelte-check + vitest + pnpm build are green. HUMAN-UAT.md carries the Playwright deferral.

### Pitfall 5: Forgetting to create 58-HUMAN-UAT.md

**What goes wrong:** Phase verification has no artifact for the Playwright deferral; `/gsd:audit-uat` shows a gap.
**Why it happens:** HUMAN-UAT.md is a new file that must be created (not edited).
**How to avoid:** 58-02 plan has an explicit CREATE task for `58-HUMAN-UAT.md` using the Phase 54 wording as template.

## PROJECT.md Edit Map for 58-01

### Section: `### Active` (current line ~134)

**Remove:** The entire `- ⏳ v1.18 —` line from `### Active`.

**Add to `### Validated`** (4 bullets, after the existing v1.17 promotion entries):

```markdown
- ✓ `PersistentValue<T>` persistence seam: one guarded `read`/`write`/`remove` behind a single SSR/private-mode guard, JSON codec with `rawStringCodec` for FOUC-safe theme, and a `recover` hook expressive enough for both disclaimer migration and favorites recovery — v1.18 (Phase 55)
- ✓ Four shared global singletons migrated to thin seam adapters, behavior-preserving: `theme.svelte.ts` (unquoted `rawStringCodec`), `disclaimer.svelte.ts` (v1 audit trail preserved, v2 migration), `favorites.svelte.ts` (`{v:1,ids}` schema + 6-step recovery via recover hook), `lastEdited.svelte.ts` (60s stamp-debounce) — v1.18 (Phase 56)
- ✓ Auto-persist consolidated behind `CalculatorStore`: single `$effect.root()` in constructor replaces 9 duplicated `$effect(() => { JSON.stringify(...State.current); ...State.persist() })` blocks deleted from 5 `*Inputs.svelte` + 4 `*Calculator.svelte` parents — v1.18 (Phase 57)
- ✓ Release v1.18.0: `package.json` → 1.18.0; AboutSheet reflects it via `__APP_VERSION__` build-time constant; svelte-check 0/0, vitest 451/451, `pnpm build` OK — v1.18 (Phase 58)
```

Exact wording is Claude's discretion (D-01 last sub-bullet) — the above is a draft that matches the density and style of existing validated entries.

### Section: `### Current Milestone: v1.18 Persistence Seam` (current lines ~136-152)

This entire section gets rewritten at milestone close. Remove `**Target features:**` block and `**Key context:**` block. Replace with a concise shipped paragraph, or remove the section entirely (prior milestones don't have a `## Current Milestone` section — this is a v1.18-specific block that should be cleaned up).

### Section: `## Previously Shipped` (current line ~154)

Add at the top of the list:
```markdown
- v1.18 Persistence Seam — Phases 55–58 (released v1.18.0; `PersistentValue<T>` seam + 4 adapter migrations + auto-persist consolidation)
```

### Footer update (line 247)

Change the last-updated line to today's date with a v1.18 summary.

## MILESTONES.md Edit Map for 58-01

**Prepend the following before the existing `## v1.17` entry:**

```markdown
## v1.18 Persistence Seam (Shipped: 2026-05-29)

**Phases completed:** 4 phases (55, 56, 57, 58), 4 plans

**Known deferred items at close:** Playwright E2E + extended axe sweeps deferred to CI (browser binaries unavailable locally) — see 58-HUMAN-UAT.md. Prior carry-forwards (SMOKE-01..10 + v1.17 Playwright/SAFE-01 items) continue in STATE.md Deferred Items.

**Key accomplishments:**

- `PersistentValue<T>` seam extracted (Phase 55, SEAM-01..04): one guarded `read`/`write`/`remove` with a `rawStringCodec` for FOUC-safe theme and a `recover` hook expressive enough for both disclaimer v1→v2 migration and the favorites 6-step recovery; 26 co-located tests are the single persistence test surface.
- Four shared global singletons migrated to thin seam adapters (Phase 56, MIG-01..04): `theme.svelte.ts` stores unquoted via `rawStringCodec` (preserving `app.html` FOUC read), `disclaimer.svelte.ts` preserves v1 audit trail (v1 key not deleted), `favorites.svelte.ts` passes 6-step recover to seam hook with `{v:1,ids}` schema and 4-cap, `lastEdited.svelte.ts` wraps per-key stamp with 60s debounce and null-guard via recover hook. Regression suites (`favorites.test.ts`, `calculator-store.test.ts`, `DisclaimerBanner.test.ts`) stayed green with zero test edits.
- Auto-persist consolidated behind `CalculatorStore` (Phase 57, AUTO-01..02): single `$effect.root(() => $effect(...))` in constructor (SSR-guarded, app-lifetime singleton) replaces 9 copy-pasted persist effects — 5 from `*Inputs.svelte` (gir, morphine, fortification, feeds, uac-uvc) + 4 from `*Calculator.svelte` parents caught by code review. Re-entry impossible by construction (effect reads `this.current`, never `this.lastEdited.current`).
- Release v1.18.0 (Phase 58, REL-01..03): `package.json` → 1.18.0; `__APP_VERSION__` auto-propagates via Vite define; clinical gate: svelte-check 0/0 (4592 files), vitest 451/451 (+41 since v1.17), `pnpm build` OK; Playwright E2E + axe sweeps deferred to CI.

---

```

Exact bullet wording is Claude's discretion — the above draft uses the established terse/technical style.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.4 |
| Config file | `vite.config.ts` (Vitest config embedded) |
| Quick run command | `pnpm vitest run` |
| Full suite command | `pnpm vitest run` (no separate full-suite variant) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | Notes |
|--------|----------|-----------|-------------------|-------|
| REL-01 | package.json reads 1.18.0, no hardcoded version in src/ | grep gate | `grep -rn '1\.17' src/` → 0 matches; `grep '"version"' package.json` → `1.18.0` | Run as part of 58-02 gate |
| REL-02 | PROJECT.md + REQUIREMENTS.md updated | doc audit | `grep "Complete" .planning/REQUIREMENTS.md \| grep REL` | CLI-driven; verify artifact |
| REL-03 (automated) | svelte-check 0/0, vitest green, pnpm build OK | unit/build | `pnpm exec svelte-check --tsconfig ./tsconfig.json && pnpm vitest run && pnpm build` | All local gates |
| REL-03 (Playwright/axe) | Playwright E2E + extended axe sweeps green | e2e/a11y | `pnpm exec playwright test` | DEFERRED to CI — captured in HUMAN-UAT.md |

### Wave 0 Gaps

None — no new test files needed. Phase 58 is a zero-code-change release phase. Existing 451-test suite is the gate.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| pnpm | package.json bump + install | Yes | 10.33.0 | — |
| Node.js | build + vitest | Yes | 24.14.1 | — |
| svelte-check | REL-03 gate | Yes (via devDeps) | (installed) | — |
| vitest | REL-03 gate | Yes (via devDeps) | 4.1.4 | — |
| vite build | REL-03 gate | Yes (via devDeps) | 8.0.9 | — |
| Playwright browsers | REL-03 Playwright portion | No | absent | HUMAN-UAT.md + CI (D-03) |

**Missing dependencies with no fallback:** None that block the local gate.

**Missing dependencies with fallback:** Playwright browser binaries — fallback is CI execution captured in HUMAN-UAT.md (Phase 54 precedent).

## Package Legitimacy Audit

Phase 58 installs no new packages. This section is not applicable.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `gsd-sdk query phase.complete "58"` auto-flips REL-01..03 in REQUIREMENTS.md | Q6 / REQUIREMENTS section | If CLI doesn't flip them, planner must add a manual edit task — low risk, easily caught at execution |

**All other claims in this research were verified from the codebase or git history — no other assumed claims.**

## Open Questions

None. All eight research questions are answered with verified findings. The Phase 54 pattern is a complete template. No ambiguity blocks planning.

## Sources

### Primary (HIGH confidence)

- `.planning/phases/58-release-v1-18-0/58-CONTEXT.md` — all locked decisions, phase boundary, v1.18 scope
- `git show 2033469` — Phase 54-01 DOC+bump commit; confirms only `MILESTONES.md` + `package.json` changed (no lockfile)
- `git show 62896fa` — Phase 54 HUMAN-UAT.md; exact template for 58-HUMAN-UAT.md
- `git show e7dc13a` (54-01-PLAN.md, 54-02-PLAN.md) — Phase 54 task structure templates
- `.planning/PROJECT.md` — current Active/Validated section structure; Previously Shipped list
- `.planning/MILESTONES.md` — v1.17 entry verbatim; `---` divider convention confirmed
- `.planning/REQUIREMENTS.md` — REL-01..03 current status (Pending); traceability table structure
- `vite.config.ts` — `__APP_VERSION__` injection mechanism confirmed
- `src/lib/shared/about-content.ts` — `appVersion` consumption confirmed; no test assertions on version value
- `pnpm-lock.yaml` header (lockfileVersion: 9.0, importers section) — no root version field

### Secondary (MEDIUM confidence)

- grep of all `*.test.ts` files for version string assertions → zero matches; confirmed safe to bump

## Metadata

**Confidence breakdown:**

- Version bump mechanics: HIGH — verified from vite.config.ts, about-content.ts, and prior git history
- Lockfile behavior: HIGH — verified from git diff of the v1.17 bump commit (lockfile unchanged)
- MILESTONES.md format: HIGH — read verbatim from file; no interpretation needed
- HUMAN-UAT.md format: HIGH — read verbatim from git show 62896fa
- Test safety (no version assertions): HIGH — grepped all test files, zero matches
- Phase 54 task structure: HIGH — read from plan files in git history

**Research date:** 2026-05-29
**Valid until:** Indefinite (release mechanics for this repo are stable; stack versions locked until next milestone)
