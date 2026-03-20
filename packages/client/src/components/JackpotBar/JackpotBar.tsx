import './JackpotBar.css';

interface JackpotBarProps {
  amount: number;
}

export function JackpotBar({ amount }: JackpotBarProps) {
  return (
    <div className="jackpot-bar">
      <span className="jackpot-bar__label">JACKPOT:</span>
      <span className="jackpot-bar__amount">
        ${amount.toLocaleString('en-US')}
      </span>
    </div>
  );
}
