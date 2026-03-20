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
          {/* Main Body Gradient - Brighter Golden Brown */}
          <radialGradient id="moleBody" cx="40%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#e0c090" />
            <stop offset="40%" stopColor="#a07040" />
            <stop offset="100%" stopColor="#5d4037" />
          </radialGradient>
          
          {/* Muzzle/Snout Gradient - Lighter Tan */}
          <radialGradient id="moleMuzzle" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f8f0e0" />
            <stop offset="100%" stopColor="#cbb194" />
          </radialGradient>
          
          {/* Ear Gradient - More Vibrant Inner Pink */}
          <radialGradient id="moleEar" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ff9e9e" stopOpacity="0.6" />
            <stop offset="70%" stopColor="#8d6e63" />
            <stop offset="100%" stopColor="#5d4037" />
          </radialGradient>

          {/* Fur & Volume Filter - Stronger Highlights */}
          <filter id="real3d" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" result="blur" />
            <feSpecularLighting in="blur" surfaceScale="6" specularConstant="1.2" specularExponent="25" lightingColor="#ffffff" result="spec">
              <feDistantLight azimuth="45" elevation="55" />
            </feSpecularLighting>
            <feComposite in="spec" in2="SourceAlpha" operator="in" result="specOut" />
            
            <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="4" result="noise" />
            <feColorMatrix in="noise" type="saturate" values="0" result="destat" />
            <feComponentTransfer in="destat" result="alphaNoise">
               <feFuncA type="linear" slope="0.3" />
            </feComponentTransfer>
            
            <feMerge>
              <feMergeNode in="SourceGraphic" />
              <feMergeNode in="specOut" />
              <feMergeNode in="alphaNoise" />
            </feMerge>
          </filter>
          
          <clipPath id="moleClip">
            <path d="M0,0 H100 V85 Q50,95 0,85 Z" />
          </clipPath>
        </defs>
        
        <g filter="url(#real3d)">
          {/* Ears with depth */}
          <g className="mole__ears">
            <ellipse cx="28" cy="22" rx="10" ry="12" fill="url(#moleEar)" transform="rotate(-15, 28, 22)" />
            <ellipse cx="72" cy="22" rx="10" ry="12" fill="url(#moleEar)" transform="rotate(15, 72, 22)" />
          </g>
          
          {/* Head/Body Shape */}
          <path d="M12,90 Q12,10 50,10 Q88,10 88,90 L12,90 Z" fill="url(#moleBody)" />
          
          {/* Snout/Muzzle Area */}
          <ellipse cx="50" cy="62" rx="22" ry="18" fill="url(#moleMuzzle)" opacity="0.9" />
          
          {/* Eyes with specular highlights */}
          <g className="mole__eyes">
            <g transform="translate(38, 42)">
              <circle r="4.5" fill="#111" />
              <circle cx="-1.5" cy="-1.5" r="1.5" fill="#fff" />
            </g>
            <g transform="translate(62, 42)">
              <circle r="4.5" fill="#111" />
              <circle cx="-1.5" cy="-1.5" r="1.5" fill="#fff" />
            </g>
          </g>
          
          {/* Nose */}
          <path d="M46,56 Q50,50 54,56 Q54,62 50,60 Q46,62 46,56" fill="#333" />
          <circle cx="48.5" cy="54.5" r="1" fill="#fff" opacity="0.5" />
          
          {/* Whiskers */}
          <g stroke="#3e2723" strokeWidth="0.4" opacity="0.6">
            <line x1="32" y1="60" x2="10" y2="58" />
            <line x1="32" y1="63" x2="8" y2="65" />
            <line x1="68" y1="60" x2="90" y2="58" />
            <line x1="68" y1="63" x2="92" y2="65" />
          </g>
          
          {/* Mouth */}
          <path d="M46,68 Q50,72 54,68" fill="none" stroke="#5d4037" strokeWidth="1.5" strokeLinecap="round" />
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
