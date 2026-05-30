"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchUnicoachStudentModuleData,
  generateUnicoachNiche,
  updateUnicoachModuleData,
  type UnicoachModuleData,
} from "../server-actions/unicoach-actions";

export const unicoachModuleQk = (userId: string | null) => ["unicoach", "module-data", userId ?? "self"] as const;

export function useUnicoachModuleData(enabled: boolean, userId?: string | null) {
  const tid = userId != null && String(userId).length > 0 ? String(userId) : null;
  return useQuery({
    queryKey: unicoachModuleQk(tid),
    queryFn: () => fetchUnicoachStudentModuleData(tid),
    enabled,
    staleTime: 30_000,
  });
}

export function useUpdateUnicoachModuleMutation(userId?: string | null) {
  const qc = useQueryClient();
  const tid = userId != null && String(userId).length > 0 ? String(userId) : null;
  return useMutation({
    mutationFn: (payload: { mode: "education" | "experiences" | "question_answers"; data: unknown }) =>
      updateUnicoachModuleData({ ...payload, userId: tid ?? undefined }),
    onSuccess: (data: UnicoachModuleData) => {
      qc.setQueryData(unicoachModuleQk(tid), data);
    },
  });
}

export function useGenerateNicheMutation(userId?: string | null) {
  const qc = useQueryClient();
  const tid = userId != null && String(userId).length > 0 ? String(userId) : null;
  return useMutation({
    mutationFn: () => generateUnicoachNiche(tid ?? undefined),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: unicoachModuleQk(tid) });
    },
  });
}
