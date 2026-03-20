import { describe, it, expect } from 'vitest';
import { ProvablyFair } from '../engine/ProvablyFair.js';
import { GRID_SIZE } from '@hitmous/shared';

describe('ProvablyFair', () => {
  const pf = new ProvablyFair();

  describe('generateServerSeed()', () => {
    it('returns a 64-character hex string (32 bytes)', () => {
      const seed = pf.generateServerSeed();
      expect(seed).toMatch(/^[0-9a-f]{64}$/);
    });

    it('generates unique seeds on each call', () => {
      const seeds = new Set(Array.from({ length: 10 }, () => pf.generateServerSeed()));
      expect(seeds.size).toBe(10);
    });
  });

  describe('hashSeed()', () => {
    it('produces consistent SHA-256 output for the same seed', () => {
      const seed = 'test-seed-abc123';
      const hash1 = pf.hashSeed(seed);
      const hash2 = pf.hashSeed(seed);
      expect(hash1).toBe(hash2);
    });

    it('returns a 64-character hex string', () => {
      const hash = pf.hashSeed('any-seed');
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });

    it('produces different hashes for different seeds', () => {
      const hash1 = pf.hashSeed('seed-a');
      const hash2 = pf.hashSeed('seed-b');
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('generateLayout()', () => {
    it('same seed produces identical layout (deterministic)', () => {
      const seed = 'deterministic-test-seed';
      const layout1 = pf.generateLayout(seed, 3);
      const layout2 = pf.generateLayout(seed, 3);
      expect(layout1).toEqual(layout2);
    });

    it('different seeds produce different layouts', () => {
      const layout1 = pf.generateLayout('seed-alpha', 5);
      const layout2 = pf.generateLayout('seed-beta', 5);
      expect(layout1).not.toEqual(layout2);
    });

    it('layout has exactly GRID_SIZE (16) elements', () => {
      const layout = pf.generateLayout('some-seed', 4);
      expect(layout).toHaveLength(GRID_SIZE);
    });

    it('layout contains exactly emptyHoleCount empty holes (value 1)', () => {
      for (const emptyCount of [1, 3, 5, 10, 15]) {
        const layout = pf.generateLayout('test-seed', emptyCount);
        const empties = layout.filter(v => v === 1).length;
        expect(empties).toBe(emptyCount);
      }
    });

    it('layout contains exactly (GRID_SIZE - emptyHoleCount) moles (value 0)', () => {
      const emptyCount = 7;
      const layout = pf.generateLayout('mole-count-seed', emptyCount);
      const moles = layout.filter(v => v === 0).length;
      expect(moles).toBe(GRID_SIZE - emptyCount);
    });

    it('layout only contains values 0 and 1', () => {
      const layout = pf.generateLayout('binary-check-seed', 5);
      for (const val of layout) {
        expect(val === 0 || val === 1).toBe(true);
      }
    });
  });
});
