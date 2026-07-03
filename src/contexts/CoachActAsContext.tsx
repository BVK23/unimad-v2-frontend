"use client";

import { createContext, useContext } from "react";
import type { CoachActAsSession } from "@/constants/coach-act-as";

const CoachActAsContext = createContext<CoachActAsSession | null>(null);

export function CoachActAsProvider({ session, children }: { session: CoachActAsSession | null; children: React.ReactNode }) {
  return <CoachActAsContext.Provider value={session}>{children}</CoachActAsContext.Provider>;
}

export function useCoachActAsSession(): CoachActAsSession | null {
  return useContext(CoachActAsContext);
}

/** Scope React Query keys to the active coach act-as student (if any). */
export function coachActAsQueryScope(session: CoachActAsSession | null): readonly string[] {
  return session ? (["coach-act-as", session.studentProfileId] as const) : (["self"] as const);
}

export function withCoachActAsScope<T extends readonly unknown[]>(base: T, session: CoachActAsSession | null) {
  return [...base, ...coachActAsQueryScope(session)] as const;
}
