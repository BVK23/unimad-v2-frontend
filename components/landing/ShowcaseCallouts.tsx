"use client";

import { motion } from "framer-motion";
import type { ShowcaseCallout } from "./showcaseProducts";

function calloutPath(c: ShowcaseCallout) {
  const elbowX = Math.max(12, c.x - 14);
  return `M 4 ${c.y} L ${elbowX} ${c.y} L ${c.x} ${c.y}`;
}

export function ShowcaseCallouts({ callouts, productId }: { callouts: ShowcaseCallout[]; productId: string }) {
  return (
    <svg className="showcase-callouts" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
      {callouts.map((callout, index) => (
        <motion.g
          key={`${productId}-${callout.label}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28, delay: index * 0.06 }}
        >
          <motion.path
            d={calloutPath(callout)}
            className="showcase-callout-line"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
          />
          <motion.circle
            className="showcase-callout-dot"
            cx={callout.x}
            cy={callout.y}
            r="1.4"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, delay: 0.2 + index * 0.08 }}
          />
          <motion.text
            className="showcase-callout-label"
            x={callout.x + 2.5}
            y={callout.y - 1.8}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35, delay: 0.28 + index * 0.08 }}
          >
            {callout.label}
          </motion.text>
        </motion.g>
      ))}
    </svg>
  );
}
