export type GamePhase = 'IDLE' | 'PLAYING' | 'GAME_OVER' | 'CASHOUT';

export interface HoleState {
  index: number;
  status: 'hidden' | 'whacked_mole' | 'whacked_empty' | 'revealed_mole' | 'revealed_empty';
}

export interface GameState {
  phase: GamePhase;
  sessionId: string | null;
  balance: number;
  betAmount: number;
  emptyHoleCount: number;
  rtpSetting: 94 | 96 | 97 | 98 | 99;
  holes: HoleState[];
  whackedCount: number;
  currentMultiplier: number;
  nextMultiplier: number;
  payout: number;
  serverSeedHash: string | null;
  serverSeed: string | null;
  layout: number[] | null;
  /** Lobby integration state */
  lobbyMode: boolean;
  lobbyBalance: number | null;
  lobbyToken: string | null;
  lobbySessionId: string | null;
}

export type GameAction =
  | { type: 'SET_BET'; betAmount: number }
  | { type: 'SET_EMPTY_HOLES'; count: number }
  | { type: 'SET_RTP'; rtp: 94 | 96 | 97 | 98 | 99 }
  | { type: 'SET_BALANCE'; balance: number }
  | { type: 'GAME_STARTED'; sessionId: string; serverSeedHash: string; nextMultiplier: number }
  | { type: 'WHACK_RESULT_MOLE'; holeIndex: number; newMultiplier: number; nextMultiplier: number }
  | { type: 'WHACK_RESULT_EMPTY'; holeIndex: number; serverSeed: string; layout: number[] }
  | { type: 'FULL_CLEAR_SUCCESS'; holeIndex: number; payout: number; currentMultiplier: number; serverSeed: string; layout: number[] }
  | { type: 'CASHOUT_SUCCESS'; payout: number; serverSeed: string; layout: number[] }
  | { type: 'RESET' }
  | { type: 'SET_LOBBY_MODE'; lobbyToken: string; lobbySessionId: string }
  | { type: 'SET_LOBBY_BALANCE'; balance: number };

export interface GameSession {
  sessionId: string;
  playerId: string;
  betAmount: number;
  emptyHoleCount: number;
  rtpSetting: number;
  layout: number[];
  serverSeed: string;
  serverSeedHash: string;
  whackedHoles: number[];
  currentMultiplier: number;
  status: 'active' | 'settled';
  createdAt: Date;
  /** v1.4: volatility level (default 3) */
  volatilityLevel?: number;
  /** v1.4: auto-cashout multiplier (nullable) */
  autoCashout?: number;
  /** v1.4: panel ID for multi-panel support */
  panelId?: string;
  /** Lobby integration fields (optional — only present in lobby mode) */
  lobbySessionId?: string;
  lobbyToken?: string;
}

