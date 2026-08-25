'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, message } from 'antd';
import {
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
  ChevronDown,
  FolderKanban,
  ListChecks,
  Building2,
  Briefcase,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Pagination from '@/components/ui/Pagination';
import { CardGridSkeleton } from '@/components/ui/Loaders';
import SearchInput from '@/components/ui/SearchInput';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import ProgressBar from '@/components/ui/ProgressBar';
import DropdownMenu from '@/components/ui/DropdownMenu';
import { apiCall } from '@/lib/api';
import { mapApiProjectToProject } from '@/lib/projects-data';
import type { ProjectStatus, Project, ApiProject } from '@/lib/projects-data';
import { fetchProjectCount, fetchTaskCount, fetchOrganizationCount, fetchDepartmentCount } from '@/lib/stats-data';
import ProjectFormModal from './Create';
import { usePaginatedList, type PaginatedListParams } from '@/hooks/usePaginatedList';

type SortField = 'name' | 'status' | 'priority' | 'progress' | 'dueDate';

const API_BASE = (import.meta.env.VITE_BASE_API_URL || '').replace(/\/$/, '');
const API_URL = `${API_BASE}/ProjectInfo/ServerSearch`;

async function fetchProjectsPage(
  params: PaginatedListParams
): Promise<{ items: Project[]; total: number }> {
  const { length, signal } = params;
  const searchQuery = (params.search as string) || '';
  const filterStatus = (params.status as ProjectStatus | 'All') || 'All';
  const sortField = (params.sort as SortField) || 'name';
  const sortDirection = (params.sortDirection as 'asc' | 'desc') || 'asc';

  const needsAllData = filterStatus !== 'All' || sortField !== 'name' || sortDirection !== 'asc';

  const body = {
    model: {
      draw: 1,
      start: 0,
      length: needsAllData ? 1000 : Math.max(1, length as number),
      columns: [
        { data: 'ProjectInfoID', name: 'ProjectInfoID', searchable: true, orderable: true, search: { value: '', regex: '' } },
        { data: 'ProjectName', name: 'ProjectName', searchable: true, orderable: true, search: { value: '', regex: '' } },
        { data: 'ProjectCode', name: 'ProjectCode', searchable: true, orderable: true, search: { value: '', regex: '' } },
      ],
      search: { value: searchQuery.trim(), regex: '' },
      order: [{ column: sortField === 'name' ? 1 : 0, dir: sortDirection }],
    },
    param: { ProjectInfoID: 0 },
  };

  const res = await apiCall(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  }, 60000);

  if (!res.ok) throw new Error(`Server responded with ${res.status}`);

  const json = await res.json();
  const rows = Array.isArray(json?.data) ? (json.data as ApiProject[]) : [];
  const mapped = rows.map(mapApiProjectToProject);
  const total = json?.recordsTotal ?? json?.recordsFiltered ?? mapped.length;

  return { items: mapped, total };
}

export default function ProjectsPage() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<ProjectStatus | 'All'>('All');
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ApiProject | null>(null);
  const [stats, setStats] = useState({ projects: 0, tasks: 0, organizations: 0, departments: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const pageSize = 9;
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    data: projects,
    loading,
    currentPage,
    setCurrentPage,
    refetch,
   } = usePaginatedList<Project>({
    fetcher: fetchProjectsPage,
    initialPageSize: pageSize,
    extraDeps: [searchQuery, filterStatus, sortField, sortDirection],
    extraParams: {
      search: searchQuery,
      status: filterStatus,
      sort: sortField,
      sortDirection: sortDirection,
    },
  });

  const displayProjects = useMemo(() => {
    const priorityOrder: Record<string, number> = {
      Urgent: 0,
      High: 1,
      Medium: 2,
      Low: 3,
    };

    let result = [...projects];

    if (filterStatus !== 'All') {
      result = result.filter(p => p.status === filterStatus);
    }

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'name':
          cmp = (a.title || a.name).localeCompare(b.title || b.name);
          break;
        case 'status':
          cmp = a.status.localeCompare(b.status);
          break;
        case 'priority':
          cmp = (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99);
          break;
        case 'progress':
          cmp = a.progress - b.progress;
          break;
        case 'dueDate':
          cmp = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          break;
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [projects, filterStatus, sortField, sortDirection]);

  const paginatedProjects = displayProjects.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    setStatsLoading(true);
    (async () => {
      try {
        const results = await Promise.allSettled([
          fetchProjectCount(),
          fetchTaskCount(),
          fetchOrganizationCount(),
          fetchDepartmentCount(),
        ]);
        if (cancelled) return;
        setStats({
          projects: results[0].status === 'fulfilled' ? results[0].value : 0,
          tasks: results[1].status === 'fulfilled' ? results[1].value : 0,
          organizations: results[2].status === 'fulfilled' ? results[2].value : 0,
          departments: results[3].status === 'fulfilled' ? results[3].value : 0,
        });
        results.forEach((result, idx) => {
          if (result.status === 'rejected') {
            console.error(`Stats fetch ${idx} failed:`, result.reason);
          }
        });
      } catch (err) {
        console.error('Stats fetch error:', err);
      } finally {
        if (!cancelled) {
          setStatsLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  const statusOptions: (ProjectStatus | 'All')[] = [
    'All', 'In Progress', 'Completed', 'On Hold', 'Not Started', 'Overdue',
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
    const body = {
      model: {
        draw: 1,
        start: 0,
        length: 1,
        columns: [
          { data: 'ProjectInfoID', name: 'ProjectInfoID', searchable: true, orderable: true, search: { value: '', regex: '' } },
          { data: 'ProjectName', name: 'ProjectName', searchable: true, orderable: true, search: { value: '', regex: '' } },
          { data: 'ProjectCode', name: 'ProjectCode', searchable: true, orderable: true, search: { value: '', regex: '' } },
        ],
        search: { value: '', regex: '' },
        order: [{ column: 0, dir: 'desc' }],
      },
      param: { ProjectInfoID: Number(project.id) },
    };
    const res = await apiCall(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
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
    refetch();
  }, [refetch]);

  const handleViewProject = (project: Project) => {
    navigate(`/projects/${project.id}`);
  };

  const handleViewProjectTasks = (project: Project) => {
  navigate(`/projects/${project.id}/tasks`);
};

  const handleSort = (field: SortField) => {
    setSortOpen(false);
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
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
          if (!res.ok) throw new Error(`Failed: ${res.statusText}`);
          message.success('Project deleted successfully');
          refetch();
        } catch (err) {
          message.error(err instanceof Error ? err.message : 'Delete failed');
        }
      },
    });
  };

  return (
    <div className="fade-in space-y-4 max-w-screen-2xl mx-auto w-full pb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Projects</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage, organize and monitor all your projects in one place.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <SearchInput
            value={searchQuery}
            onChange={(value) => {
              setSearchQuery(value);
              if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
              debounceTimerRef.current = setTimeout(() => setCurrentPage(1), 400);
            }}
            placeholder="Search projects..."
            containerClassName="w-48 lg:w-56"
          />
          <Button type="primary" onClick={openCreateModal} icon={<Plus className="w-4 h-4" />}>
            New Project
          </Button>
          <div className="relative">
            <DropdownMenu
              trigger={
                <Button icon={<Filter className="w-3.5 h-3.5 text-muted-foreground" />}>
                  Filter
                  {filterStatus !== 'All' && (
                    <span className="ml-1 w-1.5 h-1.5 rounded-full bg-primary" />
                  )}
                  <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform duration-200 ${filterOpen ? 'rotate-180' : ''}`} />
                </Button>
              }
              items={statusOptions.map((status) => ({
                label: status,
                onClick: () => handleFilter(status),
              }))}
            />
          </div>
          <div className="relative">
            <DropdownMenu
              trigger={
                <Button icon={<ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />}>
                  Sort
                  <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform duration-200 ${sortOpen ? 'rotate-180' : ''}`} />
                </Button>
              }
              items={sortOptions.map((opt) => ({
                label: opt.label,
                onClick: () => handleSort(opt.value),
              }))}
            />
          </div>
          <div className="flex items-center bg-white/70 border border-border rounded-2xl p-0.5 shadow-xs">
            <Button type="text" onClick={() => setViewMode('grid')} icon={<LayoutGrid className="w-4 h-4" />} />
            <Button type="text" onClick={() => setViewMode('list')} icon={<List className="w-4 h-4" />} />
          </div>
          <Button onClick={handleExport} icon={<Download className="w-3.5 h-3.5 text-muted-foreground" />}>
            Export
          </Button>
        </div>
      </div>
      <hr className="border-slate-200 my-4" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card hover padding="p-4" className="transition-transform duration-200 ease-out">
          <div className="flex items-start justify-between">
            <div className="p-2.5 rounded-xl bg-violet-100 text-violet-600">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Projects</p>
              <p className="text-xl font-bold text-slate-900">{statsLoading ? '—' : stats.projects.toLocaleString()}</p>
            </div>
          </div>
          <p className="text-sm text-slate-500 mt-3">Total active and completed projects</p>
        </Card>
        <Card hover padding="p-4" className="transition-transform duration-200 ease-out">
          <div className="flex items-start justify-between">
            <div className="p-2.5 rounded-xl bg-blue-100 text-blue-600">
              <ListChecks className="w-5 h-5" />
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Tasks</p>
              <p className="text-xl font-bold text-slate-900">{statsLoading ? '—' : stats.tasks.toLocaleString()}</p>
            </div>
          </div>
          <p className="text-sm text-slate-500 mt-3">All tasks across every project</p>
        </Card>
        <Card hover padding="p-4" className="transition-transform duration-200 ease-out">
          <div className="flex items-start justify-between">
            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-600">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Organizations</p>
              <p className="text-xl font-bold text-slate-900">{statsLoading ? '—' : stats.organizations.toLocaleString()}</p>
            </div>
          </div>
          <p className="text-sm text-slate-500 mt-3">Registered organizations in the system</p>
        </Card>
        <Card hover padding="p-4" className="transition-transform duration-200 ease-out">
          <div className="flex items-start justify-between">
            <div className="p-2.5 rounded-xl bg-amber-100 text-amber-600">
              <Briefcase className="w-5 h-5" />
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Departments</p>
              <p className="text-xl font-bold text-slate-900">{statsLoading ? '—' : stats.departments.toLocaleString()}</p>
            </div>
          </div>
          <p className="text-sm text-slate-500 mt-3">Departments across all organizations</p>
        </Card>
      </div>

      {loading ? (
        <CardGridSkeleton count={9} columns="grid-cols-1 md:grid-cols-2 xl:grid-cols-3" />
      ) : (
        <>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-foreground">Projects</h2>
                <span className="text-base text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full">
                  {displayProjects.length} total
                </span>
              </div>

              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {paginatedProjects.map((project) => {
                  const Icon = project.icon;
                  const projectTitle = project.title || project.name || 'Untitled Project';
                  return (
                    <Card key={project.id} hover className="flex flex-col min-h-[280px] cursor-pointer overflow-hidden" onClick={() => handleViewProject(project)}>
                      <div className="flex flex-col gap-3 flex-1">
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-xl ${project.iconBg} shrink-0`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-bold text-foreground truncate" title={projectTitle}>{projectTitle}</h3>
                              {project.starred && <Star className="w-4 h-4 fill-amber-400 text-amber-400 shrink-0" />}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge>{project.status}</Badge>
                          <span className="text-sm text-muted-foreground">{project.priority} priority</span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground font-medium">Progress</span>
                            <span className="font-bold text-foreground">{project.progress}%</span>
                          </div>
                          <ProgressBar value={project.progress} color={project.progressColor} />
                        </div>
                        <div className="flex items-center justify-between gap-4 rounded-lg bg-muted/30 px-2.5 py-1.5">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Start Date</p>
                            <p className="text-sm font-medium text-foreground tabular-nums truncate">{project.startDateBs}</p>
                          </div>
                          <div className="min-w-0 text-right">
                            <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Due Date</p>
                            <p className="text-sm font-medium text-foreground tabular-nums truncate">{project.dueDateBs}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-3 mt-3 border-t border-border/60">
                        <Button size="small" type="primary" onClick={(e) => {e.stopPropagation(); handleViewProjectTasks(project);}} icon={<ListChecks className="w-3.5 h-3.5" />} className="!bg-green-600 hover:!bg-green-700 !border-green-600">Tasks</Button>
                        <Button size="small" type="primary" onClick={(e) => { e.stopPropagation(); handleViewProject(project); }} icon={<Eye className="w-3.5 h-3.5" />}>View</Button>
                        <Button size="small" onClick={(e) => { e.stopPropagation(); openEditModal(project); }} icon={<Pencil className="w-3.5 h-3.5" />}>Edit</Button>
                        <Button size="small" danger onClick={(e) => { e.stopPropagation(); handleDeleteClick(project); }} icon={<Trash2 className="w-3.5 h-3.5" />}>Delete</Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card hover className="space-y-2">
                {paginatedProjects.map((project) => {
                  const Icon = project.icon;
                  const projectTitle = project.title || project.name || 'Untitled Project';
                  return (
                    <Card key={project.id} hover className="flex items-center gap-3 px-4 py-2.5 cursor-pointer" onClick={() => handleViewProject(project)}>
                      <div className={`p-2 rounded-xl ${project.iconBg} shrink-0`}><Icon className="w-4 h-4" /></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm font-bold text-foreground truncate">{projectTitle}</h3>
                          {project.starred && <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />}
                        </div>
                      </div>
                      <Badge>{project.status}</Badge>
                      <span className="hidden md:inline-block text-sm text-muted-foreground w-24 truncate">{project.priority}</span>
                      <div className="hidden lg:flex items-center gap-3 w-48">
                         <ProgressBar value={project.progress} color={project.progressColor} />
                        <span className="text-sm font-semibold text-foreground w-8 text-right">{project.progress}%</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button size="small" type="text" onClick={(e) => { e.stopPropagation(); handleViewProject(project); }} icon={<Eye className="w-3.5 h-3.5" />} />
                        <Button size="small" type="text" onClick={(e) => { e.stopPropagation(); openEditModal(project); }} icon={<Pencil className="w-3.5 h-3.5" />} />
                        <Button size="small" type="text" danger onClick={(e) => { e.stopPropagation(); handleDeleteClick(project); }} icon={<Trash2 className="w-3.5 h-3.5" />} />
                      </div>
                    </Card>
                  );
                })}
              </Card>
            )}

            {Math.ceil(displayProjects.length / pageSize) > 1 && (
              <Pagination
                total={displayProjects.length}
                currentPage={currentPage}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
              />
            )}
          </div>
        </>
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
