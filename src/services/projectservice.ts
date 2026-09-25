import { apiCall } from '@/services/apiservice';
import { convertAdToBs, convertBsToAd } from '@/utils/nepali-date';
import type { Project, ProjectStatus, ProjectFormData, ApiProject } from '@/types/projects-types';
import { Smartphone, Globe, Megaphone, Server, ShieldCheck, FolderKanban } from 'lucide-react';

const statusProgressColor: Record<ProjectStatus, string> = {
  'In Progress': 'bg-blue-500',
  'Completed': 'bg-emerald-500',
  'On Hold': 'bg-amber-500',
  'Not Started': 'bg-gray-300',
  'Overdue': 'bg-rose-500',
  Started: 'bg-indigo-500',
  'In Progress Final': 'bg-violet-500',
};

const API_BASE = (import.meta.env.VITE_BASE_API_URL || '').replace(/\/$/, '');
export const API_URL = `${API_BASE}/ProjectInfo/ServerSearch`;

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

interface FetchResult<T> {
  items: T[];
  total: number;
  filtered: number;
}

interface ServerSearchResponse {
  data?: unknown[];
  recordsTotal?: number;
  recordsFiltered?: number;
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
  const res = await apiCall(`${API_BASE}/SaveProjectInfo`, {
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
  const res = await apiCall(`${API_BASE}/DeleteProjectInfo?id=${id}`, { method: 'GET' });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Failed to delete project: ${res.statusText}`);
  return { success: json.Success !== false, message: json.Message };
}

