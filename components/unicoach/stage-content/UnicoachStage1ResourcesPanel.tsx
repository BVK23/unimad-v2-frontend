"use client";

import { useState } from "react";
import {
  UNICOACH_EDUCATION_EXAMPLE,
  UNICOACH_QUESTIONS_1_3,
  UNICOACH_QUESTIONS_1_3_EXAMPLES,
  UNICOACH_QUESTIONS_4_6,
  UNICOACH_QUESTIONS_4_6_EXAMPLES,
  UNICOACH_WORK_EXAMPLE,
} from "@/constants/unicoach-niche-content";
import { ChevronDown, ChevronUp } from "lucide-react";

function ExampleTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
      <table className="w-full min-w-[420px] text-xs">
        <thead>
          <tr className="bg-slate-50 text-left text-slate-500 dark:bg-slate-900/60">
            {headers.map(h => (
              <th key={h} className="px-3 py-2 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="border-t border-slate-100 dark:border-slate-800">
              {row.map((cell, ci) => (
                <td key={ci} className="px-3 py-2 text-slate-700 dark:text-slate-300">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Section({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 px-3 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-900/50"
      >
        <span className="text-sm font-medium text-slate-900 dark:text-white">{title}</span>
        {open ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
      </button>
      {open ? <div className="border-t border-slate-100 dark:border-slate-800 px-3 pb-3 pt-2 space-y-3">{children}</div> : null}
    </div>
  );
}

/** Stage 1 resources — example tables and Q&A (V1 lived beside inputs; V2 shows in Resources). */
export const UnicoachStage1ResourcesPanel = () => (
  <div className="space-y-3">
    <p className="text-sm text-slate-600 dark:text-slate-300">
      Use these examples as reference while filling in your niche worksheet on the Overview tab.
    </p>
    <Section title="Example education table" defaultOpen>
      <ExampleTable headers={["Education", "Domain", "Was it fun?"]} rows={UNICOACH_EDUCATION_EXAMPLE} />
    </Section>
    <Section title="Example work experiences">
      <ExampleTable headers={["Role / company", "Enjoyment"]} rows={UNICOACH_WORK_EXAMPLE} />
    </Section>
    <Section title="Example answers — questions 1–3">
      <div className="space-y-3">
        {UNICOACH_QUESTIONS_1_3.map((q, i) => (
          <div key={q} className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900/50">
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{q}</p>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{UNICOACH_QUESTIONS_1_3_EXAMPLES[i]?.[1]}</p>
          </div>
        ))}
      </div>
    </Section>
    <Section title="Example answers — niche research (4–6)">
      <div className="space-y-3">
        {UNICOACH_QUESTIONS_4_6.map((q, i) => (
          <div key={q} className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900/50">
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{q}</p>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{UNICOACH_QUESTIONS_4_6_EXAMPLES[i]?.[1]}</p>
          </div>
        ))}
      </div>
    </Section>
  </div>
);
