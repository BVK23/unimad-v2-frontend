/** Skip beginReview when a card already exists for this assistant turn. */
export function hasReviewForAssistant<T extends { assistantMessageId: string | null }>(
  stack: T[],
  assistantMessageId: string | null | undefined
): boolean {
  if (!assistantMessageId?.trim()) return false;
  const id = assistantMessageId.trim();
  return stack.some(card => card.assistantMessageId === id);
}
