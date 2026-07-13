"use server";

import { cookies } from "next/headers";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

async function parseResponse<T>(response: Response, fallback: string): Promise<T> {
  const data = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) {
    throw new Error(data.error || fallback);
  }
  return data;
}

export type MasterclassDiscoveryPayload = {
  currentStatus?: string;
  currentStatusOther?: string;
  country?: string;
  countryOther?: string;
  targetRoles?: string[];
  targetRoleOther?: string;
  jobSearchStatus?: string[];
  jobSearchOther?: string;
  openToInvesting?: string;
};

export type MasterclassLeadPayload = {
  name?: string;
  email?: string;
  dial_code: string;
  phone: string;
  source: string;
  linkedin_url?: string;
  stage?: "contact" | "complete";
  discovery?: MasterclassDiscoveryPayload;
  uid?: string;
};

export type MasterclassLeadResult = {
  lead_id?: number;
  uid?: string;
  name?: string;
  email?: string;
  source?: string;
  has_account?: boolean;
  discovery_complete?: boolean;
  qualification_status?: string | null;
  has_contact_details?: boolean;
  stage?: string;
  created?: boolean;
  source_upgraded?: boolean;
  journey_started?: boolean;
};

export async function enrollAuthenticatedMasterclassMember(): Promise<MasterclassLeadResult> {
  if (!BACKEND_URL) {
    throw new Error("Backend URL is not configured.");
  }

  const cookieStore = await cookies();
  const accessTokenCookie = cookieStore.get("_ut");
  if (!accessTokenCookie?.value) {
    throw new Error("Please sign in to continue.");
  }

  const response = await fetch(`${BACKEND_URL}/api/crm/masterclass-member-enroll/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessTokenCookie.value}`,
    },
  });

  return parseResponse(response, "Unable to enroll in masterclass.");
}

export async function submitMasterclassLead(payload: MasterclassLeadPayload): Promise<MasterclassLeadResult> {
  if (!BACKEND_URL) {
    throw new Error("Backend URL is not configured.");
  }

  const response = await fetch(`${BACKEND_URL}/api/crm/masterclass-leads/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return parseResponse(response, "Unable to save your details.");
}

export async function fetchAuthenticatedMasterclassLead(): Promise<MasterclassLeadResult & { found?: boolean }> {
  if (!BACKEND_URL) {
    throw new Error("Backend URL is not configured.");
  }

  const cookieStore = await cookies();
  const accessTokenCookie = cookieStore.get("_ut");
  if (!accessTokenCookie?.value) {
    throw new Error("Please sign in to continue.");
  }

  const response = await fetch(`${BACKEND_URL}/api/crm/masterclass-leads/`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessTokenCookie.value}`,
    },
    cache: "no-store",
  });

  return parseResponse(response, "Unable to load your details.");
}

export async function fetchMasterclassLead(uid: string): Promise<MasterclassLeadResult> {
  if (!BACKEND_URL) {
    throw new Error("Backend URL is not configured.");
  }

  const response = await fetch(`${BACKEND_URL}/api/crm/masterclass-leads/?uid=${encodeURIComponent(uid)}`, {
    method: "GET",
    cache: "no-store",
  });

  return parseResponse(response, "Unable to load your details.");
}

export async function masterclassLinkAction(uid: string, action: string): Promise<MasterclassLeadResult> {
  if (!BACKEND_URL) {
    throw new Error("Backend URL is not configured.");
  }

  const response = await fetch(`${BACKEND_URL}/api/crm/masterclass-link/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ uid, action }),
  });

  return parseResponse(response, "Unable to process this link.");
}

export async function expressDiscoveryBooking(uid: string) {
  return masterclassLinkAction(uid, "book_discovery");
}

export async function unlockMasterclassWatch(uid: string) {
  return masterclassLinkAction(uid, "unlock_watch");
}

export async function submitAuthenticatedDiscoveryLead(payload: {
  discovery: MasterclassDiscoveryPayload;
  uid?: string;
}): Promise<MasterclassLeadResult> {
  if (!BACKEND_URL) {
    throw new Error("Backend URL is not configured.");
  }

  const cookieStore = await cookies();
  const accessTokenCookie = cookieStore.get("_ut");
  if (!accessTokenCookie?.value) {
    throw new Error("Please sign in to continue.");
  }

  const response = await fetch(`${BACKEND_URL}/api/crm/masterclass-leads/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessTokenCookie.value}`,
    },
    body: JSON.stringify({
      source: "discovery_vsl",
      stage: "complete",
      discovery: payload.discovery,
      uid: payload.uid,
    }),
  });

  return parseResponse(response, "Unable to save your details.");
}
