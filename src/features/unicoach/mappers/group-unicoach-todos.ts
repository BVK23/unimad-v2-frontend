import type { UnicoachTodo } from "../types";

export type UnicoachTodoSectionGroup = {
  section: string;
  items: UnicoachTodo[];
};

/** Group legacy coach todos by `section_name`; items without a section go under "General". */
export const groupUnicoachTodosBySection = (todos: UnicoachTodo[]): UnicoachTodoSectionGroup[] => {
  const map = new Map<string, UnicoachTodo[]>();
  for (const t of todos) {
    const raw = t.section_name;
    const sec = typeof raw === "string" && raw.trim() ? raw.trim() : "General";
    if (!map.has(sec)) map.set(sec, []);
    map.get(sec)!.push(t);
  }
  return Array.from(map.entries())
    .map(([section, items]) => ({ section, items }))
    .sort((a, b) => a.section.localeCompare(b.section));
};
