# Features Research — v1.8 GIR Calculator

## Formula Verification (SAFETY-CRITICAL) — CONFIRMED

**Canonical GIR formula (multiple independent sources agree):**

```
GIR (mg/kg/min) = [Dex% (g/dL) × Rate (mL/hr) × 1000 (mg/g)]
                  ÷ [Weight (kg) × 60 (min/hr) × 100 (mL/dL)]

Simplifies to:     GIR = (Dex% × Rate_mL/hr) / (6 × Weight_kg)
Or equivalently:   GIR = (Dex% × Rate_mL/hr × 10) / (Weight_kg × 60)
```

**Spreadsheet constant verification:**
- `0.167` ≡ `10/60 = 0.16667` — **correct** (rounded, ~0.002% error, clinically negligible).
- Reverse constant `0.0069` ≡ `0.167/24 = 0.006958` — **truncated**, introduces ~0.85% error on target fluids.
- **Recommendation**: implement in code using exact `10/60` and `1/144` rather than spreadsheet truncations. Run parity tests with ~1% epsilon and document the reason.

**Dextrose convention:** Entered as percent value (e.g., `12.5`), **not** fraction. Confirmed by MDCalc + spreadsheet + published formula.

**Glucose unit convention:** mg/dL (matches spreadsheet thresholds 40/50/60/70 and US audience). mmol/L conversion ≈ ×18. For v1.8, default to mg/dL; mmol/L toggle deferred.

### Sources (HIGH confidence)
- MDCalc — Glucose Infusion Rate (GIR): https://www.mdcalc.com/calc/10538/glucose-infusion-rate-gir (Guenst & Nelson, Chest 1994)
- Hawkes & Hwang, J Perinatol "Drop that calculator!": https://pmc.ncbi.nlm.nih.gov/articles/PMC7286731/
- Pediatric Oncall GIR Calculator: https://www.pediatriconcall.com/calculators/glucose-infusion-rate-gir-calculator
- Cornell PICU calc: http://www-users.med.cornell.edu/~spon/picu/calc/glucinfr.htm
- Ashford St Peters Neonatal Fluids guideline (PDF): https://ashfordstpeters.net/Guidelines_Neonatal/Glucose%20Infustion%20Rate%20Neonatal%20Fluids%20Dec%202018.pdf

---

## Titration Protocol Verification — PARTIALLY ALIGNED (frame as institutional helper)

The spreadsheet's six-bucket protocol (+1.5 / +1.0 / +0.5 / −0.5 / −1.0 / −1.5 at thresholds <40, 40–50, 50–60, 60–70, >70) does **not** map 1:1 to any single published guideline. Published protocols (BAPM, AAP, Stanford/JH clinical pathways, Ontop-in) commonly recommend **2 mg/kg/min step changes**. The spreadsheet's finer 0.5–1.5 mg/kg/min steps are more conservative — appropriate for gentle titration/weaning of a stable infant.

**What IS universally verified:**
- Glucose thresholds 40/45/50 mg/dL — rooted in AAP operational thresholds and PES targets (≥50 mg/dL <48h, ≥60 mg/dL >48h).
- Direction of titration (raise when low, lower when high).
- Symptomatic neurologic signs → more aggressive correction (BAPM/AAP principle).

**Recommendation:** Present the titration table as an **institutional adjustment helper**. The app computes the arithmetic for whatever delta the clinician selects. Do NOT claim the 6-bucket protocol is "the" guideline.

**UI copy:**
> "GIR titration helper — adjustment values reflect a conservative wean/titration protocol. Verify against your institutional protocol before acting."

The app's role: **compute the arithmetic**, not prescribe the protocol.

### Sources
- Diagnosis and Management of Neonatal Hypoglycemia — Comprehensive Review: https://pmc.ncbi.nlm.nih.gov/articles/PMC10378472/
- AAP Hypoglycemia Guidelines (Stony Brook mirror, PDF): https://renaissance.stonybrookmedicine.edu/sites/default/files/Hypoglycemia%20Guidelines%20AAP.pdf
- Contemporary Pediatrics — AAP vs PES: https://www.contemporarypediatrics.com/view/hypoglycemia-guidelines-aap-vs-pes
- PQCNC Hypoglycemia IV Weaning Protocol: https://pqcnc-documents.s3.amazonaws.com/nhpc/PQCNCNHPCNCHypoglycemiaIVWeaningProtocol20190304.pdf
- Johns Hopkins All Children's Persistent Hypoglycemia Clinical Pathway: https://www.hopkinsmedicine.org/-/media/files/allchildrens/clinical-pathways/persistent-hypoglycemia-clinical-pathway-2_13_2024.pdf
- CPS Management of Hypoglycemia algorithm: https://cps.ca/uploads/documents/Management_of_Hypoglycemia_algorithm_FINAL-EN.pdf

---

## Canonical Label — **"GIR Calculator"**

- **Nav tab:** `GIR` (short, matches Morphine/Formula pattern)
- **Full name on screen:** `Glucose Infusion Rate`
- **Eyebrow/subtitle:** `mg/kg/min · titration helper`

Do NOT use "Dextrose Infusion Calculator" — not the term clinicians reach for. "GIR" is universal NICU vernacular.

---

## Features

### Table Stakes
| Feature | Complexity | Notes |
|---|---|---|
| Weight, Dex%, mL/kg/day inputs → Current GIR + Initial rate | Low | Core formula, matches spreadsheet B2–B6 |
| Dex% picker (5 / 7.5 / 10 / 12.5) as chips OR numeric | Low | Clinicians nearly always pick stock bag concentrations |
| Tabular numerics on GIR result, large hero display | Low | Matches Morphine/Formula result hero pattern |
| Peripheral-line warning when Dex% > 12.5 | Low | **Highest-leverage safety rail.** See §Safety Rails. |
| Max-GIR advisory when result > ~12 mg/kg/min | Low | Hyperinsulinism / excessive load flag |
| Min-GIR advisory when result < ~4 mg/kg/min | Low | Below basal utilization → hypoglycemia risk if NPO |
| Titration helper table (6 buckets × 4 cols) | Medium | The spreadsheet's raison d'être |
| Interactive highlighting of clinician-selected bucket | Low-Med | Milestone scope — single selection, identity-hued row |
| Spreadsheet-parity unit tests | Low | Consistent with v1.1/v1.3 pattern |

### Differentiators
| Feature | Complexity | Notes |
|---|---|---|
| Total daily glucose load (g/kg/day) display | Low | `GIR × 1.44` — free math, nutritional context dietitians value |
| Total daily fluid (mL/day) | Trivial | `Weight × mL/kg/day` — helps nurses program pump |
| Population reference card (IDM/LGA 3–5, IUGR 5–7, Preterm/NPO 4–6) | Low | Already in source spreadsheet rows 19–22 |
| Glucose unit toggle (mg/dL ↔ mmol/L) | Low-Med | Defer unless needed — broadens audience beyond US |
| Copy/export result as text (EPIC dot-phrase friendly) | Low | Spreadsheet mentions `.hypoglywean` dot phrase — high leverage |
| Weight-change preview | Medium | sessionStorage already persists inputs — nice but not essential |

### Anti-Features (DO NOT build)
- History of last N calculations — clinical privacy / PHI risk, complicates offline PWA
- IV fluid mixing / compounding helper — out of scope, pharmacy domain, safety risk
- **Auto-prescribing / auto-ordering to EHR** — the tool computes, it does not prescribe
- Patient identifiers or account linking — PWA is anonymous, no auth per PROJECT.md
- Replacement for clinical judgment / protocol override — disclaimer must state explicitly
- TPN macronutrient calc (amino acids, lipids) — different calculator, scope creep
- Alarms/notifications — static calculation, not monitoring

---

## Clinical Safety Rails (advisory-only, blur-gated, no auto-clamp — matches v1.6 `NumericInput` pattern)

| Input | Soft min | Soft max | Advisory | Source/Confidence |
|---|---|---|---|---|
| Weight (kg) | 0.3 | 8.0 | "Outside typical neonatal range — verify." | MEDIUM — matches Morphine/Formula range hint pattern |
| Dextrose % | 2.5 | 25 | `>12.5`: **"Dextrose >12.5% requires central venous access."** `>25`: "Verify — unusually high concentration." | **HIGH** — ASPEN + UCSF Benioff Neonatal PN + PMC8372860 |
| mL/kg/day | 40 | 200 | "Outside typical fluid range — verify." | MEDIUM — standard neonatal TFI range |
| **Current GIR (output)** | ~4 | ~12 | `<4`: "Below basal glucose utilization (≈4–6 mg/kg/min)." `>12`: **"GIR >12 mg/kg/min — consider hyperinsulinism workup / central access."** | **HIGH** — Hawkes J Perinatol PMC7286731 + Ontop-in hypoglycemia protocol |

**Implementation**: Advisory-only (no clamp), blur-gated, matches `NumericInput` v1.6/v1.7. The **peripheral-access warning at Dex% >12.5** should be visually stronger (amber/warning tone, not standard grey hint) because it's the only rail tied to a concrete harm pathway (extravasation, tissue injury).

### Safety Rail Sources
- UCSF Benioff Neonatal PN: https://www.ucsfbenioffchildrens.org/-/media/project/ucsf/ucsf-bch/pdf/manuals/47_tpn.pdf
- Re-evaluating Safe Osmolarity for PPN (PMC8372860): https://pmc.ncbi.nlm.nih.gov/articles/PMC8372860/
- Hawkes J Perinatol (PMC7286731): https://pmc.ncbi.nlm.nih.gov/articles/PMC7286731/
- Ontop-in hypoglycemia protocol: https://www.ontop-in.org/ontop-pen/Week-3-4/Protocol%20hypoglycemia.pdf

---

## Key Clinical Conventions to Encode
- **Glucose unit:** mg/dL default (document assumption in UI copy)
- **Dex% as percent literal** (12.5, not 0.125) — placeholder `12.5`
- **GIR in mg/kg/min** always — universal
- **Never truncate constants in code** — use `10/60` and `1/144`; parity tests with ~1% epsilon
- **Disclaimer must include:** "This tool computes GIR arithmetic only. It does not prescribe, dose, or replace institutional protocol or clinical judgment."
- **Severe neurologic signs row label:** "Symptomatic / seizure" — not a routine bucket

---

## Open Questions (for human review during requirements/roadmap)
1. Confirm with source clinician whether the 6-bucket protocol is local institutional standard or has an external citation.
2. Decide whether mmol/L toggle is v1.8 or deferred (recommend defer).
3. Decide whether to surface the population reference card inline or behind an info affordance.

## Spreadsheet Note
Row 49 (40–50 bucket) is placed out-of-order in the source sheet — note for parity tests in the calc phase.
