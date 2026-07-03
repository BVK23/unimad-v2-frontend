"use server";

import { authedFetch } from "@/lib/authed-fetch";
import { messageFromFailedResponse } from "@/utils/message-from-failed-response";
import type { Application, CreateApplicationInput, UpdateApplicationInput } from "../types";

/**
 * GET /api/applications/
 * Returns list of applications for the current user.
 */
export async function fetchApplications(): Promise<Application[]> {
  const res = await authedFetch("/api/applications/", { method: "GET" });

  if (res.status === 404) {
    return [];
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    const text = await res.text();
    throw new Error(`Expected JSON from /api/applications/: ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as { applications?: Application[] };

  if (!res.ok) {
    throw new Error((data as { error?: string })?.error ?? "Failed to fetch applications");
  }

  return data.applications ?? [];
}

/**
 * POST /api/applications/create/
 */
export async function createApplication(input: CreateApplicationInput): Promise<{ application_id: string } & Application> {
  const body = {
    role: input.role,
    company: input.company,
    job_description: input.job_description ?? "",
    applied_date: input.applied_date ?? null,
    interview_date: input.interview_date ?? null,
    status: input.status ?? "draft",
    ...(input.job_id != null && input.job_id !== "" && { job_id: input.job_id }),
  };

  const res = await authedFetch("/api/applications/create/", {
    method: "POST",
    body: JSON.stringify(body),
  });

  const bodyText = await res.text();
  let data = {} as { application_id?: string; error?: string };
  try {
    data = JSON.parse(bodyText) as { application_id?: string; error?: string };
  } catch {
    // not JSON
  }

  if (!res.ok) {
    throw new Error(messageFromFailedResponse(res.status, bodyText, data.error ?? "Failed to create application"));
  }

  return data as { application_id: string } & Application;
}

/**
 * PUT /api/applications/:id/update/
 */
export async function updateApplication(applicationId: string, input: UpdateApplicationInput): Promise<Application> {
  const body = {
    role: input.role,
    company: input.company,
    job_description: input.job_description ?? "",
    applied_date: input.applied_date ?? null,
    interview_date: input.interview_date ?? null,
    status: input.status ?? "draft",
  };

  const res = await authedFetch(`/api/applications/${encodeURIComponent(applicationId)}/update/`, {
    method: "PUT",
    body: JSON.stringify(body),
  });

  const bodyText = await res.text();
  let data = {} as Application & { error?: string };
  try {
    data = JSON.parse(bodyText) as Application & { error?: string };
  } catch {
    // not JSON
  }

  if (!res.ok) {
    throw new Error(messageFromFailedResponse(res.status, bodyText, data.error ?? "Failed to update application"));
  }

  return data as Application;
}

/**
 * DELETE /api/applications/:id/delete/
 */
export async function deleteApplication(applicationId: string): Promise<{ success?: boolean }> {
  const res = await authedFetch(`/api/applications/${encodeURIComponent(applicationId)}/delete/`, {
    method: "DELETE",
  });

  const data = (await res.json().catch(() => ({}))) as { error?: string };

  if (!res.ok) {
    throw new Error(data.error ?? "Failed to delete application");
  }

  return data as { success?: boolean };
}
