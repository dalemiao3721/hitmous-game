import { useCallback, useState } from 'react';
import * as api from '../services/api';
import { useGame } from './useGame';

export function useApi() {
  const {
    state,
    gameStarted,
    whackResultMole,
    whackResultEmpty,
    fullClearSuccess,
    cashoutSuccess,
    setLobbyBalance,
  } = useGame();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Refresh balance from lobby after settlement.
   */
  const refreshLobbyBalance = useCallback(async () => {
    if (!state.lobbyMode || !state.lobbyToken) return;
    try {
      const res = await fetch('/api/game/balance', {
        headers: {
          'Authorization': `Bearer ${state.lobbyToken}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setLobbyBalance(data.balance);
      }
    } catch (err) {
      console.error('Failed to refresh lobby balance:', err);
    }
  }, [state.lobbyMode, state.lobbyToken, setLobbyBalance]);

  const startGame = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.startGame({
        playerId: 'player_1',
        betAmount: state.betAmount,
        emptyHoleCount: state.emptyHoleCount,
        rtpSetting: state.rtpSetting,
        // Pass lobby params if in lobby mode
        ...(state.lobbyMode && state.lobbyToken && state.lobbySessionId && {
          lobbyToken: state.lobbyToken,
          lobbySessionId: state.lobbySessionId,
        }),
      });
      gameStarted(res.sessionId, res.serverSeedHash, res.nextMultiplier);
      // Refresh lobby balance after bet deduction
      await refreshLobbyBalance();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start game');
    } finally {
      setLoading(false);
    }
  }, [state.betAmount, state.emptyHoleCount, state.rtpSetting, state.lobbyMode, state.lobbyToken, state.lobbySessionId, gameStarted, refreshLobbyBalance]);

  const whack = useCallback(async (holeIndex: number) => {
    if (!state.sessionId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.whack({ sessionId: state.sessionId, holeIndex });
      if (res.result === 'mole') {
        whackResultMole(res.holeIndex, res.currentMultiplier, res.nextMultiplier);
      } else if (res.result === 'full_clear') {
        fullClearSuccess(res.holeIndex, res.payout, res.currentMultiplier, res.serverSeed, res.layout);
        await refreshLobbyBalance();
      } else {
        whackResultEmpty(res.holeIndex, res.serverSeed, res.layout);
        // Refresh lobby balance after loss
        await refreshLobbyBalance();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Whack failed');
    } finally {
      setLoading(false);
    }
  }, [state.sessionId, whackResultMole, whackResultEmpty, fullClearSuccess, refreshLobbyBalance]);

  const doCashout = useCallback(async () => {
    if (!state.sessionId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.cashout({ sessionId: state.sessionId });
      cashoutSuccess(res.payout, res.serverSeed, res.layout);
      // Refresh lobby balance after cashout
      await refreshLobbyBalance();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Cashout failed');
    } finally {
      setLoading(false);
    }
  }, [state.sessionId, cashoutSuccess, refreshLobbyBalance]);

  return { startGame, whack, cashout: doCashout, loading, error };
}
