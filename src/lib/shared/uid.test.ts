import { describe, it, expect, afterEach, vi } from 'vitest';
import { randomId } from './uid.js';

describe('randomId', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns a non-empty string', () => {
    expect(randomId()).toMatch(/.+/);
  });

  it('returns a different value on each call', () => {
    expect(randomId()).not.toBe(randomId());
  });

  it('uses crypto.randomUUID when available (secure context)', () => {
    const spy = vi.fn(() => '11111111-2222-3333-4444-555555555555');
    vi.stubGlobal('crypto', { randomUUID: spy });
    expect(randomId()).toBe('11111111-2222-3333-4444-555555555555');
    expect(spy).toHaveBeenCalledOnce();
  });

  it('falls back to Math.random when crypto.randomUUID is missing (insecure LAN-IP context)', () => {
    vi.stubGlobal('crypto', {});
    const id = randomId();
    expect(id).toMatch(/^[0-9a-z]+$/);
    expect(id.length).toBeGreaterThan(8);
  });

  it('falls back when crypto itself is undefined', () => {
    vi.stubGlobal('crypto', undefined);
    expect(randomId()).toMatch(/^[0-9a-z]+$/);
  });
});
