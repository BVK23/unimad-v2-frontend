"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { applyOptimisticChecklistTaskUpdate } from "../mappers/journey-mapper";
import {
  addUnicoachComment,
  deleteUnicoachComment,
  fetchUnicoachComments,
  fetchUnicoachJourneyState,
  fetchUnicoachProfileInfo,
  fetchUnicoachStudentsByStage,
  markUnicoachMessagesRead,
  postJourneyAdvance,
  postJourneyChecklist,
  postUnicoachInit,
  updateUnicoachStudentCalls,
} from "../server-actions/unicoach-actions";
import type { JourneyChecklist, JourneyState, UnicoachInitResponse, UnicoachProfileInfo } from "../types";
import { parseCoachData } from "../types";

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
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
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
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });
};

export const useUnicoachStudentsByStage = (enabled: boolean) =>
  useQuery({
    queryKey: qk.studentsByStage,
    queryFn: () => fetchUnicoachStudentsByStage(),
    enabled,
    staleTime: 15_000,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
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
      void qc.invalidateQueries({ queryKey: qk.init });
    },
  });
};

export const useJourneyChecklistMutation = (targetUserId?: string | null) => {
  const qc = useQueryClient();
  const tid = normalizeTargetId(targetUserId);
  const journeyKey = qk.journey(tid);

  return useMutation({
    mutationFn: (payload: { stage_id: string; task_id: string; completed: boolean }) =>
      postJourneyChecklist({
        ...payload,
        user_id: tid ?? undefined,
      }),
    onMutate: async payload => {
      await qc.cancelQueries({ queryKey: journeyKey });
      const previousJourney = qc.getQueryData<JourneyState>(journeyKey);

      if (previousJourney) {
        const nextChecklist = applyOptimisticChecklistTaskUpdate(
          previousJourney.journey_checklist,
          payload.stage_id,
          payload.task_id,
          payload.completed
        );
        qc.setQueryData<JourneyState>(journeyKey, {
          ...previousJourney,
          journey_checklist: nextChecklist,
        });
      }

      return { previousJourney };
    },
    onError: (_err, _payload, context) => {
      if (context?.previousJourney) {
        qc.setQueryData(journeyKey, context.previousJourney);
      }
    },
    onSuccess: data => {
      qc.setQueryData<JourneyState>(journeyKey, old => {
        if (!old) return old;
        return {
          ...old,
          journey_checklist: data.journey_checklist as JourneyChecklist,
          ux_stage: data.ux_stage,
        };
      });
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

export const useDeleteCoachMessageMutation = (sectionName: string | null | undefined, targetUserId?: string | null) => {
  const qc = useQueryClient();
  const tid = normalizeTargetId(targetUserId);
  return useMutation({
    mutationFn: (commentId: number) =>
      deleteUnicoachComment({
        sectionName: sectionName as string,
        commentId,
        userId: tid ?? undefined,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.comments(tid, sectionName) });
    },
  });
};

export const useMarkCoachMessagesReadMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { sectionName: string; userId?: string | null }) =>
      markUnicoachMessagesRead({
        sectionName: payload.sectionName,
        userId: payload.userId ?? undefined,
      }),
    onMutate: async variables => {
      await qc.cancelQueries({ queryKey: qk.init });
      const previousInit = qc.getQueryData<UnicoachInitResponse>(qk.init);
      const targetUserId = variables.userId ? Number(variables.userId) : null;

      qc.setQueryData<UnicoachInitResponse>(qk.init, old => {
        if (!old) return old;

        if (old.coach_data && targetUserId) {
          const coach = parseCoachData(old);
          if (!coach) return old;
          return {
            ...old,
            coach_data: {
              ...coach,
              assigned_users: coach.assigned_users.map(user =>
                user.id === targetUserId
                  ? {
                      ...user,
                      unread_counts: user.unread_counts ? Object.fromEntries(Object.keys(user.unread_counts).map(k => [k, 0])) : {},
                      has_unread: false,
                    }
                  : user
              ),
            },
          };
        }

        if (old.user_unread_counts) {
          return {
            ...old,
            user_unread_counts: Object.fromEntries(Object.keys(old.user_unread_counts).map(k => [k, 0])),
          };
        }

        return old;
      });

      return { previousInit };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousInit) {
        qc.setQueryData(qk.init, context.previousInit);
      }
    },
    onSuccess: (_data, variables) => {
      const tid = normalizeTargetId(variables.userId);
      void qc.invalidateQueries({ queryKey: qk.init });
      void qc.invalidateQueries({ queryKey: qk.studentsByStage });
      void qc.invalidateQueries({ queryKey: qk.comments(tid, variables.sectionName) });
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
