import type { HoleState } from '@hitmous/shared';
import './Hole.css';

interface HoleProps {
  hole: HoleState;
  disabled: boolean;
  onClick: (index: number, event?: React.MouseEvent) => void;
}

const STATUS_CLASS: Record<HoleState['status'], string> = {
  hidden: 'hole--hidden',
  whacked_mole: 'hole--whacked-mole',
  whacked_empty: 'hole--whacked-empty',
  revealed_mole: 'hole--revealed-mole',
  revealed_empty: 'hole--revealed-empty',
};

function Mole({ isRevealed = false }: { isRevealed?: boolean }) {
  return (
    <div className={`mole ${isRevealed ? 'mole--revealed' : ''}`}>
      <svg className="mole__svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="moleBody" cx="35%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#8d6e63" />
            <stop offset="100%" stopColor="#3e2723" />
          </radialGradient>
          <radialGradient id="moleEar" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#5d4037" />
            <stop offset="100%" stopColor="#21120f" />
          </radialGradient>
          <filter id="furTexture">
            <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="3" result="noise" />
            <feDiffuseLighting in="noise" lightingColor="#fff" surfaceScale="2">
              <feDistantLight azimuth="45" elevation="45" />
            </feDiffuseLighting>
            <feComposite operator="in" in2="SourceGraphic" />
          </filter>
        </defs>
        
        {/* Ears */}
        <circle cx="25" cy="25" r="12" fill="url(#moleEar)" />
        <circle cx="75" cy="25" r="12" fill="url(#moleEar)" />
        
        {/* Body/Head */}
        <path d="M15,85 C15,35 35,15 50,15 C65,15 85,35 85,85 L15,85" fill="url(#moleBody)" filter="url(#furTexture)" />
        
        {/* Face Details */}
        <g className="mole__face">
          <circle cx="40" cy="45" r="4" fill="#000" />
          <circle cx="40" cy="44" r="1.5" fill="#fff" opacity="0.8" />
          <circle cx="60" cy="45" r="4" fill="#000" />
          <circle cx="60" cy="44" r="1.5" fill="#fff" opacity="0.8" />
          
          <path d="M45,55 C45,65 55,65 55,55" fill="none" stroke="#21120f" strokeWidth="2" strokeLinecap="round" />
          <ellipse cx="50" cy="52" rx="6" ry="4" fill="#ff8a80" />
          
          {/* Whiskers */}
          <line x1="35" y1="52" x2="15" y2="48" stroke="#3e2723" strokeWidth="0.5" />
          <line x1="35" y1="54" x2="15" y2="54" stroke="#3e2723" strokeWidth="0.5" />
          <line x1="65" y1="52" x2="85" y2="48" stroke="#3e2723" strokeWidth="0.5" />
          <line x1="65" y1="54" x2="85" y2="54" stroke="#3e2723" strokeWidth="0.5" />
        </g>
      </svg>
    </div>
  );
}

function HoleIcon({ status }: { status: HoleState['status'] }) {
  switch (status) {
    case 'whacked_mole':
      return <Mole />;
    case 'whacked_empty':
      return <span className="hole__icon hole__icon--miss">✕</span>;
    case 'revealed_mole':
      return <Mole isRevealed />;
    case 'revealed_empty':
      return <span className="hole__icon hole__icon--revealed">✕</span>;
    default:
      return null;
  }
}

export function Hole({ hole, disabled, onClick }: HoleProps) {
  const isDisabled = disabled || hole.status !== 'hidden';

  return (
    <button
      className={`hole ${STATUS_CLASS[hole.status]} ${isDisabled ? 'hole--disabled' : ''}`}
      onClick={(e) => onClick(hole.index, e)}
      disabled={isDisabled}
      aria-label={`Hole ${hole.index + 1}`}
    >
      <HoleIcon status={hole.status} />
    </button>
  );
}
