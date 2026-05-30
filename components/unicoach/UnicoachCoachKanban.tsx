"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  coachColumnId,
  USER_ONLY_COACH_COLUMNS,
  UNICOACH_COACH_STAGE_LABELS,
  UNICOACH_COACH_STAGE_ORDER,
  type UnicoachCoachStageKey,
} from "@/constants/unicoach-coach-stages";
import { useUnicoachStudentsByStage, useUpdateUnicoachStudentCallsMutation } from "@/features/unicoach/hooks/use-uniboard-unicoach";
import type { AssignedStudent, UnicoachInitResponse, UnicoachStudentsByStage } from "@/features/unicoach/types";
import { resolveProfilePicture } from "@/features/unicoach/utils/profile-picture";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { DndContext, DragOverlay, PointerSensor, rectIntersection, useDraggable, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
import { Search } from "lucide-react";
import { UnicoachCoachConfirmDialog } from "./UnicoachCoachConfirmDialog";

function studentProfilePicture(user: AssignedStudent): string | null {
  return resolveProfilePicture({
    direct: user.profile_picture,
    unimad: user.unimad_profile_picture,
    linkedin: user.linkedin_profile_picture,
    google: user.google_profile_picture,
  });
}

const COLUMN_IDS = UNICOACH_COACH_STAGE_ORDER.map(s => coachColumnId(s));

function getStageIndex(stageKey: string): number {
  const i = UNICOACH_COACH_STAGE_ORDER.indexOf(stageKey as UnicoachCoachStageKey);
  return i >= 0 ? i : 0;
}

function DroppableColumnWithRef({ id, children, droppable }: { id: string; children: React.ReactNode; droppable?: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id, disabled: droppable === false });
  return (
    <div ref={setNodeRef} className={`h-full flex flex-col min-h-0 ${isOver ? "bg-slate-100/80 dark:bg-slate-800/40 rounded-xl" : ""}`}>
      <div
        className={`flex-1 flex flex-col min-h-0 p-2 transition-colors ${isOver ? "ring-2 ring-dashed ring-slate-300 dark:ring-slate-600 rounded-lg" : ""}`}
      >
        {children}
      </div>
    </div>
  );
}

type StudentCardProps = {
  user: AssignedStudent;
  stageKey: UnicoachCoachStageKey;
  isCurrentUser: boolean;
  onOpenProfile: (user: AssignedStudent) => void;
};

const StudentCard: React.FC<StudentCardProps> = ({ user, stageKey, isCurrentUser, onOpenProfile }) => {
  const id = `student-${user.id}-${stageKey}`;
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id, disabled: false });
  const pointerDown = useRef<{ x: number; y: number } | null>(null);
  const {
    onPointerDown: dragOnPointerDown,
    onPointerUp: dragOnPointerUp,
    ...restListeners
  } = listeners as {
    onPointerDown?: (e: React.PointerEvent<Element>) => void;
    onPointerUp?: (e: React.PointerEvent<Element>) => void;
    [key: string]: unknown;
  };

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.85 : 1,
      }
    : undefined;

  const pic = studentProfilePicture(user);
  const unreadTotal = user.unread_counts ? Object.values(user.unread_counts).reduce((a, c) => a + c, 0) : 0;

  return (
    <div className="relative mb-2">
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...restListeners}
        onPointerDown={e => {
          pointerDown.current = { x: e.clientX, y: e.clientY };
          dragOnPointerDown?.(e);
        }}
        onPointerUp={e => {
          dragOnPointerUp?.(e);
          const d = pointerDown.current;
          pointerDown.current = null;
          if (!d) return;
          if (Math.hypot(e.clientX - d.x, e.clientY - d.y) <= 10) onOpenProfile(user);
        }}
        onKeyDown={e => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpenProfile(user);
          }
        }}
        tabIndex={0}
        role="button"
        aria-label={`Open ${user.name ?? "student"}'s journey`}
        className={`rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111] p-2 flex items-center gap-2 shadow-sm hover:shadow-md transition-shadow relative cursor-grab active:cursor-grabbing select-none touch-none outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
          isCurrentUser ? "ring-2 ring-brand-500" : ""
        } ${isDragging ? "z-50 shadow-lg" : ""}`}
      >
        {user.has_unread && unreadTotal > 0 ? (
          <div className="absolute -top-1 -right-1 min-w-[18px] h-4 px-1.5 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold border border-white dark:border-[#111]">
            {unreadTotal}
          </div>
        ) : null}
        <div className="relative h-8 w-8 rounded-full overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-slate-800">
          {pic ? (
            // eslint-disable-next-line @next/next/no-img-element -- external OAuth/CDN avatars
            <img src={pic} alt="" className="h-full w-full object-cover" width={32} height={32} referrerPolicy="no-referrer" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-xs font-medium text-slate-500">
              {(user.name || "?").charAt(0)}
            </div>
          )}
        </div>
        <span className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate flex-1 min-w-0">{user.name}</span>
      </div>
    </div>
  );
};

type PendingMove = {
  userId: number;
  from: UnicoachCoachStageKey;
  to: UnicoachCoachStageKey;
  title: string;
  description: string;
};

export type UnicoachCoachKanbanProps = {
  init: UnicoachInitResponse;
  sessionEmail: string | null | undefined;
  onOpenJourney: (user: AssignedStudent) => void;
};

export const UnicoachCoachKanban: React.FC<UnicoachCoachKanbanProps> = ({ init, sessionEmail, onOpenJourney }) => {
  const { data: stagesData, isLoading } = useUnicoachStudentsByStage(Boolean(init.coach_data));
  const updateCallsMutation = useUpdateUnicoachStudentCallsMutation();
  const [localStages, setLocalStages] = useState<UnicoachStudentsByStage | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeUser, setActiveUser] = useState<AssignedStudent | null>(null);
  const [activeStageKey, setActiveStageKey] = useState<UnicoachCoachStageKey | null>(null);
  const [nameFilter, setNameFilter] = useState("");
  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null);

  const stages = useMemo(() => localStages ?? stagesData ?? ({} as UnicoachStudentsByStage), [localStages, stagesData]);

  const findUser = useCallback(
    (userId: number): { user: AssignedStudent; stageKey: UnicoachCoachStageKey } | null => {
      for (const key of UNICOACH_COACH_STAGE_ORDER) {
        const list = stages[key] || [];
        const u = list.find(x => x.id === userId);
        if (u) return { user: u, stageKey: key };
      }
      return null;
    },
    [stages]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 7 },
    })
  );

  const pendingRunRef = useRef<(() => void) | null>(null);

  const requestMove = useCallback(
    (userId: number, toStageKey: UnicoachCoachStageKey, fromStageKey: UnicoachCoachStageKey) => {
      const fromIndex = getStageIndex(fromStageKey);
      const toIndex = getStageIndex(toStageKey);
      const found = findUser(userId);
      if (!found) return;

      const doMove = () => {
        setLocalStages(prev => {
          const base = prev ?? stagesData ?? {};
          const next: UnicoachStudentsByStage = {};
          for (const k of UNICOACH_COACH_STAGE_ORDER) {
            next[k] = [...(base[k] || [])];
          }
          for (const k of UNICOACH_COACH_STAGE_ORDER) {
            next[k] = next[k].filter(u => u.id !== userId);
          }
          next[toStageKey] = [...(next[toStageKey] || []), found.user];
          return next;
        });
        updateCallsMutation.mutate(
          { userId, targetStage: toStageKey },
          {
            onSettled: () => setLocalStages(null),
          }
        );
      };

      const isMoveBack = toIndex < fromIndex;
      const skipAhead = toIndex - fromIndex > 1;
      const targetLabel = UNICOACH_COACH_STAGE_LABELS[toStageKey];

      if (isMoveBack) {
        pendingRunRef.current = doMove;
        setPendingMove({
          userId,
          from: fromStageKey,
          to: toStageKey,
          title: "Move to previous stage?",
          description: "Are you sure you want to move this student to a previous stage?",
        });
        return;
      }
      if (skipAhead) {
        pendingRunRef.current = doMove;
        setPendingMove({
          userId,
          from: fromStageKey,
          to: toStageKey,
          title: "Skip ahead?",
          description: `Are you sure you want to move this student directly to ${targetLabel}?`,
        });
        return;
      }
      doMove();
    },
    [findUser, stagesData, updateCallsMutation]
  );

  const handleConfirmPending = useCallback(() => {
    const fn = pendingRunRef.current;
    pendingRunRef.current = null;
    setPendingMove(null);
    fn?.();
  }, []);

  const handleCancelPending = useCallback(() => {
    pendingRunRef.current = null;
    setPendingMove(null);
  }, []);

  const onDragStart = useCallback(
    (event: DragStartEvent) => {
      const id = String(event.active.id);
      if (!id.startsWith("student-")) return;
      const match = id.match(/^student-(\d+)-(.+)$/);
      if (!match) return;
      const [, userIdStr] = match;
      const found = findUser(Number(userIdStr));
      if (found) {
        setActiveId(id);
        setActiveUser(found.user);
        setActiveStageKey(found.stageKey);
      }
    },
    [findUser]
  );

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);
      setActiveUser(null);
      setActiveStageKey(null);
      if (!over) return;

      const activeIdStr = String(active.id);
      const match = activeIdStr.match(/^student-(\d+)-(.+)$/);
      if (!match) return;
      const [, userIdStr, fromStageKey] = match;
      const userIdNum = Number(userIdStr);

      let toStageKey: UnicoachCoachStageKey | null = null;
      const overId = String(over.id);
      if (COLUMN_IDS.includes(overId)) {
        toStageKey = overId.replace("column-", "") as UnicoachCoachStageKey;
      } else if (overId.startsWith("student-")) {
        const m = overId.match(/^student-(\d+)-(.+)$/);
        if (m) toStageKey = m[2] as UnicoachCoachStageKey;
      }
      if (!toStageKey || toStageKey === fromStageKey) return;
      if (USER_ONLY_COACH_COLUMNS.has(toStageKey)) return;
      requestMove(userIdNum, toStageKey, fromStageKey as UnicoachCoachStageKey);
    },
    [requestMove]
  );

  const onDragCancel = useCallback(() => {
    setActiveId(null);
    setActiveUser(null);
    setActiveStageKey(null);
  }, []);

  const filterLower = nameFilter.trim().toLowerCase();
  const filterUser = useCallback(
    (user: AssignedStudent) =>
      !filterLower || (user.name || "").toLowerCase().includes(filterLower) || (user.email || "").toLowerCase().includes(filterLower),
    [filterLower]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading board…</p>
      </div>
    );
  }

  return (
    <>
      <UnicoachCoachConfirmDialog
        open={Boolean(pendingMove)}
        title={pendingMove?.title ?? ""}
        description={pendingMove?.description ?? ""}
        confirmLabel="Yes, continue"
        cancelLabel="Cancel"
        onConfirm={handleConfirmPending}
        onCancel={handleCancelPending}
      />
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden w-full min-h-[50vh]">
        <div className="flex-shrink-0 mb-4 flex justify-center">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <input
              type="search"
              placeholder="Filter by name or email"
              value={nameFilter}
              onChange={e => setNameFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111] pl-10 pr-3 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              aria-label="Filter students"
            />
          </div>
        </div>
        <DndContext
          sensors={sensors}
          collisionDetection={rectIntersection}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDragCancel={onDragCancel}
        >
          <div className="flex gap-4 flex-1 min-h-0 overflow-x-auto overflow-y-hidden pb-2">
            {UNICOACH_COACH_STAGE_ORDER.map(stageKey => {
              const columnId = coachColumnId(stageKey);
              const allUsers = stages[stageKey] || [];
              const users = filterLower ? allUsers.filter(filterUser) : allUsers;
              const label = UNICOACH_COACH_STAGE_LABELS[stageKey];
              const count = allUsers.length;
              return (
                <div key={stageKey} className="w-[260px] flex-shrink-0 h-full flex flex-col min-h-0">
                  <div className="sticky z-10 top-0 py-2 px-3 rounded-t-xl border border-b-0 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/80">
                    <h3 className="font-medium text-sm text-slate-900 dark:text-white">{label}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {count} student{count !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex-1 flex flex-col min-h-0 border border-slate-200 dark:border-slate-700 border-t-0 rounded-b-xl bg-slate-50/50 dark:bg-slate-900/20 overflow-hidden">
                    <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 p-2">
                      <DroppableColumnWithRef id={columnId} droppable={!USER_ONLY_COACH_COLUMNS.has(stageKey)}>
                        {users.map(user => (
                          <StudentCard
                            key={`${user.id}-${stageKey}`}
                            user={user}
                            stageKey={stageKey}
                            isCurrentUser={sessionEmail === user.email}
                            onOpenProfile={onOpenJourney}
                          />
                        ))}
                      </DroppableColumnWithRef>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <DragOverlay>
            {activeId && activeUser && activeStageKey ? (
              <div className="w-[240px] cursor-grabbing">
                <div className="rounded-xl border-2 border-brand-500 bg-white dark:bg-[#111] p-2 flex items-center gap-2 shadow-lg">
                  <div className="relative h-8 w-8 rounded-full overflow-hidden flex-shrink-0 bg-slate-100">
                    {studentProfilePicture(activeUser) ? (
                      // eslint-disable-next-line @next/next/no-img-element -- external OAuth/CDN avatars
                      <img
                        src={studentProfilePicture(activeUser) as string}
                        alt=""
                        className="h-full w-full object-cover"
                        width={32}
                        height={32}
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-xs text-slate-500">
                        {(activeUser.name || "?").charAt(0)}
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{activeUser.name}</span>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </>
  );
};
