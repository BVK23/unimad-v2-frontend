export type JobsTab = "discovery" | "tracker" | "interview";

export type InterviewView = "dashboard" | "setup" | "active" | "voice" | "report" | "analyzing";

const VALID_TABS: JobsTab[] = ["discovery", "tracker", "interview"];

export function parseJobsTab(value: string | null): JobsTab {
  if (value && VALID_TABS.includes(value as JobsTab)) return value as JobsTab;
  return "discovery";
}

export function parseInterviewView(value: string | null): InterviewView | null {
  const valid: InterviewView[] = ["dashboard", "setup", "active", "voice", "report", "analyzing"];
  if (value && valid.includes(value as InterviewView)) return value as InterviewView;
  return null;
}

export type JobsUrlState = {
  tab: JobsTab;
  interviewId: string | null;
  view: InterviewView | null;
  round: string | null;
};

export function parseJobsSearchParams(searchParams: URLSearchParams): JobsUrlState {
  return {
    tab: parseJobsTab(searchParams.get("tab")),
    interviewId: searchParams.get("interview_id"),
    view: parseInterviewView(searchParams.get("view")),
    round: searchParams.get("round"),
  };
}

export function buildJobsSearchParams(
  current: URLSearchParams,
  updates: Partial<{
    tab: JobsTab | null;
    interview_id: string | null;
    view: InterviewView | null;
    round: string | null;
    setup: string | null;
  }>
): string {
  const next = new URLSearchParams(current.toString());

  const apply = (key: string, value: string | null | undefined) => {
    if (value === null || value === undefined || value === "") next.delete(key);
    else next.set(key, value);
  };

  if ("tab" in updates) apply("tab", updates.tab ?? null);
  if ("interview_id" in updates) apply("interview_id", updates.interview_id ?? null);
  if ("view" in updates) apply("view", updates.view ?? null);
  if ("round" in updates) apply("round", updates.round ?? null);
  if ("setup" in updates) apply("setup", updates.setup ?? null);

  const qs = next.toString();
  return qs ? `?${qs}` : "";
}
