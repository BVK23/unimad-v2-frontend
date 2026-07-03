"use client";

/* eslint-disable react-hooks/set-state-in-effect */
import { type CSSProperties, type ReactNode, useEffect, useState } from "react";
import { getSigninUrl } from "@/constants/landing-auth";
import Link from "next/link";
import { UnimadMark } from "./UnimadMark";
import { madStorySlug, MAD_STORIES, madStoryImageUrl, type MadStory } from "./madStories";
import { useLandingBodyClass, useScrollReveal } from "./useLandingEffects";

/** Sticky-note palette — deterministic per card to avoid hydration drift */
const NOTE_COLORS = [
  { bg: "#FFF1B8", ink: "#4a4014" },
  { bg: "#FFD9E0", ink: "#5a2a35" },
  { bg: "#D3E6FF", ink: "#20344e" },
  { bg: "#D5F2DD", ink: "#22432f" },
  { bg: "#FFE1C4", ink: "#553824" },
  { bg: "#E9DEFB", ink: "#3a3057" },
  { bg: "#CFF3EE", ink: "#1f4741" },
  { bg: "#FCE1B6", ink: "#553f18" },
];

const NOTE_TILTS = [-3, 2.2, -1.4, 3, -2.6, 1.6, -2, 2.8, -1, 3.4, -3.2, 1.2];

/**
 * Deterministic shuffled reveal order so the notes pop in one-by-one in a
 * random-looking sequence. Seeded + computed the same way on server & client,
 * so it never causes a hydration mismatch. `order[i]` = the position at which
 * note `i` appears.
 */
function buildEnterOrder(n: number, seed: number) {
  const idx = Array.from({ length: n }, (_, i) => i);
  let a = seed >>> 0;
  const rand = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  const order = new Array<number>(n);
  idx.forEach((noteIndex, position) => {
    order[noteIndex] = position;
  });
  return order;
}

const NOTE_ENTER_ORDER = buildEnterOrder(MAD_STORIES.length, 0x5eed);

/** "mad" with the same hand-drawn horizontal brush underline as the homepage. */
function BrushWord({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setReady(true);
      return;
    }
    const t = window.setTimeout(() => setReady(true), 360);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <span className="mark-red">
      {children}
      <span className={`mark-red-stroke${ready ? " is-ready" : ""}`} aria-hidden="true">
        <span className="mark-red-stroke-inner">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/landing/hero-brush-stroke.svg" alt="" width={526} height={11} decoding="async" />
        </span>
      </span>
    </span>
  );
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map(part => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function StoryPhoto({ name, image, className }: { name: string; image: string; className: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className={`${className} ${className}--fallback`} aria-hidden>
        <span>{getInitials(name)}</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img className={className} src={madStoryImageUrl(image)} alt={name} loading="lazy" decoding="async" onError={() => setFailed(true)} />
  );
}

function StoryNote({ story, index, order }: { story: MadStory; index: number; order: number }) {
  const color = NOTE_COLORS[index % NOTE_COLORS.length];
  const tilt = NOTE_TILTS[index % NOTE_TILTS.length];
  const slug = madStorySlug(story.name);

  return (
    <Link
      href={`/mad-stories/${slug}`}
      className="ms-note"
      style={
        {
          "--tilt": `${tilt}deg`,
          "--note-bg": color.bg,
          "--note-ink": color.ink,
          "--i": order,
        } as CSSProperties
      }
      aria-label={`Read ${story.name}'s full story`}
    >
      <span className="ms-note__tape" aria-hidden />
      <StoryPhoto name={story.name} image={story.image} className="ms-note__badge" />
      <p className="ms-note__quote">&ldquo;{story.quote}&rdquo;</p>
      <span className="ms-note__foot">
        <span className="ms-note__name">{story.name}</span>
        <span className="ms-note__hint">Read story →</span>
      </span>
      <span className="ms-note__curl" aria-hidden />
    </Link>
  );
}

export function MadStoriesPage() {
  useLandingBodyClass();
  useScrollReveal();

  return (
    <div className="landing-page mad-stories-page">
      <nav className="nav">
        <div className="nav-inner">
          <Link href="/" className="nav-brand">
            <UnimadMark />
            <span className="nav-brand-name">unimad</span>
          </Link>
          <ul className="nav-links">
            <li>
              <Link href="/#product">Product</Link>
            </li>
            <li>
              <Link href="/mad-stories">Success Stories</Link>
            </li>
            <li>
              <Link href="/unicoach">Unicoach</Link>
            </li>
          </ul>
          <Link href={getSigninUrl()} className="btn nav-login">
            Login
          </Link>
        </div>
      </nav>

      {/* Headline only */}
      <section className="ms-hero">
        <div className="ms-hero__glow" aria-hidden />
        <div className="ms-hero__inner">
          <h1 className="ms-hero__hl">
            Every offer starts
            <br />
            with a <BrushWord>mad</BrushWord> story.
          </h1>
        </div>
      </section>

      {/* Stories board — sticky notes */}
      <section className="ms-board-section">
        <div className="ms-board">
          {MAD_STORIES.map((story, index) => (
            <StoryNote key={`${story.name}-${index}`} story={story} index={index} order={NOTE_ENTER_ORDER[index]} />
          ))}
        </div>
      </section>
    </div>
  );
}
