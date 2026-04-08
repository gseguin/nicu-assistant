import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { tick } from 'svelte';

vi.mock('../context.js', () => ({
  getCalculatorContext: () => ({ accentColor: 'oklch(49% 0.17 220)' }),
}));

import SelectPicker from './SelectPicker.svelte';

const flatOptions = [
  { value: 'a', label: 'Apple' },
  { value: 'b', label: 'Banana' },
  { value: 'c', label: 'Cherry' },
];
const groupedOptions = [
  { value: 'g1-a', label: 'Alpha', group: 'Greek' },
  { value: 'g1-b', label: 'Beta', group: 'Greek' },
  { value: 'g2-a', label: 'One', group: 'Numbers' },
  { value: 'g2-b', label: 'Two', group: 'Numbers' },
];

function getTrigger(label: string): HTMLButtonElement {
  return screen.getByRole('button', { name: label }) as HTMLButtonElement;
}

describe('SelectPicker', () => {
  it('T-01 renders trigger with label and placeholder when value is empty', () => {
    render(SelectPicker, { props: { label: 'Fruit', value: '', options: flatOptions } });
    const trigger = getTrigger('Fruit');
    expect(trigger.textContent).toContain('Select...');
  });

  it('T-02 trigger exposes data-select-trigger and aria-labelledby', () => {
    render(SelectPicker, { props: { label: 'Fruit', value: 'a', options: flatOptions } });
    const trigger = getTrigger('Fruit');
    expect(trigger.hasAttribute('data-select-trigger')).toBe(true);
    const labelId = trigger.getAttribute('aria-labelledby');
    expect(labelId).toBeTruthy();
    expect(document.getElementById(labelId!)?.textContent).toBe('Fruit');
  });

  it('T-03 closed state has zero [role="option"] in DOM', () => {
    render(SelectPicker, { props: { label: 'Fruit', value: 'a', options: flatOptions } });
    expect(screen.queryAllByRole('option').length).toBe(0);
  });

  it('T-04 clicking trigger opens dialog, aria-expanded=true, options render', async () => {
    render(SelectPicker, { props: { label: 'Fruit', value: 'a', options: flatOptions } });
    const trigger = getTrigger('Fruit');
    await fireEvent.click(trigger);
    await tick();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(screen.queryAllByRole('option').length).toBe(flatOptions.length);
  });

  it('T-05 ArrowDown moves focus to next option', async () => {
    render(SelectPicker, { props: { label: 'Fruit', value: 'a', options: flatOptions } });
    await fireEvent.click(getTrigger('Fruit'));
    await tick();
    const listbox = screen.getByRole('listbox');
    await fireEvent.keyDown(listbox, { key: 'ArrowDown' });
    await tick();
    expect((document.activeElement as HTMLElement).getAttribute('data-index')).toBe('1');
  });

  it('T-06 Home jumps to first, End jumps to last', async () => {
    render(SelectPicker, { props: { label: 'Fruit', value: 'b', options: flatOptions } });
    await fireEvent.click(getTrigger('Fruit'));
    await tick();
    const listbox = screen.getByRole('listbox');
    await fireEvent.keyDown(listbox, { key: 'End' });
    await tick();
    expect((document.activeElement as HTMLElement).getAttribute('data-index')).toBe(
      String(flatOptions.length - 1)
    );
    await fireEvent.keyDown(listbox, { key: 'Home' });
    await tick();
    expect((document.activeElement as HTMLElement).getAttribute('data-index')).toBe('0');
  });

  it('T-07 clicking an option closes dialog and refocuses trigger', async () => {
    render(SelectPicker, { props: { label: 'Fruit', value: 'a', options: flatOptions } });
    const trigger = getTrigger('Fruit');
    await fireEvent.click(trigger);
    await tick();
    const bananaOption = screen
      .getAllByRole('option')
      .find((o) => o.textContent?.includes('Banana')) as HTMLButtonElement;
    await fireEvent.click(bananaOption);
    await tick();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(trigger);
  });

  it('T-08 grouped options render role="group" per unique group, queryable by name', async () => {
    render(SelectPicker, { props: { label: 'Token', value: '', options: groupedOptions } });
    await fireEvent.click(getTrigger('Token'));
    await tick();
    expect(screen.queryAllByRole('group').length).toBe(2);
    expect(screen.getByRole('group', { name: 'Greek' })).toBeTruthy();
    expect(screen.getByRole('group', { name: 'Numbers' })).toBeTruthy();
  });

  it('T-09 selected option has aria-selected=true', async () => {
    render(SelectPicker, { props: { label: 'Fruit', value: 'b', options: flatOptions } });
    await fireEvent.click(getTrigger('Fruit'));
    await tick();
    const selected = screen
      .getAllByRole('option')
      .find((o) => o.textContent?.includes('Banana'));
    expect(selected?.getAttribute('aria-selected')).toBe('true');
  });

  it('T-10 trigger textContent shows the selected option label', () => {
    render(SelectPicker, { props: { label: 'Fruit', value: 'c', options: flatOptions } });
    expect(getTrigger('Fruit').textContent).toContain('Cherry');
  });

  it('T-11 closed picker exposes exactly one element with accessible name "Fruit"', () => {
    render(SelectPicker, { props: { label: 'Fruit', value: '', options: flatOptions } });
    expect(screen.queryAllByLabelText('Fruit').length).toBe(1);
    expect(() => screen.getByLabelText('Fruit')).not.toThrow();
  });
});
