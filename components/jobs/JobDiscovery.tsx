import React, { useEffect, useMemo, useState } from "react";
import { useSaveJob, useUnsaveJob } from "@/features/jobs/hooks/useJobMutations";
import { useJobViewed } from "@/features/jobs/hooks/useJobViewed";
import { useRecommendedJobs } from "@/features/jobs/hooks/useRecommendedJobs";
import { useSavedJobs } from "@/features/jobs/hooks/useSavedJobs";
import { useSearchJobs } from "@/features/jobs/hooks/useSearchJobs";
import { getSavedJobs, importJobFromUrl } from "@/features/jobs/server-actions/jobs-actions";
import type { BackendJob } from "@/features/jobs/types";
import type { StartInterviewFromJobPayload } from "@/src/features/interview-prep/types";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Search, Link as LinkIcon, Plus } from "lucide-react";
import { Job, GeneratorContext } from "../../types/jobs";
import JobCard from "./JobCard";
import JobCardSkeleton from "./JobCardSkeleton";
import JobDetailsModal from "./JobDetailsModal";
import JobUrlImportLoading from "./JobUrlImportLoading";
import LinkedInRibbonBanner from "./LinkedInRibbonBanner";
import PrepareApplicationModal from "./PrepareApplicationModal";
import SearchSection from "./SearchSection";
import ContentLabPanel from "./content-lab/ContentLabPanel";

interface JobDiscoveryProps {
  onNavigateToStudio: (context: GeneratorContext) => void;
  onGoToTracker?: () => void;
  onStartInterviewPrep?: (payload: StartInterviewFromJobPayload) => void;
}

const JobDiscovery: React.FC<JobDiscoveryProps> = ({ onNavigateToStudio, onGoToTracker, onStartInterviewPrep }) => {
  const queryClient = useQueryClient();
  const [appUrl, setAppUrl] = useState("");
  const [addFormError, setAddFormError] = useState<string | null>(null);
  const [addFormSuccessMessage, setAddFormSuccessMessage] = useState<string | null>(null);
  const [isAddingToTracker, setIsAddingToTracker] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [locationTerm, setLocationTerm] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState<{ q: string; location: string; activeFilters: string[] } | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [preparingJob, setPreparingJob] = useState<Job | null>(null);
  const [filterType, setFilterType] = useState<"Recommended" | "Saved">("Recommended");
  const [savedPage, setSavedPage] = useState(1);
  const [recommendedUIPage, setRecommendedUIPage] = useState(1);
  const [savedUIPage, setSavedUIPage] = useState(1);
  const [searchUIPage, setSearchUIPage] = useState(1);

  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const TOP_JOBS_PER_PAGE = 3;
  const SEARCH_JOBS_PER_PAGE = 9;

  const {
    flattenedJobs: recommendedFlattenedJobs,
    hasNextPage: recommendedHasNextPage,
    isFetchingNextPage: isRecommendedFetchingNextPage,
    isLoading: isRecommendedLoading,
    fetchNextPage: fetchMoreRecommendedJobs,
  } = useRecommendedJobs({ enabled: true });

  const { data: savedData, isLoading: isSavedLoading } = useSavedJobs(savedPage, { enabled: filterType === "Saved" });

  const {
    flattenedJobs: searchFlattenedJobs,
    hasNextPage: searchHasNextPage,
    isFetchingNextPage: isSearchFetchingNextPage,
    isLoading: isSearchLoading,
    fetchNextPage: fetchMoreSearchJobs,
  } = useSearchJobs(submittedSearch, { enabled: !!submittedSearch?.q?.trim() });

  useEffect(() => {
    if (filterType !== "Saved" || !savedData?.pagination?.has_next) return;
    const nextPage = savedPage + 1;
    queryClient.prefetchQuery({
      queryKey: ["savedJobs", nextPage],
      queryFn: () => getSavedJobs(nextPage),
    });
  }, [filterType, savedData?.pagination?.has_next, savedPage, queryClient]);

  const saveJobMutation = useSaveJob({
    onSuccess: (jobId, saved) => {
      setSelectedJob(prev => (prev && prev.id === jobId ? { ...prev, isSaved: saved } : prev));
    },
  });
  const unsaveJobMutation = useUnsaveJob({
    onSuccess: (jobId, saved) => {
      setSelectedJob(prev => (prev && prev.id === jobId ? { ...prev, isSaved: saved } : prev));
    },
  });

  const isMutatingSave = saveJobMutation.isPending || unsaveJobMutation.isPending;

  const mapBackendToUi = (job: BackendJob): Job => {
    const dateSource = job.posted_at ?? job.fetched_at;
    const postedLabel = dateSource
      ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(dateSource))
      : "Recently posted";

    return {
      id: job.id,
      role: job.title ?? "Untitled role",
      company: job.company ?? "Company",
      logo: job.company_logo_url ?? "",
      location: job.location ?? "Location not specified",
      postedDate: postedLabel,
      matchScore: 95,
      isRecommended: true,
      isSponsoring: job.visa_sponsorship,
      description: job.description ?? "",
      requirements: job.requirements ?? [],
      isSaved: job.is_saved,
      applyUrl: job.apply_url ?? job.source_url ?? undefined,
    };
  };

  const recommendedJobs: Job[] = useMemo(() => {
    const raw = (recommendedFlattenedJobs ?? []).map(mapBackendToUi);
    const seen = new Set<string>();
    return raw.filter(j => {
      if (seen.has(j.id)) return false;
      seen.add(j.id);
      return true;
    });
  }, [recommendedFlattenedJobs]);

  const savedJobs: Job[] = useMemo(() => (savedData?.jobs ?? []).map(mapBackendToUi), [savedData]);

  const heroJobsOnCurrentPage = useMemo(
    () => recommendedJobs.slice((recommendedUIPage - 1) * TOP_JOBS_PER_PAGE, recommendedUIPage * TOP_JOBS_PER_PAGE),
    [recommendedJobs, recommendedUIPage]
  );
  const heroTotalUIPages = Math.max(1, Math.ceil(recommendedJobs.length / TOP_JOBS_PER_PAGE));
  const isOnLastHeroUIPage = recommendedUIPage >= heroTotalUIPages;

  const savedJobsOnCurrentPage = useMemo(
    () => savedJobs.slice((savedUIPage - 1) * TOP_JOBS_PER_PAGE, savedUIPage * TOP_JOBS_PER_PAGE),
    [savedJobs, savedUIPage]
  );
  const savedTotalUIPages = Math.max(1, Math.ceil(savedJobs.length / TOP_JOBS_PER_PAGE));
  const isOnLastSavedUIPage = savedUIPage >= savedTotalUIPages;

  const searchResultsJobs: Job[] = useMemo(() => {
    const raw = (searchFlattenedJobs ?? []).map(mapBackendToUi);
    const seen = new Set<string>();
    return raw.filter(j => {
      if (seen.has(j.id)) return false;
      seen.add(j.id);
      return true;
    });
  }, [searchFlattenedJobs]);

  const searchJobsOnCurrentPage = useMemo(
    () => searchResultsJobs.slice((searchUIPage - 1) * SEARCH_JOBS_PER_PAGE, searchUIPage * SEARCH_JOBS_PER_PAGE),
    [searchResultsJobs, searchUIPage]
  );
  const searchTotalUIPages = Math.max(1, Math.ceil(searchResultsJobs.length / SEARCH_JOBS_PER_PAGE));
  const isOnLastSearchUIPage = searchUIPage >= searchTotalUIPages;

  const allListedJobs = useMemo(() => {
    const seen = new Set<string>();
    const out: Job[] = [];
    for (const job of [...recommendedJobs, ...savedJobs, ...searchResultsJobs]) {
      if (seen.has(job.id)) continue;
      seen.add(job.id);
      out.push(job);
    }
    return out;
  }, [recommendedJobs, savedJobs, searchResultsJobs]);

  const isHeroLoading = isRecommendedLoading;
  const isSearchResultsLoading = isSearchLoading;

  const savedPagination = savedData?.pagination;

  useEffect(() => {
    if (!recommendedHasNextPage || isRecommendedFetchingNextPage || recommendedJobs.length === 0) return;
    const needed = recommendedUIPage * TOP_JOBS_PER_PAGE;
    if (recommendedJobs.length < needed) {
      fetchMoreRecommendedJobs();
    }
  }, [recommendedHasNextPage, isRecommendedFetchingNextPage, recommendedUIPage, recommendedJobs.length, fetchMoreRecommendedJobs]);

  const handleHeroPrevPage = () => {
    setRecommendedUIPage(prev => Math.max(1, prev - 1));
  };

  const handleHeroNextPage = () => {
    if (recommendedUIPage * TOP_JOBS_PER_PAGE < recommendedJobs.length) {
      setRecommendedUIPage(prev => prev + 1);
    }
  };

  const handleSavedPrevPage = () => {
    setSavedUIPage(prev => Math.max(1, prev - 1));
  };

  const handleSavedNextPage = () => {
    if (savedUIPage * TOP_JOBS_PER_PAGE < savedJobs.length) {
      setSavedUIPage(prev => prev + 1);
    } else if (savedPagination?.has_next) {
      setSavedPage(p => p + 1);
      setSavedUIPage(1);
    }
  };

  const handleFetchMoreSavedBrowse = () => {
    setSavedPage(p => p + 1);
    setSavedUIPage(1);
  };

  const handleBrowseFilterChange = (type: "Recommended" | "Saved") => {
    setFilterType(type);
    if (type === "Saved") {
      setSubmittedSearch(null);
      setSearchUIPage(1);
    }
  };

  const handleSearchPrevPage = () => {
    setSearchUIPage(p => Math.max(1, p - 1));
  };

  const handleSearchNextPage = () => {
    if (searchUIPage * SEARCH_JOBS_PER_PAGE < searchResultsJobs.length) {
      setSearchUIPage(p => p + 1);
    }
  };

  const handleSearchSubmit = (q: string, location: string, activeFilters: string[]) => {
    setFilterType("Recommended");
    const trimmedQ = q.trim();
    if (!trimmedQ) return;
    setSubmittedSearch({ q: trimmedQ, location: location.trim(), activeFilters });
    setSearchUIPage(1);
  };

  const checkJobDetails = (job: Job) => {
    setSelectedJob(job);
  };

  const handlePrepareApp = (job: Job) => {
    setPreparingJob(job);
  };

  const handleApply = (job: Job) => {
    if (job.applyUrl) {
      window.open(job.applyUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleToggleSave = (e: React.MouseEvent, jobId: string) => {
    e.stopPropagation();
    const job =
      selectedJob?.id === jobId ? selectedJob : (allListedJobs.find((j: Job) => j.id === jobId) ?? searchResultsJobs.find((j: Job) => j.id === jobId));
    if (!job || isMutatingSave) return;

    if (job.isSaved) {
      unsaveJobMutation.mutate({ jobId, jobTitle: job.role });
    } else {
      saveJobMutation.mutate({ jobId, jobTitle: job.role });
    }
  };

  useJobViewed(selectedJob?.id);

  const handleSaveToTracker = async () => {
    const trimmed = appUrl.trim();
    if (!trimmed) {
      setAddFormError("Paste a job posting URL to continue.");
      return;
    }
    setIsAddingToTracker(true);
    setAddFormError(null);
    setAddFormSuccessMessage(null);
    try {
      const result = await importJobFromUrl(trimmed);
      await queryClient.invalidateQueries({ queryKey: ["applications"] });
      setAppUrl("");
      setAddFormSuccessMessage(result.message);
      window.setTimeout(() => setAddFormSuccessMessage(null), 6000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not add to tracker. Please try again.";
      setAddFormError(message);
    } finally {
      setIsAddingToTracker(false);
    }
  };

  return (
    <div className="pb-32">
      {/* Hero Carousel Section - White Background */}
      <div className="bg-white dark:bg-[#111] border-b border-slate-200 dark:border-slate-800 py-10">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-normal text-slate-900 dark:text-white">Recommended For You</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Based on your portfolio and resume profile.</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleHeroPrevPage}
                disabled={isHeroLoading || recommendedUIPage <= 1}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-[#111]"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={handleHeroNextPage}
                disabled={isHeroLoading || (isOnLastHeroUIPage && !recommendedHasNextPage)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-[#111]"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* Top section: one row of 3 jobs, with arrows to see more */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {isHeroLoading ? (
              Array.from({ length: TOP_JOBS_PER_PAGE }, (_, i) => (
                <div key={i} className="w-full">
                  <JobCardSkeleton />
                </div>
              ))
            ) : (
              <>
                {heroJobsOnCurrentPage.map(job => (
                  <div key={job.id} className="relative w-full group">
                    <JobCard job={job} onClick={checkJobDetails} onPrepare={handlePrepareApp} onApply={handleApply} />
                  </div>
                ))}
                {isRecommendedFetchingNextPage &&
                  Array.from({ length: Math.min(TOP_JOBS_PER_PAGE - heroJobsOnCurrentPage.length, TOP_JOBS_PER_PAGE) }, (_, i) => (
                    <div key={`rec-skeleton-${i}`} className="w-full">
                      <JobCardSkeleton />
                    </div>
                  ))}
              </>
            )}
          </div>
        </div>
      </div>

      <LinkedInRibbonBanner onNavigateToStudio={onNavigateToStudio} />

      <div className="max-w-[1400px] mx-auto px-6 mt-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="relative flex min-h-[220px] flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-5 dark:border-slate-700 dark:bg-slate-900">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-brand-100 bg-brand-50 text-brand-600 dark:border-brand-900/40 dark:bg-brand-950/40 dark:text-brand-400">
                <Plus size={20} strokeWidth={2} />
              </div>
              <h3 className="text-lg font-semibold leading-snug text-slate-900 dark:text-white">Add an application</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                Paste a job URL to save it straight to your tracker.
              </p>
            </div>
            <div
              className={`mt-5 flex flex-col gap-4 transition-opacity ${isAddingToTracker ? "pointer-events-none opacity-0" : "opacity-100"}`}
              aria-hidden={isAddingToTracker}
            >
              <div className="relative">
                <LinkIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="url"
                  value={appUrl}
                  onChange={e => {
                    setAppUrl(e.target.value);
                    setAddFormError(null);
                  }}
                  placeholder="Paste job posting URL"
                  disabled={isAddingToTracker}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-brand-300 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-brand-500/50 disabled:opacity-60"
                />
              </div>
              {addFormError && <p className="text-xs text-red-600 dark:text-red-400">{addFormError}</p>}
              {addFormSuccessMessage && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  {addFormSuccessMessage}{" "}
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
                disabled={!appUrl.trim() || isAddingToTracker}
                className="w-full rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white shadow-sm shadow-brand-500/20 transition-all hover:bg-brand-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Save and add to tracker
              </button>
            </div>
            {isAddingToTracker && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/95 dark:bg-slate-900/95">
                <JobUrlImportLoading compact />
              </div>
            )}
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
            onSearchSubmit={handleSearchSubmit}
            filterType={filterType}
            setFilterType={handleBrowseFilterChange}
          />
        </div>

        {filterType === "Saved" && (
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Showing {savedJobs.length} saved {savedJobs.length === 1 ? "job" : "jobs"}
            </h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSavedPrevPage}
                disabled={isSavedLoading || savedUIPage <= 1}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 disabled:opacity-40 dark:border-slate-700 dark:bg-[#111]"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={handleSavedNextPage}
                disabled={isSavedLoading || (isOnLastSavedUIPage && !savedPagination?.has_next)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 disabled:opacity-40 dark:border-slate-700 dark:bg-[#111]"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {filterType === "Recommended" && submittedSearch && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Showing {searchResultsJobs.length} {searchResultsJobs.length === 1 ? "job" : "jobs"}
            </h3>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filterType === "Saved" ? (
            isSavedLoading && savedJobs.length === 0 ? (
              Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="w-full">
                  <JobCardSkeleton />
                </div>
              ))
            ) : savedJobs.length === 0 ? (
              <div className="col-span-full py-16 text-center text-sm text-slate-500 dark:text-slate-400">
                No saved jobs yet. Save jobs from search results or job details.
              </div>
            ) : (
              <>
                {savedJobsOnCurrentPage.map(job => (
                  <div key={job.id} className="w-full">
                    <JobCard job={job} hideButtons onClick={checkJobDetails} onPrepare={handlePrepareApp} onApply={handleApply} />
                  </div>
                ))}
                {isOnLastSavedUIPage && savedPagination?.has_next && (
                  <button
                    type="button"
                    onClick={handleFetchMoreSavedBrowse}
                    className="flex min-h-0 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-4 text-sm font-medium text-slate-600 transition-colors hover:border-brand-300 dark:border-slate-700 dark:bg-slate-900/20 dark:text-slate-400"
                  >
                    Fetch more jobs
                  </button>
                )}
              </>
            )
          ) : !submittedSearch ? (
            <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-16 dark:border-slate-700 dark:bg-slate-900/20">
              <Search className="mb-4 h-12 w-12 text-slate-300 dark:text-slate-600" />
              <p className="max-w-sm text-center text-sm text-slate-500 dark:text-slate-400">
                Search by role, company, or keywords above and press Enter or choose a suggestion to see jobs here.
              </p>
            </div>
          ) : isSearchResultsLoading && searchResultsJobs.length === 0 ? (
            [1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
              <div key={i} className="w-full">
                <JobCardSkeleton />
              </div>
            ))
          ) : searchResultsJobs.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-500 dark:text-slate-400 text-sm">
              No jobs found for this search. Try different keywords or location.
            </div>
          ) : (
            <>
              {searchJobsOnCurrentPage.map(job => (
                <div key={job.id} className="relative group">
                  <div className="h-full w-full">
                    <JobCard job={job} hideButtons={true} onClick={checkJobDetails} onPrepare={handlePrepareApp} onApply={handleApply} />
                  </div>
                </div>
              ))}
              {/* Fetch more card - same size as job cell, only on last page when more from API */}
              {isOnLastSearchUIPage && searchHasNextPage && !isSearchFetchingNextPage && (
                <button
                  type="button"
                  onClick={() => fetchMoreSearchJobs()}
                  className="w-full h-full min-h-0 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800/50 flex flex-col items-center justify-center p-4 text-slate-600 dark:text-slate-400 font-medium text-sm transition-colors"
                >
                  Fetch more jobs
                </button>
              )}
              {/* Shimmer cells only while fetching next batch */}
              {isSearchFetchingNextPage &&
                [1, 2, 3].map(i => (
                  <div key={`skeleton-more-${i}`} className="w-full">
                    <JobCardSkeleton />
                  </div>
                ))}
            </>
          )}
        </div>

        {filterType === "Recommended" && submittedSearch && searchResultsJobs.length > 0 && (
          <div className="mt-6 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleSearchPrevPage}
              disabled={searchUIPage <= 1}
              className="w-9 h-9 flex items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111] text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              Page {searchUIPage} of {searchTotalUIPages}
            </span>
            <button
              type="button"
              onClick={handleSearchNextPage}
              disabled={searchUIPage >= searchTotalUIPages}
              className="w-9 h-9 flex items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111] text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedJob && (
        <JobDetailsModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onApply={handleApply}
          onToggleSave={handleToggleSave}
          isSaved={selectedJob.isSaved}
          onNavigateToStudio={onNavigateToStudio}
          onStartInterviewPrep={onStartInterviewPrep}
        />
      )}

      {preparingJob && (
        <PrepareApplicationModal
          job={preparingJob}
          source="discovery"
          onClose={() => setPreparingJob(null)}
          onNavigateToStudio={onNavigateToStudio}
          onStartInterviewPrep={onStartInterviewPrep}
        />
      )}
    </div>
  );
};

export default JobDiscovery;
