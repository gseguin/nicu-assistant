#!/usr/bin/env bash
# Phase 4 DESIGN.md named-rule audit. PERT route only.
# Returns 0 if all 10 rules pass, 1 if any rule fails.
# Output is appended verbatim to 04-VERIFICATION.md (Wave 3 consumer).
#
# This script is a Phase-4-only deliverable (CONTEXT D-05a). It is NOT a
# permanent codebase asset. Wave 3 reads its output; Phase 5 (release) may
# remove it once the v1.15 polish freeze ships.
#
# Source for the 10 rules: 04-UI-SPEC.md "DESIGN.md Named-Rule Audit" table.
# Each rule maps to a grep or check; failure severity is P1 except where noted.

set -u
cd "$(dirname "$0")/../../../../.."  # repo root from phase dir (5 levels up)

scope="src/lib/pert src/routes/pert"
fail=0

check() {
  local rule="$1"; shift
  local result; result="$("$@" 2>&1 || true)"
  local count; count=$(echo "$result" | grep -cv '^$' || true)
  if [ "$count" -eq 0 ]; then
    echo "  [PASS] Rule $rule"
  else
    echo "  [FAIL] Rule $rule (count=$count)"
    echo "$result" | sed 's/^/         /'
    fail=1
  fi
}

# A separate variant for "must-have-N-or-more" gates (Rule 6 Tabular-Numbers).
check_min() {
  local rule="$1"; local minimum="$2"; shift 2
  local count; count="$("$@" 2>/dev/null || echo 0)"
  if [ "$count" -ge "$minimum" ]; then
    echo "  [PASS] Rule $rule (count=$count, min=$minimum)"
  else
    echo "  [FAIL] Rule $rule (count=$count, min=$minimum)"
    fail=1
  fi
}

echo "=== DESIGN.md Named-Rule Audit (PERT route) ==="
echo "Scope: $scope"
echo

# Rule 1: Identity-Inside Rule
# .identity-pert and --color-identity ONLY on hero / focus rings / eyebrows / active nav.
# This grep returns ALL hits; manual whitelist filtering happens in Wave 3 review.
# For automated PASS, we accept any hit count here (informational); the manual review
# pass below (printed for human verification) lists each hit for whitelist scrutiny.
echo "Rule 1 Identity-Inside (informational; manual whitelist required):"
grep -rEn "identity-pert|--color-identity" $scope || echo "  (no hits)"
echo

# Rule 2: Amber-as-Semantic Rule
# PERT must never reference amber tokens (BMF-only).
check "2 Amber-as-Semantic" grep -rEn "bmf-amber|\\bamber\\b" $scope

# Rule 3: OKLCH-Only Rule
# All color values via OKLCH tokens (var(--color-*)). No hex, rgb(), hsl(), or
# inline oklch() literals in PERT route code (tokens flow from app.css only).
check "3 OKLCH-Only (no hex/rgb/hsl/inline-oklch)" grep -rEn "(rgb|hsl)\\(|#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?\\b|oklch\\(" $scope

# Rule 4: Red-Means-Wrong (with STOP-red carve-out)
# var(--color-error) reserved for STOP-red advisory card and inherited
# NumericInput blur error border. Outside-of-PertCalculator hits = P1.
check "4 Red-Means-Wrong (PertInputs + +page.svelte)" grep -rnE "color-error" src/lib/pert/PertInputs.svelte src/routes/pert/+page.svelte

# Rule 5: Five-Roles-Only (typography)
# No arbitrary text-Npx, no text-xs/sm/lg/xl in PERT route files (NumericInput
# range hint is shared-component-inherited, not a PERT violation).
# Wave 3 fix (04-03 Task 2 deviation): the original regex `text-(xs|sm|lg|xl|\[)\b`
# false-flagged `text-[var(--color-*)]` color tokens which are NOT typography
# violations. Restrict the bracket alternative to numeric/dimension forms only:
# `text-[<digit>...` or `text-[#...` -- the actual typography-arbitrary-size shape.
# Color tokens `text-[var(...)]` are the standard convention and pass.
check "5 Five-Roles-Only" grep -rEn "text-(xs|sm|lg|xl|\\[[0-9#])" src/lib/pert/PertCalculator.svelte src/lib/pert/PertInputs.svelte src/routes/pert/+page.svelte

# Rule 6: Tabular-Numbers (>=5 hits in PertCalculator)
check_min "6 Tabular-Numbers (PertCalculator class=\"num\" hits >=5)" 5 \
  bash -c "grep -cE 'class=\"[^\"]*\\bnum\\b' src/lib/pert/PertCalculator.svelte"

# Rule 7: Eyebrow-Above-Numeral
# Manual read of PertCalculator hero + secondary blocks; printed for review.
echo "Rule 7 Eyebrow-Above-Numeral (manual review of hero + secondaries):"
echo "  Inspect: src/lib/pert/PertCalculator.svelte HeroResult children snippet"
echo "  Inspect: PertCalculator secondary card rows for text-2xs uppercase eyebrow above numerals"
echo

# Rule 8: 11px Floor
# text-2xs (11px) for LABELS only. Advisory copy steps up to text-ui (13px).
# Hit count is informational; manual whitelist (eyebrow vs body) is required.
echo "Rule 8 11px-Floor (informational; manual whitelist required):"
grep -rEn "text-2xs" src/lib/pert/PertCalculator.svelte src/lib/pert/PertInputs.svelte src/routes/pert/+page.svelte || echo "  (no hits)"
echo

# Rule 9: Tonal-Depth
# No raw OKLCH literals; depth via 3-step lightness, not heavy shadows.
check "9 Tonal-Depth (no raw OKLCH)" grep -rEn "oklch\\(" $scope
check "9 Tonal-Depth (no heavy shadow)" grep -rEn "shadow-(md|lg|xl|2xl)|drop-shadow" $scope

# Rule 10: Flat-Card-Default
# Cards are flat with 1px border and shadow-sm. STOP-red border-2 is a
# permitted exception. No nested cards. Manual review required.
echo "Rule 10 Flat-Card-Default (manual review of card nesting):"
grep -rEn "<section[^>]*class=\"[^\"]*\\bcard\\b" src/lib/pert/PertCalculator.svelte src/lib/pert/PertInputs.svelte || echo "  (no card section hits)"
echo

echo "=== End audit ==="
exit $fail
