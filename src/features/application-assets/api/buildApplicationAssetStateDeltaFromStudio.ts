import {
  buildAdkApplicationAssetStateDelta,
  type BuildApplicationAssetStateDeltaInput,
} from "@/features/application-assets/api/adk-mappers";
import { resolveApplicationAssetBodyForPatch } from "@/features/application-assets/api/resolveApplicationAssetBodyForPatch";
import type { useApplicationAssetStudioStore } from "@/features/application-assets/store/useApplicationAssetStudioStore";

type StudioSnapshot = ReturnType<typeof useApplicationAssetStudioStore.getState>;

export const buildApplicationAssetStateDeltaFromStudio = (
  studio: StudioSnapshot,
  overrides: Partial<BuildApplicationAssetStateDeltaInput> = {}
) => {
  const { sessionBody, regenerateDraft } = resolveApplicationAssetBodyForPatch(studio);
  const draftPreview = sessionBody || studio.draftPreview;
  const acceptedBody = studio.acceptedContent;

  return buildAdkApplicationAssetStateDelta({
    assetType: overrides.assetType ?? studio.assetType ?? undefined,
    assetId: overrides.assetId ?? studio.assetId,
    applicationId: overrides.applicationId ?? studio.applicationId,
    role: overrides.role ?? studio.role,
    company: overrides.company ?? studio.company,
    jobDescription: overrides.jobDescription ?? studio.jobDescription,
    contactName: overrides.contactName ?? studio.contactName,
    draftPreview: overrides.draftPreview ?? draftPreview,
    acceptedBody: overrides.acceptedBody ?? acceptedBody,
    studioHeadless: overrides.studioHeadless,
    profileSnapshot: overrides.profileSnapshot,
    regenerateDraft: overrides.regenerateDraft ?? regenerateDraft,
  });
};
