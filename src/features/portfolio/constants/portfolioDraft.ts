/** Zustand / editor key for an unsaved scratch portfolio (not yet persisted). */
export const NEW_PORTFOLIO_DRAFT_ID = "__new_portfolio_draft__";

export function isPersistedPortfolioId(portfolioId: string | undefined | null): boolean {
  if (!portfolioId?.trim()) return false;
  return portfolioId !== NEW_PORTFOLIO_DRAFT_ID;
}
