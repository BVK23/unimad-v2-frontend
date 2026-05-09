"use server";

import { cookies } from "next/headers";

export async function authCheck(): Promise<boolean> {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("_rt");
  return !!refreshToken?.value;
}
