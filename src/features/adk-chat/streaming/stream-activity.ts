/**
 * Maps SSE stream signals (agent author, tool names) to user-facing labels
 * and identifies tools that mutate ADK session resume_data (need session GET refresh).
 */

/** Tool names that write into session state via the Python tool_context helpers. */
export const MUTATING_RESUME_TOOL_NAMES = new Set<string>([
  "update_summary",
  "update_education",
  "add_education",
  "remove_education",
  "update_experience",
  "add_experience",
  "remove_experience",
  "add_bullet",
  "update_bullet",
  "remove_bullet",
  "add_skill",
  "remove_skill",
  "add_project",
  "update_project",
  "remove_project",
]);

/** ADK may emit snake_case, camelCase, or dotted names for the same handoff tool. */
const TRANSFER_TOOL_NAMES = new Set(["transfer_to_agent", "transferToAgent", "transfer_to_sub_agent", "transferToSubAgent"]);

function baseToolName(name: string): string {
  if (!name) return "";
  const trimmed = name.trim();
  const last = trimmed.includes(".") ? trimmed.split(".").pop()! : trimmed;
  return last;
}

/** ADK / Gemini may declare tools as camelCase; normalize for switch + mutating set. */
function toSnakeToolKey(name: string): string {
  const b = baseToolName(name);
  return b
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/-/g, "_")
    .toLowerCase();
}

function isTransferTool(name: string): boolean {
  const b = baseToolName(name);
  const snake = toSnakeToolKey(name);
  return TRANSFER_TOOL_NAMES.has(b) || TRANSFER_TOOL_NAMES.has(snake) || /^transfer/i.test(b) || /^transfer/i.test(snake);
}

function readSectionNameArg(args?: Record<string, unknown>): string {
  if (!args) return "";
  const raw = args.section_name ?? args.sectionName ?? args.section;
  return typeof raw === "string" ? raw : "";
}

export function isMutatingResumeTool(name: string): boolean {
  return MUTATING_RESUME_TOOL_NAMES.has(toSnakeToolKey(name));
}

/**
 * Best-effort read of target specialist from ADK handoff tool args (shape varies by version).
 */
function readHandoffTargetAgent(args?: Record<string, unknown>): string | null {
  if (!args || typeof args !== "object") return null;
  const candidates = [
    args.agent_name,
    args.agentName,
    args.target_agent,
    args.targetAgent,
    args.sub_agent,
    args.subAgent,
    args.name,
    args.agent,
  ];
  for (const v of candidates) {
    if (typeof v === "string" && v.trim().length > 0) {
      return v.trim();
    }
  }
  for (const v of Object.values(args)) {
    if (typeof v === "string" && /_agent$/i.test(v) && v.trim().length > 0) {
      return v.trim();
    }
  }
  return null;
}

function handoffLabelForTarget(targetRaw: string): string {
  const id = targetRaw.trim().toLowerCase().replace(/\s+/g, "_");
  switch (id) {
    case "resume_agent":
      return "Pulling your resume together…";
    case "summary_agent":
      return "Focusing on your professional summary…";
    case "experience_agent":
      return "Going deeper on your work experience…";
    case "education_agent":
      return "Focusing on your education…";
    case "skills_agent":
      return "Polishing how your skills come across…";
    case "projects_agent":
      return "Highlighting your projects…";
    case "unibot":
      return "Continuing with your request…";
    default:
      return "Getting more targeted help with this…";
  }
}

function labelForTransferTool(args?: Record<string, unknown>): string {
  const target = readHandoffTargetAgent(args);
  if (target) {
    return handoffLabelForTarget(target);
  }
  return "Getting more targeted help with this…";
}

/** Fallback when we do not have a dedicated string (avoid raw snake_case in UI). */
function humanizeUnknownToolName(name: string): string {
  const b = baseToolName(name);
  if (!b) return "a step";
  return b
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, c => c.toUpperCase());
}

function sectionLabel(sectionName: string): string {
  const s = sectionName.trim().toLowerCase();
  if (s.includes("skill")) return "your skills";
  if (s.includes("exp")) return "your experience";
  if (s.includes("project")) return "your projects";
  if (s.includes("edu")) return "your education";
  if (s.includes("summary") || s === "profile") return "your summary";
  if (s.includes("cert")) return "your certifications";
  return "your resume";
}

export function labelForAgent(author: string): string {
  const a = author.trim().toLowerCase().replace(/\s+/g, "_");
  switch (a) {
    case "unibot":
      return "Working on your request…";
    case "resume_agent":
      return "Coordinating your resume…";
    case "summary_agent":
      return "Shaping your professional summary…";
    case "experience_agent":
      return "Refining your work history…";
    case "education_agent":
      return "Reviewing your education…";
    case "skills_agent":
      return "Tuning your skills section…";
    case "projects_agent":
      return "Reviewing your projects…";
    default:
      if (!a) return "Thinking…";
      return "Making progress on your request…";
  }
}

export function labelForToolCall(name: string, args?: Record<string, unknown>): string {
  if (isTransferTool(name)) {
    return labelForTransferTool(args);
  }

  const snakeKey = toSnakeToolKey(name);
  switch (snakeKey) {
    case "get_summary":
      return "Reviewing your summary…";
    case "get_resume":
      return "Reviewing your resume…";
    case "get_section":
      return `Reviewing ${sectionLabel(readSectionNameArg(args))}…`;
    case "get_experiences":
      return "Reviewing your experience…";
    case "get_experience_by_id":
      return "Reviewing an experience entry…";
    case "get_skills":
      return "Reviewing your skills…";
    case "get_projects":
      return "Reviewing your projects…";
    case "get_project_by_id":
      return "Reviewing a project…";
    case "get_education":
      return "Reviewing your education…";
    case "get_education_by_id":
      return "Reviewing an education entry…";
    case "update_summary":
      return "Refreshing your summary…";
    case "update_education":
    case "add_education":
    case "remove_education":
      return "Refreshing your education…";
    case "update_experience":
    case "add_experience":
    case "remove_experience":
    case "add_bullet":
    case "update_bullet":
    case "remove_bullet":
      return "Refreshing your experience…";
    case "add_skill":
    case "remove_skill":
      return "Refreshing your skills…";
    case "add_project":
    case "update_project":
    case "remove_project":
      return "Refreshing your projects…";
    default:
      return `Working on ${humanizeUnknownToolName(name)}…`;
  }
}

export function labelForMutatingToolResponse(name: string): string {
  switch (toSnakeToolKey(name)) {
    case "update_summary":
      return "Summary updated — refreshing your view…";
    case "update_education":
    case "add_education":
    case "remove_education":
      return "Education updated — refreshing your view…";
    case "update_experience":
    case "add_experience":
    case "remove_experience":
    case "add_bullet":
    case "update_bullet":
    case "remove_bullet":
      return "Experience updated — refreshing your view…";
    case "add_skill":
    case "remove_skill":
      return "Skills updated — refreshing your view…";
    case "add_project":
    case "update_project":
    case "remove_project":
      return "Projects updated — refreshing your view…";
    default:
      return "Changes saved — refreshing your view…";
  }
}
