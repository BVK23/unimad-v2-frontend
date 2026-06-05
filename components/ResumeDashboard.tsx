import React, { useState } from 'react';
import { FileText, Plus, Clock, MoreVertical, FilePlus, Upload, FileType, X, Edit, Copy, Trash2, Download, Link, ExternalLink, ArrowLeft, Star } from 'lucide-react';
import { ResumeData } from '../types';

interface ResumeDashboardProps {
    onEditResume: (resume: ResumeData) => void;
    onCreateResume: (type: 'scratch' | 'jd' | 'upload') => void;
}

// Mock Data Initial State
const INITIAL_RESUMES: ResumeData[] = [
    {
        id: '1',
        title: 'Product Design Resume',
        lastModified: new Date('2023-10-15'),
        templateId: 'modern',
        isBase: true,
        slug: 'alex-morgan-design',
        profile: {
            fullName: 'Alex Morgan',
            email: 'alex@unimad.dev',
            phone: '+1 (555) 012-3456',
            location: 'San Francisco, CA',
            summary: 'Product Designer with 5 years of experience...',
            title: 'Senior Product Designer'
        },
        experience: [],
        education: [],
        skills: [],
        projects: [],
        certifications: [],
        customSections: [],
        sectionOrder: [
            { id: 'profile' },
            { id: 'experience' },
            { id: 'education' },
            { id: 'skills' },
        ],
    },
    {
        id: '2',
        title: 'Frontend Developer Variant',
        lastModified: new Date('2023-09-20'),
        templateId: 'minimal',
        slug: 'alex-morgan-dev',
        profile: {
            fullName: 'Alex Morgan',
            email: 'alex@unimad.dev',
            phone: '+1 (555) 012-3456',
            location: 'San Francisco, CA',
            summary: 'Frontend dev...',
            title: 'Frontend Engineer'
        },
        experience: [],
        education: [],
        skills: [],
        projects: [],
        certifications: [],
        customSections: [],
        sectionOrder: [
            { id: 'profile' },
            { id: 'skills' },
            { id: 'experience' },
            { id: 'education' },
        ],
    }
];

const ResumeDashboard: React.FC<ResumeDashboardProps> = ({ onEditResume, onCreateResume }) => {
    const [resumes, setResumes] = useState<ResumeData[]>(INITIAL_RESUMES);
    const [createModalState, setCreateModalState] = useState<'closed' | 'menu' | 'jd' | 'upload'>('closed');
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

    // Form States
    const [jdRole, setJdRole] = useState('');
    const [jdCompany, setJdCompany] = useState('');
    const [jdText, setJdText] = useState('');
    const [uploadFile, setUploadFile] = useState<File | null>(null);

    const handleDuplicate = (e: React.MouseEvent, resume: ResumeData) => {
        e.stopPropagation();
        const newResume: ResumeData = {
            ...resume,
            id: Date.now().toString(),
            title: `${resume.title} (Copy)`,
            lastModified: new Date()
        };
        setResumes([newResume, ...resumes]);
        setActiveMenuId(null);
    };

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this resume?')) {
            setResumes(resumes.filter(r => r.id !== id));
        }
        setActiveMenuId(null);
    };
 
    const handleSetBase = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setResumes(resumes.map(r => ({
            ...r,
            isBase: r.id === id
        })));
        setActiveMenuId(null);
    };

    const handleCopyLink = (e: React.MouseEvent, resume: ResumeData) => {
        e.stopPropagation();
        const identifier = resume.slug || resume.id;
        navigator.clipboard.writeText(`https://unimad.dev/resume/${identifier}`);
        alert("Link copied to clipboard!");
        setActiveMenuId(null);
    };

    const handleDownload = (e: React.MouseEvent) => {
        e.stopPropagation();
        alert("Downloading PDF...");
        setActiveMenuId(null);
    };

    return (
        <div className="flex-1 bg-slate-50 h-full overflow-y-auto p-8 relative" onClick={() => setActiveMenuId(null)}>
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-2xl font-normal text-slate-900">Resumes</h1>
                    <p className="text-slate-500 mt-1">Manage and tailor your resumes for different opportunities.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {/* Create New Card (Visual Shortcut) */}
                    <button
                        onClick={(e) => { e.stopPropagation(); setCreateModalState('menu'); }}
                        className="group flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-300 rounded-xl hover:border-brand-400 hover:bg-brand-50/50 transition-all cursor-pointer bg-white"
                    >
                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-brand-100 group-hover:text-brand-600 mb-3 transition-colors">
                            <Plus size={24} />
                        </div>
                        <span className="font-medium text-slate-600 group-hover:text-brand-600">New Resume</span>
                    </button>

                    {/* Resume Cards */}
                    {resumes.map(resume => (
                        <div
                            key={resume.id}
                            onClick={() => onEditResume(resume)}
                            className={`
                        bg-white rounded-xl shadow-sm hover:shadow-md border border-slate-200 cursor-pointer transition-all hover:-translate-y-1 group relative
                        ${activeMenuId === resume.id ? 'z-30 ring-2 ring-brand-100' : 'z-0'}
                    `}
                        >
                            {/* Preview Thumbnail Area */}
                            <div className="h-40 bg-slate-100 relative overflow-hidden flex items-center justify-center rounded-t-xl">
                                {resume.isBase && (
                                    <div className="absolute top-3 right-3 z-10 inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/90 backdrop-blur-sm text-brand-600 border border-brand-100 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm">
                                        <Star size={10} fill="currentColor" /> Base Resume
                                    </div>
                                )}
                                <div className="w-32 h-44 bg-white shadow-sm border border-slate-200 transform scale-75 origin-top mt-8 px-2 py-2 text-[4px] text-slate-300 overflow-hidden select-none">
                                    <div className="w-full h-2 bg-slate-300 mb-2"></div>
                                    <div className="space-y-1">
                                        <div className="w-full h-1 bg-slate-200"></div>
                                        <div className="w-2/3 h-1 bg-slate-200"></div>
                                        <div className="w-full h-1 bg-slate-200"></div>
                                    </div>
                                    <div className="mt-4 space-y-2">
                                        <div className="w-1/3 h-2 bg-slate-300"></div>
                                        <div className="w-full h-1 bg-slate-200"></div>
                                        <div className="w-full h-1 bg-slate-200"></div>
                                    </div>
                                </div>
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors"></div>
                            </div>

                            {/* Info */}
                            <div className="p-4 rounded-b-xl relative">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1 min-w-0 pr-2">
                                        <h3 className="font-medium text-slate-900 mb-1 truncate">{resume.title}</h3>
                                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                                            <Clock size={12} />
                                            <span>Edited {resume.lastModified.toLocaleDateString('en-US')}</span>
                                        </div>
                                    </div>

                                    <div className="relative">
                                        <button
                                            className={`p-1 rounded transition-colors ${activeMenuId === resume.id ? 'bg-slate-100 text-slate-900' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600'}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveMenuId(activeMenuId === resume.id ? null : resume.id);
                                            }}
                                        >
                                            <MoreVertical size={16} />
                                        </button>

                                        {/* Dropdown Menu */}
                                        {activeMenuId === resume.id && (
                                            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onEditResume(resume); }}
                                                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-600 flex items-center gap-2.5 transition-colors"
                                                >
                                                    <Edit size={14} /> Edit
                                                </button>
                                                <button
                                                    onClick={(e) => handleDuplicate(e, resume)}
                                                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-600 flex items-center gap-2.5 transition-colors"
                                                >
                                                    <Copy size={14} /> Duplicate
                                                </button>
                                                <button
                                                    onClick={(e) => handleCopyLink(e, resume)}
                                                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-600 flex items-center gap-2.5 transition-colors"
                                                >
                                                    <Link size={14} /> Copy Link
                                                </button>
                                                {!resume.isBase && (
                                                    <button
                                                        onClick={(e) => handleSetBase(e, resume.id)}
                                                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-600 flex items-center gap-2.5 transition-colors"
                                                    >
                                                        <Star size={14} /> Set as Base
                                                    </button>
                                                )}
                                                <button
                                                    onClick={handleDownload}
                                                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-600 flex items-center gap-2.5 transition-colors"
                                                >
                                                    <Download size={14} /> Download
                                                </button>
                                                <div className="h-px bg-slate-100 my-1 mx-2"></div>
                                                <button
                                                    onClick={(e) => handleDelete(e, resume.id)}
                                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 flex items-center gap-2.5 transition-colors"
                                                >
                                                    <Trash2 size={14} /> Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Create Modal */}
            {createModalState !== 'closed' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={(e) => e.stopPropagation()}>
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden relative">

                        {/* Header */}
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white z-10 relative">
                            <div className="flex items-center gap-3">
                                {createModalState !== 'menu' && (
                                    <button
                                        onClick={() => setCreateModalState('menu')}
                                        className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        <ArrowLeft size={20} />
                                    </button>
                                )}
                                <h2 className="text-xl font-normal text-slate-900">
                                    {createModalState === 'menu' && "Create New Resume"}
                                    {createModalState === 'jd' && "Target Job Description"}
                                    {createModalState === 'upload' && "Upload Existing Resume"}
                                </h2>
                            </div>
                            <button onClick={() => setCreateModalState('closed')} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content Body */}
                        <div className="p-8 max-h-[60vh] overflow-y-auto">

                            {/* 1. MAIN MENU */}
                            {createModalState === 'menu' && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <button
                                        onClick={() => { setCreateModalState('closed'); onCreateResume('scratch'); }}
                                        className="flex flex-col items-center text-center p-6 rounded-xl border border-slate-200 hover:border-brand-500 hover:bg-brand-50/50 transition-all group"
                                    >
                                        <div className="w-14 h-14 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                            <FilePlus size={24} />
                                        </div>
                                        <h3 className="font-medium text-slate-900 mb-2">Start from Scratch</h3>
                                        <p className="text-xs text-slate-500">Build your resume step-by-step with our smart editor.</p>
                                    </button>

                                    <button
                                        onClick={() => setCreateModalState('jd')}
                                        className="flex flex-col items-center text-center p-6 rounded-xl border border-slate-200 hover:border-brand-500 hover:bg-brand-50/50 transition-all group"
                                    >
                                        <div className="w-14 h-14 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                            <FileType size={24} />
                                        </div>
                                        <h3 className="font-medium text-slate-900 mb-2">Target Job Description</h3>
                                        <p className="text-xs text-slate-500">Paste a JD and let AI tailor a resume for you.</p>
                                    </button>

                                    <button
                                        onClick={() => setCreateModalState('upload')}
                                        className="flex flex-col items-center text-center p-6 rounded-xl border border-slate-200 hover:border-brand-500 hover:bg-brand-50/50 transition-all group"
                                    >
                                        <div className="w-14 h-14 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                            <Upload size={24} />
                                        </div>
                                        <h3 className="font-medium text-slate-900 mb-2">Upload Resume</h3>
                                        <p className="text-xs text-slate-500">Import your existing PDF/Docx to get started fast.</p>
                                    </button>
                                </div>
                            )}

                            {/* 2. TARGET JD FORM */}
                            {createModalState === 'jd' && (
                                <div className="space-y-4 max-w-lg mx-auto">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Job Role</label>
                                        <input
                                            value={jdRole}
                                            onChange={(e) => setJdRole(e.target.value)}
                                            placeholder="e.g. Product Manager, Frontend Engineer"
                                            className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
                                        <input
                                            value={jdCompany}
                                            onChange={(e) => setJdCompany(e.target.value)}
                                            placeholder="e.g. Google, Airbnb"
                                            className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Job Description or URL</label>
                                        <textarea
                                            value={jdText}
                                            onChange={(e) => setJdText(e.target.value)}
                                            placeholder="Paste the job description or hiring page link here..."
                                            rows={6}
                                            className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all resize-none"
                                        />
                                    </div>
                                    <button
                                        disabled={!jdRole || !jdCompany || !jdText}
                                        onClick={() => { setCreateModalState('closed'); onCreateResume('jd'); }}
                                        className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-2"
                                    >
                                        Create Targeted Resume
                                    </button>
                                </div>
                            )}

                            {/* 3. UPLOAD FORM */}
                            {createModalState === 'upload' && (
                                <div className="max-w-lg mx-auto">
                                    <div className="border-2 border-dashed border-slate-300 hover:border-brand-400 bg-slate-50 hover:bg-brand-50/30 rounded-xl p-10 text-center transition-all cursor-pointer group">
                                        <div className="w-16 h-16 bg-white shadow-sm rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform text-brand-500">
                                            <Upload size={28} />
                                        </div>
                                        <h3 className="text-lg font-medium text-slate-900 mb-1">Click to Upload</h3>
                                        <p className="text-sm text-slate-500 mb-4">or drag and drop your resume file here</p>
                                        <p className="text-xs text-slate-400 uppercase tracking-widest font-medium">PDF, DOCX, TXT</p>
                                    </div>

                                    <button
                                        onClick={() => { setCreateModalState('closed'); onCreateResume('upload'); }}
                                        className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all mt-6"
                                    >
                                        Analyze & Create
                                    </button>
                                </div>
                            )}

                        </div>

                        <div className="p-4 bg-slate-50 text-center text-xs text-slate-400 border-t border-slate-100">
                            Unimad AI helps you beat the ATS and get hired faster.
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ResumeDashboard;