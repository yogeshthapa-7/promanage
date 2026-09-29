export type UserRole = 'Admin' | 'Manager' | 'Developer' | 'Designer' | 'Member' | 'Employee' | 'Task Mgmt' | 'Super Admin' | 'Report Analysis' | 'DC Admin';
export type UserStatus = 'Active' | 'Inactive' | 'Suspended';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  title: string;
  department: string;
  avatar: string;
  status: UserStatus;
  lastActive: string;
  projectsCount: number;
  userGroupId: number;
  organizationId: number;
  theme: string;
}

export interface UserGroup {
  UserGroupId: number;
  UserGroupName: string;
  UserGroupCode: string;
  IsActive: boolean;
  AllowWebLogin: boolean;
}

export interface OrganizationSelect {
  OrganizationID: number;
  Title: string;
}

export interface UserFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingUser?: User | null;
}

export interface ApiUser {
  UserId: number;
  UserName: string;
  FullName: string;
  UserGroupId: number;
  UserGroupCode: string;
  UserGroupName: string;
  Theme: string;
  OrganizationID: number;
  [key: string]: unknown;
}

export interface ApiUserResponse {
  draw: number;
  recordsTotal: number;
  recordsFiltered: number;
  data: ApiUser[];
}

export interface FetchUsersParams {
  search: string;
  start: number;
  length: number;
  theme?: string;
  role?: string;
  signal?: AbortSignal;
}

export interface FetchUsersResult {
  users: User[];
  total: number;
  filtered: number;
}






