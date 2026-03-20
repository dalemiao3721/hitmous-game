import type {
  StartGameRequest,
  StartGameResponse,
  WhackRequest,
  WhackResponse,
  CashoutRequest,
  CashoutResponse,
  VerifyResponse,
  ApiError,
} from '@hitmous/shared';

const BASE_URL = '/hitmous-api/game';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    const body = (await res.json()) as ApiError;
    throw new Error(body.error?.message ?? `Request failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export function startGame(params: StartGameRequest): Promise<StartGameResponse> {
  return request<StartGameResponse>('/start', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export function whack(params: WhackRequest): Promise<WhackResponse> {
  return request<WhackResponse>('/whack', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export function cashout(params: CashoutRequest): Promise<CashoutResponse> {
  return request<CashoutResponse>('/cashout', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export function verify(
  serverSeed: string,
  emptyHoleCount: number,
): Promise<VerifyResponse> {
  const qs = new URLSearchParams({
    serverSeed,
    emptyHoleCount: String(emptyHoleCount),
  });
  return request<VerifyResponse>(`/verify?${qs}`);
}
