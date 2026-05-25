"use server";

import { cookies } from "next/headers";
import type {
  JourneyState,
  UnicoachCommentsResponse,
  UnicoachInitResponse,
  UnicoachProfileInfo,
  UnicoachStudentMeta,
  UnicoachStudentsByStage,
} from "../types";

function getBackendUrl(): string {
  const url = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_BACKEND_URL is not defined. Add it to your .env.local file.");
  }
  return url.replace(/\/+$/, "");
}

type AuthResult = { token: string; scheme: "Token" | "Bearer" };

function looksLikeJwt(value: string): boolean {
  return /^ey[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*$/.test(value.trim());
}

async function getAuth(): Promise<AuthResult> {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get("_ut")?.value ?? cookieStore.get("__Host-ut")?.value;
  if (!cookieToken) {
    throw new Error("Unauthorized");
  }
  return {
    token: cookieToken,
    scheme: looksLikeJwt(cookieToken) ? "Bearer" : "Token",
  };
}

function getAuthCookieBaseOptions(): {
  path: string;
  httpOnly: boolean;
  sameSite: "lax" | "none";
  secure?: boolean;
  domain?: string;
} {
  const backend = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";
  const isLocal = backend.includes("localhost") || backend.includes("127.0.0.1");
  if (isLocal) {
    return { path: "/", httpOnly: true, sameSite: "lax" };
  }
  const domain = process.env.NEXT_PUBLIC_COOKIE_DOMAIN ?? process.env.NEXT_PUBLIC_DOMAIN;
  return {
    path: "/",
    httpOnly: true,
    sameSite: "none",
    secure: true,
    ...(domain ? { domain } : {}),
  };
}

async function authedFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const backendUrl = getBackendUrl();
  const { token, scheme } = await getAuth();
  return fetch(`${backendUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `${scheme} ${token}`,
      ...(options.headers as Record<string, string> | undefined),
    },
    cache: "no-store",
  });
}

export async function postUnicoachInit(): Promise<UnicoachInitResponse> {
  const cookieStore = await cookies();
  const ct = cookieStore.get("_ct")?.value;
  const coach_token = ct && ct.length > 0 ? ct : null;
  const res = await authedFetch("/api/unicoach-data/", {
    method: "POST",
    body: JSON.stringify({ coach_token }),
  });
  const data = (await res.json().catch(() => ({}))) as UnicoachInitResponse;
  if (!res.ok) {
    return { subscribed: false, error: data?.error ?? "Failed to load Unicoach" };
  }
  return data;
}

export async function updateUnicoachStudentMeta(payload: {
  userId: string;
  program_start_date?: string | null;
  closed_by?: string | null;
  conversion_mode?: string | null;
}): Promise<{ student_meta?: UnicoachStudentMeta }> {
  const body: Record<string, unknown> = {
    user_id: payload.userId,
  };
  if ("program_start_date" in payload) body.program_start_date = payload.program_start_date;
  if ("closed_by" in payload) body.closed_by = payload.closed_by;
  if ("conversion_mode" in payload) body.conversion_mode = payload.conversion_mode;
  const res = await authedFetch("/api/unicoach/student-meta/", {
    method: "POST",
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string })?.error ?? "Failed to update student meta");
  }
  return data as { student_meta?: UnicoachStudentMeta };
}

export async function fetchUnicoachJourneyState(targetUserId?: string | null): Promise<JourneyState> {
  const path =
    targetUserId != null && String(targetUserId).length > 0
      ? `/api/unicoach/journey-state/?user_id=${encodeURIComponent(String(targetUserId))}`
      : "/api/unicoach/journey-state/";
  const res = await authedFetch(path);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string })?.error ?? "Failed to fetch journey state");
  }
  return data as JourneyState;
}

export async function postJourneyChecklist(payload: {
  stage_id: string;
  task_id: string;
  completed: boolean;
  user_id?: string | null;
}): Promise<{ journey_checklist: Record<string, unknown>; ux_stage: string }> {
  const body: Record<string, unknown> = {
    stage_id: payload.stage_id,
    task_id: payload.task_id,
    completed: payload.completed,
  };
  if (payload.user_id) {
    body.user_id = payload.user_id;
  }
  const res = await authedFetch("/api/unicoach/journey-checklist/", {
    method: "POST",
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string })?.error ?? "Failed to update checklist");
  }
  return data as { journey_checklist: Record<string, unknown>; ux_stage: string };
}

export async function postJourneyAdvance(payload: {
  action: string;
  user_id?: string | null;
}): Promise<Partial<JourneyState> & { error?: string }> {
  const body: Record<string, unknown> = { action: payload.action };
  if (payload.user_id) {
    body.user_id = payload.user_id;
  }
  const res = await authedFetch("/api/unicoach/journey-advance/", {
    method: "POST",
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string })?.error ?? "Failed to advance journey");
  }
  return data as Partial<JourneyState>;
}

export async function fetchUnicoachProfileInfo(userId?: string | null): Promise<UnicoachProfileInfo> {
  let path = "/api/unicoach-info/";
  if (userId) {
    path += `?user_id=${encodeURIComponent(userId)}`;
  }
  const res = await authedFetch(path, { method: "GET" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string })?.error ?? "Failed to fetch Unicoach profile");
  }
  return data as UnicoachProfileInfo;
}

export async function fetchUnicoachComments(params: {
  sectionName: string;
  userId?: string | null;
  page?: number;
  pageSize?: number;
}): Promise<UnicoachCommentsResponse> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 100;
  const q = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
    section_name: params.sectionName,
  });
  if (params.userId) {
    q.set("user_id", params.userId);
  }
  const res = await authedFetch(`/api/unicoach/get-comments?${q.toString()}`, { method: "GET" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string })?.error ?? "Failed to fetch comments");
  }
  return data as UnicoachCommentsResponse;
}

export async function addUnicoachComment(payload: {
  sectionName: string;
  message: string;
  userId?: string | null;
}): Promise<{ message?: string }> {
  const body: Record<string, unknown> = {
    action: "add",
    section_name: payload.sectionName,
    message: payload.message,
  };
  if (payload.userId) {
    body.user_id = payload.userId;
  }
  const res = await authedFetch("/api/unicoach/manage-comments", {
    method: "POST",
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string })?.error ?? "Failed to send message");
  }
  return data as { message?: string };
}

export async function markUnicoachMessagesRead(payload: { sectionName: string; userId?: string | null }): Promise<void> {
  const body: Record<string, unknown> = {
    section_name: payload.sectionName,
  };
  if (payload.userId) {
    body.user_id = payload.userId;
  }
  const res = await authedFetch("/api/unicoach/mark-messages-read", {
    method: "POST",
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string })?.error ?? "Failed to mark messages read");
  }
}

export async function manageUnicoachTodos(
  payload: Record<string, unknown>,
  options: { targetUserId?: string | null } = {}
): Promise<unknown> {
  const todoId = payload.action === "update" || payload.action === "delete" ? (payload.todo_id as string | undefined) : null;
  const q = new URLSearchParams();
  if (todoId) {
    q.set("todo_id", todoId);
  }
  const suffix = q.toString() ? `?${q.toString()}` : "";
  const body: Record<string, unknown> = { ...payload };
  const tid = options.targetUserId;
  if (tid) {
    body.user_id = tid;
  }
  const res = await authedFetch(`/api/unicoach/manage-todos${suffix}`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string })?.error ?? "Failed to update todos");
  }
  return data;
}

export async function fetchUnicoachStudentsByStage(): Promise<UnicoachStudentsByStage> {
  const res = await authedFetch("/api/unicoach/students-by-stage/", { method: "GET" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string })?.error ?? "Failed to fetch students by stage");
  }
  return data as UnicoachStudentsByStage;
}

export async function updateUnicoachStudentCalls(payload: {
  userId: number;
  targetStage?: string;
  enableCallNumber?: number | null;
}): Promise<unknown> {
  const body: Record<string, unknown> = { user_id: payload.userId };
  if (payload.enableCallNumber != null) {
    body.enable_call_number = payload.enableCallNumber;
  } else if (payload.targetStage != null) {
    body.target_stage = payload.targetStage;
  }
  const res = await authedFetch("/api/unicoach/update-student-calls/", {
    method: "POST",
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string })?.error ?? "Failed to update student calls");
  }
  return data;
}

export async function switchUnicoachUser(userEmail: string): Promise<void> {
  const cookieStore = await cookies();
  const coachToken = cookieStore.get("_ct")?.value ?? null;
  const res = await authedFetch("/api/unicoach-switch/", {
    method: "POST",
    body: JSON.stringify({
      user_email: userEmail,
      coach_token: coachToken,
    }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    access_token?: string;
    refresh_token?: string;
    coach_token?: string | null;
  };
  if (!res.ok) {
    throw new Error(data?.error ?? "Failed to switch user");
  }
  if (!data.access_token || !data.refresh_token) {
    throw new Error("Invalid switch response");
  }
  const base = getAuthCookieBaseOptions();
  cookieStore.set("_ut", data.access_token, base);
  cookieStore.set("_rt", data.refresh_token, base);
  if (data.coach_token) {
    cookieStore.set("_ct", data.coach_token, base);
  } else {
    cookieStore.set("_ct", "", { ...base, maxAge: 0 });
  }
}

export async function createUnicoachOrder(
  discountCode: string | null,
  options: { isRemainingPartialPayment?: boolean } = {}
): Promise<{ id: string; amount: number; currency: string }> {
  const body: Record<string, unknown> = {};
  if (options.isRemainingPartialPayment) {
    body.is_remaining_partial_payment = true;
  } else if (discountCode?.trim()) {
    body.discount_code = discountCode.trim();
  }
  const res = await authedFetch("/api/create-unicoach-order/", {
    method: "POST",
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string })?.error ?? "Failed to create order");
  }
  return data as { id: string; amount: number; currency: string };
}

export async function verifyUnicoachPayment(checkoutResponse: Record<string, string>): Promise<{ verified: boolean; message?: string }> {
  const res = await authedFetch("/api/verify-unicoach-payment/", {
    method: "POST",
    body: JSON.stringify({ checkoutResponse }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { message?: string })?.message ?? "Payment verification failed");
  }
  return data as { verified: boolean; message?: string };
}

export async function validateUnicoachDiscount(discountCode: string): Promise<{
  valid: boolean;
  discount_amount?: number;
  message?: string;
}> {
  const res = await authedFetch("/api/validate-unicoach-discount/", {
    method: "POST",
    body: JSON.stringify({ discount_code: discountCode }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { message?: string })?.message ?? "Failed to validate discount");
  }
  return data as { valid: boolean; discount_amount?: number; message?: string };
}

export async function fetchUserDataForPaymentPrefill(): Promise<{
  firstName?: string;
  email?: string;
  fullName?: string;
}> {
  const res = await authedFetch("/api/user-data/", { method: "GET" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {};
  }
  const d = data as { firstName?: string; email?: string; fullName?: string; name?: string };
  return {
    firstName: d.firstName,
    email: d.email,
    fullName: d.fullName ?? d.name,
  };
}
