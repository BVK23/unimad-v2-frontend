"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  COACH_PIPELINE_LABELS,
  MOUNTAIN_GRAPH_ORDER,
  MOUNTAIN_SHORT_LABELS,
  SPECIAL_GRAPH_ORDER,
  type CoachPipelineStage,
  type MountainGraphStage,
  type SpecialGraphStage,
  mountainStageForPipeline,
} from "@/constants/unicoach-coach-pipeline";
import { coachColumnId } from "@/constants/unicoach-coach-stages";
import type { AssignedStudent } from "@/features/unicoach/types";
import { resolveProfilePicture } from "@/features/unicoach/utils/profile-picture";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { DndContext, DragOverlay, PointerSensor, pointerWithin, useDraggable, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
import { User } from "lucide-react";

// ─── Chart geometry (single coordinate system — viewBox 0 0 W H) ─────────────

const CHART = { w: 960, h: 240, pad: { top: 56, right: 88, bottom: 30, left: 22 } } as const;
const ALL_STAGES = [...MOUNTAIN_GRAPH_ORDER, ...SPECIAL_GRAPH_ORDER] as const;
const AVATAR = 28;
const DROP = 36;

type Point = { x: number; y: number };
type Peak = Point & { stageId: (typeof ALL_STAGES)[number] };

export type CoachMountainStudent = AssignedStudent & { pipelineStage: CoachPipelineStage };

function studentPic(user: AssignedStudent): string | null {
  return resolveProfilePicture({
    direct: user.profile_picture,
    unimad: user.unimad_profile_picture,
    linkedin: user.linkedin_profile_picture,
    google: user.google_profile_picture,
  });
}

function computePeaks(counts: Record<string, number>, maxCount: number): Peak[] {
  const plotW = CHART.w - CHART.pad.left - CHART.pad.right;
  const plotH = CHART.h - CHART.pad.top - CHART.pad.bottom;
  const baseline = CHART.pad.top + plotH;
  const span = Math.max(ALL_STAGES.length - 1, 1);

  return ALL_STAGES.map((stageId, i) => {
    const count = counts[stageId] ?? 0;
    const x = CHART.pad.left + (i / span) * plotW;
    const lift = count > 0 ? Math.max(plotH * 0.1, (count / maxCount) * plotH) : plotH * 0.035;
    return { stageId, x, y: baseline - lift };
  });
}

function ridgePath(points: Point[]): string {
  if (points.length < 2) return points.length ? `M ${points[0].x} ${points[0].y}` : "";
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    d += ` C ${p1.x + (p2.x - p0.x) / 6} ${p1.y + (p2.y - p0.y) / 6}, ${p2.x - (p3.x - p1.x) / 6} ${p2.y - (p3.y - p1.y) / 6}, ${p2.x} ${p2.y}`;
  }
  return d;
}

function areaPath(points: Point[], baseline: number): string {
  if (!points.length) return "";
  const last = points[points.length - 1];
  return `${ridgePath(points)} L ${last.x} ${baseline} L ${points[0].x} ${baseline} Z`;
}

/** Spread avatars in a small arc above their peak. */
function avatarPosition(peak: Point, index: number, total: number): Point {
  if (total <= 1) return { x: peak.x, y: peak.y - 24 };
  const perRow = Math.min(total, 5);
  const row = Math.floor(index / perRow);
  const col = index % perRow;
  const cols = Math.min(perRow, total - row * perRow);
  return {
    x: peak.x + (col - (cols - 1) / 2) * 18,
    y: peak.y - 24 - row * 24,
  };
}

function closestPeakByClientX(clientX: number, svg: SVGSVGElement, peaks: Peak[]): Peak | null {
  const ctm = svg.getScreenCTM();
  if (!ctm || peaks.length === 0) return null;
  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = 0;
  const svgX = pt.matrixTransform(ctm.inverse()).x;
  let closest = peaks[0];
  let minDist = Math.abs(peaks[0].x - svgX);
  for (const peak of peaks) {
    const d = Math.abs(peak.x - svgX);
    if (d < minDist) {
      minDist = d;
      closest = peak;
    }
  }
  return closest;
}

function legendLabel(stageId: MountainGraphStage | SpecialGraphStage, count: number): string {
  if (stageId in MOUNTAIN_SHORT_LABELS) {
    const short = MOUNTAIN_SHORT_LABELS[stageId as MountainGraphStage];
    const full = COACH_PIPELINE_LABELS[stageId as CoachPipelineStage];
    return `${full} (${short}) — ${count}`;
  }
  return `${stageId === "offered" ? "Offered" : "Refunded"} — ${count}`;
}

function stageAxisLabel(stageId: (typeof ALL_STAGES)[number]): string {
  if (stageId in MOUNTAIN_SHORT_LABELS) return MOUNTAIN_SHORT_LABELS[stageId as MountainGraphStage];
  return stageId === "offered" ? "Offered" : "Refund";
}

// ─── Drag sub-components (rendered inside SVG via foreignObject) ───────────

function PeakDropZone({ peak, dropId, visible, isOver }: { peak: Peak; dropId: string; visible: boolean; isOver: boolean }) {
  const { setNodeRef } = useDroppable({ id: dropId });
  const half = DROP / 2;

  return (
    <foreignObject x={peak.x - half} y={peak.y - half} width={DROP} height={DROP} className="overflow-visible">
      <div ref={setNodeRef} className="flex h-full w-full items-center justify-center">
        {visible ? (
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full border border-dashed transition-colors ${
              isOver
                ? "border-brand-500 bg-brand-100/90 text-brand-700 dark:bg-brand-950/70"
                : "border-brand-300/80 bg-brand-50/50 text-brand-400 dark:border-brand-600/60 dark:bg-brand-950/30"
            }`}
          >
            <User size={14} strokeWidth={1.75} aria-hidden />
          </div>
        ) : (
          <div className="h-8 w-8" aria-hidden />
        )}
      </div>
    </foreignObject>
  );
}

function StudentAvatar({
  student,
  x,
  y,
  onOpen,
}: {
  student: CoachMountainStudent;
  x: number;
  y: number;
  onOpen: (user: AssignedStudent) => void;
}) {
  const dragId = `student-${student.id}`;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: dragId });
  const pointerDown = useRef<{ x: number; y: number } | null>(null);
  const {
    onPointerDown: dragDown,
    onPointerUp: dragUp,
    ...rest
  } = listeners as {
    onPointerDown?: (e: React.PointerEvent) => void;
    onPointerUp?: (e: React.PointerEvent) => void;
    [key: string]: unknown;
  };
  const pic = studentPic(student);
  const half = AVATAR / 2;

  return (
    <foreignObject x={x - half} y={y - half} width={AVATAR} height={AVATAR} className="overflow-visible">
      <button
        type="button"
        ref={setNodeRef}
        {...attributes}
        {...rest}
        onPointerDown={e => {
          pointerDown.current = { x: e.clientX, y: e.clientY };
          dragDown?.(e);
        }}
        onPointerUp={e => {
          dragUp?.(e);
          const d = pointerDown.current;
          pointerDown.current = null;
          if (d && Math.hypot(e.clientX - d.x, e.clientY - d.y) <= 8) onOpen(student);
        }}
        className={`h-7 w-7 touch-none overflow-hidden rounded-full border-2 border-white bg-slate-100 shadow ring-1 ring-brand-300 dark:border-slate-900 dark:bg-slate-800 dark:ring-brand-600 ${
          isDragging ? "cursor-grabbing opacity-0" : "cursor-grab hover:scale-110"
        }`}
        title={`${student.name} — ${COACH_PIPELINE_LABELS[student.pipelineStage]} (drag to move)`}
      >
        {pic ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={pic} alt="" className="h-full w-full object-cover" width={28} height={28} referrerPolicy="no-referrer" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-slate-500">
            {(student.name || "?").charAt(0)}
          </span>
        )}
      </button>
    </foreignObject>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

type Props = {
  students: CoachMountainStudent[];
  onMove: (userId: number, targetStage: CoachPipelineStage) => void;
  onOpenStudent: (user: AssignedStudent) => void;
  demoBanner?: React.ReactNode;
};

export function UnicoachCoachJourneyMountain({ students, onMove, onOpenStudent, demoBanner }: Props) {
  const canDragIndividuals = students.length > 0 && students.length <= 10;
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const svgRef = useRef<SVGSVGElement>(null);
  const peaksRef = useRef<Peak[]>([]);
  const [dragging, setDragging] = useState<CoachMountainStudent | null>(null);
  const [overDropId, setOverDropId] = useState<string | null>(null);

  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of ALL_STAGES) counts[s] = 0;
    for (const st of students) counts[mountainStageForPipeline(st.pipelineStage)]++;
    return counts;
  }, [students]);

  const maxCount = Math.max(1, ...Object.values(stageCounts));
  const baselineY = CHART.h - CHART.pad.bottom;
  const plotH = CHART.h - CHART.pad.top - CHART.pad.bottom;
  const peaks = useMemo(() => computePeaks(stageCounts, maxCount), [stageCounts, maxCount]);
  useEffect(() => {
    peaksRef.current = peaks;
  }, [peaks]);
  const mainPeaks = peaks.slice(0, MOUNTAIN_GRAPH_ORDER.length);

  const markers = useMemo(() => {
    const byStage = new Map<string, CoachMountainStudent[]>();
    for (const st of students) {
      const key = mountainStageForPipeline(st.pipelineStage);
      const list = byStage.get(key) ?? [];
      list.push(st);
      byStage.set(key, list);
    }
    for (const list of byStage.values()) list.sort((a, b) => a.name.localeCompare(b.name));

    const out: { student: CoachMountainStudent; x: number; y: number }[] = [];
    for (const [stageId, group] of byStage) {
      const peak = peaks[ALL_STAGES.indexOf(stageId as (typeof ALL_STAGES)[number])] ?? peaks[0];
      group.forEach((student, i) => {
        const pos = avatarPosition(peak, i, group.length);
        out.push({ student, x: pos.x, y: pos.y });
      });
    }
    return out;
  }, [students, peaks]);

  const requestMove = useCallback(
    (userId: number, to: CoachPipelineStage, from: CoachPipelineStage) => {
      if (from === to) return;
      // Optimistic + gate modals are owned by the parent move flow.
      onMove(userId, to);
    },
    [onMove]
  );

  const handleDragStart = useCallback(
    (e: DragStartEvent) => {
      const m = String(e.active.id).match(/^student-(\d+)$/);
      if (!m) return;
      const user = students.find(s => s.id === Number(m[1]));
      if (user) setDragging(user);
    },
    [students]
  );

  const resolveDropStage = useCallback((e: DragEndEvent): CoachPipelineStage | null => {
    const { over, active } = e;
    if (over) {
      const overId = String(over.id);
      if (overId.startsWith("column-")) return overId.replace("column-", "") as CoachPipelineStage;
    }
    const translated = active.rect.current.translated;
    const svg = svgRef.current;
    if (translated && svg) {
      const clientX = translated.left + translated.width / 2;
      const peak = closestPeakByClientX(clientX, svg, peaksRef.current);
      if (peak) return peak.stageId as CoachPipelineStage;
    }
    return null;
  }, []);

  const handleDragEnd = useCallback(
    (e: DragEndEvent) => {
      setDragging(null);
      setOverDropId(null);
      const m = String(e.active.id).match(/^student-(\d+)$/);
      if (!m) return;
      const userId = Number(m[1]);
      const toStage = resolveDropStage(e);
      if (!toStage) return;
      const student = students.find(s => s.id === userId);
      if (!student || mountainStageForPipeline(student.pipelineStage) === mountainStageForPipeline(toStage)) return;
      requestMove(userId, toStage, student.pipelineStage);
    },
    [requestMove, resolveDropStage, students]
  );

  const avgProgress = useMemo(() => {
    if (!students.length) return 0;
    const sum = students.reduce(
      (acc, s) => acc + ALL_STAGES.indexOf(mountainStageForPipeline(s.pipelineStage) as (typeof ALL_STAGES)[number]),
      0
    );
    return Math.round((sum / (students.length * Math.max(ALL_STAGES.length - 1, 1))) * 100);
  }, [students]);

  const yTicks = useMemo(() => {
    const ticks: number[] = [];
    for (let c = 0; c <= maxCount; c++) ticks.push(c);
    return ticks.length > 5 ? [0, Math.ceil(maxCount / 2), maxCount] : ticks;
  }, [maxCount]);

  const chart = (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${CHART.w} ${CHART.h}`}
      className="block h-full w-full select-none"
      role="img"
      aria-label="Student distribution across Unicoach journey"
    >
      <defs>
        <linearGradient id="coach-mountain-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.55" />
          <stop offset="55%" stopColor="#60a5fa" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#93c5fd" stopOpacity="0.06" />
        </linearGradient>
        <linearGradient id="coach-mountain-ridge" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#1d4ed8" />
          <stop offset="50%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>

      {yTicks.map(tick => {
        const y = baselineY - (tick / maxCount) * plotH;
        return (
          <g key={tick}>
            <line
              x1={CHART.pad.left}
              y1={y}
              x2={CHART.w - CHART.pad.right}
              y2={y}
              stroke="currentColor"
              strokeOpacity={0.08}
              className="text-slate-900 dark:text-slate-100"
            />
            <text x={CHART.pad.left - 6} y={y + 3} textAnchor="end" className="fill-slate-400 text-[8px] dark:fill-slate-500">
              {tick}
            </text>
          </g>
        );
      })}

      <path d={areaPath(mainPeaks, baselineY)} fill="url(#coach-mountain-fill)" />
      <path d={ridgePath(mainPeaks)} fill="none" stroke="url(#coach-mountain-ridge)" strokeWidth={2} strokeLinecap="round" />

      {MOUNTAIN_GRAPH_ORDER.map((stageId, i) => {
        const pt = mainPeaks[i];
        const count = stageCounts[stageId] ?? 0;
        return (
          <g key={stageId}>
            <line
              x1={pt.x}
              y1={pt.y}
              x2={pt.x}
              y2={baselineY}
              stroke="currentColor"
              strokeOpacity={0.12}
              strokeDasharray="4 4"
              className="text-brand-600 dark:text-brand-400"
            />
            <circle cx={pt.x} cy={pt.y} r={3} className="fill-brand-600 dark:fill-brand-400" />
            {!canDragIndividuals && count > 0 ? (
              <text x={pt.x} y={pt.y - 10} textAnchor="middle" className="fill-slate-800 text-[9px] font-bold dark:fill-slate-100">
                {count}
              </text>
            ) : null}
          </g>
        );
      })}

      {SPECIAL_GRAPH_ORDER.map((stageId, j) => {
        const pt = peaks[MOUNTAIN_GRAPH_ORDER.length + j];
        const count = stageCounts[stageId] ?? 0;
        return (
          <g key={stageId}>
            <circle cx={pt.x} cy={pt.y} r={3} className={stageId === "offered" ? "fill-teal-500" : "fill-rose-500"} />
            {!canDragIndividuals ? (
              <text x={pt.x} y={pt.y - 10} textAnchor="middle" className="fill-slate-600 text-[8px] font-semibold dark:fill-slate-300">
                {count}
              </text>
            ) : null}
          </g>
        );
      })}

      {peaks.map(peak => (
        <text
          key={`lbl-${peak.stageId}`}
          x={peak.x}
          y={CHART.h - 10}
          textAnchor="middle"
          className="fill-slate-600 text-[8px] font-semibold dark:fill-slate-300"
        >
          {stageAxisLabel(peak.stageId)}
        </text>
      ))}

      {canDragIndividuals && (
        <>
          {peaks.map(peak => {
            const dropId = coachColumnId(peak.stageId);
            return (
              <PeakDropZone
                key={`drop-${peak.stageId}`}
                peak={peak}
                dropId={dropId}
                visible={Boolean(dragging)}
                isOver={overDropId === dropId}
              />
            );
          })}
          {markers.map(({ student, x, y }) => (
            <StudentAvatar key={student.id} student={student} x={x} y={y} onOpen={onOpenStudent} />
          ))}
        </>
      )}
    </svg>
  );

  return (
    <>
      <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-4">
        {demoBanner ? <div className="mb-3">{demoBanner}</div> : null}
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-medium text-brand-600 dark:text-brand-400">Coach dashboard</p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {students.length === 0
                ? "No students assigned to you yet."
                : canDragIndividuals
                  ? "Drag a student avatar onto a stage peak to update their status."
                  : "More than 10 students — use the list below to update status individually."}
            </p>
          </div>
          {students.length > 0 ? (
            <div className="flex shrink-0 gap-2 sm:justify-end">
              <div className="rounded-lg border border-brand-200 bg-brand-50/80 px-3 py-1.5 dark:border-brand-800/50 dark:bg-brand-950/30">
                <p className="text-[9px] text-brand-600 dark:text-brand-400">Students</p>
                <p className="text-lg font-semibold leading-tight text-slate-900 dark:text-white">{students.length}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-1.5 dark:border-slate-800 dark:bg-slate-950/40">
                <p className="text-[9px] text-slate-500 dark:text-slate-400">Avg progress</p>
                <p className="text-lg font-semibold leading-tight text-slate-900 dark:text-white">{avgProgress}%</p>
              </div>
            </div>
          ) : null}
        </div>

        {students.length > 0 ? (
          canDragIndividuals ? (
            <DndContext
              sensors={sensors}
              collisionDetection={pointerWithin}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragCancel={() => {
                setDragging(null);
                setOverDropId(null);
              }}
              onDragOver={e => setOverDropId(e.over ? String(e.over.id) : null)}
            >
              <div
                className="w-full overflow-hidden rounded-lg border border-slate-200 bg-gradient-to-b from-slate-50/80 to-white dark:border-slate-800 dark:from-slate-950/40 dark:to-slate-900"
                style={{ aspectRatio: `${CHART.w} / ${CHART.h}` }}
              >
                {chart}
              </div>
              <DragOverlay dropAnimation={null}>
                {dragging ? (
                  <div className="h-7 w-7 cursor-grabbing overflow-hidden rounded-full border-2 border-brand-500 bg-white shadow-md ring-2 ring-brand-300">
                    {studentPic(dragging) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={studentPic(dragging)!} alt="" className="h-full w-full object-cover" width={28} height={28} />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-slate-500">
                        {(dragging.name || "?").charAt(0)}
                      </span>
                    )}
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          ) : (
            <div
              className="w-full overflow-hidden rounded-lg border border-slate-200 bg-gradient-to-b from-slate-50/80 to-white dark:border-slate-800 dark:from-slate-950/40 dark:to-slate-900"
              style={{ aspectRatio: `${CHART.w} / ${CHART.h}` }}
            >
              {chart}
            </div>
          )
        ) : null}

        {students.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-2">
            {MOUNTAIN_GRAPH_ORDER.map(stageId => (
              <li
                key={stageId}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400"
              >
                {legendLabel(stageId, stageCounts[stageId] ?? 0)}
              </li>
            ))}
            {SPECIAL_GRAPH_ORDER.map(stageId => (
              <li
                key={stageId}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400"
              >
                {legendLabel(stageId, stageCounts[stageId] ?? 0)}
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </>
  );
}
