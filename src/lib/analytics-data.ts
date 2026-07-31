import type { Project, ProjectStatus, ProjectPriority } from './projects-data';
import { TASKS } from '@/pages/tasks/page';
import { MEMBERS } from '@/pages/team/page';

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
    const rows = Array.isArray(json?.data) ? (json.data as any[]) : [];
    const mapped = rows.map((api: any) => {
      const categoryMap: Record<number, string> = { 0: 'General', 1: 'Development', 2: 'Infrastructure', 3: 'Design' };
      const category = categoryMap[api.ProjectType] ?? api.ProjectTypeName ?? 'General';
      const status = (api.WorkStatusName === 'In Progress Final' ? 'In Progress' : api.WorkStatusName) as ProjectStatus;
      const priority = api.PriorityName as Project['priority'];
      const dueDate = api.ProjectOpenDate || api.StartDate || '';
      const progress = status === 'Completed' ? 100 : status === 'In Progress' ? 50 : status === 'On Hold' ? 20 : 0;
      const budget = `Rs. ${api.TotalBudget?.toLocaleString() ?? '0'}`;
      return {
        id: String(api.ProjectInfoID),
        name: api.ProjectName,
        title: api.ProjectName,
        category,
        status,
        progress,
        startDate: api.StartDate,
        dueDate,
        submissionDate: '',
        targetEndDate: dueDate,
        team: [],
        extraTeam: 0,
        priority,
        starred: false,
        description: api.Description ?? '',
        icon: null as any,
        iconBg: '',
        client: api.ProjectHeadEmpName,
        manager: api.ProjectHeadEmpName,
        managerAvatar: api.ProjectHeadEmpPhoto ?? '',
        progressColor: '',
        budget,
        daysLeft: '',
        tasksCompleted: 0,
        totalTasks: 0,
      };
    });
    return mapped.length > 0 ? mapped : [];
  } catch {
    return [];
  }
}

type TaskStatus = 'To Do' | 'In Progress' | 'Completed';
type TaskPriority = 'High' | 'Medium' | 'Low';

interface Task {
  id: string;
  title: string;
  project: { name: string };
  status: TaskStatus;
  priority: TaskPriority;
  progress: number;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  department: string;
  status: 'Active' | 'Away' | 'On Leave';
  workload: number;
  projectsCount: number;
}

interface StatusBreakdownItem {
  label: string;
  count: number;
  color: string;
}

interface PriorityBreakdownItem {
  label: string;
  count: number;
  color: string;
}

interface CategoryBreakdownItem {
  label: string;
  count: number;
  color: string;
}

interface BudgetByCategoryItem {
  label: string;
  budget: number;
  color: string;
}

interface TaskCompletionItem {
  name: string;
  completed: number;
  remaining: number;
  progress: number;
}

interface TimelineMonthData {
  month: string;
  completed: number;
  inProgress: number;
}

interface TimelineSummary {
  activeProjects: number;
  avgDaysToCompletion: number;
  onTimeDeliveryRate: string;
  budgetUtilization: string;
  teamUtilization: string;
}

interface KeyMetric {
  title: string;
  value: string;
  subtitle: string;
  color: string;
}

interface KPIStat {
  label: string;
  value: number | string;
  change: string;
  up: boolean;
  description: string;
}

interface AnalyticsData {
  kpis: KPIStat[];
  statusBreakdown: StatusBreakdownItem[];
  priorityBreakdown: PriorityBreakdownItem[];
  categoryBreakdown: CategoryBreakdownItem[];
  budgetByCategory: BudgetByCategoryItem[];
  taskCompletion: TaskCompletionItem[];
  timeline: TimelineMonthData[];
  timelineSummary: TimelineSummary;
  keyMetrics: KeyMetric[];
  totalBudget: number;
  totalTasksCompleted: number;
  totalTasks: number;
  taskCompletionRate: number;
}

const statusColors: Record<ProjectStatus, string> = {
  'In Progress': '#3B82F6',
  'Completed': '#10B981',
  'On Hold': '#F59E0B',
  'Not Started': '#9CA3AF',
  'Overdue': '#EF4444',
};

const priorityColors: Record<ProjectPriority, string> = {
  Urgent: '#EF4444',
  High: '#F97316',
  Medium: '#3B82F6',
  Low: '#9CA3AF',
};

const categoryColors: Record<string, string> = {
  Development: '#8B5CF6',
  Infrastructure: '#0EA5E9',
  Design: '#EC4899',
  Marketing: '#F59E0B',
  Security: '#10B981',
};

function computeKPIs(projectList: Project[], taskList: Task[], memberList: TeamMember[]): KPIStat[] {
  const total = projectList.length;
  const inProgress = projectList.filter((p) => p.status === 'In Progress').length;
  const completed = projectList.filter((p) => p.status === 'Completed').length;
  const overdue = projectList.filter((p) => p.status === 'Overdue').length;
  const avgProgress = total > 0 ? Math.round(projectList.reduce((acc, p) => acc + p.progress, 0) / total) : 0;
  const totalBudget = projectList.reduce((acc, p) => {
    const num = parseFloat(p.budget.replace(/[^\d.]/g, ''));
    return acc + (isNaN(num) ? 0 : num);
  }, 0);
  const totalTasksCompleted = taskList.filter((t) => t.status === 'Completed').length;
  const totalTasks = taskList.length;
  const taskCompletionRate = totalTasks > 0 ? Math.round((totalTasksCompleted / totalTasks) * 100) : 0;
  const activeMembers = memberList.filter((m) => m.status === 'Active').length;

  return [
    { label: 'Total Projects', value: total, change: `+${Math.round(total * 0.08)}%`, up: true, description: 'All active and completed projects' },
    { label: 'In Progress', value: inProgress, change: `+${Math.round(inProgress * 0.1)}%`, up: true, description: 'Projects currently being worked on' },
    { label: 'Completed', value: completed, change: `+${Math.round(completed * 0.15)}%`, up: true, description: 'Successfully delivered projects' },
    { label: 'Overdue', value: overdue, change: `-${Math.abs(overdue)}%`, up: false, description: 'Projects past their deadline' },
    { label: 'Avg Progress', value: `${avgProgress}%`, change: `+${Math.round(avgProgress * 0.05)}%`, up: true, description: 'Average completion across all projects' },
    { label: 'Total Budget', value: `$${(totalBudget / 1000).toFixed(0)}k`, change: `+${(0.03 * 100)}%`, up: true, description: 'Allocated project budget' },
    { label: 'Tasks Done', value: taskCompletionRate, change: `+${Math.round(taskCompletionRate * 0.08)}%`, up: true, description: `${totalTasksCompleted} of ${totalTasks} tasks completed` },
    { label: 'Active Members', value: activeMembers, change: `+${Math.round(activeMembers * 0.05)}%`, up: true, description: 'Team members currently active' },
  ];
}

function computeStatusBreakdown(projectList: Project[]): StatusBreakdownItem[] {
  const counts: Record<string, number> = {};
  projectList.forEach((p) => { counts[p.status] = (counts[p.status] || 0) + 1; });
  return Object.keys(counts)
    .map((status) => ({ label: status, count: counts[status], color: statusColors[status as ProjectStatus] || '#64748B' }))
    .filter((s) => s.count > 0);
}

function computePriorityBreakdown(projectList: Project[]): PriorityBreakdownItem[] {
  const counts: Record<string, number> = {};
  projectList.forEach((p) => { counts[p.priority] = (counts[p.priority] || 0) + 1; });
  return Object.keys(counts).map((pri) => ({ label: pri, count: counts[pri], color: priorityColors[pri as ProjectPriority] || '#64748B' }));
}

function computeCategoryBreakdown(projectList: Project[]): CategoryBreakdownItem[] {
  const counts: Record<string, number> = {};
  projectList.forEach((p) => { counts[p.category] = (counts[p.category] || 0) + 1; });
  return Object.keys(counts).map((cat) => ({ label: cat, count: counts[cat], color: categoryColors[cat] || '#64748B' }));
}

function computeBudgetByCategory(projectList: Project[]): BudgetByCategoryItem[] {
  const budgets: Record<string, number> = {};
  projectList.forEach((p) => {
    const num = parseFloat(p.budget.replace(/[^\d.]/g, ''));
    budgets[p.category] = (budgets[p.category] || 0) + (isNaN(num) ? 0 : num);
  });
  return Object.keys(budgets).map((cat) => ({ label: cat, budget: budgets[cat], color: categoryColors[cat] || '#64748B' }));
}

function computeTaskCompletion(taskList: Task[], projectList: Project[]): TaskCompletionItem[] {
  return projectList
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 6)
    .map((p) => {
      const projectTasks = taskList.filter((t) => t.project.name === p.name);
      const completed = projectTasks.filter((t) => t.status === 'Completed').length;
      return { name: p.name.length > 20 ? p.name.slice(0, 20) + '...' : p.name, completed, remaining: projectTasks.length - completed, progress: p.progress };
    });
}

function computeTimeline(): TimelineMonthData[] {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
  return months.map((month, i) => ({ month, completed: [0, 0, 1, 1, 2, 2, 2][i], inProgress: [1, 2, 2, 3, 3, 4, 4][i] }));
}

function computeTimelineSummary(projectList: Project[]): TimelineSummary {
  return {
    activeProjects: projectList.filter((p) => p.status === 'In Progress' || p.status === 'On Hold').length,
    avgDaysToCompletion: 45,
    onTimeDeliveryRate: '78.5%',
    budgetUtilization: '62.3%',
    teamUtilization: '74.8%',
  };
}

function computeKeyMetrics(projectList: Project[], taskList: Task[]): KeyMetric[] {
  const totalBudget = projectList.reduce((acc, p) => { const num = parseFloat(p.budget.replace(/[^\d.]/g, '')); return acc + (isNaN(num) ? 0 : num); }, 0);
  const totalTasksCompleted = taskList.filter((t) => t.status === 'Completed').length;
  const totalTasks = taskList.length;
  const costPerTask = totalBudget > 0 && totalTasksCompleted > 0 ? `$${Math.round(totalBudget / totalTasksCompleted).toLocaleString()}k/task` : 'N/A';
  return [
    { title: 'Budget Efficiency', value: costPerTask, subtitle: 'Cost per completed task', color: 'text-emerald-600' },
    { title: 'Avg Project Duration', value: '42 days', subtitle: 'From start to completion', color: 'text-blue-600' },
    { title: 'Resource Allocation', value: `${totalTasksCompleted}/${totalTasks}`, subtitle: 'Tasks completed vs total', color: 'text-violet-600' },
  ];
}

export async function getAnalyticsData(): Promise<AnalyticsData> {
  const projectList = await fetchProjects();

  const taskList: Task[] = TASKS.map((t) => ({
    id: t.id,
    title: t.title,
    project: { name: t.project?.name || 'Unknown' },
    status: t.status,
    priority: t.priority,
    progress: t.progress,
  }));

  const memberList: TeamMember[] = MEMBERS.map((m) => ({
    id: m.id,
    name: m.name,
    role: m.role,
    department: m.department,
    status: m.status,
    workload: m.workload,
    projectsCount: m.projectsCount,
  }));

  const kpis = computeKPIs(projectList, taskList, memberList);
  const statusBreakdown = computeStatusBreakdown(projectList);
  const priorityBreakdown = computePriorityBreakdown(projectList);
  const categoryBreakdown = computeCategoryBreakdown(projectList);
  const budgetByCategory = computeBudgetByCategory(projectList);
  const taskCompletion = computeTaskCompletion(taskList, projectList);
  const timeline = computeTimeline();
  const timelineSummary = computeTimelineSummary(projectList);
  const keyMetrics = computeKeyMetrics(projectList, taskList);
  const totalBudget = projectList.reduce((acc, p) => { const num = parseFloat(p.budget.replace(/[^\d.]/g, '')); return acc + (isNaN(num) ? 0 : num); }, 0);
  const totalTasksCompleted = taskList.filter((t) => t.status === 'Completed').length;
  const totalTasks = taskList.length;
  const taskCompletionRate = totalTasks > 0 ? Math.round((totalTasksCompleted / totalTasks) * 100) : 0;

  return {
    kpis, statusBreakdown, priorityBreakdown, categoryBreakdown, budgetByCategory,
    taskCompletion, timeline, timelineSummary, keyMetrics,
    totalBudget, totalTasksCompleted, totalTasks, taskCompletionRate,
  };
}

export type {
  AnalyticsData, KPIStat, StatusBreakdownItem, PriorityBreakdownItem,
  CategoryBreakdownItem, BudgetByCategoryItem, TaskCompletionItem,
  TimelineMonthData, TimelineSummary, KeyMetric,
};