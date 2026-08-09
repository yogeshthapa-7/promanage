'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import SearchInput from '@/components/ui/SearchInput';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Pagination from '@/components/ui/Pagination';
import { AvatarStack } from '@/components/ui/Avatar';
import DropdownMenu from '@/components/ui/DropdownMenu';
import Card from '@/components/ui/Card';
import ProgressBar from '@/components/ui/ProgressBar';
import type { Project, ProjectStatus, ProjectPriority } from '@/lib/projects-data';

interface ProjectsTableProps {
  projects?: Project[];
  total?: number;
  search?: string;
  onSearchChange?: (value: string) => void;
  sortField?: string;
  sortDir?: 'asc' | 'desc';
  onSortChange?: (field: string) => void;
  filterStatus?: ProjectStatus | 'All';
  onFilterChange?: (status: ProjectStatus | 'All') => void;
  onPageChange?: (page: number, pageSize: number) => void;
  loading?: boolean;
}
const statusConfig: Record<ProjectStatus, { label: string; bg: string; color: string }> = {
  'In Progress': { label: 'In Progress', bg: '#EFF6FF', color: '#3B82F6' },
  'Completed': { label: 'Completed', bg: '#ECFDF5', color: '#10B981' },
  'On Hold': { label: 'On Hold', bg: '#FFFBEB', color: '#D97706' },
  'Not Started': { label: 'Not Started', bg: '#F3F4F6', color: '#6B7280' },
  'Overdue': { label: 'Overdue', bg: '#FEF2F2', color: '#EF4444' },
};

const priorityConfig: Record<ProjectPriority, { bg: string; color: string }> = {
  'Urgent': { bg: '#FEE2E2', color: '#EF4444' },
  'High': { bg: '#FFF7ED', color: '#EA580C' },
  'Medium': { bg: '#FFFBEB', color: '#D97706' },
  'Low': { bg: '#F0FDF4', color: '#059669' },
};

const progressBarColor: Record<ProjectStatus, string> = {
  'In Progress': '#3B82F6',
  'Completed': '#10B981',
  'On Hold': '#F59E0B',
  'Not Started': '#D1D5DB',
  'Overdue': '#EF4444',
};

type SortKey = 'name' | 'status' | 'progress' | 'startDate' | 'dueDate' | 'priority';

const PAGE_SIZE_OPTIONS = [5, 10, 20];

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey | null; sortDir: 'asc' | 'desc' | null }) {
  if (sortKey !== col) return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ opacity: 0.3 }}><path d="M12 19V5M5 12l7-7 7 7"/></svg>;
  return sortDir === 'asc'
    ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--primary)' }}><path d="M12 19V5M5 12l7-7 7 7"/></svg>
    : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--primary)' }}><path d="M12 5v14M19 12l-7 7-7-7"/></svg>;
}

const ProjectRow = React.memo(function ProjectRow({ project }: { project: Project }) {
  const statusCfg = statusConfig[project.status];
  const priorityCfg = priorityConfig[project.priority];
  const barColor = progressBarColor[project.status];

  return (
    <tr key={project.id} className="group transition-colors duration-150 row-hover">
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold"
            style={{ background: 'var(--secondary)', color: 'var(--primary)' }}
          >
            {project.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate max-w-[200px]">{project.name}</p>
            <p className="text-base text-muted-foreground">{project.category}</p>
          </div>
        </div>
      </td>

      <td className="px-5 py-3.5">
        <Badge variant="status" style={{ background: statusCfg.bg, color: statusCfg.color }}>
          {statusCfg.label}
        </Badge>
      </td>

      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3" style={{ minWidth: '120px' }}>
          <ProgressBar value={project.progress} color={barColor} />
          <span className="text-sm font-semibold tabular-nums text-muted-foreground w-8">{project.progress}%</span>
        </div>
      </td>

      <td className="px-5 py-3.5">
        <span className="text-sm tabular-nums text-muted-foreground">{project.startDate}</span>
      </td>

      <td className="px-5 py-3.5">
        <span className="text-sm tabular-nums font-medium" style={{ color: project.status === 'Overdue' ? '#EF4444' : 'var(--muted-foreground)' }}>
          {project.dueDate}
        </span>
      </td>

      <td className="px-5 py-3.5">
        <AvatarStack items={project.team.map(m => ({ id: m.id, src: m.avatar, alt: m.name }))} size={28} extra={project.extraTeam} />
      </td>

      <td className="px-5 py-3.5">
        <Badge variant="priority" style={{ background: priorityCfg.bg, color: priorityCfg.color }}>
          {project.priority}
        </Badge>
      </td>

      <td className="px-5 py-3.5">
        <DropdownMenu
          trigger={
            <button className="p-1.5 rounded-lg transition-all duration-150 hover:bg-gray-100 active:scale-95" style={{ color: 'var(--muted-foreground)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
            </button>
          }
          items={[
            { label: 'View Details' },
            { label: 'Edit Project' },
            { label: 'Assign Team' },
            { label: 'Download Report' },
            { label: 'Archive', danger: true },
          ]}
        />
      </td>
    </tr>
  );
});

export default function ProjectsTable({
  projects: projectsData,
  total,
  search = '',
  onSearchChange,
  sortField: externalSortField,
  sortDir: externalSortDir,
  onSortChange,
  filterStatus = 'All',
  onFilterChange,
  onPageChange,
  loading = false,
}: ProjectsTableProps) {
  const [internalSortKey, setInternalSortKey] = useState<SortKey | null>(null);
  const [internalSortDir, setInternalSortDir] = useState<'asc' | 'desc' | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const controlled = typeof externalSortField === 'string' && !!onSortChange;
  const sortKey = controlled ? (externalSortField as SortKey | null) : internalSortKey;
  const sortDir = controlled ? (externalSortDir as 'asc' | 'desc' | null) : internalSortDir;

  const handleSort = useCallback((key: SortKey) => {
    if (controlled) {
      onSortChange(key);
      return;
    }
    setInternalSortKey((prev) => {
      if (prev === key) {
        setInternalSortDir((prevDir) => {
          const next = prevDir === 'asc' ? 'desc' : prevDir === 'desc' ? null : 'asc';
          if (next === null) setCurrentPage(1);
          return next;
        });
        return prev;
      }
      setCurrentPage(1);
      return key;
    });
  }, [controlled, onSortChange]);

  const handleSearchChange = useCallback((v: string) => {
    onSearchChange?.(v);
    setCurrentPage(1);
  }, [onSearchChange]);

  const handleFilterChange = useCallback((status: ProjectStatus | 'All') => {
    onFilterChange?.(status);
    setCurrentPage(1);
  }, [onFilterChange]);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
    onPageChange?.(1, size);
  }, [onPageChange]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    onPageChange?.(page, pageSize);
  }, [pageSize, onPageChange]);

  const useServerPagination = total !== undefined;

  const dataSource = useMemo(() => {
    if (useServerPagination) return [];
    return projectsData && projectsData.length > 0 ? projectsData : [];
  }, [useServerPagination, projectsData]);

  const filtered = useMemo(() => {
    if (useServerPagination) return dataSource;
    let data = [...dataSource];
    const q = search.trim().toLowerCase();
    if (q) {
      data = data.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.status.toLowerCase().includes(q)
      );
    }
    if (filterStatus !== 'All') {
      data = data.filter((p) => p.status === filterStatus);
    }
    if (sortKey && sortDir) {
      data.sort((a, b) => {
        let av: string | number = '';
        let bv: string | number = '';
        if (sortKey === 'name') { av = a.name; bv = b.name; }
        else if (sortKey === 'status') { av = a.status; bv = b.status; }
        else if (sortKey === 'progress') { av = a.progress; bv = b.progress; }
        else if (sortKey === 'startDate') { av = a.startDate; bv = b.startDate; }
        else if (sortKey === 'dueDate') { av = a.dueDate; bv = b.dueDate; }
        else if (sortKey === 'priority') {
          const order: Record<ProjectPriority, number> = { Urgent: 0, High: 1, Medium: 2, Low: 3 };
          av = order[a.priority];
          bv = order[b.priority];
        }
        if (av < bv) return sortDir === 'asc' ? -1 : 1;
        if (av > bv) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return data;
  }, [dataSource, search, filterStatus, sortKey, sortDir, useServerPagination]);

  const paginated = useMemo(() => {
    if (useServerPagination) return filtered;
    return filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [filtered, currentPage, pageSize, useServerPagination]);

  return (
    <Card>
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100/80">
        <h2 className="text-base font-bold text-foreground">Projects</h2>
        <div className="flex items-center gap-2.5">
          <SearchInput value={search} onChange={handleSearchChange} placeholder="Search projects..." />
          <Button variant="outline" size="sm" icon={<SlidersHorizontal size={14} />} onClick={() => handleFilterChange(filterStatus === 'All' ? 'In Progress' : 'All')}>
            Filter
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="border-b border-gray-100/80">
              {[
                { key: 'name', label: 'Project Name' },
                { key: 'status', label: 'Status' },
                { key: 'progress', label: 'Progress' },
                { key: 'startDate', label: 'Start Date' },
                { key: 'dueDate', label: 'Due Date' },
                { key: null, label: 'Team' },
                { key: 'priority', label: 'Priority' },
                { key: null, label: 'Actions' },
              ].map((col) => (
                <th
                  key={col.label}
                  className="px-5 py-3.5 text-left text-sm font-semibold uppercase tracking-wider select-none whitespace-nowrap"
                  style={{ color: 'var(--muted-foreground)', letterSpacing: '0.04em' }}
                >
                  {col.key ? (
                    <button
                      onClick={() => handleSort(col.key as SortKey)}
                      className="flex items-center gap-1.5 hover:text-primary transition-colors duration-150"
                    >
                      {col.label}
                      <SortIcon col={col.key as SortKey} sortKey={sortKey} sortDir={sortDir} />
                    </button>
                  ) : (
                    <span>{col.label}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50/80">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-6 py-16 text-center">
                  <p className="text-sm font-medium text-muted-foreground">Loading projects...</p>
                </td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-16 text-center">
                  <p className="text-sm font-medium text-muted-foreground">No projects match your search</p>
                  <p className="text-sm mt-1 text-muted-foreground">Try adjusting your search or filter criteria</p>
                </td>
              </tr>
            ) : (
              paginated.map((project) => (
                <ProjectRow key={project.id} project={project} />
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        total={total ?? filtered.length}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
      />
    </Card>
  );
}
