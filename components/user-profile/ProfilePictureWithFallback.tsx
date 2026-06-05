"use client";

import React, { useMemo, useState } from "react";
import { resolveMediaDisplayUrl } from "@/utils/resolve-media-url";

type ProfilePictureWithFallbackProps = {
  urls: string[];
  initials: string;
  alt?: string;
  className?: string;
};

const ProfilePictureImage: React.FC<{
  urls: string[];
  initials: string;
  alt: string;
  className: string;
}> = ({ urls, initials, alt, className }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const currentUrl = urls[activeIndex];

  if (!currentUrl || activeIndex >= urls.length) {
    return <span>{initials}</span>;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={currentUrl}
      src={currentUrl}
      alt={alt}
      className={className}
      referrerPolicy="no-referrer"
      onError={() => setActiveIndex(index => index + 1)}
    />
  );
};

const ProfilePictureWithFallback: React.FC<ProfilePictureWithFallbackProps> = ({
  urls,
  initials,
  alt = "",
  className = "h-full w-full object-cover",
}) => {
  const resolvedUrls = useMemo(
    () =>
      urls
        .map(url => resolveMediaDisplayUrl(url))
        .filter(Boolean)
        .filter((url, index, list) => list.indexOf(url) === index),
    [urls]
  );

  return <ProfilePictureImage key={resolvedUrls.join("\0")} urls={resolvedUrls} initials={initials} alt={alt} className={className} />;
};

export default ProfilePictureWithFallback;
