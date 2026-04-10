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
  return screen.getByRole('button', { name: new RegExp(`^${label}`) }) as HTMLButtonElement;
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
    const labelledBy = trigger.getAttribute('aria-labelledby');
    expect(labelledBy).toBeTruthy();
    const ids = labelledBy!.split(' ');
    expect(ids.length).toBe(2);
    expect(document.getElementById(ids[0])?.textContent).toBe('Fruit');
    expect(document.getElementById(ids[1])?.textContent).toBe('Apple');
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

const searchableOptions = [
  { value: 'sim-adv', label: 'Similac Advance', group: 'Abbott' },
  { value: 'sim-neo', label: 'Similac NeoSure', group: 'Abbott' },
  { value: 'enfa-ar', label: 'Enfamil AR', group: 'Mead Johnson' },
  { value: 'enfa-pre', label: 'Enfamil Premature', group: 'Mead Johnson' },
  { value: 'gerb', label: 'Gerber Good Start', group: 'Nestle' },
];

function openTrigger(label: string) {
  return screen.getByLabelText(label) as HTMLButtonElement;
}

describe('SelectPicker searchable mode', () => {
  it('T-12 opens with search input focused and empty', async () => {
    render(SelectPicker, {
      props: { label: 'Formula', value: '', options: searchableOptions, searchable: true },
    });
    await fireEvent.click(openTrigger('Formula'));
    await tick();
    const input = screen.getByRole('textbox', { name: /Filter Formula/i }) as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.value).toBe('');
    expect(document.activeElement).toBe(input);
  });

  it('T-13 typing filters by label and group (case-insensitive)', async () => {
    render(SelectPicker, {
      props: { label: 'Formula', value: '', options: searchableOptions, searchable: true },
    });
    await fireEvent.click(openTrigger('Formula'));
    await tick();
    const input = screen.getByRole('textbox', { name: /Filter Formula/i }) as HTMLInputElement;

    await fireEvent.input(input, { target: { value: 'abb' } });
    await tick();
    expect(screen.getAllByRole('option').length).toBe(2);

    await fireEvent.input(input, { target: { value: 'enfa' } });
    await tick();
    expect(screen.getAllByRole('option').length).toBe(2);

    await fireEvent.input(input, { target: { value: 'pre' } });
    await tick();
    const opts = screen.getAllByRole('option');
    expect(opts.length).toBe(1);
    expect(opts[0].textContent).toContain('Enfamil Premature');
  });

  it('T-14 shows "No matches" with role=status when filter empty', async () => {
    render(SelectPicker, {
      props: { label: 'Formula', value: '', options: searchableOptions, searchable: true },
    });
    await fireEvent.click(openTrigger('Formula'));
    await tick();
    const input = screen.getByRole('textbox', { name: /Filter Formula/i }) as HTMLInputElement;
    await fireEvent.input(input, { target: { value: 'zzzzzz' } });
    await tick();
    expect(screen.queryAllByRole('option').length).toBe(0);
    const status = screen.getByRole('status');
    expect(status.textContent).toContain('No matches');
  });

  it('T-15 ArrowDown enters list, ArrowUp returns to search input', async () => {
    render(SelectPicker, {
      props: { label: 'Formula', value: '', options: searchableOptions, searchable: true },
    });
    await fireEvent.click(openTrigger('Formula'));
    await tick();
    const input = screen.getByRole('textbox', { name: /Filter Formula/i }) as HTMLInputElement;
    expect(document.activeElement).toBe(input);

    await fireEvent.keyDown(input, { key: 'ArrowDown' });
    await tick();
    expect((document.activeElement as HTMLElement).getAttribute('data-index')).toBe('0');

    await fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'ArrowUp' });
    await tick();
    expect(document.activeElement).toBe(input);
  });

  it('T-16 Enter on single match selects and closes', async () => {
    render(SelectPicker, {
      props: { label: 'Formula', value: '', options: searchableOptions, searchable: true },
    });
    const trigger = openTrigger('Formula');
    await fireEvent.click(trigger);
    await tick();
    const input = screen.getByRole('textbox', { name: /Filter Formula/i }) as HTMLInputElement;
    await fireEvent.input(input, { target: { value: 'gerb' } });
    await tick();
    await fireEvent.keyDown(input, { key: 'Enter' });
    await tick();
    expect(trigger.textContent).toContain('Gerber Good Start');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('T-17 reopening resets searchQuery and refocuses input', async () => {
    const { container } = render(SelectPicker, {
      props: { label: 'Formula', value: '', options: searchableOptions, searchable: true },
    });
    const trigger = openTrigger('Formula');
    await fireEvent.click(trigger);
    await tick();
    let input = screen.getByRole('textbox', { name: /Filter Formula/i }) as HTMLInputElement;
    await fireEvent.input(input, { target: { value: 'abb' } });
    await tick();
    expect(screen.getAllByRole('option').length).toBe(2);

    const dialog = container.querySelector('dialog')!;
    dialog.close();
    await tick();

    await fireEvent.click(trigger);
    await tick();
    input = screen.getByRole('textbox', { name: /Filter Formula/i }) as HTMLInputElement;
    expect(input.value).toBe('');
    expect(document.activeElement).toBe(input);
    expect(screen.getAllByRole('option').length).toBe(searchableOptions.length);
  });

  it('T-18 searchable=false (default) renders no Filter textbox', async () => {
    render(SelectPicker, {
      props: { label: 'Formula', value: '', options: searchableOptions },
    });
    await fireEvent.click(openTrigger('Formula'));
    await tick();
    expect(screen.queryByRole('textbox', { name: /Filter Formula/i })).toBeNull();
  });
});
