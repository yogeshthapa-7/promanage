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
