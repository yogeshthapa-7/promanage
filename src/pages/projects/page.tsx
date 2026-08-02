'use client';

import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { projects as fallbackProjects, mapApiProjectToProject } from '@/lib/projects-data';
import type { ProjectStatus, Project } from '@/lib/projects-data';
import { getStatCards } from '@/pages/dashboard/components/statCardsData';
import ProjectFormModal from './Create';

interface ApiProject {
  ProjectInfoID: number;
  Description: string;
  Priority: number;
  PriorityName: string;
  ProjectCode: string;
  ProjectName: string;
  ProjectDuration: number;
  StartDate: string;
  ProjectType: number;
  ProjectTypeName: string;
  TotalBudget: number;
  WorkStatusID: number;
  ClientInfoID: number;
  ProjectHeadEmpID: number;
  ExpenseInfoID: number;
  DepartmentID: number;
  WorkStatusName: string;
  WorkStatusColor: string;
  ProjectHeadEmpName: string;
  ProjectHeadEmpPhoto: string;
  BudgetSourceID: number;
  LastDateOfSubmission: string | null;
  Suchikrit_ServiceGroupTypeIDs: string;
  Suchikrit_ServiceTypeIDs: string;
  TargetVendorIDs: string;
  ProjectOpenDate: string;
  Attachments: string;
  TOR: string;
  PolicyProgramIDs: string;
  BudgetInfoIDs: string;
  BankGuranteeExpiryDate: string;
  BankGuranteeIssueDate: string;
  Status: number;
  CanEdit: boolean;
  CanDelete: boolean;
  CanChangeStatus: boolean;
}

type SortField = 'name' | 'status' | 'priority' | 'progress' | 'dueDate';
type SortDir = 'asc' | 'desc';


const API_BASE = (import.meta.env.VITE_BASE_API_URL || '').replace(/\/$/, '');
const API_URL = `${API_BASE}/ProjectInfo/ServerSearch`;

const serverSearchBody = {
  model: {
    draw: 1,
    start: 0,
    length: 1000,
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

async function fetchProjects(): Promise<Project[]> {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(serverSearchBody),
    });
    if (!res.ok) throw new Error(`Failed to fetch projects: ${res.statusText}`);
    const json = await res.json();
    const rows = Array.isArray(json?.data) ? (json.data as ApiProject[]) : [];
    const mapped = rows.map(mapApiProjectToProject);
    return mapped.length > 0 ? mapped : fallbackProjects;
  } catch {
    return fallbackProjects;
  }
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
  const [toast, setToast] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ApiProject | null>(null);
  const pageSize = 9;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchProjects()
      .then((data) => {
        if (!cancelled) {
          setProjects(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setProjects(fallbackProjects);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

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

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const openCreateModal = () => {
    setEditingProject(null);
    setIsModalOpen(true);
  };

  const openEditModal = async (project: Project) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
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

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingProject(null);
  };

  const handleModalSuccess = () => {
    fetchProjects().then(setProjects);
  };

  const handleViewProject = (project: Project) => {
    navigate(`/projects/${project.id}`);
  };

  const filteredProjects = useMemo(() => {
    let result = projects;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          (p.title || p.name || '').toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.status.toLowerCase().includes(q) ||
          p.client.toLowerCase().includes(q)
      );
    }

    if (filterStatus !== 'All') {
      result = result.filter((p) => p.status === filterStatus);
    }

    result = [...result].sort((a, b) => {
      let aVal: string | number = a[sortField] ?? a.title ?? '';
      let bVal: string | number = b[sortField] ?? b.title ?? '';
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [searchQuery, filterStatus, sortField, sortDir, projects]);

  const totalPages = Math.ceil(filteredProjects.length / pageSize);
  const paginatedProjects = filteredProjects.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

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
      ...filteredProjects.map((p) => [
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
    showToast('Export completed');
  };

  return (
    <div className="fade-in space-y-6 max-w-screen-2xl mx-auto w-full pb-10">
      {/* 1. Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Projects</h1>
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
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search projects..."
              className="bg-transparent outline-none w-full text-foreground placeholder:text-muted-foreground text-xs"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Button */}
          <div className="relative">
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white/70 border border-border text-xs font-semibold text-foreground hover:bg-white transition-all shadow-xs cursor-pointer"
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
              <div className="absolute right-0 top-full mt-2 bg-white border border-border rounded-2xl py-2 shadow-lg shadow-black/5 min-w-[160px] z-50">
                {statusOptions.map((status) => (
                  <button
                    key={status}
                    onClick={() => handleFilter(status)}
                    className={`w-full text-left px-4 py-2 text-xs transition-colors cursor-pointer ${
                      filterStatus === status
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-foreground hover:bg-gray-50'
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
              onClick={() => setSortOpen(!sortOpen)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white/70 border border-border text-xs font-semibold text-foreground hover:bg-white transition-all shadow-xs cursor-pointer"
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
              <div className="absolute right-0 top-full mt-2 bg-white border border-border rounded-2xl py-2 shadow-lg shadow-black/5 min-w-[160px] z-50">
                {sortOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleSort(opt.value)}
                    className={`w-full text-left px-4 py-2 text-xs transition-colors cursor-pointer flex items-center justify-between ${
                      sortField === opt.value
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-foreground hover:bg-gray-50'
                    }`}
                  >
                    {opt.label}
                    {sortField === opt.value && (
                      <span className="text-muted-foreground text-[10px] uppercase">
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
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white/70 border border-border text-xs font-semibold text-foreground hover:bg-white transition-all shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-muted-foreground" />
            Export
          </button>

          {/* New Project Button */}
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-gradient-to-r from-[#7C3AED] to-[#6366F1] text-white text-xs font-semibold shadow-md hover:shadow-purple-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>
        </div>
      </div>
      <hr className="border-slate-200 my-6" />

      {loading ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-muted-foreground">Loading projects...</p>
        </Card>
      ) : (
        <>
          {/* 2. Top Metric Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {getStatCards(projects).map((stat) => (
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
          <div className="space-y-5">
            {/* Projects Title */}
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-foreground">Projects</h2>
              <span className="text-xs text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full">
                {filteredProjects.length} total
              </span>
            </div>

            {viewMode === 'grid' ? (
              /* Projects Cards Grid */
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {paginatedProjects.map((project) => {
                  const Icon = project.icon;
                  const projectTitle = project.title || project.name || 'Untitled Project';

                  return (
                    <Card
                      key={project.id}
                      hover
                      className="flex flex-col min-h-[320px] cursor-pointer overflow-hidden"
                      onClick={() => handleViewProject(project)}
                    >
                  {/* Top content grows to fill available space */}
                  <div className="flex flex-col gap-4 flex-1">
                    {/* Card Header */}
                    <div className="flex items-start gap-4">
                      <div className={`p-3.5 rounded-2xl ${project.iconBg} shrink-0`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-foreground truncate" title={projectTitle}>
                            {projectTitle}
                          </h3>
                          {project.starred && (
                            <Star className="w-4 h-4 fill-amber-400 text-amber-400 shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-1">
                          {project.category}
                        </p>
                      </div>
                    </div>

                    {/* Status & Priority */}
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
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
                      <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full ${project.progressColor} rounded-full transition-all duration-500`}
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Key dates */}
                    <div className="flex items-center justify-between gap-4 rounded-xl bg-muted/30 px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Start Date
                        </p>
                        <p className="text-xs font-medium text-foreground tabular-nums truncate">
                          {project.startDate}
                        </p>
                      </div>
                      <div className="min-w-0 text-right">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Due Date
                        </p>
                        <p className="text-xs font-medium text-foreground tabular-nums truncate">
                          {project.dueDate}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons — pinned to bottom */}
                  <div className="flex items-center gap-3 pt-4 mt-4 border-t border-border/60">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewProject(project);
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-all cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(project);
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white border border-border text-xs font-semibold text-foreground hover:bg-white transition-all cursor-pointer"
                    >
                      <Pencil className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-rose-50 text-rose-600 text-xs font-semibold hover:bg-rose-100 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
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
                {paginatedProjects.map((project) => {
                  const Icon = project.icon;
                  const projectTitle = project.title || project.name || 'Untitled Project';

                  return (
                    <div
                      key={project.id}
                      onClick={() => handleViewProject(project)}
                      className="flex items-center gap-4 px-5 py-4 rounded-2xl border border-border bg-white/70 hover:bg-white hover:border-primary/20 transition-all cursor-pointer"
                    >
                  <div className={`p-2.5 rounded-2xl ${project.iconBg} shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-bold text-foreground truncate">{projectTitle}</h3>
                      {project.starred && (
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {project.category} · {project.client}
                    </p>
                  </div>

                  <span
                    className={`hidden sm:inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold ${
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

                  <span className="hidden md:inline-block text-xs text-muted-foreground w-24 truncate">
                    {project.priority}
                  </span>

                  <div className="hidden lg:flex items-center gap-3 w-48">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${project.progressColor} rounded-full transition-all duration-500`}
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-foreground w-8 text-right">
                      {project.progress}%
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewProject(project);
                      }}
                      className="p-2 rounded-xl hover:bg-primary/10 text-primary transition-all cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(project);
                      }}
                      className="p-2 rounded-xl hover:bg-primary/10 text-primary transition-all cursor-pointer"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      className="p-2 rounded-xl hover:bg-rose-50 text-rose-600 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                    </div>
                  );
                })}
              </div>
            )}

            {totalPages > 1 && (
              <Pagination
                total={filteredProjects.length}
                currentPage={currentPage}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
              />
            )}
          </div>
        </>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-foreground text-white text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-black/20 z-50 fade-in">
          {toast}
        </div>
      )}

      <ProjectFormModal
        open={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        editingProject={editingProject}
      />
    </div>
  );
}
