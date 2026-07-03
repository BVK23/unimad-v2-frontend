"use client";

/* eslint-disable react-hooks/immutability */
import { useCallback, useEffect, useRef, useState } from "react";
import { getFeatureSigninUrl } from "@/constants/landing-auth";
import {
  AnimatePresence,
  animate,
  motion,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { Check } from "lucide-react";
import Link from "next/link";
import { ShowcaseScreen } from "./ShowcaseScreen";
import { ShowcaseUnibot } from "./ShowcaseUnibot";
import { SHOWCASE_PRODUCTS, type ShowcaseProduct } from "./showcaseProducts";

const SPLIT_SCROLL_VH = 55;
const FEATURE_SCROLL_VH = 96;
// Each feature is revealed in phases: the title on its own first, then the
// points one at a time. This gives the first point its own beat instead of
// landing at the same moment the title slides in.
const MAX_BULLETS = Math.max(...SHOWCASE_PRODUCTS.map(p => p.bullets.length));
const PHASES_PER_FEATURE = MAX_BULLETS + 1; // 1 title-intro phase + one per point
// Minimum time each phase stays on screen before advancing, so a fast/momentum
// scroll still steps through the title and every point instead of skipping them.
const FEATURE_DWELL_MS = 460; // when a new feature's title slides in
const POINT_DWELL_MS = 360; // when the next point within a feature appears
const SCROLL_TRACK_VH = SPLIT_SCROLL_VH + FEATURE_SCROLL_VH * SHOWCASE_PRODUCTS.length;

const SPLIT_END = SPLIT_SCROLL_VH / SCROLL_TRACK_VH;
const FEATURES_START = SPLIT_END;
const INTRO_EASE = [0.22, 1, 0.36, 1] as const;

function getProduct(index: number): ShowcaseProduct {
  return SHOWCASE_PRODUCTS[index] ?? SHOWCASE_PRODUCTS[0];
}

const FEATURE_TRANSITION = { duration: 0.42, ease: [0.22, 1, 0.36, 1] as const };
const POINTER_TRANSITION = { duration: 0.34, ease: [0.22, 1, 0.36, 1] as const };

function FeatureHeading({ product }: { product: ShowcaseProduct }) {
  return (
    <motion.div
      key={product.id}
      className="showcase-feature-heading"
      initial={{ opacity: 0, y: -28 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 28 }}
      transition={FEATURE_TRANSITION}
    >
      <h3 className="showcase-feature-title">{product.label}</h3>
      <Link href={getFeatureSigninUrl(product.id)} className="btn btn-solid showcase-feature-cta">
        {product.ctaLabel}
      </Link>
    </motion.div>
  );
}

function FeaturePointers({ product, activeBullet }: { product: ShowcaseProduct; activeBullet: number }) {
  return (
    <ul className="showcase-feature-pointers" aria-label={`${product.title} features`}>
      {product.bullets.map((line, index) => {
        const isVisible = index <= activeBullet;
        const isActive = index === activeBullet;

        return (
          <motion.li
            key={line}
            className={`showcase-feature-pointer${isActive ? " is-active" : ""}`}
            initial={false}
            animate={{
              opacity: isVisible ? (isActive ? 1 : 0.5) : 0.18,
              x: isVisible ? 0 : 14,
            }}
            transition={{ ...POINTER_TRANSITION, delay: isVisible ? index * 0.06 : 0 }}
          >
            <span className="showcase-feature-pointer__tick" aria-hidden>
              <Check size={13} strokeWidth={3} />
            </span>
            <span className="showcase-feature-pointer__text">{line}</span>
          </motion.li>
        );
      })}
    </ul>
  );
}

function ScrollShowcase() {
  const trackRef = useRef<HTMLDivElement>(null);
  const hasRevealedIntro = useRef(false);
  const [activeIndex, setActiveIndex] = useState(0);
  // -1 = the title-intro phase, where the heading shows before any point.
  const [activeBullet, setActiveBullet] = useState(-1);
  const activeSlotRef = useRef(0);
  const targetSlotRef = useRef(0);
  const stepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const headlineOpacity = useMotionValue(0);
  const chatOpacity = useMotionValue(0);

  const sectionInView = useInView(trackRef, { amount: 0.12, once: true });

  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start start", "end end"],
  });

  const splitProgress = useTransform(scrollYProgress, [0, SPLIT_END], [0, 1]);
  const featuresOpacity = useTransform(splitProgress, [0.58, 1], [0, 1]);

  const headlineY = useTransform(splitProgress, [0, 0.4, 1], [-52, -200, -300]);
  const chatY = useTransform(splitProgress, [0, 1], [132, 268]);

  useEffect(() => {
    if (!sectionInView || hasRevealedIntro.current) return;
    hasRevealedIntro.current = true;
    animate(headlineOpacity, 1, { duration: 0.55, ease: INTRO_EASE });
    animate(chatOpacity, 1, { duration: 0.55, ease: INTRO_EASE, delay: 0.06 });
  }, [sectionInView, headlineOpacity, chatOpacity]);

  const productProgress = useTransform(scrollYProgress, [FEATURES_START, 0.995], [0, SHOWCASE_PRODUCTS.length]);

  // A "slot" is a single monotonic index across every phase of every feature
  // (phase 0 = title only, phase 1 = point 1, ...). We step the displayed slot
  // toward the scroll target one phase at a time, holding each for a minimum
  // beat so the title and every point are shown — even on a fast scroll. Normal
  // slow scrolling still moves one phase at a time with no added lag.
  const applySlot = useCallback((slot: number) => {
    const index = Math.min(Math.floor(slot / PHASES_PER_FEATURE), SHOWCASE_PRODUCTS.length - 1);
    const phase = slot % PHASES_PER_FEATURE;
    const bulletCount = getProduct(index).bullets.length;
    const bullet = Math.min(phase - 1, bulletCount - 1);
    setActiveIndex(prev => (prev === index ? prev : index));
    setActiveBullet(prev => (prev === bullet ? prev : bullet));
  }, []);

  const advanceStep = useCallback(() => {
    stepTimerRef.current = null;

    const current = activeSlotRef.current;
    const target = targetSlotRef.current;
    if (current === target) return;

    const next = current + (target > current ? 1 : -1);
    activeSlotRef.current = next;
    applySlot(next);

    if (next !== target) {
      // A new feature's title (phase 0) gets a longer beat than a point.
      const dwell = next % PHASES_PER_FEATURE === 0 ? FEATURE_DWELL_MS : POINT_DWELL_MS;
      stepTimerRef.current = setTimeout(advanceStep, dwell);
    }
  }, [applySlot]);

  const requestStep = useCallback(() => {
    // A step is already queued; it will read the latest target when it runs.
    if (stepTimerRef.current) return;
    if (activeSlotRef.current === targetSlotRef.current) return;
    advanceStep();
  }, [advanceStep]);

  useEffect(() => {
    return () => {
      if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
    };
  }, []);

  useMotionValueEvent(productProgress, "change", value => {
    const clamped = Math.min(Math.max(value, 0), SHOWCASE_PRODUCTS.length - 0.001);
    const index = Math.min(Math.floor(clamped), SHOWCASE_PRODUCTS.length - 1);
    const segment = clamped - index;
    const phase = Math.min(Math.floor(segment * PHASES_PER_FEATURE), PHASES_PER_FEATURE - 1);

    targetSlotRef.current = index * PHASES_PER_FEATURE + phase;
    requestStep();
  });

  const activeProduct = getProduct(activeIndex);

  return (
    <div className="showcase-scroll-track" ref={trackRef} style={{ height: `${SCROLL_TRACK_VH}vh` }}>
      <div className="showcase-sticky">
        <div className="showcase-stage">
          <motion.h2 className="showcase-hl showcase-hl--pinned" style={{ opacity: headlineOpacity, x: "-50%", y: headlineY }}>
            Every tool you need, for free.
            <br />
            Powered by unibot.
          </motion.h2>

          <motion.div className="showcase-features-layer" style={{ opacity: featuresOpacity }}>
            <div className="showcase-features-grid">
              <div className="showcase-features-col showcase-features-col--left">
                <AnimatePresence mode="wait">
                  <FeatureHeading key={activeProduct.id} product={activeProduct} />
                </AnimatePresence>
              </div>

              <div className="showcase-features-center">
                <div className="showcase-features-screen">
                  <ShowcaseScreen
                    productId={activeProduct.id}
                    productTitle={activeProduct.title}
                    prompts={activeProduct.prompts}
                    hideUnibot
                  />
                </div>
              </div>

              <div className="showcase-features-col showcase-features-col--right">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeProduct.id}
                    className="showcase-feature-pointers-wrap"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.28 }}
                  >
                    <FeaturePointers product={activeProduct} activeBullet={activeBullet} />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

          <motion.div className="showcase-chat-pinned" style={{ opacity: chatOpacity, x: "-50%", y: chatY }}>
            <ShowcaseUnibot prompts={activeProduct.prompts} />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function StaticShowcase() {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = getProduct(activeIndex);

  return (
    <div className="showcase-static">
      <h2 className="showcase-hl">
        Every tool you need, for free.
        <br />
        Powered by unibot.
      </h2>

      <div className="showcase-static-tabs" role="tablist" aria-label="Product features">
        {SHOWCASE_PRODUCTS.map((product, index) => (
          <button
            key={product.id}
            type="button"
            role="tab"
            aria-selected={index === activeIndex}
            className={`showcase-static-tab${index === activeIndex ? " is-active" : ""}`}
            onClick={() => setActiveIndex(index)}
          >
            {product.title}
          </button>
        ))}
      </div>

      <div className="showcase-static-body">
        <AnimatePresence mode="wait">
          <FeatureHeading key={active.id} product={active} />
        </AnimatePresence>
        <div className="showcase-static-screen">
          <ShowcaseScreen productId={active.id} productTitle={active.title} prompts={active.prompts} hideUnibot />
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={active.id}
            className="showcase-feature-pointers-wrap"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
          >
            <FeaturePointers product={active} activeBullet={active.bullets.length - 1} />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="showcase-static-chat">
        <ShowcaseUnibot prompts={active.prompts} />
      </div>
    </div>
  );
}

export function ProductShowcase() {
  const reducedMotion = useReducedMotion();
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.matchMedia("(max-width: 1024px)").matches);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1024px)");
    const update = () => setIsMobile(mq.matches);
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  if (reducedMotion || isMobile) {
    return <StaticShowcase />;
  }

  return <ScrollShowcase />;
}
