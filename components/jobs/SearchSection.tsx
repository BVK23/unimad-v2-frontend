import React, { useEffect, useRef, useState } from "react";
import { useJobSuggestions } from "@/features/jobs/hooks/useJobSuggestions";
import { useLocationSuggestions } from "@/features/jobs/hooks/useLocationSuggestions";
import { JOB_TYPE_FILTER_OPTIONS, LOCATION_FILTER_OPTIONS, VISA_FILTER_OPTION } from "@/features/jobs/job-search-filters";
import { useDebounce } from "@/hooks/useDebounce";
import { Search, MapPin, SlidersHorizontal, ChevronDown, CheckSquare, Square, Bookmark } from "lucide-react";

export type JobsBrowseFilter = "Recommended" | "Saved";

interface SearchSectionProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  locationTerm: string;
  setLocationTerm: (term: string) => void;
  onSearchSubmit: (q: string, location: string, activeFilters: string[]) => void;
  filterType: JobsBrowseFilter;
  setFilterType: (type: JobsBrowseFilter) => void;
}

interface FilterGroupProps {
  title: string;
  options: string[];
  activeFilters: string[];
  onToggle: (filter: string) => void;
}

function FilterGroup({ title, options, activeFilters, onToggle }: FilterGroupProps) {
  return (
    <div className="mb-4 last:mb-0">
      <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-400">{title}</h4>
      <div className="space-y-2">
        {options.map(option => (
          <div
            key={option}
            role="button"
            tabIndex={0}
            onClick={() => onToggle(option)}
            onKeyDown={e => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onToggle(option);
              }
            }}
            className="group flex cursor-pointer items-center gap-2"
          >
            {activeFilters.includes(option) ? (
              <CheckSquare size={16} className="text-brand-600" />
            ) : (
              <Square size={16} className="text-slate-300 transition-colors group-hover:text-slate-400 dark:text-slate-700" />
            )}
            <span
              className={`text-sm ${activeFilters.includes(option) ? "font-medium text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400"}`}
            >
              {option}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const SearchSection: React.FC<SearchSectionProps> = ({
  searchTerm,
  setSearchTerm,
  locationTerm,
  setLocationTerm,
  onSearchSubmit,
  filterType,
  setFilterType,
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>(["Remote", "Full-time"]);
  const roleContainerRef = useRef<HTMLDivElement>(null);
  const locationContainerRef = useRef<HTMLDivElement>(null);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const { suggestions, isLoading: isSuggestionsLoading } = useJobSuggestions(debouncedSearchTerm);
  const locationContext = searchTerm.trim() ? { q: searchTerm.trim() } : { recommended: true };
  const { locations, isLoading: isLocationsLoading } = useLocationSuggestions(locationContext, locationTerm);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (roleContainerRef.current && !roleContainerRef.current.contains(e.target as Node)) {
        setShowRoleDropdown(false);
      }
      if (locationContainerRef.current && !locationContainerRef.current.contains(e.target as Node)) {
        setShowLocationDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleFilter = (filter: string) => {
    setActiveFilters(prev => {
      if (prev.includes(filter)) {
        return prev.filter(f => f !== filter);
      }
      let next = [...prev, filter];
      if ((LOCATION_FILTER_OPTIONS as readonly string[]).includes(filter)) {
        next = next.filter(f => !(LOCATION_FILTER_OPTIONS as readonly string[]).includes(f));
        next.push(filter);
      }
      if ((JOB_TYPE_FILTER_OPTIONS as readonly string[]).includes(filter)) {
        next = next.filter(f => !(JOB_TYPE_FILTER_OPTIONS as readonly string[]).includes(f));
        next.push(filter);
      }
      return next;
    });
  };

  const submitWithFilters = (q: string) => {
    if (!q.trim()) return;
    onSearchSubmit(q.trim(), locationTerm.trim(), activeFilters);
    setShowRoleDropdown(false);
    setShowLocationDropdown(false);
  };

  const handleSearch = () => {
    submitWithFilters(searchTerm);
  };

  const handleSuggestionSelect = (title: string) => {
    setSearchTerm(title);
    submitWithFilters(title);
  };

  const handleLocationSelect = (loc: string) => {
    setLocationTerm(loc);
    setShowLocationDropdown(false);
  };

  const toggleSavedBrowse = () => {
    setFilterType(filterType === "Saved" ? "Recommended" : "Saved");
  };

  return (
    <div className="relative z-20">
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div
          ref={roleContainerRef}
          className="relative flex flex-1 items-center border-b border-slate-200 py-3 transition-colors focus-within:border-brand-400 dark:border-slate-700 dark:focus-within:border-brand-500"
        >
          <Search size={18} className="mr-3 shrink-0 text-slate-400" />
          <input
            type="text"
            placeholder="Search by role, company, or keywords..."
            className="w-full border-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value);
              if (e.target.value.trim().length >= 2) setShowRoleDropdown(true);
            }}
            onFocus={() => setShowRoleDropdown(searchTerm.trim().length >= 2)}
            onKeyDown={e => {
              if (e.key === "Enter") handleSearch();
            }}
          />
          {showRoleDropdown && searchTerm.trim().length >= 2 && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-[280px] overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-[#1a1a1a]">
              {isSuggestionsLoading ? (
                <div className="p-3 text-sm text-slate-500 dark:text-slate-400">Searching...</div>
              ) : suggestions.length > 0 ? (
                suggestions.map((title, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="w-full border-b border-slate-100 px-4 py-3 text-left text-sm text-slate-700 transition-colors last:border-0 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                    onClick={() => handleSuggestionSelect(title)}
                  >
                    {title}
                  </button>
                ))
              ) : (
                <div className="p-3 text-sm text-slate-400 dark:text-slate-500">No matching roles found</div>
              )}
            </div>
          )}
        </div>

        <div
          ref={locationContainerRef}
          className="relative flex flex-1 items-center border-b border-slate-200 py-3 transition-colors focus-within:border-brand-400 dark:border-slate-700 dark:focus-within:border-brand-500 md:max-w-xs"
        >
          <MapPin size={18} className="mr-3 shrink-0 text-slate-400" />
          <input
            type="text"
            placeholder="City, state, or remote"
            className="w-full border-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
            value={locationTerm}
            onChange={e => {
              setLocationTerm(e.target.value);
              setShowLocationDropdown(true);
            }}
            onFocus={() => setShowLocationDropdown(locationTerm.trim().length >= 1)}
            onKeyDown={e => {
              if (e.key === "Enter") handleSearch();
            }}
          />
          {showLocationDropdown && locationTerm.trim().length >= 1 && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-[280px] overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-[#1a1a1a]">
              {isLocationsLoading ? (
                <div className="p-3 text-sm text-slate-500 dark:text-slate-400">Loading...</div>
              ) : locations.length > 0 ? (
                locations.map((loc, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="w-full border-b border-slate-100 px-4 py-2.5 text-left text-sm text-slate-700 transition-colors last:border-0 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                    onClick={() => handleLocationSelect(loc)}
                  >
                    {loc}
                  </button>
                ))
              ) : (
                <div className="p-3 text-sm text-slate-400 dark:text-slate-500">No locations found</div>
              )}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={toggleSavedBrowse}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all active:scale-95 ${
              filterType === "Saved"
                ? "border-brand-600 bg-brand-600 text-white shadow-md shadow-brand-500/20"
                : "border-slate-200 bg-transparent text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800/50"
            }`}
          >
            <Bookmark size={16} className={filterType === "Saved" ? "fill-white text-white" : "text-slate-500"} />
            <span className="hidden whitespace-nowrap md:inline">Saved Jobs</span>
          </button>

          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all active:scale-95 ${
              showFilters
                ? "border-brand-200 bg-brand-50 text-brand-600 dark:border-brand-800 dark:bg-brand-950/30 dark:text-brand-400"
                : "border-slate-200 bg-transparent text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800/50"
            }`}
          >
            <SlidersHorizontal size={18} />
            <span className="hidden md:inline">Filters</span>
            <ChevronDown size={14} className={`transition-transform ${showFilters ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      <div className="hide-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
        {activeFilters.map(filter => (
          <span
            key={filter}
            className="flex items-center gap-1 whitespace-nowrap rounded-lg border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-600 dark:border-brand-800/30 dark:bg-brand-900/20 dark:text-brand-400"
          >
            {filter}{" "}
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                toggleFilter(filter);
              }}
              className="hover:text-brand-800"
            >
              ×
            </button>
          </span>
        ))}
        {activeFilters.length === 0 && <span className="py-1 text-xs text-slate-400">No active filters</span>}
      </div>

      {showFilters && (
        <div className="absolute right-0 top-full z-30 mt-2 w-72 animate-in fade-in zoom-in-95 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl duration-200 dark:border-slate-800 dark:bg-[#1a1a1a]">
          <FilterGroup title="Job Type" options={[...JOB_TYPE_FILTER_OPTIONS]} activeFilters={activeFilters} onToggle={toggleFilter} />
          <FilterGroup title="Location" options={[...LOCATION_FILTER_OPTIONS]} activeFilters={activeFilters} onToggle={toggleFilter} />
          <FilterGroup title="Benefits" options={[VISA_FILTER_OPTION]} activeFilters={activeFilters} onToggle={toggleFilter} />
          {/* Pay scale — not supported by /api/jobs/ yet
          <FilterGroup
            title="Pay Scale"
            options={["$50k - $100k", "$100k - $150k", "$150k+", "Equity Only"]}
            activeFilters={activeFilters}
            onToggle={toggleFilter}
          />
          */}
          {/* Extra benefits — not supported by /api/jobs/ yet
          <FilterGroup
            title="Benefits"
            options={["Health Insurance", "401k"]}
            activeFilters={activeFilters}
            onToggle={toggleFilter}
          />
          */}
          {/* Posted date — not supported by /api/jobs/ yet
          <FilterGroup
            title="Date Posted"
            options={["Past 24 hours", "Past Week", "Past Month"]}
            activeFilters={activeFilters}
            onToggle={toggleFilter}
          />
          */}
          <div className="mt-4 flex justify-end border-t border-slate-100 pt-4 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowFilters(false)}
              className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {showFilters && <div className="fixed inset-0 z-10" onClick={() => setShowFilters(false)} aria-hidden />}
    </div>
  );
};

export default SearchSection;
