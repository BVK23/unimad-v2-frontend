import { LegalDocument, LegalList, LegalParagraph, LegalSection } from "@/components/landing/LegalDocument";
import { MarketingShell } from "@/components/landing/MarketingShell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Unimad collects, uses, and protects your personal information.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <MarketingShell active="/privacy">
      <LegalDocument title="Privacy Policy" lastUpdated="20/01/2026">
        <LegalSection title="1. Information Collection and Use">
          <LegalParagraph>
            Unimad collects personal information to provide and improve our services. This data is handled with respect for user privacy.
          </LegalParagraph>
          <LegalParagraph>
            Users can authenticate using either LinkedIn OAuth or Google OAuth. When you choose to sign in, we access and collect
            information from your account for user identification and account management purposes within our platform.
          </LegalParagraph>
        </LegalSection>

        <LegalSection title="1.1 Google and LinkedIn API Services User Data">
          <LegalParagraph>
            <strong>Data accessed:</strong>
          </LegalParagraph>
          <LegalList items={["Full name", "Email address", "Profile picture URL"]} />
          <LegalParagraph>
            <strong>Data usage:</strong> The user data we access from Google and LinkedIn is used exclusively for user identification and
            account creation, personalizing your experience within the Unimad platform, and displaying your profile information in your
            account.
          </LegalParagraph>
          <LegalParagraph>
            <strong>Data storage:</strong> The user data we collect from both Google and LinkedIn is securely stored in our Google Cloud
            PostgreSQL database.
          </LegalParagraph>
          <LegalParagraph>
            <strong>Data sharing:</strong> We do not share, sell, or disclose your user data from Google or LinkedIn to any third parties.
          </LegalParagraph>
          <LegalParagraph>
            <strong>User control:</strong> You can access, modify, or delete your information through your account settings (for example,
            unimad.ai/uniboard/profile) or by contacting Unimad support. You can also revoke access through your Google or LinkedIn account
            settings.
          </LegalParagraph>
        </LegalSection>

        <LegalSection title="2. Cookies and Tracking Technologies">
          <LegalParagraph>
            Cookies are used to enhance user experience, manage sessions, and authenticate users. Users can manage cookie settings in their
            browsers, but this may affect the functionality of Unimad.
          </LegalParagraph>
        </LegalSection>

        <LegalSection title="3. Data Security">
          <LegalParagraph>
            Protecting user data is a top priority for Unimad. We use industry-standard security measures and continuously evaluate our
            practices to ensure data safety.
          </LegalParagraph>
          <LegalParagraph>
            We aim to handle personal data in line with applicable privacy requirements, including GDPR principles where relevant.
          </LegalParagraph>
        </LegalSection>

        <LegalSection title="4. User Data Rights">
          <LegalParagraph>
            Users have control over their data, including the right to access, modify, or delete their information. Requests for data access
            or deletion can be made through user account settings or by contacting Unimad support.
          </LegalParagraph>
        </LegalSection>

        <LegalSection title="5. Changes to the Privacy Policy">
          <LegalParagraph>
            We may update this Privacy Policy to reflect changes in our practices. Users will be notified of any significant changes and are
            encouraged to review the Privacy Policy periodically.
          </LegalParagraph>
        </LegalSection>

        <LegalSection title="6. Contact Us">
          <LegalParagraph>
            For any questions or concerns about these Terms or the Privacy Policy, please contact us at{" "}
            <a href="mailto:finance@unimad.ai">finance@unimad.ai</a>.
          </LegalParagraph>
        </LegalSection>
      </LegalDocument>
    </MarketingShell>
  );
}
