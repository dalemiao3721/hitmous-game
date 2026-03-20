import { useGame } from '../../hooks/useGame';
import { GRID_SIZE, calculateMultiplier } from '@hitmous/shared';
import './ControlPanel.css';

interface ControlPanelProps {
  balance: number;
  loading: boolean;
  onStart: () => void;
  onCashout: () => void;
  onReset: () => void;
}

export function ControlPanel({ balance, loading, onStart, onCashout, onReset }: ControlPanelProps) {
  const { state, setBet, setEmptyHoles, setRtp } = useGame();
  const { phase, betAmount, emptyHoleCount, rtpSetting, whackedCount, currentMultiplier, payout } = state;

  const maxMoles = GRID_SIZE - emptyHoleCount;
  const potentialWin = currentMultiplier * betAmount;

  const handleBetChange = (delta: number) => {
    const next = Math.max(1, betAmount + delta);
    setBet(next);
  };

  return (
    <div className="control-panel">
      {/* Balance */}
      <div className="control-panel__section">
        <span className="control-panel__label">Account Balance</span>
        <div className="control-panel__balance">
          <span>$</span>{balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </div>
      </div>

      {/* Bet Amount */}
      <div className="control-panel__section">
        <span className="control-panel__label">Bet Amount</span>
        <div className="control-panel__bet-row">
          <button
            className="control-panel__bet-btn"
            onClick={() => handleBetChange(-10)}
            disabled={phase !== 'IDLE'}
          >
            -
          </button>
          <div className="control-panel__bet-input-wrap">
            <span className="control-panel__bet-prefix">$</span>
            <input
              className="control-panel__bet-input"
              type="number"
              min={1}
              value={betAmount}
              onChange={(e) => setBet(Math.max(1, Number(e.target.value) || 1))}
              disabled={phase !== 'IDLE'}
            />
          </div>
          <button
            className="control-panel__bet-btn"
            onClick={() => handleBetChange(10)}
            disabled={phase !== 'IDLE'}
          >
            +
          </button>
        </div>
      </div>

      {/* Empty Holes */}
      <div className="control-panel__section">
        <span className="control-panel__label">Empty Holes</span>
        <div className="control-panel__empty-row">
          <select
            className="control-panel__empty-select"
            value={emptyHoleCount}
            onChange={(e) => setEmptyHoles(Number(e.target.value))}
            disabled={phase !== 'IDLE'}
          >
            {Array.from({ length: 15 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <span className="control-panel__active-badge">
            {emptyHoleCount} ACTIVE
          </span>
        </div>
      </div>

      {/* RTP Setting - hidden, uses default (97%)
      <div className="control-panel__section">
        <span className="control-panel__label">RTP Setting</span>
        <div className="control-panel__empty-row">
          <select
            className="control-panel__empty-select"
            value={rtpSetting}
            onChange={(e) => setRtp(Number(e.target.value) as 94 | 96 | 97 | 98 | 99)}
            disabled={phase !== 'IDLE'}
          >
            {[94, 96, 97, 98, 99].map((rtp) => (
              <option key={rtp} value={rtp}>{rtp}%</option>
            ))}
          </select>
          <span className="control-panel__active-badge">
            RTP {rtpSetting}%
          </span>
        </div>
      </div>
      */}

      {/* Potential Win */}
      <div className="control-panel__section">
        <span className="control-panel__label">Potential Win</span>
        <div className="control-panel__points">
          <span>$</span>{potentialWin.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      </div>

      {/* Payout Info (game over) */}
      {phase === 'GAME_OVER' && (
        <div className="control-panel__section">
          <span className="control-panel__label">Payout</span>
          <div className="control-panel__payout">$0.00</div>
        </div>
      )}

      {phase === 'CASHOUT' && (
        <div className="control-panel__section">
          <span className="control-panel__label">Payout</span>
          <div className="control-panel__balance">
            <span>$</span>{payout.toFixed(2)}
          </div>
        </div>
      )}

      {/* Action Button */}
      {phase === 'IDLE' && (
        <button
          className="control-panel__action-btn control-panel__action-btn--start"
          onClick={onStart}
          disabled={loading || balance < betAmount}
        >
          Start Game
        </button>
      )}

      {phase === 'PLAYING' && (
        <button
          className="control-panel__action-btn control-panel__action-btn--cashout"
          onClick={onCashout}
          disabled={loading || whackedCount === 0}
        >
          Cashout
        </button>
      )}

      {phase === 'GAME_OVER' && (
        <button
          className="control-panel__action-btn control-panel__action-btn--gameover"
          onClick={onReset}
        >
          Game Over
        </button>
      )}

      {phase === 'CASHOUT' && (
        <button
          className="control-panel__action-btn control-panel__action-btn--play-again"
          onClick={onReset}
        >
          Play Again
        </button>
      )}

      {/* Next Multiplier */}
      <div className="control-panel__section">
        <span className="control-panel__label">Next Multiplier</span>
        <div className="control-panel__next-multiplier">
          {calculateMultiplier(emptyHoleCount, whackedCount + 1, rtpSetting).toFixed(2)}x
        </div>
      </div>
    </div>
  );
}
