//Projects export
export type ProjectStatus = 'In Progress' | 'Completed' | 'On Hold' | 'Not Started' | 'Overdue' | 'Started' | 'In Progress Final';
export type ProjectPriority = 'Urgent' | 'High' | 'Medium' | 'Low';

import type { TaskItem, SubTaskItem } from '@/features/tasks/types/tasks-types';

export interface ProjectFormData {
  id?: string;
  title: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  category: string;
  description: string;
  startDate: string;
  submissionDate: string;
  targetEndDate: string;
  client: string;
  projectManager: string;
  progress: number;
  daysLeft: string;
  tasksCompleted: number;
  totalTasks: number;
  budget: string;
  teamMembers: string;
}

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
  startDateBs: string;
  dueDateBs: string;
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
  taskStatusCounts?: Record<string, number>;
  ProjectInfoID: number;
  ProjectName: string;
  ProjectCode?: string;
  WorkStatusName?: string;
  WorkStatusColor?: string;
  Priority?: number;
  PriorityName?: string;
  ProjectType?: number;
  ProjectTypeName?: string;
  TotalBudget?: number;
  EndDate?: string;
}

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
  WorkStatusCode: string | null;
  PublicAgentID: number;
  ExpenseCode: string | null;
  BudgetInfoName: string | null;
  DepartmentName: string | null;
  Tippani: string;
  Samghauta: string;
  Kalyades: string;
  Status: number;
  CanEdit: boolean;
  CanDelete: boolean;
  CanChangeStatus: boolean;
  ClientName?: string | null;
  ClientInfoName?: string | null;
  ClientInfo?: {
    ClientInfoID: number;
    ClientName: string;
    ClientCode: string;
    ContactPerson: string;
    ContactNo: string;
    Email: string;
    Address: string;
    ClientStatus: number;
    Logo: string;
  };
}

export interface ProjectFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingProject?: ApiProject | null;
}

//Discussion page export
export interface DiscussionCreateProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  project: {
    ProjectInfoID: number;
    ProjectName?: string;
  };
  editingDiscussion?: {
    ProjectDiscussionID: number;
    DiscussionTitle: string;
    Priority: number;
    CreatedDate: string;
  } | null;
  modal?: boolean;
}

export interface DiscussionTabProps {
  project: ApiProject;
}

export interface DiscussionSearchProps {
  open: boolean;
  onClose: () => void;
  onSearch: (values: Record<string, unknown>) => void;
  onClear?: () => void;
  project: {
    ProjectInfoID: number;
    ProjectName?: string;
  };
  modal?: boolean;
}

//Issue page export
export interface IssueCreateProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  project: {
    ProjectInfoID: number;
    ProjectName?: string;
  };
  editingIssue?: {
    IssuesID: number;
    IssuesTitle: string;
    Comments: string;
    WorkStatusID: number;
    LabelInfoID: number;
    Attachments: string;
    CreatedDate: string;
    RaisedBy: string;
  } | null;
  modal?: boolean;
}

export interface IssueItem {
  IssuesID: number;
  IssuesTitle: string;
  LabelInfoID: number;
  Comments: string;
  Attachments: string;
  ProjectInfoID: number;
  WorkStatusID: number;
  ProjectInfoName: string;
  WorkStatusName: string;
  LabelInfoName: string;
  LabelColor: string;
  CreatedDate: string;
  RaisedBy: string;
  WorkStatusColor: string;
  CanChangeStatus: boolean;
  HasUserRightToEdit: boolean;
  HasUserRightToDelete: boolean;
}

export interface IssueTabProps {
  project: ApiProject;
}

export interface IssueSearchProps {
  open: boolean;
  onClose: () => void;
  onSearch: (values: Record<string, unknown>) => void;
  onClear?: () => void;
  project: {
    ProjectInfoID: number;
    ProjectName?: string;
  };
  modal?: boolean;
}

export interface WorkStatus {
  WorkStatusInfoID: number;
  StatusName: string;
  StatusCode: string;
  Color?: string;
  IconName?: string;
}

export interface Task {
  TaskInfoID: number;
  TaskName: string;
  Description: string;
  WorkStatusID: number;
  Priority: string | number;
  DueDate: string;
  ProjectInfoID: number;
  ProjectName?: string;
  AssignedTo?: string;
  Progress?: number;
}

export interface TasksByStatus {
  [key: number]: Task[];
}

//Milestone page export
export interface MilestoneCreateProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  project: {
    ProjectInfoID: number;
    ProjectName?: string;
  };
  editingMilestone?: {
    ProjectMilestoneID: number;
    MilestoneTitle: string;
    WorkStatusID: number;
    MilestoneCost: number;
    StartDate: string;
    EndDate: string;
    Summary: string;
  } | null;
  modal?: boolean;
}

export interface MilestoneTabProps {
  project: ApiProject;
  onEdit?: (milestone: MilestoneItem) => void;
}

export interface MilestoneSearchProps {
  open: boolean;
  onClose: () => void;
  onSearch: (values: Record<string, unknown>) => void;
  project: {
    ProjectInfoID: number;
    ProjectName?: string;
  };
  modal?: boolean;
}

//subtask page exports
export interface SubTaskCreateProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  project: {
    ProjectInfoID: number;
    ProjectName?: string;
  };
  selectedTask: TaskItem;
  editingSubTask?: SubTaskItem | null;
  modal?: boolean;
}

export interface SubtaskDrawerProps {
  open: boolean;
  onClose: () => void;
  project: ApiProject;
  task: TaskItem | null;
}

//Timeline page exports
export interface TimelineTabProps {
  project?: ApiProject | null;
  projectId?: number | null;
}

//Discussion Page
export interface ProjectDiscussionItem {
  SN: number;
  ProjectDiscussionID: number;
  DiscussionTitle: string;
  ProjectInfoID: number;
  Priority: number;
  PriorityName: string;
  Status: number;
  HasUserRightToEdit: boolean;
  HasUserRightToDelete: boolean;
  CreatedDate: string;
}

//Issue Page
// export interface IssueItem {
//   IssuesID: number;
//   IssuesTitle: string;
//   LabelInfoID: number;
//   Comments: string;
//   Attachments: string;
//   ProjectInfoID: number;
//   WorkStatusID: number;
//   ProjectInfoName: string;
//   WorkStatusName: string;
//   LabelInfoName: string;
//   LabelColor: string;
//   CreatedDate: string;
//   RaisedBy: string;
//   WorkStatusColor: string;
//   CanChangeStatus: boolean;
//   HasUserRightToEdit: boolean;
//   HasUserRightToDelete: boolean;
// }

//milestone page
export interface MilestoneItem {
  ProjectMilestoneID: number;
  ProjectInfoID: number;
  MilestoneTitle: string;
  WorkStatusID: number;
  WorkStatusName: string;
  MilestoneCost: number;
  StartDate: string;
  EndDate: string;
  Summary: string;
  Progress: number;
}

//projects service page
export interface SelectListItem {
  id: number | string;
  name: string;
}

export interface ExcelImportCaches {
  status: SelectListItem[];
  client: SelectListItem[];
  projectType: SelectListItem[];
  department: SelectListItem[];
  expenseInfo: SelectListItem[];
  ward: SelectListItem[];
  policyProgram: SelectListItem[];
  budget: SelectListItem[];
  employee: SelectListItem[];
}

export interface ServerSearchResponse {
  data?: unknown[];
  recordsTotal?: number;
  recordsFiltered?: number;
}

export interface FetchResult<T> {
  items: T[];
  total: number;
  filtered: number;
}

//Timeline service
export interface TimelineItem {
  ProjectInfoID: number;
  Remarks: string;
  TraceKey: number;
  TraceID: number;
  TraceKeyName: string;
  CreatedDate: string;
  CreatedTime: string;
  CreateDateTime: string;
}