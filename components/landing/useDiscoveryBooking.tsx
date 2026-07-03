"use client";

import { useCallback, useState } from "react";
import { MasterclassOnboardingModal } from "@/components/masterclass/MasterclassOnboardingModal";
import { MASTERCLASS_LEAD_SESSION_KEY, MASTERCLASS_LEAD_SOURCE_DISCOVERY, MASTERCLASS_THANKS_INTEREST_PATH } from "@/constants/masterclass";
import { fetchMasterclassLead, submitMasterclassLead } from "@/lib/actions/masterclassLeads";
import { openMasterclassDiscoveryCalendly } from "@/lib/masterclass/calendly";
import { useRouter } from "next/navigation";
import Script from "next/script";

type StoredLead = {
  uid: string;
  name: string;
  email: string;
  hasContact: boolean;
  discoveryComplete: boolean;
  qualificationStatus: string | null;
};

function readStoredLeadSession(): StoredLead | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(MASTERCLASS_LEAD_SESSION_KEY);
    if (!raw) return null;
    const lead = JSON.parse(raw) as Record<string, unknown>;
    const uid = (lead.uid as string) || (lead.leadId != null ? String(lead.leadId) : null);
    if (!uid) return null;
    return {
      uid,
      name: (lead.name as string) || "",
      email: (lead.email as string) || "",
      hasContact: Boolean(lead.name && lead.email),
      discoveryComplete: Boolean(lead.discoveryComplete ?? lead.discovery_complete),
      qualificationStatus: (lead.qualificationStatus as string) ?? (lead.qualification_status as string) ?? null,
    };
  } catch {
    return null;
  }
}

function persistLeadSession(lead: Record<string, unknown>, extra: Record<string, unknown> = {}) {
  const savedUid = (lead?.uid as string) ?? (lead?.lead_id != null ? String(lead.lead_id) : null);
  const discoveryComplete = extra.discoveryComplete ?? (lead?.discovery_complete != null ? Boolean(lead.discovery_complete) : undefined);
  const qualificationStatus = (extra.qualificationStatus as string) ?? (lead?.qualification_status as string) ?? undefined;

  sessionStorage.setItem(
    MASTERCLASS_LEAD_SESSION_KEY,
    JSON.stringify({
      name: lead?.name,
      email: lead?.email,
      leadId: lead?.lead_id,
      uid: savedUid,
      source: lead?.source,
      ...(discoveryComplete != null ? { discoveryComplete } : {}),
      ...(qualificationStatus != null ? { qualificationStatus } : {}),
      ...extra,
    })
  );
  return savedUid;
}

export function useDiscoveryBooking() {
  const router = useRouter();
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [initialStep, setInitialStep] = useState<"details" | "questions">("details");
  const [initialLead, setInitialLead] = useState<{ uid?: string; name?: string; email?: string } | null>(null);

  const openQualifiedCalendly = useCallback(
    async (stored: StoredLead | null) => {
      let prefill = { name: stored?.name, email: stored?.email };

      if (stored?.uid && (!prefill.name || !prefill.email)) {
        try {
          const lead = await fetchMasterclassLead(stored.uid);
          prefill = { name: lead.name, email: lead.email };
          persistLeadSession(lead as unknown as Record<string, unknown>, {
            discoveryComplete: true,
            qualificationStatus: lead.qualification_status ?? "qualified",
          });
        } catch {
          // use session values
        }
      }

      openMasterclassDiscoveryCalendly({ ...prefill, uid: stored?.uid }, () =>
        router.push(stored?.uid ? `/masterclass/confirmed?uid=${encodeURIComponent(stored.uid)}` : "/masterclass/confirmed")
      );
    },
    [router]
  );

  const openOnboardingModal = useCallback(
    (options: { initialStep?: "details" | "questions"; initialLead?: { uid?: string; name?: string; email?: string } | null } = {}) => {
      setInitialStep(options.initialStep ?? "details");
      setInitialLead(options.initialLead ?? null);
      setOnboardingOpen(true);
    },
    []
  );

  const openDiscoveryBooking = useCallback(async () => {
    let stored = readStoredLeadSession();

    if (stored?.uid && !stored.discoveryComplete) {
      try {
        const lead = await fetchMasterclassLead(stored.uid);
        persistLeadSession(lead as unknown as Record<string, unknown>, {
          discoveryComplete: Boolean(lead.discovery_complete),
          qualificationStatus: lead.qualification_status ?? null,
        });
        stored = readStoredLeadSession();
      } catch {
        // fall back to session state
      }
    }

    if (stored) {
      if (stored.discoveryComplete && stored.qualificationStatus === "qualified") {
        void openQualifiedCalendly(stored);
        return;
      }

      if (stored.discoveryComplete && stored.qualificationStatus === "unqualified") {
        router.push(`${MASTERCLASS_THANKS_INTEREST_PATH}?uid=${encodeURIComponent(stored.uid)}`);
        return;
      }

      openOnboardingModal({
        initialStep: stored.hasContact ? "questions" : "details",
        initialLead: { uid: stored.uid, name: stored.name, email: stored.email },
      });
      return;
    }

    openOnboardingModal();
  }, [openOnboardingModal, openQualifiedCalendly, router]);

  const handleLeadSubmit = useCallback(
    async (payload: {
      stage: string;
      name?: string;
      email?: string;
      dialCode?: string;
      phone?: string;
      uid?: string;
      discovery?: Record<string, unknown>;
    }) => {
      if (payload.stage === "contact") {
        const result = await submitMasterclassLead({
          name: payload.name ?? "",
          email: payload.email ?? "",
          dial_code: payload.dialCode ?? "",
          phone: payload.phone ?? "",
          source: MASTERCLASS_LEAD_SOURCE_DISCOVERY,
          stage: "contact",
          uid: payload.uid,
        });
        persistLeadSession(result as unknown as Record<string, unknown>, {
          dialCode: payload.dialCode,
          phone: payload.phone,
        });
        return;
      }

      const result = await submitMasterclassLead({
        name: payload.name ?? "",
        email: payload.email ?? "",
        dial_code: payload.dialCode ?? "",
        phone: payload.phone ?? "",
        source: MASTERCLASS_LEAD_SOURCE_DISCOVERY,
        stage: "complete",
        uid: payload.uid,
        discovery: payload.discovery,
      });

      const savedUid = persistLeadSession(result as unknown as Record<string, unknown>, {
        dialCode: payload.dialCode,
        phone: payload.phone,
        fullPhone: `${payload.dialCode}${payload.phone}`,
        discoveryComplete: true,
        qualificationStatus: result.qualification_status ?? null,
      });

      setOnboardingOpen(false);

      if (result.qualification_status === "unqualified") {
        router.push(
          savedUid ? `${MASTERCLASS_THANKS_INTEREST_PATH}?uid=${encodeURIComponent(savedUid)}` : MASTERCLASS_THANKS_INTEREST_PATH
        );
        return;
      }

      openMasterclassDiscoveryCalendly({ name: payload.name, email: payload.email, uid: savedUid }, () =>
        router.push(savedUid ? `/masterclass/confirmed?uid=${encodeURIComponent(savedUid)}` : "/masterclass/confirmed")
      );
    },
    [router]
  );

  const bookingModal = (
    <>
      <Script src="https://assets.calendly.com/assets/external/widget.js" strategy="lazyOnload" />
      <MasterclassOnboardingModal
        open={onboardingOpen}
        intent="booking"
        initialStep={initialStep}
        initialLead={initialLead as null | undefined}
        onClose={() => setOnboardingOpen(false)}
        onSubmit={handleLeadSubmit}
      />
    </>
  );

  return { openDiscoveryBooking, bookingModal };
}
