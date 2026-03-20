import { describe, it, expect } from 'vitest';
import { verifySeedHash } from '../fairness';

describe('verifySeedHash()', () => {
  it('returns true for a valid seed and its SHA-256 hash', async () => {
    const seed = 'test-server-seed-123';
    // Pre-computed SHA-256 of "test-server-seed-123"
    const encoder = new TextEncoder();
    const data = encoder.encode(seed);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const expectedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    expect(await verifySeedHash(seed, expectedHash)).toBe(true);
  });

  it('returns false for mismatched seed and hash', async () => {
    expect(await verifySeedHash('seed-a', 'incorrect-hash')).toBe(false);
  });

  it('returns false when seed is modified', async () => {
    const seed = 'original-seed';
    const encoder = new TextEncoder();
    const data = encoder.encode(seed);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    expect(await verifySeedHash('tampered-seed', hash)).toBe(false);
  });
});
