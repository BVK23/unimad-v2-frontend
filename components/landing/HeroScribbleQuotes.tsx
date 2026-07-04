"use client";

/* eslint-disable react-hooks/purity, react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HERO_POP_TESTIMONIALS } from "./testimonials";

const PAUSE_MS = 1300;
/** Start the next quote this many ms before the current pause ends (overlap while first is still visible). */
const OVERLAP_INTO_PAUSE_MS = 720;
const META_HIDE_MS = 80;
const SLOT_COUNT = 4;

const SLOT_CLASS = ["hero-scribble--tl", "hero-scribble--tr", "hero-scribble--bl", "hero-scribble--br"] as const;

type WordState = "hidden" | "scribbling" | "visible" | "erasing" | "gone";
type Phase = "writing" | "pause" | "erasing";

type QuoteInstance = {
  id: number;
  testimonialIndex: number;
  slotIndex: number;
};

function splitQuoteWords(text: string): string[] {
  return text.match(/\S+|\s+/g) ?? [text];
}

type AnimationSignal = { cancelled: boolean; timeouts: ReturnType<typeof setTimeout>[] };

function wait(ms: number, signal: AnimationSignal) {
  return new Promise<void>(resolve => {
    const id = setTimeout(() => {
      if (!signal.cancelled) resolve();
    }, ms);
    signal.timeouts.push(id);
  });
}

function scribbleMs(word: string) {
  const trimmed = word.trim();
  if (!trimmed) return 12;
  return Math.min(300, Math.max(120, trimmed.length * 28));
}

function shuffle<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function wordStateClass(state: WordState) {
  if (state === "scribbling") return "is-scribbling";
  if (state === "visible") return "is-visible";
  if (state === "erasing") return "is-erasing";
  if (state === "gone") return "is-gone";
  return "is-hidden";
}

async function animateWordWrite(
  words: string[],
  setWordStates: React.Dispatch<React.SetStateAction<WordState[]>>,
  signal: AnimationSignal
) {
  for (let i = 0; i < words.length; i += 1) {
    if (signal.cancelled) return;

    const word = words[i] ?? "";
    if (!word.trim()) {
      setWordStates(prev => {
        const next = [...prev];
        next[i] = "visible";
        return next;
      });
      continue;
    }

    setWordStates(prev => {
      const next = [...prev];
      next[i] = "scribbling";
      return next;
    });

    await wait(scribbleMs(word), signal);
    if (signal.cancelled) return;

    setWordStates(prev => {
      const next = [...prev];
      next[i] = "visible";
      return next;
    });

    await wait(12, signal);
  }
}

async function animateBitErase(words: string[], setWordStates: React.Dispatch<React.SetStateAction<WordState[]>>, signal: AnimationSignal) {
  const indices = words
    .map((word, index) => ({ word, index }))
    .filter(({ word }) => word.trim().length > 0)
    .map(({ index }) => index);

  for (const index of shuffle(indices)) {
    if (signal.cancelled) return;

    setWordStates(prev => {
      const next = [...prev];
      next[index] = "erasing";
      return next;
    });

    await wait(25 + Math.random() * 65, signal);
  }

  await wait(340, signal);
  if (signal.cancelled) return;

  setWordStates(words.map(() => "gone"));
}

function ScribbleQuoteInstance({
  instance,
  onRequestNext,
  onComplete,
}: {
  instance: QuoteInstance;
  onRequestNext: () => void;
  onComplete: (id: number) => void;
}) {
  const quote = HERO_POP_TESTIMONIALS[instance.testimonialIndex % HERO_POP_TESTIMONIALS.length];
  const fullText = `"${quote.quote}"`;
  const words = useMemo(() => splitQuoteWords(fullText), [fullText]);
  const eraseTimings = useMemo(() => words.map(() => `${200 + Math.random() * 160}ms`), [instance.id, words.length]);
  const metaText = quote.uni ? `${quote.name} · ${quote.uni}` : quote.name;

  const [phase, setPhase] = useState<Phase>("writing");
  const [showMeta, setShowMeta] = useState(false);
  const [wordStates, setWordStates] = useState<WordState[]>(() => words.map(() => "hidden"));
  const nextRequestedRef = useRef(false);

  useEffect(() => {
    const signal = { cancelled: false, timeouts: [] as ReturnType<typeof setTimeout>[] };

    const run = async () => {
      setWordStates(words.map(() => "hidden"));
      setShowMeta(false);
      setPhase("writing");
      nextRequestedRef.current = false;

      await animateWordWrite(words, setWordStates, signal);
      if (signal.cancelled) return;

      setShowMeta(true);
      setPhase("pause");

      const pauseBeforeNext = Math.max(0, PAUSE_MS - OVERLAP_INTO_PAUSE_MS);
      if (pauseBeforeNext > 0) {
        await wait(pauseBeforeNext, signal);
        if (signal.cancelled) return;
      }

      if (!nextRequestedRef.current) {
        nextRequestedRef.current = true;
        onRequestNext();
      }

      const pauseRemaining = PAUSE_MS - pauseBeforeNext;
      if (pauseRemaining > 0) {
        await wait(pauseRemaining, signal);
        if (signal.cancelled) return;
      }

      setShowMeta(false);
      await wait(META_HIDE_MS, signal);
      if (signal.cancelled) return;

      setPhase("erasing");
      await animateBitErase(words, setWordStates, signal);
      if (signal.cancelled) return;

      onComplete(instance.id);
    };

    void run();

    return () => {
      signal.cancelled = true;
      signal.timeouts.forEach(clearTimeout);
    };
  }, [instance.id, instance.testimonialIndex, words, onRequestNext, onComplete]);

  return (
    <div className={`hero-scribble ${SLOT_CLASS[instance.slotIndex % SLOT_COUNT]}`}>
      <div className="hero-scribble-inner">
        <div className={`hero-scribble-quote-wrap${phase === "writing" ? " is-writing" : ""}${phase === "erasing" ? " is-erasing" : ""}`}>
          <p className="hero-scribble-quote">
            {words.map((word, index) => (
              <span
                key={`${instance.id}-${index}`}
                className={`hero-scribble-word ${wordStateClass(wordStates[index] ?? "hidden")}`}
                style={
                  {
                    "--scribble-ms": `${scribbleMs(word)}ms`,
                    "--erase-ms": eraseTimings[index] ?? "360ms",
                  } as React.CSSProperties
                }
              >
                {word}
              </span>
            ))}
          </p>
        </div>
        <p className={`hero-scribble-meta${showMeta ? " is-visible" : ""}`}>{metaText}</p>
      </div>
    </div>
  );
}

export function HeroScribbleQuotes() {
  const [enabled, setEnabled] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  const [instances, setInstances] = useState<QuoteInstance[]>([]);
  const [reducedCycle, setReducedCycle] = useState(0);

  const nextIdRef = useRef(0);
  const nextTestimonialRef = useRef(0);
  const nextSlotRef = useRef(0);

  const spawnQuote = useCallback(() => {
    const id = nextIdRef.current;
    nextIdRef.current += 1;

    const testimonialIndex = nextTestimonialRef.current;
    nextTestimonialRef.current += 1;

    const slotIndex = nextSlotRef.current % SLOT_COUNT;
    nextSlotRef.current += 1;

    setInstances(prev => [...prev, { id, testimonialIndex, slotIndex }]);
  }, []);

  const handleRequestNext = useCallback(() => {
    spawnQuote();
  }, [spawnQuote]);

  const handleComplete = useCallback((id: number) => {
    setInstances(prev => prev.filter(item => item.id !== id));
  }, []);

  useEffect(() => {
    const update = () => setEnabled(window.innerWidth > 1024);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    if (!enabled || !reducedMotion) return;

    setReducedCycle(0);
    const id = setInterval(() => {
      setReducedCycle(prev => prev + 1);
    }, 3600);

    return () => clearInterval(id);
  }, [enabled, reducedMotion]);

  useEffect(() => {
    if (!enabled || reducedMotion) return;
    if (instances.length > 0) return;

    spawnQuote();
  }, [enabled, reducedMotion, instances.length, spawnQuote]);

  if (!enabled) return null;

  if (reducedMotion) {
    const quoteIndex = reducedCycle % HERO_POP_TESTIMONIALS.length;
    const slotIndex = reducedCycle % SLOT_COUNT;
    const quote = HERO_POP_TESTIMONIALS[quoteIndex];
    const words = splitQuoteWords(`"${quote.quote}"`);
    const metaText = quote.uni ? `${quote.name} · ${quote.uni}` : quote.name;

    return (
      <div className="hero-scribble-stage" id="hero-scribbles" aria-live="polite">
        <div className={`hero-scribble ${SLOT_CLASS[slotIndex]}`}>
          <div className="hero-scribble-inner">
            <div className="hero-scribble-quote-wrap">
              <p className="hero-scribble-quote">
                {words.map((word, index) => (
                  <span key={`${reducedCycle}-${index}`} className="hero-scribble-word is-visible">
                    {word}
                  </span>
                ))}
              </p>
            </div>
            <p className="hero-scribble-meta is-visible">{metaText}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="hero-scribble-stage" id="hero-scribbles" aria-live="polite">
      <svg className="hero-scribble-filters" aria-hidden>
        <defs>
          <filter id="hero-scribble-wobble" x="-8%" y="-8%" width="116%" height="116%">
            <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="2" seed="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.4" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      {instances.map(instance => (
        <ScribbleQuoteInstance key={instance.id} instance={instance} onRequestNext={handleRequestNext} onComplete={handleComplete} />
      ))}
    </div>
  );
}
