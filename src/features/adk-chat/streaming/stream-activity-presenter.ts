/**
 * Presents stream activity labels from SSE hints.
 * When the proxy delivers a burst of hints at once (dev buffering), pace them so the
 * user still sees each step instead of a single flicker at the end.
 */

export type StreamActivityPresentDetail = {
  label: string;
  assistantMessageId: string | null;
};

type StreamActivityPresenterOptions = {
  onPresent: (detail: StreamActivityPresentDetail) => void;
  onDrainComplete?: () => void;
};

/** Labels arriving within this window are treated as a buffered burst. */
const BURST_GAP_MS = 280;
/** Delay between paced labels during a burst replay. */
const PACE_INTERVAL_MS = 380;

export function createStreamActivityPresenter(options: StreamActivityPresenterOptions) {
  let assistantMessageId: string | null = null;
  let lastPresented: string | null = null;
  let lastArrivalAt = 0;
  let burstQueue: string[] = [];
  let paceTimer: ReturnType<typeof setTimeout> | null = null;
  let isPacing = false;
  let pendingFinish: (() => void) | null = null;

  const present = (label: string): void => {
    lastPresented = label;
    options.onPresent({ label, assistantMessageId });
  };

  const clearPacingState = (): void => {
    if (paceTimer) {
      clearTimeout(paceTimer);
      paceTimer = null;
    }
    burstQueue = [];
    isPacing = false;
  };

  const completeDrain = (): void => {
    isPacing = false;
    options.onDrainComplete?.();
    const finish = pendingFinish;
    pendingFinish = null;
    finish?.();
  };

  const schedulePacedDrain = (): void => {
    if (paceTimer) return;
    paceTimer = setTimeout(() => {
      paceTimer = null;
      const next = burstQueue.shift();
      if (next) {
        present(next);
        schedulePacedDrain();
      } else {
        completeDrain();
      }
    }, PACE_INTERVAL_MS);
  };

  return {
    setAssistantMessageId(id: string | null): void {
      assistantMessageId = id;
    },

    enqueue(label: string): void {
      const trimmed = label.trim();
      if (!trimmed || trimmed === lastPresented) return;

      // Always show the latest hint immediately — bursts are common when the proxy
      // delivers buffered SSE; pacing made labels visible in devtools but not in the UI.
      present(trimmed);
      lastArrivalAt = Date.now();
      clearPacingState();
    },

    isPacing(): boolean {
      return isPacing || burstQueue.length > 0 || pendingFinish !== null;
    },

    /** Wait for paced labels to finish, then run callback (used before clearing loading UI). */
    finish(onComplete?: () => void): void {
      if (onComplete) {
        pendingFinish = onComplete;
      }
      if (!isPacing && burstQueue.length === 0) {
        completeDrain();
        return;
      }
      if (!paceTimer && burstQueue.length > 0) {
        schedulePacedDrain();
      }
    },

    reset(): void {
      pendingFinish = null;
      clearPacingState();
      assistantMessageId = null;
      lastPresented = null;
      lastArrivalAt = 0;
    },
  };
}

export type StreamActivityPresenter = ReturnType<typeof createStreamActivityPresenter>;
