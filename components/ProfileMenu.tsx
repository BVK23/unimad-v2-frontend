"use client";

import React, { useState, useRef, useEffect } from "react";
import { resolveProfilePictureFromProfile } from "@/features/user-profile/utils/resolve-profile-picture";
import { Settings, CreditCard, LogOut, Sun, Moon, ChevronDown, LayoutDashboard } from "lucide-react";
import Link from "next/link";

type UserData = {
  name?: string;
  profilePictureUrl?: string;
  email?: string;
  firstName?: string;
  is_team_member?: boolean;
  profilePictureSources?: {
    unimad?: string | null;
    google?: string | null;
    linkedin?: string | null;
  };
};

interface ProfileMenuProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
  userData?: UserData | null;
}

const ProfileMenu: React.FC<ProfileMenuProps> = ({ isDarkMode, toggleTheme, userData }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close clicks outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const completionPercentage = 70;

  const displayName = userData?.name || userData?.firstName || "User";
  const displayEmail = userData?.email || "user@example.com";
  const avatarUrl =
    resolveProfilePictureFromProfile({
      profilePictureUrl: userData?.profilePictureUrl,
      profilePictureSources: userData?.profilePictureSources,
    }) ?? null;

  return (
    <div className="relative" ref={menuRef}>
      {/* Avatar Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-white/5 p-1 pr-3 rounded-full transition-colors group"
      >
        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden ring-2 ring-white dark:ring-slate-800 shadow-sm relative">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-xs font-medium text-slate-500">
              {displayName.charAt(0)}
            </span>
          )}
        </div>
        <ChevronDown
          size={14}
          className={`text-slate-400 dark:text-slate-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-white/5 overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center font-medium text-lg overflow-hidden relative">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <span>{displayName?.charAt(0) ?? "U"}</span>
                )}
              </div>
              <div className="overflow-hidden">
                <h3 className="font-medium text-slate-900 dark:text-white truncate">{displayName}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{displayEmail}</p>
              </div>
            </div>

            {/* Completion Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-slate-600 dark:text-slate-300">Profile Completion</span>
                <span className="font-medium text-brand-600 dark:text-brand-400">{completionPercentage}%</span>
              </div>
              <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-brand-500 rounded-full" style={{ width: `${completionPercentage}%` }}></div>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="p-2 space-y-1">
            <Link
              href="/uniboard/user/profile"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors"
            >
              <Settings size={18} className="text-slate-400" />
              Profile Settings
            </Link>
            {userData?.is_team_member ? (
              <Link
                href="/uniboard/team"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors"
              >
                <LayoutDashboard size={18} className="text-slate-400" />
                Team dashboard
              </Link>
            ) : null}
            <Link
              href="/uniboard/user/subscription"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors"
            >
              <CreditCard size={18} className="text-slate-400" />
              Subscription
            </Link>

            <button
              onClick={toggleTheme}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors"
            >
              <div className="flex items-center gap-3">
                {isDarkMode ? <Sun size={18} className="text-slate-400" /> : <Moon size={18} className="text-slate-400" />}
                <span>{isDarkMode ? "Light Mode" : "Dark Mode"}</span>
              </div>
              {/* Toggle Switch Visual */}
              <div className={`w-10 h-5 rounded-full relative transition-colors ${isDarkMode ? "bg-brand-500" : "bg-slate-200"}`}>
                <div
                  className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all shadow-sm ${isDarkMode ? "left-6" : "left-1"}`}
                ></div>
              </div>
            </button>
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-slate-100 dark:border-white/5">
            <a
              href="/api/logout"
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-medium text-red-600 dark:text-red-400 transition-colors"
            >
              <LogOut size={18} />
              Logout
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileMenu;
