import pool from '../connection.js';
import type { WhackLog } from '@hitmous/shared';

/** Generate a WHACK-LOG-YYYYMMDD-XX style ID */
function generateDrawId(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `WHACK-LOG-${date}-${rand}`;
}

export async function createWhackLog(data: Omit<WhackLog, 'drawId' | 'createdAt'>): Promise<WhackLog> {
  const drawId = generateDrawId();
  const result = await pool.query(
    `INSERT INTO whack_logs (
      draw_id, session_id, crash_multiplier, server_seed,
      server_seed_hash, client_seed, crashed_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7)
    RETURNING *`,
    [
      drawId, data.sessionId, data.crashMultiplier, data.serverSeed,
      data.serverSeedHash, data.clientSeed ?? null, data.crashedAt ?? null,
    ],
  );
  return mapRow(result.rows[0]);
}

export async function getWhackLogBySessionId(sessionId: string): Promise<WhackLog | null> {
  const result = await pool.query(
    'SELECT * FROM whack_logs WHERE session_id = $1',
    [sessionId],
  );
  return result.rows[0] ? mapRow(result.rows[0]) : null;
}

function mapRow(row: Record<string, unknown>): WhackLog {
  return {
    drawId: row.draw_id as string,
    sessionId: row.session_id as string,
    crashMultiplier: Number(row.crash_multiplier),
    serverSeed: row.server_seed as string,
    serverSeedHash: row.server_seed_hash as string,
    clientSeed: row.client_seed as string | undefined,
    createdAt: new Date(row.created_at as string),
    crashedAt: row.crashed_at ? new Date(row.crashed_at as string) : undefined,
  };
}
