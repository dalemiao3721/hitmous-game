import pool from '../connection.js';
import type { Settlement } from '@hitmous/shared';

/** Generate a SETTLE-HITMOUS-YYYYMMDD-XX style ID */
function generateSettlementId(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `SETTLE-HITMOUS-${date}-${rand}`;
}

export async function createSettlement(data: Omit<Settlement, 'settlementId' | 'settledAt'>): Promise<Settlement> {
  const settlementId = generateSettlementId();
  const result = await pool.query(
    `INSERT INTO settlements (
      settlement_id, session_id, bet_id, outcome,
      cashout_multiplier, payout, profit
    ) VALUES ($1,$2,$3,$4,$5,$6,$7)
    RETURNING *`,
    [
      settlementId, data.sessionId, data.betId, data.outcome,
      data.cashoutMultiplier, data.payout, data.profit,
    ],
  );
  return mapRow(result.rows[0]);
}

export async function getSettlementBySessionId(sessionId: string): Promise<Settlement | null> {
  const result = await pool.query(
    'SELECT * FROM settlements WHERE session_id = $1',
    [sessionId],
  );
  return result.rows[0] ? mapRow(result.rows[0]) : null;
}

function mapRow(row: Record<string, unknown>): Settlement {
  return {
    settlementId: row.settlement_id as string,
    sessionId: row.session_id as string,
    betId: row.bet_id as string,
    outcome: row.outcome as 'win' | 'lose',
    cashoutMultiplier: Number(row.cashout_multiplier),
    payout: Number(row.payout),
    profit: Number(row.profit),
    settledAt: new Date(row.settled_at as string),
  };
}
