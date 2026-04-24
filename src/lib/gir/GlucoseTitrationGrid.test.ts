import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import GlucoseTitrationGrid from './GlucoseTitrationGrid.svelte';
import type { GirTitrationRow } from './types.js';

function makeRows(overrides: Partial<GirTitrationRow>[] = []): GirTitrationRow[] {
  const base: GirTitrationRow[] = [
    {
      bucketId: 'severe-neuro',
      label: 'Severe neurologic signs',
      action: 'Increase by 1.5',
      targetGirMgKgMin: 9.7,
      targetFluidsMlKgDay: 77,
      targetRateMlHr: 12.6,
      deltaRateMlHr: 2.0
    },
    {
      bucketId: 'lt40',
      label: '<40',
      action: 'Increase by 1.0',
      targetGirMgKgMin: 9.2,
      targetFluidsMlKgDay: 73,
      targetRateMlHr: 11.9,
      deltaRateMlHr: 1.3
    },
    {
      bucketId: '40-50',
      label: '40-50',
      action: 'Increase by 0.5',
      targetGirMgKgMin: 8.7,
      targetFluidsMlKgDay: 69,
      targetRateMlHr: 11.3,
      deltaRateMlHr: 0.6
    },
    {
      bucketId: '50-60',
      label: '50-60',
      action: 'No change or consider wean by 0.5',
      targetGirMgKgMin: 7.7,
      targetFluidsMlKgDay: 61,
      targetRateMlHr: 10.0,
      deltaRateMlHr: -0.6
    },
    {
      bucketId: '60-70',
      label: '60-70',
      action: 'Decrease by 1.0',
      targetGirMgKgMin: 7.2,
      targetFluidsMlKgDay: 57,
      targetRateMlHr: 9.3,
      deltaRateMlHr: -1.3
    },
    {
      bucketId: 'gt70',
      label: '>70',
      action: 'Decrease by 1.5',
      targetGirMgKgMin: 0,
      targetFluidsMlKgDay: 0,
      targetRateMlHr: 0,
      deltaRateMlHr: -10
    }
  ];
  return base.map((r, i) => ({ ...r, ...(overrides[i] ?? {}) }));
}

describe('GlucoseTitrationGrid', () => {
  it('renders 6 radio rows in the unified card-stack layout', () => {
    render(GlucoseTitrationGrid, { rows: makeRows(), selectedBucketId: null, onselect: () => {} });
    const radios = screen.getAllByRole('radio');
    // Post-layout refactor: mobile and desktop share the same card-stack DOM
    // (grid is decision surface only, hero above owns the action display).
    expect(radios.length).toBe(6);
  });

  it('has no checked row by default', () => {
    render(GlucoseTitrationGrid, { rows: makeRows(), selectedBucketId: null, onselect: () => {} });
    const radios = screen.getAllByRole('radio');
    radios.forEach((r) => expect(r.getAttribute('aria-checked')).toBe('false'));
  });

  it('first row has tabindex=0 when nothing selected (roving tabindex)', () => {
    render(GlucoseTitrationGrid, { rows: makeRows(), selectedBucketId: null, onselect: () => {} });
    const radios = screen.getAllByRole('radio');
    expect(radios[0].getAttribute('tabindex')).toBe('0');
    expect(radios[1].getAttribute('tabindex')).toBe('-1');
  });

  it('click fires onselect with correct bucketId', async () => {
    const onselect = vi.fn();
    render(GlucoseTitrationGrid, { rows: makeRows(), selectedBucketId: null, onselect });
    const radios = screen.getAllByRole('radio');
    await fireEvent.click(radios[2]); // third row — 40-50
    expect(onselect).toHaveBeenCalledWith('40-50');
  });

  it('ArrowDown advances selection', async () => {
    const onselect = vi.fn();
    render(GlucoseTitrationGrid, { rows: makeRows(), selectedBucketId: null, onselect });
    const radios = screen.getAllByRole('radio');
    await fireEvent.keyDown(radios[0], { key: 'ArrowDown' });
    expect(onselect).toHaveBeenCalledWith('lt40');
  });

  it('Home jumps to first row', async () => {
    const onselect = vi.fn();
    render(GlucoseTitrationGrid, { rows: makeRows(), selectedBucketId: '50-60', onselect });
    const radios = screen.getAllByRole('radio');
    const selectedRow = radios.find((r) => r.getAttribute('aria-checked') === 'true')!;
    await fireEvent.keyDown(selectedRow, { key: 'Home' });
    expect(onselect).toHaveBeenCalledWith('severe-neuro');
  });

  it('End jumps to last row', async () => {
    const onselect = vi.fn();
    render(GlucoseTitrationGrid, { rows: makeRows(), selectedBucketId: 'severe-neuro', onselect });
    const radios = screen.getAllByRole('radio');
    const selectedRow = radios.find((r) => r.getAttribute('aria-checked') === 'true')!;
    await fireEvent.keyDown(selectedRow, { key: 'End' });
    expect(onselect).toHaveBeenCalledWith('gt70');
  });

  it('Target GIR <= 0 renders STOP bold action word inside the grid row', () => {
    render(GlucoseTitrationGrid, { rows: makeRows(), selectedBucketId: null, onselect: () => {} });
    const stops = screen.getAllByText(/^STOP$/);
    expect(stops.length).toBeGreaterThan(0);
    // Post-layout refactor: grid rows carry ui-size bold actions (the hero
    // above owns the display-size numeral). The word STOP must still be in
    // a bold span so it stands out within the row.
    const boldStop = stops.find((el) => {
      const cls = el.className || '';
      return cls.includes('font-bold');
    });
    expect(boldStop).toBeTruthy();
    // aria-label on the severe-neuro row starts with "Severe neuro" and mentions "stop dextrose infusion"
    const radios = screen.getAllByRole('radio');
    const severe = radios.filter((r) => /^Severe neuro/i.test(r.getAttribute('aria-label') || ''));
    expect(severe.length).toBeGreaterThan(0);
    for (const row of severe) {
      expect((row.getAttribute('aria-label') || '').toLowerCase()).toContain(
        'stop dextrose infusion'
      );
    }
  });

  it('positive delta renders ▲ + (increase)', () => {
    render(GlucoseTitrationGrid, { rows: makeRows(), selectedBucketId: null, onselect: () => {} });
    expect(screen.getAllByText('▲').length).toBeGreaterThan(0);
    expect(screen.getAllByText('(increase)').length).toBeGreaterThan(0);
  });

  it('negative delta renders ▼ + (decrease)', () => {
    render(GlucoseTitrationGrid, { rows: makeRows(), selectedBucketId: null, onselect: () => {} });
    expect(screen.getAllByText('▼').length).toBeGreaterThan(0);
    expect(screen.getAllByText('(decrease)').length).toBeGreaterThan(0);
  });

  it('zero delta renders "Hold" bold action word inside the grid row (em-dash ban)', () => {
    const rows = makeRows([{}, {}, {}, { deltaRateMlHr: 0 }, {}, {}]);
    render(GlucoseTitrationGrid, { rows, selectedBucketId: null, onselect: () => {} });
    // 42.1-followup: em-dash purged per DESIGN.md absolute ban; zero-delta
    // renders "Hold" as the clinical action word. Post layout refactor it
    // sits in the grid row at ui-size bold (hero above owns display-size).
    const holds = screen.getAllByText('Hold');
    expect(holds.length).toBeGreaterThan(0);
    const boldHold = holds.find((el) => {
      const cls = el.className || '';
      return cls.includes('font-bold');
    });
    expect(boldHold).toBeTruthy();
    // aria-label on the Δ=0 row (50-60 bucket) contains "no change"
    const radios = screen.getAllByRole('radio');
    const zeroRow = radios.find((r) => /Glucose 50-60/i.test(r.getAttribute('aria-label') || ''));
    expect(zeroRow).toBeTruthy();
    expect((zeroRow!.getAttribute('aria-label') || '').toLowerCase()).toContain('no change');
  });

  it('non-zero non-stop row renders Δ rate with glyph + abs in bold base-size spans', () => {
    render(GlucoseTitrationGrid, { rows: makeRows(), selectedBucketId: null, onselect: () => {} });
    // Post layout refactor: grid rows render delta at text-base font-bold (hero
    // above owns the display-size numeral for the selected row).
    const glyphs = screen.getAllByText('▲');
    const boldGlyph = glyphs.find((el) => {
      const cls = el.className || '';
      return cls.includes('text-base') && cls.includes('font-bold');
    });
    expect(boldGlyph).toBeTruthy();
    const absSpans = screen.getAllByText('1.3');
    const boldAbs = absSpans.find((el) => {
      const cls = el.className || '';
      return cls.includes('text-base') && cls.includes('font-bold');
    });
    expect(boldAbs).toBeTruthy();
  });

  it('ariaLabelFor on normal bucket announces direction + ml/hr BEFORE mg/kg/min', () => {
    render(GlucoseTitrationGrid, { rows: makeRows(), selectedBucketId: null, onselect: () => {} });
    const radios = screen.getAllByRole('radio');
    const lt40 = radios.find((r) =>
      /Glucose less than 40/i.test(r.getAttribute('aria-label') || '')
    );
    expect(lt40).toBeTruthy();
    const label = lt40!.getAttribute('aria-label') || '';
    expect(label).toMatch(
      /Glucose.*?(increase|decrease).*?milliliters per hour.*?milligrams per kilogram per minute/
    );
  });

  it('single unified radiogroup (no separate mobile + desktop DOM)', () => {
    const { container } = render(GlucoseTitrationGrid, {
      rows: makeRows(),
      selectedBucketId: null,
      onselect: () => {}
    });
    // Post layout refactor: only one radiogroup renders; mobile and desktop
    // share the same card-stack structure. No column-header row.
    const grids = container.querySelectorAll('[role="radiogroup"]');
    expect(grids.length).toBe(1);
  });

  it('ArrowUp moves selection backward (wraps to end from first)', async () => {
    const onselect = vi.fn();
    render(GlucoseTitrationGrid, { rows: makeRows(), selectedBucketId: null, onselect });
    const radios = screen.getAllByRole('radio');
    await fireEvent.keyDown(radios[0], { key: 'ArrowUp' });
    expect(onselect).toHaveBeenCalledWith('gt70'); // wraps
  });

  it('ArrowRight advances selection (same as ArrowDown)', async () => {
    const onselect = vi.fn();
    render(GlucoseTitrationGrid, { rows: makeRows(), selectedBucketId: null, onselect });
    await fireEvent.keyDown(screen.getAllByRole('radio')[0], { key: 'ArrowRight' });
    expect(onselect).toHaveBeenCalledWith('lt40');
  });

  it('ArrowLeft moves selection backward (same as ArrowUp)', async () => {
    const onselect = vi.fn();
    render(GlucoseTitrationGrid, { rows: makeRows(), selectedBucketId: 'lt40', onselect });
    const radios = screen.getAllByRole('radio');
    const selected = radios.find((r) => r.getAttribute('aria-checked') === 'true')!;
    await fireEvent.keyDown(selected, { key: 'ArrowLeft' });
    expect(onselect).toHaveBeenCalledWith('severe-neuro');
  });

  it('Space selects the focused row without moving', async () => {
    const onselect = vi.fn();
    render(GlucoseTitrationGrid, { rows: makeRows(), selectedBucketId: null, onselect });
    await fireEvent.keyDown(screen.getAllByRole('radio')[2], { key: ' ' });
    expect(onselect).toHaveBeenCalledWith('40-50');
  });

  it('Enter selects the focused row without moving', async () => {
    const onselect = vi.fn();
    render(GlucoseTitrationGrid, { rows: makeRows(), selectedBucketId: null, onselect });
    await fireEvent.keyDown(screen.getAllByRole('radio')[2], { key: 'Enter' });
    expect(onselect).toHaveBeenCalledWith('40-50');
  });
});
