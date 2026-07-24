"use client";

/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState, type ReactNode } from "react";
import { UnimadLogo } from "@/components/unimad-logo";
import { getSigninUrl } from "@/constants/landing-auth";
import { Instagram, Linkedin, Youtube } from "lucide-react";
import Link from "next/link";
import { LandingNav } from "./LandingNav";
import { StarfieldBackground } from "./StarfieldBackground";
import { useLandingBodyClass, useScrollReveal } from "./useLandingEffects";

/** "international students" with the same hand-drawn brush underline as the homepage hero. */
function BrushUnderline({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setReady(true);
      return;
    }
    const t = window.setTimeout(() => setReady(true), 420);
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

type StoryBlock = { type: "p"; text: string } | { type: "accent"; lines: string[] };

/** The story, grouped into bands. Alternating grey/white keeps the read from
 *  feeling like one tiring wall of text. Punchy lines render as centered accents. */
const SECTIONS: { grey?: boolean; blocks: StoryBlock[] }[] = [
  {
    blocks: [
      {
        type: "p",
        text: "Unimad was created by people who know what this journey feels like, because we have lived it ourself.",
      },
      {
        type: "p",
        text: "We spent months refreshing inboxes, rewriting resumes, wondering why applications didn't convert an interview. A lot of times we felt if moving abroad was a mistake.",
      },
      {
        type: "p",
        text: "Eventually we realised that finding a job wasn't just about having the right skills. It was about understanding how to position yourself in a completely different job market.",
      },
      { type: "accent", lines: ["Surprisingly, nobody was teaching that."] },
    ],
  },
  {
    grey: true,
    blocks: [
      {
        type: "p",
        text: "Most platforms focus on one aspect of job search. Resume, LinkedIn, cover letters, job boards, or interview preparation. There was no single system that could connect all of this.",
      },
      { type: "accent", lines: ["That's why we built Unimad."] },
    ],
  },
  {
    blocks: [
      {
        type: "p",
        text: "A single platform that brings every aspect of job search together, so international students can stop guessing and start applying with confidence.",
      },
      {
        type: "p",
        text: "Using Unimad you can fix your role, build your resume, optimise LinkedIn, develop a portfolio, search for visa-sponsored jobs and prepare for interviews, all in one place.",
      },
    ],
  },
  {
    grey: true,
    blocks: [
      { type: "accent", lines: ["We're building something we wish existed when we started our journeys."] },
      {
        type: "p",
        text: "Because we believe no student should have to figure out this journey alone.",
      },
      {
        type: "accent",
        lines: ["Every mad story starts somewhere.", "We hope yours starts here."],
      },
    ],
  },
];

type Founder = { name: string; img: string; url: string };

const FOUNDERS: Founder[] = [
  { name: "Sharath Leelakrishnan", img: "/images/landing/founders/sharath.png", url: "https://www.linkedin.com/in/shaki1506/" },
  { name: "Varun Krishna Bhaskaran", img: "/images/landing/founders/varun.png", url: "https://www.linkedin.com/in/varun-bvk/" },
  { name: "Abhijit Suresh", img: "/images/landing/founders/abhijit.png", url: "https://www.linkedin.com/in/abhijitsuresh10/" },
  { name: "Naman Goel", img: "/images/landing/founders/naman.png", url: "https://www.linkedin.com/in/naman-goel98/" },
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map(part => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/** Tiny circular founder portrait, with an initials fallback if the photo is missing. */
function FounderAvatar({ name, img }: { name: string; img: string }) {
  const [failed, setFailed] = useState(false);

  return (
    <span className="about-founder__frame">
      {failed ? (
        <span className="about-founder__initials" aria-hidden>
          {getInitials(name)}
        </span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={img} alt={name} loading="lazy" decoding="async" onError={() => setFailed(true)} />
      )}
    </span>
  );
}

function StoryBand({ blocks }: { blocks: StoryBlock[] }) {
  return (
    <div className="about-prose reveal reveal--fade">
      {blocks.map((block, i) =>
        block.type === "accent" ? (
          <p key={i} className="about-accent">
            {block.lines.map((line, j) => (
              <span key={j} className="about-accent__line">
                {line}
              </span>
            ))}
          </p>
        ) : (
          <p key={i} className="about-p">
            {block.text}
          </p>
        )
      )}
    </div>
  );
}

export function AboutPage() {
  useLandingBodyClass();
  useScrollReveal();

  return (
    <div className="landing-page about-page">
      <LandingNav active="/about" />

      {/* Hero — headline only */}
      <section className="about-hero">
        <div className="about-hero__glow" aria-hidden />
        <div className="about-hero__inner">
          <p className="eyebrow eyebrow-blue about-eyebrow">About Us</p>
          <h1 className="about-hero__hl">
            Built by international students,
            <br />
            for <BrushUnderline>international students</BrushUnderline>.
          </h1>
        </div>
      </section>

      {/* Story — alternating bands */}
      {SECTIONS.map((section, i) => (
        <section key={i} className={`about-band${section.grey ? " about-band--grey" : ""}`}>
          <StoryBand blocks={section.blocks} />
        </section>
      ))}

      {/* Founders — tiny circle frames */}
      <section className="about-band about-founders-band">
        <div className="about-prose reveal reveal--fade">
          <p className="eyebrow eyebrow-blue about-eyebrow">The founders</p>
          <p className="about-founders__intro">We quit our jobs to help you land one.</p>
          <ul className="about-founders">
            {FOUNDERS.map(f => (
              <li key={f.name}>
                <a className="about-founder" href={f.url} target="_blank" rel="noreferrer" aria-label={`${f.name} on LinkedIn`}>
                  <FounderAvatar name={f.name} img={f.img} />
                  <span className="about-founder__name">{f.name.split(" ")[0]}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Closing — dark star card + footer (shared with the homepage) */}
      <section className="closing closing--boxed">
        <div className="closing-box closing--stars reveal reveal--fade">
          <StarfieldBackground />
          <div className="container">
            <div className="closing-band-inner reveal-stagger">
              <h2 className="closing-hl closing-hl--light">We&apos;re on a mission to create a million mad stories.</h2>
              <p className="closing-sub closing-sub--light">
                Your story could be the next. Whether you&apos;re applying for your first internship or your 500th job, Unimad is here to
                help you build a job search system that works.
              </p>
              <div className="closing-ctas">
                <Link href={getSigninUrl()} className="btn btn-solid about-cta-btn">
                  Get started now
                </Link>
              </div>
            </div>
          </div>

          <footer className="landing-footer">
            <div className="footer-inner">
              <div className="footer-main">
                <Link href="/" className="footer-brand" aria-label="Unimad home">
                  <UnimadLogo className="footer-logo" />
                </Link>
                <div className="footer-socials" aria-label="Unimad on social media">
                  <a href="https://www.linkedin.com/company/unimad" target="_blank" rel="noreferrer" aria-label="Unimad on LinkedIn">
                    <Linkedin size={18} strokeWidth={1.75} />
                  </a>
                  <a href="https://www.instagram.com/unimad_ai" target="_blank" rel="noreferrer" aria-label="Unimad on Instagram">
                    <Instagram size={18} strokeWidth={1.75} />
                  </a>
                  <a href="https://www.youtube.com/@unimad_ai" target="_blank" rel="noreferrer" aria-label="Unimad on YouTube">
                    <Youtube size={18} strokeWidth={1.75} />
                  </a>
                </div>
              </div>
              <nav className="footer-nav" aria-label="Footer">
                <Link href="/mad-stories">Mad Stories</Link>
                <Link href="/unicoach">Unicoach</Link>
                <Link href="/about" prefetch={false}>
                  About Us
                </Link>
                <a href="mailto:grow@unimad.ai">Contact Us</a>
                <Link href="/privacy" prefetch={false}>
                  Privacy Policy
                </Link>
                <Link href="/terms" prefetch={false}>
                  Terms &amp; Conditions
                </Link>
              </nav>
            </div>
          </footer>
        </div>
      </section>
    </div>
  );
}
