// DB record types (system-design.md §6.2)
// Aligned with rocketLH standardized data structure

export interface BetRecord {
  betId: string;
  sessionId: string;
  playerId: string;
  betAmount: number;
  emptyHoleCount: number;
  rtpSetting: number;
  volatilityLevel: number;
  status: 'active' | 'settled';
  autoCashout?: number;
  whackedHoles: number[];
  currentMultiplier: number;
  serverSeedHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WhackLog {
  drawId: string;
  sessionId: string;
  crashMultiplier: number;
  serverSeed: string;
  serverSeedHash: string;
  clientSeed?: string;
  createdAt: Date;
  crashedAt?: Date;
}

export interface Settlement {
  settlementId: string;
  sessionId: string;
  betId: string;
  outcome: 'win' | 'lose';
  cashoutMultiplier: number;
  payout: number;
  profit: number;
  settledAt: Date;
}
