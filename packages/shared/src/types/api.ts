// API request/response DTOs per system-design.md §5

export interface StartGameRequest {
  playerId: string;
  betAmount: number;
  emptyHoleCount: number;
  rtpSetting: number;
  /** Lobby integration (optional) */
  lobbyToken?: string;
  lobbySessionId?: string;
}

export interface StartGameResponse {
  sessionId: string;
  serverSeedHash: string;
  currentMultiplier: number;
  nextMultiplier: number;
  totalMoles: number;
  totalHoles: number;
}

export interface WhackRequest {
  sessionId: string;
  holeIndex: number;
}

export interface WhackResponseMole {
  result: 'mole';
  holeIndex: number;
  currentMultiplier: number;
  nextMultiplier: number;
  whackedCount: number;
  remainingMoles: number;
}

export interface WhackResponseFullClear {
  result: 'full_clear';
  holeIndex: number;
  currentMultiplier: number;
  whackedCount: number;
  payout: number;
  serverSeed: string;
  layout: number[];
}

export interface WhackResponseEmpty {
  result: 'empty';
  holeIndex: number;
  payout: number;
  serverSeed: string;
  layout: number[];
}

export type WhackResponse = WhackResponseMole | WhackResponseFullClear | WhackResponseEmpty;

export interface CashoutRequest {
  sessionId: string;
}

export interface CashoutResponse {
  payout: number;
  currentMultiplier: number;
  serverSeed: string;
  layout: number[];
}

export interface VerifyResponse {
  isValid: boolean;
  computedHash: string;
  computedLayout: number[];
}

export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}
