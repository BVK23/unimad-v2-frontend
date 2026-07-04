import { LegalDocument, LegalList, LegalParagraph, LegalSection } from "@/components/landing/LegalDocument";
import { MarketingShell } from "@/components/landing/MarketingShell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Rules and regulations governing your use of Unimad.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <MarketingShell active="/terms">
      <LegalDocument title="Terms of Service" lastUpdated="20/01/2026">
        <LegalSection title="1. Introduction">
          <LegalParagraph>
            Welcome to Unimad (&quot;Unimad&quot;, &quot;we&quot;, &quot;us&quot;, &quot;our&quot;). These Terms of Service
            (&quot;Terms&quot;) govern your access to and use of the Unimad platform, including our free tools and any related services.
          </LegalParagraph>
          <LegalParagraph>
            By accessing or using Unimad, you agree to these Terms. If you do not agree, please refrain from using Unimad.
          </LegalParagraph>
        </LegalSection>

        <LegalSection title="2. Description of Services">
          <LegalParagraph>
            Unimad provides AI-powered and framework-based job search tools and resources, which may include resume building, LinkedIn
            optimization, portfolio support, application tracking, interview preparation, and access to our AI assistant
            (&quot;Unibot&quot;).
          </LegalParagraph>
          <LegalParagraph>
            Unimad also offers a paid mentorship program called Unicoach (the &quot;Program&quot;), which includes 1:1 calls and structured
            guidance. Unicoach is a separate paid service and may have additional terms referenced in these Terms and our Refund &amp;
            Cancellation Policy.
          </LegalParagraph>
        </LegalSection>

        <LegalSection title="3. Eligibility">
          <LegalParagraph>Unimad is intended for users who can form a legally binding agreement in their jurisdiction.</LegalParagraph>
          <LegalParagraph>
            If you are under 18, you may use Unimad only with the consent and supervision of a parent or legal guardian, and your
            parent/guardian agrees to these Terms on your behalf.
          </LegalParagraph>
          <LegalParagraph>
            To purchase Unicoach, you must be 18 or older, or have parent/guardian consent where permitted by law.
          </LegalParagraph>
        </LegalSection>

        <LegalSection title="4. Account Registration and Use">
          <LegalParagraph>
            To access certain features, you may need to create an account and authenticate using LinkedIn OAuth or Google OAuth.
          </LegalParagraph>
          <LegalParagraph>
            Unimad does not store your Google/LinkedIn password. Your login is handled by the relevant authentication provider. Unimad
            receives limited profile details (such as name, email, and profile picture URL) to uniquely identify your account and provide
            the service, as described in our Privacy Policy.
          </LegalParagraph>
          <LegalParagraph>
            You are responsible for maintaining the confidentiality of your account access and for all activities that occur under your
            account. You agree to use Unimad in compliance with applicable laws and regulations.
          </LegalParagraph>
        </LegalSection>

        <LegalSection title="5. User Responsibilities and Acceptable Use">
          <LegalParagraph>You agree not to:</LegalParagraph>
          <LegalList
            items={[
              "Misuse the platform, attempt unauthorized access, or interfere with system security",
              "Upload or submit content that is unlawful, harmful, infringing, or misleading",
              "Use Unimad to spam, harass, or violate the rights of others",
            ]}
          />
        </LegalSection>

        <LegalSection title="6. User-Generated Content">
          <LegalParagraph>
            If Unimad enables you to submit content (e.g., text inputs, documents, resumes, prompts, or other materials), you remain
            responsible for what you submit.
          </LegalParagraph>
          <LegalParagraph>
            You represent and warrant that you have the rights to submit such content and that it does not violate any law or third-party
            rights.
          </LegalParagraph>
        </LegalSection>

        <LegalSection title="7. Unicoach Program Terms">
          <LegalParagraph>
            Unicoach is delivered through scheduled 1:1 calls and guidance. The specific structure, duration, and inclusions may be
            described on the Unicoach page within the platform.
          </LegalParagraph>
          <LegalParagraph>
            Unicoach may be offered with full payment or split/partial payment options. Details are shown on the Unicoach page at the time
            of purchase.
          </LegalParagraph>
          <LegalParagraph>
            If you do not book or attend any of the initial 1:1 calls for a continuous period of 3 months, we may treat the Program as
            cancelled/closed due to inactivity, and remaining initial-call sessions/benefits may be forfeited.
          </LegalParagraph>
        </LegalSection>

        <LegalSection title='8. "MAD Story" Success Story Permission'>
          <LegalParagraph>
            If you complete Unicoach and secure a job, you grant Unimad the right to publish your &quot;MAD Story&quot; for marketing and
            community purposes. We may use your name and a photo you provide, or a publicly available profile image, unless you request
            anonymity.
          </LegalParagraph>
        </LegalSection>

        <LegalSection title="9. Privacy and Data Usage">
          <LegalParagraph>
            Your privacy matters to us. Our collection and use of personal data is described in our Privacy Policy.
          </LegalParagraph>
        </LegalSection>

        <LegalSection title="10. Data Security">
          <LegalParagraph>
            We use Google Cloud PostgreSQL for data storage and apply reasonable administrative, technical, and organizational safeguards to
            protect user data.
          </LegalParagraph>
        </LegalSection>

        <LegalSection title="11. Disclaimers">
          <LegalParagraph>
            Unimad and Unicoach are provided for informational and educational purposes. We do not guarantee interviews, job offers, visa
            sponsorship, or employment outcomes.
          </LegalParagraph>
        </LegalSection>

        <LegalSection title="12. Amendments to Terms">
          <LegalParagraph>
            We may update these Terms from time to time. We will notify users of material changes via email or within the platform.
            Continued use after changes become effective constitutes acceptance.
          </LegalParagraph>
        </LegalSection>

        <LegalSection title="13. Governing Law and Dispute Resolution">
          <LegalParagraph>
            These Terms are governed by the laws of India. Parties agree to submit to the exclusive jurisdiction of Indian courts.
          </LegalParagraph>
        </LegalSection>
      </LegalDocument>
    </MarketingShell>
  );
}
