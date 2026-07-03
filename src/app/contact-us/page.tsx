import { MarketingShell } from "@/components/landing/MarketingShell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with the Unimad team for questions, support, or feedback.",
  alternates: { canonical: "/contact-us" },
};

export default function ContactUsPage() {
  return (
    <MarketingShell>
      <div className="legal-doc legal-doc--center">
        <header className="legal-doc__header">
          <h1 className="legal-doc__title">
            Contact <span className="legal-accent">Us</span>
          </h1>
        </header>
        <div className="legal-doc__body legal-contact">
          <p className="legal-contact__lead">Unimad team is one email away.</p>
          <p className="legal-contact__email">
            Reach out at <a href="mailto:grow@unimad.ai">grow@unimad.ai</a>
          </p>
          <div className="legal-contact__card">
            <a href="tel:+918925599291">+91 8925599291</a>
            <p>No 68, Ground Floor, Sakthi nagar 2nd avenue, Nolambur Chennai-600095</p>
          </div>
        </div>
      </div>
    </MarketingShell>
  );
}
