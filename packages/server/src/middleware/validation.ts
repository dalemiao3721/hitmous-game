import type { Request, Response, NextFunction } from 'express';
import { RTP_OPTIONS, MIN_EMPTY_HOLES, MAX_EMPTY_HOLES, GRID_SIZE } from '@hitmous/shared';

function validationError(res: Response, message: string): void {
  res.status(400).json({
    error: { code: 'INVALID_PARAMS', message },
  });
}

export function validateStartGame(req: Request, res: Response, next: NextFunction): void {
  const { playerId, betAmount, emptyHoleCount, rtpSetting } = req.body;

  if (!playerId || typeof playerId !== 'string' || playerId.length === 0) {
    return validationError(res, 'playerId is required and must be a non-empty string.');
  }
  if (typeof betAmount !== 'number' || betAmount <= 0) {
    return validationError(res, 'betAmount must be a positive number.');
  }
  if (!Number.isInteger(emptyHoleCount) || emptyHoleCount < MIN_EMPTY_HOLES || emptyHoleCount > MAX_EMPTY_HOLES) {
    return validationError(res, `emptyHoleCount must be an integer between ${MIN_EMPTY_HOLES} and ${MAX_EMPTY_HOLES}.`);
  }
  if (!RTP_OPTIONS.includes(rtpSetting)) {
    return validationError(res, `rtpSetting must be one of: ${RTP_OPTIONS.join(', ')}.`);
  }

  next();
}

export function validateWhack(req: Request, res: Response, next: NextFunction): void {
  const { sessionId, holeIndex } = req.body;

  if (!sessionId || typeof sessionId !== 'string') {
    return validationError(res, 'sessionId is required.');
  }
  if (!Number.isInteger(holeIndex) || holeIndex < 0 || holeIndex >= GRID_SIZE) {
    return validationError(res, `holeIndex must be an integer between 0 and ${GRID_SIZE - 1}.`);
  }

  next();
}

export function validateCashout(req: Request, res: Response, next: NextFunction): void {
  const { sessionId } = req.body;

  if (!sessionId || typeof sessionId !== 'string') {
    return validationError(res, 'sessionId is required.');
  }

  next();
}

export function validateVerify(req: Request, res: Response, next: NextFunction): void {
  const { serverSeed, emptyHoleCount } = req.query;

  if (!serverSeed || typeof serverSeed !== 'string') {
    return validationError(res, 'serverSeed query parameter is required.');
  }
  const holes = parseInt(emptyHoleCount as string, 10);
  if (!Number.isInteger(holes) || holes < MIN_EMPTY_HOLES || holes > MAX_EMPTY_HOLES) {
    return validationError(res, `emptyHoleCount must be an integer between ${MIN_EMPTY_HOLES} and ${MAX_EMPTY_HOLES}.`);
  }

  next();
}
