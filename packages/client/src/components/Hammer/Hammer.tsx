import { useState, useCallback } from 'react';
import './Hammer.css';

interface HammerEffect {
  id: number;
  x: number;
  y: number;
}

let nextId = 0;

export function useHammerEffect() {
  const [effects, setEffects] = useState<HammerEffect[]>([]);

  const triggerHammer = useCallback((x: number, y: number) => {
    const id = nextId++;
    setEffects((prev) => [...prev, { id, x, y }]);
    setTimeout(() => {
      setEffects((prev) => prev.filter((e) => e.id !== id));
    }, 600); // Increased duration for particles
  }, []);

  return { effects, triggerHammer };
}

export function HammerEffects({ effects }: { effects: HammerEffect[] }) {
  return (
    <>
      {effects.map((e) => (
        <div
          key={e.id}
          className="hammer-container"
          style={{ left: e.x, top: e.y }}
        >
          <div className="hammer-sprite">🔨</div>
          <div className="hammer-particles">
            {[...Array(6)].map((_, i) => (
              <div key={i} className={`particle p${i}`} />
            ))}
          </div>
          <div className="hammer-impact" />
        </div>
      ))}
    </>
  );
}
