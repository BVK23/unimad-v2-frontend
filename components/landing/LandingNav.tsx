"use client";

import { useEffect, useState } from "react";
import { UnimadLogo } from "@/components/unimad-logo";
import { getSigninUrl } from "@/constants/landing-auth";
import Link from "next/link";
import { useNavSolid } from "./useLandingEffects";

const NAV_LINKS: { href: string; label: string; prefetch?: boolean }[] = [
  { href: "/about", label: "About Us", prefetch: false },
  { href: "/mad-stories", label: "Mad Stories" },
  { href: "/unicoach", label: "Unicoach" },
];

type LandingNavProps = {
  /** href of the current page (e.g. "/unicoach") — receives aria-current. */
  active?: string;
  /**
   * When set (e.g. ".uc-hero"), the bar stays transparent until this hero
   * scrolls out of view, then flips to the solid/blurred header.
   */
  solidTrigger?: string;
  /** Hide the Login CTA (e.g. on the sign-in page). */
  showLogin?: boolean;
};

/**
 * Shared marketing-site navigation. Desktop shows inline links; on mobile the
 * links collapse behind a hamburger that toggles a dropdown menu listing every
 * page plus the Login CTA.
 */
export function LandingNav({ active, solidTrigger, showLogin = true }: LandingNavProps) {
  const [open, setOpen] = useState(false);
  const solid = useNavSolid(solidTrigger);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // If the viewport grows to desktop while the menu is open, close it so the
  // (hidden) hamburger can't leave the page in an open-but-invisible state.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 769px)");
    const onChange = () => {
      if (mq.matches) setOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const navClass = `nav${solid ? " nav--solid" : ""}${open ? " nav--menu-open" : ""}`;

  return (
    <nav className={navClass}>
      <div className="nav-inner">
        <Link href="/" className="nav-brand" aria-label="Unimad home" onClick={() => setOpen(false)}>
          <UnimadLogo className="nav-logo" />
        </Link>

        <ul className="nav-links">
          {NAV_LINKS.map(link => (
            <li key={link.href}>
              <Link href={link.href} prefetch={link.prefetch} aria-current={active === link.href ? "page" : undefined}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {showLogin ? (
          <Link href={getSigninUrl()} className="btn nav-login">
            Login
          </Link>
        ) : null}

        <button
          type="button"
          className="nav-burger"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="nav-mobile-menu"
          onClick={() => setOpen(prev => !prev)}
        >
          <span className="nav-burger__bar" />
          <span className="nav-burger__bar" />
          <span className="nav-burger__bar" />
        </button>
      </div>

      <div className="nav-scrim" aria-hidden onClick={() => setOpen(false)} />

      <div id="nav-mobile-menu" className="nav-mobile" role="menu" aria-hidden={!open}>
        <ul className="nav-mobile__links">
          {NAV_LINKS.map(link => (
            <li key={link.href}>
              <Link
                href={link.href}
                prefetch={link.prefetch}
                role="menuitem"
                tabIndex={open ? 0 : -1}
                aria-current={active === link.href ? "page" : undefined}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
        {showLogin ? (
          <Link href={getSigninUrl()} className="btn btn-solid nav-mobile__cta" tabIndex={open ? 0 : -1} onClick={() => setOpen(false)}>
            Login
          </Link>
        ) : null}
      </div>
    </nav>
  );
}
