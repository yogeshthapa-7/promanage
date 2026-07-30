'use client';

import { Server, Smartphone, Globe, Megaphone, ShieldCheck, FolderKanban } from 'lucide-react';
import type { ProjectFormData } from '@/components/modal';

export type ProjectStatus = 'In Progress' | 'Completed' | 'On Hold' | 'Not Started' | 'Overdue';
export type ProjectPriority = 'Urgent' | 'High' | 'Medium' | 'Low';

export interface TeamMember {
  id: string;
  name: string;
  avatar: string;
}

export interface Project {
  id: string;
  name: string;
  title: string;
  category: string;
  status: ProjectStatus;
  progress: number;
  startDate: string;
  dueDate: string;
  submissionDate: string;
  targetEndDate: string;
  team: TeamMember[];
  extraTeam: number;
  priority: ProjectPriority;
  starred: boolean;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  client: string;
  manager: string;
  managerAvatar: string;
  progressColor: string;
  budget: string;
  daysLeft: string;
  tasksCompleted: number;
  totalTasks: number;
}

const statusProgressColor: Record<ProjectStatus, string> = {
  'In Progress': 'bg-blue-500',
  'Completed': 'bg-emerald-500',
  'On Hold': 'bg-amber-500',
  'Not Started': 'bg-gray-300',
  'Overdue': 'bg-rose-500',
};

export interface ApiProject {
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

const projectTypeMap: Record<number, string> = {
  0: 'General',
  1: 'Development',
  2: 'Infrastructure',
  3: 'Design',
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

export function mapApiProjectToProject(api: ApiProject): Project {
  const category = projectTypeMap[api.ProjectType] ?? api.ProjectTypeName ?? 'General';
  const status = (api.WorkStatusName === 'In Progress Final' ? 'In Progress' : api.WorkStatusName) as ProjectStatus;
  const priority = api.PriorityName as Project['priority'];
  const dueDate = api.ProjectOpenDate || api.StartDate || '';
  const submissionDate =
    api.LastDateOfSubmission && api.LastDateOfSubmission !== '0001-01-01T00:00:00'
      ? api.LastDateOfSubmission.split('T')[0]
      : '';

  return {
    id: String(api.ProjectInfoID),
    name: api.ProjectName,
    title: api.ProjectName,
    category,
    status,
    progress: getProgress(status),
    startDate: api.StartDate,
    dueDate,
    submissionDate,
    targetEndDate: dueDate,
    team: [],
    extraTeam: 0,
    priority,
    starred: false,
    description: api.Description,
    icon: getIconForCategory(category),
    iconBg: getIconBgForCategory(category),
    client: api.ProjectHeadEmpName,
    manager: api.ProjectHeadEmpName,
    managerAvatar: api.ProjectHeadEmpPhoto,
    progressColor: statusProgressColor[status] || 'bg-gray-300',
    budget: `Rs. ${api.TotalBudget.toLocaleString()}`,
    daysLeft: computeDaysLeft(dueDate),
    tasksCompleted: 0,
    totalTasks: 0,
  };
}

function getDaysLeft(dueDate: string): string {
  const due = new Date(dueDate);
  const now = new Date('2026-07-28');
  const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return 'Overdue';
  if (diff === 0) return 'Today';
  if (diff <= 30) return `${diff} days`;
  return `${Math.floor(diff / 30)} months`;
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

export const projects: Project[] = [
  {
    id: 'proj-001',
    name: 'Data Centre Migration',
    title: 'Data Centre Migration',
    category: 'Infrastructure',
    status: 'In Progress',
    progress: 65,
    startDate: 'May 10, 2025',
    dueDate: 'Jun 20, 2025',
    submissionDate: 'Jun 15, 2025',
    targetEndDate: 'Jun 20, 2025',
    team: [
      { id: 'tm-001', name: 'Anisha Gurung', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AG&backgroundColor=b6e3f4' },
      { id: 'tm-002', name: 'Prabin Thapa', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=PT&backgroundColor=ffd5dc' },
      { id: 'tm-003', name: 'Sagar Tamang', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ST&backgroundColor=c0aede' },
    ],
    extraTeam: 2,
    priority: 'High',
    starred: true,
    description: 'Migrate infrastructure to new data center facility',
    icon: Server,
    iconBg: 'bg-purple-100 text-purple-600',
    client: 'TechNova Inc.',
    manager: 'Kathmandu Shikshalaya',
    managerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
    progressColor: statusProgressColor['In Progress'],
    budget: '$48,000',
    daysLeft: getDaysLeft('Jun 20, 2025'),
    tasksCompleted: 26,
    totalTasks: 40,
  },
  {
    id: 'proj-002',
    name: 'Mobile App Development',
    title: 'Mobile App Development',
    category: 'Development',
    status: 'In Progress',
    progress: 40,
    startDate: 'May 5, 2025',
    dueDate: 'Jul 15, 2025',
    submissionDate: 'May 10, 2025',
    targetEndDate: 'Aug 15, 2025',
    team: [
      { id: 'tm-004', name: 'Rajan Shrestha', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=RS&backgroundColor=d1d4f9' },
      { id: 'tm-005', name: 'Nisha Karki', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NK&backgroundColor=b6e3f4' },
      { id: 'tm-006', name: 'Binod Rai', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=BR&backgroundColor=ffd5dc' },
    ],
    extraTeam: 3,
    priority: 'High',
    starred: false,
    description: 'Build cross-platform mobile application for clients',
    icon: Smartphone,
    iconBg: 'bg-emerald-100 text-emerald-600',
    client: 'ByteFlow Solutions',
    manager: 'Anisha Gurung',
    managerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    progressColor: statusProgressColor['In Progress'],
    budget: '$32,500',
    daysLeft: getDaysLeft('Jul 15, 2025'),
    tasksCompleted: 24,
    totalTasks: 60,
  },
  {
    id: 'proj-003',
    name: 'Website Redesign',
    title: 'Website Redesign',
    category: 'Design',
    status: 'Completed',
    progress: 100,
    startDate: 'Apr 15, 2025',
    dueDate: 'May 15, 2025',
    submissionDate: 'May 10, 2025',
    targetEndDate: 'May 15, 2025',
    team: [
      { id: 'tm-007', name: 'Sunita Lama', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SL&backgroundColor=c0aede' },
      { id: 'tm-008', name: 'Dipesh Magar', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DM&backgroundColor=b6e3f4' },
    ],
    extraTeam: 0,
    priority: 'Medium',
    starred: true,
    description: 'Redesign company website with new branding',
    icon: Globe,
    iconBg: 'bg-blue-100 text-blue-600',
    client: 'Digital Horizon',
    manager: 'Prabin Thapa',
    managerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    progressColor: statusProgressColor['Completed'],
    budget: '$18,000',
    daysLeft: 'Completed',
    tasksCompleted: 36,
    totalTasks: 36,
  },
  {
    id: 'proj-004',
    name: 'Marketing Campaign',
    title: 'Marketing Campaign',
    category: 'Marketing',
    status: 'On Hold',
    progress: 20,
    startDate: 'May 20, 2025',
    dueDate: 'Jun 30, 2025',
    submissionDate: 'Jun 15, 2025',
    targetEndDate: 'Jun 30, 2025',
    team: [
      { id: 'tm-009', name: 'Kabita Poudel', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=KP&backgroundColor=ffd5dc' },
      { id: 'tm-010', name: 'Arun Basnet', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AB&backgroundColor=d1d4f9' },
    ],
    extraTeam: 1,
    priority: 'Low',
    starred: false,
    description: 'Q2 digital marketing campaign for brand',
    icon: Megaphone,
    iconBg: 'bg-amber-100 text-amber-600',
    client: 'Brandify Co.',
    manager: 'Sagar Tamang',
    managerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
    progressColor: statusProgressColor['On Hold'],
    budget: '$12,000',
    daysLeft: getDaysLeft('Jun 30, 2025'),
    tasksCompleted: 5,
    totalTasks: 25,
  },
  {
    id: 'proj-005',
    name: 'Security Audit',
    title: 'Security Audit',
    category: 'Security',
    status: 'Not Started',
    progress: 0,
    startDate: 'Jun 1, 2025',
    dueDate: 'Jun 25, 2025',
    submissionDate: 'Jun 20, 2025',
    targetEndDate: 'Jun 25, 2025',
    team: [
      { id: 'tm-011', name: 'Rajan Shrestha', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=RS2&backgroundColor=c0aede' },
      { id: 'tm-012', name: 'Smita Joshi', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SJ&backgroundColor=b6e3f4' },
    ],
    extraTeam: 0,
    priority: 'Medium',
    starred: false,
    description: 'Comprehensive security audit and vulnerability assessment',
    icon: ShieldCheck,
    iconBg: 'bg-purple-100 text-purple-600',
    client: 'SecureIT Ltd.',
    manager: 'Kathmandu Shikshalaya',
    managerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
    progressColor: statusProgressColor['Not Started'],
    budget: '$9,500',
    daysLeft: getDaysLeft('Jun 25, 2025'),
    tasksCompleted: 0,
    totalTasks: 18,
  },
  {
    id: 'proj-006',
    name: 'ERP System Integration',
    title: 'ERP System Integration',
    category: 'Development',
    status: 'In Progress',
    progress: 55,
    startDate: 'Apr 1, 2025',
    dueDate: 'Jul 30, 2025',
    submissionDate: 'Jul 20, 2025',
    targetEndDate: 'Jul 30, 2025',
    team: [
      { id: 'tm-013', name: 'Bikash Adhikari', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=BA&backgroundColor=ffd5dc' },
      { id: 'tm-014', name: 'Priya Maharjan', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=PM&backgroundColor=d1d4f9' },
    ],
    extraTeam: 2,
    priority: 'Urgent',
    starred: false,
    description: 'Integrate ERP system with existing business workflows',
    icon: Smartphone,
    iconBg: 'bg-rose-100 text-rose-600',
    client: 'ShopEase',
    manager: 'Anisha Gurung',
    managerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    progressColor: statusProgressColor['In Progress'],
    budget: '$55,000',
    daysLeft: getDaysLeft('Jul 30, 2025'),
    tasksCompleted: 33,
    totalTasks: 60,
  },
  {
    id: 'proj-007',
    name: 'Network Infrastructure Upgrade',
    title: 'Network Infrastructure Upgrade',
    category: 'Infrastructure',
    status: 'Overdue',
    progress: 30,
    startDate: 'Mar 15, 2025',
    dueDate: 'Jun 1, 2025',
    submissionDate: 'May 25, 2025',
    targetEndDate: 'Jun 1, 2025',
    team: [
      { id: 'tm-015', name: 'Sanjay Bhattarai', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SB&backgroundColor=b6e3f4' },
    ],
    extraTeam: 0,
    priority: 'Urgent',
    starred: false,
    description: 'Upgrade network infrastructure across all office locations',
    icon: Server,
    iconBg: 'bg-purple-100 text-purple-600',
    client: 'TechNova Inc.',
    manager: 'Prabin Thapa',
    managerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    progressColor: statusProgressColor['Overdue'],
    budget: '$22,000',
    daysLeft: 'Overdue',
    tasksCompleted: 9,
    totalTasks: 30,
  },
  {
    id: 'proj-008',
    name: 'Customer Portal v2',
    title: 'Customer Portal v2',
    category: 'Development',
    status: 'In Progress',
    progress: 72,
    startDate: 'May 1, 2025',
    dueDate: 'Aug 15, 2025',
    submissionDate: 'Aug 1, 2025',
    targetEndDate: 'Aug 15, 2025',
    team: [
      { id: 'tm-016', name: 'Anisha Gurung', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AG2&backgroundColor=c0aede' },
      { id: 'tm-017', name: 'Nisha Karki', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NK2&backgroundColor=ffd5dc' },
      { id: 'tm-018', name: 'Dipesh Magar', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DM2&backgroundColor=b6e3f4' },
    ],
    extraTeam: 1,
    priority: 'High',
    starred: false,
    description: 'Redesign customer portal with modern UI and new features',
    icon: Smartphone,
    iconBg: 'bg-blue-100 text-blue-600',
    client: 'Digital Horizon',
    manager: 'Sagar Tamang',
    managerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
    progressColor: statusProgressColor['In Progress'],
    budget: '$41,000',
    daysLeft: getDaysLeft('Aug 15, 2025'),
    tasksCompleted: 43,
    totalTasks: 60,
  },
  {
    id: 'proj-009',
    name: 'Annual Report Design',
    title: 'Annual Report Design',
    category: 'Design',
    status: 'Completed',
    progress: 100,
    startDate: 'Apr 20, 2025',
    dueDate: 'Jun 10, 2025',
    submissionDate: 'Jun 5, 2025',
    targetEndDate: 'Jun 10, 2025',
    team: [
      { id: 'tm-019', name: 'Sunita Lama', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SL2&backgroundColor=d1d4f9' },
    ],
    extraTeam: 0,
    priority: 'Medium',
    starred: false,
    description: 'Design and publish the annual financial report',
    icon: Globe,
    iconBg: 'bg-emerald-100 text-emerald-600',
    client: 'Brandify Co.',
    manager: 'Kathmandu Shikshalaya',
    managerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
    progressColor: statusProgressColor['Completed'],
    budget: '$8,500',
    daysLeft: 'Completed',
    tasksCompleted: 18,
    totalTasks: 18,
  },
  {
    id: 'proj-010',
    name: 'HR Management System',
    title: 'HR Management System',
    category: 'Development',
    status: 'Not Started',
    progress: 0,
    startDate: 'Jul 1, 2025',
    dueDate: 'Sep 30, 2025',
    submissionDate: 'Sep 20, 2025',
    targetEndDate: 'Sep 30, 2025',
    team: [
      { id: 'tm-020', name: 'Prabin Thapa', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=PT2&backgroundColor=b6e3f4' },
      { id: 'tm-021', name: 'Kabita Poudel', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=KP2&backgroundColor=ffd5dc' },
    ],
    extraTeam: 0,
    priority: 'Low',
    starred: false,
    description: 'Build a comprehensive HR management and employee tracking system',
    icon: Smartphone,
    iconBg: 'bg-gray-100 text-gray-500',
    client: 'SecureIT Ltd.',
    manager: 'Rajan Shrestha',
    managerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    progressColor: statusProgressColor['Not Started'],
    budget: '$35,000',
    daysLeft: getDaysLeft('Sep 30, 2025'),
    tasksCompleted: 0,
    totalTasks: 45,
  },
];
