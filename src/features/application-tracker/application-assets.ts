/** Linked asset ids returned on Application.assets from the backend serializer. */
export interface ApplicationAssets {
  resume?: string | number;
  coverletter?: string | number;
  coldemail?: string | number;
  referral?: string | number;
  interview?: string | number;
  vpd?: string | number;
}

export function parseApplicationAssets(raw?: Record<string, unknown> | null): ApplicationAssets {
  if (!raw || typeof raw !== "object") return {};
  return raw as ApplicationAssets;
}

export function getLinkedAssetId(assets: ApplicationAssets, kind: "resume" | "cover-letter" | "cold-email" | "vpd"): string | null {
  if (kind === "resume" && assets.resume != null) return String(assets.resume);
  if (kind === "cover-letter" && assets.coverletter != null) return String(assets.coverletter);
  if (kind === "cold-email" && assets.coldemail != null) return String(assets.coldemail);
  if (kind === "vpd" && assets.vpd != null) return String(assets.vpd);
  return null;
}

/** True when the application has at least one linked prepare asset. */
export function applicationHasAnyLinkedAsset(assets: ApplicationAssets): boolean {
  return Object.values(assets).some(value => value != null && String(value).trim() !== "");
}
