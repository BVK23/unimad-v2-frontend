"use client";

import React from "react";
import ProfilePictureWithFallback from "@/components/user-profile/ProfilePictureWithFallback";
import type { LinkedInPostAuthorDisplay } from "@/features/user-profile/utils/resolve-linkedin-post-author";
import { Globe } from "lucide-react";

type LinkedInPostAuthorHeaderProps = {
  author: LinkedInPostAuthorDisplay;
  avatarClassName?: string;
  timestamp?: string;
};

const LinkedInPostAuthorHeader: React.FC<LinkedInPostAuthorHeaderProps> = ({
  author,
  avatarClassName = "h-12 w-12 text-lg",
  timestamp = "1h",
}) => (
  <div className="flex gap-3">
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-500 font-medium text-white ${avatarClassName}`}
    >
      <ProfilePictureWithFallback urls={author.pictureUrls} initials={author.initials} alt={author.name} />
    </div>
    <div>
      <h3 className="cursor-pointer text-sm font-semibold leading-tight text-slate-900 hover:text-brand-600 hover:underline dark:text-white">
        {author.name}
      </h3>
      <p className="mt-0.5 text-xs leading-tight text-slate-500">{author.headline}</p>
      <div className="mt-1 flex items-center gap-1 text-xs text-slate-400">
        <span>{timestamp}</span> • <Globe size={10} />
      </div>
    </div>
  </div>
);

export default LinkedInPostAuthorHeader;
