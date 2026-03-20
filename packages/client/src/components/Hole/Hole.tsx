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
          {/* Main Fur Texture - Multiple layers of brown */}
          <linearGradient id="furGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#8d5524" />
            <stop offset="50%" stopColor="#4e342e" />
            <stop offset="100%" stopColor="#21100e" />
          </linearGradient>
          
          {/* Face Gradient - Lighter and Warmer */}
          <radialGradient id="faceGradient" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#c68642" />
            <stop offset="100%" stopColor="#8d5524" />
          </radialGradient>
          
          {/* Muzzle - Soft Beige/Tan */}
          <radialGradient id="muzzleGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f5deb3" />
            <stop offset="100%" stopColor="#d2b48c" />
          </radialGradient>

          {/* Realistic Fur Noise Filter (Subtle) */}
          <filter id="furTexture" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="4" result="noise" />
            <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.1 0" result="subtleNoise" />
            <feMerge>
              <feMergeNode in="SourceGraphic" />
              <feMergeNode in="subtleNoise" />
            </feMerge>
          </filter>

          {/* 3D Volume Highlight */}
          <filter id="volume" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
            <feSpecularLighting in="blur" surfaceScale="8" specularConstant="1.5" specularExponent="40" lightingColor="#ffffff" result="spec">
              <feDistantLight azimuth="45" elevation="60" />
            </feSpecularLighting>
            <feComposite in="spec" in2="SourceAlpha" operator="in" result="specOut" />
            <feMerge>
              <feMergeNode in="SourceGraphic" />
              <feMergeNode in="specOut" />
            </feMerge>
          </filter>
        </defs>
        
        {/* Shadow under mole */}
        <ellipse cx="50" cy="95" rx="35" ry="8" fill="#000" opacity="0.3" />

        <g filter="url(#furTexture)">
          {/* Ears */}
          <g className="mole__ears">
            <path d="M25,35 Q20,20 35,25 Q35,35 25,35" fill="#4e342e" stroke="#21100e" strokeWidth="1" />
            <path d="M75,35 Q80,20 65,25 Q65,35 75,35" fill="#4e342e" stroke="#21100e" strokeWidth="1" />
            {/* Inner Ear */}
            <path d="M27,33 Q23,24 33,27 Q33,33 27,33" fill="#ffb6c1" opacity="0.4" />
            <path d="M73,33 Q77,24 67,27 Q67,33 73,33" fill="#ffb6c1" opacity="0.4" />
          </g>
          
          {/* Main Body Path - Organic shape */}
          <path d="M15,95 Q15,15 50,15 Q85,15 85,95 Z" fill="url(#furGradient)" filter="url(#volume)" />
          
          {/* Upper Body/Chest Highlight */}
          <ellipse cx="50" cy="80" rx="20" ry="15" fill="#ffffff" opacity="0.05" />

          {/* Muzzle Area - Chest and Face connection */}
          <path d="M35,65 Q50,60 65,65 L65,85 Q50,92 35,85 Z" fill="url(#muzzleGradient)" opacity="0.9" />
          
          {/* Eyes - Deep black with multiple reflective spots for "life" */}
          <g className="mole__eyes">
            <g transform="translate(40, 48)">
              <circle r="4.5" fill="#000" />
              <circle cx="-1.5" cy="-1.5" r="1.5" fill="#fff" opacity="0.8" />
              <circle cx="1" cy="1" r="0.8" fill="#fff" opacity="0.3" />
            </g>
            <g transform="translate(60, 48)">
              <circle r="4.5" fill="#000" />
              <circle cx="-1.5" cy="-1.5" r="1.5" fill="#fff" opacity="0.8" />
              <circle cx="1" cy="1" r="0.8" fill="#fff" opacity="0.3" />
            </g>
          </g>
          
          {/* Nose - Glossy and dark brown */}
          <g transform="translate(50, 60)">
            <ellipse rx="8" ry="5" fill="#21100e" />
            <ellipse cx="-2" cy="-1.5" rx="2.5" ry="1.2" fill="#fff" opacity="0.2" />
          </g>

          {/* Teeth - Two cute buck teeth */}
          <g transform="translate(46, 64)">
            <rect x="0" y="0" width="3.5" height="5" rx="1" fill="#f5f5dc" stroke="#d2b48c" strokeWidth="0.5" />
            <rect x="4.5" y="0" width="3.5" height="5" rx="1" fill="#f5f5dc" stroke="#d2b48c" strokeWidth="0.5" />
          </g>
          
          {/* Whiskers - Hand-drawn feel */}
          <g stroke="#21100e" strokeWidth="0.5" opacity="0.6">
            <path d="M35,65 L15,62" />
            <path d="M35,70 L12,75" />
            <path d="M65,65 L85,62" />
            <path d="M65,70 L88,75" />
          </g>

          {/* Hands - Popping out a bit (simplified) */}
          <g className="mole__hands" opacity="0.8">
            <path d="M25,85 Q20,80 18,90 Q20,95 25,95" fill="#f5deb3" />
            <path d="M75,85 Q80,80 82,90 Q80,95 75,95" fill="#f5deb3" />
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
