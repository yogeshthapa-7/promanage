'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, Filter, X, ChevronDown, ArrowUpDown } from 'lucide-react';
import type { ProjectStatus } from '@/lib/projects-data';

interface TopbarProps {
  pageTitle?: string;
  pageSubtitle?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  showFilters?: boolean;
  filterStatus?: ProjectStatus | 'All';
  onFilterChange?: (status: ProjectStatus | 'All') => void;
  sortField?: string;
  sortDir?: 'asc' | 'desc';
  onSortChange?: (field: string) => void;
}

const SORT_OPTIONS = [
  { label: 'Name', value: 'name' },
  { label: 'Status', value: 'status' },
  { label: 'Progress', value: 'progress' },
];

const FILTER_OPTIONS: Array<{ label: string; value: ProjectStatus | 'All' }> = [
  { label: 'All Status', value: 'All' },
  { label: 'In Progress', value: 'In Progress' },
  { label: 'Completed', value: 'Completed' },
  { label: 'Overdue', value: 'Overdue' },
  { label: 'On Hold', value: 'On Hold' },
  { label: 'Not Started', value: 'Not Started' },
];

export default function Topbar({
  pageTitle = 'Dashboard',
  pageSubtitle = 'Welcome back To Project Management Dashboard! 👋',
  searchValue = '',
  onSearchChange,
  showFilters = false,
  filterStatus = 'All',
  onFilterChange,
  sortField = 'name',
  sortDir = 'asc',
  onSortChange,
}: TopbarProps) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filterRef.current && filterRef.current.contains(e.target as Node)) return;
      if (sortRef.current && sortRef.current.contains(e.target as Node)) return;
      setFilterOpen(false);
      setSortOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchClear = () => {
    onSearchChange?.('');
  };

  return (
    <header className="flex flex-col gap-3 px-8 flex-shrink-0" style={{ height: 'auto', minHeight: '88px', background: 'transparent', borderBottom: 'none' }}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">{pageTitle}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{pageSubtitle}</p>
        </div>

        {showFilters && (
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/70 border border-border focus-within:bg-white focus-within:border-primary/30 transition-all text-sm w-48 lg:w-56 shadow-xs">
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchValue}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="bg-transparent outline-none w-full text-foreground placeholder:text-muted-foreground text-xs"
              />
              {searchValue && (
                <button onClick={handleSearchClear} className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="relative" ref={filterRef}>
              <button
                onClick={() => setFilterOpen((v) => !v)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border text-xs font-semibold transition-all shadow-xs cursor-pointer ${
                  filterOpen
                    ? 'bg-primary/10 border-primary/30 text-primary'
                    : 'bg-white/70 border-border text-foreground hover:bg-white'
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                Filter
                {filterStatus !== 'All' && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-primary" />}
                <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform duration-200 ${filterOpen ? 'rotate-180' : ''}`} />
              </button>
              {filterOpen && (
                <div className="absolute right-0 top-full mt-2 bg-white border border-border rounded-2xl py-2 shadow-lg shadow-black/5 min-w-[160px] z-50">
                  {FILTER_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { onFilterChange?.(opt.value); setFilterOpen(false); }}
                      className={`w-full text-left px-4 py-2 text-xs transition-colors cursor-pointer ${
                        filterStatus === opt.value ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-gray-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative" ref={sortRef}>
              <button
                onClick={() => setSortOpen((v) => !v)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border text-xs font-semibold transition-all shadow-xs cursor-pointer ${
                  sortOpen
                    ? 'bg-primary/10 border-primary/30 text-primary'
                    : 'bg-white/70 border-border text-foreground hover:bg-white'
                }`}
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                Sort
                <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform duration-200 ${sortOpen ? 'rotate-180' : ''}`} />
              </button>
              {sortOpen && (
                <div className="absolute right-0 top-full mt-2 bg-white border border-border rounded-2xl py-2 shadow-lg shadow-black/5 min-w-[160px] z-50">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { onSortChange?.(opt.value); setSortOpen(false); }}
                      className={`w-full text-left px-4 py-2 text-xs transition-colors cursor-pointer flex items-center justify-between ${
                        sortField === opt.value ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-gray-50'
                      }`}
                    >
                      {opt.label}
                      {sortField === opt.value && <span className="text-[10px] text-muted-foreground uppercase">{sortDir === 'asc' ? 'A→Z' : 'Z→A'}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
