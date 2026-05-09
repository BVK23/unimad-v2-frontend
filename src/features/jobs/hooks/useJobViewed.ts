import { useEffect, useRef } from "react";
import { recordJobViewed } from "../server-actions/jobs-actions";

export function useJobViewed(jobId?: string | null) {
  const lastRecordedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!jobId) return;
    if (lastRecordedRef.current === jobId) return;
    lastRecordedRef.current = jobId;
    void recordJobViewed(jobId);
  }, [jobId]);
}
