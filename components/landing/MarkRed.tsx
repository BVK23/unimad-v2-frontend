"use client";

/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";

const COUNT_TARGET = 10000;
const COUNT_DURATION_MS = 1600;

function formatCount(value: number) {
  return value.toLocaleString("en-US");
}

export function MarkRed() {
  const [count, setCount] = useState(0);
  const [strokeReady, setStrokeReady] = useState(false);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches) {
      setCount(COUNT_TARGET);
      setStrokeReady(true);
      return;
    }

    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / COUNT_DURATION_MS, 1);
      const eased = 1 - (1 - progress) ** 3;
      setCount(Math.round(eased * COUNT_TARGET));

      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        setStrokeReady(true);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <span className="mark-red">
      <span className="mark-red-line">
        {/* Invisible sizer — reserves the full final width/height so the
            count-up never shifts the headline as digits grow. */}
        <span className="mark-red-placeholder" aria-hidden="true">
          {formatCount(COUNT_TARGET)}+ interviews
          {/* for international students */}
        </span>
        <span className="mark-red-value">
          {formatCount(count)}+ interviews
          {/* for international students */}
          <span className={`mark-red-stroke${strokeReady ? " is-ready" : ""}`} aria-hidden="true">
            <span className="mark-red-stroke-inner">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/landing/hero-brush-stroke.svg" alt="" width={526} height={11} decoding="async" />
            </span>
          </span>
        </span>
      </span>
    </span>
  );
}
