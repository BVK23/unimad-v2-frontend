import React, { useState } from 'react';
import { MOCK_JOBS, Job, GeneratorContext } from '../../types/jobs';
import SearchSection from './SearchSection';
import JobCard from './JobCard';
import JobDetailsModal from './JobDetailsModal';
import PrepareApplicationModal from './PrepareApplicationModal';
import { ChevronLeft, ChevronRight, Link as LinkIcon, Plus } from 'lucide-react';
import ContentLabPanel from './content-lab/ContentLabPanel';
import LinkedInRibbonBanner from './LinkedInRibbonBanner';

interface JobDiscoveryProps {
    onNavigateToStudio: (context: GeneratorContext) => void;
    onAddToTracker: (job: Job) => void;
    onGoToTracker?: () => void;
}

const companyFromJobUrl = (url: string): string => {
    try {
        const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
        const host = parsed.hostname.replace(/^www\./, '');
        const segment = host.split('.').filter(Boolean).slice(-2, -1)[0] ?? host;
        return segment.charAt(0).toUpperCase() + segment.slice(1);
    } catch {
        return 'New company';
    }
};

const buildTrackerJobFromUrl = (url: string): Job => {
    const jobUrl = url.trim();
    const companyName = companyFromJobUrl(jobUrl);
    return {
        id: `tracker-${Date.now()}`,
        role: 'Application',
        company: companyName,
        logo: `https://ui-avatars.com/api/?name=${encodeURIComponent(companyName)}&background=0b63f5&color=fff`,
        location: 'Not specified',
        postedDate: 'Just added',
        matchScore: 0,
        description: `Application link: ${jobUrl}`,
        applicationStatus: 'applied',
        appliedDate: new Date().toISOString().slice(0, 10),
    };
};

const JobDiscovery: React.FC<JobDiscoveryProps> = ({ onNavigateToStudio, onAddToTracker, onGoToTracker }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [locationTerm, setLocationTerm] = useState('');
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const [preparingJob, setPreparingJob] = useState<Job | null>(null);
    const [filterType, setFilterType] = useState('Recommended');
    const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
    const [isSearching, setIsSearching] = useState(false);
    const [appUrl, setAppUrl] = useState('');
    const [addFormError, setAddFormError] = useState<string | null>(null);
    const [addFormSuccess, setAddFormSuccess] = useState(false);

    React.useEffect(() => {
        setIsSearching(true);
        const timer = setTimeout(() => {
            setIsSearching(false);
        }, 500); // simulate API loading
        return () => clearTimeout(timer);
    }, [searchTerm, locationTerm, filterType]);

    const toggleSaveJob = (e: React.MouseEvent, jobId: string) => {
        e.stopPropagation();
        const newSaved = new Set(savedJobIds);
        if (newSaved.has(jobId)) {
            newSaved.delete(jobId);
        } else {
            newSaved.add(jobId);
        }
        setSavedJobIds(newSaved);
    };

    const recommendedJobs = MOCK_JOBS.filter(job => job.isRecommended);

    // Filter logic for main list
    const filteredJobs = filterType === 'Saved'
        ? MOCK_JOBS.filter(job => savedJobIds.has(job.id))
        : MOCK_JOBS.filter(job => {
            const searchLower = searchTerm.toLowerCase();
            const locationLower = locationTerm.toLowerCase();
            const matchesSearch = !searchTerm || job.role.toLowerCase().includes(searchLower) || job.company.toLowerCase().includes(searchLower);
            const matchesLocation = !locationTerm || job.location.toLowerCase().includes(locationLower);

            if (!matchesSearch || !matchesLocation) return false;

            if (filterType === 'Recommended' && !searchTerm && !locationTerm) return true;
            if (filterType === 'Remote') return job.location.toLowerCase().includes('remote');
            return true;
        });

    const scrollContainerRef = React.useRef<HTMLDivElement>(null);

    // Scroll Logic
    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = 300;
            scrollContainerRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
        }
    };

    const checkJobDetails = (job: Job) => {
        setSelectedJob(job);
    };

    const handlePrepareApp = (job: Job) => {
        setPreparingJob(job);
    };

    const handleApply = (job: Job) => {
        alert(`Follow up: Applied to ${job.role} at ${job.company}`);
    };

    const handleSaveToTracker = () => {
        const trimmed = appUrl.trim();
        if (!trimmed) {
            setAddFormError('Paste a job posting URL to continue.');
            return;
        }
        onAddToTracker(buildTrackerJobFromUrl(trimmed));
        setAppUrl('');
        setAddFormError(null);
        setAddFormSuccess(true);
        window.setTimeout(() => setAddFormSuccess(false), 3200);
    };

    return (
        <div className="pb-32">


            {/* Hero Carousel Section - White Background */}
            <div className="bg-white dark:bg-[#111] border-b border-slate-200 dark:border-slate-800 py-10">
                <div className="max-w-[1400px] mx-auto px-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            {/* Icon removed, font-normal */}
                            <h2 className="text-xl font-normal text-slate-900 dark:text-white">
                                Recommended For You
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Based on your portfolio and resume profile.</p>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Simple placeholders for prev/next to match user image if needed, or just keep it clean */}
                            <button className="w-9 h-9 flex items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111] text-slate-500 hover:bg-slate-50 transition-colors">
                                <ChevronLeft size={18} />
                            </button>
                            <button className="w-9 h-9 flex items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111] text-slate-500 hover:bg-slate-50 transition-colors">
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Static Grid - exactly 3 cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Only show "Saved" here if the filter is active? or keep Recommended always? 
                            User request: "Saved Jobs button to come in the top... on recommended jobs section".
                            I'll assume if "Saved" is clicked, we switch views or filter. 
                            For now, let's let the main filter drive the view below, but this top section is "Recommended". 
                            If "Saved" is clicked, maybe we just highlight it. 
                            Actually, let's make this top section show Recommended ALWAYS unless filtered.
                        */}
                        {recommendedJobs.slice(0, 3).map(job => (
                            <div key={job.id} className="w-full relative group">
                                <JobCard
                                    job={job}
                                    onClick={checkJobDetails}
                                    onPrepare={handlePrepareApp}
                                    onApply={handleApply}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <LinkedInRibbonBanner onNavigateToStudio={onNavigateToStudio} />

            {/* Supercharge + Add application */}
            <div className="max-w-[1400px] mx-auto px-6 mt-6">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                    {/* Add application — left */}
                    <div className="flex min-h-[220px] flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-5 dark:border-slate-700 dark:bg-slate-900">
                        <div className="text-center">
                            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-brand-100 bg-brand-50 text-brand-600 dark:border-brand-900/40 dark:bg-brand-950/40 dark:text-brand-400">
                                <Plus size={20} strokeWidth={2} />
                            </div>
                            <h3 className="text-lg font-semibold leading-snug text-slate-900 dark:text-white">Add an application</h3>
                            <p className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                                Paste a job URL to save it straight to your tracker.
                            </p>
                        </div>
                        <div className="mt-5 flex flex-col gap-4">
                            <div className="relative">
                                <LinkIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="url"
                                    value={appUrl}
                                    onChange={(e) => {
                                        setAppUrl(e.target.value);
                                        setAddFormError(null);
                                    }}
                                    placeholder="Paste job posting URL"
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-brand-300 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-brand-500/50"
                                />
                            </div>
                            {addFormError && (
                                <p className="text-xs text-red-600 dark:text-red-400">{addFormError}</p>
                            )}
                            {addFormSuccess && (
                                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                                    Added to your tracker.{' '}
                                    {onGoToTracker && (
                                        <button
                                            type="button"
                                            onClick={onGoToTracker}
                                            className="font-semibold underline underline-offset-2 hover:text-emerald-700 dark:hover:text-emerald-300"
                                        >
                                            View tracker
                                        </button>
                                    )}
                                </p>
                            )}
                            <button
                                type="button"
                                onClick={handleSaveToTracker}
                                disabled={!appUrl.trim()}
                                className="w-full rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white shadow-sm shadow-brand-500/20 transition-all hover:bg-brand-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Save and add to tracker
                            </button>
                        </div>
                    </div>

                    <ContentLabPanel onNavigateToStudio={onNavigateToStudio} />
                </div>
            </div>

                        {/* Search and Browse Section */}
            <div className="max-w-[1400px] mx-auto px-6 py-10">
                <div className="mb-6 w-full">
                    <SearchSection
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        locationTerm={locationTerm}
                        setLocationTerm={setLocationTerm}
                        filterType={filterType}
                        setFilterType={setFilterType}
                    />
                </div>
 
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        Showing {filteredJobs.length} {filteredJobs.length === 1 ? 'job' : 'jobs'}
                    </h3>
                </div>

                {/* List View for Search Results */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {isSearching ? (
                        Array.from({ length: 6 }).map((_, i) => (
                            <div key={`skeleton-${i}`} className="bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col h-[104px] relative overflow-hidden">
                                <div className="flex gap-4 mb-0 animate-pulse">
                                    <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-800 shrink-0"></div>
                                    <div className="flex-1 pr-8 pt-1">
                                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4 mb-2.5"></div>
                                        <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2 mb-3"></div>
                                        <div className="flex gap-2">
                                            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-8"></div>
                                            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-16"></div>
                                        </div>
                                    </div>
                                    <div className="absolute top-4 right-4 w-10 h-10 rounded-full border-2 border-slate-200 dark:border-slate-800"></div>
                                </div>
                            </div>
                        ))
                    ) : filteredJobs.length > 0 ? (
                        filteredJobs.map(job => (
                            <div key={job.id} className="relative group">
                                <div className="h-full w-full">
                                    <JobCard
                                        job={job}
                                        hideButtons={true}
                                        onClick={checkJobDetails}
                                        onPrepare={handlePrepareApp}
                                        onApply={handleApply}
                                    />
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400">
                            No jobs found matching your criteria.
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {selectedJob && (
                <JobDetailsModal
                    job={selectedJob}
                    onClose={() => setSelectedJob(null)}
                    onApply={handleApply}
                    onToggleSave={toggleSaveJob}
                    isSaved={savedJobIds.has(selectedJob.id)}
                    onNavigateToStudio={onNavigateToStudio}
                />
            )}

            {preparingJob && (
                <PrepareApplicationModal
                    job={preparingJob}
                    onClose={() => setPreparingJob(null)}
                    onNavigateToStudio={onNavigateToStudio}
                />
            )}

        </div>
    );
};

export default JobDiscovery;
