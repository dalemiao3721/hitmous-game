import { v4 as uuidv4 } from 'uuid';
import {
  GRID_SIZE,
  calculateMultiplier,
  type GameSession,
  type StartGameRequest,
  type StartGameResponse,
  type WhackResponse,
  type CashoutResponse,
  type VerifyResponse,
} from '@hitmous/shared';
import { ProvablyFair } from './ProvablyFair.js';
import { SessionStore } from './SessionStore.js';
import { lobbyClient } from '../lobby/lobbyClient.js';

export class GameEngine {
  private sessionStore: SessionStore;
  private provablyFair: ProvablyFair;
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.sessionStore = new SessionStore();
    this.provablyFair = new ProvablyFair();
  }

  startCleanup(): void {
    this.cleanupInterval = setInterval(() => this.sessionStore.cleanup(), 5 * 60 * 1000);
  }

  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  async startGame(params: StartGameRequest): Promise<StartGameResponse> {
    const isLobbyMode = !!(params.lobbyToken && params.lobbySessionId);

    // --- LOBBY INTEGRATION: Verify balance & deduct bet at start ---
    if (isLobbyMode) {
      try {
        const balanceData = await lobbyClient.getBalance(params.lobbyToken!);
        if (balanceData.balance < params.betAmount) {
          throw new GameError('INSUFFICIENT_BALANCE', 'Insufficient lobby balance.', 400);
        }
        // Deduct bet immediately (betAmount deducted, payout=0)
        await lobbyClient.settle(params.lobbySessionId!, params.betAmount, 0);
      } catch (err) {
        if (err instanceof GameError) throw err;
        throw new GameError('LOBBY_UNREACHABLE', 'Lobby service unreachable.', 500);
      }
    }

    const sessionId = `sess_${uuidv4().replace(/-/g, '').substring(0, 12)}`;
    const serverSeed = this.provablyFair.generateServerSeed();
    const serverSeedHash = this.provablyFair.hashSeed(serverSeed);
    const layout = this.provablyFair.generateLayout(serverSeed, params.emptyHoleCount);

    const session: GameSession = {
      sessionId,
      playerId: params.playerId,
      betAmount: params.betAmount,
      emptyHoleCount: params.emptyHoleCount,
      rtpSetting: params.rtpSetting,
      layout,
      serverSeed,
      serverSeedHash,
      whackedHoles: [],
      currentMultiplier: 1,
      status: 'active',
      createdAt: new Date(),
      volatilityLevel: 3,
      // Store lobby info for settlement later
      ...(isLobbyMode && {
        lobbySessionId: params.lobbySessionId,
        lobbyToken: params.lobbyToken,
      }),
    };

    this.sessionStore.create(session);

    const nextMultiplier = calculateMultiplier(
      params.emptyHoleCount,
      1,
      params.rtpSetting,
    );

    return {
      sessionId,
      serverSeedHash,
      currentMultiplier: 1,
      nextMultiplier,
      totalMoles: GRID_SIZE - params.emptyHoleCount,
      totalHoles: GRID_SIZE,
    };
  }

  /**
   * Settle with lobby wallet. Fails silently to avoid blocking the game.
   */
  /** Add payout to lobby (bet already deducted at start). */
  private async addPayoutToLobby(session: GameSession, payout: number): Promise<void> {
    if (!session.lobbySessionId || payout <= 0) return;
    try {
      await lobbyClient.settle(session.lobbySessionId, 0, payout);
    } catch (err) {
      console.error('Lobby payout failed:', err);
    }
  }

  async whack(params: { sessionId: string; holeIndex: number }): Promise<WhackResponse> {
    const session = this.sessionStore.get(params.sessionId);

    if (!session) {
      throw new GameError('SESSION_NOT_FOUND', 'Session not found.', 404);
    }

    if (session.status !== 'active') {
      throw new GameError('SESSION_ALREADY_SETTLED', 'Session has already been settled.', 409);
    }

    if (params.holeIndex < 0 || params.holeIndex >= GRID_SIZE) {
      throw new GameError('INVALID_HOLE_INDEX', 'Hole index must be between 0 and 15.', 400);
    }

    if (session.whackedHoles.includes(params.holeIndex)) {
      throw new GameError('DUPLICATE_WHACK', 'This hole has already been whacked.', 409);
    }

    const isEmpty = session.layout[params.holeIndex] === 1;

    if (isEmpty) {
      this.sessionStore.update(params.sessionId, { status: 'settled' });

      // Bet already deducted at start — no settle needed on loss

      return {
        result: 'empty',
        holeIndex: params.holeIndex,
        payout: 0,
        serverSeed: session.serverSeed,
        layout: session.layout,
      };
    }

    // Hit a mole
    const newWhackedHoles = [...session.whackedHoles, params.holeIndex];
    const whackedCount = newWhackedHoles.length;
    const currentMultiplier = calculateMultiplier(
      session.emptyHoleCount,
      whackedCount,
      session.rtpSetting,
    );

    const totalMoles = GRID_SIZE - session.emptyHoleCount;
    const remainingMoles = totalMoles - whackedCount;

    // Full Clear: all moles whacked — auto-settle with max payout
    if (remainingMoles === 0) {
      const payout = Math.floor(session.betAmount * currentMultiplier * 100) / 100;
      this.sessionStore.update(params.sessionId, {
        whackedHoles: newWhackedHoles,
        currentMultiplier,
        status: 'settled',
      });

      // --- LOBBY INTEGRATION: Add payout only (bet already deducted at start) ---
      await this.addPayoutToLobby(session, payout);

      return {
        result: 'full_clear',
        holeIndex: params.holeIndex,
        currentMultiplier,
        whackedCount,
        payout,
        serverSeed: session.serverSeed,
        layout: session.layout,
      };
    }

    // Normal mole hit — continue playing
    const nextMultiplier = calculateMultiplier(
      session.emptyHoleCount,
      whackedCount + 1,
      session.rtpSetting,
    );
    this.sessionStore.update(params.sessionId, {
      whackedHoles: newWhackedHoles,
      currentMultiplier,
    });

    return {
      result: 'mole',
      holeIndex: params.holeIndex,
      currentMultiplier,
      nextMultiplier,
      whackedCount,
      remainingMoles,
    };
  }

  async cashout(params: { sessionId: string }): Promise<CashoutResponse> {
    const session = this.sessionStore.get(params.sessionId);

    if (!session) {
      throw new GameError('SESSION_NOT_FOUND', 'Session not found.', 404);
    }

    if (session.status !== 'active') {
      throw new GameError('SESSION_ALREADY_SETTLED', 'Session has already been settled.', 409);
    }

    if (session.whackedHoles.length === 0) {
      throw new GameError('INVALID_PARAMS', 'Cannot cashout before whacking any holes.', 400);
    }

    const payout = Math.floor(session.betAmount * session.currentMultiplier * 100) / 100;

    this.sessionStore.update(params.sessionId, { status: 'settled' });

    // --- LOBBY INTEGRATION: Add payout only (bet already deducted at start) ---
    await this.addPayoutToLobby(session, payout);

    return {
      payout,
      currentMultiplier: session.currentMultiplier,
      serverSeed: session.serverSeed,
      layout: session.layout,
    };
  }

  verifyFairness(params: {
    serverSeed: string;
    emptyHoleCount: number;
  }): VerifyResponse {
    const computedHash = this.provablyFair.hashSeed(params.serverSeed);
    const computedLayout = this.provablyFair.generateLayout(
      params.serverSeed,
      params.emptyHoleCount,
    );

    return {
      isValid: true,
      computedHash,
      computedLayout,
    };
  }

  getSession(sessionId: string): GameSession | undefined {
    return this.sessionStore.get(sessionId);
  }
}

export class GameError extends Error {
  constructor(
    public code: string,
    message: string,
    public httpStatus: number,
  ) {
    super(message);
    this.name = 'GameError';
  }
}
