import React, { useState } from 'react';
import { Search, MapPin, SlidersHorizontal, ChevronDown, CheckSquare, Square, Bookmark } from 'lucide-react';

interface SearchSectionProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    locationTerm: string;
    setLocationTerm: (term: string) => void;
    filterType: string;
    setFilterType: (type: string) => void;
}

const SearchSection: React.FC<SearchSectionProps> = ({ searchTerm, setSearchTerm, locationTerm, setLocationTerm, filterType, setFilterType }) => {
    const [showFilters, setShowFilters] = useState(false);
    const [activeFilters, setActiveFilters] = useState<string[]>(['Remote', 'Full-time']);

    const toggleFilter = (filter: string) => {
        if (activeFilters.includes(filter)) {
            setActiveFilters(activeFilters.filter(f => f !== filter));
        } else {
            setActiveFilters([...activeFilters, filter]);
        }
    };

    const FilterGroup = ({ title, options }: { title: string; options: string[] }) => (
        <div className="mb-4 last:mb-0">
            <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-400">{title}</h4>
            <div className="space-y-2">
                {options.map((option) => (
                    <div
                        key={option}
                        role="button"
                        tabIndex={0}
                        onClick={() => toggleFilter(option)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                toggleFilter(option);
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
                            className={`text-sm ${activeFilters.includes(option) ? 'font-medium text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}
                        >
                            {option}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="relative z-20">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="flex flex-1 items-center border-b border-slate-200 py-3 transition-colors focus-within:border-brand-400 dark:border-slate-700 dark:focus-within:border-brand-500">
                    <Search size={18} className="mr-3 shrink-0 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by role, company, or keywords..."
                        className="w-full border-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex flex-1 items-center border-b border-slate-200 py-3 transition-colors focus-within:border-brand-400 dark:border-slate-700 dark:focus-within:border-brand-500 md:max-w-xs">
                    <MapPin size={18} className="mr-3 shrink-0 text-slate-400" />
                    <input
                        type="text"
                        placeholder="City, state, or remote"
                        className="w-full border-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
                        value={locationTerm}
                        onChange={(e) => setLocationTerm(e.target.value)}
                    />
                </div>

                <div className="flex shrink-0 items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setFilterType(filterType === 'Saved' ? 'Recommended' : 'Saved')}
                        className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all active:scale-95 ${filterType === 'Saved' ? 'border-brand-600 bg-brand-600 text-white shadow-md shadow-brand-500/20' : 'border-slate-200 bg-transparent text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800/50'}`}
                    >
                        <Bookmark size={16} className={filterType === 'Saved' ? 'fill-white text-white' : 'text-slate-500'} />
                        <span className="hidden whitespace-nowrap md:inline">Saved Jobs</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all active:scale-95 ${showFilters ? 'border-brand-200 bg-brand-50 text-brand-600 dark:border-brand-800 dark:bg-brand-950/30 dark:text-brand-400' : 'border-slate-200 bg-transparent text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800/50'}`}
                    >
                        <SlidersHorizontal size={18} />
                        <span className="hidden md:inline">Filters</span>
                        <ChevronDown size={14} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                    </button>
                </div>
            </div>

            <div className="mt-4 flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                {activeFilters.map((filter) => (
                    <span
                        key={filter}
                        className="flex items-center gap-1 whitespace-nowrap rounded-lg border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-600 dark:border-brand-800/30 dark:bg-brand-900/20 dark:text-brand-400"
                    >
                        {filter}{' '}
                        <button
                            type="button"
                            onClick={(e) => {
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
                <div className="absolute right-0 top-full z-30 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200 dark:border-slate-800 dark:bg-[#1a1a1a]">
                    <FilterGroup title="Job Type" options={['Full-time', 'Contract', 'Internship', 'Freelance']} />
                    <FilterGroup title="Location" options={['Remote', 'On-site', 'Hybrid']} />
                    <FilterGroup title="Pay Scale" options={['$50k - $100k', '$100k - $150k', '$150k+', 'Equity Only']} />
                    <FilterGroup title="Benefits" options={['Visa Sponsorship', 'Health Insurance', '401k']} />
                    <FilterGroup title="Date Posted" options={['Past 24 hours', 'Past Week', 'Past Month']} />

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
