import { useState } from 'react';
import { useGame } from '../../hooks/useGame';
import './FairnessPanel.css';

export function FairnessPanel() {
  const { state } = useGame();
  const [open, setOpen] = useState(false);

  const hasData = state.serverSeedHash || state.serverSeed;
  if (!hasData) return null;

  const isRevealed = state.phase === 'GAME_OVER' || state.phase === 'CASHOUT';

  return (
    <div className="fairness-panel">
      <button
        className="fairness-panel__toggle"
        onClick={() => setOpen(!open)}
      >
        <span>Provably Fair</span>
        <span className={`fairness-panel__toggle-icon ${open ? 'fairness-panel__toggle-icon--open' : ''}`}>
          ▼
        </span>
      </button>

      {open && (
        <div className="fairness-panel__body">
          <div className="fairness-panel__row">
            <span className="fairness-panel__label">Server Seed Hash</span>
            <span className="fairness-panel__value">
              {state.serverSeedHash ?? '—'}
            </span>
          </div>

          {isRevealed && (
            <>
              <div className="fairness-panel__row">
                <span className="fairness-panel__label">Server Seed (revealed)</span>
                <span className="fairness-panel__value fairness-panel__value--valid">
                  {state.serverSeed ?? '—'}
                </span>
              </div>

              {state.layout && (
                <div className="fairness-panel__row">
                  <span className="fairness-panel__label">Layout (0=mole, 1=empty)</span>
                  <span className="fairness-panel__value">
                    [{state.layout.join(', ')}]
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
