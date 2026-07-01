/** After layout mutations, wait for layout + ResizeObserver callbacks before persisting. */
export const waitForPortfolioLayoutSettle = (): Promise<void> =>
  new Promise(resolve => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.setTimeout(resolve, 48);
      });
    });
  });
