"use server";

import { computeAdkUserId } from "@/utils/adkUserId";
import { cookies } from "next/headers";

type UserData = {
  username?: string;
  name?: string;
  email?: string;
  firstName?: string;
};

export async function getAdkUserId(): Promise<string> {
  const cookieStore = await cookies();
  const token = cookieStore.get("_ut")?.value ?? cookieStore.get("__Host-ut")?.value;
  if (!token) {
    return "";
  }

  const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL ?? "").replace(/\/+$/, "");
  if (!backendUrl) {
    return "";
  }

  const looksLikeJwt = /^ey[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*$/.test(token.trim());
  const scheme = looksLikeJwt ? "Bearer" : "Token";

  try {
    const res = await fetch(`${backendUrl}/api/user-data/`, {
      method: "GET",
      headers: { Authorization: `${scheme} ${token}` },
      cache: "no-store",
    });
    if (!res.ok) {
      return "";
    }
    const data = (await res.json()) as UserData;
    return computeAdkUserId(data);
  } catch {
    return "";
  }
}
