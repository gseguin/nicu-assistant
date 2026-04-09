---
phase: 31-release-v1.9
plan: 31-01
completed: 2026-04-09
status: complete
requirements_completed:
  - REL-01
  - REL-02
  - REL-03
key_files:
  modified:
    - package.json
    - .planning/PROJECT.md
one_liner: Version bumped to 1.9.0, PROJECT.md Validated list updated with 9 v1.9 entries, AboutSheet reflects new version via build-time constant
---

# 31-01 — Release v1.9

## Scope

Phase 31 ships v1.9 as a self-describing release. Three requirements:

- **REL-01**: `package.json` version → `1.9.0`
- **REL-02**: AboutSheet reflects v1.9
- **REL-03**: PROJECT.md Validated list updated with v1.9 entries

## Execution

Executed inline as 2 atomic commits after detecting that AboutSheet version is sourced from `__APP_VERSION__` (Vite `define` injecting `pkg.version`) — so REL-02 is satisfied automatically by REL-01, no AboutSheet code change needed.

### Commits

- `87787f4` chore(31-01): REL-01 bump package.json version 1.8.0 → 1.9.0
- `53acd09` docs(31-01): REL-02/REL-03 — PROJECT.md Validated list for v1.9

### REL-01: package.json bump

Single-line change, `"version": "1.8.0"` → `"version": "1.9.0"`.

### REL-02: AboutSheet reflects v1.9

No source change required. `src/lib/shared/about-content.ts:12`:

```ts
const appVersion = `v${typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0'}`;
```

`__APP_VERSION__` is injected at build time by `vite.config.ts:11`:

```ts
__APP_VERSION__: JSON.stringify(pkg.version)
```

All three AboutSheet entries (morphine-wean, formula, gir) pick up the new version via the `version: appVersion` field. Verified by successful `pnpm build` (no AboutSheet code required).

### REL-03: PROJECT.md Validated list

Appended 9 entries to `.planning/PROJECT.md` Validated section covering all 18 v1.9 requirements:

- GIR-SWAP-01..03 — Δ rate hero swap on bucket cards + STOP treatment for Δ=0
- GIR-SWAP-04..07 — a11y guarantees preserved, 16/16 axe green
- POLISH-01..04 — impeccable critique pass with dark identity-hero retune, SegmentedToggle token lift, en-dash normalization
- DEBT-01 — 4 dep groups bumped within current majors
- DEBT-02 — `ResultsDisplay.svelte` + `$lib/shared` barrel removed
- DEBT-03 — svelte-check 0/0, ESLint dropped in favor of svelte-check + Prettier
- DEBT-04 — Phase 29 deferred items + 8 e2e drift assertions closed
- REL-01, REL-02 — version bump + AboutSheet reflection
- REL-03 — this entry

## Verification gates

| Gate | Result |
|------|--------|
| Vitest | **205/205** ✓ |
| `pnpm build` | ✓ — 35 precache entries, 325.23 KiB, PWA v1.2.0 |
| Playwright axe | **16/16** ✓ (7.2s) |

## Requirements traceability

| REQ-ID | Evidence |
|--------|----------|
| REL-01 | `package.json:4` shows `"version": "1.9.0"` |
| REL-02 | `src/lib/shared/about-content.ts:12` reads from `__APP_VERSION__` which `vite.config.ts:11` sources from `pkg.version`. Build succeeded. |
| REL-03 | `.planning/PROJECT.md:84-93` contains 9 new v1.9 Validated entries |

## Notes

- No tests added — REL-01 and REL-03 are metadata-only; REL-02's build-time wiring is already covered by the successful `pnpm build`
- No deferrals — scope complete
