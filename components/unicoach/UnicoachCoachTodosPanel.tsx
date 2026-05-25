"use client";

import { useMemo } from "react";
import { groupUnicoachTodosBySection } from "@/features/unicoach/mappers/group-unicoach-todos";
import type { UnicoachTodo } from "@/features/unicoach/types";
import { ChevronDown } from "lucide-react";

type UnicoachCoachTodosPanelProps = {
  todos: UnicoachTodo[];
  isPending: boolean;
  onToggleTodo: (todo: UnicoachTodo) => void;
};

export const UnicoachCoachTodosPanel = ({ todos, isPending, onToggleTodo }: UnicoachCoachTodosPanelProps) => {
  const groups = useMemo(() => groupUnicoachTodosBySection(todos), [todos]);
  const count = todos.length;

  if (count === 0) return null;

  return (
    <details className="group mt-4 border-t border-slate-100 dark:border-slate-800 pt-3">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 py-1 text-sm font-medium text-slate-800 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white [&::-webkit-details-marker]:hidden">
        <span>Coach assignments ({count})</span>
        <ChevronDown size={16} className="shrink-0 text-slate-400 transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div className="pt-2 pb-1 space-y-3">
        <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
          Separate from stage unlock tasks. Your coach can add or update these anytime.
        </p>
        {groups.map(({ section, items }) => (
          <div key={section}>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-1.5">{section}</p>
            <ul className="space-y-2">
              {items.map(todo => (
                <li key={String(todo.id)} className="flex items-start gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={Boolean(todo.isCompleted)}
                    onChange={() => onToggleTodo(todo)}
                    disabled={isPending}
                    className="h-3.5 w-3.5 mt-0.5 shrink-0 rounded border-slate-300 text-brand-600"
                    aria-label={todo.title ?? "Assignment"}
                  />
                  <span className="text-slate-700 dark:text-slate-200 leading-snug">{todo.title}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </details>
  );
};
