import React, { useEffect, useMemo, useState } from "react";
import { useSaveJob, useUnsaveJob } from "@/features/jobs/hooks/useJobMutations";
import { useJobViewed } from "@/features/jobs/hooks/useJobViewed";
import { useRecommendedJobs } from "@/features/jobs/hooks/useRecommendedJobs";
import { useSavedJobs } from "@/features/jobs/hooks/useSavedJobs";
import { useSearchJobs } from "@/features/jobs/hooks/useSearchJobs";
import { getSavedJobs } from "@/features/jobs/server-actions/jobs-actions";
import type { BackendJob } from "@/features/jobs/types";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, FileText, Mail, Briefcase, MessageSquare, Bookmark, ArrowRight, Search } from "lucide-react";
import { Job, GeneratorContext } from "../../types/jobs";
import JobCard from "./JobCard";
import JobCardSkeleton from "./JobCardSkeleton";
import JobDetailsModal from "./JobDetailsModal";
import PrepareApplicationModal from "./PrepareApplicationModal";
import SearchSection from "./SearchSection";

interface JobDiscoveryProps {
  onNavigateToStudio: (context: GeneratorContext) => void;
}

const JobDiscovery: React.FC<JobDiscoveryProps> = ({ onNavigateToStudio }) => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [locationTerm, setLocationTerm] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState<{ q: string; location: string } | null>(null);
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
  } = useRecommendedJobs({ enabled: filterType === "Recommended" });

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
    const postedLabel = job.posted_at
      ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(job.posted_at))
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
      applyUrl: job.apply_url ?? undefined,
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

  const activeJobs = filterType === "Saved" ? savedJobs : recommendedJobs;

  const activeUIPage = filterType === "Saved" ? savedUIPage : recommendedUIPage;
  const setActiveUIPage = filterType === "Saved" ? setSavedUIPage : setRecommendedUIPage;
  const activeJobsOnCurrentPage = useMemo(
    () => activeJobs.slice((activeUIPage - 1) * TOP_JOBS_PER_PAGE, activeUIPage * TOP_JOBS_PER_PAGE),
    [activeJobs, activeUIPage]
  );
  const activeTotalUIPages = Math.max(1, Math.ceil(activeJobs.length / TOP_JOBS_PER_PAGE));
  const isOnLastActiveUIPage = activeUIPage >= activeTotalUIPages;

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

  const isLoading = filterType === "Saved" ? isSavedLoading : isRecommendedLoading;
  const isSearchResultsLoading = isSearchLoading;

  const activePagination = filterType === "Saved" ? savedData?.pagination : null;

  // When user reaches end of recommended list, auto-fetch more so it's seamless
  useEffect(() => {
    if (filterType !== "Recommended" || !recommendedHasNextPage || isRecommendedFetchingNextPage || recommendedJobs.length === 0) return;
    const needed = activeUIPage * TOP_JOBS_PER_PAGE;
    if (recommendedJobs.length < needed) {
      fetchMoreRecommendedJobs();
    }
  }, [filterType, recommendedHasNextPage, isRecommendedFetchingNextPage, activeUIPage, recommendedJobs.length, fetchMoreRecommendedJobs]);

  const handlePrevPage = () => {
    setActiveUIPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    if (activeUIPage * TOP_JOBS_PER_PAGE < activeJobs.length) {
      setActiveUIPage(prev => prev + 1);
    } else if (filterType === "Saved" && activePagination?.has_next) {
      setSavedPage(p => p + 1);
      setSavedUIPage(1);
    }
  };

  const handleFetchMoreSaved = () => {
    setSavedPage(p => p + 1);
    setSavedUIPage(1);
  };

  const handleSearchPrevPage = () => {
    setSearchUIPage(p => Math.max(1, p - 1));
  };

  const handleSearchNextPage = () => {
    if (searchUIPage * SEARCH_JOBS_PER_PAGE < searchResultsJobs.length) {
      setSearchUIPage(p => p + 1);
    }
  };

  const handleToggleFilterType = () => {
    setFilterType(prev => (prev === "Saved" ? "Recommended" : "Saved"));
    setRecommendedUIPage(1);
    setSavedUIPage(1);
  };

  const handleSearchSubmit = (q: string, location: string) => {
    const trimmedQ = q.trim();
    if (!trimmedQ) return;
    setSubmittedSearch({ q: trimmedQ, location: location.trim() });
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
      selectedJob?.id === jobId ? selectedJob : (activeJobs.find(j => j.id === jobId) ?? searchResultsJobs.find(j => j.id === jobId));
    if (!job || isMutatingSave) return;

    if (job.isSaved) {
      unsaveJobMutation.mutate({ jobId, jobTitle: job.role });
    } else {
      saveJobMutation.mutate({ jobId, jobTitle: job.role });
    }
  };

  useJobViewed(selectedJob?.id);

  return (
    <div className="pb-32">
      {/* Hero Carousel Section - White Background */}
      <div className="bg-white dark:bg-[#111] border-b border-slate-200 dark:border-slate-800 py-10">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-normal text-slate-900 dark:text-white">
                {filterType === "Saved" ? "Saved Jobs" : "Recommended For You"}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {filterType === "Saved" ? "All your saved jobs." : "Based on your portfolio and resume profile."}
              </p>
            </div>

            {/* Saved Jobs Header Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleFilterType}
                className={`
                                    px-5 py-2.5 rounded-full text-sm font-medium transition-all border flex items-center gap-2
                                    ${
                                      filterType === "Saved"
                                        ? "bg-blue-600 border-blue-600 text-white shadow-md"
                                        : "bg-white dark:bg-[#111] border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400"
                                    }
                                `}
              >
                <Bookmark size={16} className={filterType === "Saved" ? "fill-white text-white" : "text-slate-500"} />
                Saved Jobs
              </button>
              <button
                onClick={handlePrevPage}
                disabled={isLoading || activeUIPage <= 1}
                className="w-9 h-9 flex items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111] text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={handleNextPage}
                disabled={
                  isLoading ||
                  (filterType === "Recommended"
                    ? activeUIPage >= activeTotalUIPages && !recommendedHasNextPage
                    : activeUIPage >= activeTotalUIPages && !activePagination?.has_next)
                }
                className="w-9 h-9 flex items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111] text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* Top section: one row of 3 jobs, with arrows to see more */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {isLoading ? (
              Array.from({ length: TOP_JOBS_PER_PAGE }, (_, i) => (
                <div key={i} className="w-full">
                  <JobCardSkeleton />
                </div>
              ))
            ) : (
              <>
                {activeJobsOnCurrentPage.map(job => (
                  <div key={job.id} className="w-full relative group">
                    <JobCard job={job} onClick={checkJobDetails} onPrepare={handlePrepareApp} onApply={handleApply} />
                  </div>
                ))}
                {/* Only the empty slot(s) in this row shimmer when fetching more recommended */}
                {filterType === "Recommended" &&
                  isRecommendedFetchingNextPage &&
                  Array.from(
                    {
                      length: Math.min(TOP_JOBS_PER_PAGE - activeJobsOnCurrentPage.length, TOP_JOBS_PER_PAGE),
                    },
                    (_, i) => (
                      <div key={`rec-skeleton-${i}`} className="w-full">
                        <JobCardSkeleton />
                      </div>
                    )
                  )}
                {/* Fetch more card only for Saved when there is a next API page */}
                {filterType === "Saved" && !isLoading && isOnLastActiveUIPage && activePagination?.has_next && (
                  <button
                    type="button"
                    onClick={handleFetchMoreSaved}
                    className="w-full h-full min-h-0 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800/50 flex flex-col items-center justify-center p-4 text-slate-600 dark:text-slate-400 font-medium text-sm transition-colors"
                  >
                    Fetch more jobs
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content Lab Feature Section - New Dark Design */}
      <div className="max-w-[1400px] mx-auto px-6 mt-6">
        <div className="bg-[#080C15] rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[280px] border border-slate-800">
          {/* SVG Background */}
          <div className="absolute inset-0 z-0">
            <svg
              className="w-full h-full object-cover"
              preserveAspectRatio="none"
              viewBox="0 0 2424 868"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g clipPath="url(#clip0_2278_162)">
                <rect width="2424" height="868" fill="#080C15" />
                <g style={{ mixBlendMode: "hard-light" }} filter="url(#filter0_f_2278_162)">
                  <path
                    d="M2956.25 917.841C3835.35 844.561 708.705 1687.33 1692.56 861.984C2676.42 36.6427 1075.48 723.355 838.766 385.629C602.05 47.9029 1069.29 516.956 1837.92 161.64C2606.54 -193.676 2077.16 991.12 2956.25 917.841Z"
                    fill="url(#paint0_linear_2278_162)"
                  />
                </g>
                <g style={{ mixBlendMode: "lighten" }} opacity="0.01" filter="url(#filter1_f_2278_162)">
                  <path
                    d="M3165.25 754.568C4044.35 681.223 917.705 1524.73 1901.56 698.662C2885.42 -127.409 1284.48 559.91 1047.77 221.886C811.05 -116.139 1278.29 353.328 2046.92 -2.30108C2815.54 -357.931 2286.16 827.912 3165.25 754.568Z"
                    fill="url(#paint1_linear_2278_162)"
                  />
                </g>
                <g style={{ mixBlendMode: "color-dodge" }} opacity="0.37" filter="url(#filter2_fn_2278_162)">
                  <path
                    d="M2858.25 998.568C3737.35 925.223 610.705 1768.73 1594.56 942.662C2578.42 116.591 977.481 803.91 740.766 465.886C504.05 127.861 971.289 597.328 1739.92 241.699C2508.54 -113.931 1979.16 1071.91 2858.25 998.568Z"
                    fill="url(#paint2_linear_2278_162)"
                  />
                </g>
              </g>
              <defs>
                <filter
                  id="filter0_f_2278_162"
                  x="610"
                  y="-72"
                  width="2671"
                  height="1466"
                  filterUnits="userSpaceOnUse"
                  colorInterpolationFilters="sRGB"
                >
                  <feFlood floodOpacity="0" result="BackgroundImageFix" />
                  <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                  <feGaussianBlur stdDeviation="83.5" result="effect1_foregroundBlur_2278_162" />
                </filter>
                <filter
                  id="filter1_f_2278_162"
                  x="819"
                  y="-236"
                  width="2671"
                  height="1467"
                  filterUnits="userSpaceOnUse"
                  colorInterpolationFilters="sRGB"
                >
                  <feFlood floodOpacity="0" result="BackgroundImageFix" />
                  <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                  <feGaussianBlur stdDeviation="83.5" result="effect1_foregroundBlur_2278_162" />
                </filter>
                <filter
                  id="filter2_fn_2278_162"
                  x="579"
                  y="75"
                  width="2537"
                  height="1333"
                  filterUnits="userSpaceOnUse"
                  colorInterpolationFilters="sRGB"
                >
                  <feFlood floodOpacity="0" result="BackgroundImageFix" />
                  <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                  <feGaussianBlur stdDeviation="50" result="effect1_foregroundBlur_2278_162" />
                  <feTurbulence type="fractalNoise" baseFrequency="2 2" stitchTiles="stitch" numOctaves="3" result="noise" seed="6081" />
                  <feColorMatrix in="noise" type="luminanceToAlpha" result="alphaNoise" />
                  <feComponentTransfer in="alphaNoise" result="coloredNoise1">
                    <feFuncA
                      type="discrete"
                      tableValues="1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 "
                    />
                  </feComponentTransfer>
                  <feComposite operator="in" in2="effect1_foregroundBlur_2278_162" in="coloredNoise1" result="noise1Clipped" />
                  <feFlood floodColor="rgba(0, 0, 0, 0.25)" result="color1Flood" />
                  <feComposite operator="in" in2="noise1Clipped" in="color1Flood" result="color1" />
                  <feMerge result="effect2_noise_2278_162">
                    <feMergeNode in="effect1_foregroundBlur_2278_162" />
                    <feMergeNode in="color1" />
                  </feMerge>
                </filter>
                <linearGradient
                  id="paint0_linear_2278_162"
                  x1="2172.8"
                  y1="1791.58"
                  x2="2086.08"
                  y2="-29.7205"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0.173077" stopColor="#346DE0" />
                  <stop offset="1" stopColor="#67DEFF" />
                </linearGradient>
                <linearGradient
                  id="paint1_linear_2278_162"
                  x1="2381.8"
                  y1="1629.08"
                  x2="2294.93"
                  y2="-193.823"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0.173077" stopColor="#346DE0" />
                  <stop offset="1" stopColor="#67DEFF" />
                </linearGradient>
                <linearGradient
                  id="paint2_linear_2278_162"
                  x1="2074.8"
                  y1="1873.08"
                  x2="1987.93"
                  y2="50.1766"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0.173077" stopColor="#346DE0" />
                  <stop offset="1" stopColor="#67DEFF" />
                </linearGradient>
                <clipPath id="clip0_2278_162">
                  <rect width="2424" height="868" fill="white" />
                </clipPath>
              </defs>
            </svg>
          </div>

          {/* Text Content (Top Left) */}
          <div className="relative z-10 mb-8 max-w-2xl">
            <h2 className="text-[20px] font-semibold text-white mb-2 leading-tight">
              Supercharge your <br />
              applications with Content Lab
            </h2>
            <button
              onClick={() => onNavigateToStudio({ type: "cover-letter" })}
              className="text-blue-500 hover:text-blue-400 font-medium text-sm transition-colors flex items-center gap-1 group"
            >
              Open Content Lab <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Tool Cards (Bottom Row) */}
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: "Cover Letter", desc: "Craft tailored cover letters.", type: "cover-letter" as const },
              { name: "Cold Email", desc: "Outreach templates.", type: "cold-email" as const },
              { name: "Referral Request", desc: "Get referred by pros.", type: "referral" as const },
              { name: "Value Prop", desc: "Define your strengths.", type: "vpd" as const },
            ].map((tool, idx) => (
              <div
                key={idx}
                onClick={() => onNavigateToStudio({ type: tool.type })}
                className="group/card relative bg-white/5 backdrop-blur-md rounded-2xl p-5 cursor-pointer transition-all duration-300 overflow-hidden border border-white/5 h-[110px]"
              >
                <div className="relative z-10 flex flex-col items-start justify-start h-full">
                  <div>
                    <h4 className="text-white font-medium text-[14px] mb-1">{tool.name}</h4>
                    <p className="text-slate-400 text-[12px] leading-relaxed mb-0 group-hover/card:text-slate-300 transition-colors">
                      {tool.desc}
                    </p>
                  </div>
                </div>
                <div className="absolute bottom-4 left-5 opacity-0 translate-y-4 group-hover/card:opacity-100 group-hover/card:translate-y-0 transition-all duration-300">
                  <span className="text-brand-500 text-[11px] font-normal flex items-center gap-1.5">
                    Generate <ArrowRight size={14} />
                  </span>
                </div>
              </div>
            ))}
          </div>
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
          />
        </div>

        {/* List View for Search Results - only when user has submitted a search */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {!submittedSearch ? (
            <div className="col-span-full flex flex-col items-center justify-center py-16 px-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20">
              <Search className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
              <p className="text-slate-500 dark:text-slate-400 text-sm text-center max-w-sm">
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

        {/* Search results: page arrows */}
        {submittedSearch && searchResultsJobs.length > 0 && (
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
        />
      )}

      {preparingJob && <PrepareApplicationModal job={preparingJob} onClose={() => setPreparingJob(null)} />}
    </div>
  );
};

export default JobDiscovery;
