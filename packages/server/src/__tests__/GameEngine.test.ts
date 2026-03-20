import { describe, it, expect, beforeEach } from 'vitest';
import { GameEngine, GameError } from '../engine/GameEngine.js';
import { GRID_SIZE, calculateMultiplier } from '@hitmous/shared';

describe('GameEngine', () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine();
  });

  describe('startGame', () => {
    it('returns sessionId, serverSeedHash, and multiplier=1.00', async () => {
      const result = await engine.startGame({
        playerId: 'player_1',
        betAmount: 50,
        emptyHoleCount: 3,
        rtpSetting: 97,
      });

      expect(result.sessionId).toMatch(/^sess_/);
      expect(result.serverSeedHash).toMatch(/^[0-9a-f]{64}$/);
      expect(result.currentMultiplier).toBe(1);
      expect(result.nextMultiplier).toBe(calculateMultiplier(3, 1, 97));
      expect(result.totalMoles).toBe(GRID_SIZE - 3);
      expect(result.totalHoles).toBe(GRID_SIZE);
    });
  });

  describe('whack (hit mole)', () => {
    it('returns result="mole" and multiplier increases', async () => {
      const start = await engine.startGame({
        playerId: 'player_1',
        betAmount: 50,
        emptyHoleCount: 3,
        rtpSetting: 97,
      });

      // Find a mole hole from the session layout
      const session = engine.getSession(start.sessionId)!;
      const moleIndex = session.layout.findIndex(v => v === 0);

      const result = await engine.whack({
        sessionId: start.sessionId,
        holeIndex: moleIndex,
      });

      expect(result.result).toBe('mole');
      if (result.result === 'mole') {
        expect(result.currentMultiplier).toBeGreaterThan(1);
        expect(result.whackedCount).toBe(1);
        expect(result.remainingMoles).toBe(GRID_SIZE - 3 - 1);
      }
    });
  });

  describe('whack (hit empty)', () => {
    it('returns result="empty", payout=0, and reveals layout+seed', async () => {
      const start = await engine.startGame({
        playerId: 'player_1',
        betAmount: 50,
        emptyHoleCount: 3,
        rtpSetting: 97,
      });

      const session = engine.getSession(start.sessionId)!;
      const emptyIndex = session.layout.findIndex(v => v === 1);

      const result = await engine.whack({
        sessionId: start.sessionId,
        holeIndex: emptyIndex,
      });

      expect(result.result).toBe('empty');
      if (result.result === 'empty') {
        expect(result.payout).toBe(0);
        expect(result.serverSeed).toBeDefined();
        expect(result.layout).toHaveLength(GRID_SIZE);
      }
    });
  });

  describe('cashout', () => {
    it('returns correct payout = betAmount * currentMultiplier', async () => {
      const betAmount = 100;
      const start = await engine.startGame({
        playerId: 'player_1',
        betAmount,
        emptyHoleCount: 3,
        rtpSetting: 97,
      });

      const session = engine.getSession(start.sessionId)!;
      const moleIndex = session.layout.findIndex(v => v === 0);

      await engine.whack({ sessionId: start.sessionId, holeIndex: moleIndex });

      const result = await engine.cashout({ sessionId: start.sessionId });

      const expectedMultiplier = calculateMultiplier(3, 1, 97);
      const expectedPayout = Math.floor(betAmount * expectedMultiplier * 100) / 100;
      expect(result.payout).toBe(expectedPayout);
      expect(result.currentMultiplier).toBe(expectedMultiplier);
      expect(result.serverSeed).toBeDefined();
      expect(result.layout).toHaveLength(GRID_SIZE);
    });

    it('throws error when trying to cashout before any whack', async () => {
      const start = await engine.startGame({
        playerId: 'player_1',
        betAmount: 50,
        emptyHoleCount: 3,
        rtpSetting: 97,
      });

      await expect(engine.cashout({ sessionId: start.sessionId }))
        .rejects.toThrow(GameError);
    });
  });

  describe('error cases', () => {
    it('DUPLICATE_WHACK: whacking the same hole twice throws error', async () => {
      const start = await engine.startGame({
        playerId: 'player_1',
        betAmount: 50,
        emptyHoleCount: 3,
        rtpSetting: 97,
      });

      const session = engine.getSession(start.sessionId)!;
      const moleIndex = session.layout.findIndex(v => v === 0);

      await engine.whack({ sessionId: start.sessionId, holeIndex: moleIndex });

      try {
        await engine.whack({ sessionId: start.sessionId, holeIndex: moleIndex });
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(GameError);
        expect((err as GameError).code).toBe('DUPLICATE_WHACK');
      }
    });

    it('SESSION_ALREADY_SETTLED: whack on settled session throws error', async () => {
      const start = await engine.startGame({
        playerId: 'player_1',
        betAmount: 50,
        emptyHoleCount: 3,
        rtpSetting: 97,
      });

      const session = engine.getSession(start.sessionId)!;
      const emptyIndex = session.layout.findIndex(v => v === 1);

      // Hit empty to settle the session
      await engine.whack({ sessionId: start.sessionId, holeIndex: emptyIndex });

      // Now try to whack again on the settled session
      const moleIndex = session.layout.findIndex(v => v === 0);
      try {
        await engine.whack({ sessionId: start.sessionId, holeIndex: moleIndex });
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(GameError);
        expect((err as GameError).code).toBe('SESSION_ALREADY_SETTLED');
      }
    });

    it('INVALID_HOLE_INDEX: holeIndex 16 throws error', async () => {
      const start = await engine.startGame({
        playerId: 'player_1',
        betAmount: 50,
        emptyHoleCount: 3,
        rtpSetting: 97,
      });

      try {
        await engine.whack({ sessionId: start.sessionId, holeIndex: 16 });
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(GameError);
        expect((err as GameError).code).toBe('INVALID_HOLE_INDEX');
      }
    });

    it('INVALID_HOLE_INDEX: holeIndex -1 throws error', async () => {
      const start = await engine.startGame({
        playerId: 'player_1',
        betAmount: 50,
        emptyHoleCount: 3,
        rtpSetting: 97,
      });

      try {
        await engine.whack({ sessionId: start.sessionId, holeIndex: -1 });
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(GameError);
        expect((err as GameError).code).toBe('INVALID_HOLE_INDEX');
      }
    });

    it('SESSION_NOT_FOUND: whack with invalid sessionId', async () => {
      try {
        await engine.whack({ sessionId: 'nonexistent', holeIndex: 0 });
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(GameError);
        expect((err as GameError).code).toBe('SESSION_NOT_FOUND');
      }
    });

    it('SESSION_NOT_FOUND: cashout with invalid sessionId', async () => {
      try {
        await engine.cashout({ sessionId: 'nonexistent' });
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(GameError);
        expect((err as GameError).code).toBe('SESSION_NOT_FOUND');
      }
    });
  });

  describe('full clear scenario', () => {
    it('whacking all moles settles the session automatically', async () => {
      const emptyHoleCount = 14; // Only 2 moles
      const start = await engine.startGame({
        playerId: 'player_1',
        betAmount: 50,
        emptyHoleCount,
        rtpSetting: 97,
      });

      const session = engine.getSession(start.sessionId)!;
      const moleIndices = session.layout
        .map((v, i) => (v === 0 ? i : -1))
        .filter(i => i !== -1);

      expect(moleIndices).toHaveLength(GRID_SIZE - emptyHoleCount);

      let lastResult;
      for (const idx of moleIndices) {
        lastResult = await engine.whack({ sessionId: start.sessionId, holeIndex: idx });
      }

      expect(lastResult!.result).toBe('full_clear');
      if (lastResult!.result === 'full_clear') {
        expect(lastResult!.payout).toBeGreaterThan(0);
        expect(lastResult!.serverSeed).toBeDefined();
        expect(lastResult!.layout).toHaveLength(GRID_SIZE);
      }

      // Session should now be settled, further whack should fail
      const remainingEmptyIndex = session.layout.findIndex(v => v === 1);
      try {
        await engine.whack({ sessionId: start.sessionId, holeIndex: remainingEmptyIndex });
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(GameError);
        expect((err as GameError).code).toBe('SESSION_ALREADY_SETTLED');
      }
    });
  });

  describe('verifyFairness', () => {
    it('returns computed hash and layout for a given seed', async () => {
      const start = await engine.startGame({
        playerId: 'player_1',
        betAmount: 50,
        emptyHoleCount: 3,
        rtpSetting: 97,
      });

      // Settle the game first (hit an empty)
      const session = engine.getSession(start.sessionId)!;
      const emptyIndex = session.layout.findIndex(v => v === 1);
      const whackResult = await engine.whack({ sessionId: start.sessionId, holeIndex: emptyIndex });

      if (whackResult.result === 'empty') {
        const verify = engine.verifyFairness({
          serverSeed: whackResult.serverSeed,
          emptyHoleCount: 3,
        });

        expect(verify.isValid).toBe(true);
        expect(verify.computedHash).toBe(start.serverSeedHash);
        expect(verify.computedLayout).toEqual(whackResult.layout);
      }
    });
  });
});
