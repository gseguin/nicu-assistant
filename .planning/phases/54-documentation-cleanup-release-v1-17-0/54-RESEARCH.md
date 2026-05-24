# Phase 54: Documentation Cleanup + Release v1.17.0 — Research

**Researched:** 2026-05-23
**Domain:** Documentation sync, version bump, clinical gate verification
**Confidence:** HIGH — all findings verified directly against live files in this session

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01 (REL-03 gate criterion):** Playwright/axe portion is "no increase from documented baseline", NOT "all tests green". Phase 52 D-21 established ~32 pre-existing Playwright failures (28 axe `dlitem` + 2 disclaimer-banner + 2 calc-UI) as the owned baseline — explicitly out of v1.17 scope. Hard-green gates: `pnpm check` (svelte-check 0/0) and `pnpm test:run` (vitest, currently 410/410). Playwright is a no-regression gate.
- **D-02 (Playwright local fallback):** If the full Playwright matrix is environment-blocked (browser binaries / dev server), record the structural test-count check (specs enumerate correctly, PERT specs absent) and defer the live run to CI. Do NOT block the milestone on a local Playwright execution the harness can't run. svelte-check + vitest remain the blocking local gates.
- **D-03 (Milestone archive timing):** Phase 54 plan DOES NOT invoke `/gsd:complete-milestone`. That command is run by the operator as an explicit top-level command AFTER Phase 54 verification passes. The phase prepares the groundwork (STATE.md status, PROJECT.md footer); the archive to `.planning/milestones/v1.17-*/` is a separate human-triggered step.
- **D-04 (DOC-01..06 are verbatim edits):** Each requirement names the exact file, section, current text, and target text. Planner produces tasks that execute these verbatim with no reinterpretation.
- **D-05 (Historical record):** `.planning/` PERT references are HISTORICAL RECORD and stay intact except where a DOC requirement explicitly names the change. Do NOT scrub PERT from MILESTONES/PROJECT beyond the specific DOC-01..06 edits.
- **D-06 (Version bump mechanics):** Edit `package.json` `version` field only: `1.16.1` → `1.17.0`. `__APP_VERSION__` flows to AboutSheet automatically via `vite.config.ts:11`. REL-02 is verify-only — no manual AboutSheet edit.
- **D-07 (MILESTONES.md v1.17 entry shape):** Heading `## v1.17 Remove PERT Calculator (Shipped: <date>)`, then Phases completed (52–54), Known deferred items at close (SMOKE-01..10 + REL-04-smoke), Notes (v1.16 label skipped; package re-aligned to 1.17.0), Key accomplishments. Insert ABOVE the v1.15.1 entry.

### Claude's Discretion

- Plan granularity (single plan vs. 2 plans splitting DOC from REL) and exact task ordering within the phase.
- Exact wording of the v1.17 MILESTONES "Key accomplishments" bullets (planner drafts from Phase 52/53 SUMMARYs).

### Deferred Ideas (OUT OF SCOPE)

- SMOKE-01..10 + REL-04 smoke sign-off — carries forward, not executed in v1.17.
- 53-HUMAN-UAT.md SAFE-01 browser-level check — deferred with smoke checklist.
- WR-01 (favorites.recover() valid-duplicate dedup) — future phase/backlog.

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DOC-01 | PROJECT.md Validated list — v1.15 PERT entry moved to new `### Invalidated / Removed` subsection | Exact current text quoted in DOC-01 section below; subsection does not yet exist |
| DOC-02 | PROJECT.md Context — six→five; PERT bullet removed; "all six calculators" phrasing corrected | Four distinct locations identified with exact current text quoted |
| DOC-03 | PROJECT.md Architecture — `<CalculatorPage>` route list drops `/pert`, lists 5 | Exact current sentence quoted; two "all 6" references also found |
| DOC-04 | PROJECT.md Glossary/acronyms — PERT entry removed or marked historical | Confirmed: no Glossary/acronyms section exists — DOC-04 is a no-op |
| DOC-05 | MILESTONES.md — new v1.17 top entry + annotate v1.15 PERT entry | Format template identified (v1.15.1 top entry); v1.15 PERT entry location clarified (Validated list line 118, NOT a MILESTONES.md heading) |
| DOC-06 | PROJECT.md Key Decisions table — "Ship PERT" Outcome column updated | Exact current Outcome cell text quoted |
| REL-01 | package.json version 1.16.1 → 1.17.0 | Confirmed current version 1.16.1 |
| REL-02 | AboutSheet displays v1.17.0 (verify-only, no manual edit) | Wiring confirmed: vite.config.ts:11 → about-content.ts:13; currently shows v1.16.1 at runtime, will auto-update on bump |
| REL-03 | Full clinical gate green (svelte-check 0/0, vitest 410/410, Playwright no-regression, axe no-regression) | Gate commands and baseline documented; vitest count confirmed 410/410 post-Phases 52+53 |
| REL-04 | STATE.md status → `complete`; PROJECT.md footer updated; archive-readiness confirmed | STATE.md frontmatter field identified: `status: planning` → `status: complete`; PROJECT.md footer quoted |

</phase_requirements>

---

## Summary

Phase 54 is a procedural documentation-sync and release phase with zero application code changes. The only non-documentation file edit is bumping `package.json` version from `1.16.1` to `1.17.0` — everything else is text editing in `.planning/` files.

All DOC requirements target a single file (`PROJECT.md`) plus one entry in `MILESTONES.md`. The research task was to verify the exact current text at each edit location so the planner can write tasks with unambiguous `old_string` / `new_string` pairs. Every quoted string in this document was read directly from the live files in this research session.

One significant finding: DOC-04 (Glossary) is effectively a no-op because PROJECT.md has no Glossary or acronyms section. The planner should record this as a verified-absent item rather than skipping it silently. A second finding: the "v1.15 PERT entry" that DOC-05 refers to for MILESTONES.md annotation is not a `## v1.15` heading in MILESTONES.md (no such heading exists — the PERT workstream was archived separately). The PERT entry requiring annotation is in PROJECT.md Validated list line 118, and DOC-05 also requires annotating MILESTONES.md where it references PERT indirectly (in the v1.15.1 Notes). See DOC-05 section for the full analysis.

**Primary recommendation:** Implement as two sequential waves — Wave 1: all six DOC edits + package.json bump (REL-01); Wave 2: run clinical gate (REL-03), verify AboutSheet (REL-02), flip STATE.md status + update footer (REL-04). No parallel conflicts; sequential is simpler.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| DOC edits (PROJECT.md, MILESTONES.md) | Documentation layer | — | Markdown files in `.planning/`; no build-time involvement |
| Version bump (package.json) | Build tool (Vite) | PWA manifest | Vite reads `pkg.version` at build time via `readFileSync`; PWA Workbox cache also invalidates |
| AboutSheet version display (REL-02) | Build-time constant | Frontend component | `__APP_VERSION__` injected by Vite `define`; consumed as `appVersion` in `about-content.ts`; no runtime fetch |
| Clinical gate: svelte-check | Build tool / type checker | — | `pnpm check` runs `svelte-kit sync && svelte-check` |
| Clinical gate: vitest | Test runner | — | `pnpm test:run` runs all `src/**/*.{test,spec}.{ts,js}` |
| Clinical gate: Playwright | E2E runner | CI proxy | Two projects: `chromium` + `webkit-iphone`; local run may need dev server |
| STATE.md status flip (REL-04) | Documentation layer | — | YAML frontmatter in `.planning/STATE.md` |

---

## DOC Requirement Verification

This section is the primary output of the research. Each finding is the result of directly reading the live file.

### DOC-01: PROJECT.md Validated List — PERT Entry to Move

**File:** `.planning/PROJECT.md`
**Location:** Line 118 (in the `### Validated` list under `## Requirements`)

**Exact current text (verbatim):** [VERIFIED: live file read]
```
- ✓ Pediatric EPI PERT Calculator (sixth clinical calculator) shipped as self-contained workstream (`milestones/ws-pert-2026-04-26/`, internal phase numbering 01-05, did NOT consume main-roadmap phase numbers): `CalculatorId` extended with `'pert'`, `.identity-pert` OKLCH hue, `src/lib/pert/` module with config + state + parity fixtures + tests, `/pert` route, AboutSheet entry, registry entry — v1.15
```

**Target action (per D-04):** Move this line out of `### Validated` and into a new `### Invalidated / Removed` subsection, appended with ` — v1.17: out of clinical scope (pediatric, not neonatal)`.

**Note on placement:** The `### Validated` subsection ends at what was line 123 (the v1.15.1 Release entry). A new `### Invalidated / Removed` subsection should be inserted after the last Validated entry and before the `### Active` subsection (line 125).

---

### DOC-02: PROJECT.md Context — Six-Calculator References to Fix

**File:** `.planning/PROJECT.md`
**Section:** `## Context` (starts at line 162)

Four distinct strings require editing: [VERIFIED: live file read]

**String A — Paragraph opener (line 164):**
```
**Shipped v1.15.1** under package v1.16.x. Six clinical calculators, all with the v1.13 `<HeroResult>` above-the-fold pattern
```
Target: Replace `Six clinical calculators` with `Five clinical calculators`.

**String B — Six-calculator list heading (line 166):**
```
**Six clinical calculators:**
```
Target: Replace with `**Five clinical calculators:**`

**String C — PERT bullet in the calculator list (line 172):**
```
- PERT: Pediatric Enzyme Replacement Therapy dosing (v1.15 workstream)
```
Target: Remove this bullet entirely.

**String D — Architecture bullet (line 178) — also applies to DOC-03:**
```
- Shared `<CalculatorPage>` shell + `CalculatorModule` contract collapses all 6 calculator route shells (`/morphine-wean`, `/formula`, `/gir`, `/feeds`, `/uac-uvc`, `/pert`) into single-line route imports (refactor `0ec8f98`)
```
Target: Replace `all 6 calculator route shells (\`/morphine-wean\`, \`/formula\`, \`/gir\`, \`/feeds\`, \`/uac-uvc\`, \`/pert\`)` with `all 5 calculator route shells (\`/morphine-wean\`, \`/formula\`, \`/gir\`, \`/feeds\`, \`/uac-uvc\`)`.

**Additional "all six" reference in Shipped block (line 11 in "Current State"):**
```
Zero per-calculator divergence — single source of truth across all six calculators.
```
This is inside the v1.15.1 historical "Shipped" description (in `## Current State`, not `## Context`). Per D-05 (historical record stays intact), this sentence describes what was true at v1.15.1 ship time and should be left as-is. The planner should NOT change this line.

---

### DOC-03: PROJECT.md Architecture — `<CalculatorPage>` Route Enumeration

**File:** `.planning/PROJECT.md`
**Section:** `## Context` → `**Architecture:**` sub-block (line 176+)

The primary route-enumeration line is the same as DOC-02 String D (line 178, already quoted above). That single edit covers both DOC-02 and DOC-03.

**Additional "all 6" reference in Architecture block (line 179):** [VERIFIED: live file read]
```
- Shared `CalculatorStore<T>` generic class (`src/lib/shell/calculator-store.svelte.ts`) standardizes state-singleton pattern across all calculators (`$state` rune + sessionStorage backup + custom-merge support); all 6 calculator state singletons migrated to it
```
Per DOC-03 scope: this line refers to the state singletons (which PERT's was indeed deleted in Phase 52). D-04/D-05 say to be surgical — only change what DOC-01..06 explicitly require. DOC-03 is scoped to the `<CalculatorPage>` route enumeration. The planner should update this line to `all 5 calculator state singletons migrated to it` for factual accuracy, but this is **Claude's discretion** rather than a hard DOC-03 requirement. Flag it.

---

### DOC-04: PROJECT.md Glossary/Acronyms — PERT Entry

**File:** `.planning/PROJECT.md`
**Finding:** [VERIFIED: live file read — full PROJECT.md read, no `## Glossary` or `## Acronyms` section exists]

PROJECT.md has no Glossary or acronyms section. The word "PERT" appears in the Validated list, Context, Architecture, Key Decisions table, and the "Current Milestone" section — but there is no dedicated Glossary section defining the acronym.

**Planner action:** DOC-04 is a **no-op**. Record it as "Glossary section absent — requirement satisfied vacuously." No edit required.

---

### DOC-05: MILESTONES.md — New v1.17 Entry + Annotate v1.15 PERT Entry

**File:** `.planning/MILESTONES.md`

**Finding 1 — No standalone `## v1.15` heading exists.** [VERIFIED: live file read + grep]
MILESTONES.md has these headings (top-down): `## v1.15.1`, `## v1.12` (×2), `## v1.11`, `## v1.10`, `## v1.9`, `## v1.8`, `## v1.7`, `## v1.6`, `## v1.5`, `## v1.4`, `## v1.3`, `## v1.2`, `## v1.1`. There is no `## v1.15` entry. The PERT workstream was archived separately to `.planning/milestones/ws-pert-2026-04-26/` and was never given a main-MILESTONES.md entry (by design — it was a self-contained workstream that did not consume main-roadmap phase numbers).

**Finding 2 — The "v1.15 PERT entry" that DOC-05 requires annotation for is in PROJECT.md Validated list (line 118).** DOC-01 already moves it to `### Invalidated / Removed`. The MILESTONES.md annotation is **a separate concern**: the v1.15.1 MILESTONES entry (lines 3–22) contains no direct mention of v1.15 PERT that needs annotation. The annotation target for MILESTONES.md is best understood as: the v1.17 entry's "Notes" section should explicitly call out that v1.15 PERT was removed, per D-07.

**Finding 3 — Format template is the v1.15.1 entry (lines 3–22 of MILESTONES.md).** [VERIFIED: live file read]
```
## v1.15.1 iOS Polish & Drawer Hardening (Shipped: 2026-05-17)

**Phases completed:** 4 phases, 9 plans, 13 tasks

**Known deferred items at close:** 11 (SMOKE-01..10 + REL-04 smoke-sign-off portion) + 6 quick-task manifest audit gaps (work complete; see STATE.md Deferred Items)

**Notes:**
- Package version was bumped from 1.15.0 → 1.15.1 → 1.16.0 → 1.16.1 via quick tasks *before* milestone close (commit `2060393` for 1.15.1; `d4a0f29` for 1.16.0; `5fba1e7` for 1.16.1). v1.15.1 shipped under package v1.16.x.
- Real-iPhone smoke gate (SMOKE-01..10) re-opens v1.13 D-12 deferral; carries forward.

**Key accomplishments:**
[bullets...]
```

**Target shape for v1.17 entry (per D-07):**
```
## v1.17 Remove PERT Calculator (Shipped: <date>)

**Phases completed:** 3 phases (52, 53, 54), N plans total (Phase 52: 3 plans, Phase 53: 1 plan, Phase 54: N plans)

**Known deferred items at close:** 11 (SMOKE-01..10 + REL-04 smoke-sign-off) — see STATE.md Deferred Items. SMOKE-10 re-scoped to 5 calculators when run.

**Notes:**
- v1.16 milestone label intentionally skipped — package version drifted to 1.16.x during v1.15.1 quick-task patches before milestone close. v1.17 re-aligns the milestone label with the package version.
- v1.15 PERT Calculator (shipped as self-contained workstream `ws-pert-2026-04-26`) removed in this milestone — out of clinical scope (pediatric, not neonatal). See PROJECT.md Invalidated / Removed.

**Key accomplishments:**
[planner drafts from Phase 52/53 SUMMARYs]
```
Insert this entry ABOVE the `## v1.15.1` entry (i.e., at the very top of the file after the `# Milestones` heading, or as the new first `##` heading).

---

### DOC-06: PROJECT.md Key Decisions Table — "Ship PERT" Outcome Column

**File:** `.planning/PROJECT.md`
**Location:** Line 214 (in `## Key Decisions` table)

**Exact current row (verbatim):** [VERIFIED: live file read]
```
| Ship PERT as self-contained workstream (not main-roadmap phase) | PERT was a sixth calculator that needed its own architecture/identity/UI/tests cycle independent of the v1.15.1 iOS hotfix work proceeding in parallel; workstream model lets it ship without consuming main-roadmap phase numbers | ⚠️ Revisit — v1.15 PERT later removed in v1.16 (out of clinical scope) |
```

**Target Outcome cell (per D-06 / CONTEXT.md `<specifics>`):**
```
❌ Removed in v1.17 — out of clinical scope (pediatric, not neonatal)
```

The Decision column and Rationale column are unchanged. Only the Outcome cell changes.

---

## REL Requirement Verification

### REL-01: package.json Version Bump

**File:** `package.json`
**Current value (line 4):** [VERIFIED: live file read]
```json
"version": "1.16.1",
```
**Target:** `"version": "1.17.0",`

`pnpm-lock.yaml` regeneration: A plain `version` field bump in `package.json` does NOT change any dependency resolved version; it only changes the root package descriptor. pnpm does not update the lockfile for this. No `pnpm install` needed. [ASSUMED — based on pnpm behavior with private packages; verify if CI enforces lockfile freshness]

---

### REL-02: AboutSheet Version Wiring (Verify-Only)

**Chain:** `package.json:version` → `vite.config.ts:7+11` → `about-content.ts:13`

**vite.config.ts lines 7 and 11 (verbatim):** [VERIFIED: live file read]
```typescript
const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version)
  },
```

**about-content.ts line 13 (verbatim):** [VERIFIED: live file read]
```typescript
const appVersion = `v${typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0'}`;
```

**Conclusion:** After bumping `package.json` to `1.17.0`, the next `vite build` or `vite dev` will inject `"1.17.0"` as the `__APP_VERSION__` constant. `appVersion` becomes `"v1.17.0"`. The `version` field in every `AboutContent` record is set to `appVersion`. No manual edit to `about-content.ts` is required or permitted (REL-02 is verify-only per D-06).

**Verification step:** Run `pnpm build` after the version bump. In the build output, grep for `1.17.0` or launch `pnpm preview` and open the AboutSheet for any calculator. Alternatively, a unit-level check: the `appVersion` constant is assembled from `__APP_VERSION__` which is a build-time constant — not directly testable via `pnpm test:run` (vitest runs in jsdom, where `__APP_VERSION__` defaults to `'0.0.0'` per the fallback). A `pnpm build` smoke-check is the correct verification path.

---

### REL-03: Clinical Gate — Commands and Baselines

**Gate 1: svelte-check (must be 0/0)** [VERIFIED: live file read — package.json scripts]
```bash
pnpm check
# expands to: svelte-kit sync && svelte-check --tsconfig ./tsconfig.json
```
Expected result: 0 errors, 0 warnings. This is a hard blocking gate.

**Gate 2: vitest (must be 0 failures, 410/410)** [VERIFIED: confirmed in PROJECT.md Current State + Phase 53 verification note]
```bash
pnpm test:run
# expands to: vitest run
```
Expected result: 410 tests pass, 0 fail. The Phase 52 purge dropped the PERT test files (count dropped from 454 to 410). Phase 53 added 0 new tests (SAFE-02 and SAFE-03 already existed as passing). Current count is 410/410 per PROJECT.md Current State.

**Gate 3: Playwright (no-regression, not all-green)** [VERIFIED: 54-CONTEXT.md D-01]
```bash
pnpm exec playwright test
# runs both `chromium` and `webkit-iphone` projects
```
Expected result: Failure count must NOT increase from the Phase 52 D-21 baseline of ~32 pre-existing failures (28 axe `dlitem` + 2 disclaimer-banner + 2 calc-UI). The 4 PERT a11y sweeps (`e2e/pert-a11y.spec.ts`) and 2 PERT e2e specs (`e2e/pert.spec.ts`) were deleted in Phase 52 — they will no longer appear in results.

If running the full Playwright matrix is environment-blocked (dev server not running, browser binaries missing), per D-02: record the structural spec-count check (verify PERT spec files absent from `e2e/`) and defer the live run to CI.

**Gate 4: axe sweeps (no-regression)**
The extended axe sweeps run under Playwright. Same no-regression criterion. The 4 PERT-specific axe sweeps dropped out in Phase 52; the remaining sweeps should be unchanged.

**Environment note:** Playwright requires a running dev server or preview server. The standard approach is `pnpm preview` + `pnpm exec playwright test --reporter=list`. If the executor environment can't run a server, gate falls back to CI per D-02. [ASSUMED — based on standard Playwright + SvelteKit adapter-static workflow]

---

### REL-04: STATE.md + PROJECT.md Footer

**STATE.md frontmatter — field to flip:** [VERIFIED: live file read]
Current value (line 6): `status: planning`
Target value: `status: complete`

Also update (line 7): `stopped_at: Phase 54 context gathered` → e.g., `stopped_at: Phase 54 complete`
Also update (line 8): `last_updated: "2026-05-24T00:31:18.750Z"` → current ISO timestamp

**PROJECT.md footer — current text:** [VERIFIED: live file read, line 241]
```
*Last updated: 2026-05-23 — Phases 52–53 complete; PERT source fully removed + favorites upgrade-safety regression locked, suite green at 410/410*
```
Target: Update date to release date and update summary text to reflect Phase 54 completion and v1.17.0 release.

**What REL-04 does NOT include (per D-03):** The actual archive move to `.planning/milestones/v1.17-*/` is performed by the operator via `/gsd:complete-milestone` AFTER Phase 54 verifies. The phase plan must NOT include a task that invokes `/gsd:complete-milestone` or moves any files to `.planning/milestones/`. The phase leaves the repo "archive-ready" — STATE.md flipped to complete, footer updated, verifier confirms everything is green — and then stops.

---

## Architecture Patterns

No new architecture is introduced in this phase. The relevant existing patterns are:

### MILESTONES.md Heading Format
Top entry is always `## vX.Y Name (Shipped: YYYY-MM-DD)` followed by four bolded subsections:
1. `**Phases completed:**`
2. `**Known deferred items at close:**`
3. `**Notes:**`
4. `**Key accomplishments:**`

The v1.15.1 entry (currently lines 3–22 of MILESTONES.md) is the exact template to mirror for v1.17.

### PROJECT.md Evolution Pattern
PROJECT.md is updated at phase transitions and milestone boundaries per the `## Evolution` section. Requirements move from `### Validated` to `### Invalidated / Removed` when removed. The Validated list uses `✓` prefix with version suffix (` — vX.Y`). The Invalidated/Removed subsection does not yet exist — it must be created.

### Version Propagation Pattern
`package.json:version` → `vite.config.ts` `readFileSync` → `define.__APP_VERSION__` → `about-content.ts:appVersion` → every `AboutContent.version` field. This chain is zero-touch beyond the single `package.json` edit.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Version display in AboutSheet | Don't hardcode version string in about-content.ts | Edit only package.json | Existing `__APP_VERSION__` chain handles propagation automatically |
| Milestone archive | Don't write file-move tasks in this phase's plan | Operator runs `/gsd:complete-milestone` separately | Established ritual for all prior milestones (v1.13, v1.14, v1.15.1) |
| Playwright baseline check | Don't write custom comparison scripts | Use `pnpm exec playwright test` output | Pass/fail count is readable directly from test runner output |

---

## Common Pitfalls

### Pitfall 1: Annotating the Wrong "v1.15 PERT entry" Location
**What goes wrong:** Planner looks for a `## v1.15` heading in MILESTONES.md to annotate — it does not exist.
**Why it happens:** DOC-05 says "annotate v1.15 PERT entry" but the PERT workstream was archived to a separate directory and never received a main-MILESTONES.md entry.
**How to avoid:** The "v1.15 PERT entry" that moves is in PROJECT.md Validated list (DOC-01 handles it). MILESTONES.md's job is to receive a new v1.17 entry (via DOC-05 first bullet) and to note the v1.15 PERT removal in that new entry's Notes section.
**Warning signs:** If a task says "edit MILESTONES.md line containing `v1.15 PERT`" — flag it, there is no such line.

### Pitfall 2: Forgetting the `### Invalidated / Removed` Subsection Does Not Yet Exist
**What goes wrong:** Planner writes a task to "move the PERT bullet to `### Invalidated / Removed`" without also creating the subsection.
**Why it happens:** The subsection is referenced in DOC-01 as a target but does not currently exist in PROJECT.md.
**How to avoid:** The task for DOC-01 must both (a) remove the PERT line from `### Validated` and (b) create the `### Invalidated / Removed` subsection with the moved text.

### Pitfall 3: Changing Historical "all six" References in v1.15.1 Shipped Block
**What goes wrong:** Executor changes "all six calculators" in the v1.15.1 historical description in `## Current State`.
**Why it happens:** DOC-02 says fix "six calculators" but the scope is the `## Context` section. The v1.15.1 shipped description at line 11 says "single source of truth across all six calculators" — that was true at v1.15.1 and must stay as historical fact per D-05.
**How to avoid:** Scope all DOC-02 edits to lines within the `## Context` section (lines 162+). Do not touch the `## Current State` section (lines 8–11).

### Pitfall 4: Invoking `/gsd:complete-milestone` from a Task
**What goes wrong:** An executor task runs `/gsd:complete-milestone` as part of REL-04.
**Why it happens:** REL-04 says "v1.17 archived to `.planning/milestones/v1.17-*/`".
**How to avoid:** Per D-03 — the archive is performed by the operator separately. Phase 54 tasks must not include this command. The REL-04 task is limited to: flip STATE.md `status` to `complete`, update `stopped_at` and `last_updated`, update PROJECT.md footer date/summary.

### Pitfall 5: REL-02 Manual Edit to about-content.ts
**What goes wrong:** Executor edits `about-content.ts` to hardcode `v1.17.0`.
**Why it happens:** REL-02 says "AboutSheet displays v1.17.0".
**How to avoid:** REL-02 is verify-only (D-06). The version flows automatically via `__APP_VERSION__`. The only edit is `package.json`. The verification step is a `pnpm build` + AboutSheet visual check.

### Pitfall 6: Missing the `CalculatorStore<T>` "all 6" Factual Update
**What goes wrong:** The Architecture line about `CalculatorStore<T>` still says "all 6 calculator state singletons" after Phase 54 ships.
**Why it happens:** DOC-03's literal scope is the `<CalculatorPage>` route enumeration only. The `CalculatorStore<T>` sentence (PROJECT.md line 179) is a separate "all 6" reference.
**How to avoid:** While strictly outside DOC-03's stated scope, updating this to "all 5 calculator state singletons" is factually correct and takes one additional edit in the same DOC-02/03 task. The planner should include it.

---

## Runtime State Inventory

> SKIPPED — This is not a rename/refactor/migration phase. No runtime state carries the PERT name as an active key after Phase 52 completed the purge. All `localStorage` favorites storage already handles unknown IDs gracefully per Phase 53 (SAFE-01..03).

The Phase 52 purge already removed all live PERT runtime state:
- **localStorage favorites:** Any stored `'pert'` is silently filtered by `favorites.recover()` on load (Phase 53 SAFE-01..02 verified).
- **sessionStorage calculator state:** PERT's singleton was deleted; stale keys are ignored by the spread-pattern init.
- **App manifest / PWA cache:** Vite-plugin-pwa handles cache invalidation on version bump automatically.
- **No database, no OS-registered state, no secrets/env vars** reference PERT as a live key.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| pnpm | All tasks | Confirmed (package.json packageManager field) | ^10.33.0 | — |
| Node.js | pnpm scripts | Assumed present | Determined by runtime | — |
| svelte-check | REL-03 gate 1 | Confirmed (devDependencies) | ^4.4.2 | — |
| vitest | REL-03 gate 2 | Confirmed (devDependencies) | ^4.1.4 | — |
| Playwright + browsers | REL-03 gate 3 | Unknown — environment-dependent | ^1.59.1 | Per D-02: structural spec-count check + defer live run to CI |

**Missing dependencies with no fallback:** None — all required tools are in `devDependencies`.

**Missing dependencies with fallback:** Playwright browser binaries may not be installed in the executor environment. Per D-02, this is an explicitly pre-handled fallback: structural check + CI.

---

## Package Legitimacy Audit

> No new packages are installed in this phase. This section is N/A.

This phase performs only text edits to `.planning/` files and a `package.json` version bump. No `pnpm add` or `pnpm install` commands are needed.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| DOC-06 Outcome: `⚠️ Revisit — v1.15 PERT later removed in v1.16 (out of clinical scope)` | `❌ Removed in v1.17 — out of clinical scope (pediatric, not neonatal)` | Phase 54 (this phase) | Finalizes the PERT decision row; removes the `Revisit` flag |
| PERT listed as one of six calculators in Context | Five calculators listed; PERT removed | Phase 54 (this phase) | Brings documentation in sync with 5-calculator runtime reality |
| STATE.md `status: planning` | `status: complete` | Phase 54 (this phase) | Signals milestone close readiness to `/gsd:complete-milestone` |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `pnpm-lock.yaml` does not need regeneration after a plain `version` field bump in package.json | REL-01 | Low — if pnpm does update lockfile, a `pnpm install` is needed before committing; easy to catch |
| A2 | Playwright browser binaries may not be installed in the executor environment | REL-03 (gate 3) | Low — D-02 already provides the fallback: structural check + CI |

**All other claims in this research were verified by reading live files in this session.**

---

## Open Questions

1. **Phase 54 plan count for MILESTONES.md entry**
   - What we know: D-07 says "Phases completed (Phases 52–54; 52: 3 plans, 53: 1 plan, 54: N plans)"
   - What's unclear: "N plans" is unknown until Phase 54 planning completes.
   - Recommendation: The MILESTONES.md entry is written in the final REL-04 task, after the plan count is known. The planner should leave a placeholder `[FILL IN: N plans]` in the task template.

2. **The `## Current Milestone` section in PROJECT.md**
   - What we know: DOC-01..06 do not explicitly target the `## Current Milestone: v1.17 Remove PERT Calculator` section (lines 129–146) or the `## Active` entry (line 127).
   - What's unclear: Should these be updated as part of REL-04 (PROJECT.md footer) or are they left for `/gsd:complete-milestone`?
   - Recommendation: These sections are updated by `/gsd:complete-milestone` as part of milestone archival, NOT by Phase 54. The planner should not add a task for these unless the operator confirms otherwise. The footer update (line 241) is the only PROJECT.md change for REL-04.

---

## Sources

### Primary (HIGH confidence — all verified by reading live files)

- `.planning/PROJECT.md` — all section content read directly; every quoted string confirmed line-by-line
- `.planning/MILESTONES.md` — all headings enumerated; v1.15.1 format template read
- `.planning/STATE.md` — frontmatter fields read; Deferred Items table read
- `package.json` — version 1.16.1 confirmed
- `vite.config.ts` — `__APP_VERSION__` define chain confirmed at lines 7+11
- `src/lib/shared/about-content.ts` — version consumer confirmed at line 13
- `.planning/phases/54-documentation-cleanup-release-v1-17-0/54-CONTEXT.md` — all decisions read
- `.planning/REQUIREMENTS.md` — all DOC/REL acceptance criteria read
- `.planning/config.json` — `workflow.nyquist_validation: false` confirmed (Validation Architecture section omitted)

---

## Metadata

**Confidence breakdown:**
- DOC edit targets: HIGH — all strings verified by reading live files
- REL version wiring: HIGH — full chain read from source
- Clinical gate commands: HIGH — read from package.json scripts + confirmed by CONTEXT.md D-01
- MILESTONES.md format: HIGH — v1.15.1 template read directly
- pnpm-lock.yaml behavior: ASSUMED (A1) — standard pnpm behavior, easy to verify

**Research date:** 2026-05-23
**Valid until:** Permanent for this phase (all findings are static file content that won't drift before planning)
