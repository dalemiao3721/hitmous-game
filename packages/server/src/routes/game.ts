import { Router } from 'express';
import { GameEngine } from '../engine/GameEngine.js';
import {
  validateStartGame,
  validateWhack,
  validateCashout,
  validateVerify,
} from '../middleware/validation.js';

const router = Router();
const engine = new GameEngine();
engine.startCleanup();

// POST /game/start
router.post('/start', validateStartGame, async (req, res, next) => {
  try {
    const result = await engine.startGame(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /game/whack
router.post('/whack', validateWhack, async (req, res, next) => {
  try {
    const result = await engine.whack(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /game/cashout
router.post('/cashout', validateCashout, async (req, res, next) => {
  try {
    const result = await engine.cashout(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /game/verify
router.get('/verify', validateVerify, (req, res, next) => {
  try {
    const result = engine.verifyFairness({
      serverSeed: req.query.serverSeed as string,
      emptyHoleCount: parseInt(req.query.emptyHoleCount as string, 10),
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
