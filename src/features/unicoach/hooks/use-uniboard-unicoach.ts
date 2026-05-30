"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addUnicoachComment,
  fetchUnicoachComments,
  fetchUnicoachJourneyState,
  fetchUnicoachProfileInfo,
  fetchUnicoachStudentsByStage,
  manageUnicoachTodos,
  markUnicoachMessagesRead,
  postJourneyAdvance,
  postJourneyChecklist,
  postUnicoachInit,
  updateUnicoachStudentCalls,
} from "../server-actions/unicoach-actions";
import type { JourneyState, UnicoachProfileInfo } from "../types";

export const qk = {
  init: ["unicoach", "init"] as const,
  journey: (targetUserId: string | null) => ["unicoach", "journey-state", targetUserId ?? "self"] as const,
  profile: (targetUserId: string | null) => ["unicoach", "profile-info", targetUserId ?? "self"] as const,
  comments: (targetUserId: string | null, section: string | null | undefined) =>
    ["unicoach", "comments", targetUserId ?? "self", section ?? ""] as const,
  studentsByStage: ["unicoach", "students-by-stage"] as const,
};

const normalizeTargetId = (targetUserId?: string | null) =>
  targetUserId != null && String(targetUserId).length > 0 ? String(targetUserId) : null;

export const useUnicoachInit = () =>
  useQuery({
    queryKey: qk.init,
    queryFn: () => postUnicoachInit(),
    staleTime: 60_000,
  });

export const useUnicoachJourneyState = (enabled: boolean, targetUserId?: string | null) => {
  const tid = normalizeTargetId(targetUserId);
  return useQuery({
    queryKey: qk.journey(tid),
    queryFn: () => fetchUnicoachJourneyState(tid ?? undefined),
    enabled,
    staleTime: 15_000,
  });
};

export const useUnicoachProfileInfo = (enabled: boolean, targetUserId?: string | null) => {
  const tid = normalizeTargetId(targetUserId);
  return useQuery({
    queryKey: qk.profile(tid),
    queryFn: () => fetchUnicoachProfileInfo(tid),
    enabled,
    staleTime: 120_000,
  });
};

export const useUnicoachComments = (sectionName: string | null | undefined, enabled: boolean, targetUserId?: string | null) => {
  const tid = normalizeTargetId(targetUserId);
  return useQuery({
    queryKey: qk.comments(tid, sectionName),
    queryFn: () =>
      fetchUnicoachComments({
        sectionName: sectionName as string,
        page: 1,
        pageSize: 100,
        userId: tid ?? undefined,
      }),
    enabled: Boolean(enabled && sectionName),
    staleTime: 10_000,
  });
};

export const useUnicoachStudentsByStage = (enabled: boolean) =>
  useQuery({
    queryKey: qk.studentsByStage,
    queryFn: () => fetchUnicoachStudentsByStage(),
    enabled,
    staleTime: 15_000,
  });

export const useUpdateUnicoachStudentCallsMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateUnicoachStudentCalls,
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({ queryKey: qk.studentsByStage });
      void qc.invalidateQueries({
        queryKey: qk.journey(normalizeTargetId(String(variables.userId))),
      });
    },
  });
};

export const useJourneyChecklistMutation = (targetUserId?: string | null) => {
  const qc = useQueryClient();
  const tid = normalizeTargetId(targetUserId);
  return useMutation({
    mutationFn: (payload: { stage_id: string; task_id: string; completed: boolean }) =>
      postJourneyChecklist({
        ...payload,
        user_id: tid ?? undefined,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.journey(tid) });
    },
  });
};

export const useJourneyAdvanceMutation = (targetUserId?: string | null) => {
  const qc = useQueryClient();
  const tid = normalizeTargetId(targetUserId);
  return useMutation({
    mutationFn: (payload: { action: string }) =>
      postJourneyAdvance({
        action: payload.action,
        user_id: tid ?? undefined,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.journey(tid) });
      void qc.invalidateQueries({ queryKey: qk.profile(tid) });
    },
  });
};

export const useSendCoachMessageMutation = (sectionName: string | null | undefined, targetUserId?: string | null) => {
  const qc = useQueryClient();
  const tid = normalizeTargetId(targetUserId);
  return useMutation({
    mutationFn: (message: string) =>
      addUnicoachComment({
        sectionName: sectionName as string,
        message,
        userId: tid ?? undefined,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.comments(tid, sectionName) });
    },
  });
};

export const useManageTodosMutation = (targetUserId?: string | null) => {
  const qc = useQueryClient();
  const tid = normalizeTargetId(targetUserId);
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => manageUnicoachTodos(payload, { targetUserId: tid ?? undefined }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.profile(tid) });
    },
  });
};

export const markCoachSectionRead = async (sectionName: string, userId?: string | null) => {
  await markUnicoachMessagesRead({ sectionName, userId: userId ?? undefined });
};

export const prefetchJourneyAfterSubscribe = (qc: ReturnType<typeof useQueryClient>) => {
  void qc.invalidateQueries({ queryKey: ["unicoach", "init"] });
  void qc.invalidateQueries({ queryKey: ["unicoach", "journey-state"] });
  void qc.invalidateQueries({ queryKey: ["unicoach", "profile-info"] });
};

export type { JourneyState, UnicoachProfileInfo };
