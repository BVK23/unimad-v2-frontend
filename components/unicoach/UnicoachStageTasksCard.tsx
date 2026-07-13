"use client";

import type { CoachMilestoneAction } from "@/constants/unicoach-journey-coach";
import type { JourneyFlags, StageTaskMeta } from "@/features/unicoach/types";
import type { UnicoachCurriculumStage } from "./curriculum";

type UnicoachStageTasksCardProps = {
  activeStage: UnicoachCurriculumStage;
  serverUx: string;
  completedTaskIds: string[];
  tasksMeta?: StageTaskMeta[];
  onToggleTask: (stageId: string, taskLabel: string) => void;
  showBookingCta: boolean;
  showBookingBlock?: boolean;
  bookingActionLabel?: string;
  hideBookingHint?: boolean;
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
  showInterviewConfirmCta?: boolean;
  onConfirmInterview?: () => void;
  stageGateReason?: string | null;
};

export const UnicoachStageTasksCard = ({
  activeStage,
  serverUx,
  completedTaskIds,
  tasksMeta,
  onToggleTask,
  showBookingCta,
  showBookingBlock = false,
  bookingActionLabel,
  hideBookingHint = false,
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
  showInterviewConfirmCta = false,
  onConfirmInterview,
  stageGateReason,
}: UnicoachStageTasksCardProps) => {
  const canEditChecklist = !isCoachView && activeStage.id === serverUx;
  const showStageActions = isCoachView || activeStage.id === serverUx || showBookingCta || showBookingBlock;
  const metaByLabel = new Map((tasksMeta ?? []).map(m => [m.label, m]));

  const studentBookingHint =
    activeStage.id === "call-1"
      ? "Complete tasks and your Discovery call to unlock LinkedIn branding."
      : activeStage.id === "call-2"
        ? "Complete tasks to book Application Strategy."
        : activeStage.id === "call-4"
          ? "Confirm your interview, then book your prep call."
          : null;

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-slate-900 dark:text-white leading-none">Task checklist</p>
      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
        {isCoachView
          ? "View-only checklist for this student. Use the action below to mark call milestones."
          : "One-time milestones for this module."}
      </p>

      {!isCoachView && activeStage.id !== serverUx ? (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
          Open your current stage ({serverUx.replace(/-/g, " ")}) to update checklist items.
        </p>
      ) : null}

      {activeStage.id === serverUx || isCoachView || showBookingCta || showBookingBlock ? (
        <div className="mt-4 space-y-3">
          {activeStage.tasks.map(task => {
            const taskId = `${activeStage.id}:${task}`;
            const checked = completedTaskIds.includes(taskId);
            const meta = metaByLabel.get(task);
            const editable = canEditChecklist && (meta?.editable ?? true);
            const disabledReason = meta?.disabled_reason;
            const rowHint = !editable && disabledReason && !stageGateReason ? disabledReason : undefined;
            return (
              <div
                key={task}
                className={`flex items-start gap-3 text-sm rounded-xl px-1 py-0.5 ${editable ? "cursor-pointer" : "opacity-90"}`}
                title={rowHint}
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
                  {rowHint && !isCoachView ? (
                    <span className="mt-0.5 block text-[10px] text-slate-400 dark:text-slate-500">{rowHint}</span>
                  ) : null}
                </span>
              </div>
            );
          })}
          {!isCoachView && stageGateReason ? (
            <p className="text-center text-[11px] text-slate-500 dark:text-slate-400 pt-1">{stageGateReason}</p>
          ) : null}
        </div>
      ) : null}

      {showStageActions ? (
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

          {!isCoachView && showInterviewConfirmCta ? (
            <button
              type="button"
              onClick={() => onConfirmInterview?.()}
              className="w-full rounded-xl text-sm py-2.5 border border-brand-200 bg-brand-50 text-brand-800 hover:bg-brand-100 dark:border-brand-800 dark:bg-brand-950/40 dark:text-brand-100 transition-colors"
            >
              I have an interview — ready to prep
            </button>
          ) : null}

          {!isCoachView && showBookingCta ? (
            <button
              type="button"
              onClick={onOpenBooking}
              className="w-full rounded-xl text-sm py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-brand-600 dark:hover:bg-brand-700 text-white transition-colors"
            >
              {bookingActionLabel ?? activeStage.nextActionLabel}
            </button>
          ) : !isCoachView && showBookingBlock && bookingBlockReason ? (
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

          {!isCoachView && showBookingCta && studentBookingHint && !hideBookingHint ? (
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
