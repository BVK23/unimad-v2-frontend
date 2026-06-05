import type { SectionOrderItem } from "@/types";

/**
 * Deduplicate section order by id (keep first occurrence).
 * Ensures the same section is never rendered twice in PDF/preview.
 */
export function deduplicateSectionOrder(order: SectionOrderItem[]): SectionOrderItem[] {
  const seen = new Set<string>();
  return order.filter((s) => {
    if (seen.has(s.id)) return false;
    seen.add(s.id);
    return true;
  });
}
