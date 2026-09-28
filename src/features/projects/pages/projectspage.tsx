import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, message } from 'antd';
import {
  Filter,
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
  Upload,
  Monitor,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import Card from '@/shared/components/ui/Card';
import Pagination from '@/shared/components/ui/Pagination';
import { CardGridSkeleton } from '@/shared/components/ui/Loaders';
import SearchInput from '@/shared/components/ui/SearchInput';
import ViewToggle from '@/shared/components/ui/ViewToggle';
import Button from '@/shared/components/ui/Button';
import Badge from '@/shared/components/ui/Badge';
import ProgressBar from '@/shared/components/ui/ProgressBar';
import DropdownMenu from '@/shared/components/ui/DropdownMenu';
import AppTable from '@/shared/components/ui/AppTable';
import {
  deleteProject,
  fetchProjects,
  fetchSelectList,
  mapRowToProjectBody,
  SELECT_LIST_URLS,
  fetchProjectById,
  saveProject,
  type SelectListItem,
  type ExcelImportCaches,
} from '@/features/projects/services/project.service';
import type { ProjectStatus, Project, ApiProject } from '@/features/projects/types/projects-types';
import { fetchProjectCount, fetchTaskCount, fetchOrganizationCount, fetchDepartmentCount } from '@/features/stats/services/stat.service';
import ProjectFormModal from './Create';
import { usePaginatedList, type PaginatedListParams } from '@/shared/hooks/usePaginatedList';

type SortField = 'name' | 'status' | 'priority' | 'progress' | 'dueDate';

const PRIORITY_MAP: Record<string, number> = {
  urgent: 1,
  high: 2,
  medium: 3,
  low: 4,
};

async function fetchProjectsPage(
  params: PaginatedListParams
): Promise<{ items: Project[]; total: number }> {
  const { length, signal, search, status, sort, sortDirection } = params;
  const searchQuery = (search as string) || '';
  const filterStatus = (status as ProjectStatus | 'All') || 'All';
  const sortField = (sort as SortField) || 'name';
  const sortDirectionParam = (sortDirection as 'asc' | 'desc') || 'asc';

  const needsAllData = filterStatus !== 'All' || sortField !== 'name' || sortDirectionParam !== 'asc';

  const res = await fetchProjects({
    search: searchQuery,
    start: 0,
    length: needsAllData ? 1000 : Math.max(1, length as number),
    signal,
  });

  let items = res.items;
  if (filterStatus !== 'All') {
    items = items.filter(p => p.status === filterStatus);
  }

  items = [...items].sort((a, b) => {
    let cmp = 0;
    switch (sortField) {
      case 'name':
        cmp = (a.title || a.name).localeCompare(b.title || b.name);
        break;
      case 'status':
        cmp = a.status.localeCompare(b.status);
        break;
      case 'priority':
        cmp = (PRIORITY_MAP[a.priority] ?? 99) - (PRIORITY_MAP[b.priority] ?? 99);
        break;
      case 'progress':
        cmp = a.progress - b.progress;
        break;
      case 'dueDate':
        cmp = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        break;
    }
    return sortDirectionParam === 'asc' ? cmp : -cmp;
  });

  return { items, total: res.total };
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
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    data: projects,
    loading,
    currentPage,
    pageSize,
    setCurrentPage,
    setPageSize,
    refetch,
  } = usePaginatedList<Project>({
    fetcher: fetchProjectsPage,
    initialPageSize: 20,
    extraDeps: [searchQuery, filterStatus, sortField, sortDirection],
    extraParams: {
      search: searchQuery,
      status: filterStatus,
      sort: sortField,
      sortDirection: sortDirection,
    },
  });

  const displayProjects = useMemo(() => {
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
          cmp = (PRIORITY_MAP[a.priority] ?? 99) - (PRIORITY_MAP[b.priority] ?? 99);
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
    'All', 'Started', 'In Progress', 'In Progress Final', 'Completed', 'On Hold', 'Not Started', 'Overdue',
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
    const raw = await fetchProjectById(project.id);
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

  const handleViewDigitalBoard = (project: Project) => {
    navigate(`/projects/${project.id}/board`);
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

  const handleExcelUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExtension = (file.name.split('.').pop() || 'xlsx').toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(fileExtension)) {
      message.error('Please upload an Excel file (.xlsx, .xls, or .csv)');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setUploading(true);
    setUploadProgress({ current: 0, total: 0 });

    try {
      const text = await file.arrayBuffer();
      const workbook = XLSX.read(text, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);
      let rows = jsonData.filter(row => Object.values(row).some(v => v !== undefined && v !== null && String(v).trim() !== ''));

      if (rows.length > 0) {
        const firstKeys = Object.keys(rows[0]).map(k => k.trim().toLowerCase());
        const isKeyValue = firstKeys.includes('field') && firstKeys.includes('value');
        if (isKeyValue) {
          const wide: Record<string, unknown> = {};
          for (const row of rows) {
            const field = String(row.Field ?? row.field ?? '').trim();
            const value = row.Value ?? row.value;
            if (field) {
              wide[field] = value;
            }
          }
          rows = [wide];
        }
      }

      if (rows.length === 0) {
        throw new Error('Excel file is empty');
      }

      setUploadProgress({ current: 0, total: rows.length });

      const settledLists = await Promise.allSettled([
        fetchSelectList(SELECT_LIST_URLS.status),
        fetchSelectList(SELECT_LIST_URLS.client),
        fetchSelectList(SELECT_LIST_URLS.projectType),
        fetchSelectList(SELECT_LIST_URLS.department),
        fetchSelectList(SELECT_LIST_URLS.expenseInfo),
        fetchSelectList(SELECT_LIST_URLS.ward),
        fetchSelectList(SELECT_LIST_URLS.policyProgram),
        fetchSelectList(SELECT_LIST_URLS.budget),
        fetchSelectList(SELECT_LIST_URLS.projectHead),
      ]);

      const pick = (result: PromiseSettledResult<SelectListItem[]>) =>
        result.status === 'fulfilled' ? result.value : [];

      const [
        statusOptions,
        clientOptions,
        projectTypeOptions,
        departmentOptions,
        expenseInfoOptions,
        wardOptions,
        policyProgramOptions,
        budgetOptions,
        employeeOptions,
      ] = settledLists.map(pick);

      settledLists.forEach((result, idx) => {
        if (result.status === 'rejected') {
          console.warn(`Select list ${idx} failed to load:`, result.reason);
        }
      });

      const caches: ExcelImportCaches = {
        status: statusOptions,
        client: clientOptions,
        projectType: projectTypeOptions,
        department: departmentOptions,
        expenseInfo: expenseInfoOptions,
        ward: wardOptions,
        policyProgram: policyProgramOptions,
        budget: budgetOptions,
        employee: employeeOptions,
      };

      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        try {
          const body = await mapRowToProjectBody(row, caches);

          if (!body.ProjectName || String(body.ProjectName).trim() === '') {
            console.warn(`Row ${i + 1} skipped: missing ProjectName`, row);
            failCount++;
            continue;
          }

          const missingFields: string[] = [];
          if (!body.ProjectHeadEmpID || body.ProjectHeadEmpID === 0) missingFields.push('ProjectHead (employee name)');
          if (!body.WorkStatusID || body.WorkStatusID === 0) missingFields.push('Status (work status name)');
          if (!body.ClientInfoID || body.ClientInfoID === 0) missingFields.push('Client (client name)');
          if (!body.DepartmentID || body.DepartmentID === 0) missingFields.push('Department (department name)');
          if (!body.ExpenseInfoID || body.ExpenseInfoID === 0) missingFields.push('Expense (expense info name)');
          if (!body.BudgetInfoIDs || body.BudgetInfoIDs === '') missingFields.push('BudgetSource (budget info name)');
          if (!body.PolicyProgramIDs || body.PolicyProgramIDs === '') missingFields.push('PolicyProgram (policy program name)');

          if (missingFields.length > 0) {
            const rowKeys = Object.keys(row).join(', ');
            console.error(
              `Row ${i + 1} ("${body.ProjectName}") is missing required fields: ${missingFields.join(', ')}.\n` +
              `Excel columns found: [${rowKeys}]\n` +
              `Available employees (${caches.employee.length}): ${caches.employee.slice(0, 10).map(e => `"${e.name}" (ID:${e.id})`).join(', ')}${caches.employee.length > 10 ? '...' : ''}\n`
            );
            message.error(`Row ${i + 1} ("${body.ProjectName}"): Missing ${missingFields.join(', ')}. Check column names and values.`);
            failCount++;
            continue;
          }

          if (i === 0) {
            console.log('First project payload:', body);
          }

          const result = await saveProject(body);

          if (!result.success) {
            console.error(`Row ${i + 1} failed:`, body, result.message);
            failCount++;
            continue;
          }

          successCount++;
        } catch (err) {
          console.error(`Row ${i + 1} error:`, err, row);
          failCount++;
        } finally {
          setUploadProgress({ current: i + 1, total: rows.length });
        }
      }

      if (successCount > 0 && failCount === 0) {
        message.success(`Successfully imported ${successCount} project(s)`);
        refetch();
      } else if (successCount > 0 && failCount > 0) {
        message.warning(`Imported ${successCount} project(s). ${failCount} row(s) failed. Check console for details.`);
        refetch();
      } else {
        message.error(`All ${failCount} row(s) failed to import. Verify Excel headers match the template and required fields are filled.`);
      }
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Failed to process Excel file');
    } finally {
      setUploading(false);
      setUploadProgress({ current: 0, total: 0 });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteClick = (project: Project) => {
    Modal.confirm({
      title: 'Delete Project',
      content: `Are you sure you want to delete "${project.title || project.name}"?`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          const result = await deleteProject(Number(project.id));
          if (!result.success) throw new Error(result.message || 'Delete failed');
          message.success('Project deleted successfully');
          refetch();
        } catch (err) {
          message.error(err instanceof Error ? err.message : 'Delete failed');
        }
      },
    });
  };

  const projectColumns = [
    {
      title: 'Project',
      dataIndex: 'name',
      key: 'name',
      render: (_text: string, record: Project) => {
        const projectTitle = record.title || record.name || 'Untitled Project';
        const Icon = record.icon;
        return (
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${record.iconBg} shrink-0`}><Icon className="w-4 h-4" /></div>
            <div className="min-w-0">
              <div className="font-semibold text-slate-900 truncate">{projectTitle}</div>
              <div className="text-xs text-muted-foreground font-mono truncate">{record.category || '—'}</div>
            </div>
          </div>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Badge>{status}</Badge>,
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => <span className="text-sm text-muted-foreground">{priority}</span>,
    },
    {
      title: 'Progress',
      dataIndex: 'progress',
      key: 'progress',
      render: (progress: number, record: Project) => (
        <div className="flex items-center gap-3">
          <ProgressBar value={progress} color={record.progressColor} />
          <span className="text-sm font-semibold text-foreground w-8 text-right">{progress}%</span>
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Project) => (
        <div className="flex items-center justify-end gap-2">
          <Button size="small" type="primary" onClick={(e) => { e.stopPropagation(); handleViewProjectTasks(record); }} icon={<ListChecks className="w-3.5 h-3.5" />} className="!bg-green-600 hover:!bg-green-700 !border-green-600">Tasks</Button>
          <Button size="small" type="text" onClick={(e) => { e.stopPropagation(); handleViewProject(record); }} icon={<Eye className="w-3.5 h-3.5" />} />
          <Button size="small" type="text" onClick={(e) => { e.stopPropagation(); openEditModal(record); }} icon={<Pencil className="w-3.5 h-3.5" />} />
          <Button size="small" type="text" danger onClick={(e) => { e.stopPropagation(); handleDeleteClick(record); }} icon={<Trash2 className="w-3.5 h-3.5" />} />
        </div>
      ),
    },
  ];

  return (
    <div className="fade-in space-y-4 max-w-screen-2xl mx-auto w-full pb-8">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Projects</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage, organize and monitor all your projects in one place.
            </p>
          </div>
           <div className="flex items-center gap-2.5 flex-wrap md:flex-nowrap">
            <SearchInput
              value={searchQuery}
              onChange={(value) => {
                setSearchQuery(value);
                if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
                debounceTimerRef.current = setTimeout(() => setCurrentPage(1), 400);
              }}
              placeholder="Search projects..."
              containerClassName="w-full sm:w-40 md:w-48 lg:w-56"
            />
            <Button type="primary" onClick={openCreateModal} icon={<Plus className="w-4 h-4" />}>
              New Project
            </Button>
            <Button onClick={handleExcelUploadClick} loading={uploading} icon={<Upload className="w-3.5 h-3.5 text-muted-foreground" />}>
              {uploading ? `Importing ${uploadProgress.current}/${uploadProgress.total}` : 'Upload Excel'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
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
            <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
          </div>
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
        <CardGridSkeleton count={9} />
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
                    <Card key={project.id} hover className="flex flex-col min-h-[280px] cursor-pointer overflow-hidden relative" onClick={() => handleViewProject(project)}>
                      <div className="flex flex-col gap-3 flex-1">
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-xl ${project.iconBg} shrink-0`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-2">
                              <h3 className="text-sm font-bold text-foreground break-words" title={projectTitle}>{projectTitle}</h3>
                              {project.starred && <Star className="w-4 h-4 fill-amber-400 text-amber-400 shrink-0 mt-0.5" />}
                            </div>
                          </div>
                          <Button 
                            size="small" 
                            type="primary" 
                            onClick={(e) => { e.stopPropagation(); handleViewDigitalBoard(project); }} 
                            icon={<Monitor className="w-3.5 h-3.5" />}
                            className="!bg-violet-600 hover:!bg-violet-700 !border-violet-600 shrink-0"
                          >
                            Digital Board
                          </Button>
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
                <AppTable
                  columns={projectColumns}
                  dataSource={paginatedProjects}
                  rowKey={(record) => record.id}
                  cardClassName="mt-4 overflow-x-auto"
                  rowHoverClassName="hover:bg-slate-50/60"
                />
              )}

            {!loading && projects.length > 0 && (
              <Pagination
                total={displayProjects.length}
                currentPage={currentPage}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setCurrentPage(1);
                }}
                pageSizeOptions={[ 20, 50, 100]}
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

