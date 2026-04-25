# Phase 44: Kendamil Formula Family - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-25
**Phase:** 44-kendamil-formula-family
**Areas discussed:** Spec sourcing, ID & label naming, Canonical parity-test design, Audit-trail capture

---

## Spec Sourcing

### Q1: How should Classic + Goat spec values be obtained?

| Option | Description | Selected |
|---|---|---|
| Researcher fetches hcp.kendamil.com (Recommended) | gsd-phase-researcher pulls the Classic + Goat HCP mixing charts during the research step, computes calorie_concentration from kcal/100mL ÷ standard reconstitution, captures the source URL per variant | ✓ |
| You paste values now | User pastes Classic and Goat numbers (or photo) into discussion; locks values into CONTEXT.md | |
| Pause until you provide a PDF/photo | Stop the discussion, user goes to grab HCP PDFs / pages, then returns | |

**User's choice:** Researcher fetches hcp.kendamil.com.

### Q2: How should displacement_factor be handled if Kendamil HCP doesn't publish mL/g directly?

| Option | Description | Selected |
|---|---|---|
| Derive from reconstitution ratio (Recommended) | Compute displacement_factor = (final_volume_mL − water_mL) / scoop_grams using HCP standard reconstitution example. Documented in PLAN.md per variant | ✓ |
| Use Organic's 0.77 as fallback | Reuse Organic's 0.77 mL/g for Classic + Goat with note in PLAN.md | |
| Block phase until HCP gives mL/g | Don't ship without manufacturer-published displacement | |

**User's choice:** Derive from reconstitution ratio per variant.

### Q3: If hcp.kendamil.com is region-gated (UK vs US) or behind login, what's the fallback?

| Option | Description | Selected |
|---|---|---|
| Try US site first, then UK (Recommended) | Researcher tries hcp.kendamil.com (US) first — product is sold/imported in US. Falls back to UK Kendamil HCP if US is incomplete. Captures both URLs if values match | ✓ |
| UK site is canonical | Kendamil is a UK manufacturer; UK HCP is source of truth. Researcher cites UK URLs | |
| Pause and ask you for the right URL | If region matters and researcher can't tell, pause back to user | |

**User's choice:** Try US site first, then UK.

---

## ID & Label Naming

### Q1: What ID convention should the three Kendamil entries use?

| Option | Description | Selected |
|---|---|---|
| Bare variant (Recommended) | kendamil-organic / kendamil-classic / kendamil-goat. Matches existing pattern (similac-advance, neocate-infant). Adding HMF / toddler later just appends another entry | ✓ |
| Life-stage suffix | kendamil-organic-infant / kendamil-classic-infant / kendamil-goat-infant. Future-proofs against toddler / follow-on but adds friction | |
| Full UK product name | kendamil-organic-first-infant-milk etc. Maximum disambiguation, longest IDs | |

**User's choice:** Bare variant.
**Notes:** "This is for NICU so it's only infants — bare variant."

### Q2: What should the SelectPicker label (the `name` field) say?

| Option | Description | Selected |
|---|---|---|
| Kendamil Organic / Classic / Goat (Recommended) | Short, scannable, matches manufacturer-and-line convention used by 'Similac Advance' / 'Enfamil NeuroPro' | ✓ |
| Kendamil Organic Infant / Classic Infant / Goat Infant | Adds 'Infant' suffix to disambiguate against future HMF / toddler additions | |
| Full UK name 'Kendamil Organic First Infant Milk' etc. | Verbatim manufacturer label. Wraps in narrow SelectPicker viewports on mobile | |

**User's choice:** Kendamil Organic / Classic / Goat.

### Q3: Manufacturer field value for the three entries?

| Option | Description | Selected |
|---|---|---|
| "Kendamil" plain (Recommended) | Matches existing pattern ("Abbott", "Nestlé", "Mead Johnson", "Nutricia"). Sorts alphabetically between Abbott and Mead Johnson | ✓ |
| "Kendamil (UK)" | Signals imported / non-US-domestic origin. Diverges from existing pattern | |
| "Kendamil Nutrition" (legal name) | Full corporate name. More verbose group header | |

**User's choice:** "Kendamil" plain.

---

## Canonical Parity-Test Design

### Q1: What test case shape should each Kendamil parity test use?

| Option | Description | Selected |
|---|---|---|
| Mirror Neocate canonical for all 3 (Recommended) | Every variant: 180 mL + breast-milk + 24 kcal/oz + scoops. Hand-compute expected scoops per variant from published spec. Symmetric, reviewable | ✓ |
| Clinically-realistic per variant | Pick a representative NICU clinical case per variant — e.g., 60 mL preemie, 120 mL fortified BM, 180 mL standard | |
| Cover all 3 kcal/oz tiers across the 3 variants | Variant A @22, Variant B @24, Variant C @26. Asymmetric | |

**User's choice:** Mirror Neocate canonical for all 3.

### Q2: What unit and base should the parity test use?

| Option | Description | Selected |
|---|---|---|
| scoops + breast-milk (Recommended) | Scoops is the natural Kendamil dispensing unit (HCP charts publish g/scoop). Breast-milk base matches NICU clinical reality and the Neocate VAL-01 pattern | ✓ |
| grams + water | Pure-formula path. Simplest math to hand-verify. Less clinically representative | |
| scoops + water | Manufacturer-natural unit, simpler base | |

**User's choice:** scoops + breast-milk.

### Q3: Should the SelectPicker grouping test (KEND-TEST-02) live in the existing FortificationInputs.test.ts or a new file?

| Option | Description | Selected |
|---|---|---|
| Extend fortification-config.test.ts (Recommended) | The grouping is a derived property of the config (manufacturer field). Closer to the data source, faster to run | ✓ |
| Extend FortificationInputs.test.ts | Test the actual SelectPicker grouping in the rendered component. Closer to user-visible behavior, slower | |
| Both | Belt-and-suspenders | |

**User's choice:** Extend fortification-config.test.ts.

### Q4: Formula-count test currently asserts exactly 30 — bump to 33?

| Option | Description | Selected |
|---|---|---|
| Update count to 33 (Recommended) | expect(formulas).toHaveLength(33). Simplest. Future formula additions will require another bump | ✓ |
| Loosen to >= 33 | toBeGreaterThanOrEqual(33). Less brittle but loses xlsx-row-count audit trail | |
| Drop the count assertion | Remove the test entirely | |

**User's choice:** Update count to 33.

---

## Audit-Trail Capture

### Q1: Where should hcp.kendamil.com source URLs and computed-value rationale live?

| Option | Description | Selected |
|---|---|---|
| PLAN.md only (Recommended) | Matches v1.3 fortification pattern. Per-variant source URL, raw HCP values, computation steps, final JSON values | |
| PLAN.md + JSDoc-style comments in fortification-config.ts | PLAN.md for full audit + per-variant short comments in the .ts loader. Discoverable from code | ✓ |
| PLAN.md + sidecar fortification-sources.md | Permanent .planning-adjacent doc. Higher maintenance overhead | |
| Test file (.test.ts) docblock | Document each variant's source in the test that asserts its values. Diverges from existing pattern | |

**User's choice:** PLAN.md + JSDoc-style comments in fortification-config.ts.

### Q2: What clinical-audit metadata should each variant record beyond the URL? (multi-select)

| Option | Description | Selected |
|---|---|---|
| Source URL (Recommended) | The exact hcp.kendamil.com page or PDF URL. Required by SC5 | ✓ |
| Date the URL was fetched (Recommended) | When the values were captured. Lets a future audit verify against the same snapshot | ✓ |
| Raw HCP values (kcal/100mL, scoop g, recon ratio) | The unprocessed numbers from the chart. Lets future engineers re-verify the math without re-fetching | ✓ |
| Region (US vs UK page) | Which Kendamil region the values were sourced from — confirms US clinical applicability | ✓ |

**User's choice:** All four (Source URL + Date + Raw HCP values + Region).

---

## Claude's Discretion

- Test naming / `describe` block structure within `calculations.test.ts` — researcher/planner can mirror existing `describe('calculateFortification — documented case (VAL-01)', ...)` style.
- Exact `toBeCloseTo` precision digits per variant — match precision yielding a stable assertion within 1% epsilon.
- JSDoc comment formatting in `fortification-config.ts` — single-block at top of file vs. per-variant inline.

## Deferred Ideas

- Kendamil HMF / fortifier variants — out of scope per REQUIREMENTS.md.
- Kendamil toddler / follow-on milks — out of scope; NICU audience is infants.
- Other non-Kendamil formula brands — no current request.
- Hide `manufacturer` field from SelectPicker label — not requested.
- Sidecar `SOURCES.md` registry — defer until at least one more non-xlsx-sourced formula family lands.
