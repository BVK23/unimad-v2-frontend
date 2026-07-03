"use server";

import { COACH_ACT_AS_HEADER } from "@/constants/coach-act-as";
import { authedFetch as libAuthedFetch, readCoachActAsSession } from "@/lib/authed-fetch";
import { cookies } from "next/headers";
import type { AtsScorePayload, CalculateAtsScoreResult, ResumeAtsCacheResult } from "../api/ats-types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Reads `NEXT_PUBLIC_BACKEND_URL` from environment.
 * Throws at call‑time if the variable was never set.
 */
function getBackendUrl(): string {
  const url = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_BACKEND_URL is not defined. Add it to your .env.local file.");
  }
  return url.replace(/\/+$/, ""); // strip trailing slashes
}

/**
 * Shared secret for `GET /api/public-asset-data/` – must match Django `settings.SECRET_KEY`.
 * V1 used `JWT_SECRET`; we accept that name too for compatibility.
 */
function getPublicAssetAuthSecret(): string {
  const secret = process.env.UNIMAD_PUBLIC_ASSET_SECRET ?? process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      "UNIMAD_PUBLIC_ASSET_SECRET or JWT_SECRET is not defined. Set one to match the backend SECRET_KEY for public resume URLs."
    );
  }
  return secret;
}

/**
 * Auth token and scheme. Cookie holds JWT (Bearer) or Django Token (Token).
 */
type AuthResult = { token: string; scheme: "Token" | "Bearer" };

/** True if the value looks like a JWT (three base64url segments). */
function looksLikeJwt(value: string): boolean {
  return /^ey[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*$/.test(value.trim());
}

/**
 * Reads the auth token from the `_ut` cookie (Django backend).
 * Scheme: if token looks like a JWT (ey...), use Bearer; otherwise Token (Django REST Token).
 * Throws "Unauthorized" if no cookie is present.
 */
async function getAuth(): Promise<AuthResult> {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get("_ut")?.value ?? cookieStore.get("__Host-ut")?.value;
  if (!cookieToken) {
    throw new Error("Unauthorized");
  }
  const scheme: AuthResult["scheme"] = looksLikeJwt(cookieToken) ? "Bearer" : "Token";
  return { token: cookieToken, scheme };
}

async function authedFetch(path: string, options: RequestInit = {}): Promise<Response> {
  return libAuthedFetch(path, options);
}

async function authedFetchFormData(path: string, options: RequestInit & { body: FormData }): Promise<Response> {
  const backendUrl = getBackendUrl();
  const { token, scheme } = await getAuth();
  const actAs = await readCoachActAsSession();
  const headers: Record<string, string> = {
    Authorization: `${scheme} ${token}`,
    ...(options.headers as Record<string, string> | undefined),
  };
  if (actAs?.studentProfileId) {
    headers[COACH_ACT_AS_HEADER] = actAs.studentProfileId;
  }
  return fetch(`${backendUrl}${path}`, {
    ...options,
    headers,
    cache: "no-store",
  });
}

// ---------------------------------------------------------------------------
// Types for server‑action return values
// ---------------------------------------------------------------------------

export interface GenerateResumeParams {
  application_id?: string;
  jd?: string;
  company?: string;
  role?: string;
  template?: string;
  resumeData?: Record<string, unknown>;
}

export interface DuplicateError {
  error: string;
  message: string;
  resume_id?: string;
  application_id?: string;
  duplicate?: boolean;
}

export interface ExtractedResumeData {
  skills?: unknown[];
  experiences?: unknown[];
  educations?: unknown[];
  projects?: unknown[];
}

export interface ExtractResumePreviewResult {
  status: string;
  message?: string;
  extracted_sections?: string[];
  extracted_data?: ExtractedResumeData | { data?: ExtractedResumeData };
}

/** Response from POST /api/resume/extract-from-pdf/ (base resume PDF extraction). */
export interface ExtractResumeToBaseResult {
  status: string;
  message?: string;
  extracted_sections?: string[];
  extracted_data?: ExtractedResumeData | { data?: ExtractedResumeData };
  resume_id?: string;
  resume_data?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Server Actions
// ---------------------------------------------------------------------------

/**
 * Generate a brand‑new resume via the AI pipeline.
 *
 * POST `/api/resume/generate/`
 *
 * On HTTP 409 (resume already exists for the application) the backend returns
 * `{ error, message, resume_id, application_id, duplicate: true }`.
 */
export async function generateResume(jobData?: GenerateResumeParams): Promise<{ id: string } | { error: DuplicateError }> {
  const res = await authedFetch("/api/resume/generate/", {
    method: "POST",
    body: JSON.stringify(jobData ?? {}),
  });

  const data = await res.json();

  if (res.status === 409) {
    return { error: data as DuplicateError };
  }

  if (!res.ok) {
    const message =
      (typeof data?.error === "string" && data.error) || (typeof data?.message === "string" && data.message) || "Failed to generate resume";
    throw new Error(message);
  }

  const id = data?.id != null ? String(data.id) : "";
  if (!id) {
    throw new Error("Resume was created but no ID was returned.");
  }

  return { id };
}

/**
 * Extract resume data from an uploaded PDF (preview only, no DB write).
 *
 * POST `/api/extract-resume-data-preview/`
 *
 * The caller must supply a FormData with a `resume` file field.
 */
export async function extractResumePreview(formData: FormData): Promise<ExtractResumePreviewResult> {
  const res = await authedFetchFormData("/api/extract-resume-data-preview/", {
    method: "POST",
    body: formData,
  });

  const data = (await res.json().catch(() => ({}))) as ExtractResumePreviewResult;

  if (!res.ok) {
    throw new Error((data as any)?.error ?? data?.message ?? "Failed to extract resume");
  }

  return data;
}

/**
 * Set a resume as the user's base resume (for PDF extraction flows).
 * POST `/api/resume/set-base/` with body `{ id: resumeId }`.
 * On success, invalidate ['resumes'] so the list refetches.
 */
export async function setBaseResume(resumeId: string): Promise<Record<string, unknown>> {
  const res = await authedFetch("/api/resume/set-base/", {
    method: "POST",
    body: JSON.stringify({ id: resumeId }),
  });

  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;

  if (!res.ok) {
    throw new Error((data?.error as string) ?? (data?.message as string) ?? "Failed to set base resume");
  }

  return data;
}

/**
 * Extract resume data from an uploaded PDF and upsert into the user's base resume.
 * POST `/api/resume/extract-from-pdf/` (multipart/form-data, field name `resume`).
 * Returns resume_id and resume_data on success; throws on failure or status !== "success".
 */
export async function extractResumeToBaseResume(formData: FormData): Promise<ExtractResumeToBaseResult> {
  const res = await authedFetchFormData("/api/resume/extract-from-pdf/", {
    method: "POST",
    body: formData,
  });

  const data = (await res.json().catch(() => ({}))) as ExtractResumeToBaseResult;

  if (!res.ok) {
    const errPayload = data as unknown as Record<string, unknown>;
    throw new Error((errPayload?.error as string) ?? data?.message ?? "Failed to extract resume to base");
  }

  if (data.status !== "success") {
    throw new Error(data?.message ?? "Extraction did not succeed");
  }

  return data;
}

/**
 * Fetch every resume belonging to the current user.
 *
 * GET `/api/resume/`
 *
 * Returns `{ assetData: [...] }` on success.
 * Returns `{}` when user has no resumes or a 404 is returned.
 */
export async function fetchUserResumes(): Promise<{
  assetData?: Record<string, unknown>[];
}> {
  const res = await authedFetch("/api/resume/");

  if (res.status === 404) return {};

  if (!res.ok) {
    throw new Error("Failed to fetch resumes");
  }

  return res.json();
}

/**
 * Fetch the full content of a single resume.
 *
 * GET `/api/resume/content/?id=<resumeId>`
 *
 * Returns `{ resumeData: { ... } }`.
 */
export async function fetchResumeContent(resumeId: string): Promise<{ resumeData: Record<string, unknown> }> {
  const res = await authedFetch(`/api/resume/content/?id=${encodeURIComponent(resumeId)}`);

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error ?? "Failed to fetch resume content");
  }

  return res.json();
}

/**
 * Create a new resume in the backend (no AI). Use when the resume has no backend id yet.
 *
 * POST `/api/resume/create/`
 *
 * The `resumeData` payload should be in backend shape (use the mapper).
 * Returns `{ id: string, response: string, resume_data: { ... } }`.
 */
export async function createResume(
  resumeData: Record<string, unknown>
): Promise<{ id: string; response: string; resume_data: Record<string, unknown> }> {
  const res = await authedFetch("/api/resume/create/", {
    method: "POST",
    body: JSON.stringify(resumeData),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error ?? "Failed to create resume");
  }

  return res.json();
}

/**
 * Persist updated resume data back to Django.
 *
 * POST `/api/resume/update/`
 *
 * The `resumeData` payload should already be in backend shape
 * (use the mapper before calling this).
 *
 * Returns `{ response: string, resume_data: { ... } }`.
 */
export async function updateResumeContent(
  resumeId: string,
  resumeData: Record<string, unknown>
): Promise<{ response: string; resume_data: Record<string, unknown> }> {
  const res = await authedFetch("/api/resume/update/", {
    method: "POST",
    body: JSON.stringify({ id: resumeId, ...resumeData }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error ?? "Failed to update resume");
  }

  return res.json();
}

/**
 * Duplicate an existing resume.
 *
 * POST `/api/resume/duplicate/`
 *
 * Returns `{ id: string }` on success.
 */
export async function duplicateResume(resumeId: string): Promise<{ id: string } | { error: string; error_code?: string }> {
  const res = await authedFetch("/api/resume/duplicate/", {
    method: "POST",
    body: JSON.stringify({ id: resumeId }),
  });

  const data = await res.json();

  if (!res.ok) {
    return {
      error: data?.error ?? "Failed to duplicate resume",
      error_code: data?.error_code,
    };
  }

  return data as { id: string };
}

/**
 * Record a resume PDF download (increment count and set last_downloaded_at).
 *
 * POST `/api/resume/record-download/`
 */
export async function recordResumeDownload(resumeId: string): Promise<{
  response: string;
  downloads: number;
  resume_data: Record<string, unknown>;
}> {
  const res = await authedFetch("/api/resume/record-download/", {
    method: "POST",
    body: JSON.stringify({ id: resumeId }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error ?? "Failed to record download");
  }
  return res.json();
}

/**
 * Delete a resume permanently.
 *
 * POST `/api/resume/delete/`
 *
 * Returns `true` on success, throws otherwise.
 */
export async function deleteResume(resumeId: string): Promise<boolean> {
  const res = await authedFetch("/api/resume/delete/", {
    method: "POST",
    body: JSON.stringify({ id: resumeId }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error ?? "Failed to delete resume");
  }

  return true;
}

type AtsApiBody = {
  error?: string;
  code?: string;
  ats_score?: AtsScorePayload | null;
  resume_id?: string;
  application_id?: string;
  role?: string;
  company?: string;
  scored_at?: string | null;
  resume_updated_at?: string | null;
  ats_calc_count?: number;
  from_cache?: boolean;
  score_stale?: boolean;
  history_count?: number;
};

function parseAtsMeta(data: AtsApiBody) {
  return {
    scored_at: typeof data.scored_at === "string" ? data.scored_at : null,
    resume_updated_at: typeof data.resume_updated_at === "string" ? data.resume_updated_at : null,
    ats_calc_count: typeof data.ats_calc_count === "number" ? data.ats_calc_count : 0,
    from_cache: Boolean(data.from_cache),
    score_stale: Boolean(data.score_stale),
    history_count: typeof data.history_count === "number" ? data.history_count : undefined,
  };
}

/**
 * Cached ATS score for a resume (no LLM). GET `/api/resume/ats-score/?resume_id=`
 */
export async function fetchResumeAtsScore(resumeId: string): Promise<ResumeAtsCacheResult> {
  const trimmed = typeof resumeId === "string" ? resumeId.trim() : "";
  if (!trimmed) {
    return { ok: false, error: "resume_id is required", status: 400 };
  }

  const res = await authedFetch(`/api/resume/ats-score/?resume_id=${encodeURIComponent(trimmed)}`, {
    method: "GET",
  });

  const data = (await res.json().catch(() => ({}))) as AtsApiBody;

  if (!res.ok) {
    const err = typeof data.error === "string" && data.error.trim() ? data.error : "Failed to load ATS score";
    return { ok: false, error: err, status: res.status };
  }

  const ats_score = data.ats_score && typeof data.ats_score === "object" ? (data.ats_score as AtsScorePayload) : null;

  return {
    ok: true,
    ats_score,
    resume_id: typeof data.resume_id === "string" ? data.resume_id : trimmed,
    ...parseAtsMeta(data),
  };
}

/**
 * ATS compatibility score for a resume.
 * General quality is rule-based; job-match uses LLM when linked application has a JD.
 *
 * POST `/api/resume/ats-score/` with `{ resume_id, force? }`.
 */
export async function calculateResumeAtsScore(resumeId: string, options?: { force?: boolean }): Promise<CalculateAtsScoreResult> {
  const trimmed = typeof resumeId === "string" ? resumeId.trim() : "";
  if (!trimmed) {
    return { ok: false, error: "resume_id is required", status: 400 };
  }

  const res = await authedFetch("/api/resume/ats-score/", {
    method: "POST",
    body: JSON.stringify({
      resume_id: trimmed,
      force: Boolean(options?.force),
      recalculate: Boolean(options?.force),
    }),
  });

  const data = (await res.json().catch(() => ({}))) as AtsApiBody;

  if (!res.ok) {
    const err = typeof data.error === "string" && data.error.trim() ? data.error : "Failed to calculate ATS score";
    return {
      ok: false,
      error: err,
      status: res.status,
      code: typeof data.code === "string" ? data.code : undefined,
    };
  }

  if (!data.ats_score || typeof data.ats_score !== "object") {
    return { ok: false, error: "Invalid ATS score response from server", status: 502 };
  }

  return {
    ok: true,
    ats_score: data.ats_score,
    resume_id: typeof data.resume_id === "string" ? data.resume_id : trimmed,
    application_id: data.application_id != null ? String(data.application_id) : undefined,
    role: typeof data.role === "string" ? data.role : undefined,
    company: typeof data.company === "string" ? data.company : undefined,
    ...parseAtsMeta(data),
  };
}

// ---------------------------------------------------------------------------
// Published resume (public URL)
// ---------------------------------------------------------------------------

export type PublishResumeResult = { ok: true; slug: string } | { ok: false; error: string; error_code?: string };

/**
 * Publish resume to a public slug. Backend stores snapshot on `PublishedAsset` and updates `Resume.slug`.
 *
 * POST `/api/publish-asset/` with `{ assetType: "resume", content, slug }`.
 * `content` must be Django-shaped and include `id` / `resume_id` matching the resume.
 */
export async function publishResumeAsset(content: Record<string, unknown>, slug: string): Promise<PublishResumeResult> {
  const trimmed = typeof slug === "string" ? slug.trim() : "";
  if (!trimmed) {
    return { ok: false, error: "Please enter a link name" };
  }

  const res = await authedFetch("/api/publish-asset/", {
    method: "POST",
    body: JSON.stringify({ assetType: "resume", content, slug: trimmed }),
  });

  const data = (await res.json().catch(() => ({}))) as { slug?: string; error?: string; error_code?: string };

  if (!res.ok) {
    return {
      ok: false,
      error: data?.error ?? "Failed to publish resume",
      error_code: data?.error_code,
    };
  }

  const outSlug = data.slug ?? trimmed;
  return { ok: true, slug: outSlug };
}

export type FetchPublicResumeResult = { ok: true; assetData: Record<string, unknown> } | { ok: false; error: string; status: number };

/**
 * Load published resume JSON for the public page. No user auth – uses `X-Unimad-Auth`.
 *
 * GET `/api/public-asset-data/?assetType=resume&slug=...`
 */
export async function fetchPublicResumeBySlug(resumeSlug: string): Promise<FetchPublicResumeResult> {
  const backendUrl = getBackendUrl();
  const secret = getPublicAssetAuthSecret();
  const url = `${backendUrl}/api/public-asset-data/?assetType=${encodeURIComponent("resume")}&slug=${encodeURIComponent(resumeSlug)}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Unimad-Auth": secret,
    },
    cache: "no-store",
  });

  const data = (await res.json().catch(() => ({}))) as { assetData?: Record<string, unknown>; error?: string };

  if (!res.ok) {
    return {
      ok: false,
      error: data?.error ?? "Could not load this public resume",
      status: res.status,
    };
  }

  if (!data.assetData || typeof data.assetData !== "object") {
    return { ok: false, error: "No resume data was returned", status: 404 };
  }

  return { ok: true, assetData: data.assetData };
}
