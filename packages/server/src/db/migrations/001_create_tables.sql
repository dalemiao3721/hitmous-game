-- Hitmous Game: Initial schema (system-design.md §6.2)
-- Run: psql $DATABASE_URL -f 001_create_tables.sql

-- 注單記錄表
CREATE TABLE IF NOT EXISTS bet_records (
    bet_id            VARCHAR(64) PRIMARY KEY,
    session_id        VARCHAR(64) UNIQUE NOT NULL,
    player_id         VARCHAR(64) NOT NULL,
    bet_amount        DECIMAL(12, 2) NOT NULL CHECK (bet_amount > 0),
    empty_hole_count  SMALLINT NOT NULL CHECK (empty_hole_count BETWEEN 1 AND 15),
    rtp_setting       SMALLINT NOT NULL CHECK (rtp_setting IN (94, 96, 97, 98, 99)),
    volatility_level  SMALLINT NOT NULL DEFAULT 3,
    status            VARCHAR(16) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'settled')),
    auto_cashout      DECIMAL(10, 2),
    whacked_holes     JSONB NOT NULL DEFAULT '[]',
    current_multiplier DECIMAL(10, 4) NOT NULL DEFAULT 1.0000,
    server_seed_hash  VARCHAR(128) NOT NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bet_records_player_id ON bet_records (player_id);
CREATE INDEX IF NOT EXISTS idx_bet_records_status ON bet_records (status);

-- 開獎記錄表
CREATE TABLE IF NOT EXISTS whack_logs (
    draw_id           VARCHAR(64) PRIMARY KEY,
    session_id        VARCHAR(64) NOT NULL REFERENCES bet_records(session_id),
    crash_multiplier  DECIMAL(10, 4) NOT NULL,
    server_seed       VARCHAR(128) NOT NULL,
    server_seed_hash  VARCHAR(128) NOT NULL,
    client_seed       VARCHAR(128),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    crashed_at        TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_whack_logs_session_id ON whack_logs (session_id);

-- 結算記錄表
CREATE TABLE IF NOT EXISTS settlements (
    settlement_id     VARCHAR(64) PRIMARY KEY,
    session_id        VARCHAR(64) NOT NULL REFERENCES bet_records(session_id),
    bet_id            VARCHAR(64) NOT NULL REFERENCES bet_records(bet_id),
    outcome           VARCHAR(8) NOT NULL CHECK (outcome IN ('win', 'lose')),
    cashout_multiplier DECIMAL(10, 4) NOT NULL,
    payout            DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    profit            DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    settled_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_settlements_bet_id ON settlements (bet_id);
