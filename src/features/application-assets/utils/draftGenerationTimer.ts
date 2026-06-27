/** Enable via dev default, or NEXT_PUBLIC_DRAFT_GEN_TIMING=1 in staging/prod. */
export const isDraftGenerationTimingEnabled = (): boolean =>
  process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_DRAFT_GEN_TIMING === "1";

export type DraftGenerationTimer = {
  mark: (step: string, extra?: Record<string, unknown>) => void;
  finish: (extra?: Record<string, unknown>) => void;
};

type TimingEntry = {
  step: string;
  stepMs: number;
  totalMs: number;
  extra?: Record<string, unknown>;
};

const noopTimer: DraftGenerationTimer = {
  mark: () => {},
  finish: () => {},
};

/**
 * Step timer for Studio application-asset draft generation.
 * Logs each step as: [draft-gen-timing] label | step | +stepMs | total totalMs
 */
export const createDraftGenerationTimer = (label: string): DraftGenerationTimer => {
  if (!isDraftGenerationTimingEnabled()) {
    return noopTimer;
  }

  const entries: TimingEntry[] = [];
  const start = performance.now();
  let last = start;

  const mark = (step: string, extra?: Record<string, unknown>) => {
    const now = performance.now();
    const entry: TimingEntry = { step, stepMs: now - last, totalMs: now - start, extra };
    entries.push(entry);
    const extraStr = extra && Object.keys(extra).length > 0 ? ` ${JSON.stringify(extra)}` : "";
    console.log(`[draft-gen-timing] ${label} | ${step} | +${entry.stepMs.toFixed(0)}ms | total ${entry.totalMs.toFixed(0)}ms${extraStr}`);
    last = now;
  };

  const finish = (extra?: Record<string, unknown>) => {
    mark("pipeline_complete", extra);
    console.log(`[draft-gen-timing] ${label} | summary`);
    console.table(
      entries.map(e => ({
        step: e.step,
        step_ms: Math.round(e.stepMs),
        total_ms: Math.round(e.totalMs),
        ...(e.extra ?? {}),
      }))
    );
  };

  mark("timer_start");

  return { mark, finish };
};
