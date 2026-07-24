"use client";

import { UnimadLogo } from "@/components/unimad-logo";
import { getSigninUrl, MASTERCLASS_ORGANIC_PATH, MASTERCLASS_PATH } from "@/constants/landing-auth";
import { Instagram, Linkedin, Youtube } from "lucide-react";
import Link from "next/link";
import { HeroScribbleQuotes } from "./HeroScribbleQuotes";
import { LandingNav } from "./LandingNav";
import { MarkRed } from "./MarkRed";
import { ProductShowcase } from "./ProductShowcase";
import { StarfieldBackground } from "./StarfieldBackground";
import { StoriesSection } from "./StoriesSection";
import { TrustMarquee } from "./TrustMarquee";
import { HERO_POP_TESTIMONIALS } from "./testimonials";
import { useCyclingQuote, useLandingBodyClass, useScrollReveal } from "./useLandingEffects";

export function LandingPage() {
  useLandingBodyClass();
  useCyclingQuote();
  useScrollReveal();

  return (
    <div className="landing-page">
      <LandingNav />

      {/* Hero + trust — single viewport */}
      <div className="hero-viewport">
        <section className="hero" id="hero">
          <HeroScribbleQuotes />
          <div className="hero-text-glow" />
          <div className="hero-content">
            <h1 className="hero-hl">
              <span className="hero-hl-l1">The platform to</span>
              <span className="hero-hl-l2">
                <MarkRed />
              </span>
            </h1>
            <div className="hero-ctas">
              <Link href={getSigninUrl()} className="btn btn-solid" style={{ padding: "13px 28px", fontSize: "15px" }}>
                Start now for free
              </Link>
              <Link
                href={MASTERCLASS_PATH}
                className="btn btn-outline-dark"
                style={{ padding: "13px 28px", fontSize: "15px", fontWeight: 500 }}
              >
                Book your strategy session
              </Link>
            </div>
            <div className="hero-cycling-quote" id="hero-cq">
              <p className="hcq-quote" id="hcq-quote">
                &quot;{HERO_POP_TESTIMONIALS[0].quote}&quot;
              </p>
              <div className="hcq-meta">
                <div className="hcq-avatar" id="hcq-av">
                  <img src={HERO_POP_TESTIMONIALS[0].image} alt={HERO_POP_TESTIMONIALS[0].name} width={22} height={22} />
                </div>
                <span id="hcq-name">
                  {HERO_POP_TESTIMONIALS[0].uni
                    ? `${HERO_POP_TESTIMONIALS[0].name} · ${HERO_POP_TESTIMONIALS[0].uni}`
                    : HERO_POP_TESTIMONIALS[0].name}
                </span>
              </div>
              <div className="hcq-dots" id="hcq-dots" />
            </div>
          </div>
        </section>

        <section className="trust">
          <p className="trust-label">Our community got placed at</p>
          <TrustMarquee />
        </section>
      </div>

      {/* Product showcase */}
      <section className="showcase" id="product">
        <div className="showcase-container">
          <ProductShowcase />
        </div>
      </section>

      {/* Career Positioning System — dark grid card, split layout */}
      <section className="coach-band coach-band--boxed" id="coach-section">
        <div className="coach-box unicoach--masterclass reveal reveal--fade">
          <div className="unicoach__glow" aria-hidden />
          <div className="unicoach__grid" aria-hidden />
          <div className="container">
            <div className="coach-split reveal-stagger">
              <div className="coach-split__text">
                <h2 className="closing-hl closing-hl--light">
                  The Unimad Career
                  <br />
                  Positioning System
                </h2>
                <p className="closing-sub closing-sub--light">
                  Get access to a mentor who has placed 200+ international students to build your positioning, applications strategy, and
                  entire job search system step-by-step.
                </p>
              </div>
              <div className="coach-split__panel">
                <div className="coach-stats">
                  <div className="coach-stat">
                    <span className="coach-stat-num">$4M+</span>
                    <span className="coach-stat-lbl">in job offers</span>
                  </div>
                  <div className="coach-stat">
                    <span className="coach-stat-num">10,000+</span>
                    <span className="coach-stat-lbl">interviews secured</span>
                  </div>
                  <div className="coach-stat">
                    <span className="coach-stat-num">95%</span>
                    <span className="coach-stat-lbl">success rate</span>
                  </div>
                </div>
                <div className="coach-ctas">
                  <Link href={MASTERCLASS_PATH} className="masterclass-gold-btn closing-gold-cta">
                    Book your strategy session now
                  </Link>
                  <Link href={MASTERCLASS_ORGANIC_PATH} className="btn btn-outline-light">
                    View full system
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <StoriesSection />

      {/* Closing — boxed image card (footer shares the same background) */}
      <section className="closing closing--boxed">
        <div className="closing-box closing--stars reveal reveal--fade">
          <StarfieldBackground />
          <div className="container">
            <div className="closing-band-inner reveal-stagger">
              <h2 className="closing-hl closing-hl--light">Turn your applications into offers.</h2>
              <p className="closing-sub closing-sub--light">
                Either do it yourself using the tool, or take personalised guidance from a coach.
              </p>
              <div className="closing-ctas">
                <Link href={getSigninUrl()} className="btn btn-outline-light">
                  Start now for free
                </Link>
                <Link href={MASTERCLASS_PATH} className="btn btn-solid">
                  Book your strategy session
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
