"use client";

import { useState } from "react";
import { ProfileConfirmDialog } from "@/components/user-profile/ProfileConfirmDialog";
import { btnOutline } from "@/constants/ui/button-classes";
import { useClearProfileKnowledgeMutation, useProfileData } from "@/features/user-profile/hooks/use-profile-data";
import { hasLinkedInStoredData, parseLinkedInExperience, parseLinkedInSkills } from "@/features/user-profile/utils/linkedin-display";
import { ExternalLink, Linkedin } from "lucide-react";

export function LinkedInStoredDataPanel() {
  const { data: profile, isLoading } = useProfileData();
  const clearMutation = useClearProfileKnowledgeMutation();
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const li = profile?.linkedin_stored_data;

  const experiences = parseLinkedInExperience(li?.experience);
  const skills = parseLinkedInSkills(li?.skills);
  const hasData = hasLinkedInStoredData(li);

  const handleClear = async () => {
    setError(null);
    try {
      await clearMutation.mutateAsync("linkedin_profile");
      setDeleteOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to disconnect LinkedIn account");
    }
  };

  if (isLoading) {
    return <div className="h-48 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-brand-200 bg-brand-50/60 p-4 dark:border-brand-900/50 dark:bg-brand-950/20">
        <p className="text-sm text-slate-700 dark:text-slate-300">
          This is a snapshot of your LinkedIn profile from your last analysis. Unibot and LinkedIn tools use it to tailor suggestions. Edit
          your profile on LinkedIn — this view is read-only here.
        </p>
      </div>

      {!hasData ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No LinkedIn profile snapshot stored yet. Visit the LinkedIn section to analyse your profile.
        </p>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#111]">
            <div className="flex flex-wrap items-start gap-4">
              {li?.profile_picture_url ? (
                // eslint-disable-next-line @next/next/no-img-element -- external LinkedIn CDN avatar
                <img
                  src={li.profile_picture_url}
                  alt=""
                  className="h-16 w-16 shrink-0 rounded-full border border-slate-200 object-cover dark:border-slate-700"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300">
                  <Linkedin size={28} />
                </div>
              )}
              <div className="min-w-0 flex-1 space-y-1">
                {li?.display_name ? <h3 className="text-base font-semibold text-slate-900 dark:text-white">{li.display_name}</h3> : null}
                {li?.headline ? <p className="text-sm text-slate-600 dark:text-slate-400">{li.headline}</p> : null}
                {li?.profile_url ? (
                  <a
                    href={li.profile_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
                  >
                    View on LinkedIn <ExternalLink size={12} />
                  </a>
                ) : null}
                {li?.overall_score != null ? (
                  <p className="text-xs text-slate-500">
                    Overall audit score: <span className="font-semibold text-slate-700 dark:text-slate-300">{li.overall_score}%</span>
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          {li?.about ? (
            <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">About</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-800 dark:text-slate-200">{li.about}</p>
            </div>
          ) : null}

          {experiences.length > 0 ? (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Experience</h4>
              {experiences.map((exp, index) => (
                <div
                  key={`${exp.company}-${exp.title}-${index}`}
                  className="rounded-xl border border-brand-500/20 bg-white px-4 py-3 dark:border-brand-500/15 dark:bg-[#111]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      {exp.title || "Role"}
                      {exp.isCurrent ? (
                        <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                          Current
                        </span>
                      ) : null}
                    </span>
                    {exp.duration ? <span className="text-xs text-slate-500">{exp.duration}</span> : null}
                  </div>
                  {exp.company ? <p className="mt-1 text-xs font-medium text-brand-600 dark:text-brand-400">{exp.company}</p> : null}
                  {exp.description ? (
                    <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-slate-600 dark:text-slate-400">{exp.description}</p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}

          {skills.length > 0 ? (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Skills</h4>
              <div className="flex flex-wrap gap-2">
                {skills.map(skill => (
                  <span
                    key={skill}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {li?.analyzed_at ? <p className="text-xs text-slate-500">Last analysed: {new Date(li.analyzed_at).toLocaleString()}</p> : null}

          <button
            type="button"
            className={`${btnOutline} !border-red-200 !text-red-600 hover:!bg-red-50 dark:!border-red-900/50`}
            disabled={clearMutation.isPending}
            onClick={() => setDeleteOpen(true)}
          >
            Delete LinkedIn account
          </button>
        </div>
      )}

      {error ? <p className="text-xs text-red-600">{error}</p> : null}

      <ProfileConfirmDialog
        open={deleteOpen}
        title="Delete LinkedIn account?"
        description={
          <div className="space-y-3">
            <p>
              If you disconnect your LinkedIn account from Unimad, you will <strong>lose all your work</strong> in the LinkedIn feature —
              including analysis results, suggestions, and any progress tied to this profile.
            </p>
            <p>
              You will <strong>not be able to use the LinkedIn feature again</strong> for a cooldown period of <strong>3 weeks</strong>.
            </p>
            <p className="text-slate-500">This action cannot be undone.</p>
          </div>
        }
        confirmLabel={clearMutation.isPending ? "Removing…" : "Delete LinkedIn account"}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => void handleClear()}
        confirmDisabled={clearMutation.isPending}
      />
    </div>
  );
}
