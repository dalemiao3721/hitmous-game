import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3004', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  defaultRtp: parseInt(process.env.DEFAULT_RTP || '97', 10),
  sessionTtlMinutes: parseInt(process.env.SESSION_TTL_MINUTES || '30', 10),
  corsOrigin: process.env.CORS_ORIGIN || '*',
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '1000', 10),
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '10', 10),
  lobbyApiUrl: process.env.LOBBY_API_URL || 'http://localhost:3000',
  gameSecret: process.env.GAME_SECRET || 'hitmous-shared-secret-dev',
};
