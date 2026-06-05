"use client";

import { useState } from "react";
import { LayoutDashboard } from "lucide-react";
import Link from "next/link";
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

export function ProfileSettingsPage({ showTeamLink = false }: { showTeamLink?: boolean }) {
  const [tab, setTab] = useState<ProfileTabId>("edit");

  return (
    <div className="space-y-4">
      {showTeamLink ? (
        <Link
          href="/uniboard/team"
          className="flex items-center gap-3 rounded-2xl border border-brand-500/30 bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700 transition hover:bg-brand-100 dark:border-brand-500/20 dark:bg-brand-950/30 dark:text-brand-300 dark:hover:bg-brand-950/50"
        >
          <LayoutDashboard size={18} />
          Open team dashboard — sales, coupons, and claim resolution
        </Link>
      ) : null}
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
