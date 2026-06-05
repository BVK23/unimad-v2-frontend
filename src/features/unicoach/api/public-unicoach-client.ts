function getBackendUrl(): string {
  const url = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_BACKEND_URL is not defined");
  }
  return url.replace(/\/+$/, "");
}

async function parseError(response: Response, fallback: string): Promise<never> {
  const data = await response.json().catch(() => ({}));
  const err = data as { error?: string; message?: string };
  throw new Error(err.error ?? err.message ?? fallback);
}

export type PublicDiscountValidation = {
  valid: boolean;
  discount_amount?: number;
  is_partial?: boolean;
  message?: string;
};

export async function publicValidateUnicoachDiscount(discountCode: string): Promise<PublicDiscountValidation> {
  const response = await fetch(`${getBackendUrl()}/api/public/validate-unicoach-discount/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ discount_code: discountCode }),
  });

  const data = (await response.json()) as PublicDiscountValidation;
  if (!response.ok) {
    return { valid: false, message: data.message ?? "Invalid discount code" };
  }
  return data;
}

export type PublicUnicoachOrder = {
  id: string;
  amount: number;
  currency: string;
  claim_token: string;
};

export async function publicCreateUnicoachOrder({
  discountCode = null,
  isRemainingPartialPayment = false,
}: {
  discountCode?: string | null;
  isRemainingPartialPayment?: boolean;
} = {}): Promise<PublicUnicoachOrder> {
  const body: Record<string, unknown> = {};
  if (isRemainingPartialPayment) {
    body.is_remaining_partial_payment = true;
  } else if (discountCode) {
    body.discount_code = discountCode;
  }

  const response = await fetch(`${getBackendUrl()}/api/public/create-unicoach-order/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    await parseError(response, "Failed to create order");
  }
  return response.json() as Promise<PublicUnicoachOrder>;
}

export async function publicVerifyUnicoachPayment(
  checkoutResponse: Record<string, string>,
  claimToken: string
): Promise<{ verified: boolean; message?: string }> {
  const response = await fetch(`${getBackendUrl()}/api/public/verify-unicoach-payment/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ checkoutResponse, claim_token: claimToken }),
  });

  if (!response.ok) {
    await parseError(response, "Payment verification failed");
  }
  return response.json() as Promise<{ verified: boolean; message?: string }>;
}

async function authedFetch(path: string, accessToken: string, options: RequestInit = {}): Promise<Response> {
  const scheme = /^ey[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*$/.test(accessToken.trim()) ? "Bearer" : "Token";
  return fetch(`${getBackendUrl()}${path}`, {
    ...options,
    headers: {
      Authorization: `${scheme} ${accessToken}`,
      ...(options.headers ?? {}),
    },
  });
}

export type TeamSalesDashboard = {
  stats?: {
    in_app?: { count?: number; total_gbp?: number };
    public_page?: { count?: number; total_gbp?: number; fulfilled_count?: number; awaiting_claim_count?: number };
    payment_links?: { count?: number; total_gbp?: number };
    payment_types?: { full_count?: number; partial_count?: number };
    combined_total_gbp?: number;
    combined_count?: number;
  };
  unclaimed_purchases?: Array<{
    claim_token: string;
    payer_email?: string | null;
    payer_phone?: string | null;
    amount: number;
    payment_type?: string;
    paid_at_display?: string | null;
  }>;
  coupon_categories?: Array<{ value: string; label: string }>;
  coupons?: {
    active?: Array<TeamCoupon>;
    recently_expired?: Array<TeamCoupon>;
  };
};

export type TeamCoupon = {
  id: number;
  code: string;
  category?: string;
  category_label?: string;
  discount_amount: number;
  purpose?: string;
  expires_at?: string | null;
};

export async function fetchTeamSalesDashboard(
  accessToken: string,
  { period = "month", dateFrom, dateTo }: { period?: string; dateFrom?: string; dateTo?: string } = {}
): Promise<TeamSalesDashboard> {
  const params = new URLSearchParams();
  if (dateFrom && dateTo) {
    params.set("date_from", dateFrom);
    params.set("date_to", dateTo);
  } else {
    params.set("period", period);
  }
  const response = await authedFetch(`/api/team/sales-dashboard/?${params}`, accessToken, { method: "GET" });
  if (!response.ok) {
    await parseError(response, "Failed to load sales dashboard");
  }
  return response.json() as Promise<TeamSalesDashboard>;
}

export async function createTeamCoupon(
  accessToken: string,
  payload: {
    category: string;
    code: string;
    discount_amount: number;
    purpose?: string;
    expires_at?: string;
  }
): Promise<{ coupon: TeamCoupon }> {
  const response = await authedFetch("/api/team/create-coupon/", accessToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    await parseError(response, "Failed to create coupon");
  }
  return response.json() as Promise<{ coupon: TeamCoupon }>;
}

export async function previewTeamCouponCode(accessToken: string, category: string): Promise<{ code: string }> {
  const params = new URLSearchParams({ category });
  const response = await authedFetch(`/api/team/preview-coupon-code/?${params}`, accessToken, { method: "GET" });
  if (!response.ok) {
    await parseError(response, "Failed to generate coupon code");
  }
  return response.json() as Promise<{ code: string }>;
}

export async function expireTeamCoupon(accessToken: string, couponId: number): Promise<{ coupon: TeamCoupon }> {
  const response = await authedFetch("/api/team/expire-coupon/", accessToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ coupon_id: couponId }),
  });
  if (!response.ok) {
    await parseError(response, "Failed to expire coupon");
  }
  return response.json() as Promise<{ coupon: TeamCoupon }>;
}

export async function deleteTeamCoupon(accessToken: string, couponId: number): Promise<{ deleted: boolean }> {
  const response = await authedFetch("/api/team/delete-coupon/", accessToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ coupon_id: couponId }),
  });
  if (!response.ok) {
    await parseError(response, "Failed to delete coupon");
  }
  if (response.status === 204) {
    return { deleted: true };
  }
  return response.json() as Promise<{ deleted: boolean }>;
}

export async function searchTeamUsers(
  accessToken: string,
  query: string
): Promise<{ users: Array<{ id: number; email: string; name?: string | null }> }> {
  const params = new URLSearchParams({ q: query });
  const response = await authedFetch(`/api/team/search-users/?${params}`, accessToken, { method: "GET" });
  if (!response.ok) {
    await parseError(response, "Failed to search users");
  }
  return response.json() as Promise<{ users: Array<{ id: number; email: string; name?: string | null }> }>;
}

export async function resolveUnicoachClaim(
  accessToken: string,
  params: { claimToken: string; userEmail: string; userProfileId?: number | null }
): Promise<Record<string, unknown>> {
  const response = await authedFetch("/api/team/resolve-unicoach-claim/", accessToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      claim_token: params.claimToken,
      user_email: params.userEmail,
      user_profile_id: params.userProfileId ?? null,
    }),
  });
  if (!response.ok) {
    await parseError(response, "Failed to resolve claim");
  }
  return response.json() as Promise<Record<string, unknown>>;
}
