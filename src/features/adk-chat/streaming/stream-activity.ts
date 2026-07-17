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
  "update_experience_description",
  "add_experience",
  "remove_experience",
  "add_bullet",
  "update_bullet",
  "remove_bullet",
  "add_skill",
  "update_skill",
  "remove_skill",
  "replace_skills",
  "add_project",
  "update_project",
  "remove_project",
  "add_certification",
  "update_certification",
  "remove_certification",
  "add_custom_section",
  "update_custom_section_title",
  "remove_custom_section",
  "add_custom_section_item",
  "update_custom_section_item",
  "update_custom_section_item_description",
  "remove_custom_section_item",
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
export function toSnakeToolKey(name: string): string {
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

/** Tool names that write into session portfolio_data via portfolio_mutating_tools. */
export const MUTATING_CONTENT_GEN_TOOL_NAMES = new Set<string>(["update_post_draft", "set_content_gen_topic"]);

export const MUTATING_APPLICATION_ASSET_TOOL_NAMES = new Set<string>([
  "update_application_asset_draft",
  "set_application_asset_context",
  "generate_application_asset_draft",
]);

export const MUTATING_PORTFOLIO_TOOL_NAMES = new Set<string>([
  "update_profile_field",
  "update_profile",
  "update_contact_buttons",
  "add_hero_contact_link",
  "add_block",
  "update_block",
  "update_block_content",
  "update_block_by_heading",
  "upsert_portfolio_section_content",
  "upsert_domain_profile_fit_skill_card",
  "remove_block",
  "reorder_blocks",
  "duplicate_block",
  "add_page_block",
  "update_page_block",
  "remove_page_block",
  "reorder_page_blocks",
  "duplicate_page_block",
]);

export function isMutatingPortfolioTool(name: string): boolean {
  return MUTATING_PORTFOLIO_TOOL_NAMES.has(toSnakeToolKey(name));
}

export function isMutatingContentGenTool(name: string): boolean {
  return MUTATING_CONTENT_GEN_TOOL_NAMES.has(toSnakeToolKey(name));
}

export function isMutatingApplicationAssetTool(name: string): boolean {
  return MUTATING_APPLICATION_ASSET_TOOL_NAMES.has(toSnakeToolKey(name));
}

export const MUTATING_LINKEDIN_TOOL_NAMES = new Set<string>([
  "update_headline",
  "update_about",
  "update_experience",
  "update_skills",
  "update_connection_draft",
  "update_comment_draft",
]);

export function isMutatingLinkedInTool(name: string): boolean {
  return MUTATING_LINKEDIN_TOOL_NAMES.has(toSnakeToolKey(name));
}

export const MUTATING_ONBOARDING_TOOL_NAMES = new Set<string>([
  "add_onboarding_education",
  "add_onboarding_experience",
  "mark_onboarding_experience_skipped",
  "add_onboarding_project",
  "set_onboarding_skills",
]);

export function isMutatingOnboardingTool(name: string): boolean {
  return MUTATING_ONBOARDING_TOOL_NAMES.has(toSnakeToolKey(name));
}

export function isMutatingAdkTool(name: string): boolean {
  return (
    isMutatingResumeTool(name) ||
    isMutatingPortfolioTool(name) ||
    isMutatingContentGenTool(name) ||
    isMutatingLinkedInTool(name) ||
    isMutatingApplicationAssetTool(name) ||
    isMutatingOnboardingTool(name)
  );
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

/** User-facing label when ADK transfers to a named sub-agent. */
export function labelForTransferTarget(targetRaw: string): string {
  return handoffLabelForTarget(targetRaw);
}

function handoffLabelForTarget(targetRaw: string): string {
  const id = targetRaw.trim().toLowerCase().replace(/\s+/g, "_");
  switch (id) {
    case "resume_agent":
      return "Pulling your resume together…";
    case "linkedin_agent":
      return "Opening your LinkedIn profile context…";
    case "portfolio_agent":
      return "Reviewing your portfolio…";
    case "quick_summary_agent":
      return "Drafting your Quick Summary…";
    case "usp_agent":
      return "Crafting your unique selling points…";
    case "domain_profile_fit_agent":
      return "Building your Profile Fit cards…";
    case "portfolio_experience_projects_agent":
    case "portfolio_experience_agent":
    case "portfolio_projects_agent":
      return "Writing your portfolio experiences and projects…";
    case "elevator_pitch_agent":
      return "Drafting your elevator pitch…";
    case "who_am_i_agent":
      return "Working on your Who Am I video script…";
    case "portfolio_structure_agent":
      return "Updating your portfolio layout…";
    case "profile_pic_agent":
      return "Reviewing your profile photo…";
    case "cover_pic_agent":
      return "Reviewing your cover image…";
    case "headline_agent":
      return "Working on your LinkedIn headline…";
    case "about_agent":
      return "Working on your About section…";
    case "linkedin_experience_agent":
      return "Reviewing your LinkedIn experience…";
    case "linkedin_skills_agent":
      return "Tuning your LinkedIn skills…";
    case "content_gen_agent":
      return "Opening Content Lab…";
    case "top_funnel_topic_agent":
      return "Exploring thought-leadership angles…";
    case "middle_funnel_topic_agent":
      return "Exploring personal story angles…";
    case "bottom_funnel_topic_agent":
      return "Exploring open-to-roles angles…";
    case "top_funnel_draft_agent":
      return "Drafting your thought-leadership post…";
    case "middle_funnel_draft_agent":
      return "Drafting your story post…";
    case "bottom_funnel_draft_agent":
      return "Drafting your open-to-roles post…";
    case "topic_planner_agent":
      return "Planning your LinkedIn topic…";
    case "post_draft_agent":
      return "Coordinating your post workflow…";
    case "linkedin_post_creative_drafter":
      return "Crafting your post for the topic and tone…";
    case "linkedin_post_creative_improver":
      return "Refining your post based on your feedback…";
    case "post_draft_entry_agent":
      return "Starting your LinkedIn post…";
    case "linkedin_post_formatter":
      return "Polishing structure and flow…";
    case "linkedin_post_personalization_agent":
      return "Personalizing for your profile and tone…";
    case "linkedin_web_research_agent":
      return "Looking up recent facts and trends…";
    case "linkedin_post_publish_agent":
      return "Preparing to publish your post…";
    case "experience_agent":
      return "Going deeper on your work experience…";
    case "education_agent":
      return "Focusing on your education…";
    case "skills_agent":
      return "Polishing how your skills come across…";
    case "projects_agent":
      return "Highlighting your projects…";
    case "summary_agent":
      return "Focusing on your professional summary…";
    case "ats_agent":
      return "Reviewing your ATS score…";
    case "certifications_agent":
      return "Focusing on your certifications…";
    case "custom_sections_agent":
      return "Working on your custom resume sections…";
    case "jobs_agent":
      return "Opening your jobs journey…";
    case "job_board_agent":
      return "Searching the job board…";
    case "niche_discovery_agent":
      return "Narrowing your target niche…";
    case "application_tracker_agent":
      return "Checking your applications…";
    case "interviews_agent":
      return "Preparing interview practice…";
    case "studio_agent":
      return "Opening Studio…";
    case "application_assets_agent":
      return "Coordinating your application draft…";
    case "application_asset_intake_agent":
      return "Collecting role and company details…";
    case "cover_letter_draft_agent":
      return "Drafting your cover letter…";
    case "cold_email_draft_agent":
      return "Drafting your cold email…";
    case "referral_draft_agent":
      return "Drafting your referral message…";
    case "vpd_agent":
      return "Working on your value proposition…";
    case "vpd_introduction_agent":
      return "Drafting your VPD introduction…";
    case "vpd_problem_statements_agent":
      return "Crafting problem statements and strategies…";
    case "vpd_user_value_agent":
      return "Writing how you add value…";
    case "vpd_day_plan_agent":
      return "Building your 30-60-90 day plan…";
    case "vpd_company_value_agent":
      return "Writing value the company adds to you…";
    case "vpd_culture_fit_agent":
      return "Writing culture and values fit…";
    case "vpd_conclusion_agent":
      return "Drafting your VPD conclusion…";
    case "vpd_structure_agent":
      return "Adjusting VPD layout…";
    case "unicoach_agent":
      return "Looking up Unicoach guidance…";
    case "general_agent":
      return "Answering your question…";
    case "draft_missing_topic_agent":
      return "Choosing a topic before drafting…";
    case "funnel_missing_agent":
      return "Choosing your content funnel…";
    case "connection_agent":
      return "Drafting your connection request…";
    case "comment_agent":
      return "Crafting your comment…";
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

function linkedInSectionLabel(sectionName: string): string {
  const s = sectionName.trim().toLowerCase();
  if (s.includes("headline")) return "your LinkedIn headline";
  if (s.includes("about")) return "your About section";
  if (s.includes("skill")) return "your LinkedIn skills";
  if (s.includes("exp")) return "your LinkedIn experience";
  if (s === "pic" || s.includes("profile_pic") || s.includes("picture")) return "your profile photo";
  if (s.includes("cover")) return "your cover image";
  if (s.includes("connection") || s.includes("connect")) return "your connection request";
  if (s.includes("comment")) return "your comment draft";
  return "your LinkedIn profile";
}

function sectionLabel(sectionName: string): string {
  const s = sectionName.trim().toLowerCase();
  if (s.includes("headline")) return linkedInSectionLabel(s);
  if (s.includes("about") && !s.includes("resume")) return linkedInSectionLabel(s);
  if (s.includes("skill")) return "your skills";
  if (s.includes("exp")) return "your experience";
  if (s.includes("project")) return "your projects";
  if (s.includes("edu")) return "your education";
  if (s.includes("summary") || s === "profile") return "your summary";
  if (s.includes("cert")) return "your certifications";
  if (s.includes("connection") || s.includes("comment") || s === "pic" || s.includes("cover")) {
    return linkedInSectionLabel(s);
  }
  return "your resume";
}

export function resolveContentGenActivityLabelHint(message: string): string | undefined {
  const m = message.trim().toLowerCase();
  if (!m) return undefined;
  if (m.includes("improve my linkedin post draft") || m.includes("what would you like to improve")) {
    return "Refining your post based on your feedback…";
  }
  if (m.includes("write the full linkedin post draft")) {
    return "Crafting your post for the topic and tone…";
  }
  if (m.includes("help me choose a linkedin post topic")) {
    return "Exploring topic ideas…";
  }
  return undefined;
}

export function labelForAgent(author: string): string {
  const a = author.trim().toLowerCase().replace(/\s+/g, "_");
  switch (a) {
    case "unibot":
      return "Working on your request…";
    case "onboarding_agent":
      return "Building your profile…";
    case "resume_agent":
      return "Coordinating your resume…";
    case "ats_agent":
      return "Reviewing your ATS score…";
    case "jobs_agent":
      return "Coordinating your jobs journey…";
    case "job_board_agent":
      return "Searching the job board…";
    case "niche_discovery_agent":
      return "Narrowing your target niche…";
    case "application_tracker_agent":
      return "Reviewing your applications…";
    case "interviews_agent":
      return "Preparing interview practice…";
    case "studio_agent":
      return "Coordinating Studio…";
    case "vpd_agent":
    case "vpd_introduction_agent":
    case "vpd_problem_statements_agent":
    case "vpd_user_value_agent":
    case "vpd_day_plan_agent":
    case "vpd_company_value_agent":
    case "vpd_culture_fit_agent":
    case "vpd_conclusion_agent":
    case "vpd_structure_agent":
      return "Working on your value proposition…";
    case "unicoach_agent":
      return "Looking up Unicoach guidance…";
    case "general_agent":
      return "Answering your question…";
    case "draft_missing_topic_agent":
      return "Choosing a topic before drafting…";
    case "funnel_missing_agent":
      return "Choosing your content funnel…";
    case "linkedin_agent":
      return "Coordinating your LinkedIn profile…";
    case "portfolio_agent":
      return "Analyzing your portfolio…";
    case "quick_summary_agent":
      return "Drafting your Quick Summary…";
    case "usp_agent":
      return "Crafting your unique selling points…";
    case "domain_profile_fit_agent":
      return "Building your Profile Fit cards…";
    case "portfolio_experience_projects_agent":
    case "portfolio_experience_agent":
    case "portfolio_projects_agent":
      return "Writing your portfolio experiences and projects…";
    case "elevator_pitch_agent":
      return "Drafting your elevator pitch…";
    case "who_am_i_agent":
      return "Working on your Who Am I video script…";
    case "portfolio_structure_agent":
      return "Updating your portfolio layout…";
    case "profile_pic_agent":
      return "Reviewing your profile photo…";
    case "cover_pic_agent":
      return "Reviewing your cover image…";
    case "headline_agent":
      return "Improving your LinkedIn headline…";
    case "about_agent":
      return "Improving your About section…";
    case "content_gen_agent":
      return "Coordinating your LinkedIn post…";
    case "application_assets_agent":
      return "Coordinating your application draft…";
    case "application_asset_intake_agent":
      return "Collecting role and company details…";
    case "cover_letter_draft_agent":
      return "Drafting your cover letter…";
    case "cold_email_draft_agent":
      return "Drafting your cold email…";
    case "referral_draft_agent":
      return "Drafting your referral message…";
    case "top_funnel_topic_agent":
      return "Exploring thought-leadership angles…";
    case "middle_funnel_topic_agent":
      return "Exploring personal story angles…";
    case "bottom_funnel_topic_agent":
      return "Exploring open-to-roles angles…";
    case "top_funnel_draft_agent":
      return "Drafting your thought-leadership post…";
    case "middle_funnel_draft_agent":
      return "Drafting your story post…";
    case "bottom_funnel_draft_agent":
      return "Drafting your open-to-roles post…";
    case "topic_planner_agent":
      return "Exploring topic ideas…";
    case "post_draft_agent":
      return "Coordinating your post workflow…";
    case "cover_letter_reviewer":
    case "cold_email_reviewer":
    case "referral_reviewer":
      return "Polishing your draft…";
    case "studio_coverletter_sequential_runner":
    case "studio_coldemail_sequential_runner":
    case "studio_referral_sequential_runner":
      return "Starting your draft pipeline…";
    case "linkedin_post_creative_drafter":
      return "Crafting your post for the topic and tone…";
    case "linkedin_post_creative_improver":
      return "Refining your post based on your feedback…";
    case "post_draft_entry_agent":
      return "Starting your LinkedIn post…";
    case "linkedin_post_formatter":
      return "Polishing structure and flow…";
    case "linkedin_post_personalization_agent":
      return "Personalizing for your profile and tone…";
    case "linkedin_web_research_agent":
      return "Looking up recent facts and trends…";
    case "linkedin_post_publish_agent":
      return "Preparing to publish your post…";
    case "summary_agent":
      return "Shaping your professional summary…";
    case "linkedin_experience_agent":
      return "Improving your LinkedIn experience…";
    case "linkedin_skills_agent":
      return "Improving your LinkedIn skills…";
    case "experience_agent":
      return "Refining your work history…";
    case "education_agent":
      return "Reviewing your education…";
    case "skills_agent":
      return "Tuning your skills section…";
    case "projects_agent":
      return "Reviewing your projects…";
    case "certifications_agent":
      return "Reviewing your certifications…";
    case "custom_sections_agent":
      return "Reviewing your custom resume sections…";
    case "connection_agent":
      return "Working on your connection request…";
    case "comment_agent":
      return "Drafting your LinkedIn comment…";
    default:
      if (!a) return "Thinking…";
      return "Making progress on your request…";
  }
}

/**
 * Status while Gemini BuiltInPlanner thoughts stream — about understanding/planning,
 * not the same copy as tool/agent busy labels (no emoji).
 */
export function labelForThinkingAgent(author: string): string {
  const a = author.trim().toLowerCase().replace(/\s+/g, "_");
  switch (a) {
    case "unibot":
    case "":
      return "Breaking down your request…";
    case "resume_agent":
      return "Breaking down your resume request…";
    case "ats_agent":
      return "Understanding your ATS feedback more deeply…";
    case "jobs_agent":
      return "Breaking down your jobs request…";
    case "job_board_agent":
      return "Understanding job matches more deeply…";
    case "niche_discovery_agent":
      return "Understanding your niche more deeply…";
    case "application_tracker_agent":
      return "Breaking down your applications…";
    case "interviews_agent":
      return "Breaking down interview practice…";
    case "studio_agent":
      return "Breaking down your Studio request…";
    case "content_gen_agent":
      return "Breaking down your post request…";
    case "linkedin_agent":
      return "Breaking down your LinkedIn request…";
    case "portfolio_agent":
      return "Breaking down your portfolio request…";
    case "unicoach_agent":
      return "Understanding your Unicoach question more deeply…";
    case "general_agent":
      return "Understanding your question more deeply…";
    case "vpd_agent":
    case "vpd_introduction_agent":
    case "vpd_problem_statements_agent":
    case "vpd_user_value_agent":
    case "vpd_day_plan_agent":
    case "vpd_company_value_agent":
    case "vpd_culture_fit_agent":
    case "vpd_conclusion_agent":
    case "vpd_structure_agent":
      return "Breaking down your value proposition…";
    case "onboarding_agent":
      return "Breaking down your profile setup…";
    case "summary_agent":
    case "experience_agent":
    case "education_agent":
    case "skills_agent":
    case "projects_agent":
    case "certifications_agent":
    case "custom_sections_agent":
      return "Understanding this resume section more deeply…";
    case "cover_letter_draft_agent":
    case "cold_email_draft_agent":
    case "referral_draft_agent":
    case "application_assets_agent":
      return "Breaking down your application draft…";
    default:
      if (a.includes("linkedin") || a.includes("post") || a.includes("funnel") || a.includes("topic")) {
        return "Breaking down your content request…";
      }
      if (a.includes("portfolio")) {
        return "Breaking down your portfolio request…";
      }
      return "Breaking down your request…";
  }
}

function portfolioSectionActivityLabel(sectionKeyRaw: unknown): string {
  const key = String(sectionKeyRaw ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
  switch (key) {
    case "quick_summary":
      return "your Quick Summary";
    case "unique_selling_point":
    case "usp":
      return "your unique selling points";
    case "domain_profile_fit":
    case "profile_fit":
      return "your Profile Fit";
    case "portfolio_experience":
      return "your portfolio experiences";
    case "portfolio_projects":
      return "your portfolio projects";
    case "portfolio_pitch":
    case "elevator_pitch":
      return "your elevator pitch";
    default:
      return "your portfolio section";
  }
}

export function labelForToolCall(name: string, args?: Record<string, unknown>): string {
  if (isTransferTool(name)) {
    return labelForTransferTool(args);
  }

  const snakeKey = toSnakeToolKey(name);

  // ADK Task API: Unibot specialists are callable tools named like `jobs_agent`.
  if (/_agent$/.test(snakeKey) || snakeKey === "unibot") {
    return labelForAgent(snakeKey);
  }

  switch (snakeKey) {
    case "get_summary":
      return "Reviewing your summary…";
    case "get_resume":
      return "Reviewing your resume…";
    case "get_resume_improve_target":
      return "Checking the entry you want to improve…";
    case "get_writing_standards":
      return "Checking writing standards…";
    case "read_latest_user_message":
      return "Reading your latest message…";
    case "lookup_unibot_playbook":
      return "Choosing the best next step…";
    case "get_content_gen_context":
      return "Loading your profile for topic ideas…";
    case "fetch_user_personal_details":
      return "Loading your profile…";
    case "summarize_user_profile":
      return "Summarizing your background…";
    case "assess_profile_relevance_for_post":
      return "Checking if personal details help this post…";
    case "set_content_gen_topic":
      return "Saving your topic choice…";
    case "get_post_draft":
      return "Reading your existing post…";
    case "get_post_draft_handoff":
      return "Checking what you need for your post…";
    case "update_post_draft":
      return "Saving your updated draft…";
    case "schedule_linkedin_post":
      return "Scheduling your LinkedIn post…";
    case "publish_linkedin_post":
      return "Publishing your LinkedIn post…";
    case "suggest_unimad_navigation":
      return "Finding the right page…";
    case "get_content_gen_handoff":
      return "Routing your Content Lab request…";
    case "fetch_recommended_jobs":
      return "Finding jobs that match your profile…";
    case "search_jobs_for_user":
      return "Searching the job board…";
    case "fetch_user_desired_roles":
      return "Loading your target roles…";
    case "get_application_asset_draft":
      return "Reading your application draft…";
    case "generate_application_asset_draft":
      return "Generating your first draft…";
    case "generate_studio_initial_draft":
      return "Generating your first draft…";
    case "create_job_application":
      return "Linking your job application…";
    case "update_application_asset_draft":
      return "Updating your cover letter draft…";
    case "set_application_asset_context":
      return "Saving role and company context…";
    case "get_portfolio":
      return "Reviewing your portfolio…";
    case "get_profile":
      return "Reviewing your portfolio profile…";
    case "get_items":
      return "Reviewing your portfolio blocks…";
    case "get_item":
    case "get_block_by_heading":
      return "Reviewing a portfolio block…";
    case "get_page_block":
    case "get_page_blocks":
      return "Reviewing portfolio Page Blocks…";
    case "get_user_personalization":
      return "Loading your saved interview answers…";
    case "update_user_personalization":
      return "Saving your Who Am I answers…";
    case "upsert_portfolio_section_content":
      return `Updating ${portfolioSectionActivityLabel(args?.section_key)}…`;
    case "upsert_domain_profile_fit_skill_card":
      return args?.title ? `Adding Profile Fit card “${String(args.title)}”…` : "Adding a Profile Fit skill card…";
    case "get_domain_profile_fit_structure_example":
      return "Loading Profile Fit card structure…";
    case "get_section": {
      const sectionArg = readSectionNameArg(args).toLowerCase();
      if (["profile", "hero", "items", "blocks", "grid", "editor_content"].some(k => sectionArg.includes(k))) {
        return "Reviewing your portfolio…";
      }
      return `Reviewing ${sectionLabel(readSectionNameArg(args))}…`;
    }
    case "get_linkedin":
      return "Reviewing your LinkedIn profile…";
    case "get_linkedin_section":
      return `Reviewing ${linkedInSectionLabel(readSectionNameArg(args))}…`;
    case "present_linkedin_suggestions":
      return "Preparing copy-ready suggestions…";
    case "fetch_linkedin_profile_experiences":
    case "fetch_base_resume_experiences":
      return "Loading your experience history…";
    case "fetch_linkedin_profile_skills":
    case "fetch_base_resume_skills":
      return "Loading your skills…";
    case "fetch_base_resume":
      return "Loading your base resume…";
    case "fetch_application_job_context":
    case "read_resolved_job_listing_for_resume":
      return "Loading the job description…";
    case "resolve_job_board_listing":
      return "Pinning that job listing…";
    case "fetch_resume_ats_score":
      return args?.force === true || args?.force === "true" ? "Recalculating your ATS score…" : "Checking your ATS score…";
    case "tailor_resume_for_role":
      return "Building a resume for your target role…";
    case "tailor_resume_for_job":
    case "generate_resume_for_job_description":
      return "Tailoring your resume for this job…";
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
    case "get_certifications":
      return "Reviewing your certifications…";
    case "get_custom_sections":
      return "Reviewing your custom sections…";
    case "get_application_tracker_snapshot":
      return "Loading your application tracker…";
    case "update_application_tracker_status":
      return "Updating application status…";
    case "get_interview_prep_snapshot":
      return "Loading your interview prep…";
    case "generate_niche_discovery_questions":
      return "Preparing niche discovery questions…";
    case "refine_niche_with_discovery_answers":
      return "Refining your target niche…";
    case "get_onboarding_profile":
      return "Checking your profile draft…";
    case "add_onboarding_education":
      return "Saving your education…";
    case "add_onboarding_experience":
      return "Saving your experience…";
    case "mark_onboarding_experience_skipped":
      return "Noting you're a fresher…";
    case "add_onboarding_project":
      return "Saving your project…";
    case "set_onboarding_skills":
      return "Updating your skills…";
    case "find_education":
      return "Reviewing your education…";
    case "update_summary":
      return "Refreshing your summary…";
    case "update_education":
    case "add_education":
    case "remove_education":
      return "Refreshing your education…";
    case "update_experience":
    case "update_experience_description":
    case "add_experience":
    case "remove_experience":
    case "add_bullet":
    case "update_bullet":
    case "remove_bullet":
      return "Refreshing your experience…";
    case "add_skill":
    case "update_skill":
    case "remove_skill":
    case "replace_skills":
      return "Refreshing your skills…";
    case "add_project":
    case "update_project":
    case "remove_project":
      return "Refreshing your projects…";
    case "add_certification":
    case "update_certification":
    case "remove_certification":
      return "Refreshing your certifications…";
    case "add_custom_section":
    case "update_custom_section_title":
    case "remove_custom_section":
    case "add_custom_section_item":
    case "update_custom_section_item":
    case "update_custom_section_item_description":
    case "remove_custom_section_item":
      return "Refreshing your custom sections…";
    case "update_profile_field":
    case "update_profile":
      return "Updating your hero section…";
    case "update_contact_buttons":
      return "Updating contact buttons…";
    case "add_hero_contact_link":
      return "Adding a contact link…";
    case "add_block":
      return "Adding a portfolio block…";
    case "update_block":
    case "update_block_content":
    case "update_block_by_heading":
      return "Updating a portfolio block…";
    case "remove_block":
      return "Removing a portfolio block…";
    case "reorder_blocks":
      return "Reordering your blocks…";
    case "duplicate_block":
      return "Duplicating a portfolio block…";
    case "add_page_block":
      return "Adding a portfolio Page Block…";
    case "update_page_block":
      return "Updating a portfolio Page Block…";
    case "remove_page_block":
      return "Removing a portfolio Page Block…";
    case "reorder_page_blocks":
      return "Reordering portfolio Page Blocks…";
    case "duplicate_page_block":
      return "Duplicating a portfolio Page Block…";
    case "update_headline":
      return "Updating your LinkedIn headline…";
    case "update_about":
      return "Updating your About section…";
    case "update_experience":
      return "Updating your LinkedIn experience…";
    case "update_skills":
      return "Updating your LinkedIn skills…";
    case "update_connection_draft":
      return "Updating your connection request…";
    case "update_comment_draft":
      return "Updating your comment draft…";
    default:
      return `Working on ${humanizeUnknownToolName(name)}…`;
  }
}

function parsePostDraftPayload(response: Record<string, unknown>): Record<string, unknown> | null {
  const nested = response.response ?? response.result ?? response.output;
  if (typeof nested === "string") {
    try {
      const parsed = JSON.parse(nested) as unknown;
      return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }
  if (typeof nested === "object" && nested !== null && !Array.isArray(nested)) {
    return nested as Record<string, unknown>;
  }
  if (typeof response.body === "string" || typeof response.topic === "string") {
    return response;
  }
  return null;
}

/** User-facing label after a read-only tool returns (only when the result is noteworthy). */
export function labelForReadToolResponse(name: string, response: Record<string, unknown>): string | null {
  const key = toSnakeToolKey(name);
  if (key !== "get_post_draft" && key !== "get_post_draft_handoff") {
    return null;
  }

  const payload = parsePostDraftPayload(response);
  if (!payload) return null;

  if (typeof payload.error === "string" && payload.error.trim()) {
    return "Couldn't load your post — we'll start fresh…";
  }

  const body = typeof payload.body === "string" ? payload.body.trim() : "";
  if (!body) {
    return "No existing post yet — starting fresh…";
  }

  return null;
}

export function labelForMutatingToolResponse(name: string): string {
  switch (toSnakeToolKey(name)) {
    case "update_post_draft":
      return "Post draft saved — refreshing your view…";
    case "update_summary":
      return "Summary updated — refreshing your view…";
    case "update_education":
    case "add_education":
    case "remove_education":
      return "Education updated — refreshing your view…";
    case "update_experience":
    case "update_experience_description":
    case "add_experience":
    case "remove_experience":
    case "add_bullet":
    case "update_bullet":
    case "remove_bullet":
      return "Experience updated — refreshing your view…";
    case "add_skill":
    case "update_skill":
    case "remove_skill":
    case "replace_skills":
      return "Skills updated — refreshing your view…";
    case "add_project":
    case "update_project":
    case "remove_project":
      return "Projects updated — refreshing your view…";
    case "add_certification":
    case "update_certification":
    case "remove_certification":
      return "Certifications updated — refreshing your view…";
    case "add_custom_section":
    case "update_custom_section_title":
    case "remove_custom_section":
    case "add_custom_section_item":
    case "update_custom_section_item":
    case "update_custom_section_item_description":
    case "remove_custom_section_item":
      return "Custom sections updated — refreshing your view…";
    case "update_profile_field":
    case "update_profile":
      return "Hero section updated — refreshing your view…";
    case "update_contact_buttons":
      return "Contact buttons updated — refreshing your view…";
    case "add_hero_contact_link":
      return "Contact link added — refreshing your view…";
    case "add_block":
      return "Block added — refreshing your view…";
    case "update_block":
    case "update_block_content":
    case "update_block_by_heading":
    case "upsert_portfolio_section_content":
    case "upsert_domain_profile_fit_skill_card":
      return "Portfolio draft updated — refreshing your view…";
    case "remove_block":
      return "Block removed — refreshing your view…";
    case "reorder_blocks":
      return "Blocks reordered — refreshing your view…";
    case "duplicate_block":
      return "Block duplicated — refreshing your view…";
    case "add_page_block":
      return "Page Block added — refreshing your view…";
    case "update_page_block":
      return "Page Block updated — refreshing your view…";
    case "remove_page_block":
      return "Page Block removed — refreshing your view…";
    case "reorder_page_blocks":
      return "Page Blocks reordered — refreshing your view…";
    case "duplicate_page_block":
      return "Page Block duplicated — refreshing your view…";
    case "add_onboarding_education":
      return "Education saved — refreshing your profile…";
    case "add_onboarding_experience":
      return "Experience saved — refreshing your profile…";
    case "mark_onboarding_experience_skipped":
      return "Noted — moving on…";
    case "add_onboarding_project":
      return "Project saved — refreshing your profile…";
    case "set_onboarding_skills":
      return "Skills saved — refreshing your profile…";
    default:
      return "Changes saved — refreshing your view…";
  }
}

/** Chat bubble copy after a mutating tool when the agent streamed no prose (tool-only turns). */
export function completionMessageForMutatingTool(name: string): string | null {
  switch (toSnakeToolKey(name)) {
    case "update_summary":
      return "I've updated your professional summary. Review the highlighted changes in the editor — accept to save or discard to revert.";
    case "update_education":
    case "add_education":
    case "remove_education":
      return "I've updated your education section. Review the highlighted changes in the editor.";
    case "update_experience":
    case "update_experience_description":
    case "add_experience":
    case "remove_experience":
    case "add_bullet":
    case "update_bullet":
    case "remove_bullet":
      return "I've updated your experience section. Review the highlighted changes in the editor.";
    case "add_skill":
    case "update_skill":
    case "remove_skill":
    case "replace_skills":
      return "I've updated your skills section. Review the highlighted changes in the editor.";
    case "add_project":
    case "update_project":
    case "remove_project":
      return "I've updated your projects section. Review the highlighted changes in the editor.";
    case "add_certification":
    case "update_certification":
    case "remove_certification":
      return "I've updated your certifications. Review the highlighted changes in the editor.";
    case "add_custom_section":
    case "update_custom_section_title":
    case "remove_custom_section":
    case "add_custom_section_item":
    case "update_custom_section_item":
    case "update_custom_section_item_description":
    case "remove_custom_section_item":
      return "I've updated your custom sections. Review the highlighted changes in the editor.";
    case "update_post_draft":
      return "I've updated your post draft. Review the changes when you're ready.";
    case "set_content_gen_topic":
      return "Topic saved. You can continue refining or start drafting.";
    default:
      return null;
  }
}
