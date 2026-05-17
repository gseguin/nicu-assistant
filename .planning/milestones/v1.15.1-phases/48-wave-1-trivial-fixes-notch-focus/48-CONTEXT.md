# Phase 48: Wave-1 — Trivial Fixes (NOTCH + FOCUS) - Context

**Gathered:** 2026-04-27
**Status:** Ready for planning
**Mode:** `--auto` (Claude picked recommended defaults from PITFALLS.md HIGH-confidence research; no interactive questions)

<domain>
## Phase Boundary

**Goal:** Land the two "trivial" iOS-polish fixes that the v1.15.1 milestone groups into a single phase because they touch different files, share no state, and at coarse granularity each is ~10 LOC. Phase 47 (Wave-0 Test Scaffolding) is COMPLETE — visualViewport polyfill, mock helper, and `webkit-iphone` Playwright project are in place, so the FOCUS-TEST-01..02 vitest assertions can mount `InputDrawer` without throwing and FOCUS-TEST-03 can run on `webkit-iphone`.

**In scope (11 requirements — NOTCH-01..04 + NOTCH-TEST-01 + FOCUS-01..03 + FOCUS-TEST-01..03):**

**NOTCH (NavShell.svelte):**
- Add `pt-[env(safe-area-inset-top,0px)]` to the sticky `<header>` so the hamburger / wordmark / theme-info buttons sit below the Dynamic Island in iPhone 14 Pro+ standalone PWA mode.
- Add `px-[max(env(safe-area-inset-left,0px),1rem)]` (and right counterpart) so landscape orientation respects the side notch while preserving the existing `1rem` gutter when the inset is `0` (browser-tab fallback).
- Confirm `<header>` `bg-[var(--color-surface)]` paints opaquely into the inset region (no transparent show-through) in both light and dark themes.
- Audit existing sticky-top consumers (`top-20` asides on all 6 calculator routes — `pert/+page.svelte:106`, `morphine-wean:78`, `formula:75`, `gir:83`, `feeds:83`, `uac-uvc:72`) and update where the new inset-padded header would otherwise collide.
- Source-grep regression guard component test asserting `pt-[env(safe-area-inset-top` appears in `NavShell.svelte`.

**FOCUS (InputDrawer.svelte):**
- Delete the `queueMicrotask(() => firstInput?.focus())` block at lines 51–57 in full (no boolean opt-out, no narrowed selector).
- Add `autofocus` attribute to the existing close button so VoiceOver announces "Close inputs, button" and keyboard users get a deterministic Tab origin — but iOS soft keyboard does NOT appear.
- Behavior is identical across all 6 calculators (Morphine, Formula, GIR, Feeds, UAC/UVC, PERT) — single source of truth in `InputDrawer.svelte`, no per-calculator divergence.
- Vitest: explicit `document.activeElement` is NOT input/select/textarea/`[role="slider"]` after `<dialog>.showModal()`.
- Source-grep regression: `InputDrawer.svelte` source contains neither `queueMicrotask` nor `[role="slider"]`.
- Cross-calculator Playwright spec opens the drawer on each of the 6 routes and asserts focus lands on the close button.

**Out of scope:**
- visualViewport drawer anchoring / sizing (Phase 49 — Wave-2). Phase 48 does NOT touch `.input-drawer-sheet` height or transform; `100dvh` + `flex-end` stays as-is. Phase 49 will replace it.
- Real-iPhone smoke checklist (Phase 50). Phase 48 ships only the CI-verifiable surface.
- FOUC theme-color sync for `black-translucent` legibility (PITFALLS.md P-12) — deferred to Phase 49 or treated as a smoke-only mitigation in Phase 50 (SMOKE-09).
- DESIGN.md / DESIGN.json contract changes. NOTCH inset is structural; it does NOT alter the Identity-Inside Rule, Amber-as-Semantic, OKLCH-Only, or any of the other named rules.
- Per-calculator behavioral changes inside `Inputs` snippets. Focus order audit (PITFALLS.md P-17) is verified by the cross-calculator Playwright spec, not by editing each calculator.

</domain>

<decisions>
## Implementation Decisions

### NOTCH — NavShell.svelte header padding

- **D-01:** Edit only the existing `<header>` at `NavShell.svelte:76-80`. Do NOT introduce a new wrapper element. Add `pt-[env(safe-area-inset-top,0px)]` and `px-[max(env(safe-area-inset-left,0px),1rem)]` (replacing the existing `px-4`). The class string lives inline on the same `<header>` — a single source of truth, no per-route divergence (all 6 calculator routes render through this one shell).
- **D-02:** Use the **bare** `env(safe-area-inset-top, 0px)` form. Do NOT add a `max()` floor (e.g. `max(env(safe-area-inset-top,0px),16px)`) — PITFALLS.md P-10 documents that a `max()` floor breaks the Phase 42.1 "hero fills viewport on mount" contract silently in browser-tab mode (Safari URL bar already consumes the inset, so `safe-area-inset-top: 0` is the correct value there). Hardcoded floor adds +16 px in Safari tab mode where it is not needed.
- **D-03:** Use `pb-` / `pt-` / `px-` Tailwind arbitrary-value bracket syntax (`pt-[env(safe-area-inset-top,0px)]`) — matches the project pattern already used at `NavShell.svelte:150` (`pb-[env(safe-area-inset-bottom,0px)]` on the mobile bottom nav). Consistency with the existing pattern beats clever alternatives.
- **D-04:** Background opacity for the inset region — `bg-[var(--color-surface)]` is **already declared** on the `<header>` (line 79). Padding-top with `env(safe-area-inset-top)` extends the background into the inset region by default in CSS — no extra rule needed. NOTCH-03 is satisfied by D-01 + the existing `bg-[var(--color-surface)]` declaration. Confirm with a snapshot/computed-style check during plan, not a separate code change.
- **D-05:** Sticky-top consumer audit (NOTCH-04): the 6 routes all use `sticky top-20` (= `5rem` = `80px`) for their input/result asides on desktop. Today this clears the `min-h-14` (= `3.5rem` = `56px`) header by 24 px. With `safe-area-inset-top` added (47 px on iPhone 14 Pro+ in standalone PWA), the *desktop* layout is unaffected — desktop has no notch. On mobile the asides are inside the InputDrawer (not sticky) so `top-20` is desktop-only. **Conclusion:** no `top-20` value needs to change; the `min-h-14` + new `pt-[env(...)]` total clears even with notch present. Plan adds a single sanity assertion (one route, mobile + desktop viewports) that the aside's bounding-rect `top` is below the header's bounding-rect `bottom`. No per-route edits.
- **D-06:** Do NOT introduce a `--header-h` CSS custom property. PITFALLS.md P-09 suggested it; D-05 makes it unnecessary because no consumer needs to read the header's effective height (the 80 px `top-20` is already conservative). Adding a custom property would be over-engineering for a 10-LOC fix.
- **D-07:** NOTCH-TEST-01 source-grep test lives at `src/lib/shell/NavShell.test.ts` (co-located, follows project convention). Pattern: read `NavShell.svelte` source via `fs.readFileSync`, assert `expect(source).toContain('pt-[env(safe-area-inset-top')` — mirrors the regression-guard pattern used for `InputDrawer.test.ts:88-93` and Phase 47's polyfill self-test.

### FOCUS — InputDrawer.svelte auto-focus removal

- **D-08:** Delete the **entire** `queueMicrotask` block at `InputDrawer.svelte:51-57` (lines including the comment at lines 47-50 explaining the original intent — the comment becomes stale and its presence would mislead future maintainers). PITFALLS.md P-13 calls out that *narrowing* the selector instead of deleting it is the trap; explicit full deletion is non-negotiable.
- **D-09:** Add `autofocus` attribute to the **header close button** (the inner `<button>` at `InputDrawer.svelte:107-119` with `aria-label="Close {title.toLowerCase()}"`). NOT to the optional Clear button (lines 98-105) — Clear is conditional (`{#if onClear}`) and not present on every calculator. NOT `dialog.focus()` (PITFALLS.md P-14: inconsistent across browsers). The close button is always present, always non-text-summoning, and gives VoiceOver a deterministic announcement ("Close inputs, button").
- **D-10:** Single source of truth — the `autofocus` attribute lives on the close button inside `InputDrawer.svelte`. NO per-calculator divergence (FOCUS-03). Clear button (when present) is rendered earlier in DOM order but does NOT have `autofocus`, so the browser's native `<dialog>` autofocus heuristic skips Clear and lands on the explicit `autofocus` button. Verified during plan via component test mounting all 6 calculator routes.
- **D-11:** Order matters: the close button is rendered **after** the optional Clear button in DOM (`InputDrawer.svelte:96-120`). HTML's `autofocus` attribute wins over native `<dialog>` "first focusable child" heuristic; tested in WebKit / Chromium / Firefox. PITFALLS.md P-14 documents that browser default behavior diverges (Chrome desktop → SegmentedToggle's first tab; Safari → close button) — explicit `autofocus` makes it deterministic.
- **D-12:** FOCUS-TEST-01 (vitest) lives at `src/lib/shared/components/InputDrawer.test.ts` (co-located, project convention). Test mounts the drawer, calls `dialog.showModal()`, then asserts:
  ```
  expect(document.activeElement?.tagName).not.toBe('INPUT');
  expect(document.activeElement?.tagName).not.toBe('SELECT');
  expect(document.activeElement?.tagName).not.toBe('TEXTAREA');
  expect(document.activeElement?.getAttribute('role')).not.toBe('slider');
  expect(document.activeElement?.getAttribute('aria-label')).toMatch(/Close /i);
  ```
  Explicit non-input assertion + positive close-button assertion. Mirrors the four-selector substring from the deleted code so a regression that re-adds the original selector fails the test.
- **D-13:** FOCUS-TEST-02 (source-grep regression) lives in the same `InputDrawer.test.ts`. Reads `InputDrawer.svelte` source via `fs.readFileSync`, asserts:
  ```
  expect(source).not.toContain('queueMicrotask');
  expect(source).not.toContain('[role="slider"]');
  ```
  Mirrors `T-06` source-grep pattern from PITFALLS.md P-08 mitigation. Cheap and catches the regression "someone re-pastes the deleted block."
- **D-14:** FOCUS-TEST-03 (cross-calculator Playwright) is a **single new spec** at `e2e/drawer-no-autofocus.spec.ts` running under both `chromium` and `webkit-iphone` projects (Phase 47 D-15 — both projects run all e2e specs by default; spec-level skip only if needed). Spec iterates `[/morphine-wean, /formula, /gir, /feeds, /uac-uvc, /pert]`, opens the drawer on each, and asserts:
  ```
  await expect(page.getByRole('button', { name: /Close /i })).toBeFocused();
  ```
  Six routes × 2 projects = 12 test cases. Catches per-calculator divergence (P-14). Does NOT replace the existing 6 e2e specs that use `.fill()` — those continue to pass because Playwright synthesizes focus.
- **D-15:** Stale comment cleanup — the lines 47-50 comment ("Move focus from the drawer's header close-button to the first actual input...") becomes false after D-08. Delete those lines too. The new code path is self-explanatory: `<dialog>` opens → close button has `autofocus` → focus lands there. No replacement comment needed (keeps the diff minimal and the file shorter).

### Build order (FOCUS first vs NOTCH first vs parallel)

- **D-16:** FOCUS and NOTCH have **zero** code overlap (different files: `InputDrawer.svelte` vs `NavShell.svelte`) and zero shared test state. They can be planned as **two sibling plans** (`48-01-PLAN.md` NOTCH, `48-02-PLAN.md` FOCUS) that the executor can land in either order or in parallel. Each plan is self-contained — a goal-backward verifier could execute either independently and ship.
- **D-17:** **Recommended order: FOCUS first, NOTCH second.** Rationale: FOCUS is a deletion (lower risk), unblocks Phase 49 (which needs the auto-focus confound removed before "drawer position when keyboard is up" is observable as a deliberate clinician tap). NOTCH is an addition (touches a more central file but the diff is purely additive — `pt-` and `px-` adjustments to one className string). If FOCUS slips, NOTCH still ships independently. If NOTCH slips, FOCUS still ships and Phase 49 can proceed.
- **D-18:** Single git branch — both plans land on the same Phase 48 branch with sequential commits (no worktree split). Each plan = 1-3 atomic commits with co-located test files committed alongside the source change.

### Verification within the phase

- **D-19:** Phase 48 success criteria are deliberately CI-verifiable: vitest passes, Playwright `chromium` + `webkit-iphone` both pass, axe sweeps remain 16/16. NO real-iPhone visual assertions — those belong to Phase 50 (SMOKE-02 closes NOTCH-01, SMOKE-03 closes FOCUS-01 + FOCUS-02). PITFALLS.md P-19 documents that Playwright cannot render the Dynamic Island even at iPhone-14-Pro-Max viewport, so visual notch verification is impossible in CI by construction.
- **D-20:** Existing 16/16 axe sweeps (light + dark across all 6 calculators) MUST remain green. The `pt-[env(...)]` change is purely structural (no color tokens, no contrast-relevant changes); the `autofocus` change is a focus-order shift that axe is designed to handle. Plan verifies by re-running `pnpm test:e2e` post-change. No new axe sweeps are added in Phase 48.
- **D-21:** Existing 99-passing chromium Playwright suite + new `webkit-iphone` smoke spec from Phase 47 MUST remain green. The cross-calculator focus spec (D-14) is the only new e2e file. Phase 48 does NOT migrate the existing 6 calculator e2e specs to also run under `webkit-iphone` — that's a Phase 47 deferred follow-up.

### Claude's Discretion

- **`--auto` mode:** All decisions above were picked from the recommended defaults in PITFALLS.md HIGH-confidence research, the verbatim REQUIREMENTS.md acceptance criteria, and the inherited Phase 47 CONTEXT.md test-scaffolding conventions. The user invoked with `--auto`, signaling trust in the synthesized approach. Anything below the level of "what attribute lives on what element" (e.g. exact wording of the test assertion's `aria-label` regex, exact filename for the Playwright spec) is left to the planner / executor.
- **Plan split:** Two sibling plans (`48-01-PLAN.md` FOCUS, `48-02-PLAN.md` NOTCH) is the recommended split per D-16 + D-17. Planner may collapse to a single plan if they prefer; the success criteria are independent and can be verified either way.
- **Test colocation:** All new test files are co-located with their source per the user's `feedback_test_colocation.md` memory: `NavShell.test.ts` next to `NavShell.svelte`, `InputDrawer.test.ts` next to `InputDrawer.svelte`. The cross-calculator Playwright spec lives in `e2e/` (existing convention).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone-level
- `.planning/PROJECT.md` — project context, design principles, v1.15.1 milestone goal (notch-safe title bar + no auto-focus on drawer open as two of three named bugs); D-12 deferral closure obligation
- `.planning/REQUIREMENTS.md` — NOTCH-01..04 + NOTCH-TEST-01 + FOCUS-01..03 + FOCUS-TEST-01..03 verbatim acceptance criteria (11 requirements)
- `.planning/ROADMAP.md` — Phase 48 goal + 5 success criteria + dependency on Phase 47

### Research (HIGH-confidence)
- `.planning/research/PITFALLS.md` — **MUST READ.** P-01 (VoiceOver announcement contract), P-09 (notch under Dynamic Island today — the milestone-named bug), P-10 (browser-tab `env(...)` returns 0; do NOT use `max()` floor), P-11 (landscape side-notch + `safe-area-inset-left/right`), P-13 (full deletion required, not narrowed selector), P-14 (cross-calculator divergence — explicit `autofocus` is single-source-of-truth fix), P-17 (Tab order WCAG 2.4.3 audit). All seven directly motivate the decisions above.
- `.planning/research/SUMMARY.md` — synthesis with build-order rationale (FOCUS unblocks Phase 49 visualViewport)
- `.planning/research/ARCHITECTURE.md` — file/line-precise integration matrix; confirms `NavShell.svelte:76-80` and `InputDrawer.svelte:51-57` are the exact edit sites

### Existing project patterns to mirror
- `src/lib/shell/NavShell.svelte` lines 76-80 — the header element to edit; line 150 (`pb-[env(safe-area-inset-bottom,0px)]`) is the existing inset-padding pattern to mirror exactly for the new top + side insets
- `src/lib/shared/components/InputDrawer.svelte` lines 47-57 — the comment + `queueMicrotask` block to delete in full; line 107-119 — the close button that gets the new `autofocus` attribute
- `src/test-setup.ts` lines 122-149 — the polyfill self-test pattern (not directly used in Phase 48 but Phase 47 mirrored it; the source-grep test convention here is the same shape)
- `src/lib/shared/components/InputDrawer.test.ts` lines 88-93 — the source-grep regression-guard pattern that NOTCH-TEST-01 + FOCUS-TEST-02 mirror
- `e2e/mobile-nav-clearance.spec.ts:23-24` — existing iPhone-SE 375x667 / iPhone-14-Pro-Max 414x896 viewport constants (cross-calc Playwright spec may reuse if needed)

### Phase 47 inheritance (test scaffolding)
- `.planning/phases/47-wave-0-test-scaffolding/47-CONTEXT.md` — D-04..D-15 establish the visualViewport polyfill + helper + `webkit-iphone` Playwright project. Phase 48's FOCUS-TEST-03 runs under that new project; FOCUS-TEST-01 doesn't need the polyfill but the test environment is the same.
- `playwright.config.ts` (post-Phase-47) — two projects (`chromium` + `webkit-iphone`); FOCUS-TEST-03 inherits both by default per Phase 47 D-15

### iOS / web platform spec references
- MDN — `env()` CSS function: https://developer.mozilla.org/en-US/docs/Web/CSS/env (browser-tab mode returns 0 — D-02)
- MDN — `safe-area-inset-*`: https://developer.mozilla.org/en-US/docs/Web/CSS/env#safe-area-inset-top
- HTML spec — `autofocus` content attribute: https://html.spec.whatwg.org/multipage/interaction.html#attr-fe-autofocus (the `<dialog>` autofocus behavior — D-09 + D-11)
- WCAG 2.4.3 Focus Order (Level A): https://www.w3.org/WAI/WCAG21/Understanding/focus-order.html (motivates D-14 cross-calculator focus assertion)
- shuvcode #264 — Menu button hidden behind Dynamic Island in iOS PWA: https://github.com/Latitudes-Dev/shuvcode/issues/264 (real-world bug match for the NOTCH symptom)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`NavShell.svelte` `<header>` className string** (lines 77-79) — already declares `sticky top-0`, `min-h-14`, `bg-[var(--color-surface)]`, `border-b`, `border-[var(--color-border)]`, `px-4`. NOTCH adds `pt-[env(safe-area-inset-top,0px)]` and replaces `px-4` with `px-[max(env(safe-area-inset-left,0px),1rem)]` (and right counterpart implicit in `px-` Tailwind shorthand). Single string edit; no DOM structure change.
- **`NavShell.svelte` mobile bottom nav** (line 150) — already uses `pb-[env(safe-area-inset-bottom,0px)]`. The pattern is identical for the new top inset; no new design judgment required.
- **`<dialog>` element + `autofocus` attribute** — both are standard HTML. No bits-ui or shadcn primitives needed. The drawer is already a native `<dialog>` (line 81). Adding `autofocus` is a one-attribute change.
- **`@testing-library/jest-dom/vitest` matchers** — `toHaveFocus`, `toHaveAttribute` already imported via `src/test-setup.ts`. Tests can use them directly.

### Established Patterns
- **Inset padding via Tailwind arbitrary-value brackets** — `pb-[env(safe-area-inset-bottom,0px)]` already in use; `pt-[env(...)]` and `px-[max(env(...),1rem)]` follow the same shape. No `@layer` rule needed.
- **Source-grep regression tests** — used at `InputDrawer.test.ts:88-93` and Phase 47's polyfill self-test. The new NOTCH-TEST-01 + FOCUS-TEST-02 are siblings.
- **Co-located test files** — every `.svelte` in `src/lib/` has a sibling `.test.ts` (`NumericInput.svelte` + `NumericInput.test.ts`, `SelectPicker.svelte` + `SelectPicker.test.ts`, etc.). NavShell.svelte does NOT yet have a test file; Phase 48 introduces `NavShell.test.ts` (NEW file) for NOTCH-TEST-01.
- **Cross-route Playwright specs** — `e2e/mobile-nav-clearance.spec.ts` already iterates routes; `drawer-no-autofocus.spec.ts` mirrors that pattern (loop over the 6 calculator hrefs).
- **`autofocus` over `dialog.focus()`** — declarative > imperative; `autofocus` is processed by the browser's native `<dialog>.showModal()` flow without a separate JS effect.

### Integration Points
- **`NavShell.svelte`** — single edit site for all four NOTCH requirements (NOTCH-01..04). One className string change.
- **`InputDrawer.svelte`** — two edit sites for FOCUS: (a) delete lines 47-57 inclusive (effect block + comment), (b) add `autofocus` attribute at line 107-119 close button.
- **All 6 calculator routes** (`pert/+page.svelte`, `morphine-wean/+page.svelte`, `formula/+page.svelte`, `gir/+page.svelte`, `feeds/+page.svelte`, `uac-uvc/+page.svelte`) — render `InputDrawer` via the shell. NO per-route edits needed (FOCUS-03 single-source-of-truth in `InputDrawer.svelte`). The cross-calculator Playwright spec just iterates them to verify.
- **Phase 49 dependency** — Phase 49 (visualViewport drawer anchoring) needs the FOCUS fix to land first so "drawer position when keyboard is up" is observable as a deliberate clinician tap rather than every drawer-open spuriously summoning the keyboard. NOTCH is independent of Phase 49.
- **Phase 50 dependency** — Phase 50's SMOKE-02 (NOTCH-01 closure on real iPhone) and SMOKE-03 (FOCUS-01 + FOCUS-02 closure) verify what Phase 48 ships. Phase 48 only ships CI-verifiable surface; visual notch verification is a Phase 50 obligation.

</code_context>

<specifics>
## Specific Ideas

- **Mirror the bottom-nav pattern verbatim.** The mobile bottom nav at `NavShell.svelte:150` reads `pb-[env(safe-area-inset-bottom,0px)]`. The new top + side insets MUST read identically (`pt-[env(safe-area-inset-top,0px)]` and `px-[max(env(safe-area-inset-left,0px),1rem)]`). Same shape, same fallback default, same Tailwind arbitrary-value bracket convention. Reviewers should not have to context-switch between two patterns.
- **Don't keep a "smart" auto-focus heuristic.** PITFALLS.md P-13 calls this out explicitly: narrowing the selector instead of deleting it leaves the latent bug intact for non-textbox-first calculators (Feeds — its first input is a `role="tab"` toggle, not in the original selector at all). Full deletion is non-negotiable.
- **The source-grep test must assert the deleted strings, not the new strings.** FOCUS-TEST-02 asserts `not.toContain('queueMicrotask')` and `not.toContain('[role="slider"]')`. Asserting the new `autofocus` attribute exists is weaker — a careless rewrite could remove `autofocus` and re-add `queueMicrotask` and the test would still pass. Negative-string assertions catch the actual regression mode.
- **The cross-calculator Playwright spec is the linchpin for FOCUS-03.** Six route iterations × 2 projects (`chromium` + `webkit-iphone`) = 12 test cases. If any single calculator's `Inputs` snippet has a structural quirk (e.g. a wrapping `<form>` around the close button changing dialog-autofocus resolution), this spec catches it. Without this spec, FOCUS-03 ("single source of truth, no per-calculator divergence") is unverified.
- **No theme-color / FOUC changes in Phase 48.** PITFALLS.md P-12 (light-mode `black-translucent` legibility) is real but the mitigation is either: (a) accept the system default and document for Phase 50 SMOKE-09 verification, or (b) adjust the FOUC inline script in `app.html`. Either is out-of-scope for Phase 48 — both are decoration of P-09's structural fix, not part of NOTCH-01..04.

</specifics>

<deferred>
## Deferred Ideas

- **`--header-h` CSS custom property** for routes' sticky-aside `top-20` consumers. PITFALLS.md P-09 suggested this; D-06 rejected it for Phase 48 because no consumer needs to read the header's effective height. If a future phase adds a sticky element that DOES need the live header height, introduce the custom property at that time.
- **Migrate existing 6 e2e specs to also run under `webkit-iphone`.** Phase 47 D-15 deferred this; Phase 48 inherits the deferral. The new `drawer-no-autofocus.spec.ts` runs under both projects by default, but `e2e/uac-uvc.spec.ts`, `e2e/feeds.spec.ts`, etc. still effectively run under chromium-only patterns. Capture as a Phase 47-follow-up todo (NOT a Phase 48 blocker).
- **FOUC theme-color sync for `black-translucent` legibility (PITFALLS.md P-12).** Out of Phase 48 scope — Phase 50's SMOKE-09 will surface whether mitigation is needed; if so, it goes into a v1.15.2 hotfix or Phase 49's polish.
- **Per-calculator focus-order audit (PITFALLS.md P-17).** FOCUS-TEST-03 cross-calculator Playwright spec covers the "first focus is close button" half; the "Tab from close button lands on the first focusable input" half is NOT explicitly tested in Phase 48. If any calculator's `Inputs` snippet starts with a non-focusable header, that's a Tab-order quirk worth documenting but not worth blocking Phase 48 on. Capture as a separate accessibility audit todo if needed.
- **Inline help text on the close button** explaining "Close inputs" → "Done" for clarity. Not part of NOTCH or FOCUS scope. UX polish.
- **Animated focus indicator on the close button** when `autofocus` lands. The existing focus-visible outline (`focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-identity)]` at line 109) is already declared; no new animation needed.

</deferred>

---

*Phase: 48-wave-1-trivial-fixes-notch-focus*
*Context gathered: 2026-04-27*
