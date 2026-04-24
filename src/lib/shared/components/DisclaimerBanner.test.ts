import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { tick } from 'svelte';

import DisclaimerBanner from './DisclaimerBanner.svelte';

const KEY_V1 = 'nicu_assistant_disclaimer_v1';
const KEY_V2 = 'nicu_assistant_disclaimer_v2';

describe('DisclaimerBanner', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('scenario 1: fresh install (no v1, no v2) renders the banner', async () => {
    const { disclaimer } = await import('$lib/shared/disclaimer.svelte.js');
    disclaimer.init();
    render(DisclaimerBanner, { props: {} });
    const banner = screen.getByRole('region', { name: /clinical use disclaimer/i });
    expect(banner).toBeTruthy();
    expect(banner.textContent).toMatch(/clinical decision support/i);
    expect(banner.textContent).toMatch(/verify all values/i);
  });

  it('scenario 2: migration — v1="true" with v2 absent hides banner and writes v2', async () => {
    localStorage.setItem(KEY_V1, 'true');
    const { disclaimer } = await import('$lib/shared/disclaimer.svelte.js');
    disclaimer.init();
    render(DisclaimerBanner, { props: {} });
    expect(screen.queryByRole('region', { name: /clinical use disclaimer/i })).toBeNull();
    expect(localStorage.getItem(KEY_V2)).toBe('true');
    expect(localStorage.getItem(KEY_V1)).toBe('true');
  });

  it('scenario 3: steady state — v2="true" hides banner', async () => {
    localStorage.setItem(KEY_V2, 'true');
    const { disclaimer } = await import('$lib/shared/disclaimer.svelte.js');
    disclaimer.init();
    render(DisclaimerBanner, { props: {} });
    expect(screen.queryByRole('region', { name: /clinical use disclaimer/i })).toBeNull();
  });

  it('scenario 4: dismiss button activates acknowledge() and persists v2', async () => {
    const { disclaimer } = await import('$lib/shared/disclaimer.svelte.js');
    disclaimer.init();
    render(DisclaimerBanner, { props: {} });
    const dismiss = screen.getByRole('button', { name: /dismiss disclaimer/i });
    await fireEvent.click(dismiss);
    await tick();
    expect(disclaimer.acknowledged).toBe(true);
    expect(localStorage.getItem(KEY_V2)).toBe('true');
    expect(screen.queryByRole('region', { name: /clinical use disclaimer/i })).toBeNull();
  });

  it('scenario 5: "More" link calls onShowFull callback', async () => {
    const { disclaimer } = await import('$lib/shared/disclaimer.svelte.js');
    disclaimer.init();
    const onShowFull = vi.fn();
    render(DisclaimerBanner, { props: { onShowFull } });
    const more = screen.getByRole('button', { name: /^more$/i });
    await fireEvent.click(more);
    expect(onShowFull).toHaveBeenCalledTimes(1);
  });

  it('scenario 6: localStorage.setItem throws (private mode) — no crash, in-memory acknowledged', async () => {
    const { disclaimer } = await import('$lib/shared/disclaimer.svelte.js');
    disclaimer.init();
    render(DisclaimerBanner, { props: {} });

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError');
    });

    const dismiss = screen.getByRole('button', { name: /dismiss disclaimer/i });
    expect(() => fireEvent.click(dismiss)).not.toThrow();
    await tick();
    expect(disclaimer.acknowledged).toBe(true);
  });
});
