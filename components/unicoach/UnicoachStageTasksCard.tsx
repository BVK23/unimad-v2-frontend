"use client";

import type { CoachMilestoneAction } from "@/constants/unicoach-journey-coach";
import type { JourneyFlags, StageTaskMeta } from "@/features/unicoach/types";
import type { UnicoachCurriculumStage } from "./curriculum";

type UnicoachStageTasksCardProps = {
  activeStage: UnicoachCurriculumStage;
  serverUx: string;
  completedTaskIds: string[];
  tasksMeta?: StageTaskMeta[];
  checklistMutationPending: boolean;
  onToggleTask: (stageId: string, taskLabel: string) => void;
  showBookingCta: boolean;
  showAdvanceCta: boolean;
  advanceLabel: string;
  bookingBlockReason?: string | null;
  advanceBlockReason?: string | null;
  isActiveStageFullyComplete: boolean;
  advancePending: boolean;
  onOpenBooking: () => void;
  onAdvance: () => void;
  advanceError: string;
  journeyFlags?: JourneyFlags | null;
  isCoachView?: boolean;
  coachMilestone?: CoachMilestoneAction | null;
  coachMilestoneEnabled?: boolean;
  coachMilestonePending?: boolean;
  onCoachMilestone?: () => void;
  showStudentAwaitingCoach?: boolean;
  showPostCall3StudentCta?: boolean;
  showPostCall3CoachCta?: boolean;
};

export const UnicoachStageTasksCard = ({
  activeStage,
  serverUx,
  completedTaskIds,
  tasksMeta,
  checklistMutationPending,
  onToggleTask,
  showBookingCta,
  showAdvanceCta,
  advanceLabel,
  bookingBlockReason,
  advanceBlockReason,
  isActiveStageFullyComplete,
  advancePending,
  onOpenBooking,
  onAdvance,
  advanceError,
  journeyFlags,
  isCoachView = false,
  coachMilestone,
  coachMilestoneEnabled = false,
  coachMilestonePending = false,
  onCoachMilestone,
  showStudentAwaitingCoach = false,
  showPostCall3StudentCta = false,
  showPostCall3CoachCta = false,
}: UnicoachStageTasksCardProps) => {
  const canEditChecklist = !isCoachView && activeStage.id === serverUx && !checklistMutationPending;
  const metaByLabel = new Map((tasksMeta ?? []).map(m => [m.label, m]));

  const studentBookingHint =
    activeStage.id === "call-1-prep"
      ? "After Call 1, Stage 2 will unlock."
      : activeStage.id === "call-2"
        ? "After Call 2, Stage 4 will unlock."
        : activeStage.id === "complete"
          ? "After Call 3, you will continue with the programme system."
          : null;

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-slate-900 dark:text-white leading-none">Stage tasks</p>
      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
        {isCoachView
          ? "View-only checklist for this student. Use the action below to mark call milestones."
          : "Complete these to unlock booking or the next milestone for this stage."}
      </p>

      {!isCoachView && activeStage.id !== serverUx ? (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
          Open your current stage ({serverUx.replace(/-/g, " ")}) to update checklist items.
        </p>
      ) : null}

      <div className="mt-4 space-y-3">
        {activeStage.tasks.map(task => {
          const taskId = `${activeStage.id}:${task}`;
          const checked = completedTaskIds.includes(taskId);
          const meta = metaByLabel.get(task);
          const editable = canEditChecklist && (meta?.editable ?? true);
          const disabledReason = meta?.disabled_reason;
          return (
            <div
              key={task}
              className={`flex items-start gap-3 text-sm rounded-xl px-1 py-0.5 ${editable ? "cursor-pointer" : "opacity-90"}`}
              title={!editable && disabledReason ? disabledReason : undefined}
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={!editable}
                readOnly={isCoachView}
                onChange={() => onToggleTask(activeStage.id, task)}
                className="h-4 w-4 min-h-4 min-w-4 shrink-0 rounded border-slate-300 text-brand-600 focus:ring-brand-500 mt-0.5 disabled:opacity-50"
              />
              <span
                className={`leading-5 ${checked ? "text-slate-500 dark:text-slate-500 line-through" : "text-slate-700 dark:text-slate-300"}`}
              >
                {task}
                {!editable && disabledReason && !isCoachView ? (
                  <span className="mt-0.5 block text-[10px] text-slate-400 dark:text-slate-500">{disabledReason}</span>
                ) : null}
              </span>
            </div>
          );
        })}
      </div>

      {activeStage.id === serverUx || isCoachView ? (
        <div className="mt-3 space-y-2">
          {isCoachView && coachMilestone ? (
            <>
              <button
                type="button"
                onClick={() => onCoachMilestone?.()}
                disabled={!coachMilestoneEnabled || coachMilestonePending}
                className={`w-full rounded-xl text-sm py-2.5 transition-colors ${
                  coachMilestoneEnabled
                    ? "bg-slate-900 hover:bg-slate-800 dark:bg-brand-600 dark:hover:bg-brand-700 text-white"
                    : "bg-slate-200 text-slate-500 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500"
                }`}
              >
                {coachMilestonePending ? "Saving…" : coachMilestone.label}
              </button>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center">{coachMilestone.helperText}</p>
            </>
          ) : null}

          {!isCoachView && showBookingCta ? (
            <button
              type="button"
              onClick={onOpenBooking}
              className="w-full rounded-xl text-sm py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-brand-600 dark:hover:bg-brand-700 text-white transition-colors"
            >
              {activeStage.nextActionLabel}
            </button>
          ) : !isCoachView && bookingBlockReason ? (
            <p className="text-center text-[11px] text-slate-500 dark:text-slate-400">{bookingBlockReason}</p>
          ) : null}

          {!isCoachView && showAdvanceCta ? (
            <button
              type="button"
              onClick={onAdvance}
              disabled={!isActiveStageFullyComplete || advancePending}
              title={advanceBlockReason ?? undefined}
              className={`w-full rounded-xl text-sm py-2.5 transition-colors ${
                isActiveStageFullyComplete
                  ? "bg-slate-900 hover:bg-slate-800 dark:bg-brand-600 dark:hover:bg-brand-700 text-white"
                  : "bg-slate-200 text-slate-500 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500"
              }`}
            >
              {advanceLabel}
            </button>
          ) : null}

          {!isCoachView && showBookingCta && studentBookingHint ? (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center">{studentBookingHint}</p>
          ) : null}

          {showStudentAwaitingCoach && !isCoachView ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
              Stage 3 will be unlocked by your coach once they review your progress.
            </p>
          ) : null}

          {!isCoachView && showPostCall3StudentCta ? (
            <button
              type="button"
              disabled
              title="Coming soon — additional coaching calls will be available in a future update."
              className="w-full rounded-xl text-sm py-2.5 bg-slate-200 text-slate-500 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500"
            >
              Request Adtnl Call
            </button>
          ) : null}

          {isCoachView && showPostCall3CoachCta ? (
            <button
              type="button"
              disabled
              title="Coming soon — enable additional calls for this student in a future update."
              className="w-full rounded-xl text-sm py-2.5 bg-slate-200 text-slate-500 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500"
            >
              Enable more calls
            </button>
          ) : null}

          {advanceError ? <p className="text-xs text-red-600 text-center">{advanceError}</p> : null}
        </div>
      ) : null}
    </div>
  );
};
