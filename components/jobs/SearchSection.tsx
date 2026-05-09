import React, { useEffect, useRef, useState } from "react";
import { useJobSuggestions } from "@/features/jobs/hooks/useJobSuggestions";
import { useLocationSuggestions } from "@/features/jobs/hooks/useLocationSuggestions";
import { useDebounce } from "@/hooks/useDebounce";
import { Search, MapPin, SlidersHorizontal, ChevronDown, CheckSquare, Square } from "lucide-react";

interface SearchSectionProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  locationTerm: string;
  setLocationTerm: (term: string) => void;
  onSearchSubmit: (q: string, location: string) => void;
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
      <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">{title}</div>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => {
          const isActive = activeFilters.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onToggle(opt)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                isActive
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                  : "bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const SearchSection: React.FC<SearchSectionProps> = ({ searchTerm, setSearchTerm, locationTerm, setLocationTerm, onSearchSubmit }) => {
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
    if (activeFilters.includes(filter)) {
      setActiveFilters(activeFilters.filter(f => f !== filter));
    } else {
      setActiveFilters([...activeFilters, filter]);
    }
  };

  const handleRoleSubmit = () => {
    if (searchTerm.trim()) {
      onSearchSubmit(searchTerm.trim(), locationTerm.trim());
      setShowRoleDropdown(false);
      setShowLocationDropdown(false);
    }
  };

  const handleSuggestionSelect = (title: string) => {
    setSearchTerm(title);
    setShowRoleDropdown(false);
    onSearchSubmit(title, locationTerm.trim());
  };

  const handleLocationSelect = (loc: string) => {
    setLocationTerm(loc);
    setShowLocationDropdown(false);
  };

  return (
    <div className="relative">
      <div className="bg-white dark:bg-[#111] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative z-20">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Role / Keywords Input with suggestions dropdown */}
          <div ref={roleContainerRef} className="flex-1 relative">
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
              <Search size={18} className="text-slate-400 mr-3 shrink-0" />
              <input
                type="text"
                placeholder="Search by role, company, or keywords..."
                className="bg-transparent border-none outline-none text-sm text-slate-900 dark:text-white w-full placeholder:text-slate-400"
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                  if (e.target.value.trim().length >= 2) setShowRoleDropdown(true);
                }}
                onFocus={() => setShowRoleDropdown(searchTerm.trim().length >= 2)}
                onKeyDown={e => {
                  if (e.key === "Enter") handleRoleSubmit();
                }}
              />
            </div>
            {showRoleDropdown && searchTerm.trim().length >= 2 && (
              <div className="absolute top-full left-0 right-0 mt-1 min-w-[200px] bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg z-50 max-h-[280px] overflow-y-auto">
                {isSuggestionsLoading ? (
                  <div className="p-3 text-slate-500 dark:text-slate-400 text-sm">Searching...</div>
                ) : suggestions.length > 0 ? (
                  suggestions.map((title, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800 last:border-0 transition-colors"
                      onClick={() => handleSuggestionSelect(title)}
                    >
                      {title}
                    </button>
                  ))
                ) : (
                  <div className="p-3 text-slate-400 dark:text-slate-500 text-sm">No matching roles found</div>
                )}
              </div>
            )}
          </div>

          {/* Location Input with suggestions dropdown */}
          <div ref={locationContainerRef} className="flex-1 md:max-w-xs relative">
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
              <MapPin size={18} className="text-slate-400 mr-3 shrink-0" />
              <input
                type="text"
                placeholder="City, state, or remote"
                className="bg-transparent border-none outline-none text-sm text-slate-900 dark:text-white w-full placeholder:text-slate-400"
                value={locationTerm}
                onChange={e => {
                  setLocationTerm(e.target.value);
                  setShowLocationDropdown(true);
                }}
                onFocus={() => setShowLocationDropdown(locationTerm.trim().length >= 1)}
                onKeyDown={e => {
                  if (e.key === "Enter") handleRoleSubmit();
                }}
              />
            </div>
            {showLocationDropdown && locationTerm.trim().length >= 1 && (
              <div className="absolute top-full left-0 right-0 mt-1 min-w-[160px] bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg z-50 max-h-[280px] overflow-y-auto">
                {isLocationsLoading ? (
                  <div className="p-3 text-slate-500 dark:text-slate-400 text-sm">Loading...</div>
                ) : locations.length > 0 ? (
                  locations.map((loc, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800 last:border-0 transition-colors"
                      onClick={() => handleLocationSelect(loc)}
                    >
                      {loc}
                    </button>
                  ))
                ) : (
                  <div className="p-3 text-slate-400 dark:text-slate-500 text-sm">No locations found</div>
                )}
              </div>
            )}
          </div>

          {/* Search button */}
          <button
            type="button"
            onClick={handleRoleSubmit}
            disabled={!searchTerm.trim()}
            className="px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm"
          >
            <Search size={18} /> Search
          </button>

          {/* Filter Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-3 border rounded-xl transition-all flex items-center gap-2 font-medium active:scale-95 ${showFilters ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400" : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"}`}
          >
            <SlidersHorizontal size={18} />
            <span className="hidden md:inline">Filters</span>
            <ChevronDown size={14} className={`transition-transform ${showFilters ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* Active Filters Summary */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-1 hide-scrollbar">
          {activeFilters.map((filter, i) => (
            <span
              key={i}
              className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-medium rounded-lg border border-blue-100 dark:border-blue-800/30 whitespace-nowrap flex items-center gap-1"
            >
              {filter}{" "}
              <button
                onClick={e => {
                  e.stopPropagation();
                  toggleFilter(filter);
                }}
                className="hover:text-blue-800"
              >
                ×
              </button>
            </span>
          ))}
          {activeFilters.length === 0 && <span className="text-xs text-slate-400 py-1">No active filters</span>}
        </div>
      </div>

      {/* Filter Dropdown Menu */}
      {showFilters && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 z-30 animate-in fade-in zoom-in-95 duration-200">
          <FilterGroup
            title="Job Type"
            options={["Full-time", "Contract", "Internship", "Freelance"]}
            activeFilters={activeFilters}
            onToggle={toggleFilter}
          />
          <FilterGroup title="Location" options={["Remote", "On-site", "Hybrid"]} activeFilters={activeFilters} onToggle={toggleFilter} />
          <FilterGroup
            title="Pay Scale"
            options={["$50k - $100k", "$100k - $150k", "$150k+", "Equity Only"]}
            activeFilters={activeFilters}
            onToggle={toggleFilter}
          />
          <FilterGroup
            title="Benefits"
            options={["Visa Sponsorship", "Health Insurance", "401k"]}
            activeFilters={activeFilters}
            onToggle={toggleFilter}
          />
          <FilterGroup
            title="Date Posted"
            options={["Past 24 hours", "Past Week", "Past Month"]}
            activeFilters={activeFilters}
            onToggle={toggleFilter}
          />

          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              onClick={() => setShowFilters(false)}
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Backdrop to close filters */}
      {showFilters && <div className="fixed inset-0 z-10" onClick={() => setShowFilters(false)} />}
    </div>
  );
};

export default SearchSection;
