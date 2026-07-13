"use client";

import { useCallback, useEffect, useState } from "react";
import { MasterclassOnboardingModal } from "@/components/masterclass/MasterclassOnboardingModal";
import { UnicoachCalendlyEmbed } from "@/components/unicoach/UnicoachCalendlyEmbed";
import { MASTERCLASS_LEAD_SESSION_KEY } from "@/constants/masterclass";
import { fetchAuthenticatedMasterclassLead, fetchMasterclassLead, submitAuthenticatedDiscoveryLead } from "@/lib/actions/masterclassLeads";
import { ensureCalendlyAssets } from "@/lib/masterclass/calendly";
import confetti from "canvas-confetti";

type DiscoveryPhase = "idle" | "form" | "calendly" | "confirmed" | "thanks-interest";

type UseUnicoachDiscoveryBookingOptions = {
  userName?: string;
  userEmail?: string;
  open?: boolean;
  onComplete?: () => void;
};

function clearLeadSession() {
  sessionStorage.removeItem(MASTERCLASS_LEAD_SESSION_KEY);
}

function persistLeadSession(lead: Record<string, unknown>, extra: Record<string, unknown> = {}) {
  const savedUid = (lead?.uid as string) ?? (lead?.lead_id != null ? String(lead.lead_id) : null);
  sessionStorage.setItem(
    MASTERCLASS_LEAD_SESSION_KEY,
    JSON.stringify({
      name: lead?.name,
      email: lead?.email,
      leadId: lead?.lead_id,
      uid: savedUid,
      source: lead?.source,
      discoveryComplete: extra.discoveryComplete ?? lead?.discovery_complete ?? true,
      qualificationStatus: extra.qualificationStatus ?? lead?.qualification_status ?? null,
      ...extra,
    })
  );
  return savedUid;
}

function fireBookingConfetti() {
  confetti({
    particleCount: 120,
    spread: 70,
    origin: { y: 0.45 },
    ticks: 220,
    disableForReducedMotion: true,
    colors: ["#2563eb", "#346de0", "#eab308", "#f8fafc"],
  });
}

function routeFromExistingLead(
  lead: {
    uid?: string;
    name?: string;
    email?: string;
    discovery_complete?: boolean;
    qualification_status?: string | null;
  },
  userName: string | undefined,
  userEmail: string | undefined,
  handlers: {
    setFirstName: (name: string | null) => void;
    setLeadUid: (uid: string | null) => void;
    setCalendlyPrefill: (prefill: { name?: string; email?: string; uid?: string }) => void;
    setPhase: (phase: DiscoveryPhase) => void;
  }
) {
  const savedUid = persistLeadSession(lead as unknown as Record<string, unknown>, {
    discoveryComplete: Boolean(lead.discovery_complete),
    qualificationStatus: lead.qualification_status ?? null,
  });

  const displayName = (userName || lead.name || "").trim().split(/\s+/)[0] || null;
  handlers.setFirstName(displayName);
  handlers.setLeadUid(savedUid ?? null);

  if (!lead.discovery_complete) {
    return false;
  }

  if (lead.qualification_status === "unqualified") {
    handlers.setPhase("thanks-interest");
    return true;
  }

  if (lead.qualification_status === "qualified") {
    handlers.setCalendlyPrefill({
      name: userName || lead.name,
      email: userEmail || lead.email,
      uid: savedUid ?? undefined,
    });
    handlers.setPhase("calendly");
    return true;
  }

  return false;
}

export function useUnicoachDiscoveryBooking({ userName, userEmail, open = true, onComplete }: UseUnicoachDiscoveryBookingOptions) {
  const [phase, setPhase] = useState<DiscoveryPhase>("idle");
  const [leadUid, setLeadUid] = useState<string | null>(null);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [calendlyPrefill, setCalendlyPrefill] = useState<{ name?: string; email?: string; uid?: string }>({});
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    ensureCalendlyAssets();
  }, []);

  useEffect(() => {
    if (open) return;
    setPhase("idle");
    setLeadUid(null);
    setFirstName(null);
    setCalendlyPrefill({});
    setIsResolving(false);
  }, [open]);

  useEffect(() => {
    if (phase !== "confirmed") return;
    fireBookingConfetti();
    const timer = window.setTimeout(() => {
      setPhase("idle");
      onComplete?.();
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [phase, onComplete]);

  const openCalendlyFromLead = useCallback(
    (lead: { uid?: string; name?: string; email?: string; discovery_complete?: boolean; qualification_status?: string | null }) =>
      routeFromExistingLead(lead, userName, userEmail, {
        setFirstName,
        setLeadUid,
        setCalendlyPrefill,
        setPhase,
      }),
    [userEmail, userName]
  );

  const resolveExistingLead = useCallback(async (): Promise<boolean> => {
    try {
      const raw = sessionStorage.getItem(MASTERCLASS_LEAD_SESSION_KEY);
      if (raw) {
        const sessionLead = JSON.parse(raw) as {
          uid?: string;
          discoveryComplete?: boolean;
          qualificationStatus?: string | null;
          name?: string;
          email?: string;
        };
        if (sessionLead.uid && sessionLead.discoveryComplete) {
          if (sessionLead.qualificationStatus === "unqualified") {
            try {
              const fetched = await fetchMasterclassLead(sessionLead.uid);
              if (openCalendlyFromLead(fetched)) return true;
            } catch {
              clearLeadSession();
            }
          } else if (sessionLead.qualificationStatus === "qualified") {
            try {
              const fetched = await fetchMasterclassLead(sessionLead.uid);
              if (openCalendlyFromLead(fetched)) return true;
            } catch {
              clearLeadSession();
            }
          } else {
            clearLeadSession();
          }
        } else if (sessionLead.uid && !sessionLead.discoveryComplete) {
          clearLeadSession();
        }
      }

      const lead = await fetchAuthenticatedMasterclassLead();
      if (lead.found === false) return false;
      return openCalendlyFromLead(lead);
    } catch {
      return false;
    }
  }, [openCalendlyFromLead]);

  const startDiscoveryForm = useCallback(async () => {
    setIsResolving(true);
    try {
      const skipped = await resolveExistingLead();
      if (!skipped) {
        setPhase("form");
      }
    } finally {
      setIsResolving(false);
    }
  }, [resolveExistingLead]);

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
      if (payload.stage !== "complete" || !payload.discovery) return;

      const result = await submitAuthenticatedDiscoveryLead({
        uid: payload.uid,
        discovery: payload.discovery,
      });

      openCalendlyFromLead(result);
      if (result.qualification_status !== "qualified" && result.qualification_status !== "unqualified") {
        setPhase("form");
      }
    },
    [openCalendlyFromLead]
  );

  const closeOverlay = useCallback(() => {
    setPhase("idle");
  }, []);

  const openDiscoveryAnyway = useCallback(() => {
    setCalendlyPrefill({
      name: userName,
      email: userEmail,
      uid: leadUid ?? undefined,
    });
    setPhase("calendly");
  }, [leadUid, userEmail, userName]);

  const discoveryOverlay =
    phase === "form" ? (
      <MasterclassOnboardingModal
        open
        intent="booking"
        theme="light"
        skipContactStep
        initialStep="questions"
        initialLead={{ name: userName, email: userEmail } as never}
        onClose={() => setPhase("idle")}
        onSubmit={handleLeadSubmit}
      />
    ) : phase === "calendly" ? (
      <UnicoachCalendlyEmbed
        name={calendlyPrefill.name}
        email={calendlyPrefill.email}
        uid={calendlyPrefill.uid}
        onScheduled={() => setPhase("confirmed")}
        onClose={() => setPhase("idle")}
      />
    ) : phase === "confirmed" ? (
      <div className="fixed inset-0 z-[230] flex items-center justify-center bg-slate-900/40 px-6 backdrop-blur-sm">
        <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white px-6 py-8 text-center shadow-xl dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs font-semibold text-brand-600 dark:text-brand-400">Discovery call booked</p>
          <h2 className="mt-2 text-2xl font-medium text-slate-900 dark:text-white">
            You&apos;re booked{firstName ? `, ${firstName}` : ""}!
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Your discovery call is confirmed. Check your email for the calendar invite — we&apos;ll see you on the call.
          </p>
          <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">Returning to your journey in a few seconds…</p>
        </div>
      </div>
    ) : phase === "thanks-interest" ? (
      <div className="fixed inset-0 z-[230] flex items-center justify-center bg-slate-900/40 px-6 backdrop-blur-sm">
        <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white px-6 py-8 text-center shadow-xl dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs font-semibold text-brand-600 dark:text-brand-400">Thanks for your interest</p>
          <h2 className="mt-2 text-2xl font-medium text-slate-900 dark:text-white">Keep using Unimad for free</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            We understand you&apos;re not ready for the guided programme right now. Continue with Unimad and our team will reach out if
            you&apos;d like to join later.
          </p>
          <button
            type="button"
            onClick={closeOverlay}
            className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
          >
            Continue with Unimad
          </button>
          <div className="mt-6 border-t border-slate-200 pt-6 dark:border-slate-700">
            <p className="text-sm text-slate-600 dark:text-slate-300">Really interested?</p>
            <button
              type="button"
              onClick={openDiscoveryAnyway}
              className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-brand-200 bg-brand-50 px-5 py-2.5 text-sm font-medium text-brand-700 transition hover:bg-brand-100 dark:border-brand-500/40 dark:bg-brand-500/10 dark:text-brand-300 dark:hover:bg-brand-500/20"
            >
              Book discovery call anyway
            </button>
          </div>
        </div>
      </div>
    ) : null;

  return {
    startDiscoveryForm,
    resolveExistingLead,
    discoveryOverlay,
    isDiscoveryActive: phase !== "idle",
    isResolving,
    phase,
    closeOverlay,
    leadUid,
  };
}
