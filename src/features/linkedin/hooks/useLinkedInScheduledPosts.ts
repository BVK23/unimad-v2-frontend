import type { LinkedInListItem } from "@/components/studio/LinkedInPostListCard";
import { mapContentGenToModalPost } from "@/features/content-lab/api/mapContentGenToModalPost";
import { fetchContentGenAssets } from "@/features/content-lab/server-actions/content-lab-actions";
import { useQuery } from "@tanstack/react-query";

export const linkedinScheduledPostsQueryKey = ["linkedin-scheduled-posts"] as const;

function toLinkedInListItem(post: ReturnType<typeof mapContentGenToModalPost>): LinkedInListItem {
  return {
    id: post.id,
    content: post.content,
    date: post.date,
  };
}

export const useLinkedInScheduledPosts = (enabled = true) => {
  return useQuery({
    queryKey: linkedinScheduledPostsQueryKey,
    queryFn: async (): Promise<LinkedInListItem[]> => {
      const assets = await fetchContentGenAssets();
      return assets
        .filter(a => a.status === "Scheduled")
        .map(mapContentGenToModalPost)
        .map(toLinkedInListItem);
    },
    staleTime: 1000 * 60 * 2,
    enabled,
  });
};
