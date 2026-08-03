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

interface ApiUser {
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

interface ApiUserResponse {
  draw: number;
  recordsTotal: number;
  recordsFiltered: number;
  data: ApiUser[];
}

const API_BASE = (import.meta.env.VITE_BASE_API_URL || '').replace(/\/$/, '');
export const API_URL = `${API_BASE}/Users/ServerSearch`;
export const USER_GROUP_API_URL = `${API_BASE}/UserGroup/SelectList`;
export const SAVE_USER_URL = `${API_BASE}/SaveUserPublic`;
export const DELETE_USER_URL = `${API_BASE}/DeleteUser`;

export interface UserGroup {
  UserGroupId: number;
  UserGroupName: string;
  UserGroupCode: string;
  IsActive: boolean;
  AllowWebLogin: boolean;
}

export async function fetchUserGroups(): Promise<UserGroup[]> {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(USER_GROUP_API_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) throw new Error(`Failed to fetch user groups: ${res.statusText}`);
    const json = await res.json();
    const rows = Array.isArray(json) ? (json as UserGroup[]) : [];
    return rows;
  } catch {
    return [];
  }
}

interface FetchUsersParams {
  search: string;
  start: number;
  length: number;
  theme?: string;
  role?: string;
}

interface FetchUsersResult {
  users: User[];
  total: number;
  filtered: number;
}

function buildSearchBody(params: FetchUsersParams) {
  return {
    model: {
      draw: 1,
      start: params.start,
      length: params.length,
      search: { value: params.search, regex: '' },
    },
param: {
      UserId: 0,
      UserName: '',
      FullName: '',
      Password: '',
      UserGroupId: 0,
      UserGroupName: params.role || '',
      Theme: params.theme || '',
    },
  };
}

export async function fetchUsers(
  params: FetchUsersParams
): Promise<FetchUsersResult> {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(buildSearchBody(params)),
    });
    if (!res.ok) throw new Error(`Failed to fetch users: ${res.statusText}`);
    const json = await res.json();
    const response = json as ApiUserResponse;
    const rows = Array.isArray(response?.data) ? (response.data as ApiUser[]) : [];
    const mapped = rows.map(mapApiUserToUser);
    return {
      users: mapped,
      total: response.recordsTotal ?? 0,
      filtered: response.recordsFiltered ?? 0,
    };
  } catch {
    return { users: [], total: 0, filtered: 0 };
  }
}

function mapApiUserToUser(apiUser: ApiUser): User {
  return {
    id: String(apiUser.UserId),
    name: apiUser.FullName || '',
    email: apiUser.UserName,
    role: (apiUser.UserGroupName || 'Employee') as UserRole,
    title: '',
    department: '',
    avatar: '',
    status: 'Active',
    lastActive: '',
    projectsCount: 0,
    userGroupId: apiUser.UserGroupId,
    organizationId: apiUser.OrganizationID || 0,
    theme: apiUser.Theme || 'Facebook',
  };
}

export const STATUS_STYLE: Record<UserStatus, string> = {
  Active: 'bg-emerald-50 text-emerald-600 border-emerald-200/60',
  Inactive: 'bg-slate-50 text-slate-600 border-slate-200/60',
  Suspended: 'bg-rose-50 text-rose-600 border-rose-200/60',
};

export interface OrganizationSelect {
  OrganizationID: number;
  Title: string;
}

export const ORGANIZATION_API_URL = `${API_BASE}/Organization/SelectList`;

export async function fetchOrganizations(): Promise<OrganizationSelect[]> {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(ORGANIZATION_API_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) throw new Error(`Failed to fetch organizations: ${res.statusText}`);
    const json = await res.json();
    const rows = Array.isArray(json) ? (json as OrganizationSelect[]) : [];
    return rows;
  } catch {
    return [];
  }
}

export interface SaveUserPayload {
  UserId: number;
  UserName: string;
  FullName: string;
  Password: string;
  CPassword: string;
  OrganizationID: number;
  Theme: string;
  UserGroupCode: string;
  UserGroupId: number;
}

export interface SaveUserResult {
  success: boolean;
  message: string;
  data?: unknown;
}

export async function saveUser(payload: SaveUserPayload): Promise<SaveUserResult> {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(SAVE_USER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (json.Success === false) {
      const msg = json.Message || '';
      return { success: false, message: msg ? `Save failed: ${msg}` : 'Save failed. Check the payload or user group permissions.', data: json.Data };
    }
    if (!res.ok) throw new Error(`Failed to save user: ${res.statusText}`);
    return { success: true, message: 'User saved successfully', data: json.Data };
  } catch (err) {
    if (err instanceof Error) {
      return { success: false, message: err.message };
    }
    return { success: false, message: 'An unknown error occurred' };
  }
}

export async function deleteUser(userId: number): Promise<SaveUserResult> {
  try {
    const token = localStorage.getItem('token');
    const url = `${DELETE_USER_URL}?userid=${userId}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    const json = await res.json();
    if (json.Success === false) {
      const msg = json.Message || '';
      return { success: false, message: msg ? `Delete failed: ${msg}` : 'Delete failed. The user may have dependent records.', data: json.Data };
    }
    if (!res.ok) throw new Error(`Failed to delete user: ${res.statusText}`);
    return { success: true, message: 'User deleted successfully', data: json.Data };
  } catch (err) {
    if (err instanceof Error) {
      return { success: false, message: err.message };
    }
    return { success: false, message: 'An unknown error occurred' };
  }
}

export const ROLE_STYLE: Record<UserRole, string> = {
  Admin: 'bg-violet-50 text-violet-600 border-violet-200/60',
  Manager: 'bg-sky-50 text-sky-600 border-sky-200/60',
  Developer: 'bg-blue-50 text-blue-600 border-blue-200/60',
  Designer: 'bg-amber-50 text-amber-600 border-amber-200/60',
  Member: 'bg-slate-50 text-slate-600 border-slate-200/60',
  Employee: 'bg-emerald-50 text-emerald-600 border-emerald-200/60',
  'Task Mgmt': 'bg-cyan-50 text-cyan-600 border-cyan-200/60',
  'Super Admin': 'bg-red-50 text-red-600 border-red-200/60',
  'Report Analysis': 'bg-teal-50 text-teal-600 border-teal-200/60',
  'DC Admin': 'bg-orange-50 text-orange-600 border-orange-200/60',
};