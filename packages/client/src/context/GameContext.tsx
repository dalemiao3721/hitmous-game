import { createContext, useReducer, useEffect, type ReactNode } from 'react';
import type { GameState, GameAction, HoleState } from '@hitmous/shared';
import { GRID_SIZE } from '@hitmous/shared';

function createInitialHoles(): HoleState[] {
  return Array.from({ length: GRID_SIZE }, (_, i) => ({
    index: i,
    status: 'hidden' as const,
  }));
}

/**
 * Read lobby token from URL query parameter (?token=xxx&sessionId=yyy).
 */
function getLobbyParams(): { lobbyToken: string | null; lobbySessionId: string | null } {
  const params = new URLSearchParams(window.location.search);
  return {
    lobbyToken: params.get('token'),
    lobbySessionId: params.get('sessionId'),
  };
}

const lobbyParams = getLobbyParams();
const isLobbyMode = !!(lobbyParams.lobbyToken && lobbyParams.lobbySessionId);

export const initialState: GameState = {
  phase: 'IDLE',
  sessionId: null,
  balance: isLobbyMode ? 0 : 1000,
  betAmount: 100,
  emptyHoleCount: 3,
  rtpSetting: 97,
  holes: createInitialHoles(),
  whackedCount: 0,
  currentMultiplier: 1,
  nextMultiplier: 0,
  payout: 0,
  serverSeedHash: null,
  serverSeed: null,
  layout: null,
  // Lobby integration
  lobbyMode: isLobbyMode,
  lobbyBalance: null,
  lobbyToken: lobbyParams.lobbyToken,
  lobbySessionId: lobbyParams.lobbySessionId,
};

function revealAllHoles(holes: HoleState[], layout: number[]): HoleState[] {
  return holes.map((hole) => {
    if (hole.status === 'whacked_mole' || hole.status === 'whacked_empty') {
      return hole;
    }
    return {
      ...hole,
      status: layout[hole.index] === 1 ? 'revealed_empty' : 'revealed_mole',
    } as HoleState;
  });
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_BALANCE':
      return { ...state, balance: action.balance };

    case 'SET_BET':
      return { ...state, betAmount: action.betAmount };

    case 'SET_EMPTY_HOLES':
      return { ...state, emptyHoleCount: action.count };

    case 'SET_RTP':
      return { ...state, rtpSetting: action.rtp };

    case 'SET_LOBBY_MODE':
      return {
        ...state,
        lobbyMode: true,
        lobbyToken: action.lobbyToken,
        lobbySessionId: action.lobbySessionId,
      };

    case 'SET_LOBBY_BALANCE':
      return {
        ...state,
        lobbyBalance: action.balance,
        balance: action.balance,
      };

    case 'GAME_STARTED':
      return {
        ...state,
        phase: 'PLAYING',
        balance: state.lobbyMode ? state.balance : state.balance - state.betAmount,
        sessionId: action.sessionId,
        serverSeedHash: action.serverSeedHash,
        holes: createInitialHoles(),
        whackedCount: 0,
        currentMultiplier: 1,
        nextMultiplier: action.nextMultiplier,
        payout: 0,
        serverSeed: null,
        layout: null,
      };

    case 'WHACK_RESULT_MOLE':
      return {
        ...state,
        holes: state.holes.map((h) =>
          h.index === action.holeIndex ? { ...h, status: 'whacked_mole' as const } : h,
        ),
        whackedCount: state.whackedCount + 1,
        currentMultiplier: action.newMultiplier,
        nextMultiplier: action.nextMultiplier,
      };

    case 'WHACK_RESULT_EMPTY':
      return {
        ...state,
        phase: 'GAME_OVER',
        holes: revealAllHoles(
          state.holes.map((h) =>
            h.index === action.holeIndex ? { ...h, status: 'whacked_empty' as const } : h,
          ),
          action.layout,
        ),
        serverSeed: action.serverSeed,
        layout: action.layout,
        payout: 0,
      };

    case 'FULL_CLEAR_SUCCESS':
      return {
        ...state,
        phase: 'CASHOUT',
        holes: revealAllHoles(
          state.holes.map((h) =>
            h.index === action.holeIndex ? { ...h, status: 'whacked_mole' as const } : h,
          ),
          action.layout,
        ),
        whackedCount: state.whackedCount + 1,
        currentMultiplier: action.currentMultiplier,
        balance: state.lobbyMode ? state.balance : state.balance + action.payout,
        payout: action.payout,
        serverSeed: action.serverSeed,
        layout: action.layout,
      };

    case 'CASHOUT_SUCCESS':
      return {
        ...state,
        phase: 'CASHOUT',
        balance: state.lobbyMode ? state.balance : state.balance + action.payout,
        holes: revealAllHoles(state.holes, action.layout),
        payout: action.payout,
        serverSeed: action.serverSeed,
        layout: action.layout,
      };

    case 'RESET':
      return {
        ...state,
        phase: 'IDLE',
        sessionId: null,
        whackedCount: 0,
        currentMultiplier: 1,
        nextMultiplier: 0,
        payout: 0,
        serverSeedHash: null,
        serverSeed: null,
        // holes and layout are preserved to show the previous game result
      };

    default:
      return state;
  }
}

export const GameContext = createContext<{
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}>({
  state: initialState,
  dispatch: () => undefined,
});

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  // Fetch balance from lobby if in lobby mode
  useEffect(() => {
    if (!state.lobbyMode || !state.lobbyToken) return;

    const fetchLobbyBalance = async () => {
      try {
        const res = await fetch('/api/game/balance', {
          headers: {
            'Authorization': `Bearer ${state.lobbyToken}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          dispatch({ type: 'SET_LOBBY_BALANCE', balance: data.balance });
        }
      } catch (err) {
        console.error('Failed to fetch lobby balance:', err);
      }
    };

    fetchLobbyBalance();
  }, [state.lobbyMode, state.lobbyToken]);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}
