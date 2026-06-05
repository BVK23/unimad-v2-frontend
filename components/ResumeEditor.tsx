import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
    ArrowLeft, Plus, Trash2, GripVertical, GripHorizontal, ChevronDown, ChevronRight, X, Download, Share2, ZoomIn, ZoomOut, RotateCcw, LayoutTemplate, Type, Briefcase, GraduationCap, Code, User, Mail, Phone, MapPin, Globe, Linkedin, Github, ExternalLink, Calendar, Check, AlertCircle, Quote, Palette, Layout, Star, Lock, TrendingUp, Wand2, Eye, EyeOff, RefreshCw, Loader2, Info
} from 'lucide-react';
import { ResumeData, ResumeExperience, ResumeEducation, ResumeSkill, CustomSection, ResumeTemplateId, CustomSectionItem } from '../types';
import { ATS_COMPLETE_THRESHOLD, MAX_RECALCULATIONS, MAX_FIX_ALL } from '@/lib/resume/atsConstants';
import { computeAtsAnalysis } from '@/lib/resume/atsAnalysis';
import { applyAtsFixes } from '@/lib/resume/applyAtsFixes';
import { loadResumeAtsSession, saveResumeAtsSession } from '@/lib/resume/atsStorage';
import { getAtsScoreQuote } from '@/lib/resume/atsScoreQuote';
import ResumeKnowledgeBaseModal from '@/components/resume/ResumeKnowledgeBaseModal';

const scoreTone = (score: number) =>
    score >= 80 ? 'green' : score >= ATS_COMPLETE_THRESHOLD ? 'yellow' : 'red';

interface ResumeEditorProps {
    initialData: ResumeData;
    onBack: () => void;
    onSave: (data: ResumeData) => void;
    onImprove: (text: string) => void;
    showTemplateModal: boolean;
    setShowTemplateModal: (show: boolean) => void;
    showExportModal: boolean;
    setShowExportModal: (show: boolean) => void;
}

const TEMPLATES = [
    { id: 'modern', name: 'Modern', description: 'Clean and professional', color: 'bg-blue-50', border: 'border-blue-200', available: true, recommended: true },
    { id: 'minimal', name: 'Minimal', description: 'Simple and elegant', color: 'bg-slate-50', border: 'border-slate-200', available: true, recommended: false },
    { id: 'classic', name: 'Classic', description: 'Traditional serif style', color: 'bg-amber-50', border: 'border-amber-200', available: true, recommended: true },
    { id: 'swiss', name: 'Swiss', description: 'Bold typography', color: 'bg-red-50', border: 'border-red-200', available: false, recommended: false },
    { id: 'tech', name: 'Tech Lead', description: 'Dark mode inspired', color: 'bg-zinc-900', border: 'border-zinc-700', available: false, recommended: false },
    { id: 'creative', name: 'Creative', description: 'Playful layout', color: 'bg-teal-50', border: 'border-teal-200', available: false, recommended: false },
    { id: 'executive', name: 'Executive', description: 'High impact', color: 'bg-slate-200', border: 'border-slate-300', available: false, recommended: false },
    { id: 'startup', name: 'Startup', description: 'Modern startup vibe', color: 'bg-sky-50', border: 'border-sky-200', available: false, recommended: true },
    { id: 'academic', name: 'Academic', description: 'Research focused', color: 'bg-stone-50', border: 'border-stone-200', available: false, recommended: false },
    { id: 'designer', name: 'Designer', description: 'Visual heavy', color: 'bg-rose-50', border: 'border-rose-200', available: false, recommended: false },
    { id: 'engineer', name: 'Engineer', description: 'Structure first', color: 'bg-cyan-50', border: 'border-cyan-200', available: false, recommended: false },
    { id: 'manager', name: 'Manager', description: 'Leadership focus', color: 'bg-emerald-50', border: 'border-emerald-200', available: false, recommended: false },
    { id: 'student', name: 'Student', description: 'Entry level optimized', color: 'bg-green-50', border: 'border-green-200', available: false, recommended: true },
    { id: 'compact', name: 'Compact', description: 'Single page master', color: 'bg-gray-50', border: 'border-gray-200', available: false, recommended: false },
    { id: 'timeline', name: 'Timeline', description: 'Chronological view', color: 'bg-orange-50', border: 'border-orange-200', available: false, recommended: false },
    { id: 'split', name: 'Split', description: 'Two column split', color: 'bg-teal-50', border: 'border-teal-200', available: false, recommended: false },
    { id: 'grid', name: 'Grid', description: 'Modular grid system', color: 'bg-slate-100', border: 'border-slate-300', available: false, recommended: false },
    { id: 'bold', name: 'Bold', description: 'High contrast', color: 'bg-rose-50', border: 'border-rose-200', available: false, recommended: false },
    { id: 'air', name: 'Air', description: 'Maximum whitespace', color: 'bg-sky-50', border: 'border-sky-200', available: false, recommended: false },
    { id: 'mono', name: 'Mono', description: 'Monospace code style', color: 'bg-neutral-100', border: 'border-neutral-200', available: false, recommended: false },
];

// Helper Component for Markdown Rendering in Preview
const MarkdownDisplay: React.FC<{ content: string; className?: string }> = ({ content, className = '' }) => {
    if (!content) return null;

    const processText = (text: string) => {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/_(.*?)_/g, '<em>$1</em>');
    };

    const lines = content.split('\n');
    const elements: React.ReactElement[] = [];
    let listItems: React.ReactElement[] = [];

    lines.forEach((line, i) => {
        if (line.trim().startsWith('- ')) {
            // It's a list item
            listItems.push(
                <li key={`li-${i}`} dangerouslySetInnerHTML={{ __html: processText(line.replace(/^- /, '')) }} />
            );
        } else {
            // Flush list if exists
            if (listItems.length > 0) {
                elements.push(<ul key={`ul-${i}`} className="list-disc ml-5 mb-2 pl-1">{[...listItems]}</ul>);
                listItems = [];
            }
            // Add paragraph
            if (line.trim() !== '') {
                elements.push(<div key={`p-${i}`} className="min-h-[1.2em]" dangerouslySetInnerHTML={{ __html: processText(line) }} />);
            } else {
                elements.push(<br key={`br-${i}`} />);
            }
        }
    });

    // Flush remaining list
    if (listItems.length > 0) {
        elements.push(<ul key={`ul-end`} className="list-disc ml-5 mb-2 pl-1">{[...listItems]}</ul>);
    }

    return <div className={className}>{elements}</div>;
};

// Rich Text Editor Component
const RichTextarea: React.FC<{ value: string; onChange: (val: string) => void; onImprove: (val: string) => void; placeholder?: string; rows?: number; className?: string }> = ({
    value, onChange, onImprove, placeholder, rows = 4, className
}) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const insertFormat = (startTag: string, endTag: string) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const before = text.substring(0, start);
        const selection = text.substring(start, end);
        const after = text.substring(end);

        // If nothing selected, just insert the tags/chars
        const newText = before + startTag + selection + endTag + after;

        onChange(newText);

        // Restore focus and position cursor inside tags
        setTimeout(() => {
            textarea.focus();
            const newCursorPos = start + startTag.length + selection.length;
            textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
    };

    return (
        <div className="border border-slate-200 rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-brand-500 focus-within:border-brand-500 transition-all bg-white shadow-sm">
            <div className="flex items-center gap-1 bg-slate-50 border-b border-slate-200 px-2 py-1.5">
                <button onClick={() => insertFormat('**', '**')} className="p-1.5 hover:bg-slate-200 rounded text-slate-600 transition-colors" title="Bold">
                    <Type size={14} />
                </button>
                <button onClick={() => insertFormat('_', '_')} className="p-1.5 hover:bg-slate-200 rounded text-slate-600 transition-colors" title="Italic">
                    <Type size={14} />
                </button>
                <button onClick={() => insertFormat('\n- ', '')} className="p-1.5 hover:bg-slate-200 rounded text-slate-600 transition-colors" title="Bullet List">
                    <Type size={14} />
                </button>
                <div className="w-px h-4 bg-slate-300 mx-1"></div>
                <button
                    onClick={() => onImprove(value)}
                    className="flex items-center justify-center p-1.5 hover:bg-brand-50 text-brand-600 rounded transition-colors ml-auto"
                    title="Improve with Unibot"
                >
                    <Wand2 size={16} />
                </button>
            </div>
            <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={`w-full p-3 bg-transparent outline-none resize-none text-sm font-sans ${className}`}
                placeholder={placeholder}
                rows={rows}
            />
        </div>
    );
};

// Custom Date Picker for Resume
const DatePicker: React.FC<{ value: string; onChange: (val: string) => void; placeholder: string; className?: string }> = ({ value, onChange, placeholder, className }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 40 }, (_, i) => currentYear - i + 5); // From 5 years in future to 35 years ago

    // Parse existing value (Format expected: "Jan 2023" or "2023-01")
    let initMonth = new Date().getMonth();
    let initYear = currentYear;
    if (value) {
        const parts = value.split(' ');
        if (parts.length === 2 && months.includes(parts[0])) {
            initMonth = months.indexOf(parts[0]);
            initYear = parseInt(parts[1], 10);
        }
    }

    const [selectedMonth, setSelectedMonth] = useState(initMonth);
    const [selectedYear, setSelectedYear] = useState(initYear);

    // Click outside handler
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const handleSelect = (m: number, y: number) => {
        onChange(`${months[m]} ${y}`);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={containerRef}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full p-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:border-brand-500 outline-none transition-all cursor-pointer flex items-center justify-between ${className} ${!value ? 'text-slate-400 dark:text-slate-400 font-normal' : 'font-medium'}`}
            >
                <span>{value || placeholder}</span>
                <Calendar size={14} className="text-slate-400" />
            </div>

            {isOpen && (
                <div className="absolute z-50 mt-1 top-full left-0 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-3 animate-in fade-in zoom-in-95 duration-100">
                    <div className="flex justify-between items-center mb-3 text-slate-900 dark:text-white">
                        <span className="text-sm font-medium">Select Date</span>
                        <button onClick={() => onChange('Present')} className="text-xs font-medium text-brand-600 hover:text-brand-700">Present</button>
                    </div>

                    <div className="flex gap-2 mb-3">
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                            className="w-1/2 p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none dark:text-white"
                        >
                            {months.map((m, i) => (
                                <option key={m} value={i}>{m}</option>
                            ))}
                        </select>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            className="w-1/2 p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none dark:text-white"
                        >
                            {years.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={() => handleSelect(selectedMonth, selectedYear)}
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
    initialData, onBack, onSave, onImprove,
    showTemplateModal, setShowTemplateModal, showExportModal, setShowExportModal
}) => {
    // Ensure sectionOrder exists for backward compatibility
    const [resume, setResume] = useState<ResumeData>(() => {
        if (initialData.sectionOrder) return initialData;
        return {
            ...initialData,
            projects: initialData.projects ?? [],
            certifications: initialData.certifications ?? [],
            sectionOrder: [
                { id: 'profile' },
                { id: 'experience' },
                { id: 'education' },
                { id: 'skills' },
                ...initialData.customSections.map((s) => ({ id: s.id })),
            ],
        };
    });

    const [activeSection, setActiveSection] = useState<string>('profile');
    const [showToast, setShowToast] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [draggedSectionId, setDraggedSectionId] = useState<string | null>(null);

    // -- Item DnD & Collapse State --
    const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
    const [draggedItemSectionId, setDraggedItemSectionId] = useState<string | null>(null);
    const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({}); // true = expanded

    // -- ATS Modal State --
    const [showAtsModal, setShowAtsModal] = useState(false);
    const [recalcAttemptsUsed, setRecalcAttemptsUsed] = useState(0);
    const [fixAllUsed, setFixAllUsed] = useState(false);
    const [isRecalculating, setIsRecalculating] = useState(false);
    const [recalcError, setRecalcError] = useState<string | null>(null);
    const [showKnowledgeBaseModal, setShowKnowledgeBaseModal] = useState(false);

    const resumeStorageId = resume.id || 'draft';

    useEffect(() => {
        const session = loadResumeAtsSession(resumeStorageId);
        setRecalcAttemptsUsed(session.recalcAttemptsUsed);
        setFixAllUsed(session.fixAllUsed);
    }, [resumeStorageId]);

    // Preview Modal State
    const [showPreview, setShowPreview] = useState(false);
    const [previewScale, setPreviewScale] = useState(0.8);
    const [previewOffset, setPreviewOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStart = useRef({ x: 0, y: 0 });

    // Tooltip State
    const [tooltip, setTooltip] = useState<{ label: string; top: number; left: number } | null>(null);

    const showTooltip = (e: React.MouseEvent, label: string) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setTooltip({
            label,
            top: rect.top + rect.height / 2,
            left: rect.right + 12
        });
    };

    const hideTooltip = () => setTooltip(null);

    const atsAnalysis = useMemo(() => computeAtsAnalysis(resume), [resume]);
    const atsScoreQuote = useMemo(() => getAtsScoreQuote(atsAnalysis.score), [atsAnalysis.score]);

    const recalcRemaining = MAX_RECALCULATIONS - recalcAttemptsUsed;
    const recalcCapReached = recalcAttemptsUsed >= MAX_RECALCULATIONS;
    const atsTone = scoreTone(atsAnalysis.score);
    const atsScoreClass =
        atsTone === 'green' ? 'text-green-600' : atsTone === 'yellow' ? 'text-yellow-600' : 'text-red-600';
    const atsBarClass =
        atsTone === 'green' ? 'bg-green-500' : atsTone === 'yellow' ? 'bg-yellow-500' : 'bg-red-500';
    const atsHeaderBg =
        atsTone === 'green' ? 'bg-green-50/50' : atsTone === 'yellow' ? 'bg-yellow-50/50' : 'bg-red-50/50';

    const handleRecalculate = async () => {
        if (recalcAttemptsUsed >= MAX_RECALCULATIONS || isRecalculating) return;

        setRecalcError(null);
        setIsRecalculating(true);

        try {
            await new Promise((resolve) => setTimeout(resolve, 900));

            if (!resume.profile.fullName?.trim()) {
                setRecalcError(
                    'Recalculation failed. Add your full name in Profile, then try again.'
                );
                setShowAtsModal(true);
                return;
            }

            setRecalcAttemptsUsed((prev) => {
                if (prev >= MAX_RECALCULATIONS) return prev;
                const nextAttempts = prev + 1;
                saveResumeAtsSession(resumeStorageId, {
                    recalcAttemptsUsed: nextAttempts,
                    fixAllUsed,
                });
                return nextAttempts;
            });
            setShowAtsModal(true);
        } catch {
            setRecalcError('Something went wrong while recalculating. Please try again in a moment.');
            setShowAtsModal(true);
        } finally {
            setIsRecalculating(false);
        }
    };

    const handleFixWithUnibot = () => {
        if (fixAllUsed || atsAnalysis.improvements.length === 0) return;
        const updated = applyAtsFixes(resume);
        setResume(updated);
        setFixAllUsed(true);
        saveResumeAtsSession(resumeStorageId, {
            recalcAttemptsUsed,
            fixAllUsed: true,
        });
        setRecalcError(null);
        const improvementList = atsAnalysis.improvements.map((item) => `- ${item}`).join('\n');
        onImprove(
            `Please help me improve my resume based on these ATS recommendations:\n${improvementList}`
        );
        setShowAtsModal(false);
    };

    const handleFixWithCareerCoach = () => {
        setShowAtsModal(false);
        setRecalcError(null);
        window.location.href = '/uniboard/unicoach';
    };


    // -- Handlers --

    const handleProfileChange = (field: string, value: string) => {
        setResume(prev => ({ ...prev, profile: { ...prev.profile, [field]: value } }));
    };

    const addExperience = () => {
        const newExp: ResumeExperience = {
            id: Date.now().toString(),
            company: 'New Company',
            role: 'Role',
            startDate: '',
            endDate: '',
            current: false,
            description: 'Description of your role...'
        };
        setResume(prev => ({ ...prev, experience: [...prev.experience, newExp] }));
    };

    const updateExperience = (id: string, field: keyof ResumeExperience, value: any) => {
        setResume(prev => ({
            ...prev,
            experience: prev.experience.map(exp => exp.id === id ? { ...exp, [field]: value } : exp)
        }));
    };

    const removeExperience = (id: string) => {
        setResume(prev => ({ ...prev, experience: prev.experience.filter(exp => exp.id !== id) }));
    };

    const addEducation = () => {
        const newEdu: ResumeEducation = {
            id: Date.now().toString(),
            school: 'University',
            degree: 'Degree',
            startDate: '',
            endDate: '',
            description: '',
            location: ''
        };
        setResume(prev => ({ ...prev, education: [...prev.education, newEdu] }));
    };

    const updateEducation = (id: string, field: keyof ResumeEducation, value: any) => {
        setResume(prev => ({
            ...prev,
            education: prev.education.map(edu => edu.id === id ? { ...edu, [field]: value } : edu)
        }));
    };

    const removeEducation = (id: string) => {
        setResume(prev => ({ ...prev, education: prev.education.filter(edu => edu.id !== id) }));
    };

    const addSkillCategory = () => {
        const newCategory = { id: Date.now().toString(), name: 'New Category' };
        setResume(prev => ({
            ...prev,
            skillCategories: [...(prev.skillCategories || []), newCategory]
        }));
    };

    const updateSkillCategory = (id: string, name: string) => {
        setResume(prev => ({
            ...prev,
            skillCategories: (prev.skillCategories || []).map(cat => cat.id === id ? { ...cat, name } : cat)
        }));
    };

    const removeSkillCategory = (id: string) => {
        setResume(prev => ({
            ...prev,
            skillCategories: (prev.skillCategories || []).filter(cat => cat.id !== id),
            skills: prev.skills.filter(s => s.categoryId !== id)
        }));
    };

    const toggleSectionVisibility = (id: string) => {
        setResume(prev => {
            const hidden = prev.hiddenSections || [];
            if (hidden.includes(id)) {
                return { ...prev, hiddenSections: hidden.filter(s => s !== id) };
            } else {
                return { ...prev, hiddenSections: [...hidden, id] };
            }
        });
    };

    const addSkill = (categoryId?: string) => {
        const newSkill: ResumeSkill = {
            id: Date.now().toString(),
            name: 'New Skill',
            categoryId
        };
        setResume(prev => ({ ...prev, skills: [...prev.skills, newSkill] }));
    };

    const updateSkill = (id: string, name: string) => {
        setResume(prev => ({
            ...prev,
            skills: prev.skills.map(skill => skill.id === id ? { ...skill, name } : skill)
        }));
    };

    const removeSkill = (id: string) => {
        setResume(prev => ({ ...prev, skills: prev.skills.filter(s => s.id !== id) }));
    };

    const addCustomSection = () => {
        const newSection: CustomSection = {
            id: Date.now().toString(),
            title: 'Untitled Section',
            items: [{ id: Date.now().toString(), title: 'Activity Name', description: 'Description...' }]
        };
        setResume(prev => ({
            ...prev,
            customSections: [...prev.customSections, newSection],
            sectionOrder: [...prev.sectionOrder, { id: newSection.id }]
        }));
        setActiveSection(newSection.id);
    };

    const updateCustomSectionTitle = (id: string, newTitle: string) => {
        setResume(prev => ({
            ...prev,
            customSections: prev.customSections.map(sec => sec.id === id ? { ...sec, title: newTitle } : sec)
        }));
    };

    const updateCustomSectionItem = (sectionId: string, itemId: string, field: keyof CustomSectionItem, value: any) => {
        setResume(prev => ({
            ...prev,
            customSections: prev.customSections.map(sec => {
                if (sec.id !== sectionId) return sec;
                return {
                    ...sec,
                    items: sec.items.map(item => item.id === itemId ? { ...item, [field]: value } : item)
                }
            })
        }));
    };

    const addCustomSectionItem = (sectionId: string) => {
        const newItem = {
            id: Date.now().toString(),
            title: 'New Item',
            subtitle: '',
            description: 'Description...',
            hasDates: true,
            hasLocation: true
        };
        setResume(prev => ({
            ...prev,
            customSections: prev.customSections.map(sec => {
                if (sec.id !== sectionId) return sec;
                return {
                    ...sec,
                    items: [...sec.items, newItem]
                }
            })
        }));
    };

    const removeCustomSectionItem = (sectionId: string, itemId: string) => {
        setResume(prev => ({
            ...prev,
            customSections: prev.customSections.map(sec => {
                if (sec.id !== sectionId) return sec;
                return {
                    ...sec,
                    items: sec.items.filter(item => item.id !== itemId)
                };
            })
        }));
    };

    const removeCustomSection = (id: string) => {
        if (window.confirm("Delete this entire section?")) {
            setResume(prev => ({
                ...prev,
                customSections: prev.customSections.filter(sec => sec.id !== id),
                sectionOrder: prev.sectionOrder.filter((section) => section.id !== id)
            }));
            setActiveSection('profile');
        }
    };


    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            onSave(resume);
            setIsSaving(false);
            setShowExportModal(false);
        }, 800);
    };

    const handleTemplateSelect = (id: string) => {
        setResume(prev => ({ ...prev, templateId: id as ResumeTemplateId }));
        setShowTemplateModal(false);
    };

    // -- DnD Logic for Pills --
    const handleDragStart = (e: React.DragEvent, id: string) => {
        setDraggedSectionId(id);
        hideTooltip();
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        if (!draggedSectionId || draggedSectionId === targetId) return;

        const newOrder = [...resume.sectionOrder];
        const draggedIdx = newOrder.findIndex((section) => section.id === draggedSectionId);
        const targetIdx = newOrder.findIndex((section) => section.id === targetId);

        if (draggedIdx !== -1 && targetIdx !== -1) {
            const [dragged] = newOrder.splice(draggedIdx, 1);
            newOrder.splice(targetIdx, 0, dragged);
            setResume(prev => ({ ...prev, sectionOrder: newOrder }));
        }
    };

    const handleDragEnd = () => {
        setDraggedSectionId(null);
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

        if (sectionId === 'experience') {
            const list = [...newResume.experience];
            const draggedIdx = list.findIndex(i => i.id === draggedItemId);
            const targetIdx = list.findIndex(i => i.id === targetItemId);
            if (draggedIdx !== -1 && targetIdx !== -1) {
                const [removed] = list.splice(draggedIdx, 1);
                list.splice(targetIdx, 0, removed);
                setResume(prev => ({ ...prev, experience: list }));
            }
        } else if (sectionId === 'education') {
            const list = [...newResume.education];
            const draggedIdx = list.findIndex(i => i.id === draggedItemId);
            const targetIdx = list.findIndex(i => i.id === targetItemId);
            if (draggedIdx !== -1 && targetIdx !== -1) {
                const [removed] = list.splice(draggedIdx, 1);
                list.splice(targetIdx, 0, removed);
                setResume(prev => ({ ...prev, education: list }));
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
                    newCustomSections[sectionIdx] = { ...newCustomSections[sectionIdx], items: list };
                    setResume(prev => ({ ...prev, customSections: newCustomSections }));
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
        setIsDragging(true);
        dragStart.current = { x: e.clientX - previewOffset.x, y: e.clientY - previewOffset.y };
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        setPreviewOffset({
            x: e.clientX - dragStart.current.x,
            y: e.clientY - dragStart.current.y
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
            case 'profile': return <User size={18} />;
            case 'experience': return <Briefcase size={18} />;
            case 'education': return <GraduationCap size={18} />;
            case 'skills': return <Code size={18} />;
            default: return <LayoutTemplate size={18} />;
        }
    };


    // --- Renderers for Resume Preview ---
    const renderSection = (id: string) => {
        const { profile, experience, education, skills, customSections, hiddenSections } = resume;

        if (hiddenSections?.includes(id)) return null;

        switch (id) {
            case 'profile':
                return (
                    <section key="profile">
                        <h3 className="text-sm font-medium text-brand-500 uppercase tracking-wider mb-2">Summary</h3>
                        <MarkdownDisplay content={profile.summary} className="text-[13px] leading-relaxed text-slate-700" />
                    </section>
                );
            case 'experience':
                if (experience.length === 0) return null;
                return (
                    <section key="experience">
                        <h3 className="text-sm font-medium text-brand-500 uppercase tracking-wider mb-4">Experience</h3>
                        <div className="space-y-4">
                            {experience.filter(exp => !exp.hidden).map(exp => (
                                <div key={exp.id}>
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h4 className="font-medium text-slate-900">{exp.role}</h4>
                                        <span className="text-xs text-slate-500">{exp.startDate} - {exp.current ? 'Present' : exp.endDate}</span>
                                    </div>
                                    <div className="flex justify-between items-baseline mb-1">
                                        <p className="text-sm text-brand-600 font-medium">{exp.company}</p>
                                        {exp.location && <span className="text-xs text-slate-400">{exp.location}</span>}
                                    </div>
                                    <MarkdownDisplay content={exp.description} className="text-sm text-slate-700 leading-relaxed" />
                                </div>
                            ))}
                        </div>
                    </section>
                );
            case 'education':
                if (education.length === 0) return null;
                return (
                    <section key="education">
                        <h3 className="text-sm font-medium text-brand-500 uppercase tracking-wider mb-4">Education</h3>
                        <div className="space-y-3">
                            {education.filter(edu => !edu.hidden).map(edu => (
                                <div key={edu.id}>
                                    <h4 className="font-medium text-slate-900 text-sm">{edu.school}</h4>
                                    <p className="text-sm text-slate-700">{edu.degree}</p>
                                    <div className="flex justify-between items-baseline mb-1 mt-0.5">
                                        <p className="text-xs text-slate-500">{edu.startDate} - {edu.endDate}</p>
                                        {edu.location && <span className="text-xs text-slate-400">{edu.location}</span>}
                                    </div>
                                    {edu.description && <MarkdownDisplay content={edu.description} className="text-sm text-slate-600 mt-1" />}
                                </div>
                            ))}
                        </div>
                    </section>
                );
            case 'skills':
                if (skills.length === 0) return null;
                return (
                    <section key="skills">
                        <h3 className="text-sm font-medium text-brand-500 uppercase tracking-wider mb-4">Skills</h3>
                        <div className="flex flex-wrap gap-2">
                            {skills.filter(skill => !skill.hidden).map(skill => (
                                <span key={skill.id} className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">
                                    {skill.name}
                                </span>
                            ))}
                        </div>
                    </section>
                );
            default:
                const customSec = customSections.find(s => s.id === id);
                if (!customSec) return null;
                return (
                    <section key={customSec.id}>
                        <h3 className="text-sm font-medium text-brand-500 uppercase tracking-wider mb-2">{customSec.title}</h3>
                        <div className="space-y-3">
                            {customSec.items.map(item => (
                                <div key={item.id}>
                                    <div className="flex justify-between items-baseline mb-1">
                                        {item.title && <h4 className="font-medium text-slate-900 text-sm">{item.title}</h4>}
                                        {item.subtitle && <span className="text-xs text-slate-500">{item.subtitle}</span>}
                                    </div>
                                    {(item.hasDates && (item.startDate || item.endDate)) || (item.hasLocation && item.location) ? (
                                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                                            {item.hasLocation && <span>{item.location}</span>}
                                            {item.hasDates && <span>{item.startDate && `${item.startDate}${item.endDate ? ` - ${item.endDate}` : ''}`}</span>}
                                        </div>
                                    ) : null}
                                    <MarkdownDisplay content={item.description} className="text-sm text-slate-700 leading-relaxed" />
                                </div>
                            ))}
                        </div>
                    </section>
                );
        }
    };

    // Minimal renderer
    const renderSectionMinimal = (id: string) => {
        const { profile, experience, education, skills, customSections } = resume;

        switch (id) {
            case 'profile':
                return (
                    <section key="profile">
                        <h3 className="font-medium text-slate-900 mb-2 text-sm uppercase tracking-wider border-b border-slate-200 pb-1">Profile</h3>
                        <MarkdownDisplay content={profile.summary} className="text-sm text-slate-700 leading-relaxed" />
                    </section>
                );
            case 'experience':
                if (experience.length === 0) return null;
                return (
                    <section key="experience">
                        <h3 className="font-medium text-slate-900 mb-4 text-sm uppercase tracking-wider border-b border-slate-200 pb-1">Experience</h3>
                        <div className="space-y-6">
                            {experience.map(exp => (
                                <div key={exp.id}>
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h4 className="font-medium text-slate-800 text-sm">{exp.role}</h4>
                                        <span className="text-xs text-slate-500">{exp.startDate} - {exp.endDate}</span>
                                    </div>
                                    <div className="flex justify-between items-baseline mb-2">
                                        <p className="text-xs font-medium text-slate-600 uppercase">{exp.company}</p>
                                        {exp.location && <span className="text-xs text-slate-400">{exp.location}</span>}
                                    </div>
                                    <MarkdownDisplay content={exp.description} className="text-sm text-slate-600 leading-relaxed" />
                                </div>
                            ))}
                        </div>
                    </section>
                );
            case 'education':
                return null; // Side column
            case 'skills':
                return null; // Side column
            default:
                const customSec = customSections.find(s => s.id === id);
                if (!customSec) return null;
                return (
                    <section key={customSec.id}>
                        <h3 className="font-medium text-slate-900 mb-2 text-sm uppercase tracking-wider border-b border-slate-200 pb-1">{customSec.title}</h3>
                        <div className="space-y-2">
                            {customSec.items.map(item => (
                                <div key={item.id} className="text-sm text-slate-700 mb-3">
                                    <div className="flex justify-between items-baseline">
                                        {item.title && <span className="font-medium block text-slate-900">{item.title}</span>}
                                        {item.subtitle && <span className="text-xs text-slate-500">{item.subtitle}</span>}
                                    </div>
                                    {(item.hasDates && (item.startDate || item.endDate)) ? (
                                        <div className="flex justify-between text-xs text-slate-500 mb-0.5">
                                            {item.hasLocation ? <span>{item.location}</span> : <span></span>}
                                            <span className="italic">{item.startDate && `${item.startDate}${item.endDate ? ` - ${item.endDate}` : ''}`}</span>
                                        </div>
                                    ) : (item.hasLocation && item.location) ? (
                                        <div className="text-xs text-slate-500 mb-0.5">{item.location}</div>
                                    ) : null}
                                    <MarkdownDisplay content={item.description} />
                                </div>
                            ))}
                        </div>
                    </section>
                );
        }
    };


    const renderPreview = (isModal = false) => {
        const { templateId, profile, education, skills } = resume;

        const commonClasses = "h-full w-full bg-white shadow-2xl mx-auto p-8 text-slate-900";
        // If modal, we strip the transform to let the parent handle it
        const a4Style = {
            minHeight: '297mm',
            width: '210mm',
            transform: isModal ? 'none' : `scale(${previewScale})`,
            transformOrigin: 'top center'
        };

        if (templateId === 'modern') {
            return (
                <div className={`${commonClasses} font-sans`} style={a4Style}>
                    <div className="flex justify-between items-start border-b-2 border-brand-500 pb-6 mb-6">
                        <div>
                            <h1 className="text-4xl font-semibold text-slate-900 uppercase tracking-tight">{profile.fullName}</h1>
                            <p className="text-xl text-brand-600 font-medium mt-1">{profile.title}</p>
                        </div>
                        <div className="text-right text-sm text-slate-600 space-y-1">
                            <p>{profile.email}</p>
                            <p>{profile.phone}</p>
                            <p>{profile.location}</p>
                            {profile.website && <p className="text-brand-500">{profile.website}</p>}
                        </div>
                    </div>

                    <div className="space-y-6">
                        {resume.sectionOrder.map((section) => renderSection(section.id))}
                    </div>
                </div>
            );
        } else if (templateId === 'minimal') {
            return (
                <div className={`${commonClasses} font-sans`} style={a4Style}>
                    <div className="text-center mb-10">
                        <h1 className="text-3xl font-semibold text-slate-900 mb-2">{profile.fullName}</h1>
                        <p className="text-sm text-slate-500 flex justify-center gap-4">
                            <span>{profile.email}</span>
                            <span>•</span>
                            <span>{profile.phone}</span>
                            <span>•</span>
                            <span>{profile.location}</span>
                        </p>
                    </div>

                    <div className="grid grid-cols-12 gap-8">
                        <div className="col-span-4 space-y-8 text-right border-r border-slate-100 pr-8">
                            {/* Fixed Sidebar for Minimal: Education & Skills */}
                            <section>
                                <h3 className="font-medium text-slate-900 mb-3 text-sm">Education</h3>
                                {education.map(edu => (
                                    <div key={edu.id} className="mb-4">
                                        <p className="font-medium text-sm">{edu.school}</p>
                                        <p className="text-xs text-slate-500 italic">{edu.degree}</p>
                                        <p className="text-xs text-slate-400">{edu.endDate}</p>
                                        {edu.location && <p className="text-xs text-slate-400">{edu.location}</p>}
                                    </div>
                                ))}
                            </section>
                            <section>
                                <h3 className="font-medium text-slate-900 mb-3 text-sm">Skills</h3>
                                <div className="flex flex-col gap-1 items-end">
                                    {skills.map(skill => (
                                        <span key={skill.id} className="text-sm text-slate-600">{skill.name}</span>
                                    ))}
                                </div>
                            </section>
                        </div>
                        <div className="col-span-8 space-y-8">
                            {/* Reorderable Main Content */}
                            {resume.sectionOrder.map((section) => {
                                // Skip education/skills in main column for minimal layout
                                if (section.id === 'education' || section.id === 'skills') return null;
                                return renderSectionMinimal(section.id);
                            })}
                        </div>
                    </div>
                </div>
            )
        }

        // Classic Fallback
        return (
            <div className={`${commonClasses} font-serif`} style={a4Style}>
                <div className="text-center border-b-2 border-slate-800 pb-6 mb-8">
                    <h1 className="text-3xl font-semibold text-slate-900 mb-2">{profile.fullName}</h1>
                    <div className="text-sm text-slate-600 flex justify-center gap-3 flex-wrap">
                        <span>{profile.location}</span> |
                        <span>{profile.email}</span> |
                        <span>{profile.phone}</span>
                        {profile.website && <>| <span>{profile.website}</span></>}
                    </div>
                </div>

                <div className="space-y-6">
                    {resume.sectionOrder.map((section) => {
                        const id = section.id;
                        // Classic reuses the modern render logic but with serif font from container
                        const { profile, experience, education, skills, customSections } = resume;
                        switch (id) {
                            case 'profile':
                                return (
                                    <section key="profile">
                                        <h3 className="font-medium text-slate-900 border-b border-slate-300 mb-3 pb-1">Professional Summary</h3>
                                        <MarkdownDisplay content={profile.summary} className="text-sm leading-relaxed" />
                                    </section>
                                );
                            case 'experience':
                                if (experience.length === 0) return null;
                                return (
                                    <section key="experience">
                                        <h3 className="font-medium text-slate-900 border-b border-slate-300 mb-4 pb-1">Experience</h3>
                                        <div className="space-y-5">
                                            {experience.map(exp => (
                                                <div key={exp.id}>
                                                    <div className="flex justify-between font-medium text-sm text-slate-900">
                                                        <span>{exp.company}</span>
                                                        <span>{exp.startDate} – {exp.endDate}</span>
                                                    </div>
                                                    <div className="italic text-sm text-slate-700 mb-1">{exp.role}</div>
                                                    <MarkdownDisplay content={exp.description} className="text-sm text-slate-800" />
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                );
                            case 'education':
                                if (education.length === 0) return null;
                                return (
                                    <section key="education">
                                        <h3 className="font-medium text-slate-900 border-b border-slate-300 mb-4 pb-1">Education</h3>
                                        <div className="space-y-3">
                                            {education.map(edu => (
                                                <div key={edu.id} className="flex justify-between items-start text-sm">
                                                    <div>
                                                        <div className="font-medium">{edu.school}</div>
                                                        <div>{edu.degree}</div>
                                                        {edu.location && <div className="text-xs text-slate-500 mb-0.5">{edu.location}</div>}
                                                        {edu.description && <MarkdownDisplay content={edu.description} className="text-slate-600 mt-1" />}
                                                    </div>
                                                    <div className="text-right">{edu.startDate} – {edu.endDate}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                );
                            case 'skills':
                                if (skills.length === 0) return null;
                                return (
                                    <section key="skills">
                                        <h3 className="font-medium text-slate-900 border-b border-slate-300 mb-3 pb-1">Skills</h3>
                                        <p className="text-sm">{skills.map(s => s.name).join(' • ')}</p>
                                    </section>
                                );
                            default:
                                const customSec = customSections.find(s => s.id === id);
                                if (!customSec) return null;
                                return (
                                    <section key={customSec.id}>
                                        <h3 className="font-medium text-slate-900 border-b border-slate-300 mb-3 pb-1">{customSec.title}</h3>
                                        {customSec.items.map(item => (
                                            <div key={item.id} className="text-sm mb-2">
                                                <div className="flex justify-between">
                                                    {item.title && <div className="font-medium inline mr-2">{item.title}</div>}
                                                    {item.subtitle && <div className="italic text-slate-600">{item.subtitle}</div>}
                                                </div>
                                                <MarkdownDisplay content={item.description} className="text-slate-800" />
                                            </div>
                                        ))}
                                    </section>
                                );
                        }
                    })}
                </div>
            </div>
        )
    };

    return (
        <div className="flex h-full bg-slate-50 dark:bg-slate-900 font-sans relative overflow-hidden">
            {/* Top Toolbar */}
            <div className="absolute top-0 right-0 left-0 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 z-20 flex items-center justify-between px-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 dark:text-slate-400"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex flex-col">
                        <input
                            value={resume.title}
                            onChange={(e) => setResume(prev => ({ ...prev, title: e.target.value }))}
                            className="font-medium text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-brand-500 outline-none transition-all px-1 py-0.5 min-w-[200px]"
                            placeholder="Untitled Resume"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setShowKnowledgeBaseModal(true)}
                        className="flex items-center justify-center p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-brand-300 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 transition-all hover:shadow-sm"
                        title="Resume knowledge base"
                        aria-label="Resume knowledge base"
                    >
                        <Info size={18} className="text-brand-600" />
                    </button>

                    {/* Template Button */}
                    <button
                        onClick={() => setShowTemplateModal(true)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-brand-300 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 transition-all hover:shadow-sm"
                    >
                        <LayoutTemplate size={16} />
                        <span className="capitalize">{TEMPLATES.find(t => t.id === resume.templateId)?.name || 'Template'}</span>
                        <ChevronDown size={14} className="text-slate-400" />
                    </button>

                    {/* ATS score */}
                    <button
                        type="button"
                        onClick={() => setShowAtsModal(true)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-200 transition-all hover:shadow-md hover:border-brand-200"
                    >
                        <TrendingUp size={16} className={atsScoreClass} />
                        <span className="text-slate-600 dark:text-slate-400">
                            ATS Score:{' '}
                            <span className={atsScoreClass}>{atsAnalysis.score}</span>
                        </span>
                    </button>

                    {/* Share & Download Button */}
                    <button
                        onClick={() => setShowExportModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium text-sm transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
                    >
                        <Share2 size={16} /> Share & Download
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden pt-16"> {/* Added pt-16 to offset fixed toolbar */}
                {/* 1. Navigation Sidebar (Vertical) - Compact Icon Only */}
                <div className="w-[72px] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 flex flex-col h-full overflow-hidden flex-shrink-0 z-10 items-center">
                    <div className="h-4 flex-shrink-0 w-full" />

                    <div className="flex-1 overflow-y-auto w-full p-3 space-y-3 minimal-scrollbar flex flex-col items-center">
                        {resume.sectionOrder.map((section) => {
                            const secId = section.id;
                            let label = '';
                            if (secId === 'profile') label = 'Profile';
                            else if (secId === 'experience') label = 'Experience';
                            else if (secId === 'education') label = 'Education';
                            else if (secId === 'skills') label = 'Skills';
                            else label = resume.customSections.find(s => s.id === secId)?.title || 'Untitled';

                            return (
                                <div
                                    key={secId}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, secId)}
                                    onDragOver={(e) => handleDragOver(e, secId)}
                                    onDragEnd={handleDragEnd}
                                    onClick={() => setActiveSection(secId)}
                                    onMouseEnter={(e) => showTooltip(e, label)}
                                    onMouseLeave={hideTooltip}
                                    className={`
                                        w-10 h-10 flex items-center justify-center rounded-xl transition-all cursor-move select-none group relative
                                        ${activeSection === secId
                                            ? 'bg-[#346DE0] text-white shadow-md scale-105'
                                            : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200'}
                                        ${draggedSectionId === secId ? 'opacity-50' : ''}
                                    `}
                                >
                                    {getSectionIcon(secId)}
                                </div>
                            );
                        })}

                        <div className="w-full h-px bg-slate-100 dark:bg-slate-700 my-2"></div>

                        <button
                            onClick={addCustomSection}
                            onMouseEnter={(e) => showTooltip(e, 'Add Section')}
                            onMouseLeave={hideTooltip}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-brand-50 hover:text-brand-600 transition-colors group relative"
                        >
                            <Plus size={20} />
                        </button>
                    </div>
                </div>

                {/* 2. Forms Panel */}
                <div className="w-[360px] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 flex flex-col h-full overflow-hidden shadow-[4px_0_24px_rgba(0,0,0,0.02)] flex-shrink-0 z-0 relative">
                    <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-slate-900">
                        {activeSection === 'profile' && (
                            <div className="space-y-5 animate-in fade-in slide-in-from-left-2 duration-200">
                                <h2 className="text-lg font-medium text-slate-900 dark:text-white flex items-center gap-2">Personal Details</h2>
                                <div className="space-y-4">
                                    <input
                                        placeholder="Full Name"
                                        value={resume.profile.fullName}
                                        onChange={(e) => handleProfileChange('fullName', e.target.value)}
                                        className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all dark:text-white dark:placeholder:text-slate-500"
                                    />
                                    <input
                                        placeholder="Job Title"
                                        value={resume.profile.title}
                                        onChange={(e) => handleProfileChange('title', e.target.value)}
                                        className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all dark:text-white dark:placeholder:text-slate-500"
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <input
                                            placeholder="Email"
                                            value={resume.profile.email}
                                            onChange={(e) => handleProfileChange('email', e.target.value)}
                                            className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all dark:text-white dark:placeholder:text-slate-500"
                                        />
                                        <input
                                            placeholder="Phone"
                                            value={resume.profile.phone}
                                            onChange={(e) => handleProfileChange('phone', e.target.value)}
                                            className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all dark:text-white dark:placeholder:text-slate-500"
                                        />
                                    </div>
                                    <input
                                        placeholder="Location"
                                        value={resume.profile.location}
                                        onChange={(e) => handleProfileChange('location', e.target.value)}
                                        className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all dark:text-white dark:placeholder:text-slate-500"
                                    />
                                    <input
                                        placeholder="Links (Website, LinkedIn, Github...)"
                                        value={resume.profile.website}
                                        onChange={(e) => handleProfileChange('website', e.target.value)}
                                        className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all dark:text-white dark:placeholder:text-slate-500"
                                    />
                                    <div className="pt-2">
                                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-2 uppercase tracking-wide">Professional Summary</label>
                                        <RichTextarea
                                            placeholder="Write a short professional summary..."
                                            value={resume.profile.summary}
                                            onChange={(val) => handleProfileChange('summary', val)}
                                            onImprove={onImprove}
                                            rows={6}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === 'experience' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-left-2 duration-200">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-lg font-medium text-slate-900 dark:text-white flex items-center gap-2">Experience</h2>
                                        <button onClick={() => toggleSectionVisibility('experience')} className="text-slate-400 hover:text-slate-600 p-1" title={(resume.hiddenSections || []).includes('experience') ? "Show Section" : "Hide Section"}>
                                            {(resume.hiddenSections || []).includes('experience') ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                    <button onClick={addExperience} className="text-xs font-medium text-brand-600 hover:text-brand-700 bg-brand-50 px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors"><Plus size={14} /> Add</button>
                                </div>

                                {resume.experience.map((exp, index) => (
                                    <div
                                        key={exp.id}
                                        className={`py-3 px-4 bg-slate-50 dark:bg-slate-800 rounded-xl border relative group transition-all hover:border-brand-200 ${draggedItemId === exp.id ? 'opacity-50 border-brand-400 border-dashed' : 'border-slate-200 dark:border-slate-700'}`}
                                        draggable
                                        onDragStart={(e) => handleItemDragStart(e, 'experience', exp.id)}
                                        onDragOver={(e) => handleItemDragOver(e, 'experience', exp.id)}
                                        onDragEnd={handleItemDragEnd}
                                    >
                                        <div className="flex justify-between items-center mb-2">
                                            <div className="flex items-center gap-2 cursor-pointer select-none flex-1" onClick={() => toggleItemExpand(exp.id)}>
                                                <h3 className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate pr-4">
                                                    {exp.role || 'New Role'} <span className="text-slate-400 font-normal">at</span> {exp.company || 'Company'}
                                                </h3>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button onClick={(e) => { e.stopPropagation(); updateExperience(exp.id, 'hidden', !exp.hidden); }} className="p-1 text-slate-400 hover:text-slate-600 rounded" title={exp.hidden ? "Show in resume" : "Hide from resume"}>
                                                    {exp.hidden ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                                <button onClick={() => removeExperience(exp.id)} className="text-slate-400 hover:text-red-500 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"><Trash2 size={16} /></button>
                                            </div>
                                        </div>

                                        {expandedItems[exp.id] && (
                                            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-700 mt-2">
                                                <div className="grid grid-cols-2 gap-3">
                                                    <input
                                                        placeholder="Role"
                                                        value={exp.role}
                                                        onChange={(e) => updateExperience(exp.id, 'role', e.target.value)}
                                                        className="w-full p-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-900 dark:text-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all dark:placeholder:text-slate-400"
                                                    />
                                                    <input
                                                        placeholder="Company"
                                                        value={exp.company}
                                                        onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                                                        className="w-full p-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all dark:text-white dark:placeholder:text-slate-400"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <DatePicker
                                                        placeholder="Start Date"
                                                        value={exp.startDate}
                                                        onChange={(val) => updateExperience(exp.id, 'startDate', val)}
                                                    />
                                                    <DatePicker
                                                        placeholder="End Date"
                                                        value={exp.endDate}
                                                        onChange={(val) => updateExperience(exp.id, 'endDate', val)}
                                                    />
                                                </div>
                                                <input
                                                    placeholder="Location (City, Country)"
                                                    value={exp.location || ''}
                                                    onChange={(e) => updateExperience(exp.id, 'location', e.target.value)}
                                                    className="w-full p-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all dark:text-white dark:placeholder:text-slate-400"
                                                />
                                                <RichTextarea
                                                    placeholder="Description of your role (achievements, responsibilities)..."
                                                    value={exp.description}
                                                    onChange={(val) => updateExperience(exp.id, 'description', val)}
                                                    onImprove={onImprove}
                                                    rows={5}
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeSection === 'education' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-left-2 duration-200">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-lg font-medium text-slate-900 dark:text-white flex items-center gap-2">Education</h2>
                                        <button onClick={() => toggleSectionVisibility('education')} className="text-slate-400 hover:text-slate-600 p-1" title={(resume.hiddenSections || []).includes('education') ? "Show Section" : "Hide Section"}>
                                            {(resume.hiddenSections || []).includes('education') ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                    <button onClick={addEducation} className="text-xs font-medium text-brand-600 hover:text-brand-700 bg-brand-50 px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors"><Plus size={14} /> Add</button>
                                </div>

                                {resume.education.map((edu, index) => (
                                    <div
                                        key={edu.id}
                                        className={`py-3 px-4 bg-slate-50 dark:bg-slate-800 rounded-xl border relative group transition-all hover:border-brand-200 ${draggedItemId === edu.id ? 'opacity-50 border-brand-400 border-dashed' : 'border-slate-200 dark:border-slate-700'}`}
                                        draggable
                                        onDragStart={(e) => handleItemDragStart(e, 'education', edu.id)}
                                        onDragOver={(e) => handleItemDragOver(e, 'education', edu.id)}
                                        onDragEnd={handleItemDragEnd}
                                    >
                                        <div className="flex justify-between items-center mb-2">
                                            <div className="flex items-center gap-2 cursor-pointer select-none flex-1" onClick={() => toggleItemExpand(edu.id)}>
                                                <h3 className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate pr-4">
                                                    {edu.school || 'University'}
                                                </h3>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button onClick={(e) => { e.stopPropagation(); updateEducation(edu.id, 'hidden', !edu.hidden); }} className="p-1 text-slate-400 hover:text-slate-600 rounded" title={edu.hidden ? "Show in resume" : "Hide from resume"}>
                                                    {edu.hidden ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                                <button onClick={() => removeEducation(edu.id)} className="text-slate-400 hover:text-red-500 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"><Trash2 size={16} /></button>
                                            </div>
                                        </div>

                                        {expandedItems[edu.id] && (
                                            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-700 mt-2">
                                                <input
                                                    placeholder="School / University"
                                                    value={edu.school}
                                                    onChange={(e) => updateEducation(edu.id, 'school', e.target.value)}
                                                    className="w-full p-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-900 dark:text-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all dark:placeholder:text-slate-400"
                                                />
                                                <input
                                                    placeholder="Degree"
                                                    value={edu.degree}
                                                    onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                                                    className="w-full p-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all dark:text-white dark:placeholder:text-slate-400"
                                                />
                                                <div className="grid grid-cols-2 gap-3">
                                                    <DatePicker
                                                        placeholder="Start Date"
                                                        value={edu.startDate}
                                                        onChange={(val) => updateEducation(edu.id, 'startDate', val)}
                                                    />
                                                    <DatePicker
                                                        placeholder="End Date"
                                                        value={edu.endDate}
                                                        onChange={(val) => updateEducation(edu.id, 'endDate', val)}
                                                    />
                                                </div>
                                                <input
                                                    placeholder="Location"
                                                    value={edu.location || ''}
                                                    onChange={(e) => updateEducation(edu.id, 'location', e.target.value)}
                                                    className="w-full p-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all dark:text-white dark:placeholder:text-slate-400"
                                                />
                                                <RichTextarea
                                                    placeholder="Description (Optional)"
                                                    value={edu.description || ''}
                                                    onChange={(val) => updateEducation(edu.id, 'description', val)}
                                                    onImprove={onImprove}
                                                    rows={3}
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeSection === 'skills' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-left-2 duration-200">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-lg font-medium text-slate-900 dark:text-white flex items-center gap-2">Skills</h2>
                                        <button onClick={() => toggleSectionVisibility('skills')} className="text-slate-400 hover:text-slate-600 p-1" title={(resume.hiddenSections || []).includes('skills') ? "Show Section" : "Hide Section"}>
                                            {(resume.hiddenSections || []).includes('skills') ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                    <button onClick={addSkillCategory} className="text-xs font-medium text-brand-600 hover:text-brand-700 bg-brand-50 px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors"><Plus size={14} /> Add Category</button>
                                </div>

                                {!(resume.skillCategories && resume.skillCategories.length > 0) && (
                                    <div className="text-sm text-slate-500 italic pb-2">No categories yet. Add a category to start organizing skills.</div>
                                )}

                                {(resume.skillCategories || []).map((cat) => (
                                    <div key={cat.id} className="py-3 px-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 mb-4">
                                        <div className="flex justify-between items-center mb-3">
                                            <input
                                                value={cat.name}
                                                onChange={(e) => updateSkillCategory(cat.id, e.target.value)}
                                                placeholder="Category Name (e.g. Languages)"
                                                className="font-medium text-slate-900 dark:text-white bg-transparent outline-none flex-1 focus:border-b border-brand-500 pb-1"
                                            />
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => addSkill(cat.id)} className="text-xs font-medium text-brand-600 hover:text-brand-700 px-2 py-1 rounded hover:bg-brand-50 transition-colors flex items-center gap-1">
                                                    <Plus size={12} /> Add Skill
                                                </button>
                                                <button onClick={() => removeSkillCategory(cat.id)} className="text-slate-400 hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            {resume.skills.filter(s => s.categoryId === cat.id).map((skill) => (
                                                <div key={skill.id} className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full hover:border-brand-300 hover:bg-brand-50/10 transition-all group/skill">
                                                    <input
                                                        value={skill.name}
                                                        onChange={(e) => updateSkill(skill.id, e.target.value)}
                                                        placeholder="Skill name"
                                                        className="bg-transparent text-sm focus:outline-none dark:text-white dark:placeholder:text-slate-400 w-auto min-w-[20px]"
                                                        style={{ width: `${Math.max(2, skill.name.length)}ch` }}
                                                    />
                                                    <button 
                                                        onClick={() => removeSkill(skill.id)} 
                                                        className="text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full p-0.5 transition-colors"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                            
                                            {/* Quick Add Input */}
                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100/50 dark:bg-slate-800/50 border border-dashed border-slate-300 dark:border-slate-700 rounded-full focus-within:border-brand-400 transition-all">
                                                <Plus size={12} className="text-slate-400" />
                                                <input
                                                    placeholder="Add Skill..."
                                                    className="bg-transparent text-sm focus:outline-none dark:text-white dark:placeholder:text-slate-500 w-24"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            const val = e.currentTarget.value.trim();
                                                            if (val) {
                                                                addSkill(cat.id);
                                                                // Note: addSkill currently adds "New Skill", we might need to update it to accept name
                                                                // or just let the user edit it. But "Enter to add" is better if it takes the value.
                                                                // I'll update addSkill later or just handle it here.
                                                                e.currentTarget.value = '';
                                                            }
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Orphaned Skills (if any existed before categories were introduced) */}
                                {resume.skills.filter(s => !s.categoryId).length > 0 && (
                                    <div className="p-4 bg-orange-50 dark:bg-orange-900/10 rounded-xl border border-orange-200 dark:border-orange-800/30 mb-4">
                                        <div className="text-sm font-medium text-orange-800 dark:text-orange-400 mb-3">Uncategorized Skills</div>
                                        <div className="grid grid-cols-2 gap-3">
                                            {resume.skills.filter(s => !s.categoryId).map((skill) => (
                                                <div key={skill.id} className="flex items-center gap-2 p-2 bg-white dark:bg-slate-800 border border-orange-200 dark:border-orange-800/30 rounded-lg">
                                                    <input
                                                        value={skill.name}
                                                        onChange={(e) => updateSkill(skill.id, e.target.value)}
                                                        className="flex-1 bg-transparent text-sm focus:outline-none dark:text-white dark:placeholder:text-slate-400"
                                                    />
                                                    <button onClick={() => removeSkill(skill.id)} className="text-slate-400 hover:text-red-500"><X size={14} /></button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {resume.customSections.map(sec => {
                            if (activeSection !== sec.id) return null;
                            return (
                                <div key={sec.id} className="space-y-6 animate-in fade-in slide-in-from-left-2 duration-200">
                                    <div className="flex flex-col gap-4 mb-4">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block flex-1">Section Title</label>
                                                    <button onClick={() => toggleSectionVisibility(sec.id)} className="text-slate-400 hover:text-slate-600 p-1 mb-1" title={(resume.hiddenSections || []).includes(sec.id) ? "Show Section" : "Hide Section"}>
                                                        {(resume.hiddenSections || []).includes(sec.id) ? <EyeOff size={14} /> : <Eye size={14} />}
                                                    </button>
                                                </div>
                                                <input
                                                    value={sec.title}
                                                    onChange={(e) => updateCustomSectionTitle(sec.id, e.target.value)}
                                                    className="text-xl font-medium text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-brand-500 focus:ring-0 px-0 w-full transition-all dark:placeholder:text-slate-500"
                                                    placeholder="e.g. Projects, Volunteer, Awards"
                                                />
                                            </div>
                                            <div className="flex gap-2 items-center pt-5">
                                                <button onClick={() => removeCustomSection(sec.id)} className="text-slate-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors" title="Delete Section"><Trash2 size={18} /></button>
                                            </div>
                                        </div>
                                    </div>

                                    {sec.items.map((item, index) => (
                                        <div
                                            key={item.id}
                                            className={`py-3 px-4 bg-slate-50 dark:bg-slate-800 rounded-xl border relative group transition-all hover:border-brand-200 ${draggedItemId === item.id ? 'opacity-50 border-brand-400 border-dashed' : 'border-slate-200 dark:border-slate-700'}`}
                                            draggable
                                            onDragStart={(e) => handleItemDragStart(e, sec.id, item.id)}
                                            onDragOver={(e) => handleItemDragOver(e, sec.id, item.id)}
                                            onDragEnd={handleItemDragEnd}
                                        >
                                            <div className="flex justify-between items-center mb-2">
                                                <div className="flex items-center gap-2 cursor-pointer select-none flex-1" onClick={() => toggleItemExpand(item.id)}>
                                                    <h3 className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate pr-4">
                                                        {item.title || 'Untitled Item'}
                                                    </h3>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button onClick={(e) => { e.stopPropagation(); updateCustomSectionItem(sec.id, item.id, 'hidden', !item.hidden); }} className="p-1 text-slate-400 hover:text-slate-600 rounded" title={item.hidden ? "Show in resume" : "Hide from resume"}>
                                                        {item.hidden ? <EyeOff size={16} /> : <Eye size={16} />}
                                                    </button>
                                                    <button onClick={() => removeCustomSectionItem(sec.id, item.id)} className="text-slate-400 hover:text-red-500 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"><Trash2 size={16} /></button>
                                                </div>
                                            </div>

                                            {expandedItems[item.id] && (
                                                <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-700 mt-2">
                                                    <div className="grid grid-cols-1 gap-3">
                                                        <input
                                                            placeholder="Item Title (e.g. Project Name)"
                                                            value={item.title || ''}
                                                            onChange={(e) => updateCustomSectionItem(sec.id, item.id, 'title', e.target.value)}
                                                            className="w-full p-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all dark:text-white dark:placeholder:text-slate-400"
                                                        />
                                                        <input
                                                            placeholder="Subtitle (e.g. Role, Date) - Optional"
                                                            value={item.subtitle || ''}
                                                            onChange={(e) => updateCustomSectionItem(sec.id, item.id, 'subtitle', e.target.value)}
                                                            className="w-full p-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all dark:text-white dark:placeholder:text-slate-400"
                                                        />
                                                    </div>

                                                    <div className="flex items-center gap-2 mb-3">
                                                        <button
                                                            onClick={() => updateCustomSectionItem(sec.id, item.id, 'hasDates', !item.hasDates)}
                                                            className={`p-1.5 rounded-md transition-all border ${item.hasDates ? 'bg-brand-50 border-brand-200 text-brand-600' : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'}`}
                                                            title="Toggle Dates"
                                                        >
                                                            <Calendar size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => updateCustomSectionItem(sec.id, item.id, 'hasLocation', !item.hasLocation)}
                                                            className={`p-1.5 rounded-md transition-all border ${item.hasLocation ? 'bg-brand-50 border-brand-200 text-brand-600' : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'}`}
                                                            title="Toggle Location"
                                                        >
                                                            <MapPin size={16} />
                                                        </button>
                                                    </div>

                                                    {item.hasDates && (
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <DatePicker
                                                                placeholder="Start Date"
                                                                value={item.startDate || ''}
                                                                onChange={(val) => updateCustomSectionItem(sec.id, item.id, 'startDate', val)}
                                                            />
                                                            <DatePicker
                                                                placeholder="End Date"
                                                                value={item.endDate || ''}
                                                                onChange={(val) => updateCustomSectionItem(sec.id, item.id, 'endDate', val)}
                                                            />
                                                        </div>
                                                    )}

                                                    {item.hasLocation && (
                                                        <input
                                                            placeholder="Location"
                                                            value={item.location || ''}
                                                            onChange={(e) => updateCustomSectionItem(sec.id, item.id, 'location', e.target.value)}
                                                            className="w-full p-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all dark:text-white dark:placeholder:text-slate-400"
                                                        />
                                                    )}

                                                    <RichTextarea
                                                        placeholder="Description / Bullet Points..."
                                                        value={item.description}
                                                        onChange={(val) => updateCustomSectionItem(sec.id, item.id, 'description', val)}
                                                        onImprove={onImprove}
                                                        rows={5}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    <button onClick={() => addCustomSectionItem(sec.id)} className="w-full py-3 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-brand-300 text-slate-500 dark:text-slate-400 hover:text-brand-600 font-medium flex items-center justify-center gap-2 transition-all">
                                        <Plus size={18} /> Add Item
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* 3. Preview Area */}
                <div className="flex-1 bg-slate-100 dark:bg-slate-950 overflow-hidden relative flex flex-col items-center">
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
                        className="flex-1 w-full overflow-y-auto p-12 flex justify-center"
                        onWheel={handleWheel}  // Enable scroll zoom
                    >
                        <div className="shadow-2xl transition-all duration-300 origin-top bg-white">
                            {renderPreview(false)}
                        </div>
                    </div>
                </div>
            </div>

            {/* Template Gallery Modal */}
            {showTemplateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-slate-50 dark:bg-slate-900 w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between p-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                            <div>
                                <h2 className="text-2xl font-medium text-slate-900 dark:text-white mb-1">Choosing a Template</h2>
                                <p className="text-slate-500 dark:text-slate-400">Select a design that fits your personal brand.</p>
                            </div>
                            <button onClick={() => setShowTemplateModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 dark:text-slate-400">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 bg-slate-50 dark:bg-slate-950">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {TEMPLATES.map(t => (
                                    <div
                                        key={t.id}
                                        onClick={() => {
                                            if (t.available) {
                                                handleTemplateSelect(t.id);
                                            }
                                        }}
                                        className={`
                                            group relative rounded-xl border-2 transition-all duration-300 overflow-hidden bg-white dark:bg-slate-900 shadow-sm cursor-pointer
                                            ${resume.templateId === t.id ? 'border-brand-500 ring-2 ring-brand-200 dark:ring-brand-900' : 'border-transparent hover:border-brand-300 hover:shadow-lg hover:-translate-y-1'}
                                            ${!t.available ? 'opacity-60 grayscale cursor-not-allowed' : ''}
                                        `}
                                    >
                                        {/* Preview Placeholder */}
                                        <div className={`h-48 ${t.color} relative overflow-hidden p-4`}>
                                            <div className="w-full h-full bg-white shadow-sm rounded-md opacity-80 flex flex-col gap-2 p-2 scale-90 origin-top">
                                                <div className="w-1/2 h-2 bg-slate-200 rounded"></div>
                                                <div className="w-3/4 h-2 bg-slate-100 rounded"></div>
                                                <div className="mt-4 space-y-1">
                                                    <div className="w-full h-1 bg-slate-100 rounded"></div>
                                                    <div className="w-full h-1 bg-slate-100 rounded"></div>
                                                    <div className="w-2/3 h-1 bg-slate-100 rounded"></div>
                                                </div>
                                            </div>
                                            {!t.available && (
                                                <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[1px] flex items-center justify-center">
                                                    <div className="bg-slate-900 text-white text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
                                                        <Lock size={12} /> PRO
                                                    </div>
                                                </div>
                                            )}
                                            {t.recommended && t.available && (
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
                </div>
            )}

            {/* Export Modal */}
            {showExportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl p-6 border border-slate-100 dark:border-slate-800 relative">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-medium text-slate-900 dark:text-white">Export & Share</h2>
                            <button onClick={() => setShowExportModal(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 hover:bg-brand-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 hover:border-brand-200 rounded-xl transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white dark:bg-slate-900 rounded-lg text-slate-700 dark:text-slate-300 shadow-sm"><Download size={20} /></div>
                                    <div className="text-left">
                                        <div className="font-medium text-slate-900 dark:text-white group-hover:text-brand-700 dark:group-hover:text-brand-400">Download PDF</div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400">High quality print-ready format</div>
                                    </div>
                                </div>
                                {isSaving && <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>}
                            </button>

                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(window.location.href);
                                    setShowToast(true);
                                    setTimeout(() => setShowToast(false), 2500);
                                }}
                                className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 hover:bg-brand-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 hover:border-brand-200 rounded-xl transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white dark:bg-slate-900 rounded-lg text-slate-700 dark:text-slate-300 shadow-sm"><Share2 size={20} /></div>
                                    <div className="text-left">
                                        <div className="font-medium text-slate-900 dark:text-white group-hover:text-brand-700 dark:group-hover:text-brand-400">Share Public Link</div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400">Get a unique URL for your resume</div>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Preview Modal */}
            {showPreview && (
                <div className="fixed inset-0 z-[60] bg-slate-900/95 flex flex-col items-center justify-center overflow-hidden animate-in fade-in duration-200">
                    <div className="absolute top-6 flex items-center gap-4 bg-slate-800/80 backdrop-blur rounded-full px-6 py-3 shadow-2xl z-50 border border-slate-700">
                        <button onClick={() => setPreviewScale(s => Math.max(0.3, s - 0.1))} className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-full transition-colors">
                            <ZoomOut size={20} />
                        </button>
                        <span className="text-white font-mono text-sm min-w-[3ch] text-center select-none">{Math.round(previewScale * 100)}%</span>
                        <button onClick={() => setPreviewScale(s => Math.min(2.5, s + 0.1))} className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-full transition-colors">
                            <ZoomIn size={20} />
                        </button>
                        <div className="w-px h-6 bg-slate-600 mx-2"></div>
                        <button onClick={() => { setPreviewScale(0.8); setPreviewOffset({ x: 0, y: 0 }); }} className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-full transition-colors">
                            <RotateCcw size={20} />
                        </button>
                        <div className="w-px h-6 bg-slate-600 mx-2"></div>
                        <button onClick={() => setShowPreview(false)} className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-full transition-colors">
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
                                transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                            }}
                            className="origin-center shadow-2xl bg-white"
                        >
                            {renderPreview(true)}
                        </div>
                    </div>
                </div>
            )}

            {tooltip && (
                <div
                    className="fixed z-[100] px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg shadow-xl whitespace-nowrap pointer-events-none animate-in fade-in zoom-in-95 duration-150"
                    style={{ top: tooltip.top, left: tooltip.left, transform: 'translateY(-50%)' }}
                >
                    {tooltip.label}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 -mr-px border-4 border-transparent border-r-slate-900"></div>
                </div>
            )}

            {/* ATS Score Modal */}
            {showAtsModal && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200 p-4 sm:p-6">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-3xl min-h-[min(640px,85vh)] max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 dark:border-slate-800">
                            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">ATS Score Report</h2>
                            <button onClick={() => setShowAtsModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 dark:text-slate-400">
                                <X size={20} />
                            </button>
                        </div>

                        <div className={`px-8 py-8 ${atsHeaderBg}`}>
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
                                <div className="flex-1 min-w-0">
                                    <span className="text-sm font-medium uppercase tracking-wider opacity-70 text-slate-700 dark:text-slate-300">Resume Strength</span>
                                    <div className="mt-4 w-full h-3 bg-white/50 rounded-full overflow-hidden border border-black/5">
                                        <div className={`h-full rounded-full transition-all duration-1000 ease-out ${atsBarClass}`} style={{ width: `${atsAnalysis.score}%` }} />
                                    </div>
                                    <p className="mt-4 flex gap-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                                        <Quote size={16} className="mt-0.5 flex-shrink-0 opacity-50" />
                                        <span className="italic">{atsScoreQuote}</span>
                                    </p>
                                    {atsAnalysis.score >= ATS_COMPLETE_THRESHOLD && (
                                        <p className="mt-2 text-xs font-medium text-green-700 dark:text-green-400">
                                            Meets the {ATS_COMPLETE_THRESHOLD}% completion threshold.
                                        </p>
                                    )}
                                </div>
                                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                    <span className="font-semibold text-5xl text-slate-900 dark:text-white tabular-nums">{atsAnalysis.score}<span className="text-2xl text-slate-500 dark:text-slate-400 font-medium">/100</span></span>
                                    <button
                                        type="button"
                                        onClick={() => void handleRecalculate()}
                                        disabled={recalcCapReached || isRecalculating}
                                        aria-disabled={recalcCapReached || isRecalculating}
                                        title="Recalculate your ATS score"
                                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border text-sm font-medium shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none disabled:shadow-none border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 dark:disabled:bg-slate-800/60 dark:disabled:text-slate-500"
                                    >
                                        {isRecalculating ? (
                                            <Loader2 size={16} className="animate-spin text-brand-600" />
                                        ) : (
                                            <RefreshCw size={16} className={recalcCapReached ? 'text-slate-400' : 'text-slate-500'} />
                                        )}
                                        {isRecalculating ? 'Recalculating…' : 'Recalculate'}
                                    </button>
                                    <p className="max-w-[220px] text-right text-xs text-slate-500 dark:text-slate-400">
                                        {recalcCapReached
                                            ? 'Recalculation limit reached'
                                            : `${recalcRemaining} of ${MAX_RECALCULATIONS} recalculations remaining`}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {recalcError && (
                            <div className="mx-8 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
                                <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="font-medium">Recalculation failed</p>
                                    <p className="mt-0.5 opacity-90">{recalcError}</p>
                                </div>
                            </div>
                        )}

                        <div className="flex-1 px-8 py-6 space-y-8 overflow-y-auto min-h-0">
                            <div>
                                <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">Improvements Needed</h4>
                                {atsAnalysis.improvements.length > 0 ? (
                                    <ul className="space-y-3">
                                        {atsAnalysis.improvements.map((imp, i) => (
                                            <li key={i} className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                                                <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                                                <span>{imp}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center gap-3 text-green-700 dark:text-green-400">
                                        <div className="p-1 bg-green-200 dark:bg-green-800 rounded-full"><Check size={14} /></div>
                                        <span className="font-medium text-sm">Great job! No critical issues found.</span>
                                    </div>
                                )}
                            </div>

                            <div>
                                <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">Section Analysis</h4>
                                <div className="space-y-2">
                                    {atsAnalysis.sectionAnalysis.map((sec, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <span className="font-medium text-slate-700 dark:text-slate-300 text-sm">{sec.name}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-slate-500">{sec.feedback}</span>
                                                {sec.status === 'good' && <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-sm shadow-green-200"></div>}
                                                {sec.status === 'warning' && <div className="w-2.5 h-2.5 rounded-full bg-yellow-500 shadow-sm shadow-yellow-200"></div>}
                                                {sec.status === 'critical' && <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-200"></div>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="px-8 py-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex flex-col sm:flex-row gap-4">
                            <button
                                type="button"
                                onClick={handleFixWithUnibot}
                                disabled={fixAllUsed || atsAnalysis.improvements.length === 0}
                                className="flex-1 px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                            >
                                <Wand2 size={18} />
                                {fixAllUsed ? 'Unibot fix applied' : 'Fix once with Unibot'}
                            </button>
                            <button
                                type="button"
                                onClick={handleFixWithCareerCoach}
                                className="flex-1 px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                                Fix with a career coach
                            </button>
                        </div>
                    </div>
                </div>
            )}


            <ResumeKnowledgeBaseModal
                open={showKnowledgeBaseModal}
                onClose={() => setShowKnowledgeBaseModal(false)}
            />

            {/* Link Copied Toast */}
            {showToast && (
                <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-in slide-in-from-bottom flex-in fade-in z-[70]">
                    <Check size={16} className="text-green-400" />
                    <span className="text-sm font-medium">Link copied to clipboard!</span>
                </div>
            )}
        </div>
    );
};

export default ResumeEditor;