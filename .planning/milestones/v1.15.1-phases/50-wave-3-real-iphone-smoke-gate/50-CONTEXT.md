<domain>
Phase 50 — Wave-3 — Real-iPhone Smoke Gate.

Phase 50 ships ONE artifact: `.planning/v1.15.1-IPHONE-SMOKE.md` — a 10-step blocking checklist the human tester signs off on a real iPhone 14 Pro+ in standalone PWA mode (Home Screen → installed icon, NOT Safari browser tab). Each line maps 1:1 to a SMOKE-XX requirement and closes one or more upstream IDs (NOTCH-01/02, FOCUS-01/02, DRAWER-02/03/06/07/09, plus the PITFALLS.md `black-translucent` legibility gap). Cross-calculator parity (Morphine, Formula, GIR, Feeds, UAC/UVC, PERT) is its own SMOKE step.

Phase 50 explicitly **closes the v1.13 D-12 deferral** by elevating real-iPhone testing from "recommended post-deploy" to **primary verification surface** for v1.15.1. CI cannot paint the Dynamic Island, emulate the iOS soft keyboard, trigger bfcache, or render `apple-mobile-web-app-status-bar-style: black-translucent`. This phase is the only place those behaviors get verified before milestone close.

**Non-coding phase.** No `src/`, no tests, no `pnpm` gates. Phase 50's artifact is markdown + clinical sign-off discipline. The "build" is the checklist; the "verification" is the human tester's signature on an iPhone at the bedside.
</domain>

<canonical_refs>
- `.planning/ROADMAP.md` — Phase 50 entry with all 10 SMOKE-XX success-criteria lines (lines 50.1–50.10) defining the checklist content verbatim
- `.planning/REQUIREMENTS.md` — SMOKE-01..10 acceptance text (one bullet per requirement; closure mapping to NOTCH/FOCUS/DRAWER IDs)
- `.planning/PROJECT.md` — v1.13.0 Validated entry citing the D-12 deferral text ("Real-iPhone smoke test … recommended post-deploy as v1.13.1 hotfix fuel — non-blocking per D-12") that Phase 50 is closing
- `.planning/phases/49-wave-2-visualviewport-drawer-anchoring/49-CONTEXT.md` — D-24 (CI = wiring/structural; Phase 50 = visual/bedside) and D-25 (Phase 50 closes v1.13 D-12 by elevating real-iPhone smoke to primary verification surface)
- `.planning/phases/49-wave-2-visualviewport-drawer-anchoring/49-RESEARCH.md` — PITFALLS catalog: P-04 (bfcache rebind), P-05 (hardware keyboard threshold), P-12 (FOUC theme-color sync — SMOKE-09 mitigation), P-19/P-20 (Playwright cannot emulate iOS keyboard), iOS 26 #800125 (post-dismiss regression — SMOKE-05 verification)
- `.planning/phases/48-wave-1-trivial-fixes-notch-focus/48-SUMMARY.md` (or 48-01/48-02 SUMMARY.md) — D-09 deviation log (hybrid declarative+imperative closeBtn for Svelte 5 dialog.showModal); 31 webkit-iphone spec failures deferred Phase 50/51 — flagged in checklist failure-routing
- `e2e/drawer-no-autofocus.spec.ts` — Phase 48's cross-calculator focus contract; SMOKE-03 mirrors its assertion in human-verifiable form
- `e2e/drawer-visual-viewport.spec.ts` — Phase 49's CI proxy with the explicit "real-iPhone visual verification is Phase 50's obligation" header — Phase 50 fulfills that contract
- `src/app.html` — `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">` declaration that SMOKE-09 verifies in light mode
- `src/lib/shared/components/InputDrawer.svelte` — current keyboard-up wiring under verification; SMOKE-04 (≥ 8 px clearance) directly tests its `--ivv-bottom` / `--ivv-max-height` output
- `src/lib/shared/components/NavShell.svelte` — Phase 48 NOTCH wiring under verification; SMOKE-02 + SMOKE-08 directly test its `pt-[env(safe-area-inset-top)]` + `safe-area-inset-left/right` rules
- (file does not yet exist) `.planning/v1.15.1-IPHONE-SMOKE.md` — the artifact this phase produces; path is the binding contract from ROADMAP.md and REQUIREMENTS.md
</canonical_refs>

<decisions>

### Checklist artifact location and naming

- **D-01**: `.planning/v1.15.1-IPHONE-SMOKE.md` is the canonical location and filename. Verbatim from ROADMAP.md (Phase 50 success criterion 10) and REQUIREMENTS.md (SMOKE-01). Single source of truth — committed alongside the milestone for clinical audit trail. **Why:** REQUIREMENTS.md SMOKE-01 names this exact path; ROADMAP.md Phase 50 line cites the same path. Diverging would force a follow-up rename.
- **D-02**: NOT placed under `.planning/phases/50-…/` — the smoke checklist is a *milestone artifact*, not a phase-internal artifact. Its lifetime extends past Phase 50: Phase 51 release closure references it; it gets archived under `.planning/milestones/v1.15.1-{REQUIREMENTS,ROADMAP,phases}/` with the rest of the milestone evidence. The `50-PLAN.md` / `50-SUMMARY.md` / `50-CONTEXT.md` (this file) live in `.planning/phases/50-wave-3-real-iphone-smoke-gate/` per the standard phase pattern.

### Checklist format

- **D-03**: Markdown with one `- [ ]` GitHub task-list checkbox per SMOKE-XX item (10 boxes total). The tester ticks each box on the file directly (or in the GitHub PR/web view) when verifying — and signs the bottom of the document with date + iPhone model + iOS version.
- **D-04**: Each checklist line follows a fixed schema (one block per SMOKE-XX):
  ```markdown
  ### SMOKE-04 — Drawer above keyboard
  **Closes:** DRAWER-06 + DRAWER-07
  **Setup:** Open `/morphine-wean` from Home Screen icon (standalone PWA). Tap "Tap to edit inputs" to expand drawer.
  **Action:** Tap the Weight input field.
  **Expected:** iOS soft keyboard appears. Drawer is anchored above the keyboard top with ≥ 8 px clearance. The first input row + the eyebrow label "Weight" remain visible above the keyboard.
  **Pass:** [ ] / **Fail:** [ ] — Notes: ____
  ```
  Each block has: requirement title (1-line), closure mapping (which upstream IDs it satisfies), Setup (preconditions), Action (the user gesture), Expected (the observable outcome), Pass/Fail boxes, Notes. Mirrors the regulated-medical-device IFU pattern; clinical reviewers recognize it.
- **D-05**: NO screenshots embedded in the checklist file (gen-time pollution; iPhone screenshots are private clinical-environment artifacts and would bloat the repo). Tester captures screenshots ad-hoc IF a step fails — pasted into the failure-routing follow-up issue, NOT into the checklist itself.

### Pass / Fail rubric

- **D-06**: Each step is binary pass/fail. NO partial credit, NO "mostly works", NO "looks fine". The Expected text is the rubric — if the observable outcome matches verbatim, it passes; if anything diverges (timing, visual offset, focus target, VoiceOver phrasing), it fails. **Why:** Clinical sign-off discipline. Fuzzy "good enough" sign-offs corrode the audit trail.
- **D-07**: A SMOKE step is BLOCKING for milestone close. Phase 51 (Release v1.15.1) cannot ship until SMOKE-01..10 are all checked Pass. Verbatim from REQUIREMENTS.md REL-04 ("SMOKE-01..10 all signed off") and ROADMAP.md Phase 51 success criterion 5.
- **D-08**: A "Fail" routes to one of three follow-up actions (chosen at fail-time, not lock-time):
  1. **Hotfix in v1.15.1** — open a phase 50.X (decimal phase) for the fix; SMOKE step re-tested after fix lands; gate stays open.
  2. **Defer to v1.15.2 / v1.16** — capture as a backlog requirement; checklist line annotated with the deferral target; gate closes (with the failure documented in PROJECT.md).
  3. **Re-test on different iPhone / iOS version** — a likely device-specific regression worth reproducing before deciding 1 vs 2; the checklist line stays open with a "RE-TEST PENDING" annotation.
  Failure routing is the tester's judgment call at the bedside. The plan does NOT pre-commit to which fails route to which action.

### Tester profile and access constraints

- **D-09**: The tester is the project owner (Claude's user). Standalone PWA testing requires a real iPhone 14 Pro+ (or newer with Dynamic Island), iOS 17+ ideally iOS 18+ (covers the iOS 26 #800125 regression), and ~15 minutes of focused bedside-style time per full smoke pass. **Why:** D-12 from v1.13 was deferred precisely because no team member had bedside iPhone access during the v1.13 cut. v1.15.1 schedules this work explicitly so the deferral closes.
- **D-10**: NO professional clinical tester is gated as a precondition. The owner is the verifier. (A future v2.0+ regulated-device path may require formal clinician sign-off; v1.15.1 is still pre-regulated.)
- **D-11**: The tester signs and dates the bottom of the file with their name + iPhone model + iOS version + the calculation route(s) tested. The git commit of the signed checklist IS the audit trail. NO separate audit document needed.

### Cross-calculator parity (SMOKE-10)

- **D-12**: SMOKE-10 (parity across all 6 calculators) is a single line in the checklist with 6 sub-bullets — one per calculator. Each sub-bullet is checked Pass/Fail independently. **Why:** Verifying drawer + notch behavior on each route is mechanically the same gesture; spreading across 6 separate SMOKE-XX entries would inflate the checklist for no information gain.
- **D-13**: Parity test is **drawer-open-no-keyboard** + **drawer-above-keyboard** ONLY (not all 10 SMOKE steps × 6 routes — that's 60 cells of test inflation). The other 8 SMOKE steps are inherently route-agnostic (notch chrome doesn't change per calculator; bfcache restore doesn't change per calculator).
- **D-14**: A divergence found in any one calculator (e.g., GIR's input set has different focus order than Morphine's) is ROUTED per D-08 — most likely option 1 (decimal phase 50.X) since per-calculator divergence violates DRAWER-05 + FOCUS-01's "single source of truth in `InputDrawer.svelte`" contract.

### Status-bar legibility (SMOKE-09)

- **D-15**: SMOKE-09 verifies the existing `apple-mobile-web-app-status-bar-style: black-translucent` declaration's light-mode legibility in standalone PWA mode. **Pass** = status-bar text + Dynamic Island controls remain legible against `var(--color-surface)` light value. **Fail** = if illegible, mitigation is the FOUC-script-toggled `<meta name="theme-color">` — implemented as a v1.15.2 hotfix per PITFALLS.md P-12. Phase 50 does NOT implement P-12; it only verifies whether the existing setup is acceptable.
- **D-16**: If SMOKE-09 fails, route per D-08 option 2 (defer to v1.15.2). The mitigation requires non-trivial FOUC-script work that is out of scope for the v1.15.1 hotfix.

### Hardware keyboard verification (SMOKE-07)

- **D-17**: SMOKE-07 (hardware-keyboard-paired iPhone does NOT lift drawer) requires a Bluetooth or Smart Connector keyboard paired to the test iPhone. **Why:** the > 100 px keyboard-open threshold (`window.innerHeight − vv.height > 100`, per DRAWER-09 + Phase 49 D-04) needs to NOT trigger when only the URL-bar collapses (~50–80 px) or when a hardware keyboard suppresses the soft keyboard entirely. This is the tuning surface for the threshold (Phase 49 left it at 100 px as the recommended default; bedside data may force a 1-line tweak to 80 or 120 in v1.15.2).
- **D-18**: If the tester does NOT have a hardware keyboard available at smoke-time, SMOKE-07 is annotated "DEFERRED — no hardware keyboard available" and routes per D-08 option 3 (re-test pending). The checklist as a whole is NOT blocked from sign-off if 9/10 SMOKE steps pass and 1 is annotated DEFERRED with a routing target.

### Bfcache restore verification (SMOKE-06)

- **D-19**: SMOKE-06 (call yourself / switch apps and return) verifies DRAWER-03's `pageshow.persisted === true` rebind path. **Recommended bedside reproduction:** swipe up + open Phone app + tap a recent contact's "FaceTime" tile (do NOT actually call) + swipe back to NICU Assist. The drawer should render flush without requiring a user gesture. **Why:** matches PITFALLS.md P-04 verbatim — iOS app-suspension during background-task is the worst-case bfcache restore path; survival there means the lighter "switch back from Settings" path also works.
- **D-20**: An alternative (less brittle) reproduction: lock the device + wait 30 seconds + unlock + return to NICU Assist via the Home Screen icon. Equally valid — survives bfcache restore from sleep-then-wake.

### Recording outcomes

- **D-21**: All 10 SMOKE outcomes (Pass / Fail / Deferred + Notes) are recorded **in the checklist file itself** — the tester edits the markdown inline, ticks the boxes, fills the Notes field for any failure or deferral, signs the bottom. Single artifact, single commit.
- **D-22**: The committed signed checklist IS what unblocks REL-04 in Phase 51. Phase 51's release gate reads the file directly to verify all 10 boxes are checked Pass (or annotated DEFERRED with a documented route).
- **D-23**: NO separate "smoke run report" or test summary artifact. The checklist is self-describing and the git history is the run log.

### Plan structure

- **D-24**: Phase 50 is a SINGLE plan (not split into multiple plans). **Why:** the artifact is one file (~250 lines markdown); the testing is one ~15-minute bedside session; splitting would inflate the cadence with no atomic-commit benefit. Plan 50-01 produces the checklist file; the human smoke pass happens between Plan 50-01 commit and Plan 50-01 SUMMARY.md update (which records Pass/Fail outcomes).
- **D-25**: Plan 50-01 has TWO atomic commits:
  1. **Generate checklist** — write `.planning/v1.15.1-IPHONE-SMOKE.md` from the SMOKE-XX template using REQUIREMENTS.md acceptance text verbatim. ~250 lines markdown. Pre-tester-pass; all boxes unchecked.
  2. **Record signed outcomes** — tester edits the file (ticks boxes, signs bottom), and the commit captures the signed/dated state. THIS commit is the milestone audit-trail anchor.

### Verification scope

- **D-26**: Phase 50's "verification" is the human tester's signature, NOT a `pnpm` gate. There is no svelte-check, no vitest, no Playwright assertion to run for Phase 50 itself. Plan 50-01 does NOT add a CI step — by design.
- **D-27**: Phase 50 verifier (`gsd-verifier`) confirms (a) the checklist file exists at the canonical path, (b) all 10 boxes are ticked Pass or annotated DEFERRED with a route, (c) the signature block is filled out, (d) closure mappings (NOTCH/FOCUS/DRAWER IDs) match REQUIREMENTS.md verbatim. NO functional code testing — Phase 49 already covered that surface in CI.

</decisions>

<deferred>
- **PITFALLS.md P-12 mitigation (light/dark `<meta name="theme-color">` toggled by FOUC script)** — if SMOKE-09 fails, this lands in v1.15.2 / v1.16 via D-16. Captured as a future requirement, not implemented in Phase 50.
- **Threshold tuning** — if the > 100 px keyboard-open threshold proves wrong on the iPhone 14 Pro+ (false positives on URL-bar collapse, false negatives in landscape), the 1-line tweak lands in v1.15.2 per D-17.
- **iPad split-keyboard / floating-keyboard verification** — out of v1.15.1 scope (the app is `md:hidden`-gated for InputDrawer mobile UI; iPad uses the full-width input area).
- **Formal clinician (RD/RN/MD) sign-off** — pre-regulated phase doesn't require it. v2.0+ regulated-device path may.
- **Performance instrumentation on the singleton** — Phase 49 deferred this; if SMOKE-04..06 reveal perf regressions on real device, captured here as a v1.15.2 follow-up.
- **Non-iPhone-14-Pro-class device coverage** — v1.15.1 targets iPhone 14 Pro+ (Dynamic Island devices) explicitly. Older non-notch iPhones, iPad, Android Chrome PWA all out of scope for this milestone's smoke gate.
- **Cross-calculator parity sweep across all 10 SMOKE steps** (60-cell matrix vs. D-13's 6-cell drawer-only sub-bullet) — defer indefinitely; cost > value.
</deferred>

<claude_discretion>
Decisions Claude took under `--auto` without asking:
- Exact filename: `.planning/v1.15.1-IPHONE-SMOKE.md` (verbatim from ROADMAP/REQUIREMENTS — D-01).
- Checklist block schema (D-04 — 6 fields per SMOKE-XX). Mirrors regulated-device IFU pattern; reviewer-friendly.
- NO embedded screenshots (D-05). Optional ad-hoc capture for failures only.
- Binary pass/fail rubric (D-06). No partial credit. Tester signs whether the Expected text is verbatim observed.
- Three failure-routing options (D-08): hotfix / defer / re-test. Tester chooses at fail-time.
- SMOKE-10 parity = 6 sub-bullets in one entry (D-12), drawer-only behavior across 6 calculators (D-13), not 60-cell sweep.
- Bfcache reproduction recipe (D-19/D-20): Phone-app or lock-then-wake. Two equivalent options.
- Two-commit plan structure (D-25): generate-then-sign. Each is its own atomic commit.
- Single-plan phase (D-24). No split. Lifetime is one bedside session.
- No CI gate for Phase 50 itself (D-26). Verification is the signature.
</claude_discretion>

<phase_dependencies>
- **Hard dependency: Phase 48 (Wave-1 NOTCH + FOCUS) must be merged.** SMOKE-02, SMOKE-03, SMOKE-08 directly verify Phase 48 wiring. Status: ✅ Merged 2026-04-28.
- **Hard dependency: Phase 49 (Wave-2 visualViewport Drawer) must be merged.** SMOKE-04, SMOKE-05, SMOKE-06, SMOKE-07 directly verify Phase 49 wiring. Status: ✅ Merged 2026-04-28 (today).
- **Soft dependency: PWA installable on the test iPhone.** The PWA must be installed via Safari → Share → Add to Home Screen, not opened in a Safari browser tab. Reproduction: open `https://nicuassist.app` (or the deploy URL) in Safari, tap Share, tap Add to Home Screen. The tester must verify this BEFORE running the checklist.
- **Phase 51 (Release) depends on all 10 SMOKE outcomes being recorded** (Pass or DEFERRED-with-route) per REL-04.
</phase_dependencies>

<next_up>
Phase 50 has one plan. Run `/gsd-plan-phase 50` (or auto-advance) to break the SMOKE checklist artifact into Plan 50-01 with two atomic commits (generate / sign).
</next_up>
