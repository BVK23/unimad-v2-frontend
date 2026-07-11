"use client";
import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import { DocumentSaveStatusBar } from "@/components/application-assets/DocumentSaveStatusBar";
import { EMPTY_PORTFOLIO_HIGHLIGHT_MAP } from "@/features/adk-chat/adkPortfolioHighlightDiff";
import { useAdkPortfolioReviewStore } from "@/features/adk-chat/stores/useAdkPortfolioReviewStore";
import { mapFrontendPortfolioToBackend } from "@/features/portfolio/api/mappers";
import { PORTFOLIO_MIN_SELECTION_CHARS } from "@/features/portfolio/config/selection-presets";
import { isPersistedPortfolioId } from "@/features/portfolio/constants/portfolioDraft";
import { getDefaultItemHeightPx, getDefaultSpanForContentType } from "@/features/portfolio/constants/portfolioLayout";
import { portfolioQueryKey } from "@/features/portfolio/hooks/usePortfolio";
import { usePortfolioAutosave } from "@/features/portfolio/hooks/usePortfolioAutosave";
import { usePortfolioContentHeights } from "@/features/portfolio/hooks/usePortfolioContentHeights";
import { usePortfolioGridMetrics } from "@/features/portfolio/hooks/usePortfolioGridMetrics";
import {
  getPortfolioEdgeResizeCursor,
  getPortfolioEdgeResizeZone,
  isInteractiveResizeTarget,
  resolvePortfolioEdgeResizeAxis,
} from "@/features/portfolio/layout/portfolioEdgeResize";
import { getRowSpanForPortfolioItem, PORTFOLIO_DENSE_GRID_CLASS } from "@/features/portfolio/layout/portfolioGridSpan";
import { publishPortfolioAsset } from "@/features/portfolio/server-actions/portfolio-actions";
import { usePortfolioStore } from "@/features/portfolio/store/usePortfolioStore";
import { getPortfolioBlockDeleteLabel } from "@/features/portfolio/utils/getPortfolioBlockDeleteLabel";
import { getPortfolioHistorySignature } from "@/features/portfolio/utils/getPortfolioHistorySignature";
import { normalizePortfolioItems } from "@/features/portfolio/utils/normalizePortfolioItems";
import {
  formatPortfolioUploadError,
  logPortfolioUploadError,
  logPortfolioUploadStart,
  logPortfolioUploadSuccess,
} from "@/features/portfolio/utils/portfolioUploadLog";
import { uploadHeroImageFromDataUrl } from "@/features/portfolio/utils/upload";
import { profileQk } from "@/features/user-profile/hooks/use-profile-data";
import { loadPublishedUrl, savePublishedUrl } from "@/lib/portfolio/portfolioStorage";
import { resolveMediaDisplayUrl } from "@/utils/resolve-media-url";
import { useQueryClient } from "@tanstack/react-query";
import {
  Edit3,
  Layout,
  Image as ImageIcon,
  Type,
  Link as LinkIcon,
  Video,
  Trash2,
  Briefcase,
  MapPin,
  Globe,
  Plus,
  ExternalLink,
  Mail,
  Phone,
  AlignCenter,
  AlignLeft,
  ArrowRight,
  ArrowLeft,
  Save,
  Eye,
  EyeOff,
  FileText,
  Copy,
  GraduationCap,
  ChevronDown,
  ChevronRight,
  Table2,
  Code2,
  Figma,
  Check,
} from "lucide-react";
import { useGridResize } from "../hooks/useGridResize";
import { PortfolioItem, UserProfile, ContentType, PortfolioData, ContactButton } from "../types";
import ProjectDetailView from "./ProjectDetailView";
import type { RichTextEditorSelectionInfo } from "./RichTextEditor";
import DeleteBlockConfirmModal from "./portfolio/DeleteBlockConfirmModal";
import { PortfolioAdkBlockHighlight } from "./portfolio/PortfolioAdkBlockHighlight";
import { PortfolioGridBlock } from "./portfolio/PortfolioGridBlock";
import PortfolioImage from "./portfolio/PortfolioImage";
import { PortfolioSelectionImproveActions } from "./portfolio/PortfolioSelectionImprove";

const PortfolioLiveDot = () => (
  <span className="relative flex h-2 w-2 shrink-0" aria-hidden>
    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
    <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.85)]" />
  </span>
);

const buildPortfolioPublicUrl = (slug: string) => {
  const trimmed = slug.trim();
  if (typeof window !== "undefined") {
    return `${window.location.origin}/portfolio/${trimmed}`;
  }
  return `/portfolio/${trimmed}`;
};

// Mock Initial Data (Enhanced for Notion-style Grid)
const INITIAL_PROFILE: UserProfile = {
  name: "Alex Morgan",
  tagline: "Hello! I'm",
  bio: "",
  location: "San Francisco, CA",
  email: "alex@unimad.dev",
  phone: "+1 (555) 012-3456",
  website: "alexmorgan.design",
  avatarUrl: "https://picsum.photos/200/200",
  coverUrl: "https://images.unsplash.com/photo-1549221530-56277ff5c876?auto=format&fit=crop&q=80",
  layout: "centered",
  experience: [
    { id: "1", role: "Senior Product Designer", company: "TechFlow", period: "2021 - Present" },
    { id: "2", role: "UI/UX Designer", company: "Creative Studio", period: "2019 - 2021" },
  ],
  education: [{ id: "1", degree: "B.Des in Interaction Design", school: "CCA", year: "2015 - 2019" }],
  contactButtons: [
    { id: "contact-phone", label: "+1 (555) 012-3456", url: "+15550123456", icon: "phone", isVisible: true },
    { id: "contact-location", label: "Birmingham, UK", url: "https://maps.google.com", icon: "location", isVisible: true },
    { id: "contact-email", label: "alex@unimad.dev", url: "alex@unimad.dev", icon: "mail", isVisible: true },
  ],
};

const INITIAL_ITEMS: PortfolioItem[] = [
  {
    id: "1",
    type: "text",
    title: "Quick Summary",
    content: "<p>Start writing your portfolio summary here.</p>",
    span: 12,
    layoutRole: "section",
    fontSize: "base",
    height: 160,
  },
];

interface PortfolioProps {
  portfolioId: string;
  initialData?: PortfolioData;
  onBack?: () => void;
  isReadOnly?: boolean;
  onPersisted?: (id: string, portfolio: PortfolioData) => void;
}

interface PortfolioSnapshot {
  items: PortfolioItem[];
  profile: UserProfile;
}

const PORTFOLIO_HISTORY_DEBOUNCE_MS = 250;

const buildLocationButtonUrl = (location: string) => {
  const trimmed = location.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trimmed)}`;
};

const hasStoredContactButtons = (profile: UserProfile): boolean => profile.contactButtons !== undefined;

/**
 * Contact buttons for display. Uses the stored list when present (including an intentional empty list).
 * Falls back to profile scalars only when contactButtons was never set (legacy/API data).
 */
const resolveContactButtons = (profile: UserProfile): ContactButton[] => {
  if (hasStoredContactButtons(profile)) {
    return [...(profile.contactButtons ?? [])];
  }

  const base = getDefaultContactButtons(profile);

  if (base.some(button => button.icon === "location" || button.id === "contact-location")) {
    return base;
  }

  const locationText = profile.location?.trim();
  if (!locationText) {
    return base;
  }

  return [
    ...base,
    {
      id: "contact-location",
      label: locationText,
      url: buildLocationButtonUrl(locationText),
      icon: "location",
      isVisible: true,
    },
  ];
};

/** Base list for add/update/remove — stored array when set, otherwise the resolved legacy view. */
const getMutableContactButtons = (profile: UserProfile): ContactButton[] =>
  hasStoredContactButtons(profile) ? [...(profile.contactButtons ?? [])] : resolveContactButtons(profile);

const getDefaultContactButtons = (profile: UserProfile): ContactButton[] => {
  const buttons: ContactButton[] = [
    {
      id: "contact-phone",
      label: profile.phone || "Phone",
      url: profile.phone || "",
      icon: "phone",
      isVisible: Boolean(profile.phone),
    },
    {
      id: "contact-email",
      label: profile.email || "Email",
      url: profile.email || "",
      icon: "mail",
      isVisible: Boolean(profile.email),
    },
  ];

  const locationText = profile.location?.trim();
  if (locationText) {
    buttons.push({
      id: "contact-location",
      label: locationText,
      url: buildLocationButtonUrl(locationText),
      icon: "location",
      isVisible: true,
    });
  }

  if (profile.website?.trim()) {
    buttons.push({
      id: "contact-site",
      label: profile.websiteLabel?.trim() || "Website",
      url: profile.website || "",
      icon: "link",
      isVisible: true,
    });
  }

  return buttons;
};

const iconOptions: Array<{ value: ContactButton["icon"]; label: string }> = [
  { value: "phone", label: "Phone" },
  { value: "mail", label: "Email" },
  { value: "link", label: "Link" },
  { value: "location", label: "Location" },
];

const getContactHref = (button: ContactButton) => {
  if (!button.url && button.icon !== "location") return "#";
  if (button.icon === "mail") return button.url.startsWith("mailto:") ? button.url : `mailto:${button.url}`;
  if (button.icon === "phone") return button.url.startsWith("tel:") ? button.url : `tel:${button.url}`;
  if (button.icon === "location") {
    const target = button.url?.trim() || button.label?.trim() || "";
    return buildLocationButtonUrl(target) || "#";
  }
  if (button.url.startsWith("http://") || button.url.startsWith("https://")) return button.url;
  return `https://${button.url}`;
};

const ContactIcon: React.FC<{ icon: ContactButton["icon"]; size?: number }> = ({ icon, size = 16 }) => {
  if (icon === "phone") return <Phone size={size} className="text-slate-500" />;
  if (icon === "mail") return <Mail size={size} className="text-slate-500" />;
  if (icon === "location") return <MapPin size={size} className="text-red-500" fill="currentColor" fillOpacity="0.1" />;
  return <LinkIcon size={size} className="text-slate-500" />;
};

const buildFallbackPortfolio = (portfolioId: string, initialData?: PortfolioData): PortfolioData => ({
  id: portfolioId,
  title: initialData?.title ?? "Untitled Portfolio",
  lastModified: initialData?.lastModified ?? new Date(),
  slug: initialData?.slug,
  isBase: initialData?.isBase,
  themeMode: initialData?.themeMode,
  profile: initialData?.profile ?? INITIAL_PROFILE,
  items: normalizePortfolioItems(initialData?.items ?? INITIAL_ITEMS, {
    clampTitleOnlyHeights: true,
    normalizeTemplateTitleHeadings: true,
  }),
});

const getMaxPrefixedNumericId = (ids: string[], prefix: string) => {
  const pattern = new RegExp(`^${prefix}-(\\d+)$`);
  let max = 0;
  for (const id of ids) {
    const match = pattern.exec(id);
    if (match) {
      max = Math.max(max, Number.parseInt(match[1], 10));
    }
  }
  return max;
};

const AVATAR_CROP_MAX_OUTPUT_PX = 512;

const Portfolio: React.FC<PortfolioProps> = ({ portfolioId, initialData, onBack, isReadOnly = false, onPersisted }) => {
  const queryClient = useQueryClient();
  const updatePortfolio = usePortfolioStore(s => s.updatePortfolio);
  const portfolioFromStore = usePortfolioStore(s => s.getPortfolioData(portfolioId));

  const getFallbackPortfolio = useCallback(() => buildFallbackPortfolio(portfolioId, initialData), [portfolioId, initialData]);

  useEffect(() => {
    const seed = initialData ?? getFallbackPortfolio();
    if (!usePortfolioStore.getState().getPortfolioData(portfolioId)) {
      usePortfolioStore.getState().setPortfolioData(portfolioId, seed);
    }
  }, [portfolioId, initialData, getFallbackPortfolio]);

  const portfolio = portfolioFromStore ?? getFallbackPortfolio();
  const profile = portfolio.profile;
  const items = portfolio.items;

  const setProfile = useCallback(
    (profileOrUpdater: UserProfile | ((prev: UserProfile) => UserProfile)) => {
      updatePortfolio(
        portfolioId,
        prev => {
          const baseProfile = prev?.profile ?? INITIAL_PROFILE;
          return {
            ...prev,
            profile: typeof profileOrUpdater === "function" ? profileOrUpdater(baseProfile) : profileOrUpdater,
          };
        },
        { skipNormalize: true }
      );
    },
    [portfolioId, updatePortfolio]
  );

  const setItems = useCallback(
    (itemsOrUpdater: PortfolioItem[] | ((prev: PortfolioItem[]) => PortfolioItem[])) => {
      updatePortfolio(
        portfolioId,
        prev => ({
          ...prev,
          items: typeof itemsOrUpdater === "function" ? itemsOrUpdater(prev.items) : itemsOrUpdater,
        }),
        { skipNormalize: true }
      );
    },
    [portfolioId, updatePortfolio]
  );

  const hasPendingAdkReview = useAdkPortfolioReviewStore(s => s.hasPendingReviewForPortfolio(portfolioId));
  const adkPortfolioHighlights = useAdkPortfolioReviewStore(s =>
    s.hasPendingReviewForPortfolio(portfolioId) ? s.getActiveHighlights() : EMPTY_PORTFOLIO_HIGHLIGHT_MAP
  );

  const { saveStatusLabel, runSave, hasPendingUnsavedChanges, isSavingRemote, savedConfirmationVisible, lastSaveError } =
    usePortfolioAutosave(portfolioId, {
      enabled: !isReadOnly,
      onPersisted,
    });

  const [textSelection, setTextSelection] = useState<RichTextEditorSelectionInfo | null>(null);

  const handleTextSelectionChange = useCallback((info: RichTextEditorSelectionInfo | null) => {
    if (!info || info.text.trim().length < PORTFOLIO_MIN_SELECTION_CHARS) {
      setTextSelection(null);
      return;
    }
    setTextSelection(info);
  }, []);

  const handleForceSave = useCallback(() => {
    void runSave("manual");
  }, [runSave]);

  useEffect(() => {
    useAdkPortfolioReviewStore.getState().registerSaveHandler(portfolioId, async () => {
      await runSave("manual");
    });
    return () => {
      useAdkPortfolioReviewStore.getState().unregisterSaveHandler(portfolioId);
    };
  }, [portfolioId, runSave]);

  const [isEditMode, setIsEditMode] = useState(!isReadOnly);

  const selectionImproveSlot =
    isEditMode && textSelection && textSelection.text.trim().length >= PORTFOLIO_MIN_SELECTION_CHARS ? (
      <PortfolioSelectionImproveActions
        selectedText={textSelection.text}
        disabled={hasPendingAdkReview}
        onActionFired={() => setTextSelection(null)}
      />
    ) : null;

  const selectedProjectId = usePortfolioStore(s => s.getFocusedPageCardId(portfolioId));
  const setFocusedPageCardId = usePortfolioStore(s => s.setFocusedPageCardId);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; targetId: string | null } | null>(null);
  const [pendingDeleteBlockId, setPendingDeleteBlockId] = useState<string | null>(null);
  const [showPublishMenu, setShowPublishMenu] = useState(false);
  const [publishUrlInput, setPublishUrlInput] = useState("");
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishShowPublished, setPublishShowPublished] = useState(false);
  const [inlineInsertIndex, setInlineInsertIndex] = useState<number | null>(null);
  const publishMenuRef = useRef<HTMLDivElement>(null);
  const pendingPublishedTabUrlRef = useRef<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isRepositioningCover, setIsRepositioningCover] = useState(false);
  const [tempCoverPos, setTempCoverPos] = useState<{ x: number; y: number }>(() => profile.coverPosition ?? { x: 50, y: 50 });
  const [avatarCropModal, setAvatarCropModal] = useState<{ source: string; mimeType?: string } | null>(null);
  const [avatarCropZoom, setAvatarCropZoom] = useState(1);
  const [avatarCropPan, setAvatarCropPan] = useState({ x: 0, y: 0 });
  const [avatarCropImageSize, setAvatarCropImageSize] = useState({ width: 0, height: 0 });
  const [isHeroImageUploading, setIsHeroImageUploading] = useState(false);

  const coverInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const { gridRef, resizing, initResize } = useGridResize(items, setItems, itemRefs);
  const toastTimeoutRef = useRef<number | null>(null);
  const coverBannerRef = useRef<HTMLDivElement>(null);
  const coverDragStateRef = useRef<{ x: number; y: number } | null>(null);
  const coverRepositionBaselineRef = useRef<{ x: number; y: number } | null>(null);
  const avatarCropPreviewRef = useRef<HTMLDivElement>(null);
  const avatarCropDragStateRef = useRef<{ x: number; y: number } | null>(null);
  const nextIdRef = useRef(0);
  const historyPastRef = useRef<PortfolioSnapshot[]>([]);
  const historyFutureRef = useRef<PortfolioSnapshot[]>([]);
  const isApplyingHistoryRef = useRef(false);
  const lastSnapshotRef = useRef<PortfolioSnapshot | null>(null);
  const historyDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const historySignatureRef = useRef("");
  const itemsProfileRef = useRef<PortfolioSnapshot>({ items, profile });

  const cloneSnapshot = (snapshot: PortfolioSnapshot): PortfolioSnapshot => {
    if (typeof structuredClone === "function") {
      return structuredClone(snapshot);
    }
    return JSON.parse(JSON.stringify(snapshot)) as PortfolioSnapshot;
  };

  itemsProfileRef.current = { items, profile };

  const commitHistorySnapshot = useCallback((snapshot: PortfolioSnapshot) => {
    if (!lastSnapshotRef.current) {
      lastSnapshotRef.current = cloneSnapshot(snapshot);
      historySignatureRef.current = getPortfolioHistorySignature(snapshot);
      return;
    }

    const nextSignature = getPortfolioHistorySignature(snapshot);
    const previousSignature = getPortfolioHistorySignature(lastSnapshotRef.current);
    if (nextSignature === previousSignature) return;

    historyPastRef.current.push(cloneSnapshot(lastSnapshotRef.current));
    if (historyPastRef.current.length > 100) historyPastRef.current.shift();
    historyFutureRef.current = [];
    lastSnapshotRef.current = cloneSnapshot(snapshot);
    historySignatureRef.current = nextSignature;
  }, []);

  const clearHistoryDebounce = useCallback(() => {
    if (historyDebounceTimerRef.current) {
      clearTimeout(historyDebounceTimerRef.current);
      historyDebounceTimerRef.current = null;
    }
  }, []);

  const flushPendingHistory = useCallback(() => {
    clearHistoryDebounce();
    commitHistorySnapshot(itemsProfileRef.current);
  }, [clearHistoryDebounce, commitHistorySnapshot]);

  const hasPendingUncommittedHistory = useCallback(() => {
    if (!lastSnapshotRef.current) return false;
    return getPortfolioHistorySignature(itemsProfileRef.current) !== getPortfolioHistorySignature(lastSnapshotRef.current);
  }, []);
  const { contentHeights, handleContentHeightMeasure } = usePortfolioContentHeights();
  const gridMetrics = usePortfolioGridMetrics(gridRef);

  const getNextId = useCallback(
    (prefix = "item") => {
      const existingIds = new Set(items.map(item => item.id));
      if (prefix === "contact") {
        for (const button of profile.contactButtons ?? []) {
          existingIds.add(button.id);
        }
      }

      let candidate = "";
      do {
        nextIdRef.current += 1;
        candidate = `${prefix}-${nextIdRef.current}`;
      } while (existingIds.has(candidate));

      return candidate;
    },
    [items, profile.contactButtons]
  );

  useEffect(() => {
    nextIdRef.current = Math.max(
      getMaxPrefixedNumericId(
        items.map(item => item.id),
        "item"
      ),
      getMaxPrefixedNumericId(
        (profile.contactButtons ?? []).map(button => button.id),
        "contact"
      )
    );
  }, [portfolioId, items, profile.contactButtons]);

  const showToast = (message: string) => {
    setToastMessage(message);
    if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = window.setTimeout(() => setToastMessage(null), 2400);
  };

  useEffect(() => {
    if (!lastSaveError) return;
    showToast(`Could not save portfolio: ${lastSaveError.message}`);
  }, [lastSaveError]);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  const selectedProject = selectedProjectId ? (items.find(item => item.id === selectedProjectId) ?? null) : null;

  useEffect(() => {
    if (!selectedProjectId) return;
    const stillExists = items.some(item => item.id === selectedProjectId);
    if (!stillExists) {
      setFocusedPageCardId(portfolioId, null);
    }
  }, [items, portfolioId, selectedProjectId, setFocusedPageCardId]);

  useEffect(() => {
    const currentSnapshot: PortfolioSnapshot = { items, profile };
    if (!lastSnapshotRef.current) {
      lastSnapshotRef.current = cloneSnapshot(currentSnapshot);
      historySignatureRef.current = getPortfolioHistorySignature(currentSnapshot);
      return;
    }

    const nextSignature = getPortfolioHistorySignature(currentSnapshot);
    if (nextSignature === historySignatureRef.current) return;

    if (isApplyingHistoryRef.current) {
      isApplyingHistoryRef.current = false;
      lastSnapshotRef.current = cloneSnapshot(currentSnapshot);
      historySignatureRef.current = nextSignature;
      clearHistoryDebounce();
      return;
    }

    historySignatureRef.current = nextSignature;
    clearHistoryDebounce();
    historyDebounceTimerRef.current = setTimeout(() => {
      historyDebounceTimerRef.current = null;
      commitHistorySnapshot(itemsProfileRef.current);
    }, PORTFOLIO_HISTORY_DEBOUNCE_MS);

    return () => clearHistoryDebounce();
  }, [items, profile, clearHistoryDebounce, commitHistorySnapshot]);

  useEffect(() => {
    return () => {
      flushPendingHistory();
    };
  }, [flushPendingHistory]);

  useEffect(() => {
    const applySnapshot = (snapshot: PortfolioSnapshot) => {
      isApplyingHistoryRef.current = true;
      setItems(cloneSnapshot(snapshot).items);
      setProfile(cloneSnapshot(snapshot).profile);
    };

    const isNativeTextUndoTarget = (target: EventTarget | null) => {
      const node = target instanceof HTMLElement ? target : null;
      if (!node) return false;
      if (node.isContentEditable) return true;
      return Boolean(node.closest('[contenteditable="true"], input, textarea, select'));
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (!isEditMode || !(e.metaKey || e.ctrlKey)) return;
      const key = e.key.toLowerCase();
      const isUndo = key === "z" && !e.shiftKey;
      const isRedo = key === "y" || (key === "z" && e.shiftKey);
      if (!isUndo && !isRedo) return;
      if (isNativeTextUndoTarget(e.target)) return;

      if (isUndo) {
        if (historyDebounceTimerRef.current && hasPendingUncommittedHistory() && lastSnapshotRef.current) {
          e.preventDefault();
          clearHistoryDebounce();
          historyFutureRef.current.push(cloneSnapshot(itemsProfileRef.current));
          applySnapshot(lastSnapshotRef.current);
          return;
        }

        const previous = historyPastRef.current.pop();
        if (!previous) return;
        e.preventDefault();
        historyFutureRef.current.push(cloneSnapshot(itemsProfileRef.current));
        applySnapshot(previous);
        return;
      }

      if (historyDebounceTimerRef.current) {
        clearHistoryDebounce();
        commitHistorySnapshot(itemsProfileRef.current);
      }

      const next = historyFutureRef.current.pop();
      if (!next) return;
      e.preventDefault();
      historyPastRef.current.push(cloneSnapshot(itemsProfileRef.current));
      applySnapshot(next);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isEditMode, clearHistoryDebounce, commitHistorySnapshot, hasPendingUncommittedHistory, setItems, setProfile]);

  useEffect(() => {
    const saved = loadPublishedUrl(portfolioId);
    if (saved) {
      setPublishedUrl(saved);
      return;
    }
    if (portfolio.slug?.trim()) {
      setPublishedUrl(buildPortfolioPublicUrl(portfolio.slug));
    }
  }, [portfolioId, portfolio.slug]);

  useEffect(() => {
    if (!showPublishMenu) return;
    const onPointerDown = (event: MouseEvent) => {
      if (publishMenuRef.current?.contains(event.target as Node)) return;
      setShowPublishMenu(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [showPublishMenu]);

  useEffect(() => {
    if (isPublishing || !publishShowPublished || !publishedUrl) return;

    const url = pendingPublishedTabUrlRef.current;
    if (!url || url !== publishedUrl) return;

    pendingPublishedTabUrlRef.current = null;
    window.open(url, "_blank", "noopener,noreferrer");
  }, [isPublishing, publishShowPublished, publishedUrl]);

  useEffect(() => {
    const cap = items.length;
    const raw = profile.itemsAboveProfileCount ?? 0;
    if (raw > cap) {
      setProfile(p => ({ ...p, itemsAboveProfileCount: cap }));
    }
  }, [items.length, profile.itemsAboveProfileCount, setProfile]);

  useEffect(() => {
    if (isRepositioningCover) return;
    setTempCoverPos(profile.coverPosition ?? { x: 50, y: 50 });
  }, [isRepositioningCover, profile.coverPosition]);

  const showProfileSection = profile.showProfileSection !== false;
  const itemsAboveProfile = Math.min(Math.max(0, profile.itemsAboveProfileCount ?? 0), items.length);
  const isPortfolioLive = Boolean(publishedUrl);

  const togglePublishMenu = () => {
    setPublishUrlInput(publishedUrl ? (portfolio.slug ?? publishUrlInput) : publishUrlInput);
    if (publishedUrl && portfolio.slug) {
      setPublishUrlInput(portfolio.slug);
    }
    setShowPublishMenu(open => {
      if (!open) setInlineInsertIndex(null);
      return !open;
    });
  };

  const normalizePublishSlug = (raw: string) =>
    raw
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/^-|-$/g, "");

  const resolvePublishedSlug = () => {
    const fromProfile = normalizePublishSlug(portfolio.slug ?? "");
    if (fromProfile) return fromProfile;

    const fromInput = normalizePublishSlug(publishUrlInput);
    if (fromInput) return fromInput;

    if (publishedUrl) {
      try {
        const pathname = new URL(publishedUrl, window.location.origin).pathname;
        const match = pathname.match(/\/portfolio\/([^/]+)\/?$/);
        if (match?.[1]) return normalizePublishSlug(match[1]);
      } catch {
        /* ignore */
      }
    }

    return "";
  };

  const saveAndPublishPortfolio = async (slug: string, successToast: string): Promise<string | null> => {
    await runSave("manual");

    const persistedFromCache = queryClient.getQueryData<PortfolioData | null>(portfolioQueryKey);
    const publishPortfolioId =
      persistedFromCache?.id && isPersistedPortfolioId(persistedFromCache.id)
        ? persistedFromCache.id
        : isPersistedPortfolioId(portfolioId)
          ? portfolioId
          : null;

    if (!publishPortfolioId) {
      showToast("Save your portfolio before publishing.");
      return null;
    }

    const current = usePortfolioStore.getState().getPortfolioData(publishPortfolioId) ?? persistedFromCache ?? portfolio;
    const content = mapFrontendPortfolioToBackend({ ...current, id: publishPortfolioId });
    const result = await publishPortfolioAsset(content, slug);

    if (!result.ok) {
      showToast(result.error || "Failed to publish");
      return null;
    }

    const publicUrl = buildPortfolioPublicUrl(result.slug);
    setPublishedUrl(publicUrl);
    savePublishedUrl(publishPortfolioId, publicUrl);
    updatePortfolio(publishPortfolioId, prev => ({ ...prev, slug: result.slug }));
    showToast(successToast);
    setPublishShowPublished(true);
    return publicUrl;
  };

  const handlePublish = async () => {
    if (isPublishing) return;

    if (publishedUrl) {
      const slug = resolvePublishedSlug();
      if (!slug) {
        showToast("Could not find published link");
        return;
      }

      setIsPublishing(true);
      try {
        await saveAndPublishPortfolio(slug, "Changes saved and published");
      } catch {
        showToast("Could not save changes");
      } finally {
        setIsPublishing(false);
      }
      return;
    }

    const slug = normalizePublishSlug(publishUrlInput);
    if (!slug) {
      showToast("Enter a link name");
      return;
    }

    setIsPublishing(true);
    try {
      const publicUrl = await saveAndPublishPortfolio(slug, "Published");
      if (publicUrl) {
        pendingPublishedTabUrlRef.current = publicUrl;
      }
    } catch {
      showToast("Could not publish portfolio");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCopyPublishedLink = async () => {
    const url = publishedUrl?.trim();
    if (!url) {
      showToast("Publish your portfolio first to copy the link");
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      showToast("Link copied");
    } catch {
      showToast("Could not copy link");
    }
  };

  const publishMenuDropdown = showPublishMenu ? (
    <div className="pointer-events-auto absolute right-0 top-[calc(100%+0.5rem)] z-[101] w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl dark:border-white/10 dark:bg-slate-950">
      <p className="text-sm font-semibold text-slate-900 dark:text-white">Publish portfolio</p>
      {!publishedUrl && (
        <p className="mt-2 rounded-lg border border-amber-200/80 bg-amber-50 px-3 py-2 text-[11px] leading-snug text-amber-800 dark:border-amber-500/20 dark:bg-amber-950/40 dark:text-amber-200/90">
          Your portfolio URL can only be chosen once. Pick carefully — it cannot be changed after you publish.
        </p>
      )}
      <label className="mt-3 block text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">URL</label>
      <div className="mt-1.5 flex w-full items-center rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 transition-colors focus-within:border-brand-500/40 focus-within:ring-2 focus-within:ring-brand-500/30 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100">
        <span className="mr-1 hidden flex-none select-none whitespace-nowrap text-slate-400 sm:inline-block">unimad.com/portfolio/</span>
        <span className="mr-1 flex-none select-none whitespace-nowrap text-slate-400 sm:hidden">unimad.com/</span>
        <input
          value={publishUrlInput}
          onChange={e => {
            setPublishUrlInput(e.target.value);
            setPublishShowPublished(false);
          }}
          readOnly={Boolean(publishedUrl)}
          disabled={Boolean(publishedUrl) || isPublishing}
          placeholder="e.g. alex-morgan"
          className="min-w-0 flex-1 bg-transparent outline-none disabled:cursor-not-allowed disabled:opacity-70"
        />
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={handleCopyPublishedLink}
          disabled={!publishedUrl}
          className={`inline-flex items-center justify-center gap-1.5 rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition-all hover:border-brand-500/40 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:text-slate-200 ${isEditMode ? "flex-1" : "w-full"}`}
        >
          <Copy size={13} /> Copy URL
        </button>
        {isEditMode && (
          <button
            type="button"
            onClick={publishShowPublished ? undefined : () => void handlePublish()}
            disabled={isPublishing || publishShowPublished}
            className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold shadow-md transition-all disabled:opacity-60 ${
              publishShowPublished
                ? "cursor-default bg-emerald-500 text-white shadow-emerald-500/20"
                : "bg-brand-600 text-white shadow-brand-500/20 hover:scale-[1.02] active:scale-95"
            }`}
          >
            {publishShowPublished ? <Check size={13} /> : <ExternalLink size={13} />}
            {isPublishing ? "Publishing…" : publishShowPublished ? "Published" : publishedUrl ? "Save" : "Publish"}
          </button>
        )}
      </div>
    </div>
  ) : null;

  const updateItemContent = useCallback(
    (id: string, updates: Partial<PortfolioItem>) => {
      setItems(prev => prev.map(item => (item.id === id ? { ...item, ...updates } : item)));
    },
    [setItems]
  );

  const handleGridItemRef = useCallback((id: string, el: HTMLDivElement | null) => {
    itemRefs.current[id] = el;
  }, []);

  const handleSelectProject = useCallback(
    (project: PortfolioItem) => {
      setFocusedPageCardId(portfolioId, project.id);
    },
    [portfolioId, setFocusedPageCardId]
  );

  const handleGridDragHandleMouseUp = useCallback(() => {
    dragHandleArmedItemIdRef.current = null;
  }, []);

  const handleGridDragHandleMouseDown = useCallback((itemId: string) => {
    dragHandleArmedItemIdRef.current = itemId;
  }, []);

  const handleToggleInlineInserter = useCallback((index: number, isActive: boolean) => {
    setInlineInsertIndex(isActive ? null : index + 1);
  }, []);

  const addItem = (type: ContentType, preset?: Partial<PortfolioItem>) => {
    const newItem: PortfolioItem = {
      id: getNextId("item"),
      type,
      content: "",
      span: getDefaultSpanForContentType(type),
      title: type === "page-card" ? "New Page" : undefined,
      fontSize: "base",
      height: getDefaultItemHeightPx(type),
      ...preset,
    };
    setItems([...items, newItem]);
  };

  const handleInsertBlockAfter = useCallback(
    (index: number, type: ContentType, preset?: Partial<PortfolioItem>) => {
      const newItem: PortfolioItem = {
        id: getNextId("item"),
        type,
        content: "",
        span: getDefaultSpanForContentType(type),
        title: type === "page-card" ? "New Page" : undefined,
        fontSize: "base",
        height: getDefaultItemHeightPx(type),
        ...preset,
      };
      setItems(prev => {
        const next = [...prev];
        next.splice(index + 1, 0, newItem);
        return next;
      });
      setInlineInsertIndex(null);
    },
    [getNextId, setItems]
  );

  const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });

  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

  const getCoverCropGeometry = (imageWidth: number, imageHeight: number, ratio: number, zoom: number, pan: { x: number; y: number }) => {
    let baseCropWidth = imageWidth;
    let baseCropHeight = baseCropWidth / ratio;

    if (baseCropHeight > imageHeight) {
      baseCropHeight = imageHeight;
      baseCropWidth = baseCropHeight * ratio;
    }

    const cropWidth = baseCropWidth / zoom;
    const cropHeight = baseCropHeight / zoom;
    const maxPanX = Math.max(0, (imageWidth - cropWidth) / 2);
    const maxPanY = Math.max(0, (imageHeight - cropHeight) / 2);
    const offsetX = clamp((imageWidth - cropWidth) / 2 + pan.x * maxPanX, 0, imageWidth - cropWidth);
    const offsetY = clamp((imageHeight - cropHeight) / 2 + pan.y * maxPanY, 0, imageHeight - cropHeight);

    return { cropWidth, cropHeight, offsetX, offsetY };
  };

  const applyRatioCrop = (
    source: string,
    ratio: number,
    zoom: number,
    pan: { x: number; y: number },
    callback: (croppedDataUrl: string) => void,
    maxOutputPx?: number
  ) => {
    const img = new Image();
    if (source.startsWith("http")) {
      img.crossOrigin = "anonymous";
    }
    img.onload = () => {
      const { cropWidth, cropHeight, offsetX, offsetY } = getCoverCropGeometry(img.naturalWidth, img.naturalHeight, ratio, zoom, pan);

      let outWidth = Math.round(cropWidth);
      let outHeight = Math.round(cropHeight);
      if (maxOutputPx) {
        const maxDim = Math.max(outWidth, outHeight);
        if (maxDim > maxOutputPx) {
          const scale = maxOutputPx / maxDim;
          outWidth = Math.round(outWidth * scale);
          outHeight = Math.round(outHeight * scale);
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = outWidth;
      canvas.height = outHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(img, offsetX, offsetY, cropWidth, cropHeight, 0, 0, outWidth, outHeight);

      callback(canvas.toDataURL("image/jpeg", 0.92));
    };
    img.src = source;
  };

  const persistCroppedHeroImage = useCallback(
    async (croppedDataUrl: string, category: "profile-picture" | "cover-picture", applyUrl: (url: string) => void) => {
      setIsHeroImageUploading(true);
      try {
        const url = await uploadHeroImageFromDataUrl(croppedDataUrl, category);
        applyUrl(url);
        if (category === "profile-picture") {
          void queryClient.invalidateQueries({ queryKey: profileQk.media("profile-picture") });
        }
        showToast(category === "profile-picture" ? "Profile photo saved" : "Cover image saved");
      } catch (error) {
        const message = formatPortfolioUploadError(
          error,
          category === "profile-picture" ? "Could not upload profile photo." : "Could not upload cover."
        );
        logPortfolioUploadError(category === "profile-picture" ? "hero-avatar" : "hero-cover", error, { portfolioId });
        showToast(message);
      } finally {
        setIsHeroImageUploading(false);
      }
    },
    [portfolioId, queryClient, showToast]
  );

  const beginCoverReposition = (position: { x: number; y: number }) => {
    coverRepositionBaselineRef.current = profile.coverPosition ?? { x: 50, y: 50 };
    setTempCoverPos(position);
    setIsRepositioningCover(true);
  };

  const handleCoverUpload = async (file: File) => {
    logPortfolioUploadStart("hero-cover", file, { portfolioId });
    const initialPos = { x: 50, y: 50 };
    setIsHeroImageUploading(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      const url = await uploadHeroImageFromDataUrl(dataUrl, "cover-picture");
      setProfile(prev => ({
        ...prev,
        coverUrl: url,
        showCover: true,
        coverPosition: initialPos,
      }));
      coverRepositionBaselineRef.current = initialPos;
      setTempCoverPos(initialPos);
      setIsRepositioningCover(true);
      logPortfolioUploadSuccess("hero-cover", url, { portfolioId });
    } catch (error) {
      const message = formatPortfolioUploadError(error, "Could not upload cover. Try a JPG/PNG/GIF under 4MB, or check your connection.");
      logPortfolioUploadError("hero-cover", error, { portfolioId });
      showToast(message);
    } finally {
      setIsHeroImageUploading(false);
    }
  };

  const handleRepositionCover = () => {
    if (!profile.coverUrl?.trim()) return;
    beginCoverReposition(profile.coverPosition ?? { x: 50, y: 50 });
  };

  const handleBannerPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isRepositioningCover) return;
    e.preventDefault();
    coverDragStateRef.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleBannerPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isRepositioningCover || !coverDragStateRef.current || !coverBannerRef.current) return;
    const rect = coverBannerRef.current.getBoundingClientRect();
    const dx = e.clientX - coverDragStateRef.current.x;
    const dy = e.clientY - coverDragStateRef.current.y;
    coverDragStateRef.current = { x: e.clientX, y: e.clientY };
    const pctDx = (dx / Math.max(1, rect.width)) * 100;
    const pctDy = (dy / Math.max(1, rect.height)) * 100;
    setTempCoverPos(prev => ({
      x: clamp(prev.x - pctDx, 0, 100),
      y: clamp(prev.y - pctDy, 0, 100),
    }));
  };

  const handleBannerPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    coverDragStateRef.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    if (isRepositioningCover) {
      setProfile(prev => ({ ...prev, coverPosition: tempCoverPos }));
    }
  };

  const handleSaveCoverLayout = () => {
    setProfile(prev => ({ ...prev, coverPosition: tempCoverPos }));
    coverRepositionBaselineRef.current = null;
    setIsRepositioningCover(false);
  };

  const handleCancelCoverReposition = () => {
    const baseline = coverRepositionBaselineRef.current ?? profile.coverPosition ?? { x: 50, y: 50 };
    setProfile(prev => ({ ...prev, coverPosition: baseline }));
    setTempCoverPos(baseline);
    coverRepositionBaselineRef.current = null;
    setIsRepositioningCover(false);
  };

  const openAvatarCropModal = (source: string, mimeType?: string) => {
    setAvatarCropZoom(1);
    setAvatarCropPan({ x: 0, y: 0 });
    setAvatarCropModal({ source: resolveMediaDisplayUrl(source), mimeType });
  };

  const handleAvatarUpload = async (file: File) => {
    const dataUrl = await fileToDataUrl(file);
    setProfile(prev => ({ ...prev, showAvatar: true }));
    openAvatarCropModal(dataUrl, file.type || "image/jpeg");
  };

  const handleShowAvatar = () => {
    setProfile(prev => ({ ...prev, showAvatar: true }));
    if (!resolveMediaDisplayUrl(profile.avatarUrl)?.trim()) {
      avatarInputRef.current?.click();
    }
  };

  const handleHideAvatar = () => {
    setProfile(prev => ({ ...prev, showAvatar: false }));
  };

  useEffect(() => {
    if (!avatarCropModal) return;
    const img = new Image();
    img.onload = () => {
      setAvatarCropImageSize({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = avatarCropModal.source;
  }, [avatarCropModal]);

  const avatarCropGeometry =
    avatarCropModal && avatarCropImageSize.width && avatarCropImageSize.height
      ? getCoverCropGeometry(avatarCropImageSize.width, avatarCropImageSize.height, 1, avatarCropZoom, avatarCropPan)
      : null;

  const avatarCropPreviewStyle =
    avatarCropGeometry && avatarCropImageSize.width && avatarCropImageSize.height
      ? {
          backgroundImage: `url(${avatarCropModal?.source})`,
          backgroundSize: `${(avatarCropImageSize.width / avatarCropGeometry.cropWidth) * 100}% ${(avatarCropImageSize.height / avatarCropGeometry.cropHeight) * 100}%`,
          backgroundPosition: `${(avatarCropGeometry.offsetX / Math.max(1, avatarCropImageSize.width - avatarCropGeometry.cropWidth)) * 100}% ${(avatarCropGeometry.offsetY / Math.max(1, avatarCropImageSize.height - avatarCropGeometry.cropHeight)) * 100}%`,
        }
      : undefined;

  const handleAvatarCropPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!avatarCropPreviewRef.current) return;
    avatarCropDragStateRef.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleAvatarCropPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!avatarCropDragStateRef.current || !avatarCropPreviewRef.current) return;
    const rect = avatarCropPreviewRef.current.getBoundingClientRect();
    const dx = e.clientX - avatarCropDragStateRef.current.x;
    const dy = e.clientY - avatarCropDragStateRef.current.y;
    avatarCropDragStateRef.current = { x: e.clientX, y: e.clientY };
    setAvatarCropPan(prev => ({
      x: clamp(prev.x - dx / Math.max(1, rect.width), -1, 1),
      y: clamp(prev.y - dy / Math.max(1, rect.height), -1, 1),
    }));
  };

  const handleAvatarCropPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    avatarCropDragStateRef.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const duplicateItem = (id: string) => {
    const original = items.find(item => item.id === id);
    if (original) {
      const newItem = { ...original, id: getNextId("item") };
      const index = items.findIndex(item => item.id === id);
      const newItems = [...items];
      newItems.splice(index + 1, 0, newItem);
      setItems(newItems);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, targetId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, targetId });
  };

  const closeContextMenu = () => setContextMenu(null);

  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const dragHandleArmedItemIdRef = useRef<string | null>(null);

  const getRowSpanForItem = useCallback(
    (item: PortfolioItem) => getRowSpanForPortfolioItem(item, contentHeights, gridMetrics, { isEditMode }),
    [contentHeights, gridMetrics, isEditMode]
  );

  useEffect(() => {
    if (!gridRef.current || !items.some(i => i.colStart === undefined)) return;
    const timer = window.setTimeout(() => {
      const parentWidth = gridRef.current?.clientWidth;
      if (!parentWidth) return;
      setItems(currentItems => {
        let changed = false;
        const next = currentItems.map(item => {
          if (item.colStart !== undefined) return item;
          const el = itemRefs.current[item.id];
          if (!el) return item;
          const colStart = Math.max(1, Math.min(12, Math.round((el.offsetLeft / parentWidth) * 12) + 1));
          changed = true;
          return { ...item, colStart };
        });
        return changed ? next : currentItems;
      });
    }, 100);
    return () => window.clearTimeout(timer);
  }, [items, setItems, gridRef]);

  const handleEdgeResizeStart = (e: React.MouseEvent<HTMLDivElement>, item: PortfolioItem) => {
    if (!isEditMode || resizing || e.button !== 0) return;
    if (isInteractiveResizeTarget(e.target as HTMLElement)) return;

    const zone = getPortfolioEdgeResizeZone(item, e.clientX, e.clientY, e.currentTarget.getBoundingClientRect());
    const resolved = resolvePortfolioEdgeResizeAxis(zone);
    if (!resolved) return;
    initResize(e, item, resolved.axis, resolved.xHandle, resolved.yHandle);
  };

  const handleEdgeResizeHover = (e: React.MouseEvent<HTMLDivElement>, item: PortfolioItem) => {
    if (!isEditMode || resizing) return;
    if (isInteractiveResizeTarget(e.target as HTMLElement)) {
      e.currentTarget.style.cursor = "default";
      return;
    }

    const zone = getPortfolioEdgeResizeZone(item, e.clientX, e.clientY, e.currentTarget.getBoundingClientRect());
    e.currentTarget.style.cursor = getPortfolioEdgeResizeCursor(zone);
  };

  const addContactButton = () => {
    const newButton: ContactButton = {
      id: getNextId("contact"),
      label: "New Button",
      url: "",
      icon: "link",
      isVisible: true,
    };
    setProfile(prev => ({
      ...prev,
      contactButtons: [...getMutableContactButtons(prev), newButton],
    }));
  };

  const updateContactButton = (id: string, updates: Partial<ContactButton>) => {
    setProfile(prev => {
      const base = getMutableContactButtons(prev);
      const nextButtons = base.map(button => {
        if (button.id !== id) {
          return button;
        }
        const updated = { ...button, ...updates };
        if (updated.icon === "location") {
          const label = updated.label.trim();
          return {
            ...updated,
            url: buildLocationButtonUrl(label),
          };
        }
        return updated;
      });
      const locationButton = nextButtons.find(button => button.id === id && button.icon === "location");
      const websiteButton = nextButtons.find(button => button.id === id && button.id === "contact-site");
      const hasAnyLocationButton = nextButtons.some(button => button.icon === "location" || button.id === "contact-location");

      if (locationButton) {
        return {
          ...prev,
          contactButtons: nextButtons,
          location: locationButton.label.trim(),
        };
      }

      if (websiteButton) {
        return {
          ...prev,
          contactButtons: nextButtons,
          website: websiteButton.url.trim(),
          websiteLabel: websiteButton.label.trim() || "Website",
        };
      }

      return {
        ...prev,
        contactButtons: nextButtons,
        ...(!hasAnyLocationButton ? { location: "" } : {}),
      };
    });
  };

  const removeContactButton = (id: string) => {
    setProfile(prev => {
      const base = getMutableContactButtons(prev);
      const removed = base.find(button => button.id === id);
      return {
        ...prev,
        contactButtons: base.filter(button => button.id !== id),
        ...(removed?.icon === "location" ? { location: "" } : {}),
        ...(removed?.id === "contact-site" ? { website: "", websiteLabel: "" } : {}),
      };
    });
  };

  const removeItem = (id: string) => {
    const idx = items.findIndex(item => item.id === id);
    const k = profile.itemsAboveProfileCount ?? 0;
    setItems(items.filter(item => item.id !== id));
    if (idx !== -1 && idx < k) {
      setProfile(p => ({
        ...p,
        itemsAboveProfileCount: Math.max(0, (p.itemsAboveProfileCount ?? 0) - 1),
      }));
    }
  };

  const requestDeleteBlock = (id: string) => {
    setPendingDeleteBlockId(id);
    closeContextMenu();
  };

  const handleConfirmDeleteBlock = () => {
    if (!pendingDeleteBlockId) return;
    removeItem(pendingDeleteBlockId);
    setPendingDeleteBlockId(null);
  };

  const pendingDeleteBlock = pendingDeleteBlockId ? items.find(item => item.id === pendingDeleteBlockId) : null;

  const moveItemFromBelowToAboveProfile = (fromIndex: number) => {
    if (!showProfileSection) return;
    const k = Math.min(profile.itemsAboveProfileCount ?? 0, items.length);
    if (fromIndex < k) return;
    const next = [...items];
    const [el] = next.splice(fromIndex, 1);
    next.splice(k, 0, el);
    setItems(next);
    setProfile(p => ({ ...p, itemsAboveProfileCount: k + 1 }));
    handleDragEnd();
  };

  const moveItemFromAboveToBelowProfile = (fromIndex: number) => {
    if (!showProfileSection) return;
    const k = Math.min(profile.itemsAboveProfileCount ?? 0, items.length);
    if (fromIndex >= k) return;
    const next = [...items];
    const [el] = next.splice(fromIndex, 1);
    const newK = Math.max(0, k - 1);
    next.splice(newK, 0, el);
    setItems(next);
    setProfile(p => ({ ...p, itemsAboveProfileCount: newK }));
    handleDragEnd();
  };

  const resolveDropSourceIndex = (): number => {
    if (draggedItemId) {
      const i = items.findIndex(it => it.id === draggedItemId);
      if (i !== -1) return i;
    }
    if (draggedItemIndex !== null && draggedItemIndex >= 0 && draggedItemIndex < items.length) {
      return draggedItemIndex;
    }
    return -1;
  };

  const getSpanClass = (span: number) => {
    const clampedSpan = Math.max(1, Math.min(12, Math.round(span)));
    const spanClasses: Record<number, string> = {
      1: "col-span-1 md:col-span-1",
      2: "col-span-1 md:col-span-2",
      3: "col-span-1 md:col-span-3",
      4: "col-span-1 md:col-span-4",
      5: "col-span-1 md:col-span-5",
      6: "col-span-1 md:col-span-6",
      7: "col-span-1 md:col-span-7",
      8: "col-span-1 md:col-span-8",
      9: "col-span-1 md:col-span-9",
      10: "col-span-1 md:col-span-10",
      11: "col-span-1 md:col-span-11",
      12: "col-span-1 md:col-span-12",
    };
    return spanClasses[clampedSpan];
  };

  const heroContactButtons = resolveContactButtons(profile);
  const visibleContactButtons = heroContactButtons.filter(button => button.isVisible && button.label.trim());
  const avatarDisplayUrl = resolveMediaDisplayUrl(profile.avatarUrl);
  const hasAvatarImage = Boolean(avatarDisplayUrl?.trim());
  const avatarOverlapClass = profile.showCover !== false ? "-mt-16 md:-mt-20" : "mt-0";

  // -- Drag & Drop Logic --
  const handleDragStart = (e: React.DragEvent, index: number, itemId: string) => {
    if (!isEditMode || resizing) {
      e.preventDefault();
      return;
    }
    if (dragHandleArmedItemIdRef.current !== itemId) {
      e.preventDefault();
      return;
    }
    const target = e.target as HTMLElement;
    if (target?.closest('input, textarea, select, [contenteditable="true"]')) {
      e.preventDefault();
      return;
    }
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) {
      e.preventDefault();
      return;
    }
    // Set ghost image to transparent
    const img = new Image();
    img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    e.dataTransfer.setDragImage(img, 0, 0);

    // During drag-and-drop, let CSS grid auto-place items freely.
    // Pinned colStart values are useful for directional resize, but they can make
    // reorder feel locked. Clear them when a drag starts.
    setItems(prev =>
      prev.map(it => {
        if (typeof it.colStart === "undefined") return it;
        const { colStart, ...rest } = it;
        return rest;
      })
    );

    setDraggedItemIndex(index);
    setDraggedItemId(itemId);
  };

  const reorderByIndex = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const next = [...items];
    const dragged = next[fromIndex];
    next.splice(fromIndex, 1);
    next.splice(toIndex, 0, dragged);
    setItems(next);
    setDraggedItemIndex(toIndex);
  };

  const reorderRafRef = useRef<number | null>(null);
  const pendingReorderRef = useRef<{ fromIndex: number; toIndex: number } | null>(null);

  const scheduleReorder = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    pendingReorderRef.current = { fromIndex, toIndex };
    if (reorderRafRef.current !== null) return;

    reorderRafRef.current = window.requestAnimationFrame(() => {
      const pending = pendingReorderRef.current;
      pendingReorderRef.current = null;
      reorderRafRef.current = null;
      if (!pending) return;
      reorderByIndex(pending.fromIndex, pending.toIndex);
    });
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    const fromIndex = draggedItemId ? items.findIndex(it => it.id === draggedItemId) : draggedItemIndex;
    if (fromIndex === null || fromIndex === -1 || fromIndex === index) return;
    scheduleReorder(fromIndex, index);
  };

  const handleDragEnd = () => {
    setDraggedItemIndex(null);
    setDraggedItemId(null);
    dragHandleArmedItemIdRef.current = null;
    if (reorderRafRef.current !== null) {
      window.cancelAnimationFrame(reorderRafRef.current);
      reorderRafRef.current = null;
    }
    pendingReorderRef.current = null;

    window.setTimeout(() => {
      if (!gridRef.current) return;
      const parentWidth = gridRef.current.clientWidth;
      if (parentWidth <= 0) return;
      setItems(currentItems =>
        currentItems.map(item => {
          const el = itemRefs.current[item.id];
          if (!el) return item;
          const colStart = Math.max(1, Math.min(12, Math.round((el.offsetLeft / parentWidth) * 12) + 1));
          if (item.colStart === colStart) return item;
          return { ...item, colStart };
        })
      );
    }, 0);
  };

  const handleGridDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!isEditMode) return;
    const fromIndex = draggedItemId ? items.findIndex(it => it.id === draggedItemId) : draggedItemIndex;
    if (fromIndex === null || fromIndex === -1) return;

    const points = items
      .map((it, idx) => {
        const el = itemRefs.current[it.id];
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        return { idx, rect };
      })
      .filter(Boolean) as Array<{ idx: number; rect: DOMRect }>;

    if (points.length === 0) return;

    // Sort by visual order (top-to-bottom, then left-to-right)
    points.sort((a, b) => a.rect.top - b.rect.top || a.rect.left - b.rect.left);

    const x = e.clientX;
    const y = e.clientY;

    let targetIndex = points[points.length - 1].idx;
    for (const p of points) {
      const midY = p.rect.top + p.rect.height / 2;
      const midX = p.rect.left + p.rect.width / 2;
      if (y < midY || (Math.abs(y - midY) < 12 && x < midX)) {
        targetIndex = p.idx;
        break;
      }
    }

    scheduleReorder(fromIndex, targetIndex);
  };

  const renderPortfolioGridItem = (item: PortfolioItem, index: number) => {
    const blockHighlight = adkPortfolioHighlights[`block:${item.id}`];
    const isResizingThis = resizing?.id === item.id;

    return (
      <PortfolioGridBlock
        key={item.id}
        item={item}
        index={index}
        isEditMode={isEditMode}
        isResizingThis={Boolean(isResizingThis)}
        isGridResizing={Boolean(resizing)}
        isDragging={draggedItemIndex === index}
        rowSpan={getRowSpanForItem(item)}
        spanClass={getSpanClass(item.span)}
        blockHighlight={blockHighlight}
        isInlineInserterActive={inlineInsertIndex === index + 1}
        enableSelectionImprove={isEditMode && !hasPendingAdkReview}
        onTextSelectionChange={handleTextSelectionChange}
        selectionImproveSlot={selectionImproveSlot}
        onItemRef={handleGridItemRef}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onContextMenu={handleContextMenu}
        onDragHandleMouseUp={handleGridDragHandleMouseUp}
        onEdgeResizeStart={handleEdgeResizeStart}
        onEdgeResizeHover={handleEdgeResizeHover}
        onUpdate={updateItemContent}
        onSelectProject={handleSelectProject}
        onMeasureHeight={handleContentHeightMeasure}
        onRequestDelete={requestDeleteBlock}
        onDragStart={handleDragStart}
        onDragHandleMouseDown={handleGridDragHandleMouseDown}
        onToggleInlineInserter={handleToggleInlineInserter}
        onInsertBlockAfter={handleInsertBlockAfter}
        initResize={initResize}
        onUploadError={message => showToast(message)}
      />
    );
  };

  return (
    <>
      {selectedProject ? (
        <ProjectDetailView
          project={selectedProject}
          onBack={() => setFocusedPageCardId(portfolioId, null)}
          onUpdateProject={updated => {
            updateItemContent(updated.id, updated);
            setFocusedPageCardId(portfolioId, updated.id);
          }}
          isEditMode={isEditMode}
          onToggleEditMode={() => setIsEditMode(prev => !prev)}
          adkHighlights={adkPortfolioHighlights}
          gridColumns={12}
          maxWidthClassName="max-w-5xl"
          enableSelectionImprove={isEditMode && !hasPendingAdkReview}
          onTextSelectionChange={handleTextSelectionChange}
          selectionImproveSlot={selectionImproveSlot}
          onUploadError={message => showToast(message)}
        />
      ) : (
        <div className="scrollbar-on-hover [scrollbar-gutter:stable] relative h-full flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950">
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async e => {
              const file = e.target.files?.[0];
              if (file) await handleCoverUpload(file);
              e.target.value = "";
            }}
          />
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async e => {
              const file = e.target.files?.[0];
              if (file) await handleAvatarUpload(file);
              e.target.value = "";
            }}
          />
          {/* Editor / preview header */}
          {!isReadOnly && (
            <div
              className={`sticky top-0 isolate flex items-center justify-between border-b border-slate-100 bg-white/80 px-6 py-4 backdrop-blur-md dark:border-white/5 dark:bg-slate-950/80 ${
                showPublishMenu ? "z-[100]" : "z-40"
              }`}
            >
              {onBack ? (
                <button
                  type="button"
                  onClick={onBack}
                  className="flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                >
                  <ArrowLeft size={18} /> Back to Dashboard
                </button>
              ) : (
                <div className="text-sm font-medium text-slate-500 dark:text-slate-400">{portfolio.title || "Portfolio"}</div>
              )}
              <div className="flex items-center gap-3">
                {isEditMode && !hasPendingAdkReview && !isReadOnly ? (
                  <DocumentSaveStatusBar
                    hasPendingUnsavedChanges={hasPendingUnsavedChanges}
                    isSaving={isSavingRemote}
                    savedConfirmationVisible={savedConfirmationVisible}
                    onSaveNow={handleForceSave}
                    saveNowLabel="Save Now"
                    savingLabel={isSavingRemote ? "Saving..." : "Autosaving..."}
                    visible={Boolean(saveStatusLabel)}
                    variant="studio"
                  />
                ) : null}
                {isEditMode ? (
                  <>
                    <div className="relative" ref={publishMenuRef}>
                      <button
                        type="button"
                        onClick={togglePublishMenu}
                        aria-expanded={showPublishMenu}
                        aria-haspopup="true"
                        className={`flex items-center gap-2 rounded-full border px-5 py-2 text-xs font-semibold transition-all ${
                          showPublishMenu
                            ? "border-brand-500/50 bg-brand-50 text-brand-800 dark:border-brand-500/40 dark:bg-brand-900/50 dark:text-brand-200"
                            : "border-slate-200 bg-white/80 text-slate-700 hover:border-brand-500/40 hover:text-brand-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:text-white"
                        }`}
                        title="Save and publish your portfolio"
                      >
                        <ExternalLink size={14} />
                        Save and publish
                      </button>
                      {publishMenuDropdown}
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsEditMode(false)}
                      className="flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-2 text-xs font-semibold text-white shadow-lg shadow-brand-500/30 transition-all hover:bg-brand-700 active:scale-[0.99]"
                    >
                      <Eye size={14} /> Preview Mode
                    </button>
                  </>
                ) : (
                  <>
                    {isPortfolioLive && (
                      <div className="relative" ref={publishMenuRef}>
                        <button
                          type="button"
                          onClick={togglePublishMenu}
                          aria-expanded={showPublishMenu}
                          aria-haspopup="true"
                          className={`inline-flex items-center gap-2 rounded-full border px-5 py-2 text-xs font-semibold transition-all ${
                            showPublishMenu
                              ? "border-green-500/50 bg-green-100 text-green-900 dark:border-green-500/40 dark:bg-green-950/60 dark:text-green-200"
                              : "border-green-500/30 bg-green-50 text-green-800 dark:border-green-500/25 dark:bg-green-950/40 dark:text-green-300"
                          }`}
                          title="View portfolio URL"
                        >
                          <PortfolioLiveDot />
                          Published
                        </button>
                        {publishMenuDropdown}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsEditMode(true)}
                      className="flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-2 text-xs font-semibold text-white shadow-lg shadow-brand-500/30 transition-all hover:bg-brand-700 active:scale-[0.99]"
                    >
                      <Edit3 size={14} /> Edit portfolio
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Full Width Cover */}
          {isEditMode && profile.showCover === false ? (
            <div className="max-w-5xl mx-auto px-4 mt-6">
              <button
                onClick={() => setProfile(prev => ({ ...prev, showCover: true }))}
                className="w-full py-4 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-xl text-slate-400 hover:text-brand-600 hover:border-brand-500 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
              >
                <ImageIcon size={16} /> Show Cover Image
              </button>
            </div>
          ) : (
            profile.showCover !== false && (
              <div className="max-w-5xl mx-auto px-4 mt-6">
                <div
                  ref={coverBannerRef}
                  className={`aspect-[4/1] w-full relative group bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/5 overflow-hidden ${
                    showProfileSection ? "rounded-t-2xl" : "rounded-2xl"
                  } ${isRepositioningCover ? "ring-2 ring-brand-500/60 ring-offset-2 ring-offset-white dark:ring-offset-slate-950" : ""}`}
                >
                  {profile.coverUrl ? (
                    <PortfolioImage
                      src={profile.coverUrl}
                      alt={profile.name ? `${profile.name} cover` : "Portfolio cover"}
                      fill
                      sizes="(max-width: 768px) 100vw, 1280px"
                      className={`object-cover ${isRepositioningCover ? "cursor-grab active:cursor-grabbing select-none" : ""}`}
                      style={{ objectPosition: `${tempCoverPos.x}% ${tempCoverPos.y}%` }}
                      onPointerDown={isRepositioningCover ? handleBannerPointerDown : undefined}
                      onPointerMove={isRepositioningCover ? handleBannerPointerMove : undefined}
                      onPointerUp={isRepositioningCover ? handleBannerPointerUp : undefined}
                      onPointerCancel={isRepositioningCover ? handleBannerPointerUp : undefined}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm font-medium">No Cover Image</div>
                  )}
                  {isEditMode && !isRepositioningCover && (
                    <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center gap-4 backdrop-blur-sm transition-all z-10">
                      <button
                        onClick={() => coverInputRef.current?.click()}
                        className="bg-white text-slate-900 px-6 py-2 rounded-full font-medium text-sm shadow-xl hover:scale-105 active:scale-95 transition-transform"
                      >
                        Update Cover
                      </button>
                      {profile.coverUrl ? (
                        <button
                          type="button"
                          onClick={handleRepositionCover}
                          className="bg-white text-slate-900 px-6 py-2 rounded-full font-medium text-sm shadow-xl hover:scale-105 active:scale-95 transition-transform"
                        >
                          Reposition Cover
                        </button>
                      ) : null}
                      <button
                        onClick={() => setProfile(prev => ({ ...prev, showCover: false }))}
                        className="bg-red-500 text-white p-2.5 rounded-full shadow-xl hover:scale-105 active:scale-95 transition-transform"
                        title="Hide Cover"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                  {isEditMode && isRepositioningCover && (
                    <>
                      <p className="absolute top-3 left-4 z-20 rounded-full bg-black/40 px-3 py-1 text-[11px] font-medium text-white/80 backdrop-blur-sm">
                        Drag to reposition your cover
                      </p>
                      <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleCancelCoverReposition}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-black/40 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/55"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveCoverLayout}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-transparent bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition-colors hover:bg-slate-100"
                        >
                          Save Layout
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )
          )}

          <div className="max-w-5xl mx-auto px-4 pb-40">
            {!showProfileSection && isEditMode && (
              <div className="mb-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setProfile(prev => ({ ...prev, showProfileSection: true }))}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:border-brand-500/40 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
                >
                  <Eye size={14} aria-hidden /> Show profile section
                </button>
              </div>
            )}

            {showProfileSection && itemsAboveProfile > 0 && (
              <div
                className={`relative mb-6 min-h-[80px] ${PORTFOLIO_DENSE_GRID_CLASS}`}
                onDragOver={isEditMode ? handleGridDragOver : undefined}
              >
                {items.slice(0, itemsAboveProfile).map((item, sliceIndex) => renderPortfolioGridItem(item, sliceIndex))}
              </div>
            )}

            {showProfileSection && isEditMode && (
              <div
                role="presentation"
                onDragOver={e => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                }}
                onDrop={e => {
                  e.preventDefault();
                  const from = resolveDropSourceIndex();
                  if (from >= 0) moveItemFromBelowToAboveProfile(from);
                }}
                className="mb-2 flex min-h-[36px] cursor-default items-center justify-center rounded-xl border border-dashed border-slate-200 text-[10px] font-medium uppercase tracking-wider text-slate-400 transition-colors hover:border-brand-400/60 hover:text-brand-600 dark:border-white/10 dark:text-slate-500 dark:hover:border-brand-400/50 dark:hover:text-brand-400"
              >
                Drop block here to move above profile
              </div>
            )}

            {/* Profile Info Section */}
            {showProfileSection && (
              <PortfolioAdkBlockHighlight kind={adkPortfolioHighlights.hero} className="w-full">
                <div
                  className={`relative mb-16 flex flex-col bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/5 border-t-0 rounded-b-2xl px-6 md:px-10 pb-12 ${
                    profile.showCover !== false ? "pt-0" : "pt-10"
                  } ${
                    profile.profileAlignment === "center"
                      ? "items-center text-center"
                      : profile.profileAlignment === "right"
                        ? "items-end text-right"
                        : "items-start text-left"
                  }`}
                >
                  {isEditMode && (
                    <div className="absolute right-4 top-4 z-30">
                      <button
                        type="button"
                        onClick={() => setProfile(prev => ({ ...prev, showProfileSection: false }))}
                        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/95 px-3 py-1.5 text-[11px] font-medium text-slate-600 shadow-sm backdrop-blur hover:border-slate-300 dark:border-white/10 dark:bg-slate-900/95 dark:text-slate-300"
                      >
                        <EyeOff size={14} aria-hidden /> Hide profile
                      </button>
                    </div>
                  )}
                  {isEditMode && profile.showAvatar === false ? (
                    <button
                      type="button"
                      onClick={handleShowAvatar}
                      className={`w-32 h-32 md:w-36 md:h-36 rounded-full border-4 border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-brand-600 hover:border-brand-500 transition-colors ${avatarOverlapClass} z-10 bg-white dark:bg-white/5`}
                    >
                      <ImageIcon size={20} aria-hidden />
                      <span className="text-[10px] font-medium uppercase tracking-widest">Show</span>
                    </button>
                  ) : (
                    profile.showAvatar !== false && (
                      <div className={`relative group ${avatarOverlapClass} z-10 w-32 h-32 md:w-36 md:h-36 flex-shrink-0`}>
                        <div className="relative h-full w-full overflow-hidden rounded-full border-4 border-white bg-white shadow-lg dark:border-slate-950 dark:bg-slate-950">
                          {hasAvatarImage ? (
                            <PortfolioImage
                              src={profile.avatarUrl}
                              alt={profile.name ? `${profile.name} avatar` : "Profile avatar"}
                              width={144}
                              height={144}
                              className="h-full w-full object-cover"
                            />
                          ) : isEditMode ? (
                            <button
                              type="button"
                              onClick={() => avatarInputRef.current?.click()}
                              className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-slate-400 transition-colors hover:text-brand-600"
                              aria-label="Add profile photo"
                            >
                              <ImageIcon size={20} aria-hidden />
                              <span className="text-[10px] font-medium uppercase tracking-widest">Add Photo</span>
                            </button>
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] font-medium uppercase tracking-widest text-slate-400">
                              No Photo
                            </div>
                          )}
                        </div>
                        {isEditMode && (
                          <>
                            {hasAvatarImage ? (
                              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-slate-800 shadow-xl border border-slate-100 dark:border-white/5 rounded-lg flex items-center p-1 z-20 pointer-events-none group-hover:pointer-events-auto">
                                <button
                                  type="button"
                                  onClick={() => setProfile(prev => ({ ...prev, profileAlignment: "left" }))}
                                  className={`p-1.5 rounded-md ${profile.profileAlignment === "left" ? "bg-slate-100 dark:bg-white/10 text-brand-600" : "text-slate-400 hover:text-slate-600 dark:hover:text-white"}`}
                                  title="Align Left"
                                >
                                  <AlignLeft size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setProfile(prev => ({ ...prev, profileAlignment: "center" }))}
                                  className={`p-1.5 rounded-md ${profile.profileAlignment === "center" ? "bg-slate-100 dark:bg-white/10 text-brand-600" : "text-slate-400 hover:text-slate-600 dark:hover:text-white"}`}
                                  title="Align Center"
                                >
                                  <AlignCenter size={14} />
                                </button>
                              </div>
                            ) : null}
                            <div className="absolute inset-0 rounded-full bg-black/60 hidden group-hover:flex flex-col items-center justify-center gap-2 cursor-pointer backdrop-blur-sm overflow-hidden p-2 z-10">
                              <div
                                onClick={e => {
                                  e.stopPropagation();
                                  avatarInputRef.current?.click();
                                }}
                                className="flex items-center justify-center gap-1.5 text-white hover:text-brand-400 transition-colors"
                              >
                                <Edit3 size={16} /> <span className="text-[10px] font-medium">{hasAvatarImage ? "Update" : "Add"}</span>
                              </div>
                              {hasAvatarImage ? (
                                <div
                                  onClick={e => {
                                    e.stopPropagation();
                                    openAvatarCropModal(profile.avatarUrl, "image/jpeg");
                                  }}
                                  className="flex items-center justify-center gap-1.5 text-white hover:text-brand-400 transition-colors"
                                >
                                  <ImageIcon size={16} /> <span className="text-[10px] font-medium">Crop</span>
                                </div>
                              ) : null}
                              <div className="h-px w-1/2 bg-white/20"></div>
                              <div
                                onClick={e => {
                                  e.stopPropagation();
                                  handleHideAvatar();
                                }}
                                className="flex items-center justify-center gap-2 text-red-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 size={16} /> <span className="text-xs font-medium">Hide</span>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )
                  )}

                  <div className="mt-8 w-full max-w-2xl relative">
                    {isEditMode ? (
                      <div className="space-y-1">
                        <input
                          value={profile.name}
                          onChange={e => {
                            const name = e.target.value;
                            updatePortfolio(portfolioId, prev => ({
                              ...prev,
                              title: name,
                              profile: { ...prev.profile, name },
                            }));
                          }}
                          className={`text-[32px] md:text-[40px] font-semibold tracking-tight text-slate-900 dark:text-white bg-transparent outline-none w-full ${
                            profile.profileAlignment === "center"
                              ? "text-center"
                              : profile.profileAlignment === "right"
                                ? "text-right"
                                : "text-left"
                          }`}
                          placeholder="Your name..."
                        />
                        <input
                          value={profile.tagline}
                          onChange={e => setProfile(prev => ({ ...prev, tagline: e.target.value }))}
                          className={`text-[12px] md:text-[15px] font-medium text-slate-500 dark:text-slate-400 bg-transparent outline-none w-full ${
                            profile.profileAlignment === "center"
                              ? "text-center"
                              : profile.profileAlignment === "right"
                                ? "text-right"
                                : "text-left"
                          }`}
                          placeholder="Your tagline..."
                        />
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-col gap-1.5">
                          {profile.name && (
                            <h1 className="text-[32px] md:text-[40px] font-semibold tracking-tight leading-none text-slate-900 dark:text-white">
                              {profile.name}
                            </h1>
                          )}
                          {profile.tagline && (
                            <p className="text-[12px] md:text-[15px] leading-tight text-slate-500 dark:text-slate-400 font-medium">
                              {profile.tagline}
                            </p>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  <div className="w-full max-w-2xl mt-10">
                    <div
                      className={`flex flex-wrap gap-4 ${
                        profile.profileAlignment === "center"
                          ? "justify-center"
                          : profile.profileAlignment === "right"
                            ? "justify-end"
                            : "justify-start"
                      }`}
                    >
                      {visibleContactButtons.length > 0 ? (
                        visibleContactButtons.map(button => (
                          <a
                            key={button.id}
                            href={isEditMode ? undefined : getContactHref(button)}
                            target={isEditMode ? undefined : "_blank"}
                            rel={isEditMode ? undefined : "noopener noreferrer"}
                            onClick={e => isEditMode && e.preventDefault()}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-200 transition-all hover:shadow-sm hover:border-brand-300"
                          >
                            <ContactIcon icon={button.icon} size={18} />
                            <span>{button.label}</span>
                          </a>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400">No contact buttons visible.</p>
                      )}
                    </div>

                    {isEditMode && (
                      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/10 space-y-2">
                        {heroContactButtons.map(button => (
                          <div key={button.id} className="grid grid-cols-1 md:grid-cols-[120px_1fr_1fr_auto_auto] gap-2 items-center">
                            <select
                              value={button.icon}
                              onChange={e => updateContactButton(button.id, { icon: e.target.value as ContactButton["icon"] })}
                              className="h-9 px-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-100 outline-none"
                            >
                              {iconOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                            <input
                              value={button.label}
                              onChange={e => updateContactButton(button.id, { label: e.target.value })}
                              className="h-9 px-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-100 outline-none"
                              placeholder="Button text"
                            />
                            <input
                              value={button.url}
                              onChange={e => updateContactButton(button.id, { url: e.target.value })}
                              readOnly={button.icon === "location"}
                              disabled={button.icon === "location"}
                              aria-disabled={button.icon === "location"}
                              title={button.icon === "location" ? "Map link is generated automatically when you edit the label" : undefined}
                              className="h-9 px-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-100 outline-none disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-slate-50 dark:disabled:bg-slate-800/60"
                              placeholder={button.icon === "location" ? "Maps link auto-generated" : "Link / email / phone"}
                            />
                            <button
                              onClick={() => updateContactButton(button.id, { isVisible: !button.isVisible })}
                              className={`h-9 px-3 rounded-lg text-xs font-medium uppercase tracking-wide border transition-colors ${
                                button.isVisible
                                  ? "border-brand-200 bg-brand-50 text-brand-600"
                                  : "border-slate-200 dark:border-white/10 text-slate-400"
                              }`}
                              title={button.isVisible ? "Hide button" : "Show button"}
                            >
                              {button.isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                            </button>
                            <button
                              onClick={() => removeContactButton(button.id)}
                              className="h-9 w-9 rounded-lg border border-slate-200 dark:border-white/10 text-slate-400 hover:text-red-500 transition-colors flex items-center justify-center"
                              title="Remove contact button"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={addContactButton}
                          className="mt-1 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-brand-600 hover:text-brand-700 transition-colors"
                        >
                          <Plus size={14} /> Add Contact Button
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </PortfolioAdkBlockHighlight>
            )}

            {showProfileSection && isEditMode && itemsAboveProfile > 0 && (
              <div
                role="presentation"
                onDragOver={e => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                }}
                onDrop={e => {
                  e.preventDefault();
                  const from = resolveDropSourceIndex();
                  if (from >= 0) moveItemFromAboveToBelowProfile(from);
                }}
                className="mb-4 flex min-h-[36px] cursor-default items-center justify-center rounded-xl border border-dashed border-slate-200 text-[10px] font-medium uppercase tracking-wider text-slate-400 transition-colors hover:border-brand-400/60 hover:text-brand-600 dark:border-white/10 dark:text-slate-500 dark:hover:border-brand-400/50 dark:hover:text-brand-400"
              >
                Drop block here to move below profile
              </div>
            )}

            {/* Notion-style Grid Canvas */}
            <div
              ref={gridRef}
              className={`${PORTFOLIO_DENSE_GRID_CLASS} relative min-h-[400px]`}
              onClick={closeContextMenu}
              onDragOver={handleGridDragOver}
            >
              {(showProfileSection ? items.slice(itemsAboveProfile) : items).map((item, sliceIndex) => {
                const index = showProfileSection ? itemsAboveProfile + sliceIndex : sliceIndex;
                return renderPortfolioGridItem(item, index);
              })}

              {/* Empty State / Add Section Placeholder */}
              {isEditMode && (
                <div className="col-span-1 md:col-span-12 mt-8">
                  <h4 className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Plus size={14} /> Add Content Block
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => addItem("text")}
                      className="px-4 py-2 border border-slate-200 dark:border-white/10 rounded-full text-slate-500 hover:text-brand-600 hover:border-brand-500 transition-all font-medium text-sm flex items-center gap-2 bg-white dark:bg-slate-900 shadow-sm"
                    >
                      <Type size={16} /> Text
                    </button>
                    <button
                      onClick={() => addItem("media")}
                      className="px-4 py-2 border border-slate-200 dark:border-white/10 rounded-full text-slate-500 hover:text-brand-600 hover:border-brand-500 transition-all font-medium text-sm flex items-center gap-2 bg-white dark:bg-slate-900 shadow-sm"
                    >
                      <ImageIcon size={16} /> Media
                    </button>
                    <button
                      onClick={() => addItem("page-card")}
                      className="px-4 py-2 border border-slate-200 dark:border-white/10 rounded-full text-slate-500 hover:text-brand-600 hover:border-brand-500 transition-all font-medium text-sm flex items-center gap-2 bg-white dark:bg-slate-900 shadow-sm"
                    >
                      <FileText size={16} /> Page
                    </button>
                    <button
                      onClick={() => addItem("link-box")}
                      className="px-4 py-2 border border-slate-200 dark:border-white/10 rounded-full text-slate-500 hover:text-brand-600 hover:border-brand-500 transition-all font-medium text-sm flex items-center gap-2 bg-white dark:bg-slate-900 shadow-sm"
                    >
                      <LinkIcon size={16} /> Link
                    </button>
                    <button
                      onClick={() =>
                        addItem("table", {
                          title: "Table",
                          content: JSON.stringify([
                            ["Header 1", "Header 2", "Header 3"],
                            ["", "", ""],
                            ["", "", ""],
                          ]),
                        })
                      }
                      className="px-4 py-2 border border-slate-200 dark:border-white/10 rounded-full text-slate-500 hover:text-brand-600 hover:border-brand-500 transition-all font-medium text-sm flex items-center gap-2 bg-white dark:bg-slate-900 shadow-sm"
                    >
                      <Table2 size={16} /> Table
                    </button>
                    <button
                      onClick={() => addItem("embed", { title: "Embed Code", variant: "code" })}
                      className="px-4 py-2 border border-slate-200 dark:border-white/10 rounded-full text-slate-500 hover:text-brand-600 hover:border-brand-500 transition-all font-medium text-sm flex items-center gap-2 bg-white dark:bg-slate-900 shadow-sm"
                    >
                      <Code2 size={16} /> Embed Code
                    </button>
                    <button
                      onClick={() => addItem("embed", { title: "Figma Embed", variant: "figma" })}
                      className="px-4 py-2 border border-slate-200 dark:border-white/10 rounded-full text-slate-500 hover:text-brand-600 hover:border-brand-500 transition-all font-medium text-sm flex items-center gap-2 bg-white dark:bg-slate-900 shadow-sm"
                    >
                      <Figma size={16} /> Figma Embed
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Context Menu Overlay */}
          {contextMenu && isEditMode && (
            <div
              className="fixed z-[100] bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-white/10 w-48 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
              style={{ left: contextMenu.x, top: contextMenu.y }}
              onClick={e => e.stopPropagation()}
            >
              {contextMenu.targetId && (
                // Block Options
                <div className="py-1">
                  <button
                    onClick={() => {
                      duplicateItem(contextMenu.targetId!);
                      closeContextMenu();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-2"
                  >
                    <Copy size={16} /> Duplicate Block
                  </button>
                  <button
                    onClick={() => {
                      requestDeleteBlock(contextMenu.targetId!);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                  >
                    <Trash2 size={16} /> Delete Block
                  </button>
                </div>
              )}
            </div>
          )}

          {avatarCropModal && (
            <div
              className="fixed inset-0 z-[220] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setAvatarCropModal(null)}
            >
              <div
                className="w-full max-w-md bg-white dark:bg-slate-950 rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/10">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Crop Profile Photo</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Drag to reposition and use zoom to frame your photo.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAvatarCropModal(null)}
                    className="p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
                  >
                    Close
                  </button>
                </div>

                <div className="p-5 space-y-5">
                  <div className="rounded-2xl bg-slate-100 dark:bg-slate-900 p-4 flex items-center justify-center">
                    <div
                      ref={avatarCropPreviewRef}
                      className="w-48 h-48 shrink-0 overflow-hidden rounded-full bg-black/5 dark:bg-black/30 shadow-inner ring-2 ring-white/40 dark:ring-white/10"
                      onPointerDown={handleAvatarCropPointerDown}
                      onPointerMove={handleAvatarCropPointerMove}
                      onPointerUp={handleAvatarCropPointerUp}
                      onPointerCancel={handleAvatarCropPointerUp}
                    >
                      <div
                        className="w-full h-full bg-center bg-no-repeat bg-cover cursor-grab active:cursor-grabbing"
                        style={avatarCropPreviewStyle}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
                      <span>Zoom</span>
                      <span>{avatarCropZoom.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={3}
                      step={0.1}
                      value={avatarCropZoom}
                      onChange={e => setAvatarCropZoom(Number(e.target.value))}
                      className="w-full accent-brand-600"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setAvatarCropModal(null)}
                      className="px-4 py-2 rounded-full text-xs font-semibold border border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isHeroImageUploading}
                      onClick={() => {
                        applyRatioCrop(
                          avatarCropModal.source,
                          1,
                          avatarCropZoom,
                          avatarCropPan,
                          croppedDataUrl => {
                            void persistCroppedHeroImage(croppedDataUrl, "profile-picture", url => {
                              setProfile(prev => ({
                                ...prev,
                                avatarUrl: url,
                                showAvatar: true,
                              }));
                              setAvatarCropModal(null);
                            });
                          },
                          AVATAR_CROP_MAX_OUTPUT_PX
                        );
                      }}
                      className="px-5 py-2 rounded-full text-xs font-semibold bg-brand-600 text-white hover:scale-105 active:scale-95 transition-all shadow-lg shadow-brand-500/25 disabled:opacity-60 disabled:pointer-events-none"
                    >
                      {isHeroImageUploading ? "Uploading…" : "Save Crop"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {pendingDeleteBlock && (
            <DeleteBlockConfirmModal
              blockLabel={getPortfolioBlockDeleteLabel(pendingDeleteBlock)}
              onCancel={() => setPendingDeleteBlockId(null)}
              onConfirm={handleConfirmDeleteBlock}
            />
          )}

          {/* Toast */}
          {toastMessage && (
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[210]">
              <div className="px-4 py-2 rounded-full bg-slate-900 text-white text-xs font-semibold shadow-2xl border border-white/10">
                {toastMessage}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default Portfolio;
