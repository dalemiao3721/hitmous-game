import { useGame } from '../../hooks/useGame';
import './CashoutOverlay.css';

interface CashoutOverlayProps {
  onPlayAgain: () => void;
}

export function CashoutOverlay({ onPlayAgain }: CashoutOverlayProps) {
  const { state } = useGame();

  if (state.phase !== 'CASHOUT') return null;

  const sparkles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 2}s`,
    duration: `${1.5 + Math.random() * 1.5}s`,
    size: `${3 + Math.random() * 5}px`,
  }));

  return (
    <div className="cashout-overlay">
      <div className="cashout-overlay__backdrop" />
      <div className="cashout-overlay__card">
        <div className="cashout-overlay__sparkles">
          {sparkles.map((s) => (
            <div
              key={s.id}
              className="cashout-overlay__sparkle"
              style={{
                left: s.left,
                animationDelay: s.delay,
                animationDuration: s.duration,
                width: s.size,
                height: s.size,
              }}
            />
          ))}
        </div>

        <div className="cashout-overlay__title">Collected!</div>
        <div className="cashout-overlay__subtitle">Total Payout</div>
        <div className="cashout-overlay__amount">
          <span>$</span>{state.payout.toFixed(2)}
        </div>

        <button className="cashout-overlay__btn" onClick={onPlayAgain}>
          Play Again
        </button>

        <div className="cashout-overlay__success">SUCCESS!</div>
      </div>
    </div>
  );
}
