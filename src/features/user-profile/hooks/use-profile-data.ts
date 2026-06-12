"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  clearProfileKnowledgeData,
  fetchProfileData,
  fetchProfileMedia,
  fetchSubscriptionData,
  updateProfileData,
  uploadProfileMedia,
} from "../server-actions/profile-actions";
import type { ProfileData } from "../types";

export const profileQk = {
  profile: ["user", "profile"] as const,
  media: (category: string) => ["user", "profile-media", category] as const,
  subscription: ["user", "subscription"] as const,
};

export const useProfileData = () =>
  useQuery({
    queryKey: profileQk.profile,
    queryFn: () => fetchProfileData(),
    staleTime: 30_000,
  });

export const useProfileMedia = (category: string, enabled: boolean) =>
  useQuery({
    queryKey: profileQk.media(category),
    queryFn: () => fetchProfileMedia(category),
    enabled,
    staleTime: 60_000,
  });

export const useUpdateProfileMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<ProfileData>) => updateProfileData(payload),
    onSuccess: async (_data, variables) => {
      qc.setQueryData<ProfileData>(profileQk.profile, prev => (prev ? { ...prev, ...variables } : (variables as ProfileData)));
      try {
        await qc.refetchQueries({ queryKey: profileQk.profile });
      } catch {
        // Optimistic cache update already applied; refetch failure should not fail the save.
      }
      if ("profilePictureUrl" in variables) {
        void qc.invalidateQueries({ queryKey: profileQk.media("profile-picture") });
      }
    },
  });
};

export const useUploadProfileMediaMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => uploadProfileMedia(formData),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: profileQk.media("profile-picture") });
      void qc.invalidateQueries({ queryKey: profileQk.profile });
    },
  });
};

export const useClearProfileKnowledgeMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (target: string) => clearProfileKnowledgeData(target),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: profileQk.profile });
    },
  });
};

export const useSubscriptionData = () =>
  useQuery({
    queryKey: profileQk.subscription,
    queryFn: () => fetchSubscriptionData(),
    staleTime: 30_000,
  });
