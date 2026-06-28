"use client";

import { useState } from "react";

const PLACEMENTS = [
  { name: "EY", logo: "/images/masterclass/placements/ey.svg" },
  { name: "Uber", logo: "/images/masterclass/placements/uber.svg" },
  { name: "JLR", logo: "/images/masterclass/placements/jlr.svg" },
  { name: "Coursera", logo: "/images/masterclass/placements/coursera.svg" },
  { name: "Amazon", logo: "/images/masterclass/placements/amazon.svg" },
  { name: "Infosys", logo: "/images/masterclass/placements/infosys.svg" },
  { name: "Lloyds Bank", logo: "/images/masterclass/placements/lloyds-bank.svg" },
  { name: "HashiCorp", logo: "/images/masterclass/placements/hashicorp.svg" },
  { name: "Adobe", logo: "/images/masterclass/placements/adobe.svg" },
  { name: "Accenture", logo: "/images/masterclass/placements/accenture.svg" },
  { name: "JP Morgan", logo: "/images/masterclass/placements/jp-morgan.svg" },
  { name: "Rolls Royce", logo: "/images/masterclass/placements/rolls-royce.svg" },
  { name: "NHS", logo: "/images/masterclass/placements/nhs.svg" },
] as const;

const MARQUEE_LOGOS = [...PLACEMENTS, ...PLACEMENTS];

function CompanyLogo({ name, logo }: { name: string; logo: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <span className="whitespace-nowrap text-[15px] font-semibold tracking-[-0.3px] text-[#eaeaea]/35 sm:text-[16px]">{name}</span>;
  }

  return <img src={logo} alt={name} className="masterclass-logo-marquee__logo" onError={() => setFailed(true)} />;
}

export function MasterclassPlacementsSection() {
  return (
    <section className="mb-12 sm:mb-16 lg:mb-24" aria-labelledby="masterclass-placements-heading">
      <h2
        id="masterclass-placements-heading"
        className="mb-6 text-center text-[11px] font-medium uppercase tracking-[0.14em] text-[#eaeaea]/40 sm:mb-10 sm:text-[12px]"
      >
        Our students are placed at
      </h2>

      <div className="masterclass-logo-marquee">
        <div className="masterclass-logo-marquee__track">
          {MARQUEE_LOGOS.map((company, index) => (
            <div key={`${company.name}-${index}`} className="masterclass-logo-marquee__slot">
              <CompanyLogo name={company.name} logo={company.logo} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
