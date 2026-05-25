import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/** Returns Gemini API key for authenticated users (voice interview live sessions). */
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("_ut")?.value ?? cookieStore.get("__Host-ut")?.value;
  if (!token) {
    return NextResponse.json({ error: "Your session has expired" }, { status: 401 });
  }

  const apiKey = process.env.GEMINI_API_KEY ?? process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey?.trim()) {
    return NextResponse.json({ error: "Gemini API key is not configured" }, { status: 500 });
  }

  return NextResponse.json({ api_key: apiKey });
}
