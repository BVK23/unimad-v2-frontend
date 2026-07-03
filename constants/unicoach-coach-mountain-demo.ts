import type { CoachPipelineStage } from "@/constants/unicoach-coach-pipeline";
import type { AssignedStudent } from "@/features/unicoach/types";

export type MountainDemoStudent = AssignedStudent & { pipelineStage: CoachPipelineStage };

/** Temporary demo roster — append `?mountain_demo=1` on the coach dashboard to preview multi-user graph UX. */
export const MOUNTAIN_DEMO_USER_ID_BASE = 90_001;

const DEMO_ROSTER: { name: string; stage: CoachPipelineStage }[] = [
  { name: "Alex Chen", stage: "not_started" },
  { name: "Priya Sharma", stage: "not_started" },
  { name: "James Okonkwo", stage: "not_started" },
  { name: "Sofia Martinez", stage: "call_1" },
  { name: "Liam O'Brien", stage: "call_1" },
  { name: "Emma Wilson", stage: "call_2" },
  { name: "Noah Patel", stage: "call_3" },
  { name: "Mia Johnson", stage: "call_4" },
  { name: "Ethan Brown", stage: "completed" },
  { name: "Zara Khan", stage: "offered" },
];

export function buildMountainDemoStudents(): MountainDemoStudent[] {
  return DEMO_ROSTER.map((row, i) => ({
    id: MOUNTAIN_DEMO_USER_ID_BASE + i,
    name: row.name,
    email: `${row.name.toLowerCase().replace(/[^a-z]/g, ".")}@demo.unimad.local`,
    phone_number: null,
    linkedin_url: null,
    program_label: "Unicoach Program",
    pipelineStage: row.stage,
  }));
}

export function isMountainDemoUserId(userId: number): boolean {
  return userId >= MOUNTAIN_DEMO_USER_ID_BASE && userId < MOUNTAIN_DEMO_USER_ID_BASE + 100;
}
