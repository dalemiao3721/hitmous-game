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
          {/* Main Body - Vibrant Terracotta Brown */}
          <radialGradient id="moleBody" cx="40%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#cd853f" /> {/* Peru */}
            <stop offset="40%" stopColor="#a0522d" /> {/* Sienna */}
            <stop offset="100%" stopColor="#5d4037" />
          </radialGradient>
          
          {/* Muzzle/Snout - Warm Beige */}
          <radialGradient id="moleMuzzle" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f5deb3" /> {/* Wheat */}
            <stop offset="100%" stopColor="#d2b48c" />
          </radialGradient>
          
          {/* Ear - Warmer Pink */}
          <radialGradient id="moleEar" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffb6c1" stopOpacity="0.5" />
            <stop offset="80%" stopColor="#8b4513" />
            <stop offset="100%" stopColor="#5d4037" />
          </radialGradient>

          {/* Improved Real3D Filter - Less "Whitening" */}
          <filter id="real3d" x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" result="blur" />
            {/* Warmer specular lighting to avoid "white" look */}
            <feSpecularLighting in="blur" surfaceScale="6" specularConstant="1.2" specularExponent="35" lightingColor="#ffe0b2" result="spec">
              <feDistantLight azimuth="45" elevation="60" />
            </feSpecularLighting>
            <feComposite in="spec" in2="SourceAlpha" operator="in" result="specOut" />
            
            {/* Subtle grain, not white wash */}
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" result="noise" />
            <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.15 0" result="noiseAlpha" />
            
            <feMerge>
              <feMergeNode in="SourceGraphic" />
              <feMergeNode in="specOut" />
              <feMergeNode in="noiseAlpha" />
            </feMerge>
          </filter>
        </defs>
        
        <g filter="url(#real3d)">
          {/* Ears */}
          <g className="mole__ears">
            <ellipse cx="30" cy="22" rx="12" ry="14" fill="url(#moleEar)" transform="rotate(-20, 30, 22)" />
            <ellipse cx="70" cy="22" rx="12" ry="14" fill="url(#moleEar)" transform="rotate(20, 70, 22)" />
          </g>
          
          {/* Body/Head Path */}
          <path d="M10,95 C10,35 25,12 50,12 C75,12 90,35 90,95 L10,95" fill="url(#moleBody)" />
          
          {/* Muzzle Shape - warmer, more blended */}
          <path d="M30,72 C30,58 50,55 70,72 L70,82 Q50,88 30,82 Z" fill="url(#moleMuzzle)" opacity="0.95" />
          
          {/* Eyes - Deep Set with contrasting warm highlight */}
          <g className="mole__eyes">
            <g transform="translate(38, 50)">
              <circle r="4.2" fill="#111" />
              <circle cx="-1.5" cy="-1.5" r="1.3" fill="#ffd180" opacity="0.6" />
            </g>
            <g transform="translate(62, 50)">
              <circle r="4.2" fill="#111" />
              <circle cx="-1.5" cy="-1.5" r="1.3" fill="#ffd180" opacity="0.6" />
            </g>
          </g>
          
          {/* Nose */}
          <rect x="44" y="60" width="12" height="6.5" rx="4" fill="#2d1d1a" />
          <path d="M46,65 Q50,69 54,65" fill="none" stroke="#1d110f" strokeWidth="1.2" />
          
          {/* Whiskers */}
          <g stroke="#3e2723" strokeWidth="0.35" opacity="0.5">
            <path d="M30,65 Q15,62 5,68" fill="none" />
            <path d="M30,68 Q15,68 6,72" fill="none" />
            <path d="M70,65 Q85,62 95,68" fill="none" />
            <path d="M70,68 Q85,68 94,72" fill="none" />
          </g>
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
