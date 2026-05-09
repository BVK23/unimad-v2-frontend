import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { fetchColdEmailById } from "@/features/cold-email/server-actions/cold-email-actions";
import type { ColdEmailAsset } from "@/features/cold-email/types";
import { getFirstContentGenDraftFromHistory } from "@/features/content-lab/api/getFirstContentGenDraftFromHistory";
import { mapContentGenToModalPost, type ContentGenModalPost } from "@/features/content-lab/api/mapContentGenToModalPost";
import { useTopicPool } from "@/features/content-lab/hooks/useTopicPool";
import {
  deleteContentGenAsset,
  fetchContentGenAssets,
  fetchUnibotChatHistory,
  generateContentGenAsset,
  postContentGenToLinkedIn,
  uploadContentGenMedia,
  updateContentGenAsset,
} from "@/features/content-lab/server-actions/content-lab-actions";
import type { ContentGenAssetItem } from "@/features/content-lab/types";
import { fetchCoverLetterById } from "@/features/cover-letter/server-actions/cover-letter-actions";
import type { CoverLetterAsset } from "@/features/cover-letter/types";
import { useReferralHistory, useGenerateReferral, type GenerateReferralResult } from "@/features/referral/hooks";
import { fetchReferralById } from "@/features/referral/server-actions/referral-actions";
import type { ReferralAsset } from "@/features/referral/types";
import {
  ThumbsUp,
  MessageSquare,
  Repeat,
  Send,
  MoreHorizontal,
  Globe,
  Wand2,
  Plus,
  FileText,
  ChevronLeft,
  Calendar,
  History,
  Upload,
  Copy,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PortfolioItem } from "../../types";
import { GeneratorContext } from "../../types/jobs";
import ProjectDetailView from "../ProjectDetailView";
import AllPostsModal from "./AllPostsModal";
import AllVPDsModal from "./AllVPDsModal";
import ContentLabColdEmailLeft from "./ContentLabColdEmailLeft";
import ContentLabColdEmailPreview from "./ContentLabColdEmailPreview";
import ContentLabCoverLetterLeft from "./ContentLabCoverLetterLeft";
import ContentLabCoverLetterPreview from "./ContentLabCoverLetterPreview";
import ContentLabReferralPreview from "./ContentLabReferralPreview";
import PostSchedulerModal from "./PostSchedulerModal";
import ReferralHistoryModal from "./ReferralHistoryModal";

interface StudioMainProps {
  initialContext?: GeneratorContext | null;
  initialAssetId?: string | null;
}

const TOPICS = [
  { id: "linkedin-post", label: "LinkedIn Post" },
  { id: "cover-letter", label: "Cover Letter" },
  { id: "cold-email", label: "Cold Email" },
  { id: "referral", label: "Referral Request" },
  { id: "vpd", label: "Value Prop Doc" },
];

const MOODS = ["Professional", "Casual", "Enthusiastic", "Thought Leadership", "Storytelling"];
const CONTENT_TYPES = ["Career Update", "Industry Insight", "Personal Story", "Project Showcase", "Advice"];

// Mock Previous VPDs
const MOCK_VPDS = [
  { id: 1, title: "Product Designer @ Google", date: "2 days ago" },
  { id: 2, title: "UX Researcher @ Spotify", date: "1 week ago" },
];

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

const StudioMainV2: React.FC<StudioMainProps> = ({ initialContext, initialAssetId }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isHydratingFromUrlRef = useRef(false);
  const hydratedAssetKeyRef = useRef<string | null>(null);
  /** After generate, asset `content` is still empty on server; URL hydration must not overwrite the in-memory draft. */
  const linkedinPreserveDraftForAssetIdRef = useRef<string | null>(null);
  const linkedinPersistDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // V2 Force Refresh
  const [selectedTopic, setSelectedTopic] = useState<string>(initialContext?.type ?? "linkedin-post");
  const [generatedContent, setGeneratedContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // LinkedIn specific state
  const [mood, setMood] = useState("Professional");
  const [contentType, setContentType] = useState("Career Update");
  const [topicIdea, setTopicIdea] = useState("");
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

  const handleApplyGeneratedTopic = useCallback((topic: string) => {
    setTopicIdea(topic);
  }, []);

  const { applyNextTopicFromPool, isLoadingTopics, topicPoolError, setTopicPoolError } = useTopicPool({
    currentTopic: topicIdea,
    onApplyTopic: handleApplyGeneratedTopic,
  });

  // Specific Form States
  const [role, setRole] = useState(initialContext?.role ?? "");
  const [company, setCompany] = useState(initialContext?.company ?? "");
  const [jobDescription, setJobDescription] = useState(initialContext?.description ?? "");
  const [managerName, setManagerName] = useState("");
  const [connectionName, setConnectionName] = useState(initialContext?.recipientName ?? "");

  // VPD Specific State
  const [vpdMode, setVpdMode] = useState<"list" | "create">("list");
  const [vpdProject, setVpdProject] = useState<PortfolioItem>({
    id: "vpd-project",
    type: "project",
    span: 3,
    title: "New Page",
    description: "",
    content: "",
    detailedBlocks: [],
  });

  // Scheduler State
  const [showScheduler, setShowScheduler] = useState(false);
  const [scheduledPosts, setScheduledPosts] = useState(MOCK_SCHEDULED);
  const [postHistory, setPostHistory] = useState(MOCK_HISTORY);
  const [linkedinContentGenAssets, setLinkedinContentGenAssets] = useState<ContentGenAssetItem[]>([]);

  // "All Posts" Modal State
  const [showAllPostsModal, setShowAllPostsModal] = useState(false);
  const [allPostsInitialTab, setAllPostsInitialTab] = useState<"scheduled" | "history">("scheduled");

  // "All VPDs" Modal State
  const [showAllVPDsModal, setShowAllVPDsModal] = useState(false);

  // Edit/View Post State
  const [selectedPostData, setSelectedPostData] = useState<ComposerPost | null>(null); // For editing/viewing existing posts

  // Cover Letter (Content Lab) state
  const [currentCoverLetterDraft, setCurrentCoverLetterDraft] = useState<CoverLetterAsset | null>(null);
  const [copyToast, setCopyToast] = useState(false);
  const [isCoverLetterEditorActive, setIsCoverLetterEditorActive] = useState(false);
  const [isCoverLetterGenerating, setIsCoverLetterGenerating] = useState(false);

  // Cold Email (Content Lab) state
  const [currentColdEmailDraft, setCurrentColdEmailDraft] = useState<ColdEmailAsset | null>(null);
  const [coldEmailCopyToast, setColdEmailCopyToast] = useState(false);
  const [referralCopyToast, setReferralCopyToast] = useState(false);
  const [isColdEmailEditorActive, setIsColdEmailEditorActive] = useState(false);
  const [isReferralEditorActive, setIsReferralEditorActive] = useState(false);
  const [isColdEmailGenerating, setIsColdEmailGenerating] = useState(false);

  // Referral (Content Lab) state
  const [currentReferralDraft, setCurrentReferralDraft] = useState<ReferralAsset | null>(null);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [referralFormError, setReferralFormError] = useState<string | null>(null);
  const [referralDuplicateModal, setReferralDuplicateModal] = useState<{
    existingAssetId: string | number;
    params: { role: string; company: string; conname: string };
  } | null>(null);
  const [referralSubscriptionModal, setReferralSubscriptionModal] = useState(false);

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
    () => linkedinContentGenAssets.filter(a => a.status !== "Scheduled").map(mapContentGenToModalPost),
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

  const { data: referralHistory = [] } = useReferralHistory();
  const lastReferralParamsRef = useRef<{
    role: string;
    company: string;
    conname: string;
  } | null>(null);
  const applyReferralDraftToForm = (asset: ReferralAsset | null) => {
    if (!asset) return;
    if (selectedTopic !== "referral") return;
    setRole(asset.role ?? "");
    setCompany(asset.company ?? "");
    setConnectionName(asset.conname ?? "");
  };

  const generateReferralMutation = useGenerateReferral({
    onSuccess: (result: GenerateReferralResult) => {
      if ("success" in result && result.success) {
        const draft = {
          id: result.id,
          role: result.role,
          company: result.company,
          conname: result.conname,
          content: result.content,
        };
        setCurrentReferralDraft(draft);
        applyReferralDraftToForm(draft);
        setIsReferralEditorActive(false);
        setReferralFormError(null);
      }
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
    onError: (msg: string) => setReferralFormError(msg),
  });

  const handleCoverLetterDraftChange = (draft: CoverLetterAsset | null) => {
    setCurrentCoverLetterDraft(draft);
    setIsCoverLetterEditorActive(false);
    setIsCoverLetterGenerating(false);
  };

  const handleColdEmailDraftChange = (draft: ColdEmailAsset | null) => {
    setCurrentColdEmailDraft(draft);
    setGeneratedContent(draft?.content ?? "");
    setIsColdEmailEditorActive(false);
    setIsColdEmailGenerating(false);
  };

  const handleReferralViewAll = () => {
    setShowReferralModal(true);
  };

  const handleReferralSelect = (asset: ReferralAsset) => {
    setCurrentReferralDraft(asset);
    applyReferralDraftToForm(asset);
    setIsReferralEditorActive(false);
    setShowReferralModal(false);
  };

  const updateStudioUrl = ({ type, id }: { type?: string; id?: string }) => {
    const params = new URLSearchParams(searchParams.toString());
    const nextType = type ?? selectedTopic;
    const currentType = searchParams.get("type") ?? "";
    const currentId = searchParams.get("id") ?? "";
    const normalizedNextId = id ?? "";
    if (currentType === nextType && currentId === normalizedNextId) {
      return;
    }
    if (nextType) {
      params.set("type", nextType);
    }
    if (id) {
      params.set("id", id);
    } else {
      params.delete("id");
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const handleCopyReferralOrVpd = () => {
    const text = selectedTopic === "referral" ? (currentReferralDraft?.content ?? "") : generatedContent;
    if (text && typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
      setReferralCopyToast(true);
      setTimeout(() => setReferralCopyToast(false), 2000);
    }
  };
  const handleCopyColdEmail = () => {
    const content = generatedContent.trim();
    if (!content) return;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(content).catch(() => {});
    }
    setColdEmailCopyToast(true);
    setTimeout(() => setColdEmailCopyToast(false), 2000);
  };

  const handleTopicChange = (topicId: string) => {
    setSelectedTopic(topicId);
    updateStudioUrl({ type: topicId });
    if (topicId !== "linkedin-post") {
      setLinkedinPostAssetId(null);
      setLinkedinGenerateError(null);
      setLinkedinPersistError(null);
      setLinkedinImages([]);
      setLinkedinMediaError(null);
      clearLinkedinPendingMedia();
      linkedinPreserveDraftForAssetIdRef.current = null;
    }
    if (topicId === "vpd") setVpdMode("list");
    if (topicId !== "cover-letter") {
      setIsCoverLetterEditorActive(false);
      setIsCoverLetterGenerating(false);
    }
    if (topicId !== "cold-email") {
      setIsColdEmailEditorActive(false);
      setIsColdEmailGenerating(false);
    }
    if (topicId !== "referral") {
      setIsReferralEditorActive(false);
    }
    if (topicId === "referral" && currentReferralDraft) {
      applyReferralDraftToForm(currentReferralDraft);
    }
  };

  useEffect(() => {
    const urlType = searchParams.get("type");
    if (!urlType || urlType === selectedTopic) {
      return;
    }
    setSelectedTopic(urlType);
  }, [searchParams, selectedTopic]);

  useEffect(() => {
    if (!initialContext) {
      return;
    }
    if (initialContext.role) {
      setRole(initialContext.role);
    }
    if (initialContext.company) {
      setCompany(initialContext.company);
    }
    if (initialContext.description) {
      setJobDescription(initialContext.description);
    }
    if (initialContext.recipientName) {
      setConnectionName(initialContext.recipientName);
      setManagerName(initialContext.recipientName);
    }
  }, [initialContext]);

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
          setRole(asset.role ?? "");
          setCompany(asset.company ?? "");
          setJobDescription(asset.job_description ?? "");
          return;
        }
        if (urlType === "cold-email") {
          const asset = await fetchColdEmailById(urlId);
          if (!asset) throw new Error("Cold email not found");
          setCurrentColdEmailDraft(asset);
          setGeneratedContent(asset.content ?? "");
          setSelectedTopic("cold-email");
          setRole(asset.role ?? "");
          setCompany(asset.company ?? "");
          setJobDescription(asset.job_description ?? "");
          setManagerName(asset.hirname ?? "");
          return;
        }
        if (urlType === "referral") {
          const asset = await fetchReferralById(urlId);
          if (!asset) throw new Error("Referral not found");
          setCurrentReferralDraft(asset);
          applyReferralDraftToForm(asset);
          setSelectedTopic("referral");
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
        const params = new URLSearchParams(searchParams.toString());
        params.delete("id");
        const query = params.toString();
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
      } finally {
        isHydratingFromUrlRef.current = false;
      }
    };
    hydrate();
  }, [clearLinkedinPendingMedia, initialAssetId, pathname, router, searchParams, selectedTopic]);

  useEffect(() => {
    if (isHydratingFromUrlRef.current) {
      return;
    }
    if (selectedTopic === "cover-letter") {
      updateStudioUrl({
        type: selectedTopic,
        id: currentCoverLetterDraft?.id ? String(currentCoverLetterDraft.id) : undefined,
      });
      return;
    }
    if (selectedTopic === "cold-email") {
      updateStudioUrl({
        type: selectedTopic,
        id: currentColdEmailDraft?.id ? String(currentColdEmailDraft.id) : undefined,
      });
      return;
    }
    if (selectedTopic === "referral") {
      updateStudioUrl({
        type: selectedTopic,
        id: currentReferralDraft?.id ? String(currentReferralDraft.id) : undefined,
      });
      return;
    }
    if (selectedTopic === "linkedin-post") {
      updateStudioUrl({
        type: selectedTopic,
        id: linkedinPostAssetId ?? undefined,
      });
      return;
    }
    updateStudioUrl({ type: selectedTopic });
  }, [currentColdEmailDraft?.id, currentCoverLetterDraft?.id, currentReferralDraft?.id, linkedinPostAssetId, selectedTopic]);

  const handlePost = async (finalContent: string, isScheduled: boolean, scheduleDate?: Date) => {
    if (selectedTopic === "linkedin-post") {
      if (!linkedinPostAssetId) {
        throw new Error("No draft selected. Generate a draft first.");
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
        if (isScheduled && scheduleDate) {
          await updateContentGenAsset({
            id: linkedinPostAssetId,
            content: finalContent,
            dateScheduled: scheduleDate.toISOString(),
            status: "Scheduled",
            images: linkedinImages,
          });
        } else {
          await updateContentGenAsset({ id: linkedinPostAssetId, content: finalContent, images: linkedinImages });
          await postContentGenToLinkedIn(linkedinPostAssetId);
        }
        setGeneratedContent(finalContent);
        await refreshLinkedinAssets();
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Something went wrong";
        throw new Error(normalizeLinkedinPostError(errorMessage));
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
    if (selectedTopic === "referral") {
      handleReferralViewAll();
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

  const handleGenerate = () => {
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
      generateReferralMutation.mutate(params);
      return;
    }

    if (selectedTopic === "linkedin-post") {
      const trimmedTopic = topicIdea.trim();
      if (!trimmedTopic) {
        setLinkedinGenerateError("Add a topic or use the wand to suggest one.");
        return;
      }
      setLinkedinGenerateError(null);
      setIsGenerating(true);
      void (async () => {
        try {
          const { id, existing } = await generateContentGenAsset(trimmedTopic);
          setLinkedinPostAssetId(id);
          const assetsFresh = await fetchContentGenAssets();
          setLinkedinContentGenAssets(assetsFresh);
          const existingAsset = assetsFresh.find(a => String(a.id) === String(id));
          const baseImageUrls = Array.isArray(existingAsset?.images) ? [...existingAsset.images] : [];
          setLinkedinImages(baseImageUrls);

          const sectionName = `contentgen${id}`;
          const pendingSlice = linkedinPendingMediaRef.current.slice();

          const loadDraftOnce = async () => {
            const chatHistory = await fetchUnibotChatHistory(sectionName);
            return getFirstContentGenDraftFromHistory(chatHistory);
          };

          let draft = await loadDraftOnce();
          if (!draft.trim() && !existing) {
            await new Promise(r => setTimeout(r, 500));
            draft = await loadDraftOnce();
          }
          if (!draft.trim()) {
            throw new Error("Could not read the generated draft. Please try again.");
          }

          let mergedImageUrls = baseImageUrls;
          if (pendingSlice.length > 0) {
            setIsUploadingLinkedinMedia(true);
            setLinkedinMediaError(null);
            try {
              const uploaded = await Promise.all(pendingSlice.map(entry => uploadContentGenMedia(entry.file, "linkedin-post")));
              mergedImageUrls = Array.from(new Set([...baseImageUrls, ...uploaded.map(u => u.url)]));
              pendingSlice.forEach(p => URL.revokeObjectURL(p.objectUrl));
              setLinkedinPendingMedia([]);
              linkedinPendingMediaRef.current = [];
              setLinkedinImages(mergedImageUrls);
            } catch (uploadErr) {
              setLinkedinMediaError(uploadErr instanceof Error ? uploadErr.message : "Could not upload staged media");
              setLinkedinImages(baseImageUrls);
            } finally {
              setIsUploadingLinkedinMedia(false);
            }
          }

          setGeneratedContent(draft);
          linkedinPreserveDraftForAssetIdRef.current = id;
          await updateContentGenAsset({ id, content: draft, images: mergedImageUrls });
          setLinkedinImages(mergedImageUrls);

          updateStudioUrl({ type: "linkedin-post", id });
          void refreshLinkedinAssets();
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Something went wrong. Please try again.";
          setLinkedinGenerateError(msg);
        } finally {
          setIsGenerating(false);
        }
      })();
      return;
    }

    setIsGenerating(true);
    setTimeout(() => {
      const content = generateMockContent();
      setGeneratedContent(content);
      setIsGenerating(false);
    }, 1500);
  };

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
    if (selectedTopic !== "linkedin-post" || !linkedinPostAssetId) {
      return;
    }
    try {
      setLinkedinPersistError(null);
      await updateContentGenAsset({ id: linkedinPostAssetId, content: generatedContent, images: linkedinImages });
      void refreshLinkedinAssets();
    } catch (e) {
      setLinkedinPersistError(e instanceof Error ? e.message : "Could not save changes");
    }
  }, [selectedTopic, linkedinPostAssetId, generatedContent, linkedinImages, refreshLinkedinAssets]);

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
    if (selectedTopic !== "linkedin-post" || !linkedinPostAssetId) {
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
  }, [generatedContent, linkedinPendingMedia.length, linkedinPostAssetId, selectedTopic, persistLinkedinContentToServer]);

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

  const renderInputs = () => {
    // VPD Handling
    if (selectedTopic === "vpd") {
      if (vpdMode === "list") {
        return (
          <div className="space-y-4">
            <button
              onClick={() => setVpdMode("create")}
              className="w-full py-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-500 hover:border-blue-500 hover:text-blue-600 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all font-medium"
            >
              <Plus size={24} />
              <span>Create New VPD</span>
            </button>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-xs font-medium text-slate-500 uppercase">Previously Created</label>
                <button
                  onClick={() => setShowAllVPDsModal(true)}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline"
                >
                  See all
                </button>
              </div>
              <div className="space-y-2">
                {MOCK_VPDS.map(vpd => (
                  <div
                    key={vpd.id}
                    className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center gap-3 cursor-pointer hover:border-blue-500 transition-all"
                  >
                    <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                      <FileText size={20} />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-slate-900 dark:text-white">{vpd.title}</h4>
                      <p className="text-xs text-slate-500">{vpd.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      }
      // VPD Create Mode (Falls through to shared Inputs below)
    }

    return (
      <div className="space-y-5">
        {selectedTopic === "vpd" && (
          <button onClick={() => setVpdMode("list")} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 mb-2">
            <ChevronLeft size={14} /> Back to List
          </button>
        )}

        {/* LinkedIn Inputs */}
        {selectedTopic === "linkedin-post" && (
          <>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-2">Topic Generator</label>
              <div className="flex gap-2">
                <input
                  value={topicIdea}
                  onChange={e => {
                    setTopicPoolError(null);
                    setLinkedinGenerateError(null);
                    setTopicIdea(e.target.value);
                  }}
                  className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="e.g. Learnings from my first design sprint..."
                />
                <button
                  type="button"
                  aria-label="Generate topic suggestion"
                  disabled={isLoadingTopics}
                  onClick={() => void applyNextTopicFromPool()}
                  className="px-4 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors font-medium disabled:opacity-50 disabled:pointer-events-none"
                >
                  <Wand2 size={18} className={isLoadingTopics ? "animate-pulse" : undefined} />
                </button>
              </div>
              {topicPoolError ? (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1.5" role="alert">
                  {topicPoolError}
                </p>
              ) : null}
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
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none bg-white dark:bg-slate-900 opacity-60 cursor-not-allowed"
                >
                  {MOODS.map(m => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-2">Content Type</label>
                <input
                  value={contentType}
                  disabled
                  aria-disabled
                  title="Coming soon"
                  onChange={e => setContentType(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 opacity-60 cursor-not-allowed"
                  placeholder="e.g. Career Update"
                />
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
                className="w-full py-8 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-blue-500 hover:text-blue-500 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all group disabled:opacity-60 disabled:pointer-events-none"
              >
                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
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
                      <img src={p.objectUrl} alt="" className="w-full h-20 object-cover" />
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
                      <img src={url} alt="Uploaded media" className="w-full h-20 object-cover" />
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

        {/* LinkedIn: History & Scheduled (Only show when not generating) */}
        {
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-6">
            {/* Scheduled & History - Sleek Row */}
            <div className="flex gap-3">
              {selectedTopic !== "referral" && (
                <button
                  onClick={() => handleViewAll("scheduled")}
                  className="flex-1 py-2.5 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-center gap-2 hover:border-blue-400 dark:hover:border-blue-700 hover:shadow-sm transition-all group"
                >
                  <div className="w-6 h-6 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
                    <Calendar size={14} />
                  </div>
                  <div className="flex flex-col items-start leading-none">
                    <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">Scheduled</span>
                  </div>
                  <span className="ml-auto text-[10px] font-medium bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500">
                    {selectedTopic === "linkedin-post" ? scheduledPostsForModal.length : scheduledPosts.length}
                  </span>
                </button>
              )}

              <button
                onClick={() => handleViewAll("history")}
                className={`${selectedTopic === "referral" ? "w-full" : "flex-1"} py-2.5 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-center gap-2 hover:border-orange-400 dark:hover:border-orange-700 hover:shadow-sm transition-all group`}
              >
                <div className="w-6 h-6 rounded-md bg-orange-50 dark:bg-orange-900/30 text-orange-600 flex items-center justify-center group-hover:bg-orange-100 dark:group-hover:bg-orange-900/50 transition-colors">
                  <History size={14} />
                </div>
                <div className="flex flex-col items-start leading-none">
                  <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">History</span>
                </div>
                <span className="ml-auto text-[10px] font-medium bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500">
                  {selectedTopic === "referral"
                    ? referralHistory.length
                    : selectedTopic === "linkedin-post"
                      ? historyPostsForModal.length
                      : postHistory.length}
                </span>
              </button>
            </div>
          </div>
        }

        {/* Shared Inputs (Role, Company) for Non-LinkedIn */}
        {selectedTopic !== "linkedin-post" && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase mb-2">Role</label>
              <input
                value={role}
                onChange={e => setRole(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="e.g. Product Designer"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase mb-2">Company</label>
              <input
                value={company}
                onChange={e => setCompany(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="e.g. Spotify"
              />
            </div>
          </div>
        )}

        {/* Specific 3rd Inputs */}
        {(selectedTopic === "cover-letter" || selectedTopic === "vpd") && (
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase mb-2">Job Description</label>
            <textarea
              value={jobDescription}
              onChange={e => setJobDescription(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium h-32 resize-none outline-none focus:ring-2 focus:ring-blue-500/20"
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
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20"
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
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="e.g. Jane Smith"
            />
          </div>
        )}

        {selectedTopic === "referral" && referralFormError && <p className="text-sm text-red-600 dark:text-red-400">{referralFormError}</p>}

        {selectedTopic === "linkedin-post" && linkedinGenerateError ? (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {linkedinGenerateError}
          </p>
        ) : null}

        {/* Generate Button */}
        <button
          onClick={selectedTopic === "referral" && isReferralEditorActive ? undefined : handleGenerate}
          disabled={selectedTopic === "referral" ? generateReferralMutation.isPending || isReferralEditorActive : isGenerating}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
        >
          {selectedTopic === "referral" && generateReferralMutation.isPending ? (
            <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
          ) : isGenerating ? (
            <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
          ) : (
            <Wand2 size={18} />
          )}
          {selectedTopic === "referral" && generateReferralMutation.isPending
            ? " Crafting..."
            : isGenerating
              ? " Crafting..."
              : selectedTopic === "referral" && isReferralEditorActive
                ? "Enhance Draft"
                : "Generate Draft"}
        </button>
      </div>
    );
  };

  return (
    <div className="flex-1 bg-white dark:bg-[#0a0a0a] h-full overflow-hidden font-sans flex flex-col">
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* LEFT: Input / Generator */}
        <div className="w-full lg:w-[45%] h-1/2 lg:h-full bg-white dark:bg-[#111] border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-800 p-8 overflow-y-auto">
          <div className="mb-8">
            {/* Typography Update: Standardized Header */}
            <h1 className="text-2xl font-medium text-slate-900 dark:text-white mb-2 font-['Onest']">Content Lab</h1>
            <p className="text-[14px] text-slate-500 dark:text-slate-400">Generate high-quality application materials in seconds.</p>
          </div>

          {selectedTopic === "cover-letter" ? (
            <ContentLabCoverLetterLeft
              onDraftChange={handleCoverLetterDraftChange}
              activeDraft={currentCoverLetterDraft}
              isEditorActive={isCoverLetterEditorActive}
              onGeneratingChange={setIsCoverLetterGenerating}
              initialDraftId={searchParams.get("type") === "cover-letter" ? searchParams.get("id") : null}
            />
          ) : selectedTopic === "cold-email" ? (
            <ContentLabColdEmailLeft
              onDraftChange={handleColdEmailDraftChange}
              activeDraft={currentColdEmailDraft}
              isEditorActive={isColdEmailEditorActive}
              onGeneratingChange={setIsColdEmailGenerating}
              initialDraftId={searchParams.get("type") === "cold-email" ? searchParams.get("id") : null}
            />
          ) : (
            renderInputs()
          )}
        </div>

        {/* RIGHT: Preview + Tabs */}
        <div className="flex-1 bg-slate-100 dark:bg-[#050505] flex flex-col relative">
          {/* Top Bar for Tabs - Sticky */}
          <div className="w-full px-8 py-6 border-b border-slate-200/50 dark:border-slate-800/50 bg-slate-100/50 dark:bg-[#050505] backdrop-blur-sm sticky top-0 z-20">
            {/* Pill Tabs - Fully Rounded */}
            <div className="inline-flex p-1 bg-slate-200/50 dark:bg-slate-900 rounded-full">
              {TOPICS.map(t => (
                <button
                  key={t.id}
                  onClick={() => handleTopicChange(t.id)}
                  className={`
                                        px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap
                                        ${
                                          selectedTopic === t.id
                                            ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                                            : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                                        }
                                    `}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto flex items-stretch justify-center px-8 pb-8 pt-10 min-h-0">
            <div className="w-full max-w-2xl relative group/preview min-h-full flex flex-col gap-3">
              {selectedTopic === "linkedin-post" ? (
                <div className="flex justify-end shrink-0 min-h-[2.75rem] items-center">
                  <button
                    type="button"
                    onClick={() => {
                      setGeneratedContent(generatedContent);
                      setSelectedPostData(null);
                      setShowScheduler(true);
                    }}
                    className="flex items-center gap-2 bg-white text-slate-900 border border-slate-200 px-4 py-2 rounded-full text-xs font-medium shadow-sm transition-all opacity-0 group-hover/preview:opacity-100 focus-visible:opacity-100"
                  >
                    <Send size={14} /> Schedule / Post
                  </button>
                </div>
              ) : null}
              {/* Conditional Preview Rendering */}
              {selectedTopic === "vpd" && vpdMode === "create" ? (
                <div className="absolute inset-0 bg-white dark:bg-[#050505] z-10 flex flex-col">
                  <ProjectDetailView
                    project={vpdProject}
                    onBack={() => setVpdMode("list")}
                    onUpdateProject={updated => setVpdProject(updated)}
                    allowedBlockTypes={["text", "media", "link-box"]}
                    gridColumns={12}
                    maxWidthClassName="max-w-5xl"
                  />
                </div>
              ) : selectedTopic === "linkedin-post" ? (
                /* LinkedIn Card Preview */
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 flex flex-col min-h-0 max-h-[min(640px,calc(100vh-10rem))]">
                  <div className="flex justify-between items-start mb-3 shrink-0">
                    <div className="flex gap-3">
                      <div className="w-12 h-12 rounded-full bg-[#3b82f6] flex items-center justify-center text-white font-medium text-lg shrink-0">
                        AB
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 text-sm leading-tight hover:text-blue-600 hover:underline cursor-pointer">
                          Abhi B.
                        </h3>
                        <p className="text-xs text-slate-500 leading-tight mt-0.5">Product Designer @ Unimad</p>
                        <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                          <span>1h</span> • <Globe size={10} />
                        </div>
                      </div>
                    </div>
                    <button type="button" className="text-slate-500 hover:bg-slate-100 p-1 rounded-full">
                      <MoreHorizontal size={20} />
                    </button>
                  </div>
                  {linkedinPersistError ? (
                    <p className="text-xs text-red-600 dark:text-red-400 mb-2 shrink-0" role="alert">
                      {linkedinPersistError}
                    </p>
                  ) : null}
                  <textarea
                    value={generatedContent}
                    onChange={e => {
                      setLinkedinPersistError(null);
                      setGeneratedContent(e.target.value);
                    }}
                    onBlur={handleLinkedinPreviewBlur}
                    placeholder="Your content preview will appear here..."
                    aria-label="LinkedIn post content"
                    className="w-full min-h-[160px] max-h-[min(320px,45vh)] overflow-y-auto text-sm text-slate-800 whitespace-pre-wrap leading-relaxed bg-transparent border-none outline-none resize-none placeholder:text-slate-300 mb-2"
                  />
                  {linkedinPendingMedia.length > 0 || linkedinImages.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2 mb-3 shrink-0">
                      {linkedinPendingMedia.map(p => (
                        <div key={p.id} className="relative rounded-lg border border-amber-200 overflow-hidden">
                          <img src={p.objectUrl} alt="" className="w-full h-32 object-cover" />
                          <span className="absolute bottom-1 left-1 text-[10px] font-medium bg-amber-100/90 text-amber-900 px-1 rounded">
                            Pending upload
                          </span>
                        </div>
                      ))}
                      {linkedinImages.map(url => (
                        <img
                          key={url}
                          src={url}
                          alt="LinkedIn media preview"
                          className="w-full h-32 object-cover rounded-lg border border-slate-200"
                        />
                      ))}
                    </div>
                  ) : null}
                  <div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-100 pb-3 mt-2 shrink-0">
                    <div className="flex items-center gap-1.5 cursor-pointer hover:text-blue-600 hover:underline">
                      <div className="flex -space-x-1">
                        <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center ring-2 ring-white">
                          <ThumbsUp size={8} className="text-white fill-current" />
                        </div>
                        <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center ring-2 ring-white">
                          <span className="text-[6px] text-white">❤️</span>
                        </div>
                      </div>
                      <span>1,245</span>
                    </div>
                    <div className="hover:text-blue-600 hover:underline cursor-pointer">88 comments • 12 reposts</div>
                  </div>
                  <div className="flex items-center justify-between pt-1 px-2 shrink-0">
                    <button className="py-3 px-2 rounded hover:bg-slate-100 flex items-center gap-2 text-slate-600 text-sm font-semibold transition-colors">
                      <ThumbsUp size={18} /> <span className="hidden sm:inline">Like</span>
                    </button>
                    <button className="py-3 px-2 rounded hover:bg-slate-100 flex items-center gap-2 text-slate-600 text-sm font-semibold transition-colors">
                      <MessageSquare size={18} /> <span className="hidden sm:inline">Comment</span>
                    </button>
                    <button className="py-3 px-2 rounded hover:bg-slate-100 flex items-center gap-2 text-slate-600 text-sm font-semibold transition-colors">
                      <Repeat size={18} /> <span className="hidden sm:inline">Repost</span>
                    </button>
                    <button className="py-3 px-2 rounded hover:bg-slate-100 flex items-center gap-2 text-slate-600 text-sm font-semibold transition-colors">
                      <Send size={18} /> <span className="hidden sm:inline">Send</span>
                    </button>
                  </div>
                </div>
              ) : selectedTopic === "cover-letter" ? (
                <ContentLabCoverLetterPreview
                  draft={currentCoverLetterDraft}
                  onCopy={() => {
                    setCopyToast(true);
                    setTimeout(() => setCopyToast(false), 2000);
                  }}
                  copyFeedback={copyToast}
                  onEditorActivate={() => setIsCoverLetterEditorActive(true)}
                  onEditorDeactivate={() => setIsCoverLetterEditorActive(false)}
                  isGenerating={isCoverLetterGenerating}
                />
              ) : selectedTopic === "cold-email" ? (
                <ContentLabColdEmailPreview
                  draft={currentColdEmailDraft}
                  onCopy={() => {
                    setColdEmailCopyToast(true);
                    setTimeout(() => setColdEmailCopyToast(false), 2000);
                  }}
                  copyFeedback={coldEmailCopyToast}
                  onEditorActivate={() => setIsColdEmailEditorActive(true)}
                  onEditorDeactivate={() => setIsColdEmailEditorActive(false)}
                  isGenerating={isColdEmailGenerating}
                  onDraftContentChange={content => {
                    if (!currentColdEmailDraft) return;
                    setCurrentColdEmailDraft({
                      ...currentColdEmailDraft,
                      content,
                    });
                  }}
                />
              ) : selectedTopic === "referral" ? (
                <ContentLabReferralPreview
                  draft={currentReferralDraft}
                  onCopy={() => {
                    setReferralCopyToast(true);
                    setTimeout(() => setReferralCopyToast(false), 2000);
                  }}
                  copyFeedback={referralCopyToast}
                  onEditorActivate={() => setIsReferralEditorActive(true)}
                  onEditorDeactivate={() => setIsReferralEditorActive(false)}
                  isGenerating={generateReferralMutation.isPending}
                  onDraftContentChange={content => {
                    if (!currentReferralDraft) return;
                    setCurrentReferralDraft({
                      ...currentReferralDraft,
                      content,
                    });
                  }}
                />
              ) : (
                /* Plain Text / Document Preview for VPD (structure matches Cold Email preview) */
                <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg w-full max-w-xl mx-auto flex flex-col min-h-[600px]">
                  <div className="border-b border-slate-100 dark:border-slate-800 p-4 flex justify-end items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyReferralOrVpd}
                      aria-label="Copy to clipboard"
                      disabled={!generatedContent.trim()}
                      className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-4 py-2 rounded-lg text-xs font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Copy size={14} />
                      {referralCopyToast ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <div className="flex-1 p-12 overflow-y-auto">
                    <textarea
                      value={generatedContent}
                      onChange={e => setGeneratedContent(e.target.value)}
                      placeholder="Your value prop doc draft will appear here..."
                      className="w-full min-h-[400px] text-base text-slate-900 dark:text-slate-100 whitespace-pre-wrap leading-relaxed bg-transparent border-none outline-none resize-none placeholder:text-slate-300 dark:placeholder:text-slate-700 font-serif"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showScheduler && (
        <PostSchedulerModal
          content={generatedContent}
          linkedinPreviewPendingMedia={linkedinPendingMedia.map(p => ({ id: p.id, objectUrl: p.objectUrl }))}
          linkedinPreviewImages={linkedinImages}
          onClose={() => {
            setShowScheduler(false);
            setSelectedPostData(null);
          }}
          onPost={handlePost}
          initialData={
            selectedPostData
              ? {
                  isScheduled: Boolean(selectedPostData.isScheduled),
                  date: selectedPostData.dateScheduled ? new Date(selectedPostData.dateScheduled) : undefined,
                }
              : undefined
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
          vpds={MOCK_VPDS}
          onClose={() => setShowAllVPDsModal(false)}
          onVPClick={vpd => {
            setShowAllVPDsModal(false);
            // Future: Load VPD into editor
            alert(`Load VPD: ${vpd.title}`);
          }}
        />
      )}

      {showReferralModal && (
        <ReferralHistoryModal onClose={() => setShowReferralModal(false)} historyList={referralHistory} onSelect={handleReferralSelect} />
      )}

      {referralDuplicateModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-labelledby="referral-duplicate-modal-title"
        >
          <div className="bg-white dark:bg-[#1a1a1a] w-full max-w-md rounded-2xl shadow-2xl p-6 border border-slate-200 dark:border-slate-800">
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
                  if (full) setCurrentReferralDraft(full);
                  setReferralDuplicateModal(null);
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
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
                  if ("success" in result && result.success) {
                    setCurrentReferralDraft({
                      id: result.id,
                      role: result.role,
                      company: result.company,
                      conname: result.conname,
                      content: result.content,
                    });
                  }
                }}
                disabled={generateReferralMutation.isPending}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                Create new anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {referralSubscriptionModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-labelledby="referral-subscription-modal-title"
        >
          <div className="bg-white dark:bg-[#1a1a1a] w-full max-w-md rounded-2xl shadow-2xl p-6 border border-slate-200 dark:border-slate-800">
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
        </div>
      )}
    </div>
  );
};

export default StudioMainV2;
