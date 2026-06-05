const CACHE_KEY = "_user_country_code";

export async function fetchCountryCode(): Promise<string | null> {
  try {
    if (typeof window !== "undefined") {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) return cached;
    }

    const response = await fetch("/api/geolocation", { signal: AbortSignal.timeout(3000) });
    if (!response.ok) return null;

    const data = (await response.json()) as { country_code?: string | null };
    const countryCode = typeof data.country_code === "string" ? data.country_code.trim().toUpperCase() : null;

    if (countryCode && typeof window !== "undefined") {
      sessionStorage.setItem(CACHE_KEY, countryCode);
    }

    return countryCode || null;
  } catch {
    return null;
  }
}
