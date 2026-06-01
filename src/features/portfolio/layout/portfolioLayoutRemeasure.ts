type RemeasureFn = () => void;

let activeRemeasure: RemeasureFn | null = null;

export const registerPortfolioLayoutRemeasure = (fn: RemeasureFn | null) => {
  activeRemeasure = fn;
};

/** Runs a synchronous remeasure of all grid blocks (registered by Portfolio editor). */
export const flushPortfolioLayoutRemeasure = () => {
  activeRemeasure?.();
};

/** After flush, wait for layout + ResizeObserver callbacks before persisting. */
export const waitForPortfolioLayoutSettle = (): Promise<void> =>
  new Promise(resolve => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.setTimeout(resolve, 48);
      });
    });
  });
