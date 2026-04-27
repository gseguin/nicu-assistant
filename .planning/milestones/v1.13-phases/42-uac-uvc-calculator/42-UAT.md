---
status: complete
phase: 42-uac-uvc-calculator
source:
  - 42-01-SUMMARY.md
  - 42-02-SUMMARY.md
  - 42-03-SUMMARY.md
started: 2026-04-23T00:00:00Z
updated: 2026-04-23T00:10:00Z
---

## Current Test

[testing complete]

## Tests

### 1. UAC/UVC Route Renders
expected: Navigate to /uac-uvc. Ruler icon + heading "UAC/UVC Catheter Depth" + subtitle "cm · weight-based formula" visible. No error, no placeholder.
result: pass

### 2. Default Calculation (2.5 kg)
expected: On first load, weight textbox shows 2.5 (or empty with placeholder 2.5). UAC hero card shows 16.5 cm, UVC hero card shows 8.3 cm. Both cards display the "cm" unit.
result: pass

### 3. Empty State
expected: Clear the weight textbox. Both hero cards replace the number with "Enter weight to compute depth" (full structure swapped, not just greyed).
result: pass

### 4. Textbox → Slider Sync
expected: Type 5.0 into the weight textbox. The slider thumb moves to the 5.0 position. UAC shows 24.0 cm, UVC shows 12.0 cm.
result: pass

### 5. Slider → Textbox Sync
expected: Drag the weight slider to a new value (e.g., 1.0 kg). Textbox updates to match the slider. Both hero cards recompute (UAC 12.0 cm, UVC 6.0 cm at 1.0 kg).
result: pass

### 6. Visual Distinction — UAC vs UVC
expected: UAC card has a top stripe (arterial, arrow pointing down-to-line icon) and eyebrow "UAC DEPTH — ARTERIAL". UVC card has a bottom stripe (venous, arrow pointing up-from-line icon) and eyebrow "UVC DEPTH — VENOUS". Colors use the rose/pink identity-uac tokens.
result: pass

### 7. SessionStorage Persistence
expected: Enter a weight (e.g., 7.5 kg), navigate away to another calculator, come back to /uac-uvc. Weight is still 7.5 and hero values still show the corresponding UAC/UVC numbers.
result: pass

### 8. Hamburger Menu — UAC/UVC Entry + Add to Favorites
expected: Open the hamburger menu. A UAC/UVC entry is listed (5th calculator, Ruler icon). Clicking the star adds it to favorites (bottom nav bar updates on mobile to include UAC/UVC tab).
result: pass

### 9. Favorites Cap-Full Disabled State
expected: With 4 favorites already set (e.g., Morphine, Formula, GIR, Feeds), open hamburger. UAC/UVC star is disabled (greyed/not clickable). Caption "4 of 4 favorites — remove one to add another." is visible.
result: pass

### 10. Dark Mode Identity
expected: Toggle dark mode. /uac-uvc page still legible. Hero card backgrounds use a muted rose/pink dark tone (identity-uac dark tokens). Text contrast passes — numbers readable against the card background.
result: pass

## Summary

total: 10
passed: 10
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

[none yet]
