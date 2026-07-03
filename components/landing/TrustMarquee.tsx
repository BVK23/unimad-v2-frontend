"use client";

import { useState } from "react";
import { PLACEMENT_COMPANIES } from "./testimonials";

function TrustLogo({ name, logo }: { name: string; logo: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <span className="trust-logo-fallback">{name}</span>;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={logo} alt={name} className="trust-logo" loading="lazy" decoding="async" onError={() => setFailed(true)} />
  );
}

export function TrustMarquee() {
  const items = [...PLACEMENT_COMPANIES, ...PLACEMENT_COMPANIES];

  return (
    <div className="marquee-outer">
      <div className="marquee-track">
        {items.map((company, i) => (
          <span key={`${company.name}-${i}`} className="trust-logo-slot">
            <span className="trust-logo-wrap" style={{ "--logo-scale": company.scale ?? 1 } as React.CSSProperties}>
              <TrustLogo name={company.name} logo={company.logo} />
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
