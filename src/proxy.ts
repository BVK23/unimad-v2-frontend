import { AUTH_ERRORS } from "@/constants/errors";
import { checkPathPermissions } from "@/lib/handlers/pathPermissionHandler";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const accessToken = request.cookies.get("_ut");
  const refreshToken = request.cookies.get("_rt");
  const restrictedPaths = request.cookies.get("_rd");

  const isLocal = process.env.NEXT_PUBLIC_BACKEND_URL === "http://localhost:8000";

  // Create a new Headers object from the request headers
  const headers = new Headers(request.headers);

  // set x-pathname header for use in server components
  headers.set("x-pathname", pathname);

  const deleteCookies = (response: NextResponse) => {
    const cookieOptions = isLocal
      ? { path: "/" }
      : {
          path: "/",
          domain: process.env.NEXT_PUBLIC_DOMAIN,
          secure: true,
          sameSite: "none" as const,
        };

    ["access_token", "refresh_token", "_rd", "_ut", "_rt", "csrftoken", "sessionid"].forEach(cookieName => {
      response.cookies.set(cookieName, "", { ...cookieOptions, maxAge: 0 });
    });

    return response;
  };

  if (!refreshToken) {
    const { code, message } = AUTH_ERRORS.NO_COOKIES;
    const response = NextResponse.redirect(new URL(`/signin?error=${code}&message=${btoa(message)}&from=${pathname}`, request.url));
    return deleteCookies(response);
  }

  // Skip path permission check for /uniboard/resume (safe fallback route)
  if (pathname !== "/uniboard/resume") {
    const { blocked } = await checkPathPermissions(pathname, restrictedPaths?.value);

    if (blocked) {
      const { code, message } = AUTH_ERRORS.ACCESS_DENIED;
      return NextResponse.redirect(new URL(`/uniboard/resume?error=${code}&message=${btoa(message)}`, request.url));
    }
  }

  if (accessToken?.value) {
    try {
      const decodedToken = jwt.decode(accessToken.value) as { exp?: number } | null;
      const currentTime = Math.floor(Date.now() / 1000);
      const timeRemaining = (decodedToken?.exp ?? 0) - currentTime;

      if (timeRemaining > 120) {
        return NextResponse.next({
          request: { headers },
        });
      }
    } catch (error) {
      // Access token is invalid, proceed to refresh
    }
  }

  const refreshResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh: refreshToken?.value }),
  });

  if (!refreshResponse.ok) {
    const { code, message } = AUTH_ERRORS.SESSION_EXPIRED;
    const response = NextResponse.redirect(new URL(`/signin?error=${code}&message=${btoa(message)}&from=${pathname}`, request.url));
    return deleteCookies(response);
  }

  const refreshData = (await refreshResponse.json()) as {
    access: string;
    refresh: string;
  };
  const newAccessToken = refreshData.access;
  const newRefreshToken = refreshData.refresh;

  const cookieHeader = headers.get("cookie");
  const newCookie = cookieHeader
    ?.split("; ")
    .map(ck => {
      const [key, value] = ck.split("=");
      if (key === "_ut") return `${key}=${newAccessToken}`;
      if (key === "_rt") return `${key}=${newRefreshToken}`;
      return `${key}=${value}`;
    })
    .join("; ");

  if (newCookie) {
    headers.set("cookie", newCookie);
  }

  const response = NextResponse.next({
    request: { headers },
  });

  if (isLocal) {
    response.cookies.set("_ut", newAccessToken, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
    });
    response.cookies.set("_rt", newRefreshToken, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
    });
  } else {
    response.cookies.set("_ut", newAccessToken, {
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "none",
      domain: process.env.NEXT_PUBLIC_DOMAIN,
      maxAge: 7 * 24 * 60 * 60,
    });
    response.cookies.set("_rt", newRefreshToken, {
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "none",
      domain: process.env.NEXT_PUBLIC_DOMAIN,
      maxAge: 7 * 24 * 60 * 60,
    });
  }

  return response;
}

export const config = {
  matcher: ["/uniboard/:path*", "/api/:path*", "/onboarding/:path*"],
};
