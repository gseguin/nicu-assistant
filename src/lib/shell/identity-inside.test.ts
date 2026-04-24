// src/lib/shell/identity-inside.test.ts
//
// Identity-Inside Rule conformance test (D-01).
//
// DESIGN.md's "Identity-Inside Rule" prohibits per-calculator identity hues
// in global chrome surfaces (top desktop tab underline, bottom mobile tab
// active state, hamburger drawer star icons). Identity color is permitted
// only INSIDE a calculator's own surfaces (eyebrow, hero card tint, slider
// track, calculator-input focus ring).
//
// This test enforces the doctrine via static-source regex — adding a new
// chrome surface that uses `var(--color-identity)` will fail CI here before
// it can ship. The HamburgerMenu calculator-link focus ring (line 102) is
// EXEMPT because the link sits inside the calculator's `.identity-{name}`
// row context (the link IS a calculator surface, not chrome).

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Identity-Inside Rule conformance (D-01)', () => {
  it('NavShell.svelte chrome class strings do not reference --color-identity', () => {
    const src = readFileSync(
      resolve(process.cwd(), 'src/lib/shell/NavShell.svelte'),
      'utf-8'
    );
    const offenders = src.match(
      /border-\[var\(--color-identity\)\]|text-\[var\(--color-identity\)\]/g
    );
    expect(
      offenders,
      'NavShell chrome must use --color-accent (Clinical Blue), not --color-identity'
    ).toBeNull();
  });

  it('HamburgerMenu.svelte favorites Star color does not reference --color-identity', () => {
    const src = readFileSync(
      resolve(process.cwd(), 'src/lib/shell/HamburgerMenu.svelte'),
      'utf-8'
    );
    // The Star color is set via inline `style="color: {... ? 'var(--color-identity)' ...}"`.
    // Catches the favorited-star branch using the identity token.
    expect(
      src,
      'HamburgerMenu Star color must use neutral text tokens (--color-text-primary / --color-text-tertiary), not --color-identity'
    ).not.toMatch(/style="color:\s*\{[^}]*var\(--color-identity\)/);
  });
});
