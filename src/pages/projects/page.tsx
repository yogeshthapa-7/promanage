'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, message } from 'antd';
import {
  Search,
  Filter,
  LayoutGrid,
  List,
  Download,
  Plus,
  Star,
  ArrowUpDown,
  Eye,
  Pencil,
  Trash2,
  X,
  ChevronDown,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import StatCard from '@/components/ui/StatCard';
import Pagination from '@/components/ui/Pagination';
import { CardGridSkeleton } from '@/components/ui/Loaders';
import { apiCall } from '@/lib/api';
import { projects as fallbackProjects, mapApiProjectToProject } from '@/lib/projects-data';
import type { ProjectStatus, Project, ApiProject } from '@/lib/projects-data';
import { getStatCards } from '@/pages/dashboard/components/statCardsData';
import { useDashboardStats } from '@/pages/dashboard/components/useDashboardStats';
import ProjectFormModal from './Create';

type SortField = 'name' | 'status' | 'priority' | 'progress' | 'dueDate';
type SortDir = 'asc' | 'desc';


const API_BASE = (import.meta.env.VITE_BASE_API_URL || '').replace(/\/$/, '');
const API_URL = `${API_BASE}/ProjectInfo/ServerSearch`;
const PROJECTS_CACHE_KEY_PREFIX = 'promanage:projects:list:';
const PROJECTS_CACHE_TTL_MS = 5 * 60 * 1000;

type ProjectsCacheEntry = {
  data: ApiProject[];
  total: number;
  cachedAt: number;
};

function getProjectsCacheKey(start: number, length: number, searchQuery: string): string {
  return `${PROJECTS_CACHE_KEY_PREFIX}${start}:${length}:${searchQuery.trim().toLowerCase()}`;
}

function readProjectsCache(cacheKey: string): ProjectsCacheEntry | null {
  try {
    const raw = sessionStorage.getItem(cacheKey);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as ProjectsCacheEntry;
    if (!parsed || !Array.isArray(parsed.data) || typeof parsed.total !== 'number' || typeof parsed.cachedAt !== 'number') {
      return null;
    }

    if (Date.now() - parsed.cachedAt > PROJECTS_CACHE_TTL_MS) {
      sessionStorage.removeItem(cacheKey);
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function writeProjectsCache(cacheKey: string, payload: { data: ApiProject[]; total: number }): void {
  try {
    sessionStorage.setItem(
      cacheKey,
      JSON.stringify({
        ...payload,
        cachedAt: Date.now(),
      } satisfies ProjectsCacheEntry)
    );
  } catch {
    // Ignore storage failures and keep the live data path working.
  }
}

const serverSearchBody = {
  model: {
    draw: 1,
    start: 0,
    length: 20,
    columns: [
      { data: 'ProjectInfoID', name: 'ProjectInfoID', searchable: true, orderable: true, search: { value: '', regex: '' } },
      { data: 'ProjectName', name: 'ProjectName', searchable: true, orderable: true, search: { value: '', regex: '' } },
      { data: 'ProjectCode', name: 'ProjectCode', searchable: true, orderable: true, search: { value: '', regex: '' } },
    ],
    search: { value: '', regex: '' },
    order: [{ column: 0, dir: 'desc' }],
  },
  param: {
    ProjectInfoID: 0,
  },
};

async function fetchProjects(
  start: number,
  length: number,
  searchQuery: string = '',
  signal?: AbortSignal
): Promise<{ data: Project[]; rawData: ApiProject[]; total: number }> {
  const cleanSearch = (searchQuery || '').trim();

  const body = {
    model: {
      draw: 1,
      start: Math.max(0, start),
      length: Math.max(1, length),
      // Keep column search value empty to prevent server SQL string-builder crashes
      columns: [
        { data: 'ProjectInfoID', name: 'ProjectInfoID', searchable: true, orderable: true, search: { value: '', regex: '' } },
        { data: 'ProjectName', name: 'ProjectName', searchable: true, orderable: true, search: { value: '', regex: '' } },
        { data: 'ProjectCode', name: 'ProjectCode', searchable: true, orderable: true, search: { value: '', regex: '' } },
      ],
      search: { value: cleanSearch, regex: '' },
      order: [{ column: 0, dir: 'desc' }],
    },
    param: {
      ProjectInfoID: 0,
    },
  };

  const res = await apiCall(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  }, 60000);

  if (!res.ok) {
    throw new Error(`Server responded with ${res.status}`);
  }

  const json = await res.json();
  const rows = Array.isArray(json?.data) ? (json.data as ApiProject[]) : [];
  const mapped = rows.map(mapApiProjectToProject);
  const total = json?.recordsTotal ?? json?.recordsFiltered ?? mapped.length;

  return { data: mapped, rawData: rows, total };
}


export default function ProjectsPage() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<ProjectStatus | 'All'>('All');
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [sortOpen, setSortOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);
  const { users, employees, departments, organizations, tasks } = useDashboardStats(projects.length);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ApiProject | null>(null);
  const pageSize = 9;
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const start = (currentPage - 1) * pageSize;
    const cacheKey = getProjectsCacheKey(start, pageSize, searchQuery);
    const cached = readProjectsCache(cacheKey);

    if (cached) {
      setProjects(cached.data.map(mapApiProjectToProject));
      setTotalRecords(cached.total);
      setLoading(false);
    } else {
      setLoading(true);
    }

    fetchProjects(start, pageSize, searchQuery, controller.signal)
      .then((result) => {
        if (!cancelled) {
          setProjects(result.data);
          setTotalRecords(result.total);
          setLoading(false);
          writeProjectsCache(cacheKey, { data: result.rawData, total: result.total });
        }
      })
      .catch((err) => {
        if (err instanceof Error && (err.name === 'AbortError' || err.name === 'TimeoutError')) return;
        if (!cancelled) {
          if (!cached) {
            setProjects(fallbackProjects);
            setTotalRecords(fallbackProjects.length);
          }
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [currentPage, pageSize, searchQuery]);

  const statusOptions: (ProjectStatus | 'All')[] = [
    'All',
    'In Progress',
    'Completed',
    'On Hold',
    'Not Started',
    'Overdue',
  ];

  const sortOptions: { label: string; value: SortField }[] = [
    { label: 'Name', value: 'name' },
    { label: 'Status', value: 'status' },
    { label: 'Priority', value: 'priority' },
    { label: 'Progress', value: 'progress' },
    { label: 'Due Date', value: 'dueDate' },
  ];

  const openCreateModal = () => {
    setEditingProject(null);
    setIsModalOpen(true);
  };

  const openEditModal = async (project: Project) => {
    const res = await apiCall(`${API_URL}`, {
      method: 'POST',
      body: JSON.stringify({
        ...serverSearchBody,
        param: { ProjectInfoID: Number(project.id) },
      }),
    });
    if (!res.ok) return;
    const json = await res.json();
    const raw = (json.data ?? []).find((p: ApiProject) => String(p.ProjectInfoID) === project.id);
    if (raw) {
      setEditingProject(raw);
      setIsModalOpen(true);
    }
  };

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setEditingProject(null);
  }, []);

  const handleModalSuccess = useCallback(() => {
    const start = (currentPage - 1) * pageSize;
    const cacheKey = getProjectsCacheKey(start, pageSize, searchQuery);
    fetchProjects(start, pageSize, searchQuery)
      .then((result) => {
        setProjects(result.data);
        setTotalRecords(result.total);
        writeProjectsCache(cacheKey, { data: result.rawData, total: result.total });
      })
      .catch(() => {
        const cached = readProjectsCache(cacheKey);
        if (cached) {
          setProjects(cached.data.map(mapApiProjectToProject));
          setTotalRecords(cached.total);
          return;
        }
        setProjects(fallbackProjects);
        setTotalRecords(fallbackProjects.length);
      });
  }, [currentPage, pageSize, searchQuery]);

  const handleViewProject = (project: Project) => {
    navigate(`/projects/${project.id}`);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
    setSortOpen(false);
    setCurrentPage(1);
  };

  const handleFilter = (status: ProjectStatus | 'All') => {
    setFilterStatus(status);
    setFilterOpen(false);
    setCurrentPage(1);
  };

  const handleExport = () => {
    const csv = [
      ['Name', 'Category', 'Status', 'Priority', 'Progress'],
      ...projects.map((p) => [
        p.title || p.name,
        p.category,
        p.status,
        p.priority,
        `${p.progress}%`,
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'projects.csv';
    a.click();
    URL.revokeObjectURL(url);
    message.success('Export completed');
  };

    const handleDeleteClick = (project: Project) => {
    Modal.confirm({
      title: 'Delete Project',
      content: `Are you sure you want to delete "${project.title || project.name}"?`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          const res = await apiCall(`${API_BASE}/DeleteProjectInfo?id=${project.id}`, {
            method: 'GET',
          });
          if (!res.ok) throw new Error(`Failed to delete: ${res.statusText}`);
          message.success('Project deleted successfully');
          const start = (currentPage - 1) * pageSize;
          const cacheKey = getProjectsCacheKey(start, pageSize, searchQuery);
          fetchProjects(start, pageSize, searchQuery)
            .then((result) => {
              setProjects(result.data);
              setTotalRecords(result.total);
              writeProjectsCache(cacheKey, { data: result.rawData, total: result.total });
            })
            .catch(() => {
              const cached = readProjectsCache(cacheKey);
              if (cached) {
                setProjects(cached.data.map(mapApiProjectToProject));
                setTotalRecords(cached.total);
                return;
              }
              setProjects(fallbackProjects);
              setTotalRecords(fallbackProjects.length);
            });
        } catch (err) {
          message.error(err instanceof Error ? err.message : 'Delete failed');
        }
      },
    });
  };

  const totalPages = Math.ceil(totalRecords / pageSize);
  const statsPayload = {
    projects: projects.length,
    users,
    employees,
    departments,
    organizations,
    tasks,
  };

  return (
    <div className="fade-in space-y-4 max-w-screen-2xl mx-auto w-full pb-8">
      {/* 1. Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Projects</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage, organize and monitor all your projects in one place.
          </p>
        </div>

        {/* Header Action Tools */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Search */}
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/70 border border-border focus-within:bg-white focus-within:border-primary/30 transition-all text-sm w-48 lg:w-56 shadow-xs">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                const value = e.target.value;
                setSearchQuery(value);
                if (debounceTimerRef.current) {
                  clearTimeout(debounceTimerRef.current);
                }
                debounceTimerRef.current = setTimeout(() => {
                  setCurrentPage(1);
                }, 400);
              }}
              placeholder="Search projects..."
              className="bg-transparent outline-none w-full text-foreground placeholder:text-muted-foreground text-sm"
            />
            {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    if (debounceTimerRef.current) {
                      clearTimeout(debounceTimerRef.current);
                    }
                    setCurrentPage(1);
                  }}
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* New Project Button */}
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-gradient-to-r from-[#7C3AED] to-[#6366F1] text-white text-sm font-semibold shadow-md hover:shadow-purple-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>

          {/* Filter Button */}
          <div className="relative">
            <button
              onClick={() => {
                setFilterOpen((prev) => !prev);
                setSortOpen(false);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white/70 border border-border text-sm font-semibold text-foreground hover:bg-white transition-all shadow-xs cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5 text-muted-foreground" />
              Filter
              {filterStatus !== 'All' && (
                <span className="ml-1 w-1.5 h-1.5 rounded-full bg-primary" />
              )}
              <ChevronDown
                className={`w-3 h-3 text-muted-foreground transition-transform duration-200 ${
                  filterOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
            {filterOpen && (
              <div className="absolute right-0 top-full mt-2 bg-slate-50 border border-slate-200 rounded-xl py-1 shadow-lg shadow-black/5 min-w-[120px] z-50">
                {statusOptions.map((status) => (
                  <button
                    key={status}
                    onClick={() => handleFilter(status)}
                    className={`w-full text-left px-3 py-2 text-sm font-medium transition-colors cursor-pointer hover:bg-white hover:shadow-sm ${
                      filterStatus === status
                        ? 'bg-white/80 text-primary font-semibold'
                        : 'text-foreground'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sort Button */}
          <div className="relative">
            <button
              onClick={() => {
                setSortOpen((prev) => !prev);
                setFilterOpen(false);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white/70 border border-border text-sm font-semibold text-foreground hover:bg-white transition-all shadow-xs cursor-pointer"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
              Sort
              <ChevronDown
                className={`w-3 h-3 text-muted-foreground transition-transform duration-200 ${
                  sortOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
            {sortOpen && (
              <div className="absolute right-0 top-full mt-2 bg-slate-50 border border-slate-200 rounded-xl py-1 shadow-lg shadow-black/5 min-w-[120px] z-50">
                {sortOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleSort(opt.value)}
                    className={`w-full text-left px-3 py-2 text-sm font-medium transition-colors cursor-pointer flex items-center justify-between hover:bg-white hover:shadow-sm ${
                      sortField === opt.value
                        ? 'bg-white/80 text-primary font-semibold'
                        : 'text-foreground'
                    }`}
                  >
                    {opt.label}
                    {sortField === opt.value && (
                      <span className="text-muted-foreground text-sm uppercase">
                        {sortDir === 'asc' ? 'A→Z' : 'Z→A'}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* View Toggle */}
          <div className="flex items-center bg-white/70 border border-border rounded-2xl p-0.5 shadow-xs">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white/70 border border-border text-sm font-semibold text-foreground hover:bg-white transition-all shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-muted-foreground" />
            Export
          </button>
         </div>
      </div>
      <hr className="border-slate-200 my-4" />

      {loading ? (
        <CardGridSkeleton count={9} columns="grid-cols-1 md:grid-cols-2 xl:grid-cols-3" />
      ) : (
        <>
          {/* 2. Top Metric Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {getStatCards(statsPayload).map((stat) => (
              <StatCard
                key={stat.id}
                title={stat.title}
                value={stat.value}
                trend={stat.trend}
                trendUp={stat.trendUp}
                iconBg={stat.iconBg}
                iconColor={stat.iconColor}
                iconType={stat.iconType}
                sparklineData={stat.sparklineData}
                sparklineColor={stat.sparklineColor}
              />
            ))}
          </div>

          {/* 3. Main Content Area */}
          <div className="space-y-4">
            {/* Projects Title */}
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-foreground">Projects</h2>
              <span className="text-base text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full">
                {projects.length} total
              </span>
            </div>

            {viewMode === 'grid' ? (
              /* Projects Cards Grid */
               <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {projects.map((project) => {
                  const Icon = project.icon;
                  const projectTitle = project.title || project.name || 'Untitled Project';

                  return (
                     <Card
                       key={project.id}
                       hover
                       className="flex flex-col min-h-[280px] cursor-pointer overflow-hidden"
                       onClick={() => handleViewProject(project)}
                     >
                   {/* Top content grows to fill available space */}
                   <div className="flex flex-col gap-3 flex-1">
                    {/* Card Header */}
                    <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${project.iconBg} shrink-0`}>
                      <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-foreground truncate" title={projectTitle}>
                            {projectTitle}
                          </h3>
                          {project.starred && (
                            <Star className="w-4 h-4 fill-amber-400 text-amber-400 shrink-0" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status & Priority */}
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                          project.status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-700'
                            : project.status === 'In Progress'
                            ? 'bg-blue-100 text-blue-700'
                            : project.status === 'Overdue'
                            ? 'bg-rose-100 text-rose-700'
                            : project.status === 'On Hold'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {project.status}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {project.priority} priority
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground font-medium">Progress</span>
                        <span className="font-bold text-foreground">{project.progress}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full ${project.progressColor} rounded-full transition-all duration-500`}
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Key dates */}
                    <div className="flex items-center justify-between gap-4 rounded-lg bg-muted/30 px-2.5 py-1.5">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                          Start Date
                        </p>
                        <p className="text-sm font-medium text-foreground tabular-nums truncate">
                          {project.startDate}
                        </p>
                      </div>
                      <div className="min-w-0 text-right">
                        <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                          Due Date
                        </p>
                        <p className="text-sm font-medium text-foreground tabular-nums truncate">
                          {project.dueDate}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons — pinned to bottom */}
                  <div className="flex items-center gap-2 pt-3 mt-3 border-t border-border/60">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewProject(project);
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-all cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(project);
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-border text-xs font-semibold text-foreground hover:bg-white transition-all cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(project)
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-rose-50 text-rose-600 text-xs font-semibold hover:bg-rose-100 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              /* List View */
              <div className="space-y-2">
                {projects.map((project) => {
                  const Icon = project.icon;
                  const projectTitle = project.title || project.name || 'Untitled Project';

                  return (
                    <div
                      key={project.id}
                      onClick={() => handleViewProject(project)}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-border bg-white/70 hover:bg-white hover:border-primary/20 transition-all cursor-pointer"
                    >
                  <div className={`p-2 rounded-xl ${project.iconBg} shrink-0`}>
                    <Icon className="w-4 h-4" />
                  </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-bold text-foreground truncate">{projectTitle}</h3>
                        {project.starred && (
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                        )}
                      </div>
                    </div>

                  <span
                    className={`hidden sm:inline-block px-2 py-0.5 rounded-md text-xs font-semibold ${
                      project.status === 'Completed'
                        ? 'bg-emerald-100 text-emerald-700'
                        : project.status === 'In Progress'
                        ? 'bg-blue-100 text-blue-700'
                        : project.status === 'Overdue'
                        ? 'bg-rose-100 text-rose-700'
                        : project.status === 'On Hold'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {project.status}
                  </span>

                  <span className="hidden md:inline-block text-sm text-muted-foreground w-24 truncate">
                    {project.priority}
                  </span>

                  <div className="hidden lg:flex items-center gap-3 w-48">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${project.progressColor} rounded-full transition-all duration-500`}
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-foreground w-8 text-right">
                      {project.progress}%
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewProject(project);
                      }}
                      className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-all cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(project);
                      }}
                      className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-all cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(project)
                      }}
                      className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                    </div>
                  );
                })}
              </div>
            )}

            {totalPages > 1 && (
              <Pagination
                total={totalRecords}
                currentPage={currentPage}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
              />
            )}
          </div>
        </>
      )}

      {/* Toast Notification */}

      <ProjectFormModal
        open={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        editingProject={editingProject}
      />
    </div>
  );
}
