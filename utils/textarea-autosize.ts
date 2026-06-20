/** Grow a textarea to fit its content (call from onChange). */
export function growTextareaToFit(el: HTMLTextAreaElement): void {
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
}

/** Collapse a textarea back to its default/min height after the value is cleared. */
export function resetTextareaHeight(el: HTMLTextAreaElement): void {
  el.style.height = "auto";
}
