import { useEffect, useRef, useState } from 'react';
import { useGame } from '../../hooks/useGame';
import './MultiplierDisplay.css';

export function MultiplierDisplay() {
  const { state } = useGame();
  const { currentMultiplier, nextMultiplier, phase, whackedCount, betAmount } = state;
  const [bouncing, setBouncing] = useState(false);
  const prevMultiplier = useRef(currentMultiplier);

  useEffect(() => {
    if (currentMultiplier !== prevMultiplier.current && currentMultiplier > 1) {
      setBouncing(true);
      const timer = setTimeout(() => setBouncing(false), 400);
      prevMultiplier.current = currentMultiplier;
      return () => clearTimeout(timer);
    }
  }, [currentMultiplier]);

  const potentialPayout = (currentMultiplier * betAmount).toFixed(2);

  return (
    <div className="multiplier-display">
      <span className="multiplier-display__label">TOTAL MULTIPLIER</span>
      <span
        className={`multiplier-display__value ${bouncing ? 'multiplier-display__value--bounce' : ''}`}
      >
        {currentMultiplier.toFixed(2)}x
      </span>
      {phase === 'PLAYING' && whackedCount > 0 && (
        <span className="multiplier-display__next">
          ${potentialPayout}
        </span>
      )}
    </div>
  );
}
