"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const BASE_TABS = [
  { href: "/uniboard/user/profile", label: "Profile settings" },
  { href: "/uniboard/user/subscription", label: "Subscription" },
] as const;

const TEAM_TAB = { href: "/uniboard/team", label: "Team dashboard" } as const;

export function UserSettingsLayout({ children, isTeamMember = false }: { children: React.ReactNode; isTeamMember?: boolean }) {
  const TABS = isTeamMember ? [...BASE_TABS, TEAM_TAB] : BASE_TABS;
  const pathname = usePathname();

  return (
    <div className="flex-1 bg-slate-50 dark:bg-[#0a0a0a] h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto p-6 lg:p-8 space-y-6">
        <section className="bg-white dark:bg-[#111] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 lg:p-6 shadow-sm">
          <p className="text-[11px] uppercase tracking-wide text-brand-600 dark:text-brand-400 font-medium">Account</p>
          <h1 className="text-2xl lg:text-3xl text-slate-900 dark:text-white font-medium mt-1">Settings</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage your profile, connected accounts, and subscription.</p>
        </section>

        <div className="flex flex-col md:flex-row gap-6">
          <nav className="flex md:flex-col gap-2 md:w-52 shrink-0 overflow-x-auto no-scrollbar">
            {TABS.map(tab => {
              const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`whitespace-nowrap rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? "border-brand-500/40 bg-brand-50 text-brand-700 dark:border-brand-500/30 dark:bg-brand-950/30 dark:text-brand-300"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-[#111] dark:text-slate-300 dark:hover:bg-slate-900/50"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </div>
    </div>
  );
}
