"use client";

import { useState } from "react";
import { DeleteAccountPanel } from "./DeleteAccountPanel";
import { LinkedInStoredDataPanel } from "./LinkedInStoredDataPanel";
import { ResumeProfileDataPanel } from "./ResumeProfileDataPanel";
import { UserProfileSettingsPanel } from "./UserProfileSettingsPanel";

const PROFILE_TABS = [
  { id: "edit", label: "Edit profile" },
  { id: "resume-data", label: "Resume profile data" },
  { id: "linkedin", label: "LinkedIn data" },
  { id: "account", label: "Delete account" },
] as const;

type ProfileTabId = (typeof PROFILE_TABS)[number]["id"];

export function ProfileSettingsPage() {
  const [tab, setTab] = useState<ProfileTabId>("edit");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3 dark:border-slate-800">
        {PROFILE_TABS.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              tab === t.id
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "edit" ? <UserProfileSettingsPanel /> : null}
      {tab === "resume-data" ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#111]">
          <ResumeProfileDataPanel />
        </section>
      ) : null}
      {tab === "linkedin" ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#111]">
          <LinkedInStoredDataPanel />
        </section>
      ) : null}
      {tab === "account" ? <DeleteAccountPanel /> : null}
    </div>
  );
}
