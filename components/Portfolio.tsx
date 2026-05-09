"use client";
import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Edit3,
  Layout,
  Image as ImageIcon,
  Type,
  Link as LinkIcon,
  Video,
  GripVertical,
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
} from "lucide-react";
import { useGridResize } from "../hooks/useGridResize";
import { PortfolioItem, UserProfile, ContentType, PortfolioData, ContactButton } from "../types";
import BlockRenderer from "./BlockRenderer";
import FloatingToolbar from "./FloatingToolbar";
import ProjectDetailView from "./ProjectDetailView";

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
    content: "Drafting the future of interaction",
    span: 2,
    fontSize: "2xl",
    fontWeight: "medium",
  },
  {
    id: "2",
    type: "text",
    content:
      "I believe that good design is invisible. It should solve problems without drawing attention to itself. Currently focused on building modular ecosystems.",
    span: 1,
    fontSize: "base",
  },
  {
    id: "3",
    type: "link-box",
    title: "Dribbble Portfolio",
    linkUrl: "dribbble.com/alex",
    content: "",
    span: 1,
  },
  {
    id: "4",
    type: "page-card",
    content: "https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&q=80",
    title: "Santana Rock",
    description: "A digital presence for the legendary Santana Rock band.",
    variant: "image-text",
    span: 1,
  },
  {
    id: "5",
    type: "page-card",
    content: "https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&q=80",
    title: "Burr - App UI",
    description: "An elegant app UI design for the Burr mobile platform.",
    variant: "text-image",
    span: 1,
  },
  {
    id: "7",
    type: "page-card",
    content: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80",
    title: "Aura Meditation App",
    description: "A complete redesign of the mindfulness experience for Gen Z.",
    variant: "text-image",
    span: 2,
  },
  {
    id: "6",
    type: "text",
    content: "My Stack",
    title: "Stack",
    isCollapsible: true,
    isCollapsed: false,
    span: 1,
    fontSize: "xl",
    fontWeight: "medium",
  },
];

interface PortfolioProps {
  initialData?: PortfolioData;
  onBack?: () => void;
  onSave?: (portfolio: PortfolioData) => Promise<void>;
  isSaving?: boolean;
  saveError?: string | null;
  isReadOnly?: boolean;
}

interface PortfolioSnapshot {
  items: PortfolioItem[];
  profile: UserProfile;
}

const getDefaultContactButtons = (profile: UserProfile): ContactButton[] => [
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
  {
    id: "contact-site",
    label: profile.website || "Website",
    url: profile.website || "",
    icon: "link",
    isVisible: Boolean(profile.website),
  },
];

const iconOptions: Array<{ value: ContactButton["icon"]; label: string }> = [
  { value: "phone", label: "Phone" },
  { value: "mail", label: "Email" },
  { value: "link", label: "Link" },
  { value: "location", label: "Location" },
];

const getContactHref = (button: ContactButton) => {
  if (!button.url) return "#";
  if (button.icon === "mail") return button.url.startsWith("mailto:") ? button.url : `mailto:${button.url}`;
  if (button.icon === "phone") return button.url.startsWith("tel:") ? button.url : `tel:${button.url}`;
  if (button.url.startsWith("http://") || button.url.startsWith("https://")) return button.url;
  return `https://${button.url}`;
};

const ContactIcon: React.FC<{ icon: ContactButton["icon"]; size?: number }> = ({ icon, size = 16 }) => {
  if (icon === "phone") return <Phone size={size} className="text-slate-500" />;
  if (icon === "mail") return <Mail size={size} className="text-slate-500" />;
  if (icon === "location") return <MapPin size={size} className="text-red-500" fill="currentColor" fillOpacity="0.1" />;
  return <LinkIcon size={size} className="text-slate-500" />;
};

const normalizePortfolioItem = (item: PortfolioItem): PortfolioItem => {
  const legacySpanMap: Record<number, number> = {
    1: 4,
    2: 8,
    3: 12,
  };
  const mapped = legacySpanMap[item.span as number] ?? (item.span as number);
  const normalizedSpan = Math.max(1, Math.min(12, mapped));
  return {
    ...item,
    span: normalizedSpan as PortfolioItem["span"],
    colStart: item.colStart ? Math.max(1, Math.min(12, Math.round(item.colStart))) : item.colStart,
    detailedBlocks: item.detailedBlocks?.map(normalizePortfolioItem),
  };
};

const normalizePortfolioItems = (items: PortfolioItem[]): PortfolioItem[] => items.map(normalizePortfolioItem);

const Portfolio: React.FC<PortfolioProps> = ({ initialData, onBack }) => {
  const [isEditMode, setIsEditMode] = useState(true);
  const [profile, setProfile] = useState<UserProfile>(initialData?.profile || INITIAL_PROFILE);
  const [items, setItems] = useState<PortfolioItem[]>(
    normalizePortfolioItems(initialData?.items || INITIAL_ITEMS).map(i => ({
      ...i,
      height: i.height ?? 160,
    }))
  );
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; targetId: string | null } | null>(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishUrlInput, setPublishUrlInput] = useState("");
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [coverCropModal, setCoverCropModal] = useState<{ source: string; mimeType?: string } | null>(null);
  const [selectedCoverCropRatio, setSelectedCoverCropRatio] = useState<NonNullable<UserProfile["coverCropRatio"]>>(
    profile.coverCropRatio || "16:9"
  );
  const [coverCropZoom, setCoverCropZoom] = useState(1);
  const [coverCropPan, setCoverCropPan] = useState({ x: 0, y: 0 });
  const [coverCropImageSize, setCoverCropImageSize] = useState({ width: 0, height: 0 });

  const coverInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const { gridRef, resizing, initResize } = useGridResize(items, setItems);
  const toastTimeoutRef = useRef<number | null>(null);
  const coverCropPreviewRef = useRef<HTMLDivElement>(null);
  const coverCropDragStateRef = useRef<{ x: number; y: number } | null>(null);
  const nextIdRef = useRef(0);
  const historyPastRef = useRef<PortfolioSnapshot[]>([]);
  const historyFutureRef = useRef<PortfolioSnapshot[]>([]);
  const isApplyingHistoryRef = useRef(false);
  const lastSnapshotRef = useRef<PortfolioSnapshot | null>(null);

  const cloneSnapshot = (snapshot: PortfolioSnapshot): PortfolioSnapshot => {
    if (typeof structuredClone === "function") {
      return structuredClone(snapshot);
    }
    return JSON.parse(JSON.stringify(snapshot)) as PortfolioSnapshot;
  };
  const [collapsedHeights, setCollapsedHeights] = useState<Record<string, number>>({});
  const [gridMetrics, setGridMetrics] = useState({ rowHeight: 12, rowGap: 24 });

  const getNextId = (prefix = "item") => {
    nextIdRef.current += 1;
    return `${prefix}-${nextIdRef.current}`;
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = window.setTimeout(() => setToastMessage(null), 2400);
  };

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  const selectedProject = selectedProjectId ? (items.find(item => item.id === selectedProjectId) ?? null) : null;

  useEffect(() => {
    const currentSnapshot: PortfolioSnapshot = { items, profile };
    if (!lastSnapshotRef.current) {
      lastSnapshotRef.current = cloneSnapshot(currentSnapshot);
      return;
    }

    const changed =
      JSON.stringify(lastSnapshotRef.current.items) !== JSON.stringify(items) ||
      JSON.stringify(lastSnapshotRef.current.profile) !== JSON.stringify(profile);
    if (!changed) return;

    if (isApplyingHistoryRef.current) {
      isApplyingHistoryRef.current = false;
      lastSnapshotRef.current = cloneSnapshot(currentSnapshot);
      return;
    }

    historyPastRef.current.push(cloneSnapshot(lastSnapshotRef.current));
    if (historyPastRef.current.length > 100) historyPastRef.current.shift();
    historyFutureRef.current = [];
    lastSnapshotRef.current = cloneSnapshot(currentSnapshot);
  }, [items, profile]);

  useEffect(() => {
    const applySnapshot = (snapshot: PortfolioSnapshot) => {
      isApplyingHistoryRef.current = true;
      setItems(cloneSnapshot(snapshot).items);
      setProfile(cloneSnapshot(snapshot).profile);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (!isEditMode || !(e.metaKey || e.ctrlKey)) return;
      const key = e.key.toLowerCase();
      const isUndo = key === "z" && !e.shiftKey;
      const isRedo = key === "y" || (key === "z" && e.shiftKey);
      if (!isUndo && !isRedo) return;

      if (isUndo) {
        const previous = historyPastRef.current.pop();
        if (!previous) return;
        e.preventDefault();
        historyFutureRef.current.push(cloneSnapshot({ items, profile }));
        applySnapshot(previous);
        return;
      }

      const next = historyFutureRef.current.pop();
      if (!next) return;
      e.preventDefault();
      historyPastRef.current.push(cloneSnapshot({ items, profile }));
      applySnapshot(next);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isEditMode, items, profile]);

  const openPublishModal = () => {
    setPublishUrlInput(publishedUrl ?? "");
    setShowPublishModal(true);
  };

  const handlePublish = () => {
    const trimmed = publishUrlInput.trim();
    if (!trimmed) {
      showToast("Enter a URL");
      return;
    }
    setPublishedUrl(trimmed);
    showToast("Published");
  };

  const handleCopyPublishedLink = async () => {
    if (!publishedUrl) return;
    try {
      await navigator.clipboard.writeText(publishedUrl);
      showToast("Link copied");
    } catch {
      showToast("Could not copy link");
    }
  };

  const updateItemContent = (id: string, updates: Partial<PortfolioItem>) => {
    setItems(items.map(item => (item.id === id ? { ...item, ...updates } : item)));
  };

  const addItem = (type: ContentType, preset?: Partial<PortfolioItem>) => {
    const getDefaultSpanForType = (contentType: ContentType): PortfolioItem["span"] => {
      if (contentType === "link-box") return 4;
      if (contentType === "text") return 4;
      if (contentType === "page-card") return 6;
      if (contentType === "media") return 6;
      if (contentType === "table") return 8;
      if (contentType === "embed") return 8;
      return 4;
    };

    const newItem: PortfolioItem = {
      id: getNextId("item"),
      type,
      content: "",
      span: getDefaultSpanForType(type),
      title: type === "page-card" ? "New Page" : type === "link-box" ? "New Link" : undefined,
      fontSize: "base",
      height: DEFAULT_ITEM_HEIGHT_PX,
      ...preset,
    };
    setItems([...items, newItem]);
  };

  const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });

  const COVER_CROP_RATIOS: Record<NonNullable<UserProfile["coverCropRatio"]>, number> = {
    "1:1": 1,
    "3:4": 3 / 4,
    "4:5": 4 / 5,
    "16:9": 16 / 9,
  };

  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

  const getCoverCropGeometry = (
    imageWidth: number,
    imageHeight: number,
    ratioLabel: NonNullable<UserProfile["coverCropRatio"]>,
    zoom: number,
    pan: { x: number; y: number }
  ) => {
    const ratio = COVER_CROP_RATIOS[ratioLabel];
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

  const applyCoverCrop = (
    source: string,
    ratioLabel: NonNullable<UserProfile["coverCropRatio"]>,
    zoom: number,
    pan: { x: number; y: number },
    callback: (croppedDataUrl: string) => void
  ) => {
    const img = new Image();
    img.onload = () => {
      const { cropWidth, cropHeight, offsetX, offsetY } = getCoverCropGeometry(img.naturalWidth, img.naturalHeight, ratioLabel, zoom, pan);

      const canvas = document.createElement("canvas");
      canvas.width = Math.round(cropWidth);
      canvas.height = Math.round(cropHeight);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(img, offsetX, offsetY, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height);

      callback(canvas.toDataURL("image/jpeg", 0.92));
    };
    img.src = source;
  };

  const openCoverCropModal = (source: string, mimeType?: string) => {
    setSelectedCoverCropRatio(profile.coverCropRatio || "16:9");
    setCoverCropZoom(1);
    setCoverCropPan({ x: 0, y: 0 });
    setCoverCropModal({ source, mimeType });
  };

  const handleCoverUpload = async (file: File) => {
    const dataUrl = await fileToDataUrl(file);
    openCoverCropModal(dataUrl, file.type || "image/jpeg");
  };

  const handleAvatarUpload = async (file: File) => {
    const dataUrl = await fileToDataUrl(file);
    setProfile(prev => ({ ...prev, avatarUrl: dataUrl, showAvatar: true }));
  };

  useEffect(() => {
    if (!coverCropModal) return;
    const img = new Image();
    img.onload = () => {
      setCoverCropImageSize({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = coverCropModal.source;
  }, [coverCropModal]);

  const coverCropGeometry =
    coverCropModal && coverCropImageSize.width && coverCropImageSize.height
      ? getCoverCropGeometry(coverCropImageSize.width, coverCropImageSize.height, selectedCoverCropRatio, coverCropZoom, coverCropPan)
      : null;

  const coverCropPreviewStyle =
    coverCropGeometry && coverCropImageSize.width && coverCropImageSize.height
      ? {
          backgroundImage: `url(${coverCropModal?.source})`,
          backgroundSize: `${(coverCropImageSize.width / coverCropGeometry.cropWidth) * 100}% ${(coverCropImageSize.height / coverCropGeometry.cropHeight) * 100}%`,
          backgroundPosition: `${(coverCropGeometry.offsetX / Math.max(1, coverCropImageSize.width - coverCropGeometry.cropWidth)) * 100}% ${(coverCropGeometry.offsetY / Math.max(1, coverCropImageSize.height - coverCropGeometry.cropHeight)) * 100}%`,
        }
      : undefined;

  const handleCoverCropPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!coverCropPreviewRef.current) return;
    coverCropDragStateRef.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleCoverCropPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!coverCropDragStateRef.current || !coverCropPreviewRef.current) return;
    const rect = coverCropPreviewRef.current.getBoundingClientRect();
    const dx = e.clientX - coverCropDragStateRef.current.x;
    const dy = e.clientY - coverCropDragStateRef.current.y;
    coverCropDragStateRef.current = { x: e.clientX, y: e.clientY };
    setCoverCropPan(prev => ({
      x: clamp(prev.x - dx / Math.max(1, rect.width), -1, 1),
      y: clamp(prev.y - dy / Math.max(1, rect.height), -1, 1),
    }));
  };

  const handleCoverCropPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    coverCropDragStateRef.current = null;
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
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const dragHandleArmedItemIdRef = useRef<string | null>(null);

  const GRID_ROW_PX = 12;
  const DEFAULT_ITEM_HEIGHT_PX = 160;
  const COLLAPSIBLE_TEXT_COLLAPSED_HEIGHT_PX = 72;

  useEffect(() => {
    if (!gridRef.current) return;
    const node = gridRef.current;

    const updateGridMetrics = () => {
      const styles = window.getComputedStyle(node);
      const parsedRowGap = Number.parseFloat(styles.rowGap || "24");
      const rowGap = Number.isFinite(parsedRowGap) ? parsedRowGap : 24;
      setGridMetrics(prev => (prev.rowHeight === GRID_ROW_PX && prev.rowGap === rowGap ? prev : { rowHeight: GRID_ROW_PX, rowGap }));
    };

    updateGridMetrics();
    const observer = new ResizeObserver(updateGridMetrics);
    observer.observe(node);
    return () => observer.disconnect();
  }, [gridRef]);

  const handleCollapsedHeightMeasure = (id: string, measuredHeight: number) => {
    setCollapsedHeights(prev => {
      const nextHeight = Math.max(COLLAPSIBLE_TEXT_COLLAPSED_HEIGHT_PX, measuredHeight);
      if (prev[id] && Math.abs(prev[id] - nextHeight) < 1) return prev;
      return { ...prev, [id]: nextHeight };
    });
  };

  const getRowSpanForItem = (item: PortfolioItem) => {
    const measuredCollapsedHeight = collapsedHeights[item.id];
    const heightPx =
      item.type === "text" && item.isCollapsible && item.isCollapsed
        ? (measuredCollapsedHeight ?? COLLAPSIBLE_TEXT_COLLAPSED_HEIGHT_PX)
        : (item.height ?? DEFAULT_ITEM_HEIGHT_PX);
    const minRows = item.type === "text" || item.type === "link-box" ? 3 : 8; // 3=36px, 8=96px
    const rowUnit = gridMetrics.rowHeight + gridMetrics.rowGap;
    const span = Math.ceil((heightPx + gridMetrics.rowGap) / Math.max(1, rowUnit));
    return Math.max(minRows, span);
  };

  const EDGE_RESIZE_HIT_AREA_PX = 18;

  const handleEdgeResizeStart = (e: React.MouseEvent<HTMLDivElement>, item: PortfolioItem) => {
    if (!isEditMode || resizing || e.button !== 0) return;

    const target = e.target as HTMLElement;
    if (target.closest('input, textarea, button, select, [contenteditable="true"]')) return;

    const edgeThreshold = EDGE_RESIZE_HIT_AREA_PX;
    const rect = e.currentTarget.getBoundingClientRect();
    const nearRight = rect.right - e.clientX <= edgeThreshold;
    const nearLeft = e.clientX - rect.left <= edgeThreshold;
    const nearTop = e.clientY - rect.top <= edgeThreshold;
    const nearBottom = rect.bottom - e.clientY <= edgeThreshold;
    const nearAnyEdge = nearLeft || nearRight || nearTop || nearBottom;

    if (!nearAnyEdge) return;
    const axis = (nearLeft || nearRight) && (nearTop || nearBottom) ? "both" : nearTop || nearBottom ? "y" : "x";
    const xHandle = nearLeft ? "left" : "right";
    initResize(e, item, axis, xHandle);
  };

  const handleEdgeResizeHover = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isEditMode || resizing) return;
    const target = e.target as HTMLElement;
    if (target.closest('input, textarea, button, select, [contenteditable="true"]')) {
      e.currentTarget.style.cursor = "default";
      return;
    }

    const edgeThreshold = EDGE_RESIZE_HIT_AREA_PX;
    const rect = e.currentTarget.getBoundingClientRect();
    const nearRight = rect.right - e.clientX <= edgeThreshold;
    const nearLeft = e.clientX - rect.left <= edgeThreshold;
    const nearTop = e.clientY - rect.top <= edgeThreshold;
    const nearBottom = rect.bottom - e.clientY <= edgeThreshold;
    const nearHorizontal = nearLeft || nearRight;
    const nearVertical = nearTop || nearBottom;

    if (nearHorizontal && nearVertical) e.currentTarget.style.cursor = "nwse-resize";
    else if (nearVertical) e.currentTarget.style.cursor = "ns-resize";
    else if (nearHorizontal) e.currentTarget.style.cursor = "ew-resize";
    else e.currentTarget.style.cursor = "default";
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
      contactButtons: [...(prev.contactButtons || []), newButton],
    }));
  };

  const updateContactButton = (id: string, updates: Partial<ContactButton>) => {
    setProfile(prev => ({
      ...prev,
      contactButtons: (prev.contactButtons || []).map(button => (button.id === id ? { ...button, ...updates } : button)),
    }));
  };

  const removeContactButton = (id: string) => {
    setProfile(prev => ({
      ...prev,
      contactButtons: (prev.contactButtons || []).filter(button => button.id !== id),
    }));
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
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

  const visibleContactButtons = (profile.contactButtons || []).filter(button => button.isVisible && button.label.trim());

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

  return (
    <>
      {selectedProject ? (
        <ProjectDetailView
          project={selectedProject}
          onBack={() => setSelectedProjectId(null)}
          onUpdateProject={updated => {
            updateItemContent(updated.id, updated);
            setSelectedProjectId(updated.id);
          }}
        />
      ) : (
        <div className="flex-1 bg-slate-50 dark:bg-[#080808] h-full overflow-y-auto no-scrollbar relative">
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
          {/* Top Published Status Bar (Mock) */}
          {!isEditMode && (
            <div className="bg-brand-600 text-white text-[10px] uppercase font-medium tracking-[0.2em] py-2 text-center">
              Live Portfolio Mode
            </div>
          )}

          {/* Editor Header */}
          {isEditMode && onBack && (
            <div className="sticky top-0 z-40 bg-white/80 dark:bg-[#080808]/80 backdrop-blur-md border-b border-slate-100 dark:border-white/5 py-4 px-6 flex items-center justify-between">
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors text-sm font-medium"
              >
                <ArrowLeft size={18} /> Back to Dashboard
              </button>
              <div className="flex items-center gap-3">
                <button
                  onClick={openPublishModal}
                  className="flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 text-slate-700 dark:text-slate-200 hover:border-brand-500/40 hover:text-brand-700 dark:hover:text-white transition-all"
                  title="Publish"
                >
                  <ExternalLink size={14} /> Publish
                </button>
                <button
                  onClick={() => setIsEditMode(false)}
                  className="flex items-center gap-2 px-6 py-2 bg-brand-600 text-white rounded-full text-xs font-semibold hover:scale-105 active:scale-95 transition-all shadow-lg shadow-brand-500/30"
                >
                  <Eye size={14} /> Preview Mode
                </button>
              </div>
            </div>
          )}

          {/* Full Width Cover */}
          {isEditMode && profile.showCover === false ? (
            <div className="max-w-5xl mx-auto px-4 mt-6">
              <button
                onClick={() => setProfile({ ...profile, showCover: true })}
                className="w-full py-4 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-xl text-slate-400 hover:text-brand-600 hover:border-brand-500 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
              >
                <ImageIcon size={16} /> Show Cover Image
              </button>
            </div>
          ) : (
            profile.showCover !== false && (
              <div className="max-w-5xl mx-auto px-4 mt-6">
                <div className="h-40 md:h-48 w-full relative group bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-t-2xl overflow-hidden">
                  {profile.coverUrl ? (
                    <img src={profile.coverUrl} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm font-medium">No Cover Image</div>
                  )}
                  {isEditMode && (
                    <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center gap-4 backdrop-blur-sm transition-all z-10">
                      <button
                        onClick={() => coverInputRef.current?.click()}
                        className="bg-white text-slate-900 px-6 py-2 rounded-full font-medium text-sm shadow-xl hover:scale-105 active:scale-95 transition-transform"
                      >
                        Update Cover
                      </button>
                      {profile.coverUrl ? (
                        <button
                          onClick={() => openCoverCropModal(profile.coverUrl, "image/jpeg")}
                          className="bg-white text-slate-900 px-6 py-2 rounded-full font-medium text-sm shadow-xl hover:scale-105 active:scale-95 transition-transform"
                        >
                          Crop Cover
                        </button>
                      ) : null}
                      <button
                        onClick={() => setProfile({ ...profile, showCover: false })}
                        className="bg-red-500 text-white p-2.5 rounded-full shadow-xl hover:scale-105 active:scale-95 transition-transform"
                        title="Hide Cover"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          )}

          <div className="max-w-5xl mx-auto px-4 pb-40">
            {/* Profile Info Section */}
            <div
              className={`relative mb-16 flex flex-col bg-white dark:bg-[#080808] border border-slate-200 dark:border-white/5 border-t-0 rounded-b-2xl px-6 md:px-10 pb-12 ${
                profile.showCover !== false ? "pt-0" : "pt-10"
              } ${
                profile.profileAlignment === "center"
                  ? "items-center text-center"
                  : profile.profileAlignment === "right"
                    ? "items-end text-right"
                    : "items-start text-left"
              }`}
            >
              {isEditMode && profile.showAvatar === false ? (
                <button
                  onClick={() => setProfile({ ...profile, showAvatar: true })}
                  className={`w-32 h-32 md:w-36 md:h-36 rounded-full border-4 border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-brand-600 hover:border-brand-500 transition-colors ${profile.showCover !== false ? "-mt-16 md:-mt-20" : "mt-0"} z-10 bg-white dark:bg-white/5`}
                >
                  <ImageIcon size={20} />
                  <span className="text-[10px] font-medium uppercase tracking-widest">Show</span>
                </button>
              ) : (
                profile.showAvatar !== false && (
                  <div className={`relative group ${profile.showCover !== false ? "-mt-16 md:-mt-20" : "mt-0"} z-10 flex-shrink-0`}>
                    <img
                      src={profile.avatarUrl}
                      className="w-32 h-32 md:w-36 md:h-36 rounded-full border-4 border-white dark:border-[#080808] shadow-lg object-cover bg-white dark:bg-[#080808]"
                    />
                    {/* Profile Alignment Controls: show on dp hover (not on the area below it) */}
                    {isEditMode && (
                      <>
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-slate-800 shadow-xl border border-slate-100 dark:border-white/5 rounded-lg flex items-center p-1 z-20 pointer-events-none group-hover:pointer-events-auto">
                          <button
                            onClick={() => setProfile({ ...profile, profileAlignment: "left" })}
                            className={`p-1.5 rounded-md ${profile.profileAlignment === "left" ? "bg-slate-100 dark:bg-white/10 text-brand-600" : "text-slate-400 hover:text-slate-600 dark:hover:text-white"}`}
                            title="Align Left"
                          >
                            <AlignLeft size={14} />
                          </button>
                          <button
                            onClick={() => setProfile({ ...profile, profileAlignment: "center" })}
                            className={`p-1.5 rounded-md ${profile.profileAlignment === "center" ? "bg-slate-100 dark:bg-white/10 text-brand-600" : "text-slate-400 hover:text-slate-600 dark:hover:text-white"}`}
                            title="Align Center"
                          >
                            <AlignCenter size={14} />
                          </button>
                        </div>
                        <div className="absolute inset-0 rounded-full bg-black/60 hidden group-hover:flex flex-col items-center justify-center gap-3 cursor-pointer backdrop-blur-sm overflow-hidden p-2 z-10">
                          <div
                            onClick={e => {
                              e.stopPropagation();
                              avatarInputRef.current?.click();
                            }}
                            className="flex items-center justify-center gap-2 text-white hover:text-brand-400 transition-colors"
                          >
                            <Edit3 size={18} /> <span className="text-xs font-medium">Edit</span>
                          </div>
                          <div className="h-px w-1/2 bg-white/20"></div>
                          <div
                            onClick={e => {
                              e.stopPropagation();
                              setProfile({ ...profile, showAvatar: false });
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
                      onChange={e => setProfile({ ...profile, name: e.target.value })}
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
                      onChange={e => setProfile({ ...profile, tagline: e.target.value })}
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
                    {(profile.contactButtons || []).map(button => (
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
                          className="h-9 px-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-100 outline-none"
                          placeholder="Link / email / phone"
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

            {/* Notion-style Grid Canvas */}
            <div
              ref={gridRef}
              className="grid grid-cols-1 md:grid-cols-12 gap-6 relative min-h-[400px] grid-flow-row-dense auto-rows-[12px]"
              onClick={closeContextMenu}
              onDragOver={handleGridDragOver}
            >
              {items.map((item, index) => (
                <motion.div
                  key={item.id}
                  ref={el => {
                    itemRefs.current[item.id] = el;
                  }}
                  onDragOver={e => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  onContextMenu={e => handleContextMenu(e, item.id)}
                  onMouseDown={e => handleEdgeResizeStart(e, item)}
                  onMouseMove={handleEdgeResizeHover}
                  onMouseLeave={e => {
                    e.currentTarget.style.cursor = "default";
                  }}
                  onMouseUpCapture={() => {
                    dragHandleArmedItemIdRef.current = null;
                  }}
                  className={`
                                        ${getSpanClass(item.span)} 
                                        relative group transition-all duration-300
                                        ${isEditMode ? "rounded-[2rem]" : ""}
                                        ${draggedItemIndex === index ? "opacity-30 scale-[0.98]" : "opacity-100"}
                                    `}
                  style={{
                    gridColumnStart: item.colStart,
                    gridRowEnd: `span ${getRowSpanForItem(item)}`,
                    height: "100%",
                  }}
                  layout
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                >
                  {/* Edit Controls Overlay */}
                  {isEditMode && (
                    <div className="absolute -left-6 top-1/2 -translate-y-1/2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity flex flex-col gap-2 z-30">
                      <div
                        className="p-1.5 cursor-move text-slate-400 hover:text-slate-600 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-100 dark:border-white/5"
                        draggable={!resizing}
                        onMouseDown={e => {
                          e.stopPropagation();
                          dragHandleArmedItemIdRef.current = item.id;
                        }}
                        onDragStart={e => handleDragStart(e, index, item.id)}
                        onDragEnd={handleDragEnd}
                        onMouseUp={() => {
                          dragHandleArmedItemIdRef.current = null;
                        }}
                      >
                        <GripVertical size={14} />
                      </div>

                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          removeItem(item.id);
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-500 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-100 dark:border-white/5 transition-colors"
                        title="Delete block"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}

                  <BlockRenderer
                    item={item}
                    isEditMode={isEditMode}
                    onUpdate={updateItemContent}
                    onSelectProject={project => setSelectedProjectId(project.id)}
                    onMeasureCollapsedHeight={handleCollapsedHeightMeasure}
                  />

                  {isEditMode && (
                    <>
                      <div
                        className="absolute inset-y-0 left-0 w-[18px] cursor-ew-resize z-20"
                        onMouseDown={e => initResize(e, item, "x", "left")}
                        title="Resize width"
                      />
                      <div
                        className="absolute inset-y-0 right-0 w-[18px] cursor-ew-resize z-20"
                        onMouseDown={e => initResize(e, item, "x", "right")}
                        title="Resize width"
                      />
                    </>
                  )}
                </motion.div>
              ))}

              {/* Empty State / Add Section Placeholder */}
              {isEditMode && (
                <div className="col-span-1 md:col-span-12 mt-8">
                  <h4 className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Plus size={14} /> Add Content Block
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => addItem("text")}
                      className="px-4 py-2 border border-slate-200 dark:border-white/10 rounded-full text-slate-500 hover:text-brand-600 hover:border-brand-500 transition-all font-medium text-sm flex items-center gap-2 bg-white dark:bg-[#111] shadow-sm"
                    >
                      <Type size={16} /> Text
                    </button>
                    <button
                      onClick={() => addItem("media")}
                      className="px-4 py-2 border border-slate-200 dark:border-white/10 rounded-full text-slate-500 hover:text-brand-600 hover:border-brand-500 transition-all font-medium text-sm flex items-center gap-2 bg-white dark:bg-[#111] shadow-sm"
                    >
                      <ImageIcon size={16} /> Media
                    </button>
                    <button
                      onClick={() => addItem("page-card")}
                      className="px-4 py-2 border border-slate-200 dark:border-white/10 rounded-full text-slate-500 hover:text-brand-600 hover:border-brand-500 transition-all font-medium text-sm flex items-center gap-2 bg-white dark:bg-[#111] shadow-sm"
                    >
                      <FileText size={16} /> Page
                    </button>
                    <button
                      onClick={() => addItem("link-box")}
                      className="px-4 py-2 border border-slate-200 dark:border-white/10 rounded-full text-slate-500 hover:text-brand-600 hover:border-brand-500 transition-all font-medium text-sm flex items-center gap-2 bg-white dark:bg-[#111] shadow-sm"
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
                      className="px-4 py-2 border border-slate-200 dark:border-white/10 rounded-full text-slate-500 hover:text-brand-600 hover:border-brand-500 transition-all font-medium text-sm flex items-center gap-2 bg-white dark:bg-[#111] shadow-sm"
                    >
                      <Table2 size={16} /> Table
                    </button>
                    <button
                      onClick={() => addItem("embed", { title: "Embed Code", variant: "code" })}
                      className="px-4 py-2 border border-slate-200 dark:border-white/10 rounded-full text-slate-500 hover:text-brand-600 hover:border-brand-500 transition-all font-medium text-sm flex items-center gap-2 bg-white dark:bg-[#111] shadow-sm"
                    >
                      <Code2 size={16} /> Embed Code
                    </button>
                    <button
                      onClick={() => addItem("embed", { title: "Figma Embed", variant: "figma" })}
                      className="px-4 py-2 border border-slate-200 dark:border-white/10 rounded-full text-slate-500 hover:text-brand-600 hover:border-brand-500 transition-all font-medium text-sm flex items-center gap-2 bg-white dark:bg-[#111] shadow-sm"
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
                      removeItem(contextMenu.targetId!);
                      closeContextMenu();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                  >
                    <Trash2 size={16} /> Delete Block
                  </button>
                </div>
              )}
            </div>
          )}

          {!isEditMode && (
            <button
              onClick={() => setIsEditMode(true)}
              className="fixed bottom-10 right-10 bg-slate-900 dark:bg-white text-white dark:text-slate-900 p-5 rounded-full shadow-2xl hover:scale-110 active:scale-90 transition-all z-50 group"
            >
              <Edit3 size={24} />
              <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-3 py-1.5 rounded-lg text-xs font-medium uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl">
                Edit Portfolio
              </span>
            </button>
          )}

          {/* Publish Modal */}
          {showPublishModal && (
            <div
              className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center px-4"
              onClick={() => setShowPublishModal(false)}
            >
              <div
                className="w-full max-w-md bg-white dark:bg-[#0b0b0b] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 p-5"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">Publish</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Enter a URL for your portfolio.</div>
                  </div>
                  <button
                    onClick={() => setShowPublishModal(false)}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                  >
                    Close
                  </button>
                </div>

                <div className="mt-4">
                  <label className="block text-[11px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">
                    URL
                  </label>
                  <input
                    value={publishUrlInput}
                    onChange={e => setPublishUrlInput(e.target.value)}
                    placeholder="e.g. https://alexmorgan.design"
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f0f0f] text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500/40 transition-all"
                  />
                  {publishedUrl && (
                    <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      Saved link: <span className="font-medium text-slate-700 dark:text-slate-200">{publishedUrl}</span>
                    </div>
                  )}
                </div>

                <div className="mt-5 flex items-center justify-end gap-2">
                  <button
                    onClick={handleCopyPublishedLink}
                    disabled={!publishedUrl}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold border transition-all ${
                      publishedUrl
                        ? "border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-700 dark:text-slate-200 hover:border-brand-500/40 hover:text-brand-700 dark:hover:text-white"
                        : "border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5 text-slate-300 dark:text-slate-600 cursor-not-allowed"
                    }`}
                    title={publishedUrl ? "Copy saved link" : "Publish first to enable copying"}
                  >
                    <Copy size={14} /> Copy link
                  </button>
                  <button
                    onClick={handlePublish}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold bg-brand-600 text-white hover:scale-105 active:scale-95 transition-all shadow-lg shadow-brand-500/25"
                  >
                    <ExternalLink size={14} /> Publish
                  </button>
                </div>
              </div>
            </div>
          )}

          {coverCropModal && (
            <div
              className="fixed inset-0 z-[220] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setCoverCropModal(null)}
            >
              <div
                className="w-full max-w-3xl bg-white dark:bg-[#0c0c0c] rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/10">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Crop Cover</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Choose a crop ratio, zoom, and position for the cover image.
                    </p>
                  </div>
                  <button
                    onClick={() => setCoverCropModal(null)}
                    className="p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
                  >
                    Close
                  </button>
                </div>

                <div className="p-5 space-y-5">
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(COVER_CROP_RATIOS) as Array<NonNullable<UserProfile["coverCropRatio"]>>).map(ratio => (
                      <button
                        key={ratio}
                        type="button"
                        onClick={() => setSelectedCoverCropRatio(ratio)}
                        className={`px-4 py-2 rounded-full text-xs font-semibold border transition-colors ${
                          selectedCoverCropRatio === ratio
                            ? "border-brand-500 bg-brand-50 text-brand-700"
                            : "border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-800 dark:hover:text-white"
                        }`}
                      >
                        {ratio}
                      </button>
                    ))}
                  </div>

                  <div className="rounded-2xl bg-slate-100 dark:bg-slate-900 p-4 flex items-center justify-center min-h-[360px]">
                    <div
                      ref={coverCropPreviewRef}
                      className="w-full max-w-xl overflow-hidden rounded-2xl bg-black/5 dark:bg-black/30 shadow-inner"
                      style={{ aspectRatio: String(COVER_CROP_RATIOS[selectedCoverCropRatio]) }}
                      onPointerDown={handleCoverCropPointerDown}
                      onPointerMove={handleCoverCropPointerMove}
                      onPointerUp={handleCoverCropPointerUp}
                      onPointerCancel={handleCoverCropPointerUp}
                    >
                      <div
                        className="w-full h-full bg-center bg-no-repeat bg-cover cursor-grab active:cursor-grabbing"
                        style={coverCropPreviewStyle}
                      >
                        <div
                          className="w-full h-full pointer-events-none"
                          style={{
                            backgroundImage: `
                                                            linear-gradient(to right, rgba(255,255,255,0.28) 1px, transparent 1px),
                                                            linear-gradient(to bottom, rgba(255,255,255,0.28) 1px, transparent 1px)
                                                        `,
                            backgroundSize: "33.333% 100%, 100% 33.333%",
                            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.4)",
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
                      <span>Zoom</span>
                      <span>{coverCropZoom.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={3}
                      step={0.1}
                      value={coverCropZoom}
                      onChange={e => setCoverCropZoom(Number(e.target.value))}
                      className="w-full accent-brand-600"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setCoverCropModal(null)}
                      className="px-4 py-2 rounded-full text-xs font-semibold border border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        applyCoverCrop(coverCropModal.source, selectedCoverCropRatio, coverCropZoom, coverCropPan, croppedDataUrl => {
                          setProfile(prev => ({
                            ...prev,
                            coverUrl: croppedDataUrl,
                            coverCropRatio: selectedCoverCropRatio,
                            showCover: true,
                          }));
                          setCoverCropModal(null);
                        });
                      }}
                      className="px-5 py-2 rounded-full text-xs font-semibold bg-brand-600 text-white hover:scale-105 active:scale-95 transition-all shadow-lg shadow-brand-500/25"
                    >
                      Save Crop
                    </button>
                  </div>
                </div>
              </div>
            </div>
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
