"use client";

/* eslint-disable react-hooks/set-state-in-effect */
import { type CSSProperties, type ReactNode, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { LandingNav } from "./LandingNav";
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

/** Fisher–Yates shuffle — new reveal order on every page load. */
function buildEnterOrder(n: number) {
  const idx = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  const order = new Array<number>(n);
  idx.forEach((noteIndex, position) => {
    order[noteIndex] = position;
  });
  return order;
}

function getColumnCount(width: number) {
  if (width <= 560) return 1;
  if (width <= 860) return 2;
  if (width <= 1200) return 3;
  return 4;
}

/** Round-robin into columns — same visual order CSS columns aim for, without Chrome bugs. */
function distributeToColumns<T>(items: T[], columnCount: number): T[][] {
  const columns = Array.from({ length: columnCount }, () => [] as T[]);
  items.forEach((item, index) => {
    columns[index % columnCount].push(item);
  });
  return columns;
}

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
      style={{ "--i": order } as CSSProperties}
      aria-label={`Read ${story.name}'s full story`}
    >
      <span
        className="ms-note__card"
        style={
          {
            "--tilt": `${tilt}deg`,
            "--note-bg": color.bg,
            "--note-ink": color.ink,
          } as CSSProperties
        }
      >
        <span className="ms-note__tape" aria-hidden />
        <StoryPhoto name={story.name} image={story.image} className="ms-note__badge" />
        <p className="ms-note__quote">&ldquo;{story.quote}&rdquo;</p>
        <span className="ms-note__foot">
          <span className="ms-note__name">{story.name}</span>
          <span className="ms-note__hint">Read story →</span>
        </span>
        <span className="ms-note__curl" aria-hidden />
      </span>
    </Link>
  );
}

export function MadStoriesPage() {
  useLandingBodyClass();
  useScrollReveal();
  const [columnCount, setColumnCount] = useState(4);
  const [enterOrder, setEnterOrder] = useState<number[] | null>(null);
  const [boardReady, setBoardReady] = useState(false);

  useEffect(() => {
    setColumnCount(getColumnCount(window.innerWidth));
    setEnterOrder(buildEnterOrder(MAD_STORIES.length));
    setBoardReady(true);

    const updateColumns = () => setColumnCount(getColumnCount(window.innerWidth));
    window.addEventListener("resize", updateColumns);
    return () => window.removeEventListener("resize", updateColumns);
  }, []);

  const storyColumns = useMemo(() => {
    const indexed = MAD_STORIES.map((story, index) => ({ story, index }));
    return distributeToColumns(indexed, columnCount);
  }, [columnCount]);

  return (
    <div className="landing-page mad-stories-page">
      <LandingNav active="/mad-stories" />

      {/* Headline only */}
      <section className="ms-hero">
        <div className="ms-hero__glow" aria-hidden />
        <div className="ms-hero__inner">
          <h1 className="ms-hero__hl">
            Behind every offer is
            <br />a <BrushWord>mad</BrushWord> story.
          </h1>
        </div>
      </section>

      {/* Stories board — sticky notes in explicit flex columns (cross-browser masonry) */}
      <section className="ms-board-section">
        {boardReady && enterOrder ? (
          <div className="ms-board">
            {storyColumns.map((columnStories, columnIndex) => (
              <div className="ms-board__col" key={columnIndex}>
                {columnStories.map(({ story, index }) => (
                  <StoryNote key={`${story.name}-${index}`} story={story} index={index} order={enterOrder[index]} />
                ))}
              </div>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
