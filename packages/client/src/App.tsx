import { useCallback } from 'react';
import { GameProvider } from './context/GameContext';
import { useApi } from './hooks/useApi';
import { useGame } from './hooks/useGame';
// import { JackpotBar } from './components/JackpotBar/JackpotBar'; // TODO: re-enable when Jackpot is implemented
import { ControlPanel } from './components/ControlPanel/ControlPanel';
import { GameBoard } from './components/GameBoard/GameBoard';
import { CashoutOverlay } from './components/CashoutOverlay/CashoutOverlay';
import { GameOverOverlay } from './components/GameOverOverlay/GameOverOverlay';
// import { FairnessPanel } from './components/FairnessPanel/FairnessPanel'; // TODO: re-enable when ready
import { HammerEffects, useHammerEffect } from './components/Hammer/Hammer';
import './styles/global.css';
import './styles/components/App.css';

function useMobileDetection() {
  const isForcedMobile = window.location.pathname.includes('/m/') || window.location.pathname.endsWith('/m');
  return { isForcedMobile };
}

function GameApp() {
  const { startGame, whack, cashout, loading, error } = useApi();
  const { state, reset } = useGame();
  const { effects, triggerHammer } = useHammerEffect();

  const handleWhack = useCallback((index: number, event?: React.MouseEvent) => {
    if (event) {
      triggerHammer(event.clientX, event.clientY);
    }
    whack(index);
  }, [whack, triggerHammer]);

  const { isForcedMobile } = useMobileDetection();

  return (
    <div className={`app ${isForcedMobile ? 'app--mobile' : ''}`}>
      {error && <div className="app__error">{error}</div>}

      <div className="app__main">
        <div className="app__left">
          <ControlPanel
            balance={state.balance}
            loading={loading}
            onStart={startGame}
            onCashout={cashout}
            onReset={reset}
          />
        </div>

        <div className="app__center">
          <GameBoard onWhack={handleWhack} />
        </div>
      </div>

      <CashoutOverlay onPlayAgain={reset} />
      <GameOverOverlay betAmount={state.betAmount} onReset={reset} />
      <HammerEffects effects={effects} />
    </div>
  );
}

function App() {
  return (
    <GameProvider>
      <GameApp />
    </GameProvider>
  );
}

export default App;
