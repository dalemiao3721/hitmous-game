import type { GameSession } from '@hitmous/shared';
import { SESSION_TTL_MS } from '@hitmous/shared';

export class SessionStore {
  private sessions: Map<string, GameSession> = new Map();

  create(session: GameSession): void {
    this.sessions.set(session.sessionId, session);
  }

  get(sessionId: string): GameSession | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;

    if (Date.now() - session.createdAt.getTime() > SESSION_TTL_MS) {
      this.sessions.delete(sessionId);
      return undefined;
    }

    return session;
  }

  update(sessionId: string, partial: Partial<GameSession>): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      Object.assign(session, partial);
    }
  }

  delete(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  cleanup(): void {
    const now = Date.now();
    for (const [id, session] of this.sessions) {
      if (now - session.createdAt.getTime() > SESSION_TTL_MS) {
        this.sessions.delete(id);
      }
    }
  }
}
