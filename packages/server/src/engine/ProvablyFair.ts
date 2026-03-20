import crypto from 'crypto';
import { GRID_SIZE } from '@hitmous/shared';

export class ProvablyFair {
  generateServerSeed(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  hashSeed(seed: string): string {
    return crypto.createHash('sha256').update(seed).digest('hex');
  }

  generateLayout(serverSeed: string, emptyHoleCount: number): number[] {
    const layout = Array(GRID_SIZE).fill(0);
    for (let i = 0; i < emptyHoleCount; i++) {
      layout[i] = 1;
    }

    // Fisher-Yates shuffle with HMAC-SHA256 deterministic RNG
    for (let i = GRID_SIZE - 1; i > 0; i--) {
      const hmac = crypto
        .createHmac('sha256', serverSeed)
        .update(`${i}`)
        .digest('hex');
      const randomValue = parseInt(hmac.substring(0, 8), 16);
      const j = randomValue % (i + 1);
      [layout[i], layout[j]] = [layout[j], layout[i]];
    }

    return layout;
  }
}
