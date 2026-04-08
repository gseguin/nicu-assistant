import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { tick } from 'svelte';

import SegmentedToggle from './SegmentedToggle.svelte';
import SegmentedToggleHarness from './SegmentedToggleHarness.svelte';

const twoOptions = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
];

const threeOptions = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
  { value: 'c', label: 'Gamma' },
];

function tabs(): HTMLButtonElement[] {
  return screen.getAllByRole('tab') as HTMLButtonElement[];
}

function tabByLabel(label: string): HTMLButtonElement {
  return screen.getByRole('tab', { name: label }) as HTMLButtonElement;
}

describe('SegmentedToggle', () => {
  it('T-01 renders a tablist with one tab per option and correct labels', () => {
    render(SegmentedToggle, { props: { label: 'Mode', value: 'a', options: twoOptions } });
    expect(screen.getByRole('tablist')).toBeTruthy();
    const ts = tabs();
    expect(ts.length).toBe(2);
    expect(ts[0].textContent).toContain('Alpha');
    expect(ts[1].textContent).toContain('Beta');
  });

  it('T-02 active tab carries text-[var(--color-identity)] class, inactive does not', () => {
    render(SegmentedToggle, { props: { label: 'Mode', value: 'a', options: twoOptions } });
    const [alpha, beta] = tabs();
    expect(alpha.className).toContain('text-[var(--color-identity)]');
    expect(alpha.getAttribute('aria-selected')).toBe('true');
    expect(alpha.getAttribute('tabindex')).toBe('0');
    // Inactive button has hover variant only, not the solid active class fragment
    expect(beta.className).not.toContain('bg-[var(--color-surface-card)] text-[var(--color-identity)]');
    expect(beta.getAttribute('aria-selected')).toBe('false');
    expect(beta.getAttribute('tabindex')).toBe('-1');
  });

  it('T-03 ArrowRight cycles selection + focus and wraps from last to first', async () => {
    render(SegmentedToggle, { props: { label: 'Mode', value: 'a', options: threeOptions } });
    let active = tabByLabel('Alpha');
    await fireEvent.keyDown(active, { key: 'ArrowRight' });
    await tick();
    expect(tabByLabel('Beta').getAttribute('aria-selected')).toBe('true');
    expect(document.activeElement).toBe(tabByLabel('Beta'));

    await fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'ArrowRight' });
    await tick();
    expect(tabByLabel('Gamma').getAttribute('aria-selected')).toBe('true');

    await fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'ArrowRight' });
    await tick();
    expect(tabByLabel('Alpha').getAttribute('aria-selected')).toBe('true');
    expect(document.activeElement).toBe(tabByLabel('Alpha'));
  });

  it('T-04 ArrowLeft cycles backwards and wraps from first to last', async () => {
    render(SegmentedToggle, { props: { label: 'Mode', value: 'a', options: threeOptions } });
    await fireEvent.keyDown(tabByLabel('Alpha'), { key: 'ArrowLeft' });
    await tick();
    expect(tabByLabel('Gamma').getAttribute('aria-selected')).toBe('true');
    expect(document.activeElement).toBe(tabByLabel('Gamma'));
  });

  it('T-05 Home jumps to first, End jumps to last', async () => {
    render(SegmentedToggle, { props: { label: 'Mode', value: 'b', options: threeOptions } });
    await fireEvent.keyDown(tabByLabel('Beta'), { key: 'Home' });
    await tick();
    expect(tabByLabel('Alpha').getAttribute('aria-selected')).toBe('true');
    expect(document.activeElement).toBe(tabByLabel('Alpha'));

    await fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'End' });
    await tick();
    expect(tabByLabel('Gamma').getAttribute('aria-selected')).toBe('true');
    expect(document.activeElement).toBe(tabByLabel('Gamma'));
  });

  it('T-06 Space and Enter activate the focused tab', async () => {
    render(SegmentedToggle, { props: { label: 'Mode', value: 'a', options: twoOptions } });
    await fireEvent.keyDown(tabByLabel('Beta'), { key: ' ' });
    await tick();
    expect(tabByLabel('Beta').getAttribute('aria-selected')).toBe('true');

    // Now activate Alpha via Enter
    await fireEvent.keyDown(tabByLabel('Alpha'), { key: 'Enter' });
    await tick();
    expect(tabByLabel('Alpha').getAttribute('aria-selected')).toBe('true');
  });

  it('T-07 click writes value back through bind:value', async () => {
    const { component } = render(SegmentedToggleHarness, { props: { initial: 'a' } }) as any;
    await fireEvent.click(tabByLabel('Beta'));
    await tick();
    expect(screen.getByTestId('current').textContent).toBe('b');
    expect(tabByLabel('Beta').getAttribute('aria-selected')).toBe('true');
  });
});
