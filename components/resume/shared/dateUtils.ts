// Output: "Jan 2023" from "2023-01" (standard) or just returns "Jan 2023" (legacy)
export const parseDate = (dateString: string | undefined | null): string => {
  if (!dateString) return "";

  // If matches YYYY-MM format (e.g. 2023-05) -> Standard Month Input
  if (/^\d{4}-\d{2}$/.test(dateString)) {
    const [year, month] = dateString.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  }

  // specific full date format YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  }

  // Legacy or Custom Text Handlers: Just return as is
  return dateString;
};

// Output: "2023-01" for <input type="month" />
// Tries to convert "Jan 2023" -> "2023-01" if possible, otherwise returns original if it fits (or empty if invalid for type=month)
export const formatForInput = (dateString: string): string => {
  if (!dateString) return "";

  // Already in YYYY-MM
  if (/^\d{4}-\d{2}$/.test(dateString)) return dateString;

  // Try to parse "Jan 2023" or "January 2023"
  const date = new Date(dateString);
  if (!isNaN(date.getTime())) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  }

  // If text like "Present", return empty for the date picker
  return "";
};
