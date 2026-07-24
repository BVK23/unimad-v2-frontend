"use client";

import { useRef, useState, type CSSProperties } from "react";
import { UnimadLogo } from "@/components/unimad-logo";
import { getSigninUrl } from "@/constants/landing-auth";
import { Instagram, Linkedin, Youtube } from "lucide-react";
import Link from "next/link";
import { LandingNav } from "./LandingNav";
import { StarfieldBackground } from "./StarfieldBackground";
import { TrustMarquee } from "./TrustMarquee";
import { MAD_STORIES, madStoryImageUrl } from "./madStories";
import { useDiscoveryBooking } from "./useDiscoveryBooking";
import { useLandingBodyClass, useScrollReveal, useReadReveal } from "./useLandingEffects";

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
    name: "Profile Foundation",
    tagline: "Become visible to recruiters",
    price: "£99",
    period: "module",
    features: ["Fix your role", "Build a resume", "LinkedIn banner", "LinkedIn headline", "LinkedIn Summary"],
    cta: "Book your session",
    variant: "module",
  },
  {
    name: "Applications Strategy",
    tagline: "Start applying targeted",
    price: "£85",
    period: "module",
    features: ["Sourcing roles", "Referrals mastery", "Quality applications", "Cold emails that convert", "A daily application system"],
    cta: "Book your session",
    variant: "module",
  },
  {
    name: "Interview Mastery",
    tagline: "Walk in prepared to win",
    price: "£77",
    period: "module",
    features: [
      "Interview prompts",
      "30-60-90 day plans",
      "STAR-method answers",
      "Your Value Proposition Doc",
      "Sponsorship negotiation scripts",
    ],
    cta: "Book your session",
    variant: "module",
  },
];

const DISCOVERY: Plan = {
  name: "Strategy session",
  tagline: "A free 1-on-1 call with your coach who will give you a personalised strategy for your profile.",
  price: "£0",
  original: "£85",
  period: "one call",
  features: ["Niche Discovery", "Resume tips", "LinkedIn optimisation", "Entire job search playbook"],
  cta: "Book your free strategy session",
  variant: "free",
  note: "No credit card required",
};

const FULL_SYSTEM: Plan = {
  name: "The Full Unicoach System",
  tagline: "All the modules to get you hired.",
  price: "£199",
  original: "£340",
  period: "one-time",
  features: [
    "All 3 modules included",
    "1-on-1 mentorship",
    "Lifetime community access",
    "24/7 career-coach support",
    "The Accountability system",
  ],
  cta: "Unlock the Unicoach system",
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
    title: "We fix your role, resume, and LinkedIn",
    body: "Your Unicoach will help you lock in your niche, develop a killer resume, and completely revamp your LinkedIn profile.",
  },
  {
    n: "02",
    title: "We introduce you to Quality Applications Framework",
    body: "From choosing the right roles to tailoring your resume, cover letter, cold emails, followups, we build a repeatable application process.",
  },
  {
    n: "03",
    title: "We prep you to convert interviews into offers",
    body: "From likely interview questions and STAR methodologies to your Value Proposition Doc, we help you walk into interviews with clarity and confidence.",
  },
  {
    n: "04",
    title: "Access to Unicoach community",
    body: "This is where we become your accountability partner after building your job search system. You get to search for jobs with other like minded students in a similar journey.",
  },
];

const WHY_TEXT =
  "Getting rejected doesn't mean you're the wrong candidate. Every year 1000s of international students move abroad believing more applications are the answer, so they keep applying. Unicoach rebuilds your job search system from ground up, defining your niche, improving your positioning, and building a system that gives recruiters a reason to notice you.";

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

/** Circular review avatar — shows the alumnus photo, falls back to initials. */
function ReviewAvatar({ name, image }: { name: string; image: string }) {
  const [failed, setFailed] = useState(false);

  if (failed || !image) {
    return <div className="ravatar">{getInitials(name)}</div>;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className="ravatar ravatar--photo"
      src={madStoryImageUrl(image)}
      alt={name}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
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
  const whyRef = useRef<HTMLParagraphElement>(null);
  useReadReveal(whyRef);
  const [openFaq, setOpenFaq] = useState(0);

  const ribbonItems = [...MAD_STORIES.slice(0, 16), ...MAD_STORIES.slice(0, 16)];

  return (
    <div className="landing-page unicoach-page">
      {bookingModal}

      <LandingNav active="/unicoach" solidTrigger=".uc-hero" />

      {/* Hero */}
      <section className="ms-hero uc-hero uc-hero--gold">
        <div className="ms-hero__glow" aria-hidden />
        <div className="uc-hero__grid" aria-hidden />
        <div className="ms-hero__inner">
          <h1 className="ms-hero__hl uc-hero__hl">Unimad Career Positioning System</h1>
          <p className="ms-hero__sub">
            Done-with-you coaching. In personalised 1-on-1 sessions, our experts help you refine your niche, resume, LinkedIn, portfolio,
            applications and interview strategy with you.
          </p>

          <div className="ms-hero__stats">
            <div className="ms-hero__stat">
              <span className="ms-hero__stat-num ms-hero__stat-num--blue">$4M+</span>
              <span className="ms-hero__stat-lbl">in job offers</span>
            </div>
            <div className="ms-hero__stat">
              <span className="ms-hero__stat-num">1000+</span>
              <span className="ms-hero__stat-lbl">Happy students</span>
            </div>
            <div className="ms-hero__stat">
              <span className="ms-hero__stat-num">250+</span>
              <span className="ms-hero__stat-lbl">Mad Stories</span>
            </div>
            <div className="ms-hero__stat">
              <span className="ms-hero__stat-num">10k+</span>
              <span className="ms-hero__stat-lbl">Community</span>
            </div>
          </div>

          <div className="ms-hero__ctas">
            <button
              type="button"
              className="masterclass-gold-btn unicoach-gold-cta uc-hero__cta"
              onClick={() => void openDiscoveryBooking()}
            >
              Book your strategy session
            </button>
            <a href="#how" className="btn btn-outline-light" style={{ padding: "13px 28px", fontSize: "15px" }}>
              See how it works
            </a>
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
            <h2 className="uc-section-hl">3 calls. One coach. Your whole job search system built for you.</h2>
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
            <h2 className="uc-section-hl">Pay only if you want to move forward after your strategy session.</h2>
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
                <p className="uc-plan__note">Everything included</p>
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
                <ReviewAvatar name={t.name} image={t.image} />
                <div>
                  <p className="rquote">&quot;{t.quote}&quot;</p>
                  <p className="rmeta">{t.name}</p>
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
              <h2 className="closing-hl closing-hl--light">
                You don&apos;t need to get picked a thousand times. You need to get picked once.
              </h2>
              <p className="closing-sub closing-sub--light">
                That one offer changes everything. Do it yourself, free using Unimad, or fast-track it with an expert.
              </p>
              <div className="closing-ctas">
                <Link href={getSigninUrl()} className="btn btn-outline-light">
                  Start free at Unimad
                </Link>
                <button type="button" className="btn btn-solid" onClick={() => void openDiscoveryBooking()}>
                  Book your strategy session
                </button>
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
