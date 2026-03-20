import { useGame } from '../../hooks/useGame';
import { MultiplierDisplay } from '../MultiplierDisplay/MultiplierDisplay';
import { Hole } from '../Hole/Hole';
import './GameBoard.css';

interface GameBoardProps {
  onWhack: (index: number, event?: React.MouseEvent) => void;
}

export function GameBoard({ onWhack }: GameBoardProps) {
  const { state } = useGame();
  const isPlaying = state.phase === 'PLAYING';

  return (
    <div className="game-board">
      <div className="game-board__header">
        <div className="game-board__title-area">
          <h1 className="game-board__title">MEGA WHACK</h1>
          <p className="game-board__subtitle">
            {isPlaying ? 'FIND THE MOLES!' : '16 HOLES \u2022 CHOOSE YOUR HOLES ABOVE'}
          </p>
        </div>
        <div className="game-board__status-area">
          {isPlaying ? (
            <MultiplierDisplay />
          ) : (
            <span className="game-board__status-text">
              {STATUS_TEXT[state.phase]}
            </span>
          )}
        </div>
      </div>

      <div className="game-board__grid">
        {state.holes.map((hole) => (
          <Hole
            key={hole.index}
            hole={hole}
            disabled={!isPlaying}
            onClick={onWhack}
          />
        ))}
      </div>

      <p className="game-board__hint">
        {isPlaying ? 'TAP OR CLICK FAST TO WIN!' : 'TAP OR CLICK HOLES TO PLAY!'}
      </p>
    </div>
  );
}

const STATUS_TEXT: Record<string, string> = {
  IDLE: 'READY TO WHACK!',
  PLAYING: '',
  GAME_OVER: 'BETTER LUCK NEXT TIME',
  CASHOUT: 'CONGRATULATIONS!',
};
