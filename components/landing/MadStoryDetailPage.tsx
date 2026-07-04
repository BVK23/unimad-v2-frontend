"use client";

import { useState } from "react";
import { MadStoryContent } from "@/components/landing/MadStoryContent";
import { MarketingShell } from "@/components/landing/MarketingShell";
import { madStoryImageUrl, type MadStory } from "@/components/landing/madStories";
import { useLandingBodyClass } from "@/components/landing/useLandingEffects";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

function getInitials(name: string) {
  return name
    .split(" ")
    .map(part => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function StoryHeroPhoto({ name, image }: { name: string; image: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="ms-detail__photo ms-detail__photo--fallback" aria-hidden>
        <span>{getInitials(name)}</span>
      </div>
    );
  }

  return (
    <div className="ms-detail__photo">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={madStoryImageUrl(image)} alt={name} decoding="async" onError={() => setFailed(true)} />
    </div>
  );
}

export function MadStoryDetailPage({ story }: { story: MadStory }) {
  useLandingBodyClass();

  return (
    <MarketingShell active="/mad-stories">
      <div className="ms-detail">
        <div className="ms-detail__top">
          <Link href="/mad-stories" className="ms-detail__back">
            <ArrowLeft size={16} />
            All stories
          </Link>
        </div>

        <header className="ms-detail__header">
          <StoryHeroPhoto name={story.name} image={story.image} />
          <div className="ms-detail__intro">
            <span className="ms-detail__eyebrow">MAD story</span>
            <h1 className="ms-detail__name">{story.name}</h1>
            <p className="ms-detail__quote">&ldquo;{story.quote}&rdquo;</p>
          </div>
        </header>

        <div className="ms-detail__body">
          <MadStoryContent blocks={story.story} />
        </div>
      </div>
    </MarketingShell>
  );
}
