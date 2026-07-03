import { UploadError } from "@/features/portfolio/utils/upload";

export type PortfolioUploadContext = "hero-cover" | "hero-avatar" | "page-cover" | "canvas-cover" | "block-media";

const LOG_PREFIX = "[portfolio-upload]";

export function describeUploadFile(file: File) {
  return {
    name: file.name,
    size: file.size,
    sizeMb: Number((file.size / (1024 * 1024)).toFixed(2)),
    type: file.type || "(empty mime)",
  };
}

export function logPortfolioUploadStart(context: PortfolioUploadContext, file: File, extra?: Record<string, unknown>) {
  console.info(LOG_PREFIX, context, "start", { ...describeUploadFile(file), ...extra });
}

export function logPortfolioUploadSuccess(context: PortfolioUploadContext, url: string, extra?: Record<string, unknown>) {
  console.info(LOG_PREFIX, context, "success", { url, ...extra });
}

export function logPortfolioUploadError(context: PortfolioUploadContext, error: unknown, extra?: Record<string, unknown>) {
  console.error(LOG_PREFIX, context, "failed", {
    ...extra,
    error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : error,
  });
}

export function formatPortfolioUploadError(error: unknown, fallback: string): string {
  if (error instanceof UploadError) return error.message;
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}
