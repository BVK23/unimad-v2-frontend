/** DOM helpers: mark the text span Unibot is refining without mutating React state. */

const ANCHOR_MARK_CLASS = "unibot-refine-anchor-highlight";
const ANCHOR_MARK_ATTR = "data-unibot-refine-anchor";

type TextChunk = { node: Text; start: number };

const collectTextChunks = (root: HTMLElement): { full: string; chunks: TextChunk[] } => {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const chunks: TextChunk[] = [];
  let full = "";
  let node = walker.nextNode() as Text | null;
  while (node) {
    chunks.push({ node, start: full.length });
    full += node.data;
    node = walker.nextNode() as Text | null;
  }
  return { full, chunks };
};

const offsetToPoint = (chunks: TextChunk[], offset: number): { node: Text; offset: number } | null => {
  for (let i = chunks.length - 1; i >= 0; i -= 1) {
    const chunk = chunks[i];
    if (offset >= chunk.start) {
      return { node: chunk.node, offset: offset - chunk.start };
    }
  }
  return null;
};

export const findTextRange = (root: HTMLElement, searchText: string): Range | null => {
  const needle = searchText.trim();
  if (!needle) return null;

  const { full, chunks } = collectTextChunks(root);
  if (!chunks.length) return null;

  const idx = full.indexOf(needle);
  if (idx === -1) return null;

  const startPoint = offsetToPoint(chunks, idx);
  const endPoint = offsetToPoint(chunks, idx + needle.length);
  if (!startPoint || !endPoint) return null;

  const range = document.createRange();
  range.setStart(startPoint.node, startPoint.offset);
  range.setEnd(endPoint.node, endPoint.offset);
  return range;
};

export const clearRefineAnchorMarks = (root: HTMLElement): void => {
  root.querySelectorAll(`mark[${ANCHOR_MARK_ATTR}]`).forEach(mark => {
    const parent = mark.parentNode;
    if (!parent) return;
    while (mark.firstChild) {
      parent.insertBefore(mark.firstChild, mark);
    }
    parent.removeChild(mark);
    parent.normalize();
  });
};

export const applyRefineAnchorMark = (root: HTMLElement, searchText: string): HTMLElement | null => {
  clearRefineAnchorMarks(root);
  const range = findTextRange(root, searchText);
  if (!range) return null;

  const mark = document.createElement("mark");
  mark.className = ANCHOR_MARK_CLASS;
  mark.setAttribute(ANCHOR_MARK_ATTR, "1");

  try {
    range.surroundContents(mark);
  } catch {
    const fragment = range.extractContents();
    mark.appendChild(fragment);
    range.insertNode(mark);
  }

  return mark;
};
