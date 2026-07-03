"use client";

import { useRef, useState, type CSSProperties } from "react";
import { getSigninUrl, MASTERCLASS_ORGANIC_PATH } from "@/constants/landing-auth";
import Link from "next/link";
import { StarfieldBackground } from "./StarfieldBackground";
import { TrustMarquee } from "./TrustMarquee";
import { UnimadMark } from "./UnimadMark";
import { TESTIMONIALS } from "./testimonials";
import { useDiscoveryBooking } from "./useDiscoveryBooking";
import { useLandingBodyClass, useNavSolid, useScrollReveal, useReadReveal } from "./useLandingEffects";

type PlanVariant = "free" | "module" | "full";

type Plan = {
  name: string;
  tagline: string;
  price: string;
  original?: string;
  period: string;
  features: string[];
  cta: string;
  variant: PlanVariant;
  note?: string;
  badge?: string;
};

const MODULES: Plan[] = [
  {
    name: "LinkedIn Branding",
    tagline: "Turn invisible into inbound.",
    price: "£77",
    period: "module",
    features: [
      "DP, headline & about rewritten",
      "Cover photo designed for you",
      "A monthly content engine",
      "The comments strategy",
      "Outbound that reaches recruiters",
    ],
    cta: "Add this module",
    variant: "module",
  },
  {
    name: "Application Strategy",
    tagline: "Stop applying. Start targeting.",
    price: "£85",
    period: "module",
    features: [
      "Tailored applications that land",
      "A daily application system",
      "Referral mastery",
      "Cold emails that convert",
      "Portfolio building & tracking",
    ],
    cta: "Add this module",
    variant: "module",
    badge: "Most popular",
  },
  {
    name: "Interview Mastery",
    tagline: "Walk in ready to win.",
    price: "£99",
    period: "module",
    features: [
      "Interview prep prompts",
      "STAR-method answer library",
      "Your Value Proposition Doc",
      "30-60-90 day plans",
      "Sponsorship negotiation scripts",
    ],
    cta: "Add this module",
    variant: "module",
  },
];

const DISCOVERY: Plan = {
  name: "Discovery Call",
  tagline: "A free 1-on-1 with a coach who has placed 200+ international students. Your positioning, mapped live.",
  price: "£0",
  original: "£85",
  period: "one call",
  features: [
    "ATS hacks & role mapping",
    "Niche discovery",
    "Base resume rebuilt live",
    "A job-search playbook",
    "A personalised strategy you keep",
  ],
  cta: "Book a free discovery call",
  variant: "free",
  note: "No credit card required",
};

const FULL_SYSTEM: Plan = {
  name: "The Full System",
  tagline: "All four modules, one coach, until you're hired.",
  price: "£199",
  original: "£340",
  period: "one-time",
  features: [
    "All 4 modules included",
    "1-on-1 mentorship",
    "Lifetime community access",
    "Exclusive live webinars",
    "24×7 career-coach support",
    "The credibility system",
  ],
  cta: "Get the full system",
  variant: "full",
  badge: "Best value",
};

const discountPct = (was?: string, now?: string) => {
  const w = Number((was ?? "").replace(/[^0-9.]/g, ""));
  const n = Number((now ?? "").replace(/[^0-9.]/g, ""));
  return w > n && w ? Math.round((1 - n / w) * 100) : 0;
};

type Step = {
  n: string;
  title: string;
  body: string;
};

const STEPS: Step[] = [
  {
    n: "01",
    title: "We fix your role & resume, live",
    body: "A coach helps you lock your niche and rebuilds your resume with you, while you watch exactly how we work.",
  },
  {
    n: "02",
    title: "We rebuild how recruiters see you",
    body: "Profile picture, cover, headline and about rewritten; the right network built; comments and a content engine that turn you from invisible to inbound.",
  },
  {
    n: "03",
    title: "We run real applications with you",
    body: "We build your portfolio, then apply the quality checklist together: tailored resume, cold emails, referrals and follow-up that beats spray-and-pray.",
  },
  {
    n: "04",
    title: "We prep you to convert",
    body: "Every likely question, STAR-method stories and your Value Proposition Document. You walk in as the candidate who's already done the work.",
  },
];

const WHY_TEXT =
  "It was never your skill. A quarter of a million students move abroad each year running the same broken playbook: applying blind, tailoring CVs, hearing nothing back. Unicoach rebuilds the system with you, one call at a time, until recruiters finally see your value.";

const FAQS: { q: string; a: string }[] = [
  {
    q: "What's the difference between Unimad and Unicoach?",
    a: "Unimad, the platform, the AI and the entire job-search system, is completely free. Unicoach is the paid part: a coach doing it with you, one-to-one, instead of leaving you to figure it out alone.",
  },
  {
    q: "Is the first call really free?",
    a: "Yes, genuinely free and no card required. We fix your role and build your resume on the call while you watch exactly how we work. If you feel it, we keep going. If you don't, we're still friends.",
  },
  {
    q: "What actually happens across the calls?",
    a: "Four 1-on-1 calls where a coach finalises your niche, rebuilds your resume and LinkedIn, builds your portfolio, runs a real application live with you, and preps you for interviews end to end.",
  },
  {
    q: "Do I have to buy the whole system?",
    a: "No. Start with any single module from £77, or take everything together as the Full System for £199 (normally £340). Every journey begins with the free discovery call.",
  },
  {
    q: "How fast will I see results?",
    a: "Most students start landing interviews in around 45 days. We land you interviews faster, then train you to crack them, with a 92% success rate across 5,000+ students.",
  },
  {
    q: "I've already applied to hundreds of jobs. Will this help?",
    a: "That's exactly when it helps most. The problem is rarely your skill. It's how you're positioned. We rebuild that with you so recruiters finally read your value.",
  },
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map(part => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function PlanCard({ plan, onBook }: { plan: Plan; onBook: () => void }) {
  const isFull = plan.variant === "full";
  return (
    <article className={`uc-plan uc-plan--${plan.variant} reveal`}>
      {plan.badge && <span className="uc-plan__badge">{plan.badge}</span>}
      <div className="uc-plan__head">
        <h3 className="uc-plan__name">{plan.name}</h3>
        <p className="uc-plan__tagline">{plan.tagline}</p>
      </div>
      <div className="uc-plan__price">
        {plan.original && <span className="uc-plan__price-was">{plan.original}</span>}
        <span className="uc-plan__price-now">{plan.price}</span>
        <span className="uc-plan__price-period">/ {plan.period}</span>
      </div>
      <ul className="uc-plan__features">
        {plan.features.map(f => (
          <li key={f}>{f}</li>
        ))}
      </ul>
      {plan.variant === "free" ? (
        <button type="button" className="masterclass-gold-btn uc-plan__cta uc-plan__cta--pill uc-plan__cta--gold" onClick={onBook}>
          {plan.cta}
        </button>
      ) : (
        <button type="button" className={`btn uc-plan__cta ${isFull ? "btn-solid" : "btn-outline-dark"}`} onClick={onBook}>
          {plan.cta}
        </button>
      )}
      {plan.note && <p className="uc-plan__note">{plan.note}</p>}
    </article>
  );
}

export function UnicoachPage() {
  useLandingBodyClass();
  useScrollReveal();
  const { openDiscoveryBooking, bookingModal } = useDiscoveryBooking();
  const navSolid = useNavSolid(".uc-hero");
  const whyRef = useRef<HTMLParagraphElement>(null);
  useReadReveal(whyRef);
  const [openFaq, setOpenFaq] = useState(0);

  const ribbonItems = [...TESTIMONIALS.slice(0, 16), ...TESTIMONIALS.slice(0, 16)];

  return (
    <div className="landing-page unicoach-page">
      {bookingModal}

      <nav className={`nav${navSolid ? " nav--solid" : ""}`}>
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
              <Link href="/unicoach" aria-current="page">
                Unicoach
              </Link>
            </li>
          </ul>
          <Link href={getSigninUrl()} className="btn nav-login">
            Login
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="ms-hero uc-hero uc-hero--gold">
        <div className="ms-hero__glow" aria-hidden />
        <div className="uc-hero__grid" aria-hidden />
        <div className="ms-hero__inner">
          <p className="eyebrow ms-hero__eyebrow uc-hero__eyebrow">The Unimad Career Positioning System</p>
          <h1 className="ms-hero__hl uc-hero__hl">
            Recruiters can&apos;t ignore a job search <span className="masterclass-gold-text">built with you.</span>
          </h1>
          <p className="ms-hero__sub">
            Unicoach is done-with-you coaching — 1-on-1 calls where a coach fixes your niche, resume, LinkedIn, portfolio, applications and
            interviews with you, not for you.
          </p>

          <div className="ms-hero__stats">
            <div className="ms-hero__stat">
              <span className="ms-hero__stat-num ms-hero__stat-num--blue">5,000+</span>
              <span className="ms-hero__stat-lbl">students helped</span>
            </div>
            <div className="ms-hero__stat">
              <span className="ms-hero__stat-num">92%</span>
              <span className="ms-hero__stat-lbl">success rate</span>
            </div>
            <div className="ms-hero__stat">
              <span className="ms-hero__stat-num">4.9★</span>
              <span className="ms-hero__stat-lbl">from 1,000+ students</span>
            </div>
            <div className="ms-hero__stat">
              <span className="ms-hero__stat-num">45 days</span>
              <span className="ms-hero__stat-lbl">to first interviews</span>
            </div>
          </div>

          <div className="ms-hero__ctas">
            <button
              type="button"
              className="masterclass-gold-btn unicoach-gold-cta uc-hero__cta"
              onClick={() => void openDiscoveryBooking()}
            >
              Book your free discovery call
            </button>
            <Link href={MASTERCLASS_ORGANIC_PATH} className="btn btn-outline-light" style={{ padding: "13px 28px", fontSize: "15px" }}>
              See how it works
            </Link>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="uc-trust">
        <p className="trust-label">our students now work at</p>
        <TrustMarquee />
      </section>

      {/* Why Unicoach exists — one statement that lights up word-by-word as you read down */}
      <section className="uc-why">
        <div className="container">
          <p className="uc-why__text" ref={whyRef}>
            {WHY_TEXT.split(" ").map((word, i) => (
              <span className="uc-why__word" key={i}>
                {word + " "}
              </span>
            ))}
          </p>
        </div>
      </section>

      {/* How Unicoach works — sticky stack: step cards rise from below and land on the title card */}
      <section className="uc-steps" id="how">
        <div className="uc-stack">
          <div className="uc-stack__card uc-stack__card--head" style={{ "--i": 0 } as CSSProperties}>
            <p className="eyebrow eyebrow-blue">How Unicoach works</p>
            <h2 className="uc-section-hl">Four calls. One coach. Your whole system, built with you.</h2>
          </div>
          {STEPS.map((step, i) => (
            <article key={step.n} className="uc-stack__card" style={{ "--i": i + 1 } as CSSProperties}>
              <span className="uc-stack__num">{i + 1}</span>
              <h3 className="uc-stack__title">{step.title}</h3>
              <p className="uc-stack__body">{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="uc-pricing" id="pricing">
        <div className="container">
          <div className="uc-section-head reveal">
            <p className="eyebrow eyebrow-blue">Pricing</p>
            <h2 className="uc-section-hl">Start free. Pay only for what moves you forward.</h2>
          </div>

          <div className="uc-plan uc-plan--banner uc-plan--free reveal">
            <div
              className="masterclass-corner-ribbon masterclass-corner-ribbon--discount pointer-events-none absolute right-0 top-0 z-30"
              aria-hidden
            >
              <span className="masterclass-corner-ribbon__text masterclass-corner-ribbon__text--gold">Free</span>
            </div>
            <div className="uc-banner__main">
              <div className="uc-banner__intro">
                <h3 className="uc-plan__name">{DISCOVERY.name}</h3>
                <p className="uc-plan__tagline">{DISCOVERY.tagline}</p>
                <ul className="uc-plan__features uc-plan__features--inline">
                  {DISCOVERY.features.map(f => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </div>
              <div className="uc-banner__buy">
                <div className="uc-plan__price">
                  {DISCOVERY.original && <span className="uc-plan__price-was">{DISCOVERY.original}</span>}
                  <span className="uc-plan__price-now">{DISCOVERY.price}</span>
                </div>
                <button
                  type="button"
                  className="masterclass-black-btn uc-plan__cta uc-plan__cta--pill"
                  onClick={() => void openDiscoveryBooking()}
                >
                  {DISCOVERY.cta}
                </button>
                {DISCOVERY.note && <p className="uc-plan__note">{DISCOVERY.note}</p>}
              </div>
            </div>
          </div>

          <div className="uc-modules-grid">
            {MODULES.map(plan => (
              <PlanCard key={plan.name} plan={plan} onBook={() => void openDiscoveryBooking()} />
            ))}
          </div>

          <div className="uc-plan uc-plan--banner uc-plan--full reveal">
            {FULL_SYSTEM.badge && <span className="uc-plan__badge">{FULL_SYSTEM.badge}</span>}
            <div
              className="masterclass-corner-ribbon masterclass-corner-ribbon--discount pointer-events-none absolute right-0 top-0 z-30"
              aria-hidden
            >
              <span className="masterclass-corner-ribbon__text masterclass-corner-ribbon__text--green">
                {discountPct(FULL_SYSTEM.original, FULL_SYSTEM.price)}% off
              </span>
            </div>
            <div className="uc-banner__main">
              <div className="uc-banner__intro">
                <h3 className="uc-plan__name">{FULL_SYSTEM.name}</h3>
                <p className="uc-plan__tagline">{FULL_SYSTEM.tagline}</p>
                <ul className="uc-plan__features uc-plan__features--inline uc-plan__features--full">
                  {FULL_SYSTEM.features.map(f => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </div>
              <div className="uc-banner__buy">
                <div className="uc-plan__price">
                  {FULL_SYSTEM.original && <span className="uc-plan__price-was">{FULL_SYSTEM.original}</span>}
                  <span className="uc-plan__price-now">{FULL_SYSTEM.price}</span>
                  <span className="uc-plan__price-period">/ {FULL_SYSTEM.period}</span>
                </div>
                <button
                  type="button"
                  className="masterclass-gold-btn uc-plan__cta uc-plan__cta--pill uc-plan__cta--gold"
                  onClick={() => void openDiscoveryBooking()}
                >
                  {FULL_SYSTEM.cta}
                </button>
                <p className="uc-plan__note">Everything, one price</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Proof ribbon */}
      <section className="ribbon uc-proof">
        <p className="ribbon-label">4.9★ from 1,000+ students</p>
        <div className="marquee-outer">
          <div className="ribbon-track">
            {ribbonItems.map((t, i) => (
              <div className="rcard" key={`${t.name}-${i}`}>
                <div className="ravatar">{getInitials(t.name)}</div>
                <div>
                  <p className="rquote">&quot;{t.quote}&quot;</p>
                  <p className="rmeta">
                    {t.name}
                    {t.uni ? ` · ${t.uni}` : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="uc-faq">
        <div className="container">
          <div className="uc-section-head reveal">
            <p className="eyebrow eyebrow-blue">FAQ</p>
            <h2 className="uc-section-hl">Questions, answered.</h2>
          </div>
          <div className="uc-faq__list">
            {FAQS.map((item, index) => {
              const isOpen = openFaq === index;
              return (
                <div className={`uc-faq__item ${isOpen ? "is-open" : ""}`} key={item.q}>
                  <button type="button" className="uc-faq__q" aria-expanded={isOpen} onClick={() => setOpenFaq(isOpen ? -1 : index)}>
                    <span>{item.q}</span>
                    <span className="uc-faq__icon" aria-hidden>
                      {isOpen ? "−" : "+"}
                    </span>
                  </button>
                  {isOpen && <p className="uc-faq__a">{item.a}</p>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Closing — boxed starfield card (footer shares the same background) */}
      <section className="closing closing--boxed">
        <div className="closing-box closing--stars reveal reveal--fade">
          <StarfieldBackground />
          <div className="container">
            <div className="closing-band-inner reveal-stagger">
              <h2 className="closing-hl closing-hl--light">You don&apos;t need to get picked a thousand times.</h2>
              <p className="closing-sub closing-sub--light">
                You need to get picked once, and that one offer changes everything. Do it yourself, free, at unimad.ai, or fast-track it
                with us. Your first call is free: we&apos;ll fix your role, build your resume, and tell you honestly whether Unicoach is
                right for you.
              </p>
              <div className="closing-ctas">
                <Link href={getSigninUrl()} className="btn btn-outline-light">
                  Start free at Unimad
                </Link>
                <button type="button" className="masterclass-gold-btn closing-gold-cta" onClick={() => void openDiscoveryBooking()}>
                  Book your free discovery call
                </button>
              </div>
            </div>
          </div>

          <footer className="landing-footer">
            <div className="footer-inner">
              <div className="footer-brand">
                <UnimadMark />
                <span>unimad</span>
              </div>
              <span className="footer-url">www.unimad.ai</span>
              <span className="footer-tag">Stage 5 · v16 · Jul 2026</span>
            </div>
          </footer>
        </div>
      </section>
    </div>
  );
}
