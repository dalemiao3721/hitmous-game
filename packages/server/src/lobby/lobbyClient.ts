import { config } from '../config/index.js';

interface BalanceResponse {
  balance: number;
  currency: string;
}

interface SettleResponse {
  success: boolean;
  newBalance: number;
}

interface CloseSessionResponse {
  success: boolean;
}

class LobbyClient {
  private baseUrl: string;
  private gameSecret: string;

  constructor() {
    this.baseUrl = config.lobbyApiUrl;
    this.gameSecret = config.gameSecret;
  }

  /**
   * Get player balance from the lobby wallet.
   * Uses the player's game-session token for authentication.
   */
  async getBalance(lobbyToken: string): Promise<BalanceResponse> {
    const res = await fetch(`${this.baseUrl}/api/game/balance`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${lobbyToken}`,
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Lobby getBalance failed: ${err.error || res.statusText}`);
    }

    return res.json() as Promise<BalanceResponse>;
  }

  /**
   * Settle a game round with the lobby wallet.
   * Called when a game ends (cashout or hit empty).
   */
  async settle(sessionId: string, betAmount: number, payout: number): Promise<SettleResponse> {
    const res = await fetch(`${this.baseUrl}/api/game/settle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Game-Secret': this.gameSecret,
      },
      body: JSON.stringify({ sessionId, betAmount, payout }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Lobby settle failed: ${err.error || res.statusText}`);
    }

    return res.json() as Promise<SettleResponse>;
  }

  /**
   * Close a game session in the lobby.
   */
  async closeSession(sessionId: string): Promise<CloseSessionResponse> {
    const res = await fetch(`${this.baseUrl}/api/game/close-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Game-Secret': this.gameSecret,
      },
      body: JSON.stringify({ sessionId }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Lobby closeSession failed: ${err.error || res.statusText}`);
    }

    return res.json() as Promise<CloseSessionResponse>;
  }
}

export const lobbyClient = new LobbyClient();
