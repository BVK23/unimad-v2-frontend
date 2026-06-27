"use client";

import React, { useEffect, useRef, useState } from "react";
import { MasterclassFaqSection } from "@/components/masterclass/MasterclassFaqSection";
import {
  MasterclassOnboardingModal,
  type MasterclassLead,
  type MasterclassOnboardingIntent,
} from "@/components/masterclass/MasterclassOnboardingModal";
import { MasterclassPlacementsSection } from "@/components/masterclass/MasterclassPlacementsSection";
import { MasterclassStoriesSection } from "@/components/masterclass/MasterclassStoriesSection";
import { UnimadLogo } from "@/components/unimad-logo";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Script from "next/script";

declare global {
  interface Window {
    Calendly?: {
      initPopupWidget: (options: { url: string }) => void;
    };
  }
}

const CALENDLY_EVENT_URL = "https://calendly.com/unimad_ai/onboarding-to-unimad";
const THANK_YOU_PATH = "/webinar/thank-you";

const buildCalendlyUrl = (origin: string, prefill?: { name?: string; email?: string }) => {
  const params = new URLSearchParams({
    hide_event_type_details: "1",
    hide_gdpr_banner: "1",
    redirect_url: `${origin}${THANK_YOU_PATH}`,
  });
  if (prefill?.name) params.set("name", prefill.name);
  if (prefill?.email) params.set("email", prefill.email);
  return `${CALENDLY_EVENT_URL}?${params.toString()}`;
};

const openCalendlyPopup = (prefill?: { name?: string; email?: string }) => {
  if (typeof window === "undefined") return;

  const url = buildCalendlyUrl(window.location.origin, prefill);

  const checkCalendly = (attempts = 0) => {
    if (window.Calendly) {
      try {
        window.Calendly.initPopupWidget({ url });
      } catch {
        window.open(url, "_blank");
      }
      return;
    }
    if (attempts < 15) {
      setTimeout(() => checkCalendly(attempts + 1), 200);
      return;
    }
    window.open(url, "_blank");
  };

  checkCalendly();
};

type ButtonSize = "lg" | "sm" | "nav";

function MasterclassFrame({
  children,
  className = "",
  contentClassName = "",
  radius = "10",
  featured = false,
  variant = "default",
  clip = false,
}: {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  radius?: "10" | "14";
  featured?: boolean;
  variant?: "default" | "card";
  clip?: boolean;
}) {
  const frameRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = frameRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
    el.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
  };

  const handleMouseEnter = () => {
    frameRef.current?.setAttribute("data-active", "true");
  };

  const handleMouseLeave = () => {
    const el = frameRef.current;
    if (!el) return;
    el.setAttribute("data-active", "false");
    el.style.setProperty("--mouse-x", "50%");
    el.style.setProperty("--mouse-y", "50%");
  };

  return (
    <div
      ref={frameRef}
      data-active="false"
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ "--mouse-x": "50%", "--mouse-y": "50%" } as React.CSSProperties}
      className={`masterclass-frame ${radius === "14" ? "masterclass-frame--14" : ""} ${variant === "card" ? "masterclass-frame--card" : ""} ${featured ? "masterclass-frame--featured" : ""} ${className}`}
    >
      <div className={`masterclass-frame__inner ${clip ? "masterclass-frame__inner--clip overflow-hidden" : ""}`}>
        {!clip && <div className="masterclass-frame__glow" aria-hidden />}
        <div className={`masterclass-frame__content ${contentClassName}`}>{children}</div>
      </div>
    </div>
  );
}

function GoldButton({
  children,
  className = "",
  onClick,
  size = "lg",
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  size?: ButtonSize;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`masterclass-gold-btn ${size === "lg" ? "masterclass-gold-btn--lg" : "masterclass-gold-btn--sm"} ${className}`}
    >
      <span className="relative z-10 px-2">{children}</span>
    </button>
  );
}

function BlackButton({
  children,
  className = "",
  onClick,
  size = "sm",
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  size?: ButtonSize;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`masterclass-black-btn ${size === "lg" ? "masterclass-black-btn--lg" : "masterclass-black-btn--sm"} ${className}`}
    >
      <span className="relative z-10 px-2">{children}</span>
    </button>
  );
}

function OutlineButton({
  children,
  className = "",
  onClick,
  size = "lg",
  theme = "dark",
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  size?: ButtonSize;
  theme?: "dark" | "light";
}) {
  const sizeClasses =
    size === "lg"
      ? "h-[49px] rounded-full text-[18px] font-semibold tracking-[-0.54px]"
      : size === "nav"
        ? "h-[32px] rounded-full px-4 text-[12px] font-semibold tracking-[-0.36px]"
        : "h-[31px] rounded-full text-[12px] font-semibold tracking-[-0.36px]";

  const widthClass = size === "nav" ? "w-auto shrink-0" : "w-full";

  const themeClasses =
    theme === "light"
      ? "border-slate-300 text-slate-800 hover:border-slate-400 hover:bg-slate-50"
      : "border-white/60 text-white hover:border-white/80 hover:bg-white/10";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex ${widthClass} items-center justify-center border bg-transparent transition-colors ${themeClasses} ${sizeClasses} ${className}`}
    >
      <span className="relative z-10 px-2">{children}</span>
    </button>
  );
}

function BlueButton({
  children,
  className = "",
  onClick,
  size = "sm",
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  size?: ButtonSize;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`masterclass-blue-btn ${size === "lg" ? "masterclass-blue-btn--lg" : "masterclass-blue-btn--sm"} ${className}`}
    >
      <span className="relative z-10 px-2">{children}</span>
    </button>
  );
}

function MasterclassPlayButton({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 114.472 116.028" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden>
      <g filter="url(#masterclass-play-shadow)">
        <circle cx="53.7777" cy="51.8756" r="51.8756" fill="#191919" fillOpacity="0.5" />
        <circle cx="53.7777" cy="51.8756" r="51.4433" stroke="white" strokeWidth="0.864593" />
      </g>
      <path
        d="M40.1862 32.808C40.1862 30.8113 42.3477 29.5634 44.0769 30.5617L77.1475 49.6551C78.8767 50.6534 78.8767 53.1493 77.1475 54.1476L44.0769 73.241C42.3477 74.2394 40.1862 72.9914 40.1862 70.9947V32.808Z"
        fill="#E6E6E6"
      />
      <defs>
        <filter
          id="masterclass-play-shadow"
          x="0"
          y="0"
          width="114.472"
          height="116.028"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
          <feOffset dx="3.45837" dy="6.91675" />
          <feGaussianBlur stdDeviation="2.68024" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.2 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape" />
        </filter>
      </defs>
    </svg>
  );
}

function CoachAvatars() {
  return (
    <div className="flex shrink-0 items-center pl-0.5">
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className="relative size-[33px] overflow-hidden rounded-full border border-white bg-white"
          style={{ marginLeft: i === 0 ? 0 : -17 }}
        >
          <Image src="/images/unicoach/webinar/shaki.jpg" alt="Career coach" fill className="object-cover object-top" sizes="33px" />
        </div>
      ))}
    </div>
  );
}

function StrikethroughPrice({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`text-[24px] font-medium leading-[1.2] tracking-[-0.48px] line-through decoration-[#e35959] decoration-1 ${className}`}
    >
      {children}
    </span>
  );
}

type PricingCardButtonSubtext = { kind: "plain"; text: string } | { kind: "cohort"; cohortLabel?: string; seatsLeft: number };

type PricingCardData = {
  title: string;
  features: string[];
  price: string;
  originalPrice?: string;
  crossOutPrice?: boolean;
  buttonLabel: string;
  buttonVariant: "gold" | "black" | "outline" | "blue";
  buttonSubtext?: PricingCardButtonSubtext;
  featured?: boolean;
  freeRibbon?: boolean;
  compact?: boolean;
};

function parsePrice(value: string): number {
  return Number(value.replace(/[^0-9.]/g, ""));
}

function getDiscountPercent(original: string, current: string): number {
  const originalAmount = parsePrice(original);
  const currentAmount = parsePrice(current);
  if (!originalAmount || originalAmount <= currentAmount) return 0;
  return Math.round((1 - currentAmount / originalAmount) * 100);
}

function DiscountCornerSticker({ percent }: { percent: number }) {
  return (
    <div
      className="masterclass-corner-ribbon masterclass-corner-ribbon--discount pointer-events-none absolute right-0 top-0 z-30"
      aria-hidden
    >
      <span className="masterclass-corner-ribbon__text masterclass-corner-ribbon__text--green">{percent}% OFF</span>
    </div>
  );
}

function FreeCornerRibbon() {
  return (
    <div
      className="masterclass-corner-ribbon masterclass-corner-ribbon--discount pointer-events-none absolute right-0 top-0 z-30"
      aria-hidden
    >
      <span className="masterclass-corner-ribbon__text masterclass-corner-ribbon__text--gold">FREE</span>
    </div>
  );
}

function PricingCardButtonSubtext({ subtext }: { subtext?: PricingCardButtonSubtext }) {
  return (
    <p className="mt-2.5 min-h-[16px] text-center text-[11px] font-medium leading-[1.2] tracking-[-0.22px]">
      {!subtext ? (
        <span className="invisible select-none" aria-hidden>
          ·
        </span>
      ) : subtext.kind === "plain" ? (
        <span className="text-slate-400">{subtext.text}</span>
      ) : (
        <>
          <span className="text-slate-600">{subtext.cohortLabel ?? "June Cohort"}</span> <span className="text-slate-300">•</span>{" "}
          <span className="text-[#e35959]">{subtext.seatsLeft} Seats Left</span>
        </>
      )}
    </p>
  );
}

function PricingCard({
  title,
  features,
  price,
  originalPrice,
  crossOutPrice = false,
  buttonLabel,
  buttonVariant = "outline",
  buttonSubtext,
  featured = false,
  freeRibbon = false,
  compact = false,
  onButtonClick,
}: PricingCardData & { onButtonClick: () => void }) {
  const discountPercent = featured && originalPrice ? getDiscountPercent(originalPrice, price) : 0;

  const cardModifierClasses = [
    freeRibbon ? "masterclass-pricing-card--discovery" : "",
    featured ? "masterclass-pricing-card--featured" : "",
    compact ? "masterclass-pricing-card--compact" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={`masterclass-pricing-card group relative flex w-[245px] shrink-0 flex-col lg:w-auto lg:min-w-0 lg:flex-1 ${cardModifierClasses}`}
    >
      <div className={`relative w-full ${compact ? "h-[382px]" : "h-[408px]"}`}>
        {freeRibbon && <FreeCornerRibbon />}
        {discountPercent > 0 && <DiscountCornerSticker percent={discountPercent} />}

        <article className="masterclass-pricing-card__surface flex h-full flex-col rounded-[14px] border border-slate-300 bg-white">
          <p className="px-4 pt-[22px] text-center text-[18px] font-medium leading-[1.2] tracking-[-0.36px] text-slate-900 transition-colors duration-300 group-hover:text-slate-950">
            {title}
          </p>

          <ul className="mx-auto mt-5 flex flex-1 flex-col gap-3 px-4 pb-2 text-center text-[13px] leading-[1.3] tracking-[-0.26px] text-slate-500 transition-colors duration-300 group-hover:text-slate-600">
            {features.map(feature => (
              <li key={feature} className="transition-colors duration-300 group-hover:text-slate-700">
                {feature}
              </li>
            ))}
          </ul>

          <div className="mt-auto">
            <div className="mb-4 flex items-center justify-center gap-2 px-2 pt-4">
              {originalPrice && <StrikethroughPrice className="text-slate-300">{originalPrice}</StrikethroughPrice>}
              {crossOutPrice ? (
                <StrikethroughPrice className="text-slate-300">{price}</StrikethroughPrice>
              ) : (
                <span
                  className={`text-[24px] font-medium leading-[1.2] tracking-[-0.48px] ${
                    parsePrice(price) === 0 ? "text-[#22c55e]" : "text-slate-900"
                  }`}
                >
                  {price}
                </span>
              )}
            </div>

            <div className="px-5 pb-5">
              {buttonVariant === "black" && (
                <BlackButton size="sm" onClick={onButtonClick}>
                  {buttonLabel}
                </BlackButton>
              )}
              {buttonVariant === "gold" && (
                <GoldButton size="sm" onClick={onButtonClick}>
                  {buttonLabel}
                </GoldButton>
              )}
              {buttonVariant === "outline" && (
                <OutlineButton size="sm" theme="light" onClick={onButtonClick}>
                  {buttonLabel}
                </OutlineButton>
              )}
              {buttonVariant === "blue" && <BlueButton onClick={onButtonClick}>{buttonLabel}</BlueButton>}
              {!compact && <PricingCardButtonSubtext subtext={buttonSubtext} />}
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}

const PRICING_CARDS: PricingCardData[] = [
  {
    title: "Discovery",
    features: ["ATS hacks", "Role mapping", "Niche discovery", "Base resume rebuild", "Job search playbook", "Personalised strategy"],
    price: "£0",
    originalPrice: "£85",
    buttonLabel: "Book Call for Free",
    buttonVariant: "black",
    buttonSubtext: { kind: "plain", text: "No Credit Card" },
    freeRibbon: true,
  },
  {
    title: "LinkedIn Branding",
    features: [
      "DP, Headline, About",
      "Cover photo designed",
      "Monthly content engine",
      "The comments strategy",
      "Outbound to recruiters",
      "Personal branding system",
    ],
    price: "£77",
    buttonLabel: "Book Call",
    buttonVariant: "outline",
    compact: true,
  },
  {
    title: "Application Strategy",
    features: [
      "Tailored Applications",
      "Daily Application System",
      "Referral Mastery",
      "Cold emails that convert",
      "Portfolio building",
      "Application tracking",
    ],
    price: "£85",
    buttonLabel: "Book Call",
    buttonVariant: "outline",
    compact: true,
  },
  {
    title: "Interview Mastery",
    features: [
      "Interview prep prompts",
      "STAR methodologies",
      "Value Proposition Doc",
      "30-60-90 day plans",
      "Sponsorship Negotiation",
      "Personalised Feedbacks",
    ],
    price: "£99",
    buttonLabel: "Book Call",
    buttonVariant: "outline",
    compact: true,
  },
  {
    title: "Full System",
    features: [
      "All 4 Modules included",
      "1-on-1 Mentorship",
      "Lifetime Community Access",
      "Access to Exclusive Webinars",
      "24x7 Career coach support",
      "Credibility System",
    ],
    price: "£199",
    originalPrice: "£340",
    buttonLabel: "Sign Up",
    buttonVariant: "blue",
    buttonSubtext: { kind: "cohort", seatsLeft: 25 },
    featured: true,
  },
];

export default function MasterclassLandingPage() {
  const router = useRouter();
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [onboardingIntent, setOnboardingIntent] = useState<MasterclassOnboardingIntent>("booking");

  useEffect(() => {
    document.body.classList.add("masterclass-page");
    document.documentElement.classList.add("masterclass-page");

    const calendlyLink = document.createElement("link");
    calendlyLink.href = "https://assets.calendly.com/assets/external/widget.css";
    calendlyLink.rel = "stylesheet";
    document.head.appendChild(calendlyLink);

    return () => {
      document.body.classList.remove("masterclass-page");
      document.documentElement.classList.remove("masterclass-page");
      const existingLink = document.querySelector('link[href="https://assets.calendly.com/assets/external/widget.css"]');
      if (existingLink) document.head.removeChild(existingLink);
    };
  }, []);

  const openOnboardingModal = (intent: MasterclassOnboardingIntent = "booking") => {
    setOnboardingIntent(intent);
    setOnboardingOpen(true);
  };

  const handleLeadSubmit = (lead: MasterclassLead) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        "masterclass_lead",
        JSON.stringify({
          ...lead,
          fullPhone: `${lead.dialCode}${lead.phone}`,
        })
      );
    }
    setOnboardingOpen(false);
    openCalendlyPopup({ name: lead.name, email: lead.email });
  };

  const handleSocialBook = (provider: "google" | "linkedin") => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("masterclass_lead", JSON.stringify({ bookingMethod: provider }));
    }
    setOnboardingOpen(false);
    openCalendlyPopup();
  };

  const handleSignUp = () => {
    router.push("/uniboard/unicoach");
  };

  const handleCardAction = (card: PricingCardData) => {
    if (card.buttonVariant === "blue") {
      handleSignUp();
      return;
    }
    openOnboardingModal();
  };

  return (
    <div className="masterclass-page-bg relative isolate min-h-screen font-sans text-[#eaeaea] selection:bg-[#346de0]/30">
      <div className="masterclass-hero-glow" aria-hidden />
      <div className="masterclass-dot-grid-overlay" aria-hidden />

      {/* Nav — fixed (sticky breaks due to overflow-x-hidden on page sections) */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.05] bg-[#0a0a0a]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-3 sm:px-10 lg:px-[90px] lg:py-3.5">
          <Link href="/" className="relative z-10 shrink-0">
            <UnimadLogo className="h-[18px] w-auto text-white sm:h-[20px]" />
          </Link>

          <OutlineButton size="nav" onClick={() => openOnboardingModal("booking")}>
            Book Free Discovery Call
          </OutlineButton>
        </div>
      </header>

      <div className="relative z-[1]">
        <div className="relative mx-auto w-full max-w-[1440px] px-6 pt-[62px] sm:px-10 lg:px-[90px] lg:pt-[66px]">
          <div className="relative z-[1]">
            {/* Hero headline */}
            <div className="mb-6 mt-10 lg:mb-8 lg:mt-16">
              <h1 className="text-[32px] font-medium leading-none tracking-[-1px] sm:text-[40px] lg:text-[50px]">
                Your <span className="masterclass-gold-text font-medium">Masterclass</span> is ready.
              </h1>
              <p className="mt-4 max-w-[437px] text-[16px] leading-normal tracking-[-0.36px] text-[#e7e7e7] lg:mt-5 lg:text-[18px]">
                The exact playbook 5000+ international students used to land interviews.
              </p>
            </div>

            {/* Hero content */}
            <div className="mb-16 flex flex-col gap-6 lg:mb-20 lg:flex-row lg:gap-[41px]">
              {/* Video */}
              <MasterclassFrame
                clip
                className="relative z-[1] h-[280px] w-full shrink-0 sm:h-[360px] lg:h-[456px] lg:w-[809px]"
                contentClassName="relative h-full"
              >
                <Image
                  src="/images/masterclass/video-thumbnail.jpg"
                  alt="Masterclass preview"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 809px"
                  priority
                />
                <button
                  type="button"
                  onClick={() => openOnboardingModal("video")}
                  className="absolute inset-0 z-10 flex items-center justify-center transition-transform hover:scale-[1.01]"
                  aria-label="Play masterclass preview"
                >
                  <MasterclassPlayButton className="size-[72px] transition-transform hover:scale-105 sm:size-[88px] lg:size-[104px]" />
                </button>
              </MasterclassFrame>

              {/* CTA card */}
              <MasterclassFrame className="w-full lg:h-[456px] lg:w-[410px]" contentClassName="flex h-full flex-col p-6 sm:p-7 lg:p-[27px]">
                <p className="text-[28px] leading-[1.2] tracking-[-0.8px] text-[#eaeaea] sm:text-[32px] lg:text-[40px]">
                  The exact playbook 5000+ international students used to land interviews.
                </p>

                <div className="mt-8 flex flex-col lg:mt-auto">
                  <div className="mb-4 flex items-center gap-3">
                    <CoachAvatars />
                    <p className="text-[16px] leading-normal tracking-[-0.36px] text-[#e7e7e7] lg:text-[18px]">
                      Career coaches with a 90% Success Rate
                    </p>
                  </div>
                  <GoldButton onClick={() => openOnboardingModal("booking")}>Book Free Discovery Call</GoldButton>
                </div>
              </MasterclassFrame>
            </div>
          </div>

          <MasterclassStoriesSection />

          <MasterclassPlacementsSection />

          <div className="relative left-1/2 w-screen -translate-x-1/2 masterclass-light-band">
            <div className="masterclass-light-band__dots" aria-hidden />
            <div className="relative z-[1] mx-auto w-full max-w-[1440px] px-6 py-16 sm:px-10 lg:px-[90px] lg:py-24">
              <section className="masterclass-pricing-band" aria-labelledby="masterclass-pricing-heading">
                <div className="mb-8 text-center lg:mb-10">
                  <h2
                    id="masterclass-pricing-heading"
                    className="text-[24px] font-medium leading-none tracking-[-0.6px] text-slate-900 sm:text-[28px] lg:text-[30px]"
                  >
                    The Unimad Career Positioning System
                  </h2>
                  <p className="mx-auto mt-3 max-w-[520px] text-[14px] leading-normal tracking-[-0.28px] text-slate-500 sm:text-[15px]">
                    Start with a free discovery call, add the modules you need, or unlock the full system.
                  </p>
                </div>

                <div className="-mx-6 overflow-x-auto overflow-y-visible px-6 sm:-mx-10 sm:px-10 lg:mx-0 lg:overflow-visible lg:px-0">
                  <div className="flex w-max items-center gap-4 pb-2 lg:w-full lg:max-w-[1260px] lg:gap-3">
                    {PRICING_CARDS.map(card => (
                      <PricingCard key={card.title} {...card} onButtonClick={() => handleCardAction(card)} />
                    ))}
                  </div>
                </div>
              </section>

              <MasterclassFaqSection />
            </div>

            <footer className="relative z-[1] w-full border-t border-slate-200 px-6 pb-8 pt-14 sm:px-10 lg:px-[90px] lg:pb-12 lg:pt-16">
              <div className="flex w-full flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
                <Link href="/">
                  <UnimadLogo className="h-[29px] w-auto text-[#346de0] sm:h-[35px]" />
                </Link>

                <div className="max-w-[463px] lg:ml-auto">
                  <p className="text-[17px] font-medium leading-[1.2] tracking-[-0.35px] text-slate-900">Need a hand? Talk to us.</p>
                  <p className="mt-3 text-[12px] leading-[1.25] tracking-[-0.23px] text-slate-500">
                    Questions about the Masterclass, the tools, or coaching? The team&apos;s one message away.
                  </p>
                  <p className="mt-4 text-[18px] tracking-[-0.36px] text-[#346de0]">
                    <a href="mailto:grow@unimad.ai" className="hover:underline">
                      grow@unimad.ai
                    </a>
                    <span className="mx-3 text-slate-300">|</span>
                    <a href="tel:+441234567890" className="hover:underline">
                      +44 12345 67890
                    </a>
                  </p>
                </div>
              </div>
            </footer>
          </div>
        </div>
      </div>

      <Script src="https://assets.calendly.com/assets/external/widget.js" strategy="lazyOnload" />

      <MasterclassOnboardingModal
        open={onboardingOpen}
        intent={onboardingIntent}
        onClose={() => setOnboardingOpen(false)}
        onSubmit={handleLeadSubmit}
        onSocialBook={handleSocialBook}
      />
    </div>
  );
}
