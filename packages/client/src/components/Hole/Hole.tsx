import { useEffect, useRef } from 'react';
import type { HoleState } from '@hitmous/shared';
import { soundService } from '../../services/SoundService';
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
          {/* Main Body - Warm Earthy Brown */}
          <radialGradient id="moleBody" cx="40%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#d2b48c" /> {/* Tan/Light Brown */}
            <stop offset="40%" stopColor="#a0522d" /> {/* Sienna */}
            <stop offset="100%" stopColor="#5d4037" />
          </radialGradient>
          
          {/* Muzzle/Snout - Light Beige (replacing white) */}
          <radialGradient id="moleMuzzle" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f5f5dc" /> {/* Beige instead of white */}
            <stop offset="100%" stopColor="#d2b48c" />
          </radialGradient>
          
          {/* Ear - Natural Pinkish Tan */}
          <radialGradient id="moleEar" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f8bbd0" stopOpacity="0.3" />
            <stop offset="80%" stopColor="#8d6e63" />
            <stop offset="100%" stopColor="#3e2723" />
          </radialGradient>

          {/* Hyper-Realistic Fur & Volume Filter */}
          <filter id="real3d" x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="1.8" result="blur" />
            <feSpecularLighting in="blur" surfaceScale="7" specularConstant="1.5" specularExponent="30" lightingColor="#ffd180" result="spec">
              <feDistantLight azimuth="45" elevation="55" />
            </feSpecularLighting>
            <feComposite in="spec" in2="SourceAlpha" operator="in" result="specOut" />
            
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" result="noise" />
            <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.4 0" result="noiseAlpha" />
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
          
          {/* Body/Head Path - More anatomical than simple arch */}
          <path d="M10,95 C10,40 25,10 50,10 C75,10 90,40 90,95 L10,95" fill="url(#moleBody)" />
          
          {/* Refined Muzzle Shape */}
          <path d="M30,70 C30,55 50,50 70,70 L70,80 Q50,85 30,80 Z" fill="url(#moleMuzzle)" opacity="0.95" />
          
          {/* Eyes - Deep Set */}
          <g className="mole__eyes">
            <g transform="translate(38, 48)">
              <circle r="4" fill="#111" />
              <circle cx="-1.5" cy="-1.5" r="1.2" fill="#f5f5dc" opacity="0.4" />
            </g>
            <g transform="translate(62, 48)">
              <circle r="4" fill="#111" />
              <circle cx="-1.5" cy="-1.5" r="1.2" fill="#f5f5dc" opacity="0.4" />
            </g>
          </g>
          
          {/* Nose - More Realistic Shape */}
          <rect x="44" y="58" width="12" height="6" rx="4" fill="#3e2723" />
          <path d="M46,62 Q50,66 54,62" fill="none" stroke="#21120f" strokeWidth="1" />
          
          {/* Whiskers - Natural and Tapered */}
          <g stroke="#3e2723" strokeWidth="0.3" opacity="0.4">
            <path d="M30,62 Q15,60 5,64" fill="none" />
            <path d="M30,64 Q15,64 6,68" fill="none" />
            <path d="M30,66 Q15,68 8,72" fill="none" />
            <path d="M70,62 Q85,60 95,64" fill="none" />
            <path d="M70,64 Q85,64 94,68" fill="none" />
            <path d="M70,66 Q85,68 92,72" fill="none" />
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
