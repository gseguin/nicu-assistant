# Phase 4: Design Polish (`/impeccable` Critique Sweep) — Research

**Researched:** 2026-04-25
**Domain:** `/impeccable` critique-driven design polish against a SvelteKit dev server (8 contexts: theme×viewport×mode)
**Confidence:** HIGH (skill manifest read + CLI probed live; dev-server lifecycle confirmed against Phase 3.1 patterns; clinical-gate sequence inherited verbatim from `03.1-04-SUMMARY.md`)

## Summary

CONTEXT.md (D-01..D-11) and UI-SPEC.md are LOCKED. Wave 1 runs 8 `/impeccable critique` invocations (one per `theme × viewport × mode` triple) against a live `pnpm dev` server, captures transcripts to `04-CRITIQUE-{theme}-{viewport}-{mode}.md`, normalizes findings into `04-FINDINGS.md`, then tears down. Wave 2 ships P1 fixes inside the D-08 allowlist (PERT-route only). Wave 3 re-runs the critique sweep + the 7-gate clinical sequence verbatim from `03.1-04-SUMMARY.md`, plus the 11 design-polish-specific gates from UI-SPEC.

The skill is **multi-phase, not single-shot**. Each `/impeccable critique <URL>` runs (A) an LLM Design Review sub-agent (visual + Nielsen heuristics scoring out of /40) and (B) an Automated Detection pass (`npx impeccable detect --json` for static files OR `npx impeccable live` for browser overlay). The score lives in the LLM Review's "Design Health Score" table — there is **no separate `/impeccable score` subcommand**.

**Primary recommendation for the planner:** Wave 1 task structure should be `pnpm dev` (background, port 5173) → 8 critique-pass tasks driven by Playwright for theme+viewport+mode setup → critique invocation → transcript capture → teardown. Each pass is independent; they CAN run in parallel if Playwright spins isolated browser contexts, but a sequential loop is simpler and the human-readable artifact matters more than wall-clock time. The CLI `npx impeccable detect --json src/lib/pert/PertCalculator.svelte src/lib/pert/PertInputs.svelte src/routes/pert/+page.svelte` runs once as a deterministic seed and produced `[]` (zero detections) on the current code, confirming the static surface is clean before the LLM-driven critique sweep starts.

## Approach (recap of CONTEXT D-01 + D-07)

Per CONTEXT D-01: 8 critique passes (light/dark × mobile-375/desktop-1280 × oral/tube-feed) → 8 transcripts in `04-CRITIQUE-{theme}-{viewport}-{mode}.md` → one normalized `04-FINDINGS.md` triage table.

Per CONTEXT D-07 + D-07a: 3-wave structure with **Wave 2 replan beat** — only Wave 1 + Wave 3 plans are authored in the initial planning pass; Wave 2 plan(s) are generated AFTER Wave 1 ships findings via `/gsd-plan-phase 4 --gaps` (or equivalent). Wave 3 = single `04-LAST-PLAN.md` running the 7 clinical gates + 11 design-polish gates + writing `04-VERIFICATION.md`.

Per CONTEXT D-04: phase passes when `/impeccable` Design Health Score ≥35/40 in ≥6/8 contexts AND aggregate ≥35/40 AND zero P1 remain AND `04-AUDIT.sh` exits 0.

## /impeccable Invocation (the critical section)

### Skill manifest verified

**Location (single canonical path):** `~/.claude/plugins/marketplaces/impeccable/.claude/skills/impeccable/SKILL.md` (v3.0.1, Apache 2.0, based on Anthropic's frontend-design skill).

There is **no** `~/.claude/skills/impeccable*` install (probed; glob returns no matches). The plugin marketplace install is the only path — references in CONTEXT.md and UI-SPEC.md to "or equivalent path" should be removed by the planner; one canonical path exists.

**Reference files** (read by the skill at runtime, all under `~/.claude/plugins/marketplaces/impeccable/.claude/skills/impeccable/reference/`):
- `critique.md` (the actual critique workflow — confirms what UI-SPEC §"How `/impeccable critique` actually works" already documents)
- `heuristics-scoring.md` (Nielsen 10 × 0-4 scale; total /40; rating bands at 36-40 Excellent / 28-35 Good / 20-27 Acceptable / 12-19 Poor / 0-11 Critical; **P0/P1/P2/P3 severity table**)

### CLI probe results (LIVE this session)

```bash
$ npx --yes -p impeccable@latest impeccable --help
Usage: impeccable <command> [options]
Commands:
  detect [file-or-dir-or-url...]   Scan for UI anti-patterns and design quality issues
  live [--port=PORT]               Start browser detection overlay server
  live stop                        Stop a running live server
  skills help|install|update|check
```

```bash
$ npx --yes -p impeccable@latest impeccable detect --help
Detection modes:
  HTML files     jsdom with computed styles (default, catches linked CSS)
  Non-HTML files Regex pattern matching (CSS, JSX, TSX, etc.)
  URLs           Puppeteer full browser rendering (auto-detected)
  --fast         Forces regex for all files
Examples:
  impeccable detect src/
  impeccable detect index.html
  impeccable detect https://example.com
  impeccable detect --fast --json .
```

**The CLI subcommand is `detect`, NOT `--json`.** UI-SPEC at §"CLI scan branch" used `npx impeccable --json src/lib/pert/...` — that flag form does not exist as a top-level `impeccable` command. Correct form is:

```bash
npx --yes -p impeccable@latest impeccable detect --json src/lib/pert/PertCalculator.svelte src/lib/pert/PertInputs.svelte src/routes/pert/+page.svelte
```

**Live probe of the 3 PERT route files returned `[]` (exit 0)** — the static surface is clean of the 25 deterministic patterns the detector ships with. This confirms findings will come from the LLM Design Review (Assessment A) and not from the deterministic detector (Assessment B / CLI branch). The Wave 1 plan should still run the CLI scan as a deterministic pre-filter (and to seed `04-FINDINGS.md`'s "Automated detection" column), but the realistic expected output is still `[]`.

### Slash command vs Skill tool invocation

Per CONTEXT D-09's researcher TODO: `/impeccable critique <URL>` IS the canonical invocation form. The skill is `user-invocable: true` per its frontmatter (line 5 of SKILL.md), meaning the user/agent can invoke it as a slash command. The Wave 1 plan tasks should embed:

```
/impeccable critique http://localhost:5173/pert
```

…executed via the `Skill(skill="impeccable", args="critique http://localhost:5173/pert")` tool call, OR (in a Claude Code session) as a literal `/impeccable critique http://localhost:5173/pert` slash command. Both routes are valid; the planner picks based on whether Wave 1 is executed by an agent (Skill tool) or a human-in-the-loop session (slash command).

### Per-context invocation form (planner pastes verbatim)

**The skill takes NO theme/viewport/mode flags.** Those are browser-side state, set BEFORE the critique invocation by Playwright (or chrome-devtools-mcp if available). The pattern is:

```
For each (theme, viewport, mode) triple in {light,dark}×{mobile-375,desktop-1280}×{oral,tube-feed}:
  1. Set viewport via Playwright browser context (width 375 + height 667, OR width 1280 + height 800)
  2. Navigate to http://localhost:5173/pert
  3. localStorage.setItem('nicu_assistant_theme', '<theme>') + page.reload()
  4. Click SegmentedToggle to <mode> (Oral or Tube-Feed)
  5. Drive inputs via Playwright UI (NOT pertState mutation — exercises the Phase 3.1 picker UX)
  6. Invoke /impeccable critique http://localhost:5173/pert
  7. Capture transcript to 04-CRITIQUE-<theme>-<viewport>-<mode>.md
```

**Theme storage key (verified live):** `nicu_assistant_theme` (NOT `theme` — confirmed via `grep -nE "localStorage" src/lib/shared/theme.svelte.ts` showing `localStorage.setItem('nicu_assistant_theme', value)` at line 14 + `localStorage.getItem('nicu_assistant_theme')` at line 26). UI-SPEC §"Theme" already uses the correct key — verified.

**Mode click selectors (verified against `e2e/pert.spec.ts:74-75`):**
```typescript
await scope.getByRole('button', { name: /^Medication/ }).click();   // anchored regex per Phase 3.1 deviation 03.1-02
await page.getByRole('option', { name: /^Creon$/ }).click();         // option lives in page-level dialog (D-06)
```

For mode switching specifically, the SegmentedToggle uses `role="tab"` per UI-SPEC §"Mode Switching":
```typescript
await page.getByRole('tab', { name: /Tube-Feed/ }).click();
// Verify with: await expect(page.getByRole('tab', { name: /Tube-Feed/, selected: true })).toBeVisible();
```

### Score extraction

The Nielsen Design Health Score lives in the critique transcript as a markdown table (per `reference/critique.md` lines 92-108). Format:

```markdown
| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | [...] |
| ...
| 10 | Help and Documentation | 3 | |
| **Total** | | **34/40** | **Good** |
```

**Regex to extract the total** (for the Wave 3 verifier to tabulate per-context scores):
```bash
grep -oE '\*\*Total\*\*.*\*\*([0-9]+)/40\*\*' 04-CRITIQUE-*.md | grep -oE '[0-9]+/40'
```

OR more robust (handles whitespace variations):
```bash
grep -E '^\|\s*\*\*Total\*\*' 04-CRITIQUE-light-mobile-oral.md | grep -oE '[0-9]+/40' | head -1
```

The verifier runs this 8 times (one per transcript) and pastes the per-context scores into `04-VERIFICATION.md` Gate 16/17 evidence rows.

### `npx impeccable live` — DO NOT USE in Wave 1

The `live` subcommand spins a localhost server that injects a `<script>` overlay into the page. It requires:
- Browser automation that can navigate + inject (`chrome-devtools-mcp` OR Playwright with explicit injection step)
- A new tab that the user/agent can read console messages from

**For Wave 1, skip `npx impeccable live`.** The LLM Design Review (Assessment A) does the same job via sub-agent visual inspection, and the CLI `detect` covers the deterministic Assessment B branch. Adding `live` triples the orchestration complexity (server lifecycle + script injection + console scrape + cleanup) for the same critique output. If the critique transcript quality is insufficient on a first run, Wave 2's replan beat can layer in `live` for follow-up passes.

### Setup gate: PRODUCT.md missing

**CRITICAL:** `PRODUCT.md` is **not present** at the repo root (probed `ls PRODUCT.md` → no such file). Per SKILL.md §"Setup (non-optional)" lines 17-37:

> If PRODUCT.md is missing, empty, or placeholder (`[TODO]` markers, <200 chars): run `/impeccable teach`, then resume the user's original task with the fresh context.

The `/impeccable critique` invocation will likely abort or degrade to "generic output that ignores the project" if PRODUCT.md is absent. **DESIGN.md IS present** (verified via `ls DESIGN.md DESIGN.json` → both at 25KB+ each, dated 2026-04-24 from Phase 42.1) — so the design contract is loaded, but the "users / brand / tone / anti-references / strategic principles" context is missing.

**Wave 1 plan must address this BEFORE the 8-context sweep.** Two options for the planner:

| Option | Action | Tradeoff |
|--------|--------|----------|
| **A (recommended)** | Wave 1 Task 0: Author `PRODUCT.md` at repo root from CLAUDE.md §"Design Context" (lines covering Users / Brand Personality / Emotional Goals / Aesthetic Direction / Design Principles — already curated in CLAUDE.md) | Adds 1 small task to Wave 1 (~1 file, ~80 lines transcribed from CLAUDE.md). Stays inside D-08a allowlist? **NO — repo-root file is NOT in the D-08 PERT-route allowlist.** Requires CONTEXT amendment OR Rule-4 escalation. |
| **B** | Wave 1 Task 0: Run `/impeccable teach` once at the start (the SKILL fallback), let it author PRODUCT.md interactively, then proceed with the sweep | Adds an interactive step (user input required); not auto-runnable. Avoids the D-08 boundary check (the file is authored by the skill, not by Phase 4 fix code). |

Recommendation: **Option B.** `/impeccable teach` is the documented setup path; using it preserves the v1.13 Phase 42.1 precedent where the same skill pipeline produced DESIGN.md (Phase 42.1 D-31 cites `/impeccable document`). PRODUCT.md is design-context, NOT PERT-route code; it lives outside the D-08 allowlist by category, not by accident. Acknowledgment in `04-SUMMARY.md` (analogous to D-08a exception note) covers the audit trail.

If Option B is unworkable in an `--auto` orchestration, fall back to Option A and amend CONTEXT D-08a to add `PRODUCT.md` as an explicit allowed exception with rationale.

## Dev Server Lifecycle

### Start (background)

`vite.config.ts` does NOT pin a port (verified — only `port` reference is in PWA manifest `orientation: 'portrait'`, unrelated). Vite defaults to **5173**, auto-increments to 5174/5175 if 5173 is busy. `playwright.config.ts:21` confirms dev runs at `http://localhost:5173` (the default), and `webServer` config uses `port: 5173, reuseExistingServer: true` for non-CI.

**Recommended start command:**

```bash
# Pin port + strict (fails fast if 5173 occupied — no silent port surprise)
PORT=5173
pnpm dev --port $PORT --strictPort > /tmp/04-wave1-dev.log 2>&1 &
DEV_PID=$!
echo "DEV_PID=$DEV_PID" > /tmp/04-wave1-dev.pid
```

`--strictPort` is a Vite flag (verified docs); without it, Vite picks the next free port and the critique URLs become wrong. The Wave 1 plan MUST use `--strictPort` to ensure the URL `http://localhost:5173/pert` is correct for all 8 invocations.

### Wait for ready

Vite logs `ready in <N> ms` to stdout when the dev server is reachable. Typical startup is 2-5 seconds for this codebase (Phase 3 baseline). Wait pattern:

```bash
# Poll until /pert returns 200, max 30s
for i in $(seq 1 30); do
  if curl -sf -o /dev/null http://localhost:5173/pert; then
    echo "dev server ready after ${i}s"
    break
  fi
  sleep 1
done

# Fallback assertion: if loop exhausted without 200, kill PID and abort
if ! curl -sf -o /dev/null http://localhost:5173/pert; then
  echo "FATAL: dev server did not become ready in 30s"
  cat /tmp/04-wave1-dev.log | tail -20
  kill -TERM $DEV_PID 2>/dev/null
  exit 1
fi
```

### Tear down (end of Wave 1 + Wave 3)

```bash
kill -TERM $(cat /tmp/04-wave1-dev.pid) 2>/dev/null
sleep 2
# Force-kill if still alive (rare but possible if Vite is mid-HMR)
kill -9 $(cat /tmp/04-wave1-dev.pid) 2>/dev/null || true
rm -f /tmp/04-wave1-dev.pid /tmp/04-wave1-dev.log
```

### Production-build fallback (only if dev server hits >30s startup)

```bash
pnpm build && pnpm preview --port 4173 --strictPort > /tmp/04-wave1-preview.log 2>&1 &
# Then critique against http://localhost:4173/pert
```

`pnpm preview` matches what Playwright uses in CI (`playwright.config.ts:24`). Trade-off: production build strips dev-only diagnostics; the critique sees what users actually see, which is slightly preferable. The downside is the build step adds ~8s (Phase 3.1 Gate 3 measured `built in 8.32s`). Default to `pnpm dev`; switch to preview only if dev startup misbehaves.

## Theme + Viewport + Mode Switching (per-context recipes)

### Viewport

Playwright config defines `Desktop Chrome` by default. For the 8-context sweep, override per-test via `test.use({ viewport: ... })`:

```typescript
// e2e/pert.spec.ts:24-27 already does this via a for-loop:
for (const viewport of [
  { name: 'mobile' as const, width: 375, height: 667 },     // iPhone 14 mini
  { name: 'desktop' as const, width: 1280, height: 800 }    // standard desktop laptop
]) {
  test.use({ viewport: { width: viewport.width, height: viewport.height } });
  // ...
}
```

The Wave 1 critique loop should mirror this — use the same widths Phase 3 e2e tests use (375 × 667 and 1280 × 800), NOT the UI-SPEC's stated `1280 × 720` or `375 × 812` (the e2e baseline is the ground truth; deviating means the critique sees a layout the e2e suite never tests).

### Theme

Set via `localStorage.setItem('nicu_assistant_theme', 'dark' | 'light')` BEFORE navigation, then reload. The FOUC inline script in `app.html` reads the same key on initial load — setting it before navigation prevents the initial-paint flash from contaminating the critique.

```typescript
// In Playwright test setup:
await page.addInitScript(() => {
  localStorage.setItem('nicu_assistant_theme', 'dark');  // or 'light'
});
await page.goto('http://localhost:5173/pert');
// theme module's onMount → theme.init() reads the key and applies .dark + data-theme
```

### Mode

`SegmentedToggle` renders as `role="tablist"` per Phase 2 D-06. Mode switch:

```typescript
await page.getByRole('tab', { name: /Tube-Feed/ }).click();
// Wait for state propagation
await expect(page.getByRole('tab', { name: /Tube-Feed/, selected: true })).toBeVisible({ timeout: 2000 });
```

For Oral mode (the default): no click needed — first paint is Oral.

### Inputs (drive via Playwright UI per UI-SPEC §"Live server pipeline" step f)

**Oral mode** (matches UI-SPEC matrix row #1):
```typescript
const scope = getInputsScope(page, viewport.name);  // helper at e2e/pert.spec.ts:15
await scope.getByLabel('Weight', { exact: true }).fill('9.98');
await scope.getByLabel('Fat per meal').fill('25');
await scope.getByLabel('Lipase per gram of fat').fill('1000');
await scope.getByRole('button', { name: /^Medication/ }).click();
await page.getByRole('option', { name: /^Creon$/ }).click();
await expect(scope.getByRole('button', { name: /^Strength/ })).toContainText(/Select strength/);
await scope.getByRole('button', { name: /^Strength/ }).click();
await page.getByRole('option', { name: /12,000 units/ }).click();
```

**Tube-Feed mode** (matches UI-SPEC matrix row #2):
```typescript
await page.getByRole('tab', { name: /Tube-Feed/ }).click();
const scope = getInputsScope(page, viewport.name);
await scope.getByLabel('Weight', { exact: true }).fill('6.80');
// Formula picker is searchable (combobox role per Phase 3.1 deviation 03.1-03)
await scope.getByRole('combobox', { name: /^Formula/ }).click();
await page.getByRole('textbox', { name: /Filter Formula/i }).fill('Kate Farms');
await page.getByRole('option', { name: /Kate Farms Pediatric Standard 1\.2/ }).click();
await scope.getByLabel('Volume per day').fill('1000');
await scope.getByLabel('Lipase per gram of fat').fill('1000');
await scope.getByRole('button', { name: /^Medication/ }).click();
await page.getByRole('option', { name: /^Creon$/ }).click();
await scope.getByRole('button', { name: /^Strength/ }).click();
await page.getByRole('option', { name: /12,000 units/ }).click();
```

**Selector hardening (carry-forward from Phase 3.1 deviations):**
- Use anchored regex (`/^Medication/`, `/^Strength/`, `/^Formula/`) to disambiguate when sibling pickers contain the same keyword in their placeholder text (Phase 3.1 03.1-02 deviation).
- Searchable SelectPicker triggers are `combobox` (not `button`); search inputs are `textbox` (not `searchbox`) (Phase 3.1 03.1-03 deviation).
- Numeric assertions use `{ exact: true }` to avoid superstring match (Phase 3.1 03.1-03 deviation).

## Playwright Screenshot Fallback

**Default path:** `/impeccable critique <URL>` drives its own browser via the LLM Design Review sub-agent. No screenshot capture step needed in Wave 1 if the executor's environment supports browser automation (Claude Code with chrome-devtools-mcp OR Playwright that the sub-agent can spawn).

**Fallback path** (only if the executor's environment lacks browser automation):

```typescript
// playwright.critique.config.ts at .planning/workstreams/pert/phases/04-design-polish-impeccable/
// Playwright DOES accept configs at non-root paths via --config flag (verified docs):
//   pnpm exec playwright test --config=.planning/workstreams/pert/phases/04-design-polish-impeccable/playwright.critique.config.ts

import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: '.',  // adjacent to this config
  use: { baseURL: 'http://localhost:5173' },
  webServer: undefined,  // dev server is started by Wave 1 plan, not by Playwright
  projects: [
    { name: 'mobile', use: { viewport: { width: 375, height: 667 } } },
    { name: 'desktop', use: { viewport: { width: 1280, height: 800 } } }
  ]
});
```

```typescript
// 04-critique-capture.spec.ts (sibling to the config)
import { test } from '@playwright/test';
for (const theme of ['light', 'dark']) {
  for (const mode of ['oral', 'tube-feed']) {
    test(`@critique-${theme}-${mode}`, async ({ page }, testInfo) => {
      await page.addInitScript((t) => localStorage.setItem('nicu_assistant_theme', t), theme);
      await page.goto('/pert');
      if (mode === 'tube-feed') await page.getByRole('tab', { name: /Tube-Feed/ }).click();
      // Drive inputs (same pattern as above)
      await page.screenshot({
        path: `screenshots/${theme}-${testInfo.project.name}-${mode}.png`,
        fullPage: true
      });
    });
  }
}
```

Then critique the screenshot:
```
/impeccable critique screenshots/light-mobile-oral.png
```

**Reuse vs. new config:** Place this in the phase directory (`.planning/workstreams/pert/phases/04-design-polish-impeccable/`), NOT in the e2e suite. Reasoning: the e2e suite is owned by Phase 3 and cannot grow new tests in Phase 4 (D-08 forbids — only `e2e/pert.spec.ts` selector-only updates allowed per D-08a). A separate config inside the phase dir lives in the phase artifact set and gets cleaned up at Phase 4 close.

**Skip this section in the plan if** the executor confirms browser automation is available — the default `/impeccable critique <URL>` path is simpler.

## Clinical Gate Inheritance (verbatim from Phase 3.1 plan 04)

The Wave 3 plan inherits the 7-gate sequence from `03.1-04-SUMMARY.md` lines 68-77. **Phase 4 expected counts (CONFIRMED IDENTICAL to Phase 3.1 baseline)** because Phase 4 only modifies styling/markup inside the PERT-route allowlist; no test changes, no calc-layer changes:

| # | Gate | Command | Expected (Phase 4 = Phase 3.1 baseline) |
|---|------|---------|-----------------------------------------|
| 1 | svelte-check | `pnpm exec svelte-check` | `0 errors / 0 warnings` (~4586 files) |
| 2 | vitest | `pnpm test:run` | `425 passed (425)` (Test Files 41 passed) |
| 3 | pnpm build | `pnpm build` | exit 0; PWA `precache 49 entries (~576 KiB)` (tolerance ±5 KiB) |
| 4 | pert-a11y | `CI=1 pnpm exec playwright test pert-a11y --reporter=line` | `4 passed` |
| 5 | pert.spec | `CI=1 pnpm exec playwright test pert.spec --reporter=line` | `12 passed` |
| 6 | full Playwright | `CI=1 pnpm exec playwright test --reporter=line` | `117 passed, 1 failed` (the same `disclaimer-banner.spec.ts:28` baseline flake every Phase 1+2+3+3.1 carried) |
| 7 | negative-space audit | `git diff --name-only $BASELINE..HEAD -- 'src/' 'e2e/' \| grep -vE '^(src/lib/pert/\|src/routes/pert/\|src/app\.css$\|src/lib/shell/registry\.ts$\|e2e/pert(-a11y)?\.spec\.ts$)'` | empty output |

**Baseline commit for Gate 7:** Phase 3.1 closure commit. Per `STATE.md` lines 47-48 + the dependency_graph in `03.1-04-SUMMARY.md`, the verified Phase 3.1 closure SHAs are `f2da16d` (plan 01), `dfb6a62` (plan 02), `0d9636f` (plan 03), `f89fc37` (pre-plan-04). The plan-04 SUMMARY commit is "pending" per `03.1-04-SUMMARY.md` line 9 — the Wave 3 plan should resolve `$BASELINE` at execution time as the actual HEAD of Phase 3.1 (the `requirements mark-complete PERT-TEST-05` commit OR the commit that captures `03.1-04-SUMMARY.md`).

```bash
# Wave 3 plan resolves $BASELINE deterministically:
BASELINE=$(git log --oneline --all -- '.planning/workstreams/pert/phases/03.1-selectpicker-bridge-fix/03.1-04-SUMMARY.md' | head -1 | awk '{print $1}')
echo "Phase 4 baseline: $BASELINE"
git diff --name-only $BASELINE..HEAD -- 'src/' 'e2e/' | grep -vE '^(src/lib/pert/|src/routes/pert/|src/app\.css$|src/lib/shell/registry\.ts$|e2e/pert(-a11y)?\.spec\.ts$)'
# Expected: empty (no out-of-allowlist files touched)
```

**Why counts won't change:** Phase 4 fixes are styling/markup-only inside `src/lib/pert/{PertCalculator,PertInputs}.svelte` + `src/routes/pert/+page.svelte`. The vitest suite asserts behavior via component tests (PertCalculator.test.ts, PertInputs.test.ts, calculations.test.ts) that test functions/state, not pixel-level styling. The pert.spec asserts user flows + numeric outputs — unchanged by polish. The pert-a11y axe sweep asserts WCAG AA contrast — Phase 1 D-04 already locked .identity-pert at 4.5:1; if a P1 contrast retune is required in Wave 2 (D-08a exception), the post-fix sweep MUST still pass 4/4 (regression guard). The full Playwright suite includes the disclaimer-banner.spec.ts:28 baseline flake which Phase 4 inherits unchanged.

**If Wave 2 changes counts:** that is itself a verification signal — investigate before proceeding. Possible legitimate causes: (a) a P1 fix changed an aria-label that an e2e test queries for (in which case `e2e/pert.spec.ts` selector update is allowed per D-08a), (b) a string change altered a numeric format in a way the e2e test asserts. In either case, document in Wave 2 SUMMARY explicitly.

### 11 design-polish gates (Phase 4 additions)

UI-SPEC §"Design-polish-specific gates" (gates 8-18) authoritatively defines these. Wave 3 plan executes them after gates 1-7 and pastes evidence into `04-VERIFICATION.md`. The gates are: AUDIT.sh exit 0 (gate 8), Identity-pert reservation manual check (9), STOP-red carve-out manual check (10), em-dash + en-dash sweep (11), tabular-numerals manual check (12), function-binding bridges intact regression guard (13), 8 critique transcripts captured (14), FINDINGS triage populated with 0 unhandled P1 (15), per-context score ≥35/40 in ≥6/8 (16), aggregate ≥35/40 (17), Watch Item 6 SelectPicker findings deferred (18).

## Pitfalls

### Pitfall 1: PRODUCT.md missing → critique degrades to generic output

**What goes wrong:** SKILL.md §Setup mandates PRODUCT.md OR PRODUCT.md ≥200 chars without `[TODO]` markers. If the file is absent, the skill explicitly says "produces generic output that ignores the project."

**Why it happens:** Phase 42.1 ran `/impeccable document` to produce DESIGN.md but apparently did not run `/impeccable teach` to produce PRODUCT.md (verified — only DESIGN.md and DESIGN.json exist at repo root).

**Mitigation:** Wave 1 plan Task 0 = invoke `/impeccable teach` once to author PRODUCT.md. CLAUDE.md §"Design Context" already contains all the source material (Users, Brand Personality, Emotional Goals, Aesthetic Direction, Design Principles) — `/impeccable teach` will use it. Document the file write in `04-SUMMARY.md` as an explicit boundary acknowledgment (PRODUCT.md is repo-root, NOT in the D-08 PERT-route allowlist; classify as "skill-authored setup artifact, not a Phase 4 fix").

**Warning sign at execution:** the first critique transcript reads as generic "your interface should consider..." instead of citing NICU/clinical/PERT-specific terminology. If detected, abort Wave 1, run `/impeccable teach`, restart.

### Pitfall 2: Critique transcript lacks the /40 score

**What goes wrong:** The LLM Design Review (Assessment A) is supposed to produce the Nielsen 10-heuristic table, but variation is possible — the sub-agent might output prose-only critique without the table.

**Why it happens:** The skill returns "structured findings" from the sub-agent (per `reference/critique.md` line 38) but the synthesis step (lines 86-108) is what assembles the table. If the synthesis step skips the table for any reason (truncation, format drift), the score-extraction regex returns nothing.

**Mitigation:** Wave 1 plan post-condition for each transcript:
```bash
# Verify transcript contains the score table
if ! grep -qE '\*\*Total\*\*.*[0-9]+/40' 04-CRITIQUE-${theme}-${viewport}-${mode}.md; then
  echo "WARN: transcript missing Design Health Score table for ${theme}-${viewport}-${mode}"
  # Retry once (simple fix: re-invoke /impeccable critique)
  # If retry also fails, mark this context as "blocked" in 04-FINDINGS.md and proceed with the other 7
fi
```

Per CONTEXT D-04, the phase passes when ≥6/8 contexts achieve ≥35/40 — so 1 blocked context is tolerable as long as the remaining 7 achieve the bar (which gives 6 ≥35 + 1 anywhere = pass).

### Pitfall 3: Dev server takes >30s to start (after fresh install)

**What goes wrong:** First `pnpm dev` after `pnpm install` triggers Vite's full dependency optimization (`prebundle`); can take 30-60s on a cold cache.

**Why it happens:** Vite optimizeDeps scans `node_modules` and prebundles CommonJS deps to ESM. Cold cache = first-run-of-the-day or post-install latency.

**Mitigation:** Pre-warm before Wave 1 starts:
```bash
# Prime Vite's optimizeDeps cache (~10-30s; afterwards startup is 2-5s)
pnpm dev --port 5173 --strictPort > /tmp/04-warm.log 2>&1 &
PRIME_PID=$!
# Wait for ready
for i in $(seq 1 60); do
  if curl -sf -o /dev/null http://localhost:5173/pert; then break; fi
  sleep 1
done
kill -TERM $PRIME_PID
sleep 2
# Now the .vite cache is warm; subsequent starts are fast
```

OR fall back to `pnpm preview` (production build, no Vite optimization step at runtime).

### Pitfall 4: P1 fix invalidates an e2e selector

**What goes wrong:** A P1 fix changes a class name, aria-label, or button name that `e2e/pert.spec.ts` or `e2e/pert-a11y.spec.ts` queries for. The clinical gate (Wave 3 Gate 5 or Gate 6) regresses.

**Why it happens:** `pert.spec.ts:74-75` queries `getByRole('button', { name: /^Medication/ })` — if a polish fix relabels the picker accessible name (e.g. "Choose medication" → "Pick medication"), the regex breaks. Many P1 fixes are aria-label or name tweaks.

**Mitigation:** D-08a explicitly permits **selector-only updates** to `e2e/pert.spec.ts` and `e2e/pert-a11y.spec.ts` in the SAME commit as the P1 fix. The Wave 2 fix plan that ships the rename MUST include the corresponding e2e regex update as a same-task (or same-plan) deliverable. The `04-FINDINGS.md` proposed-fix column should call this out: e.g. "rename Strength placeholder; same commit also updates pert.spec.ts:80 regex to /Pick strength/".

The plan-checker should flag any Wave 2 plan that touches a string a Phase 3 e2e test depends on without ALSO updating the test selector.

### Pitfall 5: SelectPicker findings (Watch Item 6) get auto-fixed by mistake

**What goes wrong:** Wave 1 critique flags polish issues with the SelectPicker dialog mobile UX (scroll behavior, search auto-focus, dismiss tap target). Executor sees them in `04-FINDINGS.md`, reaches for `src/lib/shared/components/SelectPicker.svelte` to fix.

**Why it happens:** SelectPicker is a shared component. D-08b strictly forbids edits. UI-SPEC §"PERT-Specific Watch Items" #6 documents this disposition (defer with cross-reference) but a fast-path executor might miss the boundary.

**Mitigation:** The Wave 2 fix plan template should include a hard guard: any `04-FINDINGS.md` row whose `proposed fix` column mentions `SelectPicker.svelte` (or any other path under `src/lib/shared/components/`) gets disposition `defer` automatically, with the rationale row pre-filled `cross-calculator backlog per CONTEXT D-08b + UI-SPEC Watch Item 6`. The plan-checker greps for any Wave 2 task that edits a forbidden path and stops.

### Pitfall 6: `npx impeccable detect` returns `[]` and the planner concludes "no findings"

**What goes wrong:** The CLI scan covers 25 deterministic patterns (gradient text, side-stripe borders, glassmorphism, hero-metric template, identical card grids, etc.). The PERT route file scan returned `[]` LIVE this session (probed). Naive interpretation: "no findings, ship it."

**Why it happens:** The CLI is an Assessment B / deterministic detector; it does NOT replace the LLM Design Review. CONTEXT D-04 gates on the Design Health Score from Assessment A, not on Assessment B's exit code. Most polish findings (identity-hue contrast, hero hierarchy, micro-typography, theme asymmetry) are subjective and only the LLM review surfaces them.

**Mitigation:** Wave 1 plan MUST run BOTH the LLM critique (8 invocations of `/impeccable critique`) AND the CLI detect (1 invocation). The CLI output goes into `04-FINDINGS.md` "Automated detection" column as a deterministic seed; the score and the bulk of findings come from the LLM transcripts. Wave 3 Gate 14 asserts 8 transcripts exist; Gate 16 reads the score from the transcripts. The CLI alone does not pass the phase.

## Open Questions

1. **PRODUCT.md authoring boundary.** The cleanest read of CONTEXT D-08 says PRODUCT.md is out-of-allowlist. The cleanest read of SKILL.md §Setup says the critique cannot run without it. Open question for the planner / discuss-phase: amend D-08a to add `PRODUCT.md` as an explicit allowed exception, OR treat it as a "skill-authored setup artifact" outside the allowlist machinery? Recommendation in Pitfall 1 above is the latter, but the planner may prefer the former for a cleaner audit trail.

2. **Per-pass parallelism.** 8 sequential critique passes will take ~8 × N minutes where N is the per-pass duration (LLM Design Review + CLI detect + transcript write). If N=5min, total Wave 1 = 40min. Open question: does the planner ship Wave 1 as a single plan with 8 sequential tasks, or as 8 parallel tasks (with separate Playwright browser contexts)? Recommendation: sequential. Parallel wastes wall-clock since each pass needs a different browser state, and isolating browser contexts adds orchestration complexity for marginal gain.

3. **Wave 3 critique re-run scope.** UI-SPEC §"Wave Structure" Wave 3 row says "Re-run `/impeccable critique` on post-fix UI for all 8 contexts." If Wave 2 only fixed P1s in 2 of 8 contexts (e.g. light-mobile-oral and dark-desktop-tube-feed), is re-running the other 6 still required? CONTEXT D-04 gates on aggregate AND ≥6/8 score, so all 8 must be re-scored. **Recommendation: yes, re-run all 8.** Mark for the planner to confirm.

4. **`npx impeccable live` opt-in.** This research recommends NOT using `live` in Wave 1 (added complexity for no clear benefit). Open: should the Wave 2 replan beat reserve `live` as a follow-up tool if Wave 1 transcripts surface ambiguous visual findings (e.g. "may be a contrast issue, can't tell from screenshot alone")? Recommendation: yes, document it as an optional Wave 2 instrument; the replan beat already gives the planner room to add it case-by-case.

5. **`/impeccable teach` interactivity.** The skill is documented as interactive (asks the user about brand/audience). In `--auto` orchestration mode with no user-in-the-loop, can it run? Open question — may require a fallback where Phase 4 plan Task 0 manually authors PRODUCT.md from CLAUDE.md §"Design Context" (Option A in Pitfall 1) to keep `--auto` viable.

## RESEARCH COMPLETE
