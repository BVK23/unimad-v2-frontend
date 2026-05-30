"use client";

import type { ProfileData } from "@/features/user-profile/types";
import { resolveProfilePictureFromProfile } from "@/features/user-profile/utils/resolve-profile-picture";
import { Camera } from "lucide-react";

type UserProfileAvatarProps = {
  profile: ProfileData | null | undefined;
  size?: number;
  onClick?: () => void;
  showHover?: boolean;
};

export function UserProfileAvatar({ profile, size = 128, onClick, showHover = false }: UserProfileAvatarProps) {
  const url = resolveProfilePictureFromProfile(profile);
  const initial = (profile?.name || profile?.email || "?").charAt(0).toUpperCase();
  const className = `relative shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800 ${
    onClick ? "cursor-pointer" : ""
  }`;

  const inner = url ? (
    // eslint-disable-next-line @next/next/no-img-element -- OAuth/CDN URLs; avoids Next Image fill issues
    <img src={url} alt="" width={size} height={size} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
  ) : (
    <div className="flex h-full w-full items-center justify-center font-semibold text-slate-400" style={{ fontSize: size * 0.35 }}>
      {initial}
    </div>
  );

  const body = (
    <>
      {inner}
      {showHover && onClick ? (
        <span className="absolute inset-0 flex items-center justify-center bg-slate-900/40 opacity-0 transition group-hover:opacity-100">
          <Camera size={Math.max(18, size * 0.17)} className="text-white" />
        </span>
      ) : null}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`group ${className}`}
        style={{ width: size, height: size }}
        aria-label="Change profile photo"
      >
        {body}
      </button>
    );
  }

  return (
    <div className={className} style={{ width: size, height: size }}>
      {inner}
    </div>
  );
}
