export const GRID_SIZE = 16;

export const RTP_OPTIONS = [94, 96, 97, 98, 99] as const;

export type RTPOption = (typeof RTP_OPTIONS)[number];

export const MIN_EMPTY_HOLES = 1;
export const MAX_EMPTY_HOLES = 15;

export const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes
