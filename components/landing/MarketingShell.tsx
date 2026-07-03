"use client";

import type { ReactNode } from "react";
import { UnimadLogo } from "@/components/unimad-logo";
import { getSigninUrl } from "@/constants/landing-auth";
import Link from "next/link";
import { UnimadMark } from "./UnimadMark";
import { useLandingBodyClass } from "./useLandingEffects";
import "@/components/landing/landing.css";

type MarketingShellProps = {
  children: ReactNode;
  /** Use compact nav (mad-stories style) vs full wordmark nav */
  navVariant?: "mark" | "logo";
};

export function MarketingShell({ children, navVariant = "mark" }: MarketingShellProps) {
  useLandingBodyClass();

  return (
    <div className="landing-page">
      <nav className="nav">
        <div className="nav-inner">
          <Link href="/" className="nav-brand" aria-label="Unimad home">
            {navVariant === "logo" ? <UnimadLogo className="nav-logo" /> : <UnimadMark />}
            {navVariant === "mark" ? <span className="nav-brand-name">unimad</span> : null}
          </Link>
          <ul className="nav-links">
            <li>
              <Link href="/#product">Product</Link>
            </li>
            <li>
              <Link href="/mad-stories">Success Stories</Link>
            </li>
            <li>
              <Link href="/unicoach">Unicoach</Link>
            </li>
          </ul>
          <Link href={getSigninUrl()} className="btn nav-login">
            Login
          </Link>
        </div>
      </nav>

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
