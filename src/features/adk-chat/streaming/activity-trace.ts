/** Dev-only trace for ADK stream activity labels (tools, agents, handoffs). */

export function isAdkActivityTraceEnabled(): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_ADK_ACTIVITY_TRACE === "1" ||
    process.env.NEXT_PUBLIC_ADK_DEBUG === "1"
  );
}

export function traceAdkActivity(
  label: string,
  meta?: { author?: string; tool?: string; transferTo?: string; assistantMessageId?: string | null }
): void {
  if (!isAdkActivityTraceEnabled()) return;
  const parts = [`[adk-activity] ${label}`];
  if (meta?.author) parts.push(`author=${meta.author}`);
  if (meta?.tool) parts.push(`tool=${meta.tool}`);
  if (meta?.transferTo) parts.push(`→${meta.transferTo}`);
  if (meta?.assistantMessageId) parts.push(`msg=${meta.assistantMessageId.slice(0, 8)}`);
  console.info(parts.join(" | "));
}
