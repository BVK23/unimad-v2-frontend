/**
 * In-memory cache of UnibotAdkSession rows from Django (loaded once per Unibot mount).
 */

export type UnibotSessionKind = "main" | "sub";

export interface UnibotAdkSessionRow {
  adk_session_id: string;
  kind: UnibotSessionKind;
  parent_adk_session_id: string | null;
  title: string;
  content_key: string | null;
  feature: string | null;
  feature_id: string | null;
  section: string | null;
  entry_id: string;
  created_at?: string | null;
}

let registryRows: UnibotAdkSessionRow[] = [];

export function setSessionRegistry(rows: UnibotAdkSessionRow[]): void {
  registryRows = rows;
}

export function getSessionRegistry(): UnibotAdkSessionRow[] {
  return registryRows;
}

export function getRegistryRow(adkSessionId: string): UnibotAdkSessionRow | undefined {
  return registryRows.find(r => r.adk_session_id === adkSessionId);
}

export function upsertRegistryRow(row: UnibotAdkSessionRow): void {
  const idx = registryRows.findIndex(r => r.adk_session_id === row.adk_session_id);
  if (idx >= 0) registryRows[idx] = row;
  else registryRows = [...registryRows, row];
}

export function removeRegistrySessions(adkSessionIds: Iterable<string>): void {
  const drop = new Set(adkSessionIds);
  registryRows = registryRows.filter(r => !drop.has(r.adk_session_id));
}

export function getSubsForMain(parentAdkSessionId: string): UnibotAdkSessionRow[] {
  return registryRows.filter(r => r.kind === "sub" && r.parent_adk_session_id === parentAdkSessionId);
}

export function registryRowToMeta(row: UnibotAdkSessionRow): {
  kind: UnibotSessionKind;
  displayName: string;
  parentSessionId?: string;
} {
  return {
    kind: row.kind,
    displayName: row.title,
    parentSessionId: row.parent_adk_session_id ?? undefined,
  };
}
