"use client";

import { useProfileData } from "@/features/user-profile/hooks/use-profile-data";
import { ProfileEducationSection } from "./resume-data/ProfileEducationSection";
import { ProfileExperienceSection } from "./resume-data/ProfileExperienceSection";
import { ProfileProjectsSection } from "./resume-data/ProfileProjectsSection";
import { ProfileSkillsSection } from "./resume-data/ProfileSkillsSection";

export function ResumeProfileDataPanel() {
  const { data: profile } = useProfileData();
  const onboarding = profile?.onboarding_data;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-brand-200 bg-brand-50/60 p-4 dark:border-brand-900/50 dark:bg-brand-950/20">
        <p className="text-sm text-slate-700 dark:text-slate-300">
          This is the resume and profile data Unimad stores for you. Unibot uses it to personalise guidance and help generate assets like
          your resume and cover letter. You can edit or remove entries below.
        </p>
      </div>

      {(onboarding?.course || onboarding?.uni || onboarding?.graduation_year || onboarding?.role) && (
        <div className="flex flex-wrap gap-2">
          {onboarding.course ? (
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
              Course: {onboarding.course}
            </span>
          ) : null}
          {onboarding.uni ? (
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
              University: {onboarding.uni}
            </span>
          ) : null}
          {onboarding.role ? (
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
              Role: {onboarding.role}
            </span>
          ) : null}
          {onboarding.graduation_year ? (
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
              Graduation: {onboarding.graduation_year}
            </span>
          ) : null}
        </div>
      )}

      <ProfileExperienceSection />
      <ProfileEducationSection />
      <ProfileProjectsSection />
      <ProfileSkillsSection />
    </div>
  );
}
