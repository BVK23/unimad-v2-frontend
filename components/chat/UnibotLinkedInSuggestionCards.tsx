"use client";

import React, { useCallback, useLayoutEffect, useRef, useState } from "react";
import type {
  LinkedInExperienceSuggestion,
  LinkedInGuideSlide,
  UnimadLinkedInSuggestionsPayload,
} from "@/src/features/adk-chat/parse-unimad-linkedin-suggestions";
import { growTextareaToFit } from "@/utils/textarea-autosize";
import { Check, Copy, Pencil, X } from "lucide-react";
import { FormattedAgentMessage } from "./FormattedAgentMessage";
import { LinkedInGuideImage } from "./LinkedInGuideImage";
import { UnibotLinkedInReanalyseButton } from "./UnibotLinkedInReanalyseButton";

type Props = {
  payload: UnimadLinkedInSuggestionsPayload;
  /** Widen About cards in sub-thread sidebar */
  wideLayout?: boolean;
};

const suggestionBodyClass = "w-full whitespace-pre-wrap text-[13px] leading-relaxed text-slate-800 dark:text-slate-100";

function useCopyFeedback() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const copy = useCallback(async (key: string, text: string) => {
    if (!text.trim()) return;
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey(null), 1800);
  }, []);
  return { copiedKey, copy };
}

type EditableCopyBoxProps = {
  boxKey: string;
  value: string;
  onChange: (next: string) => void;
  label?: string;
  labelClassName?: string;
  className?: string;
};

function EditableCopyBox({ boxKey, value, onChange, label, labelClassName, className = "" }: EditableCopyBoxProps) {
  const { copiedKey, copy } = useCopyFeedback();
  const [editing, setEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    if (!editing || !textareaRef.current) return;
    growTextareaToFit(textareaRef.current);
    textareaRef.current.focus();
  }, [editing, value]);

  const toggleEditing = () => setEditing(v => !v);

  return (
    <div className={`rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 ${className}`}>
      {label ? (
        <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2 dark:border-slate-800">
          <span className={labelClassName ?? "text-[11px] font-semibold uppercase tracking-wide text-slate-500"}>{label}</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={toggleEditing}
              className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
              aria-label={editing ? "Preview" : "Edit"}
            >
              {editing ? <X size={14} /> : <Pencil size={14} />}
            </button>
            <button
              type="button"
              onClick={() => void copy(boxKey, value)}
              className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-slate-800"
              aria-label="Copy"
            >
              {copiedKey === boxKey ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex justify-end gap-1 px-2 pt-2">
          <button
            type="button"
            onClick={toggleEditing}
            className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label={editing ? "Preview" : "Edit"}
          >
            {editing ? <X size={14} /> : <Pencil size={14} />}
          </button>
          <button
            type="button"
            onClick={() => void copy(boxKey, value)}
            className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Copy"
          >
            {copiedKey === boxKey ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
          </button>
        </div>
      )}
      <div className="px-3 pb-3 pt-1">
        {editing ? (
          <textarea
            ref={textareaRef}
            value={value}
            rows={1}
            onChange={e => {
              onChange(e.target.value);
              growTextareaToFit(e.target);
            }}
            className={`${suggestionBodyClass} resize-none overflow-hidden border-0 bg-transparent p-0 outline-none ring-0 transition-[height] duration-150 ease-out focus:ring-0`}
          />
        ) : (
          <p className={suggestionBodyClass}>{value}</p>
        )}
      </div>
    </div>
  );
}

function LinkedInEditHint({
  hint,
  guideImageUrl,
  guideImageSlides,
  guideAlt = "Where to edit on LinkedIn",
}: {
  hint?: string;
  guideImageUrl?: string;
  guideImageSlides?: LinkedInGuideSlide[];
  guideAlt?: string;
}) {
  if (!hint && !guideImageUrl && !guideImageSlides?.length) return null;
  const multi = (guideImageSlides?.length ?? 0) > 1;
  return (
    <div className="mb-2 rounded-lg border border-brand-100 bg-brand-50/60 px-3 py-2 text-[12px] leading-relaxed text-brand-900 dark:border-brand-900/40 dark:bg-brand-950/30 dark:text-brand-100">
      {hint ? <FormattedAgentMessage content={hint} className="text-[12px]" /> : null}
      {guideImageUrl || guideImageSlides?.length ? (
        <LinkedInGuideImage
          src={guideImageSlides?.length ? undefined : guideImageUrl}
          slides={guideImageSlides}
          alt={guideAlt}
          caption={multi ? undefined : "Tap Expand to zoom in"}
        />
      ) : null}
    </div>
  );
}

function HeadlineVariants({ variants }: { variants: string[] }) {
  const [drafts, setDrafts] = useState(variants);
  return (
    <div className="space-y-2">
      {drafts.map((text, i) => (
        <EditableCopyBox
          key={`headline-${i}`}
          boxKey={`headline-${i}`}
          label={`Option ${i + 1}`}
          value={text}
          onChange={next => setDrafts(prev => prev.map((v, idx) => (idx === i ? next : v)))}
        />
      ))}
    </div>
  );
}

function AboutDraft({ text, wide }: { text: string; wide?: boolean }) {
  const [draft, setDraft] = useState(text);
  return <EditableCopyBox boxKey="about" label="Revised About" value={draft} onChange={setDraft} className={wide ? "w-full" : ""} />;
}

function ExperienceCards({ experiences }: { experiences: LinkedInExperienceSuggestion[] }) {
  const [drafts, setDrafts] = useState(experiences);
  return (
    <div className="space-y-3">
      {drafts.map((exp, i) => {
        const roleLabel = [exp.title, exp.company].filter(Boolean).join(" · ");
        return (
          <EditableCopyBox
            key={`exp-${i}`}
            boxKey={`exp-${i}`}
            label={roleLabel || `Role ${i + 1}`}
            labelClassName="truncate text-[12px] font-semibold text-slate-700 dark:text-slate-200"
            value={exp.description}
            onChange={next => setDrafts(prev => prev.map((row, idx) => (idx === i ? { ...row, description: next } : row)))}
          />
        );
      })}
    </div>
  );
}

function SkillsCards({ topSkills, additionalSkills, tip }: { topSkills: string[]; additionalSkills?: string[]; tip?: string }) {
  const { copiedKey, copy } = useCopyFeedback();
  const topText = topSkills.join(" • ");
  const additionalText = (additionalSkills ?? []).join(", ");

  return (
    <div className="space-y-2">
      <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Top 5 (About section)</span>
          <button
            type="button"
            onClick={() => void copy("top-skills", topText)}
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Copy top skills"
          >
            {copiedKey === "top-skills" ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
          </button>
        </div>
        <p className="text-[13px] text-slate-800 dark:text-slate-100">{topText}</p>
      </div>
      {additionalSkills && additionalSkills.length > 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Also add (Skills section)</span>
            <button
              type="button"
              onClick={() => void copy("more-skills", additionalText)}
              className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Copy additional skills"
            >
              {copiedKey === "more-skills" ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            </button>
          </div>
          <p className="text-[13px] text-slate-800 dark:text-slate-100">{additionalText}</p>
        </div>
      ) : null}
      {tip ? <p className="text-[12px] leading-relaxed text-slate-600 dark:text-slate-400">{tip}</p> : null}
    </div>
  );
}

function CoverTaglines({ taglines }: { taglines: string[] }) {
  const [drafts, setDrafts] = useState(taglines);
  return (
    <div className="space-y-2">
      {drafts.map((text, i) => (
        <EditableCopyBox
          key={`tagline-${i}`}
          boxKey={`tagline-${i}`}
          label={`Tagline ${i + 1}`}
          value={text}
          onChange={next => setDrafts(prev => prev.map((v, idx) => (idx === i ? next : v)))}
        />
      ))}
    </div>
  );
}

function ProfilePicGuidance({ guidance }: { guidance: NonNullable<UnimadLinkedInSuggestionsPayload["profilePicGuidance"]> }) {
  return (
    <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3 text-[13px] leading-relaxed dark:border-slate-700 dark:bg-slate-900">
      {guidance.reassurance ? <p className="font-medium text-emerald-700 dark:text-emerald-400">{guidance.reassurance}</p> : null}
      {guidance.whatToImprove ? (
        <div>
          <p className="mb-0.5 text-[11px] font-semibold uppercase text-slate-500">Could improve</p>
          <p className="text-slate-800 dark:text-slate-100">{guidance.whatToImprove}</p>
        </div>
      ) : null}
      {guidance.whatWorks ? (
        <div>
          <p className="mb-0.5 text-[11px] font-semibold uppercase text-slate-500">What works</p>
          <p className="text-slate-800 dark:text-slate-100">{guidance.whatWorks}</p>
        </div>
      ) : null}
      {guidance.idealDescription ? (
        <div>
          <p className="mb-0.5 text-[11px] font-semibold uppercase text-slate-500">Ideal photo direction</p>
          <p className="text-slate-800 dark:text-slate-100">{guidance.idealDescription}</p>
        </div>
      ) : null}
    </div>
  );
}

export function UnibotLinkedInSuggestionCards({ payload, wideLayout = false }: Props) {
  const useWide = wideLayout || payload.section === "about";
  const guideAlt =
    payload.section === "about"
      ? "Where to edit About on LinkedIn"
      : payload.section === "experience"
        ? "Where to edit Experience on LinkedIn"
        : "Where to edit on LinkedIn";

  return (
    <div className={`mt-2 space-y-2 ${useWide ? "w-full max-w-none" : "max-w-full"}`}>
      {payload.section === "headline" && payload.headlineVariants ? <HeadlineVariants variants={payload.headlineVariants} /> : null}
      {payload.section === "about" && payload.aboutDraft ? <AboutDraft text={payload.aboutDraft} wide={useWide} /> : null}
      {payload.section === "experience" && payload.experiences ? <ExperienceCards experiences={payload.experiences} /> : null}
      {payload.section === "skills" && payload.topSkills ? (
        <SkillsCards topSkills={payload.topSkills} additionalSkills={payload.additionalSkills} tip={payload.skillsLinkedinTip} />
      ) : null}
      {payload.section === "cover" && payload.coverTaglines ? <CoverTaglines taglines={payload.coverTaglines} /> : null}
      {payload.section === "pic" && payload.profilePicGuidance ? <ProfilePicGuidance guidance={payload.profilePicGuidance} /> : null}
      <LinkedInEditHint
        hint={payload.linkedinEditHint}
        guideImageUrl={payload.guideImageUrl}
        guideImageSlides={payload.guideImageSlides}
        guideAlt={guideAlt}
      />
      {payload.section === "pic" && (payload.showReanalyseCta ?? true) ? (
        <div className="space-y-1">
          <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
            After you update your photo on LinkedIn, re-analyse to refresh your score and get updated guidance.
          </p>
          <UnibotLinkedInReanalyseButton />
        </div>
      ) : null}
    </div>
  );
}
