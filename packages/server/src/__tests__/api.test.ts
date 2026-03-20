import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app.js';

describe('API Integration Tests', () => {
  const validStartBody = {
    playerId: 'test_player',
    betAmount: 100,
    emptyHoleCount: 3,
    rtpSetting: 97,
  };

  describe('Full win flow: start -> whack(mole) x3 -> cashout', () => {
    it('completes a winning game with correct payout', async () => {
      const startRes = await request(app)
        .post('/game/start')
        .send(validStartBody)
        .expect(200);

      expect(startRes.body.sessionId).toBeDefined();
      expect(startRes.body.serverSeedHash).toBeDefined();
      expect(startRes.body.currentMultiplier).toBe(1);
      expect(startRes.body.totalMoles).toBe(13);
      expect(startRes.body.totalHoles).toBe(16);

      const { sessionId } = startRes.body;

      let moleHits = 0;
      let lastMultiplier = 1;

      for (let holeIndex = 0; holeIndex < 16 && moleHits < 3; holeIndex++) {
        const whackRes = await request(app)
          .post('/game/whack')
          .send({ sessionId, holeIndex });

        if (whackRes.status !== 200) break;

        if (whackRes.body.result === 'empty') {
          // Game over — can't continue this flow
          return;
        }

        moleHits++;
        lastMultiplier = whackRes.body.currentMultiplier;
        expect(whackRes.body.result).toBe('mole');
        expect(whackRes.body.whackedCount).toBe(moleHits);
        expect(whackRes.body.currentMultiplier).toBeGreaterThan(1);
      }

      if (moleHits >= 1) {
        const cashoutRes = await request(app)
          .post('/game/cashout')
          .send({ sessionId })
          .expect(200);

        expect(cashoutRes.body.payout).toBeGreaterThan(0);
        expect(cashoutRes.body.currentMultiplier).toBe(lastMultiplier);
        expect(cashoutRes.body.serverSeed).toBeDefined();
        expect(cashoutRes.body.layout).toHaveLength(16);

        const verifyRes = await request(app)
          .get('/game/verify')
          .query({
            serverSeed: cashoutRes.body.serverSeed,
            emptyHoleCount: '3',
          })
          .expect(200);

        expect(verifyRes.body.isValid).toBe(true);
        expect(verifyRes.body.computedHash).toBe(startRes.body.serverSeedHash);
        expect(verifyRes.body.computedLayout).toEqual(cashoutRes.body.layout);
      }
    });
  });

  describe('Full lose flow: start -> whack(empty) -> game over', () => {
    it('ends the game with payout=0 when hitting an empty hole', async () => {
      const startRes = await request(app)
        .post('/game/start')
        .send({ ...validStartBody, emptyHoleCount: 14 })
        .expect(200);

      const { sessionId } = startRes.body;

      let hitEmpty = false;
      for (let holeIndex = 0; holeIndex < 16; holeIndex++) {
        const whackRes = await request(app)
          .post('/game/whack')
          .send({ sessionId, holeIndex });

        // Session may auto-settle on full clear — stop looping
        if (whackRes.status !== 200) break;

        if (whackRes.body.result === 'empty') {
          hitEmpty = true;
          expect(whackRes.body.payout).toBe(0);
          expect(whackRes.body.serverSeed).toBeDefined();
          expect(whackRes.body.layout).toHaveLength(16);
          break;
        }
      }

      // With 14 empties out of 16 holes, extremely likely to hit empty
      expect(hitEmpty).toBe(true);
    });
  });

  describe('Validation: missing fields -> 400', () => {
    it('POST /game/start with missing playerId returns 400', async () => {
      const res = await request(app)
        .post('/game/start')
        .send({ betAmount: 50, emptyHoleCount: 3, rtpSetting: 97 })
        .expect(400);

      expect(res.body.error.code).toBe('INVALID_PARAMS');
    });

    it('POST /game/start with invalid betAmount returns 400', async () => {
      const res = await request(app)
        .post('/game/start')
        .send({ playerId: 'p1', betAmount: -10, emptyHoleCount: 3, rtpSetting: 97 })
        .expect(400);

      expect(res.body.error.code).toBe('INVALID_PARAMS');
    });

    it('POST /game/start with invalid emptyHoleCount returns 400', async () => {
      const res = await request(app)
        .post('/game/start')
        .send({ playerId: 'p1', betAmount: 50, emptyHoleCount: 0, rtpSetting: 97 })
        .expect(400);

      expect(res.body.error.code).toBe('INVALID_PARAMS');
    });

    it('POST /game/start with invalid rtpSetting returns 400', async () => {
      const res = await request(app)
        .post('/game/start')
        .send({ playerId: 'p1', betAmount: 50, emptyHoleCount: 3, rtpSetting: 95 })
        .expect(400);

      expect(res.body.error.code).toBe('INVALID_PARAMS');
    });

    it('POST /game/whack with missing sessionId returns 400', async () => {
      const res = await request(app)
        .post('/game/whack')
        .send({ holeIndex: 5 })
        .expect(400);

      expect(res.body.error.code).toBe('INVALID_PARAMS');
    });

    it('POST /game/whack with invalid holeIndex returns 400', async () => {
      const res = await request(app)
        .post('/game/whack')
        .send({ sessionId: 'some_id', holeIndex: 20 })
        .expect(400);

      expect(res.body.error.code).toBe('INVALID_PARAMS');
    });

    it('POST /game/cashout with missing sessionId returns 400', async () => {
      const res = await request(app)
        .post('/game/cashout')
        .send({})
        .expect(400);

      expect(res.body.error.code).toBe('INVALID_PARAMS');
    });

    it('GET /game/verify with missing serverSeed returns 400', async () => {
      const res = await request(app)
        .get('/game/verify')
        .query({ emptyHoleCount: '3' })
        .expect(400);

      expect(res.body.error.code).toBe('INVALID_PARAMS');
    });
  });

  describe('Bad sessionId -> 404', () => {
    it('POST /game/whack with non-existent sessionId returns 404', async () => {
      const res = await request(app)
        .post('/game/whack')
        .send({ sessionId: 'nonexistent_session', holeIndex: 0 })
        .expect(404);

      expect(res.body.error.code).toBe('SESSION_NOT_FOUND');
    });

    it('POST /game/cashout with non-existent sessionId returns 404', async () => {
      const res = await request(app)
        .post('/game/cashout')
        .send({ sessionId: 'nonexistent_session' })
        .expect(404);

      expect(res.body.error.code).toBe('SESSION_NOT_FOUND');
    });
  });

  describe('Provably Fair verification via API', () => {
    it('verify endpoint confirms hash matches for a completed game', async () => {
      const startRes = await request(app)
        .post('/game/start')
        .send({ ...validStartBody, emptyHoleCount: 14 })
        .expect(200);

      const { sessionId, serverSeedHash } = startRes.body;

      let serverSeed = '';
      let layout: number[] = [];
      for (let i = 0; i < 16; i++) {
        const res = await request(app)
          .post('/game/whack')
          .send({ sessionId, holeIndex: i });

        if (res.status !== 200) break;

        if (res.body.result === 'empty') {
          serverSeed = res.body.serverSeed;
          layout = res.body.layout;
          break;
        }

        // If mole hit and it was the last mole (full clear), cashout to get seed
        if (res.body.result === 'mole' && res.body.remainingMoles === 0) {
          const cashRes = await request(app)
            .post('/game/cashout')
            .send({ sessionId });
          if (cashRes.status === 200) {
            serverSeed = cashRes.body.serverSeed;
            layout = cashRes.body.layout;
          }
          break;
        }
      }

      // If we got the seed (either by hitting empty or full clear + cashout)
      if (serverSeed) {
        const verifyRes = await request(app)
          .get('/game/verify')
          .query({ serverSeed, emptyHoleCount: '14' })
          .expect(200);

        expect(verifyRes.body.isValid).toBe(true);
        expect(verifyRes.body.computedHash).toBe(serverSeedHash);
        expect(verifyRes.body.computedLayout).toEqual(layout);
      }
    });
  });

  describe('Error scenarios via API', () => {
    it('duplicate whack returns 409', async () => {
      const startRes = await request(app)
        .post('/game/start')
        .send({ ...validStartBody, emptyHoleCount: 1 }) // 15 moles, 1 empty
        .expect(200);

      const { sessionId } = startRes.body;

      const firstRes = await request(app)
        .post('/game/whack')
        .send({ sessionId, holeIndex: 0 });

      if (firstRes.status === 200 && firstRes.body.result === 'mole') {
        const dupRes = await request(app)
          .post('/game/whack')
          .send({ sessionId, holeIndex: 0 })
          .expect(409);

        expect(dupRes.body.error.code).toBe('DUPLICATE_WHACK');
      }
    });

    it('whack on settled session returns 409', async () => {
      const startRes = await request(app)
        .post('/game/start')
        .send({ ...validStartBody, emptyHoleCount: 14 })
        .expect(200);

      const { sessionId } = startRes.body;

      // Whack until session is settled (either hit empty or full clear)
      let settled = false;
      let lastUsedIndex = -1;
      for (let i = 0; i < 16; i++) {
        const res = await request(app)
          .post('/game/whack')
          .send({ sessionId, holeIndex: i });

        if (res.status !== 200) break;
        lastUsedIndex = i;

        if (res.body.result === 'empty') {
          settled = true;
          break;
        }

        // Full clear also settles
        if (res.body.result === 'mole' && res.body.remainingMoles === 0) {
          settled = true;
          break;
        }
      }

      if (settled) {
        // Find a hole index not yet used
        const nextIndex = lastUsedIndex + 1 < 16 ? lastUsedIndex + 1 : 0;
        const res = await request(app)
          .post('/game/whack')
          .send({ sessionId, holeIndex: nextIndex })
          .expect(409);

        expect(res.body.error.code).toBe('SESSION_ALREADY_SETTLED');
      }
    });
  });
});
