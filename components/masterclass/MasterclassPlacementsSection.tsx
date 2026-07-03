/* eslint-disable @typescript-eslint/ban-ts-comment -- v1 port; types tightened in follow-up */
// @ts-nocheck
"use client";

import { useState } from "react";

const PLACEMENTS = [
  { name: "NHS", logo: "/images/masterclass/placements/nhs.svg", scale: 0.68 },
  { name: "Uber", logo: "/images/masterclass/placements/uber.svg", scale: 1.35 },
  { name: "JLR", logo: "/images/masterclass/placements/jlr.svg", scale: 0.92 },
  { name: "Coursera", logo: "/images/masterclass/placements/coursera.svg", scale: 1.4 },
  { name: "Amazon", logo: "/images/masterclass/placements/amazon.svg", scale: 0.58 },
  { name: "Infosys", logo: "/images/masterclass/placements/infosys.svg", scale: 1.35 },
  { name: "Lloyds Bank", logo: "/images/masterclass/placements/lloyds-bank.svg", scale: 0.72 },
  { name: "HashiCorp", logo: "/images/masterclass/placements/hashicorp.svg", scale: 1.3 },
  { name: "Adobe", logo: "/images/masterclass/placements/adobe.svg", scale: 0.78 },
  { name: "Accenture", logo: "/images/masterclass/placements/accenture.svg", scale: 1.4 },
  { name: "JP Morgan", logo: "/images/masterclass/placements/jp-morgan.svg", scale: 0.74 },
  { name: "Rolls Royce", logo: "/images/masterclass/placements/rolls-royce.svg", scale: 1.25 },
];

function CompanyLogo({ name, logo, scale = 1 }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span className="whitespace-nowrap text-center text-[13px] font-semibold tracking-[-0.26px] text-slate-500 sm:text-[14px]">
        {name}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logo}
      alt={name}
      className="masterclass-logo-grid__logo"
      style={{ "--logo-scale": scale }}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

export function MasterclassPlacementsSection() {
  return (
    <section aria-labelledby="masterclass-placements-heading">
      <h2
        id="masterclass-placements-heading"
        className="mb-8 text-center text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500 sm:mb-10 sm:text-[12px]"
      >
        Our students are placed at
      </h2>

      <div className="masterclass-logo-grid">
        {PLACEMENTS.map(company => (
          <div key={company.name} className="masterclass-logo-grid__item">
            <CompanyLogo name={company.name} logo={company.logo} scale={company.scale} />
          </div>
        ))}
      </div>

      <p className="mt-8 text-center text-[11px] font-medium tracking-[-0.22px] text-slate-400 sm:mt-10 sm:text-[12px] sm:tracking-[-0.24px]">
        and many more
      </p>
    </section>
  );
}
