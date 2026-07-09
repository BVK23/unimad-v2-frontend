"use client";

import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import TiptapEditor from "@/components/TiptapEditor";
import { resumeFieldDomId } from "@/features/resume/utils/resume-validation-focus";
import type { ResumeProfile } from "@/types";
import type { ValidationError } from "@/utils/validation";
import ResumeFieldError from "./ResumeFieldError";

const PROFILE_SYNC_MS = 150;

export type ResumePersonalDetailsFieldsHandle = {
  /** Push any in-flight local edits to the resume store (e.g. before save). */
  flushToStore: () => void;
};

type ResumePersonalDetailsFieldsProps = {
  profile: ResumeProfile;
  onProfileSync: (profile: ResumeProfile) => void;
  validationErrors: ValidationError[];
  showFieldValidation: boolean;
  onImprove: (text: string) => void;
  resumeId: string;
};

const inputClass =
  "w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none dark:text-white dark:placeholder:text-slate-500";

const ResumePersonalDetailsFields = forwardRef<ResumePersonalDetailsFieldsHandle, ResumePersonalDetailsFieldsProps>(
  function ResumePersonalDetailsFields({ profile, onProfileSync, validationErrors, showFieldValidation, onImprove, resumeId }, ref) {
    const [localProfile, setLocalProfile] = useState(profile);
    const localProfileRef = useRef(profile);
    const pushedSignatureRef = useRef(JSON.stringify(profile));
    const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const flushToStore = useCallback(() => {
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
        syncTimerRef.current = null;
      }
      const snapshot = localProfileRef.current;
      const signature = JSON.stringify(snapshot);
      if (signature === pushedSignatureRef.current) return;
      pushedSignatureRef.current = signature;
      onProfileSync(snapshot);
    }, [onProfileSync]);

    const scheduleSync = useCallback(
      (nextProfile: ResumeProfile) => {
        localProfileRef.current = nextProfile;
        if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
        syncTimerRef.current = setTimeout(() => {
          syncTimerRef.current = null;
          const snapshot = localProfileRef.current;
          pushedSignatureRef.current = JSON.stringify(snapshot);
          onProfileSync(snapshot);
        }, PROFILE_SYNC_MS);
      },
      [onProfileSync]
    );

    useEffect(() => {
      if (syncTimerRef.current) return;

      const incoming = JSON.stringify(profile);
      const localSignature = JSON.stringify(localProfileRef.current);
      if (localSignature !== pushedSignatureRef.current) return;

      if (incoming === pushedSignatureRef.current) return;
      pushedSignatureRef.current = incoming;
      localProfileRef.current = profile;
      // Parent store updated (e.g. resume load) — mirror into local edit buffer.
      // eslint-disable-next-line react-hooks/set-state-in-effect -- external profile sync
      setLocalProfile(profile);
    }, [profile]);

    useEffect(() => {
      return () => {
        if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
      };
    }, []);

    useImperativeHandle(ref, () => ({ flushToStore }), [flushToStore]);

    const handleFieldChange = (field: keyof ResumeProfile, value: string) => {
      setLocalProfile(prev => {
        const next = { ...prev, [field]: value };
        scheduleSync(next);
        return next;
      });
    };

    const fieldError = (field: string) => {
      if (!showFieldValidation) return false;
      return validationErrors.some(e => e.section === "profile" && e.field === field);
    };

    return (
      <div className="space-y-5 animate-in fade-in slide-in-from-left-2 duration-200">
        <h2 className="text-lg font-medium text-slate-900 dark:text-white flex items-center gap-2">Personal Details</h2>
        <div className="space-y-4">
          <div>
            <input
              id={resumeFieldDomId("profile", "fullName")}
              placeholder="Full Name"
              value={localProfile.fullName ?? ""}
              onChange={e => handleFieldChange("fullName", e.target.value)}
              onBlur={flushToStore}
              className={`${inputClass} font-medium ${fieldError("fullName") ? "border-red-500" : ""}`}
            />
            <ResumeFieldError errors={validationErrors} section="profile" field="fullName" visible={showFieldValidation} />
          </div>
          <input
            placeholder="Job Title"
            value={localProfile.title ?? ""}
            onChange={e => handleFieldChange("title", e.target.value)}
            onBlur={flushToStore}
            className={`${inputClass} font-medium`}
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <input
                id={resumeFieldDomId("profile", "email")}
                placeholder="Email"
                value={localProfile.email ?? ""}
                onChange={e => handleFieldChange("email", e.target.value)}
                onBlur={flushToStore}
                className={`${inputClass} ${fieldError("email") ? "border-red-500" : ""}`}
              />
              <ResumeFieldError errors={validationErrors} section="profile" field="email" visible={showFieldValidation} />
            </div>
            <div>
              <input
                id={resumeFieldDomId("profile", "phone")}
                placeholder="Phone"
                value={localProfile.phone ?? ""}
                onChange={e => handleFieldChange("phone", e.target.value)}
                onBlur={flushToStore}
                className={`${inputClass} ${fieldError("phone") ? "border-red-500" : ""}`}
              />
              <ResumeFieldError errors={validationErrors} section="profile" field="phone" visible={showFieldValidation} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="City"
              value={localProfile.city ?? ""}
              onChange={e => handleFieldChange("city", e.target.value)}
              onBlur={flushToStore}
              className={inputClass}
            />
            <input
              placeholder="Country"
              value={localProfile.country ?? ""}
              onChange={e => handleFieldChange("country", e.target.value)}
              onBlur={flushToStore}
              className={inputClass}
            />
          </div>
          <input
            placeholder="LinkedIn (username or URL)"
            value={localProfile.linkedin || ""}
            onChange={e => handleFieldChange("linkedin", e.target.value)}
            onBlur={flushToStore}
            className={inputClass}
          />
          <input
            placeholder="GitHub (username or URL)"
            value={localProfile.github || ""}
            onChange={e => handleFieldChange("github", e.target.value)}
            onBlur={flushToStore}
            className={inputClass}
          />
          <input
            id={resumeFieldDomId("profile", "portfolio")}
            placeholder="Portfolio (URL)"
            value={localProfile.portfolio || ""}
            onChange={e => handleFieldChange("portfolio", e.target.value)}
            onBlur={flushToStore}
            className={`${inputClass} ${fieldError("portfolio") ? "border-red-500" : ""}`}
          />
          <ResumeFieldError errors={validationErrors} section="profile" field="portfolio" visible={showFieldValidation} />
          <div className="pt-2">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-2 uppercase tracking-wide">
              Professional Summary
            </label>
            <TiptapEditor
              placeholder="Write a short professional summary..."
              value={localProfile.summary ?? ""}
              onChange={val => handleFieldChange("summary", val)}
              onImprove={onImprove}
              unibotImproveTarget={{ section: "summary", resumeId }}
            />
          </div>
        </div>
      </div>
    );
  }
);

export default React.memo(ResumePersonalDetailsFields);
