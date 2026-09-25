import { apiCall, cachedQuery } from '@/services/apiservice';
import type { User, UserGroup, OrganizationSelect, UserRole, UserStatus } from '@/types/users-types';

const API_BASE = (import.meta.env.VITE_BASE_API_URL || '').replace(/\/$/, '');
export const API_URL = `${API_BASE}/Users/ServerSearch`;
export const USER_GROUP_API_URL = `${API_BASE}/UserGroup/SelectList`;
export const ORGANIZATION_API_URL = `${API_BASE}/Organization/SelectList`;

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

interface FetchUsersParams {
  search: string;
  start: number;
  length: number;
  theme?: string;
  role?: string;
  signal?: AbortSignal;
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
    return await cachedQuery(
      ['users', 'search', params.search, params.start, params.length, params.theme, params.role],
      (signal) => doFetchUsers(params, signal),
      params.signal
    );
  } catch {
    return { users: [], total: 0, filtered: 0 };
  }
}

async function doFetchUsers(
  params: FetchUsersParams,
  signal?: AbortSignal
): Promise<FetchUsersResult> {
  const res = await apiCall(API_URL, {
    method: 'POST',
    body: JSON.stringify(buildSearchBody(params)),
    signal,
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

export async function fetchUserGroups(): Promise<UserGroup[]> {
  try {
    const res = await apiCall(USER_GROUP_API_URL);
    if (!res.ok) throw new Error(`Failed to fetch user groups: ${res.statusText}`);
    const json = await res.json();
    const rows = Array.isArray(json) ? (json as UserGroup[]) : [];
    return rows;
  } catch {
    return [];
  }
}

export async function fetchOrganizations(): Promise<OrganizationSelect[]> {
  try {
    const res = await apiCall(ORGANIZATION_API_URL);
    if (!res.ok) throw new Error(`Failed to fetch organizations: ${res.statusText}`);
    const json = await res.json();
    const rows = Array.isArray(json) ? (json as OrganizationSelect[]) : [];
    return rows;
  } catch {
    return [];
  }
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

