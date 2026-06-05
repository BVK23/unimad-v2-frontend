import type { ApplicationAssetApiType } from "@/features/application-assets/types";
import { COLD_EMAIL_LIST_QUERY_KEY } from "@/features/cold-email/hooks/useColdEmailHistory";
import type { ColdEmailAsset } from "@/features/cold-email/types";
import { COVER_LETTER_LIST_QUERY_KEY } from "@/features/cover-letter/hooks/useCoverLetterHistory";
import type { CoverLetterAsset } from "@/features/cover-letter/types";
import { REFERRAL_LIST_QUERY_KEY } from "@/features/referral/hooks/useReferralHistory";
import type { ReferralAsset } from "@/features/referral/types";
import type { QueryClient } from "@tanstack/react-query";

export type ApplicationAssetListItem = CoverLetterAsset | ColdEmailAsset | ReferralAsset;

export const listQueryKeyForAssetType = (assetType: ApplicationAssetApiType): readonly unknown[] => {
  switch (assetType) {
    case "coverletter":
      return COVER_LETTER_LIST_QUERY_KEY;
    case "coldemail":
      return COLD_EMAIL_LIST_QUERY_KEY;
    case "referral":
      return REFERRAL_LIST_QUERY_KEY;
  }
};

export const prependApplicationAssetToListCache = (
  queryClient: QueryClient,
  assetType: ApplicationAssetApiType,
  item: ApplicationAssetListItem
) => {
  const queryKey = listQueryKeyForAssetType(assetType);
  queryClient.setQueryData<ApplicationAssetListItem[]>(queryKey, old => {
    const list = old ?? [];
    const nextId = String(item.id);
    if (list.some(entry => String(entry.id) === nextId)) {
      return list.map(entry => (String(entry.id) === nextId ? { ...entry, ...item } : entry));
    }
    return [item, ...list];
  });
};

export const refetchApplicationAssetList = async (queryClient: QueryClient, assetType: ApplicationAssetApiType) => {
  await queryClient.refetchQueries({ queryKey: listQueryKeyForAssetType(assetType) });
};
