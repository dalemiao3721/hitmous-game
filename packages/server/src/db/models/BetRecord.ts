import pool from '../connection.js';
import type { BetRecord } from '@hitmous/shared';

/** Generate a BET-HITMOUS-YYYYMMDD-XX style ID */
function generateBetId(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `BET-HITMOUS-${date}-${rand}`;
}

export async function createBetRecord(data: Omit<BetRecord, 'betId' | 'createdAt' | 'updatedAt'>): Promise<BetRecord> {
  const betId = generateBetId();
  const result = await pool.query(
    `INSERT INTO bet_records (
      bet_id, session_id, player_id, bet_amount, empty_hole_count,
      rtp_setting, volatility_level, status, auto_cashout,
      whacked_holes, current_multiplier, server_seed_hash
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
    RETURNING *`,
    [
      betId, data.sessionId, data.playerId, data.betAmount, data.emptyHoleCount,
      data.rtpSetting, data.volatilityLevel, data.status, data.autoCashout ?? null,
      JSON.stringify(data.whackedHoles), data.currentMultiplier, data.serverSeedHash,
    ],
  );
  return mapRow(result.rows[0]);
}

export async function updateBetRecord(
  sessionId: string,
  data: Partial<Pick<BetRecord, 'status' | 'whackedHoles' | 'currentMultiplier'>>,
): Promise<void> {
  const sets: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (data.status !== undefined) {
    sets.push(`status = $${idx++}`);
    values.push(data.status);
  }
  if (data.whackedHoles !== undefined) {
    sets.push(`whacked_holes = $${idx++}`);
    values.push(JSON.stringify(data.whackedHoles));
  }
  if (data.currentMultiplier !== undefined) {
    sets.push(`current_multiplier = $${idx++}`);
    values.push(data.currentMultiplier);
  }
  sets.push(`updated_at = NOW()`);
  values.push(sessionId);

  await pool.query(
    `UPDATE bet_records SET ${sets.join(', ')} WHERE session_id = $${idx}`,
    values,
  );
}

export async function getBetRecordBySessionId(sessionId: string): Promise<BetRecord | null> {
  const result = await pool.query(
    'SELECT * FROM bet_records WHERE session_id = $1',
    [sessionId],
  );
  return result.rows[0] ? mapRow(result.rows[0]) : null;
}

function mapRow(row: Record<string, unknown>): BetRecord {
  return {
    betId: row.bet_id as string,
    sessionId: row.session_id as string,
    playerId: row.player_id as string,
    betAmount: Number(row.bet_amount),
    emptyHoleCount: Number(row.empty_hole_count),
    rtpSetting: Number(row.rtp_setting),
    volatilityLevel: Number(row.volatility_level),
    status: row.status as 'active' | 'settled',
    autoCashout: row.auto_cashout != null ? Number(row.auto_cashout) : undefined,
    whackedHoles: row.whacked_holes as number[],
    currentMultiplier: Number(row.current_multiplier),
    serverSeedHash: row.server_seed_hash as string,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}
