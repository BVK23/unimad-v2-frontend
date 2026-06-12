/** True when a list item has no meaningful text (TipTap often leaves `<li><p></p></li>`). */
function isEmptyListItem(li: Element): boolean {
  const text = (li.textContent ?? "").replace(/\u00a0/g, " ").trim();
  return text === "";
}

/** True when a paragraph has no meaningful text. */
function isEmptyParagraph(el: Element): boolean {
  if (el.tagName !== "P") return false;
  const text = (el.textContent ?? "").replace(/\u00a0/g, " ").trim();
  return text === "";
}

/**
 * Removes trailing empty list items TipTap adds when a document ends inside a bullet list.
 * Safe for SSR — returns input unchanged when `document` is unavailable.
 */
export function stripTrailingEmptyListItems(html: string): string {
  const trimmed = html?.trim() ?? "";
  if (!trimmed || typeof document === "undefined") return trimmed;

  const root = document.createElement("div");
  root.innerHTML = trimmed;

  root.querySelectorAll("ul, ol").forEach(list => {
    let last = list.lastElementChild;
    while (last?.tagName === "LI" && isEmptyListItem(last)) {
      const remove = last;
      last = last.previousElementSibling;
      remove.remove();
    }
  });

  let node = root.lastChild;
  while (node instanceof Element && isEmptyParagraph(node)) {
    const remove = node;
    node = node.previousElementSibling;
    remove.remove();
  }

  return root.innerHTML;
}
