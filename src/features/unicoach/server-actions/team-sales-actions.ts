"use server";

import {
  createTeamCoupon,
  deleteTeamCoupon,
  expireTeamCoupon,
  fetchTeamSalesDashboard,
  previewTeamCouponCode,
  resolveUnicoachClaim,
  searchTeamUsers,
} from "@/features/unicoach/api/public-unicoach-client";
import { cookies } from "next/headers";

function getBackendUrl(): string {
  const url = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_BACKEND_URL is not defined");
  }
  return url.replace(/\/+$/, "");
}

async function getAccessToken(): Promise<string> {
  const cookieStore = await cookies();
  const token = cookieStore.get("_ut")?.value ?? cookieStore.get("__Host-ut")?.value;
  if (!token) {
    throw new Error("Unauthorized");
  }
  return token;
}

export async function fetchCurrentUserFlags(): Promise<{ is_team_member: boolean }> {
  const accessToken = await getAccessToken();
  const scheme = /^ey[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*$/.test(accessToken.trim()) ? "Bearer" : "Token";
  const res = await fetch(`${getBackendUrl()}/api/user-data/`, {
    method: "GET",
    headers: { Authorization: `${scheme} ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) {
    return { is_team_member: false };
  }
  const data = (await res.json()) as { is_team_member?: boolean };
  return { is_team_member: Boolean(data.is_team_member) };
}

export async function getTeamSalesDashboard({
  period = "month",
  dateFrom,
  dateTo,
}: { period?: string; dateFrom?: string; dateTo?: string } = {}) {
  const accessToken = await getAccessToken();
  return fetchTeamSalesDashboard(accessToken, { period, dateFrom, dateTo });
}

export async function teamCreateCoupon(payload: {
  category: string;
  code: string;
  discount_amount: number;
  purpose?: string;
  expires_at?: string;
}) {
  const accessToken = await getAccessToken();
  return createTeamCoupon(accessToken, payload);
}

export async function teamPreviewCouponCode(category: string) {
  const accessToken = await getAccessToken();
  return previewTeamCouponCode(accessToken, category);
}

export async function teamExpireCoupon(couponId: number) {
  const accessToken = await getAccessToken();
  return expireTeamCoupon(accessToken, couponId);
}

export async function teamDeleteCoupon(couponId: number) {
  const accessToken = await getAccessToken();
  return deleteTeamCoupon(accessToken, couponId);
}

export async function teamSearchUsers(query: string) {
  const accessToken = await getAccessToken();
  return searchTeamUsers(accessToken, query);
}

export async function teamResolveUnicoachClaim({
  claimToken,
  userEmail,
  userProfileId,
}: {
  claimToken: string;
  userEmail: string;
  userProfileId?: number | null;
}) {
  const accessToken = await getAccessToken();
  return resolveUnicoachClaim(accessToken, { claimToken, userEmail, userProfileId });
}
