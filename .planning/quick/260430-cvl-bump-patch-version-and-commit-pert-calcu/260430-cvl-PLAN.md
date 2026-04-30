---
phase: quick
plan: 260430-cvl
type: execute
wave: 1
depends_on: []
files_modified:
  - src/lib/pert/calculator.ts
  - package.json
autonomous: true
requirements:
  - QUICK-260430-cvl
must_haves:
  truths:
    - "PERT tube-feed recap renders Formula and Volume on the same row, matching every other calculator's pairing pattern (only Weight uses fullRow)."
    - "package.json version is 1.16.1."
    - "The calculator.ts fix lands as its own atomic commit, separate from the version bump."
    - "The version bump lands as its own atomic commit, separate from the source fix."
  artifacts:
    - path: "src/lib/pert/calculator.ts"
      provides: "PERT calculator module with corrected RecapItem metadata (no fullRow on Formula)"
      contains: "label: 'Formula'"
    - path: "package.json"
      provides: "Project manifest at version 1.16.1"
      contains: "\"version\": \"1.16.1\""
  key_links:
    - from: "src/lib/pert/calculator.ts (getRecapItems, tube-feed branch)"
      to: "src/lib/shared/components/InputsRecap.svelte"
      via: "RecapItem[] without fullRow:true on non-Weight items"
      pattern: "label: 'Formula',\\s*\\n\\s*value:"
---

<objective>
Commit the existing PERT calculator metadata fix and bump the project to v1.16.1 as two atomic commits.

Purpose: A defect fix found during /impeccable on /pert (Formula recap row was incorrectly marked `fullRow: true`, breaking the Formula+Volume pairing every other calculator uses) is sitting uncommitted in the working tree. Ship it cleanly: source fix first, version bump second, no mixed commits.

Output:
- Commit A: `fix(pert): drop fullRow on Formula RecapItem so it pairs with Volume`
- Commit B: `chore: bump patch version 1.16.0 → 1.16.1`
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@.planning/STATE.md
@./CLAUDE.md

<interfaces>
<!-- Current state of the file already-modified in the working tree (uncommitted). -->
<!-- Lines 44-55 of src/lib/pert/calculator.ts after fix: -->

```ts
const formula =
  state.tubeFeed.formulaId === null ? null : getFormulaById(state.tubeFeed.formulaId);
items.push({
  label: 'Formula',
  value: formula?.name ?? null
});
items.push({
  label: 'Volume',
  value: state.tubeFeed.volumePerDayMl === null ? null : `${state.tubeFeed.volumePerDayMl}`,
  unit: 'mL'
});
```

The diff that already exists in the working tree (do not re-edit):
```
-      value: formula?.name ?? null,
-      fullRow: true
+      value: formula?.name ?? null
```

`package.json` current state:
```json
"name": "nicu-assistant",
"version": "1.16.0",
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Commit the PERT calculator.ts fix atomically</name>
  <files>src/lib/pert/calculator.ts</files>
  <action>
Stage and commit ONLY `src/lib/pert/calculator.ts` (the existing uncommitted modification). Do NOT stage `package.json` in this commit — keep the source fix and version bump separate.

Verify the working tree before committing:
1. Run `git status --short` — should show exactly ` M src/lib/pert/calculator.ts` (plus the untracked `amp` directory which is unrelated and must NOT be staged).
2. Run `git diff --stat src/lib/pert/calculator.ts` — should show 1 file changed, 1 insertion(+), 2 deletions(-) (the `fullRow: true` removal plus trailing-comma cleanup on the prior line).

Stage and commit with this exact message (use HEREDOC for proper formatting):

```
fix(pert): drop fullRow on Formula RecapItem so it pairs with Volume

PERT tube-feed mode was the only calculator emitting a RecapItem with
fullRow:true on a non-Weight input. InputsRecap.svelte already supports
the Formula+Volume pairing — the bug was the upstream metadata forcing
Formula onto its own row.

Now matches every other calculator: only Weight uses fullRow; secondary
inputs pair on the same row. No behavioral change beyond layout; type-
check clean (svelte-check 0 errors), 81/81 PERT vitest tests still pass.

Discovered during /impeccable live-mode session on /pert (2026-04-30).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

Do NOT use `git add -A` or `git add .` — those would pick up the untracked `amp` directory. Use `git add src/lib/pert/calculator.ts` explicitly.
  </action>
  <verify>
    <automated>git log -1 --name-only --pretty=format:"%s%n%n%b%n---" | grep -E "fix\(pert\): drop fullRow|src/lib/pert/calculator\.ts" | wc -l | grep -q "^2$" && git diff HEAD~1 HEAD --stat | grep -q "src/lib/pert/calculator.ts" && ! git diff HEAD~1 HEAD --stat | grep -q "package.json"</automated>
  </verify>
  <done>
- HEAD commit subject is `fix(pert): drop fullRow on Formula RecapItem so it pairs with Volume`.
- HEAD commit touches exactly one file: `src/lib/pert/calculator.ts`.
- `package.json` is NOT in this commit.
- Working tree no longer shows `src/lib/pert/calculator.ts` as modified.
  </done>
</task>

<task type="auto">
  <name>Task 2: Bump patch version 1.16.0 → 1.16.1 and commit</name>
  <files>package.json</files>
  <action>
Edit `package.json` and change the `"version"` field from `"1.16.0"` to `"1.16.1"`. This is a single-line edit — use the Edit tool, not a full rewrite.

After the edit:
1. Run `git diff package.json` — should show exactly the version line changing from 1.16.0 to 1.16.1, no other changes.
2. Run `git status --short` — should show ` M package.json` plus the unrelated untracked `amp` directory.

Stage and commit with this exact message:

```
chore: bump patch version 1.16.0 → 1.16.1

Pairs with the preceding fix(pert) commit — releases the Formula recap
pairing fix as v1.16.1.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

Stage explicitly: `git add package.json` (do not use `-A` or `.`).

After committing, run `git status --short` — should show only the untracked `amp` directory remaining (no staged or modified tracked files).
  </action>
  <verify>
    <automated>grep -q '"version": "1.16.1"' package.json && git log -1 --pretty=format:"%s" | grep -q "^chore: bump patch version 1.16.0 → 1.16.1$" && git diff HEAD~1 HEAD --name-only | grep -q "^package.json$" && [ "$(git diff HEAD~1 HEAD --name-only | wc -l)" = "1" ]</automated>
  </verify>
  <done>
- `package.json` contains `"version": "1.16.1"`.
- HEAD commit subject is `chore: bump patch version 1.16.0 → 1.16.1`.
- HEAD commit touches exactly one file: `package.json`.
- HEAD~1 (the previous commit) is the `fix(pert)` commit from Task 1.
- Working tree shows no modified tracked files (only the untracked `amp` directory).
  </done>
</task>

</tasks>

<verification>
After both tasks complete, run as a final sanity sweep:

```bash
# Two atomic commits, in order
git log --oneline -2
# Expect:
#   <sha2> chore: bump patch version 1.16.0 → 1.16.1
#   <sha1> fix(pert): drop fullRow on Formula RecapItem so it pairs with Volume

# Each commit touches exactly one file
git show --stat HEAD | grep "1 file changed"
git show --stat HEAD~1 | grep "1 file changed"

# package.json is on 1.16.1
grep '"version"' package.json
# Expect: "version": "1.16.1",

# Working tree clean except for the unrelated untracked `amp` dir
git status --short
# Expect: only `?? amp` (no staged/modified tracked files)

# Tests still green (sanity — no behavioral change expected)
pnpm vitest run src/lib/pert/ 2>&1 | tail -5
# Expect: 81 passed
```
</verification>

<success_criteria>
- Two atomic commits land in this order:
  1. `fix(pert): drop fullRow on Formula RecapItem so it pairs with Volume` — touches only `src/lib/pert/calculator.ts`.
  2. `chore: bump patch version 1.16.0 → 1.16.1` — touches only `package.json`.
- `package.json` reports `"version": "1.16.1"`.
- PERT vitest suite remains 81/81 passing (no regression — metadata-only fix).
- `git status --short` after both commits shows only the unrelated untracked `amp` directory.
- `ROADMAP.md` is NOT modified (this is a quick task, not a phase).
</success_criteria>

<output>
After completion, create `.planning/quick/260430-cvl-bump-patch-version-and-commit-pert-calcu/260430-cvl-SUMMARY.md` capturing:
- Both commit SHAs and subjects
- Confirmation that working tree is clean (excluding the untracked `amp` directory)
- One-sentence note that this closes the /impeccable-discovered Formula/Volume pairing defect on /pert and ships as v1.16.1
</output>
