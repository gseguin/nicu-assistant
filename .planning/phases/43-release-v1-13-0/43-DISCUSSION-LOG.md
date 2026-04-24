# Phase 43: Release v1.13.0 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-24
**Phase:** 43-release-v1-13-0
**Areas discussed:** Validated-list granularity · Recording the 42.2 sweep + STOP-red · Verification debt triage · Orphan planning artifacts · iOS smoke test gate

---

## Gray Area 1: PROJECT.md Validated-List Granularity

How finely to itemize v1.13 entries in PROJECT.md, given that Phase 42.1 decisions are tracked via CONTEXT.md (33 D-* numbers), not requirement IDs.

| Option | Description | Selected |
|--------|-------------|----------|
| 1a | Per-requirement-ID for every phase (follows v1.12 pattern exactly). Faithful but forces synthetic IDs on 42.1's CONTEXT decisions. | |
| 1b | Per-phase narrative bullets (five clusters). Cleaner reading but loses REQUIREMENTS.md ID traceability. | |
| 1c | Hybrid — per-ID for 40/41/42, narrative bullets for 42.1 and post-42.1 work. | ✓ |

**User's choice:** 1c (via "defaults")
**Notes:** Preserves the clean REQUIREMENTS.md ID trail where it naturally exists, avoids fabricating IDs for the design-polish work where they'd be bureaucratic noise.

---

## Gray Area 2: How to Record the 42.2 Critique Sweep + STOP-Red Fix

The sweep (50-file squash `1ce4493`), STOP-red carve-out (`8fde90e`), InputsRecap desktop-hide (`390aba6`), and 14 interim follow-ups aren't planned phases — they shipped between phase 42.1 close and Phase 43 kickoff.

| Option | Description | Selected |
|--------|-------------|----------|
| 2a | Add to Validated list under v1.13 with explicit post-phase labels. | ✓ |
| 2b | Absorb silently into Phase 42.1's Validated entries as "+ follow-up polish". | |
| 2c | Create synthetic "Phase 42.2" retroactive requirement ID block in REQUIREMENTS.md. | |

**User's choice:** 2a (via "defaults")
**Notes:** Explicit labeling + commit hashes in the Validated bullets keeps provenance clear without bureaucratic overhead of retroactive requirement IDs.

---

## Gray Area 3: Verification Debt from Phases 40 and 41

`/gsd-progress` flagged 7 `human_needed` items across `40-VERIFICATION.md` and `41-VERIFICATION.md`.

| Option | Description | Selected |
|--------|-------------|----------|
| 3a | Address pre-release — run `/gsd-audit-uat` and close all 7 as Phase 43 scope. | |
| 3b | Defer — ship v1.13.0 and handle in v1.14 as housekeeping. | |
| 3c | Quick triage — spot-check each, close trivially-verifiable ones now, backlog the rest. | ✓ |

**User's choice:** 3c (via "defaults")
**Notes:** Most items are retro artifacts from when verification was more ceremonial; grep-verifiable ones close quickly, real manual-QA items stay on the backlog rather than blocking the release.

---

## Gray Area 4: Orphan Planning Artifacts

`.planning/HANDOFF.json` and `42.1-.../continue-here.md` both exist from the 42.1 pause. Work described is complete and superseded.

| Option | Description | Selected |
|--------|-------------|----------|
| 4a | Delete as part of Phase 43 (they're resolved; keeping them misleads future `/gsd-resume-work`). | ✓ |
| 4b | Archive with `-archived` suffix for historical record. | |
| 4c | Leave alone — harmless. | |

**User's choice:** 4a (via "defaults")
**Notes:** The artifacts point to the 42.1 pause point; the work has been superseded by 42.2 sweep + STOP-red + recap desktop-hide. Deletion is clean, git history preserves the record.

---

## Gray Area 5: iOS Smoke Test as Release Gate

The 42.1 HANDOFF flagged "Visual QA on a real iOS notched device" as non-blocking. Post-42.1 we shipped 2 iOS drawer fixes.

| Option | Description | Selected |
|--------|-------------|----------|
| 5a | Mandatory — block release until real-iPhone standalone PWA verification. | |
| 5b | Recommended-but-soft — surface as release-notes reminder, don't block merge. | ✓ |
| 5c | Not in release scope — Playwright mobile emulation is sufficient. | |

**User's choice:** 5b (via "defaults")
**Notes:** Playwright + the two shipped iOS fixes give us enough confidence for the merge. Manual QA becomes v1.13.1 hotfix fuel if a regression surfaces.

---

## Claude's Discretion

- Exact prose wording for PROJECT.md Current State paragraph
- Order of Validated-list entries within each Phase group (by requirement ID vs by narrative impact)
- Whether Phase 43 lands as 1 or 2 plans (leaning: single plan — mechanics are linear)
- Debug flow for any svelte-check / test regression discovered during the final gate

## Deferred Ideas

- **Hide InputsRecap at md+**: shipped as commit `390aba6` pre-Phase-43 per user direction
- **Real-iPhone PWA smoke test**: non-blocking; v1.13.1 hotfix fuel or v1.14 test-infra work
- **Manual-QA verification-debt items**: items that can't close via grep land in v1.14 backlog
- **Impeccable critique P1-P3 remainder**: 4 remaining issues (HeroResult children-default, mobile scroll-to-hero, Morphine hero order, largeChange color) — next design-polish pass
