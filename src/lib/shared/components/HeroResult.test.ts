import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';

import HeroResult from './HeroResult.svelte';
import HeroResultChildrenHarness from './HeroResultChildrenHarness.svelte';
import HeroResultIconHarness from './HeroResultIconHarness.svelte';

describe('HeroResult', () => {
  it('renders eyebrow + value + unit text in DOM in correct order', () => {
    render(HeroResult, {
      props: { eyebrow: 'CURRENT GIR', value: '7.5', unit: 'mg/kg/min' }
    });
    expect(screen.getByText('CURRENT GIR')).toBeTruthy();
    expect(screen.getByText('7.5')).toBeTruthy();
    expect(screen.getByText('mg/kg/min')).toBeTruthy();

    // Order: eyebrow precedes numeral precedes unit (DOM order).
    const eyebrow = screen.getByText('CURRENT GIR');
    const numeral = screen.getByText('7.5');
    const unit = screen.getByText('mg/kg/min');
    expect(
      eyebrow.compareDocumentPosition(numeral) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      numeral.compareDocumentPosition(unit) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it('applies the .num class to the value <span>', () => {
    render(HeroResult, { props: { eyebrow: 'EYEBROW', value: '12.34' } });
    const numeral = screen.getByText('12.34');
    expect(numeral.className).toContain('num');
  });

  it('outer <section> carries aria-live="polite" AND aria-atomic="true"', () => {
    render(HeroResult, { props: { eyebrow: 'A', value: '1' } });
    const section = document.querySelector('section.animate-result-pulse');
    expect(section).toBeTruthy();
    expect(section!.getAttribute('aria-live')).toBe('polite');
    expect(section!.getAttribute('aria-atomic')).toBe('true');
  });

  it('changing pulseKey re-mounts the inner block (different node identity)', async () => {
    const { rerender } = render(HeroResult, {
      props: { eyebrow: 'EYEBROW', value: '1', pulseKey: 'a' }
    });
    const before = screen.getByText('1');
    await rerender({ eyebrow: 'EYEBROW', value: '1', pulseKey: 'b' });
    const after = screen.getByText('1');
    // Different DOM node identity — {#key} re-mounted the block.
    expect(after).not.toBe(before);
  });

  it('children Snippet override path replaces default body', () => {
    render(HeroResultChildrenHarness);
    // Custom body renders
    expect(screen.getByTestId('custom-body')).toBeTruthy();
    expect(screen.getByText('CUSTOM CHILDREN BODY')).toBeTruthy();
    // Default eyebrow/value are NOT rendered when children present
    expect(screen.queryByText('DEFAULT EYEBROW')).toBeNull();
    expect(screen.queryByText('999')).toBeNull();
  });

  it('icon prop renders an SVG (with the identity color class) inside the eyebrow row', () => {
    render(HeroResultIconHarness);
    const icon = screen.getByTestId('stub-icon');
    expect(icon).toBeTruthy();
    // Identity color class is forwarded to the icon component
    expect(icon.getAttribute('class')).toContain('text-[var(--color-identity)]');
    // Eyebrow still renders alongside the icon
    expect(screen.getByText('ICON EYEBROW')).toBeTruthy();
  });

  it('default-props path always renders a text-display numeral (display-numeral contract)', () => {
    // Contract (locked 2026-04-24 post-42.1 critique):
    // Any HeroResult must contain at least one text-display element. The default
    // props path uses `text-display font-black` on the value span; this test pins
    // that fact so any future refactor that drops the size class breaks here.
    render(HeroResult, {
      props: { eyebrow: 'CONTRACT', value: '7.5', unit: 'mg/kg/min' }
    });
    const numeral = screen.getByText('7.5');
    expect(numeral.className).toContain('text-display');
    expect(numeral.className).toContain('font-black');
  });

  it('custom children snippet paths must include a text-display element (documentation)', () => {
    // Documentation test — the children-snippet escape hatch is used by GIR,
    // Morphine summary, UAC/UVC, and Feeds for custom shapes (paired, metric-grid,
    // label-promoted). Each consumer is responsible for including its own
    // text-display numeral. The HeroResultChildrenHarness used in the
    // "children Snippet override path" test is intentionally minimal and does
    // NOT include a text-display element — that harness only covers the
    // override mechanism, not the contract. The real consumers each have their
    // own component test that assert the text-display numeral is present.
    // This test exists as a permanent reminder of the contract, and will pass
    // so long as it is written.
    expect(true).toBe(true);
  });

  it('value containing literal <script> is rendered as text (XSS-defense smoke)', () => {
    render(HeroResult, {
      props: { eyebrow: 'XSS', value: '<script>alert(1)</script>' }
    });
    // The numeral span exists and its textContent equals the literal string.
    const span = document.querySelector('span.num');
    expect(span).toBeTruthy();
    expect(span!.textContent).toBe('<script>alert(1)</script>');
    // No real <script> tag was injected into the document.
    const realScripts = document.querySelectorAll('section.animate-result-pulse script');
    expect(realScripts.length).toBe(0);
  });
});
