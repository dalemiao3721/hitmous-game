import { useGame } from '../../hooks/useGame';
import './GameOverOverlay.css';

interface GameOverOverlayProps {
  betAmount: number;
  onReset: () => void;
}

export function GameOverOverlay({ betAmount, onReset }: GameOverOverlayProps) {
  const { state } = useGame();

  if (state.phase !== 'GAME_OVER') return null;

  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 2}s`,
    duration: `${1.5 + Math.random() * 1.5}s`,
    size: `${3 + Math.random() * 4}px`,
  }));

  return (
    <>
      <div className="gameover-flash" />
      <div className="gameover-overlay">
        <div className="gameover-overlay__backdrop" />
        <div className="gameover-overlay__card">
          <div className="gameover-overlay__particles">
            {particles.map((p) => (
              <div
                key={p.id}
                className="gameover-overlay__particle"
                style={{
                  left: p.left,
                  animationDelay: p.delay,
                  animationDuration: p.duration,
                  width: p.size,
                  height: p.size,
                }}
              />
            ))}
          </div>

          <div className="gameover-overlay__title">Miss!</div>
          <div className="gameover-overlay__subtitle">Game Over</div>
          <div className="gameover-overlay__amount">
            <span>$</span>0.00
          </div>
          <div className="gameover-overlay__currency">PAYOUT</div>

          <button className="gameover-overlay__btn" onClick={onReset}>
            Play Again
          </button>

          <div className="gameover-overlay__footer">
            PLAY AGAIN FOR <span>${betAmount}</span>
          </div>
        </div>
      </div>
    </>
  );
}
