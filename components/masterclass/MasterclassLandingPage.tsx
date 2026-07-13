/* eslint-disable @typescript-eslint/ban-ts-comment -- v1 port; types tightened in follow-up */
// @ts-nocheck
"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { MasterclassFaqSection } from "@/components/masterclass/MasterclassFaqSection";
import { MasterclassOnboardingModal } from "@/components/masterclass/MasterclassOnboardingModal";
import { MasterclassPlacementsSection } from "@/components/masterclass/MasterclassPlacementsSection";
import { MasterclassStoriesSection } from "@/components/masterclass/MasterclassStoriesSection";
import { UnimadLogo } from "@/components/unimad-logo";
import {
  MASTERCLASS_LEAD_SESSION_KEY,
  MASTERCLASS_LEAD_SOURCE_DISCOVERY,
  MASTERCLASS_LEAD_SOURCE_VSL_VIDEO,
  MASTERCLASS_THANKS_INTEREST_PATH,
  MASTERCLASS_VIDEO_PLAYBACK_RATE,
  MASTERCLASS_VIDEO_URL,
  MASTERCLASS_VSL_FORM_COMPLETE_KEY,
  MASTERCLASS_WHATSAPP_NUMBER_DISPLAY,
  MASTERCLASS_WHATSAPP_URL,
} from "@/constants/masterclass";
import { PRICING_CARD_PLAN_BY_TITLE, type UnicoachProductPlanId } from "@/constants/unicoach-plans";
import { launchUnicoachRazorpayCheckout } from "@/features/unicoach/lib/launch-unicoach-razorpay-checkout";
import { useAuthStatus } from "@/hooks/useAuthStatus";
import {
  enrollAuthenticatedMasterclassMember,
  fetchMasterclassLead,
  submitMasterclassLead,
  unlockMasterclassWatch,
} from "@/lib/actions/masterclassLeads";
import { ensureCalendlyAssets, openMasterclassDiscoveryCalendly } from "@/lib/masterclass/calendly";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Script from "next/script";

function notifyError(message: string) {
  console.error(message);
}

function readStoredLeadSession() {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(MASTERCLASS_LEAD_SESSION_KEY);
    if (!raw) return null;
    const lead = JSON.parse(raw);
    const uid = lead.uid || (lead.leadId != null ? String(lead.leadId) : null);
    if (!uid) return null;
    return {
      uid,
      name: lead.name || "",
      email: lead.email || "",
      hasContact: Boolean(lead.name && lead.email),
      discoveryComplete: Boolean(lead.discoveryComplete ?? lead.discovery_complete),
      qualificationStatus: lead.qualificationStatus ?? lead.qualification_status ?? null,
    };
  } catch {
    return null;
  }
}

function MasterclassFrame({
  children,
  className = "",
  contentClassName = "",
  radius = "10",
  featured = false,
  variant = "default",
  clip = false,
}) {
  const frameRef = useRef(null);

  const handleMouseMove = e => {
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
      style={{ "--mouse-x": "50%", "--mouse-y": "50%" }}
      className={`masterclass-frame ${radius === "14" ? "masterclass-frame--14" : ""} ${variant === "card" ? "masterclass-frame--card" : ""} ${featured ? "masterclass-frame--featured" : ""} ${className}`}
    >
      <div className={`masterclass-frame__inner ${clip ? "masterclass-frame__inner--clip overflow-hidden" : ""}`}>
        {!clip && <div className="masterclass-frame__glow" aria-hidden />}
        <div className={`masterclass-frame__content ${contentClassName}`}>{children}</div>
      </div>
    </div>
  );
}

function GoldButton({ children, className = "", onClick, size = "lg" }) {
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

function BlackButton({ children, className = "", onClick, size = "sm" }) {
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

function OutlineButton({ children, className = "", onClick, size = "lg", theme = "dark" }) {
  const sizeClasses =
    size === "lg"
      ? "h-[49px] rounded-full text-[18px] font-semibold tracking-[-0.54px]"
      : size === "nav"
        ? "h-[32px] rounded-full px-3 text-[11px] font-semibold tracking-[-0.33px] sm:px-4 sm:text-[12px] sm:tracking-[-0.36px]"
        : "h-[31px] rounded-full text-[12px] font-semibold tracking-[-0.36px]";

  const widthClass = size === "nav" ? "w-auto shrink-0 max-w-[calc(100vw-7rem)]" : "w-full";

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

function BlueButton({ children, className = "", onClick, size = "sm" }) {
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

function MasterclassPlayButton({ className = "" }) {
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

function StrikethroughPrice({ children, className = "" }) {
  return (
    <span
      className={`text-[24px] font-medium leading-[1.2] tracking-[-0.48px] line-through decoration-[#e35959] decoration-1 ${className}`}
    >
      {children}
    </span>
  );
}

function parsePrice(value) {
  return Number(value.replace(/[^0-9.]/g, ""));
}

function getDiscountPercent(original, current) {
  const originalAmount = parsePrice(original);
  const currentAmount = parsePrice(current);
  if (!originalAmount || originalAmount <= currentAmount) return 0;
  return Math.round((1 - currentAmount / originalAmount) * 100);
}

function DiscountCornerSticker({ percent }) {
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

function PricingCardButtonSubtext({ subtext, className = "" }) {
  return (
    <p className={`mt-2.5 min-h-[16px] text-center text-[11px] font-medium leading-[1.2] tracking-[-0.22px] ${className}`}>
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

function PricingCardActions({ buttonLabel, buttonVariant, buttonSubtext, compact = false, onAction }) {
  return (
    <>
      {buttonVariant === "black" && (
        <BlackButton size="sm" onClick={onAction}>
          {buttonLabel}
        </BlackButton>
      )}
      {buttonVariant === "gold" && (
        <GoldButton size="sm" onClick={onAction}>
          {buttonLabel}
        </GoldButton>
      )}
      {buttonVariant === "outline" && (
        <OutlineButton size="sm" theme="light" onClick={onAction}>
          {buttonLabel}
        </OutlineButton>
      )}
      {buttonVariant === "blue" && <BlueButton onClick={onAction}>{buttonLabel}</BlueButton>}
      {!compact && <PricingCardButtonSubtext subtext={buttonSubtext} />}
    </>
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
  couponCode,
  onCouponChange,
  checkoutPending = false,
  checkoutPhase = "",
}) {
  const discountPercent = featured && originalPrice ? getDiscountPercent(originalPrice, price) : 0;

  const cardModifierClasses = [
    freeRibbon ? "masterclass-pricing-card--discovery" : "",
    featured ? "masterclass-pricing-card--featured" : "",
    compact ? "masterclass-pricing-card--compact" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const heightClasses = compact ? "h-[360px] sm:h-[382px]" : featured ? "h-[420px] sm:h-[444px]" : "h-[384px] sm:h-[408px]";

  return (
    <div
      className={`masterclass-pricing-card group relative flex w-[min(82vw,260px)] shrink-0 snap-center flex-col sm:w-[245px] lg:w-auto lg:min-w-0 lg:flex-1 ${cardModifierClasses}`}
    >
      <div className={`relative w-full ${heightClasses}`}>
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
              {featured && typeof onCouponChange === "function" ? (
                <input
                  type="text"
                  value={couponCode || ""}
                  disabled={checkoutPending}
                  onChange={e => onCouponChange(e.target.value.toUpperCase())}
                  placeholder="Coupon code (optional)"
                  className="mb-3 w-full rounded-full border border-slate-200 bg-white px-3 py-2 text-center text-[12px] text-slate-800 placeholder:text-slate-400"
                />
              ) : null}
              <PricingCardActions
                buttonLabel={checkoutPending && featured ? checkoutPhase || "Opening…" : buttonLabel}
                buttonVariant={buttonVariant}
                buttonSubtext={buttonSubtext}
                compact={compact}
                onAction={onButtonClick}
              />
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}

const PRICING_CARDS = [
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

function MobilePricingPrice({ price, originalPrice, crossOutPrice = false }) {
  const priceClass = "text-[18px] tracking-[-0.36px]";
  const strikeClass = "!text-[18px] !leading-none tracking-[-0.36px]";

  return (
    <div className="flex shrink-0 items-center justify-end gap-1">
      {originalPrice && <StrikethroughPrice className={`text-slate-300 ${strikeClass}`}>{originalPrice}</StrikethroughPrice>}
      {crossOutPrice ? (
        <StrikethroughPrice className={`text-slate-300 ${strikeClass}`}>{price}</StrikethroughPrice>
      ) : (
        <span className={`font-medium leading-none ${priceClass} ${parsePrice(price) === 0 ? "text-[#22c55e]" : "text-slate-900"}`}>
          {price}
        </span>
      )}
    </div>
  );
}

function MobilePricingSleekCta({ buttonLabel, buttonVariant, onAction }) {
  const compactClass =
    "!w-full !max-w-[158px] shrink-0 !h-8 !min-h-8 whitespace-nowrap px-2 !text-[14px] !font-semibold !leading-none tracking-[-0.28px] [&_span]:px-1";

  const handleClick = event => {
    event.stopPropagation();
    onAction();
  };

  if (buttonVariant === "black") {
    return (
      <BlackButton size="sm" onClick={handleClick} className={compactClass}>
        {buttonLabel}
      </BlackButton>
    );
  }

  if (buttonVariant === "gold") {
    return (
      <GoldButton size="sm" onClick={handleClick} className={compactClass}>
        {buttonLabel}
      </GoldButton>
    );
  }

  if (buttonVariant === "blue") {
    return (
      <BlueButton size="sm" onClick={handleClick} className={compactClass}>
        {buttonLabel}
      </BlueButton>
    );
  }

  return (
    <OutlineButton size="sm" theme="light" onClick={handleClick} className={`${compactClass} !rounded-full`}>
      {buttonLabel}
    </OutlineButton>
  );
}

function MobilePricingAccordionItem({
  card,
  expanded,
  onToggle,
  onAction,
  couponCode,
  onCouponChange,
  checkoutPending = false,
  checkoutPhase = "",
}) {
  const discountPercent = card.featured && card.originalPrice ? getDiscountPercent(card.originalPrice, card.price) : 0;

  const cardModifierClasses = [
    card.freeRibbon ? "masterclass-pricing-card--discovery" : "",
    card.featured ? "masterclass-pricing-card--featured" : "",
    card.compact ? "masterclass-pricing-card--compact" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article
      className={`masterclass-pricing-card group relative overflow-hidden rounded-[14px] border bg-white ${cardModifierClasses} ${
        card.featured ? "border-brand-300 shadow-sm shadow-brand-500/10" : "border-slate-300"
      }`}
    >
      {card.freeRibbon && <FreeCornerRibbon />}
      {discountPercent > 0 && <DiscountCornerSticker percent={discountPercent} />}

      <div className="masterclass-mobile-pricing-row grid grid-cols-[18px_minmax(0,1fr)_72px_158px] items-center gap-x-2 py-2.5 pl-2 pr-3 sm:pl-2.5 sm:pr-4">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-label={`${expanded ? "Collapse" : "Expand"} ${card.title} features`}
          className="flex shrink-0 items-center justify-center self-center p-0 text-slate-400"
        >
          <ChevronDown size={16} className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} aria-hidden />
        </button>

        <button type="button" onClick={onToggle} aria-expanded={expanded} className="min-w-0 self-center text-left">
          <p className="line-clamp-2 pr-1 text-[16px] font-medium leading-snug tracking-[-0.32px] text-slate-900">{card.title}</p>
        </button>

        <div className="flex items-center justify-end">
          <MobilePricingPrice price={card.price} originalPrice={card.originalPrice} crossOutPrice={card.crossOutPrice} />
        </div>

        <div className="flex h-8 items-center justify-end">
          <MobilePricingSleekCta
            buttonLabel={checkoutPending && card.featured ? checkoutPhase || "Opening…" : card.buttonLabel}
            buttonVariant={card.buttonVariant}
            onAction={onAction}
          />
        </div>
      </div>

      {expanded ? (
        <div className="border-t border-slate-100 py-3 pl-2 pr-3 sm:pl-2.5 sm:pr-4">
          {!card.compact && card.buttonSubtext ? (
            <PricingCardButtonSubtext subtext={card.buttonSubtext} className="!mt-0 mb-3 text-right" />
          ) : null}
          {card.featured && typeof onCouponChange === "function" ? (
            <input
              type="text"
              value={couponCode || ""}
              disabled={checkoutPending}
              onChange={e => onCouponChange(e.target.value.toUpperCase())}
              placeholder="Coupon code (optional)"
              className="mb-3 w-full rounded-full border border-slate-200 bg-white px-3 py-2 text-center text-[12px] text-slate-800 placeholder:text-slate-400"
            />
          ) : null}
          <ul className="space-y-2.5 text-[13px] leading-[1.35] tracking-[-0.26px] text-slate-600">
            {card.features.map(feature => (
              <li key={feature} className="flex gap-2">
                <span className="text-brand-600" aria-hidden>
                  •
                </span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}

function MobilePricingSection({ cards, onCardAction, couponCode, onCouponChange, checkoutPending = false, checkoutPhase = "" }) {
  const [expandedPlans, setExpandedPlans] = useState(new Set());

  const togglePlan = title => {
    setExpandedPlans(previous => {
      const next = new Set(previous);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-3 md:hidden">
      {cards.map(card => (
        <MobilePricingAccordionItem
          key={card.title}
          card={card}
          expanded={expandedPlans.has(card.title)}
          onToggle={() => togglePlan(card.title)}
          onAction={() => onCardAction(card)}
          couponCode={card.featured ? couponCode : undefined}
          onCouponChange={card.featured ? onCouponChange : undefined}
          checkoutPending={checkoutPending}
          checkoutPhase={checkoutPhase}
        />
      ))}
      <p className="pt-1 text-center text-[11px] font-medium tracking-[-0.2px] text-slate-400">Tap the arrow to see what&apos;s included</p>
    </div>
  );
}

function MasterclassVideoPlayer({ src, poster, autoPlay = false, onPlay }) {
  const videoRef = useRef(null);

  const applyPlaybackRate = video => {
    if (video) {
      video.playbackRate = MASTERCLASS_VIDEO_PLAYBACK_RATE;
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    applyPlaybackRate(video);

    if (!autoPlay) return;

    video.play().catch(() => {
      // Autoplay may be blocked until user interaction.
    });
  }, [autoPlay, src]);

  const blockSaveContextMenu = event => {
    event.preventDefault();
  };

  return (
    <video
      ref={videoRef}
      src={src}
      poster={poster}
      className="masterclass-video-player h-full w-full object-cover"
      controls
      controlsList="nodownload noremoteplayback"
      disablePictureInPicture
      playsInline
      preload="metadata"
      onLoadedMetadata={event => applyPlaybackRate(event.currentTarget)}
      onPlay={onPlay}
      onContextMenu={blockSaveContextMenu}
    />
  );
}

function MasterclassHeroPreview({ canWatch, autoPlay, onRequestAccess, onVideoPlay }) {
  if (canWatch) {
    return (
      <MasterclassVideoPlayer
        src={MASTERCLASS_VIDEO_URL}
        poster="/images/masterclass/video-thumbnail.jpg"
        autoPlay={autoPlay}
        onPlay={onVideoPlay}
      />
    );
  }

  return (
    <>
      {/* Preview loop disabled until MASTERCLASS_VIDEO_PREVIEW_URL is a real short clip. */}
      {/* <video
        src={MASTERCLASS_VIDEO_PREVIEW_URL}
        poster="/images/masterclass/video-thumbnail.jpg"
        className="h-full w-full object-cover"
        muted
        loop
        autoPlay
        playsInline
        preload="metadata"
      /> */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/masterclass/video-thumbnail.jpg" alt="Masterclass preview" className="h-full w-full object-cover" />
      <button
        type="button"
        onClick={onRequestAccess}
        className="absolute inset-0 z-10 flex items-center justify-center bg-black/25 transition-transform hover:scale-[1.01]"
        aria-label="Unlock masterclass video"
      >
        <MasterclassPlayButton className="size-16 transition-transform hover:scale-105 sm:size-[88px] lg:size-[104px]" />
      </button>
    </>
  );
}

const BOOKING_UNLOCK_MS = 30_000;

export default function MasterclassLandingPage({ variant = "ads" }) {
  const isOrganic = variant === "organic";
  const router = useRouter();
  const { isAuthenticated } = useAuthStatus();
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [onboardingIntent, setOnboardingIntent] = useState("booking");
  const [onboardingInitialStep, setOnboardingInitialStep] = useState("details");
  const [onboardingInitialLead, setOnboardingInitialLead] = useState(null);
  const [videoUnlocked, setVideoUnlocked] = useState(false);
  const [shouldAutoplayVideo, setShouldAutoplayVideo] = useState(false);
  const [checkoutPending, setCheckoutPending] = useState(false);
  const [checkoutPhase, setCheckoutPhase] = useState("");
  const [fullSystemCoupon, setFullSystemCoupon] = useState("");
  const [checkoutError, setCheckoutError] = useState("");
  const [deepLinkProcessing, setDeepLinkProcessing] = useState(false);
  const [showUnlockHint, setShowUnlockHint] = useState(false);
  const [bookingCooldown, setBookingCooldown] = useState(false);
  const memberEnrollRef = useRef(false);

  const canWatchVideo = videoUnlocked || isAuthenticated;

  const enrollSignedInMember = useCallback(async () => {
    if (!isAuthenticated || memberEnrollRef.current) return;

    memberEnrollRef.current = true;
    try {
      const result = await enrollAuthenticatedMasterclassMember();
      sessionStorage.setItem(
        MASTERCLASS_LEAD_SESSION_KEY,
        JSON.stringify({
          uid: result.uid,
          leadId: result.lead_id,
          source: result.source,
        })
      );
      localStorage.setItem(MASTERCLASS_VSL_FORM_COMPLETE_KEY, "1");
      setVideoUnlocked(true);
    } catch {
      memberEnrollRef.current = false;
    }
  }, [isAuthenticated]);

  const handleMemberVideoPlay = useCallback(() => {
    localStorage.setItem(MASTERCLASS_VSL_FORM_COMPLETE_KEY, "1");
    setVideoUnlocked(true);
    enrollSignedInMember();
  }, [enrollSignedInMember]);

  useEffect(() => {
    document.body.classList.add("masterclass-page");
    document.documentElement.classList.add("masterclass-page");
    const cleanupCalendly = ensureCalendlyAssets();

    if (typeof window !== "undefined") {
      const vslComplete =
        localStorage.getItem(MASTERCLASS_VSL_FORM_COMPLETE_KEY) === "1" || localStorage.getItem("masterclass_vsl_form_completed") === "1";
      if (vslComplete) {
        localStorage.setItem(MASTERCLASS_VSL_FORM_COMPLETE_KEY, "1");
        setVideoUnlocked(true);
      }
      const params = new URLSearchParams(window.location.search);
      if (params.get("autoplay") === "1") {
        setShouldAutoplayVideo(true);
      }
    }

    return () => {
      cleanupCalendly();
      document.body.classList.remove("masterclass-page");
      document.documentElement.classList.remove("masterclass-page");
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      setVideoUnlocked(true);
      enrollSignedInMember();
    }
  }, [isAuthenticated, enrollSignedInMember]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const uid = params.get("uid");
    const book = params.get("book");
    const watch = params.get("watch");

    if (!uid) return;

    let cancelled = false;

    const resumeDiscoveryLead = lead => {
      sessionStorage.setItem(
        MASTERCLASS_LEAD_SESSION_KEY,
        JSON.stringify({
          name: lead.name,
          email: lead.email,
          uid: lead.uid,
          leadId: lead.lead_id,
          source: lead.source,
          discoveryComplete: Boolean(lead.discovery_complete),
          qualificationStatus: lead.qualification_status ?? null,
        })
      );

      if (lead.discovery_complete) {
        if (lead.qualification_status === "qualified") {
          openMasterclassDiscoveryCalendly({ name: lead.name, email: lead.email, uid: lead.uid }, () =>
            router.push(`/masterclass/confirmed?uid=${encodeURIComponent(lead.uid)}`)
          );
        } else if (lead.qualification_status === "unqualified") {
          router.replace(`${MASTERCLASS_THANKS_INTEREST_PATH}?uid=${encodeURIComponent(lead.uid)}`);
        }
        return;
      }

      if (lead.has_contact_details) {
        setOnboardingInitialLead({
          uid: lead.uid,
          name: lead.name,
          email: lead.email,
        });
        setOnboardingInitialStep("questions");
        setOnboardingIntent("booking");
        setOnboardingOpen(true);
      } else {
        setOnboardingInitialLead({ uid: lead.uid });
        setOnboardingInitialStep("details");
        setOnboardingIntent("booking");
        setOnboardingOpen(true);
      }

      router.replace("/masterclass");
    };

    (async () => {
      setDeepLinkProcessing(true);
      try {
        if (watch === "1" || watch === "true") {
          await unlockMasterclassWatch(uid);
          if (cancelled) return;
          localStorage.setItem(MASTERCLASS_VSL_FORM_COMPLETE_KEY, "1");
          setVideoUnlocked(true);
          setShouldAutoplayVideo(true);
          router.replace("/masterclass?autoplay=1");
          return;
        }

        if (book === "discovery" || !book) {
          const lead = await fetchMasterclassLead(uid);
          if (cancelled) return;
          resumeDiscoveryLead(lead);
        }
      } catch (error) {
        if (!cancelled) {
          notifyError(error?.message || "This link could not be processed.");
          router.replace("/masterclass");
        }
      } finally {
        if (!cancelled) setDeepLinkProcessing(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const openOnboardingModal = (intent = "booking", options = {}) => {
    setOnboardingIntent(intent);
    setOnboardingInitialStep(options.initialStep || "details");
    setOnboardingInitialLead(options.initialLead || null);
    setOnboardingOpen(true);
  };

  const openQualifiedCalendly = async stored => {
    let prefill = { name: stored?.name, email: stored?.email };

    if (stored?.uid && (!prefill.name || !prefill.email)) {
      try {
        const lead = await fetchMasterclassLead(stored.uid);
        prefill = { name: lead.name, email: lead.email };
        persistLeadSession(lead, {
          discoveryComplete: true,
          qualificationStatus: lead.qualification_status ?? "qualified",
        });
      } catch {
        // use whatever we have in session
      }
    }

    openMasterclassDiscoveryCalendly({ ...prefill, uid: stored?.uid }, () =>
      router.push(stored?.uid ? `/masterclass/confirmed?uid=${encodeURIComponent(stored.uid)}` : "/masterclass/confirmed")
    );
  };

  const openBookingModal = async () => {
    let stored = readStoredLeadSession();

    if (stored?.uid && !stored.discoveryComplete) {
      try {
        const lead = await fetchMasterclassLead(stored.uid);
        persistLeadSession(lead, {
          discoveryComplete: Boolean(lead.discovery_complete),
          qualificationStatus: lead.qualification_status ?? null,
        });
        stored = readStoredLeadSession();
      } catch {
        // fall back to session state
      }
    }

    const openWithStoredLead = () => {
      if (!stored) return false;

      if (stored.discoveryComplete && stored.qualificationStatus === "qualified") {
        openQualifiedCalendly(stored);
        return true;
      }

      if (stored.discoveryComplete && stored.qualificationStatus === "unqualified") {
        router.push(`${MASTERCLASS_THANKS_INTEREST_PATH}?uid=${encodeURIComponent(stored.uid)}`);
        return true;
      }

      openOnboardingModal("booking", {
        initialStep: stored.hasContact ? "questions" : "details",
        initialLead: {
          uid: stored.uid,
          name: stored.name,
          email: stored.email,
        },
      });
      return true;
    };

    if (isOrganic || canWatchVideo) {
      if (openWithStoredLead()) return;
      openOnboardingModal("booking");
      return;
    }

    if (!showUnlockHint) {
      setShowUnlockHint(true);
      setBookingCooldown(true);
      window.setTimeout(() => setBookingCooldown(false), BOOKING_UNLOCK_MS);
      return;
    }

    if (bookingCooldown) return;

    if (openWithStoredLead()) return;
    openOnboardingModal("booking");
  };

  const persistLeadSession = (lead, extra = {}) => {
    const savedUid = lead?.uid ?? (lead?.lead_id != null ? String(lead.lead_id) : null);
    const discoveryComplete = extra.discoveryComplete ?? (lead?.discovery_complete != null ? Boolean(lead.discovery_complete) : undefined);
    const qualificationStatus = extra.qualificationStatus ?? lead?.qualification_status ?? undefined;

    sessionStorage.setItem(
      MASTERCLASS_LEAD_SESSION_KEY,
      JSON.stringify({
        name: lead?.name,
        email: lead?.email,
        leadId: lead?.lead_id,
        uid: savedUid,
        source: lead?.source,
        ...(discoveryComplete != null ? { discoveryComplete } : {}),
        ...(qualificationStatus != null ? { qualificationStatus } : {}),
        ...extra,
      })
    );
    return savedUid;
  };

  const handleLeadSubmit = async payload => {
    if (payload.stage === "contact") {
      const result = await submitMasterclassLead({
        name: payload.name,
        email: payload.email,
        dial_code: payload.dialCode,
        phone: payload.phone,
        source: MASTERCLASS_LEAD_SOURCE_DISCOVERY,
        stage: "contact",
        uid: payload.uid,
      });
      persistLeadSession(result, {
        dialCode: payload.dialCode,
        phone: payload.phone,
      });
      return;
    }

    if (onboardingIntent === "video") {
      const result = await submitMasterclassLead({
        name: payload.name,
        email: payload.email,
        dial_code: payload.dialCode,
        phone: payload.phone,
        source: MASTERCLASS_LEAD_SOURCE_VSL_VIDEO,
      });
      persistLeadSession(result, {
        dialCode: payload.dialCode,
        phone: payload.phone,
        fullPhone: `${payload.dialCode}${payload.phone}`,
      });
      localStorage.setItem(MASTERCLASS_VSL_FORM_COMPLETE_KEY, "1");
      setVideoUnlocked(true);
      setShouldAutoplayVideo(true);
      setOnboardingOpen(false);
      return;
    }

    const result = await submitMasterclassLead({
      name: payload.name,
      email: payload.email,
      dial_code: payload.dialCode,
      phone: payload.phone,
      source: MASTERCLASS_LEAD_SOURCE_DISCOVERY,
      stage: "complete",
      uid: payload.uid,
      discovery: payload.discovery,
    });

    const savedUid = persistLeadSession(result, {
      dialCode: payload.dialCode,
      phone: payload.phone,
      fullPhone: `${payload.dialCode}${payload.phone}`,
      discoveryComplete: true,
      qualificationStatus: result.qualification_status ?? null,
    });

    setOnboardingOpen(false);

    if (result.qualification_status === "unqualified") {
      router.push(savedUid ? `${MASTERCLASS_THANKS_INTEREST_PATH}?uid=${encodeURIComponent(savedUid)}` : MASTERCLASS_THANKS_INTEREST_PATH);
      return;
    }

    openMasterclassDiscoveryCalendly({ name: payload.name, email: payload.email, uid: savedUid }, () =>
      router.push(savedUid ? `/masterclass/confirmed?uid=${encodeURIComponent(savedUid)}` : "/masterclass/confirmed")
    );
  };

  const handleSignUp = async (planId: UnicoachProductPlanId = "unicoach_program") => {
    if (checkoutPending) return;
    setCheckoutError("");
    setCheckoutPending(true);
    const result = await launchUnicoachRazorpayCheckout({
      isAuthenticated: Boolean(isAuthenticated),
      planId,
      discountCode: planId === "unicoach_program" ? fullSystemCoupon : null,
      onPhase: setCheckoutPhase,
    });
    setCheckoutPending(false);
    setCheckoutPhase("");
    if (result.ok) {
      if (result.redirectTo) router.push(result.redirectTo);
      return;
    }
    if (!result.cancelled && result.message) {
      setCheckoutError(result.message);
      notifyError(result.message);
    }
  };

  const handleCardAction = card => {
    const mapped = PRICING_CARD_PLAN_BY_TITLE[card.title];
    if (mapped === "discovery" || !mapped) {
      openBookingModal();
      return;
    }
    void handleSignUp(mapped);
  };

  return (
    <div className="masterclass-page-bg relative isolate min-h-screen overflow-x-hidden text-[#eaeaea] selection:bg-[#346de0]/30">
      {deepLinkProcessing ? (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-3 bg-[#0a0a0a]/90 backdrop-blur-sm">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-[#346de0]" />
          <p className="text-sm text-[#eaeaea]/70">Setting things up for you…</p>
        </div>
      ) : null}
      <div className="masterclass-hero-glow" aria-hidden />
      <div className="masterclass-dot-grid-overlay" aria-hidden />

      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.05] bg-[#0a0a0a]/85 backdrop-blur-md pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex max-w-[1440px] items-center justify-center px-4 py-2.5 sm:px-10 sm:py-3 lg:px-[90px] lg:py-3.5">
          <Link href="/" className="relative z-10 shrink-0">
            <UnimadLogo className="h-[17px] w-auto text-white sm:h-[20px]" />
          </Link>
        </div>
      </header>

      <div className="relative z-[1]">
        <div className="relative mx-auto w-full max-w-[1440px] px-4 pt-[calc(58px+env(safe-area-inset-top))] sm:px-10 lg:px-[90px] lg:pt-[calc(66px+env(safe-area-inset-top))]">
          <div className="relative z-[1]">
            <div className="mb-5 mt-6 sm:mb-6 sm:mt-10 lg:mb-8 lg:mt-16">
              <h1 className="text-[28px] font-medium leading-[1.05] tracking-[-0.9px] sm:text-[40px] sm:tracking-[-1px] lg:text-[50px]">
                Your <span className="masterclass-gold-text font-medium">Masterclass</span> is ready.
              </h1>
              <p className="mt-3 max-w-[437px] text-[15px] leading-normal tracking-[-0.32px] text-[#e7e7e7] sm:mt-4 sm:text-[16px] lg:mt-5 lg:text-[18px] lg:tracking-[-0.36px]">
                Twenty minutes. One system. Everything that actually changes how recruiters read your profile.
              </p>
            </div>

            <div className="mb-12 flex flex-col gap-5 sm:mb-16 sm:gap-6 lg:mb-20 lg:flex-row lg:gap-[41px]">
              <MasterclassFrame
                clip
                className="relative z-[1] aspect-[16/10] h-auto w-full shrink-0 sm:aspect-auto sm:h-[360px] lg:h-[456px] lg:w-[809px]"
                contentClassName="relative h-full min-h-[220px] sm:min-h-0"
              >
                <MasterclassHeroPreview
                  canWatch={canWatchVideo}
                  autoPlay={shouldAutoplayVideo}
                  onRequestAccess={() => openOnboardingModal("video")}
                  onVideoPlay={handleMemberVideoPlay}
                />
              </MasterclassFrame>

              <MasterclassFrame
                className="w-full min-h-[240px] sm:h-[360px] lg:h-[456px] lg:w-[410px]"
                contentClassName="flex h-full min-h-0 flex-col px-5 pt-5 pb-8 sm:px-7 sm:pt-7 lg:px-[27px] lg:pt-[27px] lg:pb-8"
              >
                <p className="hidden text-[28px] leading-[1.2] tracking-[-0.8px] text-[#eaeaea] sm:block sm:text-[32px] lg:text-[40px]">
                  The exact playbook 5000+ international students used to land interviews.
                </p>

                <div className="mt-auto flex w-full flex-col">
                  {showUnlockHint && !isOrganic && !canWatchVideo ? (
                    <p className="mb-3 min-h-[2.5rem] text-center text-[13px] leading-snug tracking-[-0.28px] text-[#eaeaea]/55 sm:text-[14px]">
                      Watch the masterclass to unlock your free call
                    </p>
                  ) : (
                    <p className="mb-3 min-h-[2.5rem]" aria-hidden />
                  )}
                  <GoldButton onClick={openBookingModal}>Book Free Discovery Call</GoldButton>
                </div>
              </MasterclassFrame>
            </div>
          </div>

          <MasterclassStoriesSection />

          <div className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 masterclass-light-band">
            <div className="masterclass-light-band__dots" aria-hidden />
            <div className="relative z-[1] mx-auto w-full max-w-[1440px] px-4 pb-[calc(3rem+env(safe-area-inset-bottom))] pt-12 sm:px-10 sm:pb-16 sm:pt-16 lg:px-[90px] lg:pb-20 lg:pt-20">
              <MasterclassPlacementsSection />

              {isOrganic ? (
                <div className="mt-12 sm:mt-16 lg:mt-20">
                  <section className="masterclass-pricing-band" aria-labelledby="masterclass-pricing-heading">
                    <div className="mb-6 text-center sm:mb-8 lg:mb-10">
                      <h2
                        id="masterclass-pricing-heading"
                        className="text-[22px] font-medium leading-[1.1] tracking-[-0.55px] text-slate-900 sm:text-[28px] lg:text-[30px] lg:tracking-[-0.6px]"
                      >
                        The Unimad Career Positioning System
                      </h2>
                      <p className="mx-auto mt-2.5 max-w-[520px] px-1 text-[13px] leading-normal tracking-[-0.26px] text-slate-500 sm:mt-3 sm:text-[15px] sm:tracking-[-0.28px]">
                        Start free with a discovery call. Add the modules you need. Or take the full system in one go.
                      </p>
                    </div>

                    <MobilePricingSection
                      cards={PRICING_CARDS}
                      onCardAction={handleCardAction}
                      couponCode={fullSystemCoupon}
                      onCouponChange={setFullSystemCoupon}
                      checkoutPending={checkoutPending}
                      checkoutPhase={checkoutPhase}
                    />

                    <div className="hidden md:block">
                      <div className="masterclass-pricing-scroll -mx-4 overflow-x-auto overflow-y-visible px-4 sm:-mx-10 sm:px-10 lg:mx-0 lg:overflow-visible lg:px-0">
                        <div className="flex w-max items-stretch gap-3 pb-2 sm:gap-4 lg:w-full lg:max-w-[1260px] lg:gap-3">
                          {PRICING_CARDS.map(card => (
                            <PricingCard
                              key={card.title}
                              {...card}
                              onButtonClick={() => handleCardAction(card)}
                              couponCode={card.featured ? fullSystemCoupon : undefined}
                              onCouponChange={card.featured ? setFullSystemCoupon : undefined}
                              checkoutPending={checkoutPending}
                              checkoutPhase={checkoutPhase}
                            />
                          ))}
                        </div>
                      </div>
                      {checkoutError ? (
                        <p className="mt-3 text-center text-[12px] text-red-600">{checkoutError}</p>
                      ) : (
                        <p className="mt-3 text-center text-[11px] font-medium tracking-[-0.2px] text-slate-400 lg:hidden">
                          Swipe to explore all plans
                        </p>
                      )}
                    </div>
                  </section>

                  <MasterclassFaqSection />
                </div>
              ) : null}

              <footer className="mt-10 border-t border-slate-200 pt-10 sm:mt-14 sm:pt-14 lg:mt-16 lg:pt-16">
                <div className="flex w-full flex-col gap-6 sm:gap-8 lg:flex-row lg:items-start lg:justify-between">
                  <Link href="/">
                    <UnimadLogo className="h-[26px] w-auto text-[#346de0] sm:h-[35px]" />
                  </Link>

                  <div className="max-w-[463px] lg:ml-auto">
                    <p className="text-[16px] font-medium leading-[1.2] tracking-[-0.32px] text-slate-900 sm:text-[17px] sm:tracking-[-0.35px]">
                      Need a hand? Talk to us.
                    </p>
                    <p className="mt-2.5 text-[12px] leading-[1.35] tracking-[-0.23px] text-slate-500 sm:mt-3 sm:leading-[1.25]">
                      Questions about the Masterclass, the tools, or coaching? The team&apos;s one message away.
                    </p>
                    <div className="mt-3 flex flex-col gap-2 text-[16px] tracking-[-0.32px] text-[#346de0] sm:mt-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-1 sm:text-[18px] sm:tracking-[-0.36px]">
                      <a href="mailto:grow@unimad.ai" className="hover:underline">
                        grow@unimad.ai
                      </a>
                      <span className="hidden text-slate-300 sm:inline" aria-hidden>
                        |
                      </span>
                      <a
                        href={MASTERCLASS_WHATSAPP_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="WhatsApp only — tap to message us"
                        className="underline-offset-2 decoration-dotted hover:underline"
                      >
                        {MASTERCLASS_WHATSAPP_NUMBER_DISPLAY}
                      </a>
                    </div>
                  </div>
                </div>
              </footer>
            </div>
          </div>
        </div>
      </div>

      <Script src="https://assets.calendly.com/assets/external/widget.js" strategy="lazyOnload" />
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <MasterclassOnboardingModal
        open={onboardingOpen}
        intent={onboardingIntent}
        initialStep={onboardingInitialStep}
        initialLead={onboardingInitialLead}
        onClose={() => setOnboardingOpen(false)}
        onSubmit={handleLeadSubmit}
      />

      {checkoutPending ? (
        <div className="fixed inset-0 z-[190] flex flex-col items-center justify-center gap-3 bg-[#0a0a0a]/70 backdrop-blur-sm">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-[#346de0]" />
          <p className="text-sm text-[#eaeaea]/70">{checkoutPhase || "Opening payment…"}</p>
        </div>
      ) : null}
    </div>
  );
}
