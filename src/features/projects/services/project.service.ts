import { apiCall, API_BASE } from '@/lib/api/api.service';
import { convertAdToBs, convertBsToAd } from '@/shared/utils/nepali-date';
import type { Project, ProjectStatus, ProjectFormData, ApiProject, SelectListItem,
  ExcelImportCaches, ServerSearchResponse, FetchResult
 } from '@/features/projects/types/projects-types';
import { Smartphone, Globe, Megaphone, Server, ShieldCheck, FolderKanban } from 'lucide-react';


export const API_URL = `${API_BASE}/ProjectInfo/ServerSearch`;
export const PROJECT_DETAIL_URL = `${API_BASE}/GetProjectDetailData`;
export const SAVE_PROJECT_URL = `${API_BASE}/SaveProjectInfo`;
export const DELETE_PROJECT_URL = `${API_BASE}/DeleteProjectInfo`;

export const SELECT_LIST_URLS = {
  projectHead: `${API_BASE}/EmployeeInfo/SelectList`,
  status: `${API_BASE}/WorkStatus/SelectList`,
  policyProgram: `${API_BASE}/PolicyProgram/SelectList`,
  budget: `${API_BASE}/BudgetInfo/SelectList`,
  client: `${API_BASE}/ClientInfo/SelectList`,
  projectType: `${API_BASE}/ProjectInfo/ProjectTypeList`,
  department: `${API_BASE}/Department/SelectList`,
  expenseInfo: `${API_BASE}/ExpenseInfo/SelectList`,
  ward: `${API_BASE}/WardInfo/SelectList`,
  labelInfo: `${API_BASE}/LabelInfo/SelectList`,
};


export function extractIdAndName(obj: Record<string, unknown>): SelectListItem | null {
  if (!obj || typeof obj !== 'object') return null;

  const valueVal = obj.Value ?? obj.value ?? obj.Key ?? obj.key;
  const textVal = obj.Text ?? obj.text ?? obj.Name ?? obj.name ?? obj.Title ?? obj.title ?? obj.Label ?? obj.label;

  if (valueVal !== undefined && valueVal !== null && textVal !== undefined && textVal !== null && String(textVal).trim() !== '') {
    return { id: Number(valueVal) || String(valueVal), name: String(textVal) };
  }

  const idSuffixes = ['id', 'ID', 'Id', 'InfoID', 'Code', 'code', 'Key', 'Value', 'value'];
  const nameSuffixes = ['name', 'Name', 'title', 'Title', 'fullname', 'Fullname', 'label', 'Label', 'Number', 'number', 'text', 'Text'];

  let id: number | string | undefined;
  let name: string | undefined;

  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) continue;
    if (id === undefined && idSuffixes.some((s) => key === s || key.endsWith(s))) {
      id = value as number | string;
    }
    if (name === undefined && nameSuffixes.some((s) => key === s || key.endsWith(s))) {
      name = String(value);
    }
    if (id !== undefined && name !== undefined) break;
  }

  if (id !== undefined && name !== undefined) {
    return { id: id as number | string, name };
  }

  return null;
}

export function mapToSelectOptions(items: SelectListItem[]): { value: string; label: string }[] {
  return items.map((item) => ({
    value: String(item.id),
    label: item.name,
  }));
}

export async function fetchSelectList(path: string, signal?: AbortSignal): Promise<SelectListItem[]> {
  try {
    const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
    const res = await apiCall(url, { method: 'GET', signal });
    if (!res.ok) return [];
    const data = await res.json();
    const list: Record<string, unknown>[] = Array.isArray(data)
      ? data
      : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.Data)
          ? data.Data
          : [];
    return list.map(extractIdAndName).filter((item): item is SelectListItem => item !== null);
  } catch {
    return [];
  }
}

export function normalizeDate(value: unknown): string {
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

const PRIORITY_MAP: Record<string, number> = {
  urgent: 1,
  high: 2,
  medium: 3,
  low: 4,
};

export async function mapRowToProjectBody(
  row: Record<string, unknown>,
  caches: ExcelImportCaches
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

  const resolveField = (
    numericId: number | null,
    options: SelectListItem[],
    ...nameCandidates: unknown[]
  ): number => {
    if (numericId !== null && numericId > 0) return numericId;
    const nameStr = getString(...nameCandidates);
    if (nameStr) {
      const target = String(nameStr).trim().toLowerCase();
      const exact = options.find((o) => o.name.toLowerCase() === target);
      if (exact) return Number(exact.id);
      const partial = options.find((o) => o.name.toLowerCase().includes(target) || target.includes(o.name.toLowerCase()));
      if (partial) return Number(partial.id);
    }
    return 0;
  };

  const priorityRaw = String(pick(row.Priority, row.priority, rowLower['priority']) ?? 'Medium').trim().toLowerCase();
  const priority = PRIORITY_MAP[priorityRaw] ?? 3;

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

  const unresolvedFields: string[] = [];
  if (!resolvedProjectHeadEmpId) unresolvedFields.push('ProjectHead/ProjectHeadEmpName');
  if (!resolvedStatusId) unresolvedFields.push('Status/WorkStatusName');
  if (!resolvedClientId) unresolvedFields.push('Client/ClientName');
  if (!resolvedDepartmentId) unresolvedFields.push('Department/DepartmentName');
  if (!resolvedExpenseInfoId) unresolvedFields.push('Expense/ExpenseCode');
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

const statusProgressColor: Record<ProjectStatus, string> = {
  'In Progress': 'bg-blue-500',
  'Completed': 'bg-emerald-500',
  'On Hold': 'bg-amber-500',
  'Not Started': 'bg-gray-300',
  'Overdue': 'bg-rose-500',
  Started: 'bg-indigo-500',
  'In Progress Final': 'bg-violet-500',
};

function getIconForCategory(category: string) {
  switch (category) {
    case 'Development':
      return Smartphone;
    case 'Design':
      return Globe;
    case 'Marketing':
      return Megaphone;
    case 'Infrastructure':
      return Server;
    case 'Security':
      return ShieldCheck;
    default:
      return FolderKanban;
  }
}

function getIconBgForCategory(category: string) {
  switch (category) {
    case 'Development':
      return 'bg-emerald-100 text-emerald-600';
    case 'Design':
      return 'bg-blue-100 text-blue-600';
    case 'Marketing':
      return 'bg-amber-100 text-amber-600';
    case 'Infrastructure':
      return 'bg-purple-100 text-purple-600';
    case 'Security':
      return 'bg-purple-100 text-purple-600';
    default:
      return 'bg-gray-100 text-gray-500';
  }
}

function getProgress(status: string): number {
  if (status === 'Completed') return 100;
  if (status === 'In Progress' || status === 'In Progress Final') return 50;
  if (status === 'On Hold') return 20;
  return 0;
}

function getProgressColor(progress: number): string {
  if (progress >= 75) return '#10B981';
  if (progress >= 40) return '#3B82F6';
  if (progress > 0) return '#F59E0B';
  return '#D1D5DB';
}

function calculateProgressFromDates(startDateStr: string, endDateStr: string): number {
  if (!startDateStr || !endDateStr) return 0;

  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  const now = new Date();

  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;

  if (now <= start) return 0;
  if (now >= end) return 100;

  const totalDuration = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();

  const progress = Math.round((elapsed / totalDuration) * 100);
  return Math.min(Math.max(progress, 0), 100);
}

export function mapApiProjectToProject(api: ApiProject): Project {
  const category = projectTypeMap[api.ProjectType] ?? api.ProjectTypeName ?? 'General';
  const initialStatus = api.WorkStatusName as ProjectStatus;
  const priority = api.PriorityName as Project['priority'];
  const dueDate = api.ProjectOpenDate || calculateDueDate(api.StartDate, api.ProjectDuration) || '';
  const submissionDate =
    api.LastDateOfSubmission && api.LastDateOfSubmission !== '0001-01-01T00:00:00'
      ? api.LastDateOfSubmission.split('T')[0]
      : '';
  const progress = calculateProgressFromDates(api.StartDate, dueDate);
  const finalProgress = progress > 0 || (api.StartDate && dueDate) ? progress : getProgress(initialStatus);
  let status: ProjectStatus = initialStatus;
  if (finalProgress === 100) {
    status = 'Completed';
  } else if (finalProgress >= 81) {
    status = 'In Progress Final';
  } else if (finalProgress >= 11) {
    status = 'In Progress';
  } else if (finalProgress >= 1) {
    status = 'Started';
  }
  const progressColor = getProgressColor(finalProgress);

  return {
    id: String(api.ProjectInfoID),
    name: api.ProjectName,
    title: api.ProjectName,
    category,
    status,
    progress: finalProgress,
    startDate: api.StartDate,
    dueDate,
    startDateBs: convertToBs(api.StartDate),
    dueDateBs: convertToBs(dueDate),
    submissionDate,
    targetEndDate: dueDate,
    team: [],
    extraTeam: 0,
    priority,
    starred: false,
    description: api.Description,
    icon: getIconForCategory(category),
    iconBg: getIconBgForCategory(category),
    client: api.ClientName || api.ClientInfoName || api.ProjectHeadEmpName,
    manager: api.ProjectHeadEmpName,
    managerAvatar: api.ProjectHeadEmpPhoto,
    progressColor: finalProgress > 0 || (api.StartDate && dueDate) ? progressColor : statusProgressColor[status] || 'bg-gray-300',
    budget: `Rs. ${api.TotalBudget.toLocaleString()}`,
    daysLeft: computeDaysLeft(dueDate),
    tasksCompleted: 0,
    totalTasks: 0,
  };
}

const projectTypeMap: Record<number, string> = {
  0: 'General',
  1: 'Development',
  2: 'Infrastructure',
  3: 'Design',
};

function computeDaysLeft(dueDate: string): string {
  if (!dueDate) return '';
  const due = new Date(dueDate);
  if (isNaN(due.getTime())) return '';
  const now = new Date();
  const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return 'Overdue';
  if (diff === 0) return 'Today';
  if (diff <= 30) return `${diff} days`;
  return `${Math.floor(diff / 30)} months`;
}

export function convertToBs(dateStr: string): string {
  if (!dateStr) return '';
  return convertAdToBs(dateStr);
}

export function calculateDueDate(startDateStr: string, durationDays: number): string {
  if (!startDateStr || durationDays == null) return '';
  const normalized = startDateStr.split('T')[0].replace(/-/g, '/');
  const parts = normalized.split('/');
  if (parts.length !== 3) return '';

  const now = new Date();
  const currentYear = now.getFullYear();

   try {
     const [y, m, d] = normalized.split('/').map(Number);
     const adDate = convertBsToAd(`${y}/${m}/${d}`);
     if (!adDate) return normalized;
     const startAd = new Date(adDate.getFullYear(), adDate.getMonth(), adDate.getDate());
     if (!isNaN(startAd.getTime()) && startAd.getFullYear() >= 2000 && startAd.getFullYear() <= currentYear + 10) {
       const dueAd = new Date(startAd);
       dueAd.setDate(dueAd.getDate() + Number(durationDays));
       const [y2, m2, d2] = [dueAd.getFullYear(), dueAd.getMonth() + 1, dueAd.getDate()];
       return convertAdToBs(`${y2}/${m2}/${d2}`);
     }
   } catch {
     // fall through to AD
   }

  try {
    const startAd = new Date(normalized);
    if (!isNaN(startAd.getTime())) {
      const dueAd = new Date(startAd);
      dueAd.setDate(dueAd.getDate() + Number(durationDays));
      return dueAd.toISOString().split('T')[0];
    }
  } catch {
    // ignore
  }

  return '';
}

export function toProjectFormData(project: Project): ProjectFormData {
  return {
    id: project.id,
    title: project.title,
    status: project.status,
    priority: project.priority === 'Urgent' ? 'High' : project.priority,
    category: project.category,
    description: project.description,
    startDate: project.startDate,
    submissionDate: project.submissionDate,
    targetEndDate: project.targetEndDate,
    client: project.client,
    projectManager: project.manager,
    progress: project.progress,
    daysLeft: project.daysLeft,
    tasksCompleted: project.tasksCompleted,
    totalTasks: project.totalTasks,
    budget: project.budget,
    teamMembers: project.team.map((m) => m.name).join(', '),
  };
}

export { statusProgressColor };

export async function fetchProjectById(id: number | string): Promise<ApiProject | null> {
  try {
    const res = await apiCall(API_URL, {
      method: 'POST',
      body: JSON.stringify({
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
        param: { ProjectInfoID: Number(id) },
      }),
    });

    if (!res.ok) return null;
    const json = await res.json();
    const rows = Array.isArray(json?.data) ? (json.data as ApiProject[]) : [];
    return rows.find((p) => String(p.ProjectInfoID) === String(id)) ?? null;
  } catch {
    return null;
  }
}

export async function fetchProjects(params: {
  search: string;
  start: number;
  length: number;
  signal?: AbortSignal;
}): Promise<FetchResult<Project>> {
  const { search, start, length, signal } = params;

  try {
    const res = await apiCall(API_URL, {
      method: 'POST',
      body: JSON.stringify({
        model: {
          draw: 1,
          start,
          length,
          columns: [
            { data: 'ProjectInfoID', name: 'ProjectInfoID', searchable: true, orderable: true, search: { value: search, regex: '' } },
            { data: 'ProjectName', name: 'ProjectName', searchable: true, orderable: true, search: { value: search, regex: '' } },
          ],
          search: { value: search, regex: '' },
          order: [{ column: 1, dir: 'desc' }],
        },
        param: {
          ProjectInfoID: 0,
          ProjectName: '',
          ProjectCode: '',
          Description: '',
          ProjectType: 0,
          ProjectTypeName: '',
          TotalBudget: 0,
          WorkStatusID: 0,
          ClientInfoID: 0,
          ProjectHeadEmpID: 0,
          ExpenseInfoID: 0,
          DepartmentID: 0,
          WorkStatusName: '',
          WorkStatusColor: '',
          ProjectHeadEmpName: '',
          ProjectHeadEmpPhoto: '',
          BudgetSourceID: 0,
          LastDateOfSubmission: '',
          Suchikrit_ServiceGroupTypeIDs: '',
          Suchikrit_ServiceTypeIDs: '',
          TargetVendorIDs: '',
          ProjectOpenDate: '',
          Attachments: '',
          TOR: '',
          PolicyProgramIDs: '',
          BudgetInfoIDs: '',
          BankGuranteeExpiryDate: '',
          BankGuranteeIssueDate: '',
          WorkStatusCode: '',
          PublicAgentID: 0,
          ExpenseCode: '',
          BudgetInfoName: '',
          DepartmentName: '',
          Tippani: '',
          Samghauta: '',
          Kalyades: '',
          Status: 0,
          CanEdit: false,
          CanDelete: false,
          CanChangeStatus: false,
        },
      }),
      signal,
    }, 120000);

    if (!res.ok) throw new Error(`Failed to fetch projects: ${res.statusText}`);
    const json = (await res.json()) as ServerSearchResponse;
    const rows = Array.isArray(json?.data) ? (json.data as ApiProject[]) : [];
    const mapped = rows.map(mapApiProjectToProject);

    return {
      items: mapped,
      total: json.recordsTotal ?? rows.length,
      filtered: json.recordsFiltered ?? rows.length,
    };
  } catch {
    return { items: [], total: 0, filtered: 0 };
  }
}

export async function saveProject(body: Record<string, unknown>): Promise<{ success: boolean; message?: string; data?: unknown }> {
  const res = await apiCall(SAVE_PROJECT_URL, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.Message || `Failed to save project: ${res.statusText}`);
  return {
    success: json.Success ?? true,
    message: json.Message,
    data: json.Data ?? json.data,
  };
}

export async function deleteProject(id: number): Promise<{ success: boolean; message?: string }> {
  const res = await apiCall(`${DELETE_PROJECT_URL}?id=${id}`, { method: 'GET' });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Failed to delete project: ${res.statusText}`);
  return { success: json.Success !== false, message: json.Message };
}

export async function fetchProjectDetail(projectId: string | number): Promise<ApiProject> {
  const sanitizedId = encodeURIComponent(String(projectId));
  const res = await apiCall(`${PROJECT_DETAIL_URL}?id=${sanitizedId}`, { method: 'GET' }, 10000);
  if (!res.ok) throw new Error(`HTTP error ${res.status}: ${res.statusText}`);

  const json = await res.json();
  const data = json?.Data ?? json?.data;
  const project = data?.ProjectInfo ?? data?.projectInfo;
  if (!project || !project.ProjectInfoID) throw new Error('Project details not found');
  return project;
}

export async function fetchProjectDetailData(projectId: string | number, signal?: AbortSignal): Promise<ApiProject> {
  const sanitizedId = encodeURIComponent(String(projectId));
  const res = await apiCall(`${PROJECT_DETAIL_URL}?id=${sanitizedId}`, { method: 'GET', signal }, 10000);
  if (!res.ok) throw new Error(`HTTP error ${res.status}: ${res.statusText}`);

  const json = await res.json();
  const data = json?.Data ?? json?.data;
  const project = data?.ProjectInfo ?? data?.projectInfo;
  if (!project || !project.ProjectInfoID) throw new Error('Project details not found');
  return project;
}

export async function fetchAllSelectLists(signal?: AbortSignal): Promise<{
  status: SelectListItem[];
  client: SelectListItem[];
  projectType: SelectListItem[];
  department: SelectListItem[];
  expenseInfo: SelectListItem[];
  ward: SelectListItem[];
  policyProgram: SelectListItem[];
  budget: SelectListItem[];
  employee: SelectListItem[];
  labelInfo: SelectListItem[];
}> {
  const results = await Promise.allSettled([
    fetchSelectList(SELECT_LIST_URLS.status, signal),
    fetchSelectList(SELECT_LIST_URLS.client, signal),
    fetchSelectList(SELECT_LIST_URLS.projectType, signal),
    fetchSelectList(SELECT_LIST_URLS.department, signal),
    fetchSelectList(SELECT_LIST_URLS.expenseInfo, signal),
    fetchSelectList(SELECT_LIST_URLS.ward, signal),
    fetchSelectList(SELECT_LIST_URLS.policyProgram, signal),
    fetchSelectList(SELECT_LIST_URLS.budget, signal),
    fetchSelectList(SELECT_LIST_URLS.projectHead, signal),
    fetchSelectList(SELECT_LIST_URLS.labelInfo, signal),
  ]);

  const pick = (result: PromiseSettledResult<SelectListItem[]>) =>
    result.status === 'fulfilled' ? result.value : [];

  const [
    status,
    client,
    projectType,
    department,
    expenseInfo,
    ward,
    policyProgram,
    budget,
    employee,
    labelInfo,
  ] = results.map(pick);

  return {
    status,
    client,
    projectType,
    department,
    expenseInfo,
    ward,
    policyProgram,
    budget,
    employee,
    labelInfo,
  };
}
