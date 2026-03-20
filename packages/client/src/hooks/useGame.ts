import { useContext } from 'react';
import { GameContext } from '../context/GameContext';

export function useGame() {
  const { state, dispatch } = useContext(GameContext);

  return {
    state,
    setBet: (betAmount: number) => dispatch({ type: 'SET_BET', betAmount }),
    setEmptyHoles: (count: number) => dispatch({ type: 'SET_EMPTY_HOLES', count }),
    setRtp: (rtp: 94 | 96 | 97 | 98 | 99) => dispatch({ type: 'SET_RTP', rtp }),
    gameStarted: (sessionId: string, serverSeedHash: string, nextMultiplier: number) =>
      dispatch({ type: 'GAME_STARTED', sessionId, serverSeedHash, nextMultiplier }),
    whackResultMole: (holeIndex: number, newMultiplier: number, nextMultiplier: number) =>
      dispatch({ type: 'WHACK_RESULT_MOLE', holeIndex, newMultiplier, nextMultiplier }),
    whackResultEmpty: (holeIndex: number, serverSeed: string, layout: number[]) =>
      dispatch({ type: 'WHACK_RESULT_EMPTY', holeIndex, serverSeed, layout }),
    fullClearSuccess: (holeIndex: number, payout: number, currentMultiplier: number, serverSeed: string, layout: number[]) =>
      dispatch({ type: 'FULL_CLEAR_SUCCESS', holeIndex, payout, currentMultiplier, serverSeed, layout }),
    cashoutSuccess: (payout: number, serverSeed: string, layout: number[]) =>
      dispatch({ type: 'CASHOUT_SUCCESS', payout, serverSeed, layout }),
    setLobbyBalance: (balance: number) => dispatch({ type: 'SET_LOBBY_BALANCE', balance }),
    reset: () => dispatch({ type: 'RESET' }),
  };
}
