import { MadStoryDetailPage } from "@/components/landing/MadStoryDetailPage";
import { findMadStoryBySlug, MAD_STORY_SLUGS } from "@/components/landing/madStories";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return MAD_STORY_SLUGS.map(slug => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const story = findMadStoryBySlug(slug);
  if (!story) {
    return { title: "Story not found" };
  }

  return {
    title: `${story.name} — MAD Story`,
    description: story.quote,
    alternates: { canonical: `/mad-stories/${slug}` },
    openGraph: {
      title: `${story.name} — MAD Story | Unimad`,
      description: story.quote,
      url: `https://unimad.ai/mad-stories/${slug}`,
    },
  };
}

export default async function MadStorySlugPage({ params }: PageProps) {
  const { slug } = await params;
  const story = findMadStoryBySlug(slug);
  if (!story) {
    notFound();
  }

  return <MadStoryDetailPage story={story} />;
}
