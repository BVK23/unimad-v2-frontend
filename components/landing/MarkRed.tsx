"use client";

/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";

export function MarkRed() {
  const [strokeReady, setStrokeReady] = useState(false);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches) {
      setStrokeReady(true);
      return;
    }

    const timer = setTimeout(() => {
      setStrokeReady(true);
    }, 400);

    return () => clearTimeout(timer);
  }, []);

  return (
    <span className="mark-red">
      <span className="mark-red-line">
        {/* Invisible sizer — reserves width/height so the stroke never shifts the headline. */}
        <span className="mark-red-placeholder" aria-hidden="true">
          fix your job search.
        </span>
        <span className="mark-red-value">
          fix your job search.
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
