import type { PortfolioData, PortfolioItem } from "@/types";

const mergeItemLayout = (saved: PortfolioItem, fromServer: PortfolioItem): PortfolioItem => {
  const merged: PortfolioItem = {
    ...fromServer,
    span: saved.span ?? fromServer.span,
    colStart: saved.colStart ?? fromServer.colStart,
    height: saved.height ?? fromServer.height,
    heightUserSet: saved.heightUserSet === true ? true : fromServer.heightUserSet,
  };

  const savedChildren = saved.detailedBlocks;
  const serverChildren = fromServer.detailedBlocks;
  if (!savedChildren?.length && !serverChildren?.length) {
    return merged;
  }

  const savedById = new Map((savedChildren ?? []).map(child => [child.id, child]));
  merged.detailedBlocks = (serverChildren ?? []).map(child => {
    const savedChild = savedById.get(child.id);
    return savedChild ? mergeItemLayout(savedChild, child) : child;
  });

  return merged;
};

/** Keep client grid layout (manual resize, col position) after save round-trip. */
export const mergeSavedPortfolioLayout = (saved: PortfolioData, response: PortfolioData): PortfolioData => {
  const savedById = new Map(saved.items.map(item => [item.id, item]));

  return {
    ...response,
    items: response.items.map(item => {
      const savedItem = savedById.get(item.id);
      return savedItem ? mergeItemLayout(savedItem, item) : item;
    }),
  };
};
