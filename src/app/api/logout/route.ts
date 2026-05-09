import { NextRequest, NextResponse } from "next/server";

/** Matches proxy cookie names when revoking auth. */
const AUTH_COOKIE_NAMES = ["_ut", "_rt", "_rd", "access_token", "refresh_token", "csrftoken", "sessionid"] as const;

function cookieClearBase() {
  const isLocal = process.env.NEXT_PUBLIC_BACKEND_URL === "http://localhost:8000";
  return isLocal
    ? { path: "/" as const }
    : {
        path: "/" as const,
        domain: process.env.NEXT_PUBLIC_DOMAIN,
        secure: true,
        sameSite: "none" as const,
      };
}

function clearAuthCookies(response: NextResponse) {
  const base = cookieClearBase();
  for (const name of AUTH_COOKIE_NAMES) {
    response.cookies.set(name, "", { ...base, maxAge: 0 });
  }
  return response;
}

/**
 * Logout: notify Django (clears server session) when we have an access token, then clear auth cookies.
 * Cookie attributes must match how they were set on login so the browser actually removes them (v1 parity).
 */
async function logout(request: NextRequest) {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";
  const accessToken = request.cookies.get("_ut")?.value;

  if (accessToken && backendUrl) {
    try {
      await fetch(`${backendUrl}/logout/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });
    } catch {
      // Still clear cookies so the user can sign in again locally.
    }
  }

  const url = request.nextUrl.clone();
  url.pathname = "/signin";
  url.search = "";
  const response = NextResponse.redirect(url);
  clearAuthCookies(response);
  return response;
}

export async function GET(request: NextRequest) {
  return logout(request);
}

export async function POST(request: NextRequest) {
  return logout(request);
}
