/** Full content height for a portfolio block root (not clipped by a short grid cell). */
export const measurePortfolioBlockRootHeight = (root: HTMLElement): number =>
  Math.ceil(Math.max(root.scrollHeight, root.offsetHeight, root.getBoundingClientRect().height));
