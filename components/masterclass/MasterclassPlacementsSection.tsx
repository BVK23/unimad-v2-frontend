"use client";

import { useState } from "react";

const PLACEMENTS = [
  { name: "Deloitte", slug: "deloitte" },
  { name: "Google", slug: "google" },
  { name: "Amazon", slug: "amazon" },
  { name: "Microsoft", slug: "microsoft" },
  { name: "Accenture", slug: "accenture" },
  { name: "Barclays", slug: "barclays" },
  { name: "KPMG", slug: "kpmg" },
  { name: "PwC", slug: "pwc" },
  { name: "EY", slug: "ey" },
  { name: "Meta", slug: "meta" },
  { name: "IBM", slug: "ibm" },
  { name: "Cisco", slug: "cisco" },
] as const;

const MARQUEE_LOGOS = [...PLACEMENTS, ...PLACEMENTS];

function CompanyLogo({ name, slug }: { name: string; slug: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <span className="whitespace-nowrap text-[15px] font-semibold tracking-[-0.3px] text-[#eaeaea]/35 sm:text-[16px]">{name}</span>;
  }

  return (
    <img
      src={`https://cdn.simpleicons.org/${slug}/b8b8b8`}
      alt={name}
      width={128}
      height={36}
      className="h-8 w-auto max-w-[120px] shrink-0 object-contain opacity-55 grayscale transition-opacity duration-200 hover:opacity-80 sm:h-10 sm:max-w-[140px]"
      onError={() => setFailed(true)}
    />
  );
}

export function MasterclassPlacementsSection() {
  return (
    <section className="mb-16 lg:mb-24" aria-labelledby="masterclass-placements-heading">
      <h2
        id="masterclass-placements-heading"
        className="mb-8 text-center text-[12px] font-medium uppercase tracking-[0.14em] text-[#eaeaea]/40 sm:mb-10"
      >
        Our students are placed at
      </h2>

      <div className="masterclass-logo-marquee">
        <div className="masterclass-logo-marquee__track">
          {MARQUEE_LOGOS.map((company, index) => (
            <div key={`${company.name}-${index}`} className="flex h-10 shrink-0 items-center justify-center px-2 sm:h-11">
              <CompanyLogo name={company.name} slug={company.slug} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
