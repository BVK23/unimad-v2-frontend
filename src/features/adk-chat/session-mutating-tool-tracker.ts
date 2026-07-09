import { isMutatingSessionTool } from "./session-mutating-tools";
import type { AdkEvent } from "./types";

const mutatingToolsBySession = new Map<string, Set<string>>();

export function noteSessionMutatingTool(sessionId: string, toolName: string): void {
  const id = sessionId.trim();
  const tool = toolName.trim();
  if (!id || !tool || !isMutatingSessionTool(tool)) {
    return;
  }

  const existing = mutatingToolsBySession.get(id) ?? new Set<string>();
  existing.add(tool);
  mutatingToolsBySession.set(id, existing);
}

export function sessionHasMutatingToolChanges(sessionId: string): boolean {
  const id = sessionId.trim();
  if (!id) {
    return false;
  }
  return (mutatingToolsBySession.get(id)?.size ?? 0) > 0;
}

export function clearSessionMutatingToolTracking(sessionId: string): void {
  const id = sessionId.trim();
  if (!id) {
    return;
  }
  mutatingToolsBySession.delete(id);
}

export function clearAllSessionMutatingToolTracking(sessionIds: Iterable<string>): void {
  for (const sessionId of sessionIds) {
    clearSessionMutatingToolTracking(sessionId);
  }
}

function extractToolNamesFromAdkEvent(event: AdkEvent): string[] {
  const names: string[] = [];
  const content = event.content;
  if (!content || typeof content === "string") return names;

  const parts = content.parts;
  if (!Array.isArray(parts)) return names;

  for (const part of parts) {
    if (!part || typeof part !== "object") continue;
    const record = part as Record<string, unknown>;
    const call = (record.function_call ?? record.functionCall) as { name?: string } | undefined;
    const response = (record.function_response ?? record.functionResponse) as { name?: string } | undefined;
    if (typeof call?.name === "string") names.push(call.name);
    if (typeof response?.name === "string") names.push(response.name);
  }

  return names;
}

export function extractMutatingToolNamesFromAdkEvents(events: AdkEvent[]): string[] {
  const names = new Set<string>();
  for (const event of events) {
    for (const toolName of extractToolNamesFromAdkEvent(event)) {
      if (isMutatingSessionTool(toolName)) {
        names.add(toolName);
      }
    }
  }
  return Array.from(names);
}

/** Restore mutating-tool flags after refresh by scanning persisted ADK events. */
export function hydrateMutatingToolsFromAdkEvents(sessionId: string, events: AdkEvent[]): void {
  for (const toolName of extractMutatingToolNamesFromAdkEvents(events)) {
    noteSessionMutatingTool(sessionId, toolName);
  }
}
