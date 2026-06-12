import type { PrepareApplicationTab } from "@/lib/jobs/prepare-application-return";

export type OpenPrepareApplicationOptions = {
  source: "tracker" | "discovery";
  tab?: PrepareApplicationTab;
};
