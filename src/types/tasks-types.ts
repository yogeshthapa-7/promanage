
export interface TaskManagerInfo {
  EmployeeInfoID: number;
  Fullname: string;
  Address: string;
  Phone: string;
  Email: string;
  Gender: number;
  DOB: string | null;
  DepartmentID: number;
  MainBranchID: number;
  BranchID: number;
  Photo: string;
  EmpStatus: number;
  Username: string | null;
  Password: string | null;
  OrganizationOfficeID: number;
  DepartmentName: string;
  BranchName: string;
  MainBranchName: string | null;
  OrganizationOfficeName: string | null;
  TraceKey: string | null;
}

export interface TaskItem {
  TaskInfoID: number;
  TaskTitle: string;
  TaskCode: string;
  TaskManagerID: number;
  InvolvedEmployees: string;
  Weightage: number;
  OrderKey: number;
  Priority: number;
  WorkStatusID: number;
  Description: string;
  Attachments: string;
  ProjectInfoID: number;
  ProjectInfoName: string;
  DueDate: string;
  TaskManagerName: string;
  WorkStatusIconName: string;
  TaskManagerPhoto: string | null;
  WorkStatusName: string;
  WorkStatusColor: string;
  DueInfo: string;
  PriorityName: string;
  InvolvedEmployeesDetail: unknown | null;
  CanEdit: boolean;
  CanDelete: boolean;
  CanChangeStatus: boolean;
  TaskManagerInfo?: TaskManagerInfo;
}

export interface SubTaskItem {
  SubTaskInfoID: number;
  SubTaskTitle: string;
  SubTaskCode: string;
  SubTaskManagerID: number;
  InvolvedEmployees: string;
  Weightage: number;
  OrderKey: number;
  Priority: number;
  WorkStatusID: number;
  TaskInfoID: number;
  ProjectInfoID: number;
  TaskInfoName: string | null;
  SubTaskManagerName: string | null;
  SubTaskManagerPhoto: string | null;
  WorkStatusColor: string;
  WorkStatusName: string;
  PriorityName: string;
  WorkStatusIconName: string;
  SubTaskManagerInfo?: TaskManagerInfo;
}

export interface TaskStats {
  total: number;
  [status: string]: number;
}

export interface ProjectTaskCounts {
  total: number;
  completed: number;
  byStatus: Record<string, number>;
}
