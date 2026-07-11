"use server";

import { authedFetch } from "@/lib/authed-fetch";
import { computeAdkUserId } from "@/utils/adkUserId";

type UserData = {
  username?: string;
  name?: string;
  email?: string;
  firstName?: string;
};

export async function getAdkUserId(): Promise<string> {
  try {
    const res = await authedFetch("/api/user-data/", { method: "GET" });
    if (!res.ok) return "";
    const data = (await res.json()) as UserData;
    return computeAdkUserId(data);
  } catch {
    return "";
  }
}
