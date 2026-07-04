"use client";

import type { ReactNode } from "react";
import { UnimadLogo } from "@/components/unimad-logo";
import Link from "next/link";
import { LandingNav } from "./LandingNav";
import { useLandingBodyClass } from "./useLandingEffects";
import "@/components/landing/landing.css";

type MarketingShellProps = {
  children: ReactNode;
  /** href of the current page for nav active state */
  active?: string;
};

export function MarketingShell({ children, active }: MarketingShellProps) {
  useLandingBodyClass();

  return (
    <div className="landing-page">
      <LandingNav active={active} />

      <main className="legal-page-main">{children}</main>

      <footer className="landing-footer legal-page-footer">
        <div className="footer-inner">
          <Link href="/" className="footer-brand" aria-label="Unimad home">
            <UnimadLogo className="footer-logo" />
          </Link>
          <nav className="footer-nav" aria-label="Footer">
            <Link href="/mad-stories">Mad Stories</Link>
            <Link href="/unicoach">Unicoach</Link>
            <Link href="/about">About Us</Link>
            <Link href="/contact-us">Contact Us</Link>
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms &amp; Conditions</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
