"use client";

import { useMemo, useState } from "react";
import Logo from "@/components/Logo";
import ToastProvider, { useShowToast } from "@/components/onboarding/shared/Toast";
import { PaymentSuccessModal } from "@/components/unicoach/public-payment/PaymentSuccessModal";
import { startPublicUnicoachRazorpayPayment } from "@/components/unicoach/public-payment/public-razorpay-checkout";
import { publicValidateUnicoachDiscount } from "@/features/unicoach/api/public-unicoach-client";
import confetti from "canvas-confetti";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Script from "next/script";
import "./public-payment-page.css";

const BASE_PRICE = 199;

const PILLS = [
  {
    label: "Career Clarity",
    title: "Career Clarity System",
    lines: ["Role mapping", "Skill-gap analysis", "Personalised Roadmap", "Clear Positioning Strategy"],
  },
  {
    label: "Sponsor-Ready CV",
    title: "Sponsor-Ready CV System",
    lines: ["ATS-Proof CV", "Achievement Structuring", "Portfolio + Case study creation"],
  },
  {
    label: "LinkedIn Magnet",
    title: "LinkedIn Career Magnet",
    lines: ["Recruiters visibility", "Headline & About rewrite", "Comments strategy", "Credibility System"],
  },
  {
    label: "Job Applications",
    title: "UK Job Applications Strategy",
    lines: ["AI Job Customisation", "Daily System (15 mins/day)", "Referral templates + DM Scripts", "Cold Emails that convert"],
  },
  {
    label: "Interview Mastery",
    title: "Interview Mastery",
    lines: ["STAR methodologies", "Storytelling framework", "Salary Negotiation Scripts", "Value Proposition Document"],
  },
  {
    label: "Community + Calls",
    title: "Private Community + Live Calls",
    lines: ["Profile Reviews & Peer Reviews", "Accountability & Weekly Wins", "Q&A calls every week"],
  },
] as const;

type StripItem = { av: string; name: string; headline: string; quote: string; sub?: string };

const STRIP_ITEMS: StripItem[] = [
  {
    av: "M",
    name: "Madhumitha",
    headline: "2,000 apps, now in the US",
    quote: "My coach rebuilt my entire approach from scratch. Within weeks, recruiters were reaching out to me.",
  },
  {
    av: "A",
    name: "Aarthi",
    headline: "£500 to a UK offer in 3 weeks",
    quote: "I wasn't the most qualified. But I was the most visible. The coach changed how I showed up.",
  },
  {
    av: "T",
    name: "Tejus",
    headline: "800 rejections, one life-changing offer",
    quote: "Their system replaced my random approach with real clarity. One engagement was all it took.",
  },
  {
    av: "S",
    name: "Sanjana",
    headline: '"A system that actually worked"',
    quote: "I finally had a system that actually worked. The coaching calls changed everything for me.",
    sub: "University of Aberdeen",
  },
  {
    av: "K",
    name: "Kushal",
    headline: "From chasing to attracting roles",
    quote: "I went from chasing roles to attracting the right ones. Recruiters started coming to me.",
  },
  {
    av: "V",
    name: "Vanshika",
    headline: '"Felt seen. Then got hired."',
    quote: "I finally felt seen. And then I got hired. The personal brand work made all the difference.",
  },
  {
    av: "D",
    name: "Dhananjeyan",
    headline: '"Confidence I didn\'t know I had"',
    quote: "It helped me build confidence in my own voice. Then I got hired within three weeks.",
    sub: "University of Sheffield",
  },
];

const FAQ_ITEMS = [
  {
    q: "Do I need a Unimad account?",
    a: "No. Pay first, and a Unimad account is created for you automatically. Full access to all free tools included.",
  },
  {
    q: "What happens after I pay?",
    a: "The team will email you within 24 hours to start onboarding and schedule your first strategy call.",
  },
  {
    q: "Can I use Unicoach outside the UK?",
    a: "Yes. The coaching and strategy are tailored to your specific location and job search context.",
  },
  { q: "Where do I enter my coupon code?", a: 'Click "Have a coupon?" below the price before you pay.' },
] as const;

function launchConfetti() {
  const colours = ["#346DE0", "#81AAFF", "#C4110D", "#22C55E", "#F59E0B", "#FFFFFF"];
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.35 },
    colors: colours,
  });
}

function PublicPaymentPageInner() {
  const router = useRouter();
  const toast = useShowToast();
  const [appliedCode, setAppliedCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponOpen, setCouponOpen] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [phaseLabel, setPhaseLabel] = useState("");
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [priceStriking, setPriceStriking] = useState(false);
  const [postPaymentRedirectUrl, setPostPaymentRedirectUrl] = useState<string | null>(null);

  const finalPrice = useMemo(() => Math.max(0, BASE_PRICE - discountAmount), [discountAmount]);
  const isProcessing = phaseLabel.length > 0;

  const scrollToCheckout = () => {
    document.getElementById("checkout")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleApplyCoupon = async () => {
    const code = couponInput.trim();
    if (!code) return;

    try {
      setIsValidatingCoupon(true);
      const result = await publicValidateUnicoachDiscount(code);
      if (!result.valid) {
        toast.error(result.message ?? "Invalid coupon");
        return;
      }

      setCouponOpen(false);
      launchConfetti();
      setPriceStriking(true);
      setTimeout(() => {
        setAppliedCode(code.toUpperCase());
        setDiscountAmount(result.discount_amount ?? 0);
        setPriceStriking(false);
      }, 350);
    } catch {
      toast.error("Invalid coupon code");
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handlePayment = async () => {
    const result = await startPublicUnicoachRazorpayPayment({
      appliedDiscountCode: appliedCode || null,
      onPhase: setPhaseLabel,
    });

    if (result.ok) {
      launchConfetti();
      const params = new URLSearchParams({
        redirect: "unicoach",
        unicoach_claim: result.claimToken,
      });
      setPostPaymentRedirectUrl(`/signin?${params.toString()}`);
      return;
    }

    if (result.message !== "Payment cancelled") {
      toast.error(result.message);
    } else {
      toast.error("Payment cancelled");
    }
  };

  const stripDoubled = [...STRIP_ITEMS, ...STRIP_ITEMS];

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <div className="uc-payment-root">
        <nav className="nav">
          <div className="nav-inner">
            <Link href="/" className="nav-brand" aria-label="Unimad home">
              <Logo className="h-[22px] w-auto text-[#346DE0]" />
            </Link>
            <button type="button" className="nav-cta" onClick={scrollToCheckout}>
              Start Unicoach
            </button>
          </div>
        </nav>

        <section className="hero">
          <div className="hero-glow" />
          <div className="hero-body">
            <div className="hero-eyebrow">Unicoach</div>
            <h1 className="hero-hl">
              <span className="hero-hl-l1">The programme behind</span>
              <span className="hero-hl-l2">
                <span className="mark-red">200+ offers.</span>
              </span>
            </h1>
            <p className="hero-sl">
              5 modules. 3 personal strategy calls. A career transformation system built for international students.
            </p>

            <div className="hero-checkout" id="checkout">
              <div className={`hc-price ${priceStriking ? "price-striking" : ""}`}>
                {discountAmount > 0 ? (
                  <>
                    <span className="price-old">£{BASE_PRICE}</span>
                    <span className="price-new">£{finalPrice}</span>
                  </>
                ) : (
                  <>£{BASE_PRICE}</>
                )}
              </div>

              <button type="button" className="hc-pay-btn" disabled={isProcessing} onClick={handlePayment}>
                {isProcessing ? phaseLabel || "Processing…" : "Sign Up →"}
              </button>
              <p className="hc-call-note">Book your first strategy call after payment.</p>
              {appliedCode ? (
                <div className="hc-coupon-link" style={{ color: "#16A34A", cursor: "default" }}>
                  ✓ {appliedCode} applied
                </div>
              ) : (
                <button
                  type="button"
                  className="hc-coupon-link"
                  style={{ background: "none", border: "none" }}
                  onClick={() => setCouponOpen(true)}
                >
                  Have a coupon?
                </button>
              )}
            </div>

            <div className="pills-wrap">
              <div className="pills-label">What&apos;s included</div>
              <div className="pills-row">
                {PILLS.map(pill => (
                  <div key={pill.label} className="pill">
                    {pill.label}
                    <div className="pill-tt">
                      <h4>{pill.title}</h4>
                      <p>
                        {pill.lines.map((line, i) => (
                          <span key={line}>
                            {i > 0 && <br />}
                            {line}
                          </span>
                        ))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="story-strip">
            <div className="strip-clip">
              <div className="strip-track">
                {stripDoubled.map((item, idx) => (
                  <div key={`${item.name}-${idx}`} className="strip-item">
                    <div className="strip-av">{item.av}</div>
                    <div className="strip-text">
                      <strong>{item.name}</strong> — {item.headline}
                    </div>
                    <div className="strip-popup">
                      <p>&ldquo;{item.quote}&rdquo;</p>
                      <span>{item.sub ? `${item.name} · ${item.sub}` : item.name}</span>
                    </div>
                    <div className="strip-sep" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="stories">
          <div className="faq-wrap">
            <div className="faq-label">Common questions</div>
            {FAQ_ITEMS.map((item, idx) => (
              <div
                key={item.q}
                className={`faq-item ${openFaq === idx ? "open" : ""}`}
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                onKeyDown={e => e.key === "Enter" && setOpenFaq(openFaq === idx ? null : idx)}
                role="button"
                tabIndex={0}
              >
                <div className="faq-head">
                  <span className="faq-q">{item.q}</span>
                  <span className="faq-icon">+</span>
                </div>
                <div className="faq-a">{item.a}</div>
              </div>
            ))}
          </div>

          <div className="closing-cta">
            <button type="button" className="closing-btn" onClick={scrollToCheckout}>
              Start Unicoach — £{discountAmount > 0 ? finalPrice : BASE_PRICE} →
            </button>
            <p className="closing-sub">One-time payment. No subscription. Everything included.</p>
          </div>
        </section>

        <div className="footer">www.unimad.ai</div>

        {couponOpen ? (
          <div className="coupon-overlay on" role="presentation" onClick={e => e.target === e.currentTarget && setCouponOpen(false)}>
            <div className="coupon-box">
              <div className="coupon-box-title">Enter coupon code</div>
              <div className="coupon-box-row">
                <input
                  className="coupon-box-input"
                  type="text"
                  placeholder="CODE"
                  value={couponInput}
                  onChange={e => setCouponInput(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === "Enter" && void handleApplyCoupon()}
                />
                <button type="button" className="coupon-box-apply" onClick={() => void handleApplyCoupon()} disabled={isValidatingCoupon}>
                  {isValidatingCoupon ? "..." : "Apply"}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {postPaymentRedirectUrl ? <PaymentSuccessModal onRedirect={() => router.push(postPaymentRedirectUrl)} /> : null}
      </div>
    </>
  );
}

export function PublicPaymentPage() {
  return (
    <ToastProvider>
      <PublicPaymentPageInner />
    </ToastProvider>
  );
}
