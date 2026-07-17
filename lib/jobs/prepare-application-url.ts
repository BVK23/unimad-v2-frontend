import type { PrepareApplicationTab } from "@/lib/jobs/prepare-application-return";
import type { ContentGeneratorType } from "@/types/jobs";

export type PrepareNavigateTarget = "jobs" | "tracker";

export type StudioUrlView = "edit" | "preview";

export type StudioUrlState = {
  id?: string;
  type?: ContentGeneratorType;
  jobId?: string;
  navigate?: PrepareNavigateTarget;
  improve?: boolean;
  interviewVpd?: boolean;
  /** VPD workspace mode: edit canvas or full preview (`view=edit|preview`). */
  view?: StudioUrlView;
  /** Selected Studio VPD template id for landing preview (`template=vpd-template-*`). */
  template?: string;
  /** True when jobId is set or legacy return=prepare is present. */
  fromPrepareApplication: boolean;
};

const PREPARE_NAVIGATE_VALUES = new Set<PrepareNavigateTarget>(["jobs", "tracker"]);

export function parsePrepareNavigate(value: string | null | undefined): PrepareNavigateTarget | undefined {
  if (value && PREPARE_NAVIGATE_VALUES.has(value as PrepareNavigateTarget)) {
    return value as PrepareNavigateTarget;
  }
  return undefined;
}

export function buildStudioSearchParams(input: {
  id?: string;
  type?: string;
  jobId?: string;
  navigate?: PrepareNavigateTarget;
  improve?: boolean;
  interviewVpd?: boolean;
  view?: StudioUrlView | null;
  template?: string | null;
}): URLSearchParams {
  const params = new URLSearchParams();
  if (input.id?.trim()) params.set("id", input.id.trim());
  if (input.type?.trim()) params.set("type", input.type.trim());
  if (input.jobId?.trim()) params.set("jobId", input.jobId.trim());
  if (input.navigate) params.set("navigate", input.navigate);
  if (input.improve) params.set("improve", "1");
  if (input.interviewVpd) params.set("interviewVpd", "1");
  if (input.view === "edit" || input.view === "preview") params.set("view", input.view);
  if (input.template?.trim()) params.set("template", input.template.trim());
  return params;
}

export function parseStudioSearchParams(searchParams: { get(name: string): string | null } | null | undefined): StudioUrlState {
  if (!searchParams) {
    return { fromPrepareApplication: false };
  }
  const type = searchParams.get("type")?.trim() || undefined;
  const jobId = searchParams.get("jobId")?.trim() || undefined;
  const legacyPrepare = searchParams.get("return") === "prepare";
  const viewRaw = searchParams.get("view")?.trim();
  const view: StudioUrlView | undefined = viewRaw === "edit" || viewRaw === "preview" ? viewRaw : undefined;
  return {
    id: searchParams.get("id")?.trim() || undefined,
    type: type as ContentGeneratorType | undefined,
    jobId,
    navigate: parsePrepareNavigate(searchParams.get("navigate")),
    improve: searchParams.get("improve") === "1",
    interviewVpd: searchParams.get("interviewVpd") === "1",
    view,
    template: searchParams.get("template")?.trim() || undefined,
    fromPrepareApplication: Boolean(jobId || legacyPrepare),
  };
}

export function buildStudioHref(input: Parameters<typeof buildStudioSearchParams>[0]): string {
  const query = buildStudioSearchParams(input).toString();
  return query ? `/uniboard/studio?${query}` : "/uniboard/studio";
}

export function buildResumePrepareHref(resumeId: string, jobId: string, navigate: PrepareNavigateTarget, improve = true): string {
  const params = new URLSearchParams({
    id: resumeId,
    jobId,
    navigate,
  });
  if (improve) {
    params.set("improve", "1");
  }
  return `/uniboard/resume?${params.toString()}`;
}

export function parseResumePrepareSearchParams(searchParams: { get(name: string): string | null } | null | undefined): {
  resumeId?: string;
  jobId?: string;
  navigate?: PrepareNavigateTarget;
  improve?: boolean;
} {
  if (!searchParams) {
    return {};
  }
  return {
    resumeId: searchParams.get("id")?.trim() || undefined,
    jobId: searchParams.get("jobId")?.trim() || undefined,
    navigate: parsePrepareNavigate(searchParams.get("navigate")),
    improve: searchParams.get("improve") === "1",
  };
}

export function buildJobsPrepareReopenHref(jobId: string, tab: PrepareApplicationTab, navigate: PrepareNavigateTarget = "tracker"): string {
  const jobsTab = navigate === "tracker" ? "tracker" : "discovery";
  const params = new URLSearchParams({
    tab: jobsTab,
    prepareJob: jobId,
    prepareTab: tab,
  });
  return `/uniboard/jobs?${params.toString()}`;
}

/** Strip prepare-application params; keep asset id (and optional studio type). */
export function buildStudioAssetOnlyHref(pathname: string, state: Pick<StudioUrlState, "id" | "type">): string {
  const params = buildStudioSearchParams({ id: state.id, type: state.type });
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function buildResumeAssetOnlyHref(resumeId: string): string {
  return `/uniboard/resume?id=${encodeURIComponent(resumeId)}`;
}
