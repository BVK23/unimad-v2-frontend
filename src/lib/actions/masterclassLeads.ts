const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

async function parseResponse<T>(response: Response, fallback: string): Promise<T> {
  const data = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) {
    throw new Error(data.error || fallback);
  }
  return data;
}

export type MasterclassLeadPayload = {
  name: string;
  email: string;
  dial_code: string;
  phone: string;
  source: string;
  linkedin_url?: string;
};

export type MasterclassLeadResult = {
  lead_id?: number;
  uid?: string;
  name?: string;
  email?: string;
  source?: string;
  has_account?: boolean;
};

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
