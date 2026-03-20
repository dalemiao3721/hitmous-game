import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SessionStore } from '../engine/SessionStore.js';
import type { GameSession } from '@hitmous/shared';
import { SESSION_TTL_MS } from '@hitmous/shared';

function makeSession(overrides: Partial<GameSession> = {}): GameSession {
  return {
    sessionId: 'sess_test123',
    playerId: 'player_1',
    betAmount: 50,
    emptyHoleCount: 3,
    rtpSetting: 97,
    layout: [0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0],
    serverSeed: 'abc123',
    serverSeedHash: 'hash123',
    whackedHoles: [],
    currentMultiplier: 1,
    status: 'active',
    createdAt: new Date(),
    volatilityLevel: 3,
    ...overrides,
  };
}

describe('SessionStore', () => {
  let store: SessionStore;

  beforeEach(() => {
    store = new SessionStore();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('create + get', () => {
    it('stores and retrieves a session', () => {
      const session = makeSession();
      store.create(session);
      const retrieved = store.get('sess_test123');
      expect(retrieved).toBeDefined();
      expect(retrieved!.sessionId).toBe('sess_test123');
      expect(retrieved!.playerId).toBe('player_1');
    });

    it('returns undefined for non-existent session', () => {
      expect(store.get('nonexistent')).toBeUndefined();
    });
  });

  describe('update', () => {
    it('modifies session properties', () => {
      const session = makeSession();
      store.create(session);
      store.update('sess_test123', { currentMultiplier: 2.5, whackedHoles: [0, 5] });
      const updated = store.get('sess_test123');
      expect(updated!.currentMultiplier).toBe(2.5);
      expect(updated!.whackedHoles).toEqual([0, 5]);
    });

    it('does nothing for non-existent session', () => {
      // Should not throw
      store.update('nonexistent', { currentMultiplier: 5 });
    });
  });

  describe('delete', () => {
    it('removes session so get returns undefined', () => {
      const session = makeSession();
      store.create(session);
      store.delete('sess_test123');
      expect(store.get('sess_test123')).toBeUndefined();
    });
  });

  describe('TTL expiry', () => {
    it('get returns undefined for expired session', () => {
      const session = makeSession();
      store.create(session);

      // Advance time beyond TTL
      vi.advanceTimersByTime(SESSION_TTL_MS + 1000);

      expect(store.get('sess_test123')).toBeUndefined();
    });

    it('get returns session before TTL expires', () => {
      const session = makeSession();
      store.create(session);

      vi.advanceTimersByTime(SESSION_TTL_MS - 1000);

      expect(store.get('sess_test123')).toBeDefined();
    });
  });

  describe('cleanup', () => {
    it('removes expired sessions', () => {
      const fresh = makeSession({ sessionId: 'sess_fresh' });
      const old = makeSession({
        sessionId: 'sess_old',
        createdAt: new Date(Date.now() - SESSION_TTL_MS - 1000),
      });

      store.create(fresh);
      store.create(old);
      store.cleanup();

      expect(store.get('sess_fresh')).toBeDefined();
      expect(store.get('sess_old')).toBeUndefined();
    });
  });
});
