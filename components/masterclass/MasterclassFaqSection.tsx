"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQ_ITEMS = [
  {
    q: "Is it free?",
    a: "Yes, the initial Masterclass is 100% free. We want to help international students break the debt cycle and land high-paying roles.",
  },
  {
    q: "Will there be a replay?",
    a: "No recordings will be provided. The best value comes from the live, interactive session where you can ask specific questions about your job search.",
  },
  {
    q: "Who can join?",
    a: "International students in the UK, US, Canada, Ireland, Australia, and New Zealand who are hungry to land a full-time job.",
  },
  {
    q: "Do I need to be in a tech background?",
    a: "Not at all. We focus on strategy, positioning, and psychological triggers that make recruiters notice you, regardless of your background.",
  },
  {
    q: "What is included in the Full System?",
    a: "All four modules, 1-on-1 mentorship, lifetime community access, exclusive webinars, and 24/7 career coach support.",
  },
  {
    q: "How does the Discovery call work?",
    a: "Book a free first call with no credit card required. We map your goals, review your positioning, and outline a personalised plan.",
  },
] as const;

export function MasterclassFaqSection() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="pt-24 lg:pt-32" aria-labelledby="masterclass-faq-heading">
      <h2
        id="masterclass-faq-heading"
        className="mb-8 text-center text-[24px] font-medium leading-none tracking-[-0.6px] text-slate-900 sm:text-[28px] lg:mb-10 lg:text-[30px]"
      >
        Frequently asked questions
      </h2>

      <div className="mx-auto max-w-[720px] border-t border-slate-200">
        {FAQ_ITEMS.map((item, index) => {
          const isOpen = openIndex === index;

          return (
            <div key={item.q} className="border-b border-slate-200">
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? -1 : index)}
                className="flex w-full items-center justify-between gap-4 py-5 text-left sm:py-6"
                aria-expanded={isOpen}
              >
                <span className="text-[14px] font-medium leading-[1.35] tracking-[-0.28px] text-slate-900 sm:text-[15px]">{item.q}</span>
                <ChevronDown
                  size={18}
                  className={`shrink-0 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                  aria-hidden
                />
              </button>
              {isOpen ? (
                <div className="pb-5 sm:pb-6">
                  <p className="max-w-[640px] text-[13px] leading-[1.55] tracking-[-0.26px] text-slate-500 sm:text-[14px]">{item.a}</p>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
