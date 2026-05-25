"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Logo from "@/components/Logo";
import Link from "next/link";
import { feats, mocks, ppl, revLines, ribbonItems } from "./landing-data";
import "./uni-landing.css";

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function UniLandingPage() {
  const platformRef = useRef<HTMLDivElement>(null);
  const featScrollRef = useRef<HTMLDivElement>(null);
  const revRef = useRef<HTMLDivElement>(null);
  const lastFeatRef = useRef(0);

  const [deckCur, setDeckCur] = useState(0);
  const [deckExit, setDeckExit] = useState<"xl" | "xr" | null>(null);
  const [deckAnim, setDeckAnim] = useState(false);

  const [revLit, setRevLit] = useState(0);
  const revTotal = useMemo(() => revLines.reduce((n, line) => n + line.split(" ").length, 0), []);

  const [curFeat, setCurFeat] = useState(0);
  const [featTick, setFeatTick] = useState(0);
  const [webinarOpen, setWebinarOpen] = useState(false);

  const cy = useCallback(
    (dir: "left" | "right") => {
      if (deckAnim) return;
      setDeckAnim(true);
      setDeckExit(dir === "left" ? "xl" : "xr");
      window.setTimeout(() => {
        setDeckCur(c => (c + 1) % 3);
        setDeckExit(null);
        setDeckAnim(false);
      }, 440);
    },
    [deckAnim]
  );

  const gt = useCallback(
    (t: number) => {
      if (!deckAnim && t !== deckCur) cy("right");
    },
    [cy, deckAnim, deckCur]
  );

  const jumpFeat = useCallback((idx: number) => {
    const fh = platformRef.current;
    const fs = featScrollRef.current;
    if (!fh || !fs) return;
    const top = fh.offsetTop + fh.offsetHeight;
    const step = fs.offsetHeight / feats.length;
    window.scrollTo({ top: top + step * idx + 10, behavior: "smooth" });
  }, []);

  const showFeat = useCallback((idx: number, animate: boolean) => {
    if (idx === lastFeatRef.current) return;
    lastFeatRef.current = idx;
    setCurFeat(idx);
    if (animate) setFeatTick(t => t + 1);
  }, []);

  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth";
    return () => {
      document.documentElement.style.scrollBehavior = "";
    };
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => setWebinarOpen(true), 3500);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const st = window.scrollY;
      const ph = window.innerHeight;

      const rev = revRef.current;
      if (rev) {
        const rt = rev.getBoundingClientRect().top + st;
        const prog = Math.max(0, Math.min(1, (st - (rt - ph * 0.75)) / (rt + rev.offsetHeight * 0.55 - (rt - ph * 0.75))));
        const lit = Math.floor(prog * revTotal);
        setRevLit(lit);
      }

      const fh = platformRef.current;
      const fs = featScrollRef.current;
      if (fh && fs) {
        const scrolled = st - (fh.offsetTop + fh.offsetHeight);
        const step = fs.offsetHeight / feats.length;
        const idx = Math.min(feats.length - 1, Math.max(0, Math.floor(scrolled / step)));
        if (scrolled > 0) showFeat(idx, true);
        else if (scrolled <= 0) {
          if (lastFeatRef.current !== 0) {
            lastFeatRef.current = 0;
            setCurFeat(0);
          }
        }
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [revTotal, showFeat]);

  const f = feats[curFeat];
  const ribbonDup = useMemo(() => [...ribbonItems, ...ribbonItems], []);

  return (
    <div className="uni-landing-page">
      <nav>
        <Link href="/" className="nav-logo-link" aria-label="Unimad home">
          <Logo className="h-7 w-auto shrink-0 md:h-8" />
        </Link>
        <div className="nav-links">
          <a href="#platform">Platform</a>
          <a href="#unicoach">Unicoach</a>
          <a href="#stories">Mad Stories</a>
          <a href="#">Blog</a>
        </div>
        <div className="nav-r">
          <Link href="/signin" className="nav-ghost">
            Sign In
          </Link>
          <Link href="/signin" className="nav-cta">
            Get Started — Free
          </Link>
        </div>
      </nav>

      <div className="hero">
        <div className="hero-left">
          <div className="badge a1">
            <div className="badge-dot" />
            100% Free · Complete Toolkit · No Card Required
          </div>
          <div className="hero-h a2">
            The platform behind
            <br />
            <span className="num">200+</span> job offers.
            <br />
            Free, for everyone.
          </div>
          <div className="hero-sub a3">
            Stop getting ghosted by recruiters. A completely free toolkit to build a personal brand that gets you noticed — resumes,
            LinkedIn, portfolio, tailored applications. No paywalls. No catch.
          </div>
          <div className="cta-group a4">
            <Link href="/signin" className="btn-blue">
              Start Building — It&apos;s Free
            </Link>
            <div className="free-pill">
              <div className="free-dot" />
              No credit card. No trial. Free forever.
            </div>
            <div className="or-row">
              <div className="or-line" />
              <div className="or-txt">or</div>
              <div className="or-line" />
            </div>
            <button type="button" className="webinar-btn" onClick={() => setWebinarOpen(true)}>
              <div className="w-icon">
                <div className="w-tri" />
              </div>
              <div>
                <div className="w-label">
                  Join our free webinar <span className="w-arr">→</span>
                </div>
                <div className="w-sub">Learn how to land your dream job with Unimad</div>
              </div>
            </button>
          </div>
        </div>
        <div className="hero-right a5">
          <div className="deck">
            {[0, 1, 2].map(i => {
              const role = (["back", "mid", "front"] as const)[i];
              const pi = (deckCur + 2 - i + 9) % 3;
              const person = ppl[pi];
              const isFront = i === 2;
              const exitCls = isFront && deckExit ? deckExit : "";
              return (
                <div
                  key={i}
                  className={cx("vc", role, exitCls)}
                  onClick={i === 0 ? () => cy("right") : i === 1 ? () => cy("left") : undefined}
                  onKeyDown={
                    i < 2
                      ? e => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            cy(i === 0 ? "right" : "left");
                          }
                        }
                      : undefined
                  }
                  role={i < 2 ? "button" : undefined}
                  tabIndex={i < 2 ? 0 : undefined}
                >
                  {isFront ? (
                    <>
                      <div className="vc-bar" />
                      <div className="vc-play">
                        <div className="vc-tri" />
                      </div>
                      <div className="vc-grad" />
                      <div className="vc-info">
                        <div className="vc-name">{person.name}</div>
                        <div className="vc-outcome">{person.out}</div>
                      </div>
                      <div className="vc-sound">
                        <div className="vc-si" />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="vc-play sm">
                        <div className="vc-tri sm" />
                      </div>
                      <div className="vc-nsm">{person.name}</div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
          <div className="deck-nav">
            <div className="d-hint">tap cards to cycle</div>
            {[0, 1, 2].map(i => (
              <button
                key={i}
                type="button"
                className={cx("dd", i === deckCur && "on")}
                aria-label={`Story ${i + 1}`}
                onClick={() => gt(i)}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="ribbon">
        <div className="rtrack">
          {ribbonDup.map((item, i) => (
            <div key={`${item.initials}-${i}`} className="ri">
              <div className="rav" style={{ background: item.bg }}>
                {item.initials}
              </div>
              <span className="rstory">{item.story}</span>
              <span className="rsep">—</span>
              <span className="rname">{item.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="stats">
        <div className="stat">
          <div className="sn">
            <span>8,000</span>+
          </div>
          <div className="sl">job seekers on platform</div>
        </div>
        <div className="stat">
          <div className="sn">
            <span>200</span>+
          </div>
          <div className="sl">students placed via Unicoach</div>
        </div>
        <div className="stat">
          <div className="sn">
            <span>1,000</span>+
          </div>
          <div className="sl">interviews landed</div>
        </div>
        <div className="stat">
          <div className="sn">
            <span>100</span>%
          </div>
          <div className="sl">free core tools — always</div>
        </div>
      </div>

      <div className="reveal-sec" ref={revRef}>
        <div className="reveal-inner">
          {revLines.map((line, li) => {
            const words = line.split(" ");
            const offset = revLines.slice(0, li).reduce((n, l) => n + l.split(" ").length, 0);
            return (
              <span key={li} className="rev-line">
                {words.map((w, wi) => {
                  const flatIdx = offset + wi;
                  return (
                    <span key={`${li}-${wi}`} className={cx("rw", flatIdx < revLit && "lit")}>
                      {w}{" "}
                    </span>
                  );
                })}
              </span>
            );
          })}
        </div>
      </div>

      <div className="feat-header" id="platform" ref={platformRef}>
        <div>
          <div className="sec-label">The Free Platform</div>
          <div className="sec-h">
            Every tool you need.
            <br />
            Actually free.
          </div>
          <p className="sec-sub" style={{ marginTop: 8, maxWidth: 400 }}>
            No freemium tricks. No locked features. Scroll through all 9 tools below.
          </p>
        </div>
        <div className="fstamp">
          <div className="fstamp-big">100% Free</div>
          <div className="fstamp-note">All 9 tools · No catch · No card</div>
        </div>
      </div>

      <div className="feat-scroll" id="fs" ref={featScrollRef}>
        <div className="feat-sticky">
          <div className="feat-left">
            <div className="fpips">
              {feats.map((_, i) => (
                <button
                  key={feats[i].mock}
                  type="button"
                  className={cx("fpip", i === curFeat && "on")}
                  aria-label={`Feature ${i + 1}`}
                  onClick={() => jumpFeat(i)}
                />
              ))}
            </div>
            <div className="fcounter">{String(curFeat + 1).padStart(2, "0")} / 09</div>
            <div className="fcat">{f.cat}</div>
            <div className="ftitle" key={`t-${curFeat}-${featTick}`}>
              {f.title}
            </div>
            <div className="fdesc" key={`d-${curFeat}-${featTick}`}>
              {f.desc}
            </div>
            <div className="ftag">
              <div className="ftdot" />
              Free forever — no upgrade needed
            </div>
          </div>
          <div className="feat-right" key={`m-${curFeat}-${featTick}`} dangerouslySetInnerHTML={{ __html: mocks[f.mock] }} />
        </div>
      </div>

      <div className="uc-section" id="unicoach">
        <div className="uc-grid">
          <div>
            <div className="uc-label">
              <div className="uc-pip" />
              Unicoach
            </div>
            <div className="uc-h">
              The tools are free.
              <br />
              The shortcut isn&apos;t.
            </div>
            <p className="uc-body">
              Unimad gives you every tool to succeed on your own. Unicoach gives you a coach who has cracked the job market — someone in
              your corner, building the strategy with you. Students who join Unicoach land jobs significantly faster.
            </p>
            <Link href="/signin" className="btn-white">
              Book Your Discovery Call →
            </Link>
            <div className="uc-refund" style={{ marginTop: 12 }}>
              ✓ 100% refund guaranteed within 24 hours, no questions asked.
            </div>
            <div className="uc-employers">
              Alumni now at Amazon · Uber · Infosys · JLR
              <br />
              Coursera · Lloyds Bank · HashiCorp
            </div>
          </div>
          <div>
            <div className="proof-grid">
              <div className="proof-card">
                <div className="proof-n">200+</div>
                <div className="proof-l">students placed in real jobs</div>
              </div>
              <div className="proof-card">
                <div className="proof-n">1-on-1</div>
                <div className="proof-l">dedicated coaching sessions</div>
              </div>
              <div className="proof-card">
                <div className="proof-n">€169</div>
                <div className="proof-l">one-time, full programme</div>
              </div>
              <div className="proof-card">
                <div className="proof-n">24h</div>
                <div className="proof-l">full refund if unsatisfied</div>
              </div>
            </div>
            <div className="cl-card">
              <div className="cl-label">What&apos;s included</div>
              {[
                "1-on-1 sessions with a dedicated coach",
                "Niche selection & career direction",
                "Complete LinkedIn profile overhaul",
                "Value Proposition Document (VPD)",
                "High-converting portfolio setup",
                "Application strategy — quality over volume",
                "Interview prep for your target role",
                "Direct access via WhatsApp & community",
              ].map(text => (
                <div key={text} className="cl-item">
                  <div className="cl-arr">→</div>
                  <div className="cl-text">{text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mad-section" id="stories">
        <div style={{ marginBottom: 48 }}>
          <div className="sec-label">Mad Stories</div>
          <div className="sec-h">Real people. Real offers.</div>
          <p
            style={{
              fontSize: 14,
              color: "var(--ink2)",
              fontWeight: 300,
              lineHeight: 1.75,
              marginTop: 8,
              maxWidth: 480,
            }}
          >
            200+ Unicoach alumni. These are their journeys — unedited, unpolished, exactly as they lived them.
          </p>
        </div>

        <div className="hero-testi">
          <div className="ht-left">
            <div className="ht-alumni">Unicoach Alumni</div>
            <span className="ht-quote-mark">&quot;</span>
            <div className="ht-quote">
              From <em>2,000 applications</em> and one pulled offer to working in the US. The Portfolio, the VPD — it helped me get seen for
              who I truly was. Every rejection before just made this win mean more.
            </div>
            <div className="ht-person">
              <div className="ht-avatar">MD</div>
              <div>
                <div className="ht-person-name">Madhumitha Dev</div>
                <div className="ht-person-role">Financial Analyst · United States</div>
                <div className="ht-outcome">2,000 applications → working in the US</div>
              </div>
            </div>
          </div>
          <div className="ht-right">
            <div className="ht-video">
              <div className="ht-video-bar" />
              <div className="ht-video-play">
                <div className="ht-video-tri" />
              </div>
              <div className="ht-video-grad" />
              <div className="ht-video-info">
                <div className="ht-video-name">Madhumitha Dev</div>
                <div className="ht-video-out">Watch her full story →</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mad-lower">
          <div className="mad-lower-label">More stories</div>
          <div className="mad-split">
            <div>
              <div className="swipe-hint">← swipe to explore →</div>
              <div className="mvr">
                <div className="mvc active">
                  <div className="mvab" />
                  <div className="mvplay">
                    <div className="mvtri" />
                  </div>
                  <div className="mvg" />
                  <div className="mvi">
                    <div className="mvn">Ramanathan</div>
                    <div className="mvo">985 rejections → 1 offer</div>
                  </div>
                </div>
                <div className="mvc">
                  <div className="mvplay">
                    <div className="mvtri" />
                  </div>
                  <div className="mvg" />
                  <div className="mvi">
                    <div className="mvn">Anwesha</div>
                    <div className="mvo">329 apps → 3 offers</div>
                  </div>
                </div>
                <div className="mvc peek">
                  <div className="mvplay">
                    <div className="mvtri" />
                  </div>
                  <div className="mvg" />
                  <div className="mvi">
                    <div className="mvn">Tejus</div>
                    <div className="mvo">800 rejections → offer</div>
                  </div>
                </div>
              </div>
              <div className="mvdots">
                <div className="mvd on" />
                <div className="mvd" />
                <div className="mvd" />
                <div className="mvd" />
                <div className="mvd" />
              </div>
              <div className="mvarr">
                <button type="button" className="mva" aria-label="Previous">
                  ←
                </button>
                <button type="button" className="mva" aria-label="Next">
                  →
                </button>
              </div>
            </div>
            <div className="tcard-grid">
              {[
                {
                  out: "985 rejections → 1 offer",
                  q: "This journey wasn't about luck. It was about not giving up.",
                  name: "Ramanathan K.",
                  role: "18-month search · UK",
                },
                {
                  out: "329 apps → 3 offers",
                  q: "I didn't just get hired — I found my direction and a job I love.",
                  name: "Anwesha",
                  role: "UK · international student",
                },
                {
                  out: "492 rejections → offer on visa",
                  q: "With 3 months left on my visa, I got THE call.",
                  name: "Janvi Jadeja",
                  role: "Engineer · UK",
                },
                {
                  out: "750 roles → UX at Globant",
                  q: "If you're stuck, start now. Don't wait to feel ready.",
                  name: "Sarada Priya",
                  role: "UX Designer · Globant",
                },
                {
                  out: "Chasing → remote US job",
                  q: "I work remotely for a US company from India. All because of personal brand.",
                  name: "Kushal",
                  role: "Remote · US company",
                },
                {
                  out: "£500 in account → UK offer",
                  q: "It wasn't magic. It was the system, the belief, and the right support.",
                  name: "Aarthi",
                  role: "UK · international student",
                },
              ].map(card => (
                <div key={card.name} className="tcard">
                  <div className="tcard-out">{card.out}</div>
                  <p className="tcard-q">&quot;{card.q}&quot;</p>
                  <div className="tcard-name">{card.name}</div>
                  <div className="tcard-role">{card.role}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="closing">
          <div>
            <div className="closing-t">Ready to write your mad story?</div>
            <div className="closing-s">Join 200+ students who stopped chasing and started landing.</div>
          </div>
          <Link href="/signin" className="btn-white-out">
            Book Your Discovery Call →
          </Link>
        </div>
      </div>

      <footer>
        <div className="foot-top">
          <div>
            <Link href="/" className="foot-logo" aria-label="Unimad home">
              <Logo className="h-7 w-auto shrink-0 md:h-8" />
            </Link>
            <div className="foot-tagline">Personal branding simplified. Become unignorable to recruiters and land your next role.</div>
          </div>
          <div>
            <div className="foot-col-label">Platform</div>
            <div className="foot-links">
              <Link href="/signin">Resume Builder</Link>
              <Link href="/signin">LinkedIn AI Audit</Link>
              <Link href="/signin">Portfolio Maker</Link>
              <Link href="/signin">Job Portal</Link>
              <Link href="/signin">Content Lab</Link>
              <Link href="/signin">Mock Interviews</Link>
            </div>
          </div>
          <div>
            <div className="foot-col-label">Company</div>
            <div className="foot-links">
              <a href="#unicoach">Unicoach</a>
              <a href="#stories">Mad Stories</a>
              <Link href="/signin">About Us</Link>
              <a href="#">Blog</a>
              <Link href="/signin">Contact</Link>
            </div>
          </div>
          <div>
            <div className="foot-col-label">Legal</div>
            <div className="foot-links">
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
              <a href="#">Refund Policy</a>
            </div>
          </div>
        </div>
        <div className="foot-bottom">
          <div className="foot-copy">©️ 2026 Unimad, Inc.</div>
          <div className="foot-legal">
            <a href="#">Instagram</a>
            <a href="#">LinkedIn</a>
          </div>
        </div>
      </footer>

      <div className={cx("wpop", webinarOpen && "show")} id="wp">
        <button type="button" className="wpx" aria-label="Close" onClick={() => setWebinarOpen(false)}>
          ✕
        </button>
        <div className="wptop">
          <div className="wpico">
            <div className="wptr" />
          </div>
          <div>
            <div className="wptit">Free Webinar</div>
            <div className="wpsub">
              <div className="wp-pulse" />
              Happening soon
            </div>
          </div>
        </div>
        <div className="wpbod">
          Learn how to land your dream job using Unimad — live strategy session with real examples from our coaches.
        </div>
        <button type="button" className="wpcta">
          Reserve your free spot →
        </button>
        <div className="wpnote">Free · No commitment · 45 mins</div>
      </div>
    </div>
  );
}
