import { LegalDocument, LegalList, LegalParagraph, LegalSection } from "@/components/landing/LegalDocument";
import { MarketingShell } from "@/components/landing/MarketingShell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund and Cancellation Policy",
  description: "Refund eligibility, cancellation terms, and payment options for Unicoach.",
  alternates: { canonical: "/refund" },
};

export default function RefundPage() {
  return (
    <MarketingShell active="/refund">
      <LegalDocument title="Refund and Cancellation Policy" lastUpdated="20/01/2026">
        <LegalSection title="1. Scope">
          <LegalParagraph>
            This Refund and Cancellation Policy applies to the Unicoach paid mentorship program. Unimad&apos;s core platform tools are
            currently free and do not require a subscription.
          </LegalParagraph>
        </LegalSection>

        <LegalSection title="2. Refund Eligibility (Full Payment Only)">
          <LegalParagraph>If you purchased Unicoach via full payment, you may request a refund if:</LegalParagraph>
          <LegalList
            items={[
              "You have completed your first Unicoach call, or",
              "You can request a refund within 14 days of your payment (whichever is earlier).",
            ]}
          />
          <LegalParagraph>If approved, the refund will be processed back to the original payment method.</LegalParagraph>
        </LegalSection>

        <LegalSection title="3. Split/Partial Payment (No Refund)">
          <LegalParagraph>
            If you purchased Unicoach using a split/partial payment option, you are not eligible for a refund. If you decide not to continue
            after the first call, you may choose not to pay the remaining installment.
          </LegalParagraph>
        </LegalSection>

        <LegalSection title="4. How to Request a Refund">
          <LegalParagraph>To request a refund, email finance@unimad.ai with:</LegalParagraph>
          <LegalList
            items={[
              "Your account email",
              "Purchase details (date and payment reference, if available)",
              "A short note confirming you do not wish to continue",
            ]}
          />
        </LegalSection>

        <LegalSection title="5. Inactivity (Initial 1:1 Calls)">
          <LegalParagraph>
            If you do not book or attend any of the initial 1:1 calls for a continuous period of 3 months, we may treat the Program as
            cancelled/closed due to inactivity, and remaining initial-call sessions/benefits may be forfeited.
          </LegalParagraph>
        </LegalSection>

        <LegalSection title="6. Pricing">
          <LegalParagraph>
            Unicoach pricing may change from time to time. The price you see at checkout or on the Unicoach page at the time of purchase is
            the applicable price for your purchase.
          </LegalParagraph>
        </LegalSection>

        <LegalSection title="7. Contact Us">
          <LegalParagraph>
            For questions about refunds or cancellations, contact <a href="mailto:finance@unimad.ai">finance@unimad.ai</a>.
          </LegalParagraph>
        </LegalSection>
      </LegalDocument>
    </MarketingShell>
  );
}
