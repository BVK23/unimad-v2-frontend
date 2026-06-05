import React, { useState } from 'react';
import { Job, ContentGeneratorType, GeneratorContext } from '../../types/jobs';
import { X, FileText, Mail, Briefcase, Wand2, Copy, Download, UserSquare2, ChevronRight } from 'lucide-react';

interface PrepareApplicationModalProps {
    job: Job;
    onClose: () => void;
    initialTab?: ContentGeneratorType;
    onNavigateToStudio?: (context: GeneratorContext) => void;
}

const PREPARE_TABS: { id: ContentGeneratorType; label: string; icon: React.ElementType }[] = [
    { id: 'resume', label: 'Resume', icon: UserSquare2 },
    { id: 'cover-letter', label: 'Cover Letter', icon: FileText },
    { id: 'cold-email', label: 'Cold Email', icon: Mail },
    { id: 'vpd', label: 'Value Prop Doc', icon: Briefcase },
];

const PrepareApplicationModal: React.FC<PrepareApplicationModalProps> = ({
    job,
    onClose,
    initialTab = 'resume',
    onNavigateToStudio,
}) => {
    const [activeTab, setActiveTab] = useState<ContentGeneratorType>(initialTab);
    const [generatedContent, setGeneratedContent] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleGenerate = () => {
        setIsGenerating(true);
        // Simulate AI generation
        setTimeout(() => {
            let content = '';
            switch (activeTab) {
                case 'cover-letter':
                    content = `Dear Hiring Team at ${job.company},\n\nI am writing to apply for the ${job.role} position. With my background in Product Design and extensive experience leading design initiatives, I am confident in my ability to contribute effectively to your team.\n\nAt my current role, I have...`;
                    break;
                case 'cold-email':
                    content = `Subject: Quick question about the ${job.role} role\n\nHi team,\n\nI'm a huge fan of what ${job.company} is building. I recently saw the ${job.role} opening and wanted to reach out directly.\n\nMy background is in...`;
                    break;
                case 'referral':
                    content = `Hi [Name],\n\nI hope you're doing well! I noticed you work at ${job.company} and I'm very interested in the ${job.role} opening. I would love to chat briefly about your experience there if you have time.`;
                    break;
                case 'vpd':
                    content = `**Value Proposition for ${job.role}**\n\n1. Strategic Alignment: My experience aligns with ${job.company}'s mission to...\n\n2. Key Achievements: I successfully launched...`;
                    break;
                case 'resume':
                    content = `ALEX MORGAN\nSenior Product Designer\nSan Francisco, CA | alex.morgan@email.com | (555) 123-4567\n\nSUMMARY\nCreative and strategic Senior Product Designer with 5+ years of experience in building user-centric digital products. Proven track record of improving user engagement and streamlining workflows.\n\nEXPERIENCE\n\nSenior Product Designer | TechFlow\n2021 - Present\n- Led the redesign of the core mobile application, resulting in a 20% increase in daily active users.\n- Collaborated with cross-functional teams to launch 3 major features used by over 1M users.\n- Mentored junior designers and established a new design system.\n\nProduct Designer | Creative Solutions\n2019 - 2021\n- Designed and prototyped user interfaces for web and mobile applications.\n- Conducted user research and usability testing to inform design decisions.\n\nEDUCATION\n\nBFA in Interaction Design | California College of the Arts\n2015 - 2019\n\nSKILLS\nFigma, Sketch, Adobe CS, Prototyping, User Research, HTML/CSS`;
                    break;
            }
            setGeneratedContent(content);
            setIsGenerating(false);
        }, 1500);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedContent);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        const element = document.createElement("a");
        const file = new Blob([generatedContent], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = `${activeTab}-${job.company.replace(/\s+/g, '-').toLowerCase()}.txt`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    const handleReferralCallout = () => {
        onNavigateToStudio?.({
            type: 'referral',
            jobId: job.id,
            company: job.company,
            role: job.role,
            description: job.description,
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#1a1a1a] w-full max-w-4xl h-[600px] rounded-3xl shadow-2xl flex overflow-hidden border border-slate-200 dark:border-slate-800">

                {/* Sidebar */}
                <div className="flex h-full w-64 shrink-0 flex-col border-r border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-[#111]">
                    <div className="mb-6">
                        <h2 className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-3">Prepare Application</h2>
                        <h3 className="font-medium text-lg text-slate-900 dark:text-white line-clamp-1 mb-1">{job.role}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{job.company}</p>
                    </div>

                    <div className="shrink-0 space-y-1">
                        {PREPARE_TABS.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => {
                                        setActiveTab(tab.id);
                                        setGeneratedContent('');
                                    }}
                                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all ${
                                        activeTab === tab.id
                                            ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:text-blue-400 dark:ring-slate-700'
                                            : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/50'
                                    }`}
                                >
                                    <Icon size={16} className="shrink-0 opacity-70" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    <button
                        type="button"
                        onClick={handleReferralCallout}
                        disabled={!onNavigateToStudio}
                        className="mt-auto flex shrink-0 flex-col rounded-2xl border border-blue-900/40 bg-gradient-to-br from-[#001433] via-[#002654] to-[#003366] p-4 text-left transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <div>
                            <p className="text-sm font-semibold text-white">Referral request</p>
                            <p className="mt-1.5 text-xs leading-relaxed text-white/75">
                                Ask for a warm intro and craft a referral message in Content Lab.
                            </p>
                        </div>
                        <span className="mt-3 flex items-center gap-1.5 text-sm font-medium text-white">
                            Open Content Lab
                            <ChevronRight size={14} className="shrink-0 opacity-90" />
                        </span>
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 flex flex-col bg-white dark:bg-[#151515]">
                    {/* Header */}
                    <div className="h-16 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-6">
                        <h2 className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                            <Wand2 size={16} className="text-blue-500" /> Generate {PREPARE_TABS.find((t) => t.id === activeTab)?.label}
                        </h2>
                        <div className="flex items-center gap-2">
                            {generatedContent && (
                                <>
                                    <button
                                        onClick={handleCopy}
                                        className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 hover:bg-slate-100 text-slate-600 dark:text-slate-300 transition-colors"
                                    >
                                        <Copy size={12} /> {copied ? 'Copied' : 'Copy'}
                                    </button>
                                    <button
                                        onClick={handleDownload}
                                        className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 hover:bg-slate-100 text-slate-600 dark:text-slate-300 transition-colors"
                                    >
                                        <Download size={12} /> Download
                                    </button>
                                </>
                            )}
                            <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1"></div>
                            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400">
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Generator/Preview */}
                    <div className="flex-1 p-8 flex flex-col h-full overflow-hidden">
                        {!generatedContent ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center max-w-sm mx-auto p-8 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                                <Wand2 size={48} className="text-blue-500 mb-4 opacity-20" />
                                <h3 className="font-medium text-slate-900 dark:text-white mb-2">Ready to Generate?</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                                    We'll use details from your resume and the job description to create a tailored {PREPARE_TABS.find((t) => t.id === activeTab)?.label.toLowerCase()}.
                                </p>
                                <button
                                    onClick={handleGenerate}
                                    disabled={isGenerating}
                                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-2"
                                >
                                    {isGenerating ? <span className="animate-spin">⏳</span> : <Wand2 size={16} fill="currentColor" />}
                                    {isGenerating ? 'Drafting...' : 'Generate Draft'}
                                </button>
                            </div>
                        ) : (
                            <div className="flex-1 relative">
                                <textarea
                                    value={generatedContent}
                                    onChange={(e) => setGeneratedContent(e.target.value)}
                                    className="w-full h-full bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-slate-800 rounded-xl p-6 resize-none outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-300 leading-relaxed font-mono text-sm"
                                    spellCheck={false}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrepareApplicationModal;
