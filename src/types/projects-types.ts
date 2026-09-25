export type ProjectStatus = 'In Progress' | 'Completed' | 'On Hold' | 'Not Started' | 'Overdue' | 'Started' | 'In Progress Final';
export type ProjectPriority = 'Urgent' | 'High' | 'Medium' | 'Low';

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
