import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Country code from NEXT_PUBLIC_TEST_COUNTRY (dev) or Vercel x-vercel-ip-country (prod).
 */
export async function GET(request: Request) {
  try {
    let countryCode: string | null = null;
    let source: string | null = null;

    if (process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_TEST_COUNTRY) {
      countryCode = process.env.NEXT_PUBLIC_TEST_COUNTRY.toUpperCase();
      source = "env";
    } else {
      const vercelCountry = request.headers.get("x-vercel-ip-country");
      if (vercelCountry) {
        countryCode = vercelCountry.toUpperCase();
        source = "vercel";
      }
    }

    return NextResponse.json({ country_code: countryCode, source });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ country_code: null, source: null, error: message }, { status: 200 });
  }
}
