"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQ_ITEMS = [
  {
    q: "Is the Discovery call free?",
    a: "Yes again. No card required. You only pay if you join the programme after.",
  },
  {
    q: "What happens after I book the call?",
    a: "You'll complete a short niche activity first, so the call is built around you, not generic.",
  },
  {
    q: "What if I don't complete the niche activity?",
    a: "The call gets cancelled and rescheduled. We need it to prep properly for you.",
  },
  {
    q: "What actually happens on the call?",
    a: "We fix your role and build your resume, live with you.",
  },
  {
    q: "I've already applied to 100s of jobs. Will this help?",
    a: "It'll help especially then. We have a 95% success rate on interviews.",
  },
  {
    q: "What if I don't want to continue after the call?",
    a: "We're still friends and you get to keep your resume and clarity either way.",
  },
] as const;

export function MasterclassFaqSection() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="pt-12 sm:pt-20 lg:pt-32" aria-labelledby="masterclass-faq-heading">
      <h2
        id="masterclass-faq-heading"
        className="mb-6 text-center text-[22px] font-medium leading-[1.1] tracking-[-0.55px] text-slate-900 sm:mb-8 sm:text-[28px] lg:mb-10 lg:text-[30px] lg:tracking-[-0.6px]"
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
                className="flex w-full items-center justify-between gap-3 py-4 text-left sm:gap-4 sm:py-6"
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
