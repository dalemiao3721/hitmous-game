import { describe, it, expect } from 'vitest';
import { combination, calculateMultiplier, buildMultiplierTable } from '../multiplier';
import { RTP_OPTIONS } from '../constants';

describe('combination(n, k)', () => {
  it('C(16, 0) = 1', () => {
    expect(combination(16, 0)).toBe(1);
  });

  it('C(16, 16) = 1', () => {
    expect(combination(16, 16)).toBe(1);
  });

  it('C(16, 1) = 16', () => {
    expect(combination(16, 1)).toBe(16);
  });

  it('C(16, 2) = 120', () => {
    expect(combination(16, 2)).toBe(120);
  });

  it('C(n, k) = 0 when k > n', () => {
    expect(combination(3, 5)).toBe(0);
  });

  it('C(16, 8) = 12870', () => {
    expect(combination(16, 8)).toBe(12870);
  });
});

describe('calculateMultiplier(emptyHoles, whackedCount, rtp)', () => {
  it('returns 1 when whackedCount is 0', () => {
    expect(calculateMultiplier(3, 0, 97)).toBe(1);
  });

  it('emptyHoles=3, RTP=97, d=1 → 1.194x (matches proposal)', () => {
    const result = calculateMultiplier(3, 1, 97);
    // C(16,1)/C(13,1) = 16/13 ≈ 1.2307..., * 0.97 ≈ 1.1938...
    // floor to 4 decimals → 1.1938
    expect(result).toBe(1.1938);
  });

  it('emptyHoles=3, RTP=97, d=2 → ~1.492x (matches proposal)', () => {
    const result = calculateMultiplier(3, 2, 97);
    // C(16,2)/C(13,2) = 120/78 ≈ 1.5384..., * 0.97 ≈ 1.4923...
    // floor to 4 decimals → 1.4923
    expect(result).toBe(1.4923);
  });

  it('multipliers are monotonically increasing with whackedCount', () => {
    const emptyHoles = 5;
    const rtp = 97;
    const maxMoles = 16 - emptyHoles;
    let prev = calculateMultiplier(emptyHoles, 0, rtp);
    for (let d = 1; d <= maxMoles; d++) {
      const curr = calculateMultiplier(emptyHoles, d, rtp);
      expect(curr).toBeGreaterThan(prev);
      prev = curr;
    }
  });

  it('higher RTP yields higher multipliers for the same scenario', () => {
    const low = calculateMultiplier(3, 5, 94);
    const high = calculateMultiplier(3, 5, 99);
    expect(high).toBeGreaterThan(low);
  });

  it('result is floored to 4 decimal places', () => {
    const result = calculateMultiplier(3, 1, 97);
    const decimalPart = result.toString().split('.')[1] || '';
    expect(decimalPart.length).toBeLessThanOrEqual(4);
  });
});

describe('buildMultiplierTable()', () => {
  const table = buildMultiplierTable();

  it('covers all RTP options', () => {
    for (const rtp of RTP_OPTIONS) {
      expect(table[rtp]).toBeDefined();
    }
  });

  it('covers all emptyHoles from 1 to 15 for each RTP', () => {
    for (const rtp of RTP_OPTIONS) {
      for (let e = 1; e <= 15; e++) {
        expect(table[rtp][e]).toBeDefined();
        expect(table[rtp][e].length).toBe(16 - e + 1); // d=0..maxMoles
      }
    }
  });

  it('first entry (d=0) is always 1', () => {
    for (const rtp of RTP_OPTIONS) {
      for (let e = 1; e <= 15; e++) {
        expect(table[rtp][e][0]).toBe(1);
      }
    }
  });

  it('multipliers are monotonically increasing within each series', () => {
    for (const rtp of RTP_OPTIONS) {
      for (let e = 1; e <= 15; e++) {
        const series = table[rtp][e];
        for (let i = 1; i < series.length; i++) {
          expect(series[i]).toBeGreaterThan(series[i - 1]);
        }
      }
    }
  });
});
