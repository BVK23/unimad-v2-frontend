"use client";

import { type CSSProperties, type SyntheticEvent, useCallback, useState } from "react";
import { MadStoryContent } from "@/components/landing/MadStoryContent";
import { MarketingShell } from "@/components/landing/MarketingShell";
import { madStoryImageUrl, type MadStory } from "@/components/landing/madStories";
import { useLandingBodyClass } from "@/components/landing/useLandingEffects";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

type PhotoLayout = "portrait" | "landscape" | "square";

function getPhotoLayout(width: number, height: number): PhotoLayout {
  const ratio = width / height;
  if (ratio > 1.15) return "landscape";
  if (ratio < 0.85) return "portrait";
  return "square";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map(part => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function StoryHeroPhoto({
  name,
  image,
  expanded,
  onToggle,
  onLayoutKnown,
}: {
  name: string;
  image: string;
  expanded: boolean;
  onToggle: () => void;
  onLayoutKnown: (layout: PhotoLayout, aspectRatio: string) => void;
}) {
  const [failed, setFailed] = useState(false);

  const handleLoad = useCallback(
    (event: SyntheticEvent<HTMLImageElement>) => {
      const img = event.currentTarget;
      if (!img.naturalWidth || !img.naturalHeight) return;
      onLayoutKnown(getPhotoLayout(img.naturalWidth, img.naturalHeight), `${img.naturalWidth} / ${img.naturalHeight}`);
    },
    [onLayoutKnown]
  );

  return (
    <button
      type="button"
      className={`ms-detail__photo-wrap${expanded ? " is-expanded" : ""}`}
      onClick={onToggle}
      aria-expanded={expanded}
      aria-label={expanded ? `Collapse ${name}'s photo` : `Expand ${name}'s photo`}
    >
      <div className={`ms-detail__photo${failed ? " ms-detail__photo--fallback" : ""}`}>
        {failed ? (
          <span>{getInitials(name)}</span>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={madStoryImageUrl(image)} alt={name} decoding="async" onLoad={handleLoad} onError={() => setFailed(true)} />
        )}
      </div>
    </button>
  );
}

export function MadStoryDetailPage({ story }: { story: MadStory }) {
  useLandingBodyClass();
  const [photoExpanded, setPhotoExpanded] = useState(false);
  const [photoLayout, setPhotoLayout] = useState<PhotoLayout>("square");
  const [aspectRatio, setAspectRatio] = useState("1 / 1");

  const handleLayoutKnown = useCallback((layout: PhotoLayout, ratio: string) => {
    setPhotoLayout(layout);
    setAspectRatio(ratio);
  }, []);

  const articleClassName = ["ms-detail__article", photoExpanded ? "is-photo-expanded" : "", photoExpanded ? `is-photo-${photoLayout}` : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <MarketingShell active="/mad-stories">
      <div className={`ms-detail${photoExpanded ? " ms-detail--expanded" : ""}`}>
        <div className="ms-detail__top">
          <Link href="/mad-stories" className="ms-detail__back">
            <ArrowLeft size={16} />
            All stories
          </Link>
        </div>

        <article className={articleClassName} style={{ "--photo-ar": aspectRatio } as CSSProperties}>
          <StoryHeroPhoto
            name={story.name}
            image={story.image}
            expanded={photoExpanded}
            onToggle={() => setPhotoExpanded(current => !current)}
            onLayoutKnown={handleLayoutKnown}
          />

          <header className="ms-detail__intro">
            {!photoExpanded ? <span className="ms-detail__eyebrow">MAD story</span> : null}
            <h1 className="ms-detail__name">{story.name}</h1>
            {!photoExpanded ? <p className="ms-detail__quote">&ldquo;{story.quote}&rdquo;</p> : null}
          </header>

          <div className="ms-detail__body">
            <MadStoryContent blocks={story.story} />
          </div>
        </article>
      </div>
    </MarketingShell>
  );
}
