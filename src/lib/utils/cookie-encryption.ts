export const decryptCookieData = async (encryptedData: string | undefined | null) => {
  try {
    if (!encryptedData) return null;

    const parts = encryptedData.split(".");
    if (parts.length !== 2) {
      console.error("Invalid encrypted data format");
      return null;
    }

    const [data_b64] = parts;
    if (!data_b64) {
      console.error("Empty base64 data");
      return null;
    }

    const base64 = data_b64.replace(/-/g, "+").replace(/_/g, "/");
    const jsonStr = typeof atob === "function" ? atob(base64) : Buffer.from(base64, "base64").toString("utf8");

    const parsed = JSON.parse(jsonStr);
    if (!parsed || typeof parsed !== "object") {
      console.error("Invalid JSON structure");
      return null;
    }

    return parsed as Record<string, unknown>;
  } catch (error) {
    console.error("Failed to decrypt cookie data:", error);
    return null;
  }
};
