// Multiplier calculation per system-design.md §7.1 & §7.2

import { GRID_SIZE, RTP_OPTIONS } from './constants.js';

export function combination(n: number, k: number): number {
  if (k > n) return 0;
  if (k === 0 || k === n) return 1;
  let result = 1;
  for (let i = 0; i < k; i++) {
    result = result * (n - i) / (i + 1);
  }
  return result;
}

export function calculateMultiplier(emptyHoles: number, whackedCount: number, rtp: number): number {
  if (whackedCount === 0) return 1;
  const fairMultiplier = combination(GRID_SIZE, whackedCount)
                        / combination(GRID_SIZE - emptyHoles, whackedCount);
  return Math.floor((rtp / 100) * fairMultiplier * 10000) / 10000;
}

export type MultiplierTable = Record<number, Record<number, number[]>>;

export function buildMultiplierTable(): MultiplierTable {
  const table: MultiplierTable = {};

  for (const rtp of RTP_OPTIONS) {
    table[rtp] = {};
    for (let e = 1; e <= 15; e++) {
      const maxMoles = GRID_SIZE - e;
      table[rtp][e] = [1];
      for (let d = 1; d <= maxMoles; d++) {
        table[rtp][e].push(calculateMultiplier(e, d, rtp));
      }
    }
  }

  return table;
}
