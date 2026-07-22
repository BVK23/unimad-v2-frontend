"use client";

import { useMemo, useState } from "react";
import { btnGhost, btnPrimaryBrand } from "@/constants/ui/button-classes";
import { useProfileData, useUpdateProfileMutation } from "@/features/user-profile/hooks/use-profile-data";
import type { ProfileData } from "@/features/user-profile/types";
import { resolveProfilePictureFromProfile } from "@/features/user-profile/utils/resolve-profile-picture";
import { sanitizeUserFacingError } from "@/utils/message-from-failed-response";
import { OAuthConnectionsPanel } from "./OAuthConnectionsPanel";
import { ProfilePictureDialog } from "./ProfilePictureDialog";
import { UserProfileAvatar } from "./UserProfileAvatar";

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-[#0a0a0a] dark:text-slate-100";

function profileFormKey(profile: ProfileData): string {
  return String(profile.user_id ?? profile.email ?? "profile");
}

export function UserProfileSettingsPanel() {
  const { data: profile, isLoading } = useProfileData();

  return (
    <div className="space-y-6">
      {isLoading || !profile ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#111]">
          <div className="h-40 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
        </section>
      ) : (
        <UserProfileSettingsForm key={profileFormKey(profile)} profile={profile} />
      )}

      <OAuthConnectionsPanel
        hasGoogle={profile?.has_google}
        hasLinkedIn={profile?.has_linkedin}
        userId={profile?.user_id}
        isLoading={isLoading}
      />
    </div>
  );
}

function UserProfileSettingsForm({ profile }: { profile: ProfileData }) {
  const updateProfile = useUpdateProfileMutation();
  const [draft, setDraft] = useState(profile);
  const [pictureOpen, setPictureOpen] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const dirty = useMemo(() => {
    if (!draft) return false;
    const fields: (keyof ProfileData)[] = ["name", "headline", "linkedin_url", "portfolio_url", "github_url", "phone_number"];
    if ((draft.role?.[0] ?? "") !== (profile.role?.[0] ?? "")) return true;
    return fields.some(f => (draft[f] ?? "") !== (profile[f] ?? ""));
  }, [draft, profile]);

  const avatarUrl = resolveProfilePictureFromProfile(profile);

  const handleSave = async () => {
    if (!draft) return;
    setSaveError(null);
    try {
      await updateProfile.mutateAsync({
        name: draft.name ?? undefined,
        headline: draft.headline ?? undefined,
        linkedin_url: draft.linkedin_url ?? undefined,
        portfolio_url: draft.portfolio_url ?? undefined,
        github_url: draft.github_url ?? undefined,
        phone_number: draft.phone_number ?? undefined,
        role: draft.role?.[0] ? [draft.role[0]] : undefined,
      });
    } catch (e) {
      setSaveError(sanitizeUserFacingError(e instanceof Error ? e.message : "Failed to save", "Could not save profile. Please try again."));
    }
  };

  return (
    <>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#111]">
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          <div className="flex flex-col items-center gap-3 md:w-44 shrink-0">
            <UserProfileAvatar profile={profile} size={128} onClick={() => setPictureOpen(true)} showHover />
            <button type="button" onClick={() => setPictureOpen(true)} className={btnGhost}>
              Change photo
            </button>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{draft.name || "Your name"}</p>
              <p className="text-xs text-brand-600 dark:text-brand-400">{draft.email}</p>
            </div>
          </div>

          <div className="min-w-0 flex-1 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FieldRow label="Display name">
              <input
                className={inputClass}
                value={draft.name ?? ""}
                onChange={e => setDraft({ ...draft, name: e.target.value })}
                placeholder="Your name"
              />
            </FieldRow>
            <FieldRow label="Desired role">
              <input
                className={inputClass}
                value={draft.role?.[0] ?? ""}
                onChange={e => setDraft({ ...draft, role: [e.target.value] })}
                placeholder="Product Designer"
              />
            </FieldRow>
            <FieldRow label="Headline">
              <input
                className={inputClass}
                value={draft.headline ?? ""}
                onChange={e => setDraft({ ...draft, headline: e.target.value })}
                placeholder="Full stack developer"
              />
            </FieldRow>
            <FieldRow label="Phone">
              <input
                className={inputClass}
                value={draft.phone_number ?? ""}
                onChange={e => setDraft({ ...draft, phone_number: e.target.value })}
                placeholder="+91 8888888888"
              />
            </FieldRow>
            <FieldRow label="LinkedIn URL">
              <input
                className={inputClass}
                type="url"
                value={draft.linkedin_url ?? ""}
                onChange={e => setDraft({ ...draft, linkedin_url: e.target.value })}
                placeholder="https://linkedin.com/in/you"
              />
            </FieldRow>
            <FieldRow label="Portfolio URL">
              <input
                className={inputClass}
                type="url"
                value={draft.portfolio_url ?? ""}
                onChange={e => setDraft({ ...draft, portfolio_url: e.target.value })}
                placeholder="https://your-site.com"
              />
            </FieldRow>
            <FieldRow label="GitHub URL">
              <input
                className={inputClass}
                type="url"
                value={draft.github_url ?? ""}
                onChange={e => setDraft({ ...draft, github_url: e.target.value })}
                placeholder="https://github.com/username"
              />
            </FieldRow>
            <div className="sm:col-span-2 flex flex-wrap items-center justify-end gap-2 pt-2">
              {saveError ? <p className="mr-auto text-xs text-red-600 dark:text-red-400">{saveError}</p> : null}
              {dirty ? (
                <>
                  <button type="button" className={btnGhost} onClick={() => setDraft(profile)}>
                    Cancel
                  </button>
                  <button type="button" className={btnPrimaryBrand} disabled={updateProfile.isPending} onClick={() => void handleSave()}>
                    {updateProfile.isPending ? "Saving…" : "Save changes"}
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <ProfilePictureDialog
        open={pictureOpen}
        onClose={() => setPictureOpen(false)}
        currentUrl={avatarUrl}
        croppableUrl={profile.profilePictureUrl}
        pictureSources={profile.profilePictureSources}
      />
    </>
  );
}
