"use client";

import { useEffect, useMemo, useRef } from "react";
import { buildMasterclassDiscoveryCalendlyUrl, normalizeCalendlyPrefill } from "@/constants/masterclass";
import { ensureCalendlyAssets } from "@/lib/masterclass/calendly";
import { X } from "lucide-react";

type UnicoachCalendlyEmbedProps = {
  name?: string;
  email?: string;
  uid?: string;
  onScheduled?: () => void;
  onClose?: () => void;
};

export function UnicoachCalendlyEmbed({ name, email, uid, onScheduled, onClose }: UnicoachCalendlyEmbedProps) {
  const calendlyRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  const calendlyUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return buildMasterclassDiscoveryCalendlyUrl(window.location.origin, {
      ...normalizeCalendlyPrefill({ name, email }),
      uid,
    });
  }, [email, name, uid]);

  useEffect(() => {
    ensureCalendlyAssets();
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== "https://calendly.com") return;
      if (event.data?.event === "calendly.event_scheduled") {
        onScheduled?.();
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onScheduled]);

  useEffect(() => {
    initializedRef.current = false;
  }, [calendlyUrl]);

  useEffect(() => {
    if (!calendlyUrl || !calendlyRef.current) return;

    const initInlineCalendly = () => {
      if (!window.Calendly?.initInlineWidget || !calendlyRef.current || initializedRef.current) return;
      calendlyRef.current.innerHTML = "";
      window.Calendly.initInlineWidget({
        url: calendlyUrl,
        parentElement: calendlyRef.current,
      });
      initializedRef.current = true;
    };

    initInlineCalendly();
    if (!window.Calendly?.initInlineWidget) {
      const timer = window.setInterval(() => {
        if (window.Calendly?.initInlineWidget) {
          window.clearInterval(timer);
          initInlineCalendly();
        }
      }, 200);
      return () => window.clearInterval(timer);
    }
  }, [calendlyUrl]);

  if (!calendlyUrl) return null;

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center bg-slate-900/50 px-4 py-6 backdrop-blur-sm">
      <div className="relative flex w-full max-w-[920px] flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-700">
          <div>
            <p className="text-xs font-semibold text-brand-600 dark:text-brand-400">Discovery call</p>
            <h2 className="text-lg font-medium text-slate-900 dark:text-white">Pick a time for your free call</h2>
          </div>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close booking"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
            >
              <X size={16} />
            </button>
          ) : null}
        </div>

        <div ref={calendlyRef} className="w-full" style={{ minWidth: 320, height: 700 }} />
      </div>
    </div>
  );
}
