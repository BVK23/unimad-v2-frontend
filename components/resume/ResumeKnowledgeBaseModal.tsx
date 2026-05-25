"use client";

import React from "react";
import { ATS_COMPLETE_THRESHOLD } from "@/lib/resume/atsConstants";
import { X, BookOpen, Play, Lightbulb, ListChecks, FileText, Sparkles } from "lucide-react";

interface ResumeKnowledgeBaseModalProps {
  open: boolean;
  onClose: () => void;
}

const GUIDE_SECTIONS = [
  {
    id: "start",
    title: "Start with the right structure",
    body: `A strong resume follows a predictable flow: contact details, a concise summary, experience, education, and skills. International students should lead with clarity—recruiters often scan for role fit in under 10 seconds.

Use one page unless you have 5+ years of relevant experience. Keep margins generous and section headings consistent.`,
    tip: "Drag sections in the left sidebar to reorder what recruiters see first.",
    showGif: false,
  },
  {
    id: "summary",
    title: "Write a summary that passes ATS",
    body: `Your summary should be 2–4 lines: who you are, your target role, and one proof point (metric, project, or outcome). Mirror keywords from job descriptions you are applying to—without keyword stuffing.

Avoid first-person pronouns ("I", "my") in many ATS-friendly formats. Start with a role title or strength instead.`,
    tip: "Aim for at least 50 characters. Short summaries are a common reason scores stay low.",
    showGif: true,
    gifLabel: "Writing a strong summary (GIF)",
  },
  {
    id: "experience",
    title: "Experience: bullets over paragraphs",
    body: `Each role needs 2–4 bullet points starting with strong verbs (Led, Built, Improved, Delivered). Quantify where possible: percentages, time saved, users reached, or revenue impact.

If you are early-career, include internships, part-time work, volunteering, and substantial academic projects under Experience or Custom sections.`,
    tip: "Use the Improve control on any field to ask Unibot to rewrite a bullet.",
    showGif: true,
    gifLabel: "Bullet formatting in the editor (GIF)",
  },
  {
    id: "skills",
    title: "Skills and education",
    body: `List 6–12 skills grouped by theme (e.g. Technical, Tools, Languages). Match the stack named in target job posts.

Education should include school, degree, and dates. Add relevant coursework or honors only if they support your target role.`,
    tip: "Listing fewer than four skills often lowers your ATS score.",
    showGif: false,
  },
];

function MediaPlaceholder({ label, aspect = "video" }: { label: string; aspect?: "video" | "wide" | "square" }) {
  const aspectClass = aspect === "video" ? "aspect-video" : aspect === "square" ? "aspect-square max-w-xs" : "aspect-[2/1]";

  return (
    <div
      className={`relative ${aspectClass} w-full overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br from-slate-100 via-brand-50/40 to-slate-100 dark:border-slate-700 dark:from-slate-800 dark:via-brand-950/30 dark:to-slate-800`}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/80 shadow-sm dark:bg-slate-900/80">
          {aspect === "video" ? <Play size={22} className="ml-0.5 text-brand-600" /> : <Sparkles size={20} className="text-brand-600" />}
        </div>
        <p className="text-xs font-medium text-slate-600 dark:text-slate-300">{label}</p>
        <p className="text-[10px] text-slate-400">Asset placeholder — replace with GIF or video</p>
      </div>
    </div>
  );
}

export default function ResumeKnowledgeBaseModal({ open, onClose }: ResumeKnowledgeBaseModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm sm:p-6 animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="resume-kb-title"
        className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 dark:border-slate-800 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/50">
              <BookOpen size={20} />
            </div>
            <div>
              <h2 id="resume-kb-title" className="text-lg font-semibold text-slate-900 dark:text-white">
                Resume knowledge base
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Guidance on building a resume that clears ATS and impresses recruiters
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close knowledge base"
          >
            <X size={20} />
          </button>
        </div>

        <div className="scrollbar-on-hover flex-1 overflow-y-auto px-6 py-6 sm:px-8">
          <div className="mb-8 rounded-xl border border-brand-100 bg-brand-50/60 p-5 dark:border-brand-900/40 dark:bg-brand-950/30">
            <div className="flex gap-3">
              <Lightbulb size={20} className="mt-0.5 flex-shrink-0 text-brand-600" />
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Quick start</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  Fill mandatory profile fields, add at least one experience entry, four skills, and education. Use{" "}
                  <strong>Recalculate</strong> up to five times, then <strong>Fix once with Unibot</strong> for a guided pass on remaining
                  issues. Scores at {ATS_COMPLETE_THRESHOLD}%+ mean your resume is ready to share or move to portfolio and job applications.
                </p>
              </div>
            </div>
          </div>

          <div className="mb-10">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-500">
              <Play size={16} /> Video walkthrough
            </h3>
            <MediaPlaceholder label="How to build your first resume on Unimad (video)" aspect="video" />
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              Watch the full walkthrough: uploading a draft, editing sections, reading your ATS report, and when to book UniCoach for deeper
              review.
            </p>
          </div>

          <div className="mb-10 grid gap-4 sm:grid-cols-2">
            <MediaPlaceholder label="Reorder sections (GIF)" aspect="square" />
            <MediaPlaceholder label="ATS score & recalculate (GIF)" aspect="square" />
          </div>

          <div className="space-y-10">
            {GUIDE_SECTIONS.map((section, index) => (
              <section key={section.id} className="border-b border-slate-100 pb-10 last:border-0 dark:border-slate-800">
                <div className="flex items-start gap-3">
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">{section.title}</h3>
                    <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600 dark:text-slate-300">{section.body}</p>
                    <p className="mt-3 flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:bg-slate-800/80 dark:text-slate-400">
                      <ListChecks size={14} className="mt-0.5 flex-shrink-0 text-brand-600" />
                      {section.tip}
                    </p>
                    {section.showGif && section.gifLabel && (
                      <div className="mt-4">
                        <MediaPlaceholder label={section.gifLabel} aspect="wide" />
                      </div>
                    )}
                  </div>
                </div>
              </section>
            ))}
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/50">
            <div className="flex gap-3">
              <FileText size={20} className="flex-shrink-0 text-slate-500" />
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Before you download or share</p>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-slate-600 dark:text-slate-300">
                  <li>Proofread names, dates, and links (LinkedIn, email, phone).</li>
                  <li>Export PDF only after your ATS score meets your target (we recommend 60%+).</li>
                  <li>Tailor keywords per application; duplicate the resume card to maintain versions.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 px-6 py-4 dark:border-slate-800 sm:px-8">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-slate-900 py-2.5 text-sm font-medium text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 sm:w-auto sm:px-8"
          >
            Back to editor
          </button>
        </div>
      </div>
    </div>
  );
}
