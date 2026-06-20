"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { PanelResizeHandle } from "@/components/ui/PanelResizeHandle";
import { syncSessionStateAction } from "@/features/adk-chat/actions";
import { formatUnibotStreamError, type FormattedUnibotStreamError } from "@/features/adk-chat/format-stream-error";
import { generateMainSessionTitleIfNeeded } from "@/features/adk-chat/generate-main-session-title";
import { resolveImproveSubSession } from "@/features/adk-chat/improve-sub-session";
import {
  findImproveTopic,
  insertTopicInMainThread,
  loadSubSessionChatMessages,
  topicIdForSubSession,
} from "@/features/adk-chat/improve-topic-helpers";
import { persistReviewDecisionForSession } from "@/features/adk-chat/persist-review-decision";
import { isHandoffPromptForTitle } from "@/features/adk-chat/pick-title-source-prompt";
import { getSessionDisplayName, getSessionMeta, groupSessionsForSidebar } from "@/features/adk-chat/session-metadata";
import { useAdkApplicationAssetReviewStore } from "@/features/adk-chat/stores/useAdkApplicationAssetReviewStore";
import { useAdkContentGenReviewStore } from "@/features/adk-chat/stores/useAdkContentGenReviewStore";
import { useAdkPortfolioReviewStore, type AdkPortfolioReviewCard } from "@/features/adk-chat/stores/useAdkPortfolioReviewStore";
import { useAdkResumeReviewStore, type AdkReviewCard } from "@/features/adk-chat/stores/useAdkResumeReviewStore";
import {
  isStreamingMachineReadablePayloadOnly,
  stripMachineReadablePayloadFromMessage,
} from "@/features/adk-chat/utils/strip-machine-readable-payload";
import {
  APPLICATION_ASSET_EVENTS,
  type ApplicationAssetOpenImproveDetail,
  type ApplicationAssetSelectionFreeformDetail,
  type ApplicationAssetSelectionRefineDetail,
} from "@/features/application-assets/api/application-asset-events";
import {
  messageHasApplicationAssetDraft,
  stripApplicationAssetDraftFromMessage,
} from "@/features/application-assets/api/applicationAssetDraftDisplay";
import { IMPROVE_WITH_UNIBOT_ACTION_LABEL, withPersistedActionLabel } from "@/features/application-assets/api/asset-action-message";
import { offerApplicationAssetDraftReview } from "@/features/application-assets/api/offerApplicationAssetDraftReview";
import {
  APPLICATION_ASSET_SELECTION_PRESETS,
  assetTypeDisplayLabel,
  buildFreeformSelectionUserMessage,
  buildFullDocumentFreeformUserMessage,
  buildFullDocumentRefineUserMessage,
  type ApplicationAssetSelectionPreset,
} from "@/features/application-assets/config/selection-presets";
import { useApplicationAssetReviewActions } from "@/features/application-assets/hooks/useApplicationAssetReviewActions";
import { useApplicationAssetStudioStore } from "@/features/application-assets/store/useApplicationAssetStudioStore";
import type { ApplicationAssetApiType } from "@/features/application-assets/types";
import type { ContentGenFunnel } from "@/features/content-lab/api/adk-mappers";
import type { ContentGenPlannerAction } from "@/features/content-lab/api/content-gen-events";
import { CONTENT_GEN_EVENTS, CONTENT_GEN_PUBLISH_BLOCKED_MESSAGE } from "@/features/content-lab/api/content-gen-events";
import { shouldForceDjangoContentGenDraft } from "@/features/content-lab/api/contentGenDraftConfig";
import {
  CONTENT_GEN_IMPROVE_KICKOFF_USER_MESSAGE,
  stripContentGenDraftFromMessage,
  messageHasContentGenDraft,
} from "@/features/content-lab/api/contentGenDraftDisplay";
import { isValidContentGenTopicTitle } from "@/features/content-lab/api/contentGenTopicUtils";
import {
  extractConfirmedTopicFromThread,
  inferFunnelFromChipLabel,
  messageHasPlannerChips,
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
import { useContentGenStudioStore } from "@/features/content-lab/store/useContentGenStudioStore";
import { buildAdkPortfolioDataMap, buildAdkPortfolioStateDelta } from "@/features/portfolio/api/mappers";
import { portfolioQueryKey } from "@/features/portfolio/hooks/usePortfolio";
import { usePortfolioStore } from "@/features/portfolio/store/usePortfolioStore";
import { buildAdkResumeDataMap } from "@/features/resume/api/mappers";
import { resumeByIdQueryKey } from "@/features/resume/hooks/useResume";
import { useResumeStore } from "@/features/resume/store/useResumeStore";
import { MODAL_OVERLAY_Z_CLASS } from "@/lib/ui/modal-overlay";
import { UNTITLED_THREAD_TITLE } from "@/src/features/adk-chat/constants";
import { ensureApplicationAssetTopicSubSession, ensureContentGenTopicSubSession } from "@/src/features/adk-chat/ensure-topic-sub-session";
import { getRegistryRow, upsertRegistryRow } from "@/src/features/adk-chat/session-registry";
import { registerUnibotAdkSessionAction } from "@/src/features/adk-chat/unibot-adk-session-actions";
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
  Undo2,
  X,
  Check,
} from "lucide-react";
import { usePathname } from "next/navigation";
import type { AssetActionMeta, ChatMessage } from "../types";
import Logo from "./Logo";
import UnimadUMark from "./UnimadUMark";
import { useAdkChatContext } from "./chat/AdkChatProvider";
import { AdkRewindConfirmDialog } from "./chat/AdkRewindConfirmDialog";
import { ContentGenDraftReviewChips } from "./chat/ContentGenDraftReviewChips";
import { ContentGenTopicChips } from "./chat/ContentGenTopicChips";
import { FormattedAgentMessage } from "./chat/FormattedAgentMessage";
import { UnibotErrorBubble } from "./chat/UnibotErrorBubble";
import {
  applicationAssetImproveTopicTitle,
  applicationAssetTopicTitle,
  buildApplicationAssetDraftBootstrap,
} from "./chat/application-asset-topic";
import { buildContentGenDraftBootstrap, buildContentGenTopicBootstrap, contentGenTopicUserDisplayText } from "./chat/content-gen-topic";
import { resetAssistantTurnForRetryInTree } from "./chat/set-chat-message-stream-error";
import { type UnibotIncomingRequest, incomingRequestSignature, UNIBOT_SECTION_REVIEW_PROMPTS } from "./chat/unibot-incoming-request";
import RefineActionCard from "./studio/RefineActionCard";

interface ChatSidebarProps {
  incomingRequest?: UnibotIncomingRequest | null;
  onRequestHandled?: () => void;
}

const SIDEBAR_WIDTH_MAX_PCT = 0.3;
const SIDEBAR_WIDTH_COLLAPSE_PCT = 0.1;
const SIDEBAR_DEFAULT_WIDTH_PX = 280;
const LS_SIDEBAR_WIDTH = "unibot-sidebar-width";
const LS_SIDEBAR_COLLAPSED = "unibot-sidebar-collapsed";

function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
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
}: {
  card: AdkReviewCardLike;
  isActive: boolean;
  adkReviewBusy: boolean;
  sessionReady: boolean;
  onAccept: () => void;
  onDiscard: () => void;
}) {
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
        <div className="mt-2.5 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={adkReviewBusy || !sessionReady}
            onClick={() => void onAccept()}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            <span className="inline-flex items-center gap-1.5">
              {adkReviewBusy ? <Loader2 size={14} className="animate-spin" /> : null}
              Accept
            </span>
          </button>
          <button
            type="button"
            disabled={adkReviewBusy || !sessionReady}
            onClick={() => void onDiscard()}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-white/5 disabled:opacity-50"
          >
            Discard
          </button>
        </div>
      ) : (
        <p className="mt-1.5 text-[11px] leading-snug text-slate-500 dark:text-slate-400">
          Replaced by a newer edit. Use the latest review below to accept or discard.
        </p>
      )}
    </div>
  );
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ incomingRequest, onRequestHandled }) => {
  const {
    messages,
    setMessages,
    sendMainMessage,
    sendTopicMessage,
    isAgentLoading,
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

  const [pendingRewind, setPendingRewind] = useState<{
    invocationId: string;
    previewText: string;
    targetSessionId: string;
    topicId?: string;
  } | null>(null);

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

  const openRewindDialog = useCallback(
    (message: ChatMessage, targetSessionId: string, topicId?: string) => {
      if (!message.invocationId || !canRewind) return;
      setPendingRewind({
        invocationId: message.invocationId,
        previewText: message.text,
        targetSessionId,
        topicId,
      });
    },
    [canRewind]
  );

  const handleRewindConfirm = useCallback(
    async (revertEditorState: boolean) => {
      if (!pendingRewind) return;
      try {
        await rewindToMessage({
          invocationId: pendingRewind.invocationId,
          previewText: pendingRewind.previewText,
          revertEditorState,
          targetSessionId: pendingRewind.targetSessionId,
          topicId: pendingRewind.topicId,
        });
      } catch (err) {
        setStreamError(formatUnibotStreamError(err, { source: "rewind" }));
      } finally {
        setPendingRewind(null);
      }
    },
    [pendingRewind, rewindToMessage, setStreamError]
  );

  const [historyPanelOpen, setHistoryPanelOpen] = useState(false);
  const [historySearchQuery, setHistorySearchQuery] = useState("");
  const [allChatsOpen, setAllChatsOpen] = useState(true);
  const [pendingDeleteSession, setPendingDeleteSession] = useState<{ id: string; title: string } | null>(null);
  const [isDeletingSession, setIsDeletingSession] = useState(false);
  const [topicInputs, setTopicInputs] = useState<{ [key: string]: string }>({});
  const [improveReplyTopicId, setImproveReplyTopicId] = useState<string | null>(null);
  const lastIncomingSigRef = useRef<string | null>(null);
  const pendingRetryRef = useRef<{ text: string; topicId?: string; botMsgId?: string } | null>(null);
  const contentGenFunnelRef = useRef<ContentGenFunnel | null>(null);
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
  const queryClient = useQueryClient();
  const adkReviewStack = useAdkResumeReviewStore(s => s.reviewStack);
  const adkActiveReviewId = useAdkResumeReviewStore(s => s.reviewStack.at(-1)?.id ?? null);
  const adkPortfolioReviewStack = useAdkPortfolioReviewStore(s => s.reviewStack);
  const adkPortfolioActiveReviewId = useAdkPortfolioReviewStore(s => s.reviewStack.at(-1)?.id ?? null);
  const adkContentGenReviewStack = useAdkContentGenReviewStore(s => s.reviewStack);
  const adkContentGenActiveReviewId = useAdkContentGenReviewStore(s => s.reviewStack.at(-1)?.id ?? null);
  const adkApplicationAssetReviewStack = useAdkApplicationAssetReviewStore(s => s.reviewStack);
  const adkApplicationAssetActiveReviewId = useAdkApplicationAssetReviewStore(s => s.reviewStack.at(-1)?.id ?? null);
  const pathname = usePathname();

  const reviewMainSessionId = useMemo(() => {
    if (!sessionId) return "";
    const row = getRegistryRow(sessionId);
    if (row?.kind === "sub" && row.parent_adk_session_id) {
      return row.parent_adk_session_id;
    }
    return sessionId;
  }, [sessionId]);

  const [adkReviewBusy, setAdkReviewBusy] = useState(false);
  const {
    adkReviewBusy: applicationAssetReviewBusy,
    acceptApplicationAssetReview,
    discardApplicationAssetReview,
  } = useApplicationAssetReviewActions({ userId, mainSessionId: reviewMainSessionId });
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
  const [selectionSentPill, setSelectionSentPill] = useState<string | null>(null);
  const selectionSentPillTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    (botMessage: string, assistantMessageId: string, assetTypeOverride?: ApplicationAssetApiType, threadMessages?: ChatMessage[]) => {
      const studio = useApplicationAssetStudioStore.getState();
      const offered = offerApplicationAssetDraftReview({
        botMessage,
        assistantMessageId,
        pathname,
        assetTypeOverride: assetTypeOverride ?? studio.assetType ?? undefined,
        threadMessages,
        userId,
        sessionId: reviewMainSessionId,
      });
      if (offered) {
        applicationAssetLastSyncedBotIdRef.current = assistantMessageId;
      }
      return offered;
    },
    [pathname, userId, reviewMainSessionId]
  );

  const tryOfferContentGenDraftReview = useCallback(
    (botMessage: string, assistantMessageId: string, topicOverride?: string, threadMessages?: ChatMessage[]) => {
      const studio = useContentGenStudioStore.getState();
      const offered = offerContentGenDraftReview({
        botMessage,
        assistantMessageId,
        pathname,
        topicOverride,
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
      const d = (e as CustomEvent<{ topic?: string; funnel?: ContentGenFunnel }>).detail;
      const topic = d?.topic?.trim();
      if (!topic || !userId || !sessionReady) {
        return;
      }
      contentGenFunnelRef.current = d.funnel ?? null;
      setIsCollapsed(false);

      const topicId = newId("topic");
      const bootstrap = buildContentGenDraftBootstrap(topic);
      const initialUserMsg: ChatMessage = {
        id: newId("u"),
        role: "user",
        text: bootstrap,
        timestamp: new Date(),
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
        topicTitle: "LinkedIn Draft",
        isExpanded: true,
        messages: [initialUserMsg, placeholderMsg],
      };

      contentGenAdkDraftJobRef.current = {
        topicId,
        botMsgId,
        topic,
        funnel: d.funnel ?? null,
      };

      setMessages(prev => [...prev, newTopic]);

      void (async () => {
        try {
          if (isAgentLoading || isLoadingHistory) {
            return;
          }
          const mainId = reviewMainSessionId || sessionId;
          const sub = await ensureContentGenTopicSubSession({
            userId,
            mainAdkSessionId: mainId,
            mode: "draft",
            topic,
            title: `LinkedIn Draft · ${topic}`,
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
            if (contentGenAdkDraftJobRef.current?.topicId === topicId) {
              contentGenAdkDraftJobRef.current = {
                ...contentGenAdkDraftJobRef.current,
                topicId: stableTopicId,
              };
            }
          }
          await sendTopicMessage(initialUserMsg.text, botMsgId, subAdkId ? { sessionIdOverride: subAdkId } : undefined);
        } catch (err) {
          const job = contentGenAdkDraftJobRef.current;
          contentGenAdkDraftJobRef.current = null;
          handleStreamFailure(err, { text: initialUserMsg.text, topicId, botMsgId });
          if (job) {
            void attemptContentGenDjangoFallback(job.topic, job.funnel);
          }
        }
      })();
    };

    window.addEventListener(CONTENT_GEN_EVENTS.openDraft, onOpenDraft);
    return () => window.removeEventListener(CONTENT_GEN_EVENTS.openDraft, onOpenDraft);
  }, [
    attemptContentGenDjangoFallback,
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
      const d = (
        e as CustomEvent<{
          assetType: ApplicationAssetApiType;
          assetId?: string;
          role: string;
          company: string;
          jobDescription: string;
          contactName?: string;
        }>
      ).detail;
      if (!d?.assetType || !userId || !sessionReady) {
        return;
      }
      setIsCollapsed(false);

      const topicId = newId("topic");
      const bootstrap = buildApplicationAssetDraftBootstrap(d.assetType, d.role, d.company, d.jobDescription, d.contactName);
      const initialUserMsg: ChatMessage = {
        id: newId("u"),
        role: "user",
        text: bootstrap,
        timestamp: new Date(),
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
        topicKind: "application_asset",
        topicTitle: applicationAssetTopicTitle(d.assetType, d.company, d.role),
        isExpanded: true,
        messages: [initialUserMsg, placeholderMsg],
      };

      applicationAssetAdkDraftJobRef.current = {
        topicId,
        botMsgId,
        assetType: d.assetType,
        assetId: d.assetId?.trim() || undefined,
      };

      setMessages(prev => [...prev, newTopic]);

      void (async () => {
        try {
          if (isAgentLoading || isLoadingHistory) {
            return;
          }
          const mainId = reviewMainSessionId || sessionId;
          const topicTitle = applicationAssetTopicTitle(d.assetType, d.company, d.role);
          const sub = await ensureApplicationAssetTopicSubSession({
            userId,
            mainAdkSessionId: mainId,
            assetType: d.assetType,
            role: d.role,
            company: d.company,
            assetId: d.assetId,
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
            if (applicationAssetAdkDraftJobRef.current?.topicId === topicId) {
              applicationAssetAdkDraftJobRef.current = {
                ...applicationAssetAdkDraftJobRef.current,
                topicId: stableTopicId,
              };
            }
          }
          await sendTopicMessage(initialUserMsg.text, botMsgId, subAdkId ? { sessionIdOverride: subAdkId } : undefined);
        } catch (err) {
          const job = applicationAssetAdkDraftJobRef.current;
          applicationAssetAdkDraftJobRef.current = null;
          handleStreamFailure(err, { text: initialUserMsg.text, topicId, botMsgId });
        }
      })();
    };

    window.addEventListener(APPLICATION_ASSET_EVENTS.openDraft, onOpenApplicationAssetDraft);
    return () => window.removeEventListener(APPLICATION_ASSET_EVENTS.openDraft, onOpenApplicationAssetDraft);
  }, [
    handleStreamFailure,
    isAgentLoading,
    isLoadingHistory,
    reviewMainSessionId,
    sendTopicMessage,
    sessionId,
    sessionReady,
    setMessages,
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

    if (useApplicationAssetStudioStore.getState().selectionRefineLoading) {
      useApplicationAssetStudioStore.getState().setSelectionRefineLoading(false);
    }

    if (!streamJustCompleted) {
      return;
    }

    const aaJob = applicationAssetAdkDraftJobRef.current;
    if (aaJob) {
      const topicCard = messages.find(m => m.id === aaJob.topicId && m.topicKind === "application_asset");
      const botMsg = topicCard?.messages?.find(m => m.id === aaJob.botMsgId);
      applicationAssetAdkDraftJobRef.current = null;

      if (botMsg?.isError || !botMsg?.text?.trim()) {
        window.dispatchEvent(
          new CustomEvent(APPLICATION_ASSET_EVENTS.draftFailed, {
            detail: { message: "Draft generation failed. Please try again." },
          })
        );
        return;
      }

      const offered = tryOfferApplicationAssetDraftReview(botMsg.text, aaJob.botMsgId, aaJob.assetType);
      if (!offered) {
        window.dispatchEvent(
          new CustomEvent(APPLICATION_ASSET_EVENTS.draftFailed, {
            detail: { message: "Could not read the generated draft. Please try again." },
          })
        );
      }
      return;
    }

    const job = contentGenAdkDraftJobRef.current;
    if (job) {
      const topicCard = messages.find(m => m.id === job.topicId && m.topicKind === "content_gen");
      const botMsg = topicCard?.messages?.find(m => m.id === job.botMsgId);
      contentGenAdkDraftJobRef.current = null;

      if (botMsg?.isError || !botMsg?.text?.trim()) {
        void attemptContentGenDjangoFallback(job.topic, job.funnel);
        return;
      }

      if (!tryOfferContentGenDraftReview(botMsg.text, job.botMsgId, job.topic, topicCard?.messages)) {
        void attemptContentGenDjangoFallback(job.topic, job.funnel);
      }
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
        tryOfferContentGenDraftReview(lastBot.text, lastBot.id, undefined, threadMessages);
        continue;
      }
      if (card.topicKind === "application_asset") {
        const threadMessages = card.messages ?? [];
        const lastBot = [...threadMessages].reverse().find(m => m.role === "model" && m.text?.trim() && !m.isError);
        if (!lastBot?.id || applicationAssetLastSyncedBotIdRef.current === lastBot.id) {
          continue;
        }
        tryOfferApplicationAssetDraftReview(lastBot.text, lastBot.id, undefined, threadMessages);
      }
    }
  }, [
    attemptContentGenDjangoFallback,
    isAgentLoading,
    isLoadingHistory,
    messages,
    tryOfferApplicationAssetDraftReview,
    tryOfferContentGenDraftReview,
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
        out.push({ id: m.id, title: m.topicTitle, subtitle: "Improve thread" });
      }
    }
    return out.reverse();
  }, [messages]);

  const sessionSubEntries = useMemo(() => {
    const topicSubIds = new Set(messages.filter(m => m.isTopic && m.subSessionAdkId).map(m => m.subSessionAdkId as string));
    return thisSessionSubs
      .filter(s => !topicSubIds.has(s.id))
      .map(s => ({
        topicId: topicIdForSubSession(s.id),
        subAdkSessionId: s.id,
        title: s.title,
        subtitle: "Improve thread" as const,
      }));
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

  const openImproveSubTopic = useCallback(
    async (subAdkSessionId: string, title: string, promptText: string) => {
      const topicId = topicIdForSubSession(subAdkSessionId);
      const existing = findImproveTopic(messages, subAdkSessionId);

      if (!existing) {
        const nested = await loadSubSessionChatMessages(userId, subAdkSessionId);
        const userMsg: ChatMessage = {
          id: newId("u"),
          role: "user",
          text: promptText,
          timestamp: new Date(),
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
          topicTitle: title,
          isExpanded: true,
          subSessionAdkId: subAdkSessionId,
          messages: [...nested, userMsg, placeholderMsg],
        };
        setMessages(prev => insertTopicInMainThread(prev, newTopic));
        setImproveReplyTopicId(topicId);
        pendingRetryRef.current = { text: promptText, topicId, botMsgId };
        try {
          await sendTopicMessage(promptText, botMsgId, { sessionIdOverride: subAdkSessionId });
          pendingRetryRef.current = null;
        } catch (err) {
          handleStreamFailure(err, { text: promptText, topicId, botMsgId });
        }
        return;
      }

      const userMsg: ChatMessage = {
        id: newId("u"),
        role: "user",
        text: promptText,
        timestamp: new Date(),
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
                topicTitle: title,
                isExpanded: true,
                messages: [...(msg.messages || []), userMsg, placeholderMsg],
              }
            : msg
        )
      );
      setImproveReplyTopicId(topicId);
      pendingRetryRef.current = { text: promptText, topicId, botMsgId };
      try {
        await sendTopicMessage(promptText, botMsgId, { sessionIdOverride: subAdkSessionId });
        pendingRetryRef.current = null;
      } catch (err) {
        handleStreamFailure(err, { text: promptText, topicId, botMsgId });
      }
    },
    [messages, userId, setMessages, sendTopicMessage, handleStreamFailure]
  );

  const findContentGenTopicId = useCallback((): string | null => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m?.isTopic && m.topicKind === "content_gen") {
        return m.id;
      }
    }
    return null;
  }, [messages]);

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

    if (req.type === "content_gen_topic") {
      const followUp = req.followUpText?.trim();
      const topicTitle = req.topicTitle?.trim() || (followUp ? "Improve LinkedIn Post" : "LinkedIn Topic");

      if (followUp) {
        const inferred = inferFunnelFromChipLabel(followUp);
        if (inferred) {
          contentGenFunnelRef.current = inferred;
        }
      } else {
        contentGenFunnelRef.current = null;
      }

      const initialText = followUp ?? buildContentGenTopicBootstrap(req.seedTopic);
      const existingTopicId = req.reuseExistingTopic !== false && followUp ? findContentGenTopicId() : null;

      if (existingTopicId) {
        void (async () => {
          try {
            if (!userId || !sessionReady || isAgentLoading || isLoadingHistory) {
              return;
            }
            const topicId = existingTopicId;
            const userMsg: ChatMessage = {
              id: newId("u"),
              role: "user",
              text: initialText,
              timestamp: new Date(),
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
            pendingRetryRef.current = { text: initialText, topicId, botMsgId };
            const topicRow = messages.find(m => m.id === topicId && m.isTopic);
            const subAdkId = topicRow?.subSessionAdkId;
            await sendTopicMessage(initialText, botMsgId, subAdkId ? { sessionIdOverride: subAdkId } : undefined);
            pendingRetryRef.current = null;
          } catch (err) {
            handleStreamFailure(err, { text: initialText, topicId: existingTopicId });
          }
        })();
        return;
      }

      const topicId = newId("topic");
      const initialUserMsg: ChatMessage = {
        id: newId("u"),
        role: "user",
        text: initialText,
        timestamp: new Date(),
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

      void (async () => {
        try {
          if (!userId || !sessionReady || isAgentLoading || isLoadingHistory) {
            return;
          }
          const mainId = reviewMainSessionId || sessionId;
          const sub = await ensureContentGenTopicSubSession({
            userId,
            mainAdkSessionId: mainId,
            mode: followUp ? "draft" : "topic",
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
          pendingRetryRef.current = { text: initialText, topicId: stableTopicId, botMsgId };
          await sendTopicMessage(initialText, botMsgId, subAdkId ? { sessionIdOverride: subAdkId } : undefined);
          pendingRetryRef.current = null;
        } catch (err) {
          handleStreamFailure(err, { text: initialText, topicId, botMsgId });
        }
      })();
      return;
    }

    const isImproveSubSession = Boolean(req.featureId && req.section) && (req.improveType === "resume" || req.improveType === "linkedin");

    const promptText =
      req.improveType === "linkedin" ? req.text.trim() : `Please improve the following text for my resume:\n\n"${req.text}"`;

    void (async () => {
      try {
        if (!userId || !sessionReady) return;

        if (isImproveSubSession && req.featureId && req.section) {
          const mainId = currentMainSessionId ?? sessionId;
          if (!getRegistryRow(mainId)) {
            const regMain = await registerUnibotAdkSessionAction({
              adk_session_id: mainId,
              kind: "main",
              title: UNTITLED_THREAD_TITLE,
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
          });

          if (!resolved.success || !resolved.adkSessionId) {
            throw new Error(resolved.error ?? "Could not open improve chat");
          }

          await refreshSessions();
          await openImproveSubTopic(resolved.adkSessionId, resolved.title ?? "Resume · Content improvement", promptText);
        } else {
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
  ]);

  useEffect(() => {
    if (!improveReplyTopicId) return;
    if (!messages.some(m => m.id === improveReplyTopicId && m.isTopic)) setImproveReplyTopicId(null);
  }, [messages, improveReplyTopicId]);

  const improveContextTopic = useMemo(() => messages.find(m => m.id === improveReplyTopicId && m.isTopic), [messages, improveReplyTopicId]);

  // Standard chat ordering: oldest at the top, newest at the bottom, with the
  // scroll viewport pinned to the latest message. The newest-first reverse
  // from the designer commit was inverting both new chats and history, so we
  // drop it and scroll to the bottom on each update.
  const scrollToLatest = () => {
    requestAnimationFrame(() => {
      const el = messagesScrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  };

  useEffect(() => {
    scrollToLatest();
  }, [
    messages,
    isCollapsed,
    adkReviewStack,
    adkActiveReviewId,
    adkPortfolioReviewStack,
    adkPortfolioActiveReviewId,
    adkContentGenReviewStack,
    adkContentGenActiveReviewId,
  ]);

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

  const canSendMessage = Boolean(userId && sessionReady && !isAgentLoading && !isLoadingHistory && !isContentGenPublishing);
  const canSend = canSendMessage && !streamError;

  const canUseHistory = Boolean(userId && !isBootstrappingSession);

  /** When a streaming placeholder exists in the transcript, loading UI stays inline only (no duplicate footer). */
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

  const handleAdkAccept = useCallback(async () => {
    const card = useAdkResumeReviewStore.getState().getActiveCard();
    setAdkReviewBusy(true);
    try {
      await useAdkResumeReviewStore.getState().acceptAndSave();
      if (card?.assistantMessageId && userId && reviewMainSessionId) {
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
    setAdkReviewBusy(true);
    try {
      await useAdkPortfolioReviewStore.getState().acceptAndSave();
      if (card?.assistantMessageId && userId && reviewMainSessionId) {
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
    [appendContentGenPublishHint, setContentGenPublishBotText, setMessages]
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

  const sendUserMessageToTopic = useCallback(
    async (topicId: string, text: string, actionMeta?: AssetActionMeta) => {
      const trimmed = text.trim();
      if (!trimmed || !canSend) return;
      const outboundText = withPersistedActionLabel(trimmed, actionMeta?.presetLabel);
      const topic = messages.find(m => m.id === topicId && m.isTopic);
      let subAdkId = topic?.subSessionAdkId;
      let effectiveTopicId = topicId;

      if (topic && !subAdkId && userId && reviewMainSessionId) {
        if (topic.topicKind === "application_asset") {
          const studio = useApplicationAssetStudioStore.getState();
          const sub = await ensureApplicationAssetTopicSubSession({
            userId,
            mainAdkSessionId: reviewMainSessionId,
            assetType: studio.assetType ?? "coverletter",
            role: studio.role,
            company: studio.company,
            assetId: studio.assetId,
            title: topic.topicTitle ?? applicationAssetTopicTitle(studio.assetType ?? "coverletter", studio.company, studio.role),
          });
          if (sub) {
            subAdkId = sub.subAdkSessionId;
            effectiveTopicId = sub.stableTopicId;
          }
        } else if (topic.topicKind === "content_gen") {
          const sub = await ensureContentGenTopicSubSession({
            userId,
            mainAdkSessionId: reviewMainSessionId,
            mode: topic.topicTitle?.includes("Topic") ? "topic" : "draft",
            topic: topic.topicTitle,
            title: topic.topicTitle ?? "LinkedIn Draft",
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
      };
      const botMsgId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : newId("bot");
      const placeholderMsg: ChatMessage = { id: botMsgId, role: "model", text: "", timestamp: new Date() };
      if (actionMeta && topic?.topicKind === "application_asset") {
        applicationAssetAdkDraftJobRef.current = {
          topicId: effectiveTopicId,
          botMsgId,
          assetType: actionMeta.assetType as ApplicationAssetApiType,
        };
      }
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
      } catch (err) {
        handleStreamFailure(err, { text: outboundText, topicId: effectiveTopicId, botMsgId });
      }
    },
    [canSend, messages, sendTopicMessage, handleStreamFailure, setMessages, userId, reviewMainSessionId]
  );

  const findApplicationAssetTopicId = useCallback((): string | null => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m?.isTopic && m.topicKind === "application_asset") {
        return m.id;
      }
    }
    return null;
  }, [messages]);

  const sendApplicationAssetRefinement = useCallback(
    async (message: string, assetType: ApplicationAssetApiType, actionMeta?: AssetActionMeta, options?: { topicTitle?: string }) => {
      if (!userId || !sessionReady) {
        return;
      }
      setIsCollapsed(false);
      useApplicationAssetStudioStore.getState().setSelectionRefineLoading(true);

      const outboundText = withPersistedActionLabel(message, actionMeta?.presetLabel);

      const existingTopicId = findApplicationAssetTopicId();
      if (existingTopicId) {
        await sendUserMessageToTopic(existingTopicId, message, actionMeta);
        return;
      }

      const studio = useApplicationAssetStudioStore.getState();
      const topicId = newId("topic");
      const userMsg: ChatMessage = {
        id: newId("u"),
        role: "user",
        text: outboundText,
        timestamp: new Date(),
        assetActionMeta: actionMeta,
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
        assetType,
      };
      const newTopic: ChatMessage = {
        id: topicId,
        role: "model",
        text: "",
        timestamp: new Date(),
        isTopic: true,
        topicKind: "application_asset",
        topicTitle: options?.topicTitle ?? applicationAssetTopicTitle(assetType, studio.company, studio.role),
        isExpanded: true,
        messages: [userMsg, placeholderMsg],
      };

      setMessages(prev => [...prev, newTopic]);

      try {
        if (isAgentLoading || isLoadingHistory) {
          useApplicationAssetStudioStore.getState().setSelectionRefineLoading(false);
          return;
        }
        pendingRetryRef.current = { text: outboundText, topicId, botMsgId };
        const mainId = reviewMainSessionId || sessionId;
        const topicTitle = options?.topicTitle ?? applicationAssetTopicTitle(assetType, studio.company, studio.role);
        const sub = await ensureApplicationAssetTopicSubSession({
          userId,
          mainAdkSessionId: mainId,
          assetType,
          role: studio.role,
          company: studio.company,
          assetId: studio.assetId,
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
          if (applicationAssetAdkDraftJobRef.current?.topicId === topicId) {
            applicationAssetAdkDraftJobRef.current = {
              ...applicationAssetAdkDraftJobRef.current,
              topicId: stableTopicId,
            };
          }
        }
        await sendTopicMessage(outboundText, botMsgId, subAdkId ? { sessionIdOverride: subAdkId } : undefined);
        pendingRetryRef.current = null;
      } catch (err) {
        useApplicationAssetStudioStore.getState().setSelectionRefineLoading(false);
        handleStreamFailure(err, { text: outboundText, topicId, botMsgId });
      }
    },
    [
      userId,
      sessionReady,
      findApplicationAssetTopicId,
      sendUserMessageToTopic,
      setMessages,
      isAgentLoading,
      isLoadingHistory,
      reviewMainSessionId,
      sessionId,
      sendTopicMessage,
      handleStreamFailure,
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
      store.clearSelection();
      store.setPendingRefineContext({
        assetType: d.assetType,
        selectedText: d.selectedText,
        presetLabel: d.presetLabel,
        kind: "preset",
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
      store.clearSelection();
      store.setPendingRefineContext({
        assetType: d.assetType,
        selectedText: d.selectedText.trim(),
        kind: "freeform",
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
          topicTitle: applicationAssetImproveTopicTitle(d.assetType),
        });
        return;
      }

      setFullDocumentImproveContext({
        assetType: d.assetType,
        assetId: d.assetId,
        role: d.role,
        company: d.company,
      });
    };

    window.addEventListener(APPLICATION_ASSET_EVENTS.selectionRefine, onSelectionRefine);
    window.addEventListener(APPLICATION_ASSET_EVENTS.selectionFreeform, onSelectionFreeform);
    window.addEventListener(APPLICATION_ASSET_EVENTS.openImprove, onOpenImprove);
    return () => {
      window.removeEventListener(APPLICATION_ASSET_EVENTS.selectionRefine, onSelectionRefine);
      window.removeEventListener(APPLICATION_ASSET_EVENTS.selectionFreeform, onSelectionFreeform);
      window.removeEventListener(APPLICATION_ASSET_EVENTS.openImprove, onOpenImprove);
    };
  }, [sendApplicationAssetRefinement, showSelectionSentPill]);

  const handleFullDocumentPreset = useCallback(
    (preset: ApplicationAssetSelectionPreset) => {
      if (!fullDocumentImproveContext || !preset.fullDocumentInstruction) {
        return;
      }
      const { assetType } = fullDocumentImproveContext;
      const message = buildFullDocumentRefineUserMessage(assetType, preset.fullDocumentInstruction);
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

      if (fullDocumentImproveContext) {
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
          void generateMainSessionTitleIfNeeded(mainId, textToSend, refreshSessions);
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
      refreshSessions,
      setMessages,
      setInput,
      selectionQuoteContext,
      fullDocumentImproveContext,
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
    if (!canUseHistory || isAgentLoading) return;
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
                  detail: { topic: resolvedTopic, funnel },
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
        await sendTopicMessage(text.trim(), botMsgId);
        pendingRetryRef.current = null;
      } catch (err) {
        handleStreamFailure(err, { text: text.trim(), topicId, botMsgId });
      }
    },
    [canSend, handleContentGenPublishIntent, messages, sendTopicMessage, handleStreamFailure, setMessages]
  );

  const handleContentGenImprove = useCallback(
    async (topicId: string | null) => {
      const kickoff = CONTENT_GEN_IMPROVE_KICKOFF_USER_MESSAGE;
      const resolvedTopicId = topicId ?? [...messages].reverse().find(m => m.isTopic && m.topicKind === "content_gen")?.id ?? null;

      if (resolvedTopicId) {
        await sendTopicCardMessage(resolvedTopicId, kickoff);
        return;
      }

      try {
        await sendMainMessage(kickoff);
      } catch (err) {
        handleStreamFailure(err, { text: kickoff });
      }
    },
    [messages, sendTopicCardMessage, sendMainMessage, handleStreamFailure]
  );

  const handleApplyContentGenTopic = useCallback(
    (topicId: string, title: string, funnel: ContentGenFunnel | null) => {
      contentGenAppliedTopicRef.current = title.trim();
      const resolvedFunnel = funnel ?? contentGenFunnelRef.current ?? undefined;
      window.dispatchEvent(
        new CustomEvent(CONTENT_GEN_EVENTS.applyTopic, {
          detail: { topic: title, funnel: resolvedFunnel },
        })
      );
      setMessages(prev => prev.map(msg => (msg.id === topicId ? { ...msg, isExpanded: false } : msg)));
    },
    [setMessages]
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
            detail: { topic, funnel },
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
    (topicId: string, label: string) => {
      const inferred = inferFunnelFromChipLabel(label);
      if (inferred) {
        contentGenFunnelRef.current = inferred;
      }
      void sendTopicCardMessage(topicId, label);
    },
    [sendTopicCardMessage]
  );

  const handleMainContentGenAffirmation = useCallback((label: string) => {
    const inferred = inferFunnelFromChipLabel(label);
    if (inferred) {
      contentGenFunnelRef.current = inferred;
      const studioTopic = useContentGenStudioStore.getState().topic;
      window.dispatchEvent(
        new CustomEvent(CONTENT_GEN_EVENTS.applyTopic, {
          detail: { topic: studioTopic, funnel: inferred },
        })
      );
    }
    window.dispatchEvent(
      new CustomEvent(CONTENT_GEN_EVENTS.openTopic, {
        detail: { followUpText: label, requestKey: Date.now() },
      })
    );
  }, []);

  const handleMainApplyContentGenTopic = useCallback((title: string, funnel: ContentGenFunnel | null) => {
    const resolvedFunnel = funnel ?? contentGenFunnelRef.current ?? undefined;
    window.dispatchEvent(
      new CustomEvent(CONTENT_GEN_EVENTS.applyTopic, {
        detail: { topic: title, funnel: resolvedFunnel },
      })
    );
  }, []);

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

  if (isCollapsed) {
    return (
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

        {messages.map(msg => {
          if (msg.isTopic) {
            const expanded = msg.isExpanded !== false;
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
                  <span className="truncate text-xs font-medium uppercase tracking-wide text-slate-500 transition-colors group-hover:text-brand-600 dark:text-slate-400">
                    {msg.topicTitle}
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
                    <div className="space-y-4 mb-3">
                      {msg.messages?.map(subMsg => {
                        const isContentGen = msg.topicKind === "content_gen";
                        const isApplicationAsset = msg.topicKind === "application_asset";
                        const subHasDraft =
                          isContentGen && subMsg.role === "model" && Boolean(subMsg.text && messageHasContentGenDraft(subMsg.text));
                        const subHasPlanner =
                          isContentGen &&
                          subMsg.role === "model" &&
                          Boolean(subMsg.text && messageHasPlannerChips(subMsg.text) && !subHasDraft);
                        const modelVisibleText =
                          subMsg.role === "model" && subMsg.text
                            ? isContentGen
                              ? subHasDraft
                                ? stripContentGenDraftFromMessage(subMsg.text)
                                : subHasPlanner
                                  ? stripPlannerJsonFromMessage(subMsg.text)
                                  : stripMachineReadablePayloadFromMessage(subMsg.text)
                              : isApplicationAsset
                                ? stripApplicationAssetDraftFromMessage(subMsg.text)
                                : stripMachineReadablePayloadFromMessage(subMsg.text)
                            : "";
                        const userVisibleText =
                          subMsg.role === "user" && subMsg.text
                            ? isContentGen
                              ? contentGenTopicUserDisplayText(subMsg.text)
                              : subMsg.text
                            : "";
                        const showModelBubble =
                          subMsg.role === "model" &&
                          (modelVisibleText || !subMsg.text || isStreamingMachineReadablePayloadOnly(subMsg.text));
                        const showUserBubble = subMsg.role === "user" && userVisibleText;
                        const hasActionCard = subMsg.role === "user" && subMsg.assetActionMeta;

                        return (
                          <div key={subMsg.id} className={`flex flex-col gap-1 ${subMsg.role === "user" ? "items-end" : "items-start"}`}>
                            {subMsg.isError ? (
                              <UnibotErrorBubble message={subMsg} onRetry={retryFailedStream} />
                            ) : hasActionCard ? (
                              <RefineActionCard meta={subMsg.assetActionMeta!} />
                            ) : showModelBubble || showUserBubble ? (
                              subMsg.role === "user" && showUserBubble ? (
                                <div className="group flex max-w-full flex-col items-end">
                                  {subMsg.invocationId ? (
                                    <button
                                      type="button"
                                      onClick={() => openRewindDialog(subMsg, msg.subSessionAdkId ?? sessionId, msg.id)}
                                      disabled={!canRewind}
                                      title="Rewind to here"
                                      aria-label="Rewind to here"
                                      className="mb-0.5 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-slate-400 opacity-0 transition-opacity hover:text-brand-600 group-hover:opacity-100 disabled:opacity-30"
                                    >
                                      <Undo2 size={12} aria-hidden />
                                      <span>Rewind</span>
                                    </button>
                                  ) : null}
                                  <div className="rounded-2xl rounded-tr-sm bg-slate-50 px-3 py-2 text-[13px] leading-relaxed text-slate-800 dark:bg-white/5 dark:text-slate-100">
                                    <span className="whitespace-pre-wrap">{userVisibleText}</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-[13px] py-2 px-3 leading-relaxed text-slate-600 dark:text-slate-300">
                                  {modelVisibleText ? (
                                    <FormattedAgentMessage content={modelVisibleText} />
                                  ) : (
                                    <div className="flex items-center gap-2 text-slate-400">
                                      <Loader2 size={14} className="animate-spin shrink-0" />
                                      <span>{contentGenPublishActivity[subMsg.id] ?? streamActivityLabel ?? "Thinking…"}</span>
                                    </div>
                                  )}
                                </div>
                              )
                            ) : null}
                            {subHasPlanner ? (
                              <ContentGenTopicChips
                                botMessage={subMsg.text!}
                                topicId={msg.id}
                                activeFunnel={contentGenFunnelRef.current}
                                onAffirmationClick={(label, _f) => handleContentGenAffirmation(msg.id, label)}
                                onUseTopic={(title, funnel) => handleApplyContentGenTopic(msg.id, title, funnel)}
                                onActionClick={handleContentGenAction}
                              />
                            ) : null}
                            {subMsg.role === "model" &&
                            adkContentGenReviewStack.some(
                              c => c.assistantMessageId === subMsg.id && c.id === adkContentGenActiveReviewId
                            ) ? (
                              <ContentGenDraftReviewChips
                                disabled={adkReviewBusy || !sessionReady}
                                onAccept={() => void handleContentGenAccept()}
                                onImprove={() => void handleContentGenImprove(msg.id)}
                              />
                            ) : null}
                            {subMsg.role === "model" &&
                              adkApplicationAssetReviewStack
                                .filter(c => c.assistantMessageId === subMsg.id)
                                .map(card => (
                                  <AdkReviewCardBlock
                                    key={card.id}
                                    card={card}
                                    isActive={card.id === adkApplicationAssetActiveReviewId}
                                    adkReviewBusy={applicationAssetReviewBusy}
                                    sessionReady={sessionReady}
                                    onAccept={() => void acceptApplicationAssetReview()}
                                    onDiscard={discardApplicationAssetReview}
                                  />
                                ))}
                          </div>
                        );
                      })}
                    </div>

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
              ? stripContentGenDraftFromMessage(msg.text!)
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
                  {msg.invocationId ? (
                    <button
                      type="button"
                      onClick={() => openRewindDialog(msg, sessionId)}
                      disabled={!canRewind}
                      title="Rewind to here"
                      aria-label="Rewind to here"
                      className="mb-0.5 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-slate-400 opacity-0 transition-opacity hover:text-brand-600 group-hover:opacity-100 disabled:opacity-30"
                    >
                      <Undo2 size={12} aria-hidden />
                      <span>Rewind</span>
                    </button>
                  ) : null}
                  <div className="rounded-2xl rounded-tr-sm bg-slate-100 px-4 py-3 text-[13px] leading-relaxed text-slate-900 dark:bg-white/5 dark:text-slate-100">
                    <span className="whitespace-pre-wrap">{msg.text}</span>
                  </div>
                </div>
              ) : (
                <div className="max-w-full bg-transparent px-1 text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">
                  {msg.role === "model" && mainModelVisible ? (
                    <FormattedAgentMessage content={mainModelVisible} />
                  ) : msg.role === "model" && (!msg.text || isStreamingMachineReadablePayloadOnly(msg.text)) ? (
                    <div className="flex items-center gap-2 text-slate-400 px-1">
                      <Loader2 size={14} className="animate-spin shrink-0" />
                      <span>{contentGenPublishActivity[msg.id] ?? streamActivityLabel ?? "Thinking…"}</span>
                    </div>
                  ) : null}
                </div>
              )}
              {mainPlannerPayload ? (
                <ContentGenTopicChips
                  botMessage={mainPlannerPayload}
                  activeFunnel={contentGenFunnelRef.current}
                  onAffirmationClick={label => handleMainContentGenAffirmation(label)}
                  onUseTopic={(title, funnel) => handleMainApplyContentGenTopic(title, funnel)}
                  onActionClick={handleContentGenAction}
                />
              ) : null}
              {msg.role === "model" &&
              adkContentGenReviewStack.some(c => c.assistantMessageId === msg.id && c.id === adkContentGenActiveReviewId) ? (
                <ContentGenDraftReviewChips
                  disabled={adkReviewBusy || !sessionReady}
                  onAccept={() => void handleContentGenAccept()}
                  onImprove={() => void handleContentGenImprove(null)}
                />
              ) : null}
              {msg.role === "model" &&
                adkApplicationAssetReviewStack
                  .filter(c => c.assistantMessageId === msg.id)
                  .map(card => (
                    <AdkReviewCardBlock
                      key={card.id}
                      card={card}
                      isActive={card.id === adkApplicationAssetActiveReviewId}
                      adkReviewBusy={applicationAssetReviewBusy}
                      sessionReady={sessionReady}
                      onAccept={() => void acceptApplicationAssetReview()}
                      onDiscard={discardApplicationAssetReview}
                    />
                  ))}
              {msg.role === "model" &&
                adkReviewStack
                  .filter(c => c.assistantMessageId === msg.id)
                  .map(card => (
                    <AdkReviewCardBlock
                      key={card.id}
                      card={card}
                      isActive={card.id === adkActiveReviewId}
                      adkReviewBusy={adkReviewBusy}
                      sessionReady={sessionReady}
                      onAccept={handleAdkAccept}
                      onDiscard={handleAdkDiscard}
                    />
                  ))}
              {msg.role === "model" &&
                adkPortfolioReviewStack
                  .filter(c => c.assistantMessageId === msg.id)
                  .map((card: AdkPortfolioReviewCard) => (
                    <AdkReviewCardBlock
                      key={card.id}
                      card={card}
                      isActive={card.id === adkPortfolioActiveReviewId}
                      adkReviewBusy={adkReviewBusy}
                      sessionReady={sessionReady}
                      onAccept={handleAdkPortfolioAccept}
                      onDiscard={handleAdkPortfolioDiscard}
                    />
                  ))}
            </div>
          );
        })}

        {(adkReviewStack.some(c => !c.assistantMessageId) ||
          adkPortfolioReviewStack.some(c => !c.assistantMessageId) ||
          adkContentGenReviewStack.some(c => !c.assistantMessageId) ||
          adkApplicationAssetReviewStack.some(c => !c.assistantMessageId)) && (
          <div className="flex flex-col gap-2 items-start pl-1">
            {adkReviewStack
              .filter(c => !c.assistantMessageId)
              .map(card => (
                <AdkReviewCardBlock
                  key={card.id}
                  card={card}
                  isActive={card.id === adkActiveReviewId}
                  adkReviewBusy={adkReviewBusy}
                  sessionReady={sessionReady}
                  onAccept={handleAdkAccept}
                  onDiscard={handleAdkDiscard}
                />
              ))}
            {adkPortfolioReviewStack
              .filter(c => !c.assistantMessageId)
              .map((card: AdkPortfolioReviewCard) => (
                <AdkReviewCardBlock
                  key={card.id}
                  card={card}
                  isActive={card.id === adkPortfolioActiveReviewId}
                  adkReviewBusy={adkReviewBusy}
                  sessionReady={sessionReady}
                  onAccept={handleAdkPortfolioAccept}
                  onDiscard={handleAdkPortfolioDiscard}
                />
              ))}
            {adkContentGenReviewStack.some(c => !c.assistantMessageId && c.id === adkContentGenActiveReviewId) ? (
              <ContentGenDraftReviewChips
                disabled={adkReviewBusy || !sessionReady}
                onAccept={() => void handleContentGenAccept()}
                onImprove={() => void handleContentGenImprove(null)}
              />
            ) : null}
            {adkApplicationAssetReviewStack
              .filter(c => !c.assistantMessageId)
              .map(card => (
                <AdkReviewCardBlock
                  key={card.id}
                  card={card}
                  isActive={card.id === adkApplicationAssetActiveReviewId}
                  adkReviewBusy={applicationAssetReviewBusy}
                  sessionReady={sessionReady}
                  onAccept={() => void acceptApplicationAssetReview()}
                  onDiscard={discardApplicationAssetReview}
                />
              ))}
          </div>
        )}

        {isAgentLoading && !hasInlineStreamingPlaceholder && (
          <div className="flex flex-col gap-1 items-start pl-1">
            <div className="text-[13px] text-slate-400 flex items-center gap-2 px-1">
              <Loader2 size={14} className="animate-spin" />
              <span>{streamActivityLabel ?? "Thinking…"}</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-white/5">
        <div
          ref={footerInputCardRef}
          className="relative rounded-xl border border-slate-200/90 bg-white px-3 pt-3 pb-2 shadow-sm dark:border-slate-700/80 dark:bg-slate-900"
        >
          {selectionSentPill ? (
            <div className="mb-2">
              <span className="inline-flex max-w-full items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 py-1 pl-2.5 pr-2 text-[11px] font-medium text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-100">
                <Check size={13} className="shrink-0" aria-hidden />
                <span className="truncate">Sent: {selectionSentPill}</span>
              </span>
            </div>
          ) : null}
          {fullDocumentImproveContext ? (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {APPLICATION_ASSET_SELECTION_PRESETS[fullDocumentImproveContext.assetType].map(preset => {
                const Icon = preset.icon;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleFullDocumentPreset(preset)}
                    disabled={!preset.fullDocumentInstruction}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-brand-800 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-brand-500/40 dark:hover:bg-brand-500/10 dark:hover:text-brand-200"
                  >
                    <Icon size={12} className="shrink-0 opacity-80" aria-hidden />
                    {preset.label}
                  </button>
                );
              })}
            </div>
          ) : null}
          {fullDocumentImproveContext ? (
            <div className="mb-2">
              <span className="inline-flex max-w-full items-center gap-1 rounded-full border border-brand-200 bg-brand-50 py-1 pl-2.5 pr-1 text-[11px] font-medium text-brand-900 dark:border-brand-500/40 dark:bg-brand-500/15 dark:text-brand-100">
                <span className="truncate">
                  Editing {assetTypeDisplayLabel(fullDocumentImproveContext.assetType)} · {fullDocumentImproveContext.role} @{" "}
                  {fullDocumentImproveContext.company}
                </span>
                <button
                  type="button"
                  onClick={() => setFullDocumentImproveContext(null)}
                  className="shrink-0 rounded-full p-0.5"
                  aria-label="Clear improve context"
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
                  onClick={() => setSelectionQuoteContext(null)}
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
                  onClick={() => setImproveReplyTopicId(null)}
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
                : fullDocumentImproveContext
                  ? "Tell Unibot how to improve this document…"
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
                  className="absolute bottom-full left-0 right-0 z-40 mb-2 max-h-[min(320px,50vh)] w-[min(280px,90vw)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-600 dark:bg-slate-900"
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
                      <ul className="max-h-[min(120px,18vh)] overflow-y-auto p-1.5">
                        {filteredThisSessionList.map(row => {
                          const active = improveReplyTopicId === row.id;
                          return (
                            <li key={row.id}>
                              <button
                                type="button"
                                className={`w-full rounded-lg px-2 py-1.5 text-left text-[12px] hover:bg-slate-50 dark:hover:bg-slate-800/80 ${
                                  active ? "bg-slate-100 dark:bg-white/10" : ""
                                }`}
                                onClick={() => {
                                  if (row.subAdkSessionId) {
                                    void selectImproveSubFromRegistry(row.subAdkSessionId, row.title);
                                  } else {
                                    selectImproveTopic(row.id);
                                  }
                                }}
                              >
                                <span className="line-clamp-2 font-medium">{row.title}</span>
                                {row.subtitle ? <span className="text-[10px] text-slate-400">{row.subtitle}</span> : null}
                              </button>
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
                  <ul className="scrollbar-on-hover max-h-[min(140px,22vh)] overflow-y-auto py-1" role="listbox">
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
                                  setPendingDeleteSession({ id: group.id, title: group.title });
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
                  Delete chat session?
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
                  This will delete <span className="font-medium text-slate-900 dark:text-slate-100">{pendingDeleteSession.title}</span> from
                  your chat history.
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
                  onClick={() => void onDeleteSession(pendingDeleteSession.id)}
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

      <AdkRewindConfirmDialog
        open={pendingRewind !== null}
        previewText={pendingRewind?.previewText ?? ""}
        isSubmitting={isRewinding}
        onClose={() => {
          if (!isRewinding) setPendingRewind(null);
        }}
        onConfirm={revertEditorState => void handleRewindConfirm(revertEditorState)}
      />
    </div>
  );
};

export default ChatSidebar;
