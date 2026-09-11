'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, message } from 'antd';
import {
  Filter,
  LayoutGrid,
  List,
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
} from 'lucide-react';
import * as XLSX from 'xlsx';
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

const PRIORITY_MAP: Record<string, number> = {
  urgent: 1,
  high: 2,
  medium: 3,
  low: 4,
};

async function fetchSelectList(url: string): Promise<{ id: number | string; name: string }[]> {
  const res = await apiCall(url, { method: 'GET' });
  if (!res.ok) return [];
  const data = await res.json();
  const list: Record<string, unknown>[] = Array.isArray(data) ? data : Array.isArray(data?.data) ? (data.data as Record<string, unknown>[]) : [];
  return list.map((item) => extractIdAndName(item)).filter((item): item is { id: number | string; name: string } => item !== null);
}

function extractIdAndName(obj: Record<string, unknown>): { id: number | string; name: string } | null {
  if (obj.Value !== undefined && obj.Name !== undefined) {
    return { id: Number(obj.Value), name: String(obj.Name) };
  }

  const idSuffixes = ['id', 'ID', 'Id', 'InfoID', 'Code', 'code', 'Key'];
  const nameSuffixes = ['name', 'Name', 'title', 'Title', 'fullname', 'Fullname', 'label', 'Label', 'Number', 'number'];

  let id: number | string | undefined;
  let name: string | undefined;

  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) continue;
    if (id === undefined && key.length > 1 && idSuffixes.some((s) => key.endsWith(s))) {
      id = value as number | string;
    }
    if (name === undefined && key.length > 1 && nameSuffixes.some((s) => key.endsWith(s))) {
      name = String(value);
    }
    if (id !== undefined && name !== undefined) break;
  }

  if (id !== undefined && name !== undefined) {
    return { id: id as number | string, name };
  }

  return null;
}

function resolveIdByName(options: { id: number | string; name: string }[], name: string): number | string | undefined {
  if (!name) return undefined;
  const target = String(name).trim().toLowerCase();
  const exact = options.find(o => o.name.toLowerCase() === target);
  if (exact) return exact.id;
  const partial = options.find(o => o.name.toLowerCase().includes(target) || target.includes(o.name.toLowerCase()));
  if (partial) return partial.id;
  return undefined;
}

function normalizeDate(value: unknown): string {
  if (!value) return '';
  const str = String(value).trim();
  if (!str) return '';
  const num = Number(str);
  if (Number.isFinite(num) && num > 0 && num < 2958465) {
    const ad = new Date((num - 25569) * 86400 * 1000);
    const yyyy = ad.getFullYear();
    const mm = String(ad.getMonth() + 1).padStart(2, '0');
    const dd = String(ad.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  const ad = new Date(str);
  if (!isNaN(ad.getTime())) {
    const yyyy = ad.getFullYear();
    const mm = String(ad.getMonth() + 1).padStart(2, '0');
    const dd = String(ad.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  const bsSlash = str.replace(/\//g, '-');
  const parts = bsSlash.split('-');
  if (parts.length === 3) {
    return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
  }
  return str;
}

async function mapRowToProjectBody(
  row: Record<string, unknown>,
  caches: {
    status: { id: number | string; name: string }[];
    client: { id: number | string; name: string }[];
    projectType: { id: number | string; name: string }[];
    department: { id: number | string; name: string }[];
    expenseInfo: { id: number | string; name: string }[];
    ward: { id: number | string; name: string }[];
    policyProgram: { id: number | string; name: string }[];
    budget: { id: number | string; name: string }[];
    employee: { id: number | string; name: string }[];
  }
): Promise<Record<string, unknown>> {
  const rowLower = Object.fromEntries(
    Object.entries(row).map(([k, v]) => [k.trim().toLowerCase().replace(/\s+/g, ''), v])
  );

  const pick = (...candidates: unknown[]): unknown => {
    for (const c of candidates) {
      if (c !== undefined && c !== null && String(c).trim() !== '') return c;
    }
    return undefined;
  };

  // Returns null when no candidate has a valid numeric value (vs 0 which is a real ID)
  const pickNumberOrNull = (...candidates: unknown[]): number | null => {
    const v = pick(...candidates);
    if (v === undefined) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const pickNumber = (...candidates: unknown[]): number => {
    return pickNumberOrNull(...candidates) ?? 0;
  };

  const getString = (...candidates: unknown[]): string => {
    const v = pick(...candidates);
    return v !== undefined ? String(v) : '';
  };

  // Resolve an ID field: use numeric ID from Excel if present and > 0, otherwise look up by name
  const resolveField = (
    numericId: number | null,
    options: { id: number | string; name: string }[],
    ...nameCandidates: unknown[]
  ): number => {
    // If user provided a valid numeric ID (> 0), use it directly
    if (numericId !== null && numericId > 0) return numericId;
    // Otherwise try to resolve by name
    const nameStr = getString(...nameCandidates);
    if (nameStr) {
      const resolved = resolveIdByName(options, nameStr);
      if (resolved !== undefined) return Number(resolved);
    }
    return 0;
  };

  const priorityRaw = String(pick(row.Priority, row.priority, rowLower['priority']) ?? 'Medium').trim().toLowerCase();
  const priority = PRIORITY_MAP[priorityRaw] ?? 3;

  // Try to pick numeric IDs from Excel columns (returns null if not present)
  const statusIdRaw = pickNumberOrNull(
    row.WorkStatusID, row.WorkStatusId, row.workStatusId, row.statusId, row.StatusID,
    rowLower['workstatusid'], rowLower['statusid']
  );
  const clientIdRaw = pickNumberOrNull(
    row.ClientInfoID, row.ClientInfoId, row.clientInfoId, row.ClientID,
    rowLower['clientinfoid'], rowLower['clientid']
  );
  const projectTypeRaw = pickNumberOrNull(
    row.ProjectTypeID, row.ProjectTypeId, row.projectTypeId,
    rowLower['projecttypeid']
  );
  const departmentIdRaw = pickNumberOrNull(
    row.DepartmentID, row.DepartmentId, row.departmentId,
    rowLower['departmentid']
  );
  const expenseInfoIdRaw = pickNumberOrNull(
    row.ExpenseInfoID, row.ExpenseInfoId, row.expenseInfoId,
    rowLower['expenseinfoid']
  );
  const wardIdRaw = pickNumberOrNull(
    row.WardInfoID, row.WardInfoId, row.wardInfoId, row.WardID,
    rowLower['wardinfoid'], rowLower['wardid']
  );
  const policyProgramIdRaw = pickNumberOrNull(
    row.PolicyProgramID, row.PolicyProgramId, row.policyProgramId,
    rowLower['policyprogramid']
  );
  const budgetIdRaw = pickNumberOrNull(
    row.BudgetInfoID, row.BudgetInfoId, row.budgetInfoId,
    rowLower['budgetinfoid']
  );
  const projectHeadEmpIdRaw = pickNumberOrNull(
    row.ProjectHeadEmpID, row.ProjectHeadEmpId, row.projectHeadEmpId,
    rowLower['projectheadempid']
  );

  const projectName = getString(
    row.ProjectName, row.projectName, row.Name, row.name,
    rowLower['projectname'], rowLower['name'], rowLower['field']
  );
  const projectDuration = pickNumber(row.ProjectDuration, row.projectDuration, row.Duration, row.duration, rowLower['projectduration'], rowLower['duration'], rowLower['duration(days)']);
  const startDate = getString(row.StartDate, row.startDate, row.ProjectOpenDate, row.projectOpenDate, rowLower['startdate'], rowLower['projectopendate']);
  const description = getString(row.Description, row.description, row.Details, row.details, rowLower['description'], rowLower['details']);
  const totalBudget = pickNumber(row.TotalBudget, row.totalBudget, row.Budget, row.budget, rowLower['totalbudget'], rowLower['budget']);
  const bankIssueDate = getString(row.BankGuranteeIssueDate, row.bankGuaranteeIssueDate, row.BankGuaranteeIssueDate, rowLower['bankguaranteeissuedate'], rowLower['bankguranteeissuedate']);
  const bankExpiryDate = getString(row.BankGuranteeExpiryDate, row.bankGuaranteeExpiryDate, row.BankGuaranteeExpiryDate, rowLower['bankguaranteeexpirydate'], rowLower['bankguranteeexpirydate']);
  const projectHeadEmpPhoto = getString(row.ProjectHeadEmpPhoto, row.projectHeadEmpPhoto, row.Photo, row.photo, rowLower['projectheadempphoto'], rowLower['photo']);

  // Resolve all ID fields: numeric ID if provided, otherwise look up by name string
  const resolvedStatusId = resolveField(statusIdRaw, caches.status,
    row.WorkStatusName, rowLower['workstatusname'], row.Status, rowLower['status']);
  const resolvedClientId = resolveField(clientIdRaw, caches.client,
    row.ClientName, rowLower['clientname'], row.Client, rowLower['client']);
  const resolvedProjectType = resolveField(projectTypeRaw, caches.projectType,
    row.ProjectTypeName, rowLower['projecttypename'], row.ProjectType, rowLower['projecttype']);
  const resolvedDepartmentId = resolveField(departmentIdRaw, caches.department,
    row.DepartmentName, rowLower['departmentname'], row.Department, rowLower['department']);
  const resolvedExpenseInfoId = resolveField(expenseInfoIdRaw, caches.expenseInfo,
    row.ExpenseInfoName, rowLower['expenseinfoname'], row.ExpenseInfo, rowLower['expenseinfo'],
    row.ExpenseCode, rowLower['expensecode'], row.Expense, rowLower['expense']);
  const resolvedWardId = resolveField(wardIdRaw, caches.ward,
    row.WardName, rowLower['wardname'], row.Ward, rowLower['ward']);
  const resolvedPolicyProgramId = resolveField(policyProgramIdRaw, caches.policyProgram,
    row.PolicyProgramName, rowLower['policyprogramname'], row.PolicyProgram, rowLower['policyprogram'],
    row.Policy, rowLower['policy']);
  const resolvedBudgetId = resolveField(budgetIdRaw, caches.budget,
    row.BudgetInfoName, rowLower['budgetinfoname'], row.BudgetInfo, rowLower['budgetinfo'],
    row.BudgetSource, rowLower['budgetsource']);
  const resolvedProjectHeadEmpId = resolveField(projectHeadEmpIdRaw, caches.employee,
    row.ProjectHeadEmpName, rowLower['projectheadempname'], row.ProjectHead, rowLower['projecthead'],
    row.ProjectHeadName, rowLower['projectheadname']);

  // Log warnings for fields that couldn't be resolved
  const unresolvedFields: string[] = [];
  if (!resolvedProjectHeadEmpId) unresolvedFields.push('ProjectHead/ProjectHeadEmpName');
  if (!resolvedStatusId) unresolvedFields.push('Status/WorkStatusName');
  if (!resolvedClientId) unresolvedFields.push('Client/ClientName');
  if (!resolvedDepartmentId) unresolvedFields.push('Department/DepartmentName');
  if (!resolvedExpenseInfoId) unresolvedFields.push('ExpenseInfo/ExpenseCode');
  if (!resolvedBudgetId) unresolvedFields.push('BudgetSource/BudgetInfoName');
  if (!resolvedPolicyProgramId) unresolvedFields.push('PolicyProgram/PolicyProgramName');
  if (unresolvedFields.length > 0) {
    console.warn(`Excel row "${projectName}": Could not resolve these fields (check spelling or add to system):`, unresolvedFields.join(', '));
  }

  return {
    ProjectInfoID: 0,
    ProjectName: projectName || 'Untitled Project',
    ProjectDuration: projectDuration,
    StartDate: normalizeDate(startDate),
    Description: description,
    TotalBudget: totalBudget,
    Priority: priority,
    WorkStatusID: resolvedStatusId,
    PolicyProgramIDs: resolvedPolicyProgramId ? String(resolvedPolicyProgramId) : '',
    PolicyProgramIDArray: resolvedPolicyProgramId ? [String(resolvedPolicyProgramId)] : [],
    BudgetInfoIDs: resolvedBudgetId ? String(resolvedBudgetId) : '',
    BudgetInfoIDArray: resolvedBudgetId ? [String(resolvedBudgetId)] : [],
    ClientInfoID: resolvedClientId,
    DepartmentID: resolvedDepartmentId,
    ExpenseInfoID: resolvedExpenseInfoId,
    WardInfoID: resolvedWardId,
    ProjectType: resolvedProjectType,
    ProjectHeadEmpID: resolvedProjectHeadEmpId,
    BankGuranteeIssueDate: normalizeDate(bankIssueDate),
    BankGuranteeExpiryDate: normalizeDate(bankExpiryDate),
    IsPolicyRelated: 0,
    ProjectHeadEmpPhoto: projectHeadEmpPhoto,
  };
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
        fetchSelectList(`${API_BASE}/WorkStatus/SelectList`),
        fetchSelectList(`${API_BASE}/ClientInfo/SelectList`),
        fetchSelectList(`${API_BASE}/ProjectInfo/ProjectTypeList`),
        fetchSelectList(`${API_BASE}/Department/SelectList`),
        fetchSelectList(`${API_BASE}/ExpenseInfo/SelectList`),
        fetchSelectList(`${API_BASE}/WardInfo/SelectList`),
        fetchSelectList(`${API_BASE}/PolicyProgram/SelectList`),
        fetchSelectList(`${API_BASE}/BudgetInfo/SelectList`),
        fetchSelectList(`${API_BASE}/EmployeeInfo/SelectList`),
      ]);

      const pick = (result: PromiseSettledResult<{ id: number | string; name: string }[]>) =>
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

      const caches = {
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

          // Validate required FK fields before sending to API
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

          const res = await apiCall(`${API_BASE}/SaveProjectInfo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });

          if (!res.ok) {
            const text = await res.text().catch(() => '');
            console.error(`Row ${i + 1} failed (${res.status}):`, body, text.slice(0, 500));
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
        <div className="flex items-center gap-2.5 flex-nowrap">
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
          <div className="flex items-center bg-white/70 border border-border rounded-2xl p-0.5 shadow-xs">
            <Button type="text" onClick={() => setViewMode('grid')} icon={<LayoutGrid className="w-4 h-4" />} />
            <Button type="text" onClick={() => setViewMode('list')} icon={<List className="w-4 h-4" />} />
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
              <Card className="overflow-x-auto">
                <table className="w-full border-separate border-spacing-y-1.5">
                  <thead>
                    <tr className="text-left text-sm font-semibold uppercase tracking-wide text-slate-500">
                      <th className="rounded-l-xl bg-slate-50 px-5 py-3">Project</th>
                      <th className="bg-slate-50 px-4 py-3">Status</th>
                      <th className="bg-slate-50 px-4 py-3">Priority</th>
                      <th className="bg-slate-50 px-4 py-3">Progress</th>
                      <th className="rounded-r-xl bg-slate-50 px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedProjects.map((project) => {
                      const Icon = project.icon;
                      const projectTitle = project.title || project.name || 'Untitled Project';
                      return (
                        <tr
                          key={project.id}
                          className="text-sm text-slate-700 hover:bg-slate-50/60 hover:scale-[1.01] transition-all duration-200 origin-center relative z-10"
                        >
                          <td className="rounded-l-xl bg-white px-4 py-3 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${project.iconBg} shrink-0`}><Icon className="w-4 h-4" /></div>
                              <div className="min-w-0">
                                <div className="font-semibold text-slate-900 truncate">{projectTitle}</div>
                                <div className="text-xs text-muted-foreground font-mono truncate">{project.category || '—'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="bg-white px-4 py-3 border-b border-slate-100">
                            <Badge>{project.status}</Badge>
                          </td>
                          <td className="bg-white px-4 py-3 border-b border-slate-100">
                            <span className="text-sm text-muted-foreground">{project.priority}</span>
                          </td>
                          <td className="bg-white px-4 py-3 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                              <ProgressBar value={project.progress} color={project.progressColor} />
                              <span className="text-sm font-semibold text-foreground w-8 text-right">{project.progress}%</span>
                            </div>
                          </td>
                          <td className="rounded-r-xl bg-white px-4 py-3 text-right border-b border-slate-100">
                            <div className="flex items-center justify-end gap-2">
                              <Button size="small" type="primary" onClick={(e) => { e.stopPropagation(); handleViewProjectTasks(project); }} icon={<ListChecks className="w-3.5 h-3.5" />} className="!bg-green-600 hover:!bg-green-700 !border-green-600">Tasks</Button>
                              <Button size="small" type="text" onClick={(e) => { e.stopPropagation(); handleViewProject(project); }} icon={<Eye className="w-3.5 h-3.5" />} />
                              <Button size="small" type="text" onClick={(e) => { e.stopPropagation(); openEditModal(project); }} icon={<Pencil className="w-3.5 h-3.5" />} />
                              <Button size="small" type="text" danger onClick={(e) => { e.stopPropagation(); handleDeleteClick(project); }} icon={<Trash2 className="w-3.5 h-3.5" />} />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Card>
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
