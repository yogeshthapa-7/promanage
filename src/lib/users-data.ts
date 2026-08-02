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
}

interface ApiUser {
  UserId: number;
  UserName: string;
  FullName: string;
  UserGroupId: number;
  UserGroupName: string;
  Theme: string;
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
      UserGroupName: '',
      Theme: '',
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
    name: '',
    email: apiUser.UserName,
    role: (apiUser.UserGroupName || 'Employee') as UserRole,
    title: apiUser.Theme || '',
    department: '',
    avatar: '',
    status: 'Active',
    lastActive: '',
    projectsCount: 0,
  };
}

export const STATUS_STYLE: Record<UserStatus, string> = {
  Active: 'bg-emerald-50 text-emerald-600 border-emerald-200/60',
  Inactive: 'bg-slate-50 text-slate-600 border-slate-200/60',
  Suspended: 'bg-rose-50 text-rose-600 border-rose-200/60',
};

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