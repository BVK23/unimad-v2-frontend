"use client";

import { useEffect, useMemo, useState } from "react";

/** Deterministic PRNG so the server and client render identical stars (no hydration mismatch). */
function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Star = {
  top: number;
  left: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
};

function makeStars(count: number, seed: number): Star[] {
  const rand = mulberry32(seed);
  const stars: Star[] = [];
  for (let i = 0; i < count; i += 1) {
    stars.push({
      top: rand() * 100,
      left: rand() * 100,
      size: 0.6 + rand() * rand() * 2.4,
      duration: 1.8 + rand() * 3.4,
      delay: rand() * 6,
      opacity: 0.4 + rand() * 0.6,
    });
  }
  return stars;
}

type Shot = {
  id: number;
  top: number;
  left: number;
  angle: number;
  travel: number;
  len: number;
  dur: number;
};

export function StarfieldBackground({ count = 150, seed = 20260704 }: { count?: number; seed?: number }) {
  const stars = useMemo(() => makeStars(count, seed), [count, seed]);
  const [shots, setShots] = useState<Shot[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let id = 0;
    const spawn = () => {
      id += 1;
      const shot: Shot = {
        id,
        top: 4 + Math.random() * 44,
        left: 6 + Math.random() * 68,
        angle: 12 + Math.random() * 28,
        travel: 320 + Math.random() * 240,
        len: 90 + Math.random() * 100,
        dur: 0.9 + Math.random() * 0.6,
      };
      setShots(prev => [...prev, shot]);
    };

    const first = window.setTimeout(spawn, 3500);
    const interval = window.setInterval(spawn, 10000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(interval);
    };
  }, []);

  const removeShot = (id: number) => setShots(prev => prev.filter(s => s.id !== id));

  return (
    <div className="starfield" aria-hidden>
      <div className="starfield__stars">
        {stars.map((s, i) => (
          <span
            key={i}
            className="star"
            style={
              {
                top: `${s.top}%`,
                left: `${s.left}%`,
                width: `${s.size}px`,
                height: `${s.size}px`,
                boxShadow: `0 0 ${Math.max(3, s.size * 2.6)}px rgba(255,255,255,.65)`,
                "--tw-dur": `${s.duration}s`,
                "--tw-delay": `${s.delay}s`,
                "--tw-op": s.opacity,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      <div className="starfield__veil" />

      <div className="starfield__shots">
        {shots.map(s => (
          <div key={s.id} className="shooting-star" style={{ top: `${s.top}%`, left: `${s.left}%`, transform: `rotate(${s.angle}deg)` }}>
            <div
              className="shooting-star__streak"
              style={
                {
                  width: `${s.len}px`,
                  "--ss-travel": `${s.travel}px`,
                  "--ss-dur": `${s.dur}s`,
                } as React.CSSProperties
              }
              onAnimationEnd={() => removeShot(s.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
