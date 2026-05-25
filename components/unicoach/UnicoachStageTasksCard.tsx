"use client";

import type { UnicoachCurriculumStage } from "./curriculum";

type UnicoachStageTasksCardProps = {
  activeStage: UnicoachCurriculumStage;
  serverUx: string;
  completedTaskIds: string[];
  checklistMutationPending: boolean;
  onToggleTask: (stageId: string, taskLabel: string) => void;
  showBookingCta: boolean;
  showAdvanceCta: boolean;
  isActiveStageFullyComplete: boolean;
  advancePending: boolean;
  onOpenBooking: () => void;
  onAdvance: () => void;
  advanceError: string;
};

export const UnicoachStageTasksCard = ({
  activeStage,
  serverUx,
  completedTaskIds,
  checklistMutationPending,
  onToggleTask,
  showBookingCta,
  showAdvanceCta,
  isActiveStageFullyComplete,
  advancePending,
  onOpenBooking,
  onAdvance,
  advanceError,
}: UnicoachStageTasksCardProps) => {
  const canEditChecklist = activeStage.id === serverUx && !checklistMutationPending;

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-slate-900 dark:text-white leading-none">Stage tasks</p>
      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
        Complete these to unlock booking or the next milestone for this stage.
      </p>
      {activeStage.id !== serverUx ? (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
          Open your current stage ({serverUx.replace(/-/g, " ")}) to update checklist items.
        </p>
      ) : null}
      <div className="mt-4 space-y-3">
        {activeStage.tasks.map(task => {
          const taskId = `${activeStage.id}:${task}`;
          const checked = completedTaskIds.includes(taskId);
          return (
            <label
              key={task}
              className={`flex items-start gap-3 text-sm rounded-xl px-1 py-0.5 ${canEditChecklist ? "cursor-pointer" : "opacity-80"}`}
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={!canEditChecklist}
                onChange={() => onToggleTask(activeStage.id, task)}
                className="h-4 w-4 min-h-4 min-w-4 shrink-0 rounded border-slate-300 text-brand-600 focus:ring-brand-500 mt-0.5"
              />
              <span
                className={`leading-5 ${checked ? "text-slate-500 dark:text-slate-500 line-through" : "text-slate-700 dark:text-slate-300"}`}
              >
                {task}
              </span>
            </label>
          );
        })}
      </div>
      {activeStage.id === serverUx ? (
        <div className="mt-3 space-y-2">
          {showBookingCta ? (
            <button
              type="button"
              onClick={onOpenBooking}
              className="w-full rounded-xl text-sm py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-brand-600 dark:hover:bg-brand-700 text-white transition-colors"
            >
              {activeStage.nextActionLabel}
            </button>
          ) : null}
          {showAdvanceCta ? (
            <button
              type="button"
              onClick={onAdvance}
              disabled={!isActiveStageFullyComplete || advancePending}
              className={`w-full rounded-xl text-sm py-2.5 transition-colors ${
                isActiveStageFullyComplete
                  ? "bg-slate-900 hover:bg-slate-800 dark:bg-brand-600 dark:hover:bg-brand-700 text-white"
                  : "bg-slate-200 text-slate-500 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500"
              }`}
            >
              {showBookingCta ? "Mark session / milestone complete" : activeStage.nextActionLabel}
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="w-full rounded-xl text-sm py-2.5 bg-slate-200 text-slate-500 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500"
            >
              {activeStage.nextActionLabel}
            </button>
          )}
          {showBookingCta ? (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center">
              Book first, then confirm here once you have attended the session.
            </p>
          ) : null}
          {advanceError ? <p className="text-xs text-red-600 text-center">{advanceError}</p> : null}
        </div>
      ) : null}
    </div>
  );
};
