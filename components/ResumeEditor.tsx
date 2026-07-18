import React, { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { PrepareApplicationReturnBar } from "@/components/jobs/PrepareApplicationReturnBar";
import {
  AtsScoreModalFooterPlaceholder,
  AtsScoreModalLoadingPanel,
  AtsScoreModalRecalculateProgress,
} from "@/components/resume/AtsScoreModalLoading";
import { AtsSectionAnalysisRow } from "@/components/resume/AtsSectionAnalysisRow";
import { ActionHintTooltip } from "@/components/ui/ActionHintTooltip";
import { ModalPortalOverlay } from "@/components/ui/ModalPortalOverlay";
import { PanelResizeHandle } from "@/components/ui/PanelResizeHandle";
import { DOCUMENT_SAVED_CONFIRMATION_MS } from "@/constants/documentAutosave";
import { EMPTY_PDF_HIGHLIGHT_MAP } from "@/features/adk-chat/adkResumeHighlightDiff";
import { useAdkResumeReviewStore } from "@/features/adk-chat/stores/useAdkResumeReviewStore";
import { buildAtsFixPlan, canRunAtsFix } from "@/features/resume/api/ats-fix-plan";
import { buildAtsFixMainSessionTitle } from "@/features/resume/api/build-ats-improve-prompt";
import { formatAtsDeltaLabel, mapAtsScoreToViewModel } from "@/features/resume/api/mapAtsScoreToViewModel";
import { mapBackendResumeToFrontend, mapFrontendResumeToBackend } from "@/features/resume/api/mappers";
import { isPersistedResumeId } from "@/features/resume/constants/resumeDraft";
import { useCalculateAtsScore } from "@/features/resume/hooks/useCalculateAtsScore";
import { useDebouncedResumePreview } from "@/features/resume/hooks/useDebouncedResumePreview";
import { useGeolocationTemplate } from "@/features/resume/hooks/useGeolocationTemplate";
import { resumeByIdQueryKey } from "@/features/resume/hooks/useResume";
import { resumeAtsQueryKey, useResumeAtsScore } from "@/features/resume/hooks/useResumeAtsScore";
import { useUpdateResume } from "@/features/resume/hooks/useUpdateResume";
import { publishResumeAsset } from "@/features/resume/server-actions/resume-actions";
import { useResumeStore } from "@/features/resume/store/useResumeStore";
import { downloadResumePdf } from "@/features/resume/utils/downloadResumePdf";
import { getResumeContentSignature } from "@/features/resume/utils/getResumeContentSignature";
import { nextResumeEntryId } from "@/features/resume/utils/resume-entry-ids";
import {
  focusResumeValidationField,
  formatResumeValidationMessage,
  resumeFieldDomId,
} from "@/features/resume/utils/resume-validation-focus";
import { copyResumePublicLink, isResumePublished } from "@/features/resume/utils/resumePublish";
import {
  clearPrepareReturnSession,
  getPrepareReturnSession,
  setPrepareReturnSession,
  type PrepareApplicationReturnSession,
} from "@/lib/jobs/prepare-application-return";
import { buildJobsPrepareReopenHref, buildResumeAssetOnlyHref, parseResumePrepareSearchParams } from "@/lib/jobs/prepare-application-url";
import { ATS_COMPLETE_THRESHOLD, ATS_IMPROVEMENTS_DISPLAY_LIMIT } from "@/lib/resume/atsConstants";
import { getAtsRecalculateState } from "@/lib/resume/atsRecalculate";
import { getAtsScoreQuote } from "@/lib/resume/atsScoreQuote";
import { loadResumeAtsSession, saveResumeAtsSession } from "@/lib/resume/atsStorage";
import { MODAL_OVERLAY_Z_CLASS } from "@/lib/ui/modal-overlay";
import { getJob } from "@/src/features/jobs/server-actions/jobs-actions";
import { useResumeFormsPanelResize } from "@/src/hooks/useResumeFormsPanelResize";
import {
  ResumeData,
  ResumeExperience,
  ResumeEducation,
  ResumeSkill,
  ResumeProject,
  ResumeCertification,
  CustomSection,
  ResumeTemplateId,
  CustomSectionItem,
} from "@/types";
import { getAtsGateState, validateResume, ValidationError } from "@/utils/validation";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  X,
  Download,
  Share2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  LayoutTemplate,
  Type,
  Briefcase,
  GraduationCap,
  Code,
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  Linkedin,
  Github,
  ExternalLink,
  Link,
  Calendar,
  Check,
  AlertCircle,
  Quote,
  Palette,
  Layout,
  Star,
  TrendingUp,
  Loader2,
  CheckSquare,
  Square,
  FolderKanban,
  Award,
  Eye,
  EyeOff,
  RefreshCw,
  Wand2,
  CheckCircle2,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import ResumePDFPreview from "./ResumePDFPreview";
import TiptapEditor from "./TiptapEditor";
import ResumeFieldError from "./resume/ResumeFieldError";
import ResumePersonalDetailsFields, { type ResumePersonalDetailsFieldsHandle } from "./resume/ResumePersonalDetailsFields";
import ResumePublishedBeacon from "./resume/ResumePublishedBeacon";
import HtmlDisplay from "./resume/shared/HtmlDisplay";
import { parseDate } from "./resume/shared/dateUtils";
import { getTemplate } from "./resume/templates";

const LEGACY_CUSTOM_SECTION_TITLE = "Untitled Section";
const LEGACY_CUSTOM_ITEM_TITLES = new Set(["Activity Name", "New Item"]);

function htmlToPlainText(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

function normalizeCustomSectionTitle(title: string): string {
  return title === LEGACY_CUSTOM_SECTION_TITLE ? "" : title;
}

function normalizeCustomItemTitle(title: string | undefined): string {
  if (!title) return "";
  return LEGACY_CUSTOM_ITEM_TITLES.has(title) ? "" : title;
}

function normalizeCustomDescription(html: string | undefined): string {
  if (!html) return "";
  const plain = htmlToPlainText(html);
  return plain === "" || plain === "Description..." ? "" : html;
}

interface ResumeEditorProps {
  resumeId: string;
  initialData: ResumeData;
  onBack: () => void;
  onSave: (data: ResumeData) => void;
  onImprove: (text: string) => void;
  showTemplateModal: boolean;
  setShowTemplateModal: (show: boolean) => void;
}

const AUTOSAVE_DELAY_MS = 12_000;

const scoreTone = (score: number) => (score >= 80 ? "green" : score >= ATS_COMPLETE_THRESHOLD ? "yellow" : "red");

const TEMPLATES: {
  id: ResumeTemplateId;
  name: string;
  description: string;
  color: string;
  border: string;
  available: boolean;
}[] = [
  {
    id: "basic",
    name: "Basic",
    description: "Traditional layout with blue accents",
    color: "bg-sky-50",
    border: "border-sky-200",
    available: true,
  },
  {
    id: "modern",
    name: "Modern",
    description: "Clean and professional",
    color: "bg-brand-50",
    border: "border-brand-200",
    available: true,
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Simple and elegant",
    color: "bg-slate-50",
    border: "border-slate-200",
    available: true,
  },
  {
    id: "us",
    name: "American",
    description: "Standard US formatting",
    color: "bg-stone-50",
    border: "border-stone-200",
    available: true,
  },
  {
    id: "canada",
    name: "Canadian",
    description: "Clean layout for Canada",
    color: "bg-red-50",
    border: "border-red-200",
    available: true,
  },
  {
    id: "ireland",
    name: "Ireland",
    description: "Centered header and piped contacts",
    color: "bg-emerald-50",
    border: "border-emerald-200",
    available: true,
  },
  {
    id: "aus",
    name: "Australia",
    description: "Clean left-aligned layout",
    color: "bg-indigo-50",
    border: "border-indigo-200",
    available: true,
  },
  {
    id: "professional",
    name: "Professional",
    description: "Centered header with split detail rows",
    color: "bg-neutral-50",
    border: "border-neutral-300",
    available: true,
  },
  {
    id: "slatepro",
    name: "Slate Pro",
    description: "Two-column layout with avatar header and contact sidebar",
    color: "bg-stone-50",
    border: "border-stone-300",
    available: true,
  },
  // PRO templates — re-enable when subscription/unlock flow ships
  // { id: "swiss", name: "Swiss", description: "Bold typography", color: "bg-violet-50", border: "border-violet-200", available: false },
  // { id: "tech", name: "Tech Lead", description: "Dark mode inspired", color: "bg-zinc-900", border: "border-zinc-700", available: false },
  // { id: "creative", name: "Creative", description: "Playful layout", color: "bg-teal-50", border: "border-teal-200", available: false },
  // { id: "executive", name: "Executive", description: "High impact", color: "bg-slate-200", border: "border-slate-300", available: false },
  // { id: "startup", name: "Startup", description: "Modern startup vibe", color: "bg-sky-50", border: "border-sky-200", available: false },
  // { id: "academic", name: "Academic", description: "Research focused", color: "bg-stone-50", border: "border-stone-200", available: false },
  // { id: "designer", name: "Designer", description: "Visual heavy", color: "bg-rose-50", border: "border-rose-200", available: false },
  // { id: "engineer", name: "Engineer", description: "Structure first", color: "bg-cyan-50", border: "border-cyan-200", available: false },
  // { id: "manager", name: "Manager", description: "Leadership focus", color: "bg-emerald-50", border: "border-emerald-200", available: false },
  // { id: "student", name: "Student", description: "Entry level optimized", color: "bg-green-50", border: "border-green-200", available: false },
  // { id: "compact", name: "Compact", description: "Single page master", color: "bg-gray-50", border: "border-gray-200", available: false },
  // { id: "timeline", name: "Timeline", description: "Chronological view", color: "bg-orange-50", border: "border-orange-200", available: false },
  // { id: "split", name: "Split", description: "Two column split", color: "bg-teal-50", border: "border-teal-200", available: false },
  // { id: "grid", name: "Grid", description: "Modular grid system", color: "bg-slate-100", border: "border-slate-300", available: false },
  // { id: "bold", name: "Bold", description: "High contrast", color: "bg-rose-50", border: "border-rose-200", available: false },
  // { id: "air", name: "Air", description: "Maximum whitespace", color: "bg-sky-50", border: "border-sky-200", available: false },
  // { id: "mono", name: "Mono", description: "Monospace code style", color: "bg-neutral-100", border: "border-neutral-200", available: false },
];

const TEMPLATE_THUMBNAILS: Record<string, string> = {
  modern: "/images/resume-templates/modern.webp",
  minimal: "/images/resume-templates/minimal.webp",
  classic: "/images/resume-templates/classic.webp",
  us: "/images/resume-templates/us.webp",
  canada: "/images/resume-templates/canada.webp",
  basic: "/images/resume-templates/basic.webp",
  ireland: "/images/resume-templates/ireland.webp",
  aus: "/images/resume-templates/australia.webp",
  nextgen: "/images/resume-templates/nextgen.webp",
  professional: "/images/resume-templates/professional.webp",
  slatepro: "/images/resume-templates/slatepro.webp",
  primeslate: "/images/resume-templates/primeslate.webp",
};

// Import the new editor

// Helper Component for HTML Rendering in Preview (Tiptap outputs HTML)

// ... (RichTextarea component is removed) ...

// ... inside ResumeEditor component ...

// Replace usages of HtmlDisplay with HtmlDisplay
// Replace usages of RichTextarea with TiptapEditor

// Example replacement for renderSection:
// <HtmlDisplay content={profile.summary} ... />

// Example replacement for editors:
// <TiptapEditor
//     value={profile.summary}
//     onChange={(val) => handleProfileChange('summary', val)}
//     onImprove={(val) => onImprove(val)} // Check if onImprove expects text or HTML. Tiptap provides HTML.
//     placeholder="Professional summary..."
//     className="min-h-[120px]"
// />

const MonthYearPicker: React.FC<{
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  disabled?: boolean;
  min?: string;
  max?: string;
  align?: "left" | "right";
  allowPresent?: boolean;
  className?: string;
  id?: string;
}> = ({ value, onChange, placeholder, disabled = false, min, max, align = "left", allowPresent = false, className = "", id }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const years = Array.from({ length: 55 }, (_, i) => currentYear + 5 - i);

  const parsedValue = useMemo(() => {
    if (!value || value === "Present") {
      return { year: currentYear, month: currentMonth };
    }
    if (/^\d{4}-\d{2}$/.test(value)) {
      const [yearPart, monthPart] = value.split("-");
      return {
        year: Number(yearPart),
        month: Math.max(0, Math.min(11, Number(monthPart) - 1)),
      };
    }
    return { year: currentYear, month: currentMonth };
  }, [value, currentYear, currentMonth]);

  const [selectedYear, setSelectedYear] = useState(parsedValue.year);
  const [selectedMonth, setSelectedMonth] = useState(parsedValue.month);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleApply = () => {
    const nextValue = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}`;
    if (min && /^\d{4}-\d{2}$/.test(min) && nextValue < min) return;
    if (max && /^\d{4}-\d{2}$/.test(max) && nextValue > max) return;
    onChange(nextValue);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} id={id} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          if (!isOpen) {
            setSelectedYear(parsedValue.year);
            setSelectedMonth(parsedValue.month);
          }
          setIsOpen(open => !open);
        }}
        className={`w-full p-3 bg-white dark:bg-slate-700 border rounded-lg text-xs outline-none transition-all flex items-center justify-between ${
          disabled
            ? "opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-800"
            : "cursor-pointer hover:border-slate-300 dark:hover:border-slate-500"
        } ${className}`}
      >
        <span className={value ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-slate-400"}>
          {value ? parseDate(value) : placeholder}
        </span>
        <Calendar size={14} className="text-slate-400" />
      </button>

      {isOpen && !disabled && (
        <div
          className={`absolute z-40 mt-1 top-full w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-3 animate-in fade-in zoom-in-95 duration-100 ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-800 dark:text-slate-100">Select Date</span>
            {allowPresent && (
              <button
                type="button"
                onClick={() => {
                  onChange("Present");
                  setIsOpen(false);
                }}
                className="text-xs font-medium text-brand-600 hover:text-brand-700"
              >
                Present
              </button>
            )}
          </div>

          <div className="flex gap-2 mb-3">
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(Number(e.target.value))}
              className="w-1/2 p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none dark:text-white"
            >
              {Array.from({ length: 12 }, (_, monthIndex) => (
                <option key={monthIndex} value={monthIndex}>
                  {new Date(2000, monthIndex, 1).toLocaleDateString("en-US", { month: "short" })}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              className="w-1/2 p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none dark:text-white"
            >
              {years.map(yearValue => (
                <option key={yearValue} value={yearValue}>
                  {yearValue}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleApply}
            className="w-full py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
};

const ResumeEditor: React.FC<ResumeEditorProps> = ({
  resumeId,
  initialData,
  onBack,
  onSave,
  onImprove,
  showTemplateModal,
  setShowTemplateModal,
}) => {
  // Deduplicate section order by id (used for hydrate and in handleDragOver)
  const deduplicateSectionOrder = (order: ResumeData["sectionOrder"]) => {
    const seen = new Set<string>();
    return order.filter(s => {
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });
  };

  const getInitialResume = useCallback((): ResumeData => {
    const existingCategories = initialData.skillCategories || [];
    const categoryNameToId = new Map(existingCategories.map(category => [category.name.trim().toLowerCase(), category.id]));
    const normalizedSkills = initialData.skills.map(skill => {
      if (skill.categoryId) return skill;
      const legacyCategory = skill.category?.trim();
      if (!legacyCategory) return skill;

      const key = legacyCategory.toLowerCase();
      let categoryId = categoryNameToId.get(key);
      if (!categoryId) {
        categoryId = legacyCategory;
        categoryNameToId.set(key, categoryId);
      }

      return {
        ...skill,
        categoryId,
      };
    });

    const normalizedSkillCategories = Array.from(categoryNameToId.entries()).map(([name, id]) => ({
      id,
      name: existingCategories.find(category => category.id === id)?.name || name.charAt(0).toUpperCase() + name.slice(1),
    }));

    if (initialData.sectionOrder && initialData.sectionOrder.length > 0) {
      const hasProfile = initialData.sectionOrder.some(s => s.id === "profile");
      return {
        ...initialData,
        skills: normalizedSkills,
        skillCategories: normalizedSkillCategories,
        sectionOrder: deduplicateSectionOrder(hasProfile ? initialData.sectionOrder : [{ id: "profile" }, ...initialData.sectionOrder]),
      };
    }
    return {
      ...initialData,
      skills: normalizedSkills,
      skillCategories: normalizedSkillCategories,
      sectionOrder: [
        { id: "profile" },
        { id: "experience" },
        { id: "education" },
        { id: "skills" },
        { id: "projects" },
        { id: "certifications" },
        ...initialData.customSections.map(s => ({ id: s.id })),
      ],
    };
  }, [initialData]);

  const resumeFromStore = useResumeStore(s => s.resumeData[resumeId]);
  const resume = resumeFromStore ?? getInitialResume();
  const resumeForPreview = useDebouncedResumePreview(resume);

  const [inlinePublishStep, setInlinePublishStep] = useState<"cta" | "form">("cta");
  const [slugInput, setSlugInput] = useState("");
  const [publishSubmitting, setPublishSubmitting] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  /** After successful publish, primary button shows "Published" for at least this long */
  const [publishShowPublished, setPublishShowPublished] = useState(false);
  const [copiedPublicLink, setCopiedPublicLink] = useState(false);
  const copiedPublicLinkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);
  const publishPublishedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (publishPublishedTimerRef.current) {
        clearTimeout(publishPublishedTimerRef.current);
      }
      if (copiedPublicLinkTimerRef.current) {
        clearTimeout(copiedPublicLinkTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isExportDropdownOpen) {
      setPublishSubmitting(false);
      setPublishShowPublished(false);
      if (publishPublishedTimerRef.current) {
        clearTimeout(publishPublishedTimerRef.current);
        publishPublishedTimerRef.current = null;
      }
      setPublishError(null);
      setInlinePublishStep("cta");
      setSlugInput("");
      return;
    }
  }, [isExportDropdownOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
        setIsExportDropdownOpen(false);
      }
    };
    if (isExportDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isExportDropdownOpen]);

  const setResumeData = useResumeStore(s => s.setResumeData);
  const updateResumeField = useResumeStore(s => s.updateResumeField);
  const dismissAdkReviewOnManualEdit = useCallback(() => {
    useAdkResumeReviewStore.getState().dismissReviewsForResume(resumeId);
  }, [resumeId]);
  const updateResume = useCallback(
    (updater: (prev: ResumeData) => ResumeData) => {
      dismissAdkReviewOnManualEdit();
      const prev = useResumeStore.getState().getResumeData(resumeId) ?? getInitialResume();
      setResumeData(resumeId, updater(prev));
    },
    [dismissAdkReviewOnManualEdit, resumeId, setResumeData, getInitialResume]
  );

  const { mutateAsync: updateResumeMutation, isPending: isSavingRemote } = useUpdateResume();
  const { data: atsCache, isLoading: atsCacheLoading } = useResumeAtsScore(resumeId, isPersistedResumeId(resumeId));
  const {
    mutateAsync: runAtsScore,
    data: atsMutationVm,
    isPending: atsScorePending,
    isError: atsScoreError,
    error: atsScoreErr,
    reset: resetAtsMutation,
  } = useCalculateAtsScore();
  const queryClient = useQueryClient();
  const { recommendedTemplate } = useGeolocationTemplate();
  const availableTemplates = useMemo(() => TEMPLATES.filter(t => t.available), []);
  const templatePickerItems = useMemo(() => {
    const pickerRank = (id: ResumeTemplateId) => {
      if (id === "basic") return 0;
      if (recommendedTemplate && id === recommendedTemplate) return 1;
      return 2;
    };
    return [...availableTemplates].sort((a, b) => {
      const rankDiff = pickerRank(a.id) - pickerRank(b.id);
      return rankDiff !== 0 ? rankDiff : 0;
    });
  }, [availableTemplates, recommendedTemplate]);

  const router = useRouter();
  const searchParams = useSearchParams();
  const [prepareReturn, setPrepareReturn] = useState<PrepareApplicationReturnSession | null>(null);
  const [activeSection, setActiveSection] = useState<string>("profile");
  const [showFieldValidation, setShowFieldValidation] = useState(false);
  const { panelWidth: formsPanelWidth, isResizing: isFormsPanelResizing, startResize: startFormsPanelResize } = useResumeFormsPanelResize();
  const [draggedSectionId, setDraggedSectionId] = useState<string | null>(null);
  const lastSectionDropTargetRef = useRef<string | null>(null);
  const [lastAcknowledgedSnapshot, setLastAcknowledgedSnapshot] = useState("");
  const [titleDraft, setTitleDraft] = useState(() => getInitialResume().title);
  const hydratedResumeIdRef = useRef<string | null>(null);
  const [activeSaveSource, setActiveSaveSource] = useState<"auto" | "manual" | null>(null);
  const [savedConfirmationVisible, setSavedConfirmationVisible] = useState(false);
  const savedConfirmationTimerRef = useRef<number | null>(null);
  const saveInFlightRef = useRef(false);
  const queuedSaveRef = useRef(false);
  const runSaveRef = useRef<((source: "auto" | "manual") => Promise<void>) | null>(null);
  const latestSnapshotRef = useRef("");
  const profileFieldsRef = useRef<ResumePersonalDetailsFieldsHandle>(null);

  // Hydrate store + autosave baseline once per resume open (avoid clobbering in-progress edits on remount).
  useEffect(() => {
    if (hydratedResumeIdRef.current === resumeId) return;

    hydratedResumeIdRef.current = resumeId;
    const initial = getInitialResume();
    useResumeStore.getState().setResumeData(resumeId, initial);
    const snapshot = getResumeContentSignature(initial);
    setTitleDraft(initial.title);
    setLastAcknowledgedSnapshot(snapshot);
    latestSnapshotRef.current = snapshot;
    saveInFlightRef.current = false;
    queuedSaveRef.current = false;
    setActiveSaveSource(null);
    setSavedConfirmationVisible(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: not on every initialData refresh
  }, [resumeId]);

  // Toast notification state
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // -- Item DnD & Collapse State --
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [draggedItemSectionId, setDraggedItemSectionId] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({}); // true = expanded

  // -- ATS Modal State --
  const [showAtsModal, setShowAtsModal] = useState(false);
  const [fixAllUsed, setFixAllUsed] = useState(false);
  const [recalcError, setRecalcError] = useState<string | null>(null);
  const [pendingDeleteSectionId, setPendingDeleteSectionId] = useState<string | null>(null);
  const [pendingDeleteSkillCategoryId, setPendingDeleteSkillCategoryId] = useState<string | null>(null);
  const [pendingDeleteEntry, setPendingDeleteEntry] = useState<{
    type: "experience" | "education" | "projects" | "certifications" | "customItem";
    itemId: string;
    sectionId?: string;
  } | null>(null);

  // Preview Modal State
  const [showPreview, setShowPreview] = useState(false);
  const [previewScale, setPreviewScale] = useState(0.8);
  const [previewOffset, setPreviewOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // Tooltip State
  const [tooltip, setTooltip] = useState<{
    label: string;
    top: number;
    left: number;
  } | null>(null);

  const showTooltip = (e: React.MouseEvent, label: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      label,
      top: rect.top + rect.height / 2,
      left: rect.right + 12,
    });
  };

  const handleEnterPublishMode = useCallback(() => {
    setPublishError(null);
    setInlinePublishStep("form");
    const existing = resume.slug?.trim();
    setSlugInput(existing ?? "");
  }, [resume.slug]);

  const handleSharePublicLinkSubmit = useCallback(async () => {
    if (!isPersistedResumeId(resumeId)) {
      showToast("Save your resume before publishing.", "error");
      return;
    }

    const trimmedSlug = slugInput.trim();
    if (!trimmedSlug) {
      setPublishError("Enter a link name");
      return;
    }

    if (publishSubmitting) return;

    setPublishSubmitting(true);
    setPublishError(null);

    try {
      const content = mapFrontendResumeToBackend(resume);
      const result = await publishResumeAsset(content, trimmedSlug);

      if (!result.ok) {
        setPublishError(result.error || "Could not publish");
        return;
      }

      const canonicalSlug = result.slug;
      const publishedAt = new Date().toISOString();
      updateResume(prev => ({ ...prev, slug: canonicalSlug, publishedAt }));
      onSave({ ...resume, slug: canonicalSlug, publishedAt });

      await queryClient.invalidateQueries({ queryKey: ["resumes"] });
      await queryClient.invalidateQueries({ queryKey: ["resumes", resumeId] });

      const origin =
        typeof window !== "undefined" && window.location?.origin
          ? window.location.origin
          : (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/+$/, "") ||
            (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
      const publicUrl = `${origin}/resume/${encodeURIComponent(canonicalSlug)}`;

      try {
        await navigator.clipboard.writeText(publicUrl);
        showToast("Published — link copied to clipboard", "success");
      } catch {
        showToast(`Published — copy this link: ${publicUrl}`, "success");
      }

      if (publishPublishedTimerRef.current) {
        clearTimeout(publishPublishedTimerRef.current);
      }
      setPublishShowPublished(true);
      publishPublishedTimerRef.current = setTimeout(() => {
        setPublishShowPublished(false);
        publishPublishedTimerRef.current = null;
      }, 5000);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Publish failed";
      if (msg.toLowerCase().includes("unauthorized")) {
        setPublishError("Please sign in again and retry.");
      } else {
        setPublishError(msg);
      }
    } finally {
      setPublishSubmitting(false);
    }
  }, [resume, resumeId, slugInput, publishSubmitting, showToast, updateResume, onSave, queryClient]);

  const handlePublishSlugKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      void handleSharePublicLinkSubmit();
    },
    [handleSharePublicLinkSubmit]
  );

  const addSkillCategory = () => {
    const newCategory = {
      id: nextResumeEntryId(
        (resume.skillCategories ?? []).map(c => c.id),
        "skill_cat"
      ),
      name: "",
    };
    updateResume(prev => ({
      ...prev,
      skillCategories: [...(prev.skillCategories || []), newCategory],
    }));
  };

  const updateSkillCategory = (id: string, name: string) => {
    updateResume(prev => ({
      ...prev,
      skillCategories: (prev.skillCategories || []).map(cat => (cat.id === id ? { ...cat, name } : cat)),
      skills: prev.skills.map(skill => {
        if (skill.categoryId !== id) return skill;
        return {
          ...skill,
          category: name,
        };
      }),
    }));
  };

  const requestRemoveSkillCategory = (id: string) => {
    setPendingDeleteSkillCategoryId(id);
  };

  const confirmRemoveSkillCategory = () => {
    if (!pendingDeleteSkillCategoryId) return;
    const id = pendingDeleteSkillCategoryId;
    updateResume(prev => ({
      ...prev,
      skillCategories: (prev.skillCategories || []).filter(cat => cat.id !== id),
      skills: prev.skills.filter(skill => skill.categoryId !== id),
    }));
    setPendingDeleteSkillCategoryId(null);
  };

  const cancelRemoveSkillCategory = () => {
    setPendingDeleteSkillCategoryId(null);
  };

  const renameUncategorizedSkills = (nextCategoryName: string) => {
    const trimmedName = nextCategoryName.trim();
    if (!trimmedName || trimmedName.toLowerCase() === "uncategorized skills") return;

    updateResume(prev => {
      const existingCategory = (prev.skillCategories || []).find(
        category => category.name.trim().toLowerCase() === trimmedName.toLowerCase()
      );
      const categoryId =
        existingCategory?.id ||
        nextResumeEntryId(
          (prev.skillCategories || []).map(c => c.id),
          "skill_cat"
        );

      return {
        ...prev,
        skillCategories: existingCategory
          ? prev.skillCategories || []
          : [...(prev.skillCategories || []), { id: categoryId, name: trimmedName }],
        skills: prev.skills.map(skill => {
          if (skill.categoryId) return skill;
          return {
            ...skill,
            categoryId,
            category: trimmedName,
          };
        }),
      };
    });
  };

  const hideTooltip = () => setTooltip(null);
  const resumeForAutosave = useMemo(() => ({ ...resume, title: titleDraft }), [resume, titleDraft]);
  const currentSnapshot = useMemo(() => getResumeContentSignature(resumeForAutosave), [resumeForAutosave]);

  useEffect(() => {
    latestSnapshotRef.current = currentSnapshot;
  }, [currentSnapshot]);

  useEffect(() => {
    resetAtsMutation();
  }, [resumeId, resetAtsMutation]);

  const cachedAtsVm = useMemo(() => {
    if (atsCache?.ok && atsCache.ats_score) {
      return mapAtsScoreToViewModel(atsCache.ats_score);
    }
    return null;
  }, [atsCache]);

  const atsVm = atsMutationVm ?? cachedAtsVm;
  const atsFixPlan = useMemo(() => (atsVm ? buildAtsFixPlan(atsVm, resume) : []), [atsVm, resume]);
  const canAtsFix = canRunAtsFix(atsVm, resume);
  const atsCalcCount = atsMutationVm?.ats_calc_count ?? (atsCache?.ok ? atsCache.ats_calc_count : 0);
  const atsScoredAt = atsMutationVm?.scored_at ?? (atsCache?.ok ? atsCache.scored_at : null);
  const atsScoreStale = atsMutationVm?.score_stale ?? (atsCache?.ok ? atsCache.score_stale : false);
  const atsResumeUpdatedAt = atsMutationVm?.resume_updated_at ?? (atsCache?.ok ? atsCache.resume_updated_at : null);

  useEffect(() => {
    if (!resumeId?.trim()) return;
    const session = loadResumeAtsSession(resumeId, {
      currentScoredAt: atsScoredAt,
      currentResumeUpdatedAt: atsResumeUpdatedAt ?? null,
    });
    setFixAllUsed(session.fixAllUsed);
  }, [resumeId, atsScoredAt, atsResumeUpdatedAt]);

  useEffect(() => {
    if (!showAtsModal || !isPersistedResumeId(resumeId)) return;
    if (atsCacheLoading) return;
    if (cachedAtsVm) return;
    void runAtsScore({ resumeId, force: false }).catch(() => {});
  }, [showAtsModal, resumeId, atsCacheLoading, cachedAtsVm, runAtsScore]);

  const atsPillScore = atsVm?.score;
  const atsScoreQuote = useMemo(() => {
    const weak = atsVm?.sectionAnalysis.filter(row => row.status !== "good").map(row => ({ name: row.name })) ?? [];
    return getAtsScoreQuote(atsPillScore ?? atsVm?.score ?? 0, weak);
  }, [atsPillScore, atsVm]);
  const atsDeltaLabel = useMemo(() => formatAtsDeltaLabel(atsVm?.deltaOverall), [atsVm?.deltaOverall]);
  const atsDeltaTone =
    atsVm?.deltaOverall != null && atsVm.deltaOverall > 0
      ? "text-green-600 dark:text-green-400"
      : atsVm?.deltaOverall != null && atsVm.deltaOverall < 0
        ? "text-red-600 dark:text-red-400"
        : "text-slate-500";
  const atsTone = scoreTone(atsPillScore ?? 0);
  const atsScoreClass = atsTone === "green" ? "text-green-600" : atsTone === "yellow" ? "text-yellow-600" : "text-red-600";
  const atsBarClass = atsTone === "green" ? "bg-green-500" : atsTone === "yellow" ? "bg-yellow-500" : "bg-red-500";
  const atsHeaderBg = atsTone === "green" ? "bg-green-50/50" : atsTone === "yellow" ? "bg-yellow-50/50" : "bg-red-50/50";
  const isFirstAtsLoad = !atsVm && (atsScorePending || atsCacheLoading);
  const isRecalculating = Boolean(atsVm) && atsScorePending;

  const handleFixWithUnibot = () => {
    if (fixAllUsed || !canAtsFix || atsFixPlan.length === 0) return;
    setFixAllUsed(true);
    saveResumeAtsSession(resumeId, {
      recalcAttemptsUsed: atsCalcCount,
      fixAllUsed: true,
      fixUsedAtScoredAt: atsScoredAt ?? null,
      fixUsedAtResumeUpdatedAt: atsResumeUpdatedAt ?? null,
    });
    setRecalcError(null);
    window.dispatchEvent(
      new CustomEvent("open-unibot", {
        detail: {
          type: "ats_fix_batch",
          resumeId,
          sections: atsFixPlan,
          mainSessionTitle: buildAtsFixMainSessionTitle(resume.title),
          requestKey: Date.now(),
        },
      })
    );
    setShowAtsModal(false);
  };

  const handleFixWithCareerCoach = () => {
    setShowAtsModal(false);
    setRecalcError(null);
    window.location.href = "/uniboard/unicoach";
  };

  // -- Validation --
  const validationErrors = useMemo(() => validateResume(resume), [resume]);
  const atsGate = useMemo(() => getAtsGateState(resume), [resume]);
  const atsGated = !atsGate.ok;
  const pdfHighlightRegions = useAdkResumeReviewStore(s => s.reviewStack.at(-1)?.highlights ?? EMPTY_PDF_HIGHLIGHT_MAP);
  const hasPendingUnsavedChanges = currentSnapshot !== lastAcknowledgedSnapshot;
  const isSaving = isSavingRemote;

  useEffect(() => {
    if (!hasPendingUnsavedChanges) return;
    setSavedConfirmationVisible(false);
    if (savedConfirmationTimerRef.current) {
      window.clearTimeout(savedConfirmationTimerRef.current);
      savedConfirmationTimerRef.current = null;
    }
  }, [hasPendingUnsavedChanges]);

  const atsRecalculateState = useMemo(
    () =>
      getAtsRecalculateState({
        scoredAt: atsScoredAt,
        resumeUpdatedAt: atsResumeUpdatedAt,
        scoreStale: atsScoreStale,
        atsCalcCount,
        hasUnsavedChanges: hasPendingUnsavedChanges,
      }),
    [atsCalcCount, atsResumeUpdatedAt, atsScoreStale, atsScoredAt, hasPendingUnsavedChanges]
  );

  const handleRecalculate = async () => {
    if (!isPersistedResumeId(resumeId) || atsScorePending || !atsRecalculateState.allowed) return;
    setRecalcError(null);
    try {
      await runAtsScore({ resumeId, force: true });
      void queryClient.invalidateQueries({ queryKey: resumeAtsQueryKey(resumeId) });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong while recalculating. Please try again.";
      setRecalcError(message);
    }
  };

  useEffect(() => {
    return () => {
      if (savedConfirmationTimerRef.current) {
        window.clearTimeout(savedConfirmationTimerRef.current);
      }
    };
  }, []);

  const getError = (section: string, field: string, id?: string) => {
    if (!showFieldValidation) return undefined;
    return validationErrors.find(e => e.section === section && e.field === field && e.id === id);
  };

  const goToFirstValidationError = useCallback(
    (error: ValidationError) => {
      const sectionId =
        error.section === "custom"
          ? error.id && resume.customSections.some(s => s.id === error.id)
            ? error.id
            : (resume.customSections.find(s => s.items.some(i => i.id === error.id))?.id ?? "profile")
          : error.section;

      setActiveSection(sectionId);
      if (error.id) {
        setExpandedItems(prev => ({ ...prev, [error.id!]: true }));
      }
      window.setTimeout(() => focusResumeValidationField(error), 80);
    },
    [resume.customSections]
  );

  const handleExportClick = () => {
    profileFieldsRef.current?.flushToStore();
    const latestResume = useResumeStore.getState().getResumeData(resumeId) ?? resume;
    const exportValidationErrors = validateResume(latestResume);
    if (exportValidationErrors.length > 0) {
      setShowFieldValidation(true);
      goToFirstValidationError(exportValidationErrors[0]);
      return;
    }
    setIsExportDropdownOpen(prev => !prev);
  };

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      await downloadResumePdf(resume);
      setIsExportDropdownOpen(false);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to download PDF", "error");
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleCopyPublicLink = async () => {
    if (!isResumePublished(resume)) return;
    const copied = await copyResumePublicLink(resume);
    if (!copied) {
      showToast("Could not copy link to clipboard", "error");
      return;
    }
    setCopiedPublicLink(true);
    if (copiedPublicLinkTimerRef.current) clearTimeout(copiedPublicLinkTimerRef.current);
    copiedPublicLinkTimerRef.current = setTimeout(() => {
      setCopiedPublicLink(false);
      copiedPublicLinkTimerRef.current = null;
    }, 3000);
  };

  const isPublishedResume = isResumePublished(resume);

  // -- Handlers --

  const handleProfileChange = (field: string, value: string) => {
    updateResume(prev => ({
      ...prev,
      profile: { ...prev.profile, [field]: value },
    }));
  };

  const handleProfileSync = useCallback(
    (profile: ResumeData["profile"]) => {
      updateResume(prev => ({ ...prev, profile }));
    },
    [updateResume]
  );

  const addExperience = () => {
    const newExp: ResumeExperience = {
      id: nextResumeEntryId(
        resume.experience.map(e => e.id),
        "exp"
      ),
      company: "",
      role: "",
      startDate: "",
      endDate: "",
      current: false,
      description: "",
    };
    updateResume(prev => ({
      ...prev,
      experience: [...prev.experience, newExp],
    }));
    setExpandedItems(prev => ({ ...prev, [newExp.id]: true }));
  };

  const updateExperience = (id: string, field: keyof ResumeExperience, value: string | boolean | undefined) => {
    updateResume(prev => ({
      ...prev,
      experience: prev.experience.map(exp => {
        if (exp.id !== id) return exp;
        if (field === "endDate" && value && exp.startDate && value < exp.startDate) return exp;
        if (field === "startDate" && value && exp.endDate && value > exp.endDate && !exp.current) {
          return { ...exp, [field]: value, endDate: "" } as ResumeExperience;
        }
        return { ...exp, [field]: value } as ResumeExperience;
      }),
    }));
  };

  const removeExperience = (id: string) => {
    updateResume(prev => ({
      ...prev,
      experience: prev.experience.filter(exp => exp.id !== id),
    }));
  };

  const addEducation = () => {
    const newEdu: ResumeEducation = {
      id: nextResumeEntryId(
        resume.education.map(e => e.id),
        "edu"
      ),
      school: "",
      degree: "",
      startDate: "",
      endDate: "",
      description: "",
      location: "",
    };
    updateResume(prev => ({
      ...prev,
      education: [...prev.education, newEdu],
    }));
    setExpandedItems(prev => ({ ...prev, [newEdu.id]: true }));
  };

  const updateEducation = (id: string, field: keyof ResumeEducation, value: string | boolean | undefined) => {
    updateResume(prev => ({
      ...prev,
      education: prev.education.map(edu => {
        if (edu.id !== id) return edu;
        if (field === "endDate" && value && edu.startDate && value < edu.startDate) return edu;
        if (field === "startDate" && value && edu.endDate && value > edu.endDate && !edu.current) {
          return { ...edu, [field]: value, endDate: "" } as ResumeEducation;
        }
        return { ...edu, [field]: value } as ResumeEducation;
      }),
    }));
  };

  const removeEducation = (id: string) => {
    updateResume(prev => ({
      ...prev,
      education: prev.education.filter(edu => edu.id !== id),
    }));
  };

  const addSkill = (categoryId?: string, skillName?: string) => {
    updateResume(prev => {
      const categoryName = categoryId ? (prev.skillCategories || []).find(cat => cat.id === categoryId)?.name : undefined;
      const newSkill: ResumeSkill = {
        id: nextResumeEntryId(
          prev.skills.map(s => s.id),
          "skill"
        ),
        name: skillName && skillName.trim().length > 0 ? skillName.trim() : "New Skill",
        categoryId,
        category: categoryName,
      };

      return {
        ...prev,
        skills: [...prev.skills, newSkill],
      };
    });
  };

  const updateSkill = (id: string, name: string) => {
    updateResume(prev => ({
      ...prev,
      skills: prev.skills.map(skill => (skill.id === id ? { ...skill, name } : skill)),
    }));
  };

  const removeSkill = (id: string) => {
    updateResume(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s.id !== id),
    }));
  };

  // -- Projects CRUD --
  const addProject = () => {
    const newProject: ResumeProject = {
      id: nextResumeEntryId(
        resume.projects.map(p => p.id),
        "proj"
      ),
      title: "",
      url: "",
      description: "",
    };
    updateResume(prev => ({
      ...prev,
      projects: [...prev.projects, newProject],
    }));
    setExpandedItems(prev => ({ ...prev, [newProject.id]: true }));
  };

  const updateProject = (id: string, field: keyof ResumeProject, value: string | boolean | undefined) => {
    updateResume(prev => ({
      ...prev,
      projects: prev.projects.map(p => (p.id === id ? { ...p, [field]: value } : p)),
    }));
  };

  const removeProject = (id: string) => {
    updateResume(prev => ({
      ...prev,
      projects: prev.projects.filter(p => p.id !== id),
    }));
  };

  // -- Certifications CRUD --
  const addCertification = () => {
    const newCert: ResumeCertification = {
      id: nextResumeEntryId(
        resume.certifications.map(c => c.id),
        "cert"
      ),
      title: "",
      issuer: "",
      description: "",
    };
    updateResume(prev => ({
      ...prev,
      certifications: [...prev.certifications, newCert],
    }));
    setExpandedItems(prev => ({ ...prev, [newCert.id]: true }));
  };

  const updateCertification = (id: string, field: keyof ResumeCertification, value: string | boolean | undefined) => {
    updateResume(prev => ({
      ...prev,
      certifications: prev.certifications.map(c => (c.id === id ? { ...c, [field]: value } : c)),
    }));
  };

  const removeCertification = (id: string) => {
    updateResume(prev => ({
      ...prev,
      certifications: prev.certifications.filter(c => c.id !== id),
    }));
  };

  const addCustomSection = () => {
    const newSection: CustomSection = {
      id: nextResumeEntryId(
        resume.customSections.map(s => s.id),
        "custom"
      ),
      title: "",
      items: [
        {
          id: nextResumeEntryId([], "custom_item"),
          title: "",
          description: "",
        },
      ],
    };
    const itemId = newSection.items[0]!.id;
    updateResume(prev => ({
      ...prev,
      customSections: [...prev.customSections, newSection],
      sectionOrder: [...prev.sectionOrder, { id: newSection.id }],
    }));
    setExpandedItems(prev => ({ ...prev, [itemId]: true }));
    setActiveSection(newSection.id);
  };

  const updateCustomSectionTitle = (id: string, newTitle: string) => {
    updateResume(prev => ({
      ...prev,
      customSections: prev.customSections.map(sec => (sec.id === id ? { ...sec, title: newTitle } : sec)),
    }));
  };

  const updateCustomSectionItem = (
    sectionId: string,
    itemId: string,
    field: keyof CustomSectionItem,
    value: string | boolean | undefined
  ) => {
    updateResume(prev => ({
      ...prev,
      customSections: prev.customSections.map(sec => {
        if (sec.id !== sectionId) return sec;
        return {
          ...sec,
          items: sec.items.map(item => {
            if (item.id !== itemId) return item;
            if (field === "endDate" && value && item.startDate && value < item.startDate) return item;
            if (field === "startDate" && value && item.endDate && value > item.endDate && !item.current) {
              return { ...item, [field]: value, endDate: "" } as CustomSectionItem;
            }
            return { ...item, [field]: value } as CustomSectionItem;
          }),
        };
      }),
    }));
  };

  const addCustomSectionItem = (sectionId: string) => {
    const section = resume.customSections.find(s => s.id === sectionId);
    const newItem = {
      id: nextResumeEntryId(section?.items.map(i => i.id) ?? [], "custom_item"),
      title: "",
      subtitle: "",
      description: "",
      hasDates: true,
      hasLocation: true,
    };
    updateResume(prev => ({
      ...prev,
      customSections: prev.customSections.map(sec => {
        if (sec.id !== sectionId) return sec;
        return {
          ...sec,
          items: [...sec.items, newItem],
        };
      }),
    }));
    setExpandedItems(prev => ({ ...prev, [newItem.id]: true }));
  };

  const removeCustomSectionItem = (sectionId: string, itemId: string) => {
    updateResume(prev => ({
      ...prev,
      customSections: prev.customSections.map(sec => {
        if (sec.id !== sectionId) return sec;
        return {
          ...sec,
          items: sec.items.filter(item => item.id !== itemId),
        };
      }),
    }));
  };

  const requestRemoveEntry = (
    type: "experience" | "education" | "projects" | "certifications" | "customItem",
    itemId: string,
    sectionId?: string
  ) => {
    setPendingDeleteEntry({ type, itemId, sectionId });
  };

  const confirmRemoveEntry = () => {
    if (!pendingDeleteEntry) return;

    if (pendingDeleteEntry.type === "experience") {
      removeExperience(pendingDeleteEntry.itemId);
    } else if (pendingDeleteEntry.type === "education") {
      removeEducation(pendingDeleteEntry.itemId);
    } else if (pendingDeleteEntry.type === "projects") {
      removeProject(pendingDeleteEntry.itemId);
    } else if (pendingDeleteEntry.type === "certifications") {
      removeCertification(pendingDeleteEntry.itemId);
    } else if (pendingDeleteEntry.sectionId) {
      removeCustomSectionItem(pendingDeleteEntry.sectionId, pendingDeleteEntry.itemId);
    }

    setPendingDeleteEntry(null);
  };

  const cancelRemoveEntry = () => {
    setPendingDeleteEntry(null);
  };

  const removeCustomSection = (id: string) => {
    setPendingDeleteSectionId(id);
  };

  const confirmRemoveCustomSection = () => {
    if (!pendingDeleteSectionId) return;
    updateResume(prev => ({
      ...prev,
      customSections: prev.customSections.filter(sec => sec.id !== pendingDeleteSectionId),
      sectionOrder: prev.sectionOrder.filter(s => s.id !== pendingDeleteSectionId),
    }));
    setPendingDeleteSectionId(null);
    setActiveSection("profile");
  };

  const cancelRemoveCustomSection = () => {
    setPendingDeleteSectionId(null);
  };

  const runSave = useCallback(
    async (source: "auto" | "manual") => {
      if (saveInFlightRef.current) {
        queuedSaveRef.current = true;
        return;
      }

      profileFieldsRef.current?.flushToStore();
      const stored = useResumeStore.getState().getResumeData(resumeId) ?? resume;
      const dataToSave = { ...stored, title: titleDraft };
      const snapshotAtStart = getResumeContentSignature(dataToSave);
      latestSnapshotRef.current = snapshotAtStart;
      saveInFlightRef.current = true;
      setActiveSaveSource(source);

      try {
        const result = await updateResumeMutation({ resumeId, data: dataToSave });
        setTitleDraft(dataToSave.title);
        setLastAcknowledgedSnapshot(snapshotAtStart);
        setSavedConfirmationVisible(true);
        if (savedConfirmationTimerRef.current) {
          window.clearTimeout(savedConfirmationTimerRef.current);
        }
        savedConfirmationTimerRef.current = window.setTimeout(() => {
          setSavedConfirmationVisible(false);
          savedConfirmationTimerRef.current = null;
        }, DOCUMENT_SAVED_CONFIRMATION_MS);

        if (result.created && onSave) {
          const savedResume = {
            ...mapBackendResumeToFrontend(result.resume_data),
            id: result.id,
          };
          onSave(savedResume);
        } else if (onSave) {
          onSave(dataToSave);
        }

        void queryClient.invalidateQueries({ queryKey: resumeAtsQueryKey(resumeId) });

        if (latestSnapshotRef.current !== snapshotAtStart) {
          queuedSaveRef.current = true;
        }
      } catch (error) {
        showToast("Failed to save resume. Please try again.", "error");
        console.error(error);
      } finally {
        saveInFlightRef.current = false;
        setActiveSaveSource(null);

        if (queuedSaveRef.current) {
          queuedSaveRef.current = false;
          if (runSaveRef.current) {
            void runSaveRef.current("auto");
          }
        }
      }
    },
    [onSave, resume, resumeId, showToast, titleDraft, updateResumeMutation]
  );

  const syncPrepareReturnFromUrl = useCallback(async () => {
    const parsed = parseResumePrepareSearchParams(searchParams);
    if (!parsed.jobId) return;

    const stored = getPrepareReturnSession();
    const navigate = parsed.navigate ?? stored?.navigate ?? "tracker";
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
        }
      } catch {
        // Partial banner labels are acceptable.
      }
    }

    const session: PrepareApplicationReturnSession = {
      jobId: parsed.jobId,
      tab: "resume",
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

  const handleSaveAndReturnToPrepare = async () => {
    if (!prepareReturn) return;
    await runSave("manual");
    await queryClient.invalidateQueries({ queryKey: ["resumes"] });
    await queryClient.invalidateQueries({ queryKey: resumeByIdQueryKey(resumeId) });
    await queryClient.invalidateQueries({ queryKey: ["applications"] });
    const { jobId, tab, navigate } = prepareReturn;
    clearPrepareReturnSession();
    setPrepareReturn(null);
    router.push(buildJobsPrepareReopenHref(jobId, tab, navigate));
  };

  const handleDismissPrepareReturn = () => {
    clearPrepareReturnSession();
    setPrepareReturn(null);
    const parsed = parseResumePrepareSearchParams(searchParams);
    if (parsed.resumeId) {
      router.replace(buildResumeAssetOnlyHref(parsed.resumeId), { scroll: false });
    }
  };

  useEffect(() => {
    useAdkResumeReviewStore.getState().registerSaveHandler(resumeId, async () => {
      await runSave("manual");
    });
    return () => {
      useAdkResumeReviewStore.getState().unregisterSaveHandler(resumeId);
    };
  }, [resumeId, runSave]);

  useEffect(() => {
    const onDiscard = (e: Event) => {
      const detail = (e as CustomEvent<{ resumeId: string; baselineJson: string }>).detail;
      if (!detail || detail.resumeId !== resumeId) return;
      try {
        const baseline = JSON.parse(detail.baselineJson) as ResumeData;
        setLastAcknowledgedSnapshot(getResumeContentSignature(baseline));
      } catch {
        setLastAcknowledgedSnapshot(detail.baselineJson);
      }
    };
    window.addEventListener("resume-adk-discard", onDiscard as EventListener);
    return () => window.removeEventListener("resume-adk-discard", onDiscard as EventListener);
  }, [resumeId]);

  useEffect(() => {
    runSaveRef.current = runSave;
  }, [runSave]);

  useEffect(() => {
    if (!hasPendingUnsavedChanges) return;

    const timer = window.setTimeout(() => {
      void runSave("auto");
    }, AUTOSAVE_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [hasPendingUnsavedChanges, runSave]);

  useEffect(() => {
    if (!hasPendingUnsavedChanges) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasPendingUnsavedChanges]);

  const handleBack = useCallback(() => {
    profileFieldsRef.current?.flushToStore();
    const stored = useResumeStore.getState().getResumeData(resumeId) ?? resume;
    const dataToSave = { ...stored, title: titleDraft };
    const snapshot = getResumeContentSignature(dataToSave);
    latestSnapshotRef.current = snapshot;
    const pending = snapshot !== lastAcknowledgedSnapshot;
    if (pending && runSaveRef.current) {
      void runSaveRef.current("auto").finally(onBack);
      return;
    }
    onBack();
  }, [lastAcknowledgedSnapshot, onBack, resume, resumeId, titleDraft]);

  const handleTemplateSelect = (id: string) => {
    updateResume(prev => ({ ...prev, templateId: id as ResumeTemplateId }));
    setShowTemplateModal(false);
  };

  // -- DnD Logic for Pills --
  const handleDragStart = (e: React.DragEvent, id: string) => {
    if (id === "profile") {
      e.preventDefault();
      return;
    }
    setDraggedSectionId(id);
    hideTooltip();
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    if (targetId === "profile") return;
    e.preventDefault();
    if (!draggedSectionId || draggedSectionId === targetId || draggedSectionId === "profile") return;
    lastSectionDropTargetRef.current = targetId;
  };

  const handleDragEnd = () => {
    const draggedId = draggedSectionId;
    const targetId = lastSectionDropTargetRef.current;
    setDraggedSectionId(null);
    lastSectionDropTargetRef.current = null;

    if (!draggedId || !targetId || draggedId === targetId || draggedId === "profile" || targetId === "profile") return;

    updateResume(prev => {
      const order = [...prev.sectionOrder];
      const draggedIdx = order.findIndex(s => s.id === draggedId);
      const targetIdx = order.findIndex(s => s.id === targetId);
      if (draggedIdx === -1 || targetIdx === -1) return prev;

      const [draggedItem] = order.splice(draggedIdx, 1);
      order.splice(targetIdx, 0, draggedItem);
      const profileItem = order.find(s => s.id === "profile");
      const withoutProfile = order.filter(s => s.id !== "profile");
      const normalizedOrder = profileItem ? [profileItem, ...withoutProfile] : withoutProfile;
      return { ...prev, sectionOrder: deduplicateSectionOrder(normalizedOrder) };
    });
  };

  // -- Visibility Toggle Handlers --
  const toggleSectionVisibility = (sectionId: string) => {
    updateResume(prev => ({
      ...prev,
      sectionOrder: prev.sectionOrder.map(s => (s.id === sectionId ? { ...s, hidden: !s.hidden } : s)),
    }));
  };

  const toggleItemVisibility = (sectionKey: "experience" | "education" | "skills", itemId: string) => {
    type VisibilityItem = ResumeExperience | ResumeEducation | ResumeSkill;
    updateResume(prev => ({
      ...prev,
      [sectionKey]: (prev[sectionKey] as VisibilityItem[]).map(item => (item.id === itemId ? { ...item, hidden: !item.hidden } : item)),
    }));
  };

  // -- DnD Logic for Items (Experience, Education, Custom) --
  const handleItemDragStart = (e: React.DragEvent, sectionId: string, itemId: string) => {
    setDraggedItemId(itemId);
    setDraggedItemSectionId(sectionId);
    e.stopPropagation(); // Prevent section drag
    e.dataTransfer.effectAllowed = "move";
  };

  const handleItemDragOver = (e: React.DragEvent, sectionId: string, targetItemId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedItemId || !draggedItemSectionId) return;
    if (draggedItemSectionId !== sectionId) return; // Cannot drag between sections for now
    if (draggedItemId === targetItemId) return;

    // Clone resume to mutate
    const newResume = { ...resume };

    if (sectionId === "experience") {
      const list = [...newResume.experience];
      const draggedIdx = list.findIndex(i => i.id === draggedItemId);
      const targetIdx = list.findIndex(i => i.id === targetItemId);
      if (draggedIdx !== -1 && targetIdx !== -1) {
        const [removed] = list.splice(draggedIdx, 1);
        list.splice(targetIdx, 0, removed);
        updateResume(prev => ({ ...prev, experience: list }));
      }
    } else if (sectionId === "education") {
      const list = [...newResume.education];
      const draggedIdx = list.findIndex(i => i.id === draggedItemId);
      const targetIdx = list.findIndex(i => i.id === targetItemId);
      if (draggedIdx !== -1 && targetIdx !== -1) {
        const [removed] = list.splice(draggedIdx, 1);
        list.splice(targetIdx, 0, removed);
        updateResume(prev => ({ ...prev, education: list }));
      }
    } else if (sectionId === "projects") {
      const list = [...newResume.projects];
      const draggedIdx = list.findIndex(i => i.id === draggedItemId);
      const targetIdx = list.findIndex(i => i.id === targetItemId);
      if (draggedIdx !== -1 && targetIdx !== -1) {
        const [removed] = list.splice(draggedIdx, 1);
        list.splice(targetIdx, 0, removed);
        updateResume(prev => ({ ...prev, projects: list }));
      }
    } else if (sectionId === "certifications") {
      const list = [...newResume.certifications];
      const draggedIdx = list.findIndex(i => i.id === draggedItemId);
      const targetIdx = list.findIndex(i => i.id === targetItemId);
      if (draggedIdx !== -1 && targetIdx !== -1) {
        const [removed] = list.splice(draggedIdx, 1);
        list.splice(targetIdx, 0, removed);
        updateResume(prev => ({ ...prev, certifications: list }));
      }
    } else {
      // Custom Section
      const sectionIdx = newResume.customSections.findIndex(s => s.id === sectionId);
      if (sectionIdx !== -1) {
        const list = [...newResume.customSections[sectionIdx].items];
        const draggedIdx = list.findIndex(i => i.id === draggedItemId);
        const targetIdx = list.findIndex(i => i.id === targetItemId);
        if (draggedIdx !== -1 && targetIdx !== -1) {
          const [removed] = list.splice(draggedIdx, 1);
          list.splice(targetIdx, 0, removed);
          const newCustomSections = [...newResume.customSections];
          newCustomSections[sectionIdx] = {
            ...newCustomSections[sectionIdx],
            items: list,
          };
          updateResume(prev => ({
            ...prev,
            customSections: newCustomSections,
          }));
        }
      }
    }
  };

  const handleItemDragEnd = (e: React.DragEvent) => {
    setDraggedItemId(null);
    setDraggedItemSectionId(null);
    e.stopPropagation();
  };

  const toggleItemExpand = (id: string) => {
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // -- Preview Pan & Zoom Logic --
  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target;
    if (target instanceof Element && target.closest("a[href], button, input, textarea, select, [role='button']")) {
      return;
    }

    setIsDragging(true);
    dragStart.current = {
      x: e.clientX - previewOffset.x,
      y: e.clientY - previewOffset.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPreviewOffset({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    // Simple wheel zoom
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = -e.deltaY;
      setPreviewScale(prev => Math.min(2.5, Math.max(0.3, prev + (delta > 0 ? 0.1 : -0.1))));
    }
  };

  // -- Icon Helper --
  const getSectionIcon = (id: string) => {
    switch (id) {
      case "profile":
        return <User size={18} />;
      case "experience":
        return <Briefcase size={18} />;
      case "education":
        return <GraduationCap size={18} />;
      case "skills":
        return <Code size={18} />;
      case "projects":
        return <FolderKanban size={18} />;
      case "certifications":
        return <Award size={18} />;
      default:
        return <LayoutTemplate size={18} />;
    }
  };

  // --- Renderers for Resume Preview ---
  const renderPreview = (isModal = false) => {
    const template = getTemplate(resume.templateId);
    if (!template) return null;

    return template.renderPreview(resume, { previewScale, isModal });
  };

  const resumeToolbarSaveStatus = (
    <div className="relative mx-1 flex h-8 w-40 items-center justify-end overflow-hidden text-sm transition-all duration-300 sm:w-48">
      <div
        className={`absolute right-0 flex items-center transition-all duration-300 ${savedConfirmationVisible && !hasPendingUnsavedChanges && !isSaving ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"}`}
      >
        <CheckCircle2 size={14} className="mr-1.5 text-emerald-500" />
        <span className="whitespace-nowrap text-xs font-medium text-slate-500 dark:text-slate-400">All changes saved</span>
      </div>
      <div
        className={`absolute right-0 flex items-center transition-all duration-300 ${isSaving ? "translate-y-0 opacity-100" : !hasPendingUnsavedChanges ? "pointer-events-none -translate-y-4 opacity-0" : "pointer-events-none translate-y-4 opacity-0"}`}
      >
        <RefreshCw size={14} className="mr-1.5 animate-spin text-slate-400" />
        <span className="whitespace-nowrap text-xs font-medium text-slate-500 dark:text-slate-400">
          {activeSaveSource === "manual" ? "Saving..." : "Autosaving..."}
        </span>
      </div>
      <div
        className={`absolute right-0 flex items-center transition-all duration-300 ${hasPendingUnsavedChanges && !isSaving ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-4 opacity-0"}`}
      >
        <span className="mr-2 whitespace-nowrap text-xs font-medium text-slate-500 dark:text-slate-400">Unsaved changes</span>
        <button
          type="button"
          onClick={() => void runSave("manual")}
          className="cursor-pointer whitespace-nowrap text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline dark:text-brand-400"
        >
          save
        </button>
      </div>
    </div>
  );

  const resumeToolbarTemplateButton = (
    <button
      type="button"
      onClick={() => setShowTemplateModal(true)}
      className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-all hover:border-brand-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
    >
      <LayoutTemplate size={16} />
      <span className="capitalize">{TEMPLATES.find(t => t.id === resume.templateId)?.name || "Template"}</span>
      <ChevronDown size={14} className="text-slate-400" />
    </button>
  );

  const resumeToolbarAtsButton = (
    <ActionHintTooltip
      enabled={atsGated}
      side="bottom"
      align="right"
      message={
        atsGate.ok
          ? ""
          : atsGate.reason === "fields" && atsGate.firstError
            ? formatResumeValidationMessage(atsGate.firstError)
            : atsGate.message
      }
      ctaLabel={atsGate.ok ? undefined : atsGate.reason === "fields" && atsGate.firstError ? "Go to field" : undefined}
      onCta={
        !atsGate.ok && atsGate.reason === "fields" && atsGate.firstError
          ? () => {
              setShowFieldValidation(true);
              goToFirstValidationError(atsGate.firstError!);
            }
          : undefined
      }
    >
      <button
        type="button"
        onClick={() => {
          if (atsGated) return;
          setShowAtsModal(true);
        }}
        disabled={atsGated}
        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all dark:border-slate-700 dark:bg-slate-800 ${
          atsGated
            ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 opacity-70 dark:text-slate-500"
            : "border-slate-200 bg-white text-slate-700 hover:border-brand-200 hover:shadow-md dark:text-slate-200"
        }`}
      >
        <TrendingUp size={16} className={atsPillScore == null ? "text-slate-400" : atsScoreClass} />
        <span className={atsGated ? "text-slate-400 dark:text-slate-500" : "text-slate-600 dark:text-slate-400"}>
          ATS Score:{" "}
          <span className={atsPillScore == null ? "text-slate-400" : atsScoreClass}>{atsPillScore == null ? "—" : atsPillScore}</span>
        </span>
      </button>
    </ActionHintTooltip>
  );

  return (
    <div className="flex h-full bg-slate-50 dark:bg-slate-900 font-sans relative overflow-hidden">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-20 right-6 z-[200] px-4 py-3 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2 animate-in slide-in-from-top-2 duration-200 ${
            toast.type === "error" ? "bg-red-50 text-red-700 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"
          }`}
        >
          {toast.type === "error" ? <AlertCircle size={16} /> : <Check size={16} />}
          {toast.message}
          <button onClick={() => setToast(null)} className="ml-2 opacity-60 hover:opacity-100">
            <X size={14} />
          </button>
        </div>
      )}
      {/* Top Toolbar — replaced by Prepare return bar when editing from application modal */}
      {prepareReturn ? (
        <div className="absolute top-0 right-0 left-0 z-20">
          <PrepareApplicationReturnBar
            session={prepareReturn}
            onSaveAndReturn={() => void handleSaveAndReturnToPrepare()}
            onDismiss={handleDismissPrepareReturn}
            actions={
              <>
                {resumeToolbarSaveStatus}
                {isPublishedResume ? <ResumePublishedBeacon label="Resume published" publishedAt={resume.publishedAt} /> : null}
                {resumeToolbarTemplateButton}
                {resumeToolbarAtsButton}
              </>
            }
          />
        </div>
      ) : (
        <div className="absolute top-0 right-0 left-0 z-20 flex h-16 items-center gap-4 border-b border-slate-200 bg-white/80 px-6 backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/80">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <button
              onClick={handleBack}
              className="shrink-0 rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="min-w-0 flex-1 max-w-xl">
              <input
                value={titleDraft}
                onChange={e => {
                  const nextTitle = e.target.value;
                  dismissAdkReviewOnManualEdit();
                  setTitleDraft(nextTitle);
                  updateResumeField(resumeId, "title", nextTitle);
                }}
                onBlur={() => {
                  profileFieldsRef.current?.flushToStore();
                  const stored = useResumeStore.getState().getResumeData(resumeId) ?? resume;
                  const snapshot = getResumeContentSignature({ ...stored, title: titleDraft });
                  latestSnapshotRef.current = snapshot;
                  if (snapshot !== lastAcknowledgedSnapshot && !saveInFlightRef.current) {
                    void runSave("manual");
                  }
                }}
                className="w-full truncate border-b border-transparent bg-transparent px-1 py-0.5 font-medium text-slate-900 outline-none transition-all hover:border-slate-300 focus:border-brand-500 dark:text-white dark:hover:border-slate-600"
                placeholder="Untitled Resume"
              />
            </div>
          </div>

          <div className="ml-auto flex shrink-0 flex-nowrap items-center gap-2 sm:gap-3">
            {resumeToolbarSaveStatus}
            {isPublishedResume ? <ResumePublishedBeacon label="Resume published" publishedAt={resume.publishedAt} /> : null}
            {resumeToolbarTemplateButton}
            {resumeToolbarAtsButton}

            <div className="relative" ref={exportDropdownRef}>
              <ActionHintTooltip
                enabled={validationErrors.length > 0}
                side="bottom"
                message={validationErrors[0] ? formatResumeValidationMessage(validationErrors[0]) : "Please fill in all required fields."}
                ctaLabel="Go to field"
                align="right"
                onCta={() => {
                  if (!validationErrors[0]) return;
                  setShowFieldValidation(true);
                  goToFirstValidationError(validationErrors[0]);
                }}
              >
                <button
                  type="button"
                  onClick={handleExportClick}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all shadow-md ${
                    validationErrors.length > 0
                      ? "bg-slate-400 hover:bg-slate-500 text-white"
                      : "bg-slate-900 hover:bg-slate-800 text-white hover:shadow-lg hover:-translate-y-0.5"
                  }`}
                >
                  <Share2 size={16} /> Share & Download
                </button>
              </ActionHintTooltip>

              {isExportDropdownOpen && (
                <div
                  className={`absolute right-0 mt-2 rounded-md border border-slate-200 bg-white shadow-lg z-50 dark:border-slate-700 dark:bg-slate-900 ${
                    inlinePublishStep === "form" ? "w-80 p-3" : "w-56 py-1"
                  }`}
                >
                  {inlinePublishStep === "cta" ? (
                    <>
                      <button
                        type="button"
                        onClick={() => void handleDownloadPdf()}
                        disabled={isDownloadingPdf}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        <Download size={16} className="text-slate-500" />
                        <span className="font-medium">{isDownloadingPdf ? "Preparing PDF…" : "Download PDF"}</span>
                        {isDownloadingPdf && (
                          <div className="ml-auto h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                        )}
                      </button>
                      {isPublishedResume ? (
                        <button
                          type="button"
                          onClick={() => void handleCopyPublicLink()}
                          className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                            copiedPublicLink
                              ? "bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-300"
                              : "text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                          }`}
                        >
                          {copiedPublicLink ? (
                            <Check size={16} className="text-brand-600" />
                          ) : (
                            <Link size={16} className="text-slate-500" />
                          )}
                          <span className="font-medium">{copiedPublicLink ? "Copied" : "Copy public link"}</span>
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={handleEnterPublishMode}
                        disabled={!isPersistedResumeId(resumeId)}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        <Share2 size={16} className="text-slate-500" />
                        <span className="font-medium">{isPublishedResume ? "Update public link" : "Share Public Link"}</span>
                      </button>
                    </>
                  ) : (
                    <div className="space-y-3 text-left">
                      <button
                        type="button"
                        onClick={() => setInlinePublishStep("cta")}
                        className="flex items-center gap-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-slate-700 dark:hover:text-slate-300"
                      >
                        <ArrowLeft size={14} />
                        Back
                      </button>

                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">Publish your resume</p>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Choose a public link name, then share</p>
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="resume-public-slug" className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                          Public link name
                        </label>
                        <p id="resume-public-slug-hint" className="text-xs text-slate-500 dark:text-slate-400">
                          Use letters, numbers, or hyphens.
                        </p>
                        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
                          <span className="shrink-0 truncate font-mono text-xs text-slate-500" aria-hidden>
                            {typeof window !== "undefined" ? `${window.location.origin}/resume/` : "/resume/"}
                          </span>
                          <input
                            id="resume-public-slug"
                            type="text"
                            autoComplete="off"
                            placeholder="your-name"
                            value={slugInput}
                            onChange={e => {
                              setSlugInput(e.target.value);
                              if (publishError) setPublishError(null);
                              if (publishShowPublished) setPublishShowPublished(false);
                            }}
                            onKeyDown={handlePublishSlugKeyDown}
                            disabled={publishSubmitting || publishShowPublished}
                            aria-describedby="resume-public-slug-hint"
                            aria-invalid={Boolean(publishError)}
                            className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 disabled:opacity-60 dark:text-white"
                          />
                        </div>
                        {publishError ? (
                          <p className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400" role="alert">
                            <AlertCircle size={14} className="shrink-0" />
                            {publishError}
                          </p>
                        ) : null}
                      </div>

                      <button
                        type="button"
                        onClick={() => void handleSharePublicLinkSubmit()}
                        disabled={publishSubmitting || publishShowPublished || !slugInput.trim()}
                        aria-busy={publishSubmitting}
                        className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                          publishShowPublished
                            ? "cursor-default bg-emerald-600 text-white"
                            : publishSubmitting
                              ? "cursor-wait bg-brand-600 text-white"
                              : !slugInput.trim()
                                ? "cursor-not-allowed bg-slate-300 text-slate-600 dark:bg-slate-600 dark:text-slate-300"
                                : "bg-brand-600 text-white hover:bg-brand-700"
                        }`}
                      >
                        {publishSubmitting ? (
                          <>
                            <span>Publishing…</span>
                            <div
                              className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-white border-t-transparent"
                              aria-hidden
                            />
                          </>
                        ) : publishShowPublished ? (
                          <>
                            <Check size={18} className="shrink-0" aria-hidden />
                            <span>Published</span>
                          </>
                        ) : (
                          "Publish"
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden pt-16">
        {" "}
        {/* Added pt-16 to offset fixed toolbar */}
        {/* 1. Navigation Sidebar (Vertical) - Compact Icon Only */}
        <div className="w-[72px] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 flex flex-col h-full overflow-hidden flex-shrink-0 z-10 items-center">
          <div className="h-4 flex-shrink-0 w-full" />

          <div className="flex-1 overflow-y-auto w-full p-3 space-y-3 scrollbar-on-hover flex flex-col items-center">
            {resume.sectionOrder.map(secItem => {
              const secId = secItem.id;
              const isReorderableSection = secId !== "profile";
              let label = "";
              if (secId === "profile") label = "Profile";
              else if (secId === "experience") label = "Experience";
              else if (secId === "education") label = "Education";
              else if (secId === "skills") label = "Skills";
              else if (secId === "projects") label = "Projects";
              else if (secId === "certifications") label = "Certifications";
              else label = resume.customSections.find(s => s.id === secId)?.title || "Untitled";

              return (
                <div key={secId} className="relative group/sec flex flex-col items-center">
                  <div
                    draggable={isReorderableSection}
                    onDragStart={e => handleDragStart(e, secId)}
                    onDragOver={e => handleDragOver(e, secId)}
                    onDragEnd={handleDragEnd}
                    onClick={() => setActiveSection(secId)}
                    onMouseEnter={e => showTooltip(e, label)}
                    onMouseLeave={hideTooltip}
                    className={`
                                            w-10 h-10 flex items-center justify-center rounded-xl transition-all select-none relative
                                            ${isReorderableSection ? "cursor-move" : "cursor-pointer"}
                                            ${
                                              activeSection === secId
                                                ? "bg-brand-600 text-white shadow-md scale-105"
                                                : secItem.hidden
                                                  ? "text-slate-300 bg-slate-50 dark:text-slate-600 dark:bg-slate-800/50"
                                                  : "text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                                            }
                                            ${draggedSectionId === secId ? "opacity-50" : ""}
                                        `}
                  >
                    {getSectionIcon(secId)}
                  </div>
                </div>
              );
            })}

            <div className="w-full h-px bg-slate-100 dark:bg-slate-700 my-2"></div>

            <button
              onClick={addCustomSection}
              onMouseEnter={e => showTooltip(e, "Add Section")}
              onMouseLeave={hideTooltip}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-brand-50 hover:text-brand-600 transition-colors group relative"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>
        {/* 2. Forms Panel */}
        <div className={`flex h-full shrink-0 ${isFormsPanelResizing ? "select-none" : ""}`}>
          <div
            className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden border-r border-slate-200/60 bg-white dark:border-slate-700/60 dark:bg-slate-900"
            style={{ width: formsPanelWidth }}
          >
            <div className="scrollbar-on-hover flex-1 overflow-y-auto bg-white p-6 dark:bg-slate-900">
              {activeSection === "profile" && (
                <ResumePersonalDetailsFields
                  ref={profileFieldsRef}
                  profile={resume.profile}
                  onProfileSync={handleProfileSync}
                  validationErrors={validationErrors}
                  showFieldValidation={showFieldValidation}
                  onImprove={onImprove}
                  resumeId={resumeId}
                />
              )}

              {activeSection === "experience" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-left-2 duration-200">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-medium text-slate-900 dark:text-white flex items-center gap-2">Experience</h2>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleSectionVisibility("experience")}
                        className={`p-1.5 rounded-full transition-colors ${resume.sectionOrder.find(s => s.id === "experience")?.hidden ? "text-amber-400 hover:text-amber-500 bg-amber-50" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"}`}
                        title={
                          resume.sectionOrder.find(s => s.id === "experience")?.hidden
                            ? "Show section in preview"
                            : "Hide section from preview"
                        }
                      >
                        {resume.sectionOrder.find(s => s.id === "experience")?.hidden ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button
                        onClick={addExperience}
                        className="text-xs font-medium text-brand-600 hover:text-brand-700 bg-brand-50 px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors"
                      >
                        <Plus size={14} /> Add
                      </button>
                    </div>
                  </div>

                  {resume.experience.map((exp, index) => (
                    <div
                      key={exp.id}
                      className={`py-3 px-4 bg-slate-50 dark:bg-slate-800 rounded-xl border relative group transition-all hover:border-brand-200 ${draggedItemId === exp.id ? "opacity-50 border-brand-400 border-dashed" : "border-slate-200 dark:border-slate-700"}`}
                      draggable
                      onDragStart={e => handleItemDragStart(e, "experience", exp.id)}
                      onDragOver={e => handleItemDragOver(e, "experience", exp.id)}
                      onDragEnd={handleItemDragEnd}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <div
                          className="flex items-center gap-2 cursor-pointer select-none flex-1 min-w-0"
                          onClick={() => toggleItemExpand(exp.id)}
                        >
                          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate pr-4">
                            {exp.role || "New Role"} <span className="text-slate-400 font-normal">at</span> {exp.company || "Company"}
                          </h3>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              toggleItemVisibility("experience", exp.id);
                            }}
                            className={`p-1 rounded transition-colors ${exp.hidden ? "text-amber-400 hover:text-amber-500" : "text-slate-400 hover:text-slate-600"}`}
                            title={exp.hidden ? "Show item" : "Hide item"}
                          >
                            {exp.hidden ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                          <button
                            onClick={() => requestRemoveEntry("experience", exp.id)}
                            className="text-slate-400 hover:text-red-500 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      {expandedItems[exp.id] && (
                        <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-700 mt-2">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <input
                                id={resumeFieldDomId("experience", "role", exp.id)}
                                placeholder="Role"
                                value={exp.role}
                                onChange={e => updateExperience(exp.id, "role", e.target.value)}
                                className={`w-full p-3 bg-white dark:bg-slate-700 border rounded-lg text-sm font-medium text-slate-900 dark:text-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all dark:placeholder:text-slate-400 ${getError("experience", "role", exp.id) ? "border-red-500" : "border-slate-200 dark:border-slate-600"}`}
                              />
                              <ResumeFieldError
                                errors={validationErrors}
                                section="experience"
                                field="role"
                                id={exp.id}
                                visible={showFieldValidation}
                              />
                            </div>
                            <div>
                              <input
                                id={resumeFieldDomId("experience", "company", exp.id)}
                                placeholder="Company"
                                value={exp.company}
                                onChange={e => updateExperience(exp.id, "company", e.target.value)}
                                className={`w-full p-3 bg-white dark:bg-slate-700 border rounded-lg text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all dark:text-white dark:placeholder:text-slate-400 ${getError("experience", "company", exp.id) ? "border-red-500" : "border-slate-200 dark:border-slate-600"}`}
                              />
                              <ResumeFieldError
                                errors={validationErrors}
                                section="experience"
                                field="company"
                                id={exp.id}
                                visible={showFieldValidation}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <MonthYearPicker
                                id={resumeFieldDomId("experience", "startDate", exp.id)}
                                placeholder="Start Date"
                                value={exp.startDate}
                                onChange={val => updateExperience(exp.id, "startDate", val)}
                                className={`${getError("experience", "startDate", exp.id) ? "border-red-500" : "border-slate-200 dark:border-slate-600"}`}
                              />
                              <ResumeFieldError
                                errors={validationErrors}
                                section="experience"
                                field="startDate"
                                id={exp.id}
                                visible={showFieldValidation}
                              />
                            </div>
                            <div>
                              <MonthYearPicker
                                id={resumeFieldDomId("experience", "endDate", exp.id)}
                                disabled={exp.current}
                                min={exp.startDate}
                                placeholder={exp.current ? "Ongoing" : "End Date"}
                                value={exp.current ? "Present" : exp.endDate}
                                onChange={val => {
                                  if (val === "Present") {
                                    updateExperience(exp.id, "current", true);
                                    updateExperience(exp.id, "endDate", "");
                                    return;
                                  }
                                  updateExperience(exp.id, "current", false);
                                  updateExperience(exp.id, "endDate", val);
                                }}
                                align="right"
                                allowPresent
                                className={`${getError("experience", "endDate", exp.id) ? "border-red-500" : "border-slate-200 dark:border-slate-600"}`}
                              />
                              <ResumeFieldError
                                errors={validationErrors}
                                section="experience"
                                field="endDate"
                                id={exp.id}
                                visible={showFieldValidation}
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <input
                              type="checkbox"
                              id={`current-exp-${exp.id}`}
                              checked={exp.current || false}
                              onChange={e => {
                                updateExperience(exp.id, "current", e.target.checked);
                                if (e.target.checked) updateExperience(exp.id, "endDate", "");
                              }}
                              className="rounded text-brand-600 focus:ring-brand-500 border-slate-300"
                            />
                            <label
                              htmlFor={`current-exp-${exp.id}`}
                              className="text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none"
                            >
                              Currently working here
                            </label>
                          </div>
                          <input
                            placeholder="Location (City, Country)"
                            value={exp.location || ""}
                            onChange={e => updateExperience(exp.id, "location", e.target.value)}
                            className="w-full p-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all dark:text-white dark:placeholder:text-slate-400"
                          />
                          <TiptapEditor
                            placeholder="Description of your role (achievements, responsibilities)..."
                            value={exp.description}
                            onChange={val => updateExperience(exp.id, "description", val)}
                            onImprove={onImprove}
                            unibotImproveTarget={{ section: "experience", resumeId, entryId: exp.id }}
                          />
                        </div>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addExperience}
                    className="w-full py-3 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-brand-300 text-slate-500 dark:text-slate-400 hover:text-brand-600 font-medium flex items-center justify-center gap-2 transition-all"
                  >
                    <Plus size={18} /> Add Experience
                  </button>
                </div>
              )}

              {activeSection === "education" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-left-2 duration-200">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-medium text-slate-900 dark:text-white flex items-center gap-2">Education</h2>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleSectionVisibility("education")}
                        className={`p-1.5 rounded-full transition-colors ${resume.sectionOrder.find(s => s.id === "education")?.hidden ? "text-amber-400 hover:text-amber-500 bg-amber-50" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"}`}
                        title={
                          resume.sectionOrder.find(s => s.id === "education")?.hidden
                            ? "Show section in preview"
                            : "Hide section from preview"
                        }
                      >
                        {resume.sectionOrder.find(s => s.id === "education")?.hidden ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button
                        onClick={addEducation}
                        className="text-xs font-medium text-brand-600 hover:text-brand-700 bg-brand-50 px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors"
                      >
                        <Plus size={14} /> Add
                      </button>
                    </div>
                  </div>

                  {resume.education.map((edu, index) => (
                    <div
                      key={edu.id}
                      className={`py-3 px-4 bg-slate-50 dark:bg-slate-800 rounded-xl border relative group transition-all hover:border-brand-200 ${draggedItemId === edu.id ? "opacity-50 border-brand-400 border-dashed" : "border-slate-200 dark:border-slate-700"}`}
                      draggable
                      onDragStart={e => handleItemDragStart(e, "education", edu.id)}
                      onDragOver={e => handleItemDragOver(e, "education", edu.id)}
                      onDragEnd={handleItemDragEnd}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <div
                          className="flex items-center gap-2 cursor-pointer select-none flex-1 min-w-0"
                          onClick={() => toggleItemExpand(edu.id)}
                        >
                          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate pr-4">
                            {edu.school || "University"}
                          </h3>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              toggleItemVisibility("education", edu.id);
                            }}
                            className={`p-1 rounded transition-colors ${edu.hidden ? "text-amber-400 hover:text-amber-500" : "text-slate-400 hover:text-slate-600"}`}
                            title={edu.hidden ? "Show item" : "Hide item"}
                          >
                            {edu.hidden ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                          <button
                            onClick={() => requestRemoveEntry("education", edu.id)}
                            className="text-slate-400 hover:text-red-500 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      {expandedItems[edu.id] && (
                        <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-700 mt-2">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <input
                                id={resumeFieldDomId("education", "school", edu.id)}
                                placeholder="School/University"
                                value={edu.school}
                                onChange={e => updateEducation(edu.id, "school", e.target.value)}
                                className={`w-full p-3 bg-white dark:bg-slate-700 border rounded-lg text-sm font-medium text-slate-900 dark:text-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all dark:placeholder:text-slate-400 ${getError("education", "school", edu.id) ? "border-red-500" : "border-slate-200 dark:border-slate-600"}`}
                              />
                              <ResumeFieldError
                                errors={validationErrors}
                                section="education"
                                field="school"
                                id={edu.id}
                                visible={showFieldValidation}
                              />
                            </div>
                            <div>
                              <input
                                id={resumeFieldDomId("education", "degree", edu.id)}
                                placeholder="Degree/Major"
                                value={edu.degree}
                                onChange={e => updateEducation(edu.id, "degree", e.target.value)}
                                className={`w-full p-3 bg-white dark:bg-slate-700 border rounded-lg text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all dark:text-white dark:placeholder:text-slate-400 ${getError("education", "degree", edu.id) ? "border-red-500" : "border-slate-200 dark:border-slate-600"}`}
                              />
                              <ResumeFieldError
                                errors={validationErrors}
                                section="education"
                                field="degree"
                                id={edu.id}
                                visible={showFieldValidation}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <MonthYearPicker
                                id={resumeFieldDomId("education", "startDate", edu.id)}
                                placeholder="Start Date"
                                value={edu.startDate}
                                onChange={val => updateEducation(edu.id, "startDate", val)}
                                className={`${getError("education", "startDate", edu.id) ? "border-red-500" : "border-slate-200 dark:border-slate-600"}`}
                              />
                              <ResumeFieldError
                                errors={validationErrors}
                                section="education"
                                field="startDate"
                                id={edu.id}
                                visible={showFieldValidation}
                              />
                            </div>
                            <div>
                              <MonthYearPicker
                                id={resumeFieldDomId("education", "endDate", edu.id)}
                                disabled={edu.current}
                                min={edu.startDate}
                                placeholder={edu.current ? "Ongoing" : "End Date"}
                                value={edu.current ? "Present" : edu.endDate}
                                onChange={val => {
                                  if (val === "Present") {
                                    updateEducation(edu.id, "current", true);
                                    updateEducation(edu.id, "endDate", "");
                                    return;
                                  }
                                  updateEducation(edu.id, "current", false);
                                  updateEducation(edu.id, "endDate", val);
                                }}
                                align="right"
                                allowPresent
                                className={`${getError("education", "endDate", edu.id) ? "border-red-500" : "border-slate-200 dark:border-slate-600"}`}
                              />
                              <ResumeFieldError
                                errors={validationErrors}
                                section="education"
                                field="endDate"
                                id={edu.id}
                                visible={showFieldValidation}
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <input
                              type="checkbox"
                              id={`current-edu-${edu.id}`}
                              checked={edu.current || false}
                              onChange={e => {
                                updateEducation(edu.id, "current", e.target.checked);
                                if (e.target.checked) updateEducation(edu.id, "endDate", "");
                              }}
                              className="rounded text-brand-600 focus:ring-brand-500 border-slate-300"
                            />
                            <label
                              htmlFor={`current-edu-${edu.id}`}
                              className="text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none"
                            >
                              Currently studying here
                            </label>
                          </div>
                          <input
                            placeholder="Location"
                            value={edu.location || ""}
                            onChange={e => updateEducation(edu.id, "location", e.target.value)}
                            className="w-full p-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all dark:text-white dark:placeholder:text-slate-400"
                          />
                          <TiptapEditor
                            placeholder="Description (Optional)"
                            value={edu.description || ""}
                            onChange={val => updateEducation(edu.id, "description", val)}
                            onImprove={onImprove}
                            unibotImproveTarget={{ section: "education", resumeId, entryId: edu.id }}
                          />
                        </div>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addEducation}
                    className="w-full py-3 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-brand-300 text-slate-500 dark:text-slate-400 hover:text-brand-600 font-medium flex items-center justify-center gap-2 transition-all"
                  >
                    <Plus size={18} /> Add Education
                  </button>
                </div>
              )}

              {activeSection === "skills" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-left-2 duration-200">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-medium text-slate-900 dark:text-white flex items-center gap-2">Skills</h2>
                      <button
                        onClick={() => toggleSectionVisibility("skills")}
                        className={`p-1.5 rounded-full transition-colors ${
                          resume.sectionOrder.find(s => s.id === "skills")?.hidden
                            ? "text-amber-400 hover:text-amber-500 bg-amber-50"
                            : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                        }`}
                        title={
                          resume.sectionOrder.find(s => s.id === "skills")?.hidden ? "Show section in preview" : "Hide section from preview"
                        }
                      >
                        {resume.sectionOrder.find(s => s.id === "skills")?.hidden ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                    <button
                      onClick={addSkillCategory}
                      className="text-xs font-medium text-brand-600 hover:text-brand-700 bg-brand-50 px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors"
                    >
                      <Plus size={14} /> Add Category
                    </button>
                  </div>

                  {!(resume.skillCategories && resume.skillCategories.length > 0) && (
                    <div className="text-sm text-slate-500 italic pb-2">No categories yet. Add a category to start organizing skills.</div>
                  )}

                  {(resume.skillCategories || []).map(cat => (
                    <div
                      key={cat.id}
                      className="py-3 px-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 mb-4"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <input
                          value={cat.name}
                          onChange={e => updateSkillCategory(cat.id, e.target.value)}
                          placeholder="Category name (e.g. Languages)"
                          className="font-medium text-slate-900 dark:text-white bg-transparent outline-none flex-1 focus:border-b border-brand-500 pb-1 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                        />
                        <button
                          onClick={() => requestRemoveSkillCategory(cat.id)}
                          className="text-slate-400 hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {resume.skills
                          .filter(skill => skill.categoryId === cat.id)
                          .map(skill => (
                            <div
                              key={skill.id}
                              className="flex min-w-0 max-w-full items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full hover:border-brand-300 hover:bg-brand-50/10 transition-all group/skill"
                            >
                              <input
                                value={skill.name}
                                onChange={e => updateSkill(skill.id, e.target.value)}
                                placeholder="Skill name"
                                className="min-w-[4ch] max-w-full flex-1 bg-transparent text-sm focus:outline-none dark:text-white dark:placeholder:text-slate-400"
                              />
                              <button
                                onClick={() => removeSkill(skill.id)}
                                className="shrink-0 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full p-0.5 transition-colors"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}

                        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100/50 dark:bg-slate-800/50 border border-dashed border-slate-300 dark:border-slate-700 rounded-full focus-within:border-brand-400 transition-all">
                          <Plus size={12} className="text-slate-400" />
                          <input
                            placeholder="Add Skill..."
                            className="bg-transparent text-sm focus:outline-none dark:text-white dark:placeholder:text-slate-500 w-24"
                            onKeyDown={e => {
                              if (e.key !== "Enter") return;
                              const value = e.currentTarget.value.trim();
                              if (!value) return;
                              addSkill(cat.id, value);
                              e.currentTarget.value = "";
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {resume.skills.filter(skill => !skill.categoryId).length > 0 && (
                    <div className="p-4 bg-orange-50 dark:bg-orange-900/10 rounded-xl border border-orange-200 dark:border-orange-800/30 mb-4">
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <input
                          defaultValue="Uncategorized Skills"
                          onBlur={e => renameUncategorizedSkills(e.target.value)}
                          onKeyDown={e => {
                            if (e.key !== "Enter") return;
                            renameUncategorizedSkills(e.currentTarget.value);
                            e.currentTarget.blur();
                          }}
                          className="min-w-0 flex-1 bg-transparent text-sm font-medium text-orange-800 dark:text-orange-400 outline-none border-b border-transparent focus:border-orange-300"
                          aria-label="Rename uncategorized skills group"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {resume.skills
                          .filter(skill => !skill.categoryId)
                          .map(skill => (
                            <div
                              key={skill.id}
                              className="flex items-center gap-2 p-2 bg-white dark:bg-slate-800 border border-orange-200 dark:border-orange-800/30 rounded-lg"
                            >
                              <input
                                value={skill.name}
                                onChange={e => updateSkill(skill.id, e.target.value)}
                                className="flex-1 min-w-0 bg-transparent text-sm focus:outline-none dark:text-white dark:placeholder:text-slate-400"
                              />
                              <button
                                onClick={() => removeSkill(skill.id)}
                                className="flex-shrink-0 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full p-0.5 transition-colors"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))}
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100/50 dark:bg-slate-800/50 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg focus-within:border-brand-400 transition-all">
                          <Plus size={12} className="text-slate-400" />
                          <input
                            placeholder="Add Skill..."
                            className="bg-transparent text-sm focus:outline-none dark:text-white dark:placeholder:text-slate-500 w-full"
                            onKeyDown={e => {
                              if (e.key !== "Enter") return;
                              const value = e.currentTarget.value.trim();
                              if (!value) return;
                              addSkill(undefined, value);
                              e.currentTarget.value = "";
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeSection === "projects" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-left-2 duration-200">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-medium text-slate-900 dark:text-white flex items-center gap-2">Projects</h2>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleSectionVisibility("projects")}
                        className={`p-1.5 rounded-full transition-colors ${resume.sectionOrder.find(s => s.id === "projects")?.hidden ? "text-amber-400 hover:text-amber-500 bg-amber-50" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"}`}
                        title={
                          resume.sectionOrder.find(s => s.id === "projects")?.hidden
                            ? "Show section in preview"
                            : "Hide section from preview"
                        }
                      >
                        {resume.sectionOrder.find(s => s.id === "projects")?.hidden ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button
                        onClick={addProject}
                        className="text-xs font-medium text-brand-600 hover:text-brand-700 bg-brand-50 px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors"
                      >
                        <Plus size={14} /> Add
                      </button>
                    </div>
                  </div>

                  {resume.projects.map(proj => (
                    <div
                      key={proj.id}
                      className={`py-3 px-4 bg-slate-50 dark:bg-slate-800 rounded-xl border relative group transition-all hover:border-brand-200 ${proj.hidden ? "opacity-60" : ""} ${draggedItemId === proj.id ? "opacity-50 border-brand-400 border-dashed" : "border-slate-200 dark:border-slate-700"}`}
                      draggable
                      onDragStart={e => handleItemDragStart(e, "projects", proj.id)}
                      onDragOver={e => handleItemDragOver(e, "projects", proj.id)}
                      onDragEnd={handleItemDragEnd}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <div
                          className="flex items-center gap-2 cursor-pointer select-none flex-1 min-w-0"
                          onClick={() => toggleItemExpand(proj.id)}
                        >
                          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate pr-4">
                            {proj.title || "New Project"}
                          </h3>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              updateProject(proj.id, "hidden", !proj.hidden);
                            }}
                            className={`p-1 rounded transition-colors ${proj.hidden ? "text-amber-400 hover:text-amber-500" : "text-slate-400 hover:text-slate-600"}`}
                            title={proj.hidden ? "Show item" : "Hide item"}
                          >
                            {proj.hidden ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                          <button
                            onClick={() => requestRemoveEntry("projects", proj.id)}
                            className="text-slate-400 hover:text-red-500 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      {expandedItems[proj.id] && (
                        <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-700 mt-2">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <input
                                id={resumeFieldDomId("projects", "title", proj.id)}
                                placeholder="Project Title"
                                value={proj.title}
                                onChange={e => updateProject(proj.id, "title", e.target.value)}
                                className={`w-full p-3 bg-white dark:bg-slate-700 border rounded-lg text-sm font-medium text-slate-900 dark:text-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all dark:placeholder:text-slate-400 ${getError("projects", "title", proj.id) ? "border-red-500" : "border-slate-200 dark:border-slate-600"}`}
                              />
                              <ResumeFieldError
                                errors={validationErrors}
                                section="projects"
                                field="title"
                                id={proj.id}
                                visible={showFieldValidation}
                              />
                            </div>
                            <div>
                              <input
                                id={resumeFieldDomId("projects", "url", proj.id)}
                                placeholder="Project URL"
                                value={proj.url || ""}
                                onChange={e => updateProject(proj.id, "url", e.target.value)}
                                className={`w-full p-3 bg-white dark:bg-slate-700 border rounded-lg text-sm text-slate-900 dark:text-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all dark:placeholder:text-slate-400 ${getError("projects", "url", proj.id) ? "border-red-500" : "border-slate-200 dark:border-slate-600"}`}
                              />
                              <ResumeFieldError
                                errors={validationErrors}
                                section="projects"
                                field="url"
                                id={proj.id}
                                visible={showFieldValidation}
                              />
                            </div>
                          </div>
                          <TiptapEditor
                            value={proj.description}
                            onChange={html => updateProject(proj.id, "description", html)}
                            onImprove={onImprove}
                            unibotImproveTarget={{ section: "projects", resumeId, entryId: proj.id }}
                            placeholder="Description of the Project..."
                          />
                        </div>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addProject}
                    className="w-full py-3 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-brand-300 text-slate-500 dark:text-slate-400 hover:text-brand-600 font-medium flex items-center justify-center gap-2 transition-all"
                  >
                    <Plus size={18} /> Add Project
                  </button>
                </div>
              )}

              {activeSection === "certifications" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-left-2 duration-200">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-medium text-slate-900 dark:text-white flex items-center gap-2">Certifications</h2>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleSectionVisibility("certifications")}
                        className={`p-1.5 rounded-full transition-colors ${resume.sectionOrder.find(s => s.id === "certifications")?.hidden ? "text-amber-400 hover:text-amber-500 bg-amber-50" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"}`}
                        title={
                          resume.sectionOrder.find(s => s.id === "certifications")?.hidden
                            ? "Show section in preview"
                            : "Hide section from preview"
                        }
                      >
                        {resume.sectionOrder.find(s => s.id === "certifications")?.hidden ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button
                        onClick={addCertification}
                        className="text-xs font-medium text-brand-600 hover:text-brand-700 bg-brand-50 px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors"
                      >
                        <Plus size={14} /> Add
                      </button>
                    </div>
                  </div>

                  {resume.certifications.map(cert => (
                    <div
                      key={cert.id}
                      className={`py-3 px-4 bg-slate-50 dark:bg-slate-800 rounded-xl border relative group transition-all hover:border-brand-200 ${draggedItemId === cert.id ? "opacity-50 border-brand-400 border-dashed" : "border-slate-200 dark:border-slate-700"} ${cert.hidden && draggedItemId !== cert.id ? "opacity-60" : ""}`}
                      draggable
                      onDragStart={e => handleItemDragStart(e, "certifications", cert.id)}
                      onDragOver={e => handleItemDragOver(e, "certifications", cert.id)}
                      onDragEnd={handleItemDragEnd}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <div
                          className="flex items-center gap-2 cursor-pointer select-none flex-1 min-w-0"
                          onClick={() => toggleItemExpand(cert.id)}
                        >
                          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate pr-4">
                            {cert.title || "New Certification"}
                          </h3>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              updateCertification(cert.id, "hidden", !cert.hidden);
                            }}
                            className={`p-1 rounded transition-colors ${cert.hidden ? "text-amber-400 hover:text-amber-500" : "text-slate-400 hover:text-slate-600"}`}
                            title={cert.hidden ? "Show item" : "Hide item"}
                          >
                            {cert.hidden ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                          <button
                            onClick={() => requestRemoveEntry("certifications", cert.id)}
                            className="text-slate-400 hover:text-red-500 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      {expandedItems[cert.id] && (
                        <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-700 mt-2">
                          <div>
                            <input
                              id={resumeFieldDomId("certifications", "title", cert.id)}
                              placeholder="Certification Title"
                              value={cert.title}
                              onChange={e => updateCertification(cert.id, "title", e.target.value)}
                              className={`w-full p-3 bg-white dark:bg-slate-700 border rounded-lg text-sm font-medium text-slate-900 dark:text-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all dark:placeholder:text-slate-400 ${getError("certifications", "title", cert.id) ? "border-red-500" : "border-slate-200 dark:border-slate-600"}`}
                            />
                            <ResumeFieldError
                              errors={validationErrors}
                              section="certifications"
                              field="title"
                              id={cert.id}
                              visible={showFieldValidation}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <input
                                placeholder="Issuer"
                                value={cert.issuer || ""}
                                onChange={e => updateCertification(cert.id, "issuer", e.target.value)}
                                className="w-full p-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all dark:placeholder:text-slate-400"
                              />
                            </div>
                            <div>
                              <MonthYearPicker
                                placeholder="Date"
                                value={cert.date || ""}
                                max={new Date().toISOString().slice(0, 7)}
                                onChange={val => updateCertification(cert.id, "date", val)}
                                align="right"
                                className="border-slate-200 dark:border-slate-600"
                              />
                            </div>
                          </div>
                          <div>
                            <input
                              id={resumeFieldDomId("certifications", "credentialUrl", cert.id)}
                              placeholder="Credential URL"
                              value={cert.credentialUrl || ""}
                              onChange={e => updateCertification(cert.id, "credentialUrl", e.target.value)}
                              className={`w-full p-3 bg-white dark:bg-slate-700 border rounded-lg text-sm text-slate-900 dark:text-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all dark:placeholder:text-slate-400 ${getError("certifications", "credentialUrl", cert.id) ? "border-red-500" : "border-slate-200 dark:border-slate-600"}`}
                            />
                            <ResumeFieldError
                              errors={validationErrors}
                              section="certifications"
                              field="credentialUrl"
                              id={cert.id}
                              visible={showFieldValidation}
                            />
                          </div>
                          <TiptapEditor
                            value={cert.description || ""}
                            onChange={html => updateCertification(cert.id, "description", html)}
                            onImprove={onImprove}
                            unibotImproveTarget={{ section: "certifications", resumeId, entryId: cert.id }}
                            placeholder="Description of the certification..."
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {resume.customSections.map(sec => {
                if (activeSection !== sec.id) return null;
                return (
                  <div key={sec.id} className="space-y-6 animate-in fade-in slide-in-from-left-2 duration-200">
                    <div className="flex flex-col gap-4 mb-4">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">
                            Section Title
                          </label>
                          <input
                            id={resumeFieldDomId("custom", "title", sec.id)}
                            value={normalizeCustomSectionTitle(sec.title)}
                            onChange={e => updateCustomSectionTitle(sec.id, e.target.value)}
                            className={`text-xl font-medium text-slate-900 dark:text-white bg-transparent border-b hover:border-slate-300 dark:hover:border-slate-600 focus:border-brand-500 focus:ring-0 px-0 w-full transition-all placeholder:text-slate-900/55 dark:placeholder:text-white/55 ${getError("custom", "title", sec.id) ? "border-red-500" : "border-transparent"}`}
                            placeholder="Untitled Section"
                          />
                          <ResumeFieldError
                            errors={validationErrors}
                            section="custom"
                            field="title"
                            id={sec.id}
                            visible={showFieldValidation}
                          />
                        </div>
                        <div className="flex gap-2 items-center pt-5">
                          <button
                            onClick={() => toggleSectionVisibility(sec.id)}
                            className={`p-1.5 rounded-full transition-colors ${
                              resume.sectionOrder.find(s => s.id === sec.id)?.hidden
                                ? "text-amber-400 hover:text-amber-500 bg-amber-50"
                                : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                            }`}
                            title={
                              resume.sectionOrder.find(s => s.id === sec.id)?.hidden
                                ? "Show section in preview"
                                : "Hide section from preview"
                            }
                          >
                            {resume.sectionOrder.find(s => s.id === sec.id)?.hidden ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                          <button
                            onClick={() => removeCustomSection(sec.id)}
                            className="text-slate-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors"
                            title="Delete Section"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {sec.items.map((item, index) => (
                      <div
                        key={item.id}
                        className={`py-3 px-4 bg-slate-50 dark:bg-slate-800 rounded-xl border relative group transition-all hover:border-brand-200 ${draggedItemId === item.id ? "opacity-50 border-brand-400 border-dashed" : "border-slate-200 dark:border-slate-700"} ${item.hidden && draggedItemId !== item.id ? "opacity-60" : ""}`}
                        draggable
                        onDragStart={e => handleItemDragStart(e, sec.id, item.id)}
                        onDragOver={e => handleItemDragOver(e, sec.id, item.id)}
                        onDragEnd={handleItemDragEnd}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <div
                            className="flex items-center gap-2 cursor-pointer select-none flex-1 min-w-0"
                            onClick={() => toggleItemExpand(item.id)}
                          >
                            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate pr-4">
                              {normalizeCustomItemTitle(item.title) || "Activity Name"}
                            </h3>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                updateCustomSectionItem(sec.id, item.id, "hidden", !item.hidden);
                              }}
                              className={`p-1 rounded transition-colors ${item.hidden ? "text-amber-400 hover:text-amber-500" : "text-slate-400 hover:text-slate-600"}`}
                              title={item.hidden ? "Show item" : "Hide item"}
                            >
                              {item.hidden ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                            <button
                              onClick={() => requestRemoveEntry("customItem", item.id, sec.id)}
                              className="text-slate-400 hover:text-red-500 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        {expandedItems[item.id] && (
                          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-700 mt-2">
                            <div className="grid grid-cols-1 gap-3">
                              <div className="flex-1">
                                <input
                                  id={resumeFieldDomId("custom", "title", item.id)}
                                  value={normalizeCustomItemTitle(item.title)}
                                  onChange={e => updateCustomSectionItem(sec.id, item.id, "title", e.target.value)}
                                  className={`w-full p-2 bg-transparent text-sm font-medium border-b hover:border-slate-300 dark:hover:border-slate-600 outline-none transition-all dark:text-white placeholder:text-slate-800/60 dark:placeholder:text-slate-200/60 ${getError("custom", "title", item.id) ? "border-red-500" : "border-transparent"}`}
                                  placeholder="Activity Name"
                                />
                                <ResumeFieldError
                                  errors={validationErrors}
                                  section="custom"
                                  field="title"
                                  id={item.id}
                                  visible={showFieldValidation}
                                />
                                <input
                                  value={item.subtitle}
                                  onChange={e => updateCustomSectionItem(sec.id, item.id, "subtitle", e.target.value)}
                                  className="w-full p-2 bg-transparent text-xs text-slate-500 border-b border-transparent hover:border-slate-300 dark:hover:border-slate-600 outline-none transition-all dark:placeholder:text-slate-500"
                                  placeholder="Subtitle / Role (Optional)"
                                />
                              </div>
                            </div>

                            <div className="flex items-center gap-2 mb-3">
                              <button
                                onClick={() => updateCustomSectionItem(sec.id, item.id, "hasDates", !item.hasDates)}
                                className={`p-1.5 rounded-md transition-all border ${item.hasDates ? "bg-brand-50 border-brand-200 text-brand-600" : "bg-white border-slate-200 text-slate-400 hover:text-slate-600"}`}
                                title="Toggle Dates"
                              >
                                <Calendar size={16} />
                              </button>
                              <button
                                onClick={() => updateCustomSectionItem(sec.id, item.id, "hasLocation", !item.hasLocation)}
                                className={`p-1.5 rounded-md transition-all border ${item.hasLocation ? "bg-brand-50 border-brand-200 text-brand-600" : "bg-white border-slate-200 text-slate-400 hover:text-slate-600"}`}
                                title="Toggle Location"
                              >
                                <MapPin size={16} />
                              </button>
                            </div>

                            {item.hasDates && (
                              <>
                                <div className="grid grid-cols-2 gap-3">
                                  <MonthYearPicker
                                    id={resumeFieldDomId("custom", "startDate", item.id)}
                                    placeholder="Start Date"
                                    value={item.startDate || ""}
                                    onChange={val => updateCustomSectionItem(sec.id, item.id, "startDate", val)}
                                    className="border-slate-200 dark:border-slate-600"
                                  />
                                  <MonthYearPicker
                                    id={resumeFieldDomId("custom", "endDate", item.id)}
                                    disabled={item.current}
                                    min={item.startDate}
                                    placeholder={item.current ? "Ongoing" : "End Date"}
                                    value={item.current ? "Present" : item.endDate || ""}
                                    onChange={val => {
                                      if (val === "Present") {
                                        updateCustomSectionItem(sec.id, item.id, "current", true);
                                        updateCustomSectionItem(sec.id, item.id, "endDate", "");
                                        return;
                                      }
                                      updateCustomSectionItem(sec.id, item.id, "current", false);
                                      updateCustomSectionItem(sec.id, item.id, "endDate", val);
                                    }}
                                    align="right"
                                    allowPresent
                                    className={`${getError("custom", "endDate", item.id) ? "border-red-500" : "border-slate-200 dark:border-slate-600"}`}
                                  />
                                </div>
                                <ResumeFieldError
                                  errors={validationErrors}
                                  section="custom"
                                  field="endDate"
                                  id={item.id}
                                  visible={showFieldValidation}
                                />
                                <div className="flex items-center gap-2 mt-2">
                                  <input
                                    type="checkbox"
                                    id={`current-cust-${item.id}`}
                                    checked={item.current || false}
                                    onChange={e => {
                                      updateCustomSectionItem(sec.id, item.id, "current", e.target.checked);
                                      if (e.target.checked) updateCustomSectionItem(sec.id, item.id, "endDate", "");
                                    }}
                                    className="rounded text-brand-600 focus:ring-brand-500 border-slate-300"
                                  />
                                  <label
                                    htmlFor={`current-cust-${item.id}`}
                                    className="text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none"
                                  >
                                    Ongoing / Present
                                  </label>
                                </div>
                              </>
                            )}

                            {item.hasLocation && (
                              <input
                                placeholder="Location"
                                value={item.location || ""}
                                onChange={e => updateCustomSectionItem(sec.id, item.id, "location", e.target.value)}
                                className="w-full p-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all dark:text-white dark:placeholder:text-slate-400"
                              />
                            )}

                            <TiptapEditor
                              placeholder="Description..."
                              value={normalizeCustomDescription(item.description)}
                              onChange={val => updateCustomSectionItem(sec.id, item.id, "description", val)}
                              onImprove={onImprove}
                              unibotImproveTarget={{ section: "custom", resumeId, entryId: item.id }}
                              wrapperClassName="[&_.ProseMirror_p.is-empty:first-child::before]:text-slate-700/60 [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-slate-700/60 dark:[&_.ProseMirror_p.is-empty:first-child::before]:text-slate-300/60 dark:[&_.ProseMirror_p.is-editor-empty:first-child::before]:text-slate-300/60"
                            />
                          </div>
                        )}
                      </div>
                    ))}

                    <button
                      onClick={() => addCustomSectionItem(sec.id)}
                      className="w-full py-3 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-brand-300 text-slate-500 dark:text-slate-400 hover:text-brand-600 font-medium flex items-center justify-center gap-2 transition-all"
                    >
                      <Plus size={18} /> Add Item
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
          <PanelResizeHandle variant="inline" onPointerDown={startFormsPanelResize} label="Resize section editor" />
        </div>
        {/* 3. Preview Area */}
        <div className="flex-1 min-w-0 bg-slate-100 dark:bg-slate-950 overflow-hidden relative flex flex-col items-center">
          {/* Zoom Toolbar for Main Screen */}
          <div className="absolute top-4 right-8 flex items-center gap-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur border border-slate-200 dark:border-slate-700 shadow-sm rounded-full p-1.5 z-10 transition-all hover:shadow-md">
            <button
              onClick={() => setPreviewScale(s => Math.max(0.3, s - 0.1))}
              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
              title="Zoom Out"
            >
              <ZoomOut size={16} />
            </button>
            <span className="text-slate-600 dark:text-slate-300 font-mono text-xs min-w-[3ch] text-center select-none">
              {Math.round(previewScale * 100)}%
            </span>
            <button
              onClick={() => setPreviewScale(s => Math.min(2.5, s + 0.1))}
              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
              title="Zoom In"
            >
              <ZoomIn size={16} />
            </button>
            <div className="w-px h-4 bg-slate-200 dark:bg-slate-600 mx-1"></div>
            <button
              onClick={() => setPreviewScale(0.8)}
              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
              title="Reset Zoom"
            >
              <RotateCcw size={16} />
            </button>
          </div>

          <div
            className="flex-1 w-full min-w-0 overflow-y-auto p-12 flex justify-center [scrollbar-gutter:stable] scrollbar-on-hover"
            onWheel={handleWheel} // Enable scroll zoom
          >
            <div
              className="transition-all duration-300 origin-top"
              style={{
                transform: `scale(${previewScale})`,
                transformOrigin: "top center",
              }}
            >
              <ResumePDFPreview data={resumeForPreview} highlights={pdfHighlightRegions} />
            </div>
          </div>
        </div>
      </div>

      {/* Template Gallery Modal */}
      {showTemplateModal && typeof document !== "undefined"
        ? createPortal(
            <div
              className={`fixed inset-0 ${MODAL_OVERLAY_Z_CLASS} flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200`}
            >
              <div className="bg-slate-50 dark:bg-slate-900 w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between p-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <h2 className="text-2xl font-medium text-slate-900 dark:text-white mb-1">Choosing a Template</h2>
                    <p className="text-slate-500 dark:text-slate-400">Select a design that fits your personal brand.</p>
                  </div>
                  <button
                    onClick={() => setShowTemplateModal(false)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 dark:text-slate-400"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 bg-slate-50 dark:bg-slate-950">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {templatePickerItems.map(t => (
                      <div
                        key={t.id}
                        onClick={() => handleTemplateSelect(t.id)}
                        className={`
                                            group relative rounded-xl border-2 transition-all duration-300 overflow-hidden bg-white dark:bg-slate-900 shadow-sm cursor-pointer
                                            ${resume.templateId === t.id ? "border-brand-500 ring-2 ring-brand-200 dark:ring-brand-900" : "border-transparent hover:border-brand-300 hover:shadow-lg hover:-translate-y-1"}
                                        `}
                      >
                        {/* Preview Thumbnail */}
                        <div className={`h-48 ${t.color} relative overflow-hidden p-3`}>
                          {TEMPLATE_THUMBNAILS[t.id] ? (
                            <div className="relative h-full w-full overflow-hidden rounded-md bg-white shadow-[0_14px_34px_rgba(15,23,42,0.18)]">
                              <img
                                src={TEMPLATE_THUMBNAILS[t.id]}
                                alt={`${t.name} template preview`}
                                className="pointer-events-none block h-auto w-full max-w-none select-none"
                                loading="lazy"
                                draggable={false}
                              />
                            </div>
                          ) : (
                            <div className="w-full h-full bg-white shadow-sm rounded-md opacity-80 flex flex-col gap-2 p-2 scale-90 origin-top">
                              <div className="w-1/2 h-2 bg-slate-200 rounded"></div>
                              <div className="w-3/4 h-2 bg-slate-100 rounded"></div>
                              <div className="mt-4 space-y-1">
                                <div className="w-full h-1 bg-slate-100 rounded"></div>
                                <div className="w-full h-1 bg-slate-100 rounded"></div>
                                <div className="w-2/3 h-1 bg-slate-100 rounded"></div>
                              </div>
                            </div>
                          )}
                          {recommendedTemplate === t.id && (
                            <div className="absolute top-2 left-2 bg-amber-400 text-amber-900 text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                              <Star size={10} fill="currentColor" /> RECOMMENDED
                            </div>
                          )}
                          {resume.templateId === t.id && (
                            <div className="absolute top-2 right-2 bg-brand-500 text-white p-1 rounded-full shadow-lg">
                              <Check size={16} />
                            </div>
                          )}
                        </div>
                        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                          <h3 className="font-medium text-slate-900 dark:text-white">{t.name}</h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{t.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}

      {/* Preview Modal */}
      {showPreview && typeof document !== "undefined"
        ? createPortal(
            <div
              className={`fixed inset-0 ${MODAL_OVERLAY_Z_CLASS} bg-slate-900/95 flex flex-col items-center justify-center overflow-hidden animate-in fade-in duration-200`}
            >
              <div className="absolute top-6 flex items-center gap-4 bg-slate-800/80 backdrop-blur rounded-full px-6 py-3 shadow-2xl z-50 border border-slate-700">
                <button
                  onClick={() => setPreviewScale(s => Math.max(0.3, s - 0.1))}
                  className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-full transition-colors"
                >
                  <ZoomOut size={20} />
                </button>
                <span className="text-white font-mono text-sm min-w-[3ch] text-center select-none">{Math.round(previewScale * 100)}%</span>
                <button
                  onClick={() => setPreviewScale(s => Math.min(2.5, s + 0.1))}
                  className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-full transition-colors"
                >
                  <ZoomIn size={20} />
                </button>
                <div className="w-px h-6 bg-slate-600 mx-2"></div>
                <button
                  onClick={() => {
                    setPreviewScale(0.8);
                    setPreviewOffset({ x: 0, y: 0 });
                  }}
                  className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-full transition-colors"
                >
                  <RotateCcw size={20} />
                </button>
                <div className="w-px h-6 bg-slate-600 mx-2"></div>
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div
                className="w-full h-full flex items-center justify-center cursor-move overflow-hidden active:cursor-grabbing"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
              >
                <div
                  style={{
                    transform: `translate(${previewOffset.x}px, ${previewOffset.y}px) scale(${previewScale})`,
                    transition: isDragging ? "none" : "transform 0.1s ease-out",
                  }}
                  className="origin-center shadow-2xl bg-white"
                >
                  <ResumePDFPreview data={resumeForPreview} highlights={pdfHighlightRegions} />
                </div>
              </div>
            </div>,
            document.body
          )
        : null}

      {tooltip && (
        <div
          className="fixed z-[100] px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg shadow-xl whitespace-nowrap pointer-events-none animate-in fade-in zoom-in-95 duration-150"
          style={{
            top: tooltip!.top,
            left: tooltip!.left,
            transform: "translateY(-50%)",
          }}
        >
          {tooltip.label}
          <div className="absolute right-full top-1/2 -translate-y-1/2 -mr-px border-4 border-transparent border-r-slate-900"></div>
        </div>
      )}

      {/* ATS Score Modal */}
      {showAtsModal && typeof document !== "undefined"
        ? createPortal(
            <div
              className={`fixed inset-0 ${MODAL_OVERLAY_Z_CLASS} flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200 p-4 sm:p-6`}
            >
              <div className="bg-white dark:bg-slate-900 w-full max-w-3xl min-h-[min(640px,85vh)] max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 dark:border-slate-800">
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">ATS Score Report</h2>
                  <button
                    onClick={() => setShowAtsModal(false)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 dark:text-slate-400"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className={`px-8 py-8 ${atsVm ? atsHeaderBg : "bg-slate-50/80 dark:bg-slate-800/50"}`}>
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium uppercase tracking-wider opacity-70 text-slate-700 dark:text-slate-300">
                        Resume Strength
                      </span>
                      <div className="mt-4 w-full h-3 bg-white/50 rounded-full overflow-hidden border border-black/5">
                        {isFirstAtsLoad ? (
                          <div className="h-full w-full bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 animate-pulse" />
                        ) : (
                          <div
                            className={`h-full rounded-full transition-all duration-1000 ease-out ${atsVm ? atsBarClass : "bg-slate-300"}`}
                            style={{ width: `${atsVm?.score ?? 0}%` }}
                          />
                        )}
                      </div>
                      {atsVm && (
                        <>
                          {atsVm.scoringMode === "jd_blended" && atsVm.generalScore != null && atsVm.jdMatchScore != null ? (
                            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                              Resume quality {atsVm.generalScore}/100
                              {atsVm.deltaGeneral != null && atsVm.deltaGeneral !== 0 ? (
                                <span className={atsVm.deltaGeneral > 0 ? "text-green-600" : "text-red-600"}>
                                  {" "}
                                  ({atsVm.deltaGeneral > 0 ? "+" : ""}
                                  {atsVm.deltaGeneral})
                                </span>
                              ) : null}{" "}
                              · Job match {atsVm.jdMatchScore}/100
                              {atsVm.deltaJdMatch != null && atsVm.deltaJdMatch !== 0 ? (
                                <span className={atsVm.deltaJdMatch > 0 ? "text-green-600" : "text-red-600"}>
                                  {" "}
                                  ({atsVm.deltaJdMatch > 0 ? "+" : ""}
                                  {atsVm.deltaJdMatch})
                                </span>
                              ) : null}
                              {atsVm.keywordMatchPercentage != null ? (
                                <>
                                  {" "}
                                  · Keywords {atsVm.keywordMatchPercentage}%
                                  {atsVm.deltaKeywordMatch != null && atsVm.deltaKeywordMatch !== 0 ? (
                                    <span className={atsVm.deltaKeywordMatch > 0 ? "text-green-600" : "text-red-600"}>
                                      {" "}
                                      ({atsVm.deltaKeywordMatch > 0 ? "+" : ""}
                                      {atsVm.deltaKeywordMatch})
                                    </span>
                                  ) : null}
                                </>
                              ) : null}
                            </p>
                          ) : atsVm.scoringMode === "general_only" ? (
                            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">General resume quality score</p>
                          ) : null}
                          <p className="mt-4 flex gap-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                            <Quote size={16} className="mt-0.5 flex-shrink-0 opacity-50" />
                            <span className="italic">{atsScoreQuote}</span>
                          </p>
                          {atsVm.score >= ATS_COMPLETE_THRESHOLD && (
                            <p className="mt-2 text-xs font-medium text-green-700 dark:text-green-400">
                              Meets the {ATS_COMPLETE_THRESHOLD}% completion threshold.
                            </p>
                          )}
                        </>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <div className={`flex flex-col items-end ${isFirstAtsLoad ? "animate-pulse" : ""}`}>
                        <span className="font-semibold text-5xl text-slate-900 dark:text-white tabular-nums">
                          {atsScorePending && !atsVm ? "—" : atsVm != null ? atsVm.score : "—"}
                          {atsVm != null && <span className="text-2xl text-slate-500 dark:text-slate-400 font-medium">/100</span>}
                        </span>
                        {atsVm?.hasComparison && atsDeltaLabel ? (
                          <span className={`mt-1 text-sm font-medium tabular-nums ${atsDeltaTone}`}>{atsDeltaLabel}</span>
                        ) : null}
                      </div>
                      {!isFirstAtsLoad ? (
                        <>
                          <button
                            type="button"
                            onClick={() => void handleRecalculate()}
                            disabled={atsScorePending || atsScoreError || !atsRecalculateState.allowed}
                            title={atsRecalculateState.message ?? "Recalculate your ATS score"}
                            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border text-sm font-medium shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800"
                          >
                            {atsScorePending ? (
                              <Loader2 size={16} className="animate-spin text-brand-600" />
                            ) : (
                              <RefreshCw size={16} className="text-slate-500" />
                            )}
                            {atsScorePending ? "Recalculating…" : "Recalculate"}
                          </button>
                          {atsRecalculateState.message && !atsScorePending ? (
                            <p className="max-w-[220px] text-right text-xs text-slate-500 dark:text-slate-400">
                              {atsRecalculateState.message}
                            </p>
                          ) : atsCalcCount > 0 ? (
                            <p className="max-w-[220px] text-right text-xs text-slate-500 dark:text-slate-400">
                              Calculated {atsCalcCount} {atsCalcCount === 1 ? "time" : "times"}
                            </p>
                          ) : null}
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>

                {isRecalculating ? <AtsScoreModalRecalculateProgress /> : null}

                {atsScoreStale && atsVm && !atsScorePending && (
                  <div className="mx-8 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
                    <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                    <p>This score uses older criteria. Recalculate for the latest rubric.</p>
                  </div>
                )}

                {atsVm?.comparisonResetReason === "jd_changed" && !atsScorePending && (
                  <div className="mx-8 flex items-start gap-3 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-200">
                    <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                    <p>{atsVm.comparisonMessage ?? "Job description changed — previous match scores aren't comparable."}</p>
                  </div>
                )}

                {recalcError && (
                  <div className="mx-8 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
                    <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Recalculation failed</p>
                      <p className="mt-0.5 opacity-90">{recalcError}</p>
                    </div>
                  </div>
                )}

                <div className="flex-1 px-8 py-6 space-y-8 overflow-y-auto min-h-0 scrollbar-on-hover">
                  {isFirstAtsLoad ? <AtsScoreModalLoadingPanel mode="first" /> : null}

                  {isRecalculating ? <AtsScoreModalLoadingPanel mode="recalc" /> : null}

                  {atsScoreError && !atsScorePending && (
                    <div className="space-y-4">
                      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-900/40 text-sm text-red-800 dark:text-red-200">
                        <p className="font-medium">Could not load ATS score</p>
                        <p className="mt-1 text-red-700/90 dark:text-red-300/90">
                          {atsScoreErr instanceof Error ? atsScoreErr.message : "Something went wrong."}
                        </p>
                        <p className="mt-2 text-xs text-red-600/80 dark:text-red-400/80">
                          Check your connection and try again. Scores work for any resume; job-match blending runs when this resume is
                          linked to an application with a job description.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void runAtsScore({ resumeId, force: false }).catch(() => {})}
                        className="w-full py-2.5 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-medium hover:opacity-90 transition-opacity"
                      >
                        Retry
                      </button>
                    </div>
                  )}

                  {!atsScorePending && !atsScoreError && atsVm && (
                    <>
                      {atsVm.hasComparison ? (
                        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 p-4 space-y-4">
                          <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider">Changes since last score</h4>
                          {atsVm.scoreChangeSummary ? (
                            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{atsVm.scoreChangeSummary}</p>
                          ) : null}
                          {atsVm.improvementsAddressed.length > 0 ? (
                            <div>
                              <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-2">Addressed</p>
                              <ul className="space-y-2">
                                {atsVm.improvementsAddressed.map((item, i) => (
                                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                                    <Check size={16} className="mt-0.5 flex-shrink-0 text-green-600" />
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : null}
                          {atsVm.improvementsStillOpen.length > 0 ? (
                            <div>
                              <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-2">Still open</p>
                              <ul className="space-y-2">
                                {atsVm.improvementsStillOpen.map((item, i) => (
                                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                                    <AlertCircle size={16} className="mt-0.5 flex-shrink-0 text-amber-500" />
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : null}
                          {atsVm.keywordsResolved.length > 0 || atsVm.keywordsStillMissing.length > 0 ? (
                            <div className="space-y-2">
                              {atsVm.keywordsResolved.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                  {atsVm.keywordsResolved.map(keyword => (
                                    <span
                                      key={`resolved-${keyword}`}
                                      className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800 dark:bg-green-900/40 dark:text-green-300"
                                    >
                                      {keyword}
                                    </span>
                                  ))}
                                </div>
                              ) : null}
                              {atsVm.keywordsStillMissing.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                  {atsVm.keywordsStillMissing.map(keyword => (
                                    <span
                                      key={`missing-${keyword}`}
                                      className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                                    >
                                      {keyword}
                                    </span>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      ) : atsVm.scoringMode === "jd_blended" &&
                        (atsVm.keywordMatchPercentage != null || atsVm.keywordsStillMissing.length > 0) ? (
                        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 p-4 space-y-3">
                          <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider">Keyword match</h4>
                          {atsVm.keywordMatchPercentage != null ? (
                            <p className="text-sm text-slate-700 dark:text-slate-300">
                              Coverage {atsVm.keywordMatchPercentage}% against the job description (present sections only).
                            </p>
                          ) : null}
                          {atsVm.keywordsStillMissing.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {atsVm.keywordsStillMissing.map(keyword => (
                                <span
                                  key={`missing-first-${keyword}`}
                                  className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                                >
                                  {keyword}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-green-700 dark:text-green-400">No critical keywords flagged as missing.</p>
                          )}
                        </div>
                      ) : null}

                      <div>
                        <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">Improvements Needed</h4>
                        {atsVm.improvements.length > 0 ? (
                          <ul className="space-y-3">
                            {atsVm.improvements.slice(0, ATS_IMPROVEMENTS_DISPLAY_LIMIT).map((imp, i) => (
                              <li
                                key={i}
                                className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg"
                              >
                                <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                                <span>{imp}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center gap-3 text-green-700 dark:text-green-400">
                            <div className="p-1 bg-green-200 dark:bg-green-800 rounded-full">
                              <Check size={14} />
                            </div>
                            <span className="font-medium text-sm">Great job! No critical issues found.</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">Section Analysis</h4>
                        <div className="space-y-2">
                          {atsVm.sectionAnalysis.map(sec => (
                            <AtsSectionAnalysisRow key={sec.key} section={sec} />
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {isFirstAtsLoad || isRecalculating ? <AtsScoreModalFooterPlaceholder fixAllUsed={fixAllUsed} /> : null}

                {atsVm && !atsScoreError && !isRecalculating ? (
                  <div className="px-8 py-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex flex-col sm:flex-row gap-4">
                    <button
                      type="button"
                      onClick={handleFixWithUnibot}
                      disabled={fixAllUsed || !canAtsFix}
                      className="flex-1 px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                    >
                      <Wand2 size={18} />
                      {fixAllUsed ? "Unibot fix applied" : "Fix once with Unibot"}
                    </button>
                    <button
                      type="button"
                      onClick={handleFixWithCareerCoach}
                      className="flex-1 px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      Fix with a career coach
                    </button>
                  </div>
                ) : null}
              </div>
            </div>,
            document.body
          )
        : null}

      {pendingDeleteSkillCategoryId && (
        <ModalPortalOverlay className="flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl p-6 border border-slate-200 dark:border-slate-800 relative">
            <div className="flex items-start gap-3 mb-4">
              <div className="mt-0.5 p-2 rounded-full bg-red-50 dark:bg-red-900/20 text-red-500">
                <AlertCircle size={18} />
              </div>
              <div>
                <h2 className="text-lg font-medium text-slate-900 dark:text-white">Delete category?</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  This will permanently remove the category and all skills inside it.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={cancelRemoveSkillCategory}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmRemoveSkillCategory}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Delete Category
              </button>
            </div>
          </div>
        </ModalPortalOverlay>
      )}

      {pendingDeleteSectionId && (
        <ModalPortalOverlay className="flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl p-6 border border-slate-200 dark:border-slate-800 relative">
            <div className="flex items-start gap-3 mb-4">
              <div className="mt-0.5 p-2 rounded-full bg-red-50 dark:bg-red-900/20 text-red-500">
                <AlertCircle size={18} />
              </div>
              <div>
                <h2 className="text-lg font-medium text-slate-900 dark:text-white">Delete section?</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  This will permanently remove the section and all items inside it.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={cancelRemoveCustomSection}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmRemoveCustomSection}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Delete Section
              </button>
            </div>
          </div>
        </ModalPortalOverlay>
      )}

      {pendingDeleteEntry && (
        <ModalPortalOverlay className="flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl p-6 border border-slate-200 dark:border-slate-800 relative">
            <div className="flex items-start gap-3 mb-4">
              <div className="mt-0.5 p-2 rounded-full bg-red-50 dark:bg-red-900/20 text-red-500">
                <AlertCircle size={18} />
              </div>
              <div>
                <h2 className="text-lg font-medium text-slate-900 dark:text-white">Delete entry?</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">This entry will be permanently removed from your resume.</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={cancelRemoveEntry}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmRemoveEntry}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Delete Entry
              </button>
            </div>
          </div>
        </ModalPortalOverlay>
      )}
    </div>
  );
};

export default ResumeEditor;
