import { decryptCookieData } from "@/lib/utils/cookie-encryption";

type DecryptedPaths = {
  blocked_paths?: string[];
};

export const checkPathPermissions = async (pathname: string, encryptedData: string | undefined | null) => {
  try {
    if (!encryptedData) return { blocked: false };

    const decrypted = (await decryptCookieData(encryptedData)) as DecryptedPaths | null;
    if (!decrypted || !decrypted.blocked_paths) return { blocked: false };

    const { blocked_paths } = decrypted;

    const isBlocked = blocked_paths.some(blockedPath => {
      if (blockedPath.endsWith("/*")) {
        const basePath = blockedPath.slice(0, -2);
        return pathname === basePath || pathname.startsWith(`${basePath}/`);
      }
      return pathname === blockedPath;
    });

    return { blocked: isBlocked };
  } catch (error) {
    console.error("Error checking path permissions:", error);
    return { blocked: false };
  }
};
