export type DocumentLibraryItem = {
  id: string | number;
  title: string;
  date: string;
  content: string;
  topic: "cover-letter" | "cold-email" | "referral";
  kind: "recent" | "history";
  status?: "Draft" | "Sent";
};
