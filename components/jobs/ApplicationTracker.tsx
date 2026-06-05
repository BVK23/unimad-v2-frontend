import React, { useState } from 'react';
import { Job, GeneratorContext, ApplicationStatus } from '../../types/jobs';
import { MoreHorizontal, Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import JobCard from './JobCard';
import PrepareApplicationModal from './PrepareApplicationModal';
import JobDetailsModal from './JobDetailsModal';
import AddJobModal from './AddJobModal';
import InterviewingStageModal from './InterviewingStageModal';

interface ApplicationTrackerProps {
    onNavigateToStudio: (context: GeneratorContext) => void;
    onStartInterviewPrep?: () => void;
    jobs: Job[];
    setJobs: React.Dispatch<React.SetStateAction<Job[]>>;
}

const ApplicationTracker: React.FC<ApplicationTrackerProps> = ({
    onNavigateToStudio,
    onStartInterviewPrep,
    jobs,
    setJobs,
}) => {
    const [preparingJob, setPreparingJob] = useState<Job | null>(null);
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const [showAddJobModal, setShowAddJobModal] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isTrashing, setIsTrashing] = useState(false);
    const [showRejectedModal, setShowRejectedModal] = useState(false);
    const [draftsCollapsed, setDraftsCollapsed] = useState(false);
    const [interviewingPromptJob, setInterviewingPromptJob] = useState<Job | null>(null);

    const handleAddJob = (newJob: Job) => {
        setJobs((prev) => [newJob, ...prev]);
        setShowAddJobModal(false);
    };

    const moveJobToStatus = (jobId: string, newStatus: ApplicationStatus) => {
        const previousJob = jobs.find((j) => j.id === jobId);
        if (!previousJob) return;

        const updatedJob = { ...previousJob, applicationStatus: newStatus };
        setJobs((prev) => prev.map((j) => (j.id === jobId ? updatedJob : j)));

        if (newStatus === 'interviewing' && previousJob.applicationStatus !== 'interviewing') {
            setInterviewingPromptJob(updatedJob);
        }
    };

    const handleStatusChange = (jobId: string, newStatus: ApplicationStatus) => {
        moveJobToStatus(jobId, newStatus);
    };

    const handlePrepareApp = (job: Job) => {
        setPreparingJob(job);
    };

    const handleDrop = (e: React.DragEvent, status: ApplicationStatus) => {
        e.preventDefault();
        const jobId = e.dataTransfer.getData('jobId');
        if (!jobId) return;

        moveJobToStatus(jobId, status);
        setIsDragging(false);

        if (status === 'rejected') {
            setIsTrashing(true);
            window.setTimeout(() => setIsTrashing(false), 500);
        }

        if (status === 'offer') {
            const x = e.clientX / window.innerWidth;
            const y = e.clientY / window.innerHeight;
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { x, y },
            });
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const renderJobCards = (columnJobs: Job[]) => (
        <>
            {columnJobs.map((job) => (
                <div
                    key={job.id}
                    draggable
                    onDragStart={(e) => {
                        e.dataTransfer.setData('jobId', job.id);
                        setIsDragging(true);
                    }}
                    onDragEnd={() => setIsDragging(false)}
                    className="mb-3 block cursor-grab active:cursor-grabbing"
                >
                    <JobCard
                        job={job}
                        hideDescription
                        hideButtons
                        onClick={setSelectedJob}
                        onPrepare={handlePrepareApp}
                        onApply={() => {}}
                        onStatusChange={handleStatusChange}
                    />
                </div>
            ))}
            {columnJobs.length === 0 && (
                <div className="flex h-24 items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 text-xs font-medium text-slate-400 dark:border-slate-800">
                    Drop items here
                </div>
            )}
        </>
    );

    const Column = ({
        title,
        status,
        statusColor,
        showAddApplication = false,
    }: {
        title: string;
        status: ApplicationStatus;
        statusColor: string;
        showAddApplication?: boolean;
    }) => {
        const columnJobs = jobs.filter((j) => j.applicationStatus === status);

        return (
            <div
                className="drag-target flex h-full min-w-[320px] max-w-[400px] flex-1 shrink-0 flex-col rounded-3xl border border-slate-100 bg-slate-50/50 p-3 transition-colors dark:border-slate-800 dark:bg-slate-900/20"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, status)}
            >
                <div className="mb-3 flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                        <div className={`h-2.5 w-2.5 rounded-full ${statusColor}`} />
                        <h3 className="text-base font-medium text-slate-900 dark:text-white">{title}</h3>
                        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            {columnJobs.length}
                        </span>
                    </div>
                </div>

                {showAddApplication && (
                    <div className="mb-4">
                        <button
                            type="button"
                            onClick={() => setShowAddJobModal(true)}
                            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 p-3 text-xs font-medium text-slate-400 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-500 dark:border-slate-800 dark:hover:border-blue-700 dark:hover:bg-blue-900/10"
                        >
                            <Plus size={14} /> Add Application
                        </button>
                    </div>
                )}

                <div className="scrollbar-thin flex-1 space-y-3 overflow-y-auto pb-2 pr-1">
                    {renderJobCards(columnJobs)}
                </div>
            </div>
        );
    };

    const draftJobs = jobs.filter((j) => j.applicationStatus === 'draft');

    return (
        <div className="relative h-full flex-1 overflow-hidden p-4">
            <div className="absolute right-4 top-0 z-10 flex items-center gap-3 p-2">
                <div
                    className={`z-50 flex items-center justify-center rounded-xl px-4 py-2 shadow-sm transition-all duration-300 ${
                        isDragging
                            ? 'min-w-[140px] scale-105 border-2 border-red-500 bg-white text-red-600 shadow-lg shadow-red-500/10 dark:bg-slate-900'
                            : isTrashing
                              ? 'scale-110 border-2 border-red-500 bg-red-50/50 text-red-600 shadow-red-500/20 dark:bg-red-900/10'
                              : 'scale-100 cursor-pointer border border-slate-200 bg-white text-slate-700 hover:border-red-200 hover:text-red-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                    }`}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, 'rejected')}
                    onClick={() => !isDragging && setShowRejectedModal(true)}
                >
                    <Trash2 size={16} className={`${isDragging ? 'mr-2 animate-bounce' : ''} ${isTrashing ? 'animate-pulse' : ''}`} />
                    {!isDragging && <span className="ml-2 text-sm font-medium">Rejected</span>}
                    {isDragging && <span className="whitespace-nowrap text-sm font-medium">Drop to Reject</span>}
                </div>
            </div>

            <div className="scrollbar-thin flex h-full w-full gap-4 overflow-x-auto pb-4 pr-16 pt-14">
                {/* Collapsible Drafts column */}
                {draftsCollapsed ? (
                    <button
                        type="button"
                        onClick={() => setDraftsCollapsed(false)}
                        className="drag-target flex h-full w-14 shrink-0 flex-col items-center rounded-3xl border border-slate-200 bg-slate-100/80 py-4 transition-colors hover:border-slate-300 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-slate-700"
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, 'draft')}
                        title="Expand drafts"
                    >
                        <ChevronRight size={18} className="mb-3 text-slate-500" />
                        <span
                            className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400"
                            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                        >
                            Drafts
                        </span>
                        <span className="mt-3 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            {draftJobs.length}
                        </span>
                    </button>
                ) : (
                    <div
                        className="drag-target flex h-full min-w-[280px] max-w-[320px] shrink-0 flex-col rounded-3xl border border-slate-200 bg-slate-100/60 p-3 dark:border-slate-800 dark:bg-slate-900/30"
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, 'draft')}
                    >
                        <div className="mb-3 flex items-center justify-between px-2">
                            <div className="flex items-center gap-2">
                                <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                                <h3 className="text-base font-medium text-slate-900 dark:text-white">Drafts</h3>
                                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                    {draftJobs.length}
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setDraftsCollapsed(true)}
                                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
                                title="Collapse drafts"
                                aria-label="Collapse drafts column"
                            >
                                <ChevronLeft size={18} />
                            </button>
                        </div>
                        <div className="scrollbar-thin flex-1 space-y-3 overflow-y-auto pb-2 pr-1">
                            {renderJobCards(draftJobs)}
                        </div>
                    </div>
                )}

                <Column title="Applied" status="applied" statusColor="bg-slate-400 dark:bg-slate-500" showAddApplication />
                <Column title="Interviewing" status="interviewing" statusColor="bg-blue-500" />
                <Column title="Offers" status="offer" statusColor="bg-green-500" />
            </div>

            {selectedJob && (
                <JobDetailsModal
                    job={selectedJob}
                    onClose={() => setSelectedJob(null)}
                    onApply={() => {}}
                    onStatusChange={handleStatusChange}
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

            {showAddJobModal && (
                <AddJobModal onClose={() => setShowAddJobModal(false)} onAdd={handleAddJob} />
            )}

            {interviewingPromptJob && (
                <InterviewingStageModal
                    job={interviewingPromptJob}
                    onClose={() => setInterviewingPromptJob(null)}
                    onBuildVpd={() => {
                        onNavigateToStudio({
                            type: 'vpd',
                            jobId: interviewingPromptJob.id,
                            company: interviewingPromptJob.company,
                            role: interviewingPromptJob.role,
                        });
                        setInterviewingPromptJob(null);
                    }}
                    onStartInterviewPrep={() => {
                        setInterviewingPromptJob(null);
                        onStartInterviewPrep?.();
                    }}
                />
            )}

            {showRejectedModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="flex max-h-[80vh] w-full max-w-2xl flex-col rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl dark:border-slate-800 dark:bg-[#1a1a1a]">
                        <div className="mb-6 flex items-center justify-between">
                            <h2 className="flex items-center gap-2 text-2xl font-semibold text-slate-900 dark:text-white">
                                <Trash2 className="text-red-500" /> Rejected
                            </h2>
                            <button
                                type="button"
                                onClick={() => setShowRejectedModal(false)}
                                className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                                <MoreHorizontal size={24} />
                            </button>
                        </div>
                        <div className="scrollbar-thin flex-1 space-y-3 overflow-y-auto pr-2">
                            {jobs.filter((j) => j.applicationStatus === 'rejected').length > 0 ? (
                                jobs
                                    .filter((j) => j.applicationStatus === 'rejected')
                                    .map((job) => (
                                        <JobCard
                                            key={job.id}
                                            job={job}
                                            hideDescription
                                            hideButtons
                                            onClick={setSelectedJob}
                                            onPrepare={handlePrepareApp}
                                            onStatusChange={handleStatusChange}
                                        />
                                    ))
                            ) : (
                                <div className="py-12 text-center text-slate-400">
                                    No rejected jobs. Your pipeline is looking healthy!
                                </div>
                            )}
                        </div>
                        <div className="mt-6 flex justify-end border-t border-slate-100 pt-6 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => setShowRejectedModal(false)}
                                className="rounded-xl bg-slate-100 px-6 py-2.5 font-medium text-slate-700 transition-all hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ApplicationTracker;
