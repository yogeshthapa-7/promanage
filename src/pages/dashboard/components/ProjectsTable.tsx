'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { SlidersHorizontal, ArrowRight } from 'lucide-react';
import SearchInput from '@/components/ui/SearchInput';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { AvatarStack } from '@/components/ui/Avatar';
import Card from '@/components/ui/Card';
import ProgressBar from '@/components/ui/ProgressBar';
import type { Project, ProjectStatus, ProjectPriority } from '@/lib/projects-data';

interface ProjectsTableProps {
  projects?: Project[];
  search?: string;
  onSearchChange?: (value: string) => void;
  sortField?: string;
  sortDir?: 'asc' | 'desc';
  onSortChange?: (field: string) => void;
  filterStatus?: ProjectStatus | 'All';
  onFilterChange?: (status: ProjectStatus | 'All') => void;
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
      <td className="px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold"
            style={{ background: 'var(--secondary)', color: 'var(--primary)' }}
          >
            {project.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate max-w-[200px]">{project.name}</p>
            <p className="text-xs text-muted-foreground">{project.category}</p>
          </div>
        </div>
      </td>

      <td className="px-4 py-2.5">
        <Badge variant="status" style={{ background: statusCfg.bg, color: statusCfg.color }}>
          {statusCfg.label}
        </Badge>
      </td>

      <td className="px-4 py-2.5">
        <div className="flex items-center gap-2" style={{ minWidth: '100px' }}>
          <ProgressBar value={project.progress} color={barColor} />
          <span className="text-xs font-semibold tabular-nums text-muted-foreground w-8">{project.progress}%</span>
        </div>
      </td>

      <td className="px-4 py-2.5">
        <span className="text-xs tabular-nums text-muted-foreground">{project.startDateBs}</span>
      </td>

      <td className="px-4 py-2.5">
        <span className="text-xs tabular-nums font-medium" style={{ color: project.status === 'Overdue' ? '#EF4444' : 'var(--muted-foreground)' }}>
          {project.dueDateBs}
        </span>
      </td>

      <td className="px-4 py-2.5">
        <AvatarStack items={project.team.map(m => ({ id: m.id, src: m.avatar, alt: m.name }))} size={24} extra={project.extraTeam} />
      </td>

      <td className="px-4 py-2.5">
        <Badge variant="priority" style={{ background: priorityCfg.bg, color: priorityCfg.color }}>
          {project.priority}
        </Badge>
      </td>
    </tr>
  );
});

export default function ProjectsTable({
  projects: projectsData,
  search = '',
  onSearchChange,
  sortField: externalSortField,
  sortDir: externalSortDir,
  onSortChange,
  filterStatus = 'All',
  onFilterChange,
  loading = false,
}: ProjectsTableProps) {
  const navigate = useNavigate();
  const [internalSortKey, setInternalSortKey] = useState<SortKey | null>(null);
  const [internalSortDir, setInternalSortDir] = useState<'asc' | 'desc' | null>(null);

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
          return next;
        });
        return prev;
      }
      return key;
    });
  }, [controlled, onSortChange]);

  const handleSearchChange = useCallback((v: string) => {
    onSearchChange?.(v);
  }, [onSearchChange]);

  const handleFilterChange = useCallback((status: ProjectStatus | 'All') => {
    onFilterChange?.(status);
  }, [onFilterChange]);

  const dataSource = useMemo(() => {
    return projectsData && projectsData.length > 0 ? projectsData : [];
  }, [projectsData]);

  const filtered = useMemo(() => {
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
  }, [dataSource, search, filterStatus, sortKey, sortDir]);

  const visibleProjects = useMemo(() => filtered.slice(0, 5), [filtered]);

  return (
     <Card>
       <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100/80">
         <h2 className="text-sm font-bold text-foreground">Projects</h2>
        <div className="flex items-center gap-2.5">
          <SearchInput value={search} onChange={handleSearchChange} placeholder="Search projects..." />
          <Button variant="outline" size="sm" icon={<SlidersHorizontal size={14} />} onClick={() => handleFilterChange(filterStatus === 'All' ? 'In Progress' : 'All')}>
            Filter
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[820px]">
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
              ].map((col) => (
                <th
                  key={col.label}
                  className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider select-none whitespace-nowrap"
                  style={{ color: 'var(--muted-foreground)', letterSpacing: '0.04em' }}
                >
                  {col.key ? (
                    <Button type="text" size="small" onClick={() => handleSort(col.key as SortKey)} className="flex items-center gap-1.5 hover:text-primary transition-colors duration-150">
                      {col.label}
                      <SortIcon col={col.key as SortKey} sortKey={sortKey} sortDir={sortDir} />
                    </Button>
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
                <td colSpan={7} className="px-4 py-10 text-center">
                  <p className="text-xs font-medium text-muted-foreground">Loading projects...</p>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center">
                  <p className="text-xs font-medium text-muted-foreground">No projects match your search</p>
                  <p className="text-xs mt-1 text-muted-foreground">Try adjusting your search or filter criteria</p>
                </td>
              </tr>
            ) : (
              visibleProjects.map((project) => (
                <ProjectRow key={project.id} project={project} />
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-end px-4 py-3 border-t border-gray-100/80">
        <Button variant="outline" size="sm" icon={<ArrowRight size={14} />} onClick={() => navigate('/projects')}>
          View All
        </Button>
      </div>
    </Card>
  );
}
