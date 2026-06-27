import { uploadPortfolioFile } from "@/features/portfolio/utils/upload";

/** Client-side upload — uses signed GCS URL for files > 4.5MB (same as portfolio). */
export async function uploadContentGenMediaClient(file: File, category: "linkedin-post" = "linkedin-post"): Promise<{ url: string }> {
  const uploaded = await uploadPortfolioFile(file, category);
  return { url: uploaded.url };
}
