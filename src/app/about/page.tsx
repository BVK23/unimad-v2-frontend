import { LegalParagraph, LegalSection } from "@/components/landing/LegalDocument";
import { MarketingShell } from "@/components/landing/MarketingShell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Built by international students, for international students. Unimad is the all-in-one job search platform with AI tools, resumes, LinkedIn help, and real human support.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <MarketingShell>
      <article className="legal-doc">
        <header className="legal-doc__header">
          <h1 className="legal-doc__title">
            About <span className="legal-accent">us</span>
          </h1>
        </header>
        <div className="legal-doc__body">
          <LegalSection title="">
            <LegalParagraph>
              Your job search just got personal. And a little <strong>mad</strong>.
            </LegalParagraph>
            <LegalParagraph>
              Unimad is a platform built by international students who&apos;ve been there. The 100s of rejections. The &quot;any
              updates?&quot; emails. The interviews that ghosted.
            </LegalParagraph>
            <LegalParagraph>
              Unimad comes with <strong>Unibot</strong>. Your AI-powered job search wingman.
            </LegalParagraph>
          </LegalSection>

          <LegalSection title="Unibot's here to:">
            <LegalParagraph>→ Make your resume sharp</LegalParagraph>
            <LegalParagraph>→ Fix your LinkedIn headline</LegalParagraph>
            <LegalParagraph>→ Write cold DMs that get replies</LegalParagraph>
            <LegalParagraph>→ Remind you to breathe during rejections</LegalParagraph>
            <LegalParagraph>We built Unimad so you don&apos;t have to figure this all out alone.</LegalParagraph>
          </LegalSection>

          <LegalSection title="Why Unimad?">
            <LegalParagraph>
              → <strong>We simplify personal branding</strong> — no blah, no jargon. Just the right words, tools, and templates to help you
              get seen.
            </LegalParagraph>
            <LegalParagraph>
              → <strong>Focused, not diverse</strong> — stop applying to everything. Start applying like you mean it.
            </LegalParagraph>
            <LegalParagraph>
              → <strong>All-in-one toolkit</strong> — resumes, portfolios, cover letters, LinkedIn, VPD, and a bot that actually gets it.
            </LegalParagraph>
            <LegalParagraph>
              → <strong>Built by students, for students</strong> — we cracked the system. Now we&apos;re helping you do the same.
            </LegalParagraph>
          </LegalSection>

          <LegalSection title="">
            <LegalParagraph>
              Whether you&apos;re 500 applications deep or just getting started, Unimad is where the real job search begins.
            </LegalParagraph>
            <LegalParagraph>Wanna make your story heard?</LegalParagraph>
            <LegalParagraph>
              <strong>Let&apos;s get to work.</strong>
            </LegalParagraph>
          </LegalSection>
        </div>
      </article>
    </MarketingShell>
  );
}
