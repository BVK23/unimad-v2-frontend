import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useOptionalAdkChatContext } from "@/components/chat/AdkChatProvider";
import { ModalPortalOverlay } from "@/components/ui/ModalPortalOverlay";
import { PanelResizeHandle } from "@/components/ui/PanelResizeHandle";
import { loadPersistedActiveSessionId } from "@/features/adk-chat/active-session-persist";
import { useAdkApplicationAssetReviewStore } from "@/features/adk-chat/stores/useAdkApplicationAssetReviewStore";
import {
  APPLICATION_ASSET_EVENTS,
  IMPROVE_INITIAL_DRAFT_PROMPT,
  type ApplicationAssetDraftFailedDetail,
  type ApplicationAssetDraftPreviewDetail,
  type ApplicationAssetDraftReadyDetail,
  type ApplicationAssetOpenImproveDetail,
  type ApplicationAssetReviewAcceptedDetail,
  type ApplyApplicationAssetDetail,
  type RequestApplicationAssetDraftDetail,
} from "@/features/application-assets/api/application-asset-events";
import { runApplicationAssetDraftGeneration } from "@/features/application-assets/api/runApplicationAssetDraftGeneration";
import { useApplicationAssetReviewActions } from "@/features/application-assets/hooks/useApplicationAssetReviewActions";
import { useApplicationAssetStudioStore } from "@/features/application-assets/store/useApplicationAssetStudioStore";
import { API_TYPE_TO_STUDIO_TOPIC, STUDIO_TOPIC_TO_API_TYPE, type ApplicationAssetStudioTopic } from "@/features/application-assets/types";
import { getLinkedAssetId, parseApplicationAssets } from "@/features/application-tracker/application-assets";
import { useApplications } from "@/features/application-tracker/hooks/useApplications";
import { useColdEmailHistory, useGenerateColdEmail, type GenerateColdEmailResult } from "@/features/cold-email/hooks";
import { COLD_EMAIL_LIST_QUERY_KEY } from "@/features/cold-email/hooks/useColdEmailHistory";
import { deleteColdEmail, fetchColdEmailById, updateColdEmail } from "@/features/cold-email/server-actions/cold-email-actions";
import type { ColdEmailAsset } from "@/features/cold-email/types";
import { funnelDisplayLabel, type ContentGenFunnel } from "@/features/content-lab/api/adk-mappers";
import {
  CONTENT_GEN_EVENTS,
  CONTENT_GEN_PUBLISH_BLOCKED_MESSAGE,
  type ApplyContentGenTopicDetail,
  type ContentGenDraftFailedDetail,
  type ContentGenDraftPreviewDetail,
  type ContentGenDraftReadyDetail,
  type ContentGenPublishBlockedDetail,
  type ContentGenPublishFailedDetail,
  type RequestContentGenDraftDetail,
  type RequestContentGenPublishDetail,
} from "@/features/content-lab/api/content-gen-events";
import { ensureContentGenAssetPersisted } from "@/features/content-lab/api/ensureContentGenAssetPersisted";
import { mapContentGenToModalPost, type ContentGenModalPost } from "@/features/content-lab/api/mapContentGenToModalPost";
import {
  ADK_DRAFT_PENDING_ERROR,
  runContentGenDraftGeneration,
  type RunContentGenDraftResult,
} from "@/features/content-lab/hooks/runContentGenDraftGeneration";
import {
  deleteContentGenAsset,
  fetchContentGenAssets,
  postContentGenToLinkedIn,
  uploadContentGenMedia,
  updateContentGenAsset,
} from "@/features/content-lab/server-actions/content-lab-actions";
import { useContentGenStudioStore } from "@/features/content-lab/store/useContentGenStudioStore";
import type { ContentGenAssetItem } from "@/features/content-lab/types";
import { exportCoverLetterAsPDF } from "@/features/cover-letter/hooks/export-cover-letter-pdf";
import { useCoverLetterHistory } from "@/features/cover-letter/hooks/useCoverLetterHistory";
import { COVER_LETTER_LIST_QUERY_KEY } from "@/features/cover-letter/hooks/useCoverLetterHistory";
import { useGenerateCoverLetter, type GenerateCoverLetterResult } from "@/features/cover-letter/hooks/useGenerateCoverLetter";
import { deleteCoverLetter, fetchCoverLetterById, updateCoverLetter } from "@/features/cover-letter/server-actions/cover-letter-actions";
import type { CoverLetterAsset } from "@/features/cover-letter/types";
import { useLinkedInAnalysis } from "@/features/linkedin/hooks/useLinkedInAnalysis";
import { resolveLinkedInPublishAccess } from "@/features/linkedin/utils/linkedinPublishAccess";
import { useOnboardingGate } from "@/features/onboarding/context/OnboardingGateContext";
import { useReferralHistory, useGenerateReferral, type GenerateReferralResult } from "@/features/referral/hooks";
import { REFERRAL_LIST_QUERY_KEY } from "@/features/referral/hooks/useReferralHistory";
import { deleteReferral, fetchReferralById, updateReferral } from "@/features/referral/server-actions/referral-actions";
import type { ReferralAsset } from "@/features/referral/types";
import { useProfileData } from "@/features/user-profile/hooks/use-profile-data";
import { resolveLinkedInPostAuthorDisplay } from "@/features/user-profile/utils/resolve-linkedin-post-author";
import { useDocumentAutosave } from "@/hooks/useDocumentAutosave";
import { useResizablePanelWidth } from "@/hooks/useResizablePanelWidth";
import {
  clearPrepareReturnSession,
  getPrepareReturnSession,
  setPrepareReturnContentSnapshot,
  setPrepareReturnSession,
  type PrepareApplicationReturnSession,
  type PrepareApplicationTab,
} from "@/lib/jobs/prepare-application-return";
import {
  buildJobsPrepareReopenHref,
  buildStudioAssetOnlyHref,
  buildStudioSearchParams,
  parseStudioSearchParams,
} from "@/lib/jobs/prepare-application-url";
import { getRegistryRow } from "@/src/features/adk-chat/session-registry";
import { getJob } from "@/src/features/jobs/server-actions/jobs-actions";
import { computeAdkUserId } from "@/utils/adkUserId";
import { exportApplicationAssetAsDocx } from "@/utils/export-application-asset-file";
import { htmlToPlainText } from "@/utils/html-to-text";
import { sanitizeUserFacingError } from "@/utils/message-from-failed-response";
import { normalizeContentToHtml } from "@/utils/normalize-content-to-html";
import { useQueryClient } from "@tanstack/react-query";
import { ThumbsUp, MessageSquare, Repeat, Send, MoreHorizontal, Wand2, Plus, History, Upload, Info } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PortfolioItem } from "../../types";
import { GeneratorContext } from "../../types/jobs";
import { PrepareApplicationReturnBar } from "../jobs/PrepareApplicationReturnBar";
import AllDocumentsModal from "./AllDocumentsModal";
import AllPostsModal from "./AllPostsModal";
import AllVPDsModal from "./AllVPDsModal";
import DocumentListCard from "./DocumentListCard";
import LinkedInOptimizeBanner from "./LinkedInOptimizeBanner";
import LinkedInPostAuthorHeader from "./LinkedInPostAuthorHeader";
import LinkedInPostListCard from "./LinkedInPostListCard";
import { LinkedInPublishAccessTooltipWrap } from "./LinkedInPublishAccessNotice";
import PostSchedulerModal from "./PostSchedulerModal";
import StudioDocumentPreview from "./StudioDocumentPreview";
import StudioMediaPreviewImage from "./StudioMediaPreviewImage";
import StudioSectionDot from "./StudioSectionDot";
import VpdEditorWindow from "./VpdEditorWindow";
import VpdLibraryCard from "./VpdLibraryCard";
import VpdPreview from "./VpdPreview";
import { DocumentLibraryItem } from "./documentLibraryTypes";
import { mapColdEmailToDocumentItem, mapCoverLetterToDocumentItem, mapReferralToDocumentItem } from "./studioDocumentMappers";
import { getTopicDescription, getTopicMeta, TOPIC_GROUPS } from "./studioTopicConfig";
import { MOCK_VPDS, buildVpdProjectFromDraft, createDefaultVpdProject, type VpdListItem } from "./vpdStudioHelpers";

interface StudioMainProps {
  initialContext?: GeneratorContext | null;
  initialAssetId?: string | null;
}

const MOODS = ["Professional", "Casual", "Enthusiastic", "Thought Leadership", "Storytelling"];
const CONTENT_TYPES = ["Career Update", "Industry Insight", "Personal Story", "Project Showcase", "Advice"];

const DOCUMENT_TOPIC_LABELS: Record<"cover-letter" | "cold-email" | "referral", string> = {
  "cover-letter": "Cover Letters",
  "cold-email": "Cold Emails",
  referral: "Referral Requests",
};

const isDocumentTopic = (topic: string): topic is ApplicationAssetStudioTopic =>
  topic === "cover-letter" || topic === "cold-email" || topic === "referral";

function isPrepareReturnTab(type: string): type is PrepareApplicationTab {
  return type === "cover-letter" || type === "cold-email" || type === "vpd";
}

const PREPARE_MODE_LOCKED_TOPICS = new Set(["linkedin-post", "referral"]);

function isPrepareModeStudioTab(topic: string): topic is PrepareApplicationTab {
  return topic === "cover-letter" || topic === "cold-email" || topic === "vpd";
}

const documentTopicToApiType = (topic: ApplicationAssetStudioTopic) => STUDIO_TOPIC_TO_API_TYPE[topic];

const jobDescriptionFromAsset = (asset: { job_description?: string; jd?: string }) => (asset.job_description ?? asset.jd ?? "").trim();

const savedApplicationAssetIdForTopic = (
  topicId: string,
  drafts: {
    cover: CoverLetterAsset | null;
    cold: ColdEmailAsset | null;
    referral: ReferralAsset | null;
  }
): string | undefined => {
  if (topicId === "cover-letter" && drafts.cover?.id) {
    const id = String(drafts.cover.id).trim();
    return id || undefined;
  }
  if (topicId === "cold-email" && drafts.cold?.id) {
    const id = String(drafts.cold.id).trim();
    return id || undefined;
  }
  if (topicId === "referral" && drafts.referral?.id) {
    const id = String(drafts.referral.id).trim();
    return id || undefined;
  }
  return undefined;
};

const isSameDocumentId = (a: string | number | null | undefined, b: string | number | null | undefined) =>
  a != null && b != null && String(a) === String(b);

// Mock Scheduled Posts
const MOCK_SCHEDULED = [
  {
    id: 1,
    content: "Just finished a great workshop on Design Systems! 🎨 #UX #Design",
    date: "Tomorrow, 10:00 AM",
  },
  {
    id: 2,
    content: "Looking for recommendations on the best prototyping tools for 2024. 👇",
    date: "Fri, 2:00 PM",
  },
];

// Mock History (non–LinkedIn tabs; includes `status` for All Posts filter)
const MOCK_HISTORY = [
  {
    id: 101,
    content: "Excited to share that I've joined Unimad as a Product Designer! 🚀",
    stats: "1.2k views • 45 likes",
    date: "2 days ago",
    status: "Posted" as const,
  },
  {
    id: 102,
    content: "My top 3 takeaways from Config 2023. A thread 🧵",
    stats: "3.5k views • 120 likes",
    date: "1 week ago",
    status: "Posted" as const,
  },
];

type ComposerPost = {
  id: number | string;
  content: string;
  date?: string;
  dateScheduled?: string;
  stats?: string;
  isScheduled?: boolean;
  topic?: string;
  status?: string;
};

type LinkedinPendingMediaItem = {
  id: string;
  file: File;
  objectUrl: string;
};

const newLinkedinPendingMediaId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `pending-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const normalizeLinkedinPostError = (rawMessage: string): string => {
  const message = rawMessage.toLowerCase();

  if (message.includes("unauthorized") || message.includes("token") || message.includes("expired")) {
    return "Your LinkedIn session has expired. Please reconnect and try again.";
  }

  if (message.includes("empty") || message.includes("content")) {
    return "Your post looks empty. Add some content and try again.";
  }

  if (message.includes("already posted") || message.includes("already")) {
    return "This post was already published from Unimad. Create a fresh draft to post again.";
  }

  const trimmed = rawMessage.trim();
  if (!trimmed) {
    return "We couldn't publish to LinkedIn right now. Please try again in a moment.";
  }
  return trimmed.length > 420 ? `${trimmed.slice(0, 420)}…` : trimmed;
};

const ASSET_DRAFT_ERROR_FALLBACK = "Draft generation failed. Please try again.";

const StudioMainV2: React.FC<StudioMainProps> = ({ initialContext, initialAssetId }) => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { profileSetupRequired, promptProfileSetup } = useOnboardingGate();
  const { data: profileData } = useProfileData();
  const adkChat = useOptionalAdkChatContext();
  const reviewUserId =
    adkChat?.userId ??
    computeAdkUserId(
      profileData
        ? {
            email: profileData.email ?? undefined,
            name: profileData.name ?? undefined,
          }
        : undefined
    );
  const reviewSessionId = adkChat?.sessionId ?? (reviewUserId ? (loadPersistedActiveSessionId(reviewUserId) ?? "") : "");
  const reviewMainSessionId = useMemo(() => {
    if (!reviewSessionId) return "";
    const row = getRegistryRow(reviewSessionId);
    if (row?.kind === "sub" && row.parent_adk_session_id) {
      return row.parent_adk_session_id;
    }
    return reviewSessionId;
  }, [reviewSessionId]);
  const adkApplicationAssetReviewStack = useAdkApplicationAssetReviewStore(s => s.reviewStack);
  const activeApplicationAssetReview = useAdkApplicationAssetReviewStore(s => s.reviewStack.at(-1) ?? null);
  const selectionRefineLoading = useApplicationAssetStudioStore(s => s.selectionRefineLoading);
  const {
    adkReviewBusy: applicationAssetReviewBusy,
    acceptApplicationAssetReview,
    discardApplicationAssetReview,
  } = useApplicationAssetReviewActions({ userId: reviewUserId, mainSessionId: reviewMainSessionId });
  const clearApplicationAssetSelection = useApplicationAssetStudioStore(s => s.clearSelection);
  const isHydratingFromUrlRef = useRef(false);
  const hydratedAssetKeyRef = useRef<string | null>(null);
  const improveDispatchedRef = useRef(false);
  const syncedDocumentUrlIdRef = useRef<string | null>(null);
  /** Prevents URL→state sync from undoing an in-flight topic tab click before the router updates. */
  const pendingTopicRef = useRef<string | null>(null);
  /** Preserves LinkedIn draft when switching Studio tabs (`generatedContent` is LinkedIn-only while on that tab). */
  const preservedLinkedinTabRef = useRef<{
    assetId: string | null;
    content: string;
    images: string[];
    topicIdea: string;
    funnel: ContentGenFunnel | null;
  } | null>(null);
  /** After generate, asset `content` is still empty on server; URL hydration must not overwrite the in-memory draft. */
  const linkedinPreserveDraftForAssetIdRef = useRef<string | null>(null);
  const linkedinPersistDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [prepareReturn, setPrepareReturn] = useState<PrepareApplicationReturnSession | null>(null);
  const { data: applications = [] } = useApplications();
  const prepareApplication = useMemo(() => {
    if (!prepareReturn?.jobId) return undefined;
    return (
      applications.find(a => a.application_id === prepareReturn.jobId) ??
      applications.find(a => a.job_id != null && String(a.job_id) === prepareReturn.jobId)
    );
  }, [applications, prepareReturn?.jobId]);
  const prepareApplicationAssets = useMemo(() => parseApplicationAssets(prepareApplication?.assets), [prepareApplication?.assets]);
  const prepareApplicationId = prepareApplication?.application_id ?? null;
  // V2 Force Refresh
  const [selectedTopic, setSelectedTopic] = useState<string>(initialContext?.type ?? "linkedin-post");
  const [generatedContent, setGeneratedContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [applicationAssetDraftLoading, setApplicationAssetDraftLoading] = useState(false);
  const [documentGeneratingTopic, setDocumentGeneratingTopic] = useState<ApplicationAssetStudioTopic | null>(null);
  const [reviewAcceptSaving, setReviewAcceptSaving] = useState(false);
  const [reviewAcceptSavedVisible, setReviewAcceptSavedVisible] = useState(false);
  const reviewAcceptSavingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reviewAcceptSavedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasApplicationAssetPendingRevision = adkApplicationAssetReviewStack.length > 0;
  const documentAssetApiType = isDocumentTopic(selectedTopic) ? documentTopicToApiType(selectedTopic) : null;
  const isDocumentDraftLoadingForTopic =
    applicationAssetDraftLoading && documentGeneratingTopic != null && documentGeneratingTopic === selectedTopic;
  const isDocumentAdkLoading = isDocumentDraftLoadingForTopic || selectionRefineLoading;

  const clearReviewAcceptSaveTimers = useCallback(() => {
    if (reviewAcceptSavingTimerRef.current) {
      clearTimeout(reviewAcceptSavingTimerRef.current);
      reviewAcceptSavingTimerRef.current = null;
    }
    if (reviewAcceptSavedTimerRef.current) {
      clearTimeout(reviewAcceptSavedTimerRef.current);
      reviewAcceptSavedTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isDocumentTopic(selectedTopic)) {
      clearApplicationAssetSelection();
    }
  }, [selectedTopic, clearApplicationAssetSelection]);

  useEffect(() => {
    return () => {
      clearReviewAcceptSaveTimers();
    };
  }, [clearReviewAcceptSaveTimers]);

  // LinkedIn specific state
  const [mood, setMood] = useState("Professional");
  const [contentType, setContentType] = useState("Career Update");
  const [topicIdea, setTopicIdea] = useState("");
  const [linkedinFunnel, setLinkedinFunnel] = useState<ContentGenFunnel | null>(null);
  const [linkedinPostAssetId, setLinkedinPostAssetId] = useState<string | null>(null);
  const [linkedinGenerateError, setLinkedinGenerateError] = useState<string | null>(null);
  const [linkedinPersistError, setLinkedinPersistError] = useState<string | null>(null);
  const [linkedinImages, setLinkedinImages] = useState<string[]>([]);
  const [isUploadingLinkedinMedia, setIsUploadingLinkedinMedia] = useState(false);
  const [linkedinMediaError, setLinkedinMediaError] = useState<string | null>(null);
  const [linkedinPendingMedia, setLinkedinPendingMedia] = useState<LinkedinPendingMediaItem[]>([]);
  const linkedinFileInputRef = useRef<HTMLInputElement | null>(null);
  const linkedinPendingMediaRef = useRef<LinkedinPendingMediaItem[]>([]);
  const linkedinPostAssetIdRef = useRef<string | null>(null);
  const updateStudioUrlRef = useRef<(args: { type?: string; id?: string }) => void>(() => {});

  const { data: linkedInAnalysis } = useLinkedInAnalysis({ enabled: selectedTopic === "linkedin-post" });
  const linkedInPostAuthor = useMemo(
    () => resolveLinkedInPostAuthorDisplay(profileData, linkedInAnalysis),
    [profileData, linkedInAnalysis]
  );
  const linkedInPublishAccess = useMemo(() => resolveLinkedInPublishAccess(profileData), [profileData]);

  useEffect(() => {
    linkedinPendingMediaRef.current = linkedinPendingMedia;
  }, [linkedinPendingMedia]);

  useEffect(() => {
    linkedinPostAssetIdRef.current = linkedinPostAssetId;
  }, [linkedinPostAssetId]);

  const clearLinkedinPendingMedia = useCallback(() => {
    setLinkedinPendingMedia(prev => {
      prev.forEach(p => URL.revokeObjectURL(p.objectUrl));
      return [];
    });
    linkedinPendingMediaRef.current = [];
  }, []);

  const [publishModalSeed, setPublishModalSeed] = useState<{ isScheduled: boolean; date?: Date } | null>(null);

  const handleOpenContentGenTopic = useCallback(() => {
    window.dispatchEvent(
      new CustomEvent("open-content-gen-topic", {
        detail: { seedTopic: topicIdea.trim() || undefined, requestKey: Date.now() },
      })
    );
  }, [topicIdea]);

  const handlePostSchedulerImprove = useCallback((content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;
    setGeneratedContent(trimmed);
    setShowScheduler(false);
    setPublishModalSeed(null);
    setSelectedPostData(null);
    window.dispatchEvent(
      new CustomEvent("open-content-gen-topic", {
        detail: {
          followUpText: `${IMPROVE_INITIAL_DRAFT_PROMPT}:\n\n${trimmed}`,
          topicTitle: "Improve LinkedIn Post",
          reuseExistingTopic: true,
          requestKey: Date.now(),
        },
      })
    );
  }, []);

  // Specific Form States
  const [role, setRole] = useState(initialContext?.role ?? "");
  const [company, setCompany] = useState(initialContext?.company ?? "");
  const [jobDescription, setJobDescription] = useState(initialContext?.description ?? "");
  const [managerName, setManagerName] = useState("");
  const [connectionName, setConnectionName] = useState(initialContext?.recipientName ?? "");

  // VPD Specific State
  const [vpdProject, setVpdProject] = useState<PortfolioItem>(createDefaultVpdProject());
  const [savedVpds, setSavedVpds] = useState<VpdListItem[]>(MOCK_VPDS);
  const [vpdLibraryTab, setVpdLibraryTab] = useState<"recents" | "templates">("recents");

  // Document library state
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | number | null>(null);
  const [showAllDocumentsModal, setShowAllDocumentsModal] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [scheduledPosts, setScheduledPosts] = useState(MOCK_SCHEDULED);
  const [postHistory, setPostHistory] = useState(MOCK_HISTORY);
  const [linkedinContentGenAssets, setLinkedinContentGenAssets] = useState<ContentGenAssetItem[]>([]);

  // "All Posts" Modal State
  const [showAllPostsModal, setShowAllPostsModal] = useState(false);
  const [allPostsInitialTab, setAllPostsInitialTab] = useState<"scheduled" | "history">("scheduled");

  // "All VPDs" Modal State
  const [showAllVPDsModal, setShowAllVPDsModal] = useState(false);
  const [showVpdEditor, setShowVpdEditor] = useState(false);
  // Edit/View Post State
  const [selectedPostData, setSelectedPostData] = useState<ComposerPost | null>(null);

  // Document draft state
  const [currentCoverLetterDraft, setCurrentCoverLetterDraft] = useState<CoverLetterAsset | null>(null);
  const [currentColdEmailDraft, setCurrentColdEmailDraft] = useState<ColdEmailAsset | null>(null);
  const [currentReferralDraft, setCurrentReferralDraft] = useState<ReferralAsset | null>(null);
  const [copyToast, setCopyToast] = useState(false);
  const [coldEmailCopyToast, setColdEmailCopyToast] = useState(false);
  const [referralCopyToast, setReferralCopyToast] = useState(false);
  const [coverLetterFormError, setCoverLetterFormError] = useState<string | null>(null);
  const [coldEmailFormError, setColdEmailFormError] = useState<string | null>(null);
  const [referralFormError, setReferralFormError] = useState<string | null>(null);
  const [coverLetterDuplicateModal, setCoverLetterDuplicateModal] = useState<{
    existingAssetId: string | number;
    params: { role: string; company: string; job_description: string };
  } | null>(null);
  const [coldEmailDuplicateModal, setColdEmailDuplicateModal] = useState<{
    existingAssetId: string | number;
    params: { role: string; company: string; job_description: string; hirname: string };
  } | null>(null);
  const [coverLetterSubscriptionModal, setCoverLetterSubscriptionModal] = useState(false);
  const [coldEmailSubscriptionModal, setColdEmailSubscriptionModal] = useState(false);
  const [referralDuplicateModal, setReferralDuplicateModal] = useState<{
    existingAssetId: string | number;
    params: { role: string; company: string; conname: string };
  } | null>(null);
  const [referralSubscriptionModal, setReferralSubscriptionModal] = useState(false);

  const lastCoverLetterParamsRef = useRef<{ role: string; company: string; job_description: string } | null>(null);
  const lastColdEmailParamsRef = useRef<{
    role: string;
    company: string;
    job_description: string;
    hirname: string;
  } | null>(null);
  const lastReferralParamsRef = useRef<{ role: string; company: string; conname: string } | null>(null);
  const documentContentRef = useRef("");

  const { data: coverLetterHistory = [] } = useCoverLetterHistory();
  const { data: coldEmailHistory = [] } = useColdEmailHistory();
  const { data: referralHistory = [] } = useReferralHistory();

  const refreshLinkedinAssets = useCallback(async () => {
    try {
      const list = await fetchContentGenAssets();
      setLinkedinContentGenAssets(list);
    } catch {
      setLinkedinContentGenAssets([]);
    }
  }, []);

  const linkedinScheduledModalPosts = useMemo(
    () => linkedinContentGenAssets.filter(a => a.status === "Scheduled").map(mapContentGenToModalPost),
    [linkedinContentGenAssets]
  );

  const linkedinHistoryModalPosts = useMemo(
    () =>
      linkedinContentGenAssets
        .filter(a => a.status !== "Scheduled" && (a.content?.trim() || a.topic?.trim()))
        .map(mapContentGenToModalPost),
    [linkedinContentGenAssets]
  );

  const scheduledPostsForModal = useMemo(() => {
    if (selectedTopic === "linkedin-post") {
      return linkedinScheduledModalPosts;
    }
    return scheduledPosts;
  }, [selectedTopic, linkedinScheduledModalPosts, scheduledPosts]);

  const historyPostsForModal = useMemo(() => {
    if (selectedTopic === "linkedin-post") {
      return linkedinHistoryModalPosts;
    }
    return postHistory;
  }, [selectedTopic, linkedinHistoryModalPosts, postHistory]);

  useEffect(() => {
    if (selectedTopic === "linkedin-post") {
      void refreshLinkedinAssets();
    }
  }, [selectedTopic, refreshLinkedinAssets]);

  const applyReferralDraftToForm = (asset: ReferralAsset | null) => {
    if (!asset) return;
    setRole(asset.role ?? "");
    setCompany(asset.company ?? "");
    setConnectionName(asset.conname ?? "");
    setGeneratedContent(asset.content ?? "");
    setSelectedDocumentId(asset.id);
  };

  const applyCoverLetterDraftToForm = (asset: CoverLetterAsset | null) => {
    if (!asset) return;
    setRole(asset.role ?? "");
    setCompany(asset.company ?? "");
    setJobDescription(jobDescriptionFromAsset(asset));
    setGeneratedContent(asset.content ?? "");
    setSelectedDocumentId(asset.id);
  };

  const applyColdEmailDraftToForm = (asset: ColdEmailAsset | null) => {
    if (!asset) return;
    setRole(asset.role ?? "");
    setCompany(asset.company ?? "");
    setJobDescription(jobDescriptionFromAsset(asset));
    setManagerName(asset.hirname ?? "");
    setGeneratedContent(asset.content ?? "");
    setSelectedDocumentId(asset.id);
  };

  const clearDocumentFormFields = useCallback(() => {
    setRole("");
    setCompany("");
    setJobDescription("");
    setManagerName("");
    setConnectionName("");
    setSelectedDocumentId(null);
  }, []);

  const applyPrepareJobFormDefaults = useCallback(() => {
    if (!prepareReturn) return;
    if (prepareReturn.role) setRole(prepareReturn.role);
    if (prepareReturn.company) setCompany(prepareReturn.company);
    if (prepareApplication?.job_description?.trim()) {
      setJobDescription(prepareApplication.job_description);
    }
  }, [prepareApplication?.job_description, prepareReturn]);

  const updatePrepareReturnTab = useCallback((tab: PrepareApplicationTab) => {
    setPrepareReturn(prev => {
      if (!prev || prev.tab === tab) return prev;
      const next = { ...prev, tab };
      setPrepareReturnSession(next);
      return next;
    });
  }, []);

  const documentItemsForTopic = useMemo((): DocumentLibraryItem[] => {
    if (selectedTopic === "cover-letter") {
      return coverLetterHistory.map(mapCoverLetterToDocumentItem);
    }
    if (selectedTopic === "cold-email") {
      return coldEmailHistory.map(mapColdEmailToDocumentItem);
    }
    if (selectedTopic === "referral") {
      return referralHistory.map(mapReferralToDocumentItem);
    }
    return [];
  }, [selectedTopic, coverLetterHistory, coldEmailHistory, referralHistory]);

  const activeRecentDocumentId = useMemo((): string | number | null => {
    if (!isDocumentTopic(selectedTopic)) return null;

    const urlId = searchParams.get("id")?.trim() || null;
    const draftId =
      selectedTopic === "cover-letter"
        ? currentCoverLetterDraft?.id
        : selectedTopic === "cold-email"
          ? currentColdEmailDraft?.id
          : currentReferralDraft?.id;
    const normalizedDraftId = draftId != null && String(draftId).trim() ? draftId : null;

    if (normalizedDraftId && urlId) {
      return isSameDocumentId(normalizedDraftId, urlId) ? normalizedDraftId : urlId;
    }
    if (normalizedDraftId) return normalizedDraftId;
    if (urlId) return urlId;
    return selectedDocumentId;
  }, [selectedTopic, currentCoverLetterDraft?.id, currentColdEmailDraft?.id, currentReferralDraft?.id, searchParams, selectedDocumentId]);

  useEffect(() => {
    if (!isDocumentTopic(selectedTopic)) {
      syncedDocumentUrlIdRef.current = null;
      return;
    }

    const urlId = searchParams.get("id")?.trim() || null;
    if (!urlId) {
      syncedDocumentUrlIdRef.current = null;
      return;
    }

    if (syncedDocumentUrlIdRef.current === urlId) {
      return;
    }

    syncedDocumentUrlIdRef.current = urlId;
    improveDispatchedRef.current = false;
    setSelectedDocumentId(prev => (isSameDocumentId(prev, urlId) ? prev : urlId));
  }, [searchParams, selectedTopic]);

  const handleApplicationAssetDraftStarted = useCallback(
    (result: GenerateCoverLetterResult | GenerateColdEmailResult | GenerateReferralResult, topic: ApplicationAssetStudioTopic) => {
      if ("error" in result && result.error) {
        setApplicationAssetDraftLoading(false);
        if (topic === "cover-letter") {
          setCoverLetterFormError(sanitizeUserFacingError(result.error, ASSET_DRAFT_ERROR_FALLBACK));
        } else if (topic === "cold-email") {
          setColdEmailFormError(sanitizeUserFacingError(result.error, ASSET_DRAFT_ERROR_FALLBACK));
        } else {
          setReferralFormError(sanitizeUserFacingError(result.error, ASSET_DRAFT_ERROR_FALLBACK));
        }
        return;
      }
      if ("success" in result && result.success) {
        setApplicationAssetDraftLoading(false);
        setGeneratedContent(result.content);
        if (result.assetId) {
          const assetId = String(result.assetId);
          setSelectedDocumentId(assetId);
          updateStudioUrlRef.current({ type: topic, id: assetId });
          const accepted = { content: result.content, status: "accepted" as const };
          if (topic === "cover-letter") {
            setCurrentCoverLetterDraft(prev =>
              prev && String(prev.id) === assetId
                ? { ...prev, ...accepted, id: assetId }
                : {
                    id: assetId,
                    role: result.role,
                    company: result.company,
                    job_description: result.job_description ?? "",
                    ...accepted,
                  }
            );
          } else if (topic === "cold-email") {
            setCurrentColdEmailDraft(prev =>
              prev && String(prev.id) === assetId
                ? { ...prev, ...accepted, id: assetId }
                : {
                    id: assetId,
                    role: result.role,
                    company: result.company,
                    job_description: result.job_description ?? "",
                    hirname: result.contactName ?? "",
                    ...accepted,
                  }
            );
          } else {
            setCurrentReferralDraft(prev =>
              prev && String(prev.id) === assetId
                ? { ...prev, ...accepted, id: assetId }
                : {
                    id: assetId,
                    role: result.role,
                    company: result.company,
                    conname: result.contactName ?? "",
                    ...accepted,
                  }
            );
          }
        }
        return;
      }
      if ("duplicate" in result || "subscriptionRequired" in result) {
        setApplicationAssetDraftLoading(false);
      }
    },
    []
  );

  const clearApplicationAssetDraftLoading = useCallback(() => {
    setApplicationAssetDraftLoading(false);
    setDocumentGeneratingTopic(null);
  }, []);

  const generateCoverLetterMutation = useGenerateCoverLetter({
    onSuccess: (result: GenerateCoverLetterResult) => {
      handleApplicationAssetDraftStarted(result, "cover-letter");
      if ("success" in result && result.success) {
        void queryClient.invalidateQueries({ queryKey: ["applications"] });
      }
      if ("subscriptionRequired" in result && result.subscriptionRequired) {
        setCoverLetterSubscriptionModal(true);
      }
    },
    onError: (msg: string) => setCoverLetterFormError(sanitizeUserFacingError(msg, ASSET_DRAFT_ERROR_FALLBACK)),
    onSettled: clearApplicationAssetDraftLoading,
  });

  const generateColdEmailMutation = useGenerateColdEmail({
    onSuccess: (result: GenerateColdEmailResult) => {
      handleApplicationAssetDraftStarted(result, "cold-email");
      if ("success" in result && result.success) {
        void queryClient.invalidateQueries({ queryKey: ["applications"] });
      }
      if ("subscriptionRequired" in result && result.subscriptionRequired) {
        setColdEmailSubscriptionModal(true);
      }
    },
    onError: (msg: string) => setColdEmailFormError(sanitizeUserFacingError(msg, ASSET_DRAFT_ERROR_FALLBACK)),
    onSettled: clearApplicationAssetDraftLoading,
  });

  const generateReferralMutation = useGenerateReferral({
    onSuccess: (result: GenerateReferralResult) => {
      handleApplicationAssetDraftStarted(result, "referral");
      if ("duplicate" in result && result.duplicate && "existing_asset_id" in result && lastReferralParamsRef.current) {
        setReferralDuplicateModal({
          existingAssetId: result.existing_asset_id,
          params: lastReferralParamsRef.current,
        });
      }
      if ("subscriptionRequired" in result && result.subscriptionRequired) {
        setReferralSubscriptionModal(true);
      }
    },
    onError: (msg: string) => setReferralFormError(sanitizeUserFacingError(msg, ASSET_DRAFT_ERROR_FALLBACK)),
    onSettled: clearApplicationAssetDraftLoading,
  });

  const updateStudioUrl = useCallback(
    ({ type, id }: { type?: string; id?: string }) => {
      const parsed = parseStudioSearchParams(searchParams);
      const nextType = type ?? selectedTopic;
      const nextId = id?.trim() ? id.trim() : undefined;
      const currentType = parsed.type ?? "";
      const currentId = parsed.id ?? "";
      if (currentType === nextType && currentId === (nextId ?? "")) {
        return;
      }
      const params = buildStudioSearchParams({
        id: nextId,
        type: nextType,
        jobId: parsed.jobId,
        navigate: parsed.navigate,
        improve: parsed.improve,
        interviewVpd: parsed.interviewVpd,
      });
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams, selectedTopic]
  );

  updateStudioUrlRef.current = updateStudioUrl;

  const canAutosaveDocument =
    (selectedTopic === "cover-letter" && Boolean(currentCoverLetterDraft?.id)) ||
    (selectedTopic === "cold-email" && Boolean(currentColdEmailDraft?.id)) ||
    (selectedTopic === "referral" && Boolean(currentReferralDraft?.id));

  const persistDocumentContent = useCallback(
    async (content: string) => {
      if (selectedTopic === "cover-letter" && currentCoverLetterDraft?.id) {
        await updateCoverLetter({ id: currentCoverLetterDraft.id, content });
        setCurrentCoverLetterDraft(prev => (prev ? { ...prev, content, status: "accepted" } : prev));
        return;
      }
      if (selectedTopic === "cold-email" && currentColdEmailDraft?.id) {
        await updateColdEmail({ id: currentColdEmailDraft.id, content });
        setCurrentColdEmailDraft(prev => (prev ? { ...prev, content, status: "accepted" } : prev));
        return;
      }
      if (selectedTopic === "referral" && currentReferralDraft?.id) {
        await updateReferral({ id: currentReferralDraft.id, content });
        setCurrentReferralDraft(prev => (prev ? { ...prev, content, status: "accepted" } : prev));
      }
    },
    [selectedTopic, currentCoverLetterDraft, currentColdEmailDraft, currentReferralDraft]
  );

  const {
    hasPendingUnsavedChanges: documentHasPendingUnsavedChanges,
    isSaving: documentIsSaving,
    savedConfirmationVisible: documentSavedConfirmationVisible,
    markDirty: markDocumentDirty,
    runSave: runDocumentSave,
    reset: resetDocumentSaveStatus,
  } = useDocumentAutosave({
    enabled: canAutosaveDocument,
    onSave: async () => {
      await persistDocumentContent(documentContentRef.current);
    },
  });

  const handleDocumentContentChange = useCallback(
    (content: string) => {
      documentContentRef.current = content;
      if (selectedTopic === "cover-letter") {
        setCurrentCoverLetterDraft(prev => (prev ? { ...prev, content } : prev));
      } else if (selectedTopic === "cold-email") {
        setCurrentColdEmailDraft(prev => (prev ? { ...prev, content } : prev));
      } else if (selectedTopic === "referral") {
        setCurrentReferralDraft(prev => (prev ? { ...prev, content } : prev));
      }
      markDocumentDirty();
    },
    [markDocumentDirty, selectedTopic]
  );

  const resolvePrepareDocumentTopic = useCallback(
    async (topicId: "cover-letter" | "cold-email") => {
      resetDocumentSaveStatus();
      pendingTopicRef.current = topicId;
      setSelectedTopic(topicId);
      setIsGenerating(false);
      setGeneratedContent("");
      setLinkedinGenerateError(null);
      setLinkedinPersistError(null);
      setLinkedinMediaError(null);
      clearLinkedinPendingMedia();
      linkedinPreserveDraftForAssetIdRef.current = null;
      syncedDocumentUrlIdRef.current = null;

      const linkedId = getLinkedAssetId(prepareApplicationAssets, topicId);

      if (linkedId) {
        if (topicId === "cover-letter") {
          const full = await fetchCoverLetterById(linkedId);
          if (full) {
            setCurrentCoverLetterDraft(full);
            applyCoverLetterDraftToForm(full);
            setSelectedDocumentId(linkedId);
            updateStudioUrl({ type: topicId, id: linkedId });
          }
        } else {
          const full = await fetchColdEmailById(linkedId);
          if (full) {
            setCurrentColdEmailDraft(full);
            applyColdEmailDraftToForm(full);
            setSelectedDocumentId(linkedId);
            updateStudioUrl({ type: topicId, id: linkedId });
          }
        }
      } else {
        if (topicId === "cover-letter") {
          setCurrentCoverLetterDraft(null);
        } else {
          setCurrentColdEmailDraft(null);
        }
        setSelectedDocumentId(null);
        updateStudioUrl({ type: topicId });
        applyPrepareJobFormDefaults();
      }

      updatePrepareReturnTab(topicId);
    },
    [
      applyColdEmailDraftToForm,
      applyCoverLetterDraftToForm,
      applyPrepareJobFormDefaults,
      clearLinkedinPendingMedia,
      prepareApplicationAssets,
      resetDocumentSaveStatus,
      updatePrepareReturnTab,
      updateStudioUrl,
    ]
  );

  const handleSelectDocument = useCallback(
    async (doc: DocumentLibraryItem) => {
      resetDocumentSaveStatus();
      setSelectedDocumentId(doc.id);
      setGeneratedContent(doc.content);
      if (doc.title.includes(" @ ")) {
        const [r, c] = doc.title.split(" @ ");
        setRole(r?.trim() || "");
        setCompany(c?.trim() || "");
      }
      if (doc.topic === "cover-letter") {
        const full = await fetchCoverLetterById(doc.id);
        if (full) {
          setCurrentCoverLetterDraft(full);
          applyCoverLetterDraftToForm(full);
          updateStudioUrl({ type: doc.topic, id: String(doc.id) });
        }
      } else if (doc.topic === "cold-email") {
        const full = await fetchColdEmailById(doc.id);
        if (full) {
          setCurrentColdEmailDraft(full);
          applyColdEmailDraftToForm(full);
          updateStudioUrl({ type: doc.topic, id: String(doc.id) });
        }
      } else if (doc.topic === "referral") {
        const full = await fetchReferralById(doc.id);
        if (full) {
          setCurrentReferralDraft(full);
          applyReferralDraftToForm(full);
          updateStudioUrl({ type: doc.topic, id: String(doc.id) });
        }
      }
    },
    [resetDocumentSaveStatus, updateStudioUrl]
  );

  const handleDeleteDocument = useCallback(
    async (id: string | number) => {
      const idStr = String(id);
      if (selectedTopic === "cover-letter") {
        await deleteCoverLetter(id);
        void queryClient.invalidateQueries({ queryKey: COVER_LETTER_LIST_QUERY_KEY });
        if (String(currentCoverLetterDraft?.id) === idStr || String(selectedDocumentId) === idStr) {
          setCurrentCoverLetterDraft(null);
          setGeneratedContent("");
          setSelectedDocumentId(null);
          resetDocumentSaveStatus();
          updateStudioUrl({ type: selectedTopic });
        }
      } else if (selectedTopic === "cold-email") {
        await deleteColdEmail(id);
        void queryClient.invalidateQueries({ queryKey: COLD_EMAIL_LIST_QUERY_KEY });
        if (String(currentColdEmailDraft?.id) === idStr || String(selectedDocumentId) === idStr) {
          setCurrentColdEmailDraft(null);
          setGeneratedContent("");
          setSelectedDocumentId(null);
          resetDocumentSaveStatus();
          updateStudioUrl({ type: selectedTopic });
        }
      } else if (selectedTopic === "referral") {
        await deleteReferral(id);
        void queryClient.invalidateQueries({ queryKey: REFERRAL_LIST_QUERY_KEY });
        if (String(currentReferralDraft?.id) === idStr || String(selectedDocumentId) === idStr) {
          setCurrentReferralDraft(null);
          setGeneratedContent("");
          setSelectedDocumentId(null);
          resetDocumentSaveStatus();
          updateStudioUrl({ type: selectedTopic });
        }
      }
    },
    [
      selectedTopic,
      selectedDocumentId,
      currentCoverLetterDraft?.id,
      currentColdEmailDraft?.id,
      currentReferralDraft?.id,
      queryClient,
      resetDocumentSaveStatus,
      updateStudioUrl,
    ]
  );

  const handleSelectVpd = (vpd: VpdListItem) => {
    setVpdProject({ ...vpd.project, id: String(vpd.id), title: vpd.title });
    setGeneratedContent(vpd.project.detailedBlocks?.[0]?.content?.toString() || "");
  };

  const handleCreateNewVpd = () => {
    const fresh = createDefaultVpdProject();
    setVpdProject(fresh);
    setGeneratedContent("");
    setShowVpdEditor(true);
  };

  const handleViewAllDocuments = () => {
    setShowAllDocumentsModal(true);
  };

  const applyDraftGenerationResult = useCallback(
    async (result: RunContentGenDraftResult) => {
      setLinkedinPostAssetId(result.id);
      setGeneratedContent(result.draft);
      setLinkedinImages(result.mergedImageUrls);
      linkedinPreserveDraftForAssetIdRef.current = result.id;
      setLinkedinPendingMedia([]);
      linkedinPendingMediaRef.current = [];
      preservedLinkedinTabRef.current = {
        assetId: result.id,
        content: result.draft,
        images: result.mergedImageUrls,
        topicIdea,
        funnel: linkedinFunnel,
      };
      updateStudioUrl({ type: "linkedin-post", id: result.id });
      const assetsFresh = await fetchContentGenAssets();
      setLinkedinContentGenAssets(assetsFresh);
      void refreshLinkedinAssets();
    },
    [linkedinFunnel, refreshLinkedinAssets, topicIdea, updateStudioUrl]
  );

  const runLinkedinDraftGeneration = useCallback(
    async (topic: string, funnel: ContentGenFunnel | null) => {
      const trimmedTopic = topic.trim();
      if (!trimmedTopic) {
        setLinkedinGenerateError("Add a topic or use the wand to suggest one.");
        return;
      }
      setLinkedinGenerateError(null);
      setIsGenerating(true);
      let keepGenerating = false;
      try {
        const result = await runContentGenDraftGeneration({
          topic: trimmedTopic,
          funnel,
          pendingMedia: linkedinPendingMediaRef.current,
          existingImages: linkedinImages,
          uploadContentGenMedia,
        });
        await applyDraftGenerationResult(result);
      } catch (e) {
        if (e instanceof Error && e.message === ADK_DRAFT_PENDING_ERROR) {
          keepGenerating = true;
          return;
        }
        const msg = e instanceof Error ? e.message : "Something went wrong. Please try again.";
        setLinkedinGenerateError(msg);
      } finally {
        if (!keepGenerating) {
          setIsGenerating(false);
        }
      }
    },
    [applyDraftGenerationResult, linkedinImages]
  );

  useEffect(() => {
    if (selectedTopic !== "linkedin-post") {
      return;
    }
    useContentGenStudioStore.getState().syncFromStudio({
      topic: topicIdea,
      funnel: linkedinFunnel,
      assetId: linkedinPostAssetId,
      draftPreview: generatedContent,
    });
  }, [selectedTopic, topicIdea, linkedinFunnel, linkedinPostAssetId, generatedContent]);

  useEffect(() => {
    if (!isDocumentTopic(selectedTopic)) {
      return;
    }
    const apiType = documentTopicToApiType(selectedTopic);
    let assetId: string | null = null;
    let acceptedContent = "";
    if (selectedTopic === "cover-letter" && currentCoverLetterDraft) {
      assetId = String(currentCoverLetterDraft.id);
      acceptedContent = currentCoverLetterDraft.status === "accepted" ? (currentCoverLetterDraft.content ?? "") : "";
    } else if (selectedTopic === "cold-email" && currentColdEmailDraft) {
      assetId = String(currentColdEmailDraft.id);
      acceptedContent = currentColdEmailDraft.status === "accepted" ? (currentColdEmailDraft.content ?? "") : "";
    } else if (selectedTopic === "referral" && currentReferralDraft) {
      assetId = String(currentReferralDraft.id);
      acceptedContent = currentReferralDraft.status === "accepted" ? (currentReferralDraft.content ?? "") : "";
    }
    useApplicationAssetStudioStore.getState().syncFromStudio({
      assetType: apiType,
      assetId,
      role,
      company,
      jobDescription: jobDescription,
      contactName: selectedTopic === "cold-email" ? managerName : selectedTopic === "referral" ? connectionName : "",
      draftPreview: generatedContent,
      acceptedContent,
    });
  }, [
    selectedTopic,
    role,
    company,
    jobDescription,
    managerName,
    connectionName,
    generatedContent,
    currentCoverLetterDraft,
    currentColdEmailDraft,
    currentReferralDraft,
  ]);

  useEffect(() => {
    const onDraftPreview = (e: Event) => {
      const d = (e as CustomEvent<ApplicationAssetDraftPreviewDetail>).detail;
      if (!d?.draft) {
        return;
      }
      const targetTopic = d.assetType ? API_TYPE_TO_STUDIO_TOPIC[d.assetType] : null;
      if (targetTopic && targetTopic !== selectedTopic) {
        return;
      }
      setGeneratedContent(d.draft);
      const draftRole = d.role !== undefined ? d.role.trim() : role;
      const draftCompany = d.company !== undefined ? d.company.trim() : company;
      const draftJd = d.jobDescription !== undefined ? d.jobDescription.trim() : jobDescription;
      if (d.role !== undefined) {
        setRole(draftRole);
      }
      if (d.company !== undefined) {
        setCompany(draftCompany);
      }
      if (d.jobDescription !== undefined) {
        setJobDescription(draftJd);
      }
      if (d.contactName !== undefined) {
        if (d.assetType === "coldemail") {
          setManagerName(d.contactName);
        } else if (d.assetType === "referral") {
          setConnectionName(d.contactName);
        }
      }
      if (d.assetType && API_TYPE_TO_STUDIO_TOPIC[d.assetType] !== selectedTopic) {
        updateStudioUrl({ type: API_TYPE_TO_STUDIO_TOPIC[d.assetType] });
        setSelectedTopic(API_TYPE_TO_STUDIO_TOPIC[d.assetType]);
      }
      const pending = { content: d.draft, status: "draft" as const };
      const pendingAssetId = d.assetId != null && String(d.assetId).trim() ? String(d.assetId).trim() : null;
      const isNewPendingDraft = !pendingAssetId;
      if (isNewPendingDraft) {
        setSelectedDocumentId(null);
        if (d.assetType) {
          updateStudioUrl({ type: API_TYPE_TO_STUDIO_TOPIC[d.assetType] });
        }
      } else if (pendingAssetId) {
        setSelectedDocumentId(pendingAssetId);
      }
      if (d.assetType === "coverletter") {
        setCurrentCoverLetterDraft(
          isNewPendingDraft
            ? {
                id: "",
                role: draftRole,
                company: draftCompany,
                job_description: draftJd,
                ...pending,
              }
            : prev =>
                prev
                  ? { ...prev, ...pending, id: pendingAssetId!, role: draftRole, company: draftCompany, job_description: draftJd }
                  : {
                      id: pendingAssetId!,
                      role: draftRole,
                      company: draftCompany,
                      job_description: draftJd,
                      ...pending,
                    }
        );
      } else if (d.assetType === "coldemail") {
        setCurrentColdEmailDraft(
          isNewPendingDraft
            ? {
                id: "",
                role: draftRole,
                company: draftCompany,
                job_description: draftJd,
                hirname: d.contactName !== undefined ? d.contactName : managerName,
                ...pending,
              }
            : prev =>
                prev
                  ? { ...prev, ...pending, id: pendingAssetId!, role: draftRole, company: draftCompany, job_description: draftJd }
                  : {
                      id: pendingAssetId!,
                      role: draftRole,
                      company: draftCompany,
                      job_description: draftJd,
                      hirname: managerName,
                      ...pending,
                    }
        );
      } else if (d.assetType === "referral") {
        setCurrentReferralDraft(
          isNewPendingDraft
            ? {
                id: "",
                role: draftRole,
                company: draftCompany,
                conname: d.contactName !== undefined ? d.contactName : connectionName,
                ...pending,
              }
            : prev =>
                prev
                  ? { ...prev, ...pending, id: pendingAssetId!, role: draftRole, company: draftCompany }
                  : {
                      id: pendingAssetId!,
                      role: draftRole,
                      company: draftCompany,
                      conname: connectionName,
                      ...pending,
                    }
        );
      }
      useApplicationAssetStudioStore.getState().syncFromStudio({ draftPreview: d.draft });
    };
    const onDraftReady = (e: Event) => {
      const d = (e as CustomEvent<ApplicationAssetDraftReadyDetail>).detail;
      if (!d?.assetId || !d?.draft) {
        return;
      }
      setApplicationAssetDraftLoading(false);
      setGeneratedContent(d.draft);
      if (d.role?.trim()) {
        setRole(d.role.trim());
      }
      if (d.company?.trim()) {
        setCompany(d.company.trim());
      }
      if (d.jobDescription?.trim()) {
        setJobDescription(d.jobDescription.trim());
      }
      if (d.assetType) {
        const acceptedStudioTopic = API_TYPE_TO_STUDIO_TOPIC[d.assetType];
        updateStudioUrl({ type: acceptedStudioTopic, id: d.assetId });
        if (acceptedStudioTopic !== selectedTopic) {
          setSelectedTopic(acceptedStudioTopic);
        }
      }
      setSelectedDocumentId(d.assetId);
      const accepted = { content: d.draft, status: "accepted" as const };
      if (d.assetType === "coverletter") {
        setCurrentCoverLetterDraft(prev =>
          prev ? { ...prev, ...accepted, id: d.assetId } : { id: d.assetId, role, company, job_description: jobDescription, ...accepted }
        );
        void queryClient.invalidateQueries({ queryKey: COVER_LETTER_LIST_QUERY_KEY });
      } else if (d.assetType === "coldemail") {
        setCurrentColdEmailDraft(prev =>
          prev
            ? { ...prev, ...accepted, id: d.assetId }
            : { id: d.assetId, role, company, job_description: jobDescription, hirname: managerName, ...accepted }
        );
        void queryClient.invalidateQueries({ queryKey: COLD_EMAIL_LIST_QUERY_KEY });
      } else {
        setCurrentReferralDraft(prev =>
          prev ? { ...prev, ...accepted, id: d.assetId } : { id: d.assetId, role, company, conname: connectionName, ...accepted }
        );
        void queryClient.invalidateQueries({ queryKey: REFERRAL_LIST_QUERY_KEY });
      }
      useApplicationAssetStudioStore.getState().syncFromStudio({
        draftPreview: d.draft,
        acceptedContent: d.draft,
      });
    };
    const onStreamComplete = () => {
      setApplicationAssetDraftLoading(false);
      useApplicationAssetStudioStore.getState().setSelectionRefineLoading(false);
    };
    const onReviewAccepted = (e: Event) => {
      const d = (e as CustomEvent<ApplicationAssetReviewAcceptedDetail>).detail;
      const topic = d?.assetType ? API_TYPE_TO_STUDIO_TOPIC[d.assetType] : null;
      if (!topic || topic !== selectedTopic) {
        return;
      }
      clearReviewAcceptSaveTimers();
      setReviewAcceptSavedVisible(false);
      setReviewAcceptSaving(true);
      reviewAcceptSavingTimerRef.current = setTimeout(() => {
        setReviewAcceptSaving(false);
        setReviewAcceptSavedVisible(true);
        reviewAcceptSavedTimerRef.current = setTimeout(() => {
          setReviewAcceptSavedVisible(false);
          reviewAcceptSavedTimerRef.current = null;
        }, 1400);
        reviewAcceptSavingTimerRef.current = null;
      }, 550);
    };
    const onApplyContext = (e: Event) => {
      const d = (e as CustomEvent<ApplyApplicationAssetDetail>).detail;
      if (!d) {
        return;
      }
      const studioTopic = API_TYPE_TO_STUDIO_TOPIC[d.assetType];
      if (studioTopic !== selectedTopic) {
        return;
      }
      const assetIdStr = d.assetId != null && String(d.assetId).trim() ? String(d.assetId).trim() : null;
      setSelectedDocumentId(assetIdStr);
      setRole(d.role);
      setCompany(d.company);
      setJobDescription(d.jobDescription);
      if (d.assetType === "coldemail") {
        setManagerName(d.contactName ?? "");
      } else if (d.assetType === "referral") {
        setConnectionName(d.contactName ?? "");
      }
    };
    window.addEventListener(APPLICATION_ASSET_EVENTS.draftPreview, onDraftPreview);
    window.addEventListener(APPLICATION_ASSET_EVENTS.draftReady, onDraftReady);
    window.addEventListener(APPLICATION_ASSET_EVENTS.draftStreamComplete, onStreamComplete);
    window.addEventListener(APPLICATION_ASSET_EVENTS.reviewAccepted, onReviewAccepted);
    window.addEventListener(APPLICATION_ASSET_EVENTS.applyContext, onApplyContext);
    return () => {
      window.removeEventListener(APPLICATION_ASSET_EVENTS.draftPreview, onDraftPreview);
      window.removeEventListener(APPLICATION_ASSET_EVENTS.draftReady, onDraftReady);
      window.removeEventListener(APPLICATION_ASSET_EVENTS.draftStreamComplete, onStreamComplete);
      window.removeEventListener(APPLICATION_ASSET_EVENTS.reviewAccepted, onReviewAccepted);
      window.removeEventListener(APPLICATION_ASSET_EVENTS.applyContext, onApplyContext);
    };
  }, [
    company,
    connectionName,
    jobDescription,
    managerName,
    queryClient,
    role,
    selectedTopic,
    updateStudioUrl,
    clearReviewAcceptSaveTimers,
  ]);

  useEffect(() => {
    const onRequestDraft = (e: Event) => {
      const d = (e as CustomEvent<RequestApplicationAssetDraftDetail>).detail;
      if (!d?.assetType || !d.role?.trim() || !d.company?.trim()) {
        return;
      }
      const studioTopic = d.assetType === "coverletter" ? "cover-letter" : d.assetType === "coldemail" ? "cold-email" : "referral";
      setApplicationAssetDraftLoading(true);
      setDocumentGeneratingTopic(studioTopic);
      setGeneratedContent("");
      setSelectedDocumentId(null);
      setRole(d.role.trim());
      setCompany(d.company.trim());
      setJobDescription(d.jobDescription ?? "");
      if (d.contactName) {
        if (d.assetType === "coldemail") {
          setManagerName(d.contactName);
        } else if (d.assetType === "referral") {
          setConnectionName(d.contactName);
        }
      }
      if (studioTopic === "cover-letter") {
        setCurrentCoverLetterDraft(null);
        setCoverLetterFormError(null);
      } else if (studioTopic === "cold-email") {
        setCurrentColdEmailDraft(null);
        setColdEmailFormError(null);
      } else {
        setCurrentReferralDraft(null);
        setReferralFormError(null);
      }
      void (async () => {
        try {
          await runApplicationAssetDraftGeneration({
            assetType: d.assetType,
            role: d.role.trim(),
            company: d.company.trim(),
            jobDescription: d.jobDescription ?? "",
            contactName: d.contactName,
            applicationId: d.assetId,
          });
        } catch (err) {
          const message = sanitizeUserFacingError(
            err instanceof Error ? err.message : ASSET_DRAFT_ERROR_FALLBACK,
            ASSET_DRAFT_ERROR_FALLBACK
          );
          if (studioTopic === "cover-letter") {
            setCoverLetterFormError(message);
          } else if (studioTopic === "cold-email") {
            setColdEmailFormError(message);
          } else {
            setReferralFormError(message);
          }
          setApplicationAssetDraftLoading(false);
        }
      })();
    };
    window.addEventListener(APPLICATION_ASSET_EVENTS.requestDraft, onRequestDraft);
    return () => window.removeEventListener(APPLICATION_ASSET_EVENTS.requestDraft, onRequestDraft);
  }, []);

  useEffect(() => {
    const onApplicationAssetDraftFailed = (e: Event) => {
      const d = (e as CustomEvent<ApplicationAssetDraftFailedDetail>).detail;
      setApplicationAssetDraftLoading(false);
      useApplicationAssetStudioStore.getState().setSelectionRefineLoading(false);
      const message = sanitizeUserFacingError(d?.message ?? ASSET_DRAFT_ERROR_FALLBACK, ASSET_DRAFT_ERROR_FALLBACK);
      if (selectedTopic === "cover-letter") {
        setCoverLetterFormError(message);
      } else if (selectedTopic === "cold-email") {
        setColdEmailFormError(message);
      } else if (selectedTopic === "referral") {
        setReferralFormError(message);
      }
    };
    window.addEventListener(APPLICATION_ASSET_EVENTS.draftFailed, onApplicationAssetDraftFailed);
    return () => window.removeEventListener(APPLICATION_ASSET_EVENTS.draftFailed, onApplicationAssetDraftFailed);
  }, [selectedTopic]);

  useEffect(() => {
    const handleApplyTopic = (e: Event) => {
      const d = (e as CustomEvent<ApplyContentGenTopicDetail>).detail;
      if (!d?.topic?.trim()) return;
      setTopicIdea(d.topic.trim());
      setLinkedinFunnel(d.funnel ?? null);
      if (d.assetId !== undefined) {
        setLinkedinPostAssetId(d.assetId);
      }
      setLinkedinGenerateError(null);
    };
    window.addEventListener(CONTENT_GEN_EVENTS.applyTopic, handleApplyTopic);
    return () => window.removeEventListener(CONTENT_GEN_EVENTS.applyTopic, handleApplyTopic);
  }, []);

  useEffect(() => {
    const onRequestDraft = (e: Event) => {
      const d = (e as CustomEvent<RequestContentGenDraftDetail>).detail;
      if (d?.topic?.trim()) {
        setTopicIdea(d.topic.trim());
      }
      if (d?.funnel) {
        setLinkedinFunnel(d.funnel);
      }
      void runLinkedinDraftGeneration(d?.topic ?? topicIdea, d?.funnel ?? linkedinFunnel);
    };
    window.addEventListener(CONTENT_GEN_EVENTS.requestDraft, onRequestDraft);
    return () => window.removeEventListener(CONTENT_GEN_EVENTS.requestDraft, onRequestDraft);
  }, [linkedinFunnel, runLinkedinDraftGeneration, topicIdea]);

  useEffect(() => {
    const onDraftReady = (e: Event) => {
      const d = (e as CustomEvent<ContentGenDraftReadyDetail>).detail;
      if (!d?.assetId || !d?.draft) return;
      setIsGenerating(false);
      setLinkedinGenerateError(null);
      void applyDraftGenerationResult({
        id: d.assetId,
        draft: d.draft,
        mergedImageUrls: linkedinImages,
      });
    };
    const onDraftPreview = (e: Event) => {
      const d = (e as CustomEvent<ContentGenDraftPreviewDetail>).detail;
      if (!d?.draft) {
        return;
      }
      if (selectedTopic !== "linkedin-post") {
        return;
      }
      setGeneratedContent(d.draft);
      if (d.topic?.trim()) {
        setTopicIdea(d.topic.trim());
      }
      if (d.funnel !== undefined) {
        setLinkedinFunnel(d.funnel);
      }
      if (d.assetId !== undefined) {
        setLinkedinPostAssetId(d.assetId);
      }
      setLinkedinGenerateError(null);
      setIsGenerating(false);
    };
    const onDraftStreamComplete = () => {
      setIsGenerating(false);
    };
    const onDraftFailed = (e: Event) => {
      const d = (e as CustomEvent<ContentGenDraftFailedDetail>).detail;
      setIsGenerating(false);
      setLinkedinGenerateError(d?.message ?? "Draft generation failed. Please try again.");
    };
    window.addEventListener(CONTENT_GEN_EVENTS.draftReady, onDraftReady);
    window.addEventListener(CONTENT_GEN_EVENTS.draftPreview, onDraftPreview);
    window.addEventListener(CONTENT_GEN_EVENTS.draftStreamComplete, onDraftStreamComplete);
    window.addEventListener(CONTENT_GEN_EVENTS.draftFailed, onDraftFailed);
    return () => {
      window.removeEventListener(CONTENT_GEN_EVENTS.draftReady, onDraftReady);
      window.removeEventListener(CONTENT_GEN_EVENTS.draftPreview, onDraftPreview);
      window.removeEventListener(CONTENT_GEN_EVENTS.draftStreamComplete, onDraftStreamComplete);
      window.removeEventListener(CONTENT_GEN_EVENTS.draftFailed, onDraftFailed);
    };
  }, [applyDraftGenerationResult, linkedinImages]);

  useEffect(() => {
    const onPublishComplete = () => {
      void refreshLinkedinAssets();
    };
    window.addEventListener(CONTENT_GEN_EVENTS.publishComplete, onPublishComplete);
    return () => window.removeEventListener(CONTENT_GEN_EVENTS.publishComplete, onPublishComplete);
  }, [refreshLinkedinAssets]);

  useEffect(() => {
    const onPublishBlocked = (e: Event) => {
      const d = (e as CustomEvent<ContentGenPublishBlockedDetail>).detail;
      setLinkedinGenerateError(d?.message ?? CONTENT_GEN_PUBLISH_BLOCKED_MESSAGE);
    };
    const onPublishFailed = (e: Event) => {
      const d = (e as CustomEvent<ContentGenPublishFailedDetail>).detail;
      setLinkedinGenerateError(d?.message ?? "LinkedIn publish failed. Please try again.");
    };
    window.addEventListener(CONTENT_GEN_EVENTS.publishBlocked, onPublishBlocked);
    window.addEventListener(CONTENT_GEN_EVENTS.publishFailed, onPublishFailed);
    return () => {
      window.removeEventListener(CONTENT_GEN_EVENTS.publishBlocked, onPublishBlocked);
      window.removeEventListener(CONTENT_GEN_EVENTS.publishFailed, onPublishFailed);
    };
  }, []);

  useEffect(() => {
    const onRequestPublish = (e: Event) => {
      const d = (e as CustomEvent<RequestContentGenPublishDetail>).detail;
      if (d.background) {
        return;
      }
      if (!generatedContent.trim()) {
        setLinkedinGenerateError("Your draft is empty. Generate or edit your post first.");
        return;
      }
      if (!linkedinPostAssetId && !topicIdea.trim()) {
        setLinkedinGenerateError(CONTENT_GEN_PUBLISH_BLOCKED_MESSAGE);
        return;
      }
      if (isUploadingLinkedinMedia || linkedinPendingMedia.length > 0) {
        setLinkedinGenerateError("Finish media uploads before posting or scheduling.");
        return;
      }
      if (!linkedInPublishAccess.canPost) {
        return;
      }
      setLinkedinGenerateError(null);
      if (d.mode === "schedule" && d.scheduledAt) {
        const parsed = new Date(d.scheduledAt);
        setPublishModalSeed(Number.isNaN(parsed.getTime()) ? { isScheduled: true } : { isScheduled: true, date: parsed });
      } else if (d.mode === "schedule") {
        setPublishModalSeed({ isScheduled: true });
      } else {
        setPublishModalSeed({ isScheduled: false });
      }
      setSelectedPostData(null);
      setShowScheduler(true);
    };
    window.addEventListener(CONTENT_GEN_EVENTS.requestPublish, onRequestPublish);
    return () => window.removeEventListener(CONTENT_GEN_EVENTS.requestPublish, onRequestPublish);
  }, [generatedContent, isUploadingLinkedinMedia, linkedinPendingMedia.length, linkedinPostAssetId, linkedInPublishAccess.canPost]);

  const handleTopicChange = (topicId: string) => {
    if (prepareReturn && PREPARE_MODE_LOCKED_TOPICS.has(topicId)) {
      return;
    }

    resetDocumentSaveStatus();
    if (selectedTopic === "linkedin-post" && topicId !== "linkedin-post") {
      preservedLinkedinTabRef.current = {
        assetId: linkedinPostAssetId,
        content: generatedContent,
        images: linkedinImages,
        topicIdea,
        funnel: linkedinFunnel,
      };
    }

    if (prepareReturn && (topicId === "cover-letter" || topicId === "cold-email")) {
      void resolvePrepareDocumentTopic(topicId);
      return;
    }

    if (prepareReturn && topicId === "vpd") {
      pendingTopicRef.current = topicId;
      setSelectedTopic(topicId);
      setIsGenerating(false);
      setGeneratedContent("");
      updateStudioUrl({ type: topicId });
      updatePrepareReturnTab("vpd");
      return;
    }

    pendingTopicRef.current = topicId;
    setSelectedTopic(topicId);

    if (topicId === "linkedin-post") {
      const snap = preservedLinkedinTabRef.current;
      if (snap) {
        setLinkedinPostAssetId(snap.assetId);
        setGeneratedContent(snap.content);
        setLinkedinImages(snap.images);
        setTopicIdea(snap.topicIdea);
        setLinkedinFunnel(snap.funnel);
        updateStudioUrl({ type: "linkedin-post", id: snap.assetId ?? undefined });
      } else {
        setGeneratedContent("");
        updateStudioUrl({ type: "linkedin-post" });
      }
      setLinkedinGenerateError(null);
      setLinkedinPersistError(null);
      setLinkedinMediaError(null);
    } else {
      updateStudioUrl({ type: topicId });
      syncedDocumentUrlIdRef.current = null;
      setSelectedDocumentId(null);
      setIsGenerating(false);
      setGeneratedContent("");
      setLinkedinGenerateError(null);
      setLinkedinPersistError(null);
      setLinkedinMediaError(null);
      clearLinkedinPendingMedia();
      linkedinPreserveDraftForAssetIdRef.current = null;
      setCurrentCoverLetterDraft(null);
      setCurrentColdEmailDraft(null);
      setCurrentReferralDraft(null);
      clearDocumentFormFields();
    }
  };

  // Sync tab from URL only for back/forward and external links — not while a tab click is in flight.
  useEffect(() => {
    const urlType = searchParams.get("type");
    if (!urlType) return;

    if (pendingTopicRef.current) {
      if (urlType === pendingTopicRef.current) {
        pendingTopicRef.current = null;
      }
      return;
    }

    if (urlType !== selectedTopic) {
      resetDocumentSaveStatus();
      setSelectedTopic(urlType);
    }
  }, [resetDocumentSaveStatus, searchParams, selectedTopic]);

  useEffect(() => {
    if (!initialContext) return;

    if (initialContext.fromInterviewVpd && initialContext.type === "vpd") {
      const roleLabel = initialContext.role || "";
      const companyLabel = initialContext.company || "";
      setSelectedTopic("vpd");
      setRole(roleLabel);
      setCompany(companyLabel);
      setVpdProject({
        ...createDefaultVpdProject(),
        title: roleLabel && companyLabel ? `${roleLabel} @ ${companyLabel}` : "Value Proposition Document",
        description: roleLabel && companyLabel ? `Interview VPD for ${roleLabel} at ${companyLabel}` : "",
      });
      setGeneratedContent("");
      setShowVpdEditor(true);
    }
  }, [initialContext]);

  const syncPrepareReturnFromUrl = useCallback(async () => {
    const parsed = parseStudioSearchParams(searchParams);
    if (!parsed.jobId) {
      return;
    }

    const stored = getPrepareReturnSession();
    const navigate = parsed.navigate ?? stored?.navigate ?? "tracker";
    const tab = (isPrepareReturnTab(parsed.type ?? "") ? parsed.type : (stored?.tab ?? "cover-letter")) as PrepareApplicationTab;

    let company = stored?.company ?? "";
    let role = stored?.role ?? "";
    let logo = stored?.logo ?? null;

    if (!company || !role || stored?.jobId !== parsed.jobId) {
      try {
        const job = await getJob(parsed.jobId);
        if (job) {
          company = job.company ?? company;
          role = job.title ?? role;
          logo = job.company_logo_url ?? logo;
          setCompany(company);
          setRole(role);
          if (job.description) {
            setJobDescription(job.description);
          }
        }
      } catch {
        // Banner can still show with partial labels.
      }
    }

    const session: PrepareApplicationReturnSession = {
      jobId: parsed.jobId,
      tab,
      company,
      role,
      logo,
      navigate,
    };
    setPrepareReturn(session);
    setPrepareReturnSession(session);
  }, [searchParams]);

  useEffect(() => {
    void syncPrepareReturnFromUrl();
  }, [syncPrepareReturnFromUrl]);

  /** When opened from Prepare Application without an asset id, load linked asset or show generate UI. */
  useEffect(() => {
    if (!prepareReturn) return;
    if (selectedTopic !== "cover-letter" && selectedTopic !== "cold-email") return;

    const urlId = searchParams.get("id")?.trim();
    if (urlId) return;

    const linkedId = getLinkedAssetId(prepareApplicationAssets, selectedTopic);
    const currentDraftId = selectedTopic === "cover-letter" ? currentCoverLetterDraft?.id : currentColdEmailDraft?.id;

    if (linkedId) {
      if (currentDraftId && String(currentDraftId) === linkedId) return;
      void resolvePrepareDocumentTopic(selectedTopic);
      return;
    }

    if (!currentDraftId) {
      applyPrepareJobFormDefaults();
    }
  }, [
    applyPrepareJobFormDefaults,
    currentColdEmailDraft?.id,
    currentCoverLetterDraft?.id,
    prepareApplicationAssets,
    prepareReturn,
    resolvePrepareDocumentTopic,
    searchParams,
    selectedTopic,
  ]);

  useEffect(() => {
    if (!initialContext) {
      return;
    }

    if (initialContext.recipientName) {
      setConnectionName(initialContext.recipientName);
      setManagerName(initialContext.recipientName);
    }
  }, [initialContext]);

  const handleSaveAndReturnToPrepare = async () => {
    if (!prepareReturn) return;

    let returnTab: PrepareApplicationTab = prepareReturn.tab;
    if (selectedTopic === "cover-letter" && currentCoverLetterDraft?.id) {
      const content = currentCoverLetterDraft.content ?? "";
      documentContentRef.current = content;
      await runDocumentSave();
      setPrepareReturnContentSnapshot({
        assetId: String(currentCoverLetterDraft.id),
        kind: "cover-letter",
        content,
      });
      returnTab = "cover-letter";
    } else if (selectedTopic === "cold-email" && currentColdEmailDraft?.id) {
      const content = currentColdEmailDraft.content ?? "";
      documentContentRef.current = content;
      await runDocumentSave();
      setPrepareReturnContentSnapshot({
        assetId: String(currentColdEmailDraft.id),
        kind: "cold-email",
        content,
      });
      returnTab = "cold-email";
    } else {
      return;
    }

    const { jobId, navigate } = prepareReturn;
    clearPrepareReturnSession();
    setPrepareReturn(null);
    router.push(buildJobsPrepareReopenHref(jobId, returnTab, navigate));
  };

  const handleDismissPrepareReturn = () => {
    clearPrepareReturnSession();
    setPrepareReturn(null);
    const parsed = parseStudioSearchParams(searchParams);
    router.replace(buildStudioAssetOnlyHref(pathname, { id: parsed.id, type: parsed.type }), { scroll: false });
  };

  const dispatchOpenImproveForAsset = useCallback(
    (detail: ApplicationAssetOpenImproveDetail) => {
      if (!initialContext?.openImproveMode || improveDispatchedRef.current) {
        return;
      }
      improveDispatchedRef.current = true;

      const roleLabel = detail.role || role || initialContext.role || "";
      const companyLabel = detail.company || company || initialContext.company || "";
      const jd = detail.jobDescription || jobDescription || initialContext.description || "";
      const content = detail.content ?? "";

      useApplicationAssetStudioStore.getState().syncFromStudio({
        assetType: detail.assetType,
        assetId: detail.assetId,
        applicationId: detail.applicationId ?? null,
        role: roleLabel,
        company: companyLabel,
        jobDescription: jd,
        contactName: detail.contactName ?? "",
        draftPreview: content,
        acceptedContent: content,
      });

      window.dispatchEvent(
        new CustomEvent(APPLICATION_ASSET_EVENTS.openImprove, {
          detail: {
            ...detail,
            role: roleLabel,
            company: companyLabel,
            jobDescription: jd,
            content,
          },
        })
      );
    },
    [company, initialContext, jobDescription, role]
  );

  useEffect(() => {
    const urlId = searchParams.get("id") ?? initialAssetId;
    const urlType = searchParams.get("type") ?? selectedTopic;
    if (!urlId || !urlType) {
      hydratedAssetKeyRef.current = null;
      return;
    }
    const hydrateKey = `${urlType}:${urlId}`;
    if (hydratedAssetKeyRef.current === hydrateKey) {
      return;
    }
    isHydratingFromUrlRef.current = true;
    hydratedAssetKeyRef.current = hydrateKey;
    const hydrate = async () => {
      try {
        if (urlType === "cover-letter") {
          const asset = await fetchCoverLetterById(urlId);
          if (!asset) throw new Error("Cover letter not found");
          setCurrentCoverLetterDraft(asset);
          setSelectedTopic("cover-letter");
          applyCoverLetterDraftToForm(asset);
          dispatchOpenImproveForAsset({
            assetType: "coverletter",
            assetId: String(asset.id),
            applicationId: initialContext?.jobId,
            role: asset.role ?? "",
            company: asset.company ?? "",
            jobDescription: jobDescriptionFromAsset(asset),
            content: asset.content ?? "",
          });
          return;
        }
        if (urlType === "cold-email") {
          const asset = await fetchColdEmailById(urlId);
          if (!asset) throw new Error("Cold email not found");
          setCurrentColdEmailDraft(asset);
          setSelectedTopic("cold-email");
          applyColdEmailDraftToForm(asset);
          const contact = managerName || initialContext?.recipientName || asset.hirname || "Hiring Manager";
          dispatchOpenImproveForAsset({
            assetType: "coldemail",
            assetId: String(asset.id),
            applicationId: initialContext?.jobId,
            role: asset.role ?? "",
            company: asset.company ?? "",
            jobDescription: jobDescriptionFromAsset(asset),
            contactName: contact,
            content: asset.content ?? "",
          });
          return;
        }
        if (urlType === "referral") {
          const asset = await fetchReferralById(urlId);
          if (!asset) throw new Error("Referral not found");
          setCurrentReferralDraft(asset);
          setSelectedTopic("referral");
          applyReferralDraftToForm(asset);
          setSelectedDocumentId(asset.id);
          return;
        }
        if (urlType === "linkedin-post") {
          const prevIdSnapshot = linkedinPostAssetIdRef.current;
          const assets = await fetchContentGenAssets();
          const match = assets.find(a => String(a.id) === String(urlId));
          if (!match) throw new Error("LinkedIn post not found");
          setSelectedTopic("linkedin-post");
          const nextIdStr = String(match.id);
          if (prevIdSnapshot != null && String(prevIdSnapshot) !== nextIdStr) {
            clearLinkedinPendingMedia();
          }
          setLinkedinPostAssetId(nextIdStr);
          setLinkedinImages(Array.isArray(match.images) ? match.images : []);
          setTopicIdea(match.topic ?? "");
          const serverContent = match.content?.trim() ?? "";
          if (serverContent) {
            setGeneratedContent(serverContent);
            linkedinPreserveDraftForAssetIdRef.current = null;
          } else if (linkedinPreserveDraftForAssetIdRef.current === String(match.id)) {
            linkedinPreserveDraftForAssetIdRef.current = null;
          } else {
            setGeneratedContent("");
          }
          return;
        }
      } catch {
        hydratedAssetKeyRef.current = `failed:${hydrateKey}`;
        const params = new URLSearchParams(searchParams.toString());
        params.delete("id");
        const query = params.toString();
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
      } finally {
        isHydratingFromUrlRef.current = false;
      }
    };
    hydrate();
  }, [
    clearLinkedinPendingMedia,
    company,
    dispatchOpenImproveForAsset,
    initialAssetId,
    initialContext?.description,
    initialContext?.recipientName,
    managerName,
    pathname,
    router,
    searchParams,
    selectedTopic,
  ]);

  const handlePost = async (finalContent: string, isScheduled: boolean, scheduleDate?: Date) => {
    if (selectedTopic === "linkedin-post") {
      if (!finalContent.trim() || !topicIdea.trim()) {
        throw new Error("Your draft is empty. Generate or edit your post first.");
      }
      if (isUploadingLinkedinMedia) {
        throw new Error("Wait for media upload to finish before posting.");
      }
      if (linkedinPendingMedia.length > 0) {
        throw new Error(
          "Some media did not finish uploading. Remove the files below or fix the upload error, then add media again before posting."
        );
      }
      try {
        const assetId = await ensureContentGenAssetPersisted({
          assetId: linkedinPostAssetId,
          topic: topicIdea,
          draft: finalContent,
          funnel: linkedinFunnel,
          images: linkedinImages,
        });
        if (assetId !== linkedinPostAssetId) {
          setLinkedinPostAssetId(assetId);
          updateStudioUrl({ type: "linkedin-post", id: assetId });
        }
        if (isScheduled && scheduleDate) {
          await updateContentGenAsset({
            id: assetId,
            content: finalContent,
            dateScheduled: scheduleDate.toISOString(),
            status: "Scheduled",
            images: linkedinImages,
          });
        } else {
          await updateContentGenAsset({ id: assetId, content: finalContent, images: linkedinImages });
          await postContentGenToLinkedIn(assetId);
        }
        setGeneratedContent(finalContent);
        await refreshLinkedinAssets();
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Something went wrong";
        const normalized = normalizeLinkedinPostError(errorMessage);
        window.dispatchEvent(
          new CustomEvent(CONTENT_GEN_EVENTS.publishFailed, {
            detail: { message: normalized },
          })
        );
        throw new Error(normalized);
      }
      return;
    }

    // Optimistic update for demo purposes (non–Content Lab LinkedIn flows)
    if (isScheduled && scheduleDate) {
      const scheduledId = typeof selectedPostData?.id === "number" ? selectedPostData.id : Date.now();
      const newScheduled = {
        id: scheduledId,
        content: finalContent,
        date: scheduleDate.toLocaleString(),
      };

      if (selectedPostData?.isScheduled) {
        setScheduledPosts(scheduledPosts.map(p => (p.id === newScheduled.id ? newScheduled : p)));
      } else {
        setScheduledPosts([newScheduled, ...scheduledPosts]);
      }
    } else {
      const newPost = {
        id: Date.now(),
        content: finalContent,
        stats: "0 views • 0 likes",
        date: "Just now",
        status: "Posted" as const,
      };
      setPostHistory([newPost, ...postHistory]);
    }
  };

  const handlePostClick = (post: ComposerPost, type: "scheduled" | "history") => {
    if (selectedTopic === "linkedin-post") {
      const p = post as ContentGenModalPost;
      const asset = linkedinContentGenAssets.find(a => String(a.id) === String(post.id));
      clearLinkedinPendingMedia();
      setTopicIdea(p.topic ?? "");
      setGeneratedContent(p.content);
      setLinkedinPostAssetId(String(post.id));
      setLinkedinImages(Array.isArray(asset?.images) ? asset.images : []);
      linkedinPreserveDraftForAssetIdRef.current = null;
      updateStudioUrl({ type: "linkedin-post", id: String(post.id) });
      setSelectedPostData({
        ...post,
        isScheduled: type === "scheduled",
        dateScheduled: asset?.dateScheduled,
      });
      setShowScheduler(true);
      return;
    }

    setGeneratedContent(post.content);

    let initialData = undefined;
    if (type === "scheduled") {
      initialData = { isScheduled: true, date: new Date() };
    } else {
      initialData = { isScheduled: false };
    }

    setSelectedPostData({ ...post, isScheduled: type === "scheduled" });
    setShowScheduler(true);
  };

  const handleDeleteLinkedinPost = useCallback(
    async (id: string) => {
      try {
        await deleteContentGenAsset(id);
        await refreshLinkedinAssets();
        if (String(linkedinPostAssetId) === String(id)) {
          setLinkedinPostAssetId(null);
          setGeneratedContent("");
          setLinkedinImages([]);
          clearLinkedinPendingMedia();
          setTopicIdea("");
          updateStudioUrl({ type: "linkedin-post" });
        }
      } catch (e) {
        window.alert(e instanceof Error ? e.message : "Could not delete post");
      }
    },
    [clearLinkedinPendingMedia, linkedinPostAssetId, refreshLinkedinAssets, updateStudioUrl]
  );

  const handleViewAll = (tab: "scheduled" | "history") => {
    if (isDocumentTopic(selectedTopic)) {
      setShowAllDocumentsModal(true);
      return;
    }
    if (selectedTopic === "linkedin-post") {
      void refreshLinkedinAssets().then(() => {
        setAllPostsInitialTab(tab);
        setShowAllPostsModal(true);
      });
      return;
    }
    setAllPostsInitialTab(tab);
    setShowAllPostsModal(true);
  };

  const beginDocumentDraftGeneration = (topic: ApplicationAssetStudioTopic) => {
    setApplicationAssetDraftLoading(true);
    setDocumentGeneratingTopic(topic);
    setGeneratedContent("");
    setSelectedDocumentId(null);
    if (topic === "cover-letter") {
      setCurrentCoverLetterDraft(null);
    } else if (topic === "cold-email") {
      setCurrentColdEmailDraft(null);
    } else {
      setCurrentReferralDraft(null);
    }
  };

  const handleGenerate = () => {
    if (profileSetupRequired) {
      promptProfileSetup();
      return;
    }

    if (selectedTopic === "cover-letter") {
      setCoverLetterFormError(null);
      const trimmedRole = role.trim();
      const trimmedCompany = company.trim();
      const trimmedJd = jobDescription.trim();
      if (!trimmedRole || !trimmedCompany || !trimmedJd) {
        setCoverLetterFormError("Please fill Role, Company and Job Description.");
        return;
      }
      const params = {
        role: trimmedRole,
        company: trimmedCompany,
        job_description: trimmedJd,
        ...(prepareApplicationId ? { application_id: prepareApplicationId } : {}),
      };
      lastCoverLetterParamsRef.current = params;
      beginDocumentDraftGeneration("cover-letter");
      generateCoverLetterMutation.mutate(params, {
        onSuccess: (result: GenerateCoverLetterResult) => {
          if ("duplicate" in result && result.duplicate && "existing_asset_id" in result) {
            setCoverLetterDuplicateModal({ existingAssetId: result.existing_asset_id, params });
          }
        },
      });
      return;
    }

    if (selectedTopic === "cold-email") {
      setColdEmailFormError(null);
      const trimmedRole = role.trim();
      const trimmedCompany = company.trim();
      const trimmedJd = jobDescription.trim();
      const trimmedHirname = managerName.trim();
      if (!trimmedRole || !trimmedCompany || !trimmedJd || !trimmedHirname) {
        setColdEmailFormError("Please fill Role, Company, Job Description and Hiring Manager Name.");
        return;
      }
      const params = {
        role: trimmedRole,
        company: trimmedCompany,
        job_description: trimmedJd,
        hirname: trimmedHirname,
        ...(prepareApplicationId ? { application_id: prepareApplicationId } : {}),
      };
      lastColdEmailParamsRef.current = params;
      beginDocumentDraftGeneration("cold-email");
      generateColdEmailMutation.mutate(params, {
        onSuccess: (result: GenerateColdEmailResult) => {
          if ("duplicate" in result && result.duplicate && "existing_asset_id" in result) {
            setColdEmailDuplicateModal({ existingAssetId: result.existing_asset_id, params });
          }
        },
      });
      return;
    }

    if (selectedTopic === "referral") {
      setReferralFormError(null);
      const trimmedRole = role.trim();
      const trimmedCompany = company.trim();
      const trimmedConname = connectionName.trim();
      if (!trimmedRole || !trimmedCompany || !trimmedConname) {
        setReferralFormError("Please fill in Role, Company and Connection Name.");
        return;
      }
      const params = {
        role: trimmedRole,
        company: trimmedCompany,
        conname: trimmedConname,
      };
      lastReferralParamsRef.current = params;
      beginDocumentDraftGeneration("referral");
      generateReferralMutation.mutate(params);
      return;
    }

    if (selectedTopic === "linkedin-post") {
      void runLinkedinDraftGeneration(topicIdea, linkedinFunnel);
      return;
    }

    if (selectedTopic === "vpd") {
      setIsGenerating(true);
      setTimeout(() => {
        const content = generateMockContent();
        setGeneratedContent(content);
        const nextProject = buildVpdProjectFromDraft(role, company, content);
        setVpdProject(nextProject);
        setSavedVpds(prev => {
          const exists = prev.some(v => v.title === nextProject.title);
          if (exists) return prev;
          return [
            {
              id: nextProject.id,
              title: nextProject.title || "Value Proposition Document",
              date: "Just now",
              project: nextProject,
            },
            ...prev,
          ];
        });
        setIsGenerating(false);
      }, 1500);
      return;
    }
  };

  const handleGenerateAnother = () => {
    if (profileSetupRequired) {
      promptProfileSetup();
      return;
    }

    if (selectedTopic === "linkedin-post") {
      setLinkedinPostAssetId(null);
      setGeneratedContent("");
      setLinkedinImages([]);
      clearLinkedinPendingMedia();
      setLinkedinGenerateError(null);
      updateStudioUrl({ type: "linkedin-post" });
      void runLinkedinDraftGeneration(topicIdea, linkedinFunnel);
      return;
    }

    if (selectedTopic === "cover-letter") {
      setCurrentCoverLetterDraft(null);
      setGeneratedContent("");
      setSelectedDocumentId(null);
      resetDocumentSaveStatus();
      updateStudioUrl({ type: "cover-letter" });
      handleGenerate();
      return;
    }

    if (selectedTopic === "cold-email") {
      setCurrentColdEmailDraft(null);
      setGeneratedContent("");
      setSelectedDocumentId(null);
      resetDocumentSaveStatus();
      updateStudioUrl({ type: "cold-email" });
      handleGenerate();
      return;
    }

    if (selectedTopic === "referral") {
      setCurrentReferralDraft(null);
      setGeneratedContent("");
      setSelectedDocumentId(null);
      resetDocumentSaveStatus();
      updateStudioUrl({ type: "referral" });
      handleGenerate();
    }
  };

  const handleImproveWithUnibot = useCallback(() => {
    if (selectedTopic === "linkedin-post") {
      const content = generatedContent.trim();
      if (!content) return;
      window.dispatchEvent(
        new CustomEvent("open-content-gen-topic", {
          detail: {
            followUpText: `${IMPROVE_INITIAL_DRAFT_PROMPT}:\n\n${content}`,
            topicTitle: "Improve LinkedIn Post",
            reuseExistingTopic: true,
            requestKey: Date.now(),
          },
        })
      );
      return;
    }

    if (!isDocumentTopic(selectedTopic)) return;

    const apiType = documentTopicToApiType(selectedTopic);
    let content = "";
    if (selectedTopic === "cover-letter") {
      content = currentCoverLetterDraft?.content ?? generatedContent;
    } else if (selectedTopic === "cold-email") {
      content = currentColdEmailDraft?.content ?? generatedContent;
    } else {
      content = currentReferralDraft?.content ?? generatedContent;
    }
    if (!htmlToPlainText(content).trim()) return;

    let assetId: string | null = null;
    let contactName = "";
    if (selectedTopic === "cover-letter" && currentCoverLetterDraft?.id) {
      assetId = String(currentCoverLetterDraft.id);
    } else if (selectedTopic === "cold-email" && currentColdEmailDraft?.id) {
      assetId = String(currentColdEmailDraft.id);
      contactName = managerName;
    } else if (selectedTopic === "referral" && currentReferralDraft?.id) {
      assetId = String(currentReferralDraft.id);
      contactName = connectionName;
    }
    if (!assetId) return;

    window.dispatchEvent(
      new CustomEvent(APPLICATION_ASSET_EVENTS.openImprove, {
        detail: {
          assetType: apiType,
          assetId,
          applicationId: prepareApplicationId ?? undefined,
          role: role.trim(),
          company: company.trim(),
          jobDescription: jobDescription.trim(),
          contactName: contactName || undefined,
          content,
          initialPrompt: IMPROVE_INITIAL_DRAFT_PROMPT,
          autoSend: true,
        },
      })
    );
  }, [
    company,
    connectionName,
    currentColdEmailDraft?.content,
    currentColdEmailDraft?.id,
    currentCoverLetterDraft?.content,
    currentCoverLetterDraft?.id,
    currentReferralDraft?.content,
    currentReferralDraft?.id,
    generatedContent,
    jobDescription,
    linkedinPostAssetId,
    managerName,
    prepareApplicationId,
    role,
    selectedTopic,
  ]);

  const isDocumentGenerating =
    (selectedTopic === "cover-letter" && generateCoverLetterMutation.isPending) ||
    (selectedTopic === "cold-email" && generateColdEmailMutation.isPending) ||
    (selectedTopic === "referral" && generateReferralMutation.isPending) ||
    isDocumentDraftLoadingForTopic;

  const documentRefineLoadingLabel =
    selectedTopic === "cover-letter"
      ? "Updating your cover letter..."
      : selectedTopic === "cold-email"
        ? "Updating your cold email..."
        : "Updating your referral request...";

  const isDocumentPreviewLoading = isDocumentGenerating || selectionRefineLoading;

  const generateMockContent = () => {
    if (selectedTopic === "linkedin-post") {
      return `🚀 Excited to announce my next chapter!\n\nI'm thrilled to share that I'm diving deeper into Product Design. The journey hasn't been valid linear, but every step taught me something valuable about user empathy and systems thinking.\n\nBig thanks to everyone who supported me along the way. Can't wait to build amazing things! 🎨✨\n\n#ProductDesign #CareerUpdate #NewBeginnings #UX`;
    }
    if (selectedTopic === "cover-letter") {
      return `Dear Hiring Manager,\n\nI am writing to express my strong interest in the ${role || "[Role]"} position at ${company || "[Company]"}. Having followed ${company || "[Company]"}'s work in...`;
    }
    if (selectedTopic === "cold-email") {
      return `Hi ${managerName || "[Manager Name]"},\n\nI've been following the work your team is doing at ${company || "[Company]"} and I'm impressed by...\n\nI'm a ${role || "[Role]"} with experience in...`;
    }
    if (selectedTopic === "referral") {
      return `Hi ${connectionName || "[Name]"},\n\nI hope you're doing well! I saw an opening for ${role || "[Role]"} at ${company || "[Company]"} and was wondering if you could share some insights...`;
    }
    return `Title: Value Proposition Document\nRole: ${role}\nCompany: ${company}\n\n1. Core Strengths...\n2. Relevant Experience...\n3. Why Me?`;
  };

  const persistLinkedinContentToServer = useCallback(async () => {
    if (selectedTopic !== "linkedin-post" || !generatedContent.trim() || !topicIdea.trim()) {
      return;
    }
    try {
      setLinkedinPersistError(null);
      const id = await ensureContentGenAssetPersisted({
        assetId: linkedinPostAssetId,
        topic: topicIdea,
        draft: generatedContent,
        funnel: linkedinFunnel,
        images: linkedinImages,
      });
      if (id !== linkedinPostAssetId) {
        setLinkedinPostAssetId(id);
        updateStudioUrl({ type: "linkedin-post", id });
      }
      await refreshLinkedinAssets();
    } catch (e) {
      setLinkedinPersistError(e instanceof Error ? e.message : "Could not save changes");
    }
  }, [
    selectedTopic,
    linkedinPostAssetId,
    generatedContent,
    topicIdea,
    linkedinFunnel,
    linkedinImages,
    refreshLinkedinAssets,
    updateStudioUrl,
  ]);

  const handleLinkedinMediaUpload = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setLinkedinMediaError(null);
      if (!linkedinPostAssetId) {
        const additions = Array.from(files).map(file => ({
          id: newLinkedinPendingMediaId(),
          file,
          objectUrl: URL.createObjectURL(file),
        }));
        setLinkedinPendingMedia(prev => {
          const next = [...prev, ...additions];
          linkedinPendingMediaRef.current = next;
          return next;
        });
        return;
      }
      setIsUploadingLinkedinMedia(true);
      try {
        const uploaded = await Promise.all(Array.from(files).map(file => uploadContentGenMedia(file, "linkedin-post")));
        const merged = Array.from(new Set([...linkedinImages, ...uploaded.map(item => item.url)]));
        setLinkedinImages(merged);
        await updateContentGenAsset({
          id: linkedinPostAssetId,
          images: merged,
        });
        await refreshLinkedinAssets();
      } catch (e) {
        setLinkedinMediaError(e instanceof Error ? e.message : "Could not upload media");
      } finally {
        setIsUploadingLinkedinMedia(false);
      }
    },
    [linkedinPostAssetId, linkedinImages, refreshLinkedinAssets]
  );

  const handleRemoveLinkedinPendingMedia = useCallback((pendingId: string) => {
    setLinkedinPendingMedia(prev => {
      const target = prev.find(p => p.id === pendingId);
      if (target) {
        URL.revokeObjectURL(target.objectUrl);
      }
      const next = prev.filter(p => p.id !== pendingId);
      linkedinPendingMediaRef.current = next;
      return next;
    });
  }, []);

  const handleRemoveLinkedinMedia = useCallback(
    async (url: string) => {
      if (!linkedinPostAssetId) return;
      const nextImages = linkedinImages.filter(item => item !== url);
      setLinkedinImages(nextImages);
      try {
        await updateContentGenAsset({ id: linkedinPostAssetId, images: nextImages });
        await refreshLinkedinAssets();
      } catch (e) {
        setLinkedinMediaError(e instanceof Error ? e.message : "Could not remove media");
      }
    },
    [linkedinPostAssetId, linkedinImages, refreshLinkedinAssets]
  );

  useEffect(() => {
    if (selectedTopic !== "linkedin-post" || !generatedContent.trim()) {
      return;
    }
    if (linkedinPendingMedia.length > 0) {
      return;
    }
    if (linkedinPersistDebounceRef.current) {
      clearTimeout(linkedinPersistDebounceRef.current);
    }
    linkedinPersistDebounceRef.current = setTimeout(() => {
      linkedinPersistDebounceRef.current = null;
      void persistLinkedinContentToServer();
    }, 750);
    return () => {
      if (linkedinPersistDebounceRef.current) {
        clearTimeout(linkedinPersistDebounceRef.current);
        linkedinPersistDebounceRef.current = null;
      }
    };
  }, [generatedContent, linkedinPendingMedia.length, linkedinPostAssetId, selectedTopic, topicIdea, persistLinkedinContentToServer]);

  useEffect(() => {
    if (selectedTopic !== "linkedin-post" || !linkedinPostAssetId) return;
    if (linkedinPendingMedia.length > 0) return;
    const current = linkedinContentGenAssets.find(a => String(a.id) === String(linkedinPostAssetId));
    if (!current) return;
    const nextImages = Array.isArray(current.images) ? current.images : [];
    if (JSON.stringify(nextImages) === JSON.stringify(linkedinImages)) return;
    if (linkedinImages.length > 0 && nextImages.length === 0) {
      return;
    }
    setLinkedinImages(nextImages);
  }, [selectedTopic, linkedinPostAssetId, linkedinContentGenAssets, linkedinImages, linkedinPendingMedia.length]);

  const handleLinkedinPreviewBlur = useCallback(() => {
    if (linkedinPersistDebounceRef.current) {
      clearTimeout(linkedinPersistDebounceRef.current);
      linkedinPersistDebounceRef.current = null;
    }
    void persistLinkedinContentToServer();
  }, [persistLinkedinContentToServer]);

  const renderVpdSavedCards = () => {
    const recents = savedVpds.filter(v => !v.isTemplate);
    const templates = savedVpds.filter(v => v.isTemplate);
    const activeList = vpdLibraryTab === "recents" ? recents : templates;

    return (
      <div className="mt-5 border-t border-slate-100 pt-5 dark:border-slate-800">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="inline-flex rounded-full bg-slate-100 p-0.5 dark:bg-slate-900">
            <button
              type="button"
              onClick={() => setVpdLibraryTab("recents")}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                vpdLibraryTab === "recents"
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              Recents
            </button>
            <button
              type="button"
              onClick={() => setVpdLibraryTab("templates")}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                vpdLibraryTab === "templates"
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              Templates
            </button>
          </div>
          <button
            type="button"
            onClick={() => setShowAllVPDsModal(true)}
            className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
          >
            See all
          </button>
        </div>

        {activeList.length > 0 ? (
          <div className="grid grid-cols-3 gap-2.5">
            {activeList.slice(0, 6).map(vpd => (
              <VpdLibraryCard key={vpd.id} vpd={vpd} onClick={() => handleSelectVpd(vpd)} />
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-xs text-slate-400 dark:border-slate-700">
            {vpdLibraryTab === "recents" ? "No recent VPDs yet. Generate a draft to create one." : "No templates available yet."}
          </p>
        )}

        <button
          type="button"
          onClick={handleCreateNewVpd}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 py-3 text-sm font-medium text-slate-500 transition-all hover:border-brand-500 hover:text-brand-600 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900"
        >
          <Plus size={18} />
          Create blank VPD
        </button>
      </div>
    );
  };

  const renderDocumentSavedCards = () => {
    if (!isDocumentTopic(selectedTopic)) return null;
    if (prepareReturn) return null;

    const combinedList = documentItemsForTopic;

    return (
      <div className="mt-5 border-t border-slate-100 pt-5 dark:border-slate-800">
        <div className="mb-3 flex min-w-0 flex-1 items-center gap-2">
          <h3 className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">Recents</h3>
          {combinedList.length > 0 && (
            <span className="shrink-0 rounded-md bg-brand-50 px-1.5 py-0.5 text-[10px] font-medium text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
              {combinedList.length}
            </span>
          )}
        </div>

        <div className="flex max-h-[min(42vh,360px)] flex-col gap-2 overflow-y-auto pr-1">
          {combinedList.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-xs text-slate-400 dark:border-slate-700">
              No recent drafts yet. Generate one to get started.
            </p>
          ) : (
            combinedList
              .slice(0, 5)
              .map(doc => (
                <DocumentListCard
                  key={doc.id}
                  doc={doc}
                  isSelected={isSameDocumentId(activeRecentDocumentId, doc.id)}
                  onClick={() => void handleSelectDocument(doc)}
                  onDelete={id => void handleDeleteDocument(id)}
                />
              ))
          )}
        </div>

        {combinedList.length > 0 && (
          <div className="flex shrink-0 justify-center pt-3">
            <button
              type="button"
              onClick={handleViewAllDocuments}
              className="text-[11px] font-medium text-brand-600 hover:underline dark:text-brand-400"
            >
              View all
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderInputs = () => {
    return (
      <div className="space-y-5">
        {/* LinkedIn Inputs */}
        {selectedTopic === "linkedin-post" && (
          <>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="block text-xs font-medium text-slate-500">Topic Generator</label>
                {linkedinFunnel ? (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-brand-50 text-brand-700">
                    {funnelDisplayLabel(linkedinFunnel)}
                  </span>
                ) : null}
              </div>
              <div className="flex gap-2">
                <input
                  value={topicIdea}
                  onChange={e => {
                    setLinkedinGenerateError(null);
                    setTopicIdea(e.target.value);
                  }}
                  className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-500/20"
                  placeholder="e.g. Learnings from my first design sprint..."
                />
                <button
                  type="button"
                  aria-label="Plan topic with Unibot"
                  title="Plan topic with Unibot"
                  onClick={() => handleOpenContentGenTopic()}
                  className="px-4 bg-brand-50 text-brand-600 rounded-xl hover:bg-brand-100 transition-colors font-medium"
                >
                  <Wand2 size={18} />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-2">Mood</label>
                <select
                  value={mood}
                  disabled
                  aria-disabled
                  title="Coming soon"
                  onChange={e => setMood(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-500/20 appearance-none bg-white dark:bg-slate-900 opacity-60 cursor-not-allowed"
                >
                  {MOODS.map(m => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <label className="block text-xs font-medium text-slate-500">Content Type</label>
                  <div className="group/tooltip relative">
                    <Info size={14} className="cursor-help text-slate-400" />
                    <div className="invisible absolute bottom-full left-1/2 z-50 mb-2 w-64 -translate-x-1/2 rounded-lg border border-slate-700 bg-slate-900 p-3 text-xs text-white opacity-0 shadow-xl transition-all group-hover/tooltip:visible group-hover/tooltip:opacity-100">
                      <div className="space-y-2">
                        <p>
                          <strong>Top of Funnel:</strong> Broad appeal content to drive awareness and views.
                        </p>
                        <p>
                          <strong>Middle of Funnel:</strong> Demonstrating expertise to build trust and authority.
                        </p>
                        <p>
                          <strong>Bottom of Funnel:</strong> Direct conversion content (e.g., looking for roles).
                        </p>
                      </div>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                    </div>
                  </div>
                </div>
                <select
                  value={contentType}
                  disabled
                  aria-disabled
                  title="Coming soon"
                  onChange={e => setContentType(e.target.value)}
                  className="w-full cursor-not-allowed appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium opacity-60 outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900"
                >
                  <option value="Top of Funnel">Top of Funnel</option>
                  <option value="Middle of Funnel">Middle of Funnel</option>
                  <option value="Bottom of Funnel">Bottom of Funnel</option>
                </select>
              </div>
            </div>

            {/* Media Upload Options */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-2">Media Attachment</label>
              <input
                ref={linkedinFileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={e => {
                  void handleLinkedinMediaUpload(e.target.files);
                  e.currentTarget.value = "";
                }}
              />
              <button
                type="button"
                disabled={isUploadingLinkedinMedia}
                onClick={() => linkedinFileInputRef.current?.click()}
                className="w-full py-8 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-brand-500 hover:text-brand-500 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all group disabled:opacity-60 disabled:pointer-events-none"
              >
                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full group-hover:bg-brand-100 dark:group-hover:bg-brand-900/30 transition-colors">
                  <Upload size={20} />
                </div>
                <span className="text-xs font-medium">{isUploadingLinkedinMedia ? "Uploading..." : "Click to upload media"}</span>
              </button>
              {linkedinMediaError ? (
                <div className="text-xs mt-1.5 space-y-1" role="alert">
                  <p className="text-red-600 dark:text-red-400">{linkedinMediaError}</p>
                  {linkedinPendingMedia.length > 0 ? (
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      Files stay staged. Fix the issue, then click{" "}
                      <span className="font-medium text-slate-800 dark:text-slate-200">Generate Draft</span> again to retry the upload, or
                      remove a file with ×.
                    </p>
                  ) : null}
                </div>
              ) : null}
              {linkedinPendingMedia.length > 0 || linkedinImages.length > 0 ? (
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {linkedinPendingMedia.map(p => (
                    <div key={p.id} className="relative rounded-lg overflow-hidden border border-amber-200 dark:border-amber-900/40">
                      <StudioMediaPreviewImage src={p.objectUrl} alt="" className="w-full h-20 object-cover" />
                      <span className="absolute bottom-1 left-1 text-[10px] font-medium bg-amber-100/90 text-amber-900 dark:bg-amber-900/80 dark:text-amber-100 px-1 rounded">
                        Pending
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveLinkedinPendingMedia(p.id)}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white text-xs hover:bg-black/75"
                        aria-label="Remove staged image"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {linkedinImages.map(url => (
                    <div key={url} className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                      <StudioMediaPreviewImage src={url} alt="Uploaded media" className="w-full h-20 object-cover" />
                      <button
                        type="button"
                        onClick={() => void handleRemoveLinkedinMedia(url)}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white text-xs hover:bg-black/75"
                        aria-label="Remove image"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </>
        )}

        {/* Shared Inputs (Role, Company) for Non-LinkedIn */}
        {selectedTopic !== "linkedin-post" && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase mb-2">Role</label>
              <input
                value={role}
                onChange={e => setRole(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-500/20"
                placeholder="e.g. Product Designer"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase mb-2">Company</label>
              <input
                value={company}
                onChange={e => setCompany(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-500/20"
                placeholder="e.g. Spotify"
              />
            </div>
          </div>
        )}

        {(selectedTopic === "cover-letter" || selectedTopic === "cold-email" || selectedTopic === "vpd") && (
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase mb-2">Job Description</label>
            <textarea
              value={jobDescription}
              onChange={e => setJobDescription(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium h-32 resize-none outline-none focus:ring-2 focus:ring-brand-500/20"
              placeholder="Paste the JD here..."
            />
          </div>
        )}

        {selectedTopic === "cold-email" && (
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase mb-2">Hiring Manager Name</label>
            <input
              value={managerName}
              onChange={e => setManagerName(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-500/20"
              placeholder="e.g. John Doe"
            />
          </div>
        )}

        {selectedTopic === "referral" && (
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase mb-2">Connection Name</label>
            <input
              value={connectionName}
              onChange={e => setConnectionName(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-500/20"
              placeholder="e.g. Jane Smith"
            />
          </div>
        )}

        {selectedTopic === "cover-letter" && coverLetterFormError && (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {coverLetterFormError}
          </p>
        )}
        {selectedTopic === "cold-email" && coldEmailFormError && (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {coldEmailFormError}
          </p>
        )}
        {selectedTopic === "referral" && referralFormError && (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {referralFormError}
          </p>
        )}

        {selectedTopic === "linkedin-post" && linkedinGenerateError ? (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {linkedinGenerateError}
          </p>
        ) : null}

        {(showGenerateDraftCta || showGenerateAnotherCta) && (
          <button
            type="button"
            onClick={showGenerateAnotherCta ? handleGenerateAnother : handleStudioPrimaryAction}
            disabled={isStudioPrimaryActionLoading || isDocumentAdkLoading}
            className={`group mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-4 font-medium transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 ${
              showGenerateAnotherCta
                ? "border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-brand-600 hover:bg-brand-600 hover:text-white hover:shadow-lg hover:shadow-brand-500/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-brand-600 dark:hover:bg-brand-600 dark:hover:text-white"
                : "bg-brand-600 text-white shadow-lg shadow-brand-500/30 hover:bg-brand-700"
            }`}
          >
            {isStudioPrimaryActionLoading ? (
              <div
                className={`h-4 w-4 animate-spin rounded-full border-2 border-t-transparent ${
                  showGenerateAnotherCta
                    ? "border-slate-400 group-hover:border-white/50 group-hover:border-t-white"
                    : "border-white/50 border-t-white"
                }`}
              />
            ) : (
              <Wand2 size={18} />
            )}
            {isStudioPrimaryActionLoading ? " Crafting..." : showGenerateAnotherCta ? "Generate Another" : "Generate Draft"}
          </button>
        )}

        {selectedTopic === "vpd" && (
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-4 font-medium text-white shadow-lg shadow-brand-500/30 transition-all hover:bg-brand-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isGenerating ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white" />
            ) : (
              <Wand2 size={18} />
            )}
            {isGenerating ? " Crafting..." : "Generate Draft"}
          </button>
        )}

        {selectedTopic === "vpd" && renderVpdSavedCards()}
        {isDocumentTopic(selectedTopic) && renderDocumentSavedCards()}

        {selectedTopic === "linkedin-post" && (
          <div className="mt-5 flex min-h-[min(58vh,560px)] flex-1 flex-col border-t border-slate-100 pt-5 dark:border-slate-800">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <StudioSectionDot />
                <h3 className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">Scheduled posts</h3>
                <span className="shrink-0 rounded-md bg-brand-50 px-1.5 py-0.5 text-[10px] font-medium text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                  {scheduledPostsForModal.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleViewAll("history")}
                title="Post history"
                aria-label={`Post history, ${historyPostsForModal.length} entries`}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-orange-600 shadow-sm transition-all hover:border-orange-300 hover:bg-orange-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-orange-600/50 dark:hover:bg-orange-950/30"
              >
                <History size={18} />
              </button>
            </div>

            <div className="scrollbar-on-hover flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
              {scheduledPostsForModal.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-xs text-slate-400 dark:border-slate-700">
                  Nothing scheduled yet. Generate a draft, then schedule it from the preview.
                </p>
              ) : (
                scheduledPostsForModal.map(post => (
                  <LinkedInPostListCard
                    key={post.id}
                    post={post}
                    onClick={() => handlePostClick(post, "scheduled")}
                    onDelete={id => void handleDeleteLinkedinPost(String(id))}
                  />
                ))
              )}
            </div>

            <div className="flex shrink-0 justify-center pt-3">
              <button
                type="button"
                onClick={() => handleViewAll("scheduled")}
                className="text-[11px] font-medium text-brand-600 hover:underline dark:text-brand-400"
              >
                View all
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const isVpdTopic = selectedTopic === "vpd";
  const showLinkedInOptimizeBanner = selectedTopic === "linkedin-post" || selectedTopic === "referral";

  const {
    width: editorPanelWidth,
    isResizing: isEditorResizing,
    startResize: startEditorResize,
  } = useResizablePanelWidth({
    storageKey: "studio-editor-panel-width",
    defaultWidth: 420,
    minWidth: 300,
    maxWidthPx: 720,
    maxViewportFraction: 0.52,
  });

  /** Preview body for document tabs — persisted draft content, or pending ADK draft before Accept. */
  const getDocumentPreviewContent = () => {
    if (selectedTopic === "cover-letter") {
      return currentCoverLetterDraft?.content ?? generatedContent;
    }
    if (selectedTopic === "cold-email") {
      return currentColdEmailDraft?.content ?? generatedContent;
    }
    if (selectedTopic === "referral") {
      return currentReferralDraft?.content ?? generatedContent;
    }
    return "";
  };

  const documentPreviewContent = useMemo(() => {
    if (
      isDocumentTopic(selectedTopic) &&
      documentAssetApiType &&
      activeApplicationAssetReview?.proposedDraft.trim() &&
      activeApplicationAssetReview.assetType === documentAssetApiType
    ) {
      return normalizeContentToHtml(activeApplicationAssetReview.proposedDraft);
    }
    if (selectedTopic === "cover-letter") {
      return currentCoverLetterDraft?.content ?? generatedContent;
    }
    if (selectedTopic === "cold-email") {
      return currentColdEmailDraft?.content ?? generatedContent;
    }
    if (selectedTopic === "referral") {
      return currentReferralDraft?.content ?? generatedContent;
    }
    return "";
  }, [
    selectedTopic,
    documentAssetApiType,
    activeApplicationAssetReview,
    generatedContent,
    currentCoverLetterDraft?.content,
    currentColdEmailDraft?.content,
    currentReferralDraft?.content,
  ]);

  useEffect(() => {
    const card = activeApplicationAssetReview;
    if (!card?.proposedDraft.trim() || !isDocumentTopic(selectedTopic)) {
      return;
    }
    const studioTopic = API_TYPE_TO_STUDIO_TOPIC[card.assetType];
    if (studioTopic !== selectedTopic) {
      return;
    }
    const draft = normalizeContentToHtml(card.proposedDraft);
    setGeneratedContent(draft);
    const pending = { content: draft, status: "draft" as const };
    if (card.assetType === "coverletter") {
      setCurrentCoverLetterDraft(prev =>
        prev ? { ...prev, ...pending } : { id: card.baselineAssetId ?? "", role, company, job_description: jobDescription, ...pending }
      );
    } else if (card.assetType === "coldemail") {
      setCurrentColdEmailDraft(prev =>
        prev
          ? { ...prev, ...pending }
          : { id: card.baselineAssetId ?? "", role, company, job_description: jobDescription, hirname: managerName, ...pending }
      );
    } else if (card.assetType === "referral") {
      setCurrentReferralDraft(prev =>
        prev ? { ...prev, ...pending } : { id: card.baselineAssetId ?? "", role, company, conname: connectionName, ...pending }
      );
    }
  }, [activeApplicationAssetReview, selectedTopic, role, company, jobDescription, managerName, connectionName]);

  const getLinkedInPreviewContent = () => {
    if (selectedTopic !== "linkedin-post") {
      return "";
    }
    return generatedContent;
  };

  const getDocumentPlaceholder = () => {
    if (selectedTopic === "cover-letter") return "Your cover letter draft will appear here...";
    if (selectedTopic === "cold-email") return "Your cold email draft will appear here...";
    if (selectedTopic === "referral") return "Your referral draft will appear here...";
    return "Your draft will appear here...";
  };

  const prepareBannerTab: PrepareApplicationTab = isPrepareModeStudioTab(selectedTopic)
    ? selectedTopic
    : (prepareReturn?.tab ?? "cover-letter");

  const showPrepareSaveAndReturn =
    prepareReturn != null &&
    ((selectedTopic === "cover-letter" && !!currentCoverLetterDraft?.id) ||
      (selectedTopic === "cold-email" && !!currentColdEmailDraft?.id));

  const documentHasGeneratedAsset =
    (selectedTopic === "cover-letter" && !!currentCoverLetterDraft?.id) ||
    (selectedTopic === "cold-email" && !!currentColdEmailDraft?.id) ||
    (selectedTopic === "referral" && !!currentReferralDraft?.id) ||
    (selectedTopic === "linkedin-post" && !!linkedinPostAssetId && generatedContent.trim().length > 0);

  const topicHasGeneratedDraft = documentHasGeneratedAsset;

  const isStudioPrimaryActionLoading =
    selectedTopic === "linkedin-post" ? isGenerating : isDocumentPreviewLoading || (selectedTopic === "vpd" && isGenerating);

  const showGenerateAnotherCta = topicHasGeneratedDraft && (isDocumentTopic(selectedTopic) || selectedTopic === "linkedin-post");

  const showGenerateDraftCta = (isDocumentTopic(selectedTopic) || selectedTopic === "linkedin-post") && !topicHasGeneratedDraft;

  const handleStudioPrimaryAction = handleGenerate;

  const showDocumentGenerateCta =
    !!prepareReturn && (selectedTopic === "cover-letter" || selectedTopic === "cold-email") && !documentHasGeneratedAsset;

  const documentGenerateCtaLabel =
    selectedTopic === "cover-letter" ? "Generate Cover Letter" : selectedTopic === "cold-email" ? "Generate Cold Email" : "";

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-white font-sans dark:bg-slate-950">
      {prepareReturn ? (
        <PrepareApplicationReturnBar
          session={prepareReturn}
          showSaveAndReturn={showPrepareSaveAndReturn}
          onSaveAndReturn={() => void handleSaveAndReturnToPrepare()}
          onDismiss={handleDismissPrepareReturn}
        />
      ) : null}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden lg:flex-row">
        {/* LEFT: Input / Generator — drag right edge to resize */}
        <div className={`flex h-1/2 w-full shrink-0 lg:h-full lg:w-auto ${isEditorResizing ? "select-none" : ""}`}>
          <div
            className="h-full min-w-0 overflow-hidden border-b border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900 lg:border-b-0 lg:border-r lg:border-slate-200/60 dark:lg:border-slate-700/60"
            style={{ width: editorPanelWidth }}
          >
            <div className="scrollbar-on-hover h-full overflow-y-auto p-8">
              <div className="mb-8">
                <h1 className="mb-2 font-['Onest'] text-2xl font-medium text-slate-900 transition-colors dark:text-white">
                  {getTopicMeta(selectedTopic).label}
                </h1>
                <p className="text-[14px] text-slate-500 transition-colors dark:text-slate-400">{getTopicDescription(selectedTopic)}</p>
              </div>

              {renderInputs()}
            </div>
          </div>
          <PanelResizeHandle variant="inline" onPointerDown={startEditorResize} label="Resize studio editor panel" />
        </div>

        {/* RIGHT: Preview + Tabs */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col relative bg-slate-100 dark:bg-slate-950">
          {/* Top Bar for Tabs - Sticky */}
          <div className="w-full px-8 py-6 border-b border-slate-200/50 dark:border-slate-800/50 bg-slate-100/50 dark:bg-slate-950 backdrop-blur-sm sticky top-0 z-20">
            <div className="flex flex-wrap items-center justify-center gap-3">
              {TOPIC_GROUPS.map((group, gi) => (
                <div
                  key={gi}
                  className={`inline-flex rounded-full bg-slate-200/50 p-1 dark:bg-slate-900 ${
                    group.blueStroke ? "border border-brand-500/25 dark:border-brand-400/30" : "border border-transparent"
                  }`}
                >
                  {group.topics.map(t => {
                    const isLockedInPrepareMode = prepareReturn != null && PREPARE_MODE_LOCKED_TOPICS.has(t.id);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleTopicChange(t.id)}
                        disabled={isLockedInPrepareMode}
                        title={isLockedInPrepareMode ? "Close the banner to switch to this tab" : undefined}
                        className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all ${
                          selectedTopic === t.id
                            ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                            : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                        } ${isLockedInPrepareMode ? "cursor-not-allowed opacity-40" : ""}`}
                      >
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="flex min-h-0 flex-1 items-start justify-center overflow-y-auto p-8 scrollbar-on-hover">
              {isVpdTopic ? (
                <div className="flex h-full min-h-[min(70vh,640px)] w-full max-w-3xl flex-col">
                  <VpdPreview project={vpdProject} onOpenEditor={() => setShowVpdEditor(true)} variant="panel" />
                </div>
              ) : (
                <div className="relative w-full max-w-[210mm] group/preview">
                  {selectedTopic === "linkedin-post" ? (
                    <div className="flex min-h-[min(68vh,580px)] w-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                      <div className="mb-3 flex shrink-0 items-start justify-between">
                        <LinkedInPostAuthorHeader author={linkedInPostAuthor} />
                        <button type="button" className="rounded-full p-1 text-slate-500 hover:bg-slate-100" aria-label="More options">
                          <MoreHorizontal size={20} />
                        </button>
                      </div>
                      {linkedinPersistError ? (
                        <p className="mb-2 shrink-0 text-xs text-red-600 dark:text-red-400" role="alert">
                          {linkedinPersistError}
                        </p>
                      ) : null}
                      <textarea
                        value={getLinkedInPreviewContent()}
                        onChange={e => {
                          setLinkedinPersistError(null);
                          setGeneratedContent(e.target.value);
                        }}
                        onBlur={handleLinkedinPreviewBlur}
                        placeholder="Your content preview will appear here..."
                        aria-label="LinkedIn post content"
                        className="scrollbar-on-hover mb-2 min-h-[min(42vh,360px)] w-full flex-1 resize-none overflow-y-auto border-none bg-transparent text-sm leading-relaxed text-slate-800 outline-none placeholder:text-slate-300 dark:text-slate-100 dark:placeholder:text-slate-600"
                      />
                      {linkedinPendingMedia.length > 0 || linkedinImages.length > 0 ? (
                        <div className="mb-3 grid shrink-0 grid-cols-2 gap-2">
                          {linkedinPendingMedia.map(p => (
                            <div key={p.id} className="relative overflow-hidden rounded-lg border border-amber-200">
                              <StudioMediaPreviewImage src={p.objectUrl} alt="" className="h-32 w-full object-cover" />
                              <span className="absolute bottom-1 left-1 rounded bg-amber-100/90 px-1 text-[10px] font-medium text-amber-900">
                                Pending upload
                              </span>
                            </div>
                          ))}
                          {linkedinImages.map(url => (
                            <StudioMediaPreviewImage
                              key={url}
                              src={url}
                              alt="LinkedIn media preview"
                              className="h-32 w-full rounded-lg border border-slate-200 object-cover"
                            />
                          ))}
                        </div>
                      ) : null}
                      <div className="mt-2 flex shrink-0 items-center justify-between border-b border-slate-100 pb-3 text-xs text-slate-500 dark:border-slate-800">
                        <div className="flex cursor-pointer items-center gap-1.5 hover:text-brand-600 hover:underline">
                          <div className="flex -space-x-1">
                            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 ring-2 ring-white">
                              <ThumbsUp size={8} className="fill-current text-white" />
                            </div>
                            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500 ring-2 ring-white">
                              <span className="text-[6px] text-white">❤️</span>
                            </div>
                          </div>
                          <span>1,245</span>
                        </div>
                        <div className="cursor-pointer hover:text-brand-600 hover:underline">88 comments • 12 reposts</div>
                      </div>
                      <div className="flex shrink-0 items-center justify-between px-2 pt-1">
                        <button
                          type="button"
                          className="flex items-center gap-2 rounded px-2 py-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100"
                        >
                          <ThumbsUp size={18} /> <span className="hidden sm:inline">Like</span>
                        </button>
                        <button
                          type="button"
                          className="flex items-center gap-2 rounded px-2 py-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100"
                        >
                          <MessageSquare size={18} /> <span className="hidden sm:inline">Comment</span>
                        </button>
                        <button
                          type="button"
                          className="flex items-center gap-2 rounded px-2 py-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100"
                        >
                          <Repeat size={18} /> <span className="hidden sm:inline">Repost</span>
                        </button>
                        <button
                          type="button"
                          className="flex items-center gap-2 rounded px-2 py-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100"
                        >
                          <Send size={18} /> <span className="hidden sm:inline">Send</span>
                        </button>
                      </div>
                      <div className="mt-4 flex shrink-0 justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                        {topicHasGeneratedDraft ? (
                          <button
                            type="button"
                            onClick={handleImproveWithUnibot}
                            disabled={isDocumentAdkLoading || !getLinkedInPreviewContent().trim()}
                            className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-5 py-2.5 text-sm font-medium text-brand-700 transition-all hover:bg-brand-100 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 dark:border-brand-800 dark:bg-brand-900/40 dark:text-brand-300 dark:hover:bg-brand-900/60"
                          >
                            <Wand2 size={16} />
                            Improve with Unibot
                          </button>
                        ) : null}
                        <LinkedInPublishAccessTooltipWrap
                          access={linkedInPublishAccess}
                          userId={profileData?.user_id}
                          disabled={
                            !linkedInPublishAccess.canPost ||
                            !getLinkedInPreviewContent().trim() ||
                            isUploadingLinkedinMedia ||
                            linkedinPendingMedia.length > 0
                          }
                        >
                          <button
                            type="button"
                            disabled={
                              !linkedInPublishAccess.canPost ||
                              !getLinkedInPreviewContent().trim() ||
                              isUploadingLinkedinMedia ||
                              linkedinPendingMedia.length > 0
                            }
                            onClick={() => {
                              window.dispatchEvent(
                                new CustomEvent(CONTENT_GEN_EVENTS.requestPublish, {
                                  detail: { mode: "schedule" },
                                })
                              );
                            }}
                            className="inline-flex items-center rounded-full bg-brand-600 px-6 py-2.5 text-sm font-medium text-white shadow-md shadow-brand-500/25 transition-all hover:bg-brand-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Post / Schedule
                          </button>
                        </LinkedInPublishAccessTooltipWrap>
                      </div>
                    </div>
                  ) : isDocumentTopic(selectedTopic) ? (
                    <StudioDocumentPreview
                      content={documentPreviewContent}
                      placeholder={getDocumentPlaceholder()}
                      hasPendingUnsavedChanges={documentHasPendingUnsavedChanges}
                      isSaving={documentIsSaving || reviewAcceptSaving}
                      savedConfirmationVisible={documentSavedConfirmationVisible || reviewAcceptSavedVisible}
                      isGenerating={isDocumentPreviewLoading}
                      generatingLabel={
                        selectionRefineLoading && !isDocumentDraftLoadingForTopic
                          ? documentRefineLoadingLabel
                          : selectedTopic === "cover-letter"
                            ? "Generating cover letter..."
                            : selectedTopic === "cold-email"
                              ? "Generating cold email..."
                              : "Generating referral request..."
                      }
                      copyFeedback={
                        selectedTopic === "cover-letter"
                          ? copyToast
                          : selectedTopic === "cold-email"
                            ? coldEmailCopyToast
                            : referralCopyToast
                      }
                      assetType={documentAssetApiType}
                      isAdkLoading={isDocumentAdkLoading}
                      hasPendingRevision={hasApplicationAssetPendingRevision}
                      adkReviewBusy={applicationAssetReviewBusy}
                      onAcceptRevision={() => void acceptApplicationAssetReview()}
                      onRevertRevision={discardApplicationAssetReview}
                      baselineDraft={activeApplicationAssetReview?.baselineDraft ?? ""}
                      anchorSelectedText={activeApplicationAssetReview?.anchorSelectedText}
                      reviewSessionKey={activeApplicationAssetReview?.id}
                      onApplyReconciled={(html: string) => void acceptApplicationAssetReview(html)}
                      onCopy={() => {
                        if (selectedTopic === "cover-letter") {
                          setCopyToast(true);
                          setTimeout(() => setCopyToast(false), 2000);
                        } else if (selectedTopic === "cold-email") {
                          setColdEmailCopyToast(true);
                          setTimeout(() => setColdEmailCopyToast(false), 2000);
                        } else {
                          setReferralCopyToast(true);
                          setTimeout(() => setReferralCopyToast(false), 2000);
                        }
                      }}
                      onContentChange={handleDocumentContentChange}
                      onSaveNow={() => {
                        documentContentRef.current = getDocumentPreviewContent();
                        void runDocumentSave();
                      }}
                      showDocumentDownload={selectedTopic === "cover-letter"}
                      generateCtaLabel={showDocumentGenerateCta ? documentGenerateCtaLabel : undefined}
                      onGenerateCta={showDocumentGenerateCta ? handleGenerate : undefined}
                      onImproveWithUnibot={topicHasGeneratedDraft ? handleImproveWithUnibot : undefined}
                      improveDisabled={isDocumentAdkLoading || hasApplicationAssetPendingRevision}
                      onDownloadPdf={
                        selectedTopic === "cover-letter"
                          ? async () => {
                              const content = getDocumentPreviewContent();
                              if (currentCoverLetterDraft) {
                                await exportCoverLetterAsPDF({ ...currentCoverLetterDraft, content });
                              }
                            }
                          : undefined
                      }
                      onDownloadDocx={
                        selectedTopic === "cover-letter"
                          ? async () => {
                              const content = getDocumentPreviewContent();
                              if (currentCoverLetterDraft) {
                                await exportApplicationAssetAsDocx(
                                  content,
                                  "cover-letter",
                                  currentCoverLetterDraft.company,
                                  currentCoverLetterDraft.role
                                );
                              }
                            }
                          : undefined
                      }
                    />
                  ) : null}
                </div>
              )}
            </div>
            {showLinkedInOptimizeBanner ? (
              <div className="shrink-0 border-t border-slate-200/60 bg-slate-100 px-8 py-4 dark:border-slate-800/60 dark:bg-slate-950">
                <LinkedInOptimizeBanner />
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showScheduler && (
        <PostSchedulerModal
          content={generatedContent}
          authorName={linkedInPostAuthor.name}
          authorHeadline={linkedInPostAuthor.headline}
          authorPictureUrls={linkedInPostAuthor.pictureUrls}
          authorInitials={linkedInPostAuthor.initials}
          linkedinPreviewPendingMedia={linkedinPendingMedia.map(p => ({ id: p.id, objectUrl: p.objectUrl }))}
          linkedinPreviewImages={linkedinImages}
          onClose={() => {
            setShowScheduler(false);
            setSelectedPostData(null);
            setPublishModalSeed(null);
          }}
          onPost={handlePost}
          onImproveWithUnibot={handlePostSchedulerImprove}
          linkedInPublishAccess={linkedInPublishAccess}
          userId={profileData?.user_id}
          initialData={
            publishModalSeed ??
            (selectedPostData
              ? {
                  isScheduled: Boolean(selectedPostData.isScheduled),
                  date: selectedPostData.dateScheduled ? new Date(selectedPostData.dateScheduled) : undefined,
                }
              : undefined)
          }
        />
      )}

      {showAllPostsModal && (
        <AllPostsModal
          initialTab={allPostsInitialTab}
          scheduledPosts={scheduledPostsForModal}
          historyPosts={historyPostsForModal}
          onClose={() => setShowAllPostsModal(false)}
          onPostClick={(post, type) => {
            setShowAllPostsModal(false);
            handlePostClick(post, type);
          }}
          onDeletePost={selectedTopic === "linkedin-post" ? (id, _type) => void handleDeleteLinkedinPost(String(id)) : undefined}
        />
      )}

      {showAllVPDsModal && (
        <AllVPDsModal
          vpds={savedVpds}
          initialTab={vpdLibraryTab}
          onClose={() => setShowAllVPDsModal(false)}
          onVPClick={vpd => {
            setShowAllVPDsModal(false);
            handleSelectVpd(vpd);
          }}
        />
      )}

      {showAllDocumentsModal && isDocumentTopic(selectedTopic) && (
        <AllDocumentsModal
          topicLabel={DOCUMENT_TOPIC_LABELS[selectedTopic]}
          documents={documentItemsForTopic}
          selectedDocumentId={activeRecentDocumentId}
          onClose={() => setShowAllDocumentsModal(false)}
          onDocumentClick={doc => {
            setShowAllDocumentsModal(false);
            void handleSelectDocument(doc);
          }}
          onDeleteDocument={id => void handleDeleteDocument(id)}
        />
      )}

      {showVpdEditor && (
        <VpdEditorWindow project={vpdProject} onClose={() => setShowVpdEditor(false)} onUpdateProject={updated => setVpdProject(updated)} />
      )}

      {coverLetterDuplicateModal && (
        <ModalPortalOverlay className="flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" role="dialog">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">Cover Letter Already Exists</h2>
            <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">
              A cover letter for this role and company already exists. You can use it or create a new one to replace it.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={async () => {
                  const full = await fetchCoverLetterById(coverLetterDuplicateModal.existingAssetId);
                  if (full) {
                    setCurrentCoverLetterDraft(full);
                    applyCoverLetterDraftToForm(full);
                    updateStudioUrl({ type: "cover-letter", id: String(full.id) });
                  }
                  setCoverLetterDuplicateModal(null);
                }}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
              >
                Use existing
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!coverLetterDuplicateModal) return;
                  const result = await generateCoverLetterMutation.replaceExistingAndGenerate(
                    coverLetterDuplicateModal.existingAssetId,
                    coverLetterDuplicateModal.params
                  );
                  setCoverLetterDuplicateModal(null);
                  handleApplicationAssetDraftStarted(result, "cover-letter");
                }}
                disabled={generateCoverLetterMutation.isPending}
                className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-200"
              >
                Create new anyway
              </button>
            </div>
          </div>
        </ModalPortalOverlay>
      )}

      {coldEmailDuplicateModal && (
        <ModalPortalOverlay className="flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" role="dialog">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">Cold Email Already Exists</h2>
            <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">
              A cold email for this role and company already exists. You can use it or create a new one to replace it.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={async () => {
                  const full = await fetchColdEmailById(coldEmailDuplicateModal.existingAssetId);
                  if (full) {
                    setCurrentColdEmailDraft(full);
                    applyColdEmailDraftToForm(full);
                    updateStudioUrl({ type: "cold-email", id: String(full.id) });
                  }
                  setColdEmailDuplicateModal(null);
                }}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
              >
                Use existing
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!coldEmailDuplicateModal) return;
                  const result = await generateColdEmailMutation.replaceExistingAndGenerate(
                    coldEmailDuplicateModal.existingAssetId,
                    coldEmailDuplicateModal.params
                  );
                  setColdEmailDuplicateModal(null);
                  handleApplicationAssetDraftStarted(result, "cold-email");
                }}
                disabled={generateColdEmailMutation.isPending}
                className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-200"
              >
                Create new anyway
              </button>
            </div>
          </div>
        </ModalPortalOverlay>
      )}

      {coverLetterSubscriptionModal && (
        <ModalPortalOverlay className="flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" role="dialog">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">Subscription required</h2>
            <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">
              Cover letter generation is available for subscribers. Upgrade to continue.
            </p>
            <button
              type="button"
              onClick={() => setCoverLetterSubscriptionModal(false)}
              className="w-full rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              Close
            </button>
          </div>
        </ModalPortalOverlay>
      )}

      {coldEmailSubscriptionModal && (
        <ModalPortalOverlay className="flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" role="dialog">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">Subscription required</h2>
            <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">
              Cold email generation is available for subscribers. Upgrade to continue.
            </p>
            <button
              type="button"
              onClick={() => setColdEmailSubscriptionModal(false)}
              className="w-full rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              Close
            </button>
          </div>
        </ModalPortalOverlay>
      )}

      {referralDuplicateModal && (
        <ModalPortalOverlay
          className="flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-labelledby="referral-duplicate-modal-title"
        >
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl p-6 border border-slate-200 dark:border-slate-800">
            <h2 id="referral-duplicate-modal-title" className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              Referral Already Exists
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              A referral for this role, company and connection already exists. You can use it or create a new one to replace it.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={async () => {
                  const full = await fetchReferralById(referralDuplicateModal.existingAssetId);
                  if (full) {
                    setCurrentReferralDraft(full);
                    applyReferralDraftToForm(full);
                    updateStudioUrl({ type: "referral", id: String(full.id) });
                  }
                  setReferralDuplicateModal(null);
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-brand-600 text-white hover:bg-brand-700 transition-colors"
              >
                Use existing
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!referralDuplicateModal) return;
                  const result = await generateReferralMutation.replaceExistingAndGenerate(
                    referralDuplicateModal.existingAssetId,
                    referralDuplicateModal.params
                  );
                  setReferralDuplicateModal(null);
                  handleApplicationAssetDraftStarted(result, "referral");
                }}
                disabled={generateReferralMutation.isPending}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                Create new anyway
              </button>
            </div>
          </div>
        </ModalPortalOverlay>
      )}

      {referralSubscriptionModal && (
        <ModalPortalOverlay
          className="flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-labelledby="referral-subscription-modal-title"
        >
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl p-6 border border-slate-200 dark:border-slate-800">
            <h2 id="referral-subscription-modal-title" className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              Subscription required
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              Referral generation is available for subscribers. Upgrade to continue.
            </p>
            <button
              type="button"
              onClick={() => setReferralSubscriptionModal(false)}
              className="w-full px-4 py-2 rounded-lg text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Close
            </button>
          </div>
        </ModalPortalOverlay>
      )}
    </div>
  );
};

export default StudioMainV2;
