"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { AdkDraftReviewDecisionStatus } from "@/components/chat/AdkDraftReviewDecisionStatus";
import { AdkRewindConfirmDialog } from "@/components/chat/AdkRewindConfirmDialog";
import ApplicationAssetReviewStepperCard from "@/components/studio/ApplicationAssetReviewStepperCard";
import { PanelResizeHandle } from "@/components/ui/PanelResizeHandle";
import { syncSessionStateAction, pullSessionStateAction } from "@/features/adk-chat/actions";
import { buildContentGenContentKey } from "@/features/adk-chat/content-scope";
import { formatUnibotStreamError, type FormattedUnibotStreamError } from "@/features/adk-chat/format-stream-error";
import { generateMainSessionTitleIfNeeded } from "@/features/adk-chat/generate-main-session-title";
import { useReviewDecisions } from "@/features/adk-chat/hooks/useReviewDecisions";
import { resolveImproveSubSession } from "@/features/adk-chat/improve-sub-session";
import {
  findImproveTopic,
  insertTopicInMainThread,
  loadSubSessionChatMessages,
  syncTopicUserInvocationIdsFromAdk,
  topicIdForSubSession,
  topicKindForSub,
} from "@/features/adk-chat/improve-topic-helpers";
import { markMainSessionHasUserPrompt } from "@/features/adk-chat/main-session-activity";
import { cancelOptimisticUnibotActivity, ensureOptimisticUnibotActivity } from "@/features/adk-chat/optimistic-unibot-activity";
import { persistAcceptSnapshotForSession } from "@/features/adk-chat/persist-accept-snapshot";
import { persistReviewDecisionForSession } from "@/features/adk-chat/persist-review-decision";
import { isHandoffPromptForTitle } from "@/features/adk-chat/pick-title-source-prompt";
import { resolveAdkSessionOptionsForSessionId } from "@/features/adk-chat/resolve-sub-session-adk-app";
import {
  buildContentGenSnapshotPayload,
  buildLinkedInSnapshotPayload,
  buildPortfolioSnapshotPayload,
  buildResumeSnapshotPayload,
} from "@/features/adk-chat/revert-django-content-after-rewind";
import type { ReviewDecision, ReviewDecisionsMap } from "@/features/adk-chat/review-decisions";
import { getSessionDisplayName, getSessionMeta, groupSessionsForSidebar } from "@/features/adk-chat/session-metadata";
import { useAdkApplicationAssetReviewStore } from "@/features/adk-chat/stores/useAdkApplicationAssetReviewStore";
import { useAdkContentGenReviewStore } from "@/features/adk-chat/stores/useAdkContentGenReviewStore";
import { useAdkLinkedInReviewStore, type AdkLinkedInReviewCard } from "@/features/adk-chat/stores/useAdkLinkedInReviewStore";
import { useAdkPortfolioReviewStore, type AdkPortfolioReviewCard } from "@/features/adk-chat/stores/useAdkPortfolioReviewStore";
import { useAdkResumeReviewStore, type AdkReviewCard } from "@/features/adk-chat/stores/useAdkResumeReviewStore";
import { syncAdkContentStateOnAccept } from "@/features/adk-chat/sync-adk-content-on-accept";
import {
  isStreamingMachineReadablePayloadOnly,
  stripMachineReadablePayloadFromMessage,
} from "@/features/adk-chat/utils/strip-machine-readable-payload";
import {
  APPLICATION_ASSET_EVENTS,
  type ApplicationAssetOpenDraftDetail,
  type ApplicationAssetOpenImproveDetail,
  type ApplicationAssetSelectionFreeformDetail,
  type ApplicationAssetSelectionRefineDetail,
} from "@/features/application-assets/api/application-asset-events";
import { APPLICATION_ASSET_MIN_DRAFT_CHARS } from "@/features/application-assets/api/applicationAssetDraftConfig";
import {
  messageHasApplicationAssetDraft,
  stripApplicationAssetDraftFromMessage,
} from "@/features/application-assets/api/applicationAssetDraftDisplay";
import {
  extractActionLabelFromRefineMessage,
  IMPROVE_WITH_UNIBOT_ACTION_LABEL,
  withPersistedActionLabel,
} from "@/features/application-assets/api/asset-action-message";
import { fetchDocumentImproveSuggestions } from "@/features/application-assets/api/fetchDocumentImproveSuggestions";
import { offerApplicationAssetDraftReview } from "@/features/application-assets/api/offerApplicationAssetDraftReview";
import {
  APPLICATION_ASSET_FULL_DOCUMENT_IMPROVE_FALLBACK,
  buildFullDocumentImproveMessage,
  suggestionToFullDocumentPreset,
  type FullDocumentImprovePreset,
} from "@/features/application-assets/config/improve-presets";
import {
  assetTypeDisplayLabel,
  buildFreeformSelectionUserMessage,
  buildFullDocumentFreeformUserMessage,
} from "@/features/application-assets/config/selection-presets";
import { useApplicationAssetReviewActions } from "@/features/application-assets/hooks/useApplicationAssetReviewActions";
import { useApplicationAssetDiffReviewUiStore } from "@/features/application-assets/store/useApplicationAssetDiffReviewUiStore";
import { useApplicationAssetStudioStore } from "@/features/application-assets/store/useApplicationAssetStudioStore";
import type { ApplicationAssetApiType } from "@/features/application-assets/types";
import { extractApplicationAssetDraftFromSessionState } from "@/features/application-assets/utils/extractApplicationAssetDraftFromSessionState";
import type { ContentGenFunnel } from "@/features/content-lab/api/adk-mappers";
import type { ContentGenPlannerAction } from "@/features/content-lab/api/content-gen-events";
import { CONTENT_GEN_EVENTS, CONTENT_GEN_PUBLISH_BLOCKED_MESSAGE } from "@/features/content-lab/api/content-gen-events";
import { shouldForceDjangoContentGenDraft } from "@/features/content-lab/api/contentGenDraftConfig";
import {
  CONTENT_GEN_IMPROVE_KICKOFF_USER_MESSAGE,
  stripContentGenDraftFromMessage,
  messageHasContentGenDraft,
  shouldDeferContentGenDraftBubbleText,
} from "@/features/content-lab/api/contentGenDraftDisplay";
import { isValidContentGenTopicTitle } from "@/features/content-lab/api/contentGenTopicUtils";
import { extractContentGenDraftFromAdkState } from "@/features/content-lab/api/extractContentGenDraftFromAdkState";
import {
  extractConfirmedTopicFromThread,
  inferFunnelFromChipLabel,
  messageHasPlannerChips,
  messageShowsTopicPickerChips,
  stripPlannerJsonFromMessage,
} from "@/features/content-lab/api/extractPlannerChips";
import { offerContentGenDraftReview } from "@/features/content-lab/api/offerContentGenDraftReview";
import { parseContentGenTopicIntent } from "@/features/content-lab/api/parseContentGenTopicIntent";
import { parseGenerateDraftRequest } from "@/features/content-lab/api/parseGenerateDraftRequest";
import { parsePublishIntent } from "@/features/content-lab/api/parsePublishIntent";
import { syncContentGenDraftToStudio } from "@/features/content-lab/api/syncContentGenDraftToStudio";
import {
  publishStepLabel,
  runContentGenPublishFromChat,
  successMessageForPublishResult,
} from "@/features/content-lab/hooks/runContentGenPublishFromChat";
import { runDjangoContentGenDraftFallback } from "@/features/content-lab/hooks/runDjangoContentGenDraftFallback";
import { createContentGenShell } from "@/features/content-lab/server-actions/content-lab-actions";
import { useContentGenStudioStore } from "@/features/content-lab/store/useContentGenStudioStore";
import { buildAdkPortfolioDataMap, buildAdkPortfolioStateDelta } from "@/features/portfolio/api/mappers";
import { portfolioQueryKey } from "@/features/portfolio/hooks/usePortfolio";
import { usePortfolioStore } from "@/features/portfolio/store/usePortfolioStore";
import { buildAdkResumeDataMap } from "@/features/resume/api/mappers";
import {
  RESUME_FULL_IMPROVE_PRESETS,
  RESUME_OPEN_FULL_IMPROVE_EVENT,
  type ResumeOpenFullImproveDetail,
  type ResumeFullImprovePreset,
} from "@/features/resume/api/resume-full-improve-presets";
import { resumeByIdQueryKey } from "@/features/resume/hooks/useResume";
import { useResumeStore } from "@/features/resume/store/useResumeStore";
import { MODAL_OVERLAY_Z_CLASS } from "@/lib/ui/modal-overlay";
import { isUntitledMainSessionTitle, UNTITLED_THREAD_TITLE } from "@/src/features/adk-chat/constants";
import {
  deriveActiveScope,
  deriveScopeFromRegistryRow,
  deriveScopeFromTopicKind,
  getContentScopeFeatureLabel,
  getContentScopeRedirectLabel,
  getRedirectPathForScope,
  resolveRewindRedirectScope,
  scopesMatch,
  type ContentScope,
  type ScopeMatch,
} from "@/src/features/adk-chat/content-scope";
import { ensureApplicationAssetTopicSubSession, ensureContentGenTopicSubSession } from "@/src/features/adk-chat/ensure-topic-sub-session";
import { useSyncUnibotUiToRoute } from "@/src/features/adk-chat/hooks/useSyncUnibotUiToRoute";
import { SUB_THREAD_COLLAPSE_THRESHOLD } from "@/src/features/adk-chat/hydrate-loaded-topics";
import { useActiveResumeIdForPatch } from "@/src/features/adk-chat/resolve-active-resume-id";
import {
  resolveApplicationAssetReviewNavTarget,
  resolveContentGenReviewNavTarget,
  resolveLinkedInReviewNavTarget,
  resolvePortfolioReviewNavTarget,
  resolveResumeReviewNavTarget,
} from "@/src/features/adk-chat/resolve-review-nav-target";
import {
  isResumeReviewActionsInContext,
  isSubThreadNavTargetActive,
  resolveSubThreadNavTarget,
  type SubThreadNavTarget,
} from "@/src/features/adk-chat/resolve-sub-thread-navigation";
import { assessRewindStateRevert } from "@/src/features/adk-chat/rewind-state-divergence";
import { getRegistryRow, upsertRegistryRow } from "@/src/features/adk-chat/session-registry";
import { buildLinkedInImproveContentKey, buildResumeImproveContentKey } from "@/src/features/adk-chat/sub-session-content-key";
import {
  buildLinkedInImproveTitle,
  buildLinkedInPostTitle,
  buildLinkedInTopicPickerTitle,
  buildResumeImproveTitle,
  displayTitleForSubSession,
  deriveSubSessionSubtitle,
} from "@/src/features/adk-chat/sub-session-titles";
import { dismissSyncedContentGenReviews } from "@/src/features/adk-chat/sync-content-gen-review-with-persisted";
import {
  APPLICATION_ASSET_IMPROVE_NUDGE,
  CONTENT_GEN_IMPROVE_NUDGE,
  CONTENT_GEN_TOPIC_PICKER_NUDGE,
  findContentGenTopicPickerId,
  findLatestTopicPickerWandFunnel,
  findPendingReviewInTopic,
  findTopicPickerTurnForFunnel,
  isContentGenTopicPickerTitle,
  LINKEDIN_IMPROVE_NUDGE,
  RESUME_IMPROVE_NUDGE,
  type UnibotActionHighlightTarget,
} from "@/src/features/adk-chat/unibot-action-item-guard";
import { registerUnibotAdkSessionAction } from "@/src/features/adk-chat/unibot-adk-session-actions";
import {
  buildAdkLinkedInStateDelta,
  mapLinkedInSessionProfileToSnapshot,
  mapSnapshotToLinkedInSessionProfile,
} from "@/src/features/linkedin/api/adk-mappers";
import { LINKEDIN_ADK_PROFILE_KEY } from "@/src/features/linkedin/constants";
import { linkedinAnalysisQueryKey } from "@/src/features/linkedin/hooks/useLinkedInAnalysis";
import type { LinkedInAnalysisSnapshot } from "@/src/features/linkedin/types";
import {
  buildAtsGateAwaitingHint,
  buildAtsGateSnapshot,
  createAtsFixBatchCoordinator,
  markAtsFixBatchFocusOverride,
  waitForAtsGateTopicSettled,
  type AtsFixBatchCoordinator,
} from "@/src/features/resume/api/ats-fix-batch-ui";
import {
  buildResumeImproveAgentMessage,
  buildResumeImproveDisplayMessage,
  resumeImproveUserDisplayText,
} from "@/src/features/resume/api/resume-improve-prompts";
import {
  getFollowUpStreamActivityLabel,
  streamActivityLabelForMessage,
  useStreamingStatusLabel,
  useUnibotStreamActivityLabel,
} from "@/src/hooks/useUnibotStreamActivityLabel";
import { growTextareaToFit, resetTextareaHeight } from "@/utils/textarea-autosize";
import { useQueryClient } from "@tanstack/react-query";
import {
  Send,
  Loader2,
  Minimize2,
  Maximize2,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  History,
  Plus,
  Search,
  Trash2,
  X,
  Check,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { AssetActionMeta, ChatMessage } from "../types";
import Logo from "./Logo";
import UnimadUMark from "./UnimadUMark";
import { useAdkChatContext } from "./chat/AdkChatProvider";
import { ContentGenDraftReviewChips } from "./chat/ContentGenDraftReviewChips";
import { ContentGenTopicChips } from "./chat/ContentGenTopicChips";
import { FormattedAgentMessage } from "./chat/FormattedAgentMessage";
import { SubThreadGoToAssetLink } from "./chat/SubThreadGoToAssetLink";
import { UnibotActionItemHighlight } from "./chat/UnibotActionItemHighlight";
import { UnibotErrorBubble } from "./chat/UnibotErrorBubble";
import { UnibotJobCardStrip } from "./chat/UnibotJobCardStrip";
import { UnibotLinkedInSuggestionCards } from "./chat/UnibotLinkedInSuggestionCards";
import { UnibotEditableUserBubble, UnibotUserMessageToolbar } from "./chat/UnibotUserMessageToolbar";
import { UnimadNavigationChip } from "./chat/UnimadNavigationChip";
import {
  applicationAssetImproveTopicTitle,
  applicationAssetTopicSubtitle,
  applicationAssetTopicTitle,
  buildApplicationAssetDraftBootstrap,
  resolveApplicationAssetTopicDisplaySubtitle,
} from "./chat/application-asset-topic";
import {
  buildContentGenDraftBootstrap,
  buildContentGenImproveBootstrap,
  buildContentGenTopicBootstrap,
  buildContentGenTopicUserDisplay,
  contentGenTopicUserDisplayText,
  isContentGenDraftSubThread,
  resolveFunnelForPlannerModelMessage,
} from "./chat/content-gen-topic";
import { resetAssistantTurnForRetryInTree } from "./chat/set-chat-message-stream-error";
import {
  type UnibotIncomingRequest,
  type UnibotResumeSection,
  incomingRequestSignature,
  UNIBOT_SECTION_REVIEW_PROMPTS,
} from "./chat/unibot-incoming-request";
import RefineActionCard from "./studio/RefineActionCard";

interface ChatSidebarProps {
  incomingRequest?: UnibotIncomingRequest | null;
  onRequestHandled?: () => void;
  /** Coach viewing student profile — history only, no send/delete/edit. */
  coachActAsReadOnly?: boolean;
}

const SIDEBAR_WIDTH_MAX_PCT = 0.3;
const SIDEBAR_WIDTH_COLLAPSE_PCT = 0.1;
const SIDEBAR_DEFAULT_WIDTH_PX = 280;
const LS_SIDEBAR_WIDTH = "unibot-sidebar-width";
const LS_SIDEBAR_COLLAPSED = "unibot-sidebar-collapsed";

function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function chatMessagesScrollFingerprint(messages: ChatMessage[]): string {
  const lines: string[] = [];
  for (const m of messages) {
    lines.push(`${m.id}|${m.role}|${m.text ?? ""}|${m.isError ? 1 : 0}`);
    for (const sub of m.messages ?? []) {
      lines.push(`>${sub.id}|${sub.role}|${sub.text ?? ""}|${sub.isError ? 1 : 0}`);
    }
  }
  return lines.join("\n");
}

type AdkReviewCardLike = {
  id: string;
  bannerTitle: string;
};

function AdkReviewCardBlock({
  card,
  isActive,
  adkReviewBusy,
  sessionReady,
  onAccept,
  onDiscard,
  hideActions = false,
  actionsOutOfContext = false,
  onBlockedAction,
}: {
  card: AdkReviewCardLike;
  isActive: boolean;
  adkReviewBusy: boolean;
  sessionReady: boolean;
  onAccept: () => void;
  onDiscard: () => void;
  hideActions?: boolean;
  actionsOutOfContext?: boolean;
  onBlockedAction?: () => void;
}) {
  const actionsDisabled = adkReviewBusy || !sessionReady || actionsOutOfContext;
  const runAction = (action: () => void) => {
    if (actionsOutOfContext) {
      onBlockedAction?.();
      return;
    }
    if (actionsDisabled) return;
    action();
  };

  return (
    <div
      className={`mt-2 w-full max-w-[95%] rounded-xl border px-3 py-2.5 shadow-sm transition-opacity ${
        isActive
          ? "border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-[#141414]"
          : "border-slate-100 bg-slate-50/70 opacity-70 dark:border-white/5 dark:bg-[#121212]"
      }`}
    >
      <p className="text-[12px] font-semibold text-slate-800 dark:text-slate-100">{card.bannerTitle}</p>
      {isActive ? (
        hideActions ? null : (
          <div className="mt-2.5 flex flex-nowrap items-center gap-2">
            <button
              type="button"
              disabled={actionsDisabled}
              onClick={() => runAction(onAccept)}
              className="inline-flex shrink-0 items-center justify-center rounded-lg bg-emerald-600 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="inline-flex items-center gap-1.5">
                {adkReviewBusy ? <Loader2 size={14} className="animate-spin" /> : null}
                Accept
              </span>
            </button>
            <button
              type="button"
              disabled={actionsDisabled}
              onClick={() => runAction(onDiscard)}
              className="inline-flex shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Discard
            </button>
          </div>
        )
      ) : (
        <p className="mt-1.5 text-[11px] leading-snug text-slate-500 dark:text-slate-400">
          Replaced by a newer edit. Use the latest review below to accept or discard.
        </p>
      )}
    </div>
  );
}

function ResolvedReviewDecisionStatus({
  messageId,
  reviewDecisions,
  hasPendingReview,
}: {
  messageId: string;
  reviewDecisions: ReviewDecisionsMap;
  hasPendingReview: boolean;
}) {
  const decision = reviewDecisions[messageId];
  const [visible, setVisible] = useState(false);
  const mountedRef = useRef(false);
  const prevDecisionRef = useRef<ReviewDecision | undefined>(undefined);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      prevDecisionRef.current = decision;
      return;
    }
    /* eslint-disable react-hooks/set-state-in-effect -- flash review decision chip when status changes */
    if (hasPendingReview || !decision) {
      setVisible(false);
      prevDecisionRef.current = decision;
      return;
    }
    if (prevDecisionRef.current !== decision) {
      prevDecisionRef.current = decision;
      setVisible(true);
      const timer = window.setTimeout(() => setVisible(false), 2200);
      return () => window.clearTimeout(timer);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [decision, hasPendingReview, messageId]);

  if (!visible || !decision) {
    return null;
  }
  return (
    <div className="mt-0.5 flex w-full max-w-[95%] justify-end pe-0.5">
      <AdkDraftReviewDecisionStatus decision={decision} />
    </div>
  );
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ incomingRequest, onRequestHandled, coachActAsReadOnly = false }) => {
  const {
    messages,
    setMessages,
    sendMainMessage,
    sendTopicMessage,
    isAgentLoading,
    isSyncingContext,
    streamActivityLabel,
    sessionReady,
    userId,
    sessionId,
    sessions,
    isLoadingHistory,
    sessionError,
    isBootstrappingSession,
    handleSessionSwitch,
    handleCreateNewSession,
    handleDeleteSession,
    refreshSessions,
    streamError,
    clearStreamError,
    setStreamError,
    rewindToMessage,
    isRewinding,
  } = useAdkChatContext();
  const liveStreamActivity = useUnibotStreamActivityLabel();
  const streamingStatusLabel = useStreamingStatusLabel({
    isAgentLoading,
    isSyncingContext,
    streamActivityLabel,
  });

  const [editingUserMessage, setEditingUserMessage] = useState<{
    messageKey: string;
    messageId: string;
    invocationId: string;
    targetSessionId: string;
    topicId?: string;
    draftText: string;
    previewText: string;
    scopeMatch: ScopeMatch;
    messageScope?: ContentScope;
    assetActionMeta?: AssetActionMeta;
  } | null>(null);

  type UserMessageRewindContext = {
    invocationId: string;
    previewText: string;
    targetSessionId: string;
    topicId?: string;
    scopeMatch: ScopeMatch;
    messageScope?: ContentScope;
  };

  type PendingRewindConfirm =
    | {
        mode: "delete";
        ctx: UserMessageRewindContext;
      }
    | {
        mode: "edit";
        ctx: UserMessageRewindContext;
        editDraftText: string;
        assetActionMeta?: AssetActionMeta;
      };

  const [pendingRewindConfirm, setPendingRewindConfirm] = useState<PendingRewindConfirm | null>(null);
  const pendingRewindConfirmRef = useRef<PendingRewindConfirm | null>(null);

  const [input, setInput] = useState("");
  const mainInputRef = useRef<HTMLTextAreaElement>(null);
  const topicInputRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const footerInputCardRef = useRef<HTMLDivElement>(null);
  const sidebarWidthRef = useRef(SIDEBAR_DEFAULT_WIDTH_PX);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT_WIDTH_PX);
  const [isResizing, setIsResizing] = useState(false);
  const canRewind = sessionReady && !isAgentLoading && !isLoadingHistory && !isRewinding;
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeResumeId = useActiveResumeIdForPatch(searchParams);
  void activeResumeId; // subscribe to replaceState ?id= updates for review nav checks below

  const deriveCurrentScope = useCallback(
    (targetSessionId: string, sessionKind: "main" | "sub" = "main"): ContentScope =>
      deriveActiveScope({
        pathname,
        searchParams,
        resumeId: activeResumeId ?? undefined,
        sessionId: targetSessionId,
        sessionKind,
        applicationAsset: {
          assetId: useApplicationAssetStudioStore.getState().assetId,
          role: useApplicationAssetStudioStore.getState().role,
          company: useApplicationAssetStudioStore.getState().company,
        },
        contentGen: {
          assetId: useContentGenStudioStore.getState().assetId,
          topic: useContentGenStudioStore.getState().topic,
        },
      }),
    [pathname, searchParams, activeResumeId]
  );

  const isReviewNavActive = useCallback(
    (target: SubThreadNavTarget) => isSubThreadNavTargetActive(target, pathname, searchParams),
    [pathname, searchParams]
  );

  useSyncUnibotUiToRoute({
    pathname,
    searchParams,
    sessionId,
    setMessages,
  });

  useEffect(() => {
    const onDraftSynced = (e: Event) => {
      const draft = (e as CustomEvent<{ draft?: string }>).detail?.draft;
      if (draft?.trim()) {
        dismissSyncedContentGenReviews(draft);
      }
    };
    const onPublishComplete = () => {
      const draft = useContentGenStudioStore.getState().draftPreview;
      if (draft.trim()) {
        dismissSyncedContentGenReviews(draft);
      }
    };
    window.addEventListener(CONTENT_GEN_EVENTS.draftReady, onDraftSynced);
    window.addEventListener(CONTENT_GEN_EVENTS.publishComplete, onPublishComplete);
    return () => {
      window.removeEventListener(CONTENT_GEN_EVENTS.draftReady, onDraftSynced);
      window.removeEventListener(CONTENT_GEN_EVENTS.publishComplete, onPublishComplete);
    };
  }, []);

  const buildUserMessageRewindContext = useCallback(
    (message: ChatMessage, targetSessionId: string, topicId?: string) => {
      if (!message.invocationId || !canRewind) return null;
      const targetRow = getRegistryRow(targetSessionId);
      const messageScope =
        targetRow?.kind === "sub"
          ? deriveScopeFromRegistryRow(targetRow)
          : (message.contentScope ??
            (targetRow
              ? deriveScopeFromRegistryRow(targetRow)
              : deriveScopeFromTopicKind({
                  topicKind: topicId ? messages.find(m => m.id === topicId)?.topicKind : undefined,
                  subSessionAdkId: targetSessionId,
                })));
      const activeScope = deriveCurrentScope(targetSessionId, targetRow?.kind ?? "main");
      const scopeMatch = messageScope ? scopesMatch(activeScope, messageScope) : "full";
      return {
        invocationId: message.invocationId,
        previewText: message.text,
        targetSessionId,
        topicId,
        scopeMatch,
        messageScope: messageScope ?? undefined,
      };
    },
    [canRewind, deriveCurrentScope, messages]
  );

  const runUserMessageRewind = useCallback(
    async (ctx: UserMessageRewindContext, options: { revertEditorState: boolean }) => {
      await rewindToMessage({
        invocationId: ctx.invocationId,
        previewText: ctx.previewText,
        revertEditorState: options.revertEditorState,
        targetSessionId: ctx.targetSessionId,
        topicId: ctx.topicId,
        targetScope: ctx.messageScope,
        scopeMatch: ctx.scopeMatch,
      });
    },
    [rewindToMessage]
  );

  const openRewindConfirm = useCallback((payload: PendingRewindConfirm) => {
    pendingRewindConfirmRef.current = payload;
    setPendingRewindConfirm(payload);
  }, []);

  const closeRewindConfirm = useCallback(() => {
    pendingRewindConfirmRef.current = null;
    setPendingRewindConfirm(null);
  }, []);

  const handleDeleteUserMessage = useCallback(
    (message: ChatMessage, targetSessionId: string, topicId?: string) => {
      const ctx = buildUserMessageRewindContext(message, targetSessionId, topicId);
      if (!ctx) return;
      const messageKey = `${topicId ?? "main"}:${message.id}`;
      setEditingUserMessage(prev => (prev?.messageKey === messageKey ? null : prev));
      openRewindConfirm({ mode: "delete", ctx });
    },
    [buildUserMessageRewindContext, openRewindConfirm]
  );

  const handleSubmitEditedUserMessage = useCallback(() => {
    const edit = editingUserMessage;
    if (!edit) return;
    const trimmed = edit.draftText.trim();
    if (!trimmed) return;
    openRewindConfirm({
      mode: "edit",
      ctx: {
        invocationId: edit.invocationId,
        previewText: edit.previewText,
        targetSessionId: edit.targetSessionId,
        topicId: edit.topicId,
        scopeMatch: edit.scopeMatch,
        messageScope: edit.messageScope,
      },
      editDraftText: trimmed,
      assetActionMeta: edit.assetActionMeta,
    });
  }, [editingUserMessage, openRewindConfirm]);

  const handleStartEditUserMessage = useCallback(
    (message: ChatMessage, targetSessionId: string, topicId: string | undefined, editText: string) => {
      if (message.assetActionMeta) {
        return;
      }
      const ctx = buildUserMessageRewindContext(message, targetSessionId, topicId);
      if (!ctx) return;
      setEditingUserMessage({
        messageKey: `${topicId ?? "main"}:${message.id}`,
        messageId: message.id,
        invocationId: ctx.invocationId,
        targetSessionId: ctx.targetSessionId,
        topicId: ctx.topicId,
        draftText: editText,
        previewText: ctx.previewText,
        scopeMatch: ctx.scopeMatch,
        messageScope: ctx.messageScope,
        assetActionMeta: message.assetActionMeta,
      });
    },
    [buildUserMessageRewindContext]
  );

  const [historyPanelOpen, setHistoryPanelOpen] = useState(false);
  const [historySearchQuery, setHistorySearchQuery] = useState("");
  const [allChatsOpen, setAllChatsOpen] = useState(true);
  const [pendingDeleteSession, setPendingDeleteSession] = useState<
    { kind: "main"; id: string; title: string } | { kind: "sub"; topicId: string; title: string; subAdkSessionId?: string } | null
  >(null);
  const [isDeletingSession, setIsDeletingSession] = useState(false);
  const [topicInputs, setTopicInputs] = useState<{ [key: string]: string }>({});
  const [improveReplyTopicId, setImproveReplyTopicId] = useState<string | null>(null);
  const lastIncomingSigRef = useRef<string | null>(null);
  const pendingRetryRef = useRef<{ text: string; topicId?: string; botMsgId?: string } | null>(null);
  const contentGenFunnelRef = useRef<ContentGenFunnel | null>(null);
  const syncContentGenFunnel = useCallback((funnel: ContentGenFunnel) => {
    contentGenFunnelRef.current = funnel;
    useContentGenStudioStore.getState().syncFromStudio({ funnel });
  }, []);
  /** Per assistant message id — affirmation/topic chip labels already used (hide from UI). */
  const contentGenDismissedChipsRef = useRef<Set<string>>(new Set());
  const actionItemNudgeShownRef = useRef<Set<string>>(new Set());
  const topicPickerWandSpamCountRef = useRef<Map<string, number>>(new Map());
  const [highlightedActionItem, setHighlightedActionItem] = useState<UnibotActionHighlightTarget | null>(null);
  const [highlightedGoToHref, setHighlightedGoToHref] = useState<string | null>(null);
  const nudgeGoToFeature = useCallback((href: string) => {
    setHighlightedGoToHref(href);
    window.setTimeout(() => {
      setHighlightedGoToHref(prev => (prev === href ? null : prev));
    }, 2200);
  }, []);
  const contentGenAppliedTopicRef = useRef<string | null>(null);
  const contentGenAdkDraftJobRef = useRef<{
    topicId: string;
    botMsgId: string;
    topic: string;
    funnel: ContentGenFunnel | null;
  } | null>(null);
  const applicationAssetAdkDraftJobRef = useRef<{
    topicId: string;
    botMsgId: string;
    assetType: ApplicationAssetApiType;
    assetId?: string;
  } | null>(null);
  const prevAgentLoadingRef = useRef(isAgentLoading);
  const prevIsLoadingHistoryRef = useRef(isLoadingHistory);
  const contentGenLastSyncedBotIdRef = useRef<string | null>(null);
  const applicationAssetLastSyncedBotIdRef = useRef<string | null>(null);
  const contentGenAcceptedBotMsgIdRef = useRef<string | null>(null);
  const [isContentGenPublishing, setIsContentGenPublishing] = useState(false);
  const [contentGenPublishActivity, setContentGenPublishActivity] = useState<Record<string, string>>({});
  const contentGenOpenDraftInFlightRef = useRef<string | null>(null);
  const queryClient = useQueryClient();

  const adkReviewStack = useAdkResumeReviewStore(s => s.reviewStack);
  const adkActiveReviewId = useAdkResumeReviewStore(s => s.reviewStack.at(-1)?.id ?? null);
  const adkPortfolioReviewStack = useAdkPortfolioReviewStore(s => s.reviewStack);
  const adkPortfolioActiveReviewId = useAdkPortfolioReviewStore(s => s.reviewStack.at(-1)?.id ?? null);
  const adkLinkedInReviewStack = useAdkLinkedInReviewStore(s => s.reviewStack);
  const adkLinkedInActiveReviewId = useAdkLinkedInReviewStore(s => s.reviewStack.at(-1)?.id ?? null);
  const adkContentGenReviewStack = useAdkContentGenReviewStore(s => s.reviewStack);
  const adkContentGenActiveReviewId = useAdkContentGenReviewStore(s => s.reviewStack.at(-1)?.id ?? null);
  const adkApplicationAssetReviewStack = useAdkApplicationAssetReviewStore(s => s.reviewStack);
  const adkApplicationAssetActiveReviewId = useAdkApplicationAssetReviewStore(s => s.reviewStack.at(-1)?.id ?? null);
  const reviewMainSessionId = useMemo(() => {
    if (!sessionId) return "";
    const row = getRegistryRow(sessionId);
    if (row?.kind === "sub" && row.parent_adk_session_id) {
      return row.parent_adk_session_id;
    }
    return sessionId;
  }, [sessionId]);
  const reviewDecisions = useReviewDecisions(userId, reviewMainSessionId);

  const [adkReviewBusy, setAdkReviewBusy] = useState(false);
  const {
    adkReviewBusy: applicationAssetReviewBusy,
    acceptApplicationAssetReview,
    discardApplicationAssetReview,
  } = useApplicationAssetReviewActions({ userId, mainSessionId: reviewMainSessionId });
  const diffReviewUiActive = useApplicationAssetDiffReviewUiStore(s => Boolean(s.sessionId && s.regionIds.length > 0));
  const [selectionQuoteContext, setSelectionQuoteContext] = useState<{
    assetType: ApplicationAssetApiType;
    selectedText: string;
  } | null>(null);
  const [fullDocumentImproveContext, setFullDocumentImproveContext] = useState<{
    assetType: ApplicationAssetApiType;
    assetId: string;
    role: string;
    company: string;
  } | null>(null);
  const [resumeFullImproveContext, setResumeFullImproveContext] = useState<{
    resumeId: string;
    role: string;
    company: string;
  } | null>(null);
  const [selectionSentPill, setSelectionSentPill] = useState<string | null>(null);
  const selectionSentPillTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [documentImprovePool, setDocumentImprovePool] = useState<FullDocumentImprovePreset[]>([]);
  const [usedDocumentImproveIds, setUsedDocumentImproveIds] = useState<Set<string>>(() => new Set());
  const [documentImproveSuggestionsLoading, setDocumentImproveSuggestionsLoading] = useState(false);
  const documentImproveFetchKeyRef = useRef<string | null>(null);
  const seededTitlePromptByMainIdRef = useRef<Record<string, string>>({});
  const atsFixBatchRef = useRef<AtsFixBatchCoordinator | null>(null);
  const atsFixBatchAbortRef = useRef<AbortController | null>(null);
  const [atsFixBatchUi, setAtsFixBatchUi] = useState<AtsFixBatchCoordinator | null>(null);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const isAgentLoadingRef = useRef(isAgentLoading);
  isAgentLoadingRef.current = isAgentLoading;
  const syncAtsFixBatchUi = useCallback(() => {
    setAtsFixBatchUi(atsFixBatchRef.current ? { ...atsFixBatchRef.current } : null);
  }, []);

  const isResumePrepareImproveRoute = useMemo(() => {
    if (!pathname.startsWith("/uniboard/resume")) return false;
    return searchParams?.get("improve") === "1" && Boolean(searchParams?.get("jobId")?.trim());
  }, [pathname, searchParams]);

  const isStudioPrepareImproveRoute = useMemo(() => {
    if (!pathname.startsWith("/uniboard/studio")) return false;
    const type = searchParams?.get("type");
    if (type !== "cover-letter" && type !== "cold-email") return false;
    return searchParams?.get("improve") === "1" && Boolean(searchParams?.get("jobId")?.trim());
  }, [pathname, searchParams]);

  const showPrepareImproveFooter = Boolean(
    (resumeFullImproveContext && isResumePrepareImproveRoute) || (fullDocumentImproveContext && isStudioPrepareImproveRoute)
  );

  useEffect(() => {
    if (resumeFullImproveContext && !isResumePrepareImproveRoute) {
      setResumeFullImproveContext(null);
    }
    if (fullDocumentImproveContext && !isStudioPrepareImproveRoute) {
      setFullDocumentImproveContext(null);
      setUsedDocumentImproveIds(new Set());
      setDocumentImprovePool([]);
      documentImproveFetchKeyRef.current = null;
    }
  }, [fullDocumentImproveContext, isResumePrepareImproveRoute, isStudioPrepareImproveRoute, resumeFullImproveContext]);

  useEffect(() => {
    sidebarWidthRef.current = sidebarWidth;
  }, [sidebarWidth]);

  useEffect(() => {
    try {
      const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
      const maxPx = vw * SIDEBAR_WIDTH_MAX_PCT;
      const collapsePx = vw * SIDEBAR_WIDTH_COLLAPSE_PCT;
      let clamped = SIDEBAR_DEFAULT_WIDTH_PX;
      const raw = localStorage.getItem(LS_SIDEBAR_WIDTH);
      if (raw) {
        const w = parseInt(raw, 10);
        if (!Number.isNaN(w)) clamped = w < collapsePx ? SIDEBAR_DEFAULT_WIDTH_PX : Math.min(maxPx, w);
      }
      setSidebarWidth(clamped);
      sidebarWidthRef.current = clamped;
      if (localStorage.getItem(LS_SIDEBAR_COLLAPSED) === "1") setIsCollapsed(true);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const onResize = () => {
      if (isCollapsed) return;
      setSidebarWidth(w => {
        const maxPx = window.innerWidth * SIDEBAR_WIDTH_MAX_PCT;
        const next = Math.min(w, maxPx);
        sidebarWidthRef.current = next;
        return next;
      });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [isCollapsed]);

  const skipInitialCollapsePersist = useRef(true);
  useEffect(() => {
    if (skipInitialCollapsePersist.current) {
      skipInitialCollapsePersist.current = false;
      return;
    }
    try {
      localStorage.setItem(LS_SIDEBAR_COLLAPSED, isCollapsed ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [isCollapsed]);

  const skipInitialWidthPersist = useRef(true);
  useEffect(() => {
    if (skipInitialWidthPersist.current) {
      skipInitialWidthPersist.current = false;
      return;
    }
    if (isCollapsed) return;
    try {
      localStorage.setItem(LS_SIDEBAR_WIDTH, String(sidebarWidth));
    } catch {
      /* ignore */
    }
  }, [sidebarWidth, isCollapsed]);

  const applyAssistantError = useCallback(
    (
      formatted: FormattedUnibotStreamError,
      target: { scope: "main"; botMsgId?: string } | { scope: "topic"; topicId: string; botMsgId: string }
    ) => {
      if (target.scope === "main") {
        setMessages(prev => {
          if (target.botMsgId) {
            const idx = prev.findIndex(m => m.id === target.botMsgId && m.role === "model" && !m.isTopic);
            if (idx >= 0) {
              const next = [...prev];
              next[idx] = {
                ...next[idx],
                text: formatted.message,
                isError: true,
                errorKind: formatted.kind,
              };
              return next;
            }
          }
          for (let i = prev.length - 1; i >= 0; i--) {
            const m = prev[i];
            if (m.role === "model" && !m.isTopic) {
              const next = [...prev];
              next[i] = {
                ...m,
                text: formatted.message,
                isError: true,
                errorKind: formatted.kind,
              };
              return next;
            }
          }
          return prev;
        });
        return;
      }
      setMessages(prev =>
        prev.map(msg => {
          if (msg.id !== target.topicId || !msg.isTopic) return msg;
          const updated = (msg.messages || []).map(sub =>
            sub.id === target.botMsgId ? { ...sub, text: formatted.message, isError: true, errorKind: formatted.kind } : sub
          );
          return { ...msg, messages: updated };
        })
      );
    },
    [setMessages]
  );

  const handleStreamFailure = useCallback(
    (err: unknown, ctx: { text: string; topicId?: string; botMsgId?: string }) => {
      cancelOptimisticUnibotActivity();
      const formatted = formatUnibotStreamError(err, {
        scope: ctx.topicId ? "topic" : "main",
        topicId: ctx.topicId,
        botMsgId: ctx.botMsgId,
      });
      pendingRetryRef.current = { text: ctx.text, topicId: ctx.topicId, botMsgId: ctx.botMsgId };
      if (ctx.topicId && ctx.botMsgId) {
        applyAssistantError(formatted, { scope: "topic", topicId: ctx.topicId, botMsgId: ctx.botMsgId });
      } else {
        applyAssistantError(formatted, { scope: "main", botMsgId: ctx.botMsgId });
      }
      setStreamError(formatted);
    },
    [applyAssistantError, setStreamError]
  );

  const tryOfferApplicationAssetDraftReview = useCallback(
    (
      botMessage: string,
      assistantMessageId: string,
      assetTypeOverride?: ApplicationAssetApiType,
      threadMessages?: ChatMessage[],
      proposedDraftOverride?: string
    ) => {
      const studio = useApplicationAssetStudioStore.getState();
      const offered = offerApplicationAssetDraftReview({
        botMessage,
        assistantMessageId,
        pathname,
        assetTypeOverride: assetTypeOverride ?? studio.assetType ?? undefined,
        threadMessages,
        userId,
        sessionId: reviewMainSessionId,
        proposedDraftOverride,
        forceStudioPreview: proposedDraftOverride ? true : undefined,
      });
      if (offered) {
        applicationAssetLastSyncedBotIdRef.current = assistantMessageId;
      }
      return offered;
    },
    [pathname, userId, reviewMainSessionId]
  );

  const applicationAssetTurnAlreadySatisfied = useCallback((assistantMessageId: string): boolean => {
    if (applicationAssetLastSyncedBotIdRef.current === assistantMessageId) {
      return true;
    }
    const reviewCard = useAdkApplicationAssetReviewStore.getState().getActiveCard();
    return reviewCard?.assistantMessageId === assistantMessageId;
  }, []);

  const tryOfferApplicationAssetDraftWithSessionFallback = useCallback(
    async (params: {
      botMessage: string;
      assistantMessageId: string;
      assetTypeOverride?: ApplicationAssetApiType;
      threadMessages?: ChatMessage[];
      subSessionAdkId?: string | null;
    }): Promise<boolean> => {
      if (applicationAssetTurnAlreadySatisfied(params.assistantMessageId)) {
        return true;
      }

      let offered = tryOfferApplicationAssetDraftReview(
        params.botMessage,
        params.assistantMessageId,
        params.assetTypeOverride,
        params.threadMessages
      );
      if (offered) {
        return true;
      }

      const subAdkId = params.subSessionAdkId?.trim();
      if (!userId || !subAdkId) {
        return false;
      }

      const pulled = await pullSessionStateAction(userId, subAdkId, resolveAdkSessionOptionsForSessionId(subAdkId));
      const sessionDraft = pulled.success && pulled.state ? extractApplicationAssetDraftFromSessionState(pulled.state).trim() : "";
      if (!sessionDraft) {
        return false;
      }

      offered = tryOfferApplicationAssetDraftReview(
        params.botMessage,
        params.assistantMessageId,
        params.assetTypeOverride,
        params.threadMessages,
        sessionDraft
      );
      if (offered) {
        return true;
      }

      if (useApplicationAssetStudioStore.getState().draftPreview.trim().length >= APPLICATION_ASSET_MIN_DRAFT_CHARS) {
        window.dispatchEvent(new CustomEvent(APPLICATION_ASSET_EVENTS.draftStreamComplete));
        return true;
      }

      return applicationAssetTurnAlreadySatisfied(params.assistantMessageId);
    },
    [applicationAssetTurnAlreadySatisfied, tryOfferApplicationAssetDraftReview, userId]
  );

  const tryOfferContentGenDraftReview = useCallback(
    (
      botMessage: string,
      assistantMessageId: string,
      topicOverride?: string,
      threadMessages?: ChatMessage[],
      proposedDraftOverride?: string
    ) => {
      const studio = useContentGenStudioStore.getState();
      const offered = offerContentGenDraftReview({
        botMessage,
        assistantMessageId,
        pathname,
        topicOverride,
        proposedDraftOverride,
        appliedTopicRef: contentGenAppliedTopicRef.current,
        funnelOverride: contentGenFunnelRef.current ?? studio.funnel,
        threadMessages,
        userId,
        sessionId: reviewMainSessionId,
      });
      if (offered) {
        const card = useAdkContentGenReviewStore.getState().getActiveCard();
        if (card?.topic && isValidContentGenTopicTitle(card.topic)) {
          contentGenAppliedTopicRef.current = card.topic;
        }
        contentGenLastSyncedBotIdRef.current = assistantMessageId;
      }
      return offered;
    },
    [pathname, userId, reviewMainSessionId]
  );

  const attemptContentGenDjangoFallback = useCallback(async (topic: string, funnel: ContentGenFunnel | null) => {
    try {
      await runDjangoContentGenDraftFallback(topic, funnel);
    } catch (err) {
      window.dispatchEvent(
        new CustomEvent(CONTENT_GEN_EVENTS.draftFailed, {
          detail: {
            message: err instanceof Error ? err.message : "Draft generation failed. Please try again.",
          },
        })
      );
    }
  }, []);

  useEffect(() => {
    const onOpenDraft = (e: Event) => {
      const d = (e as CustomEvent<{ topic?: string; funnel?: ContentGenFunnel; mood?: string; assetId?: string | null }>).detail;
      const topic = d?.topic?.trim();
      if (!topic || !userId || !sessionReady) {
        return;
      }
      const assetId = d?.assetId?.trim() || useContentGenStudioStore.getState().assetId?.trim() || null;
      const mainId = reviewMainSessionId || sessionId;
      const draftKey = `${mainId}:${assetId ?? `topic:${topic}`}`;
      if (contentGenOpenDraftInFlightRef.current === draftKey) {
        return;
      }
      contentGenOpenDraftInFlightRef.current = draftKey;

      contentGenFunnelRef.current = d.funnel ?? null;
      if (d.mood?.trim()) {
        useContentGenStudioStore.getState().syncFromStudio({ mood: d.mood.trim() });
      }
      setIsCollapsed(false);

      void (async () => {
        let topicId = "";
        let botMsgId = "";
        let initialUserText = "";
        try {
          if (isAgentLoading || isLoadingHistory) {
            return;
          }
          const funnel = d.funnel ?? contentGenFunnelRef.current ?? useContentGenStudioStore.getState().funnel;
          const sub = await ensureContentGenTopicSubSession({
            userId,
            mainAdkSessionId: mainId,
            mode: "draft",
            topic,
            assetId,
            title: buildLinkedInPostTitle(topic),
          });
          if (!sub?.subAdkSessionId) {
            throw new Error("Could not open a draft thread for this topic.");
          }

          topicId = sub.stableTopicId;
          const subAdkId = sub.subAdkSessionId;
          const bootstrap = buildContentGenDraftBootstrap(topic);
          initialUserText = bootstrap;
          const initialUserMsg: ChatMessage = {
            id: newId("u"),
            role: "user",
            text: bootstrap,
            timestamp: new Date(),
            contentScope: deriveCurrentScope(mainId),
          };
          botMsgId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : newId("bot");
          ensureOptimisticUnibotActivity({ assistantMessageId: botMsgId });
          const placeholderMsg: ChatMessage = {
            id: botMsgId,
            role: "model",
            text: "",
            timestamp: new Date(),
          };

          setMessages(prev => {
            const existing = findImproveTopic(prev, subAdkId) ?? prev.find(m => m.isTopic && m.id === topicId);
            if (existing) {
              return prev.map(m =>
                m.id === existing.id
                  ? {
                      ...m,
                      isExpanded: true,
                      subSessionAdkId: subAdkId,
                      topicTitle: sub.title,
                      messages: [...(m.messages ?? []), initialUserMsg, placeholderMsg],
                    }
                  : m
              );
            }
            const newTopic: ChatMessage = {
              id: topicId,
              role: "model",
              text: "",
              timestamp: new Date(),
              isTopic: true,
              topicKind: "content_gen",
              topicTitle: sub.title,
              isExpanded: true,
              subSessionAdkId: subAdkId,
              messages: [initialUserMsg, placeholderMsg],
            };
            return insertTopicInMainThread(prev, newTopic);
          });

          contentGenAdkDraftJobRef.current = {
            topicId,
            botMsgId,
            topic,
            funnel: funnel ?? null,
          };

          try {
            const shell = await createContentGenShell(topic, { funnel: funnel ?? undefined, mood: d.mood });
            window.dispatchEvent(
              new CustomEvent(CONTENT_GEN_EVENTS.applyTopic, {
                detail: { topic, funnel: funnel ?? undefined, assetId: shell.id },
              })
            );
          } catch (shellErr) {
            console.warn("Content gen topic shell create failed (draft may still preview in Studio):", shellErr);
          }

          await sendTopicMessage(initialUserText, botMsgId, {
            sessionIdOverride: subAdkId,
          });
        } catch (err) {
          const job = contentGenAdkDraftJobRef.current;
          contentGenAdkDraftJobRef.current = null;
          handleStreamFailure(err, { text: initialUserText, topicId, botMsgId });
          if (job) {
            void attemptContentGenDjangoFallback(job.topic, job.funnel);
          }
        } finally {
          contentGenOpenDraftInFlightRef.current = null;
        }
      })();
    };

    window.addEventListener(CONTENT_GEN_EVENTS.openDraft, onOpenDraft);
    return () => window.removeEventListener(CONTENT_GEN_EVENTS.openDraft, onOpenDraft);
  }, [
    attemptContentGenDjangoFallback,
    deriveCurrentScope,
    handleStreamFailure,
    isAgentLoading,
    isLoadingHistory,
    sendTopicMessage,
    sessionReady,
    setMessages,
    reviewMainSessionId,
    sessionId,
    userId,
  ]);

  useEffect(() => {
    const onOpenApplicationAssetDraft = (e: Event) => {
      // Chat-only: opens a collapsible ADK topic when the user starts from natural language in Unibot.
      const d = (e as CustomEvent<ApplicationAssetOpenDraftDetail>).detail;
      if (!d?.assetType || !userId || !sessionReady) {
        return;
      }
      setIsCollapsed(false);

      const studioPatch = {
        assetType: d.assetType,
        assetId: d.assetId?.trim() || null,
        applicationId: d.applicationId?.trim() || null,
        role: d.role,
        company: d.company,
        jobDescription: d.jobDescription,
        contactName: d.contactName ?? "",
        ...(d.preserveExistingDraft
          ? {}
          : {
              draftPreview: "",
              acceptedContent: "",
            }),
      };
      useApplicationAssetStudioStore.getState().syncFromStudio(studioPatch);
      if (d.regenerateAnother) {
        useApplicationAssetStudioStore.getState().setRegenerateAnotherInFlight(true);
      }

      void (async () => {
        try {
          if (isAgentLoading || isLoadingHistory) {
            return;
          }
          const mainId = reviewMainSessionId || sessionId;
          const topicTitle = applicationAssetTopicTitle(d.assetType, d.company, d.role, d.assetId);
          const sub = await ensureApplicationAssetTopicSubSession({
            userId,
            mainAdkSessionId: mainId,
            assetType: d.assetType,
            role: d.role,
            company: d.company,
            assetId: d.assetId,
            title: topicTitle,
          });
          if (!sub?.subAdkSessionId) {
            throw new Error("Could not open a draft thread for this application asset.");
          }

          const bootstrap = buildApplicationAssetDraftBootstrap(d.assetType, d.role, d.company, d.jobDescription, d.contactName, {
            regenerateAnother: d.regenerateAnother,
          });
          const existing = findImproveTopic(messages, sub.subAdkSessionId);
          const topicId = sub.stableTopicId;
          const initialUserMsg: ChatMessage = {
            id: newId("u"),
            role: "user",
            text: bootstrap,
            timestamp: new Date(),
            contentScope: deriveCurrentScope(mainId),
          };
          const botMsgId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : newId("bot");
          const placeholderMsg: ChatMessage = {
            id: botMsgId,
            role: "model",
            text: "",
            timestamp: new Date(),
          };

          applicationAssetAdkDraftJobRef.current = {
            topicId,
            botMsgId,
            assetType: d.assetType,
            assetId: d.assetId?.trim() || undefined,
          };

          if (existing) {
            setMessages(prev =>
              prev.map(m =>
                m.id === existing.id
                  ? {
                      ...m,
                      isExpanded: true,
                      subSessionAdkId: sub.subAdkSessionId,
                      topicTitle: sub.title,
                      topicSubtitle: applicationAssetTopicSubtitle(d.company, d.role),
                      messages: [...(m.messages ?? []), initialUserMsg, placeholderMsg],
                    }
                  : m
              )
            );
          } else {
            const newTopic: ChatMessage = {
              id: topicId,
              role: "model",
              text: "",
              timestamp: new Date(),
              isTopic: true,
              topicKind: "application_asset",
              topicTitle: sub.title ?? topicTitle,
              topicSubtitle: applicationAssetTopicSubtitle(d.company, d.role),
              isExpanded: true,
              subSessionAdkId: sub.subAdkSessionId,
              messages: [initialUserMsg, placeholderMsg],
            };
            setMessages(prev => insertTopicInMainThread(prev, newTopic));
          }

          await sendTopicMessage(bootstrap, botMsgId, {
            sessionIdOverride: sub.subAdkSessionId,
          });
        } catch (err) {
          const job = applicationAssetAdkDraftJobRef.current;
          applicationAssetAdkDraftJobRef.current = null;
          useApplicationAssetStudioStore.getState().setRegenerateAnotherInFlight(false);
          handleStreamFailure(err, {
            text: job
              ? buildApplicationAssetDraftBootstrap(d.assetType, d.role, d.company, d.jobDescription, d.contactName, {
                  regenerateAnother: d.regenerateAnother,
                })
              : "",
            topicId: job?.topicId,
          });
        }
      })();
    };

    window.addEventListener(APPLICATION_ASSET_EVENTS.openDraft, onOpenApplicationAssetDraft);
    return () => window.removeEventListener(APPLICATION_ASSET_EVENTS.openDraft, onOpenApplicationAssetDraft);
  }, [
    deriveCurrentScope,
    handleStreamFailure,
    isAgentLoading,
    isLoadingHistory,
    reviewMainSessionId,
    sendTopicMessage,
    sessionId,
    sessionReady,
    setMessages,
    messages,
    userId,
  ]);

  useEffect(() => {
    const wasAgentLoading = prevAgentLoadingRef.current;
    const wasLoadingHistory = prevIsLoadingHistoryRef.current;
    prevAgentLoadingRef.current = isAgentLoading;
    prevIsLoadingHistoryRef.current = isLoadingHistory;

    if (isAgentLoading || isLoadingHistory) {
      return;
    }

    const streamJustCompleted = wasAgentLoading && !isAgentLoading;

    if (!streamJustCompleted) {
      return;
    }

    if (useApplicationAssetStudioStore.getState().selectionRefineLoading) {
      useApplicationAssetStudioStore.getState().setSelectionRefineLoading(false);
    }

    if (userId) {
      for (const card of messages) {
        if (!card.isTopic || !card.subSessionAdkId || !card.messages?.some(m => m.role === "user")) {
          continue;
        }
        void syncTopicUserInvocationIdsFromAdk(userId, card.subSessionAdkId, card.id, setMessages);
      }
    }

    const aaJob = applicationAssetAdkDraftJobRef.current;
    if (aaJob) {
      const topicCard = messages.find(m => m.id === aaJob.topicId && m.topicKind === "application_asset");
      const botMsg = topicCard?.messages?.find(m => m.id === aaJob.botMsgId);
      applicationAssetAdkDraftJobRef.current = null;

      if (applicationAssetTurnAlreadySatisfied(aaJob.botMsgId)) {
        return;
      }

      if (botMsg?.isError) {
        window.dispatchEvent(
          new CustomEvent(APPLICATION_ASSET_EVENTS.draftFailed, {
            detail: { message: "Draft generation failed. Please try again." },
          })
        );
        return;
      }

      void (async () => {
        const offered = await tryOfferApplicationAssetDraftWithSessionFallback({
          botMessage: botMsg?.text ?? "",
          assistantMessageId: aaJob.botMsgId,
          assetTypeOverride: aaJob.assetType,
          threadMessages: topicCard?.messages,
          subSessionAdkId: topicCard?.subSessionAdkId,
        });
        if (!offered) {
          window.dispatchEvent(
            new CustomEvent(APPLICATION_ASSET_EVENTS.draftFailed, {
              detail: { message: "Could not read the generated draft. Please try again." },
            })
          );
        }
      })();
      return;
    }

    const job = contentGenAdkDraftJobRef.current;
    if (job) {
      const topicCard = messages.find(m => m.id === job.topicId && m.topicKind === "content_gen");
      const botMsg = topicCard?.messages?.find(m => m.id === job.botMsgId);
      const subAdkId = topicCard?.subSessionAdkId;
      contentGenAdkDraftJobRef.current = null;

      if (botMsg?.isError || !botMsg?.text?.trim()) {
        void attemptContentGenDjangoFallback(job.topic, job.funnel);
        return;
      }

      void (async () => {
        let offered = tryOfferContentGenDraftReview(botMsg.text, job.botMsgId, job.topic, topicCard?.messages);
        if (!offered && userId && subAdkId) {
          const pulled = await pullSessionStateAction(userId, subAdkId, resolveAdkSessionOptionsForSessionId(subAdkId));
          const sessionDraft = pulled.success && pulled.state ? extractContentGenDraftFromAdkState(pulled.state) : null;
          if (sessionDraft?.draft) {
            offered = tryOfferContentGenDraftReview(
              botMsg.text,
              job.botMsgId,
              sessionDraft.topic || job.topic,
              topicCard?.messages,
              sessionDraft.draft
            );
          }
        }
        if (!offered) {
          if (shouldForceDjangoContentGenDraft()) {
            void attemptContentGenDjangoFallback(job.topic, job.funnel);
            return;
          }
          window.dispatchEvent(
            new CustomEvent(CONTENT_GEN_EVENTS.draftFailed, {
              detail: { message: "Could not read the generated draft. Please try again." },
            })
          );
        }
      })();
      return;
    }

    const lastMainBot = [...messages].reverse().find(m => !m.isTopic && m.role === "model" && m.text?.trim() && !m.isError);
    if (lastMainBot?.id) {
      if (applicationAssetLastSyncedBotIdRef.current !== lastMainBot.id) {
        if (tryOfferApplicationAssetDraftReview(lastMainBot.text, lastMainBot.id, undefined, messages)) {
          return;
        }
      }
      if (contentGenLastSyncedBotIdRef.current !== lastMainBot.id) {
        tryOfferContentGenDraftReview(lastMainBot.text, lastMainBot.id, undefined, messages);
      }
    }

    for (const card of messages) {
      if (card.topicKind === "content_gen") {
        const threadMessages = card.messages ?? [];
        const lastBot = [...threadMessages].reverse().find(m => m.role === "model" && m.text?.trim() && !m.isError);
        if (!lastBot?.id || contentGenLastSyncedBotIdRef.current === lastBot.id) {
          continue;
        }
        void (async () => {
          let offered = tryOfferContentGenDraftReview(lastBot.text, lastBot.id, undefined, threadMessages);
          const subAdkId = card.subSessionAdkId;
          if (!offered && userId && subAdkId) {
            const pulled = await pullSessionStateAction(userId, subAdkId, resolveAdkSessionOptionsForSessionId(subAdkId));
            const sessionDraft = pulled.success && pulled.state ? extractContentGenDraftFromAdkState(pulled.state) : null;
            if (sessionDraft?.draft) {
              offered = tryOfferContentGenDraftReview(lastBot.text, lastBot.id, sessionDraft.topic, threadMessages, sessionDraft.draft);
            }
          }
        })();
        continue;
      }
      if (card.topicKind === "application_asset") {
        const threadMessages = card.messages ?? [];
        const lastBot = [...threadMessages].reverse().find(m => m.role === "model" && !m.isError);
        if (!lastBot?.id || applicationAssetLastSyncedBotIdRef.current === lastBot.id) {
          continue;
        }
        void tryOfferApplicationAssetDraftWithSessionFallback({
          botMessage: lastBot.text ?? "",
          assistantMessageId: lastBot.id,
          threadMessages,
          subSessionAdkId: card.subSessionAdkId,
        });
      }
    }
  }, [
    attemptContentGenDjangoFallback,
    applicationAssetTurnAlreadySatisfied,
    isAgentLoading,
    isLoadingHistory,
    messages,
    setMessages,
    tryOfferApplicationAssetDraftReview,
    tryOfferApplicationAssetDraftWithSessionFallback,
    tryOfferContentGenDraftReview,
    userId,
  ]);

  const groupedSessions = useMemo(() => (userId ? groupSessionsForSidebar(userId, sessions) : []), [userId, sessions]);

  const currentMainSessionId = useMemo(() => {
    if (!userId || !sessionId) return null;
    const meta = getSessionMeta(userId, sessionId);
    if (meta?.kind === "sub" && meta.parentSessionId) return meta.parentSessionId;
    return sessionId;
  }, [userId, sessionId]);

  const thisSessionSubs = useMemo(() => {
    if (!currentMainSessionId) return [];
    const group = groupedSessions.find(g => g.id === currentMainSessionId);
    return group?.subs ?? [];
  }, [groupedSessions, currentMainSessionId]);

  /** Improve topics embedded in the main transcript (for "This session" panel). */
  const improveTopicEntries = useMemo(() => {
    const out: { id: string; title: string; subtitle?: string }[] = [];
    for (const m of messages) {
      if (m.isTopic && m.topicTitle) {
        const subRow = m.subSessionAdkId ? getRegistryRow(m.subSessionAdkId) : undefined;
        out.push({
          id: m.id,
          title: displayTitleForSubSession(subRow, m.topicTitle),
          subtitle:
            m.topicSubtitle ?? (subRow ? deriveSubSessionSubtitle(subRow) : m.topicKind === "improve" ? "Improve thread" : undefined),
        });
      }
    }
    return out.reverse();
  }, [messages]);

  const sessionSubEntries = useMemo(() => {
    const topicSubIds = new Set(messages.filter(m => m.isTopic && m.subSessionAdkId).map(m => m.subSessionAdkId as string));
    return thisSessionSubs
      .filter(s => !topicSubIds.has(s.id))
      .map(s => {
        const row = getRegistryRow(s.id);
        return {
          topicId: topicIdForSubSession(s.id),
          subAdkSessionId: s.id,
          title: row ? displayTitleForSubSession(row) : s.title,
          subtitle: row ? deriveSubSessionSubtitle(row) : ("Improve thread" as const),
        };
      });
  }, [messages, thisSessionSubs]);

  const thisSessionListEntries = useMemo(() => {
    const fromTopics = improveTopicEntries.map(row => {
      const topic = messages.find(m => m.id === row.id && m.isTopic);
      return {
        id: row.id,
        title: row.title,
        subtitle: row.subtitle,
        subAdkSessionId: topic?.subSessionAdkId,
      };
    });
    const fromRegistry = sessionSubEntries.map(row => ({
      id: row.topicId,
      title: row.title,
      subtitle: row.subtitle,
      subAdkSessionId: row.subAdkSessionId,
    }));
    return [...fromTopics, ...fromRegistry];
  }, [improveTopicEntries, sessionSubEntries, messages]);

  const filteredThisSessionList = useMemo(() => {
    const q = historySearchQuery.trim().toLowerCase();
    if (!q) return thisSessionListEntries;
    return thisSessionListEntries.filter(row => row.title.toLowerCase().includes(q) || (row.subtitle?.toLowerCase().includes(q) ?? false));
  }, [thisSessionListEntries, historySearchQuery]);

  const historyPanelLayout = useMemo(() => {
    const subCount = thisSessionListEntries.length;
    if (subCount === 0) {
      return {
        panelMaxHeight: "min(240px, 42vh)",
        thisSessionMaxHeight: undefined as string | undefined,
        allChatsMaxHeight: "min(180px, 30vh)",
      };
    }
    if (subCount <= 2) {
      return {
        panelMaxHeight: "min(360px, 54vh)",
        thisSessionMaxHeight: "min(128px, 20vh)",
        allChatsMaxHeight: "min(140px, 22vh)",
      };
    }
    if (subCount <= 4) {
      return {
        panelMaxHeight: "min(440px, 62vh)",
        thisSessionMaxHeight: "min(200px, 30vh)",
        allChatsMaxHeight: "min(120px, 18vh)",
      };
    }
    return {
      panelMaxHeight: "min(520px, 70vh)",
      thisSessionMaxHeight: "min(260px, 38vh)",
      allChatsMaxHeight: "min(120px, 16vh)",
    };
  }, [thisSessionListEntries.length]);

  const findContentGenTopicId = useCallback((): string | null => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m?.isTopic && m.topicKind === "content_gen") {
        return m.id;
      }
    }
    return null;
  }, [messages]);

  const isActionItemHighlighted = useCallback(
    (topicId: string, messageId: string, kind: UnibotActionHighlightTarget["kind"]) =>
      highlightedActionItem?.topicId === topicId && highlightedActionItem?.messageId === messageId && highlightedActionItem?.kind === kind,
    [highlightedActionItem]
  );

  const handleActionItemSpamGuard = useCallback(
    (params: {
      topicId: string;
      actionMessageId: string;
      kind: UnibotActionHighlightTarget["kind"];
      nudgeKey: string;
      nudgeText: string;
    }) => {
      shouldStickToBottomRef.current = false;
      setMessages(prev => prev.map(m => (m.id === params.topicId && m.isTopic ? { ...m, isExpanded: true } : m)));
      setImproveReplyTopicId(params.topicId);
      setIsCollapsed(false);

      if (!actionItemNudgeShownRef.current.has(params.nudgeKey)) {
        actionItemNudgeShownRef.current.add(params.nudgeKey);
        const nudgeMsg: ChatMessage = {
          id: newId("nudge"),
          role: "model",
          text: params.nudgeText,
          timestamp: new Date(),
          excludeFromTitleGeneration: true,
        };
        setMessages(prev =>
          prev.map(m => (m.id === params.topicId && m.isTopic ? { ...m, messages: [...(m.messages || []), nudgeMsg] } : m))
        );
      }

      setHighlightedActionItem({
        topicId: params.topicId,
        messageId: params.actionMessageId,
        kind: params.kind,
      });
      window.setTimeout(() => {
        setHighlightedActionItem(current =>
          current?.topicId === params.topicId && current.messageId === params.actionMessageId ? null : current
        );
      }, 4500);

      requestAnimationFrame(() => {
        const el = messagesScrollRef.current?.querySelector(`[data-unibot-action-highlight="${params.actionMessageId}"]`);
        el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
    },
    [setMessages]
  );

  const messagesScrollFingerprintRef = useRef("");
  const shouldStickToBottomRef = useRef(true);
  const prevLoadingHistoryRef = useRef(isLoadingHistory);

  const scrollChatMessageIntoView = useCallback((messageId: string, block: ScrollLogicalPosition = "nearest") => {
    requestAnimationFrame(() => {
      const root = messagesScrollRef.current;
      if (!root) return;
      const el =
        root.querySelector(`[data-unibot-message-id="${messageId}"]`) ??
        root.querySelector(`[data-unibot-action-highlight="${messageId}"]`);
      el?.scrollIntoView({ behavior: "smooth", block });
    });
  }, []);

  const pulseTopicPickerHighlight = useCallback(
    (topicId: string, actionMessageId: string) => {
      setHighlightedActionItem({
        topicId,
        messageId: actionMessageId,
        kind: "planner_chips",
      });
      window.setTimeout(() => {
        setHighlightedActionItem(current => (current?.topicId === topicId && current.messageId === actionMessageId ? null : current));
      }, 4500);
      scrollChatMessageIntoView(actionMessageId, "center");
    },
    [scrollChatMessageIntoView]
  );

  const clearTopicPickerSpamCounts = useCallback((topicId: string) => {
    for (const key of [...topicPickerWandSpamCountRef.current.keys()]) {
      if (key === topicId || key.startsWith(`${topicId}:`)) {
        topicPickerWandSpamCountRef.current.delete(key);
      }
    }
  }, []);

  const topicPickerSpamKey = (topicId: string, funnel: ContentGenFunnel | null | undefined) => (funnel ? `${topicId}:${funnel}` : topicId);

  const handleTopicPickerFunnelRevisit = useCallback(
    (topicId: string, actionMessageId: string) => {
      shouldStickToBottomRef.current = false;
      setMessages(prevMsgs => prevMsgs.map(m => (m.id === topicId && m.isTopic ? { ...m, isExpanded: true } : m)));
      setImproveReplyTopicId(topicId);
      setIsCollapsed(false);
      pulseTopicPickerHighlight(topicId, actionMessageId);
    },
    [pulseTopicPickerHighlight, setMessages]
  );

  const handleTopicPickerWandSpam = useCallback(
    (topicId: string, actionMessageId: string, funnel: ContentGenFunnel | null) => {
      shouldStickToBottomRef.current = false;
      const spamKey = topicPickerSpamKey(topicId, funnel);
      const prev = topicPickerWandSpamCountRef.current.get(spamKey) ?? 0;
      const next = prev + 1;
      topicPickerWandSpamCountRef.current.set(spamKey, next);

      setMessages(prevMsgs => prevMsgs.map(m => (m.id === topicId && m.isTopic ? { ...m, isExpanded: true } : m)));
      setImproveReplyTopicId(topicId);
      setIsCollapsed(false);

      if (next === 1) {
        const nudgeMsg: ChatMessage = {
          id: newId("nudge"),
          role: "model",
          text: CONTENT_GEN_TOPIC_PICKER_NUDGE,
          timestamp: new Date(),
          excludeFromTitleGeneration: true,
        };
        setMessages(prevMsgs =>
          prevMsgs.map(m => (m.id === topicId && m.isTopic ? { ...m, messages: [...(m.messages || []), nudgeMsg] } : m))
        );
      }

      pulseTopicPickerHighlight(topicId, actionMessageId);
    },
    [pulseTopicPickerHighlight, setMessages]
  );

  const openImproveSubTopic = useCallback(
    async (
      subAdkSessionId: string,
      title: string,
      displayText: string,
      agentText: string,
      options?: { isExpanded?: boolean; suppressFocus?: boolean }
    ) => {
      ensureOptimisticUnibotActivity();
      const isExpanded = options?.isExpanded ?? true;
      const suppressFocus = options?.suppressFocus ?? false;
      const topicId = topicIdForSubSession(subAdkSessionId);
      const existing = findImproveTopic(messages, subAdkSessionId);
      const subRow = getRegistryRow(subAdkSessionId);

      if (existing) {
        const pendingReview =
          findPendingReviewInTopic(existing, adkReviewStack, adkActiveReviewId) ??
          findPendingReviewInTopic(existing, adkLinkedInReviewStack, adkLinkedInActiveReviewId) ??
          findPendingReviewInTopic(existing, adkApplicationAssetReviewStack, adkApplicationAssetActiveReviewId) ??
          findPendingReviewInTopic(existing, adkContentGenReviewStack, adkContentGenActiveReviewId) ??
          findPendingReviewInTopic(existing, adkPortfolioReviewStack, adkPortfolioActiveReviewId);

        if (pendingReview) {
          const feature = (subRow?.feature ?? "").toLowerCase();
          const nudgeText =
            feature === "linkedin"
              ? LINKEDIN_IMPROVE_NUDGE
              : feature === "application_asset" || feature === "coverletter" || feature === "coldemail" || feature === "referral"
                ? APPLICATION_ASSET_IMPROVE_NUDGE
                : feature === "linkedin_post" || feature === "content_gen" || feature === "linkedin_topic"
                  ? CONTENT_GEN_IMPROVE_NUDGE
                  : RESUME_IMPROVE_NUDGE;
          handleActionItemSpamGuard({
            topicId: existing.id,
            actionMessageId: pendingReview.messageId,
            kind: "review_card",
            nudgeKey: `improve:${existing.id}:${subAdkSessionId}`,
            nudgeText,
          });
          return;
        }
      }

      if (!existing) {
        const nested = await loadSubSessionChatMessages(userId, subAdkSessionId);
        const subRow = getRegistryRow(subAdkSessionId);
        const userMsg: ChatMessage = {
          id: newId("u"),
          role: "user",
          text: displayText,
          timestamp: new Date(),
          excludeFromTitleGeneration: true,
          contentScope: subRow ? deriveScopeFromRegistryRow(subRow) : deriveCurrentScope(subAdkSessionId, "sub"),
        };
        const botMsgId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : newId("bot");
        ensureOptimisticUnibotActivity({ assistantMessageId: botMsgId });
        const placeholderMsg: ChatMessage = {
          id: botMsgId,
          role: "model",
          text: "",
          timestamp: new Date(),
        };
        const newTopic: ChatMessage = {
          id: topicId,
          role: "model",
          text: "",
          timestamp: new Date(),
          isTopic: true,
          topicKind: subRow ? topicKindForSub(subRow) : undefined,
          topicTitle: title,
          isExpanded,
          subSessionAdkId: subAdkSessionId,
          messages: [...nested, userMsg, placeholderMsg],
        };
        setMessages(prev => insertTopicInMainThread(prev, newTopic));
        if (!suppressFocus) {
          setImproveReplyTopicId(topicId);
        }
        pendingRetryRef.current = { text: agentText, topicId, botMsgId };
        try {
          await sendTopicMessage(agentText, botMsgId, { sessionIdOverride: subAdkSessionId });
          pendingRetryRef.current = null;
        } catch (err) {
          handleStreamFailure(err, { text: agentText, topicId, botMsgId });
        }
        return;
      }

      const userMsg: ChatMessage = {
        id: newId("u"),
        role: "user",
        text: displayText,
        timestamp: new Date(),
        excludeFromTitleGeneration: true,
        contentScope: subRow ? deriveScopeFromRegistryRow(subRow) : deriveCurrentScope(subAdkSessionId, "sub"),
      };
      const botMsgId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : newId("bot");
      ensureOptimisticUnibotActivity({ assistantMessageId: botMsgId });
      const placeholderMsg: ChatMessage = {
        id: botMsgId,
        role: "model",
        text: "",
        timestamp: new Date(),
      };

      setMessages(prev =>
        prev.map(msg =>
          msg.id === existing.id && msg.isTopic
            ? {
                ...msg,
                id: topicId,
                subSessionAdkId: subAdkSessionId,
                topicTitle: title,
                isExpanded,
                messages: [...(msg.messages || []), userMsg, placeholderMsg],
              }
            : msg
        )
      );
      if (!suppressFocus) {
        setImproveReplyTopicId(topicId);
      }
      pendingRetryRef.current = { text: agentText, topicId, botMsgId };
      try {
        await sendTopicMessage(agentText, botMsgId, { sessionIdOverride: subAdkSessionId });
        pendingRetryRef.current = null;
      } catch (err) {
        handleStreamFailure(err, { text: agentText, topicId, botMsgId });
      }
    },
    [
      deriveCurrentScope,
      messages,
      userId,
      setMessages,
      sendTopicMessage,
      handleStreamFailure,
      handleActionItemSpamGuard,
      adkReviewStack,
      adkActiveReviewId,
      adkLinkedInReviewStack,
      adkLinkedInActiveReviewId,
      adkApplicationAssetReviewStack,
      adkApplicationAssetActiveReviewId,
      adkContentGenReviewStack,
      adkContentGenActiveReviewId,
      adkPortfolioReviewStack,
      adkPortfolioActiveReviewId,
    ]
  );

  useEffect(() => {
    const req = incomingRequest;
    if (!req) {
      lastIncomingSigRef.current = null;
      return;
    }
    if (!sessionReady) return;

    if (isAgentLoading || isLoadingHistory) {
      onRequestHandled?.();
      return;
    }

    const sig = incomingRequestSignature(req);
    if (lastIncomingSigRef.current === sig) return;
    lastIncomingSigRef.current = sig;
    onRequestHandled?.();

    setTimeout(() => {
      setIsCollapsed(false);
    }, 0);

    if (req.type === "section_review") {
      const prompt = UNIBOT_SECTION_REVIEW_PROMPTS[req.section];
      if (!prompt) return;

      void (async () => {
        try {
          if (!userId || !sessionReady) return;
          await sendMainMessage(prompt, { excludeFromTitleGeneration: true });
        } catch (err) {
          handleStreamFailure(err, { text: prompt });
        }
      })();
      return;
    }

    if (req.type === "ats_fix_batch") {
      void (async () => {
        try {
          if (!userId || !sessionReady || req.sections.length === 0) return;

          const mainId = currentMainSessionId ?? sessionId;
          const mainRow = getRegistryRow(mainId);
          const atsMainTitle = req.mainSessionTitle?.trim();
          const promoteMainTitle = Boolean(atsMainTitle) && (!mainRow || isUntitledMainSessionTitle(mainRow.title));

          if (!mainRow || promoteMainTitle) {
            const regMain = await registerUnibotAdkSessionAction({
              adk_session_id: mainId,
              kind: "main",
              title: promoteMainTitle ? atsMainTitle! : UNTITLED_THREAD_TITLE,
              content_key: `general:${mainId}`,
            });
            if (regMain.session) upsertRegistryRow(regMain.session);
          }

          const resolvedSubs = await Promise.all(
            req.sections.map(sectionPlan =>
              resolveImproveSubSession({
                userId,
                mainAdkSessionId: mainId,
                feature: "resume",
                featureId: req.resumeId,
                section: sectionPlan.section,
                entryId: "",
                contentKey: buildResumeImproveContentKey(req.resumeId, sectionPlan.section),
                title: sectionPlan.topicTitle,
              })
            )
          );

          atsFixBatchAbortRef.current?.abort();
          const batchAbort = new AbortController();
          atsFixBatchAbortRef.current = batchAbort;
          atsFixBatchRef.current = createAtsFixBatchCoordinator(req.sections.length);
          syncAtsFixBatchUi();

          for (let i = 0; i < req.sections.length; i++) {
            const sectionPlan = req.sections[i];
            const resolved = resolvedSubs[i];
            if (!resolved?.success || !resolved.adkSessionId) {
              throw new Error(resolved?.error ?? `Could not open ATS fix thread for ${sectionPlan.section}`);
            }

            const topicId = topicIdForSubSession(resolved.adkSessionId);
            const coordinator = atsFixBatchRef.current;
            if (!coordinator) break;

            if (i > 0 && coordinator.gateTopicId) {
              const gateTopicId = coordinator.gateTopicId;
              await waitForAtsGateTopicSettled(
                () => buildAtsGateSnapshot(messagesRef.current, gateTopicId, isAgentLoadingRef.current),
                batchAbort.signal
              );
              if (!coordinator.userOverrodeFocus) {
                setMessages(prev => prev.map(m => (m.id === gateTopicId && m.isTopic ? { ...m, isExpanded: false } : m)));
              }
            }

            const existingImproveTopic = findImproveTopic(messagesRef.current, resolved.adkSessionId);
            if (existingImproveTopic) {
              const pendingReview =
                findPendingReviewInTopic(existingImproveTopic, adkReviewStack, adkActiveReviewId) ??
                findPendingReviewInTopic(existingImproveTopic, adkLinkedInReviewStack, adkLinkedInActiveReviewId) ??
                findPendingReviewInTopic(existingImproveTopic, adkApplicationAssetReviewStack, adkApplicationAssetActiveReviewId) ??
                findPendingReviewInTopic(existingImproveTopic, adkContentGenReviewStack, adkContentGenActiveReviewId) ??
                findPendingReviewInTopic(existingImproveTopic, adkPortfolioReviewStack, adkPortfolioActiveReviewId);

              if (pendingReview) {
                handleActionItemSpamGuard({
                  topicId: existingImproveTopic.id,
                  actionMessageId: pendingReview.messageId,
                  kind: "review_card",
                  nudgeKey: `improve:${existingImproveTopic.id}:${resolved.adkSessionId}`,
                  nudgeText: RESUME_IMPROVE_NUDGE,
                });
                continue;
              }
            }

            coordinator.sectionIndex = i;
            coordinator.gateSectionLabel = sectionPlan.topicTitle;
            coordinator.gateTopicId = topicId;
            syncAtsFixBatchUi();

            const shouldFocus = !coordinator.userOverrodeFocus;

            await refreshSessions();
            await openImproveSubTopic(resolved.adkSessionId, sectionPlan.topicTitle, sectionPlan.displayText, sectionPlan.agentText, {
              isExpanded: true,
              suppressFocus: !shouldFocus,
            });
          }

          atsFixBatchRef.current = null;
          syncAtsFixBatchUi();
        } catch (err) {
          atsFixBatchRef.current = null;
          syncAtsFixBatchUi();
          handleStreamFailure(err, { text: "ATS fix with Unibot" });
        }
      })();
      return;
    }

    if (req.type === "content_gen_topic") {
      const followUp = req.followUpText?.trim();
      const topicTitle =
        req.topicTitle?.trim() || (followUp ? buildLinkedInPostTitle(req.seedTopic ?? "") : buildLinkedInTopicPickerTitle());
      const studioFunnel = useContentGenStudioStore.getState().funnel;
      const resolvedFunnel = req.funnel ?? studioFunnel ?? contentGenFunnelRef.current ?? "top";
      contentGenFunnelRef.current = resolvedFunnel;
      useContentGenStudioStore.getState().syncFromStudio({
        funnel: resolvedFunnel,
        topic: req.seedTopic?.trim() || useContentGenStudioStore.getState().topic,
      });

      if (req.improveDraft) {
        const studio = useContentGenStudioStore.getState();
        const topic = req.seedTopic?.trim() || studio.topic.trim();
        const assetId = req.assetId?.trim() || studio.assetId?.trim() || null;
        useContentGenStudioStore.getState().syncFromStudio({
          topic: topic || studio.topic,
          assetId,
        });
        const displayText = CONTENT_GEN_IMPROVE_KICKOFF_USER_MESSAGE;
        const agentText = buildContentGenImproveBootstrap();
        const improveTitle = buildLinkedInPostTitle(topic);

        void (async () => {
          try {
            if (!userId || !sessionReady || isAgentLoading || isLoadingHistory) {
              return;
            }
            const mainId = reviewMainSessionId || sessionId;
            const sub = await ensureContentGenTopicSubSession({
              userId,
              mainAdkSessionId: mainId,
              mode: "draft",
              topic: topic || undefined,
              assetId,
              title: improveTitle,
            });
            if (!sub?.subAdkSessionId) {
              throw new Error("Could not open a draft thread for this post.");
            }
            await openImproveSubTopic(sub.subAdkSessionId, sub.title ?? improveTitle, displayText, agentText);
          } catch (err) {
            handleStreamFailure(err, { text: agentText });
          }
        })();
        return;
      }

      const agentText = followUp ?? buildContentGenTopicBootstrap(req.seedTopic, resolvedFunnel);
      const displayText = followUp?.trim() || buildContentGenTopicUserDisplay(resolvedFunnel);
      const existingPickerId = findContentGenTopicPickerId(messages);

      if (existingPickerId && followUp) {
        void (async () => {
          try {
            if (!userId || !sessionReady || isAgentLoading || isLoadingHistory) {
              return;
            }
            const topicId = existingPickerId;
            const topicRow = messages.find(m => m.id === topicId && m.isTopic);
            const userMsg: ChatMessage = {
              id: newId("u"),
              role: "user",
              text: displayText,
              timestamp: new Date(),
              contentScope: topicRow?.subSessionAdkId
                ? deriveCurrentScope(topicRow.subSessionAdkId, "sub")
                : deriveCurrentScope(reviewMainSessionId || sessionId),
            };
            const botMsgId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : newId("bot");
            const placeholderMsg: ChatMessage = {
              id: botMsgId,
              role: "model",
              text: "",
              timestamp: new Date(),
            };
            setMessages(prev =>
              prev.map(msg =>
                msg.id === topicId && msg.isTopic
                  ? {
                      ...msg,
                      topicTitle,
                      isExpanded: true,
                      messages: [...(msg.messages || []), userMsg, placeholderMsg],
                    }
                  : msg
              )
            );
            shouldStickToBottomRef.current = true;
            pendingRetryRef.current = { text: agentText, topicId, botMsgId };
            const subAdkId = topicRow?.subSessionAdkId;
            await sendTopicMessage(agentText, botMsgId, subAdkId ? { sessionIdOverride: subAdkId } : undefined);
            pendingRetryRef.current = null;
          } catch (err) {
            handleStreamFailure(err, { text: agentText, topicId: existingPickerId });
          }
        })();
        return;
      }

      if (existingPickerId && !followUp) {
        if (isAgentLoading || isLoadingHistory) {
          return;
        }
        const topicCard = messages.find(m => m.id === existingPickerId && m.isTopic);
        const funnelTurn = findTopicPickerTurnForFunnel(topicCard, resolvedFunnel, contentGenDismissedChipsRef.current);

        if (funnelTurn) {
          const latestWandFunnel = findLatestTopicPickerWandFunnel(topicCard);
          const isFunnelRevisit = latestWandFunnel != null && latestWandFunnel !== resolvedFunnel;

          if (isFunnelRevisit) {
            handleTopicPickerFunnelRevisit(existingPickerId, funnelTurn.modelMessageId);
            return;
          }

          handleTopicPickerWandSpam(existingPickerId, funnelTurn.modelMessageId, resolvedFunnel);
          return;
        }

        void (async () => {
          try {
            if (!userId || !sessionReady || isAgentLoading || isLoadingHistory) {
              return;
            }
            const topicId = existingPickerId;
            const topicRow = messages.find(m => m.id === topicId && m.isTopic);
            const userMsg: ChatMessage = {
              id: newId("u"),
              role: "user",
              text: displayText,
              timestamp: new Date(),
              contentScope: topicRow?.subSessionAdkId
                ? deriveCurrentScope(topicRow.subSessionAdkId, "sub")
                : deriveCurrentScope(reviewMainSessionId || sessionId),
            };
            const botMsgId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : newId("bot");
            const placeholderMsg: ChatMessage = {
              id: botMsgId,
              role: "model",
              text: "",
              timestamp: new Date(),
            };
            setMessages(prev =>
              prev.map(msg =>
                msg.id === topicId && msg.isTopic
                  ? {
                      ...msg,
                      topicTitle,
                      isExpanded: true,
                      messages: [...(msg.messages || []), userMsg, placeholderMsg],
                    }
                  : msg
              )
            );
            shouldStickToBottomRef.current = true;
            pendingRetryRef.current = { text: agentText, topicId, botMsgId };
            const subAdkId = topicRow?.subSessionAdkId;
            await sendTopicMessage(agentText, botMsgId, subAdkId ? { sessionIdOverride: subAdkId } : undefined);
            pendingRetryRef.current = null;
          } catch (err) {
            handleStreamFailure(err, { text: agentText, topicId: existingPickerId });
          }
        })();
        return;
      }

      const topicId = newId("topic");
      const initialUserMsg: ChatMessage = {
        id: newId("u"),
        role: "user",
        text: displayText,
        timestamp: new Date(),
        contentScope: deriveCurrentScope(reviewMainSessionId || sessionId),
      };
      const botMsgId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : newId("bot");
      const placeholderMsg: ChatMessage = {
        id: botMsgId,
        role: "model",
        text: "",
        timestamp: new Date(),
      };
      const newTopic: ChatMessage = {
        id: topicId,
        role: "model",
        text: "",
        timestamp: new Date(),
        isTopic: true,
        topicKind: "content_gen",
        topicTitle,
        isExpanded: true,
        messages: [initialUserMsg, placeholderMsg],
      };

      setMessages(prev => [...prev, newTopic]);
      shouldStickToBottomRef.current = true;

      void (async () => {
        try {
          if (!userId || !sessionReady || isAgentLoading || isLoadingHistory) {
            return;
          }
          const mainId = reviewMainSessionId || sessionId;
          const sub = await ensureContentGenTopicSubSession({
            userId,
            mainAdkSessionId: mainId,
            mode: "topic",
            topic: req.seedTopic,
            title: topicTitle,
          });
          const subAdkId = sub?.subAdkSessionId;
          const stableTopicId = sub?.stableTopicId ?? topicId;
          if (sub) {
            setMessages(prev =>
              prev.map(m =>
                m.id === topicId
                  ? {
                      ...m,
                      id: stableTopicId,
                      subSessionAdkId: sub.subAdkSessionId,
                      topicTitle: sub.title,
                    }
                  : m
              )
            );
          }
          pendingRetryRef.current = { text: agentText, topicId: stableTopicId, botMsgId };
          await sendTopicMessage(agentText, botMsgId, subAdkId ? { sessionIdOverride: subAdkId } : undefined);
          pendingRetryRef.current = null;
        } catch (err) {
          handleStreamFailure(err, { text: agentText, topicId, botMsgId });
        }
      })();
      return;
    }

    const isResumeSectionImprove = req.improveType === "resume" && Boolean(req.featureId && req.section);
    const isLinkedInSectionImprove = req.improveType === "linkedin" && Boolean(req.featureId && req.section);
    const isImproveSubSession = isResumeSectionImprove || isLinkedInSectionImprove;

    const promptText = isResumeSectionImprove
      ? buildResumeImproveAgentMessage({
          section: req.section as UnibotResumeSection,
          hasContent: req.hasContent ?? false,
          entryId: req.entryId,
        })
      : req.text.trim();
    const improveDisplayText = isResumeSectionImprove
      ? buildResumeImproveDisplayMessage({
          section: req.section as UnibotResumeSection,
          hasContent: req.hasContent ?? false,
          entryId: req.entryId,
        })
      : promptText;

    void (async () => {
      try {
        if (!userId || !sessionReady) return;
        ensureOptimisticUnibotActivity();

        if (isImproveSubSession && req.featureId && req.section) {
          const mainId = currentMainSessionId ?? sessionId;
          if (!getRegistryRow(mainId)) {
            const regMain = await registerUnibotAdkSessionAction({
              adk_session_id: mainId,
              kind: "main",
              title: UNTITLED_THREAD_TITLE,
              content_key: `general:${mainId}`,
            });
            if (regMain.session) upsertRegistryRow(regMain.session);
          }

          const resolved = await resolveImproveSubSession({
            userId,
            mainAdkSessionId: mainId,
            feature: req.feature ?? "resume",
            featureId: req.featureId,
            section: req.section,
            entryId: req.entryId,
            contentKey:
              req.improveType === "linkedin"
                ? buildLinkedInImproveContentKey(req.featureId, req.section, req.entryId)
                : buildResumeImproveContentKey(req.featureId, req.section, req.entryId),
            title:
              req.improveType === "linkedin"
                ? buildLinkedInImproveTitle(req.section)
                : req.topicTitle?.trim() || buildResumeImproveTitle(req.section),
          });

          if (!resolved.success || !resolved.adkSessionId) {
            throw new Error(resolved.error ?? "Could not open improve chat");
          }

          const existingImproveTopic = findImproveTopic(messages, resolved.adkSessionId);
          if (existingImproveTopic) {
            const pendingReview =
              findPendingReviewInTopic(existingImproveTopic, adkReviewStack, adkActiveReviewId) ??
              findPendingReviewInTopic(existingImproveTopic, adkLinkedInReviewStack, adkLinkedInActiveReviewId) ??
              findPendingReviewInTopic(existingImproveTopic, adkApplicationAssetReviewStack, adkApplicationAssetActiveReviewId) ??
              findPendingReviewInTopic(existingImproveTopic, adkContentGenReviewStack, adkContentGenActiveReviewId) ??
              findPendingReviewInTopic(existingImproveTopic, adkPortfolioReviewStack, adkPortfolioActiveReviewId);

            if (pendingReview) {
              const nudgeText =
                req.improveType === "linkedin"
                  ? LINKEDIN_IMPROVE_NUDGE
                  : req.feature === "application_asset"
                    ? APPLICATION_ASSET_IMPROVE_NUDGE
                    : RESUME_IMPROVE_NUDGE;
              handleActionItemSpamGuard({
                topicId: existingImproveTopic.id,
                actionMessageId: pendingReview.messageId,
                kind: "review_card",
                nudgeKey: `improve:${existingImproveTopic.id}:${resolved.adkSessionId}`,
                nudgeText,
              });
              return;
            }
          }

          await refreshSessions();
          await openImproveSubTopic(
            resolved.adkSessionId,
            resolved.title ??
              (req.improveType === "linkedin" ? buildLinkedInImproveTitle(req.section) : buildResumeImproveTitle(req.section)),
            improveDisplayText,
            promptText
          );
        } else if (req.improveType === "resume" && promptText) {
          setImproveReplyTopicId(null);
          await sendMainMessage(promptText, { excludeFromTitleGeneration: true });
        } else if (req.improveType !== "resume") {
          setImproveReplyTopicId(null);
          await sendMainMessage(promptText, { excludeFromTitleGeneration: true });
        }
      } catch (err) {
        handleStreamFailure(err, { text: promptText });
      }
    })();
  }, [
    incomingRequest,
    sessionReady,
    sendMainMessage,
    sendTopicMessage,
    onRequestHandled,
    handleStreamFailure,
    userId,
    sessionId,
    reviewMainSessionId,
    messages,
    currentMainSessionId,
    refreshSessions,
    openImproveSubTopic,
    isAgentLoading,
    isLoadingHistory,
    setMessages,
    findContentGenTopicId,
    deriveCurrentScope,
    handleActionItemSpamGuard,
    handleTopicPickerWandSpam,
    handleTopicPickerFunnelRevisit,
    adkReviewStack,
    adkActiveReviewId,
    adkLinkedInReviewStack,
    adkLinkedInActiveReviewId,
    adkApplicationAssetReviewStack,
    adkApplicationAssetActiveReviewId,
    adkContentGenReviewStack,
    adkContentGenActiveReviewId,
    adkPortfolioReviewStack,
    adkPortfolioActiveReviewId,
    syncAtsFixBatchUi,
  ]);

  useEffect(
    () => () => {
      atsFixBatchAbortRef.current?.abort();
    },
    []
  );

  useEffect(() => {
    if (!improveReplyTopicId) return;
    if (!messages.some(m => m.id === improveReplyTopicId && m.isTopic)) setImproveReplyTopicId(null);
  }, [messages, improveReplyTopicId]);

  const improveContextTopic = useMemo(() => {
    const topic = messages.find(m => m.id === improveReplyTopicId && m.isTopic);
    if (!topic) return undefined;
    const subRow = topic.subSessionAdkId ? getRegistryRow(topic.subSessionAdkId) : undefined;
    return {
      ...topic,
      topicTitle: displayTitleForSubSession(subRow, topic.topicTitle),
    };
  }, [messages, improveReplyTopicId]);

  // Pin to bottom when message content changes — not when sub-thread expand/collapse toggles.
  const scrollToLatest = useCallback(() => {
    requestAnimationFrame(() => {
      const el = messagesScrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }, []);

  useEffect(() => {
    const el = messagesScrollRef.current;
    if (!el) return;

    const onScroll = () => {
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 140;
      shouldStickToBottomRef.current = nearBottom;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const el = messagesScrollRef.current;
    if (!el) return;

    const fp = chatMessagesScrollFingerprint(messages);
    const contentChanged = fp !== messagesScrollFingerprintRef.current;
    messagesScrollFingerprintRef.current = fp;

    if (!contentChanged) return;

    if (shouldStickToBottomRef.current || isAgentLoading) {
      scrollToLatest();
    }
  }, [messages, isAgentLoading, scrollToLatest]);

  useEffect(() => {
    if (isAgentLoading) {
      shouldStickToBottomRef.current = true;
    }
  }, [isAgentLoading]);

  useEffect(() => {
    if (prevLoadingHistoryRef.current && !isLoadingHistory) {
      shouldStickToBottomRef.current = true;
      scrollToLatest();
    }
    prevLoadingHistoryRef.current = isLoadingHistory;
  }, [isLoadingHistory, scrollToLatest]);

  useEffect(() => {
    if (!historyPanelOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (footerInputCardRef.current?.contains(e.target as Node)) return;
      setHistoryPanelOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [historyPanelOpen]);

  useEffect(() => {
    if (!historyPanelOpen) setHistorySearchQuery("");
  }, [historyPanelOpen]);

  const canSendMessage = Boolean(
    !coachActAsReadOnly && userId && sessionReady && !isAgentLoading && !isLoadingHistory && !isContentGenPublishing
  );
  const canSend = canSendMessage && !streamError;

  const canUseHistory = Boolean(userId && !isBootstrappingSession);

  /** When a streaming placeholder exists in the transcript, loading UI stays inline only (no duplicate footer). */
  const activeStreamingMessageId = useMemo(() => {
    if (liveStreamActivity.assistantMessageId) {
      return liveStreamActivity.assistantMessageId;
    }
    if (!isAgentLoading && !isContentGenPublishing) {
      return null;
    }
    const isStreamingPlaceholderBubble = (text: string | undefined, isError?: boolean) => {
      if (isError) return false;
      if (!text?.trim()) return true;
      return isStreamingMachineReadablePayloadOnly(text);
    };
    if (improveReplyTopicId) {
      const topic = messages.find(m => m.id === improveReplyTopicId && m.isTopic);
      const subs = topic?.messages ?? [];
      for (let i = subs.length - 1; i >= 0; i--) {
        const sub = subs[i];
        if (sub?.role === "model" && isStreamingPlaceholderBubble(sub.text, sub.isError)) {
          return sub.id;
        }
      }
    }
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (!msg.isTopic && msg.role === "model" && isStreamingPlaceholderBubble(msg.text, msg.isError)) {
        return msg.id;
      }
      if (msg.isTopic) {
        const subs = msg.messages ?? [];
        for (let j = subs.length - 1; j >= 0; j--) {
          const sub = subs[j];
          if (sub?.role === "model" && isStreamingPlaceholderBubble(sub.text, sub.isError)) {
            return sub.id;
          }
        }
      }
    }
    return null;
  }, [liveStreamActivity.assistantMessageId, isAgentLoading, isContentGenPublishing, improveReplyTopicId, messages]);

  const hasInlineStreamingPlaceholder = useMemo(() => {
    if (!isAgentLoading && !isContentGenPublishing) {
      return false;
    }
    const isStreamingPlaceholderBubble = (text: string | undefined, isError?: boolean) => {
      if (isError) return false;
      if (!text?.trim()) return true;
      return isStreamingMachineReadablePayloadOnly(text);
    };
    const topicPlaceholder = messages.some(
      msg => msg.isTopic && (msg.messages ?? []).some(sub => sub.role === "model" && isStreamingPlaceholderBubble(sub.text, sub.isError))
    );
    const mainPlaceholder = messages.some(
      msg => !msg.isTopic && msg.role === "model" && isStreamingPlaceholderBubble(msg.text, msg.isError)
    );
    return topicPlaceholder || mainPlaceholder;
  }, [isAgentLoading, isContentGenPublishing, messages]);

  /** Footer spinner is redundant once the assistant bubble already shows user-visible text. */
  const hasVisibleStreamingAssistantText = useMemo(() => {
    if (!isAgentLoading) return false;
    const hasUserVisibleModelText = (text: string | undefined, isError?: boolean) => {
      if (isError || !text?.trim()) return false;
      return !isStreamingMachineReadablePayloadOnly(text);
    };
    return messages.some(
      msg =>
        (!msg.isTopic && msg.role === "model" && hasUserVisibleModelText(msg.text, msg.isError)) ||
        (msg.isTopic && (msg.messages ?? []).some(sub => sub.role === "model" && hasUserVisibleModelText(sub.text, sub.isError)))
    );
  }, [isAgentLoading, messages]);

  const handleAdkAccept = useCallback(async () => {
    const card = useAdkResumeReviewStore.getState().getActiveCard();
    const baseline = useAdkResumeReviewStore.getState().getBaselineResume();
    setAdkReviewBusy(true);
    try {
      await useAdkResumeReviewStore.getState().acceptAndSave();
      if (card?.assistantMessageId && userId && reviewMainSessionId && baseline) {
        const postResume = useResumeStore.getState().resumeData[card.resumeId] ?? baseline;
        const prePayload = buildResumeSnapshotPayload(baseline);
        const postPayload = buildResumeSnapshotPayload(postResume);
        await persistAcceptSnapshotForSession(userId, reviewMainSessionId, {
          domain: "resume",
          contentKey: `resume:${card.resumeId}`,
          assistantMessageId: card.assistantMessageId,
          preAcceptPayload: prePayload,
          postAcceptPayload: postPayload,
          acceptedAt: new Date().toISOString(),
        });
        await syncAdkContentStateOnAccept(userId, reviewMainSessionId, postPayload);
        await persistReviewDecisionForSession(userId, reviewMainSessionId, card.assistantMessageId, "accepted");
      }
    } catch (err) {
      console.error("ADK resume accept failed:", err);
    } finally {
      setAdkReviewBusy(false);
    }
  }, [reviewMainSessionId, userId]);

  const handleAdkDiscard = useCallback(async () => {
    const card = useAdkResumeReviewStore.getState().getActiveCard();
    const baseline = useAdkResumeReviewStore.getState().getBaselineResume();
    if (!baseline || !userId || !sessionId) return;
    setAdkReviewBusy(true);
    try {
      const merged = { ...useResumeStore.getState().resumeData, [baseline.id]: baseline };
      useResumeStore.setState({ resumeData: merged });
      queryClient.setQueryData(resumeByIdQueryKey(baseline.id), baseline);
      await syncSessionStateAction(userId, sessionId, {
        active_context: "resume",
        current_resume: baseline.id,
        resume_data: buildAdkResumeDataMap(merged),
      });
      if (card?.assistantMessageId && reviewMainSessionId) {
        await persistReviewDecisionForSession(userId, reviewMainSessionId, card.assistantMessageId, "discarded");
      }
      useAdkResumeReviewStore.getState().popReviewAfterDiscard();
      window.dispatchEvent(
        new CustomEvent("resume-adk-discard", {
          detail: { resumeId: baseline.id, baselineJson: JSON.stringify(baseline) },
        })
      );
    } catch (err) {
      console.error("ADK resume discard failed:", err);
    } finally {
      setAdkReviewBusy(false);
    }
  }, [queryClient, reviewMainSessionId, sessionId, userId]);

  const handleAdkPortfolioAccept = useCallback(async () => {
    const card = useAdkPortfolioReviewStore.getState().getActiveCard();
    const baseline = useAdkPortfolioReviewStore.getState().getBaselinePortfolio();
    setAdkReviewBusy(true);
    try {
      await useAdkPortfolioReviewStore.getState().acceptAndSave();
      if (card?.assistantMessageId && userId && reviewMainSessionId && baseline) {
        const postPortfolio = usePortfolioStore.getState().portfolioData[card.portfolioId] ?? baseline;
        const prePayload = buildPortfolioSnapshotPayload(baseline);
        const postPayload = buildPortfolioSnapshotPayload(postPortfolio);
        await persistAcceptSnapshotForSession(userId, reviewMainSessionId, {
          domain: "portfolio",
          contentKey: `portfolio:${card.portfolioId}`,
          assistantMessageId: card.assistantMessageId,
          preAcceptPayload: prePayload,
          postAcceptPayload: postPayload,
          acceptedAt: new Date().toISOString(),
        });
        await syncAdkContentStateOnAccept(userId, reviewMainSessionId, postPayload);
        await persistReviewDecisionForSession(userId, reviewMainSessionId, card.assistantMessageId, "accepted");
      }
    } catch (err) {
      console.error("ADK portfolio accept failed:", err);
    } finally {
      setAdkReviewBusy(false);
    }
  }, [reviewMainSessionId, userId]);

  const handleContentGenAccept = useCallback(async () => {
    const card = useAdkContentGenReviewStore.getState().getActiveCard();
    if (!card) {
      return;
    }
    setAdkReviewBusy(true);
    try {
      const existingAssetId = card.isTopicChange ? null : card.baselineAssetId;
      const result = await syncContentGenDraftToStudio({
        topic: card.topic,
        funnel: card.funnel,
        botMessage: "",
        draftText: card.proposedDraft,
        existingAssetId,
      });
      if (result) {
        contentGenAppliedTopicRef.current = card.topic;
        if (card.assistantMessageId) {
          contentGenAcceptedBotMsgIdRef.current = card.assistantMessageId;
          if (userId && reviewMainSessionId) {
            const contentKey = buildContentGenContentKey({
              assetId: result.assetId,
              topic: card.topic,
            });
            const prePayload = buildContentGenSnapshotPayload({
              content: card.baselineDraft,
              topic: card.baselineTopic || card.topic,
              funnel: card.baselineFunnel,
              assetId: card.baselineAssetId,
            });
            const postPayload = buildContentGenSnapshotPayload({
              content: card.proposedDraft,
              topic: card.topic,
              funnel: card.funnel,
              assetId: result.assetId,
            });
            await persistAcceptSnapshotForSession(userId, reviewMainSessionId, {
              domain: "content_gen",
              contentKey,
              assistantMessageId: card.assistantMessageId,
              preAcceptPayload: prePayload,
              postAcceptPayload: postPayload,
              acceptedAt: new Date().toISOString(),
            });
            await syncAdkContentStateOnAccept(userId, reviewMainSessionId, postPayload);
            await persistReviewDecisionForSession(userId, reviewMainSessionId, card.assistantMessageId, "accepted");
          }
        }
        useAdkContentGenReviewStore.getState().markReviewAccepted();
      }
    } catch (err) {
      console.error("Content gen accept failed:", err);
    } finally {
      setAdkReviewBusy(false);
    }
  }, [reviewMainSessionId, userId]);

  const appendContentGenPublishHint = useCallback(
    (hintText: string, topicThreadId: string | null) => {
      const hintMsg: ChatMessage = {
        id: newId("cg-publish-hint"),
        role: "model",
        text: hintText,
        timestamp: new Date(),
      };
      if (topicThreadId) {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === topicThreadId && msg.isTopic ? { ...msg, messages: [...(msg.messages || []), hintMsg], isExpanded: true } : msg
          )
        );
        return;
      }
      setMessages(prev => [...prev, hintMsg]);
    },
    [setMessages]
  );

  const setContentGenPublishBotText = useCallback(
    (botMsgId: string, topicThreadId: string | null, text: string) => {
      if (topicThreadId) {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === topicThreadId && msg.isTopic
              ? {
                  ...msg,
                  messages: (msg.messages ?? []).map(sub => (sub.id === botMsgId ? { ...sub, text } : sub)),
                }
              : msg
          )
        );
        return;
      }
      setMessages(prev => prev.map(msg => (msg.id === botMsgId ? { ...msg, text } : msg)));
    },
    [setMessages]
  );

  const handleContentGenPublishIntent = useCallback(
    async (
      mode: "post_now" | "schedule",
      scheduledAt: string | undefined,
      topicThreadId: string | null,
      options?: { background?: boolean; userText?: string }
    ) => {
      const studio = useContentGenStudioStore.getState();
      if (!studio.assetId) {
        window.dispatchEvent(
          new CustomEvent(CONTENT_GEN_EVENTS.publishBlocked, {
            detail: { message: CONTENT_GEN_PUBLISH_BLOCKED_MESSAGE },
          })
        );
        appendContentGenPublishHint(CONTENT_GEN_PUBLISH_BLOCKED_MESSAGE, topicThreadId);
        return;
      }

      if (!options?.background) {
        window.dispatchEvent(
          new CustomEvent(CONTENT_GEN_EVENTS.requestPublish, {
            detail: { mode, scheduledAt },
          })
        );
        return;
      }

      const userText = options.userText?.trim();
      if (!userText) {
        return;
      }

      const userMsg: ChatMessage = {
        id: newId("u"),
        role: "user",
        text: userText,
        timestamp: new Date(),
        contentScope: deriveCurrentScope(reviewMainSessionId || sessionId),
      };
      const botMsgId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : newId("bot");
      const placeholderMsg: ChatMessage = { id: botMsgId, role: "model", text: "", timestamp: new Date() };

      if (topicThreadId) {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === topicThreadId && msg.isTopic
              ? { ...msg, messages: [...(msg.messages ?? []), userMsg, placeholderMsg], isExpanded: true }
              : msg
          )
        );
      } else {
        setMessages(prev => [...prev, userMsg, placeholderMsg]);
      }

      const setActivity = (label: string) => {
        setContentGenPublishActivity(prev => ({ ...prev, [botMsgId]: label }));
      };

      setIsContentGenPublishing(true);
      setActivity(publishStepLabel("validate"));

      const result = await runContentGenPublishFromChat({
        assetId: studio.assetId,
        content: studio.draftPreview,
        mode,
        scheduledAt,
        onStep: step => setActivity(publishStepLabel(step)),
      });

      setContentGenPublishActivity(prev => {
        const next = { ...prev };
        delete next[botMsgId];
        return next;
      });
      setIsContentGenPublishing(false);

      if (result.ok) {
        const successText = successMessageForPublishResult(result);
        setContentGenPublishBotText(botMsgId, topicThreadId, successText);
        window.dispatchEvent(
          new CustomEvent(CONTENT_GEN_EVENTS.publishComplete, {
            detail: {
              mode: result.mode,
              assetId: studio.assetId,
              scheduledAt: result.mode === "schedule" ? result.scheduledAt : undefined,
            },
          })
        );
        return;
      }

      setContentGenPublishBotText(botMsgId, topicThreadId, result.message);
      window.dispatchEvent(
        new CustomEvent(CONTENT_GEN_EVENTS.publishFailed, {
          detail: { message: result.message },
        })
      );
    },
    [appendContentGenPublishHint, deriveCurrentScope, reviewMainSessionId, sessionId, setContentGenPublishBotText, setMessages]
  );

  const handleAdkPortfolioDiscard = useCallback(async () => {
    const card = useAdkPortfolioReviewStore.getState().getActiveCard();
    const baseline = useAdkPortfolioReviewStore.getState().getBaselinePortfolio();
    if (!baseline || !userId || !sessionId) return;
    setAdkReviewBusy(true);
    try {
      const merged = { ...usePortfolioStore.getState().portfolioData, [baseline.id]: baseline };
      usePortfolioStore.setState({ portfolioData: merged });
      queryClient.setQueryData(portfolioQueryKey, baseline);
      const warmResume = buildAdkResumeDataMap(useResumeStore.getState().resumeData);
      await syncSessionStateAction(userId, sessionId, {
        ...buildAdkPortfolioStateDelta(baseline),
        portfolio_data: buildAdkPortfolioDataMap(merged),
        resume_data: warmResume,
        current_resume: null,
      });
      if (card?.assistantMessageId && reviewMainSessionId) {
        await persistReviewDecisionForSession(userId, reviewMainSessionId, card.assistantMessageId, "discarded");
      }
      useAdkPortfolioReviewStore.getState().popReviewAfterDiscard();
      window.dispatchEvent(
        new CustomEvent("portfolio-adk-discard", {
          detail: { portfolioId: baseline.id, baselineJson: JSON.stringify(baseline) },
        })
      );
    } catch (err) {
      console.error("ADK portfolio discard failed:", err);
    } finally {
      setAdkReviewBusy(false);
    }
  }, [queryClient, reviewMainSessionId, sessionId, userId]);

  const linkedInReviewContentKey = useCallback((card: AdkLinkedInReviewCard): string => {
    const section = (Object.keys(card.highlights)[0] ?? "profile").trim().toLowerCase();
    if (section === "profile") return "linkedin:profile";
    return buildLinkedInImproveContentKey(LINKEDIN_ADK_PROFILE_KEY, section);
  }, []);

  const handleAdkLinkedInAccept = useCallback(async () => {
    const card = useAdkLinkedInReviewStore.getState().getActiveCard();
    const baseline = useAdkLinkedInReviewStore.getState().getBaselineProfile();
    setAdkReviewBusy(true);
    try {
      await useAdkLinkedInReviewStore.getState().acceptAndSave();
      if (card?.assistantMessageId && userId && reviewMainSessionId && baseline) {
        const snapshot = queryClient.getQueryData<LinkedInAnalysisSnapshot | null>(linkedinAnalysisQueryKey);
        const postProfile = snapshot ? mapSnapshotToLinkedInSessionProfile(snapshot) : baseline;
        const prePayload = buildLinkedInSnapshotPayload(card.profileKey, baseline);
        const postPayload = buildLinkedInSnapshotPayload(card.profileKey, postProfile);
        await persistAcceptSnapshotForSession(userId, reviewMainSessionId, {
          domain: "linkedin",
          contentKey: linkedInReviewContentKey(card),
          assistantMessageId: card.assistantMessageId,
          preAcceptPayload: prePayload,
          postAcceptPayload: postPayload,
          acceptedAt: new Date().toISOString(),
        });
        await syncAdkContentStateOnAccept(userId, reviewMainSessionId, postPayload);
        await persistReviewDecisionForSession(userId, reviewMainSessionId, card.assistantMessageId, "accepted");
      }
    } catch (err) {
      console.error("ADK LinkedIn accept failed:", err);
    } finally {
      setAdkReviewBusy(false);
    }
  }, [linkedInReviewContentKey, queryClient, reviewMainSessionId, userId]);

  const handleAdkLinkedInDiscard = useCallback(async () => {
    const card = useAdkLinkedInReviewStore.getState().getActiveCard();
    const baseline = useAdkLinkedInReviewStore.getState().getBaselineProfile();
    if (!baseline || !userId || !sessionId) return;
    setAdkReviewBusy(true);
    try {
      const previousSnapshot = queryClient.getQueryData<LinkedInAnalysisSnapshot | null>(linkedinAnalysisQueryKey);
      const restoredSnapshot = mapLinkedInSessionProfileToSnapshot(baseline, previousSnapshot);
      queryClient.setQueryData(linkedinAnalysisQueryKey, restoredSnapshot);
      const subSessionId = messages
        .filter(m => m.isTopic && m.subSessionAdkId)
        .find(m => m.messages?.some(sub => sub.id === card?.assistantMessageId))?.subSessionAdkId;
      const targetSessionId = subSessionId ?? sessionId;
      await syncSessionStateAction(userId, targetSessionId, buildAdkLinkedInStateDelta(restoredSnapshot));
      if (card?.assistantMessageId && reviewMainSessionId) {
        await persistReviewDecisionForSession(userId, reviewMainSessionId, card.assistantMessageId, "discarded");
      }
      useAdkLinkedInReviewStore.getState().popReviewAfterDiscard();
    } catch (err) {
      console.error("ADK LinkedIn discard failed:", err);
    } finally {
      setAdkReviewBusy(false);
    }
  }, [messages, queryClient, reviewMainSessionId, sessionId, userId]);

  const maybeGenerateMainSessionTitleFromThreadPrompt = useCallback(
    (prompt: string) => {
      const mainId = reviewMainSessionId || sessionId;
      if (!mainId) {
        return;
      }

      const row = getRegistryRow(mainId);
      if (row?.title && !isUntitledMainSessionTitle(row.title)) {
        delete seededTitlePromptByMainIdRef.current[mainId];
        return;
      }

      const { textWithoutMarker } = extractActionLabelFromRefineMessage(prompt);
      const trimmed = textWithoutMarker.trim();
      if (!trimmed || isHandoffPromptForTitle(trimmed)) {
        return;
      }

      if (!seededTitlePromptByMainIdRef.current[mainId]) {
        seededTitlePromptByMainIdRef.current[mainId] = trimmed;
      }
      const seededPrompt = seededTitlePromptByMainIdRef.current[mainId];
      void generateMainSessionTitleIfNeeded(mainId, seededPrompt, refreshSessions, userId);
    },
    [reviewMainSessionId, sessionId, refreshSessions]
  );

  const sendUserMessageToTopic = useCallback(
    async (topicId: string, text: string, actionMeta?: AssetActionMeta) => {
      const trimmed = text.trim();
      if (!trimmed || !canSend) return;
      ensureOptimisticUnibotActivity();
      const outboundText = withPersistedActionLabel(trimmed, actionMeta?.presetLabel);
      const topic = messages.find(m => m.id === topicId && m.isTopic);
      let subAdkId = topic?.subSessionAdkId;
      let effectiveTopicId = topicId;

      if (topic && !subAdkId && userId && reviewMainSessionId) {
        if (topic.topicKind === "application_asset") {
          const studio = useApplicationAssetStudioStore.getState();
          const topicRow = topic.subSessionAdkId ? getRegistryRow(topic.subSessionAdkId) : undefined;
          const topicAssetType =
            (actionMeta?.assetType as ApplicationAssetApiType | undefined) ??
            (topicRow?.section as ApplicationAssetApiType | null) ??
            studio.assetType ??
            "coverletter";
          const sub = await ensureApplicationAssetTopicSubSession({
            userId,
            mainAdkSessionId: reviewMainSessionId,
            assetType: topicAssetType,
            role: studio.role,
            company: studio.company,
            assetId: studio.assetId,
            title: topic.topicTitle ?? applicationAssetTopicTitle(topicAssetType, studio.company, studio.role, studio.assetId),
          });
          if (sub) {
            subAdkId = sub.subAdkSessionId;
            effectiveTopicId = sub.stableTopicId;
          }
        } else if (topic.topicKind === "content_gen") {
          const studio = useContentGenStudioStore.getState();
          const sub = await ensureContentGenTopicSubSession({
            userId,
            mainAdkSessionId: reviewMainSessionId,
            mode: topic.topicTitle?.includes("Topic") ? "topic" : "draft",
            topic: studio.topic || topic.topicTitle,
            assetId: studio.assetId,
            title: topic.topicTitle ?? buildLinkedInPostTitle(studio.topic),
          });
          if (sub) {
            subAdkId = sub.subAdkSessionId;
            effectiveTopicId = sub.stableTopicId;
          }
        }
      }

      const userMsg: ChatMessage = {
        id: newId("u"),
        role: "user",
        text: outboundText,
        timestamp: new Date(),
        assetActionMeta: actionMeta,
        contentScope:
          topic && (subAdkId || topic.subSessionAdkId)
            ? deriveCurrentScope(subAdkId ?? topic.subSessionAdkId ?? reviewMainSessionId ?? sessionId, "sub")
            : deriveCurrentScope(reviewMainSessionId || sessionId),
      };
      const botMsgId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : newId("bot");
      ensureOptimisticUnibotActivity({ assistantMessageId: botMsgId });
      const placeholderMsg: ChatMessage = { id: botMsgId, role: "model", text: "", timestamp: new Date() };
      setMessages(prev =>
        prev.map(msg => {
          if (msg.id !== topicId && msg.id !== effectiveTopicId) return msg;
          if (!msg.isTopic) return msg;
          return {
            ...msg,
            id: effectiveTopicId,
            subSessionAdkId: subAdkId ?? msg.subSessionAdkId,
            legacyTopic: false,
            messages: [...(msg.messages || []), userMsg, placeholderMsg],
            isExpanded: true,
          };
        })
      );
      pendingRetryRef.current = { text: outboundText, topicId: effectiveTopicId, botMsgId };
      try {
        await sendTopicMessage(outboundText, botMsgId, subAdkId ? { sessionIdOverride: subAdkId } : undefined);
        pendingRetryRef.current = null;
        maybeGenerateMainSessionTitleFromThreadPrompt(outboundText);
        if (userId && subAdkId) {
          void syncTopicUserInvocationIdsFromAdk(userId, subAdkId, effectiveTopicId, setMessages);
        }
      } catch (err) {
        handleStreamFailure(err, { text: outboundText, topicId: effectiveTopicId, botMsgId });
      }
    },
    [
      canSend,
      deriveCurrentScope,
      messages,
      sendTopicMessage,
      handleStreamFailure,
      setMessages,
      userId,
      reviewMainSessionId,
      sessionId,
      maybeGenerateMainSessionTitleFromThreadPrompt,
    ]
  );

  const handleConfirmRewind = useCallback(
    async (options: { revertEditorState: boolean; redirectAfterRewind?: boolean }) => {
      const pending = pendingRewindConfirmRef.current;
      if (!pending) return;

      closeRewindConfirm();

      try {
        await runUserMessageRewind(pending.ctx, { revertEditorState: options.revertEditorState });

        if (pending.mode === "edit") {
          setEditingUserMessage(null);
          if (pending.ctx.topicId) {
            await sendUserMessageToTopic(pending.ctx.topicId, pending.editDraftText, pending.assetActionMeta);
          } else {
            await sendMainMessage(pending.editDraftText);
          }
        }

        if (options.redirectAfterRewind) {
          const redirectScope = resolveRewindRedirectScope(pending.ctx.targetSessionId, pending.ctx.messageScope);
          const path = getRedirectPathForScope(redirectScope);
          if (path) router.push(path);
        }
      } catch (err) {
        setStreamError(formatUnibotStreamError(err, { source: "rewind" }));
      }
    },
    [closeRewindConfirm, runUserMessageRewind, sendUserMessageToTopic, sendMainMessage, setStreamError, router]
  );

  const renderEditableUserMessage = useCallback(
    (message: ChatMessage, targetSessionId: string, topicId: string | undefined, displayText: string, bubbleClassName: string) => {
      const messageKey = `${topicId ?? "main"}:${message.id}`;
      const isEditing = editingUserMessage?.messageKey === messageKey;

      if (isEditing && editingUserMessage) {
        return (
          <UnibotEditableUserBubble
            value={editingUserMessage.draftText}
            disabled={isRewinding || isAgentLoading}
            onChange={draftText => setEditingUserMessage(prev => (prev ? { ...prev, draftText } : prev))}
            onSubmit={() => void handleSubmitEditedUserMessage()}
            onCancel={() => setEditingUserMessage(null)}
          />
        );
      }

      return (
        <>
          <div className={bubbleClassName}>
            <span className="whitespace-pre-wrap">{displayText}</span>
          </div>
          {message.invocationId ? (
            <UnibotUserMessageToolbar
              disabled={!canRewind}
              onEdit={() => handleStartEditUserMessage(message, targetSessionId, topicId, displayText || message.text)}
              onDelete={() => void handleDeleteUserMessage(message, targetSessionId, topicId)}
            />
          ) : null}
        </>
      );
    },
    [
      canRewind,
      editingUserMessage,
      handleDeleteUserMessage,
      handleStartEditUserMessage,
      handleSubmitEditedUserMessage,
      isAgentLoading,
      isRewinding,
    ]
  );

  const sendApplicationAssetRefinement = useCallback(
    async (message: string, assetType: ApplicationAssetApiType, actionMeta?: AssetActionMeta, options?: { topicTitle?: string }) => {
      if (!userId || !sessionReady) {
        return;
      }
      setIsCollapsed(false);
      useApplicationAssetStudioStore.getState().setSelectionRefineLoading(true);

      const outboundText = withPersistedActionLabel(message, actionMeta?.presetLabel);

      const studio = useApplicationAssetStudioStore.getState();
      const mainId = reviewMainSessionId || sessionId;
      const sub = await ensureApplicationAssetTopicSubSession({
        userId,
        mainAdkSessionId: mainId,
        assetType,
        role: studio.role,
        company: studio.company,
        assetId: studio.assetId,
        title: options?.topicTitle ?? applicationAssetTopicTitle(assetType, studio.company, studio.role, studio.assetId),
      });
      if (!sub?.subAdkSessionId) {
        useApplicationAssetStudioStore.getState().setSelectionRefineLoading(false);
        throw new Error("Could not open a draft thread for this application asset.");
      }

      const existingTopic = findImproveTopic(messages, sub.subAdkSessionId);
      if (existingTopic) {
        const pendingReview = findPendingReviewInTopic(existingTopic, adkApplicationAssetReviewStack, adkApplicationAssetActiveReviewId);
        if (pendingReview) {
          useApplicationAssetStudioStore.getState().setSelectionRefineLoading(false);
          useApplicationAssetStudioStore.getState().clearRefineAnchor();
          handleActionItemSpamGuard({
            topicId: existingTopic.id,
            actionMessageId: pendingReview.messageId,
            kind: "review_card",
            nudgeKey: `application_asset_improve:${existingTopic.id}`,
            nudgeText: APPLICATION_ASSET_IMPROVE_NUDGE,
          });
          return;
        }
        const topicSubtitle = applicationAssetTopicSubtitle(studio.company, studio.role);
        setMessages(prev => prev.map(m => (m.id === existingTopic.id ? { ...m, topicSubtitle, isExpanded: true } : m)));
        await sendUserMessageToTopic(existingTopic.id, message, actionMeta);
        return;
      }

      const topicId = sub.stableTopicId;
      const userMsg: ChatMessage = {
        id: newId("u"),
        role: "user",
        text: outboundText,
        timestamp: new Date(),
        assetActionMeta: actionMeta,
        contentScope: deriveCurrentScope(reviewMainSessionId || sessionId),
      };
      const botMsgId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : newId("bot");
      const placeholderMsg: ChatMessage = {
        id: botMsgId,
        role: "model",
        text: "",
        timestamp: new Date(),
      };

      try {
        if (isAgentLoading || isLoadingHistory) {
          useApplicationAssetStudioStore.getState().setSelectionRefineLoading(false);
          return;
        }
        pendingRetryRef.current = { text: outboundText, topicId, botMsgId };
        const topicTitle = options?.topicTitle ?? applicationAssetTopicTitle(assetType, studio.company, studio.role, studio.assetId);
        const subAdkId = sub.subAdkSessionId;
        const stableTopicId = sub.stableTopicId;
        setMessages(prev => {
          const alreadyOpen = prev.some(m => m.id === stableTopicId && m.isTopic);
          if (alreadyOpen) {
            return prev.map(m =>
              m.id === stableTopicId
                ? {
                    ...m,
                    subSessionAdkId: subAdkId,
                    topicTitle: sub.title ?? topicTitle,
                    topicSubtitle: applicationAssetTopicSubtitle(studio.company, studio.role),
                    isExpanded: true,
                    messages: [...(m.messages ?? []), userMsg, placeholderMsg],
                  }
                : m
            );
          }
          const newTopic: ChatMessage = {
            id: stableTopicId,
            role: "model",
            text: "",
            timestamp: new Date(),
            isTopic: true,
            topicKind: "application_asset",
            topicTitle: sub.title ?? topicTitle,
            topicSubtitle: applicationAssetTopicSubtitle(studio.company, studio.role),
            isExpanded: true,
            subSessionAdkId: subAdkId,
            messages: [userMsg, placeholderMsg],
          };
          return insertTopicInMainThread(prev, newTopic);
        });
        await sendTopicMessage(outboundText, botMsgId, { sessionIdOverride: subAdkId });
        pendingRetryRef.current = null;
        maybeGenerateMainSessionTitleFromThreadPrompt(outboundText);
      } catch (err) {
        useApplicationAssetStudioStore.getState().setSelectionRefineLoading(false);
        handleStreamFailure(err, { text: outboundText, topicId, botMsgId });
      }
    },
    [
      userId,
      sessionReady,
      messages,
      sendUserMessageToTopic,
      setMessages,
      isAgentLoading,
      isLoadingHistory,
      reviewMainSessionId,
      sessionId,
      sendTopicMessage,
      handleStreamFailure,
      deriveCurrentScope,
      maybeGenerateMainSessionTitleFromThreadPrompt,
      adkApplicationAssetReviewStack,
      adkApplicationAssetActiveReviewId,
      handleActionItemSpamGuard,
    ]
  );

  const showSelectionSentPill = useCallback((label: string) => {
    if (selectionSentPillTimerRef.current) {
      clearTimeout(selectionSentPillTimerRef.current);
    }
    setSelectionSentPill(label);
    selectionSentPillTimerRef.current = setTimeout(() => {
      setSelectionSentPill(null);
      selectionSentPillTimerRef.current = null;
    }, 3000);
  }, []);

  useEffect(() => {
    const onSelectionRefine = (e: Event) => {
      const d = (e as CustomEvent<ApplicationAssetSelectionRefineDetail>).detail;
      if (!d?.message?.trim() || !d.assetType) {
        return;
      }
      const store = useApplicationAssetStudioStore.getState();
      const baselineDraft = d.baselineDraft?.trim() || store.acceptedContent.trim() || store.draftPreview.trim();
      store.clearSelection();
      store.setPendingRefineContext({
        assetType: d.assetType,
        selectedText: d.selectedText,
        presetLabel: d.presetLabel,
        kind: "preset",
        baselineDraft,
      });
      showSelectionSentPill(d.presetLabel);
      const meta: AssetActionMeta = {
        kind: "preset",
        assetType: d.assetType,
        presetLabel: d.presetLabel,
        selectedText: d.selectedText,
        prompt: d.message,
      };
      void sendApplicationAssetRefinement(d.message, d.assetType, meta);
    };

    const onSelectionFreeform = (e: Event) => {
      const d = (e as CustomEvent<ApplicationAssetSelectionFreeformDetail>).detail;
      if (!d?.selectedText?.trim() || !d.assetType) {
        return;
      }
      setIsCollapsed(false);
      const store = useApplicationAssetStudioStore.getState();
      const baselineDraft = d.baselineDraft?.trim() || store.acceptedContent.trim() || store.draftPreview.trim();
      store.clearSelection();
      store.setPendingRefineContext({
        assetType: d.assetType,
        selectedText: d.selectedText.trim(),
        kind: "freeform",
        baselineDraft,
      });
      setSelectionQuoteContext({ assetType: d.assetType, selectedText: d.selectedText.trim() });
    };

    const onOpenImprove = (e: Event) => {
      const d = (e as CustomEvent<ApplicationAssetOpenImproveDetail>).detail;
      if (!d?.assetType || !d.assetId) {
        return;
      }
      setIsCollapsed(false);
      setSelectionQuoteContext(null);

      useApplicationAssetStudioStore.getState().syncFromStudio({
        assetType: d.assetType,
        assetId: d.assetId,
        role: d.role,
        company: d.company,
        jobDescription: d.jobDescription,
        contactName: d.contactName ?? "",
        draftPreview: d.content,
        acceptedContent: d.content,
      });

      if (d.autoSend && d.initialPrompt?.trim()) {
        const message = buildFullDocumentFreeformUserMessage(d.assetType, d.initialPrompt.trim());
        const meta: AssetActionMeta = {
          kind: "freeform",
          assetType: d.assetType,
          selectedText: "",
          prompt: message,
        };
        void sendApplicationAssetRefinement(message, d.assetType, meta, {
          topicTitle: applicationAssetImproveTopicTitle(d.assetType, d.assetId),
        });
        return;
      }

      setFullDocumentImproveContext({
        assetType: d.assetType,
        assetId: d.assetId,
        role: d.role,
        company: d.company,
      });
      setUsedDocumentImproveIds(new Set());
      useApplicationAssetStudioStore.getState().clearConsumedSelectionSuggestions();
      setResumeFullImproveContext(null);
    };

    const onResumeOpenFullImprove = (e: Event) => {
      const d = (e as CustomEvent<ResumeOpenFullImproveDetail>).detail;
      if (!d?.resumeId?.trim() || !d.fromPrepareApplication) {
        return;
      }
      setIsCollapsed(false);
      setSelectionQuoteContext(null);
      setFullDocumentImproveContext(null);
      setResumeFullImproveContext({
        resumeId: d.resumeId.trim(),
        role: d.role?.trim() ?? "",
        company: d.company?.trim() ?? "",
      });
    };

    window.addEventListener(APPLICATION_ASSET_EVENTS.selectionRefine, onSelectionRefine);
    window.addEventListener(APPLICATION_ASSET_EVENTS.selectionFreeform, onSelectionFreeform);
    window.addEventListener(APPLICATION_ASSET_EVENTS.openImprove, onOpenImprove);
    window.addEventListener(RESUME_OPEN_FULL_IMPROVE_EVENT, onResumeOpenFullImprove);
    return () => {
      window.removeEventListener(APPLICATION_ASSET_EVENTS.selectionRefine, onSelectionRefine);
      window.removeEventListener(APPLICATION_ASSET_EVENTS.selectionFreeform, onSelectionFreeform);
      window.removeEventListener(APPLICATION_ASSET_EVENTS.openImprove, onOpenImprove);
      window.removeEventListener(RESUME_OPEN_FULL_IMPROVE_EVENT, onResumeOpenFullImprove);
    };
  }, [sendApplicationAssetRefinement, showSelectionSentPill]);

  const loadDocumentImproveSuggestions = useCallback(
    async (ctx: { assetType: ApplicationAssetApiType; assetId: string; role: string; company: string }, excludeLabels: string[] = []) => {
      const fetchKey = `${ctx.assetId}:${excludeLabels.join("|")}`;
      documentImproveFetchKeyRef.current = fetchKey;
      setDocumentImproveSuggestionsLoading(true);
      const studio = useApplicationAssetStudioStore.getState();
      const documentBody = studio.acceptedContent.trim() || studio.draftPreview.trim();
      try {
        const result = await fetchDocumentImproveSuggestions({
          type: ctx.assetType,
          documentBody,
          role: ctx.role,
          company: ctx.company,
          jobDescription: studio.jobDescription,
          contactName: studio.contactName,
          assetId: ctx.assetId,
          excludeLabels,
        });
        if (documentImproveFetchKeyRef.current !== fetchKey) return;
        setDocumentImprovePool(prev => {
          const merged = [...prev];
          for (const preset of result.data.map(suggestionToFullDocumentPreset)) {
            if (!merged.some(item => item.id === preset.id)) {
              merged.push(preset);
            }
          }
          return merged.length > 0 ? merged : result.data.map(suggestionToFullDocumentPreset);
        });
      } catch {
        if (documentImproveFetchKeyRef.current !== fetchKey) return;
        setDocumentImprovePool(APPLICATION_ASSET_FULL_DOCUMENT_IMPROVE_FALLBACK[ctx.assetType]);
      } finally {
        if (documentImproveFetchKeyRef.current === fetchKey) {
          setDocumentImproveSuggestionsLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    if (!fullDocumentImproveContext) {
      setDocumentImprovePool([]);
      setDocumentImproveSuggestionsLoading(false);
      documentImproveFetchKeyRef.current = null;
      return;
    }
    void loadDocumentImproveSuggestions(fullDocumentImproveContext);
  }, [fullDocumentImproveContext, loadDocumentImproveSuggestions]);

  useEffect(() => {
    if (!fullDocumentImproveContext || documentImproveSuggestionsLoading) return;
    const pool =
      documentImprovePool.length > 0
        ? documentImprovePool
        : APPLICATION_ASSET_FULL_DOCUMENT_IMPROVE_FALLBACK[fullDocumentImproveContext.assetType];
    const unused = pool.filter(preset => !usedDocumentImproveIds.has(preset.id));
    if (unused.length >= 2 || usedDocumentImproveIds.size < pool.length) return;
    const excludeLabels = pool.map(preset => preset.label);
    void loadDocumentImproveSuggestions(fullDocumentImproveContext, excludeLabels);
  }, [
    documentImprovePool,
    documentImproveSuggestionsLoading,
    fullDocumentImproveContext,
    loadDocumentImproveSuggestions,
    usedDocumentImproveIds,
  ]);

  const visibleDocumentImprovePresets = useMemo(() => {
    if (!fullDocumentImproveContext) return [];
    const pool =
      documentImprovePool.length > 0
        ? documentImprovePool
        : APPLICATION_ASSET_FULL_DOCUMENT_IMPROVE_FALLBACK[fullDocumentImproveContext.assetType];
    return pool.filter(preset => !usedDocumentImproveIds.has(preset.id)).slice(0, 2);
  }, [documentImprovePool, fullDocumentImproveContext, usedDocumentImproveIds]);

  const handleFullDocumentPreset = useCallback(
    (preset: FullDocumentImprovePreset) => {
      if (!fullDocumentImproveContext) {
        return;
      }
      const { assetType } = fullDocumentImproveContext;
      setUsedDocumentImproveIds(prev => new Set([...prev, preset.id]));
      const message = buildFullDocumentImproveMessage(assetType, preset.instruction);
      showSelectionSentPill(preset.label);
      const meta: AssetActionMeta = {
        kind: "preset",
        assetType,
        presetLabel: preset.label,
        selectedText: "",
        prompt: message,
      };
      void sendApplicationAssetRefinement(message, assetType, meta);
    },
    [fullDocumentImproveContext, sendApplicationAssetRefinement, showSelectionSentPill]
  );

  const handleResumeFullImprovePreset = useCallback(
    (preset: ResumeFullImprovePreset) => {
      if (!resumeFullImproveContext) {
        return;
      }
      showSelectionSentPill(preset.label);
      void sendMainMessage(preset.instruction, {
        excludeFromTitleGeneration: true,
        patchResumeId: resumeFullImproveContext.resumeId,
      });
    },
    [resumeFullImproveContext, sendMainMessage, showSelectionSentPill]
  );

  useEffect(() => {
    if (!showPrepareImproveFooter) {
      return;
    }
    const timer = window.setTimeout(() => {
      footerInputCardRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [showPrepareImproveFooter, fullDocumentImproveContext, resumeFullImproveContext]);

  useEffect(() => {
    return () => {
      if (selectionSentPillTimerRef.current) {
        clearTimeout(selectionSentPillTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!input && mainInputRef.current) {
      resetTextareaHeight(mainInputRef.current);
    }
  }, [input]);

  useEffect(() => {
    for (const [topicId, value] of Object.entries(topicInputs)) {
      if (!value) {
        const el = topicInputRefs.current[topicId];
        if (el) resetTextareaHeight(el);
      }
    }
  }, [topicInputs]);

  const handleSend = useCallback(
    async (overrideText?: string, options?: { afterRetry?: boolean }) => {
      const textToSend = (overrideText ?? input).trim();
      if (!textToSend || !canSendMessage) return;
      if (!options?.afterRetry && streamError) return;
      clearStreamError();

      if (fullDocumentImproveContext && isStudioPrepareImproveRoute) {
        const improveCtx = fullDocumentImproveContext;
        const message = buildFullDocumentFreeformUserMessage(improveCtx.assetType, textToSend);
        const meta: AssetActionMeta = {
          kind: "freeform",
          assetType: improveCtx.assetType,
          selectedText: "",
          prompt: message,
        };
        setInput("");
        await sendApplicationAssetRefinement(message, improveCtx.assetType, meta);
        return;
      }

      if (resumeFullImproveContext && isResumePrepareImproveRoute) {
        setInput("");
        await sendMainMessage(textToSend, {
          excludeFromTitleGeneration: true,
          patchResumeId: resumeFullImproveContext.resumeId,
        });
        return;
      }

      if (selectionQuoteContext) {
        const quoteCtx = selectionQuoteContext;
        const message = buildFreeformSelectionUserMessage(quoteCtx.assetType, quoteCtx.selectedText, textToSend);
        const meta: AssetActionMeta = {
          kind: "freeform",
          assetType: quoteCtx.assetType,
          selectedText: quoteCtx.selectedText,
          presetLabel: IMPROVE_WITH_UNIBOT_ACTION_LABEL,
          prompt: message,
        };
        setSelectionQuoteContext(null);
        setInput("");
        await sendApplicationAssetRefinement(message, quoteCtx.assetType, meta);
        return;
      }

      if (improveReplyTopicId && improveContextTopic) {
        setInput("");
        await sendUserMessageToTopic(improveReplyTopicId, textToSend);
        return;
      }

      const publishIntent = parsePublishIntent(textToSend);
      if (publishIntent) {
        setInput("");
        void handleContentGenPublishIntent(publishIntent.mode, publishIntent.scheduledAt, null, {
          background: true,
          userText: textToSend,
        });
        return;
      }

      const topicIntent = parseContentGenTopicIntent(textToSend);
      if (topicIntent) {
        setInput("");
        setMessages(prev => [
          ...prev,
          {
            id: newId("u"),
            role: "user",
            text: textToSend,
            timestamp: new Date(),
          },
        ]);
        window.dispatchEvent(
          new CustomEvent(CONTENT_GEN_EVENTS.openTopic, {
            detail: {
              seedTopic: topicIntent.seedTopic,
              requestKey: Date.now(),
            },
          })
        );
        return;
      }

      setInput("");
      const mainId = currentMainSessionId ?? sessionId;
      let assistantMsgId: string | undefined;
      try {
        const { assistantId } = await sendMainMessage(textToSend);
        assistantMsgId = assistantId || undefined;
        pendingRetryRef.current = { text: textToSend, botMsgId: assistantMsgId };
        pendingRetryRef.current = null;
        if (!isHandoffPromptForTitle(textToSend)) {
          markMainSessionHasUserPrompt(userId, mainId);
          void generateMainSessionTitleIfNeeded(mainId, textToSend, refreshSessions, userId);
        }
      } catch (err) {
        const fromErr =
          err && typeof err === "object" && "assistantMessageId" in err
            ? String((err as { assistantMessageId?: string }).assistantMessageId)
            : undefined;
        handleStreamFailure(err, { text: textToSend, botMsgId: assistantMsgId ?? fromErr });
      }
    },
    [
      input,
      canSendMessage,
      streamError,
      clearStreamError,
      improveReplyTopicId,
      improveContextTopic,
      sendUserMessageToTopic,
      sendMainMessage,
      handleStreamFailure,
      handleContentGenPublishIntent,
      currentMainSessionId,
      sessionId,
      userId,
      refreshSessions,
      setMessages,
      setInput,
      selectionQuoteContext,
      fullDocumentImproveContext,
      resumeFullImproveContext,
      isResumePrepareImproveRoute,
      isStudioPrepareImproveRoute,
      sendApplicationAssetRefinement,
    ]
  );

  const retryFailedStream = useCallback(() => {
    const pending = pendingRetryRef.current;
    if (!pending || !userId || !sessionReady || isAgentLoading || isLoadingHistory) return;
    clearStreamError();

    const runRetry = async () => {
      if (pending.botMsgId) {
        setMessages(prev => resetAssistantTurnForRetryInTree(prev, pending.botMsgId!));

        if (pending.topicId) {
          const topic = messages.find(m => m.id === pending.topicId && m.isTopic);
          const subAdkId = topic?.subSessionAdkId;
          try {
            await sendTopicMessage(pending.text, pending.botMsgId, subAdkId ? { sessionIdOverride: subAdkId } : undefined);
            pendingRetryRef.current = null;
          } catch (err) {
            handleStreamFailure(err, { text: pending.text, topicId: pending.topicId, botMsgId: pending.botMsgId });
          }
          return;
        }

        try {
          await sendMainMessage(pending.text, { retryAssistantId: pending.botMsgId });
          pendingRetryRef.current = null;
        } catch (err) {
          const fromErr =
            err && typeof err === "object" && "assistantMessageId" in err
              ? String((err as { assistantMessageId?: string }).assistantMessageId)
              : undefined;
          handleStreamFailure(err, { text: pending.text, botMsgId: pending.botMsgId ?? fromErr });
        }
        return;
      }

      void handleSend(pending.text, { afterRetry: true });
    };

    void runRetry();
  }, [
    userId,
    sessionReady,
    isAgentLoading,
    isLoadingHistory,
    clearStreamError,
    handleSend,
    messages,
    setMessages,
    sendTopicMessage,
    sendMainMessage,
    handleStreamFailure,
  ]);

  const onNewChat = async () => {
    if (!canUseHistory) return;
    try {
      await handleCreateNewSession({ kind: "main" });
      await refreshSessions();
      setHistoryPanelOpen(false);
      setImproveReplyTopicId(null);
      clearStreamError();
      pendingRetryRef.current = null;
    } catch {
      /* sessionError surfaced by provider */
    }
  };

  const onDeleteSession = async (sessionIdToDelete: string) => {
    if (coachActAsReadOnly || !canUseHistory || isAgentLoading) return;
    setIsDeletingSession(true);
    try {
      await handleDeleteSession(sessionIdToDelete);
      await refreshSessions();
      setImproveReplyTopicId(null);
      setPendingDeleteSession(null);
    } catch {
      /* sessionError surfaced by provider */
    } finally {
      setIsDeletingSession(false);
    }
  };

  const onDeleteSubThread = async (item: { topicId: string; subAdkSessionId?: string }) => {
    if (coachActAsReadOnly) return;
    if (!canUseHistory || isAgentLoading) return;
    setIsDeletingSession(true);
    try {
      const subId = item.subAdkSessionId?.trim();
      if (subId) {
        if (sessionId === subId && currentMainSessionId) {
          await handleSessionSwitch(currentMainSessionId);
        }
        await handleDeleteSession(subId);
      }
      setMessages(prev => prev.filter(m => m.id !== item.topicId));
      if (improveReplyTopicId === item.topicId) {
        setImproveReplyTopicId(null);
      }
      setPendingDeleteSession(null);
      await refreshSessions();
    } catch {
      /* sessionError surfaced by provider */
    } finally {
      setIsDeletingSession(false);
    }
  };

  const sendTopicCardMessage = useCallback(
    async (topicId: string, text: string) => {
      if (!text.trim() || !canSend) return;

      const topicCard = messages.find(m => m.id === topicId && m.isTopic);
      const publishIntent = parsePublishIntent(text);
      if (publishIntent && topicCard?.topicKind === "content_gen") {
        void handleContentGenPublishIntent(publishIntent.mode, publishIntent.scheduledAt, topicId, {
          background: true,
          userText: text,
        });
        return;
      }

      if (topicCard?.topicKind === "content_gen") {
        const draftIntent = parseGenerateDraftRequest(text);
        if (draftIntent) {
          const studio = useContentGenStudioStore.getState();
          const resolvedTopic = (draftIntent.topic ?? studio.topic).trim();
          const funnel = contentGenFunnelRef.current ?? studio.funnel;

          if (resolvedTopic) {
            if (draftIntent.topic) {
              contentGenAppliedTopicRef.current = resolvedTopic;
              window.dispatchEvent(
                new CustomEvent(CONTENT_GEN_EVENTS.applyTopic, {
                  detail: { topic: resolvedTopic, funnel: funnel ?? undefined },
                })
              );
            } else if (resolvedTopic) {
              contentGenAppliedTopicRef.current = resolvedTopic;
            }

            if (shouldForceDjangoContentGenDraft()) {
              window.dispatchEvent(
                new CustomEvent(CONTENT_GEN_EVENTS.requestDraft, {
                  detail: {
                    topic: resolvedTopic,
                    funnel,
                    mood: useContentGenStudioStore.getState().mood,
                  },
                })
              );
              return;
            }
          }
        }
      }

      const userMsg: ChatMessage = {
        id: newId("u"),
        role: "user",
        text: text.trim(),
        timestamp: new Date(),
        contentScope: topicCard?.subSessionAdkId
          ? deriveCurrentScope(topicCard.subSessionAdkId, "sub")
          : deriveCurrentScope(reviewMainSessionId || sessionId),
      };

      const botMsgId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : newId("bot");

      const placeholderMsg: ChatMessage = {
        id: botMsgId,
        role: "model",
        text: "",
        timestamp: new Date(),
      };

      setMessages(prev =>
        prev.map(msg => {
          if (msg.id === topicId && msg.isTopic) {
            return {
              ...msg,
              messages: [...(msg.messages || []), userMsg, placeholderMsg],
            };
          }
          return msg;
        })
      );

      pendingRetryRef.current = { text: text.trim(), topicId, botMsgId };
      try {
        const subAdkId = topicCard?.subSessionAdkId?.trim();
        await sendTopicMessage(text.trim(), botMsgId, subAdkId ? { sessionIdOverride: subAdkId } : undefined);
        pendingRetryRef.current = null;
      } catch (err) {
        handleStreamFailure(err, { text: text.trim(), topicId, botMsgId });
      }
    },
    [
      canSend,
      deriveCurrentScope,
      handleContentGenPublishIntent,
      messages,
      sendTopicMessage,
      handleStreamFailure,
      setMessages,
      reviewMainSessionId,
      sessionId,
    ]
  );

  const handleContentGenImprove = useCallback(
    async (topicId: string | null) => {
      const agentText = buildContentGenImproveBootstrap();
      if (topicId) {
        await sendTopicCardMessage(topicId, agentText);
        return;
      }

      window.dispatchEvent(
        new CustomEvent(CONTENT_GEN_EVENTS.openTopic, {
          detail: { improveDraft: true, requestKey: Date.now() },
        })
      );
    },
    [sendTopicCardMessage]
  );

  const handleApplyContentGenTopic = useCallback(
    (topicId: string, title: string, funnel: ContentGenFunnel | null, assistantMessageId?: string) => {
      contentGenAppliedTopicRef.current = title.trim();
      clearTopicPickerSpamCounts(topicId);
      const topicCard = messages.find(m => m.id === topicId && m.isTopic);
      const turnFunnel =
        funnel ??
        (assistantMessageId ? resolveFunnelForPlannerModelMessage(topicCard, assistantMessageId) : null) ??
        contentGenFunnelRef.current;
      if (turnFunnel) {
        syncContentGenFunnel(turnFunnel);
      }
      const resolvedFunnel = turnFunnel ?? undefined;
      if (assistantMessageId) {
        contentGenDismissedChipsRef.current.add(assistantMessageId);
      }
      setHighlightedActionItem(null);
      window.dispatchEvent(
        new CustomEvent(CONTENT_GEN_EVENTS.applyTopic, {
          detail: { topic: title, funnel: resolvedFunnel, flashInput: true },
        })
      );
      setMessages(prev => prev.map(msg => (msg.id === topicId ? { ...msg, isExpanded: false } : msg)));
    },
    [setMessages, clearTopicPickerSpamCounts, syncContentGenFunnel, messages]
  );

  const handleContentGenAction = useCallback(
    (action: ContentGenPlannerAction, topicId?: string) => {
      const studio = useContentGenStudioStore.getState();
      const funnel = contentGenFunnelRef.current ?? studio.funnel;

      if (action.id === "generate_draft") {
        let topic = "";

        if (topicId) {
          const threadCard = messages.find(m => m.id === topicId && m.isTopic);
          const threadMessages = threadCard?.messages ?? [];
          const confirmedTopic = extractConfirmedTopicFromThread(threadMessages);
          if (confirmedTopic) {
            topic = confirmedTopic;
          }
        }

        if (!topic) {
          topic = contentGenAppliedTopicRef.current?.trim() || studio.topic.trim();
        }

        if (!topic) {
          return;
        }

        contentGenAppliedTopicRef.current = topic;
        window.dispatchEvent(
          new CustomEvent(CONTENT_GEN_EVENTS.applyTopic, {
            detail: { topic, funnel: funnel ?? undefined },
          })
        );
        window.dispatchEvent(
          new CustomEvent(CONTENT_GEN_EVENTS.requestDraft, {
            detail: { topic, funnel, mood: useContentGenStudioStore.getState().mood },
          })
        );
        return;
      }

      if (action.id === "post_now") {
        handleContentGenPublishIntent("post_now", undefined, topicId ?? null);
        return;
      }

      if (action.id === "schedule") {
        handleContentGenPublishIntent("schedule", action.scheduledAt, topicId ?? null);
      }
    },
    [handleContentGenPublishIntent, messages]
  );

  const handleContentGenAffirmation = useCallback(
    (topicId: string, label: string, assistantMessageId?: string, funnel?: ContentGenFunnel | null) => {
      clearTopicPickerSpamCounts(topicId);
      const topicCard = messages.find(m => m.id === topicId && m.isTopic);
      const turnFunnel = funnel ?? (assistantMessageId ? resolveFunnelForPlannerModelMessage(topicCard, assistantMessageId) : null);
      if (turnFunnel) {
        syncContentGenFunnel(turnFunnel);
      }
      if (assistantMessageId) {
        contentGenDismissedChipsRef.current.add(assistantMessageId);
        setMessages(prev => [...prev]);
      }
      void sendTopicCardMessage(topicId, label);
    },
    [sendTopicCardMessage, setMessages, clearTopicPickerSpamCounts, syncContentGenFunnel, messages]
  );

  const handleMainContentGenAffirmation = useCallback(
    (label: string, assistantMessageId?: string) => {
      if (assistantMessageId) {
        contentGenDismissedChipsRef.current.add(assistantMessageId);
        setMessages(prev => [...prev]);
      }
      const funnel = useContentGenStudioStore.getState().funnel ?? contentGenFunnelRef.current ?? "top";
      contentGenFunnelRef.current = funnel;
      window.dispatchEvent(
        new CustomEvent(CONTENT_GEN_EVENTS.openTopic, {
          detail: { followUpText: label, funnel, requestKey: Date.now() },
        })
      );
    },
    [setMessages]
  );

  const handleMainApplyContentGenTopic = useCallback(
    (title: string, funnel: ContentGenFunnel | null, assistantMessageId?: string) => {
      const resolvedFunnel = funnel ?? contentGenFunnelRef.current ?? undefined;
      if (assistantMessageId) {
        contentGenDismissedChipsRef.current.add(assistantMessageId);
        setMessages(prev => [...prev]);
      }
      window.dispatchEvent(
        new CustomEvent(CONTENT_GEN_EVENTS.applyTopic, {
          detail: { topic: title, funnel: resolvedFunnel, flashInput: true },
        })
      );
    },
    [setMessages]
  );

  const handleTopicSend = async (topicId: string) => {
    const topicInput = topicInputs[topicId];
    if (!topicInput?.trim() || !canSend) return;
    setTopicInputs(prev => ({ ...prev, [topicId]: "" }));

    const topic = messages.find(m => m.id === topicId && m.isTopic);
    if (topic?.topicKind === "content_gen") {
      await sendTopicCardMessage(topicId, topicInput);
      return;
    }
    await sendUserMessageToTopic(topicId, topicInput);
  };

  const selectImproveTopic = (topicId: string) => {
    markAtsFixBatchFocusOverride(atsFixBatchRef.current);
    syncAtsFixBatchUi();
    setImproveReplyTopicId(topicId);
    setMessages(prev => prev.map(msg => (msg.id === topicId && msg.isTopic ? { ...msg, isExpanded: true } : msg)));
    setHistoryPanelOpen(false);
  };

  const selectImproveSubFromRegistry = async (subAdkSessionId: string, title: string) => {
    const topicId = topicIdForSubSession(subAdkSessionId);
    if (!findImproveTopic(messages, subAdkSessionId)) {
      const nested = await loadSubSessionChatMessages(userId, subAdkSessionId);
      setMessages(prev => [
        ...prev,
        {
          id: topicId,
          role: "model",
          text: "",
          timestamp: new Date(),
          isTopic: true,
          topicTitle: title,
          isExpanded: true,
          subSessionAdkId: subAdkSessionId,
          messages: nested,
        },
      ]);
    }
    selectImproveTopic(topicId);
  };

  const toggleTopic = (id: string) => {
    setMessages(prev => prev.map(msg => (msg.id === id ? { ...msg, isExpanded: !msg.isExpanded } : msg)));
  };

  const deleteTopic = (id: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
    if (improveReplyTopicId === id) setImproveReplyTopicId(null);
  };

  const startResize = (event: React.PointerEvent) => {
    event.preventDefault();
    setIsResizing(true);
    const startX = event.clientX;
    const startW = sidebarWidthRef.current;
    const cleanup = () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      setIsResizing(false);
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointercancel", onUp);
    };
    const onMove = (ev: PointerEvent) => {
      const maxPx = window.innerWidth * SIDEBAR_WIDTH_MAX_PCT;
      const collapsePx = window.innerWidth * SIDEBAR_WIDTH_COLLAPSE_PCT;
      const next = startW + (ev.clientX - startX);
      if (next < collapsePx) {
        setIsCollapsed(true);
        cleanup();
        return;
      }
      const clamped = Math.min(maxPx, next);
      setSidebarWidth(clamped);
      sidebarWidthRef.current = clamped;
    };
    const onUp = () => cleanup();
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
    document.addEventListener("pointercancel", onUp);
  };

  const startResizeFromCollapsed = (event: React.PointerEvent) => {
    event.preventDefault();
    setIsResizing(true);
    let expandedDuringDrag = false;
    const cleanup = () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      setIsResizing(false);
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointercancel", onUp);
    };
    const onMove = (ev: PointerEvent) => {
      const maxPx = window.innerWidth * SIDEBAR_WIDTH_MAX_PCT;
      const collapsePx = window.innerWidth * SIDEBAR_WIDTH_COLLAPSE_PCT;
      const next = ev.clientX;
      if (!expandedDuringDrag) {
        if (next >= collapsePx) {
          expandedDuringDrag = true;
          setIsCollapsed(false);
          const w = Math.min(maxPx, next);
          setSidebarWidth(w);
          sidebarWidthRef.current = w;
        }
        return;
      }
      if (next < collapsePx) {
        setIsCollapsed(true);
        cleanup();
        return;
      }
      const clamped = Math.min(maxPx, next);
      setSidebarWidth(clamped);
      sidebarWidthRef.current = clamped;
    };
    const onUp = () => {
      if (expandedDuringDrag && sidebarWidthRef.current < window.innerWidth * SIDEBAR_WIDTH_COLLAPSE_PCT) setIsCollapsed(true);
      cleanup();
    };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
    document.addEventListener("pointercancel", onUp);
  };

  const rewindStateAssessment = pendingRewindConfirm
    ? assessRewindStateRevert(pendingRewindConfirm.ctx.messageScope, pendingRewindConfirm.ctx.scopeMatch)
    : null;

  const rewindConfirmDialog = pendingRewindConfirm ? (
    <AdkRewindConfirmDialog
      open
      mode={pendingRewindConfirm.mode}
      previewText={pendingRewindConfirm.mode === "edit" ? pendingRewindConfirm.editDraftText : pendingRewindConfirm.ctx.previewText}
      isSubmitting={isRewinding}
      scopeMatch={pendingRewindConfirm.ctx.scopeMatch}
      featureLabel={getContentScopeFeatureLabel(pendingRewindConfirm.ctx.messageScope)}
      redirectTargetLabel={getContentScopeRedirectLabel(pendingRewindConfirm.ctx.messageScope)}
      canOfferStateRevert={rewindStateAssessment?.canOfferStateRevert ?? false}
      showHeavyWorkWarning={rewindStateAssessment?.showHeavyWorkWarning ?? false}
      onClose={closeRewindConfirm}
      onConfirm={options => void handleConfirmRewind(options)}
    />
  ) : null;

  if (isCollapsed) {
    return (
      <>
        {rewindConfirmDialog}
        <div className="relative flex h-full w-16 shrink-0 flex-col items-center border-r border-slate-200 bg-white py-4 transition-all duration-300 dark:border-white/5 dark:bg-slate-950 z-20">
          <button
            type="button"
            onClick={() => setIsCollapsed(false)}
            className="mb-2 flex h-16 w-full items-center justify-center rounded-lg text-brand-600 transition-colors hover:bg-slate-50 dark:text-brand-400 dark:hover:bg-slate-800"
            aria-label="Expand Unibot sidebar"
          >
            <UnimadUMark size={26} />
          </button>
          <button
            type="button"
            onClick={() => setIsCollapsed(false)}
            className="p-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl"
            aria-label="Expand sidebar"
          >
            <Maximize2 size={20} />
          </button>
          <PanelResizeHandle onPointerDown={startResizeFromCollapsed} label="Drag to resize Unibot" />
        </div>
      </>
    );
  }

  return (
    <div
      className={`relative flex h-full min-h-0 shrink-0 flex-col border-r border-slate-200 bg-white shadow-sm dark:border-white/5 dark:bg-slate-950 z-20 ${
        isResizing ? "" : "transition-[width] duration-200 ease-out"
      }`}
      style={{ width: sidebarWidth }}
    >
      <div className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-100 bg-white/80 px-4 backdrop-blur-md dark:border-white/5 dark:bg-slate-950/80">
        <Logo className="h-6 w-auto text-brand-600 dark:text-brand-400" />
        <button
          type="button"
          onClick={() => setIsCollapsed(true)}
          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <Minimize2 size={16} />
        </button>
      </div>

      <div
        ref={messagesScrollRef}
        className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto overflow-x-hidden bg-white p-4 dark:bg-slate-950 scrollbar-on-hover"
      >
        {!userId && <p className="text-[11px] text-slate-400 px-1">Sign in to chat with Unibot.</p>}
        {userId && !sessionReady && (
          <p className="text-[11px] text-slate-400 px-1">
            {sessionError ? `Assistant: ${sessionError}` : isLoadingHistory ? "Loading chat…" : "Connecting to assistant…"}
          </p>
        )}

        {(() => {
          const seenTopicIds = new Set<string>();
          return messages.filter(msg => {
            if (!msg.isTopic) return true;
            if (seenTopicIds.has(msg.id)) return false;
            seenTopicIds.add(msg.id);
            return true;
          });
        })().map(msg => {
          if (msg.isTopic) {
            const expanded = msg.isExpanded !== false;
            const subRow = msg.subSessionAdkId ? getRegistryRow(msg.subSessionAdkId) : undefined;
            const displayTitle = displayTitleForSubSession(subRow, msg.topicTitle);
            const studio = useApplicationAssetStudioStore.getState();
            const displaySubtitle =
              msg.topicKind === "application_asset"
                ? resolveApplicationAssetTopicDisplaySubtitle({
                    topicSubtitle: msg.topicSubtitle,
                    subRow,
                    studioRole: studio.role,
                    studioCompany: studio.company,
                    studioAssetId: studio.assetId,
                  })
                : (msg.topicSubtitle ?? (subRow ? deriveSubSessionSubtitle(subRow) : undefined));
            const goTarget = subRow ? resolveSubThreadNavTarget(subRow) : null;
            const showGoToAsset = expanded && goTarget != null && !isSubThreadNavTargetActive(goTarget, pathname, searchParams);
            const nudgeTopicGoTo = () => {
              if (goTarget) nudgeGoToFeature(goTarget.href);
            };
            const gateAwaitingHint = buildAtsGateAwaitingHint(
              Boolean(atsFixBatchUi?.active),
              atsFixBatchUi?.gateTopicId ?? null,
              msg.id,
              messages
            );
            return (
              <div
                key={msg.id}
                className="my-4 ml-1 w-full border-l-2 border-brand-500 pl-4 animate-in fade-in slide-in-from-bottom-2 dark:border-brand-400"
              >
                <button
                  type="button"
                  onClick={() => toggleTopic(msg.id)}
                  aria-expanded={expanded}
                  className="group -mx-1 flex w-full items-center justify-between gap-2 rounded-lg px-1 py-2 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60"
                >
                  <span
                    className="truncate text-xs font-medium uppercase tracking-wide text-slate-500 transition-colors group-hover:text-brand-600 dark:text-slate-400"
                    title={displaySubtitle}
                  >
                    {displayTitle}
                    {displaySubtitle ? (
                      <span className="mt-0.5 block truncate text-[10px] font-normal normal-case tracking-normal text-slate-400 dark:text-slate-500">
                        {displaySubtitle}
                      </span>
                    ) : null}
                  </span>
                  {expanded ? (
                    <ChevronUp
                      size={16}
                      className="shrink-0 text-slate-400 transition-colors group-hover:text-slate-600 dark:group-hover:text-slate-300"
                      aria-hidden
                    />
                  ) : (
                    <ChevronDown
                      size={16}
                      className="shrink-0 text-slate-400 transition-colors group-hover:text-slate-600 dark:group-hover:text-slate-300"
                      aria-hidden
                    />
                  )}
                </button>

                {expanded && (
                  <div className="mt-2">
                    {showGoToAsset && goTarget ? (
                      <SubThreadGoToAssetLink
                        target={goTarget}
                        highlighted={highlightedGoToHref === goTarget.href}
                        onNavigate={href => router.push(href)}
                      />
                    ) : null}
                    <div className="space-y-4 mb-3">
                      {msg.messages?.map(subMsg => {
                        const isContentGen = msg.topicKind === "content_gen";
                        const isApplicationAsset = msg.topicKind === "application_asset";
                        const improveSubRow = msg.subSessionAdkId ? getRegistryRow(msg.subSessionAdkId) : undefined;
                        const isResumeImprove = msg.topicKind === "improve" && improveSubRow?.feature === "resume";
                        const subHasDraft =
                          isContentGen && subMsg.role === "model" && Boolean(subMsg.text && messageHasContentGenDraft(subMsg.text));
                        const subIsDraftThread = isContentGen && isContentGenDraftSubThread(msg.messages);
                        const lastModelSubMsgId = [...(msg.messages ?? [])].reverse().find(m => m.role === "model")?.id;
                        const subIsActiveDraftStream =
                          subIsDraftThread &&
                          isAgentLoading &&
                          subMsg.role === "model" &&
                          (contentGenAdkDraftJobRef.current?.botMsgId === subMsg.id || subMsg.id === lastModelSubMsgId);
                        const plannerTurnFunnel = resolveFunnelForPlannerModelMessage(msg, subMsg.id) ?? contentGenFunnelRef.current;
                        const subHasPlanner =
                          isContentGen &&
                          subMsg.role === "model" &&
                          Boolean(subMsg.text && messageShowsTopicPickerChips(subMsg.text, plannerTurnFunnel) && !subHasDraft);
                        const rawModelVisibleText =
                          subMsg.role === "model" && subMsg.text
                            ? isContentGen
                              ? subHasPlanner
                                ? stripPlannerJsonFromMessage(subMsg.text)
                                : subHasDraft || subIsDraftThread
                                  ? stripContentGenDraftFromMessage(subMsg.text, { draftTurn: subIsDraftThread || subHasDraft })
                                  : stripMachineReadablePayloadFromMessage(subMsg.text)
                              : isApplicationAsset
                                ? stripApplicationAssetDraftFromMessage(subMsg.text)
                                : stripMachineReadablePayloadFromMessage(subMsg.text)
                            : "";
                        const modelVisibleText =
                          shouldDeferContentGenDraftBubbleText({
                            draftThread: subIsDraftThread,
                            agentLoading: isAgentLoading,
                            isActiveStreamMessage: subIsActiveDraftStream,
                          }) && !subHasPlanner
                            ? ""
                            : rawModelVisibleText;
                        const userVisibleText =
                          subMsg.role === "user" && subMsg.text
                            ? isContentGen
                              ? contentGenTopicUserDisplayText(subMsg.text)
                              : isResumeImprove
                                ? resumeImproveUserDisplayText(
                                    subMsg.text,
                                    improveSubRow?.section ?? undefined,
                                    improveSubRow?.entry_id || undefined
                                  )
                                : subMsg.text
                            : "";
                        const showModelBubble =
                          subMsg.role === "model" &&
                          (Boolean(modelVisibleText) ||
                            subIsActiveDraftStream ||
                            (!(subHasPlanner || subHasDraft) && (!subMsg.text || isStreamingMachineReadablePayloadOnly(subMsg.text))));
                        const showUserBubble = subMsg.role === "user" && userVisibleText;
                        const hasActionCard = subMsg.role === "user" && subMsg.assetActionMeta;

                        return (
                          <div
                            key={subMsg.id}
                            data-unibot-message-id={subMsg.id}
                            className={`flex flex-col gap-1 ${subMsg.role === "user" ? "items-end" : "items-start"}`}
                          >
                            {subMsg.isError ? (
                              <UnibotErrorBubble message={subMsg} onRetry={retryFailedStream} />
                            ) : hasActionCard ? (
                              <div className="group flex max-w-full flex-col items-end">
                                <RefineActionCard meta={subMsg.assetActionMeta!} />
                                {subMsg.invocationId ? (
                                  <UnibotUserMessageToolbar
                                    showEdit={false}
                                    disabled={!canRewind}
                                    onDelete={() => void handleDeleteUserMessage(subMsg, msg.subSessionAdkId ?? sessionId, msg.id)}
                                  />
                                ) : null}
                              </div>
                            ) : showModelBubble || showUserBubble ? (
                              subMsg.role === "user" && showUserBubble ? (
                                <div className="group flex max-w-full flex-col items-end">
                                  {renderEditableUserMessage(
                                    subMsg,
                                    msg.subSessionAdkId ?? sessionId,
                                    msg.id,
                                    userVisibleText,
                                    "rounded-2xl rounded-tr-sm bg-slate-50 px-3 py-2 text-[13px] leading-relaxed text-slate-800 dark:bg-white/5 dark:text-slate-100"
                                  )}
                                </div>
                              ) : (
                                <div className="text-[13px] py-2 px-3 leading-relaxed text-slate-600 dark:text-slate-300">
                                  {modelVisibleText ? (
                                    <>
                                      <FormattedAgentMessage content={modelVisibleText} />
                                      {(() => {
                                        const followUp = getFollowUpStreamActivityLabel(
                                          subMsg.id,
                                          liveStreamActivity,
                                          streamActivityLabel,
                                          {
                                            agentLoading: isAgentLoading,
                                            isSyncingContext,
                                            hasVisibleText: true,
                                            waitingLabel: streamingStatusLabel,
                                          }
                                        );
                                        if (!followUp) return null;
                                        return (
                                          <div className="mt-2 flex items-center gap-2 text-slate-400">
                                            <Loader2 size={12} className="animate-spin shrink-0" />
                                            <span className="text-xs">{followUp}</span>
                                          </div>
                                        );
                                      })()}
                                    </>
                                  ) : (
                                    (() => {
                                      const isActiveStreamTarget = subMsg.id === activeStreamingMessageId;
                                      const placeholderLabel =
                                        contentGenPublishActivity[subMsg.id] ??
                                        streamActivityLabelForMessage(subMsg.id, liveStreamActivity, streamActivityLabel, {
                                          agentLoading: isAgentLoading,
                                          isSyncingContext,
                                          waitingLabel: streamingStatusLabel,
                                          isActiveStreamingTarget: isActiveStreamTarget,
                                        });
                                      if (!isActiveStreamTarget && !placeholderLabel.trim()) return null;
                                      return (
                                        <div className="flex items-center gap-2 text-slate-400">
                                          <Loader2 size={14} className="animate-spin shrink-0" />
                                          <span>{placeholderLabel}</span>
                                        </div>
                                      );
                                    })()
                                  )}
                                </div>
                              )
                            ) : null}
                            {subHasPlanner ? (
                              <UnibotActionItemHighlight
                                active={isActionItemHighlighted(msg.id, subMsg.id, "planner_chips")}
                                messageId={subMsg.id}
                              >
                                <ContentGenTopicChips
                                  botMessage={subMsg.text!}
                                  topicId={msg.id}
                                  activeFunnel={plannerTurnFunnel}
                                  chipsDismissed={contentGenDismissedChipsRef.current.has(subMsg.id)}
                                  onAffirmationClick={(label, _f) =>
                                    handleContentGenAffirmation(msg.id, label, subMsg.id, plannerTurnFunnel)
                                  }
                                  onUseTopic={(title, funnel) =>
                                    handleApplyContentGenTopic(msg.id, title, funnel ?? plannerTurnFunnel, subMsg.id)
                                  }
                                  onActionClick={action => {
                                    contentGenDismissedChipsRef.current.add(subMsg.id);
                                    setMessages(prev => [...prev]);
                                    handleContentGenAction(action, msg.id);
                                  }}
                                />
                              </UnibotActionItemHighlight>
                            ) : null}
                            {subMsg.role === "model" && subMsg.unimadNavigation ? (
                              <UnimadNavigationChip navigation={subMsg.unimadNavigation} onNavigate={path => router.push(path)} />
                            ) : null}
                            {subMsg.role === "model" && subMsg.unimadJobCards ? (
                              <UnibotJobCardStrip payload={subMsg.unimadJobCards} onSeeMore={path => router.push(path)} />
                            ) : null}
                            {subMsg.role === "model" && subMsg.unimadLinkedInSuggestions ? (
                              <UnibotLinkedInSuggestionCards
                                payload={subMsg.unimadLinkedInSuggestions}
                                wideLayout={subMsg.unimadLinkedInSuggestions.section === "about"}
                              />
                            ) : null}
                            {subMsg.role === "model" &&
                            adkContentGenReviewStack.some(
                              c => c.assistantMessageId === subMsg.id && c.id === adkContentGenActiveReviewId
                            ) ? (
                              <UnibotActionItemHighlight
                                active={isActionItemHighlighted(msg.id, subMsg.id, "review_card")}
                                messageId={subMsg.id}
                              >
                                <ContentGenDraftReviewChips
                                  disabled={adkReviewBusy || !sessionReady}
                                  actionsOutOfContext={showGoToAsset}
                                  onAccept={() => void handleContentGenAccept()}
                                  onImprove={() => void handleContentGenImprove(msg.id)}
                                  onBlockedAction={nudgeTopicGoTo}
                                />
                              </UnibotActionItemHighlight>
                            ) : null}
                            {subMsg.role === "model" &&
                              adkApplicationAssetReviewStack
                                .filter(c => c.assistantMessageId === subMsg.id)
                                .map(card => (
                                  <UnibotActionItemHighlight
                                    key={card.id}
                                    active={
                                      card.id === adkApplicationAssetActiveReviewId &&
                                      isActionItemHighlighted(msg.id, subMsg.id, "review_card")
                                    }
                                    messageId={subMsg.id}
                                  >
                                    <AdkReviewCardBlock
                                      card={card}
                                      isActive={card.id === adkApplicationAssetActiveReviewId}
                                      adkReviewBusy={applicationAssetReviewBusy}
                                      sessionReady={sessionReady}
                                      onAccept={() => void acceptApplicationAssetReview()}
                                      onDiscard={discardApplicationAssetReview}
                                      hideActions={diffReviewUiActive}
                                      actionsOutOfContext={showGoToAsset}
                                      onBlockedAction={nudgeTopicGoTo}
                                    />
                                  </UnibotActionItemHighlight>
                                ))}
                            {subMsg.role === "model" &&
                              adkLinkedInReviewStack
                                .filter(c => c.assistantMessageId === subMsg.id)
                                .map((card: AdkLinkedInReviewCard) => (
                                  <UnibotActionItemHighlight
                                    key={card.id}
                                    active={
                                      card.id === adkLinkedInActiveReviewId && isActionItemHighlighted(msg.id, subMsg.id, "review_card")
                                    }
                                    messageId={subMsg.id}
                                  >
                                    <AdkReviewCardBlock
                                      card={card}
                                      isActive={card.id === adkLinkedInActiveReviewId}
                                      adkReviewBusy={adkReviewBusy}
                                      sessionReady={sessionReady}
                                      onAccept={handleAdkLinkedInAccept}
                                      onDiscard={handleAdkLinkedInDiscard}
                                      actionsOutOfContext={showGoToAsset}
                                      onBlockedAction={nudgeTopicGoTo}
                                    />
                                  </UnibotActionItemHighlight>
                                ))}
                            {subMsg.role === "model" &&
                              adkReviewStack
                                .filter(c => c.assistantMessageId === subMsg.id)
                                .map(card => (
                                  <UnibotActionItemHighlight
                                    key={card.id}
                                    active={card.id === adkActiveReviewId && isActionItemHighlighted(msg.id, subMsg.id, "review_card")}
                                    messageId={subMsg.id}
                                  >
                                    <AdkReviewCardBlock
                                      card={card}
                                      isActive={card.id === adkActiveReviewId}
                                      adkReviewBusy={adkReviewBusy}
                                      sessionReady={sessionReady}
                                      onAccept={handleAdkAccept}
                                      onDiscard={handleAdkDiscard}
                                      actionsOutOfContext={
                                        showGoToAsset || !isResumeReviewActionsInContext(activeResumeId, improveSubRow, card.resumeId)
                                      }
                                      onBlockedAction={nudgeTopicGoTo}
                                    />
                                  </UnibotActionItemHighlight>
                                ))}
                            {subMsg.role === "model" &&
                              adkPortfolioReviewStack
                                .filter(c => c.assistantMessageId === subMsg.id)
                                .map((card: AdkPortfolioReviewCard) => (
                                  <UnibotActionItemHighlight
                                    key={card.id}
                                    active={
                                      card.id === adkPortfolioActiveReviewId && isActionItemHighlighted(msg.id, subMsg.id, "review_card")
                                    }
                                    messageId={subMsg.id}
                                  >
                                    <AdkReviewCardBlock
                                      card={card}
                                      isActive={card.id === adkPortfolioActiveReviewId}
                                      adkReviewBusy={adkReviewBusy}
                                      sessionReady={sessionReady}
                                      onAccept={handleAdkPortfolioAccept}
                                      onDiscard={handleAdkPortfolioDiscard}
                                      actionsOutOfContext={showGoToAsset}
                                      onBlockedAction={nudgeTopicGoTo}
                                    />
                                  </UnibotActionItemHighlight>
                                ))}
                            {subMsg.role === "model" && msg.topicKind !== "content_gen" ? (
                              <ResolvedReviewDecisionStatus
                                messageId={subMsg.id}
                                reviewDecisions={reviewDecisions}
                                hasPendingReview={
                                  adkContentGenReviewStack.some(
                                    c => c.assistantMessageId === subMsg.id && c.id === adkContentGenActiveReviewId
                                  ) ||
                                  adkApplicationAssetReviewStack.some(c => c.assistantMessageId === subMsg.id) ||
                                  adkReviewStack.some(c => c.assistantMessageId === subMsg.id) ||
                                  adkPortfolioReviewStack.some(c => c.assistantMessageId === subMsg.id) ||
                                  adkLinkedInReviewStack.some(c => c.assistantMessageId === subMsg.id)
                                }
                              />
                            ) : null}
                          </div>
                        );
                      })}
                    </div>

                    {gateAwaitingHint ? (
                      <div className="flex items-center gap-2 px-1 pt-1 text-[12px] text-slate-400 dark:text-slate-500">
                        <Loader2 size={14} className="shrink-0 animate-spin" aria-hidden />
                        <span>{gateAwaitingHint.text}</span>
                      </div>
                    ) : null}

                    {/* Topic Input - Seamless (nextjs layout; textarea for multi-line) */}
                    <div className="relative flex items-center gap-2 pt-2">
                      <textarea
                        ref={el => {
                          topicInputRefs.current[msg.id] = el;
                        }}
                        value={topicInputs[msg.id] || ""}
                        onChange={e => {
                          setTopicInputs(prev => ({
                            ...prev,
                            [msg.id]: e.target.value,
                          }));
                          growTextareaToFit(e.target);
                        }}
                        onKeyDown={e => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            void handleTopicSend(msg.id);
                          }
                        }}
                        placeholder="Reply..."
                        rows={1}
                        disabled={!canSend}
                        className="max-h-48 flex-1 resize-none overflow-y-auto border-none bg-transparent py-2 text-[13px] outline-none text-slate-700 placeholder:text-slate-300 transition-colors disabled:opacity-50 dark:text-slate-200 dark:placeholder:text-slate-700"
                      />
                      <button
                        type="button"
                        onClick={() => handleTopicSend(msg.id)}
                        disabled={!topicInputs[msg.id]?.trim() || !canSend}
                        className="p-2 text-slate-300 transition-all hover:text-brand-600 disabled:opacity-0"
                        aria-label="Send reply"
                      >
                        <Send size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          }

          const mainHasAppAssetDraft = msg.role === "model" && Boolean(msg.text && messageHasApplicationAssetDraft(msg.text));
          const mainHasDraft = !mainHasAppAssetDraft && msg.role === "model" && Boolean(msg.text && messageHasContentGenDraft(msg.text));
          const mainPlannerPayload =
            msg.role === "model" && msg.text && messageHasPlannerChips(msg.text) && !mainHasDraft && !mainHasAppAssetDraft
              ? msg.text
              : null;
          const mainModelVisible = mainHasAppAssetDraft
            ? stripApplicationAssetDraftFromMessage(msg.text!)
            : mainHasDraft
              ? stripContentGenDraftFromMessage(msg.text!, { draftTurn: true })
              : mainPlannerPayload != null
                ? stripPlannerJsonFromMessage(mainPlannerPayload)
                : msg.text
                  ? stripMachineReadablePayloadFromMessage(msg.text)
                  : msg.text;

          return (
            <div key={msg.id} className={`flex min-w-0 flex-col gap-1 ${msg.role === "user" ? "items-end" : "items-start"}`}>
              {msg.isError ? (
                <UnibotErrorBubble message={msg} onRetry={retryFailedStream} />
              ) : msg.role === "user" && msg.text ? (
                <div className="group flex max-w-[90%] flex-col items-end">
                  {renderEditableUserMessage(
                    msg,
                    sessionId,
                    undefined,
                    msg.text,
                    "rounded-2xl rounded-tr-sm bg-slate-100 px-4 py-3 text-[13px] leading-relaxed text-slate-900 dark:bg-white/5 dark:text-slate-100"
                  )}
                </div>
              ) : (
                <div className="max-w-full bg-transparent px-1 text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">
                  {msg.role === "model" && mainModelVisible ? (
                    <>
                      <FormattedAgentMessage content={mainModelVisible} />
                      {(() => {
                        const followUp = getFollowUpStreamActivityLabel(msg.id, liveStreamActivity, streamActivityLabel, {
                          agentLoading: isAgentLoading,
                          isSyncingContext,
                          hasVisibleText: true,
                          waitingLabel: streamingStatusLabel,
                        });
                        if (!followUp) return null;
                        return (
                          <div className="mt-2 flex items-center gap-2 text-slate-400 px-1">
                            <Loader2 size={12} className="animate-spin shrink-0" />
                            <span className="text-xs">{followUp}</span>
                          </div>
                        );
                      })()}
                    </>
                  ) : msg.role === "model" &&
                    !mainPlannerPayload &&
                    !mainHasDraft &&
                    !mainHasAppAssetDraft &&
                    (!msg.text || isStreamingMachineReadablePayloadOnly(msg.text)) ? (
                    (() => {
                      const isActiveStreamTarget = msg.id === activeStreamingMessageId;
                      const placeholderLabel =
                        contentGenPublishActivity[msg.id] ??
                        streamActivityLabelForMessage(msg.id, liveStreamActivity, streamActivityLabel, {
                          agentLoading: isAgentLoading,
                          isSyncingContext,
                          waitingLabel: streamingStatusLabel,
                          isActiveStreamingTarget: isActiveStreamTarget,
                        });
                      if (!isActiveStreamTarget && !placeholderLabel.trim()) return null;
                      return (
                        <div className="flex items-center gap-2 text-slate-400 px-1">
                          <Loader2 size={14} className="animate-spin shrink-0" />
                          <span>{placeholderLabel}</span>
                        </div>
                      );
                    })()
                  ) : null}
                </div>
              )}
              {mainPlannerPayload ? (
                <ContentGenTopicChips
                  botMessage={mainPlannerPayload}
                  activeFunnel={contentGenFunnelRef.current}
                  chipsDismissed={contentGenDismissedChipsRef.current.has(msg.id)}
                  onAffirmationClick={label => handleMainContentGenAffirmation(label, msg.id)}
                  onUseTopic={(title, funnel) => handleMainApplyContentGenTopic(title, funnel, msg.id)}
                  onActionClick={action => {
                    contentGenDismissedChipsRef.current.add(msg.id);
                    setMessages(prev => [...prev]);
                    handleContentGenAction(action);
                  }}
                />
              ) : null}
              {msg.role === "model" && msg.unimadNavigation ? (
                <UnimadNavigationChip navigation={msg.unimadNavigation} onNavigate={path => router.push(path)} />
              ) : null}
              {msg.role === "model" && msg.unimadJobCards ? (
                <UnibotJobCardStrip payload={msg.unimadJobCards} onSeeMore={path => router.push(path)} />
              ) : null}
              {msg.role === "model" && msg.unimadLinkedInSuggestions ? (
                <UnibotLinkedInSuggestionCards
                  payload={msg.unimadLinkedInSuggestions}
                  wideLayout={msg.unimadLinkedInSuggestions.section === "about"}
                />
              ) : null}
              {msg.role === "model" &&
              adkContentGenReviewStack.some(c => c.assistantMessageId === msg.id && c.id === adkContentGenActiveReviewId) ? (
                <ContentGenDraftReviewChips
                  disabled={adkReviewBusy || !sessionReady}
                  actionsOutOfContext={!isReviewNavActive(resolveContentGenReviewNavTarget())}
                  onAccept={() => void handleContentGenAccept()}
                  onImprove={() => void handleContentGenImprove(null)}
                  onBlockedAction={() => nudgeGoToFeature(resolveContentGenReviewNavTarget().href)}
                />
              ) : null}
              {msg.role === "model" &&
                adkApplicationAssetReviewStack
                  .filter(c => c.assistantMessageId === msg.id)
                  .map(card => {
                    const nav = resolveApplicationAssetReviewNavTarget({
                      assetType: card.assetType,
                      assetId: useApplicationAssetStudioStore.getState().assetId,
                    });
                    const outOfContext = !isReviewNavActive(nav);
                    return (
                      <AdkReviewCardBlock
                        key={card.id}
                        card={card}
                        isActive={card.id === adkApplicationAssetActiveReviewId}
                        adkReviewBusy={applicationAssetReviewBusy}
                        sessionReady={sessionReady}
                        onAccept={() => void acceptApplicationAssetReview()}
                        onDiscard={discardApplicationAssetReview}
                        hideActions={diffReviewUiActive}
                        actionsOutOfContext={outOfContext}
                        onBlockedAction={() => nudgeGoToFeature(nav.href)}
                      />
                    );
                  })}
              {msg.role === "model" &&
                adkReviewStack
                  .filter(c => c.assistantMessageId === msg.id)
                  .map(card => {
                    const nav = resolveResumeReviewNavTarget(card);
                    const outOfContext =
                      !isReviewNavActive(nav) || !isResumeReviewActionsInContext(activeResumeId, undefined, card.resumeId);
                    return (
                      <AdkReviewCardBlock
                        key={card.id}
                        card={card}
                        isActive={card.id === adkActiveReviewId}
                        adkReviewBusy={adkReviewBusy}
                        sessionReady={sessionReady}
                        onAccept={handleAdkAccept}
                        onDiscard={handleAdkDiscard}
                        actionsOutOfContext={outOfContext}
                        onBlockedAction={() => nudgeGoToFeature(nav.href)}
                      />
                    );
                  })}
              {msg.role === "model" &&
                adkPortfolioReviewStack
                  .filter(c => c.assistantMessageId === msg.id)
                  .map((card: AdkPortfolioReviewCard) => {
                    const nav = resolvePortfolioReviewNavTarget(card);
                    const outOfContext = !isReviewNavActive(nav);
                    return (
                      <AdkReviewCardBlock
                        key={card.id}
                        card={card}
                        isActive={card.id === adkPortfolioActiveReviewId}
                        adkReviewBusy={adkReviewBusy}
                        sessionReady={sessionReady}
                        onAccept={handleAdkPortfolioAccept}
                        onDiscard={handleAdkPortfolioDiscard}
                        actionsOutOfContext={outOfContext}
                        onBlockedAction={() => nudgeGoToFeature(nav.href)}
                      />
                    );
                  })}
              {msg.role === "model" &&
                adkLinkedInReviewStack
                  .filter(c => c.assistantMessageId === msg.id)
                  .map((card: AdkLinkedInReviewCard) => {
                    const nav = resolveLinkedInReviewNavTarget(card);
                    const outOfContext = !isReviewNavActive(nav);
                    return (
                      <AdkReviewCardBlock
                        key={card.id}
                        card={card}
                        isActive={card.id === adkLinkedInActiveReviewId}
                        adkReviewBusy={adkReviewBusy}
                        sessionReady={sessionReady}
                        onAccept={handleAdkLinkedInAccept}
                        onDiscard={handleAdkLinkedInDiscard}
                        actionsOutOfContext={outOfContext}
                        onBlockedAction={() => nudgeGoToFeature(nav.href)}
                      />
                    );
                  })}
              {msg.role === "model" ? (
                <ResolvedReviewDecisionStatus
                  messageId={msg.id}
                  reviewDecisions={reviewDecisions}
                  hasPendingReview={
                    adkContentGenReviewStack.some(c => c.assistantMessageId === msg.id && c.id === adkContentGenActiveReviewId) ||
                    adkApplicationAssetReviewStack.some(c => c.assistantMessageId === msg.id) ||
                    adkReviewStack.some(c => c.assistantMessageId === msg.id) ||
                    adkPortfolioReviewStack.some(c => c.assistantMessageId === msg.id) ||
                    adkLinkedInReviewStack.some(c => c.assistantMessageId === msg.id)
                  }
                />
              ) : null}
            </div>
          );
        })}

        {(adkReviewStack.some(c => !c.assistantMessageId) ||
          adkPortfolioReviewStack.some(c => !c.assistantMessageId) ||
          adkLinkedInReviewStack.some(c => !c.assistantMessageId) ||
          adkContentGenReviewStack.some(c => !c.assistantMessageId) ||
          adkApplicationAssetReviewStack.some(c => !c.assistantMessageId)) && (
          <div className="flex flex-col gap-2 items-start pl-1">
            {adkReviewStack
              .filter(c => !c.assistantMessageId)
              .map(card => {
                const nav = resolveResumeReviewNavTarget(card);
                const outOfContext = !isReviewNavActive(nav) || !isResumeReviewActionsInContext(activeResumeId, undefined, card.resumeId);
                return (
                  <div key={card.id} className="w-full max-w-[95%]">
                    {outOfContext ? (
                      <SubThreadGoToAssetLink
                        target={nav}
                        highlighted={highlightedGoToHref === nav.href}
                        onNavigate={href => router.push(href)}
                      />
                    ) : null}
                    <AdkReviewCardBlock
                      card={card}
                      isActive={card.id === adkActiveReviewId}
                      adkReviewBusy={adkReviewBusy}
                      sessionReady={sessionReady}
                      onAccept={handleAdkAccept}
                      onDiscard={handleAdkDiscard}
                      actionsOutOfContext={outOfContext}
                      onBlockedAction={() => nudgeGoToFeature(nav.href)}
                    />
                  </div>
                );
              })}
            {adkPortfolioReviewStack
              .filter(c => !c.assistantMessageId)
              .map((card: AdkPortfolioReviewCard) => {
                const nav = resolvePortfolioReviewNavTarget(card);
                const outOfContext = !isReviewNavActive(nav);
                return (
                  <div key={card.id} className="w-full max-w-[95%]">
                    {outOfContext ? (
                      <SubThreadGoToAssetLink
                        target={nav}
                        highlighted={highlightedGoToHref === nav.href}
                        onNavigate={href => router.push(href)}
                      />
                    ) : null}
                    <AdkReviewCardBlock
                      card={card}
                      isActive={card.id === adkPortfolioActiveReviewId}
                      adkReviewBusy={adkReviewBusy}
                      sessionReady={sessionReady}
                      onAccept={handleAdkPortfolioAccept}
                      onDiscard={handleAdkPortfolioDiscard}
                      actionsOutOfContext={outOfContext}
                      onBlockedAction={() => nudgeGoToFeature(nav.href)}
                    />
                  </div>
                );
              })}
            {adkLinkedInReviewStack
              .filter(c => !c.assistantMessageId)
              .map((card: AdkLinkedInReviewCard) => {
                const nav = resolveLinkedInReviewNavTarget(card);
                const outOfContext = !isReviewNavActive(nav);
                return (
                  <div key={card.id} className="w-full max-w-[95%]">
                    {outOfContext ? (
                      <SubThreadGoToAssetLink
                        target={nav}
                        highlighted={highlightedGoToHref === nav.href}
                        onNavigate={href => router.push(href)}
                      />
                    ) : null}
                    <AdkReviewCardBlock
                      card={card}
                      isActive={card.id === adkLinkedInActiveReviewId}
                      adkReviewBusy={adkReviewBusy}
                      sessionReady={sessionReady}
                      onAccept={handleAdkLinkedInAccept}
                      onDiscard={handleAdkLinkedInDiscard}
                      actionsOutOfContext={outOfContext}
                      onBlockedAction={() => nudgeGoToFeature(nav.href)}
                    />
                  </div>
                );
              })}
            {adkContentGenReviewStack.some(c => !c.assistantMessageId && c.id === adkContentGenActiveReviewId) ? (
              <div className="w-full max-w-[95%]">
                {!isReviewNavActive(resolveContentGenReviewNavTarget()) ? (
                  <SubThreadGoToAssetLink
                    target={resolveContentGenReviewNavTarget()}
                    highlighted={highlightedGoToHref === resolveContentGenReviewNavTarget().href}
                    onNavigate={href => router.push(href)}
                  />
                ) : null}
                <ContentGenDraftReviewChips
                  disabled={adkReviewBusy || !sessionReady}
                  actionsOutOfContext={!isReviewNavActive(resolveContentGenReviewNavTarget())}
                  onAccept={() => void handleContentGenAccept()}
                  onImprove={() => void handleContentGenImprove(null)}
                  onBlockedAction={() => nudgeGoToFeature(resolveContentGenReviewNavTarget().href)}
                />
              </div>
            ) : null}
            {adkApplicationAssetReviewStack
              .filter(c => !c.assistantMessageId)
              .map(card => {
                const nav = resolveApplicationAssetReviewNavTarget({
                  assetType: card.assetType,
                  assetId: useApplicationAssetStudioStore.getState().assetId,
                });
                const outOfContext = !isReviewNavActive(nav);
                return (
                  <div key={card.id} className="w-full max-w-[95%]">
                    {outOfContext ? (
                      <SubThreadGoToAssetLink
                        target={nav}
                        highlighted={highlightedGoToHref === nav.href}
                        onNavigate={href => router.push(href)}
                      />
                    ) : null}
                    <AdkReviewCardBlock
                      card={card}
                      isActive={card.id === adkApplicationAssetActiveReviewId}
                      adkReviewBusy={applicationAssetReviewBusy}
                      sessionReady={sessionReady}
                      onAccept={() => void acceptApplicationAssetReview()}
                      onDiscard={discardApplicationAssetReview}
                      hideActions={diffReviewUiActive}
                      actionsOutOfContext={outOfContext}
                      onBlockedAction={() => nudgeGoToFeature(nav.href)}
                    />
                  </div>
                );
              })}
          </div>
        )}

        {isAgentLoading && activeStreamingMessageId == null && !hasVisibleStreamingAssistantText && (
          <div className="flex flex-col gap-1 items-start pl-1">
            <div className="text-[13px] text-slate-400 flex items-center gap-2 px-1">
              <Loader2 size={14} className="animate-spin" />
              <span>{streamingStatusLabel}</span>
            </div>
          </div>
        )}
      </div>

      <div className="shrink-0 px-4">
        <ApplicationAssetReviewStepperCard />
      </div>

      <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-white/5">
        <div
          ref={footerInputCardRef}
          className={`relative rounded-xl border border-slate-200/90 bg-white px-3 pt-3 pb-2 shadow-sm dark:border-slate-700/80 dark:bg-slate-900 ${
            showPrepareImproveFooter ? "unibot-action-item-highlight" : ""
          }`}
        >
          {selectionSentPill ? (
            <div className="mb-2">
              <span className="inline-flex max-w-full items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 py-1 pl-2.5 pr-2 text-[11px] font-medium text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-100">
                <Check size={13} className="shrink-0" aria-hidden />
                <span className="truncate">Sent: {selectionSentPill}</span>
              </span>
            </div>
          ) : null}
          {fullDocumentImproveContext && isStudioPrepareImproveRoute && !selectionSentPill && visibleDocumentImprovePresets.length > 0 ? (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {documentImproveSuggestionsLoading && visibleDocumentImprovePresets.length === 0 ? (
                <span className="text-[11px] text-slate-400">Loading suggestions…</span>
              ) : null}
              {visibleDocumentImprovePresets.map(preset => {
                const Icon = preset.icon;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    disabled={isAgentLoading}
                    onClick={() => handleFullDocumentPreset(preset)}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-brand-800 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-brand-500/40 dark:hover:bg-brand-500/10 dark:hover:text-brand-200"
                  >
                    <Icon size={12} className="shrink-0 opacity-80" aria-hidden />
                    {preset.label}
                  </button>
                );
              })}
            </div>
          ) : null}
          {resumeFullImproveContext && isResumePrepareImproveRoute ? (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {RESUME_FULL_IMPROVE_PRESETS.map(preset => {
                const Icon = preset.icon;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleResumeFullImprovePreset(preset)}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-brand-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-brand-500/40 dark:hover:bg-brand-500/10 dark:hover:text-brand-200"
                  >
                    <Icon size={12} className="shrink-0 opacity-80" aria-hidden />
                    {preset.label}
                  </button>
                );
              })}
            </div>
          ) : null}
          {fullDocumentImproveContext && isStudioPrepareImproveRoute ? (
            <div className="mb-2">
              <span className="inline-flex max-w-full items-center gap-1 rounded-full border border-brand-200 bg-brand-50 py-1 pl-2.5 pr-1 text-[11px] font-medium text-brand-900 dark:border-brand-500/40 dark:bg-brand-500/15 dark:text-brand-100">
                <span className="truncate">
                  Editing {assetTypeDisplayLabel(fullDocumentImproveContext.assetType)} · {fullDocumentImproveContext.role} @{" "}
                  {fullDocumentImproveContext.company}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setFullDocumentImproveContext(null);
                  }}
                  className="shrink-0 rounded-full p-0.5"
                  aria-label="Clear improve context"
                >
                  <X size={13} />
                </button>
              </span>
            </div>
          ) : null}
          {resumeFullImproveContext && isResumePrepareImproveRoute ? (
            <div className="mb-2">
              <span className="inline-flex max-w-full items-center gap-1 rounded-full border border-brand-200 bg-brand-50 py-1 pl-2.5 pr-1 text-[11px] font-medium text-brand-900 dark:border-brand-500/40 dark:bg-brand-500/15 dark:text-brand-100">
                <span className="truncate">
                  Improving resume
                  {resumeFullImproveContext.role
                    ? ` · ${resumeFullImproveContext.role}${resumeFullImproveContext.company ? ` @ ${resumeFullImproveContext.company}` : ""}`
                    : ""}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setResumeFullImproveContext(null);
                  }}
                  className="shrink-0 rounded-full p-0.5"
                  aria-label="Clear resume improve context"
                >
                  <X size={13} />
                </button>
              </span>
            </div>
          ) : null}
          {selectionQuoteContext ? (
            <div className="mb-2">
              <span className="inline-flex max-w-full items-center gap-1 rounded-full border border-brand-200 bg-brand-50 py-1 pl-2.5 pr-1 text-[11px] font-medium text-brand-900 dark:border-brand-500/40 dark:bg-brand-500/15 dark:text-brand-100">
                <span className="truncate">
                  &ldquo;
                  {selectionQuoteContext.selectedText.length > 60
                    ? `${selectionQuoteContext.selectedText.slice(0, 57)}…`
                    : selectionQuoteContext.selectedText}
                  &rdquo;
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectionQuoteContext(null);
                    useApplicationAssetStudioStore.getState().clearRefineAnchor();
                    useApplicationAssetStudioStore.getState().setPendingRefineContext(null);
                  }}
                  className="shrink-0 rounded-full p-0.5"
                  aria-label="Clear selected quote"
                >
                  <X size={13} />
                </button>
              </span>
            </div>
          ) : null}
          {improveReplyTopicId && improveContextTopic?.topicTitle ? (
            <div className="mb-2">
              <span className="inline-flex max-w-full items-center gap-1 rounded-full border border-brand-200 bg-brand-50 py-1 pl-2.5 pr-1 text-[11px] font-medium text-brand-900 dark:border-brand-500/40 dark:bg-brand-500/15 dark:text-brand-100">
                <span className="truncate">Reply to: {improveContextTopic.topicTitle}</span>
                <button
                  type="button"
                  onClick={() => {
                    markAtsFixBatchFocusOverride(atsFixBatchRef.current);
                    syncAtsFixBatchUi();
                    setImproveReplyTopicId(null);
                  }}
                  className="shrink-0 rounded-full p-0.5"
                  aria-label="Clear reply target"
                >
                  <X size={13} />
                </button>
              </span>
            </div>
          ) : null}
          {streamError ? (
            <p className="mb-2 rounded-lg border border-red-200/70 bg-red-50/80 px-2.5 py-2 text-[11px] leading-snug text-red-800 dark:border-red-900/40 dark:bg-red-950/25 dark:text-red-200">
              Resolve the error above or tap <span className="font-medium">Try again</span> before sending a new message.
            </p>
          ) : null}
          <textarea
            ref={mainInputRef}
            value={input}
            onChange={e => {
              setInput(e.target.value);
              growTextareaToFit(e.target);
            }}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
            placeholder={
              streamError
                ? "Fix the error above to continue…"
                : fullDocumentImproveContext && isStudioPrepareImproveRoute
                  ? "Tell Unibot how to improve this document…"
                  : resumeFullImproveContext && isResumePrepareImproveRoute
                    ? "Tell Unibot how to improve your resume…"
                    : selectionQuoteContext
                      ? "How should Unibot change this section?"
                      : improveReplyTopicId && improveContextTopic
                        ? "Reply in this topic…"
                        : "Ask anything"
            }
            rows={1}
            disabled={!canSend}
            className="w-full bg-transparent border-none outline-none text-[13px] placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500 resize-none max-h-48 overflow-y-auto min-h-[48px] py-1 px-1 mb-2 disabled:opacity-50"
          />

          <div className="flex justify-between items-center pl-1">
            {/*
              Voice (mic) input — deferred. History control opens past chats (ADK sessions).
              <button type="button" ...><Mic size={18} /></button>
            */}
            <div className="relative" ref={footerInputCardRef}>
              <button
                type="button"
                onClick={() => setHistoryPanelOpen(o => !o)}
                disabled={!canUseHistory}
                className="p-2 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 transition-all"
                title="Chat history"
                aria-expanded={historyPanelOpen}
                aria-haspopup="listbox"
              >
                <History size={18} />
              </button>
              {historyPanelOpen && (
                <div
                  className="absolute bottom-full left-0 right-0 z-40 mb-2 flex w-[min(300px,92vw)] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-600 dark:bg-slate-900"
                  style={{ maxHeight: historyPanelLayout.panelMaxHeight }}
                  role="dialog"
                  aria-label="Chat history"
                >
                  {thisSessionListEntries.length > 0 && (
                    <>
                      <div className="border-b border-slate-100 px-3 py-2 dark:border-slate-700">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">This session</p>
                      </div>
                      <div className="border-b border-slate-100 px-2 pb-2 pt-1.5 dark:border-slate-700">
                        <div className="relative">
                          <Search
                            className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
                            aria-hidden
                          />
                          <input
                            type="search"
                            value={historySearchQuery}
                            onChange={e => setHistorySearchQuery(e.target.value)}
                            placeholder="Search sub-chats…"
                            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-7 pr-2 text-[12px] outline-none dark:border-slate-600 dark:bg-slate-900/80 dark:text-slate-100"
                          />
                        </div>
                      </div>
                      <ul
                        className="scrollbar-on-hover min-h-0 flex-1 overflow-y-auto p-1.5"
                        style={historyPanelLayout.thisSessionMaxHeight ? { maxHeight: historyPanelLayout.thisSessionMaxHeight } : undefined}
                      >
                        {filteredThisSessionList.map(row => {
                          const active = improveReplyTopicId === row.id;
                          return (
                            <li key={row.id}>
                              <div
                                className={`group flex items-start gap-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/80 ${
                                  active ? "bg-slate-100 dark:bg-white/10" : ""
                                }`}
                              >
                                <button
                                  type="button"
                                  className="min-w-0 flex-1 rounded-lg px-2 py-1.5 text-left text-[12px]"
                                  onClick={() => {
                                    if (row.subAdkSessionId) {
                                      void selectImproveSubFromRegistry(row.subAdkSessionId, row.title);
                                    } else {
                                      selectImproveTopic(row.id);
                                    }
                                  }}
                                >
                                  <span className="line-clamp-2 font-medium">{row.title}</span>
                                  {row.subtitle ? <span className="block text-[10px] text-slate-400">{row.subtitle}</span> : null}
                                </button>
                                <button
                                  type="button"
                                  onClick={e => {
                                    e.stopPropagation();
                                    setPendingDeleteSession({
                                      kind: "sub",
                                      topicId: row.id,
                                      title: row.title,
                                      subAdkSessionId: row.subAdkSessionId,
                                    });
                                  }}
                                  disabled={isAgentLoading}
                                  className="mt-1 shrink-0 rounded-md p-1.5 text-slate-400 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 disabled:opacity-20 dark:hover:bg-red-500/10"
                                  title="Delete sub-thread"
                                  aria-label={`Delete ${row.title}`}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </>
                  )}
                  <div
                    className={`px-3 py-2 ${thisSessionListEntries.length > 0 ? "border-t border-slate-100 dark:border-slate-700" : ""}`}
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">All chats</p>
                  </div>
                  <ul
                    className="scrollbar-on-hover min-h-0 overflow-y-auto py-1"
                    style={{ maxHeight: historyPanelLayout.allChatsMaxHeight }}
                    role="listbox"
                  >
                    {groupedSessions.length === 0 && <li className="px-3 py-2 text-[11px] text-slate-400">No other chats yet</li>}
                    {groupedSessions.map(group => {
                      const activeMain =
                        group.id === sessionId || group.id === currentMainSessionId || group.subs.some(s => s.id === sessionId);
                      return (
                        <li key={group.id}>
                          <div
                            className={`group flex items-center gap-1 py-1 px-1 hover:bg-slate-50 dark:hover:bg-white/5 ${
                              activeMain ? "bg-slate-100 dark:bg-white/10" : ""
                            }`}
                          >
                            <button
                              type="button"
                              role="option"
                              aria-selected={activeMain}
                              onClick={() => {
                                handleSessionSwitch(group.id);
                                setImproveReplyTopicId(null);
                                setHistoryPanelOpen(false);
                              }}
                              className={`min-w-0 flex-1 text-left text-[12px] py-1 px-2 truncate ${
                                activeMain ? "text-slate-900 dark:text-slate-100" : "text-slate-600 dark:text-slate-300"
                              }`}
                            >
                              {group.title}
                            </button>
                            {group.canDelete ? (
                              <button
                                type="button"
                                onClick={e => {
                                  e.stopPropagation();
                                  setPendingDeleteSession({ kind: "main", id: group.id, title: group.title });
                                }}
                                disabled={isAgentLoading}
                                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all disabled:opacity-20"
                                title="Delete chat session"
                                aria-label={`Delete ${group.title}`}
                              >
                                <Trash2 size={13} />
                              </button>
                            ) : null}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => void onNewChat()}
                disabled={!canUseHistory || isAgentLoading}
                className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-slate-700"
                title="New thread"
                aria-label="New thread"
              >
                <Plus size={18} strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={!input.trim() || !canSend}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-black text-white transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black"
              >
                <ArrowUp size={16} />
              </button>
            </div>
          </div>
        </div>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center mt-3 font-medium">
          AI can make mistakes. Please double-check responses.
        </p>
      </div>

      <PanelResizeHandle onPointerDown={startResize} label="Resize Unibot panel" />

      {pendingDeleteSession &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className={`fixed inset-0 ${MODAL_OVERLAY_Z_CLASS} flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-chat-session-title"
          >
            <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
                <h2 id="delete-chat-session-title" className="text-base font-semibold text-slate-900 dark:text-white">
                  {pendingDeleteSession.kind === "sub" ? "Delete sub-thread?" : "Delete chat session?"}
                </h2>
                <button
                  type="button"
                  onClick={() => setPendingDeleteSession(null)}
                  disabled={isDeletingSession}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40"
                  aria-label="Close delete confirmation"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-5">
                <p className="text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  {pendingDeleteSession.kind === "sub" ? (
                    <>
                      This will remove <span className="font-medium text-slate-900 dark:text-slate-100">{pendingDeleteSession.title}</span>{" "}
                      from this session&apos;s sub-threads.
                    </>
                  ) : (
                    <>
                      This will delete <span className="font-medium text-slate-900 dark:text-slate-100">{pendingDeleteSession.title}</span>{" "}
                      from your chat history.
                    </>
                  )}
                </p>
                <p className="text-[12px] text-slate-400 mt-2">This action cannot be undone.</p>
              </div>

              <div className="p-5 pt-0 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPendingDeleteSession(null)}
                  disabled={isDeletingSession}
                  className="px-3 py-2 text-[12px] font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() =>
                    void (pendingDeleteSession.kind === "sub"
                      ? onDeleteSubThread(pendingDeleteSession)
                      : onDeleteSession(pendingDeleteSession.id))
                  }
                  disabled={isDeletingSession}
                  className="inline-flex items-center gap-2 px-3 py-2 text-[12px] font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50"
                >
                  {isDeletingSession ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  Delete
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {rewindConfirmDialog}
    </div>
  );
};

export default ChatSidebar;
